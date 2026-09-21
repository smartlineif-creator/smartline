# Spec: Каталог — фільтри, SEO і краш-стійкість
> Вісім фіксів каталогу, знайдених адверсальним ревю пагінаційного фікса: непрацюючий price-фільтр для варіантних товарів, краш рендера на битому `options`, брехливий тип `searchParams`, відсутній canonical, 400 що вбиває сайдбар, глухий кут на out-of-range сторінці, пагінація без windowing, і невірний шлях до Next-docs в інструкціях.

## Context

Щойно полагодили втрату фільтрів при пагінації на `/catalog/[categorySlug]`: посилання будувалось з нуля (`?page=${p}&sort=${sortBy}`) і губило `minPrice`/`maxPrice`/`options`. Заміна — `pageHref(p)`, що копіює весь `searchParams` і перезаписує лише `page`.

Три адверсальні ревю підтвердили, що фікс працює (encoding round-trip чистий на hard load і soft nav, `params.set('page')` надійний, семантика кешування не змінилась, XSS немає), але виявили набір суміжних проблем. **Усі знахідки нижче перевірені особисто на живих dev-серверах** (`:3005` / `:4000`) — це не гіпотези.

Ключовий нюанс, який знімає паніку щодо SEO: краул-вибуху фасетів **не буде** — усі контроли фільтрів це `<button onClick>` + `router.push`, а не `<a href>`; `SortBar` на цій сторінці рендериться без `baseHref`; `sitemap.ts` віддає лише чисті URL. Googlebot не може перебрати фасети сам. Ризик лінійний: фасетний URL, що потрапив у краул ззовні, тепер лінкує `totalPages−1` дублів з ідентичним `<title>`.

## Read first

- `backend/src/products/products.service.ts` — `findAll` (≈:141). Критично: `where.OR` зайнятий пошуком `q` (≈:182), а `where.AND` **присвоюється** атрибутними фільтрами (≈:266) вже **після** price-блоку (≈:193). Наївне `where.AND = [...]` у price-блоці буде затерте. Блок сортування за ціною (≈:282-300) — референс, як проєкт уже рахує effective price для варіантних товарів.
- `backend/src/products/products.service.ts` — `buildPriceRange` (≈:367) робить `delete boundsWhere.basePrice`, щоб підказка «Від/До» не самообмежувалась. Після переносу price-клаузи в `AND` цей `delete` перестане працювати — див. Крок A1.
- `frontend/app/(store)/catalog/[categorySlug]/page.tsx` — головний файл, тут 6 з 8 фіксів.
- `frontend/app/(store)/product/[slug]/page.tsx` (≈:40) — наявний патерн canonical: `...(canonicalUrl ? { alternates: { canonical: canonicalUrl } } : {})`.
- `frontend/components/store/CatalogFilters.tsx` (≈:50-61) — правильний патерн побудови URL (`new URLSearchParams(searchParams.toString())` + `delete('page')`). Не чіпати, лише дзеркалити.
- `frontend/lib/utils.ts` — URL/query-хелперів там **немає** (перевірено повний список експортів); `firstParam` і `buildPageHref` будуть новими.
- `backend/src/products/dto/product.dto.ts` (≈:267-292) — `@Transform(Number)` + `@IsNumber()`, тому `Number('abc') = NaN` → 400; `@Min(1)` на `page`.

## Зафіксовані рішення (узгоджено)

- **Price-фільтр — чисто Prisma**, без JS-проходу: клауза `OR: [{ basePrice: range }, { variants: { some: { isActive, price: { gt: 0, ...range } } } }]`, додана **в масив** `where.AND`. `count` і `skip` лишаються в SQL. Семантика: варіантний товар підходить, якщо **хоч один** активний варіант потрапляє в діапазон.
- **`utm_*`/`gclid`/`fbclid` продовжуємо тягнути** в href пагінації — атрибуція важливіша, а canonical їх нейтралізує. Вирізати tracking-параметри НЕ треба.
- **Фільтровані URL — `noindex, follow`** + canonical на чистий `/catalog/<slug>`. Чиста пагінація (`?page=N` без фільтрів) лишається індексованою з canonical на себе.
- **Out-of-range сторінка** — рендерити пагінацію завжди, коли `totalPages > 1`, навіть при порожній видачі, і дати вихід на сторінку 1 **зі збереженням фільтрів**.
- **Windowing — окремий компонент** `components/store/Pagination.tsx` + `buildPageHref` у `lib/utils.ts`, переведені всі три сторінки з пагінацією. Інакше зараз розходяться п'ять різних реалізацій.
- Реалізація **по чергах A → B → C**: можна зупинитись після будь-якої, кожна черга самодостатня і білдиться.

