
import express from "express";
import {
  getPublicAdmissionSettings,
  submitApplication,
  getAdmissionDashboard,
  getApplications,
  getApplicationById,
  reviewApplication,
  getAdmissionReports,
} from "../controllers/onlineAdmission.controller.js";

const router = express.Router();

// Public endpoints
router.get("/public/settings", getPublicAdmissionSettings);
router.post("/public/apply", submitApplication);

// Admin endpoints
router.get("/dashboard", getAdmissionDashboard);
router.get("/reports", getAdmissionReports);
router.get("/", getApplications);
router.get("/:id", getApplicationById);
router.patch("/:id/review", reviewApplication);

export default router;
