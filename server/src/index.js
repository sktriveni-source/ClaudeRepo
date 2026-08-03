import express from "express";
import cors from "cors";
import { productsRouter } from "./routes/products.js";
import { approvalsRouter } from "./routes/approvals.js";
import { stagesRouter } from "./routes/stages.js";
import { listAuditLog } from "./store/db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/products", productsRouter);
app.use("/api/stage-requests", approvalsRouter);
app.use("/api/stages", stagesRouter);
app.get("/api/audit", (req, res) => res.json(listAuditLog()));

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Product Lifecycle Management API listening on http://localhost:${PORT}`);
});