---

# Черга A — 🔴 блокери

## Крок A1 — Price-фільтр має бачити варіантні товари (`backend/src/products/products.service.ts`)

**Проблема.** Price-фільтр працює лише по `Product.basePrice`, а у варіантних товарів воно `null` (ціна живе на `Variant.price`). Prisma відкидає `NULL` при `gte`/`lte`, тож такі товари зникають для будь-якого діапазону. Коментар на ≈:278-281 документує цю саму асиметрію для **сортування** — там її вже полагодили, для **фільтрування** ні.

Перевірено:
```
GET /api/products?categorySlug=smartfony                            → total 2, обидва basePrice=null,
                                                                      priceRange {min:33999, max:79999}
GET /api/products?categorySlug=smartfony&minPrice=40000&maxPrice=70000 → total 0
```
Тобто на `/catalog/smartfony` фільтр ціни віддає **нуль для будь-якого вводу**, а плейсхолдери рекламують 33999…79999. У локальній БД 10 із 56 товарів мають `basePrice=null` — і це саме флагмани.

**Реалізація.**

1. Приватний хелпер — єдине джерело правди для price-клаузи:
```ts
private priceClause(
  minPrice?: number,
  maxPrice?: number,
): Prisma.ProductWhereInput | null {
  if (minPrice === undefined && maxPrice === undefined) return null;
  const range = {
    ...(minPrice !== undefined ? { gte: minPrice } : {}),
    ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
  };
  return {
    OR: [
      { basePrice: range },
      { variants: { some: { isActive: true, price: { gt: 0, ...range } } } },
    ],
  };
}
```

2. У `findAll` завести **один масив AND-клауз** і збирати в нього, замість двох присвоєнь:
```ts
const andClauses: Prisma.ProductWhereInput[] = [];
// …замість where.basePrice = {…}
const price = this.priceClause(minPrice, maxPrice);
// …замість where.AND = attributeOptionEntries.map(…)
if (attributeOptionEntries.length > 0) {
  andClauses.push(...attributeOptionEntries.map(([name, values]) => ({
    attributes: { some: { name, value: { in: values } } },
  })));
}
```
   **Обов'язково:** атрибутний блок (≈:265-269) зараз робить `where.AND = …`, тобто затирає все попереднє. Обидва місця мають класти у `andClauses`.

3. Розділити «where без ціни» і «where з ціною»:
```ts
const whereWithoutPrice: Prisma.ProductWhereInput =
  andClauses.length > 0 ? { ...where, AND: [...andClauses] } : where;
const whereFinal: Prisma.ProductWhereInput = price
  ? { ...where, AND: [...andClauses, price] }
  : whereWithoutPrice;
```
   `whereFinal` іде у `findMany` / `count` / блок price-сортування; **`whereWithoutPrice` — у `buildPriceRange`**.

4. `buildPriceRange` (≈:367): прибрати `delete boundsWhere.basePrice` — він більше нічого не ловить, бо ціна тепер у `AND`. Замість нього приймати вже price-free `where`. Якщо цього не зробити, підказка «Від/До» почне самообмежуватись поточним фільтром (введи 20000 — і нижня межа стане 20000).

5. `buildAvailableFilters` (≈:396): `baseProductWhere` містить той самий `basePrice`-блок (≈:416-423) — замінити на `this.priceClause(minPrice, maxPrice)`, додану через `AND`, щоб фасетні лічильники узгоджувались із видачею.

## Крок A2 — Битий `options` не має класти сторінку (`frontend/app/(store)/catalog/[categorySlug]/page.tsx`)

**Проблема.** Guard (≈:54-62) перевіряє лише `typeof parsed === 'object'`, тож масиви й об'єкти з нестрічковими значеннями проходять, а блок чіпів (≈:161-162) робить `values.map()` на не-масиві.

