
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import Holiday from "../models/Holiday.js";

const ALLOWED_TYPES = [
  "National Holiday",
  "Festival Holiday",
  "School Event",
];

const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "holidays");

async function removeUploadedFile(fileUrl) {
  if (!fileUrl) return;

  // Only remove files belonging to this upload directory.
  const filename = path.basename(fileUrl);

  if (!filename || filename === "." || filename === "..") return;

  try {
    await fs.unlink(path.join(UPLOAD_DIR, filename));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Holiday file cleanup failed:", error.message);
    }
  }
}

async function cleanupRequestFiles(req) {
  const files = [
    ...(req.files?.pdf || []),
    ...(req.files?.image || []),
  ];

  await Promise.all(
    files.map((file) => removeUploadedFile(`/uploads/holidays/${file.filename}`))
  );
}

function getUploadedUrl(req, field) {
  const file = req.files?.[field]?.[0];
  if (!file) return "";

  return `/uploads/holidays/${file.filename}`;
}

function isValidDate(value) {
  return typeof value === "string" &&
    value.trim() !== "" &&
    !Number.isNaN(Date.parse(value));
}

// CREATE HOLIDAY
export const createHoliday = async (req, res) => {
  try {
    const { title, date, type, description = "" } = req.body;

    if (!title?.trim() || !date || !type) {
      await cleanupRequestFiles(req);
      return res.status(400).json({
        success: false,
        message: "Title, date and type are required",
      });
    }

    if (!isValidDate(date)) {
      await cleanupRequestFiles(req);
      return res.status(400).json({
        success: false,
        message: "Invalid holiday date",
      });
    }

    if (!ALLOWED_TYPES.includes(type)) {
      await cleanupRequestFiles(req);
      return res.status(400).json({
        success: false,
        message: "Invalid holiday type",
      });
    }

    const holiday = await Holiday.create({
      title: title.trim(),
      date,
      type,
      description: String(description).trim(),
      pdfUrl: getUploadedUrl(req, "pdf"),
      imageUrl: getUploadedUrl(req, "image"),
    });

    return res.status(201).json({
      success: true,
      message: "Holiday added successfully",
      holiday,
    });
  } catch (error) {
    await cleanupRequestFiles(req);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ALL HOLIDAYS + DASHBOARD SUMMARY
export const getHolidays = async (req, res) => {
  try {
    const { search = "", type = "" } = req.query;
    const filter = {};

    if (String(search).trim()) {
      filter.title = {
        $regex: String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        $options: "i",
      };
    }

    if (type) filter.type = type;

    const holidays = await Holiday.find(filter).sort({ date: 1 });

    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const upcoming = holidays.filter(
      (holiday) => new Date(holiday.date) >= today
    ).length;

    const thisMonth = holidays.filter((holiday) => {
      const date = new Date(holiday.date);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }).length;

    const events = holidays.filter(
      (holiday) => holiday.type === "School Event"
    ).length;

    return res.status(200).json({
      success: true,
      count: holidays.length,
      summary: {
        total: holidays.length,
        upcoming,
        thisMonth,
        events,
      },
      holidays,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET SINGLE HOLIDAY
export const getHolidayById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    const holiday = await Holiday.findById(id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    return res.status(200).json({
      success: true,
      holiday,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE HOLIDAY
export const updateHoliday = async (req, res) => {
  let oldPdfUrl = "";
  let oldImageUrl = "";

  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      await cleanupRequestFiles(req);
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    const holiday = await Holiday.findById(id);

    if (!holiday) {
      await cleanupRequestFiles(req);
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    const { title, date, type, description } = req.body;

    if (title !== undefined) {
      if (!String(title).trim()) {
        await cleanupRequestFiles(req);
        return res.status(400).json({
          success: false,
          message: "Holiday title cannot be empty",
        });
      }
      holiday.title = String(title).trim();
    }

    if (date !== undefined) {
      if (!isValidDate(date)) {
        await cleanupRequestFiles(req);
        return res.status(400).json({
          success: false,
          message: "Invalid holiday date",
        });
      }
      holiday.date = date;
    }

    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        await cleanupRequestFiles(req);
        return res.status(400).json({
          success: false,
          message: "Invalid holiday type",
        });
      }
      holiday.type = type;
    }

    if (description !== undefined) {
      holiday.description = String(description).trim();
    }

    oldPdfUrl = holiday.pdfUrl;
    oldImageUrl = holiday.imageUrl;

    if (req.body.removePdf === "true") holiday.pdfUrl = "";
    if (req.body.removeImage === "true") holiday.imageUrl = "";

    const newPdfUrl = getUploadedUrl(req, "pdf");
    const newImageUrl = getUploadedUrl(req, "image");

    if (newPdfUrl) holiday.pdfUrl = newPdfUrl;
    if (newImageUrl) holiday.imageUrl = newImageUrl;

    await holiday.save();

    if (
      oldPdfUrl &&
      (newPdfUrl || req.body.removePdf === "true")
    ) {
      await removeUploadedFile(oldPdfUrl);
    }

    if (
      oldImageUrl &&
      (newImageUrl || req.body.removeImage === "true")
    ) {
      await removeUploadedFile(oldImageUrl);
    }

    return res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      holiday,
    });
  } catch (error) {
    await cleanupRequestFiles(req);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE HOLIDAY
export const deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid holiday ID",
      });
    }

    const holiday = await Holiday.findById(id);

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      });
    }

    await Holiday.deleteOne({ _id: id });

    await Promise.all([
      removeUploadedFile(holiday.pdfUrl),
      removeUploadedFile(holiday.imageUrl),
    ]);

    return res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
