
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import Gallery from "../models/Gallery.js";

const getFileType = (mimeType) =>
  mimeType === "application/pdf" ? "pdf" : "image";

async function removeUploadedFile(fileUrl) {
  if (!fileUrl || !fileUrl.startsWith("/uploads/gallery/")) return;

  const fileName = path.basename(fileUrl);
  const filePath = path.resolve("uploads/gallery", fileName);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Uploaded file cleanup failed:", error.message);
    }
  }
}

function getFileUrl(req, file) {
  return `/uploads/gallery/${file.filename}`;
}

// CREATE
export const createGallery = async (req, res) => {
  try {
    const { title, description, category, eventDate } = req.body;

    if (!title?.trim() || !req.file) {
      if (req.file) await removeUploadedFile(getFileUrl(req, req.file));

      return res.status(400).json({
        success: false,
        message: "Title aur image/PDF file required hain.",
      });
    }

    const gallery = await Gallery.create({
      title: title.trim(),
      description: description || "",
      category: category || "Events",
      eventDate: eventDate || new Date(),
      isPublished: req.body.isPublished !== "false",
      fileUrl: getFileUrl(req, req.file),
      fileName: req.file.originalname,
      fileType: getFileType(req.file.mimetype),
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });

    return res.status(201).json({
      success: true,
      message: "Gallery file uploaded successfully.",
      gallery,
    });
  } catch (error) {
    if (req.file) await removeUploadedFile(getFileUrl(req, req.file));

    return res.status(500).json({
      success: false,
      message: error.message || "Upload failed.",
    });
  }
};

// LIST
export const getGallery = async (req, res) => {
  try {
    const { search = "", category = "", type = "" } = req.query;
    const filter = {};

    if (category && category !== "All") {
      filter.category = category;
    }

    if (type === "image" || type === "pdf") {
      filter.fileType = type;
    }

    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { fileName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const gallery = await Gallery.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({
      success: true,
      gallery,
      total: gallery.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gallery load nahi ho saki.",
    });
  }
};

// SINGLE ITEM
export const getGalleryById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID.",
      });
    }

    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item nahi mila.",
      });
    }

    return res.json({ success: true, gallery });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gallery item load nahi ho saka.",
    });
  }
};

// UPDATE — file replacement is optional
export const updateGallery = async (req, res) => {
  let oldFileUrl;

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      if (req.file) await removeUploadedFile(getFileUrl(req, req.file));

      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID.",
      });
    }

    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      if (req.file) await removeUploadedFile(getFileUrl(req, req.file));

      return res.status(404).json({
        success: false,
        message: "Gallery item nahi mila.",
      });
    }

    const { title, description, category, eventDate, isPublished } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        if (req.file) await removeUploadedFile(getFileUrl(req, req.file));

        return res.status(400).json({
          success: false,
          message: "Title khaali nahi ho sakta.",
        });
      }

      gallery.title = title.trim();
    }

    if (description !== undefined) gallery.description = description;
    if (category !== undefined) gallery.category = category;
    if (eventDate !== undefined) gallery.eventDate = eventDate;
    if (isPublished !== undefined) {
      gallery.isPublished = isPublished === true || isPublished === "true";
    }

    if (req.file) {
      oldFileUrl = gallery.fileUrl;

      gallery.fileUrl = getFileUrl(req, req.file);
      gallery.fileName = req.file.originalname;
      gallery.fileType = getFileType(req.file.mimetype);
      gallery.mimeType = req.file.mimetype;
      gallery.fileSize = req.file.size;
    }

    await gallery.save();

    if (oldFileUrl) await removeUploadedFile(oldFileUrl);

    return res.json({
      success: true,
      message: "Gallery updated successfully.",
      gallery,
    });
  } catch (error) {
    if (req.file) await removeUploadedFile(getFileUrl(req, req.file));

    return res.status(500).json({
      success: false,
      message: error.message || "Gallery update failed.",
    });
  }
};

// DELETE
export const deleteGallery = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gallery ID.",
      });
    }

    const gallery = await Gallery.findByIdAndDelete(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery item nahi mila.",
      });
    }

    await removeUploadedFile(gallery.fileUrl);

    return res.json({
      success: true,
      message: "Gallery item deleted.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gallery delete nahi ho saki.",
    });
  }
};

// PUBLIC GALLERY
export const getPublicGallery = async (req, res) => {
  try {
    const gallery = await Gallery.find({ isPublished: true })
      .sort({ eventDate: -1, createdAt: -1 })
      .limit(200)
      .lean();

    return res.json({ success: true, gallery });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Public gallery load nahi ho saki.",
    });
  }
};

const DEFAULT_GALLERY_SETTINGS = {
  galleryTitle: "School Gallery",
  description: "",
  itemsPerPage: 12,
  allowPublicViewing: true,
  showEventDates: true,
};

// GET GALLERY SETTINGS
export const getGallerySettings = async (req, res) => {
  try {
    // Abhi settings ke liye dedicated database model nahi diya gaya hai.
    // Is endpoint ka persistent storage setup agle step mein karna hoga.
    return res.json({
      success: true,
      settings: DEFAULT_GALLERY_SETTINGS,
      message: "Default gallery settings loaded.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gallery settings load nahi ho sakin.",
    });
  }
};

// UPDATE GALLERY SETTINGS
export const updateGallerySettings = async (req, res) => {
  try {
    const {
      galleryTitle,
      description,
      itemsPerPage,
      allowPublicViewing,
      showEventDates,
    } = req.body;

    if (
      galleryTitle !== undefined &&
      (typeof galleryTitle !== "string" || !galleryTitle.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Gallery title required hai.",
      });
    }

    if (
      itemsPerPage !== undefined &&
      (!Number.isInteger(Number(itemsPerPage)) ||
        Number(itemsPerPage) < 1 ||
        Number(itemsPerPage) > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Items per page 1 se 100 ke beech hona chahiye.",
      });
    }

    const settings = {
      ...DEFAULT_GALLERY_SETTINGS,
      galleryTitle:
        galleryTitle === undefined
          ? DEFAULT_GALLERY_SETTINGS.galleryTitle
          : galleryTitle.trim(),
      description:
        description === undefined ? "" : String(description),
      itemsPerPage:
        itemsPerPage === undefined ? 12 : Number(itemsPerPage),
      allowPublicViewing:
        allowPublicViewing === undefined
          ? true
          : allowPublicViewing === true || allowPublicViewing === "true",
      showEventDates:
        showEventDates === undefined
          ? true
          : showEventDates === true || showEventDates === "true",
    };

    return res.json({
      success: true,
      settings,
      message:
        "Settings validated, lekin database mein save nahi hui hain. Persistent storage configure karna baaki hai.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Gallery settings update nahi ho sakin.",
    });
  }
};

