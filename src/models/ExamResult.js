
import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamSchedule",
      required: true,
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    percentage: {
      type: Number,
      min: 0,
      max: 100,
    },

    grade: {
      type: String,
      default: "",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

examResultSchema.index(
  { scheduleId: 1, studentId: 1 },
  { unique: true }
);

examResultSchema.pre("validate", function () {
  if (this.marksObtained > this.totalMarks) {
    this.invalidate(
      "marksObtained",
      "Obtained marks total marks se zyada nahi ho sakte."
    );
    return;
  }

  if (this.totalMarks > 0) {
    this.percentage = Number(
      ((this.marksObtained / this.totalMarks) * 100).toFixed(2)
    );

    const percentage = this.percentage;

    if (percentage >= 90) this.grade = "A+";
    else if (percentage >= 80) this.grade = "A";
    else if (percentage >= 70) this.grade = "B+";
    else if (percentage >= 60) this.grade = "B";
    else if (percentage >= 33) this.grade = "C";
    else this.grade = "F";
  }
});

export default mongoose.model("ExamResult", examResultSchema);
