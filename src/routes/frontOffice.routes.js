
import express from "express";

import {
  getEnquiries,
  getEnquiryStats,
  getEnquiryById,
  createEnquiry,
  updateEnquiry,
  deleteEnquiry,
} from "../controllers/frontOffice.controller.js";

import {
  visitorController,
  callLogController,
  postalRecordController,
  complaintController,
  getFrontOfficeSettings,
  updateFrontOfficeSettings,
} from "../controllers/frontOfficeExtra.controller.js";

const router = express.Router();

// Existing Admission Enquiry routes
router.get("/enquiries/stats", getEnquiryStats);
router.get("/enquiries", getEnquiries);
router.post("/enquiries", createEnquiry);
router.get("/enquiries/:id", getEnquiryById);
router.put("/enquiries/:id", updateEnquiry);
router.delete("/enquiries/:id", deleteEnquiry);

// Visitor Book
router.get("/visitors/stats", visitorController.getStats);
router.get("/visitors", visitorController.getList);
router.post("/visitors", visitorController.create);
router.get("/visitors/:id", visitorController.getOne);
router.put("/visitors/:id", visitorController.update);
router.delete("/visitors/:id", visitorController.remove);

// Phone Call Log
router.get("/calls/stats", callLogController.getStats);
router.get("/calls", callLogController.getList);
router.post("/calls", callLogController.create);
router.get("/calls/:id", callLogController.getOne);
router.put("/calls/:id", callLogController.update);
router.delete("/calls/:id", callLogController.remove);

// Postal / Dispatch Records
router.get("/postal-records/stats", postalRecordController.getStats);
router.get("/postal-records", postalRecordController.getList);
router.post("/postal-records", postalRecordController.create);
router.get("/postal-records/:id", postalRecordController.getOne);
router.put("/postal-records/:id", postalRecordController.update);
router.delete("/postal-records/:id", postalRecordController.remove);

// Complaints
router.get("/complaints/stats", complaintController.getStats);
router.get("/complaints", complaintController.getList);
router.post("/complaints", complaintController.create);
router.get("/complaints/:id", complaintController.getOne);
router.put("/complaints/:id", complaintController.update);
router.delete("/complaints/:id", complaintController.remove);

// Front Office Settings
router.get("/settings", getFrontOfficeSettings);
router.put("/settings", updateFrontOfficeSettings);

export default router;
