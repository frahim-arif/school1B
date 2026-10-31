
import mongoose from "mongoose";
import Staff from "../models/Staff.js";
import SalaryStructure from "../models/SalaryStructure.js";
import PayrollRecord from "../models/PayrollRecord.js";
import PayrollSetting from "../models/PayrollSetting.js";

const validPeriod = (month, year) =>
  Number.isInteger(Number(month)) &&
  Number(month) >= 1 &&
  Number(month) <= 12 &&
  Number.isInteger(Number(year)) &&
  Number(year) >= 2000 &&
  Number(year) <= 2100;

const money = (value) => Math.round(Number(value || 0) * 100) / 100;

const calculateSalary = (structure) => {
  const basicSalary = money(structure.basicSalary);
  const hra = money(structure.hra);
  const bonus = money(structure.bonus);

  const allowances = (structure.allowances || []).map((item) => ({
    name: item.name,
    amount: money(item.amount),
  }));

  const deductions = (structure.deductions || []).map((item) => ({
    name: item.name,
    amount: money(item.amount),
  }));

  const grossSalary = money(
    basicSalary +
      hra +
      bonus +
      allowances.reduce((sum, item) => sum + item.amount, 0)
  );

  const totalDeductions = money(
    deductions.reduce((sum, item) => sum + item.amount, 0)
  );

  return {
    basicSalary,
    hra,
    bonus,
    allowances,
    deductions,
    grossSalary,
    totalDeductions,
    netSalary: money(grossSalary - totalDeductions),
  };
};

const getPeriod = (req) => {
  const now = new Date();
  const month = Number(req.query.month || now.getMonth() + 1);
  const year = Number(req.query.year || now.getFullYear());

  return { month, year };
};

// GET /api/payroll/structures
export const getStructures = async (req, res) => {
  try {
    const structures = await SalaryStructure.find()
      .populate(
        "staff",
        "firstName lastName staffId designation department salary status"
      )
      .sort({ createdAt: -1 });

    res.json({ success: true, structures });
  } catch (error) {
    console.error("GET PAYROLL STRUCTURES:", error);
    res.status(500).json({
      success: false,
      message: "Salary structures load nahi ho sake.",
    });
  }
};

// POST /api/payroll/structures
export const createStructure = async (req, res) => {
  try {
    const {
      staffId,
      basicSalary,
      hra = 0,
      allowances = [],
      deductions = [],
      bonus = 0,
      notes = "",
    } = req.body;

    if (!mongoose.isValidObjectId(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Valid staff ID zaroori hai.",
      });
    }

    if (
      !Number.isFinite(Number(basicSalary)) ||
      Number(basicSalary) < 0 ||
      !Number.isFinite(Number(hra)) ||
      Number(hra) < 0 ||
      !Number.isFinite(Number(bonus)) ||
      Number(bonus) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Salary amounts valid aur non-negative hone chahiye.",
      });
    }

    if (!Array.isArray(allowances) || !Array.isArray(deductions)) {
      return res.status(400).json({
        success: false,
        message: "Allowances aur deductions arrays hone chahiye.",
      });
    }

    const employee = await Staff.findById(staffId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Staff nahi mila.",
      });
    }

    const structure = await SalaryStructure.findOneAndUpdate(
      { staff: staffId },
      {
        $set: {
          basicSalary: money(basicSalary),
          hra: money(hra),
          bonus: money(bonus),
          allowances,
          deductions,
          notes: String(notes).trim(),
          isActive: true,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).populate("staff", "firstName lastName staffId designation department");

    res.status(200).json({
      success: true,
      message: "Salary structure save ho gaya.",
      structure,
    });
  } catch (error) {
    console.error("SAVE SALARY STRUCTURE:", error);

    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Is staff ki salary structure pehle se maujood hai."
          : "Salary structure save nahi ho saka.",
    });
  }
};

// PUT /api/payroll/structures/:id
export const updateStructure = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary structure ID.",
      });
    }

    const allowed = [
      "basicSalary",
      "hra",
      "bonus",
      "allowances",
      "deductions",
      "notes",
      "isActive",
    ];

    const update = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    const structure = await SalaryStructure.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate("staff", "firstName lastName staffId designation department");

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure nahi mila.",
      });
    }

    res.json({
      success: true,
      message: "Salary structure update ho gaya.",
      structure,
    });
  } catch (error) {
    console.error("UPDATE SALARY STRUCTURE:", error);
    res.status(500).json({
      success: false,
      message: "Salary structure update nahi ho saka.",
    });
  }
};

