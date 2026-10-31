
import mongoose from "mongoose";

const homeworkSubmissionSchema = new mongoose.Schema(
  {
    homeworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Homework",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    attachment: {
      url: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    answer: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Submitted", "Checked", "Late"],
      default: "Pending",
    },
    marks: {
      type: Number,
      default: null,
      min: 0,
    },
    totalMarks: {
      type: Number,
      default: 10,
      min: 1,
    },
    feedback: {
      type: String,
      default: "",
    },
    checkedAt: {
      type: Date,
      default: null,
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

homeworkSubmissionSchema.index(
  { homeworkId: 1, studentId: 1 },
  { unique: true }
);

export default mongoose.models.HomeworkSubmission ||
  mongoose.model("HomeworkSubmission", homeworkSubmissionSchema);
