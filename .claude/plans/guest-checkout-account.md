# Plan: Гостьовий чекаут → акаунт (email-верифікація + клейм)
> Generated from: `.claude/specs/guest-checkout-account.md`
> Стек: smartline (NestJS + Prisma / Next.js 16). Формат адаптовано з `/plan` (Tellis) під цей моно-репо: без `src/features/`, без i18n/QUERY_KEYS/shadcn — укр. текст хардкодиться, стилі через `--sl-*` токени.

## Reference implementation
Password-reset flow — структурний близнюк того, що будуємо (одноразовий email-токен + сторінка з `?token=`). Прочитати перед стартом:
- `backend/src/auth/auth.service.ts:78` (`forgotPassword`/`resetPassword`) — патерн: створити токен → `deleteMany` старих → `create` → лист; на споживанні — `findUnique` + перевірка `expiresAt` + `delete`.
- `backend/src/mail/mail.service.ts:203` (`sendPasswordReset`) — форма листа з лінком-кнопкою.
- `frontend/app/(auth)/reset-password/page.tsx` — `'use client'` + `Suspense`, `useSearchParams().get('token')`, стани loading/error/done, стиль `--sl-*`.
- `backend/src/auth/auth.controller.ts:99` (forgot/reset) — public + `@Throttle`, `@HttpCode(200)`.

## Reuse map (НЕ створювати — вже існує)

| Потреба | Використати | Локація |
|---|---|---|
| Відправка листа | `send()` (private), `wrap()` | `mail.service.ts:21,70` |
| Шаблон verification-листа | copy-adapt `sendPasswordReset` | `mail.service.ts:203` |
| Модель токена | copy-adapt `PasswordResetToken` | `schema.prisma` |
| verify/resend/register логіка | copy-adapt `forgotPassword`+`resetPassword` | `auth.service.ts:78,99` |
| URL для листа | `getPrimaryFrontendUrl(config.get('FRONTEND_URL'))` | `common/frontend-url.ts` |
| Токен-рядок | `randomBytes(32).toString('hex')` | вже у `auth.service.ts:85` |
| TTL | `addHours(new Date(), 24)` | `date-fns`, вже імпортовано |
| Сторінка `/verify-email` | copy-adapt `reset-password/page.tsx` | `(auth)/reset-password` |
| `emailVerified` у `getMe` | нічого — `me` вертає весь `safe` user | `auth.controller.ts:117` |
| Гість-детект на клієнті | `hasStoredSession()` | `lib/api.ts:123` |
| Email-валідатор (front) | `isValidEmail` | `lib/validation.ts` |
| Стан юзера (банер) | `useAuthStore().user`, `.fetchUser()` | `store/auth.ts` |

## Files to CREATE

### `backend/prisma/schema.prisma` (MODIFY наявного файлу — ДВІ зміни)
**1. Поле в наявну модель `User`:**
```prisma
emailVerified Boolean @default(false)
```
**2. Нова модель** — точна копія `PasswordResetToken` (полів достатньо — клеїмо по `email`, юзер не потрібен):
```prisma
model EmailVerificationToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```
- Міграція — див. «Порядок реалізації» крок 1 (потрібен `--create-only` через backfill).

### `frontend/app/(auth)/verify-email/page.tsx` (~115 рядків)
- Copy-adapt `reset-password/page.tsx` каркас (`'use client'`, `Suspense`, `useSearchParams`), але **без форми** — на mount авто-викликати `verifyEmail(token)`.
- ⚠️ **Ran-once guard ОБОВ'ЯЗКОВИЙ:** токен одноразовий (видаляється в `verifyEmail`), а React Strict Mode у `next dev` монтує ефект двічі → другий виклик отримає `BadRequestException` і перемкне UI на `error` попри успіх (зламало б наскрізний тест, крок 3). Обгорнути тіло ефекту `useRef(false)`: `if (ranRef.current) return; ranRef.current = true;`. Референс `reset-password` цього НЕ має — він викликає API на submit, не на mount.
- Стани: `loading` («Підтверджуємо пошту…»), `done` (✅ + кнопка «До кабінету»), `error`.
- `error` + resend: якщо `hasStoredSession()` → кнопка «Надіслати новий лист» (`resendVerification`); якщо гість → лінк «Увійдіть, щоб надіслати новий лист» → `/login` (не глухий кут для кліку з іншого браузера).
- Після `done`, якщо `hasStoredSession()` → `useAuthStore().fetchUser()` (щоб банер у кабінеті зник).
- `export default function` — route page (дозволено).

