
import mongoose from "mongoose";

const academicSettingsSchema = new mongoose.Schema(
  {
    academicYear: { type: String, required: true, default: "2026-2027" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
    schoolStart: { type: String, default: "08:30" },
    schoolEnd: { type: String, default: "14:30" },
    periodDuration: { type: Number, default: 45, min: 1 },
    shortBreak: { type: Number, default: 15, min: 0 },
    lunchBreak: { type: Number, default: 30, min: 0 },
    periodsPerDay: { type: Number, default: 8, min: 1, max: 15 },
  },
  { timestamps: true }
);

export default mongoose.models.AcademicSettings ||
  mongoose.model("AcademicSettings", academicSettingsSchema);
