# Spec: Гостьовий чекаут → акаунт (email-верифікація + клейм замовлень)

> Стек: NestJS 11 (Fastify) + Prisma / Next.js 16 (App Router). Реалізація повністю на асистенті.
> Варіант **A** (узгоджено в обговоренні): email обов'язковий на checkout + email-верифікація, **без** guest-tracking токена.

## Проблема

Гість може купити без реєстрації (це вже працює — `POST /orders` під `OptionalJwtAuthGuard`), але після покупки **випадає з системи**:

1. Гостьові замовлення не прив'язуються до акаунта. Якщо гість пізніше зареєструється на ту саму пошту — його історія порожня.
2. Прив'язувати по email **не можна безпечно сьогодні**, бо реєстрація не підтверджує володіння поштою: `AuthService.register` одразу видає токени, `@IsEmail()` перевіряє лише формат рядка. Тобто будь-хто реєструється на чужу пошту → побачив би чужі замовлення (PII-витік). Саме тому клейм по email свідомо вимкнено (`orders.service.ts:35`).

## Рішення (варіант A)

Додати email-верифікацію (доказ володіння поштою) і клеїти гостьові замовлення до акаунта **тільки після підтвердження пошти**. Оскільки email на checkout стає обов'язковим, кожне замовлення має за що чіплятись — токен у браузері не потрібен.

**Потік гостя:** купив (email обов'язковий) → лист-квитанція (як зараз) → на success екрані CTA «Створити акаунт / Увійти» → реєстрація → лист-верифікація → клік → `emailVerified=true` + **усі** замовлення з цією поштою (включно з поточним) прив'язуються → історія на місці.

### Наслідок варіанту A (важливо)

Немає окремої «сесійної прив'язки» поточного замовлення — усе клеїться **одним шляхом** через клік у verification-листі. Поточне замовлення підтягується разом з рештою, бо його `customerEmail` = пошта акаунта. Ціна: історія з'являється не миттєво, а після кліку (крок, який робиться раз).

## Обсяг

### Backend
1. **Email обов'язковий на checkout**: `CreateOrderDto.customerEmail` — прибрати `@IsOptional()` (лишити `@IsEmail()`).
2. **Prisma**: `User.emailVerified Boolean @default(false)`; нова модель `EmailVerificationToken` (копія `PasswordResetToken`); data-міграція: наявним `User` → `emailVerified = true`.
3. **MailService**: `sendEmailVerification(email, token, frontendUrl)` — копія `sendPasswordReset`, лінк `/verify-email?token=`.
4. **AuthService.register**: після `create` → згенерувати токен + `sendEmailVerification`. Вхід НЕ блокуємо (`emailVerified=false`, токени видаються як зараз).
5. **AuthService.verifyEmail(token)**: валідувати токен + TTL (24 год) → `User.emailVerified=true` → **клейм** → видалити токен. Email береться з токена (ендпоінт public, юзер може бути не залогінений).
6. **AuthService.resendVerification(userId)**: перегенерувати токен + надіслати (для банера в акаунті).
7. **Клейм** (усередині verifyEmail): `order.updateMany` where `customerEmail` insensitive = `record.email` AND `userId = null` → set `userId`. Тільки `userId=null` (не перехоплювати чужі прив'язані).
8. **AuthController**: `POST /auth/verify-email` (public, throttle), `POST /auth/resend-verification` (`JwtAuthGuard`, throttle).
9. `me`/user payload — `emailVerified` включається автоматично (повертається весь `safe` user).

### Frontend
1. **checkout**: `validateContacts` — email обов'язковий (зараз перевіряється лише якщо введений); Email-поле з `*`.
2. **success**: для гостя (no session) — CTA-блок «Створити акаунт / Увійти» (client-компонент, читає `hasStoredSession`). Email prefill — опційно через `sessionStorage`, НЕ через URL (PII).
3. **Нова сторінка** `/verify-email?token=...` — авто-виклик `verifyEmail`, показ success/error (референс: `reset-password/page.tsx`).
4. **register**: після реєстрації — повідомити «підтвердіть пошту» (редірект на `/account`, банер там).
5. **/account**: банер, поки `!emailVerified` → «Підтвердіть пошту, щоб бачити всі замовлення» + кнопка resend.
6. `api.ts`: `verifyEmail(token)`, `resendVerification()`. `types.User` — `+emailVerified`.

## Дефолти (узгоджено)
- TTL verification-токена: **24 год**.
- Вхід до підтвердження **не блокуємо** — `emailVerified` потрібен лише для клейму й прибирання банера.
- Order confirmation лист — **не чіпаємо**, лишається як є.
- Лист-квитанцію гостю шлемо завжди (як зараз).

## Out of scope (свідомо НЕ робимо)
- Guest-tracking токен (`Order.accessToken`) + публічний `GET /orders/track/:token`.
- Клейм по телефону; phone-OTP.
- Блокування входу/чекауту до верифікації пошти.
- Верифікація для існуючих акаунтів (їх мігруємо в `emailVerified=true`).
