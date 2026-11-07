import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      unique: true,
      required: true,
    },

    rollNo: {
      type: Number,
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    houseName: {
  type: String,
  default: "",
  trim: true,
},
    lastName: {
      type: String,
      default: "",
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },

    dob: {
      type: Date,
      required: true,
    },

    fatherName: {
      type: String,
      required: true,
    },

    motherName: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    className: {
      type: String,
      required: true,
    },

    section: {
      type: String,
      required: true,
    },

    session: {
      type: String,
      required: true,
    },

    bloodGroup: {
      type: String,
      default: "",
    },

    aadhaar: {
      type: String,
      default: "",
    },

    photo: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Student", studentSchema);