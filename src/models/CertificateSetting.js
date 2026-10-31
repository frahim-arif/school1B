
import mongoose from "mongoose";

const certificateSettingSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      default: "",
      trim: true,
    },

    schoolAddress: {
      type: String,
      default: "",
      trim: true,
    },

    schoolPhone: {
      type: String,
      default: "",
      trim: true,
    },

    schoolEmail: {
      type: String,
      default: "",
      trim: true,
    },

    schoolLogo: {
      type: String,
      default: "",
      trim: true,
    },

    principalName: {
      type: String,
      default: "",
      trim: true,
    },

    principalSignature: {
      type: String,
      default: "",
      trim: true,
    },

    certificatePrefix: {
      type: String,
      default: "CERT",
      trim: true,
    },

    nextCertificateNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

const CertificateSetting = mongoose.model(
  "CertificateSetting",
  certificateSettingSchema
);

export default CertificateSetting;
