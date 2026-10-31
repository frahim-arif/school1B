import mongoose from "mongoose";

const classSubjectSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },

    subjectType: {
      type: String,
      enum: ["Compulsory", "Optional"],
      default: "Compulsory",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// Ek class mein ek subject ki duplicate assignment na ho.
classSubjectSchema.index(
  { classId: 1, subjectId: 1 },
  { unique: true }
);

export default mongoose.model("ClassSubject", classSubjectSchema);