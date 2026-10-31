
import mongoose from "mongoose";

const academicTimetableSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    section: { type: String, default: "", trim: true },
    subject: { type: String, required: true, trim: true },
    teacher: { type: String, required: true, trim: true },
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.AcademicTimetable ||
  mongoose.model("AcademicTimetable", academicTimetableSchema);
