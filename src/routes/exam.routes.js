
import express from "express";
import mongoose from "mongoose";

import Exam from "../models/Exam.js";
import ExamSchedule from "../models/ExamSchedule.js";
import ExamResult from "../models/ExamResult.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";
import Subject from "../models/Subject.js";
import Student from "../models/Student.js";
import Session from "../models/Session.js";

const router = express.Router();

const isValidId = (id) => mongoose.isValidObjectId(id);

const sendError = (res, error, status = 500) => {
  console.error("Exam API error:", error);

  return res.status(status).json({
    success: false,
    message:
      status === 500
        ? "Server error while processing exam request."
        : error.message,
  });
};

const getGrade = (percentage) => {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 33) return "C";
  return "F";
};

// GET /api/exams/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalExams,
      upcoming,
      ongoing,
      completed,
      publishedResults,
    ] = await Promise.all([
      Exam.countDocuments(),
      Exam.countDocuments({
        status: "Upcoming",
        startDate: { $gte: today },
      }),
      Exam.countDocuments({ status: "Ongoing" }),
      Exam.countDocuments({ status: "Completed" }),
      Exam.countDocuments({ resultPublished: true }),
    ]);

    return res.json({
      success: true,
      dashboard: {
        totalExams,
        upcoming,
        ongoing,
        completed,
        publishedResults,
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// GET /api/exams
router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.classId) {
      if (!isValidId(req.query.classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid classId.",
        });
      }
      filter.classId = req.query.classId;
    }

    if (req.query.sessionId) {
      if (!isValidId(req.query.sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sessionId.",
        });
      }
      filter.sessionId = req.query.sessionId;
    }

    if (req.query.status) filter.status = req.query.status;

    if (req.query.search) {
      filter.name = {
        $regex: req.query.search.trim(),
        $options: "i",
      };
    }

    const exams = await Exam.find(filter)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId")
      .sort({ startDate: -1 });

    return res.json({
      success: true,
      count: exams.length,
      exams,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// POST /api/exams
router.post("/", async (req, res) => {
  try {
    const {
      name,
      type,
      classId,
      sectionId,
      sessionId,
      startDate,
      endDate,
      status,
      instructions,
    } = req.body;

    if (
      !name?.trim() ||
      !classId ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "name, classId, startDate and endDate are required.",
      });
    }

    if (!isValidId(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid classId.",
      });
    }

    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    if (sectionId) {
      if (!isValidId(sectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sectionId.",
        });
      }

      const section = await Section.findOne({
        _id: sectionId,
        classId,
      });

      if (!section) {
        return res.status(400).json({
          success: false,
          message: "Selected section does not belong to this class.",
        });
      }
    }

    if (sessionId) {
      if (!isValidId(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sessionId.",
        });
      }

      const session = await Session.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Session not found.",
        });
      }
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid exam dates. End date cannot be before start date.",
      });
    }

    const exam = await Exam.create({
      name: name.trim(),
      type,
      classId,
      sectionId: sectionId || null,
      sessionId: sessionId || null,
      startDate: start,
      endDate: end,
      status,
      instructions,
    });

    const populatedExam = await Exam.findById(exam._id)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId");

    return res.status(201).json({
      success: true,
      message: "Exam created successfully.",
      exam: populatedExam,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendError(res, error, 400);
    }
    return sendError(res, error);
  }
});

