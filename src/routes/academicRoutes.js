
import express from "express";
import {
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getCalendar,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getSyllabus,
  createSyllabus,
  updateSyllabus,
  deleteSyllabus,
  getAcademicSettings,
  updateAcademicSettings,
} from "../controllers/academicController.js";

const router = express.Router();

// Timetable
router.route("/timetable")
  .get(getTimetable)
  .post(createTimetable);

router.route("/timetable/:id")
  .put(updateTimetable)
  .delete(deleteTimetable);

// Class and teacher timetable use the same timetable records
router.get("/class-timetable", (req, res, next) => {
  if (!req.query.className) {
    return res.status(400).json({
      success: false,
      message: "className query parameter required hai.",
    });
  }
  req.url = `/timetable?${new URLSearchParams(req.query).toString()}`;
  next("route");
}, getTimetable);

router.get("/teacher-timetable", (req, res, next) => {
  if (!req.query.teacher) {
    return res.status(400).json({
      success: false,
      message: "teacher query parameter required hai.",
    });
  }
  req.url = `/timetable?${new URLSearchParams(req.query).toString()}`;
  next("route");
}, getTimetable);

// Academic Calendar
router.route("/academic-calendar")
  .get(getCalendar)
  .post(createCalendarEvent);

router.route("/academic-calendar/:id")
  .put(updateCalendarEvent)
  .delete(deleteCalendarEvent);

// Syllabus
router.route("/syllabus")
  .get(getSyllabus)
  .post(createSyllabus);

router.route("/syllabus/:id")
  .put(updateSyllabus)
  .delete(deleteSyllabus);

// Academic Settings
router.route("/academic-settings")
  .get(getAcademicSettings)
  .put(updateAcademicSettings);

export default router;
