import express from "express";
import cors from "cors";
import { citiesRouter } from "./routes/cities.js";
import { trainsRouter } from "./routes/trains.js";
import { bookingsRouter } from "./routes/bookings.js";
import { sweepExpiredHolds } from "./store/db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/cities", citiesRouter);
app.use("/api/trains", trainsRouter);
app.use("/api/bookings", bookingsRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// Periodically release seat holds whose 5 minute payment window has lapsed.
setInterval(sweepExpiredHolds, 30 * 1000);

app.listen(PORT, () => {
  console.log(`Train schedule API listening on http://localhost:${PORT}`);
});