Перевірено live — усі дають `HTTP 200` + error boundary «ЩОСЬ ПІШЛО НЕ ТАК»:
```
?options={"a":"x"}   → TypeError: values.map is not a function
?options=[1,2]       → те саме (масив проходить typeof === 'object')
?options={"a":123}   → те саме
?options={"a":null}  → Cannot read properties of null (reading 'map')
```
Кнопка «Спробувати знову» в `app/(store)/error.tsx` викликає `reset()` → той самий рендер → та сама помилка. Для Googlebot це soft-404 з валідним `<title>`, який GSC не позначить.

**Реалізація.** Валідувати форму, а не довіряти їй. `JSON.parse` типізований як `any` — присвоювати в `unknown`, як це вже робить бекенд (`products.service.ts:203`, `const raw: unknown = JSON.parse(options)`):

```ts
const raw: unknown = JSON.parse(optionsParam);
if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
  for (const [group, values] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(values)) continue;
    const clean = values.filter((v): v is string => typeof v === 'string');
    if (clean.length > 0) activeOptions[group] = clean;
  }
}
```
Биті значення **відкидаються тихо** (як і зараз для невалідного JSON) — сторінка деградує до «фільтрів немає», а не падає. `catch` навколо лишається.

---

# Черга B — 🟠 наша регресія + SEO

## Крок B1 — Чесний тип `searchParams` (`frontend/app/(store)/catalog/[categorySlug]/page.tsx`, `catalog/page.tsx`, `frontend/lib/utils.ts`)

**Проблема.** Сторінка оголошує `Promise<Record<string, string>>`, а власний згенерований тип Next 16 — інший:
```
.next/types/routes.d.ts:90
  searchParams: Promise<Record<string, string | string[] | undefined>>
```
`new URLSearchParams(sp)` компілюється **лише** завдяки цьому звуженню, а на повторений параметр робить `String(array)` → склейка комою. Перевірено: `?sort=price_asc&sort=newest` → `href="…?sort=price_asc%2Cnewest&page=2"`. Для `options` це дає невалідний JSON → `JSON.parse` кидає → `catch` ковтає → фільтри зникають назавжди. Це **єдина справжня регресія** пагінаційного фікса: раніше `options` у href просто не потрапляв.

Next-валідатор це не ловить — його `AppPageConfig` містить `& any`, який поглинає розбіжність.

**Реалізація.**

1. `lib/utils.ts` — новий експорт (без `any`):
```ts
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
```
2. Обидві сторінки: `searchParams: Promise<Record<string, string | string[] | undefined>>`.
3. Усі читання через `firstParam`: `sp.page`, `sp.sort`, `sp.minPrice`, `sp.maxPrice`, `sp.options`.
4. `pageHref` збирає вручну, зберігаючи дублі замість склейки:
```ts
const pageHref = (p: number) => {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    for (const one of Array.isArray(value) ? value : [value]) qs.append(key, one);
  }
  qs.set('page', String(p));
  return `/catalog/${categorySlug}?${qs.toString()}`;
};
```
   Побічний ефект — бонус: `?minPrice=100&minPrice=200` більше не дає `Number(['100','200']) = NaN`, бо `firstParam` бере перше значення.

## Крок B2 — Canonical + robots на каталозі (`frontend/app/(store)/catalog/[categorySlug]/page.tsx`)

**Проблема.** Перевірено на `?minPrice=12000&page=2`: у `<head>` немає ні `<link rel="canonical">`, ні `<meta name="robots">`, а `<title>` ідентичний на `page=1`, `page=2`, `page=999` і на всіх комбінаціях фільтрів. `generateMetadata` (≈:20-35) приймає **лише `params`**, тому фізично не може віддати query-залежний canonical. `robots.ts` має `Allow: /` і блокує лише `/admin/`, `/checkout/`, `/account/`.

**Реалізація.** `generateMetadata` починає приймати `searchParams` (тип — такий самий чесний, як у Кроці B1). `metadataBase` уже заданий у `app/layout.tsx` (`https://smartlineif.com`), тож canonical можна віддавати **відносним шляхом** — env-конкатенація як на картці товару тут не потрібна.

