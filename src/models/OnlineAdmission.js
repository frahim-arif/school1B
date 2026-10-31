
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    type: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, required: true },
    originalName: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const onlineAdmissionSchema = new mongoose.Schema(
  {
    applicationNumber: {
      type: String,
      unique: true,
      index: true,
    },

    academicSession: {
      type: String,
      required: true,
      trim: true,
    },

    student: {
      firstName: { type: String, required: true, trim: true },
      middleName: { type: String, trim: true, default: "" },
      lastName: { type: String, trim: true, default: "" },
      dateOfBirth: { type: Date, required: true },
      gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
        required: true,
      },
      bloodGroup: { type: String, trim: true, default: "" },
      nationality: { type: String, trim: true, default: "Indian" },
    },

    admission: {
      classApplyingFor: {
        type: String,
        required: true,
        trim: true,
      },
      previousSchool: { type: String, trim: true, default: "" },
      previousClass: { type: String, trim: true, default: "" },
      previousResult: { type: String, trim: true, default: "" },
    },

    parents: {
      fatherName: { type: String, required: true, trim: true },
      motherName: { type: String, required: true, trim: true },
      guardianName: { type: String, trim: true, default: "" },
      phone: { type: String, required: true, trim: true },
      alternatePhone: { type: String, trim: true, default: "" },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },
      occupation: { type: String, trim: true, default: "" },
    },

    address: {
      addressLine: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      district: { type: String, trim: true, default: "" },
      state: { type: String, required: true, trim: true },
      postalCode: { type: String, required: true, trim: true },
    },

    documents: {
      type: [documentSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["Pending", "Under Review", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    adminRemarks: { type: String, trim: true, default: "" },
    reviewedAt: { type: Date, default: null },
    reviewedBy: { type: String, default: "" },
    studentId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

onlineAdmissionSchema.index({
  "student.firstName": 1,
  "student.lastName": 1,
  "parents.phone": 1,
});

export default mongoose.models.OnlineAdmission ||
  mongoose.model("OnlineAdmission", onlineAdmissionSchema);
