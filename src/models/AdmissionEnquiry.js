
import mongoose from "mongoose";

const admissionEnquirySchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: [true, "Student name is required"],
      trim: true,
      maxlength: 100,
    },
    guardianName: {
      type: String,
      required: [true, "Guardian name is required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[0-9]{10}$/, "Enter a valid 10-digit phone number"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    classApplying: {
      type: String,
      required: [true, "Class is required"],
      trim: true,
    },
    source: {
      type: String,
      enum: ["Walk-in", "Phone", "Website", "Referral", "Other"],
      default: "Walk-in",
    },
    status: {
      type: String,
      enum: ["New", "Contacted", "Follow-up", "Admitted", "Rejected"],
      default: "New",
    },
    followUpDate: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: 2000,
    },
    assignedTo: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

admissionEnquirySchema.index({ createdAt: -1 });
admissionEnquirySchema.index({ status: 1, followUpDate: 1 });
admissionEnquirySchema.index({ phone: 1 });

const AdmissionEnquiry =
  mongoose.models.AdmissionEnquiry ||
  mongoose.model("AdmissionEnquiry", admissionEnquirySchema);

export default AdmissionEnquiry;
