import express from "express";
import cors from "cors";

import dataSourcesRouter from "./routes/dataSources.js";
import recordsRouter from "./routes/records.js";
import profilingRouter from "./routes/profiling.js";
import rulesRouter from "./routes/rules.js";
import validationRouter from "./routes/validation.js";
import duplicatesRouter from "./routes/duplicates.js";
import issuesRouter from "./routes/issues.js";
import approvalsRouter from "./routes/approvals.js";
import qualityRouter from "./routes/quality.js";
import dashboardRouter from "./routes/dashboard.js";
import aiRouter from "./routes/ai.js";

import { DOMAINS, getAuditLog } from "./store/db.js";
import { runAllValidations } from "./services/validation.js";
import { detectDuplicates } from "./services/duplicateDetection.js";
import { detectAnomalies } from "./services/anomalyDetection.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "mdm-server" }));
app.get("/api/audit-log", (req, res) => res.json(getAuditLog(Number(req.query.limit) || 50)));

app.use("/api/data-sources", dataSourcesRouter);
app.use("/api/records", recordsRouter);
app.use("/api/profiling", profilingRouter);
app.use("/api/rules", rulesRouter);
app.use("/api/validation", validationRouter);
app.use("/api/duplicates", duplicatesRouter);
app.use("/api/issues", issuesRouter);
app.use("/api/approvals", approvalsRouter);
app.use("/api/quality-scores", qualityRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Run an initial profiling/validation/duplicate/anomaly pass on boot so the
// dashboard and issue queue are populated the moment the app starts, the way
// a platform that's been syncing on a schedule would already have findings.
function seedInitialFindings() {
  runAllValidations();
  for (const domain of DOMAINS) {
    detectDuplicates(domain);
    detectAnomalies(domain);
  }
}
seedInitialFindings();

app.listen(PORT, () => {
  console.log(`MDM server listening on http://localhost:${PORT}`);
});
