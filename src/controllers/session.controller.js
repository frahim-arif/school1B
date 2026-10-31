import Session from "../models/Session.js";

// Create Session
export const createSession = async (req, res) => {
  try {
    const { name, startDate, endDate, isCurrent } = req.body;

    const exists = await Session.findOne({ name });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Session already exists",
      });
    }

    if (isCurrent) {
      await Session.updateMany({}, { isCurrent: false });
    }

    const session = await Session.create({
      name,
      startDate,
      endDate,
      isCurrent,
    });

    res.status(201).json({
      success: true,
      message: "Session Created Successfully",
      session,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Sessions
export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      sessions,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Current Session
export const getCurrentSession = async (req, res) => {
  try {
    const session = await Session.findOne({
      isCurrent: true,
    });

    res.json({
      success: true,
      session,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};