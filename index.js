import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/analyze", async (req, res) => {
  try {
    const { message, data } = req.body;

    // Формуємо prompt для моделі
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
- Не вигадуй значення, використовуй лише те, що є у JSON.`
        },
        { role: "user", content: message },
        { role: "user", content: "Ось дані:\n" + JSON.stringify(data) }
      ]
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Backend running on port 3000");
});