
import mongoose from "mongoose";
import AcademicTimetable from "../models/AcademicTimetable.js";
import AcademicCalendar from "../models/AcademicCalendar.js";
import AcademicSyllabus from "../models/AcademicSyllabus.js";
import AcademicSettings from "../models/AcademicSettings.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

function sendError(res, error, message = "Something went wrong") {
  console.error(message, error);
  return res.status(500).json({ success: false, message });
}

// ---------- TIMETABLE ----------

export const getTimetable = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.className) filter.className = req.query.className;
  if (req.query.section) filter.section = req.query.section;
  if (req.query.teacher) filter.teacher = req.query.teacher;
  if (req.query.day) filter.day = req.query.day;

  const data = await AcademicTimetable.find(filter).sort({
    day: 1,
    startTime: 1,
  });

  res.json({ success: true, data });
});

export const createTimetable = asyncHandler(async (req, res) => {
  const {
    className,
    section,
    subject,
    teacher,
    day,
    startTime,
    endTime,
    room,
  } = req.body;

  if (!className || !subject || !teacher || !day || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: "Class, subject, teacher, day aur timings required hain.",
    });
  }

  if (startTime >= endTime) {
    return res.status(400).json({
      success: false,
      message: "End time, start time ke baad hona chahiye.",
    });
  }

  const conflict = await AcademicTimetable.findOne({
    className,
    section: section || "",
    day,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (conflict) {
    return res.status(409).json({
      success: false,
      message: "Is class/section ka is time par pehle se period hai.",
    });
  }

  const data = await AcademicTimetable.create({
    className,
    section,
    subject,
    teacher,
    day,
    startTime,
    endTime,
    room,
  });

  res.status(201).json({ success: true, message: "Timetable created", data });
});

export const updateTimetable = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid timetable ID" });
  }

  const payload = { ...req.body };
  delete payload._id;
  delete payload.createdAt;
  delete payload.updatedAt;

  if (payload.startTime && payload.endTime && payload.startTime >= payload.endTime) {
    return res.status(400).json({
      success: false,
      message: "End time, start time ke baad hona chahiye.",
    });
  }

  const data = await AcademicTimetable.findByIdAndUpdate(
    req.params.id,
    { $set: payload },
    { new: true, runValidators: true }
  );

  if (!data) {
    return res.status(404).json({ success: false, message: "Timetable entry nahi mili." });
  }

  res.json({ success: true, message: "Timetable updated", data });
});

export const deleteTimetable = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid timetable ID" });
  }

  const data = await AcademicTimetable.findByIdAndDelete(req.params.id);

  if (!data) {
    return res.status(404).json({ success: false, message: "Timetable entry nahi mili." });
  }

  res.json({ success: true, message: "Timetable deleted" });
});

// ---------- ACADEMIC CALENDAR ----------

export const getCalendar = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.type) filter.type = req.query.type;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = req.query.from;
    if (req.query.to) filter.date.$lte = req.query.to;
  }

  const data = await AcademicCalendar.find(filter).sort({ date: 1 });
  res.json({ success: true, data });
});

export const createCalendarEvent = asyncHandler(async (req, res) => {
  const { title, date, type, description } = req.body;

  if (!title || !date || !type) {
    return res.status(400).json({
      success: false,
      message: "Title, date aur event type required hain.",
    });
  }

  const data = await AcademicCalendar.create({ title, date, type, description });
  res.status(201).json({ success: true, message: "Calendar event created", data });
});

export const updateCalendarEvent = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event ID" });
  }

  const data = await AcademicCalendar.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!data) return res.status(404).json({ success: false, message: "Event not found" });

  res.json({ success: true, message: "Event updated", data });
});

export const deleteCalendarEvent = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid event ID" });
  }

  const data = await AcademicCalendar.findByIdAndDelete(req.params.id);
  if (!data) return res.status(404).json({ success: false, message: "Event not found" });

  res.json({ success: true, message: "Event deleted" });
});

// ---------- SYLLABUS ----------

export const getSyllabus = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.className) filter.className = req.query.className;
  if (req.query.subject) filter.subject = req.query.subject;
  if (req.query.status) filter.status = req.query.status;

  const data = await AcademicSyllabus.find(filter).sort({
    className: 1,
    subject: 1,
    createdAt: 1,
  });

  res.json({ success: true, data });
});

export const createSyllabus = asyncHandler(async (req, res) => {
  const { className, subject, chapter } = req.body;

  if (!className || !subject || !chapter) {
    return res.status(400).json({
      success: false,
      message: "Class, subject aur chapter required hain.",
    });
  }

  const data = await AcademicSyllabus.create(req.body);
  res.status(201).json({ success: true, message: "Syllabus entry created", data });
});

export const updateSyllabus = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid syllabus ID" });
  }

  const data = await AcademicSyllabus.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  );

  if (!data) return res.status(404).json({ success: false, message: "Syllabus entry not found" });

  res.json({ success: true, message: "Syllabus updated", data });
});

export const deleteSyllabus = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid syllabus ID" });
  }

  const data = await AcademicSyllabus.findByIdAndDelete(req.params.id);
  if (!data) return res.status(404).json({ success: false, message: "Syllabus entry not found" });

  res.json({ success: true, message: "Syllabus deleted" });
});

// ---------- ACADEMIC SETTINGS ----------

export const getAcademicSettings = asyncHandler(async (req, res) => {
  let data = await AcademicSettings.findOne();

  if (!data) {
    data = await AcademicSettings.create({});
  }

  res.json({ success: true, data });
});

export const updateAcademicSettings = asyncHandler(async (req, res) => {
  const allowedFields = [
    "academicYear",
    "startDate",
    "endDate",
    "workingDays",
    "schoolStart",
    "schoolEnd",
    "periodDuration",
    "shortBreak",
    "lunchBreak",
    "periodsPerDay",
  ];

  const payload = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }

  if (
    payload.startDate &&
    payload.endDate &&
    payload.startDate > payload.endDate
  ) {
    return res.status(400).json({
      success: false,
      message: "Academic year ki end date start date se pehle nahi ho sakti.",
    });
  }

  const data = await AcademicSettings.findOneAndUpdate(
    {},
    { $set: payload },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  res.json({ success: true, message: "Academic settings saved", data });
});
