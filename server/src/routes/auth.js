import { Router } from "express";
import { listUsers, findUserByEmail } from "../store/db.js";
import { requireAuth } from "../middleware/auth.js";
import { ROLE_LABELS } from "../data/constants.js";

export const authRouter = Router();

authRouter.get("/users", (req, res) => {
  res.json(listUsers().map((u) => ({ ...u, roleLabel: ROLE_LABELS[u.role] })));
});

authRouter.post("/login", (req, res) => {
  const { email } = req.body || {};
  const user = email && findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "Unknown user email" });
  }
  res.json({ token: user.id, user: { ...user, roleLabel: ROLE_LABELS[user.role] } });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ ...req.user, roleLabel: ROLE_LABELS[req.user.role] });
});
