
import mongoose from "mongoose";

const attendanceSettingsSchema = new mongoose.Schema(
  {
    minimumWorkingHours: {
      type: Number,
      default: 6,
      min: 0,
      max: 24,
    },

    allowedLateMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 1440,
    },

    startTime: {
      type: String,
      default: "08:00",
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    endTime: {
      type: String,
      default: "14:00",
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
    },

    autoAttendance: {
      type: Boolean,
      default: false,
    },

    weekends: {
      type: [String],
      enum: ["Friday", "Saturday", "Sunday"],
      default: ["Sunday"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.AttendanceSettings ||
  mongoose.model("AttendanceSettings", attendanceSettingsSchema);