// GET /api/exams/:id/schedule
router.get("/:id/schedule", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const schedules = await ExamSchedule.find({
      examId: exam._id,
    })
      .populate("subjectId", "name code type")
      .populate("classId", "name")
      .populate("sectionId", "name")
      .sort({ examDate: 1, startTime: 1 });

    return res.json({
      success: true,
      count: schedules.length,
      schedules,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// POST /api/exams/:id/schedule
router.post("/:id/schedule", async (req, res) => {
  try {
    const { subjectId, examDate, startTime, endTime, room, totalMarks, passingMarks, sectionId, instructions } = req.body;

    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    if (!subjectId || !examDate || !startTime || !endTime || totalMarks === undefined || passingMarks === undefined) {
      return res.status(400).json({
        success: false,
        message: "subjectId, examDate, startTime, endTime, totalMarks and passingMarks are required.",
      });
    }

    if (!isValidId(subjectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subjectId.",
      });
    }

    const subject = await Subject.findOne({
      _id: subjectId,
      classId: exam.classId,
      status: "Active",
    });

    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject is not active or does not belong to the exam class.",
      });
    }

    if (sectionId) {
      if (!isValidId(sectionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sectionId.",
        });
      }

      const section = await Section.findOne({
        _id: sectionId,
        classId: exam.classId,
      });

      if (!section) {
        return res.status(400).json({
          success: false,
          message: "Section does not belong to the exam class.",
        });
      }
    }

    const date = new Date(examDate);
    if (
      Number.isNaN(date.getTime()) ||
      date < new Date(exam.startDate) ||
      date > new Date(exam.endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Schedule date must be within the exam start and end dates.",
      });
    }

    if (
      !Number.isFinite(Number(totalMarks)) ||
      !Number.isFinite(Number(passingMarks)) ||
      Number(totalMarks) < 1 ||
      Number(passingMarks) < 0 ||
      Number(passingMarks) > Number(totalMarks)
    ) {
      return res.status(400).json({
        success: false,
        message: "Marks must be valid and passing marks cannot exceed total marks.",
      });
    }

    const schedule = await ExamSchedule.create({
      examId: exam._id,
      subjectId,
      classId: exam.classId,
      sectionId: sectionId || null,
      examDate: date,
      startTime,
      endTime,
      room,
      totalMarks: Number(totalMarks),
      passingMarks: Number(passingMarks),
      instructions,
    });

    const populatedSchedule = await ExamSchedule.findById(schedule._id)
      .populate("subjectId", "name code type")
      .populate("classId", "name")
      .populate("sectionId", "name");

    return res.status(201).json({
      success: true,
      message: "Exam schedule created successfully.",
      schedule: populatedSchedule,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A schedule for this subject and section already exists for this exam.",
      });
    }
    if (error.name === "ValidationError") {
      return sendError(res, error, 400);
    }
    return sendError(res, error);
  }
});

