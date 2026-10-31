
import mongoose from "mongoose";

const bookIssueSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    bookName: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    fine: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Issued", "Returned", "Late"],
      default: "Issued",
    },
  },
  { timestamps: true }
);

bookIssueSchema.index({ studentId: 1, status: 1 });
bookIssueSchema.index({ bookId: 1, status: 1 });

export default mongoose.models.BookIssue ||
  mongoose.model("BookIssue", bookIssueSchema);
