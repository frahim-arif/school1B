
import mongoose from "mongoose";

const feeSchema = new mongoose.Schema(
  {
    receipt: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },
    admissionNo: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    student: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paid: {
      type: Number,
      default: 0,
      min: 0,
    },
    due: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Paid", "Partial", "Pending"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer", "Other"],
      default: "Cash",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
    collectedBy: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

feeSchema.index({ student: 1, admissionNo: 1 });
feeSchema.index({ paymentDate: -1 });

export default mongoose.models.Fee ||
  mongoose.model("Fee", feeSchema);
