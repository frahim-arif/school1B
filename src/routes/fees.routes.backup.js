
import express from "express";
import mongoose from "mongoose";
import Fee from "../models/Fee.js";
import FeeTransaction from "../models/FeeTransaction.js";

const router = express.Router();

const ALLOWED_METHODS = [
  "Cash",
  "UPI",
  "Card",
  "Bank Transfer",
  "Other",
];

function makeReceiptNumber() {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RCPT-${datePart}-${randomPart}`;
}

function getPaymentStatus(amount, paid) {
  if (paid <= 0) return "Pending";
  if (paid >= amount) return "Paid";
  return "Partial";
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getLocalDayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function parsePaymentDate(value) {
  if (!value) return new Date();

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value));

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function buildFeeFilter(query = {}) {
  const filter = {};
  const search = String(query.search || "").trim();
  const className = String(query.className || "").trim();
  const status = String(query.status || "").trim();

  if (className) filter.className = className;

  if (["Paid", "Partial", "Pending"].includes(status)) {
    filter.status = status;
  }

  if (query.from || query.to) {
    filter.createdAt = {};

    if (query.from) {
      const from = new Date(query.from);

      if (Number.isNaN(from.getTime())) {
        throw new Error("Invalid from date.");
      }

      from.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = from;
    }

    if (query.to) {
      const to = new Date(query.to);

      if (Number.isNaN(to.getTime())) {
        throw new Error("Invalid to date.");
      }

      to.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = to;
    }
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { receipt: regex },
      { student: regex },
      { admissionNo: regex },
      { className: regex },
    ];
  }

  return filter;
}

function buildTransactionFilter(query = {}) {
  const filter = {};
  const search = String(query.search || "").trim();
  const className = String(query.className || "").trim();
  const paymentMethod = String(query.paymentMethod || "").trim();

  if (className) filter.className = className;

  if (ALLOWED_METHODS.includes(paymentMethod)) {
    filter.paymentMethod = paymentMethod;
  }

  if (query.from || query.to) {
    filter.paymentDate = {};

    if (query.from) {
      const from = new Date(query.from);

      if (Number.isNaN(from.getTime())) {
        throw new Error("Invalid from date.");
      }

      from.setHours(0, 0, 0, 0);
      filter.paymentDate.$gte = from;
    }

    if (query.to) {
      const to = new Date(query.to);

      if (Number.isNaN(to.getTime())) {
        throw new Error("Invalid to date.");
      }

      to.setHours(23, 59, 59, 999);
      filter.paymentDate.$lte = to;
    }
  }

  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { receipt: regex },
      { student: regex },
      { admissionNo: regex },
      { className: regex },
    ];
  }

  return filter;
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

// GET /api/fees
router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const filter = {};

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");

      filter.$or = [
        { receipt: regex },
        { student: regex },
        { admissionNo: regex },
        { className: regex },
      ];
    }

    const fees = await Fee.find(filter).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      count: fees.length,
      fees: fees.map((fee) => ({ ...fee, class: fee.className })),
    });
  } catch (error) {
    console.error("Get fees error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch fee records.",
    });
  }
});

// GET /api/fees/summary
router.get("/summary", async (req, res) => {
  try {
    const { start, end } = getLocalDayRange();

    const [totals, today] = await Promise.all([
      Fee.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$amount" },
            totalPaid: { $sum: "$paid" },
            totalDue: { $sum: "$due" },
          },
        },
      ]),
      FeeTransaction.aggregate([
        { $match: { paymentDate: { $gte: start, $lt: end } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const result = totals[0] || {
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
    };

    return res.json({
      success: true,
      summary: {
        totalAmount: result.totalAmount,
        collected: result.totalPaid,
        pending: result.totalDue,
        todayCollection: today[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Fee summary error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate fee summary.",
    });
  }
});

// GET /api/fees/history
router.get("/history", async (req, res) => {
  try {
    const filter = buildFeeFilter(req.query);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [fees, count] = await Promise.all([
      Fee.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Fee.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      count,
      fees: fees.map((fee) => ({ ...fee, class: fee.className })),
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
      },
    });
  } catch (error) {
    console.error("Fee history error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to fetch fee history.",
    });
  }
});

// GET /api/fees/transactions
router.get("/transactions", async (req, res) => {
  try {
    const filter = buildTransactionFilter(req.query);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [transactions, count] = await Promise.all([
      FeeTransaction.find(filter)
        .sort({ paymentDate: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FeeTransaction.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      count,
      transactions,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
      },
    });
  } catch (error) {
    console.error("Fee transactions error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to fetch payment history.",
    });
  }
});

// GET /api/fees/reports
router.get("/reports", async (req, res) => {
  try {
    const feeFilter = buildFeeFilter(req.query);
    const transactionFilter = buildTransactionFilter(req.query);

    const [
      feeTotals,
      statusCounts,
      classWise,
      paymentMethods,
      transactionCount,
    ] = await Promise.all([
      Fee.aggregate([
        { $match: feeFilter },
        {
          $group: {
            _id: null,
            totalFee: { $sum: "$amount" },
            collected: { $sum: "$paid" },
            due: { $sum: "$due" },
            students: { $sum: 1 },
          },
        },
      ]),
      Fee.aggregate([
        { $match: feeFilter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Fee.aggregate([
        { $match: feeFilter },
        {
          $group: {
            _id: "$className",
            totalFee: { $sum: "$amount" },
            collected: { $sum: "$paid" },
            due: { $sum: "$due" },
            students: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      FeeTransaction.aggregate([
        { $match: transactionFilter },
        {
          $group: {
            _id: "$paymentMethod",
            total: { $sum: "$amount" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
      FeeTransaction.countDocuments(transactionFilter),
    ]);

    const summary = feeTotals[0] || {
      totalFee: 0,
      collected: 0,
      due: 0,
      students: 0,
    };

    return res.json({
      success: true,
      summary: {
        ...summary,
        transactions: transactionCount,
        collectionRate: summary.totalFee
          ? Number(((summary.collected / summary.totalFee) * 100).toFixed(2))
          : 0,
        statusCounts: Object.fromEntries(
          statusCounts.map((item) => [item._id, item.count])
        ),
      },
      classWise: classWise.map((item) => ({
        className: item._id || "Unassigned",
        totalFee: item.totalFee,
        collected: item.collected,
        due: item.due,
        students: item.students,
      })),
      paymentMethods: paymentMethods.map((item) => ({
        method: item._id,
        total: item.total,
        transactions: item.transactions,
      })),
    });
  } catch (error) {
    console.error("Fee reports error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to generate fee reports.",
    });
  }
});

// GET /api/fees/reports/export
router.get("/reports/export", async (req, res) => {
  try {
    const filter = buildTransactionFilter(req.query);

    const transactions = await FeeTransaction.find(filter)
      .sort({ paymentDate: -1 })
      .lean();

    const columns = [
      "Receipt",
      "Admission No",
      "Student",
      "Class",
      "Amount",
      "Payment Method",
      "Payment Date",
      "Collected By",
      "Remarks",
    ];

    const rows = transactions.map((item) => [
      item.receipt,
      item.admissionNo,
      item.student,
      item.className,
      item.amount,
      item.paymentMethod,
      item.paymentDate ? new Date(item.paymentDate).toISOString() : "",
      item.collectedBy,
      item.remarks,
    ]);

    const csv = [
      columns.map(csvCell).join(","),
      ...rows.map((row) => row.map(csvCell).join(",")),
    ].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="fee-transactions.csv"'
    );

    return res.send("\uFEFF" + csv);
  } catch (error) {
    console.error("Fee export error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to export fee report.",
    });
  }
});

// GET /api/fees/:id/transactions
router.get("/:id/transactions", async (req, res) => {
  try {
    const { id } = req.params;

    const fee = mongoose.isValidObjectId(id)
      ? await Fee.findById(id).lean()
      : await Fee.findOne({ receipt: id }).lean();

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found.",
      });
    }

    const transactions = await FeeTransaction.find({ feeId: fee._id })
      .sort({ paymentDate: -1 })
      .lean();

    return res.json({
      success: true,
      receipt: fee.receipt,
      transactions,
    });
  } catch (error) {
    console.error("Fee transaction detail error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch payment transactions.",
    });
  }
});

// GET /api/fees/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const fee = mongoose.isValidObjectId(id)
      ? await Fee.findById(id).lean()
      : await Fee.findOne({ receipt: id }).lean();

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found.",
      });
    }

    return res.json({
      success: true,
      fee: { ...fee, class: fee.className },
    });
  } catch (error) {
    console.error("Get fee detail error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch fee details.",
    });
  }
});

// POST /api/fees
router.post("/", async (req, res) => {
  let createdFeeId = null;

  try {
    const {
      studentId,
      admissionNo,
      student,
      className,
      class: classValue,
      amount,
      paid = 0,
      paymentMethod = "Cash",
      paymentDate,
      remarks = "",
      collectedBy = "",
    } = req.body;

    const total = Number(amount);
    const paidAmount = Number(paid);
    const finalClass = String(className || classValue || "").trim();

    if (
      typeof admissionNo !== "string" ||
      !admissionNo.trim() ||
      typeof student !== "string" ||
      !student.trim() ||
      !finalClass ||
      !Number.isFinite(total) ||
      total <= 0 ||
      !Number.isFinite(paidAmount) ||
      paidAmount < 0 ||
      paidAmount > total
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide student name, admission number, class, valid total fee and payment between zero and total fee.",
      });
    }

    if (studentId && !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    if (!ALLOWED_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    let finalPaymentDate = null;

    if (paidAmount > 0) {
      finalPaymentDate = parsePaymentDate(paymentDate);

      if (!finalPaymentDate) {
        return res.status(400).json({
          success: false,
          message: "Invalid payment date. Use YYYY-MM-DD.",
        });
      }
    }

    let fee;

    // Retry receipt generation only when a duplicate receipt occurs.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        fee = await Fee.create({
          receipt: makeReceiptNumber(),
          studentId: studentId || null,
          admissionNo: admissionNo.trim(),
          student: student.trim(),
          className: finalClass,
          amount: total,
          paid: paidAmount,
          due: total - paidAmount,
          paymentDate: finalPaymentDate,
          status: getPaymentStatus(total, paidAmount),
          paymentMethod,
          remarks: String(remarks || "").trim(),
          collectedBy: String(collectedBy || "").trim(),
        });

        createdFeeId = fee._id;
        break;
      } catch (error) {
        if (error.code === 11000 && attempt < 2) continue;
        throw error;
      }
    }

    if (!fee) {
      throw new Error("Unable to generate a unique receipt number.");
    }

    if (paidAmount > 0) {
      try {
        await FeeTransaction.create({
          feeId: fee._id,
          receipt: fee.receipt,
          studentId: fee.studentId,
          admissionNo: fee.admissionNo,
          student: fee.student,
          className: fee.className,
          amount: paidAmount,
          paymentMethod,
          paymentDate: finalPaymentDate,
          collectedBy: fee.collectedBy,
          remarks: fee.remarks,
        });
      } catch (transactionError) {
        await Fee.deleteOne({ _id: fee._id });
        createdFeeId = null;
        throw transactionError;
      }
    }

    return res.status(201).json({
      success: true,
      message: "Fee record created successfully.",
      fee: { ...fee.toObject(), class: fee.className },
    });
  } catch (error) {
    console.error("Create fee error:", error);

    if (createdFeeId) {
      try {
        await Fee.deleteOne({ _id: createdFeeId });
      } catch (cleanupError) {
        console.error("Fee cleanup error:", cleanupError);
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Receipt number conflict. Please try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create fee record.",
    });
  }
});

// PATCH /api/fees/:id/pay
router.patch("/:id/pay", async (req, res) => {
  try {
    const { id } = req.params;
    const payment = Number(req.body.payment);
    const paymentMethod = req.body.paymentMethod || "Cash";
    const collectedBy = String(req.body.collectedBy || "").trim();
    const remarks = String(req.body.remarks || "").trim();

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee record ID.",
      });
    }

    if (!Number.isFinite(payment) || payment <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment must be greater than zero.",
      });
    }

    if (!ALLOWED_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // Capture original values for rollback.
    const originalFee = await Fee.findById(id).lean();

    if (!originalFee) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found.",
      });
    }

    const paymentDate = new Date();

    // Conditional atomic update prevents overpayment.
    const fee = await Fee.findOneAndUpdate(
      {
        _id: id,
        due: { $gte: payment },
      },
      {
        $inc: {
          paid: payment,
          due: -payment,
        },
        $set: {
          paymentDate,
          paymentMethod,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!fee) {
      const existing = await Fee.findById(id).lean();

      if (!existing) {
        return res.status(404).json({
          success: false,
          message: "Fee record not found.",
        });
      }

      return res.status(400).json({
        success: false,
        message: `Payment cannot exceed the remaining due of ${existing.due}.`,
      });
    }

    fee.status = getPaymentStatus(fee.amount, fee.paid);
    await fee.save();

    try {
      await FeeTransaction.create({
        feeId: fee._id,
        receipt: fee.receipt,
        studentId: fee.studentId,
        admissionNo: fee.admissionNo,
        student: fee.student,
        className: fee.className,
        amount: payment,
        paymentMethod,
        paymentDate,
        collectedBy: collectedBy || fee.collectedBy || "",
        remarks,
      });
    } catch (transactionError) {
      // Roll back only if the fee still has the values written by this request.
      try {
        const rollback = await Fee.updateOne(
          {
            _id: fee._id,
            paid: fee.paid,
            due: fee.due,
            paymentDate,
          },
          {
            $inc: {
              paid: -payment,
              due: payment,
            },
            $set: {
              status: originalFee.status,
              paymentDate: originalFee.paymentDate ?? null,
              paymentMethod: originalFee.paymentMethod,
            },
          }
        );

        if (rollback.modifiedCount !== 1) {
          console.error(
            "Fee rollback skipped because the record changed:",
            fee._id
          );
        }
      } catch (rollbackError) {
        console.error("Fee rollback error:", rollbackError);
      }

      console.error("Payment transaction save error:", transactionError);

      return res.status(500).json({
        success: false,
        message:
          "Payment transaction could not be saved. Please verify the fee record before retrying.",
      });
    }

    return res.json({
      success: true,
      message: "Payment recorded successfully.",
      fee: { ...fee.toObject(), class: fee.className },
    });
  } catch (error) {
    console.error("Collect payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to record payment.",
    });
  }
});

export default router;
