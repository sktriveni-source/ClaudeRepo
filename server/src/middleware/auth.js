import { listUsers } from "../store/db.js";
import { PERMISSIONS } from "../data/constants.js";

// Demo-grade auth: the "token" is just the user id, issued at login.
// There's no real credential check — this is a role-based access demo,
// not a security boundary — matching the mock-payment-gateway pattern
// used elsewhere in this repo.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token && listUsers().find((u) => u.id === token);
  if (!user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.user = user;
  next();
}

export function requirePermission(action) {
  return (req, res, next) => {
    const allowedRoles = PERMISSIONS[action];
    if (!allowedRoles) {
      return res.status(500).json({ error: `Unknown permission "${action}"` });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Role "${req.user.role}" cannot perform "${action}"` });
    }
    next();
  };
}