```ts
const hasFilters = Boolean(
  firstParam(sp.options) || firstParam(sp.minPrice) || firstParam(sp.maxPrice),
);
const pageNum = Number(firstParam(sp.page)) || 1;
const canonical = hasFilters || pageNum === 1
  ? `/catalog/${categorySlug}`
  : `/catalog/${categorySlug}?page=${pageNum}`;
```
- `alternates: { canonical }` — завжди.
- `robots: { index: false, follow: true }` — **лише** коли `hasFilters`. `follow` лишаємо, щоб краулер ішов далі по картках товарів.
- `<title>` при `pageNum > 1` отримує суфікс «— сторінка N» (всередині наявного `title.absolute`), щоб пагіновані сторінки перестали бути текстовими дублями.

`rel=prev/next` **не додаємо** — Google не використовує його з 2019.

---

# Черга C — 🟡 стійкість і чистота

## Крок C1 — Бекендна 400 не має вбивати сайдбар (`frontend/app/(store)/catalog/[categorySlug]/page.tsx`)

**Проблема.** `.catch()` на ≈:72 ловить будь-яку помилку і підставляє `availableFilters: []`, тож замість каталогу юзер бачить «Нічого не знайдено» **і каталог без фільтрів узагалі**. Перевірено: `?minPrice=abc` → `Number('abc') = NaN` → DTO `@IsNumber()` → 400; `?page=-3` → `@Min(1)` → 400. Додатково рамка блоку «Ціна» підсвічується активною, бо `isPriceActive = Boolean('abc')`, хоча `<input type="number">` показує порожнє поле.

**Реалізація.** Санітизувати **до** виклику API, щоб 400 не ставався взагалі:
- `minPrice`/`maxPrice` передавати далі лише якщо `Number.isFinite(Number(v)) && Number(v) >= 0`; інакше трактувати як відсутні.
- `page` — `Math.max(1, Math.floor(Number(…)) || 1)`.
- У `CatalogFilters` / `MobileFilterDrawer` передавати **санітизовані** `currentMinPrice`/`currentMaxPrice`, тоді `isPriceActive` перестане брехати. Самі компоненти не чіпати.

`.catch()` лишається як остання лінія оборони для реального падіння API.

## Крок C2 — Out-of-range сторінка не має бути глухим кутом (`frontend/app/(store)/catalog/[categorySlug]/page.tsx`)

**Проблема.** Пагінація рендериться **лише** в `else`-гілці (≈:259-276), а `?page=999` іде в порожню гілку (≈:181), тож пагінації там немає взагалі: `SortBar` каже «47 товарів», сітка каже «Нічого не знайдено», а єдиний вихід — «Скинути всі фільтри», що вбиває фільтри. Бекенд при цьому віддає `200` з `page:999, totalPages:2, data:[]`.

Пагінаційний фікс підвищив ставки: раніше UI **ніколи не генерував** URL виду `?options=…&page=2`, тепер кожна пара (фільтр × сторінка) — реальний, шарабельний і закладковий URL. Коли склад зменшиться, усі збережені URL стануть такими екранами.

**Реалізація.**
- Винести блок пагінації з `else`-гілки — рендерити завжди, коли `totalPages > 1`.
- В empty-state, якщо `page > totalPages && totalPages > 0`, показувати окремий текст («Сторінки N не існує») і **першою** кнопкою давати `pageHref(1)` — повернення на початок **зі збереженням фільтрів**. «Скинути всі фільтри» лишається другою, вторинною дією.

## Крок C3 — Пагінація з windowing, один компонент на три сторінки

**Проблема.** `Array.from({ length: totalPages })` рендерить **усі** номери, без вікна й еліпсиса — у трьох місцях: `catalog/[categorySlug]/page.tsx` (≈:261), `catalog/page.tsx` (≈:113), `search/page.tsx` (≈:61). Після пагінаційного фікса один href виріс із ~36 до **182 байтів** (виміряно на реальному фільтрі), тож 50 сторінок ≈ 8.9 KB самої лише href-розмітки, і ×2 через дублювання в RSC flight payload.

**Реалізація.**
- **Новий** `frontend/components/store/Pagination.tsx` — Server Component (жодного `'use client'`, це просто `<Link>`-и, тож функцію-проп передавати можна). Named export.
  ```ts
  interface PaginationProps {
    page: number;
    totalPages: number;
    hrefFor: (p: number) => string;
  }
  ```
  Вікно: перша, остання, поточна ±2, еліпсис `…` між розривами; стрілки ← / → (вони вже є на `/catalog` і `/search`, у `[categorySlug]` їх немає — уніфікувати). Візуальні токени взяти з наявного блоку в `[categorySlug]/page.tsx` — активна сторінка `--sl-accent`, решта `--sl-bg-elevated` + `--sl-border`, `--sl-font-mono`.