// DELETE /api/payroll/structures/:id
export const deleteStructure = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid salary structure ID.",
      });
    }

    const structure = await SalaryStructure.findByIdAndDelete(req.params.id);

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Salary structure nahi mila.",
      });
    }

    res.json({
      success: true,
      message: "Salary structure delete ho gaya.",
    });
  } catch (error) {
    console.error("DELETE SALARY STRUCTURE:", error);
    res.status(500).json({
      success: false,
      message: "Salary structure delete nahi ho saka.",
    });
  }
};

// GET /api/payroll/staff
export const getPayrollStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ status: "Active" })
      .select("firstName lastName staffId designation department salary status")
      .sort({ firstName: 1 });

    res.json({ success: true, staff });
  } catch (error) {
    console.error("GET PAYROLL STAFF:", error);
    res.status(500).json({
      success: false,
      message: "Staff list load nahi ho saki.",
    });
  }
};

// POST /api/payroll/generate
export const generatePayroll = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!validPeriod(month, year)) {
      return res.status(400).json({
        success: false,
        message: "Valid month aur year select karein.",
      });
    }

    const employees = await Staff.find({ status: "Active" })
      .select("_id firstName lastName staffId salary status");

    const structures = await SalaryStructure.find({ isActive: true });
    const structureMap = new Map(
      structures.map((item) => [item.staff.toString(), item])
    );

    const operations = [];

    for (const employee of employees) {
      const structure = structureMap.get(employee._id.toString());

      // Use the existing Staff.salary value as a fallback.
      const salary = structure
        ? calculateSalary(structure)
        : {
            basicSalary: money(employee.salary || 0),
            hra: 0,
            bonus: 0,
            allowances: [],
            deductions: [],
            grossSalary: money(employee.salary || 0),
            totalDeductions: 0,
            netSalary: money(employee.salary || 0),
          };

      operations.push({
        updateOne: {
          filter: {
            staff: employee._id,
            month: Number(month),
            year: Number(year),
          },
          update: {
            $setOnInsert: {
              staff: employee._id,
              month: Number(month),
              year: Number(year),
              ...salary,
              status: "Pending",
              paymentDate: null,
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length) {
      await PayrollRecord.bulkWrite(operations);
    }

    const records = await PayrollRecord.find({
      month: Number(month),
      year: Number(year),
    }).populate(
      "staff",
      "firstName lastName staffId designation department status"
    );

    res.json({
      success: true,
      message: "Payroll generate ho gaya. Existing records preserve kiye gaye.",
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("GENERATE PAYROLL:", error);
    res.status(500).json({
      success: false,
      message: "Payroll generate nahi ho saka.",
    });
  }
};

// GET /api/payroll/records?month=10&year=2026
export const getPayrollRecords = async (req, res) => {
  try {
    const { month, year } = getPeriod(req);

    if (!validPeriod(month, year)) {
      return res.status(400).json({
        success: false,
        message: "Valid month aur year required hain.",
      });
    }

    const records = await PayrollRecord.find({ month, year })
      .populate(
        "staff",
        "firstName lastName staffId designation department status"
      )
      .sort({ createdAt: -1 });

    const totalGross = records.reduce(
      (sum, item) => sum + item.grossSalary,
      0
    );
    const totalNet = records.reduce(
      (sum, item) => sum + item.netSalary,
      0
    );
    const paid = records
      .filter((item) => item.status === "Paid")
      .reduce((sum, item) => sum + item.netSalary, 0);

    res.json({
      success: true,
      month,
      year,
      stats: {
        employees: records.length,
        totalGross: money(totalGross),
        totalNet: money(totalNet),
        paid: money(paid),
        pending: money(totalNet - paid),
      },
      records,
    });
  } catch (error) {
    console.error("GET PAYROLL RECORDS:", error);
    res.status(500).json({
      success: false,
      message: "Payroll records load nahi ho sake.",
    });
  }
};

// PATCH /api/payroll/records/:id/payment
export const updatePayrollPayment = async (req, res) => {
  try {
    const { status, paymentMethod, paymentReference, notes } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll record ID.",
      });
    }

    if (!["Paid", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status Paid ya Pending hona chahiye.",
      });
    }

    const allowedMethods = [
      "Bank Transfer",
      "Cash",
      "Cheque",
      "Other",
    ];

    if (
      paymentMethod !== undefined &&
      !allowedMethods.includes(paymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    const update = {
      status,
      paymentDate: status === "Paid" ? new Date() : null,
    };

    if (paymentMethod !== undefined) update.paymentMethod = paymentMethod;
    if (paymentReference !== undefined) {
      update.paymentReference = String(paymentReference).trim();
    }
    if (notes !== undefined) update.notes = String(notes).trim();

    const record = await PayrollRecord.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true }
    ).populate(
      "staff",
      "firstName lastName staffId designation department"
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Payroll record nahi mila.",
      });
    }

    res.json({
      success: true,
      message:
        status === "Paid"
          ? "Payment status Paid mark hua. Yeh external bank transfer nahi karta."
          : "Payment status Pending kar diya gaya.",
      record,
    });
  } catch (error) {
    console.error("UPDATE PAYROLL PAYMENT:", error);
    res.status(500).json({
      success: false,
      message: "Payment record update nahi ho saka.",
    });
  }
};

