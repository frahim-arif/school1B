
import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Holiday name is required"],
      trim: true,
      maxlength: 120,
    },

    date: {
      type: Date,
      required: [true, "Holiday date is required"],
    },

    type: {
      type: String,
      required: [true, "Holiday type is required"],
      enum: [
        "National Holiday",
        "Festival Holiday",
        "School Event",
      ],
      default: "National Holiday",
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    pdfUrl: {
      type: String,
      default: "",
    },

    imageUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Holiday ||
  mongoose.model("Holiday", holidaySchema);
