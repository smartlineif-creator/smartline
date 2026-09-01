# Spec: Статус оплати замовлення (Order.isPaid)
> Ручний прапорець оплати, **окремий від логістичного статусу** — власник бачить, хто заплатив, а хто ні (борги), навіть коли замовлення вже доставлене. Стек: NestJS + Prisma / Next.js 16.

## Context
`Order.status` несе лише **логістику** (NEW → CONFIRMED → SHIPPED → DELIVERED → CANCELLED), а факт оплати ніде не трекається. `DELIVERED` мовчки припускає «оплачено», хоча реально замовлення буває доставлене й **не** оплачене:
- **bank_transfer** — клієнт отримав, переказ не зробив (борг);
- **накладений (cod)** — клієнт забрав на пошті, гроші йдуть магазину ще кілька днів («доставлено, гроші в дорозі»);
- готівка/самовивіз — заплатив на місці (справді оплачено).

Логістика й фінанси злиті в одному полі, і власник не бачить боргів / кого гейтити перед відправкою (для передоплати на рахунок). Крок 0 (`OptionalJwtAuthGuard`, `order.userId`) уже зроблено.

## Зафіксовані рішення (узгоджено)
- **`Order.isPaid Boolean @default(false)`**, НЕ enum. Часткові оплати/повернення (`PARTIAL`/`REFUNDED`) — окремо пізніше, лише якщо з'являться передоплати/розстрочки.
- **Ручний toggle адміном** — автоматики нема; менеджер знає, коли гроші прийшли.
- Оплата — **окремий вимір** від `Order.status`, НЕ синхронізувати (та сама логіка, що погашення послуг у [client-services](client-services.md)). `DELIVERED + isPaid=false` — валідний стан «доставлено, але борг».
- **Окремий endpoint**, не мішати з `updateStatus`.
- **Клієнт НЕ бачить** (адмін-only) — для `cod` «не оплачено» заплутало б (оплата ж при отриманні); це внутрішній фіноблік.

---

## Крок 1 — Prisma-схема (`backend/prisma/schema.prisma`)
- `model Order` (~286): додати
```prisma
isPaid Boolean @default(false)
```
- Міграція `add_order_paid`. **НЕ `migrate dev`** (non-interactive падає) — через diff:
  `npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script` → у файл `migration.sql` → `npx prisma migrate deploy` → `npm run prisma:generate`.
- **Backfill (важливо):** наявні `DELIVERED` замовлення історично оплачені — щоб не показати сотні фальшивих «боргів», дописати в SQL: `UPDATE "Order" SET "isPaid" = true WHERE "status" = 'DELIVERED';`. Решта лишаються `false`.
- Прод: адитивна міграція застосується сама через backend `Dockerfile` (`migrate deploy`).

## Крок 2 — Backend: endpoint (`backend/src/orders/`)
- `dto/order.dto.ts`: `+ export class SetOrderPaidDto { @IsBoolean() isPaid: boolean; }` (`@IsBoolean` з class-validator — додати до імпорту).
- `orders.controller.ts`: `+ @Patch(':id/paid')` під `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)`; body `SetOrderPaidDto` → `ordersService.setPaid(id, dto.isPaid)`. Поряд із `@Patch(':id/status')` (`:74`) — не конфліктує (`paid` ≠ `status`).
- `orders.service.ts`: `+ async setPaid(id: string, isPaid: boolean)` → `this.prisma.order.update({ where:{ id }, data:{ isPaid } })` → return. Просте оновлення одного поля, без транзакції; **не** чіпає `status`/stock/нотифікації.

## Крок 3 — Admin: бейдж у списку + фільтр «неоплачені» (`frontend/app/admin/orders/page.tsx`)
- **Бейдж** «Оплачено / Не оплачено» — окрема колонка (або поряд зі `StatusBadge`): «Не оплачено» акцентовано (amber/warning), «Оплачено» тихо (emerald). Рендер через `PAYMENT_BADGE` (нове в utils, ring-стиль як `ORDER_STATUS_COLORS`).
- **Фільтр** «Тільки неоплачені» — окрема кнопка-перемикач (стан `unpaidOnly`), поряд з `MultiSelect` статусів (це інший вимір — не в тому ж селекті). Активна → `adminGetAllOrders({ ..., unpaid: 'true' })`; додати до `load()` deps.
- `SortableTh` для колонки оплати — опційно (за бажанням сортувати).

