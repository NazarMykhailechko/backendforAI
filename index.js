import express from "express";
import cors from "cors";
import OpenAI from "openai";
import duckdb from "duckdb";   // ✅ додаємо DuckDB

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

// ✅ Ініціалізація DuckDB
const db = new duckdb.Database('/app/bank.duckdb');

// простий маршрут для перевірки
app.get("/", (req, res) => {
  res.send("Backend is running with CORS, large payload support, and DuckDB!");
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

// ✅ Новий endpoint для тесту роботи з DuckDB
app.get("/balance", (req, res) => {
  const queryDate = req.query.date;

  // універсальний запит: працює і з YYYY-MM-DD, і з dd.mm.yyyy
db.all(
  `SELECT * 
   FROM bank_balance`,
  (err, rows) => {
    if (err) return res.status(500).send(err);
          // 👇 тут додаєш логування
      console.log("Query date:", queryDate);
      console.log("DuckDB rows:", rows);

    res.json(rows);
  }
);

});

// Основний endpoint
app.post("/analyze", async (req, res) => {
  const { message, data, fields, vizType, metadata, date } = req.body;
  const styleHint = pickPrompt(vizType);

  const hypercubeText = data.map(
    row => fields.map((f, i) => `${f}: ${row[i]}`).join(", ")
  ).join("\n");

  const queryDate = date;
  let duckdbText = "";
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM bank_balance`,
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    console.log("Query date:", queryDate);
    console.log("DuckDB rows:", rows);

    duckdbText = rows.map(
      r => `${r.date}: ${r.label} (${r.code}) = ${r.value}`
    ).join("\n");
  } catch (err) {
    console.error("DuckDB error:", err);
    duckdbText = "Помилка при читанні з DuckDB";
  }

  const prompt = `
Ти аналітичний асистент для Qlik Sense.
У тебе є два джерела даних:
1. Основні дані з гіперкубу (користувач вибрав у дашборді).
2. Допоміжні дані з DuckDB (RAG).

Правила:
- Використовуй гіперкуб як основне джерело для відповіді.
- Дані з DuckDB використовуй лише як довідкові, щоб доповнити аналіз або дати контекст.
- Якщо є суперечності — пріоритет має гіперкуб.
- Використовуй стиль у дусі: "${styleHint}".
- Якщо користувач просить "executive summary": відповідай стисло, діловим стилем, з короткими рекомендаціями.
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
messages: [
  { role: "system", content: prompt },
  { role: "user", content: message },
  { role: "user", content: "Ось дані з гіперкубу:\n" + JSON.stringify(data) + "\nПоля:\n" + JSON.stringify(fields) },
  { role: "user", content: "Допоміжні дані з DuckDB:\n" + duckdbText }
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