
import mongoose from "mongoose";

const academicSyllabusSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    chapter: { type: String, required: true, trim: true },
    teacher: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
    completionDate: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.AcademicSyllabus ||
  mongoose.model("AcademicSyllabus", academicSyllabusSchema);