- **Новий** експорт у `frontend/lib/utils.ts`:
  ```ts
  export function buildPageHref(
    pathname: string,
    sp: Record<string, string | string[] | undefined>,
    page: number,
  ): string
  ```
  Тіло — те саме ручне збирання з Кроку B1; `pageHref` у каталозі стає тонкою обгорткою над ним.
- Перевести всі три сторінки на `<Pagination>`. `search/page.tsx` зараз має тип `Promise<{ q?: string; page?: string }>` — його теж привести до чесного `Record<string, string | string[] | undefined>`.

## Крок C4 — Виправити шлях до Next-docs в інструкціях

`CLAUDE.md` (корінь) і `frontend/AGENTS.md` посилають агентів у `frontend/node_modules/next/dist/docs/`. **Цієї теки не існує** — це hoisted workspace, docs лежать у корені монорепо: `node_modules/next/dist/docs/` (Next 16.2.4). Через це кожен агент спершу промахується. Виправити обидва файли.

---

## Ключові файли

**Backend**
- `backend/src/products/products.service.ts` — `priceClause` + `andClauses` у `findAll`, `buildPriceRange`, `buildAvailableFilters` (Крок A1).

**Frontend — modified**
- `frontend/app/(store)/catalog/[categorySlug]/page.tsx` — A2, B1, B2, C1, C2, C3.
- `frontend/app/(store)/catalog/page.tsx` — B1 (тип), C3.
- `frontend/app/(store)/search/page.tsx` — B1 (тип), C3.
- `frontend/lib/utils.ts` — `firstParam`, `buildPageHref`.

**Frontend — new**
- `frontend/components/store/Pagination.tsx`.

**Docs**
- `CLAUDE.md`, `frontend/AGENTS.md` (Крок C4).

**Reused (без змін)**
- `CatalogFilters` / `MobileFilterDrawer` — отримують санітизовані props, самі не міняються.
- `SortBar`, `CategoryTabs`, `Breadcrumbs`, `app/(store)/error.tsx`, `robots.ts`, `sitemap.ts`.

## Constraints

- **НЕ запускати `npm run lint` у `backend/`** — це `eslint --fix`, він переписує незв'язані файли (вже палилися на цьому).
- Жодного `any` — `JSON.parse` присвоювати в `unknown` і звужувати.
- Named exports скрізь, крім route pages.
- Не додавати npm-залежностей.
- **Не чіпати** `CategoryTabs`, `Breadcrumbs`, `Header` — скидання фільтрів при зміні категорії перевірене й правильне (бекенд скоупить фасети по `categoryIds`).
- **Не чіпати** admin-списки — вони тримають стан у `useState`, у URL не пишуть, клас бага не застосовний.
- **Не чіпати** `backend/prisma/seed-demo-catalog.ts` — локальний демо-інструмент, у коміт не йде.
- Не переписувати `CatalogFilters.buildUrl` — це client-хелпер на `useSearchParams`, він лишається окремо від серверного `buildPageHref`.

## Edge cases

- **Price + option разом.** Товар має задовольняти обидві клаузи, але **не обов'язково одним варіантом**: `variants.some(option)` AND `variants.some(price)` можуть влучити в різні варіанти. Це свідоме спрощення, стандартне для фасетного пошуку; точне «той самий варіант» — окрема задача.
- **Товар без ціни взагалі** (`basePrice = null`, жодного активного варіанта з `price > 0`) — не потрапляє в діапазон за жодних умов. Правильно.
- **`buildPriceRange` самообмеження** — головна пастка Кроку A1: якщо передати в нього `where` з price-клаузою, підказка «Від/До» схлопнеться до поточного фільтра. Передавати `whereWithoutPrice`.
- **Фасетні лічильники vs видача** — якщо забути Крок A1.5, сайдбар показуватиме «14" (30)», а видача віддасть інше число.
- **`?options=[]`, `?options={}`, `?options={"a":[]}`** — після A2 дають порожній `activeOptions`, повний каталог, без чіпів. Уже так і поводиться, не зламати.
- **Дубльований `options`** (`?options=A&options=B`) — після B1 `firstParam` бере перший, другий ігнорується. Тихо й безпечно.
- **`totalPages === 0`** (нуль результатів від валідного фільтра) — пагінація не рендериться, показується звичайний empty-state без тексту «сторінки не існує».
- **Canonical на `page=1`** — має вести на `/catalog/<slug>` **без** `?page=1`, інакше з'явиться дубль-URL.
- **`noindex` не застосовувати до чистої пагінації** — `?page=2` без фільтрів мусить лишатись індексованим.

