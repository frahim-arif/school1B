
import mongoose from "mongoose";

const frontOfficeSettingsSchema = new mongoose.Schema(
  {
    settingsKey: {
      type: String,
      default: "default",
      unique: true,
    },
    schoolName: { type: String, trim: true, default: "" },
    contactPhone: { type: String, trim: true, default: "" },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    address: { type: String, trim: true, default: "" },
    visitorPurposes: {
      type: [String],
      default: ["Admission", "Meeting", "Fee", "Other"],
    },
    complaintCategories: {
      type: [String],
      default: ["Academic", "Transport", "Fees", "Staff", "Facilities", "Other"],
    },
    updatedBy: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export default mongoose.models.FrontOfficeSettings ||
  mongoose.model("FrontOfficeSettings", frontOfficeSettingsSchema);
