
import jwt from "jsonwebtoken";

export const protectStudent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Student authentication required",
      });
    }

    if (!process.env.STUDENT_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Student authentication is not configured",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.STUDENT_JWT_SECRET
    );

    if (decoded.type !== "student" || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid student token",
      });
    }

    req.student = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired student session",
    });
  }
};
