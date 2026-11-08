
import bcrypt from "bcryptjs";
import Student from "../models/Student.js";

// Add Student
export const createStudent = async (req, res) => {
  try {
    const {
      username,
      password,
      ...studentData
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Student username and password are required",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingStudent = await Student.findOne({
      username: cleanUsername,
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "This username is already taken",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = await Student.create({
      ...studentData,
      username: cleanUsername,
      password: hashedPassword,
    });

    const studentResponse = student.toObject();
    delete studentResponse.password;

    return res.status(201).json({
      success: true,
      message: "Student Added Successfully",
      student: studentResponse,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Admission number or username already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// All Students
export const getStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .sort({ createdAt: -1 });

    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Single Student
export const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Student
export const updateStudent = async (req, res) => {
  try {
    // Normal student edit must never save a plaintext password.
    const { password, ...updateData } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    res.json({
      success: true,
      message: "Student Updated Successfully",
      student,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Student
export const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student Not Found",
      });
    }

    res.json({
      success: true,
      message: "Student Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
