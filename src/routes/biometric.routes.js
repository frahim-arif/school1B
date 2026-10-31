import express from "express";
import {
  getBiometricLogs,
  createBiometricLog,
} from "../controllers/biometric.controller.js";

const router = express.Router();

router.get("/", getBiometricLogs);
router.post("/", createBiometricLog);

export default router;