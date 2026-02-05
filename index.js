import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Використовуємо змінну середовища для ключа
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post("/analyze", async (req, res) => {
  const { message, data } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // можна замінити на іншу модель
        messages: [
          { role: "system", content: "Ти асистент для аналізу даних з Qlik Sense." },
          { role: "user", content: `Повідомлення: ${message}\nДані: ${JSON.stringify(data)}` }
        ]
      })
    });

    const result = await response.json();
    res.json({ answer: result.choices[0].message.content });
  } catch (err) {
    console.error("API error:", err);
    res.status(500).json({ error: "Помилка при виклику OpenAI API" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));