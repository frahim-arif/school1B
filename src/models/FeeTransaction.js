
import mongoose from "mongoose";

const feeTransactionSchema = new mongoose.Schema(
  {
    feeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fee",
      required: true,
      index: true,
    },
    receipt: {
      type: String,
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
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Card", "Bank Transfer", "Other"],
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    collectedBy: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

feeTransactionSchema.index({ paymentDate: -1, className: 1 });
feeTransactionSchema.index({ admissionNo: 1, paymentDate: -1 });

export default mongoose.models.FeeTransaction ||
  mongoose.model("FeeTransaction", feeTransactionSchema);