## Out of scope (свідомо)

- Вирізання `utm_*`/`gclid`/`fbclid` з href пагінації — узгоджено лишити, canonical достатньо.
- `rel=prev/next` — Google не використовує з 2019.
- Точне «той самий варіант задовольняє і ціну, і опцію».
- Збереження `collapse`-стану груп фільтрів між навігаціями (зараз локальний `useState`, скидається — pre-existing, не регресія).
- Відновлення scroll-позиції на пагінації (зараз стандартний `<Link scroll>` → верх сторінки).
- Enum/розширення фільтрів, нові типи фасетів, серверна валідація `options` на бекенді.
- Перенесення admin-фільтрів у URL (щоб шерились і переживали F5) — окрема задача, не цей клас бага.

## Verification

Бекенд `:4000`, фронт `:3005`. Локальна БД містить демо-ноутбуки (`backend/prisma/seed-demo-catalog.ts`): `noutbuky` → 47 товарів, 30 × `Діагональ екрану = 14"`, 10 × `15.6"`, сторінка = 24.

**Крок A1 — price-фільтр**
1. `GET /api/products?categorySlug=smartfony&minPrice=40000&maxPrice=70000` → **≥ 1** товар (зараз 0).
2. `GET /api/products?categorySlug=smartfony` → `priceRange` лишається `{min:33999, max:79999}`; з `&minPrice=50000` **межі не схлопуються** до 50000.
3. `GET /api/products?categorySlug=noutbuky&minPrice=12000` → прості товари не зникли, `total` збігається з кількістю карток на сторінці.
4. Фасетні лічильники в `availableFilters` збігаються з `total` при тому самому фільтрі.
5. Комбінація `q` + `minPrice` + атрибутний фільтр разом → жоден із трьох не затирає інші (регресія `where.OR` / `where.AND`).

**Крок A2 — краш**
6. `?options={"a":"x"}`, `?options=[1,2]`, `?options={"a":123}`, `?options={"a":null}` → каталог рендериться, `grep 'is not a function'` дає **0**.
7. Валідний `?options={"Діагональ екрану":["14\""]}` → 30 товарів, чип на місці.

**Крок B1 — тип**
8. `npx tsc --noEmit -p frontend/tsconfig.json` — чисто, з чесним типом і без `any`.
9. `?sort=price_asc&sort=newest` → href **не** містить `sort=price_asc%2Cnewest`.
10. `?minPrice=100&minPrice=200` → 200 OK, фільтр застосовано зі `100`, сайдбар на місці.

**Крок B2 — SEO**
11. `?minPrice=12000&page=2` → у `<head>` є `<link rel="canonical" href=".../catalog/noutbuky">` і `<meta name="robots" content="noindex, follow">`.
12. `?page=2` (без фільтрів) → canonical на `?page=2`, **без** `noindex`; `<title>` містить «сторінка 2».
13. `/catalog/noutbuky` → canonical без `?page=1`.

**Кроки C1–C3**
14. `?minPrice=abc` і `?page=-3` → 200, повний каталог, **сайдбар з усіма групами фільтрів**, рамка «Ціна» не підсвічена.
15. `?options=…14"…&page=999` → пагінація видима, текст «Сторінки 999 не існує», кнопка веде на сторінку 1 **зі збереженими фільтрами**.
16. Пагінація з вікном: при `totalPages > 9` рендериться ≤ 9 номерів + еліпсис; на `/catalog`, `/catalog/[slug]` і `/search` вигляд однаковий.
17. Головний сценарій не зламано: фільтр 14" + `minPrice=12000` → 27 товарів → клік «2» → фільтри збережені, 3 картки.

**Загальне**
18. `npm run build --workspace=frontend` і `npm run build --workspace=backend` — чисто.
19. `npm test --workspace=backend` — зелено.
20. `npm run lint --workspace=frontend` — чисто (backend lint НЕ запускати).
