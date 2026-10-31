import mongoose from "mongoose";

const biometricLogSchema = new mongoose.Schema(
  {
    personType: {
      type: String,
      enum: ["Teacher", "Student", "Staff"],
      required: true,
    },
    personId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    personName: {
      type: String,
      trim: true,
      default: "",
    },
    employeeId: {
      type: String,
      trim: true,
      default: "",
    },
    admissionNo: {
      type: String,
      trim: true,
      default: "",
    },
    eventType: {
      type: String,
      enum: ["Check In", "Check Out"],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    deviceId: {
      type: String,
      trim: true,
      default: "",
    },
    deviceName: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      enum: ["Manual", "Device"],
      default: "Manual",
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

biometricLogSchema.index({ personId: 1, timestamp: -1 });
biometricLogSchema.index({ timestamp: -1 });

export default mongoose.models.BiometricLog ||
  mongoose.model("BiometricLog", biometricLogSchema);