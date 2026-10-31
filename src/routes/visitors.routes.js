import express from "express";
import mongoose from "mongoose";

const router = express.Router();

const visitorSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  total: { type: Number, default: 0 },
});

const Visitor =
  mongoose.models.Visitor ||
  mongoose.model("Visitor", visitorSchema);

router.get("/", async (req, res) => {
  try {
    const doc = await Visitor.findOne({ key: "site" });

    res.json({
      success: true,
      data: { total: doc?.total || 0 },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not read visitors",
    });
  }
});

router.post("/hit", async (req, res) => {
  try {
    const doc = await Visitor.findOneAndUpdate(
      { key: "site" },
      { $inc: { total: 1 } },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: { total: doc.total },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not update visitors",
    });
  }
});

export default router;