
import express from "express";

import {
  studentLogin,
  getStudentProfile,
} from "../controllers/studentAuth.controller.js";

import { protectStudent } from "../middleware/studentAuth.middleware.js";

import Student from "../models/Student.js";
import Fee from "../models/Fee.js";
import FeeTransaction from "../models/FeeTransaction.js";

const router = express.Router();

// ========================================
// STUDENT LOGIN
// POST /api/student-auth/login
// ========================================
router.post("/login", studentLogin);

// ========================================
// STUDENT PROFILE
// GET /api/student-auth/profile
// ========================================
router.get("/profile", protectStudent, getStudentProfile);

// ========================================
// STUDENT FEE RECORDS
// GET /api/student-auth/fees
// ========================================
router.get("/fees", protectStudent, async (req, res) => {
  try {
    // Find logged-in student
    const student = await Student.findById(req.student.id).select(
      "admissionNo status"
    );

    if (!student || student.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Student account not found or inactive",
      });
    }

    // Fetch only this student's fee records.
    // Legacy records without studentId are matched by admission number.
    const fees = await Fee.find({
      $or: [
        { studentId: student._id },
        {
          studentId: null,
          admissionNo: student.admissionNo,
        },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Get fee record IDs
    const feeIds = fees.map((fee) => fee._id);

    // Fetch payment transactions
    const transactions = feeIds.length
      ? await FeeTransaction.find({
          feeId: { $in: feeIds },
        })
          .sort({ paymentDate: -1, createdAt: -1 })
          .lean()
      : [];

    // Calculate fee summary
    const summary = fees.reduce(
      (total, fee) => {
        total.totalFee += Number(fee.amount || 0);
        total.paid += Number(fee.paid || 0);
        total.due += Number(fee.due || 0);

        return total;
      },
      {
        totalFee: 0,
        paid: 0,
        due: 0,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Student fee records fetched successfully",
      summary,
      fees: fees.map((fee) => ({
        ...fee,
        class: fee.className,
      })),
      transactions,
    });
  } catch (error) {
    console.error("Student Fees Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch student fee records",
    });
  }
});

export default router;
