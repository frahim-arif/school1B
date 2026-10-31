
import express from "express";

import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
  getIssues,
  issueBook,
  returnBook,
  getLibrarySettings,
  updateLibrarySettings,
} from "../controllers/library.controller.js";

const router = express.Router();

// Books
router.get("/books", getBooks);
router.post("/books", createBook);
router.get("/books/:id", getBookById);
router.put("/books/:id", updateBook);
router.delete("/books/:id", deleteBook);

// Issue and return
router.get("/issues", getIssues);
router.post("/issues", issueBook);
router.patch("/issues/:id/return", returnBook);

// Settings
router.get("/settings", getLibrarySettings);
router.put("/settings", updateLibrarySettings);

export default router;
