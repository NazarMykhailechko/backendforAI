import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import cors from "cors";

const app = express();
app.use(bodyParser.json());

// Дозволяємо CORS для всіх доменів
app.use(cors());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Qlik Assistant backend is running 🚀");
});

app.post("/analyze", async (req, res) => {
  try {
    const { message, data } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: "You are a helpful assistant for Qlik users." },
        { role: "user", content: message }
      ]
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});