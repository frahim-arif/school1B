
import mongoose from "mongoose";

const noticeSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "school-notice-settings",
      unique: true,
    },

    defaultCategory: {
      type: String,
      enum: ["General", "Exam", "Holiday", "Fee", "Event"],
      default: "General",
    },

    autoExpire: {
      type: Boolean,
      default: true,
    },

    notifications: {
      type: Boolean,
      default: true,
    },

    studentView: {
      type: Boolean,
      default: true,
    },

    staffView: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const NoticeSettings =
  mongoose.models.NoticeSettings ||
  mongoose.model("NoticeSettings", noticeSettingsSchema);

export default NoticeSettings;
