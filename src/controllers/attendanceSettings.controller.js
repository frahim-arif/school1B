
import AttendanceSettings from "../models/AttendanceSettings.js";

const DEFAULT_SETTINGS = {
  minimumWorkingHours: 6,
  allowedLateMinutes: 15,
  startTime: "08:00",
  endTime: "14:00",
  autoAttendance: false,
  weekends: ["Sunday"],
};

export const getAttendanceSettings = async (req, res) => {
  try {
    let settings = await AttendanceSettings.findOne();

    if (!settings) {
      settings = await AttendanceSettings.create(DEFAULT_SETTINGS);
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get attendance settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load attendance settings",
    });
  }
};

export const saveAttendanceSettings = async (req, res) => {
  try {
    const {
      minimumWorkingHours,
      allowedLateMinutes,
      startTime,
      endTime,
      autoAttendance,
      weekends,
    } = req.body;

    if (
      minimumWorkingHours === undefined ||
      allowedLateMinutes === undefined ||
      !startTime ||
      !endTime ||
      typeof autoAttendance !== "boolean" ||
      !Array.isArray(weekends)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all attendance settings",
      });
    }

    const hours = Number(minimumWorkingHours);
    const lateMinutes = Number(allowedLateMinutes);

    if (
      !Number.isFinite(hours) ||
      hours < 0 ||
      hours > 24 ||
      !Number.isInteger(lateMinutes) ||
      lateMinutes < 0 ||
      lateMinutes > 1440
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid working hours or late minutes",
      });
    }

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time must use HH:mm format",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time",
      });
    }

    const allowedWeekends = ["Friday", "Saturday", "Sunday"];

    if (
      weekends.some((day) => !allowedWeekends.includes(day)) ||
      new Set(weekends).size !== weekends.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid weekend selection",
      });
    }

    let settings = await AttendanceSettings.findOne();

    if (settings) {
      settings.minimumWorkingHours = hours;
      settings.allowedLateMinutes = lateMinutes;
      settings.startTime = startTime;
      settings.endTime = endTime;
      settings.autoAttendance = autoAttendance;
      settings.weekends = weekends;

      await settings.save();
    } else {
      settings = await AttendanceSettings.create({
        minimumWorkingHours: hours,
        allowedLateMinutes: lateMinutes,
        startTime,
        endTime,
        autoAttendance,
        weekends,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Attendance settings saved successfully",
      settings,
    });
  } catch (error) {
    console.error("Save attendance settings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save attendance settings",
    });
  }
};
