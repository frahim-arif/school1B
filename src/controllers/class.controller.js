
import mongoose from "mongoose";
import ClassModel from "../models/Class.js";

// Create Class
export const createClass = async (req, res) => {
  try {
    const { name, sections = [], status = "Active" } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    const exists = await ClassModel.findOne({
      name: name.trim(),
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Class already exists",
      });
    }

    const newClass = await ClassModel.create({
      name: name.trim(),
      sections,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Classes
export const getClasses = async (req, res) => {
  try {
    const classes = await ClassModel.find().sort({ name: 1 });

    return res.json({
      success: true,
      classes,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const { name, sections, status } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Class name cannot be empty",
        });
      }

      updateData.name = name.trim();
    }

    if (sections !== undefined) updateData.sections = sections;
    if (status !== undefined) updateData.status = status;

    const updatedClass = await ClassModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    return res.json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Class
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    const deletedClass = await ClassModel.findByIdAndDelete(id);

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    return res.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
