
import mongoose from "mongoose";
import Timetable from "../models/timetable.model.js";

export const createTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.create(req.body);

    res.status(201).json({
      success: true,
      message: "Timetable Created Successfully",
      timetable,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getTimetables = async (req, res) => {
  try {
    const filter = {};

    const { classId, sectionId, teacherId, day } = req.query;

    if (classId) filter.classId = classId;
    if (sectionId) filter.sectionId = sectionId;
    if (teacherId) filter.teacherId = teacherId;
    if (day) filter.day = day;

    const timetables = await Timetable.find(filter)
      .populate("classId")
      .populate("sectionId")
      .populate("subjectId")
      .populate("teacherId")
      .sort({ day: 1, startTime: 1 });

    res.json({
      success: true,
      count: timetables.length,
      timetables,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateTimetable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable ID",
      });
    }

    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("classId")
      .populate("sectionId")
      .populate("subjectId")
      .populate("teacherId");

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.json({
      success: true,
      message: "Timetable Updated Successfully",
      timetable,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteTimetable = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid timetable ID",
      });
    }

    const timetable = await Timetable.findByIdAndDelete(req.params.id);

    if (!timetable) {
      return res.status(404).json({
        success: false,
        message: "Timetable not found",
      });
    }

    res.json({
      success: true,
      message: "Timetable Deleted Successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
