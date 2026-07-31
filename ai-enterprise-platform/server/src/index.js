import express from "express";
import cors from "cors";
import { plmRouter } from "./routes/plm.js";
import { mdmRouter } from "./routes/mdm.js";
import { crmRouter } from "./routes/crm.js";
import { aiEnabled } from "./ai/aiClient.js";

const app = express();
const PORT = process.env.PORT || 4100;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", aiEnabled: aiEnabled() }));
app.use("/api/plm", plmRouter);
app.use("/api/mdm", mdmRouter);
app.use("/api/crm", crmRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`AI-Enterprise Platform API listening on http://localhost:${PORT}`);
  console.log(`AI features: ${aiEnabled() ? "enabled (claude-opus-5)" : "disabled — using heuristic fallbacks (set ANTHROPIC_API_KEY to enable)"}`);
});
