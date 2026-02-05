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

Правила:
1. Якщо питання стосується даних (згадуються bank, date, status, metric, value або бізнес‑показники):
   - Використовуй лише JSON.
   - Відповідай структуровано:
     • **Висновок**  
     • **Деталі**  
     • **Коментар**
   - Якщо даних немає — пиши "Немає даних".

2. Якщо питання НЕ стосується даних:
   - Відповідай як універсальний асистент.  
   - НЕ згадуй JSON і НЕ пропонуй перейти до даних.  
   - Будь дружнім і зрозумілим.

3. Загальні правила:
   - Для аналітики — стиль BI‑консультанта.  
   - Для загальних питань — стиль розумного помічника.`
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