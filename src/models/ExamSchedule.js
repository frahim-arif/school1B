
import mongoose from "mongoose";

const examScheduleSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      default: null,
    },

    examDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    room: {
      type: String,
      trim: true,
      default: "",
    },

    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },

    passingMarks: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value) {
          return value <= this.totalMarks;
        },
        message: "Passing marks total marks se zyada nahi ho sakte.",
      },
    },

    instructions: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

examScheduleSchema.index(
  { examId: 1, subjectId: 1, sectionId: 1 },
  { unique: true }
);

export default mongoose.model("ExamSchedule", examScheduleSchema);
