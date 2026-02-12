import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import fs from "fs";

const app = express();

// збільшуємо ліміт для великих масивів (наприклад, 10mb)
app.use(express.json({ limit: "10mb" }));

// дозволяємо запити з твого Qlik-домену
app.use(cors({
  origin: "https://bi_qlik.accordbank.com.ua"
}));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// простий маршрут для перевірки
app.get("/", (req, res) => {
  res.send("Backend is running with CORS and large payload support!");
});

// GPT-аналіз
app.post("/analyze", async (req, res) => {
  try {
    const { message, data, fields } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `Ти асистент для користувачів Qlik.
У тебе є набір даних у форматі JSON.
Кожен об'єкт має поля: ${fields.join(", ")}.
Твоє завдання:
- Якщо питання користувача стосується цих даних, знайди відповідний об'єкт і дай точне число з відповідного поля.
- Якщо даних немає, чітко скажи "Немає даних".
- Не вигадуй значення, використовуй лише те, що є у JSON.`
        },
        { role: "user", content: message },
        { role: "user", content: "Ось дані:\n" + JSON.stringify(data) }
      ]
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Error in /analyze:", err);
    res.status(500).json({ error: err.message });
  }
});

// ChartJSNodeCanvas з фоном і шрифтом
const chartJSNodeCanvas = new ChartJSNodeCanvas({
  width: 600,
  height: 400,
  backgroundColour: "white",
  chartCallback: (ChartJS) => {
    ChartJS.defaults.font.family = "Arial";
  }
});

// маршрут для графіка
app.post("/chart", async (req, res) => {
  try {
    const { labels, datasets } = req.body;

    const config = {
      type: "line",
      data: {
        labels: labels || ["A", "B", "C"],
        datasets: datasets || [
          { label: "Test", data: [1, 2, 3], borderColor: "blue", fill: false }
        ]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: true }
        }
      }
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(config);

    if (!buffer || buffer.length === 0) {
      return res.status(500).json({ error: "Chart not generated" });
    }

    // більш надійна конвертація
    const base64Image = Buffer.from(buffer).toString("base64");

    // тимчасово можна зберегти файл для перевірки
    // fs.writeFileSync("chart.png", buffer);

    res.json({ image: "data:image/png;base64," + base64Image });
  } catch (err) {
    console.error("Error generating chart:", err);
    res.status(500).json({ error: err.message });
  }
});

// слухаємо порт із Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});