## Крок 4 — Backend: фільтр у `findAll` (`orders.controller.ts` + `orders.service.ts`)
- `orders.controller.ts findAll`: `+ @Query('unpaid') unpaid?: string` → передати у сервіс.
- `orders.service.ts findAll` (~20): коли `unpaid==='true'` → `where.isPaid = false`. Комбінується з наявними `q`/`status` через ту саму `where` (обережно з `where.AND` для пошуку — додати як окреме поле `where.isPaid`, не в OR).

## Крок 5 — Admin: перемикач у деталі (`frontend/app/admin/orders/[orderId]/page.tsx`)
- Перемикач `isPaid` біля блоку статусу (свій рядок «Оплата»): toggle/switch «Оплачено» ↔ «Не оплачено».
- **Non-optimistic** (консистентно зі зміною статусу на цій же сторінці): `await adminSetOrderPaid(id, next)` → `setOrder(o => ({...o, isPaid: next}))` → `toast.success`; на `catch` → `toast.error`, стан не міняти.
- `pending`-стан на час запиту (disabled).

## Крок 6 — Спільне (`frontend/lib`, `types`)
- `types/index.ts`: `Order` → `+ isPaid: boolean`.
- `lib/api.ts`: `+ adminSetOrderPaid(id: string, isPaid: boolean)` → `PATCH /orders/${id}/paid` (дзеркало `adminUpdateOrderStatus`). Розширити `adminGetAllOrders` params типом, щоб приймав `unpaid`.
- `lib/utils.ts`: `+ PAYMENT_BADGE = { paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200', unpaid: 'bg-amber-50 text-amber-700 ring-amber-200' }` + `PAYMENT_LABELS = { paid:'Оплачено', unpaid:'Не оплачено' }` (admin ring-стиль; клієнту не потрібно, тож `--sl-` тон НЕ робимо).

## Ключові файли
- `backend/prisma/schema.prisma` — `Order.isPaid` + міграція (з backfill DELIVERED→true).
- `backend/src/orders/orders.controller.ts` — endpoint `:id/paid` + `unpaid` query.
- `backend/src/orders/orders.service.ts` — `setPaid` + `findAll` фільтр.
- `backend/src/orders/dto/order.dto.ts` — `SetOrderPaidDto`.
- `frontend/app/admin/orders/page.tsx` — бейдж + фільтр.
- `frontend/app/admin/orders/[orderId]/page.tsx` — перемикач.
- `frontend/lib/{api,utils}.ts`, `frontend/types/index.ts`.

## Edge cases
- **Наявні замовлення:** backfill `DELIVERED → isPaid=true`; решта `false` (власник проставить вручну).
- **isPaid ⟂ status:** зміна/скасування статусу (`updateStatus`) НЕ чіпає `isPaid`, і навпаки. `CANCELLED + isPaid=true` — можливо (оплачене скасоване → потрібне повернення, але refund поза скоупом; поле просто лишається як є).
- **Фільтр:** `unpaid=true` комбінується з пошуком/статусами через `where.isPaid=false` (окреме поле, не ламати наявний `where.AND`/`OR` пошуку).
- Клієнт: `account/orders` НЕ показує `isPaid` (адмін-only).
- `proxy.ts` matcher уже покриває `/admin/*` — не чіпати.

## Out of scope (свідомо)
Enum статусів оплати (`PARTIAL`/`REFUNDED`/розстрочка); авто-проставлення через Monobank-webhook (коли підключать online — тоді online авто-`PAID`, ручний лишиться для cod/bank_transfer); синхронізація з `Order.status`; клієнтський показ оплати; повернення коштів (refund flow).

## Verification
Бекенд `:4000`, фронт `:3005`. Логін throttle 5/хв — переюзати токени. Демо-admin `demo-admin@example.com`/`demo1234` у БД.
1. Міграція + `prisma:generate`; перевірити backfill (наявні `DELIVERED` → `isPaid=true`).
2. `PATCH /orders/:id/paid {isPaid:true}` (admin) → `order.isPaid=true`; `{isPaid:false}` → назад; не-`boolean` body → 400; non-admin → 403; без токена → 401.
3. `GET /orders?unpaid=true` (admin) → лише `isPaid=false`; комбінація з `status`/`q` працює.
4. **Admin браузер:** список — бейджі «Оплачено/Не оплачено» + перемикач «Тільки неоплачені» фільтрує; деталь — toggle оплати (toast, non-optimistic), `isPaid` не зникає після зміни статусу поруч.
5. Клієнт: `account/orders` не показує оплату.
6. Білди обох воркспейсів + `npm test --workspace=backend`.
