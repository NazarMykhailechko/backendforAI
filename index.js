import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();

// збільшуємо ліміт для великих масивів (наприклад, 10mb)
app.use(express.json({ limit: "10mb" }));

// дозволяємо запити з твого Qlik-домену
app.use(cors({
  origin: "https://bi_qlik.accordbank.com.ua"
}));

// Ініціалізація OpenAI
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// простий маршрут для перевірки
app.get("/", (req, res) => {
  res.send("Backend is running with CORS and large payload support!");
});

// Словник стилів із варіантами + тематичні емодзі
const vizPrompts = {
  "scatterplot": [
    "Точкова діаграма показує 🔵",
    "На точковому графіку видно 🔵",
    "Scatterplot демонструє 🔵"
  ],
  "qlik-variance-waterfall": [
    "Водоспадна діаграма показує 🌊",
    "Variance Waterfall демонструє 🌊",
    "На водоспаді видно 🌊"
  ],
  "qlik-sankey-chart-ext": [
    "Діаграма Санкі показує 🔀",
    "Sankey демонструє потоки 🔀",
    "На діаграмі Санкі видно 🔀"
  ],
  "qlik-radar-chart": [
    "Радарна діаграма показує 🕸️",
    "На радарі видно 🕸️",
    "Радар демонструє 🕸️"
  ],
  "qlik-smart-pivot": [
    "P&L Pivot показує 📊",
    "Зведена P&L таблиця демонструє 📊",
    "Smart Pivot відображає 📊"
  ],
  "qlik-network-chart": [
    "Мережна діаграма показує 🔗",
    "Network Chart демонструє зв’язки 🔗",
    "На мережній діаграмі видно 🔗"
  ],
  "qlik-funnel-chart-ext": [
    "Воронка демонструє 🔻",
    "Funnel Chart показує 🔻",
    "На воронці видно 🔻"
  ],
  "waterfallchart": [
    "Каскадна діаграма показує 🌊",
    "Waterfall демонструє 🌊",
    "На каскадній діаграмі видно 🌊"
  ],
  "treemap": [
    "Карта дерева показує 🌳",
    "Treemap демонструє 🌳",
    "На карті дерева видно 🌳"
  ],
  "text-image": [
    "Текстовий блок показує 📝",
    "Зображення демонструє 🖼️",
    "Текст/зображення відображає 🖼️"
  ],
  "table": [
    "Таблиця показує 📋",
    "У таблиці видно 📋",
    "Табличні дані демонструють 📋"
  ],
  "pivot-table": [
    "Зведена таблиця показує 📊",
    "Pivot демонструє 📊",
    "У зведеній таблиці видно 📊"
  ],
  "piechart": [
    "Кругова діаграма показує 🍩",
    "Pie Chart демонструє 🍩",
    "На круговій діаграмі видно 🍩"
  ],
  "map": [
    "Карта показує 🗺️",
    "На карті видно 🗺️",
    "Map демонструє 🗺️"
  ],
  "linechart": [
    "Лінійний графік показує 📈",
    "На графіку видно 📈",
    "Line Chart демонструє 📈"
  ],
  "gauge": [
    "Датчик KPI показує 🎯",
    "Gauge демонструє 🎯",
    "На KPI видно 🎯"
  ],
  "histogram": [
    "Гістограма показує 📊",
    "На гістограмі видно 📊",
    "Histogram демонструє 📊"
  ],
  "distributionplot": [
    "Графік розподілу показує 📊",
    "Distribution Plot демонструє 📊",
    "На графіку розподілу видно 📊"
  ],
  "combochart": [
    "Комбінована діаграма показує 📊",
    "Combo Chart демонструє 📊",
    "На комбінованій діаграмі видно 📊"
  ],
  "boxplot": [
    "Boxplot показує 📦",
    "Діаграма з коробками демонструє 📦",
    "На Boxplot видно 📦"
  ],
  "barchart": [
    "Стовпчикова діаграма показує 📊",
    "Bar Chart демонструє 📊",
    "На стовпчиках видно 📊"
  ],
  "mekkochart": [
    "Мекко-діаграма показує 📊",
    "Marimekko демонструє 📊",
    "На Мекко видно 📊"
  ],
  "heatmap": [
    "Теплова карта показує 🔥",
    "Heatmap демонструє 🔥",
    "На тепловій карті видно 🔥"
  ],
  "bulletchart": [
    "Bullet Chart показує 🎯",
    "Буллет-діаграма демонструє 🎯",
    "На Bullet видно 🎯"
  ],
  "gantt": [
    "Діаграма Ганта показує 📅",
    "Gantt Chart демонструє 📅",
    "На діаграмі Ганта видно 📅"
  ],
  "default": [
    "Дані показують 📊",
    "З даних видно 📊",
    "Інформація демонструє 📊",
    "Результати показують 📊"
  ]
};

// Функція вибору випадкового варіанту
function pickPrompt(type) {
  const options = vizPrompts[type] || vizPrompts["default"];
  return options[Math.floor(Math.random() * options.length)];
}

// Основний endpoint
app.post("/analyze", async (req, res) => {
  const { message, data, fields, vizType, metadata } = req.body;

  // Логування для діагностики
  //console.log("Received body:", req.body);
  //без логів

  // Автоматичний вибір стилю
  const styleHint = pickPrompt(vizType);

  // Формуємо промпт для моделі
const prompt = `
Ти аналітичний асистент для Qlik Sense.
У тебе є набір даних у форматі JSON (змінна "data") та список полів (масив "fields").
Також відомий тип візуалізації (${vizType}).

Правила:
- Якщо повідомлення користувача є загальним (наприклад, привітання чи small talk), відповідай дружньо як асистент, можеш додати відповідні емодзі (👋, 😊, 👍 тощо).
- Якщо повідомлення стосується даних, аналізуй їх, використовуючи "data" та "fields", і відповідай так, ніби ти бачиш візуалізацію типу "${vizType}".
- Використовуй стиль у дусі: "${styleHint}", але варіюй формулювання.
- Якщо даних немає, чітко скажи "Немає даних".
- Не вигадуй значення, використовуй лише те, що є у JSON.
- Додавай емодзі на власний розсуд, але помірно: лише там, де вони справді підсилюють зміст.
- Якщо в даних є поле LOGO (посилання на логотип), завжди відображай його біля назви відповідного об’єкта у форматі: <img src="LOGO_URL" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;" alt="іконка"> OBJECT_NAME. Якщо поле LOGO порожнє — показуй тільки назву об’єкта.
- Якщо користувач просить "executive summary":
   * Відповідай стисло (3–4 речення).
   * Використовуй діловий стиль, без зайвих деталей.
   * Додай короткий блок рекомендацій (2–3 пункти).
   * Не вставляй таблиці чи довгі списки, тільки ключові висновки.
`;

/////

  try {
const response = await client.chat.completions.create({
  model: "gpt-4.1-mini",
  messages: [
    { role: "system", content: prompt }, // інструкції
    { role: "user", content: message },  // реальний запит користувача
    { role: "assistant", content: "Ось дані:\n" + JSON.stringify(data) + "\nПоля:\n" + JSON.stringify(fields) }
  ]
});


    const reply = response.choices?.[0]?.message?.content || "Помилка: немає відповіді від моделі";
    res.json({ reply });
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    res.status(500).json({ error: "Помилка при виклику моделі" });
  }
});

// слухаємо порт із Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});