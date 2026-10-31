
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "Leave"],
      required: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    markedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ek student ki ek date par sirf ek attendance entry
attendanceSchema.index(
  { student: 1, date: 1 },
  { unique: true }
);

export default mongoose.model("Attendance", attendanceSchema);