### `frontend/components/store/GuestAccountCta.tsx` (~65 рядків, `'use client'`)
- Рендериться в `checkout/success` (Server Component). Показувати ТІЛЬКИ гостю.
- ⚠️ **Mounted-gate проти hydration mismatch:** `hasStoredSession()` на SSR завжди `false` (`window===undefined`, `lib/api.ts:124`), тож без гейта сервер малює CTA, а клієнт-залогінений ховає → розбіжність гідратації + миготіння. Патерн уже в цьому checkout (`page.tsx:377`): `const [mounted,setMounted]=useState(false); useEffect(()=>setMounted(true),[]);` → `if (!mounted || hasStoredSession()) return null`.
- CTA: «Створіть акаунт, щоб відстежувати замовлення» → кнопки `/register` та `/login`.
- Email prefill (опційно): читати `sessionStorage.getItem('sl_checkout_email')` і додати `?email=` лише на `/register` (той самий origin, не PII в URL магазину). Якщо складно — без prefill.
- Named export.

### `frontend/components/store/EmailVerifyBanner.tsx` (~60 рядків, `'use client'`)
- Читає `useAuthStore().user`; якщо `!user || user.emailVerified` → `return null`.
- Банер: «Підтвердіть пошту, щоб бачити всі свої замовлення» + кнопка «Надіслати лист ще раз» → `resendVerification()` + toast (`sonner` вже в проєкті).
- Named export.

⚠️ SIZE: усі нові файли < 150 рядків. Спліт не потрібен.

## Files to MODIFY

### `backend/src/orders/dto/order.dto.ts` (215 → 215)
- `CreateOrderDto.customerEmail`: прибрати `@IsOptional()` (лишити `@IsEmail()`), зробити поле `customerEmail: string` (не `?`). Ризик: none.

### `backend/src/mail/mail.service.ts` (294 → ~314)
- Додати `sendEmailVerification(email, token, frontendUrl)` — копія `sendPasswordReset` (`:203`), лінк `${frontendUrl}/verify-email?token=${token}`, заголовок «Підтвердіть пошту», текст про 24 год. Ризик: none.

### `backend/src/auth/auth.service.ts` (179 → ~215)
- **register** (`:34`): перед `return this.issueTokens(...)` — згенерувати токен, `emailVerificationToken.create({email, token, expiresAt: addHours(new Date(),24)})`, `this.mail.sendEmailVerification(email, token, getPrimaryFrontendUrl(this.config.get('FRONTEND_URL'))).catch(()=>{})`. Вхід НЕ блокуємо. (`config`, `mail`, `addHours`, `randomBytes`, `getPrimaryFrontendUrl` вже доступні.)
- **verifyEmail(token)** (new): `findUnique` токен → якщо нема/`expiresAt < now` → `BadRequestException`. Далі: `user = prisma.user.update({ where:{email:record.email}, data:{emailVerified:true} })` → **клейм** `prisma.order.updateMany({ where:{ customerEmail:{equals:record.email, mode:'insensitive'}, userId:null }, data:{userId:user.id} })` → `emailVerificationToken.delete({where:{token}})`.
- **resendVerification(userId)** (new): `findUnique` user; якщо нема/`emailVerified` → return; `deleteMany({email})` → новий токен → лист.
- Ризик: none — дзеркалить наявний reset-flow.

### `backend/src/auth/auth.controller.ts` (160 → ~178)
- `POST /auth/verify-email` — public, `@Throttle({default:{limit:10,ttl:60000}})`, `@HttpCode(200)`, body `VerifyEmailDto` → `authService.verifyEmail(dto.token)`.
- `POST /auth/resend-verification` — `@UseGuards(JwtAuthGuard)`, `@Throttle({default:{limit:3,ttl:60000}})`, `@HttpCode(200)`, `@CurrentUser() user` → `authService.resendVerification(user.id)`.

### `backend/src/auth/dto/auth.dto.ts` (77 → ~82)
- `+ class VerifyEmailDto { @IsString() token: string }`.

### `frontend/app/(store)/checkout/page.tsx` (1064 → ~1070)
- `validateContacts` (`:238`): email тепер обов'язковий — додати `if (!email.trim()) errors.email = 'Вкажіть email'` перед перевіркою формату. (Зараз формат перевіряється лише `if (email.trim())`.)
- Email `Field` (`:455`) — додати `required` (щоб показати `*`, як у name/phone).
- `handleSubmit` (`:344`) — перед redirect: `sessionStorage.setItem('sl_checkout_email', email.trim())` (для prefill CTA). Заодно спростити `customerEmail: email.trim() || undefined` (`:355`) → `email.trim()` — email тепер завжди валідний (gate `validateContacts`).
- ⚠️ Файл великий (1064) — але зміни точкові, **не рефакторимо** (правило проєкту: no refactor beyond task).

### `frontend/app/(store)/checkout/success/page.tsx` (88 → ~92)
- Відрендерити `<GuestAccountCta />` НАД наявними кнопками (server page + вкладений client-компонент — ок у Next 16).
- **Decision lock:** наявні кнопки «На головну» / «Мої замовлення» лишаються без змін. Для гостя «Мої замовлення» веде на `/login` через proxy — прийнятно; CTA додатковий, свідомо не ховаємо кнопки (success — Server Component, читати клієнтську сесію там дорого).

