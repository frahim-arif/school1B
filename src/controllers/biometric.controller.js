import mongoose from "mongoose";
import BiometricLog from "../models/biometricLog.model.js";

export async function getBiometricLogs(req, res) {
  try {
    const { date, search = "", personType = "" } = req.query;

    const filter = {};

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Use YYYY-MM-DD.",
        });
      }

      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCDate(end.getUTCDate() + 1);

      filter.timestamp = { $gte: start, $lt: end };
    }

    if (personType) {
      if (!["Teacher", "Student", "Staff"].includes(personType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid person type.",
        });
      }

      filter.personType = personType;
    }

    if (search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      filter.$or = [
        { personName: regex },
        { employeeId: regex },
        { admissionNo: regex },
        { deviceName: regex },
        { deviceId: regex },
      ];
    }

    const logs = await BiometricLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(500)
      .lean();

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("getBiometricLogs error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch biometric logs.",
    });
  }
}

export async function createBiometricLog(req, res) {
  try {
    const {
      personType,
      personId,
      personName,
      employeeId,
      admissionNo,
      eventType,
      timestamp,
      deviceId,
      deviceName,
      source,
      remarks,
    } = req.body;

    if (!["Teacher", "Student", "Staff"].includes(personType)) {
      return res.status(400).json({
        success: false,
        message: "Valid personType is required.",
      });
    }

    if (!mongoose.isValidObjectId(personId)) {
      return res.status(400).json({
        success: false,
        message: "Valid personId is required.",
      });
    }

    if (!["Check In", "Check Out"].includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: "eventType must be Check In or Check Out.",
      });
    }

    const eventDate = timestamp ? new Date(timestamp) : new Date();

    if (Number.isNaN(eventDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid timestamp.",
      });
    }

    if (source && !["Manual", "Device"].includes(source)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source.",
      });
    }

    const log = await BiometricLog.create({
      personType,
      personId,
      personName,
      employeeId,
      admissionNo,
      eventType,
      timestamp: eventDate,
      deviceId,
      deviceName,
      source: source || "Manual",
      remarks,
    });

    return res.status(201).json({
      success: true,
      message: "Attendance log saved successfully.",
      log,
    });
  } catch (error) {
    console.error("createBiometricLog error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save biometric log.",
    });
  }
}