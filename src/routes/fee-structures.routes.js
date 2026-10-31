import express from "express";
import mongoose from "mongoose";
import FeeStructure from "../models/FeeStructure.js";

const router = express.Router();

const feeFields = [
  "tuition",
  "admission",
  "exam",
  "computer",
  "library",
  "transport",
];

function validateFeeData(body) {
  const className = String(body.className || "").trim();

  if (!className) {
    return { error: "Class name is required." };
  }

  const fees = {};

  for (const field of feeFields) {
    const value = body[field] ?? 0;
    const number = Number(value);

    if (
      value === "" ||
      !Number.isFinite(number) ||
      number < 0
    ) {
      return { error: `${field} must be a valid non-negative number.` };
    }

    fees[field] = number;
  }

  return { className, fees };
}

// GET: List and search fee structures
router.get("/", async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    const filter = search
      ? { className: { $regex: search, $options: "i" } }
      : {};

    const structures = await FeeStructure.find(filter)
      .sort({ className: 1 })
      .lean();

    const data = structures.map((item) => ({
      ...item,
      total: feeFields.reduce(
        (sum, field) => sum + Number(item[field] || 0),
        0
      ),
    }));

    res.json({
      success: true,
      count: data.length,
      structures: data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fee structures.",
    });
  }
});

// GET: Single fee structure
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee structure ID.",
      });
    }

    const structure = await FeeStructure.findById(req.params.id);

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found.",
      });
    }

    res.json({ success: true, structure });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch fee structure.",
    });
  }
});

// POST: Create fee structure
router.post("/", async (req, res) => {
  try {
    const validated = validateFeeData(req.body);

    if (validated.error) {
      return res.status(400).json({
        success: false,
        message: validated.error,
      });
    }

    const structure = await FeeStructure.create({
      className: validated.className,
      ...validated.fees,
    });

    res.status(201).json({
      success: true,
      message: "Fee structure created successfully.",
      structure,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Fee structure already exists for this class.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create fee structure.",
    });
  }
});

// PUT: Update fee structure
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee structure ID.",
      });
    }

    const validated = validateFeeData(req.body);

    if (validated.error) {
      return res.status(400).json({
        success: false,
        message: validated.error,
      });
    }

    const structure = await FeeStructure.findByIdAndUpdate(
      req.params.id,
      {
        className: validated.className,
        ...validated.fees,
      },
      { new: true, runValidators: true }
    );

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found.",
      });
    }

    res.json({
      success: true,
      message: "Fee structure updated successfully.",
      structure,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Another structure already exists for this class.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update fee structure.",
    });
  }
});

// DELETE: Remove fee structure
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid fee structure ID.",
      });
    }

    const structure = await FeeStructure.findByIdAndDelete(
      req.params.id
    );

    if (!structure) {
      return res.status(404).json({
        success: false,
        message: "Fee structure not found.",
      });
    }

    res.json({
      success: true,
      message: "Fee structure deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete fee structure.",
    });
  }
});

export default router;