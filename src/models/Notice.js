
import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: [true, "Notice description is required"],
      trim: true,
    },

    category: {
      type: String,
      enum: ["General", "Exam", "Holiday", "Fee", "Event"],
      default: "General",
    },

    audience: {
      type: String,
      enum: ["All Students", "Teachers", "Staff", "Parents"],
      default: "All Students",
    },

    publishDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    expiryDate: {
      type: Date,
      default: null,
    },

    attachment: {
      type: String,
      default: "",
    },

    attachmentOriginalName: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Expired", "Draft"],
      default: "Active",
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

noticeSchema.index({ title: "text", description: "text" });
noticeSchema.index({ publishDate: -1, status: 1 });

const Notice =
  mongoose.models.Notice ||
  mongoose.model("Notice", noticeSchema);

export default Notice;
