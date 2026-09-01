# Plan: Послуги клієнтів (видимість + погашення)
> Generated from: `.claude/specs/client-services.md`
> Стек: smartline (NestJS + Prisma / Next.js 16). Формат адаптовано з `/plan` (Tellis) під цей моно-репо: без `src/features/`, i18n, QUERY_KEYS, shadcn. Укр-текст хардкодиться; статуси/тони — через `lib/utils.ts`; admin — світла тема (ring-класи), store — темна (`--sl-*`). Розмір-ліміт 150 рядків НЕ застосовуємо — проєкт має 400+ рядкові admin-сторінки; тримаємо файли розумними, виносячи під-компоненти.

## Reference implementation
Дві наявні пари «список + деталь» — структурні шаблони:
- **Admin деталь** `frontend/app/admin/orders/[orderId]/page.tsx` (406) — `useParams`, `adminGetOrder`, non-optimistic `await`+`setState`+`toast`, рендер позицій. Нова `requests/[id]` бере каркас, але **сервіс-фокус** (тільки послуги + погашення).
- **Admin список** `frontend/app/admin/requests/page.tsx` (184) — `adminGetAllOrders({hasService})`, `useTableSort`, `SortableTh`, `StatusBadge` (ring-класи), колонка «Послуги» з `serviceItems.map`. Сюди — бейджі стану + зміна цілі кліку.
- **Client список** `frontend/app/(store)/account/orders/page.tsx` (218) — темна тема, `getStatusTone` (інлайн rgba/`--sl-`), рядок-`Link`. Нова `account/services` бере тему/рядок, але **без** stat-тайлів і пагінації.

Прочитати перед стартом: усі три + `lib/utils.ts:255-280` (статус-мапи) + `lib/api.ts:496-513` (admin-обгортки).

## Reuse map (НЕ створювати — вже існує)

| Потреба | Використати | Локація |
|---|---|---|
| HTTP-обгортка | `apiFetch` | `lib/api.ts:151` |
| Admin список замовлень (hasService) | `adminGetAllOrders` | `lib/api.ts:496` |
| Admin деталь замовлення | `adminGetOrder` | `lib/api.ts:507` |
| Клієнтські замовлення | `getOrders` (`mine`) | `lib/api.ts:283` |
| Патерн PATCH-обгортки | `adminUpdateOrderStatus` | `lib/api.ts:511` |
| Ціна | `formatPrice` | `lib/utils.ts:22` |
| Множина укр | `pluralUk` | `lib/utils.ts` |
| Admin badge-стиль | ring-класи як `ORDER_STATUS_COLORS` / `STATE_BADGE` | `lib/utils.ts:268,277` |
| Client badge-тон | інлайн-патерн `getStatusTone` | `account/orders/page.tsx:14` |
| Сортована таблиця | `useTableSort`, `SortableTh`, `compareText/Number/Date` | `lib/useTableSort`, `components/admin/SortableTh` |
| Admin RolesGuard-патерн | `@UseGuards(JwtAuthGuard,RolesGuard)`+`@Roles(Role.ADMIN)` | `orders.controller.ts:74` |
| `@IsIn` для delta | вже імпортовано | `orders/dto/order.dto.ts:15` |
| Меню-пункт клієнта | `NAV_ITEMS`-патерн | `account/page.tsx:29` |

## Files to CREATE

### `backend/prisma/migrations/<ts>_add_service_redemption/migration.sql`
- Генерувати через `migrate diff` (non-interactive, як робили для email-verification), НЕ `migrate dev`:
  `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`
- Очікуваний SQL: `ALTER TABLE "OrderItem" ADD COLUMN "redeemedCount" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "lastRedeemedAt" TIMESTAMP(3);`
- **Backfill НЕ потрібен** (дефолт 0 коректний для всіх наявних позицій). Застосувати `npx prisma migrate deploy` → `npm run prisma:generate`.

### `frontend/app/admin/requests/[id]/page.tsx` (~200 рядків) — сервісна деталь заявки
- Purpose: сервіс-фокусна деталь одного замовлення з погашенням кожної послуги.
- `'use client'`; `useParams<{ id: string }>()`; `adminGetOrder(id)` → `Order`.
- Reuse: `adminGetOrder`, `adminRedeemServiceItem` (нова, нижче), `formatPrice`, `getServiceRedemptionState` + admin-badge-мап (нові в utils), `toast`.
- Секції: шапка (клієнт, телефон-`<a>`, № , дата, `StatusBadge` замовлення — read-only); **список сервісних позицій** (`items.filter(serviceId)`), кожна → під-компонент `RedeemRow`; згорнутий блок «У замовленні також N товарів» (`items.filter(i=>!i.serviceId)`, без дій); крос-лінк «Відкрити повне замовлення» → `/admin/orders/${id}`.
- **Під-компонент `RedeemRow`** (у тому ж файлі, ~55 рядків): props `{ item, onChange }`; показує назву, `variantName` (тариф), ціну послуги, бейдж стану (`X з N` / Доступна / Використано); кнопки **[Погасити одну]** (disabled коли `redeemedCount>=quantity`) і **[Скасувати]** (disabled коли `redeemedCount<=0`); `lastRedeemedAt` дрібним. Клік → `adminRedeemServiceItem(item.id, ±1)` → **оптимістично** оновити локальний стан позиції + `toast`; на `catch` — відкат + `toast.error`.
- Named export для `RedeemRow`; `export default function` — route page (дозволено).

