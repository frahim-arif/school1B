
import mongoose from "mongoose";

const librarySettingsSchema = new mongoose.Schema(
  {
    maxBooksPerStudent: {
      type: Number,
      default: 3,
      min: 1,
    },
    returnDuration: {
      type: Number,
      default: 15,
      min: 1,
    },
    finePerLateDay: {
      type: Number,
      default: 5,
      min: 0,
    },
    issueNotifications: {
      type: Boolean,
      default: true,
    },
    returnReminders: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.LibrarySettings ||
  mongoose.model("LibrarySettings", librarySettingsSchema);
