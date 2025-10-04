import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.text({ type: 'application/sdp' }));
app.use(express.text({ type: 'text/plain' }));
app.use(express.json());

const apiKey = process.env.OPENAI_API_KEY;

// Serve static files from dist/client
app.use(express.static(path.join(__dirname, '../dist/client')));

// Match the original console pattern - minimal config for ephemeral token
const sessionConfig = JSON.stringify({
  session: {
    type: "realtime",
    model: "gpt-realtime",
    audio: {
      output: {
        voice: "shimmer", // Female voice for female avatar
      },
    },
  },
});

// All-in-one SDP request (experimental)
app.post("/session", async (req, res) => {
  try {
    console.log("Received SDP offer from client, length:", req.body?.length);

    const fd = new FormData();
    fd.set("sdp", req.body);
    fd.set("session", sessionConfig);

    console.log("Sending SDP to OpenAI /realtime/calls...");
    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        "OpenAI-Beta": "realtime=v1",
        Authorization: `Bearer ${apiKey}`,
      },
      body: fd,
    });

    console.log("OpenAI response status:", r.status);
    const sdp = await r.text();
    console.log("OpenAI SDP response length:", sdp.length);

    res.send(sdp);
  } catch (error) {
    console.error("Error in /session endpoint:", error);
    res.status(500).send("Server error: " + error.message);
  }
});

// API route for ephemeral token generation
app.get("/token", async (req, res) => {
  try {
    console.log("Requesting ephemeral token...");

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: sessionConfig,
      },
    );

    console.log("OpenAI response status:", response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Failed to generate token",
        details: data
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: "Failed to generate token", details: error.message });
  }
});

// Serve index.html for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/client/index.html'));
});

export default app;
