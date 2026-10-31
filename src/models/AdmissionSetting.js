
import mongoose from "mongoose";

const admissionSettingSchema = new mongoose.Schema(
  {
    academicSession: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    isOpen: { type: Boolean, default: false },

    allowedClasses: {
      type: [String],
      default: [],
    },

    instructions: { type: String, default: "" },

    requiredFields: {
      type: [String],
      default: [
        "student.firstName",
        "student.dateOfBirth",
        "student.gender",
        "admission.classApplyingFor",
        "parents.fatherName",
        "parents.motherName",
        "parents.phone",
        "address.addressLine",
        "address.city",
        "address.state",
        "address.postalCode",
      ],
    },

    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AdmissionSetting ||
  mongoose.model("AdmissionSetting", admissionSettingSchema);