// GET /api/payroll/slips/:id
export const getSalarySlip = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payroll record ID.",
      });
    }

    const record = await PayrollRecord.findById(req.params.id).populate(
      "staff",
      "firstName lastName staffId designation department phone"
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Salary slip record nahi mila.",
      });
    }

    res.json({ success: true, slip: record });
  } catch (error) {
    console.error("GET SALARY SLIP:", error);
    res.status(500).json({
      success: false,
      message: "Salary slip load nahi ho saki.",
    });
  }
};

// GET /api/payroll/reports?year=2026
export const getPayrollReports = async (req, res) => {
  try {
    const year = Number(req.query.year);

    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: "Valid year select karein.",
      });
    }

    const report = await PayrollRecord.aggregate([
      { $match: { year } },
      {
        $group: {
          _id: "$month",
          employees: { $sum: 1 },
          grossSalary: { $sum: "$grossSalary" },
          netSalary: { $sum: "$netSalary" },
          paid: {
            $sum: {
              $cond: [{ $eq: ["$status", "Paid"] }, "$netSalary", 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "Pending"] }, "$netSalary", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      year,
      reports: report.map((item) => ({
        month: item._id,
        employees: item.employees,
        grossSalary: money(item.grossSalary),
        netSalary: money(item.netSalary),
        paid: money(item.paid),
        pending: money(item.pending),
      })),
    });
  } catch (error) {
    console.error("GET PAYROLL REPORTS:", error);
    res.status(500).json({
      success: false,
      message: "Payroll report load nahi ho saki.",
    });
  }
};

// GET /api/payroll/settings
export const getPayrollSettings = async (req, res) => {
  try {
    let settings = await PayrollSetting.findOne();

    if (!settings) {
      settings = await PayrollSetting.create({});
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error("GET PAYROLL SETTINGS:", error);
    res.status(500).json({
      success: false,
      message: "Payroll settings load nahi ho sakin.",
    });
  }
};

// PUT /api/payroll/settings
export const updatePayrollSettings = async (req, res) => {
  try {
    const { name, currency, payDay, defaultPaymentMethod, notes } = req.body;

    if (
      payDay !== undefined &&
      (!Number.isInteger(Number(payDay)) ||
        Number(payDay) < 1 ||
        Number(payDay) > 28)
    ) {
      return res.status(400).json({
        success: false,
        message: "Pay day 1 se 28 ke beech hona chahiye.",
      });
    }

    const allowedMethods = [
      "Bank Transfer",
      "Cash",
      "Cheque",
      "Other",
    ];

    if (
      defaultPaymentMethod !== undefined &&
      !allowedMethods.includes(defaultPaymentMethod)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid default payment method.",
      });
    }

    const update = {};
    if (name !== undefined) update.name = String(name).trim();
    if (currency !== undefined) update.currency = String(currency).trim();
    if (payDay !== undefined) update.payDay = Number(payDay);
    if (defaultPaymentMethod !== undefined) {
      update.defaultPaymentMethod = defaultPaymentMethod;
    }
    if (notes !== undefined) update.notes = String(notes).trim();

    const settings = await PayrollSetting.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Payroll settings save ho gayi.",
      settings,
    });
  } catch (error) {
    console.error("UPDATE PAYROLL SETTINGS:", error);
    res.status(500).json({
      success: false,
      message: "Payroll settings save nahi ho sakin.",
    });
  }
};
