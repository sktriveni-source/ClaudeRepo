import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { documentsRouter } from "./routes/documents.js";
import { changeRequestsRouter } from "./routes/changeRequests.js";
import { auditRouter } from "./routes/audit.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { aiRouter } from "./routes/ai.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/change-requests", changeRequestsRouter);
app.use("/api/audit", auditRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`AI-PLM API listening on http://localhost:${PORT}`);
});
