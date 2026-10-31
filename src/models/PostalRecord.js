
import mongoose from "mongoose";

const postalRecordSchema = new mongoose.Schema(
  {
    recordType: {
      type: String,
      enum: ["Inward", "Outward"],
      required: [true, "Record type is required"],
    },
    trackingNumber: { type: String, trim: true, default: "" },
    sender: { type: String, trim: true, default: "" },
    recipient: {
      type: String,
      required: [true, "Recipient is required"],
      trim: true,
    },
    address: { type: String, trim: true, default: "" },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    recordDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["Received", "Dispatched", "Delivered", "Pending"],
      default: "Pending",
    },
    handledBy: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

postalRecordSchema.index({ recordDate: -1 });
postalRecordSchema.index({ recordType: 1, status: 1 });

export default mongoose.models.PostalRecord ||
  mongoose.model("PostalRecord", postalRecordSchema);
