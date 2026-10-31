
import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";

// Attendance mark/update
export const markAttendance = async (req, res) => {
  try {
    const { studentId, date, status, remarks, markedBy } = req.body;

    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        message: "studentId, date and status are required",
      });
    }

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const allowedStatuses = [
      "Present",
      "Absent",
      "Late",
      "Half Day",
      "Leave",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status",
      });
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        student: studentId,
        date: parsedDate,
      },
      {
        $set: {
          status,
          remarks: remarks || "",
          markedBy: markedBy || "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Attendance saved successfully",
      attendance,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Attendance already exists for this date",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Students ki selected date attendance
export const getAttendanceByDate = async (req, res) => {
  try {
    const { date, className, section } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date is required (YYYY-MM-DD)",
      });
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date. Use YYYY-MM-DD",
      });
    }

    const studentFilter = { status: "Active" };

    if (className) studentFilter.className = className;
    if (section) studentFilter.section = section;

    const students = await Student.find(studentFilter)
      .select("admissionNo rollNo firstName lastName className section photo")
      .sort({ rollNo: 1 });

    const records = await Attendance.find({
      date: parsedDate,
      student: { $in: students.map((student) => student._id) },
    });

    const attendanceMap = new Map(
      records.map((record) => [
        record.student.toString(),
        record,
      ])
    );

    res.json({
      success: true,
      date,
      students: students.map((student) => ({
        ...student.toObject(),
        attendance: attendanceMap.get(student._id.toString()) || null,
      })),
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Ek student ki monthly attendance history
export const getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { month, year } = req.query;

    if (!mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID",
      });
    }

    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const now = new Date();
    const selectedMonth = month === undefined ? now.getUTCMonth() + 1 : Number(month);
    const selectedYear = year === undefined ? now.getUTCFullYear() : Number(year);

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12 ||
      !Number.isInteger(selectedYear) ||
      selectedYear < 2000 ||
      selectedYear > 2100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid month or year",
      });
    }

    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 1));

    const records = await Attendance.find({
      student: studentId,
      date: { $gte: startDate, $lt: endDate },
    }).sort({ date: 1 });

    const summary = {
      Present: 0,
      Absent: 0,
      Late: 0,
      "Half Day": 0,
      Leave: 0,
    };

    records.forEach((record) => {
      summary[record.status] += 1;
    });

    const countedDays =
      summary.Present +
      summary.Absent +
      summary.Late +
      summary["Half Day"];

    const attendancePercentage =
      countedDays === 0
        ? 0
        : Math.round(
            ((summary.Present + summary.Late + summary["Half Day"] * 0.5) /
              countedDays) *
              100
          );

    res.json({
      success: true,
      student,
      month: selectedMonth,
      year: selectedYear,
      summary,
      totalRecords: records.length,
      attendancePercentage,
      records,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
