import { Router } from "express";
import { db, nextId, recordAudit } from "../store/db.js";

export const contactsRouter = Router();

contactsRouter.get("/", (req, res) => {
  let list = db.contacts;
  const { accountId, q } = req.query;
  if (accountId) list = list.filter((c) => c.accountId === accountId);
  if (q) {
    const term = q.toLowerCase();
    list = list.filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(term));
  }
  const withAccount = list.map((c) => ({
    ...c,
    accountName: db.accounts.find((a) => a.accountId === c.accountId)?.accountName || "",
  }));
  res.json(withAccount);
});

contactsRouter.get("/:id", (req, res) => {
  const contact = db.contacts.find((c) => c.contactId === req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

contactsRouter.post("/", (req, res) => {
  const contact = {
    contactId: nextId("C"),
    accountId: req.body.accountId,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    jobTitle: req.body.jobTitle || "",
    email: req.body.email || "",
    phone: req.body.phone || "",
    department: req.body.department || "",
    decisionMakingRole: req.body.decisionMakingRole || "Influencer",
  };
  db.contacts.push(contact);
  recordAudit({ entityType: "Contact", entityId: contact.contactId, action: "Create", newValue: `${contact.firstName} ${contact.lastName}` });
  res.status(201).json(contact);
});

contactsRouter.put("/:id", (req, res) => {
  const contact = db.contacts.find((c) => c.contactId === req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  Object.assign(contact, req.body, { contactId: contact.contactId });
  res.json(contact);
});
