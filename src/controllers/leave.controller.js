
import mongoose from "mongoose";
import Leave from "../models/Leave.js";

const validStatuses = ["Pending", "Approved", "Rejected"];

// CREATE LEAVE
export const createLeave = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      role,
      leaveType,
      fromDate,
      toDate,
      reason,
    } = req.body;

    if (
      !name?.trim() ||
      !role ||
      !leaveType ||
      !fromDate ||
      !toDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, role, leave type and dates are required",
      });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid leave dates",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    if (
      employeeId &&
      !mongoose.isValidObjectId(employeeId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    const leave = await Leave.create({
      employeeId: employeeId || null,
      name: name.trim(),
      role,
      leaveType,
      fromDate: start,
      toDate: end,
      reason: reason || "",
    });

    return res.status(201).json({
      success: true,
      message: "Leave request created successfully",
      leave,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create leave error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create leave request",
    });
  }
};

// GET ALL LEAVES
export const getLeaves = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid leave status",
        });
      }

      filter.status = status;
    }

    if (search?.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.name = {
        $regex: escapedSearch,
        $options: "i",
      };
    }

    const leaves = await Leave.find(filter)
      .populate("employeeId", "name employeeId email")
      .sort({ createdAt: -1 });

    const counts = await Leave.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    counts.forEach((item) => {
      summary.total += item.count;

      if (item._id === "Pending") summary.pending = item.count;
      if (item._id === "Approved") summary.approved = item.count;
      if (item._id === "Rejected") summary.rejected = item.count;
    });

    return res.status(200).json({
      success: true,
      count: leaves.length,
      summary,
      leaves,
    });
  } catch (error) {
    console.error("Get leaves error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave requests",
    });
  }
};

// GET ONE LEAVE
export const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await Leave.findById(id).populate(
      "employeeId",
      "name employeeId email"
    );

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    return res.status(200).json({
      success: true,
      leave,
    });
  } catch (error) {
    console.error("Get leave error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave request",
    });
  }
};

// APPROVE OR REJECT LEAVE
export const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Pending, Approved or Rejected",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    leave.status = status;
    leave.reviewedAt =
      status === "Pending" ? null : new Date();

    await leave.save();

    return res.status(200).json({
      success: true,
      message: `Leave status updated to ${status}`,
      leave,
    });
  } catch (error) {
    console.error("Update leave status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update leave status",
    });
  }
};

// DELETE LEAVE
export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    const leave = await Leave.findByIdAndDelete(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Leave request deleted successfully",
    });
  } catch (error) {
    console.error("Delete leave error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete leave request",
    });
  }
};
