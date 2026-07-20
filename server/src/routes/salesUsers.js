import { Router } from "express";
import { db } from "../store/db.js";

export const salesUsersRouter = Router();

salesUsersRouter.get("/", (req, res) => {
  res.json(db.salesUsers);
});
