
import express from "express";

import {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deactivateStaff,
} from "../controllers/staff.controller.js";

const router = express.Router();

// GET: Saare staff ki list
router.get("/", getStaff);

// POST: Naya staff add karna
router.post("/", createStaff);

// GET: ID se staff ki details
router.get("/:id", getStaffById);

// PATCH: Staff details update karna
router.patch("/:id", updateStaff);

// DELETE: Staff ko Inactive karna
router.delete("/:id", deactivateStaff);

export default router;
