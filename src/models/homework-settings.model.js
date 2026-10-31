
import mongoose from "mongoose";

const homeworkSettingsSchema = new mongoose.Schema(
  {
    schoolId: {
      type: String,
      default: "default",
      unique: true,
    },
    maxFileSizeMB: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },
    allowedFileTypes: {
      type: [String],
      default: ["pdf", "jpg", "jpeg", "png"],
    },
    allowLateSubmission: {
      type: Boolean,
      default: true,
    },
    submissionNotification: {
      type: Boolean,
      default: true,
    },
    autoReminder: {
      type: Boolean,
      default: false,
    },
    reminderTiming: {
      type: String,
      default: "1 Day Before",
    },
  },
  { timestamps: true }
);

export default mongoose.models.HomeworkSettings ||
  mongoose.model("HomeworkSettings", homeworkSettingsSchema);
