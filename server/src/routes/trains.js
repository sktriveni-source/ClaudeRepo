import { Router } from "express";
import { trains, trainById } from "../data/trains.js";
import { cityById } from "../data/cities.js";
import { getAvailability, getSeatMap } from "../store/db.js";

export const trainsRouter = Router();

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekdayOf(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return WEEKDAYS[d.getDay()];
}

trainsRouter.get("/search", (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({ error: "from, to and date are required" });
  }
  if (!cityById[from] || !cityById[to]) {
    return res.status(400).json({ error: "Unknown city code" });
  }
  if (from === to) {
    return res.status(400).json({ error: "Origin and destination must differ" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
  }

  const weekday = weekdayOf(date);
  const matches = trains
    .filter((t) => t.from === from && t.to === to && t.days.includes(weekday))
    .map((t) => ({
      ...t,
      classes: t.classes.map((c) => ({
        ...c,
        available: getAvailability(t.id, date, c.id),
      })),
    }))
    .sort((a, b) => a.departure.localeCompare(b.departure));

  res.json({
    from: cityById[from],
    to: cityById[to],
    date,
    weekday,
    trains: matches,
  });
});

trainsRouter.get("/:id", (req, res) => {
  const train = trainById[req.params.id];
  if (!train) return res.status(404).json({ error: "Train not found" });
  res.json(train);
});

trainsRouter.get("/:id/seats", (req, res) => {
  const train = trainById[req.params.id];
  if (!train) return res.status(404).json({ error: "Train not found" });

  const { classId, date } = req.query;
  if (!classId || !date) {
    return res.status(400).json({ error: "classId and date are required" });
  }
  const cls = train.classes.find((c) => c.id === classId);
  if (!cls) return res.status(404).json({ error: "Class not found on this train" });

  const seats = getSeatMap(train.id, date, classId);
  res.json({ trainId: train.id, date, classId, seatsPerRow: cls.seatsPerRow, fare: cls.fare, seats });
});
