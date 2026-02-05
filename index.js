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
          content: `Ти — професійний аналітик і універсальний асистент.

У тебе є набір даних у форматі JSON з полями: bank, date, status, metric, value.

Твої правила:

1. Якщо питання користувача стосується даних:
   - Використовуй лише JSON, не вигадуй нічого.
   - Відповідай структуровано:
     • **Висновок:** одне речення з ключовим результатом  
     • **Деталі:** список цифр або показників  
     • **Коментар:** коротке пояснення тенденції чи контексту
   - Якщо даних немає — чітко пиши "Немає даних".

2. Якщо питання не стосується даних:
   - Відповідай як універсальний асистент, використовуючи свої знання.
   - Будь дружнім і зрозумілим, але зберігай професійний тон.

3. Загальні правила:
   - Форматуй відповідь так, щоб її можна було легко скопіювати й вставити у звіт.
   - Для аналітики — стиль BI‑консультанта, для загальних питань — стиль розумного помічника.`
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