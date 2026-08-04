import { Router } from "express";
import { listVendors, createVendor } from "../store/db.js";

export const vendorsRouter = Router();

vendorsRouter.get("/", (req, res) => {
  res.json(listVendors(req.query.type));
});

vendorsRouter.post("/", (req, res) => {
  const { name, type, contactEmail, location } = req.body || {};
  if (!name || !["RAW_MATERIAL", "MANUFACTURING", "BOTH"].includes(type)) {
    return res.status(400).json({
      error: "name and type (RAW_MATERIAL, MANUFACTURING, or BOTH) are required",
    });
  }
  const vendor = createVendor({ name, type, contactEmail, location });
  res.status(201).json(vendor);
});
