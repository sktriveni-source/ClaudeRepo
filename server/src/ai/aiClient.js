import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";
const apiKey = process.env.ANTHROPIC_API_KEY;
const client = apiKey ? new Anthropic({ apiKey }) : null;

export function aiEnabled() {
  return Boolean(client);
}

/**
 * Calls Claude Opus 5 for a short, structured text response. Thinking is
 * disabled since these are quick classification/extraction/summarization
 * calls with no tool use, so a fast plain response is preferable to the
 * default adaptive-thinking latency.
 */
export async function generateText({ system, prompt, maxTokens = 1024 }) {
  if (!client) {
    throw new Error("AI client not configured (no ANTHROPIC_API_KEY)");
  }
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    thinking: { type: "disabled" },
    output_config: { effort: "low" },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("AI request was declined");
  }
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

/** Best-effort JSON parse of a model response that may be wrapped in prose or fences. */
export function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const arrStart = candidate.indexOf("[");
  const useArray = arrStart !== -1 && (start === -1 || arrStart < start);
  const openChar = useArray ? "[" : "{";
  const closeChar = useArray ? "]" : "}";
  const from = useArray ? arrStart : start;
  if (from === -1) return null;
  let depth = 0;
  for (let i = from; i < candidate.length; i++) {
    if (candidate[i] === openChar) depth++;
    if (candidate[i] === closeChar) depth--;
    if (depth === 0) {
      try {
        return JSON.parse(candidate.slice(from, i + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Runs an AI-backed generator with a deterministic heuristic fallback, so the
 * platform is fully functional without an ANTHROPIC_API_KEY configured.
 */
export async function withAiFallback(aiFn, fallbackFn) {
  if (!aiEnabled()) {
    return { ...fallbackFn(), source: "heuristic" };
  }
  try {
    const result = await aiFn();
    return { ...result, source: "claude-opus-5" };
  } catch (err) {
    console.error("AI generation failed, falling back to heuristic:", err.message);
    return { ...fallbackFn(), source: "heuristic-fallback" };
  }
}
