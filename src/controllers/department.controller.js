
import mongoose from "mongoose";
import Department from "../models/Department.js";

export const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });
    return res.status(200).json(departments);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, status } = req.body;

    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({
        message: "Department name and code are required",
      });
    }

    const existing = await Department.findOne({
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() },
      ],
    });

    if (existing) {
      return res.status(409).json({
        message: "Department name or code already exists",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description || "",
      status: status || "Active",
    });

    return res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Department name or code already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to create department",
      error: error.message,
    });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    const { name, code, description, status } = req.body;

    if (!name?.trim() || !code?.trim()) {
      return res.status(400).json({
        message: "Department name and code are required",
      });
    }

    const duplicate = await Department.findOne({
      _id: { $ne: id },
      $or: [
        { name: name.trim() },
        { code: code.trim().toUpperCase() },
      ],
    });

    if (duplicate) {
      return res.status(409).json({
        message: "Another department already uses this name or code",
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || "",
        status: status || "Active",
      },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res.status(200).json({
      message: "Department updated successfully",
      department,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Department name or code already exists",
      });
    }

    return res.status(500).json({
      message: "Failed to update department",
      error: error.message,
    });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    const department = await Department.findByIdAndDelete(id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res.status(200).json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete department",
      error: error.message,
    });
  }
};
