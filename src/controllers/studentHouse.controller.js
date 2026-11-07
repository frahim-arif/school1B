
import mongoose from "mongoose";
import Student from "../models/Student.js";

export const assignStudentsToHouse = async (req, res) => {
  try {
    const { studentIds, houseName } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one student.",
      });
    }

    if (typeof houseName !== "string" || houseName.trim().length > 40) {
      return res.status(400).json({
        success: false,
        message: "Valid house name is required (maximum 40 characters).",
      });
    }

    const uniqueIds = [...new Set(studentIds.map(String))];

    if (uniqueIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID.",
      });
    }

    const result = await Student.updateMany(
      { _id: { $in: uniqueIds } },
      { $set: { houseName: houseName.trim() } }
    );

    return res.status(200).json({
      success: true,
      message: houseName.trim()
        ? "Students assigned to house successfully."
        : "Students removed from their houses successfully.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Assign house error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to assign students to house.",
    });
  }
};
