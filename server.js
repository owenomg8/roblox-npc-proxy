require("dotenv").config()
const express = require("express")
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args))
const app = express()
app.use(express.json())

const port = process.env.PORT || 3000
const secretToken = process.env.SECRET_TOKEN || "roblox-npc-secret-123"

app.post("/chat", async (req, res) => {
    const token = req.headers["x-secret-token"]
    if (token !== secretToken) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    const { messages, model } = req.body

    if (!messages || !Array.isArray(messages) || messages.length > 20) {
        return res.status(400).json({ error: "Invalid messages" })
    }

    const sanitized = messages.map(m => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content.slice(0, 300) : ""
    }))

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: model || "gpt-4o-mini",
                messages: sanitized,
                max_tokens: 60,
                temperature: 0.8
            })
        })

        const data = await response.json()

        if (data.error) {
            return res.status(500).json({ error: data.error.message })
        }

        res.json({ reply: data.choices[0].message.content })
    } catch (err) {
        res.status(500).json({ error: "Server error: " + err.message })
    }
})

app.listen(port, () => console.log(`Server running on port ${port}`))
