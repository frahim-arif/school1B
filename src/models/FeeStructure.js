import mongoose from "mongoose";

const feeStructureSchema = new mongoose.Schema(
  {
    className: {
      type: String,
      required: true,
      trim: true,
    },
    tuition: { type: Number, default: 0, min: 0 },
    admission: { type: Number, default: 0, min: 0 },
    exam: { type: Number, default: 0, min: 0 },
    computer: { type: Number, default: 0, min: 0 },
    library: { type: Number, default: 0, min: 0 },
    transport: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

feeStructureSchema.index({ className: 1 }, { unique: true });

export default mongoose.models.FeeStructure ||
  mongoose.model("FeeStructure", feeStructureSchema);