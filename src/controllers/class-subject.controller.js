
import mongoose from "mongoose";
import ClassSubject from "../models/ClassSubject.js";
import ClassModel from "../models/Class.js";
import Subject from "../models/Subject.js";

const validId = (id) => mongoose.isValidObjectId(id);

const allowedTypes = ["Compulsory", "Optional"];

const populateAssignment = (query) =>
  query
    .populate("classId", "name status")
    .populate("subjectId", "name code type status");

export const getClassSubjects = async (req, res) => {
  try {
    const filter = {};

    if (req.query.classId) {
      if (!validId(req.query.classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid classId",
        });
      }
      filter.classId = req.query.classId;
    }

    if (req.query.subjectId) {
      if (!validId(req.query.subjectId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid subjectId",
        });
      }
      filter.subjectId = req.query.subjectId;
    }

    const assignments = await populateAssignment(
      ClassSubject.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error("getClassSubjects error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch class-subject assignments",
      error: error.message,
    });
  }
};

export const createClassSubject = async (req, res) => {
  try {
    const { classId, subjectId, subjectType = "Compulsory" } = req.body;

    if (!classId || !subjectId) {
      return res.status(400).json({
        success: false,
        message: "Class and subject are required",
      });
    }

    if (!validId(classId) || !validId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or subject ID",
      });
    }

    if (!allowedTypes.includes(subjectType)) {
      return res.status(400).json({
        success: false,
        message: "Assignment type must be Compulsory or Optional",
      });
    }

    const [classExists, subjectExists] = await Promise.all([
      ClassModel.findById(classId),
      Subject.findById(subjectId),
    ]);

    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    if (!subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Subject not found",
      });
    }

    // Subject model currently links each subject to a specific class.
    if (String(subjectExists.classId) !== String(classId)) {
      return res.status(400).json({
        success: false,
        message: "The selected subject does not belong to this class",
      });
    }

    const existing = await ClassSubject.findOne({
      classId,
      subjectId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This subject is already assigned to this class",
      });
    }

    const assignment = await ClassSubject.create({
      classId,
      subjectId,
      subjectType,
    });

    const populated = await populateAssignment(
      ClassSubject.findById(assignment._id)
    );

    return res.status(201).json({
      success: true,
      message: "Subject assigned successfully",
      assignment: populated,
    });
  } catch (error) {
    console.error("createClassSubject error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This subject is already assigned to this class",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to assign subject",
      error: error.message,
    });
  }
};

export const updateClassSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const current = await ClassSubject.findById(id);

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    const allowedFields = ["classId", "subjectId", "subjectType", "status"];
    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    if (
      updates.subjectType !== undefined &&
      !allowedTypes.includes(updates.subjectType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Assignment type must be Compulsory or Optional",
      });
    }

    const classId = updates.classId || String(current.classId);
    const subjectId = updates.subjectId || String(current.subjectId);

    if (!validId(classId) || !validId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or subject ID",
      });
    }

    const [classExists, subjectExists] = await Promise.all([
      ClassModel.findById(classId),
      Subject.findById(subjectId),
    ]);

    if (!classExists || !subjectExists) {
      return res.status(404).json({
        success: false,
        message: "Class or subject not found",
      });
    }

    if (String(subjectExists.classId) !== String(classId)) {
      return res.status(400).json({
        success: false,
        message: "The selected subject does not belong to this class",
      });
    }

    const duplicate = await ClassSubject.findOne({
      classId,
      subjectId,
      _id: { $ne: id },
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "This subject is already assigned to this class",
      });
    }

    const assignment = await populateAssignment(
      ClassSubject.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      })
    );

    return res.status(200).json({
      success: true,
      message: "Assignment updated successfully",
      assignment,
    });
  } catch (error) {
    console.error("updateClassSubject error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate class-subject assignment",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update assignment",
      error: error.message,
    });
  }
};

export const deleteClassSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid assignment ID",
      });
    }

    const assignment = await ClassSubject.findByIdAndDelete(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: "Assignment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assignment deleted successfully",
    });
  } catch (error) {
    console.error("deleteClassSubject error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete assignment",
      error: error.message,
    });
  }
};
