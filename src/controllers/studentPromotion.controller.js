
import mongoose from "mongoose";
import Student from "../models/Student.js";
import StudentPromotion from "../models/StudentPromotion.js";

// GET: Promotion history
export const getPromotionHistory = async (req, res) => {
  try {
    const history = await StudentPromotion.find()
      .populate("student", "firstName lastName admissionNo rollNo")
      .sort({ promotedAt: -1 });

    return res.json({
      success: true,
      count: history.length,
      history,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// POST: Bulk promote students
export const promoteStudents = async (req, res) => {
  try {
    const {
      studentIds,
      fromClass,
      fromSection = "",
      fromSession,
      toClass,
      toSection = "",
      toSession,
    } = req.body;

    if (
      !Array.isArray(studentIds) ||
      studentIds.length === 0 ||
      !fromClass ||
      !fromSession ||
      !toClass ||
      !toSession
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Student IDs, current class/session aur target class/session required hain.",
      });
    }

    if (new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Student list mein duplicate IDs hain.",
      });
    }

    if (studentIds.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID mila hai.",
      });
    }

    if (fromClass === toClass && fromSession === toSession &&
        fromSection === toSection) {
      return res.status(400).json({
        success: false,
        message: "Current aur target details same nahi ho sakti.",
      });
    }

    const students = await Student.find({
      _id: { $in: studentIds },
    });

    if (students.length !== studentIds.length) {
      return res.status(404).json({
        success: false,
        message: "Kuch selected students nahi mile.",
      });
    }

    // Kisi bhi student ko update karne se pehle sabhi records validate karein.
    for (const student of students) {
      if (
        student.className !== fromClass ||
        student.session !== fromSession ||
        (fromSection && student.section !== fromSection)
      ) {
        return res.status(400).json({
          success: false,
          message: `${student.firstName} ${student.lastName}: current class, section ya session match nahi karta.`,
        });
      }

      const alreadyPromoted = await StudentPromotion.findOne({
        student: student._id,
        fromSession,
        toSession,
      });

      if (alreadyPromoted) {
        return res.status(409).json({
          success: false,
          message: `${student.firstName} ${student.lastName} ka is session pair ke liye promotion record pehle se hai.`,
        });
      }
    }

    const historyRecords = students.map((student) => ({
      student: student._id,
      admissionNo: student.admissionNo,
      fromClass: student.className,
      fromSection: student.section || "",
      fromSession: student.session,
      toClass,
      toSection,
      toSession,
    }));

    // History create karein, phir current student records update karein.
    // Agar history creation fail hoti hai, students update nahi honge.
    await StudentPromotion.insertMany(historyRecords, { ordered: true });

    const updateResult = await Student.updateMany(
      {
        _id: { $in: studentIds },
        className: fromClass,
        session: fromSession,
        ...(fromSection ? { section: fromSection } : {}),
      },
      {
        $set: {
          className: toClass,
          section: toSection,
          session: toSession,
        },
      },
      { runValidators: true }
    );

    if (updateResult.modifiedCount !== students.length) {
      return res.status(409).json({
        success: false,
        message:
          "Kuch student records update nahi hue. Database records check karein; promotion history bhi verify karein.",
        modifiedCount: updateResult.modifiedCount,
      });
    }

    return res.status(200).json({
      success: true,
      message: `${students.length} students successfully promoted.`,
      promotedCount: students.length,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate promotion record. Students ki current session details check karein.",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
