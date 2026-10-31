
import mongoose from "mongoose";

const academicCalendarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["Exam", "Holiday", "Event", "Meeting", "Activity"],
    },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.AcademicCalendar ||
  mongoose.model("AcademicCalendar", academicCalendarSchema);
