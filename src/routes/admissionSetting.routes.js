
import express from "express";
import {
  getAdmissionSettings,
  saveAdmissionSettings,
  deleteAdmissionSettings,
} from "../controllers/admissionSetting.controller.js";

const router = express.Router();

router.get("/", getAdmissionSettings);
router.post("/", saveAdmissionSettings);
router.put("/:id", saveAdmissionSettings);
router.delete("/:id", deleteAdmissionSettings);

export default router;
