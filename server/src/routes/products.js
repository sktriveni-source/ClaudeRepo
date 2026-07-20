import { Router } from "express";
import { db } from "../store/db.js";

export const productsRouter = Router();

productsRouter.get("/", (req, res) => {
  res.json(db.products);
});