### `frontend/app/(store)/account/services/page.tsx` (~150 рядків) — «Мої послуги»
- Purpose: read-only список куплених послуг клієнта зі станом погашення.
- `'use client'`; `getOrders({ mine:'true', hasService:'true', limit:'100' })` → `flatMap(order.items.filter(serviceId).map(item => ({ item, order })))`.
- Reuse: `getOrders`, `formatPrice`, `pluralUk`, `getServiceRedemptionState` + client-tone (нові в utils), `Wrench`.
- Структура: клон **теми/шапки** `account/orders/page.tsx` (back-лінк, заголовок «Мої послуги», eyebrow) → **плоский список** рядків (без stat-тайлів `:88-111`, без пагінації `:190-214`). Рядок: `Wrench`/`service.coverImage`, `serviceName`+`variantName`, `quantity шт × formatPrice(price)`, **бейдж стану** (client-tone), № замовлення + дата. Read-only — жодних кнопок.
- Empty-state (клон `:114-139`, текст «Ви ще не замовляли послуг»).
- `export default function` — route page.

⚠️ SIZE: `requests/[id]` ~200 через винесений `RedeemRow`; якщо переростає ~230 — винести `RedeemRow` в `frontend/components/admin/RedeemRow.tsx`. `account/services` ~150 — ок.

## Files to MODIFY

### `backend/prisma/schema.prisma` (`model OrderItem`, ~305-321)
- Додати в кінець моделі (після `quantity`):
```prisma
redeemedCount  Int       @default(0)
lastRedeemedAt DateTime?
```
- Ризик: none (адитивно). Далі — міграція (див. CREATE) + `prisma:generate`.

### `backend/src/orders/dto/order.dto.ts` (216 → ~222)
- `+ export class RedeemServiceItemDto { @IsIn([1, -1]) delta: number; }` (`@IsIn`, `IsInt` уже імпортовані). Ризик: none.

### `backend/src/orders/orders.controller.ts` (80 → ~92)
- `+ @Patch('items/:itemId/redeem')` під `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)`; body `RedeemServiceItemDto` → `ordersService.redeemServiceItem(itemId, dto.delta)`. Імпортувати `RedeemServiceItemDto`.
- **Роут-порядок:** статичний сегмент `items` не конфліктує з `:id/status` (різна довжина шляху), але оголосити біля інших `@Patch` для читабельності. Ризик: none.

### `backend/src/orders/orders.service.ts` (470 → ~495)
- `+ async redeemServiceItem(itemId: string, delta: number)`:
  - `$transaction`: `tx.orderItem.findUnique({ where:{ id:itemId } })`; `!item` → `NotFoundException`; `!item.serviceId` → `BadRequestException('Погашати можна лише послуги')`;
  - `next = item.redeemedCount + delta`; `if (next < 0 || next > item.quantity)` → `BadRequestException` (0 → «уже не погашено» / N → «уже все видано»);
  - `tx.orderItem.update({ where:{ id:itemId }, data:{ redeemedCount: next, ...(delta === 1 ? { lastRedeemedAt: new Date() } : {}) } })` → return.
- **Конкурентність (зафіксовано у spec):** read-then-write у транзакції, НЕ CAS — порівняння `redeemedCount < quantity` не виражається в Prisma `where` без raw SQL; потік single-owner, найгірше (перегашення на 1) відкатне через `delta:-1`. Коментар-обґрунтування в код.
- Ризик: none — дзеркалить наявні транзакційні методи.

### `frontend/types/index.ts` (`interface OrderItem`, ~166-179)
- `+ redeemedCount: number;` `+ lastRedeemedAt?: string;`. Ризик: none.

### `frontend/lib/api.ts` (777 → ~782)
- `+ export async function adminRedeemServiceItem(itemId: string, delta: 1 | -1)` → `apiFetch<OrderItem>('/orders/items/'+itemId+'/redeem', { method:'PATCH', body: JSON.stringify({ delta }) })` (дзеркало `adminUpdateOrderStatus`). Ризик: none.

