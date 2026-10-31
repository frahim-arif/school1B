
import mongoose from "mongoose";

const certificateTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
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
      enum: ["student", "staff", "both"],
      default: "student",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    body: {
      type: String,
      required: true,
    },

    headerText: {
      type: String,
      default: "",
    },

    footerText: {
      type: String,
      default: "",
    },

    signatureName: {
      type: String,
      default: "",
    },

    signatureDesignation: {
      type: String,
      default: "Principal",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const CertificateTemplate = mongoose.model(
  "CertificateTemplate",
  certificateTemplateSchema
);

export default CertificateTemplate;
