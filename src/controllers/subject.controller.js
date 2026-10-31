
import mongoose from "mongoose";
import Subject from "../models/Subject.js";
import ClassModel from "../models/Class.js";

// Create Subject
export const createSubject = async (req, res) => {
  try {
    const { name, code, classId, type = "Theory", status } = req.body;

    if (!name?.trim() || !code?.trim() || !classId) {
      return res.status(400).json({
        success: false,
        message: "Subject name, code and classId are required",
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

    const exists = await Subject.findOne({
      code: code.trim().toUpperCase(),
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    const subject = await Subject.create({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      classId,
      type,
      ...(status !== undefined && { status }),
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully",
      subject,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Subjects
export const getSubjects = async (req, res) => {
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

    const subjects = await Subject.find(filter)
      .populate("classId", "name")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      subjects,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Subject
export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subject = await Subject.findById(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    const { name, code, classId, type, status } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Subject name cannot be empty",
        });
      }
      subject.name = name.trim();
    }

    if (code !== undefined) {
      if (!code.trim()) {
        return res.status(400).json({
          success: false,
          message: "Subject code cannot be empty",
        });
      }
      subject.code = code.trim().toUpperCase();
    }

    if (classId !== undefined) {
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

      subject.classId = classId;
    }

    if (type !== undefined) subject.type = type;
    if (status !== undefined) subject.status = status;

    await subject.save();

    return res.json({
      success: true,
      message: "Subject updated successfully",
      subject,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Subject code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Subject
export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subject ID",
      });
    }

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    return res.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
