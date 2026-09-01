# Spec: Послуги клієнтів (видимість + погашення)
> Клієнт бачить куплені послуги в «Мої послуги»; власник у «Послугах клієнтів» (перейм. «Заявки») **погашає** надані послуги з **лічильником**, щоб не надати ту саму послугу двічі. Погашення живе полями на `OrderItem` — **без окремої сутності** і **без джоб-циклу**.

## Context
Придбана послуга існує лише як рядок `OrderItem` з `serviceId` (послуги замовляються через кошик → `Order`, як товари). Наслідки:
- **Клієнт** не бачить «свої послуги» окремо — тільки закопаними в замовленнях.
- **Власник** не має як відстежити, чи послугу вже надано. Реальний ризик: клієнт купив «Заміну термопасти», прийшов, отримав, а через місяць прийшов знову з тим самим записом у кабінеті — і власник (він же персонал) не пам'ятає, чи вже надавав. Тобто послуга фактично працює як **ваучер без погашення**.

**Джерело правди — адмінка власника, НЕ екран клієнта** (скріншот/стара сторінка не є доказом). Персонал знаходить послугу у своїй системі й гасить там.

**Уже зроблено (передумова виконана):** `POST /orders` стоїть під `OptionalJwtAuthGuard` (`orders.controller.ts:67`), тож `order.userId` проставляється для залогінених — «Мої послуги» для них запрацюють. Гостьові замовлення (`userId=null`) видно лише у власника, як і зараз.

## Рішення (зафіксовані в обговоренні)
- **Заявка = замовлення.** Одна «заявка» — це `Order`; усередині може бути кілька послуг, кожна гаситься окремо.
- **Погашення = лічильник, не прапорець.** Позиція має `quantity`; гасимо по одиниці (`× 2` → «використано 1 з 2»). Прапорець brехав би при `quantity > 1`.
- **Поля на `OrderItem`, не окрема сутність.** Джоб-цикл (Очікує/В роботі/Виконано) свідомо **не робимо** — власнику потрібне лише «надано / скільки / коли».
- **Погашення незалежне від `Order.status` і від оплати.** Не синхронізувати; не закривати замовлення автоматично, коли все видано.
- **Оплата — поза скоупом** (беклог: коли підключать Monobank → `Order.isPaid` авто з webhook).

---

## Крок 1 — Prisma-схема (`backend/prisma/schema.prisma`)
Модель `OrderItem` (~305): додати
```prisma
redeemedCount  Int       @default(0)   // скільки з quantity вже видано
lastRedeemedAt DateTime?                // коли гасили востаннє
```
- Товарних позицій не стосується (лишаються `0`/`null`); поля живуть на спільній `OrderItem`, бо гасяться саме позиції.
- Міграція: `add_service_redemption`. **Прод: Dockerfile робить `prisma migrate deploy`** при старті — міграція адитивна (дефолти), backfill не потрібен.

## Крок 2 — Backend: ендпоінт погашення (`backend/src/orders/`)
- `PATCH /orders/items/:itemId/redeem` — `JwtAuthGuard + RolesGuard + @Roles('ADMIN')`. Body `{ delta: 1 | -1 }` (`class-validator`: `@IsIn([1,-1])`).
- Логіка в `OrdersService`: транзакція — `findUnique(orderItem)`; guard'и:
  - позиція має `serviceId` (тільки послуги гасяться) інакше `BadRequestException`;
  - `next = redeemedCount + delta`; якщо `next < 0 || next > quantity` → `BadRequestException` («уже 0» / «уже все видано»);
  - `update({ redeemedCount: next, lastRedeemedAt: delta === 1 ? new Date() : lastRedeemedAt })` (при `-1` дату не чіпаємо — це undo помилки).