// GET /api/exams/:id/marks
router.get("/:id/marks", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const filter = { examId: req.params.id };

    if (req.query.scheduleId) {
      if (!isValidId(req.query.scheduleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid scheduleId.",
        });
      }
      filter.scheduleId = req.query.scheduleId;
    }

    if (req.query.studentId) {
      if (!isValidId(req.query.studentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid studentId.",
        });
      }
      filter.studentId = req.query.studentId;
    }

    const results = await ExamResult.find(filter)
      .populate("studentId")
      .populate({
        path: "scheduleId",
        populate: { path: "subjectId", select: "name code" },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// POST /api/exams/:id/marks
// Body: { scheduleId, marks: [{ studentId, marksObtained, remarks }] }
router.post("/:id/marks", async (req, res) => {
  try {
    const { scheduleId, marks } = req.body;

    if (!isValidId(req.params.id) || !isValidId(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: "Valid exam ID and scheduleId are required.",
      });
    }

    if (!Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "marks must be a non-empty array.",
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    if (exam.resultPublished) {
      return res.status(400).json({
        success: false,
        message: "Results have already been published. Unpublish before editing marks.",
      });
    }

    const schedule = await ExamSchedule.findOne({
      _id: scheduleId,
      examId: exam._id,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found for this exam.",
      });
    }

    const seenStudents = new Set();
    const savedResults = [];

    for (const item of marks) {
      const { studentId, marksObtained, remarks } = item;

      if (!isValidId(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Every marks entry must contain a valid studentId.",
        });
      }

      if (seenStudents.has(String(studentId))) {
        return res.status(400).json({
          success: false,
          message: "Duplicate studentId in marks payload.",
        });
      }
      seenStudents.add(String(studentId));

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student not found: ${studentId}`,
        });
      }

      const obtained = Number(marksObtained);
      if (
        !Number.isFinite(obtained) ||
        obtained < 0 ||
        obtained > schedule.totalMarks
      ) {
        return res.status(400).json({
          success: false,
          message: `Marks must be between 0 and ${schedule.totalMarks}.`,
        });
      }

      let result = await ExamResult.findOne({
        scheduleId: schedule._id,
        studentId,
      });

      if (!result) {
        result = new ExamResult({
          examId: exam._id,
          scheduleId: schedule._id,
          studentId,
        });
      }

      result.marksObtained = obtained;
      result.totalMarks = schedule.totalMarks;
      result.remarks = remarks || "";
      result.status = "Draft";

      await result.save();
      savedResults.push(result);
    }

    return res.json({
      success: true,
      message: "Marks saved successfully.",
      count: savedResults.length,
      results: savedResults,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendError(res, error, 400);
    }
    return sendError(res, error);
  }
});

// GET /api/exams/:id/results
router.get("/:id/results", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const filter = { examId: exam._id };

    if (req.query.scheduleId) {
      if (!isValidId(req.query.scheduleId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid scheduleId.",
        });
      }
      filter.scheduleId = req.query.scheduleId;
    }

    if (req.query.status) filter.status = req.query.status;

    const results = await ExamResult.find(filter)
      .populate("studentId")
      .populate({
        path: "scheduleId",
        populate: { path: "subjectId", select: "name code" },
      })
      .sort({ studentId: 1 });

    return res.json({
      success: true,
      exam,
      published: exam.resultPublished,
      count: results.length,
      results,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// PATCH /api/exams/:id/results/publish
router.patch("/:id/results/publish", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const { published = true } = req.body;

    if (typeof published !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "published must be true or false.",
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const resultCount = await ExamResult.countDocuments({
      examId: exam._id,
    });

    if (published && resultCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot publish results before marks are entered.",
      });
    }

    await ExamResult.updateMany(
      { examId: exam._id },
      { $set: { status: published ? "Published" : "Draft" } }
    );

    exam.resultPublished = published;
    await exam.save();

    return res.json({
      success: true,
      message: published ? "Results published successfully." : "Results unpublished successfully.",
      published,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

// GET /api/exams/:id
router.get("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findById(req.params.id)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId");

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    return res.json({ success: true, exam });
  } catch (error) {
    return sendError(res, error);
  }
});

// PATCH /api/exams/:id
router.patch("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    const allowedFields = [
      "name",
      "type",
      "classId",
      "sectionId",
      "sessionId",
      "startDate",
      "endDate",
      "status",
      "instructions",
    ];

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        exam[field] = req.body[field] === "" && ["sectionId", "sessionId"].includes(field)
          ? null
          : req.body[field];
      }
    }

    if (exam.classId && !await Class.findById(exam.classId)) {
      return res.status(400).json({
        success: false,
        message: "Selected class does not exist.",
      });
    }

    if (exam.sectionId) {
      const section = await Section.findOne({
        _id: exam.sectionId,
        classId: exam.classId,
      });
      if (!section) {
        return res.status(400).json({
          success: false,
          message: "Selected section does not belong to the selected class.",
        });
      }
    }

    if (exam.sessionId && !await Session.findById(exam.sessionId)) {
      return res.status(400).json({
        success: false,
        message: "Selected session does not exist.",
      });
    }

    if (new Date(exam.endDate) < new Date(exam.startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date.",
      });
    }

    await exam.save();

    const updatedExam = await Exam.findById(exam._id)
      .populate("classId", "name")
      .populate("sectionId", "name")
      .populate("sessionId");

    return res.json({
      success: true,
      message: "Exam updated successfully.",
      exam: updatedExam,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return sendError(res, error, 400);
    }
    return sendError(res, error);
  }
});

// DELETE /api/exams/:id
router.delete("/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid exam ID.",
      });
    }

    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found.",
      });
    }

    await ExamResult.deleteMany({ examId: exam._id });
    await ExamSchedule.deleteMany({ examId: exam._id });
    await Exam.deleteOne({ _id: exam._id });

    return res.json({
      success: true,
      message: "Exam and its schedules/results deleted successfully.",
    });
  } catch (error) {
    return sendError(res, error);
  }
});

export default router;
