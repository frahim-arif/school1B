
import mongoose from "mongoose";
import Homework from "../models/homework.model.js";
import HomeworkSubmission from "../models/homework-submission.model.js";
import HomeworkSettings from "../models/homework-settings.model.js";
import path from "path";

const validId = (id) => mongoose.isValidObjectId(id);

const fail = (res, status, message) =>
  res.status(status).json({ success: false, message });

export const createHomework = async (req, res) => {
  try {
    const {
      title,
      subjectId,
      classId,
      sectionId,
      description,
      assignedDate,
      dueDate,
      attachment,
    } = req.body;

    if (!title?.trim() || !subjectId || !classId || !sectionId || !dueDate) {
      return fail(
        res,
        400,
        "Title, subject, class, section aur due date required hain."
      );
    }

    if (![subjectId, classId, sectionId].every(validId)) {
      return fail(res, 400, "Subject, class ya section ID invalid hai.");
    }

    if (Number.isNaN(Date.parse(dueDate))) {
      return fail(res, 400, "Due date valid honi chahiye.");
    }

    if (assignedDate && Number.isNaN(Date.parse(assignedDate))) {
      return fail(res, 400, "Assigned date valid honi chahiye.");
    }

    const homework = await Homework.create({
      title: title.trim(),
      subjectId,
      classId,
      sectionId,
      description,
      assignedDate: assignedDate || new Date(),
      dueDate,
      attachment: {
        url: attachment?.url || "",
        name: attachment?.name || "",
      },
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Homework successfully assign hua.",
      data: homework,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const getHomeworks = async (req, res) => {
  try {
    const {
      search = "",
      classId,
      sectionId,
      subjectId,
      status = "Active",
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status !== "all") filter.status = status;

    if (classId) {
      if (!validId(classId)) return fail(res, 400, "Invalid class ID");
      filter.classId = classId;
    }

    if (sectionId) {
      if (!validId(sectionId)) return fail(res, 400, "Invalid section ID");
      filter.sectionId = sectionId;
    }

    if (subjectId) {
      if (!validId(subjectId)) return fail(res, 400, "Invalid subject ID");
      filter.subjectId = subjectId;
    }

    if (search.trim()) {
      filter.title = { $regex: search.trim(), $options: "i" };
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const [items, total] = await Promise.all([
      Homework.find(filter)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      Homework.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const getHomeworkStats = async (req, res) => {
  try {
    const [total, active, archived, submissions, pending, checked, average] =
      await Promise.all([
        Homework.countDocuments(),
        Homework.countDocuments({ status: "Active" }),
        Homework.countDocuments({ status: "Archived" }),
        HomeworkSubmission.countDocuments(),
        HomeworkSubmission.countDocuments({
          status: { $in: ["Pending", "Submitted", "Late"] },
        }),
        HomeworkSubmission.countDocuments({ status: "Checked" }),
        HomeworkSubmission.aggregate([
          { $match: { status: "Checked", marks: { $ne: null } } },
          { $group: { _id: null, average: { $avg: "$marks" } } },
        ]),
      ]);

    return res.json({
      success: true,
      data: {
        totalHomework: total,
        activeHomework: active,
        archivedHomework: archived,
        totalSubmissions: submissions,
        pendingSubmissions: pending,
        checkedSubmissions: checked,
        averageMarks: average[0]?.average ?? 0,
      },
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const updateHomework = async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid homework ID");

    const allowed = [
      "title",
      "subjectId",
      "classId",
      "sectionId",
      "description",
      "assignedDate",
      "dueDate",
      "attachment",
      "status",
    ];

    const update = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    for (const key of ["subjectId", "classId", "sectionId"]) {
      if (update[key] && !validId(update[key])) {
        return fail(res, 400, `${key} invalid hai.`);
      }
    }

    const homework = await Homework.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );

    if (!homework) return fail(res, 404, "Homework nahi mila.");

    return res.json({
      success: true,
      message: "Homework update ho gaya.",
      data: homework,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const deleteHomework = async (req, res) => {
  try {
    if (!validId(req.params.id)) return fail(res, 400, "Invalid homework ID");

    const homework = await Homework.findByIdAndDelete(req.params.id);

    if (!homework) return fail(res, 404, "Homework nahi mila.");

    await HomeworkSubmission.deleteMany({ homeworkId: homework._id });

    return res.json({
      success: true,
      message: "Homework aur uski submissions delete ho gayi.",
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const getSubmissions = async (req, res) => {
  try {
    const filter = {};

    if (req.query.homeworkId) {
      if (!validId(req.query.homeworkId)) {
        return fail(res, 400, "Invalid homework ID");
      }
      filter.homeworkId = req.query.homeworkId;
    }

    if (req.query.status) filter.status = req.query.status;

    const items = await HomeworkSubmission.find(filter)
      .populate("homeworkId", "title subjectId classId sectionId dueDate")
      .populate("studentId")
      .sort({ updatedAt: -1 })
      .limit(200)
      .lean();

    return res.json({ success: true, data: items });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const reviewSubmission = async (req, res) => {
  try {
    const { marks, totalMarks = 10, feedback = "" } = req.body;

    if (!validId(req.params.id)) return fail(res, 400, "Invalid submission ID");

    if (
      marks === undefined ||
      !Number.isFinite(Number(marks)) ||
      !Number.isFinite(Number(totalMarks)) ||
      Number(totalMarks) <= 0 ||
      Number(marks) < 0 ||
      Number(marks) > Number(totalMarks)
    ) {
      return fail(res, 400, "Valid marks aur totalMarks required hain.");
    }

    const submission = await HomeworkSubmission.findByIdAndUpdate(
      req.params.id,
      {
        marks: Number(marks),
        totalMarks: Number(totalMarks),
        feedback,
        status: "Checked",
        checkedAt: new Date(),
        checkedBy: req.user?._id || null,
      },
      { new: true, runValidators: true }
    );

    if (!submission) return fail(res, 404, "Submission nahi mili.");

    return res.json({
      success: true,
      message: "Submission check ho gayi.",
      data: submission,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const getHomeworkSettings = async (req, res) => {
  try {
    const settings = await HomeworkSettings.findOneAndUpdate(
      { schoolId: "default" },
      { $setOnInsert: { schoolId: "default" } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, data: settings });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const saveHomeworkSettings = async (req, res) => {
  try {
    const allowed = [
      "maxFileSizeMB",
      "allowedFileTypes",
      "allowLateSubmission",
      "submissionNotification",
      "autoReminder",
      "reminderTiming",
    ];

    const update = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    if (
      update.maxFileSizeMB !== undefined &&
      (!Number.isFinite(Number(update.maxFileSizeMB)) ||
        Number(update.maxFileSizeMB) < 1 ||
        Number(update.maxFileSizeMB) > 100)
    ) {
      return fail(res, 400, "File size 1 se 100 MB ke beech honi chahiye.");
    }

    if (update.maxFileSizeMB !== undefined) {
      update.maxFileSizeMB = Number(update.maxFileSizeMB);
    }

    const settings = await HomeworkSettings.findOneAndUpdate(
      { schoolId: "default" },
      { $set: update, $setOnInsert: { schoolId: "default" } },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Homework settings save ho gayi.",
      data: settings,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

export const uploadHomeworkAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select a PDF or image file.",
      });
    }

    const backendUrl = (
      process.env.PUBLIC_BACKEND_URL ||
      `${req.protocol}://${req.get("host")}`
    ).replace(/\/+$/, "");

    const fileUrl = `${backendUrl}/uploads/homework/${encodeURIComponent(
      req.file.filename
    )}`;

    return res.status(201).json({
      success: true,
      message: "Homework attachment uploaded successfully.",
      data: {
        url: fileUrl,
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "File upload failed.",
    });
  }
};
