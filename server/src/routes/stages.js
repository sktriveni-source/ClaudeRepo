import { Router } from "express";
import { STAGES } from "../data/stages.js";

export const stagesRouter = Router();

stagesRouter.get("/", (req, res) => {
  res.json(STAGES);
});
