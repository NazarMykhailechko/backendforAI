import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.json());

// Ініціалізація OpenAI клієнта
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Кореневий маршрут для перевірки
app.get("/", (req, res) => {
  res.send("Qlik Assistant backend is running 🚀");
});

// Основний маршрут для аналізу
app.post("/analyze", async (req, res) => {
  try {
    const { message, data } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant analyzing Qlik data.",
        },
        {
          role: "user",
          content: `Message: ${message}\nData: ${JSON.stringify(data)}`,
        },
      ],
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});