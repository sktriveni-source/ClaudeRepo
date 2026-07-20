import { ROLES } from "./constants.js";

export const users = [
  {
    id: "USR-1",
    name: "Ava Administrator",
    email: "admin@aiplm.com",
    role: ROLES.ADMIN,
  },
  {
    id: "USR-2",
    name: "Priya Menon",
    email: "pm@aiplm.com",
    role: ROLES.PRODUCT_MANAGER,
  },
  {
    id: "USR-3",
    name: "Ethan Wright",
    email: "engineer@aiplm.com",
    role: ROLES.ENGINEER,
  },
  {
    id: "USR-4",
    name: "Carla Nunez",
    email: "compliance@aiplm.com",
    role: ROLES.COMPLIANCE,
  },
  {
    id: "USR-5",
    name: "Victor Lee",
    email: "viewer@aiplm.com",
    role: ROLES.VIEWER,
  },
];
