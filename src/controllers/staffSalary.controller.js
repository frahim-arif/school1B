
import mongoose from "mongoose";
import Staff from "../models/Staff.js";
import StaffSalary from "../models/StaffSalary.js";

function getPeriod(req) {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  const now = new Date();

  return {
    month: Number.isInteger(month) && month >= 1 && month <= 12
      ? month
      : now.getMonth() + 1,
    year: Number.isInteger(year) && year >= 2000 && year <= 2100
      ? year
      : now.getFullYear(),
  };
}

// GET /api/staff-salaries?month=10&year=2026
export const getStaffSalaries = async (req, res) => {
  try {
    const { month, year } = getPeriod(req);

    const salaries = await StaffSalary.find({ month, year })
      .populate("staff", "firstName lastName staffId designation department phone status")
      .sort({ createdAt: -1 });

    const activeStaff = await Staff.find({ status: "Active" })
      .select("firstName lastName staffId designation department salary status")
      .sort({ firstName: 1 });

    const recordedStaffIds = new Set(
      salaries.map((item) => item.staff?._id?.toString()).filter(Boolean)
    );

    // Active staff without a salary record are shown as Pending.
    const records = salaries.map((item) => ({
      _id: item._id,
      staff: item.staff,
      month: item.month,
      year: item.year,
      amount: item.amount,
      status: item.status,
      paymentDate: item.paymentDate,
      notes: item.notes,
    }));

    for (const employee of activeStaff) {
      if (!recordedStaffIds.has(employee._id.toString())) {
        records.push({
          _id: null,
          staff: employee,
          month,
          year,
          amount: employee.salary || 0,
          status: "Pending",
          paymentDate: null,
          notes: "",
        });
      }
    }

    const total = records.reduce((sum, item) => sum + item.amount, 0);
    const paid = records
      .filter((item) => item.status === "Paid")
      .reduce((sum, item) => sum + item.amount, 0);

    return res.json({
      success: true,
      month,
      year,
      stats: {
        employees: records.length,
        total,
        paid,
        pending: total - paid,
      },
      salaries: records,
    });
  } catch (error) {
    console.error("GET STAFF SALARIES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Salary records load nahi ho sake.",
    });
  }
};

// POST /api/staff-salaries
export const saveStaffSalary = async (req, res) => {
  try {
    const { staffId, month, year, amount, status, notes } = req.body;

    if (!mongoose.isValidObjectId(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Valid staff ID zaroori hai.",
      });
    }

    const parsedMonth = Number(month);
    const parsedYear = Number(year);
    const parsedAmount = Number(amount);

    if (
      !Number.isInteger(parsedMonth) ||
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      !Number.isInteger(parsedYear) ||
      parsedYear < 2000 ||
      parsedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid month aur year select karein.",
      });
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid salary amount enter karein.",
      });
    }

    if (status !== undefined && !["Paid", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status Paid ya Pending hona chahiye.",
      });
    }

    const employee = await Staff.findById(staffId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Staff nahi mila.",
      });
    }

    const resolvedStatus = status || "Pending";

    const salary = await StaffSalary.findOneAndUpdate(
      { staff: staffId, month: parsedMonth, year: parsedYear },
      {
        $set: {
          amount: parsedAmount,
          status: resolvedStatus,
          paymentDate:
            resolvedStatus === "Paid"
              ? new Date()
              : null,
          notes: String(notes || "").trim(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate(
      "staff",
      "firstName lastName staffId designation department phone status"
    );

    return res.status(200).json({
      success: true,
      message: "Salary record save ho gaya.",
      salary,
    });
  } catch (error) {
    console.error("SAVE STAFF SALARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Salary record save nahi ho saka.",
    });
  }
};