- Повертає оновлену позицію.
- **Конкурентність (зафіксовано):** `findUnique` + `update` у `$transaction`, **не CAS**. Порівняння `redeemedCount` з власним `quantity` не виражається в Prisma `where` без raw SQL, а потік single-owner (найгірше — перегашення на 1, відкатне через `delta:-1`), тож CAS свідомо не застосовуємо. Треба строго — `$executeRaw` з умовою `redeemed_count < quantity` (і `> 0` для undo).
- **Читання не додаємо:** список і деталь переюзають наявні `GET /orders` (admin, `hasService`) та `GET /orders/:id`.

## Крок 3 — Admin: перейменування «Заявки» → «Послуги клієнтів»
- `frontend/app/admin/layout.tsx` NAV (`:21`): label `'Заявки'` → `'Послуги клієнтів'` (route `/admin/requests` **лишаємо** — не ламаємо посилання; icon можна лишити `ClipboardList` або `Wrench`).
- `frontend/app/admin/requests/page.tsx`: заголовок «Заявки на послуги» → «Послуги клієнтів»; підзаголовок лишити (`N замовлень із послугами`).

## Крок 4 — Admin: стан погашення у списку + окрема деталь
- **Список** (`admin/requests/page.tsx`): у колонці «Послуги» біля кожної сервісної позиції — **бейдж стану** з `redeemedCount`/`quantity`: `Доступна` / `X з N` / `Використано`. **Ціну самої послуги** тут не плутати із `Сума` рядка (то сума всього замовлення — при мішаних вводить в оману). Рядок веде на **нову** деталь (нижче), не на `/admin/orders/[id]`.
- **Нова сторінка** `frontend/app/admin/requests/[id]/page.tsx` (світла адмін-тема; `useParams<{ id: string }>()`; клон-джерело структури — `admin/orders/[orderId]/page.tsx`, де сегмент саме `[orderId]`; але **сервіс-фокус**): шапка (клієнт, телефон, № замовлення, дата, статус замовлення — read-only); список **тільки сервісних** позицій, кожна: назва, тариф (`variantName`), ціна послуги, `quantity`, бейдж стану, і контроли **[Погасити одну]** (поки `redeemedCount < quantity`) / **[Скасувати]** (`delta:-1`, поки `> 0`) + `lastRedeemedAt`. Товарні позиції — згорнутим блоком «У замовленні також N товарів» (контекст, без дій). Крос-лінк «Відкрити повне замовлення» → `/admin/orders/[id]`.
- Оптимістичне оновлення + `toast`. Готового optimistic-прикладу в коді **немає** (сусідній `[orderId]` робить `await`+`setState`+`toast`, non-optimistic) — писати з нуля; орієнтир на `admin/service-requests` НЕ використовувати (директорії не існує).

## Крок 5 — Client: «Мої послуги» (`frontend/app/(store)/account/`)
- **Нова** `account/services/page.tsx` (темна `--sl-*` тема): fetch `getOrders({ mine:'true', hasService:'true', limit:'100' })` — **додати `hasService`** (бекенд комбінує через AND з `userId`, тож тягне лише сервісні замовлення, а не всі підряд) → `flatMap(order.items.filter(serviceId))`, зберігаючи `order` для дати/№. Рядок: `Wrench`/`coverImage`, `serviceName` + `tierLabel`, `quantity шт × ціна`, **бейдж стану** (`Доступна` / `X з N` / `Використано`), дата. Read-only — **клієнт сам не гасить**. Клонувати з `account/orders/page.tsx` лише тему/рядок — **без** stat-тайлів «Замовлень/Сума» (вони рахують усі замовлення) і **без** серверної пагінації: сторінка = плоский список сервіс-позицій.
- **Правка** `account/page.tsx` `NAV_ITEMS` (`:28`): `+ { href:'/account/services', icon: Wrench, label:'Мої послуги', desc:'Куплені послуги та їх стан' }` + імпорт `Wrench`.
- Без нового бекенд-ендпоінта — переюзає `getOrders`.

