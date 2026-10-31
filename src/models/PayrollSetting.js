import mongoose from "mongoose";

const payrollSettingSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Default Payroll Settings" },
    currency: { type: String, default: "INR" },
    payDay: { type: Number, default: 1, min: 1, max: 28 },
    defaultPaymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Cash", "Cheque", "Other"],
      default: "Bank Transfer",
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("PayrollSetting", payrollSettingSchema);