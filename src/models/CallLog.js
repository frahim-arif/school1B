
import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    callerName: {
      type: String,
      required: [true, "Caller name is required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Enter a valid 10-digit phone number"],
    },
    callType: {
      type: String,
      enum: ["Incoming", "Outgoing"],
      default: "Incoming",
    },
    purpose: {
      type: String,
      required: [true, "Call purpose is required"],
      trim: true,
    },
    callDate: { type: Date, default: Date.now },
    durationMinutes: { type: Number, min: 0, default: 0 },
    staffName: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["Answered", "Missed", "Callback Required", "Completed"],
      default: "Answered",
    },
    followUpDate: { type: Date, default: null },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

callLogSchema.index({ callDate: -1 });
callLogSchema.index({ status: 1 });

export default mongoose.models.CallLog ||
  mongoose.model("CallLog", callLogSchema);
