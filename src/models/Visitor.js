
import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    visitorName: {
      type: String,
      required: [true, "Visitor name is required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      match: [/^$|^[0-9]{10}$/, "Phone must be 10 digits"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    purpose: {
      type: String,
      required: [true, "Purpose is required"],
      trim: true,
    },
    personToMeet: {
      type: String,
      trim: true,
      default: "",
    },
    visitorType: {
      type: String,
      enum: ["Parent", "Student", "Vendor", "Guest", "Other"],
      default: "Other",
    },
    checkInAt: { type: Date, default: Date.now },
    checkOutAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Visiting", "Checked Out"],
      default: "Visiting",
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

visitorSchema.index({ createdAt: -1 });
visitorSchema.index({ status: 1 });

export default mongoose.models.Visitor ||
  mongoose.model("Visitor", visitorSchema);
