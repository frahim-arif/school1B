import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import TeacherAttendance from "../models/TeacherAttendance.js";

const parseDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

// GET /api/teacher-attendance?date=YYYY-MM-DD
export const getTeacherAttendance = async (req, res) => {
  try {
    const dateString =
      req.query.date || new Date().toISOString().slice(0, 10);

    const date = parseDate(dateString);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Valid date required in YYYY-MM-DD format",
      });
    }

    const search = String(req.query.search || "").trim();

    const teacherFilter = { status: "Active" };

    if (search) {
      teacherFilter.$or = [
        { name: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const teachers = await Teacher.find(teacherFilter)
      .select("employeeId name email phone subjectIds classIds status")
      .populate("subjectIds", "name")
      .populate("classIds", "name")
      .sort({ name: 1 })
      .lean();

    const teacherIds = teachers.map((teacher) => teacher._id);

    const records = await TeacherAttendance.find({
      teacher: { $in: teacherIds },
      date,
    }).lean();

    const attendanceMap = new Map(
      records.map((record) => [String(record.teacher), record])
    );

    const rows = teachers.map((teacher) => ({
      ...teacher,
      attendance: attendanceMap.get(String(teacher._id)) || null,
    }));

    const summary = {
      total: rows.length,
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0,
      notMarked: 0,
    };

    rows.forEach(({ attendance }) => {
      if (!attendance) {
        summary.notMarked++;
      } else if (attendance.status === "Present") {
        summary.present++;
      } else if (attendance.status === "Absent") {
        summary.absent++;
      } else if (attendance.status === "Late") {
        summary.late++;
      } else if (attendance.status === "Half Day") {
        summary.halfDay++;
      } else if (attendance.status === "Leave") {
        summary.leave++;
      }
    });

    res.json({
      success: true,
      date: dateString,
      summary,
      teachers: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// POST /api/teacher-attendance
export const saveTeacherAttendance = async (req, res) => {
  try {
    const { teacherId, date: dateString, status, checkIn, checkOut, remarks } =
      req.body;

    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Valid teacherId required",
      });
    }

    const date = parseDate(dateString);

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Valid date required in YYYY-MM-DD format",
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

    const teacher = await Teacher.findOne({
      _id: teacherId,
      status: "Active",
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Active teacher not found",
      });
    }

    const attendance = await TeacherAttendance.findOneAndUpdate(
      { teacher: teacherId, date },
      {
        $set: {
          status,
          checkIn: checkIn || "",
          checkOut: checkOut || "",
          remarks: remarks || "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Teacher attendance saved successfully",
      attendance,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET /api/teacher-attendance/teacher/:teacherId
export const getTeacherAttendanceHistory = async (req, res) => {
  try {
    const { teacherId } = req.params;

    if (!mongoose.isValidObjectId(teacherId)) {
      return res.status(400).json({
        success: false,
        message: "Valid teacherId required",
      });
    }

    const teacher = await Teacher.findById(teacherId).lean();

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    const filter = { teacher: teacherId };

    if (req.query.month || req.query.year) {
      const now = new Date();
      const year = Number(req.query.year || now.getFullYear());
      const month = Number(req.query.month || now.getMonth() + 1);

      if (
        !Number.isInteger(year) ||
        year < 2000 ||
        year > 2100 ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid month and year required",
        });
      }

      filter.date = {
        $gte: new Date(Date.UTC(year, month - 1, 1)),
        $lt: new Date(Date.UTC(year, month, 1)),
      };
    }

    const records = await TeacherAttendance.find(filter)
      .sort({ date: -1 })
      .lean();

    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0,
    };

    records.forEach((record) => {
      if (record.status === "Present") summary.present++;
      if (record.status === "Absent") summary.absent++;
      if (record.status === "Late") summary.late++;
      if (record.status === "Half Day") summary.halfDay++;
      if (record.status === "Leave") summary.leave++;
    });

    res.json({
      success: true,
      teacher,
      summary,
      totalRecords: records.length,
      records,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};