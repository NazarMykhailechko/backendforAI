import express from "express";
import cors from "cors";
import OpenAI from "openai";
import WebSocket from "ws";   // ✅ додали для роботи з Qlik Engine API

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

// ✅ новий маршрут для отримання iframe-URL з Qlik
app.get("/objects", (req, res) => {
  const appId = "a390468b-1485-4d0e-8aab-94520946a80c"; // твій appid
  const qlikServer = "bi_qlik.accordbank.com.ua";
  const ticket = req.query.ticket; // передаємо qlikTicket через параметр

  const ws = new WebSocket(`wss://${qlikServer}/app/${appId}?qlikTicket=${ticket}`);

  ws.on("open", () => {
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "GetObjects",
      handle: -1,
      params: [{ qTypes: ["chart", "table", "pivot", "filterpane", "kpi"] }]
    };
    ws.send(JSON.stringify(request));
  });

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    if (data.result) {
      const objects = data.result.qList.map(obj => {
        const objId = obj.qInfo.qId;
        const title = obj.qMeta.title;
        const iframeUrl = `https://${qlikServer}/single/?appid=${appId}&obj=${objId}&theme=sense&opt=ctxmenu,currsel`;
        return { title, iframeUrl };
      });
      res.json(objects);
      ws.close();
    }
  });

  ws.on("error", (err) => {
    console.error("Qlik Engine API error:", err);
    res.status(500).json({ error: err.message });
  });
});

// твій існуючий маршрут /analyze лишаємо без змін
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

// слухаємо порт із Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});