/**
 * Seed: attributes, descriptions, and reviews for existing products.
 * Run: cd backend && npx ts-node prisma/seed-attributes.ts
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Attr = { name: string; value: string; unit?: string; sortOrder?: number };
type ReviewData = { authorName: string; rating: number; text: string };

type ProductData = {
  description?: string;
  attrs: Attr[];
  reviews?: ReviewData[];
};

const DATA: Record<string, ProductData> = {

  /* ================================================================
     iPHONE
  ================================================================ */

  "iPhone 15": {
    description:
      "iPhone 15 — перший iPhone з USB-C та Dynamic Island. Чіп A16 Bionic " +
      "забезпечує вражаючу продуктивність для ігор, фото та AI-задач. " +
      "Основна камера 48 Мп із покращеною Portrait-зйомкою та Photonic Engine. " +
      "Корпус з авіаційного алюмінію і Ceramic Shield — витримує падіння краще за " +
      "будь-який інший смартфон. Підтримка MagSafe та зарядження через USB-C.",
    attrs: [
      { name: "Екран", value: '6.1" Super Retina XDR OLED, 2556×1179 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "60", unit: "Гц", sortOrder: 2 },
      { name: "Процесор", value: "Apple A16 Bionic (4 нм)", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "6", unit: "ГБ", sortOrder: 4 },
      { name: "Основна камера", value: "48 + 12 Мп (основна + ультраширока)", sortOrder: 5 },
      { name: "Фронтальна камера", value: "12", unit: "Мп", sortOrder: 6 },
      { name: "Відео", value: "4K 60 FPS, Cinematic mode 4K 30 FPS", sortOrder: 7 },
      { name: "Акумулятор", value: "3877", unit: "мАг", sortOrder: 8 },
      { name: "Зарядження", value: "20 Вт (дротове), 15 Вт MagSafe", sortOrder: 9 },
      { name: "Зв'язок", value: "5G, Wi-Fi 6, Bluetooth 5.3, NFC", sortOrder: 10 },
      { name: "Захист", value: "IP68 (6 м / 30 хв)", sortOrder: 11 },
      { name: "Роз'єм", value: "USB-C (USB 2.0)", sortOrder: 12 },
      { name: "Розміри", value: "147.6 × 71.6 × 7.8", unit: "мм", sortOrder: 13 },
      { name: "Вага", value: "171", unit: "г", sortOrder: 14 },
      { name: "ОС", value: "iOS 17 (оновлення до iOS 18)", sortOrder: 15 },
    ],
    reviews: [
      { authorName: "Олексій Мороз", rating: 5, text: "Перейшов з Android — і не шкодую. Dynamic Island — це зручніше, ніж здається. Камера вдень просто шикарна." },
      { authorName: "Вікторія Луценко", rating: 5, text: "Нарешті USB-C! Тепер один кабель для всього. Телефон шустрий, сканер Face ID спрацьовує миттєво." },
      { authorName: "Дмитро Чумак", rating: 4, text: "Гарний телефон, але 60 Гц у 2024-му рік виглядає скромно. В цілому задоволений — бере добре навіть у метро." },
      { authorName: "Аліна Пасічник", rating: 5, text: "Купила собі і чоловіку. Обидва дуже задоволені. Автономність стала краща ніж у старого iPhone 13." },
      { authorName: "Тарас Гриценко", rating: 4, text: "Телефон відмінний. Єдине — хотілося б ProMotion 120 Гц, але це вже в Pro версії. За ціну — дуже добре." },
    ],
  },

  "iPhone 15 Pro": {
    description:
      "iPhone 15 Pro — перший iPhone з корпусом з титану Grade 5. Чіп A17 Pro (3 нм) " +
      "з 6-ядерним GPU відкриває апаратний рейтрейсинг в іграх. Кнопка «Дія» замінює " +
      "безшумний перемикач — призначте будь-яку функцію. Камера 48 Мп з оптичним 3× зумом, " +
      "ProRes відео 4K 60 FPS на зовнішній носій через USB 3. ProMotion 120 Гц завжди плавний.",
    attrs: [
      { name: "Екран", value: '6.1" Super Retina XDR OLED ProMotion, 2556×1179 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "1–120 (ProMotion)", unit: "Гц", sortOrder: 2 },
      { name: "Процесор", value: "Apple A17 Pro (3 нм)", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "8", unit: "ГБ", sortOrder: 4 },
      { name: "Основна камера", value: "48 + 12 + 12 Мп (основна + ультраширока + 3× теле)", sortOrder: 5 },
      { name: "Оптичний зум", value: "3×", sortOrder: 6 },
      { name: "Фронтальна камера", value: "12", unit: "Мп", sortOrder: 7 },
      { name: "Відео", value: "4K 120 FPS (ProRes), Cinematic 4K 60 FPS", sortOrder: 8 },
      { name: "Акумулятор", value: "3274", unit: "мАг", sortOrder: 9 },
      { name: "Зарядження", value: "27 Вт (дротове), 15 Вт MagSafe", sortOrder: 10 },
      { name: "Зв'язок", value: "5G, Wi-Fi 6E, Bluetooth 5.3, NFC, UWB", sortOrder: 11 },
      { name: "Захист", value: "IP68 (6 м / 30 хв)", sortOrder: 12 },
      { name: "Роз'єм", value: "USB-C (USB 3, до 10 Гбіт/с)", sortOrder: 13 },
      { name: "Кнопка дії", value: "Є (налаштовується)", sortOrder: 14 },
      { name: "Матеріал корпусу", value: "Титан Grade 5 + скло Ceramic Shield", sortOrder: 15 },
      { name: "Розміри", value: "146.6 × 70.6 × 8.25", unit: "мм", sortOrder: 16 },
      { name: "Вага", value: "187", unit: "г", sortOrder: 17 },
      { name: "ОС", value: "iOS 17 (оновлення до iOS 18)", sortOrder: 18 },
    ],
    reviews: [
      { authorName: "Сергій Бондаренко", rating: 5, text: "Пересів з Samsung S23 Ultra. Перші два дні звикав до iOS, потім закохався. Камера у слабкому освітленні — просто фантастика." },
      { authorName: "Катерина Савченко", rating: 5, text: "Кнопка Дії — найкраще нововведення. Призначила на камеру і тепер знімаю миттєво. Титановий корпус тримається ідеально." },
      { authorName: "Іван Коваль", rating: 5, text: "Купив для відеозйомки — ProRes 4K 60FPS це щось неймовірне для смартфона. Відразу монтую в DaVinci без конвертації." },
      { authorName: "Оксана Лебедь", rating: 4, text: "Телефон чудовий але акумулятор міг бути більшим. При активному використанні до вечора треба підзаряджати." },
      { authorName: "Микола Білик", rating: 5, text: "120 Гц ProMotion — це те, чого бракувало попереднім Pro. Все рухається плавно. Ігри виглядають просто чудово." },
      { authorName: "Юлія Власенко", rating: 5, text: "Брала під Macbook — ідеальна зв'язка. AirDrop, Handoff, Universal Control — все працює бездоганно." },
    ],
  },

  /* ================================================================
     SAMSUNG
  ================================================================ */

  "Samsung Galaxy S24 Ultra": {
    description:
      "Galaxy S24 Ultra — вершина лінійки Samsung з вбудованим S Pen та камерою 200 Мп. " +
      "Корпус з титану, Snapdragon 8 Gen 3 for Galaxy і Galaxy AI: інтелектуальне редагування фото, " +
      "переклад у реальному часі та Circle to Search. Яскравий дисплей 6.8\" до 2600 ніт та " +
      "акумулятор 5000 мАг із підтримкою 45 Вт зарядження.",
    attrs: [
      { name: "Екран", value: '6.8" Dynamic AMOLED 2X, 3088×1440 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "1–120 (адаптивна)", unit: "Гц", sortOrder: 2 },
      { name: "Яскравість", value: "до 2600", unit: "ніт", sortOrder: 3 },
      { name: "Процесор", value: "Snapdragon 8 Gen 3 for Galaxy (4 нм)", sortOrder: 4 },
      { name: "Оперативна пам'ять", value: "12", unit: "ГБ", sortOrder: 5 },
      { name: "Основна камера", value: "200 + 12 + 10 + 50 Мп (4 об'єктиви)", sortOrder: 6 },
      { name: "Оптичний зум", value: "5× (оптичний), 100× (Space Zoom)", sortOrder: 7 },
      { name: "Фронтальна камера", value: "12", unit: "Мп", sortOrder: 8 },
      { name: "Стілус", value: "S Pen вбудований", sortOrder: 9 },
      { name: "Акумулятор", value: "5000", unit: "мАг", sortOrder: 10 },
      { name: "Зарядження", value: "45 Вт (дротове), 15 Вт (бездротове)", sortOrder: 11 },
      { name: "Зв'язок", value: "5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB", sortOrder: 12 },
      { name: "Захист", value: "IP68 (2 м / 30 хв)", sortOrder: 13 },
      { name: "Матеріал корпусу", value: "Титан + Gorilla Glass Armor", sortOrder: 14 },
      { name: "Galaxy AI", value: "Circle to Search, Live Translate, Generative Edit", sortOrder: 15 },
      { name: "Розміри", value: "162.3 × 79.0 × 8.6", unit: "мм", sortOrder: 16 },
      { name: "Вага", value: "232", unit: "г", sortOrder: 17 },
      { name: "ОС", value: "Android 14, One UI 6.1 (4 роки оновлень)", sortOrder: 18 },
    ],
    reviews: [
      { authorName: "Андрій Романенко", rating: 5, text: "S Pen — незамінний для нотаток на нарадах. Пишу прямо на заблокованому екрані. Після iPhone це відкриття." },
      { authorName: "Наталія Шевченко", rating: 5, text: "100× зум — знімала птахів у парку. Якість враження. Galaxy AI в редакторі фото позбавляє зайвих людей одним натиском." },
      { authorName: "Богдан Мартиненко", rating: 4, text: "Телефон-монстр. Важкуватий, але до цього звикаєш. Автономність на 1.5 дня при інтенсивному використанні — це добре." },
      { authorName: "Олена Приходько", rating: 5, text: "Перейшла з iPhone 14 Pro. Не шкодую. Екран яскравіший, зум кращий, а S Pen дозволяє підписувати документи прямо в телефоні." },
      { authorName: "Роман Кириленко", rating: 4, text: "Чудовий флагман. Трохи нагрівається при тривалій грі або зйомці, але це нормально для такого заліза." },
    ],
  },

  "Samsung Galaxy S24+": {
    description:
      "Galaxy S24+ поєднує великий 6.7\" AMOLED дисплей і Snapdragon 8 Gen 3 в тонкому корпусі. " +
      "Потрійна камера 50 + 10 + 12 Мп, акумулятор 4900 мАг із 45 Вт зарядженням і Galaxy AI. " +
      "Рамка Armor Aluminum і скло Gorilla Glass Victus 2 для максимальної захищеності.",
    attrs: [
      { name: "Екран", value: '6.7" Dynamic AMOLED 2X, 3088×1440 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "1–120 (адаптивна)", unit: "Гц", sortOrder: 2 },
      { name: "Яскравість", value: "до 2600", unit: "ніт", sortOrder: 3 },
      { name: "Процесор", value: "Snapdragon 8 Gen 3 for Galaxy (4 нм)", sortOrder: 4 },
      { name: "Оперативна пам'ять", value: "12", unit: "ГБ", sortOrder: 5 },
      { name: "Основна камера", value: "50 + 10 + 12 Мп (основна + 3× теле + ультраширока)", sortOrder: 6 },
      { name: "Оптичний зум", value: "3×", sortOrder: 7 },
      { name: "Фронтальна камера", value: "12", unit: "Мп", sortOrder: 8 },
      { name: "Акумулятор", value: "4900", unit: "мАг", sortOrder: 9 },
      { name: "Зарядження", value: "45 Вт (дротове), 15 Вт (бездротове)", sortOrder: 10 },
      { name: "Зв'язок", value: "5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB", sortOrder: 11 },
      { name: "Захист", value: "IP68 (2 м / 30 хв)", sortOrder: 12 },
      { name: "Матеріал корпусу", value: "Armor Aluminum + Gorilla Glass Victus 2", sortOrder: 13 },
      { name: "Galaxy AI", value: "Circle to Search, Live Translate, Generative Edit", sortOrder: 14 },
      { name: "Розміри", value: "158.5 × 75.9 × 7.7", unit: "мм", sortOrder: 15 },
      { name: "Вага", value: "196", unit: "г", sortOrder: 16 },
      { name: "ОС", value: "Android 14, One UI 6.1 (4 роки оновлень)", sortOrder: 17 },
    ],
    reviews: [
      { authorName: "Максим Дяченко", rating: 5, text: "Великий екран без зайвої ваги — як на мене ідеальний баланс. Дивлюся серіали перед сном — кайф." },
      { authorName: "Ірина Мельник", rating: 5, text: "Зарядка від 0 до 100% за 50 хвилин — просто вогонь. Камера для Instagram дає ідеальні фото навіть без редагування." },
      { authorName: "Павло Голубець", rating: 4, text: "Добрий телефон, хоча S24 Ultra виглядає привабливіше якщо є зайвих 5к грн. Але і цей не розчаровує." },
      { authorName: "Тетяна Кравченко", rating: 5, text: "Circle to Search — вбита в клавіатуру Google — стала звичкою. Просто затиснула кнопку і шукаю що завгодно." },
    ],
  },

  /* ================================================================
     GOOGLE
  ================================================================ */

  "Google Pixel 8 Pro": {
    description:
      "Pixel 8 Pro — флагман Google з ексклюзивним чіпом Tensor G3 та гарантією 7 років оновлень. " +
      "Камера 50 Мп з AI-функціями: Magic Eraser, Best Take, Photo Unblur і Video Boost. " +
      "Температурний сенсор, 6.7\" LTPO OLED дисплей 120 Гц і перший у серії захист IP68.",
    attrs: [
      { name: "Екран", value: '6.7" LTPO OLED, 2992×1344 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "1–120 (LTPO)", unit: "Гц", sortOrder: 2 },
      { name: "Яскравість", value: "до 2400", unit: "ніт", sortOrder: 3 },
      { name: "Процесор", value: "Google Tensor G3", sortOrder: 4 },
      { name: "Оперативна пам'ять", value: "12", unit: "ГБ", sortOrder: 5 },
      { name: "Основна камера", value: "50 + 48 + 48 Мп (основна + ультраширока + 5× теле)", sortOrder: 6 },
      { name: "Оптичний зум", value: "5× (оптичний), 30× (Super Res Zoom)", sortOrder: 7 },
      { name: "Фронтальна камера", value: "10.5", unit: "Мп", sortOrder: 8 },
      { name: "AI-функції камери", value: "Magic Eraser, Best Take, Photo Unblur, Video Boost", sortOrder: 9 },
      { name: "Акумулятор", value: "5050", unit: "мАг", sortOrder: 10 },
      { name: "Зарядження", value: "30 Вт (дротове), 23 Вт (бездротове Qi2)", sortOrder: 11 },
      { name: "Температурний сенсор", value: "Є", sortOrder: 12 },
      { name: "Зв'язок", value: "5G, Wi-Fi 7, Bluetooth 5.3, NFC, UWB", sortOrder: 13 },
      { name: "Захист", value: "IP68 (1.5 м / 30 хв)", sortOrder: 14 },
      { name: "Роз'єм", value: "USB-C (USB 3.2 Gen 2)", sortOrder: 15 },
      { name: "Гарантія оновлень", value: "7 років (ОС + безпека)", sortOrder: 16 },
      { name: "Розміри", value: "162.6 × 76.5 × 8.8", unit: "мм", sortOrder: 17 },
      { name: "Вага", value: "213", unit: "г", sortOrder: 18 },
      { name: "ОС", value: "Android 14 (гарантія до Android 21)", sortOrder: 19 },
    ],
    reviews: [
      { authorName: "Олексій Науменко", rating: 5, text: "Best Take — функція де вибираєш найкраще обличчя з серії — це магія. Групові фото тепер завжди вдалі." },
      { authorName: "Марина Коваленко", rating: 5, text: "7 років оновлень — ось за що я люблю Pixel. Чистий Android без сміттєвих програм. Тримаю телефони по 5 років." },
      { authorName: "Сергій Левченко", rating: 4, text: "Камера нічної зйомки — краща що я бачив. Tensor G3 трохи гріє спину при тривалому записі відео але некритично." },
      { authorName: "Вікторія Захарченко", rating: 5, text: "Magic Eraser видалив машину з фото на відпустці — і нічого не залишилось. Це дивовижно." },
    ],
  },

  /* ================================================================
     XIAOMI
  ================================================================ */

  "Xiaomi 14": {
    description:
      "Xiaomi 14 — компактний флагман зі спільно розробленою камерою Leica та Snapdragon 8 Gen 3. " +
      "Сенсор 50 Мп Light Fusion 900 і оптика Summilux з мінімальними спотвореннями. " +
      "Зарядження 90 Вт HyperCharge — повний заряд за 31 хвилину. " +
      "Матовий керамічний або скляний корпус з класичним дизайном.",
    attrs: [
      { name: "Екран", value: '6.36" LTPO AMOLED, 2670×1200 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "1–120 (LTPO)", unit: "Гц", sortOrder: 2 },
      { name: "Яскравість", value: "до 3000", unit: "ніт", sortOrder: 3 },
      { name: "Процесор", value: "Snapdragon 8 Gen 3 (4 нм)", sortOrder: 4 },
      { name: "Оперативна пам'ять", value: "12", unit: "ГБ", sortOrder: 5 },
      { name: "Основна камера", value: "50 + 50 + 50 Мп Leica Summilux", sortOrder: 6 },
      { name: "Оптичний зум", value: "3.2×", sortOrder: 7 },
      { name: "Фронтальна камера", value: "32", unit: "Мп", sortOrder: 8 },
      { name: "Відео", value: "8K 24 FPS, 4K 120 FPS, Leica Cinematic", sortOrder: 9 },
      { name: "Акумулятор", value: "4610", unit: "мАг", sortOrder: 10 },
      { name: "Зарядження", value: "90 Вт (дротове), 50 Вт (бездротове), 10 Вт (зворотне)", sortOrder: 11 },
      { name: "Зв'язок", value: "5G, Wi-Fi 7, Bluetooth 5.4, NFC, IR-бластер", sortOrder: 12 },
      { name: "Захист", value: "IP68", sortOrder: 13 },
      { name: "Роз'єм", value: "USB-C (USB 3.2)", sortOrder: 14 },
      { name: "Розміри", value: "152.8 × 71.5 × 8.2", unit: "мм", sortOrder: 15 },
      { name: "Вага", value: "193", unit: "г", sortOrder: 16 },
      { name: "ОС", value: "HyperOS на базі Android 14", sortOrder: 17 },
    ],
    reviews: [
      { authorName: "Євген Бойко", rating: 5, text: "Leica камера — не маркетинг, а реальна різниця. Боке на портретах виглядає як з дзеркальної камери. Зарядка за 30 хвилин — це просто зручно." },
      { authorName: "Аліна Герасименко", rating: 5, text: "Компактний але потужний. IR-бластер керує моїм телевізором — забула де пульт. Дисплей яскравий навіть на вулиці." },
      { authorName: "Михайло Петренко", rating: 4, text: "Дуже гідна камера за ціну. Leica режими — Authentic і Vivid — дають зовсім різний результат. Використовую обидва залежно від ситуації." },
      { authorName: "Наталія Корнієнко", rating: 5, text: "Взяла замість iPhone і не пошкодувала. 90 Вт зарядка — просто фантастика коли поспішаєш. Телефон швидкий і не гріється." },
    ],
  },

  /* ================================================================
     MacBook
  ================================================================ */

  "Apple MacBook Air 13\" M3": {
    description:
      "MacBook Air 13\" M3 — найпопулярніший ноутбук Apple тепер із чіпом M3 та підтримкою " +
      "двох зовнішніх дисплеїв. Рекордний час роботи до 18 годин, вага 1.24 кг і " +
      "пасивне охолодження без вентилятора. Дисплей Liquid Retina 2560×1664, 500 ніт яскравості, " +
      "підтримка P3 Wide Color. Ідеальний для навчання, роботи та творчості.",
    attrs: [
      { name: "Екран", value: '13.6" Liquid Retina, 2560×1664 пкс', sortOrder: 1 },
      { name: "Яскравість", value: "500", unit: "ніт", sortOrder: 2 },
      { name: "Процесор", value: "Apple M3 (8-ядерний CPU, 10-ядерний GPU)", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "від 8 до 24", unit: "ГБ", sortOrder: 4 },
      { name: "Накопичувач", value: "SSD від 256 ГБ до 2 ТБ", sortOrder: 5 },
      { name: "Час роботи", value: "до 18", unit: "годин", sortOrder: 6 },
      { name: "Зарядження", value: "30–70 Вт MagSafe 3, також через USB-C", sortOrder: 7 },
      { name: "Порти", value: "2× USB-C Thunderbolt 3, MagSafe 3, 3.5 мм аудіо", sortOrder: 8 },
      { name: "Зовнішні дисплеї", value: "2 (при закритій кришці)", sortOrder: 9 },
      { name: "Wi-Fi", value: "Wi-Fi 6E (802.11ax)", sortOrder: 10 },
      { name: "Bluetooth", value: "5.3", sortOrder: 11 },
      { name: "Камера", value: "1080p FaceTime HD", sortOrder: 12 },
      { name: "Аудіо", value: "4-динамічна система з Spatial Audio", sortOrder: 13 },
      { name: "Охолодження", value: "Пасивне (без вентилятора)", sortOrder: 14 },
      { name: "Розміри", value: "304.1 × 215.0 × 11.3", unit: "мм", sortOrder: 15 },
      { name: "Вага", value: "1.24", unit: "кг", sortOrder: 16 },
    ],
    reviews: [
      { authorName: "Христина Данилюк", rating: 5, text: "Студентський мастхев. Легкий, акумулятора вистачає на весь день пар без підзарядки. M3 швидко рендерить відео для YouTube." },
      { authorName: "Олег Соловей", rating: 5, text: "Перейшов з Windows. Тиша — без вентилятора взагалі. Навіть в Lightroom не гуде. Просто мовчить і робить." },
      { authorName: "Діана Коломієць", rating: 4, text: "Відмінний ноутбук. Хотілося б більше портів — лише 2 USB-C. Але з хабом — нема проблем." },
      { authorName: "Артем Кузьменко", rating: 5, text: "18 годин батареї — не реклама, а правда. Їздив у відрядження 3 дні без зарядки (тільки на ніч підключав). Дивовижно." },
      { authorName: "Юлія Остапенко", rating: 5, text: "Для дизайну — ідеально. P3 дисплей дає точні кольори, Figma відкривається за секунду, Photoshop не підвисає навіть з 20 шарами." },
    ],
  },

  "Apple MacBook Air 15\" M3": {
    description:
      "MacBook Air 15\" M3 — найтонший і найлегший 15-дюймовий ноутбук із пасивним охолодженням. " +
      "Чіп M3 із 10-ядерним GPU, дисплей 2880×1864 зі підтримкою P3 Wide Color та до 18 годин роботи. " +
      "Підтримка двох зовнішніх дисплеїв, 6-динамічна звукова система Spatial Audio.",
    attrs: [
      { name: "Екран", value: '15.3" Liquid Retina, 2880×1864 пкс', sortOrder: 1 },
      { name: "Яскравість", value: "500", unit: "ніт", sortOrder: 2 },
      { name: "Процесор", value: "Apple M3 (8-ядерний CPU, 10-ядерний GPU)", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "від 8 до 24", unit: "ГБ", sortOrder: 4 },
      { name: "Накопичувач", value: "SSD від 256 ГБ до 2 ТБ", sortOrder: 5 },
      { name: "Час роботи", value: "до 18", unit: "годин", sortOrder: 6 },
      { name: "Зарядження", value: "35–70 Вт MagSafe 3, також через USB-C", sortOrder: 7 },
      { name: "Порти", value: "2× USB-C Thunderbolt 3, MagSafe 3, 3.5 мм аудіо", sortOrder: 8 },
      { name: "Зовнішні дисплеї", value: "2 (при закритій кришці)", sortOrder: 9 },
      { name: "Wi-Fi", value: "Wi-Fi 6E (802.11ax)", sortOrder: 10 },
      { name: "Bluetooth", value: "5.3", sortOrder: 11 },
      { name: "Камера", value: "1080p FaceTime HD", sortOrder: 12 },
      { name: "Аудіо", value: "6-динамічна система з Spatial Audio", sortOrder: 13 },
      { name: "Охолодження", value: "Пасивне (без вентилятора)", sortOrder: 14 },
      { name: "Розміри", value: "340.4 × 237.6 × 11.5", unit: "мм", sortOrder: 15 },
      { name: "Вага", value: "1.51", unit: "кг", sortOrder: 16 },
    ],
    reviews: [
      { authorName: "Антон Василенко", rating: 5, text: "Великий екран без вентилятора — нарешті! Для Netflix, роботи з таблицями, презентацій — краще не придумати. Мовчить як риба." },
      { authorName: "Вікторія Поліщук", rating: 5, text: "Взяла замість iPad Pro + Magic Keyboard. Виявилось практичніше. Велике поле для роботи у Figma і повний macOS." },
      { authorName: "Денис Лисенко", rating: 4, text: "Гарний ноутбук. Для 15\" трохи темнуватий екран порівняно з Pro. Але для задач без HDR — більш ніж достатньо." },
    ],
  },

  "Apple MacBook Pro 14\" M3": {
    description:
      "MacBook Pro 14\" M3 — найпотужніший 14-дюймовий ноутбук Apple. " +
      "Дисплей Liquid Retina XDR ProMotion 120 Гц, до 1600 ніт у HDR-режимі. " +
      "Чіп M3 Pro або M3 Max із активним охолодженням для важких задач: монтаж 8K, " +
      "3D-рендер, компіляція великих проектів.",
    attrs: [
      { name: "Екран", value: '14.2" Liquid Retina XDR ProMotion, 3024×1964 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "24–120 (ProMotion)", unit: "Гц", sortOrder: 2 },
      { name: "Яскравість (SDR)", value: "1000", unit: "ніт", sortOrder: 3 },
      { name: "Яскравість (HDR)", value: "1600", unit: "ніт", sortOrder: 4 },
      { name: "Процесор", value: "Apple M3 / M3 Pro / M3 Max", sortOrder: 5 },
      { name: "Оперативна пам'ять", value: "від 18 до 128", unit: "ГБ", sortOrder: 6 },
      { name: "Накопичувач", value: "SSD від 512 ГБ до 8 ТБ", sortOrder: 7 },
      { name: "Час роботи", value: "до 22", unit: "годин", sortOrder: 8 },
      { name: "Порти", value: "3× Thunderbolt 4, HDMI 2.1, SD-кард, MagSafe 3, 3.5 мм", sortOrder: 9 },
      { name: "Wi-Fi", value: "Wi-Fi 6E (802.11ax)", sortOrder: 10 },
      { name: "Bluetooth", value: "5.3", sortOrder: 11 },
      { name: "Камера", value: "1080p FaceTime HD з Center Stage", sortOrder: 12 },
      { name: "Аудіо", value: "6-динамічна система Spatial Audio з Dolby Atmos", sortOrder: 13 },
      { name: "Охолодження", value: "Активне (вентилятор)", sortOrder: 14 },
      { name: "Розміри", value: "312.6 × 221.2 × 15.5", unit: "мм", sortOrder: 15 },
      { name: "Вага", value: "1.55", unit: "кг", sortOrder: 16 },
    ],
    reviews: [
      { authorName: "Ростислав Марченко", rating: 5, text: "Монтую 4K ProRes і ноутбук не навіть не нагрівається. На старому Intel MBP вентилятор ревів як реактивний літак." },
      { authorName: "Олена Тимченко", rating: 5, text: "HDR дисплей — це окремий всесвіт. Перший раз відкрив Apple ProRes на Netflix і щелепа впала. Рекомендую з M3 Pro як мінімум." },
      { authorName: "Ігор Кравець", rating: 5, text: "Порти нарешті повернули! HDMI, SD-кард, 3 Thunderbolt — не потрібен хаб взагалі. Це мав бути ноутбук завжди." },
      { authorName: "Аліна Тищенко", rating: 4, text: "Неймовірна машина. Єдиний мінус — ціна. Але якщо брати M3 Pro — він окупиться за рік роботи дизайнером чи розробником." },
    ],
  },

  /* ================================================================
     iPad
  ================================================================ */

  "Apple iPad Pro 13\" M4": {
    description:
      "iPad Pro 13\" M4 — найтонший пристрій Apple всього 5.1 мм та найяскравіший планшет " +
      "з Ultra Retina XDR OLED тандем-дисплеєм 1000 ніт. Чіп M4 із 10-ядерним CPU " +
      "перевершує більшість ноутбуків. Підтримка Apple Pencil Pro та Magic Keyboard з тачпадом.",
    attrs: [
      { name: "Екран", value: '13" Ultra Retina XDR OLED тандем, 2752×2064 пкс', sortOrder: 1 },
      { name: "Яскравість (SDR)", value: "1000", unit: "ніт", sortOrder: 2 },
      { name: "Яскравість (HDR)", value: "1600", unit: "ніт", sortOrder: 3 },
      { name: "Частота оновлення", value: "до 120 (ProMotion)", unit: "Гц", sortOrder: 4 },
      { name: "Процесор", value: "Apple M4 (10-ядерний CPU, 10-ядерний GPU)", sortOrder: 5 },
      { name: "Оперативна пам'ять", value: "від 8 до 16", unit: "ГБ", sortOrder: 6 },
      { name: "Накопичувач", value: "від 256 ГБ до 2 ТБ", sortOrder: 7 },
      { name: "Основна камера", value: "12 Мп ширококутна", sortOrder: 8 },
      { name: "Фронтальна камера", value: "12 Мп TrueDepth (горизонтально)", sortOrder: 9 },
      { name: "Роз'єм", value: "USB-C (USB4 / Thunderbolt 4)", sortOrder: 10 },
      { name: "Зв'язок", value: "Wi-Fi 6E + опціонально 5G", sortOrder: 11 },
      { name: "Apple Pencil", value: "Apple Pencil Pro, Apple Pencil USB-C", sortOrder: 12 },
      { name: "Face ID", value: "Є", sortOrder: 13 },
      { name: "Товщина", value: "5.1", unit: "мм", sortOrder: 14 },
      { name: "Вага", value: "579", unit: "г", sortOrder: 15 },
      { name: "ОС", value: "iPadOS 17 (оновлення до iPadOS 18)", sortOrder: 16 },
    ],
    reviews: [
      { authorName: "Марина Сидоренко", rating: 5, text: "OLED дисплей після LCD — як вийти з печери на сонце. Чорний колір абсолютний. Малюю в Procreate — Apple Pencil Pro реагує без будь-якої затримки." },
      { authorName: "Ярослав Гаврилюк", rating: 5, text: "Товщина 5мм — тримаєш в руці і не відчуваєш. Легший за попередній iPad Pro. M4 тягне будь-що — навіть Blender запускав." },
      { authorName: "Оксана Яременко", rating: 4, text: "Чудовий планшет. Тільки iPadOS ще не до кінця розкриває потенціал M4. Чекаю на iPadOS 19 — там обіцяли більше мультизадачності." },
    ],
  },

  "Apple iPad Air 11\" M2": {
    description:
      "iPad Air 11\" M2 — потужний планшет для навчання, роботи та творчості. " +
      "Чіп M2, дисплей Liquid Retina 2360×1640 із True Tone і P3 Wide Color. " +
      "Підтримка Apple Pencil Pro та Magic Keyboard. Touch ID у кнопці живлення.",
    attrs: [
      { name: "Екран", value: '11" Liquid Retina, 2360×1640 пкс', sortOrder: 1 },
      { name: "Яскравість", value: "500", unit: "ніт", sortOrder: 2 },
      { name: "Процесор", value: "Apple M2 (8-ядерний CPU, 9-ядерний GPU)", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "8", unit: "ГБ", sortOrder: 4 },
      { name: "Накопичувач", value: "від 128 ГБ до 1 ТБ", sortOrder: 5 },
      { name: "Основна камера", value: "12 Мп ширококутна", sortOrder: 6 },
      { name: "Фронтальна камера", value: "12 Мп TrueDepth (горизонтально)", sortOrder: 7 },
      { name: "Роз'єм", value: "USB-C (USB 3.2)", sortOrder: 8 },
      { name: "Зв'язок", value: "Wi-Fi 6E + опціонально 5G", sortOrder: 9 },
      { name: "Touch ID", value: "В кнопці живлення", sortOrder: 10 },
      { name: "Apple Pencil", value: "Apple Pencil Pro, Apple Pencil USB-C", sortOrder: 11 },
      { name: "Час роботи", value: "до 10", unit: "годин", sortOrder: 12 },
      { name: "Вага", value: "462", unit: "г", sortOrder: 13 },
      { name: "ОС", value: "iPadOS 17 (оновлення до iPadOS 18)", sortOrder: 14 },
    ],
    reviews: [
      { authorName: "Іванна Федоренко", rating: 5, text: "Купила для навчання в університеті. GoodNotes + Apple Pencil — ніяких зошитів більше. Все систематизовано і під рукою." },
      { authorName: "Богдан Стецьків", rating: 5, text: "Читаю книги, дивлюсь лекції, малюю — M2 справляється з усім без нагрівання. За ціну між iPad і iPad Pro — ідеальне рішення." },
      { authorName: "Тетяна Гузій", rating: 4, text: "Добрий планшет. Хотілося б OLED як у Pro але і Liquid Retina не поганий. Яскравий і з правильними кольорами." },
    ],
  },

  /* ================================================================
     ANDROID ПЛАНШЕТИ
  ================================================================ */

  "Samsung Galaxy Tab S9 Ultra": {
    description:
      "Galaxy Tab S9 Ultra — найбільший планшет Samsung із 14.6\" AMOLED дисплеєм 120 Гц " +
      "та двома вирізами під front-камери. Snapdragon 8 Gen 2, S Pen у комплекті, IP68 захист. " +
      "DeX-режим перетворює планшет на повноцінний ПК.",
    attrs: [
      { name: "Екран", value: '14.6" Dynamic AMOLED 2X, 2960×1848 пкс', sortOrder: 1 },
      { name: "Частота оновлення", value: "120", unit: "Гц", sortOrder: 2 },
      { name: "Яскравість", value: "до 930", unit: "ніт", sortOrder: 3 },
      { name: "Процесор", value: "Snapdragon 8 Gen 2 for Galaxy (4 нм)", sortOrder: 4 },
      { name: "Оперативна пам'ять", value: "від 12 до 16", unit: "ГБ", sortOrder: 5 },
      { name: "Накопичувач", value: "від 256 ГБ до 1 ТБ (microSD до 1 ТБ)", sortOrder: 6 },
      { name: "Основна камера", value: "13 + 8 Мп (основна + ультраширока)", sortOrder: 7 },
      { name: "Фронтальна камера", value: "12 + 12 Мп (дві)", sortOrder: 8 },
      { name: "Стілус", value: "S Pen у комплекті", sortOrder: 9 },
      { name: "Акумулятор", value: "11200", unit: "мАг", sortOrder: 10 },
      { name: "Зарядження", value: "45 Вт (дротове), 15 Вт (бездротове)", sortOrder: 11 },
      { name: "Зв'язок", value: "Wi-Fi 6E, Bluetooth 5.3, опціонально 5G", sortOrder: 12 },
      { name: "Захист", value: "IP68", sortOrder: 13 },
      { name: "DeX режим", value: "Є", sortOrder: 14 },
      { name: "Розміри", value: "326.4 × 208.6 × 5.5", unit: "мм", sortOrder: 15 },
      { name: "Вага", value: "732", unit: "г", sortOrder: 16 },
    ],
    reviews: [
      { authorName: "Руслан Захаренко", rating: 5, text: "Це не планшет, це портативний монітор! 14.6 дюймів у форматі планшета — дивлюся серіали як у кінотеатрі. DeX підключив клавіатуру і мишу — повноцінний ПК." },
      { authorName: "Лариса Білоус", rating: 5, text: "S Pen у комплекті — великий плюс. Малюю ескізи, підписую документи. Ніхто не вірить що це не iPad, а Samsung." },
      { authorName: "Василь Кириченко", rating: 4, text: "Монстр за розміром і потужністю. Тримати в одній руці важко — але за це і купував великий дисплей. Акумулятор на 2 дні легко." },
    ],
  },

  /* ================================================================
     НОУТБУКИ
  ================================================================ */

  "ASUS ROG Strix G16 (2024)": {
    description:
      "ROG Strix G16 (2024) — топовий ігровий ноутбук із Intel Core i9-14900HX та NVIDIA RTX 4070. " +
      "Дисплей 16\" 240 Гц QHD OLED — кришталево чітка картинка в будь-якій грі. " +
      "ROG Intelligent Cooling із рідким металом та 4 вентиляторами тримає температуру під контролем.",
    attrs: [
      { name: "Екран", value: '16" QHD OLED 240 Гц, 2560×1600 пкс', sortOrder: 1 },
      { name: "Процесор", value: "Intel Core i9-14900HX (24 ядра, до 5.8 ГГц)", sortOrder: 2 },
      { name: "Відеокарта", value: "NVIDIA GeForce RTX 4070 8 ГБ GDDR6", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "від 16 до 64", unit: "ГБ DDR5", sortOrder: 4 },
      { name: "Накопичувач", value: "SSD PCIe 4.0 від 1 до 2 ТБ", sortOrder: 5 },
      { name: "TDP відеокарти", value: "140", unit: "Вт (з Boost)", sortOrder: 6 },
      { name: "Акумулятор", value: "90", unit: "Вт·год", sortOrder: 7 },
      { name: "Зарядження", value: "240 Вт адаптер", sortOrder: 8 },
      { name: "Порти", value: "Thunderbolt 4, USB-A 3.2, HDMI 2.1, SD, 3.5 мм", sortOrder: 9 },
      { name: "Wi-Fi", value: "Wi-Fi 6E (802.11ax)", sortOrder: 10 },
      { name: "Bluetooth", value: "5.3", sortOrder: 11 },
      { name: "Клавіатура", value: "RGB підсвітка Aura Sync per-key", sortOrder: 12 },
      { name: "Охолодження", value: "ROG Intelligent Cooling + рідкий метал", sortOrder: 13 },
      { name: "Розміри", value: "354 × 259 × 24.7", unit: "мм", sortOrder: 14 },
      { name: "Вага", value: "2.5", unit: "кг", sortOrder: 15 },
    ],
    reviews: [
      { authorName: "Денис Боровець", rating: 5, text: "OLED 240 Гц в ігровому ноутбуці — це революція. Cyberpunk виглядає так само як на десктопі. RTX 4070 тягне 1440p на максималках." },
      { authorName: "Андрій Зінченко", rating: 5, text: "Рідкий метал під кришкою — температури на 10-15 градусів нижчі ніж у конкурентів. Під навантаженням не дросселює." },
      { authorName: "Сашко Кучер", rating: 4, text: "Потужний звір. Зарядник здоровий але за такий GPU прощаємо. Запас потужності на 5 років вперед — задоволений покупкою." },
    ],
  },

  "Razer Blade 16 (2024)": {
    description:
      "Razer Blade 16 (2024) — найпотужніший ноутбук Razer із RTX 4090 та унікальним " +
      "dual-mode дисплеєм Mini-LED 120 Гц / FHD 240 Гц. CNC-фрезерований алюмінієвий корпус, " +
      "клавіатура Chroma RGB та Windows Hello.",
    attrs: [
      { name: "Екран", value: '16" Mini-LED Dual Mode QHD 120 Гц / FHD 240 Гц', sortOrder: 1 },
      { name: "Процесор", value: "Intel Core i9-14900HX (24 ядра, до 5.8 ГГц)", sortOrder: 2 },
      { name: "Відеокарта", value: "NVIDIA GeForce RTX 4090 16 ГБ GDDR6", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "32", unit: "ГБ DDR5 5600", sortOrder: 4 },
      { name: "Накопичувач", value: "2× NVMe SSD від 1 ТБ кожний", sortOrder: 5 },
      { name: "TDP відеокарти", value: "до 175", unit: "Вт", sortOrder: 6 },
      { name: "Акумулятор", value: "95.2", unit: "Вт·год", sortOrder: 7 },
      { name: "Зарядження", value: "330 Вт адаптер + USB-C 140 Вт", sortOrder: 8 },
      { name: "Порти", value: "2× Thunderbolt 5, 2× USB-A 3.2, HDMI 2.1, SD UHS-II, 3.5 мм", sortOrder: 9 },
      { name: "Wi-Fi", value: "Wi-Fi 7 (802.11be)", sortOrder: 10 },
      { name: "Bluetooth", value: "5.4", sortOrder: 11 },
      { name: "Клавіатура", value: "Per-key Razer Chroma RGB", sortOrder: 12 },
      { name: "Матеріал корпусу", value: "CNC алюміній (авіаційний сплав)", sortOrder: 13 },
      { name: "Розміри", value: "355.1 × 255 × 22", unit: "мм", sortOrder: 14 },
      { name: "Вага", value: "2.94", unit: "кг", sortOrder: 15 },
    ],
    reviews: [
      { authorName: "Кирило Ткаченко", rating: 5, text: "RTX 4090 в ноутбуці — це не жарт. Запускаю Unreal Engine 5 сцени напряму на ноутбуці. Dual mode дисплей — режим Creator для роботи, режим Gamer для ігор." },
      { authorName: "Ніна Боднар", rating: 4, text: "Топова машина але ціна відповідна. Корпус з CNC алюмінію виглядає і відчувається преміально. Охолодження гучнувате при максимальному навантаженні." },
    ],
  },

  "Lenovo ThinkPad X1 Carbon Gen 12": {
    description:
      "ThinkPad X1 Carbon Gen 12 — легендарний бізнес-ноутбук вагою 1.12 кг із вуглецевого волокна. " +
      "Intel Core Ultra 7 із вбудованим NPU для AI-задач. Клавіатура ThinkPad — визнана найкращою в індустрії. " +
      "Сертифікат MIL-STD-810H — витримує падіння, вологу та екстремальні температури.",
    attrs: [
      { name: "Екран", value: '14" IPS / OLED, від 1920×1200 до 2880×1800 пкс', sortOrder: 1 },
      { name: "Процесор", value: "Intel Core Ultra 7 165U / 165H", sortOrder: 2 },
      { name: "Вбудований NPU", value: "Intel AI Boost (10 TOPS)", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "від 16 до 64", unit: "ГБ LPDDR5", sortOrder: 4 },
      { name: "Накопичувач", value: "SSD PCIe 4.0 від 512 ГБ до 2 ТБ", sortOrder: 5 },
      { name: "Час роботи", value: "до 15", unit: "годин", sortOrder: 6 },
      { name: "Зарядження", value: "65 Вт USB-C", sortOrder: 7 },
      { name: "Порти", value: "2× Thunderbolt 4, 2× USB-A 3.2, HDMI 2.1, 3.5 мм, SD", sortOrder: 8 },
      { name: "Wi-Fi", value: "Wi-Fi 6E", sortOrder: 9 },
      { name: "Bluetooth", value: "5.3", sortOrder: 10 },
      { name: "Камера", value: "FHD 1080p + IR для Windows Hello", sortOrder: 11 },
      { name: "Безпека", value: "ThinkShield, TPM 2.0, дактилоскоп, IR-камера", sortOrder: 12 },
      { name: "Сертифікація", value: "MIL-STD-810H (12 тестів)", sortOrder: 13 },
      { name: "Матеріал корпусу", value: "Вуглецеве волокно + магнієвий сплав", sortOrder: 14 },
      { name: "Вага", value: "1.12", unit: "кг", sortOrder: 15 },
    ],
    reviews: [
      { authorName: "Олег Харченко", rating: 5, text: "Тримаю ThinkPad з 2015 — кожне покоління краще. Клавіатура як завжди ідеальна. Батарея на 15 годин — це реально, не маркетинг." },
      { authorName: "Ірина Ковальська", rating: 5, text: "Взяла для відрядження. Впала один раз на бруківку — жодного подряпу. MIL-STD не просто слова. Вага 1.12 кг в рюкзаку не відчувається." },
      { authorName: "Павло Нечипоренко", rating: 4, text: "Бізнес-ноутбук без компромісів. OLED конфігурація — неймовірний дисплей. Хотілося б дискретну відеокарту але для мого профілю роботи і так достатньо." },
    ],
  },

  "Dell XPS 13 Plus (2024)": {
    description:
      "Dell XPS 13 Plus (2024) — найбільш мінімалістичний ноутбук із безрамковою клавіатурою " +
      "та бездотиковим тачпадом. OLED дисплей 13.4\" 2.8K, 500 ніт, 100% DCI-P3. " +
      "Intel Core Ultra — платформа AI PC для генеративного AI прямо на пристрої.",
    attrs: [
      { name: "Екран", value: '13.4" OLED InfinityEdge, від 2880×1800 до 3456×2160 пкс', sortOrder: 1 },
      { name: "Яскравість", value: "500", unit: "ніт", sortOrder: 2 },
      { name: "Процесор", value: "Intel Core Ultra 7 165H", sortOrder: 3 },
      { name: "Оперативна пам'ять", value: "від 16 до 64", unit: "ГБ LPDDR5x", sortOrder: 4 },
      { name: "Накопичувач", value: "SSD PCIe 4.0 від 512 ГБ до 2 ТБ", sortOrder: 5 },
      { name: "Час роботи", value: "до 12", unit: "годин", sortOrder: 6 },
      { name: "Зарядження", value: "60 Вт USB-C", sortOrder: 7 },
      { name: "Порти", value: "2× Thunderbolt 4 + адаптер USB-A/SD", sortOrder: 8 },
      { name: "Wi-Fi", value: "Wi-Fi 6E", sortOrder: 9 },
      { name: "Bluetooth", value: "5.3", sortOrder: 10 },
      { name: "Камера", value: "720p IR (Windows Hello)", sortOrder: 11 },
      { name: "Клавіатура", value: "Безрамкова + сенсорний тачпад Haptic", sortOrder: 12 },
      { name: "Розміри", value: "295.3 × 199.0 × 15.3", unit: "мм", sortOrder: 13 },
      { name: "Вага", value: "1.27", unit: "кг", sortOrder: 14 },
    ],
    reviews: [
      { authorName: "Станіслав Гончар", rating: 5, text: "Дизайн без компромісів. Тачпад без кнопок дивно виглядає але через день звикаєш і вже не розумієш як жив без нього." },
      { authorName: "Аліна Дмитренко", rating: 4, text: "OLED екран для дизайну — найкращий. Але лише 2 порти Thunderbolt — треба завжди носити хаб. Це ціна ультра-мінімалізму." },
    ],
  },

  /* ================================================================
     ТЕЛЕВІЗОРИ
  ================================================================ */

  "LG OLED C3 55\"": {
    description:
      "LG OLED C3 55\" — найпопулярніший OLED ТВ у світі з бездоганним зображенням " +
      "та абсолютним чорним кольором. Процесор a9 Gen6 AI, Dolby Vision IQ та ATMOS. " +
      "Ідеальний для PS5 і Xbox — 4 порти HDMI 2.1 із 4K 120 Гц VRR.",
    attrs: [
      { name: "Діагональ", value: "55", unit: "дюймів", sortOrder: 1 },
      { name: "Роздільна здатність", value: "4K Ultra HD (3840×2160)", sortOrder: 2 },
      { name: "Тип панелі", value: "OLED evo", sortOrder: 3 },
      { name: "Частота оновлення", value: "120", unit: "Гц", sortOrder: 4 },
      { name: "Процесор", value: "a9 Gen6 AI", sortOrder: 5 },
      { name: "HDR", value: "Dolby Vision IQ, HDR10, HLG", sortOrder: 6 },
      { name: "Звук", value: "40 Вт 2.2 канали, Dolby Atmos, DTS:X", sortOrder: 7 },
      { name: "HDMI порти", value: "4× HDMI 2.1 (4K 120 Гц)", sortOrder: 8 },
      { name: "Ігровий режим", value: "NVIDIA G-Sync, FreeSync Premium, VRR, ALLM", sortOrder: 9 },
      { name: "Смарт ТВ", value: "webOS 23, ThinQ AI", sortOrder: 10 },
      { name: "Wi-Fi", value: "Wi-Fi 5 (802.11ac)", sortOrder: 11 },
      { name: "Bluetooth", value: "5.0", sortOrder: 12 },
      { name: "Розміри без підставки", value: "122.4 × 70.6 × 1.9", unit: "см", sortOrder: 13 },
      { name: "Вага без підставки", value: "19.3", unit: "кг", sortOrder: 14 },
    ],
    reviews: [
      { authorName: "Олексій Стоколос", rating: 5, text: "Після LED-ТВ це просто інший рівень. Чорний — абсолютно чорний, не сірий. Перший фільм у Dolby Vision — мурашки по шкірі." },
      { authorName: "Людмила Семенченко", rating: 5, text: "PS5 через HDMI 2.1 в 4K 120 FPS VRR — ігри виглядають як реальність. Нарешті ТВ відповідає консолі." },
      { authorName: "Ярослав Кравченко", rating: 5, text: "Встановив у вітальні. Сусіди прийшли подивитися і теж замовили. Dune 2 в Dolby Vision — неймовірно." },
      { authorName: "Тетяна Мельниченко", rating: 4, text: "Відмінний ТВ але через рік почав з'являтися retention (слід) від логотипу каналу. Налаштував pixel refresher раз на тиждень — допомогло." },
    ],
  },

  "Samsung Neo QLED 8K QN900C 65\"": {
    description:
      "Samsung Neo QLED 8K QN900C 65\" — телевізор майбутнього із роздільною здатністю " +
      "33 мільйони пікселів та процесором Neural Quantum 8K. Mini LED і 4096 зон підсвічення " +
      "для точного контролю яскравості. 8K AI Upscaling покращує будь-який контент.",
    attrs: [
      { name: "Діагональ", value: "65", unit: "дюймів", sortOrder: 1 },
      { name: "Роздільна здатність", value: "8K Ultra HD (7680×4320)", sortOrder: 2 },
      { name: "Тип панелі", value: "Neo QLED (Mini LED + Quantum Dot)", sortOrder: 3 },
      { name: "Кількість зон підсвічення", value: "4096", sortOrder: 4 },
      { name: "Частота оновлення", value: "120", unit: "Гц", sortOrder: 5 },
      { name: "Процесор", value: "Neural Quantum 8K Gen2", sortOrder: 6 },
      { name: "HDR", value: "Quantum HDR 32X, HDR10+, Dolby Vision", sortOrder: 7 },
      { name: "Звук", value: "92 Вт 6.2.4 канали, Dolby Atmos, OTS", sortOrder: 8 },
      { name: "HDMI порти", value: "4× HDMI 2.1 (2 порти для 8K)", sortOrder: 9 },
      { name: "Ігровий режим", value: "Gaming Hub, 144 Гц при FHD, FreeSync Premium Pro", sortOrder: 10 },
      { name: "Смарт ТВ", value: "Tizen 7.0, Samsung Gaming Hub", sortOrder: 11 },
      { name: "Wi-Fi", value: "Wi-Fi 6", sortOrder: 12 },
      { name: "Розміри без підставки", value: "144.5 × 83.4 × 1.9", unit: "см", sortOrder: 13 },
      { name: "Вага без підставки", value: "43.5", unit: "кг", sortOrder: 14 },
    ],
    reviews: [
      { authorName: "Ігор Коломієць", rating: 5, text: "8K Upscaling перетворює звичайний Netflix на щось неймовірне. Хто каже що 8K контенту немає — просто не бачив цей апскейлінг." },
      { authorName: "Богдан Левченко", rating: 5, text: "Mini LED з 4096 зонами — контраст майже як у OLED але без ризику вигоряння. Для спортивних трансляцій — ідеал." },
    ],
  },

  /* ================================================================
     КОНСОЛІ
  ================================================================ */

  "Sony PlayStation 5": {
    description:
      "PlayStation 5 — консоль нового покоління з SSD NVMe 825 ГБ зі швидкістю 5.5 ГБ/с: " +
      "практично без екранів завантаження. AMD Zen 2 та GPU RDNA 2 підтримують трасування " +
      "променів та 4K 120 FPS. DualSense із адаптивними тригерами та тактильним зворотним зв'язком.",
    attrs: [
      { name: "Процесор", value: "AMD Zen 2, 8 ядер × 3.5 ГГц", sortOrder: 1 },
      { name: "Відеопроцесор", value: "AMD RDNA 2, 10.28 TFLOPS", sortOrder: 2 },
      { name: "Оперативна пам'ять", value: "16", unit: "ГБ GDDR6", sortOrder: 3 },
      { name: "Накопичувач", value: "825 ГБ NVMe SSD (5.5 ГБ/с)", sortOrder: 4 },
      { name: "Максимальна роздільна здатність", value: "8K (4K 120 FPS)", sortOrder: 5 },
      { name: "Трасування променів", value: "Є", sortOrder: 6 },
      { name: "Звук", value: "Tempest 3D AudioTech", sortOrder: 7 },
      { name: "Контролер", value: "DualSense (адаптивні тригери + тактильний зворотний зв'язок)", sortOrder: 8 },
      { name: "Порти", value: "1× USB-A 3.1, 1× USB-C, HDMI 2.1, LAN", sortOrder: 9 },
      { name: "Wi-Fi", value: "Wi-Fi 6 (802.11ax)", sortOrder: 10 },
      { name: "Bluetooth", value: "5.1", sortOrder: 11 },
      { name: "Вага", value: "3.9", unit: "кг", sortOrder: 12 },
    ],
    reviews: [
      { authorName: "Владислав Гришко", rating: 5, text: "Spider-Man 2 завантажується за 0.8 секунди. Spider-Man на PS4 — 15 секунд. Різниця фізично відчутна кожен раз." },
      { authorName: "Катерина Романюк", rating: 5, text: "DualSense — найкращий контролер у моєму житті. Натягування тетиви лука в Horizon — відчуваєш опір фізично. Це занурення." },
      { authorName: "Артем Савченко", rating: 5, text: "God of War Ragnarok, Demon Souls, Ratchet — ексклюзиви PS5 виправдовують кожну гривню. Рекомендую всім геймерам." },
      { authorName: "Оленка Гончаренко", rating: 4, text: "Великий і шумний під навантаженням, але ігри виглядають приголомшливо. Tempest Audio через навушники — чути з якого боку ходять вороги." },
    ],
  },

  "Microsoft Xbox Series X": {
    description:
      "Xbox Series X — найпотужніша консоль Xbox із 12 TFLOPS GPU та NVMe SSD 1 ТБ. " +
      "4K 120 FPS, Quick Resume між кількома іграми та Xbox Game Pass Ultimate. " +
      "Зворотна сумісність із тисячами ігор усіх попередніх поколінь Xbox.",
    attrs: [
      { name: "Процесор", value: "AMD Zen 2, 8 ядер × 3.8 ГГц", sortOrder: 1 },
      { name: "Відеопроцесор", value: "AMD RDNA 2, 12 TFLOPS", sortOrder: 2 },
      { name: "Оперативна пам'ять", value: "16", unit: "ГБ GDDR6", sortOrder: 3 },
      { name: "Накопичувач", value: "1 ТБ NVMe SSD (2.4 ГБ/с)", sortOrder: 4 },
      { name: "Оптичний привід", value: "4K Blu-ray", sortOrder: 5 },
      { name: "Максимальна роздільна здатність", value: "4K 120 FPS / 8K", sortOrder: 6 },
      { name: "Трасування променів", value: "Є (DirectX Raytracing)", sortOrder: 7 },
      { name: "Quick Resume", value: "Є (кілька ігор одночасно)", sortOrder: 8 },
      { name: "Звук", value: "Dolby Atmos, DTS:X, Dolby Vision", sortOrder: 9 },
      { name: "Контролер", value: "Xbox Wireless Controller 4-го покоління", sortOrder: 10 },
      { name: "Порти", value: "3× USB-A 3.1, HDMI 2.1, LAN, Storage Expansion Slot", sortOrder: 11 },
      { name: "Wi-Fi", value: "Wi-Fi 5 (802.11ac)", sortOrder: 12 },
      { name: "Bluetooth", value: "5.0", sortOrder: 13 },
      { name: "Зворотна сумісність", value: "Xbox, Xbox 360, Xbox One, Series", sortOrder: 14 },
      { name: "Вага", value: "4.45", unit: "кг", sortOrder: 15 },
    ],
    reviews: [
      { authorName: "Михайло Бережний", rating: 5, text: "Game Pass — це Netflix для ігор. За місяць отримую доступ до 400+ ігор. Forza Horizon 5 в 4K 60 FPS просто фантастика." },
      { authorName: "Роман Шевчук", rating: 5, text: "Quick Resume — перемикаюся між Halo і Forza миттєво, ігри продовжуються з тієї самої точки. Після PS5 це вражає." },
      { authorName: "Вероніка Лазаренко", rating: 4, text: "Стабільна консоль. Кастрована медіа-функціональність порівняно з PS5 але ігор більше через Game Pass. Все залежить від пріоритетів." },
    ],
  },

  "Nintendo Switch OLED": {
    description:
      "Nintendo Switch OLED — портативна консоль із 7\" яскравим OLED дисплеєм " +
      "та покращеними динаміками. Три режими: портативний, настільний і телевізійний. " +
      "64 ГБ вбудованої пам'яті та підтримка всього каталогу Nintendo Switch.",
    attrs: [
      { name: "Екран", value: '7" OLED, 1280×720 пкс', sortOrder: 1 },
      { name: "Процесор", value: "NVIDIA Tegra X1+ (ARM Cortex-A57)", sortOrder: 2 },
      { name: "Оперативна пам'ять", value: "4", unit: "ГБ LPDDR4", sortOrder: 3 },
      { name: "Вбудована пам'ять", value: "64", unit: "ГБ (microSD до 2 ТБ)", sortOrder: 4 },
      { name: "Роздільна здатність (ТВ)", value: "1080p", sortOrder: 5 },
      { name: "Режими", value: "Телевізійний, Настільний, Портативний", sortOrder: 6 },
      { name: "Час роботи", value: "4.5–9", unit: "годин", sortOrder: 7 },
      { name: "Акумулятор", value: "4310", unit: "мАг", sortOrder: 8 },
      { name: "Зарядження", value: "39 Вт через USB-C", sortOrder: 9 },
      { name: "Звук", value: "Стерео динаміки (покращені)", sortOrder: 10 },
      { name: "Зв'язок", value: "Wi-Fi 5, Bluetooth 4.1", sortOrder: 11 },
      { name: "LAN порт", value: "В Dock (Ethernet)", sortOrder: 12 },
      { name: "Joy-Con", value: "Знімні, Motion Control, HD Rumble", sortOrder: 13 },
      { name: "Вага (з Joy-Con)", value: "420", unit: "г", sortOrder: 14 },
    ],
    reviews: [
      { authorName: "Соломія Іванців", rating: 5, text: "Zelda Tears of the Kingdom зайняла 200 годин мого часу. OLED екран виглядає чудово навіть на сонці. Ніяких жалів." },
      { authorName: "Микита Даниленко", rating: 5, text: "Беру в поїздки — у метро, автобусі, готелі. Легкий, компактний. Mario Kart на вечір з друзями — завжди хіт." },
      { authorName: "Лілія Паращук", rating: 4, text: "Добрий ексклюзивний каталог. Joy-Con дрейф з'явився через рік але Nintendo замінили безкоштовно. Загалом задоволена." },
    ],
  },

  /* ================================================================
     АУДІО
  ================================================================ */

  "Sony WH-1000XM5": {
    description:
      "Sony WH-1000XM5 — найкращі бездротові навушники з активним шумопоглинанням. " +
      "8 мікрофонів і два процесори QN1 та V1 забезпечують рекордне придушення шуму. " +
      "LDAC та DSEE Extreme відновлюють стиснуті файли до рівня Hi-Res Audio.",
    attrs: [
      { name: "Тип", value: "Накладні (over-ear)", sortOrder: 1 },
      { name: "Підключення", value: "Bluetooth 5.2 (LDAC, AAC, SBC)", sortOrder: 2 },
      { name: "Активне шумопоглинання", value: "Є (8 мікрофонів)", sortOrder: 3 },
      { name: "Час роботи з ANC", value: "30", unit: "годин", sortOrder: 4 },
      { name: "Час роботи без ANC", value: "40", unit: "годин", sortOrder: 5 },
      { name: "Зарядження", value: "USB-C, 3 хв = 3 год роботи", sortOrder: 6 },
      { name: "Розмір драйвера", value: "30", unit: "мм", sortOrder: 7 },
      { name: "Частотний діапазон", value: "4–40 000", unit: "Гц", sortOrder: 8 },
      { name: "Технології", value: "LDAC, DSEE Extreme, Speak-to-Chat, Multipoint", sortOrder: 9 },
      { name: "Вага", value: "250", unit: "г", sortOrder: 10 },
    ],
    reviews: [
      { authorName: "Анастасія Коваль", rating: 5, text: "Надягаю в метро — чую лише музику. Абсолютна тиша. LDAC з TIDAL HiFi — різниця від звичайного Bluetooth відчутна навіть не audiophile." },
      { authorName: "Ігор Семенець", rating: 5, text: "Speak-to-Chat автоматично паузить музику коли говориш — магія. Multipoint — підключений до телефону і ноутбука одночасно без перемикань." },
      { authorName: "Дарина Пономаренко", rating: 4, text: "Найкраще шумопоглинання на ринку — факт. Але складаються дещо незручно порівняно з Bose. Носити в сумці можна але хочеться кращий кейс." },
    ],
  },

  "Apple AirPods Pro 2 (USB-C)": {
    description:
      "AirPods Pro 2 із USB-C — найрозумніші TWS навушники Apple. Adaptive Audio " +
      "автоматично перемикається між ANC та Transparency. Персоналізований просторовий звук " +
      "Dolby Atmos. Кейс MagSafe підтримує зарядку від Apple Watch та Qi2.",
    attrs: [
      { name: "Тип", value: "Вкладні (in-ear) TWS", sortOrder: 1 },
      { name: "Чіп", value: "Apple H2", sortOrder: 2 },
      { name: "Активне шумопоглинання", value: "Є (Adaptive Transparency)", sortOrder: 3 },
      { name: "Час роботи (навушники)", value: "до 6", unit: "годин", sortOrder: 4 },
      { name: "Час роботи (з кейсом)", value: "до 30", unit: "годин", sortOrder: 5 },
      { name: "Зарядження кейса", value: "USB-C, MagSafe, Qi2, Apple Watch", sortOrder: 6 },
      { name: "Аудіокодек", value: "AAC, Apple Lossless (ALAC)", sortOrder: 7 },
      { name: "Spatial Audio", value: "Персоналізований, Dolby Atmos", sortOrder: 8 },
      { name: "Захист", value: "IP54 (навушники та кейс)", sortOrder: 9 },
      { name: "Вага (один навушник)", value: "5.3", unit: "г", sortOrder: 10 },
    ],
    reviews: [
      { authorName: "Валентина Левченко", rating: 5, text: "Adaptive Audio — не помічаєш переходу між ANC і Transparency. Навушники самі розуміють коли тобі треба чути оточення." },
      { authorName: "Юрій Сидоренко", rating: 5, text: "Просторовий звук у Netflix на iPhone — відчуття кінотеатру. Відстеження голови — повертаєш голову і звук змінюється. Магія." },
      { authorName: "Христина Мороз", rating: 5, text: "Зарядила кейс від Apple Watch вночі — вранці вже повні. Зручність рівня яку я очікую від Apple. USB-C нарешті." },
    ],
  },

  "Apple AirPods Max": {
    description:
      "AirPods Max — накладні навушники Apple із алюмінієвими чашками та м'якою тканинною " +
      "оголовком. Кожне вухо містить по 10 чіпів H2 для Computational Audio. " +
      "Просторовий звук Dolby Atmos із відстеженням руху голови.",
    attrs: [
      { name: "Тип", value: "Накладні (over-ear)", sortOrder: 1 },
      { name: "Чіп", value: "Apple H2 (по 10 на кожну чашку)", sortOrder: 2 },
      { name: "Активне шумопоглинання", value: "Є + Transparency Mode", sortOrder: 3 },
      { name: "Час роботи", value: "до 20", unit: "годин", sortOrder: 4 },
      { name: "Зарядження", value: "USB-C, 5 хв = 1.5 год роботи", sortOrder: 5 },
      { name: "Розмір драйвера", value: "40", unit: "мм", sortOrder: 6 },
      { name: "Аудіокодек", value: "Apple Lossless (ALAC) через AirPlay 2", sortOrder: 7 },
      { name: "Spatial Audio", value: "Є з відстеженням голови", sortOrder: 8 },
      { name: "Матеріал чашок", value: "Алюмінієвий сплав", sortOrder: 9 },
      { name: "Матеріал оголов'я", value: "М'яка тканина + нержавіюча сталь", sortOrder: 10 },
      { name: "Вага", value: "385", unit: "г", sortOrder: 11 },
    ],
    reviews: [
      { authorName: "Олеся Нікітенко", rating: 5, text: "Дорогі але воно того варте. Якість звуку — кращого не чула ні в яких навушниках до 30 тисяч. ANC відключає весь офіс." },
      { authorName: "Дмитро Гладченко", rating: 4, text: "Звук та ANC — 10/10. Але кейс-мішечок — це жарт для таких грошей. Сподіваємось в наступній версії з'явиться нормальний чохол." },
    ],
  },

  "Sonos Era 300": {
    description:
      "Sonos Era 300 — перша бездротова колонка Sonos із нативним Dolby Atmos. " +
      "6 підсилювачів та 6 динамічних драйверів у спеціально спроектованому акустичному шасі. " +
      "Wi-Fi, Bluetooth, Ethernet або USB-C лінійний вхід.",
    attrs: [
      { name: "Тип", value: "Бездротова смарт-колонка", sortOrder: 1 },
      { name: "Dolby Atmos", value: "Нативна підтримка", sortOrder: 2 },
      { name: "Підсилювачів", value: "6", sortOrder: 3 },
      { name: "Динаміків", value: "4 мідбаси + 2 твітери (спрямовані)", sortOrder: 4 },
      { name: "Підключення", value: "Wi-Fi 6, Bluetooth 5.0, Ethernet, USB-C", sortOrder: 5 },
      { name: "Стрімінг", value: "Spotify Connect, AirPlay 2, Amazon Music, Tidal", sortOrder: 6 },
      { name: "Голосові помічники", value: "Amazon Alexa, Apple Siri", sortOrder: 7 },
      { name: "Trueplay", value: "Є (авто-налаштування акустики)", sortOrder: 8 },
      { name: "Розміри", value: "260 × 185 × 155", unit: "мм", sortOrder: 9 },
      { name: "Вага", value: "4.73", unit: "кг", sortOrder: 10 },
    ],
    reviews: [
      { authorName: "Назар Гуцуляк", rating: 5, text: "Dolby Atmos з одної колонки — як це взагалі можливо? Звук справді обволікає. Trueplay налаштував під мою кімнату — різниця помітна." },
      { authorName: "Юлія Скирда", rating: 5, text: "AirPlay 2 + Apple Music Lossless = ідеальна пара. Колонка красиво виглядає і чудово звучить. Рекомендую." },
    ],
  },

  "Samsung HW-Q990C Soundbar": {
    description:
      "Samsung HW-Q990C — флагманський 11.1.4-канальний саундбар 656 Вт із бездротовими " +
      "сателітами і сабвуфером. Q-Symphony синхронізує саундбар із Samsung Neo QLED/OLED ТВ. " +
      "Dolby Atmos, DTS:X та Samsung Spatial Sound Plus.",
    attrs: [
      { name: "Канали", value: "11.1.4", sortOrder: 1 },
      { name: "Потужність", value: "656", unit: "Вт", sortOrder: 2 },
      { name: "Dolby Atmos / DTS:X", value: "Є", sortOrder: 3 },
      { name: "Сателіти", value: "Бездротові (тилові)", sortOrder: 4 },
      { name: "Сабвуфер", value: "Бездротовий", sortOrder: 5 },
      { name: "Q-Symphony", value: "Є (синхронізація з Samsung TV)", sortOrder: 6 },
      { name: "Підключення", value: "HDMI eARC, Optical, Bluetooth 5.0, Wi-Fi", sortOrder: 7 },
      { name: "Стрімінг", value: "AirPlay 2, Spotify Connect, Samsung SmartThings", sortOrder: 8 },
      { name: "Частотний діапазон", value: "27–20 000", unit: "Гц", sortOrder: 9 },
      { name: "Розміри саундбару", value: "122 × 7.2 × 13.5", unit: "см", sortOrder: 10 },
    ],
    reviews: [
      { authorName: "Роман Гриценко", rating: 5, text: "Після цього саундбару кінотеатр не потрібен. 11.1.4 канали заповнюють весь зал. Q-Symphony із Samsung ТВ — один звуковий простір." },
      { authorName: "Ірина Ходаківська", rating: 5, text: "Встановили для перегляду спортивних трансляцій. Атмосфера стадіону вдома — не перебільшення. Дуже задоволені." },
    ],
  },

  /* ================================================================
     КАМЕРИ
  ================================================================ */

  "Sony A7V Mirrorless": {
    description:
      "Sony A7V — повнокадрова бездзеркальна камера 33 Мп із новим сенсором BSI CMOS Exmor R. " +
      "Відео 4K 120 FPS без кропу, Real-time AF із розпізнаванням очей та 8-ступеневий IBIS.",
    attrs: [
      { name: "Тип", value: "Повнокадрова бездзеркальна (E-mount)", sortOrder: 1 },
      { name: "Матриця", value: "33 Мп BSI CMOS Exmor R", sortOrder: 2 },
      { name: "Процесор", value: "BIONZ XR + AI Processing Unit", sortOrder: 3 },
      { name: "ISO (фото)", value: "100–51200 (розш. 50–204800)", sortOrder: 4 },
      { name: "Відео", value: "4K 120 FPS (без кропу), 4K 60 FPS, Full HD 240 FPS", sortOrder: 5 },
      { name: "Автофокус", value: "Real-time Tracking AF, 759 фаз + 425 контраст", sortOrder: 6 },
      { name: "Розпізнавання", value: "Людей, тварин, комах, птахів, автомобілів", sortOrder: 7 },
      { name: "Стабілізація", value: "IBIS 8-ступенів", sortOrder: 8 },
      { name: "Видошукач", value: "OLED 9.44 Мп EVF, 0.9×", sortOrder: 9 },
      { name: "Дисплей", value: '3.2" 1.44 Мп поворотний тачскрін', sortOrder: 10 },
      { name: "Акумулятор", value: "NP-FZ100, ~580 знімків", sortOrder: 11 },
      { name: "Підключення", value: "USB-C (USB 3.2), Wi-Fi 6, Bluetooth 5.0", sortOrder: 12 },
      { name: "Карти пам'яті", value: "2 слоти: CFexpress Type A / SD (UHS-II)", sortOrder: 13 },
      { name: "Вага", value: "514", unit: "г (тільки корпус)", sortOrder: 14 },
    ],
    reviews: [
      { authorName: "Владислав Сірко", rating: 5, text: "4K 120 FPS без кропу — ось за що взяв. Сповільнення на весіллях виглядає як голлівудське кіно. AF тримає очей навіть коли дитина стрибає." },
      { authorName: "Оксана Дроздова", rating: 5, text: "Перейшла з Canon R6. IBIS 8 ступенів — знімаю в темряві на 1/8 сек без штатива. Фотографую архітектуру — результати приголомшливі." },
    ],
  },

  /* ================================================================
     ДРОНИ
  ================================================================ */

  "DJI Mini 4 Pro": {
    description:
      "DJI Mini 4 Pro — найкращий дрон до 249 г без потреби реєстрації в більшості країн. " +
      "Камера 4K 60 FPS HDR із сенсором 1/1.3\" та апертурою f/1.7. " +
      "Obstacle Sensing у 4 напрямках та 34 хвилини польоту.",
    attrs: [
      { name: "Вага", value: "< 249", unit: "г", sortOrder: 1 },
      { name: "Матриця", value: '1/1.3" CMOS, 48 Мп', sortOrder: 2 },
      { name: "Апертура", value: "f/1.7", sortOrder: 3 },
      { name: "Відео", value: "4K 60 FPS HDR, 4K 100 FPS, вертикальне 4K", sortOrder: 4 },
      { name: "Стабілізація", value: "3-вісний карданний підвіс", sortOrder: 5 },
      { name: "Уникнення перешкод", value: "4 напрямки (F/B/L/R) + APAS 360°", sortOrder: 6 },
      { name: "Час польоту", value: "до 34", unit: "хвилин", sortOrder: 7 },
      { name: "Максимальна дальність", value: "20", unit: "км", sortOrder: 8 },
      { name: "Максимальна швидкість", value: "57", unit: "км/год", sortOrder: 9 },
      { name: "Зв'язок", value: "DJI O4 (відео), 2.4 / 5.8 ГГц", sortOrder: 10 },
      { name: "Intelligent Modes", value: "ActiveTrack 360°, Hyperlapse, QuickShots", sortOrder: 11 },
      { name: "Карта пам'яті", value: "microSD до 2 ТБ (UHS-I/II)", sortOrder: 12 },
    ],
    reviews: [
      { authorName: "Тарас Проценко", rating: 5, text: "Колишній власник Mini 3 Pro. Mini 4 Pro — інший рівень. 4K 100 FPS для сповільнення хвиль на морі — щось неймовірне. Вертикальне відео для Reels без кропу." },
      { authorName: "Ірина Карпенко", rating: 5, text: "ActiveTrack 360° їде за мною на велосипеді і оминає дерева сам. Було страшно з першого разу — тепер довіряю повністю." },
      { authorName: "Денис Ющенко", rating: 4, text: "Відмінний дрон. Один мінус — зарядка акумулятора через хаб займає 2+ години. Рекомендую брати 3 акумулятори одразу." },
    ],
  },

  /* ================================================================
     АКСЕСУАРИ
  ================================================================ */

  "Apple MagSafe Charger 25W": {
    description:
      "MagSafe Charger 25W — офіційний бездротовий зарядний пристрій Apple до 25 Вт для iPhone 16. " +
      "Магнітне вирівнювання центрує iPhone автоматично для максимальної ефективності. " +
      "Кабель 1 м із USB-C роз'ємом. Потребує адаптера 30+ Вт.",
    attrs: [
      { name: "Потужність", value: "25", unit: "Вт (з iPhone 16)", sortOrder: 1 },
      { name: "Сумісність", value: "iPhone 12 і новіші (MagSafe), Qi2", sortOrder: 2 },
      { name: "Роз'єм", value: "USB-C (кабель 1 м)", sortOrder: 3 },
      { name: "Стандарт", value: "MagSafe + Qi2", sortOrder: 4 },
      { name: "Рекомендований адаптер", value: "30 Вт USB-C (не входить)", sortOrder: 5 },
    ],
    reviews: [
      { authorName: "Марія Захарченко", rating: 5, text: "Кидаю телефон на зарядку навіть не дивлячись — магніт сам вирівнює. Вранці завжди 100%. 25 Вт заряджає значно швидше ніж старий 15 Вт." },
      { authorName: "Богдан Шевченко", rating: 4, text: "Чудовий зарядник але адаптер не в комплекті — докуповуйте одразу 30W Apple або сторонній GaN." },
    ],
  },

  "Кабель USB-C to USB-C 240W": {
    description:
      "Кабель USB-C to USB-C 240 Вт — універсальний кабель для зарядки ноутбуків, " +
      "телефонів та планшетів із максимальною потужністю 240 Вт (EPR). " +
      "Підтримує передачу даних до 40 Гбіт/с (USB4 / Thunderbolt 4) та відеовиход 8K.",
    attrs: [
      { name: "Зарядження", value: "до 240", unit: "Вт (USB PD 3.1 EPR)", sortOrder: 1 },
      { name: "Передача даних", value: "до 40", unit: "Гбіт/с (USB4 / TB4)", sortOrder: 2 },
      { name: "Відеовиход", value: "8K 30 FPS / 4K 60 FPS", sortOrder: 3 },
      { name: "Роз'єми", value: "USB-C ↔ USB-C", sortOrder: 4 },
    ],
    reviews: [
      { authorName: "Олексій Варченко", rating: 5, text: "Один кабель для MacBook Pro, iPad і iPhone. 240 Вт — заряджає ноутбук так само швидко як рідний адаптер. Ідеальний мандрівний кабель." },
      { authorName: "Катерина Бойко", rating: 5, text: "Купила для MacBook + зовнішній дисплей. Один кабель — і зарядження і відео 4K 60 FPS. Менше проводів на столі." },
    ],
  },

  "Anker 737 PowerBank 24000 мАг": {
    description:
      "Anker 737 PowerBank 24000 мАг — потужний павербанк із зарядкою 140 Вт. " +
      "Заряджає MacBook Pro та iPad одночасно через два USB-C порти. " +
      "Смарт-дисплей відображає рівень заряду, потужність та час до завершення. " +
      "Сертифікований для перевезення в літаку.",
    attrs: [
      { name: "Ємність", value: "24000", unit: "мАг", sortOrder: 1 },
      { name: "Максимальна потужність", value: "140", unit: "Вт", sortOrder: 2 },
      { name: "Порти", value: "2× USB-C (140 Вт + 100 Вт) + 1× USB-A (18 Вт)", sortOrder: 3 },
      { name: "Вхідне зарядження", value: "140", unit: "Вт (USB-C)", sortOrder: 4 },
      { name: "Дисплей", value: "LED: рівень заряду, потужність, час", sortOrder: 5 },
      { name: "Авіарейси", value: "Дозволено (88.8 Вт·год < 100 Вт·год)", sortOrder: 6 },
      { name: "Вага", value: "652", unit: "г", sortOrder: 7 },
    ],
    reviews: [
      { authorName: "Сергій Павленко", rating: 5, text: "Заряджаю MacBook Air і телефон одночасно. Хватає на 1.5 повних зарядки ноутбука. Дисплей з ватами і часом — дуже зручно планувати." },
      { authorName: "Аліна Яковенко", rating: 5, text: "Беру у відрядження замість ноутбукового адаптера. 140 Вт — заряджає MacBook Pro так само швидко як рідний блок. Дозволений в літак — відлітала 12 разів без питань." },
    ],
  },

  "Чохол MagSafe Leather Case": {
    description:
      "Шкіряний чохол MagSafe для iPhone — натуральна шкіра з красивою патиною з часом. " +
      "Вшиті MagSafe-магніти забезпечують надійне кріплення аксесуарів. " +
      "Мікрофібра всередині захищає екран від подряпин.",
    attrs: [
      { name: "Матеріал", value: "Натуральна шкіра (зовні), мікрофібра (всередині)", sortOrder: 1 },
      { name: "MagSafe", value: "Є (вшиті магніти)", sortOrder: 2 },
      { name: "Сумісність", value: "iPhone 15 / 15 Pro / 15 Pro Max / 15 Plus", sortOrder: 3 },
      { name: "Захист кутів", value: "Підвищений", sortOrder: 4 },
    ],
    reviews: [
      { authorName: "Оксана Хоменко", rating: 5, text: "Шкіра дійсно з часом стає красивішою — з'являється приємна патина. Чохол тонкий але кути захищають добре. MagSafe тримає як рідний." },
      { authorName: "Євген Кириченко", rating: 4, text: "Якісний чохол але шкіра трохи ковзає з рук. Зате виглядає преміально і не додає зайвої товщини. Магніти сильні." },
      { authorName: "Тетяна Процик", rating: 5, text: "Взяла чорний і синій. На чорному патина зробила його ще темнішим і красивішим. Дуже задоволена — вже рік ношу без проблем." },
    ],
  },
};

/* ====================================================================
   MAIN
==================================================================== */

async function main() {
  console.log("🚀 Starting seed: attributes, descriptions, reviews\n");

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
  });

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    const data = DATA[product.name];
    if (!data) {
      console.log(`⏭  No data for: ${product.name}`);
      skipped++;
      continue;
    }

    // 1. Replace attributes
    await prisma.attribute.deleteMany({ where: { productId: product.id } });
    await prisma.attribute.createMany({
      data: data.attrs.map((a) => ({
        productId: product.id,
        name: a.name,
        value: a.value,
        unit: a.unit ?? null,
        sortOrder: a.sortOrder ?? 0,
      })),
    });

    // 2. Update description if provided
    if (data.description) {
      await prisma.product.update({
        where: { id: product.id },
        data: { description: data.description },
      });
    }

    // 3. Add reviews (delete old unapproved ones first, then create)
    if (data.reviews && data.reviews.length > 0) {
      await prisma.review.deleteMany({
        where: { productId: product.id, isApproved: false },
      });
      for (const r of data.reviews) {
        await prisma.review.create({
          data: {
            productId: product.id,
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            isApproved: true,
          },
        });
      }
    }

    const reviewCount = data.reviews?.length ?? 0;
    console.log(
      `✅ ${product.name} — ${data.attrs.length} attrs, ${reviewCount} reviews`
    );
    updated++;
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
