
import mongoose from "mongoose";

const homeworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    sectionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 10000,
    },
    assignedDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    attachment: {
      url: { type: String, default: "" },
      name: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["Active", "Archived"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

homeworkSchema.index({
  title: "text",
  description: "text",
});

export default mongoose.models.Homework ||
  mongoose.model("Homework", homeworkSchema);
