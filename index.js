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

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// простий маршрут для перевірки
app.get("/", (req, res) => {
  res.send("Backend is running with CORS and large payload support!");
});

app.post("/analyze", async (req, res) => {
  try {
    const { message, data } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: `Ти асистент для користувачів Qlik.
У тебе є набір даних у форматі JSON.
Кожен об'єкт має поля: bank, date, status, metric, value.
Твоє завдання:
- Якщо питання користувача стосується цих даних, знайди відповідний об'єкт і дай точне число з поля "value".
- Якщо даних немає, чітко скажи "Немає даних".
- Не вигадуй значення, використовуй лише те, що є у JSON. Використовуй багато емодзі! 😃 Емодзі всюди, 🌍 емодзі завжди. ♾️`
        },
        { role: "user", content: message },
        { role: "user", content: "Ось дані:\n" + JSON.stringify(data) }
      ]
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Error in /analyze:", err);

    // завжди віддаємо JSON з помилкою, щоб браузер не блокував
    res.status(500).json({ error: err.message });
  }
});

// слухаємо порт із Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});