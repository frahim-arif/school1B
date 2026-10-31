
import express from "express";
import {
  getStaffSalaries,
  saveStaffSalary,
} from "../controllers/staffSalary.controller.js";

const router = express.Router();

router.get("/", getStaffSalaries);
router.post("/", saveStaffSalary);

export default router;
