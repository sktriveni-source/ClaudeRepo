import express from "express";
import cors from "cors";
import { leadsRouter } from "./routes/leads.js";
import { accountsRouter } from "./routes/accounts.js";
import { contactsRouter } from "./routes/contacts.js";
import { opportunitiesRouter } from "./routes/opportunities.js";
import { activitiesRouter } from "./routes/activities.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { seedDemoData } from "./data/seed.js";

const app = express();
const PORT = process.env.PORT || 4100;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/leads", leadsRouter);
app.use("/api/accounts", accountsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/opportunities", opportunitiesRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/dashboard", dashboardRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

seedDemoData();

app.listen(PORT, () => {
  console.log(`Sales CRM API listening on http://localhost:${PORT}`);
});
