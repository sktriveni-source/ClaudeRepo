import { CLASS_DEFS } from "./classes.js";

// Approximate rail distance (km) between each unordered city pair.
const ROUTE_DISTANCES = {
  "BLR-BOM": 980,
  "BLR-DEL": 2150,
  "BLR-MAA": 350,
  "BOM-DEL": 1400,
  "BOM-MAA": 1300,
  "DEL-MAA": 2180,
};

function distanceBetween(a, b) {
  const key = [a, b].sort().join("-");
  const distance = ROUTE_DISTANCES[key];
  if (!distance) throw new Error(`No distance configured for ${a}-${b}`);
  return distance;
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatClock(totalMinutesFromMidnight) {
  const m = ((totalMinutesFromMidnight % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

let autoId = 1;

function buildTrain({ number, name, from, to, departure, speedKmh, days }) {
  const distanceKm = distanceBetween(from, to);
  const durationMinutes = Math.round((distanceKm / speedKmh) * 60 / 5) * 5;
  const departMinutes = toMinutes(departure);
  const arrivalMinutes = departMinutes + durationMinutes;
  const dayOffset = Math.floor(arrivalMinutes / 1440);

  const classes = CLASS_DEFS.map((cls) => ({
    id: cls.id,
    label: cls.label,
    coach: cls.coach,
    totalSeats: cls.totalSeats,
    seatsPerRow: cls.seatsPerRow,
    fare: Math.round((distanceKm * cls.ratePerKm) / 5) * 5,
  }));

  return {
    id: `TRN-${autoId++}`,
    number,
    name,
    from,
    to,
    departure,
    arrival: formatClock(arrivalMinutes),
    arrivalDayOffset: dayOffset,
    durationMinutes,
    duration: formatDuration(durationMinutes),
    distanceKm,
    days,
    classes,
  };
}

export const trains = [
  // Bangalore <-> Mumbai
  buildTrain({ number: "16590", name: "Udyan Express", from: "BLR", to: "BOM", departure: "22:00", speedKmh: 48, days: ALL_DAYS }),
  buildTrain({ number: "17311", name: "Karnataka Sampark Kranti", from: "BLR", to: "BOM", departure: "06:30", speedKmh: 55, days: ["Mon", "Wed", "Fri", "Sun"] }),
  buildTrain({ number: "16589", name: "Udyan Express", from: "BOM", to: "BLR", departure: "20:15", speedKmh: 48, days: ALL_DAYS }),
  buildTrain({ number: "17312", name: "Karnataka Sampark Kranti", from: "BOM", to: "BLR", departure: "09:00", speedKmh: 55, days: ["Tue", "Thu", "Sat", "Sun"] }),

  // Bangalore <-> Delhi
  buildTrain({ number: "22691", name: "Karnataka Rajdhani Express", from: "BLR", to: "DEL", departure: "20:00", speedKmh: 68, days: ["Mon", "Wed", "Thu", "Sat"] }),
  buildTrain({ number: "12629", name: "Sampark Kranti Express", from: "BLR", to: "DEL", departure: "06:00", speedKmh: 55, days: ALL_DAYS }),
  buildTrain({ number: "22692", name: "Karnataka Rajdhani Express", from: "DEL", to: "BLR", departure: "08:15", speedKmh: 68, days: ["Tue", "Thu", "Fri", "Sun"] }),
  buildTrain({ number: "12630", name: "Sampark Kranti Express", from: "DEL", to: "BLR", departure: "15:30", speedKmh: 55, days: ALL_DAYS }),

  // Bangalore <-> Chennai
  buildTrain({ number: "12639", name: "Brindavan Express", from: "BLR", to: "MAA", departure: "07:50", speedKmh: 50, days: ALL_DAYS }),
  buildTrain({ number: "12607", name: "Lalbagh Express", from: "BLR", to: "MAA", departure: "17:20", speedKmh: 52, days: ALL_DAYS }),
  buildTrain({ number: "12640", name: "Brindavan Express", from: "MAA", to: "BLR", departure: "14:50", speedKmh: 50, days: ALL_DAYS }),
  buildTrain({ number: "12608", name: "Lalbagh Express", from: "MAA", to: "BLR", departure: "06:30", speedKmh: 52, days: ALL_DAYS }),

  // Mumbai <-> Delhi
  buildTrain({ number: "12951", name: "Mumbai Rajdhani Express", from: "BOM", to: "DEL", departure: "16:35", speedKmh: 70, days: ALL_DAYS }),
  buildTrain({ number: "12925", name: "Paschim Express", from: "BOM", to: "DEL", departure: "11:35", speedKmh: 55, days: ALL_DAYS }),
  buildTrain({ number: "12952", name: "Mumbai Rajdhani Express", from: "DEL", to: "BOM", departure: "16:00", speedKmh: 70, days: ALL_DAYS }),
  buildTrain({ number: "12926", name: "Paschim Express", from: "DEL", to: "BOM", departure: "23:50", speedKmh: 55, days: ALL_DAYS }),

  // Mumbai <-> Chennai
  buildTrain({ number: "11042", name: "Chennai Express", from: "BOM", to: "MAA", departure: "23:45", speedKmh: 52, days: ALL_DAYS }),
  buildTrain({ number: "12163", name: "Mumbai Mail", from: "BOM", to: "MAA", departure: "21:30", speedKmh: 50, days: ALL_DAYS }),
  buildTrain({ number: "11041", name: "Chennai Express", from: "MAA", to: "BOM", departure: "06:00", speedKmh: 52, days: ALL_DAYS }),
  buildTrain({ number: "12164", name: "Mumbai Mail", from: "MAA", to: "BOM", departure: "11:45", speedKmh: 50, days: ALL_DAYS }),

  // Delhi <-> Chennai
  buildTrain({ number: "12615", name: "Grand Trunk Express", from: "DEL", to: "MAA", departure: "18:10", speedKmh: 55, days: ALL_DAYS }),
  buildTrain({ number: "12621", name: "Tamil Nadu Express", from: "DEL", to: "MAA", departure: "22:30", speedKmh: 62, days: ALL_DAYS }),
  buildTrain({ number: "12616", name: "Grand Trunk Express", from: "MAA", to: "DEL", departure: "19:15", speedKmh: 55, days: ALL_DAYS }),
  buildTrain({ number: "12622", name: "Tamil Nadu Express", from: "MAA", to: "DEL", departure: "06:15", speedKmh: 62, days: ALL_DAYS }),
];

export const trainById = Object.fromEntries(trains.map((t) => [t.id, t]));