### `frontend/app/(store)/account/page.tsx` (❓ — ПРОЧИТАТИ перед правкою)
- Вставити `<EmailVerifyBanner />` зверху контенту. Прочитати файл, щоб не зламати layout/`'use client'` межу (банер сам client).

### `frontend/lib/api.ts` (767 → ~777)
- `+ verifyEmail(token: string)` → `POST /auth/verify-email` body `{token}`.
- `+ resendVerification()` → `POST /auth/resend-verification` (без body).

### `frontend/types/index.ts` (397 → 398)
- `User` interface: `+ emailVerified: boolean`.

### `frontend/app/(auth)/register/page.tsx` (217 → ~219) — опційно
- Email вже `required` з `*` — нічого не потрібно. За бажанням: після `register()` перед redirect показати toast «Ми надіслали лист — підтвердіть пошту». Мінімальна зміна; можна лишити редірект на `/account` (банер там повідомить).

## Files NOT to touch
- `backend/src/orders/orders.service.ts` — клейм робиться в `AuthService.verifyEmail`, НЕ тут. Коментар `:35` про «email unverified» лишається валідним (`findAll` так само не матчить по email — прив'язку робить лише verify).
- `backend/src/orders/guards/optional-jwt-auth.guard.ts`, `orders.controller.ts` — гостьовий чекаут лишається без змін.
- `sendOrderConfirmation` / `sendOrderStatusUpdate` — квитанція/статуси не чіпаємо.
- `(auth)/login/page.tsx` — не міняємо (CTA success лише посилається на `/login`).

## Порядок реалізації
1. `schema.prisma` (+field `emailVerified`, +model `EmailVerificationToken`) → `cd backend && npx prisma migrate dev --create-only --name add_email_verification` → **вручну** дописати `UPDATE "User" SET "emailVerified" = true;` у згенерований `migration.sql` → `npm run prisma:migrate` (застосувати) → `npm run prisma:generate`. **`--create-only` критичний:** без нього `migrate dev` застосує міграцію одразу, і backfill, дописаний після, ніколи не виконається (+ зміна checksum вже застосованої міграції дає Prisma-warning).
2. Backend: `mail` метод → `auth.service` (register+verify+resend) → `auth.controller` (+2) → `auth.dto` (+DTO) → `order.dto` (email required).
3. Frontend: `types` → `api.ts` (+2) → `verify-email` page → `GuestAccountCta` + success → `EmailVerifyBanner` + account → `checkout` (email required + sessionStorage).
4. Наскрізний тест (нижче).

## Acceptance criteria (для реалізації)
- [ ] `npm run build` (frontend) і `npm run build` (backend) проходять; `npm run lint` чисто.
- [ ] Немає `any` (крім наявних `order: any` у mail.service — новий метод типів не потребує); named exports (крім route pages).
- [ ] Нові компоненти < 150 рядків; `useRef<number | null>` якщо будуть таймери.
- [ ] Клейм: `updateMany` тільки `userId: null`, `customerEmail` порівняння `mode:'insensitive'`.
- [ ] register не блокує вхід при `emailVerified=false`; токени видаються як раніше.
- [ ] Міграція: наявні `User` → `emailVerified=true` (окремим `UPDATE` у SQL міграції).
- [ ] checkout не да@ оформити без email (валідація + `*`).
- [ ] `/verify-email?token=` валідний → `done` + історія в `/account/orders`; протухлий/битий → `error`.
- [ ] Банер у `/account` зникає після підтвердження (`fetchUser` після verify).

## Наскрізний тест (ручний)
1. Гість (інкогніто) з обов'язковим email купує 2 замовлення на `test@x.com`.
2. Реєструється на `test@x.com` → приходить verification-лист → `/account/orders` поки порожньо, банер видно.
3. Клік по лінку → `/verify-email` → done → обидва замовлення в кабінеті, банер зник.
4. Безпека: зловмисник реєструється на `test@x.com` без доступу до пошти → не отримує кліку → `emailVerified=false`, клейму немає.

## Flags
- ⚠️ **Міграція**: `--create-only` обов'язковий (див. Порядок крок 1) — `prisma:migrate` застосовує одразу, тож backfill `UPDATE "User" SET "emailVerified" = true;` треба вписати ДО застосування, інакше наявні акаунти лишаться `false` і бачитимуть банер.
- ⚠️ **`account/page.tsx` не прочитано** на етапі планування — прочитати перед вставкою банера (перевірити `'use client'` межу й де саме шапка контенту).
- ⚠️ **`FRONTEND_URL`** має вказувати на прод-домен (лінк у листі) — той самий, що вже працює для reset-password. На Render перевірити env (див. пам'ять про прод-ендпоінти).
- ℹ️ Email prefill на success — nice-to-have через `sessionStorage`; якщо ускладнює, робимо CTA без prefill.
