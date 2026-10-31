
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

import Notice from "../models/Notice.js";
import NoticeSettings from "../models/NoticeSettings.js";

const CATEGORIES = ["General", "Exam", "Holiday", "Fee", "Event"];
const AUDIENCES = ["All Students", "Teachers", "Staff", "Parents"];

function asyncHandler(fn) {
  return (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
}

function validId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function getEffectiveStatus(notice, autoExpire = true) {
  if (notice.status === "Draft") return "Draft";

  if (
    autoExpire &&
    notice.expiryDate &&
    new Date(notice.expiryDate) < new Date()
  ) {
    return "Expired";
  }

  return notice.status || "Active";
}

function publicNotice(notice, autoExpire = true) {
  const item =
    typeof notice.toObject === "function" ? notice.toObject() : { ...notice };

  item.status = getEffectiveStatus(item, autoExpire);
  return item;
}

async function getSettings() {
  return NoticeSettings.findOneAndUpdate(
    { key: "school-notice-settings" },
    { $setOnInsert: { key: "school-notice-settings" } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

function removeUploadedFile(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return;

  const filename = path.basename(fileUrl);

  if (!filename || filename === "." || filename === "..") return;

  const filePath = path.join(
    process.cwd(),
    "uploads",
    "notices",
    filename
  );

  fs.unlink(filePath, () => {});
}

function parseDate(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error(`${fieldName} is invalid`);
    error.statusCode = 400;
    throw error;
  }

  return date;
}

function validateNoticeDates(publishDate, expiryDate) {
  if (expiryDate && publishDate && expiryDate < publishDate) {
    const error = new Error(
      "Expiry date cannot be earlier than publish date"
    );
    error.statusCode = 400;
    throw error;
  }
}

function getAttachmentUrl(req, file) {
  if (!file) return undefined;

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  return `${baseUrl}/uploads/notices/${file.filename}`;
}

// GET /api/notices
export const getNotices = asyncHandler(async (req, res) => {
  const {
    search = "",
    category,
    audience,
    status,
    page = "1",
    limit = "20",
  } = req.query;

  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 20)
  );

  const filter = {};

  if (category && CATEGORIES.includes(category)) {
    filter.category = category;
  }

  if (audience && AUDIENCES.includes(audience)) {
    filter.audience = audience;
  }

  if (search.trim()) {
    filter.$or = [
      { title: { $regex: search.trim(), $options: "i" } },
      { description: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const settings = await getSettings();

  const [allMatches, total] = await Promise.all([
    Notice.find(filter).sort({ publishDate: -1, createdAt: -1 }),
    Notice.countDocuments(filter),
  ]);

  const normalized = allMatches.map((notice) =>
    publicNotice(notice, settings.autoExpire)
  );

  let filtered = normalized;

  if (status && ["Active", "Expired", "Draft"].includes(status)) {
    filtered = normalized.filter((notice) => notice.status === status);
  }

  const filteredTotal = filtered.length;
  const start = (pageNumber - 1) * pageSize;
  const notices = filtered.slice(start, start + pageSize);
  const resultTotal = status ? filteredTotal : total;

  res.json({
    success: true,
    notices,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total: resultTotal,
      pages: Math.ceil(resultTotal / pageSize),
    },
  });
});

// GET /api/notices/stats
export const getNoticeStats = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const all = await Notice.find().lean();

  const notices = all.map((notice) =>
    publicNotice(notice, settings.autoExpire)
  );

  const total = notices.length;
  const active = notices.filter((n) => n.status === "Active").length;
  const expired = notices.filter((n) => n.status === "Expired").length;
  const drafts = notices.filter((n) => n.status === "Draft").length;
  const views = notices.reduce(
    (sum, notice) => sum + (Number(notice.views) || 0),
    0
  );

  res.json({
    success: true,
    stats: { total, active, expired, drafts, views },
  });
});

// GET /api/notices/:id
export const getNoticeById = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice ID",
    });
  }

  const notice = await Notice.findById(req.params.id);

  if (!notice) {
    return res.status(404).json({
      success: false,
      message: "Notice not found",
    });
  }

  const settings = await getSettings();

  res.json({
    success: true,
    notice: publicNotice(notice, settings.autoExpire),
  });
});

