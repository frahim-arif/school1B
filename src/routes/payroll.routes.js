
import express from "express";
import {
  getStructures,
  createStructure,
  updateStructure,
  deleteStructure,
  getPayrollStaff,
  generatePayroll,
  getPayrollRecords,
  updatePayrollPayment,
  getSalarySlip,
  getPayrollReports,
  getPayrollSettings,
  updatePayrollSettings,
} from "../controllers/payroll.controller.js";

const router = express.Router();

router.get("/staff", getPayrollStaff);

router.get("/structures", getStructures);
router.post("/structures", createStructure);
router.put("/structures/:id", updateStructure);
router.delete("/structures/:id", deleteStructure);

router.post("/generate", generatePayroll);
router.get("/records", getPayrollRecords);
router.patch("/records/:id/payment", updatePayrollPayment);
router.get("/slips/:id", getSalarySlip);

router.get("/reports", getPayrollReports);
router.get("/settings", getPayrollSettings);
router.put("/settings", updatePayrollSettings);

export default router;
