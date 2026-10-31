
import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    complainantName: {
      type: String,
      required: [true, "Complainant name is required"],
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      match: [/^$|^[0-9]{10}$/, "Phone must be 10 digits"],
    },
    category: {
      type: String,
      required: [true, "Complaint category is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Complaint subject is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: 5000,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    assignedTo: { type: String, trim: true, default: "" },
    resolution: { type: String, trim: true, default: "" },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ status: 1, priority: 1 });

export default mongoose.models.Complaint ||
  mongoose.model("Complaint", complaintSchema);
