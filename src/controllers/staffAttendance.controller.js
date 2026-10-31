
import mongoose from "mongoose";
import Staff from "../models/Staff.js";
import StaffAttendance from "../models/StaffAttendance.js";

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isValidDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
  new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value;

const validObjectId = (id) => mongoose.isValidObjectId(id);

export const getAttendance = async (req, res) => {
  try {
    const date = req.query.date || getToday();

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Date YYYY-MM-DD format mein honi chahiye",
      });
    }

    const staffList = await Staff.find({ status: "Active" })
      .sort({ firstName: 1, lastName: 1 })
      .lean();

    const records = await StaffAttendance.find({ date }).lean();

    const recordMap = new Map(
      records.map((record) => [String(record.staffId), record])
    );

    const attendance = staffList.map((staff) => {
      const record = recordMap.get(String(staff._id));

      return {
        _id: record?._id || null,
        staffId: staff,
        date,
        status: record?.status || "Absent",
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        remarks: record?.remarks || "",
      };
    });

    res.json({
      success: true,
      date,
      attendance,
      summary: {
        total: attendance.length,
        present: attendance.filter((item) => item.status === "Present").length,
        absent: attendance.filter((item) => item.status === "Absent").length,
        late: attendance.filter((item) => item.status === "Late").length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Attendance load nahi ho saki",
      error: error.message,
    });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { staffId, status, remarks } = req.body;
    const date = req.body.date || getToday();

    if (!validObjectId(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Valid staffId dena zaroori hai",
      });
    }

    if (!isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Date YYYY-MM-DD format mein honi chahiye",
      });
    }

    if (!["Present", "Absent", "Late"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status Present, Absent ya Late hona chahiye",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      status: "Active",
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Active staff nahi mila",
      });
    }

    const record = await StaffAttendance.findOneAndUpdate(
      { staffId, date },
      { $set: { status, remarks: remarks || "" } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: "Attendance save ho gayi",
      attendance: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Attendance save nahi ho saki",
      error: error.message,
    });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { staffId } = req.body;
    const date = req.body.date || getToday();

    if (!validObjectId(staffId) || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Valid staffId aur date zaroori hain",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      status: "Active",
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Active staff nahi mila",
      });
    }

    let record = await StaffAttendance.findOne({ staffId, date });

    if (record?.checkIn) {
      return res.status(409).json({
        success: false,
        message: "Is staff ka check-in pehle se save hai",
        attendance: record,
      });
    }

    const now = new Date();

    if (!record) {
      record = new StaffAttendance({
        staffId,
        date,
        status: "Present",
        checkIn: now,
      });
    } else {
      record.checkIn = now;
      if (record.status === "Absent") record.status = "Present";
    }

    await record.save();

    res.json({
      success: true,
      message: "Check-in save ho gaya",
      attendance: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Check-in save nahi ho saka",
      error: error.message,
    });
  }
};

export const checkOut = async (req, res) => {
  try {
    const { staffId } = req.body;
    const date = req.body.date || getToday();

    if (!validObjectId(staffId) || !isValidDate(date)) {
      return res.status(400).json({
        success: false,
        message: "Valid staffId aur date zaroori hain",
      });
    }

    const record = await StaffAttendance.findOne({ staffId, date });

    if (!record || !record.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Pehle check-in save karein",
      });
    }

    if (record.checkOut) {
      return res.status(409).json({
        success: false,
        message: "Check-out pehle se save hai",
        attendance: record,
      });
    }

    record.checkOut = new Date();
    await record.save();

    res.json({
      success: true,
      message: "Check-out save ho gaya",
      attendance: record,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Check-out save nahi ho saka",
      error: error.message,
    });
  }
};
