
import mongoose from "mongoose";
import Album from "../models/Album.js";

const sendError = (res, error, message) => {
  console.error(message, error);

  return res.status(500).json({
    success: false,
    message,
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : undefined,
  });
};

// GET /api/gallery/albums
export const getAlbums = async (req, res) => {
  try {
    const { search, published } = req.query;
    const filter = {};

    if (search?.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
        { category: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (published === "true") filter.isPublished = true;
    if (published === "false") filter.isPublished = false;

    const albums = await Album.find(filter)
      .populate("items")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: albums.length,
      albums,
      data: albums,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch albums.");
  }
};

// POST /api/gallery/albums
export const createAlbum = async (req, res) => {
  try {
    const { title, description, coverImage, category, eventDate, items, isPublished } =
      req.body;

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Album title is required.",
      });
    }

    let itemIds = items ?? [];

    if (typeof itemIds === "string") {
      try {
        itemIds = JSON.parse(itemIds);
      } catch {
        itemIds = itemIds ? [itemIds] : [];
      }
    }

    if (!Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        message: "Items must be an array of gallery IDs.",
      });
    }

    if (!itemIds.every((id) => mongoose.isValidObjectId(id))) {
      return res.status(400).json({
        success: false,
        message: "One or more gallery item IDs are invalid.",
      });
    }

    const album = await Album.create({
      title: title.trim(),
      description: description || "",
      coverImage: coverImage || "",
      category: category || "General",
      eventDate: eventDate || null,
      items: itemIds,
      isPublished:
        isPublished === undefined ? true : isPublished === true || isPublished === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Album created successfully.",
      album,
      data: album,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return sendError(res, error, "Failed to create album.");
  }
};

// GET /api/gallery/albums/:id
export const getAlbumById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid album ID.",
      });
    }

    const album = await Album.findById(id).populate("items");

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found.",
      });
    }

    return res.status(200).json({
      success: true,
      album,
      data: album,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch album.");
  }
};

// PUT /api/gallery/albums/:id
export const updateAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid album ID.",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "coverImage",
      "category",
      "eventDate",
      "items",
      "isPublished",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.title !== undefined) {
      if (!String(updates.title).trim()) {
        return res.status(400).json({
          success: false,
          message: "Album title cannot be empty.",
        });
      }
      updates.title = String(updates.title).trim();
    }

    if (updates.items !== undefined) {
      let itemIds = updates.items;

      if (typeof itemIds === "string") {
        try {
          itemIds = JSON.parse(itemIds);
        } catch {
          itemIds = [itemIds];
        }
      }

      if (
        !Array.isArray(itemIds) ||
        !itemIds.every((itemId) => mongoose.isValidObjectId(itemId))
      ) {
        return res.status(400).json({
          success: false,
          message: "Items must contain valid gallery IDs.",
        });
      }

      updates.items = itemIds;
    }

    if (updates.isPublished !== undefined) {
      updates.isPublished =
        updates.isPublished === true || updates.isPublished === "true";
    }

    if (updates.eventDate === "") updates.eventDate = null;

    const album = await Album.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("items");

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Album updated successfully.",
      album,
      data: album,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return sendError(res, error, "Failed to update album.");
  }
};

// DELETE /api/gallery/albums/:id
export const deleteAlbum = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid album ID.",
      });
    }

    const album = await Album.findByIdAndDelete(id);

    if (!album) {
      return res.status(404).json({
        success: false,
        message: "Album not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Album deleted successfully.",
      album,
    });
  } catch (error) {
    return sendError(res, error, "Failed to delete album.");
  }
};
