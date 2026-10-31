
import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      default: null,
    },

    name: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true,
    },

    role: {
      type: String,
      required: [true, "Employee role is required"],
      enum: ["Teacher", "Accountant", "Staff", "Principal", "Other"],
      default: "Teacher",
    },

    leaveType: {
      type: String,
      required: [true, "Leave type is required"],
      enum: [
        "Medical Leave",
        "Casual Leave",
        "Personal Leave",
        "Earned Leave",
        "Maternity Leave",
        "Other",
      ],
    },

    fromDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    toDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    days: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leaveSchema.pre("validate", function () {
  if (this.fromDate && this.toDate) {
    if (this.toDate < this.fromDate) {
      this.invalidate(
        "toDate",
        "End date cannot be before start date"
      );
      return;
    }

    const start = new Date(this.fromDate);
    const end = new Date(this.toDate);

    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(0, 0, 0, 0);

    this.days =
      Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  }
});

const Leave =
  mongoose.models.Leave || mongoose.model("Leave", leaveSchema);

export default Leave;
