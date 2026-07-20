import express from "express";
import cors from "cors";
import { accountsRouter } from "./routes/accounts.js";
import { contactsRouter } from "./routes/contacts.js";
import { leadsRouter } from "./routes/leads.js";
import { opportunitiesRouter } from "./routes/opportunities.js";
import { activitiesRouter } from "./routes/activities.js";
import { productsRouter } from "./routes/products.js";
import { salesUsersRouter } from "./routes/salesUsers.js";
import { salesTargetsRouter } from "./routes/salesTargets.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { aiRouter } from "./routes/ai.js";
import { auditRouter } from "./routes/audit.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/accounts", accountsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/products", productsRouter);
app.use("/api/sales-users", salesUsersRouter);
app.use("/api/sales-targets", salesTargetsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/ai", aiRouter);
app.use("/api/audit", auditRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`AI-CRM API listening on http://localhost:${PORT}`);
});