## Крок 6 — Спільний фронт (`frontend/lib`, `types`)
- `types/index.ts`: `OrderItem` (+`redeemedCount: number`, `lastRedeemedAt?: string`). Хелпер-тип стану `ServiceRedemptionState = 'available' | 'partial' | 'done'`.
- `lib/utils.ts`: `getServiceRedemptionState(item)` (`redeemedCount===0 → available`; `<quantity → partial`; інакше `done`) → повертає лише **стан + лейбл** (спільне для обох поверхонь). **Кольори — окремо**, бо поверхні різні: admin через Tailwind ring-класи (як `ORDER_STATUS_COLORS`, light-тема), клієнт через інлайн `--sl-`/rgba (як `getStatusTone` у `account/orders/page.tsx`). Один спільний кольоровий мап НЕ робити — зламає light-тему адмінки.
- `lib/api.ts`: `adminRedeemServiceItem(itemId, delta)` → `PATCH /orders/items/:itemId/redeem`.

## Ключові файли
- `backend/prisma/schema.prisma` — 2 поля на `OrderItem` + міграція.
- `backend/src/orders/orders.controller.ts` + `orders.service.ts` — ендпоінт `redeem`.
- `frontend/app/admin/layout.tsx` — перейм. пункту меню.
- `frontend/app/admin/requests/page.tsx` — заголовок + бейджі + лінк на нову деталь.
- `frontend/app/admin/requests/[id]/page.tsx` — **нова** сервісна деталь із погашенням.
- `frontend/app/(store)/account/services/page.tsx` — **нова** «Мої послуги».
- `frontend/app/(store)/account/page.tsx` — пункт меню.
- `frontend/lib/{api,utils}.ts`, `frontend/types/index.ts`.

## Edge cases
- `quantity > 1`, використано частину → лічильник «X з N»; кнопка гасне на `X==N`, undo не нижче 0.
- Товарна позиція випадково передана в `redeem` → `BadRequestException` (немає `serviceId`).
- Гостьові послуги (`userId=null`) → видно тільки у власника (у «Мої послуги» не потрапляють — там `mine`), гасяться так само.
- Скасування замовлення (`Order.status=CANCELLED`) **не** чіпає `redeemedCount` — надане лишається надано (окремий вимір).
- Змішане замовлення: у деталі товари згорнуті, дій над ними немає.
- `proxy.ts` matcher уже покриває `/admin/*` і `/account/*` — правити не треба.

## Out of scope (свідомо)
Джоб-цикл (етапи ремонту); оплата / `isPaid` (→ беклог до Monobank); окрема сутність `ServiceRequest` (стара `service-requests.md`); повний лог погашень («хто/коли кожну одиницю» — поки достатньо лічильника + `lastRedeemedAt`); гостьові «Мої послуги»; авто-закриття замовлення при повному погашенні.

## Verification
Бекенд `:4000`, фронт `:3005`. Логін throttle 5/хв — переюзати токени.
1. Міграція + `prisma:generate`.
2. Створити мішане замовлення з послугою `quantity=2` (напр. «Заміна термопасти × 2»).
3. `PATCH /orders/items/:itemId/redeem {delta:1}` (admin) → `redeemedCount=1`, `lastRedeemedAt` виставлено; ще раз → `2`; ще раз → **400** («уже все видано»). `{delta:-1}` → `1`. Товарна позиція → **400**. Non-admin → **403**.
4. **Admin браузер:** «Послуги клієнтів» → бейджі стану в списку; клік → сервісна деталь `/admin/requests/[id]`; «Погасити одну» → бейдж «1 з 2» (optimistic + toast); «Скасувати» → назад.
5. **Client браузер:** залогінений покупець → `/account` бачить «Мої послуги» → `/account/services` з бейджами стану; сам гасити не може.
6. Скасувати замовлення → `redeemedCount` не змінився.
7. Білди обох воркспейсів + лінт + `npm test --workspace=backend`.
