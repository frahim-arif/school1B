import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema(
  {
    schoolName: String,
    address: String,
    phone: String,
    email: String,
    website: String,
    principal: String,
    logo: String,
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    currency: {
      type: String,
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("School", schoolSchema);