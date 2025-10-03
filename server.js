import express from "express";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import "dotenv/config";

const app = express();
app.use(express.text({ type: 'application/sdp' }));
app.use(express.text({ type: 'text/plain' }));
const port = process.env.PORT || 3000;
const apiKey = process.env.OPENAI_API_KEY;

// Debug: Check if API key is loaded
if (!apiKey) {
  console.error("ERROR: OPENAI_API_KEY not found in environment variables!");
  console.error("Make sure you have a .env file with OPENAI_API_KEY set");
} else {
  console.log("API Key loaded:", apiKey.substring(0, 20) + "...");
}

// Configure Vite middleware for React client
const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: "custom",
});
app.use(vite.middlewares);

// Match the original console pattern - minimal config for ephemeral token
const sessionConfig = JSON.stringify({
  session: {
    type: "realtime",
    model: "gpt-realtime",
    audio: {
      output: {
        voice: "alloy",
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
    console.log("First 200 chars:", sdp.substring(0, 200));

    // Send back the SDP we received from the OpenAI REST API
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
    console.log("Using API key:", apiKey?.substring(0, 20) + "...");

    // Use the client_secrets endpoint like the original console
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
    console.log("OpenAI response data:", JSON.stringify(data, null, 2));

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

// Render the React client
app.use("*", async (req, res, next) => {
  const url = req.originalUrl;

  try {
    const template = await vite.transformIndexHtml(
      url,
      fs.readFileSync("./client/index.html", "utf-8"),
    );
    const { render } = await vite.ssrLoadModule("./client/entry-server.jsx");
    const appHtml = await render(url);
    const html = template.replace(`<!--ssr-outlet-->`, appHtml?.html);
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite.ssrFixStacktrace(e);
    next(e);
  }
});

app.listen(port, () => {
  console.log(`Express server running on *:${port}`);
});
