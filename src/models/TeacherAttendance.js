import mongoose from "mongoose";

const teacherAttendanceSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Present", "Absent", "Late", "Half Day", "Leave"],
      required: true,
      default: "Present",
    },

    checkIn: {
      type: String,
      default: "",
    },

    checkOut: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    markedBy: {
      type: String,
      default: "Admin",
    },
  },
  { timestamps: true }
);

// Ek teacher ki ek date par sirf ek attendance entry
teacherAttendanceSchema.index(
  { teacher: 1, date: 1 },
  { unique: true }
);

export default mongoose.model(
  "TeacherAttendance",
  teacherAttendanceSchema
);