// POST /api/notices
export const createNotice = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    audience,
    publishDate,
    expiryDate,
    status,
  } = req.body;

  if (!title || !String(title).trim()) {
    return res.status(400).json({
      success: false,
      message: "Notice title is required",
    });
  }

  if (!description || !String(description).trim()) {
    return res.status(400).json({
      success: false,
      message: "Notice description is required",
    });
  }

  if (category && !CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice category",
    });
  }

  if (audience && !AUDIENCES.includes(audience)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice audience",
    });
  }

  if (status && !["Active", "Expired", "Draft"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice status",
    });
  }

  const settings = await getSettings();
  const publish = parseDate(publishDate, "Publish date") || new Date();
  const expiry = parseDate(expiryDate, "Expiry date");

  validateNoticeDates(publish, expiry);

  let finalStatus = status || "Active";

  if (
    settings.autoExpire &&
    expiry &&
    expiry < new Date() &&
    finalStatus !== "Draft"
  ) {
    finalStatus = "Expired";
  }

  const notice = await Notice.create({
    title: String(title).trim(),
    description: String(description).trim(),
    category: category || settings.defaultCategory,
    audience: audience || "All Students",
    publishDate: publish,
    expiryDate: expiry,
    status: finalStatus,
    attachment: getAttachmentUrl(req, req.file) || "",
    attachmentOriginalName: req.file?.originalname || "",
  });

  res.status(201).json({
    success: true,
    message: "Notice created successfully",
    notice: publicNotice(notice, settings.autoExpire),
  });
});

// PUT /api/notices/:id
export const updateNotice = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice ID",
    });
  }

  const notice = await Notice.findById(req.params.id);

  if (!notice) {
    return res.status(404).json({
      success: false,
      message: "Notice not found",
    });
  }

  const allowedFields = [
    "title",
    "description",
    "category",
    "audience",
    "status",
  ];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      notice[field] =
        typeof req.body[field] === "string"
          ? req.body[field].trim()
          : req.body[field];
    }
  }

  if (req.body.category && !CATEGORIES.includes(req.body.category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice category",
    });
  }

  if (req.body.audience && !AUDIENCES.includes(req.body.audience)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice audience",
    });
  }

  if (
    req.body.status !== undefined &&
    !["Active", "Expired", "Draft"].includes(req.body.status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice status",
    });
  }

  if (req.body.publishDate !== undefined) {
    notice.publishDate = parseDate(req.body.publishDate, "Publish date");
  }

  if (req.body.expiryDate !== undefined) {
    notice.expiryDate = parseDate(req.body.expiryDate, "Expiry date");
  }

  validateNoticeDates(notice.publishDate, notice.expiryDate);

  if (req.file) {
    removeUploadedFile(notice.attachment);
    notice.attachment = getAttachmentUrl(req, req.file);
    notice.attachmentOriginalName = req.file.originalname;
  }

  const settings = await getSettings();

  if (
    settings.autoExpire &&
    notice.expiryDate &&
    notice.expiryDate < new Date() &&
    notice.status !== "Draft"
  ) {
    notice.status = "Expired";
  }

  await notice.save();

  res.json({
    success: true,
    message: "Notice updated successfully",
    notice: publicNotice(notice, settings.autoExpire),
  });
});

// DELETE /api/notices/:id
export const deleteNotice = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice ID",
    });
  }

  const notice = await Notice.findByIdAndDelete(req.params.id);

  if (!notice) {
    return res.status(404).json({
      success: false,
      message: "Notice not found",
    });
  }

  removeUploadedFile(notice.attachment);

  res.json({
    success: true,
    message: "Notice deleted successfully",
  });
});

// POST /api/notices/:id/view
export const recordNoticeView = asyncHandler(async (req, res) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid notice ID",
    });
  }

  const notice = await Notice.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!notice) {
    return res.status(404).json({
      success: false,
      message: "Notice not found",
    });
  }

  res.json({
    success: true,
    message: "Notice view recorded",
    views: notice.views,
  });
});
