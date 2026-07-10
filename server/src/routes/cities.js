import { Router } from "express";
import { cities } from "../data/cities.js";

export const citiesRouter = Router();

citiesRouter.get("/", (req, res) => {
  res.json(cities);
});
