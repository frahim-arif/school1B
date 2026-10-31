
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import Department from "../models/Department.js";

// Create a new teacher
export const createTeacher = async (req, res) => {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      gender,
      joiningDate,
      departmentId,
    } = req.body;

    // Required field validation
    if (
      !employeeId?.trim() ||
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !gender ||
      !joiningDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Employee ID, name, email, phone, gender and joining date are required",
      });
    }

    // Validate department ID if provided
    if (departmentId) {
      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid department ID",
        });
      }

      const department = await Department.findById(departmentId);

      if (!department) {
        return res.status(404).json({
          success: false,
          message: "Selected department not found",
        });
      }

      if (department.status !== "Active") {
        return res.status(400).json({
          success: false,
          message: "Please select an active department",
        });
      }
    }

    const teacher = await Teacher.create({
      ...req.body,
      employeeId: employeeId.trim(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      departmentId: departmentId || null,
    });

    const populatedTeacher = await Teacher.findById(teacher._id)
      .populate("departmentId", "name code status")
      .populate("classIds", "name")
      .populate("subjectIds", "name");

    return res.status(201).json({
      success: true,
      message: "Teacher Added Successfully",
      teacher: populatedTeacher,
    });
  } catch (err) {
    if (err.code === 11000) {
      const duplicateField = Object.keys(err.keyPattern || {})[0];

      const message =
        duplicateField === "email"
          ? "Email already exists"
          : duplicateField === "employeeId"
          ? "Employee ID already exists"
          : "A teacher with these details already exists";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create teacher",
      error: err.message,
    });
  }
};

// Get all teachers
export const getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("departmentId", "name code status")
      .populate("classIds", "name")
      .populate("subjectIds", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teachers",
      error: err.message,
    });
  }
};

// Get a single teacher by ID
export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await Teacher.findById(id)
      .populate("departmentId", "name code status")
      .populate("classIds", "name")
      .populate("subjectIds", "name");

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      teacher,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch teacher",
      error: err.message,
    });
  }
};

// Delete a teacher
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid teacher ID",
      });
    }

    const teacher = await Teacher.findByIdAndDelete(id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete teacher",
      error: err.message,
    });
  }
};
