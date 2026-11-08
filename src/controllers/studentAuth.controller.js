
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

// Student Login
export const studentLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    const student = await Student.findOne({
      username: username.trim().toLowerCase(),
    }).select("+password");

    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (student.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your student account is inactive. Contact the school office.",
      });
    }

    if (!student.password) {
      return res.status(401).json({
        success: false,
        message: "Login credentials are not configured. Contact the school office.",
      });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password",
      });
    }

    if (!process.env.STUDENT_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Student authentication is not configured on the server",
      });
    }

    const token = jwt.sign(
      {
        id: student._id.toString(),
        type: "student",
      },
      process.env.STUDENT_JWT_SECRET,
      { expiresIn: "7d" }
    );

    const studentData = student.toObject();
    delete studentData.password;

    return res.status(200).json({
      success: true,
      message: "Student Login Successful",
      token,
      student: studentData,
    });
  } catch (error) {
    console.error("Student Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Student login failed",
    });
  }
};

// Student Profile
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.student.id);

    if (!student || student.status !== "Active") {
      return res.status(404).json({
        success: false,
        message: "Student account not found or inactive",
      });
    }

    const studentData = student.toObject();
    delete studentData.password;

    return res.status(200).json({
      success: true,
      student: studentData,
    });
  } catch (error) {
    console.error("Student Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch student profile",
    });
  }
};