### `frontend/lib/utils.ts` (280 → ~305)
- `+ type ServiceRedemptionState = 'available' | 'partial' | 'done'`.
- `+ getServiceRedemptionState(item: { redeemedCount: number; quantity: number }): ServiceRedemptionState` (`0→available`; `<quantity→partial`; інакше `done`).
- `+ SERVICE_REDEMPTION_LABELS: Record<ServiceRedemptionState,(item)=>string>` або простий: `available→'Доступна'`, `partial→'X з N'` (функція від item), `done→'Використано'`.
- **Кольори роздільно (зафіксовано):** `+ SERVICE_REDEMPTION_COLORS` (admin ring-класи як `ORDER_STATUS_COLORS`: available `bg-gray-50 text-gray-600 ring-gray-200`, partial `bg-amber-50 text-amber-700 ring-amber-200`, done `bg-emerald-50 text-emerald-700 ring-emerald-200`). Client-tone (`--sl-`/rgba) — інлайн у `account/services/page.tsx` за патерном `getStatusTone`, НЕ спільний мап. Ризик: none.

### `frontend/app/admin/layout.tsx` (`NAV`, ~21)
- Label `'Заявки'` → `'Послуги клієнтів'` (route `/admin/requests` лишаємо; icon `ClipboardList` лишаємо). Ризик: none.

### `frontend/app/admin/requests/page.tsx` (184 → ~200)
- Заголовок «Заявки на послуги» → «Послуги клієнтів»; підзаголовок лишити.
- Колонка «Послуги» (`serviceItems.map`, ~146): біля кожної позиції додати **бейдж стану** (`getServiceRedemptionState` + `SERVICE_REDEMPTION_COLORS`, ring-стиль як `StatusBadge`). Ціну позиції тут не показувати (щоб не плутати з `Сума` = все замовлення).
- `router.push('/admin/orders/${order.id}')` (~136) і «Відкрити»-лінк (~161) → **`/admin/requests/${order.id}`** (нова сервісна деталь).
- Ризик: none — точкові правки.

### `frontend/app/(store)/account/page.tsx` (`NAV_ITEMS`, ~29-33)
- `+ { href:'/account/services', icon: Wrench, label:'Мої послуги', desc:'Куплені послуги та їх стан' }` після «Мої замовлення». Імпортувати `Wrench` (поряд з `Package`, `:11`). Ризик: none.

## Files NOT to touch
- `backend/src/orders/orders.service.ts` `create()`/`updateStatus()` — погашення НЕ синхронізується зі статусом замовлення (spec-рішення); нові поля лишаються на дефолті при створенні/скасуванні.
- `frontend/app/admin/orders/[orderId]/page.tsx` — загальна деталь замовлення лишається для товарів; сервісне погашення живе на новій `requests/[id]`.
- `frontend/app/(store)/account/orders/page.tsx` — клон-джерело, НЕ редагувати (тільки читати патерн).
- `frontend/app/admin/services/**` — це каталог послуг (CRUD), не куплені; поза скоупом.
- `OptionalJwtAuthGuard` / `orders.controller` `create` — Крок 0 уже зроблено, не чіпати.

## Acceptance criteria (для реалізації)
- [ ] `npm run build` (frontend) і `npm run build` (backend) проходять; `npm run lint` не гірше baseline (проєкт має наявні lint-помилки — не додавати НОВИХ у наших файлах; backend `lint` = `--fix`, тож не запускати наосліп — перевіряти `git diff` після).
- [ ] Немає `any` у новому коді; named exports (крім route pages); early returns.
- [ ] Timer-ref (якщо буде) як `useRef<number | null>`.
- [ ] `redeemServiceItem`: guard на `serviceId`, межі `0..quantity`, `lastRedeemedAt` тільки при `delta:1`.
- [ ] `getServiceRedemptionState` — чистий стан+лейбл; кольори роздільні (admin ring / client `--sl-`).
- [ ] `account/services` — `hasService:'true'`, БЕЗ stat-тайлів і пагінації.
- [ ] admin-список: рядок веде на `/admin/requests/[id]`, не на `/admin/orders/[id]`.
- [ ] Погашення НЕ змінює `Order.status` і навпаки.
- [ ] Міграція через `migrate diff`+`migrate deploy` (не `migrate dev` — non-interactive).

## Flags
- ⚠️ **Роут `/admin/requests/[id]`**: додаємо динамічний сегмент у теку, де зараз лише `page.tsx`. Наявний список використовує `/admin/orders/[orderId]` — тобто в проєкті співіснують `[id]` і `[orderId]`. Свідомо беремо `[id]` для нової теки (простіше), crosslink на стару → `/admin/orders/${id}` (сегмент `[orderId]` приймає значення позиційно). Не блокер, але тримати в голові розбіжність неймінгу.
- ⚠️ **`redeem` конкурентність**: read-then-write (не CAS) — прийнятно для single-owner, відкатно через `delta:-1`. Якщо потік стане multi-user — переходити на `$executeRaw` з `WHERE redeemed_count < quantity`.
- ⚠️ **Backend lint `--fix`**: у минулій фічі автофікс переписав чужі файли й зламав один build (`sameSite` assertion). Після будь-якого `npm run lint` у backend — `git diff` і відкат чужих змін; наші build-и ганяти окремо.
- ℹ️ **Demo-дані** (`demo-admin@example.com`, замовлення №77–80) у локальній БД — зручні для ручного verification цієї фічі.
