
import mongoose from "mongoose";
import Section from "../models/Section.js";
import ClassModel from "../models/Class.js";

// Create Section
export const createSection = async (req, res) => {
  try {
    const { name, classId, status } = req.body;

    if (!name?.trim() || !classId) {
      return res.status(400).json({
        success: false,
        message: "Section name and classId are required",
      });
    }

    if (!mongoose.isValidObjectId(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId",
      });
    }

    const classExists = await ClassModel.findById(classId);

    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const exists = await Section.findOne({
      name: name.trim(),
      classId,
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "This section already exists in this class",
      });
    }

    const section = await Section.create({
      name: name.trim(),
      classId,
      ...(status !== undefined && { status }),
    });

    return res.status(201).json({
      success: true,
      message: "Section created successfully",
      section,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Sections
export const getSections = async (req, res) => {
  try {
    const filter = {};

    if (req.query.classId) {
      if (!mongoose.isValidObjectId(req.query.classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid classId",
        });
      }

      filter.classId = req.query.classId;
    }

    const sections = await Section.find(filter)
      .populate("classId", "name")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      sections,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Section
export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    const section = await Section.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    const { name, classId, status } = req.body;
    const nextName = name !== undefined ? name.trim() : section.name;
    const nextClassId = classId !== undefined ? classId : section.classId;

    if (!nextName) {
      return res.status(400).json({
        success: false,
        message: "Section name cannot be empty",
      });
    }

    if (!mongoose.isValidObjectId(nextClassId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId",
      });
    }

    const classExists = await ClassModel.findById(nextClassId);

    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const duplicate = await Section.findOne({
      name: nextName,
      classId: nextClassId,
      _id: { $ne: id },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This section already exists in this class",
      });
    }

    section.name = nextName;
    section.classId = nextClassId;

    if (status !== undefined) section.status = status;

    await section.save();

    return res.json({
      success: true,
      message: "Section updated successfully",
      section,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Section
export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section ID",
      });
    }

    const section = await Section.findByIdAndDelete(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    return res.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
