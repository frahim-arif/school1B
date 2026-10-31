
import mongoose from "mongoose";

const studentPromotionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    admissionNo: {
      type: String,
      required: true,
    },

    fromClass: {
      type: String,
      required: true,
    },

    fromSection: {
      type: String,
      default: "",
    },

    fromSession: {
      type: String,
      required: true,
    },

    toClass: {
      type: String,
      required: true,
    },

    toSection: {
      type: String,
      default: "",
    },

    toSession: {
      type: String,
      required: true,
    },

    promotedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ek student ka same session se same target session mein
// duplicate promotion record create nahi hoga.
studentPromotionSchema.index(
  { student: 1, fromSession: 1, toSession: 1 },
  { unique: true }
);

const StudentPromotion =
  mongoose.models.StudentPromotion ||
  mongoose.model("StudentPromotion", studentPromotionSchema);

export default StudentPromotion;
