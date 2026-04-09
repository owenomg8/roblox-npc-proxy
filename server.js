require("dotenv").config();
const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: f }) => f(...args));

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Simple token so only your Roblox game can use this server
const SECRET_TOKEN = "roblox-npc-secret-123"; // change this to anything you want

app.post("/chat", async (req, res) => {
  // Verify the request is from your game
  const token = req.headers["x-secret-token"];
  if (token !== SECRET_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { messages } = req.body;
  if (!messages) {
    return res.status(400).json({ error: "Missing messages" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 120,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));