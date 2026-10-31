
import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    certificateType: {
      type: String,
      required: true,
      enum: [
        "bonafide",
        "transfer",
        "character",
        "study",
        "birth",
        "achievement",
        "other",
      ],
    },

    recipientType: {
      type: String,
      enum: ["student", "staff"],
      default: "student",
      required: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },

    recipientName: {
      type: String,
      required: true,
      trim: true,
    },

    admissionNumber: {
      type: String,
      default: "",
      trim: true,
    },

    className: {
      type: String,
      default: "",
      trim: true,
    },

    session: {
      type: String,
      default: "",
      trim: true,
    },

    issueDate: {
      type: Date,
      default: Date.now,
    },

    purpose: {
      type: String,
      default: "",
      trim: true,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    templateName: {
      type: String,
      default: "Default",
      trim: true,
    },

    status: {
      type: String,
      enum: ["issued", "revoked"],
      default: "issued",
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    revokedReason: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

certificateSchema.index({
  certificateNumber: 1,
  recipientName: 1,
});

const Certificate = mongoose.model("Certificate", certificateSchema);

export default Certificate;
