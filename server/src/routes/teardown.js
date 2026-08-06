import express from "express";
import { SYSTEM_PROMPT } from "../config/systemPrompt.js";

export const teardownRouter = express.Router();

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_IDEA_LENGTH = 4000;

teardownRouter.post("/", async (req, res) => {
  const idea = typeof req.body?.idea === "string" ? req.body.idea.trim() : "";

  if (!idea) {
    return res.status(400).json({ error: "Describe your idea before requesting a teardown." });
  }
  if (idea.length > MAX_IDEA_LENGTH) {
    return res.status(400).json({ error: `Keep your idea under ${MAX_IDEA_LENGTH} characters.` });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "The server is missing an ANTHROPIC_API_KEY. Set it in server/.env and restart the server.",
    });
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: idea }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.error?.message || `Anthropic API request failed (${response.status}).`;
      return res.status(response.status >= 500 ? 502 : response.status).json({ error: message });
    }

    const data = await response.json();
    const teardown = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!teardown) {
      return res.status(502).json({ error: "The model returned an empty response. Try again." });
    }

    res.json({ teardown });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: "Could not reach the Anthropic API. Try again in a moment." });
  }
});
