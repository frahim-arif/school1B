
import express from "express";
import upload from "../middleware/galleryUpload.js";

import {
  createGallery,
  getGallery,
  getGalleryById,
  updateGallery,
  deleteGallery,
  getPublicGallery,
  getGallerySettings,
  updateGallerySettings,
} from "../controllers/gallery.controller.js";

import {
  getAlbums,
  createAlbum,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
} from "../controllers/album.controller.js";

const router = express.Router();

// Public gallery
router.get("/public", getPublicGallery);

// Gallery settings — static routes first
router.get("/settings", getGallerySettings);
router.put("/settings", updateGallerySettings);

// Albums — must be before /:id
router.get("/albums", getAlbums);
router.post("/albums", createAlbum);
router.get("/albums/:id", getAlbumById);
router.put("/albums/:id", updateAlbum);
router.delete("/albums/:id", deleteAlbum);

// Existing gallery item routes
router.get("/", getGallery);
router.post("/", upload.single("file"), createGallery);
router.get("/:id", getGalleryById);
router.put("/:id", upload.single("file"), updateGallery);
router.delete("/:id", deleteGallery);

export default router;
