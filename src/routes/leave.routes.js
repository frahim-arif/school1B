
import express from "express";

import {
  createLeave,
  getLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave,
} from "../controllers/leave.controller.js";

const router = express.Router();

router.post("/", createLeave);
router.get("/", getLeaves);
router.get("/:id", getLeaveById);
router.patch("/:id/status", updateLeaveStatus);
router.delete("/:id", deleteLeave);

export default router;
