
import mongoose from "mongoose";
import Book from "../models/Book.js";
import BookIssue from "../models/BookIssue.js";
import LibrarySettings from "../models/LibrarySettings.js";

const sendError = (res, error, status = 500) => {
  return res.status(status).json({
    success: false,
    message: error.message || "Something went wrong",
  });
};

// GET /api/library/books
export const getBooks = async (req, res) => {
  try {
    const { search = "", category = "" } = req.query;
    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { bookName: { $regex: search.trim(), $options: "i" } },
        { author: { $regex: search.trim(), $options: "i" } },
        { isbn: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category.trim()) filter.category = category.trim();

    const books = await Book.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      books,
      stats: {
        totalBooks: books.reduce((sum, book) => sum + book.quantity, 0),
        available: books.reduce(
          (sum, book) => sum + book.availableQuantity,
          0
        ),
        issued: books.reduce(
          (sum, book) => sum + (book.quantity - book.availableQuantity),
          0
        ),
      },
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// GET /api/library/books/:id
export const getBookById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    return res.json({ success: true, book });
  } catch (error) {
    return sendError(res, error);
  }
};

// POST /api/library/books
export const createBook = async (req, res) => {
  try {
    const {
      bookName,
      author,
      isbn,
      category,
      publisher,
      quantity,
      rackNumber,
      coverImage,
      description,
    } = req.body;

    if (!bookName?.trim() || !author?.trim() || !category?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Book name, author and category are required",
      });
    }

    const parsedQuantity = Number(quantity ?? 1);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive whole number",
      });
    }

    if (isbn?.trim()) {
      const existing = await Book.findOne({ isbn: isbn.trim() });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This ISBN already exists",
        });
      }
    }

    const book = await Book.create({
      bookName: bookName.trim(),
      author: author.trim(),
      isbn: isbn?.trim() || "",
      category: category.trim(),
      publisher: publisher || "",
      quantity: parsedQuantity,
      availableQuantity: parsedQuantity,
      rackNumber: rackNumber || "",
      coverImage: coverImage || "",
      description: description || "",
    });

    return res.status(201).json({
      success: true,
      message: "Book created successfully",
      book,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// PUT /api/library/books/:id
export const updateBook = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const allowedFields = [
      "bookName",
      "author",
      "isbn",
      "category",
      "publisher",
      "rackNumber",
      "coverImage",
      "description",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        book[field] = req.body[field];
      }
    }

    if (req.body.quantity !== undefined) {
      const newQuantity = Number(req.body.quantity);
      const currentlyIssued = book.quantity - book.availableQuantity;

      if (
        !Number.isInteger(newQuantity) ||
        newQuantity < 1 ||
        newQuantity < currentlyIssued
      ) {
        return res.status(400).json({
          success: false,
          message: `Quantity cannot be less than the ${currentlyIssued} copies currently issued`,
        });
      }

      book.quantity = newQuantity;
      book.availableQuantity = newQuantity - currentlyIssued;
    }

    await book.save();

    return res.json({
      success: true,
      message: "Book updated successfully",
      book,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// DELETE /api/library/books/:id
export const deleteBook = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID",
      });
    }

    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    if (book.availableQuantity !== book.quantity) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a book while copies are issued",
      });
    }

    await book.deleteOne();

    return res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// GET /api/library/issues
export const getIssues = async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;
    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { studentName: { $regex: search.trim(), $options: "i" } },
        { bookName: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (status && ["Issued", "Returned", "Late"].includes(status)) {
      filter.status = status;
    }

    const issues = await BookIssue.find(filter).sort({ createdAt: -1 });

    const settings = await LibrarySettings.findOne();
    const finePerLateDay = settings?.finePerLateDay ?? 5;
    const now = new Date();

    const formattedIssues = issues.map((issue) => {
      const item = issue.toObject();
      const endDate = item.returnedAt ? new Date(item.returnedAt) : now;
      const dueDate = new Date(item.dueDate);

      const lateDays =
        endDate > dueDate
          ? Math.ceil((endDate - dueDate) / (1000 * 60 * 60 * 24))
          : 0;

      item.calculatedFine =
        item.status === "Returned" ? item.fine : lateDays * finePerLateDay;

      if (item.status !== "Returned" && lateDays > 0) {
        item.status = "Late";
      }

      return item;
    });

    return res.json({
      success: true,
      issues: formattedIssues,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// POST /api/library/issues
export const issueBook = async (req, res) => {
  try {
    const { bookId, studentId, studentName, issueDate, dueDate } = req.body;

    if (
      !mongoose.isValidObjectId(bookId) ||
      !mongoose.isValidObjectId(studentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid book ID and student ID are required",
      });
    }

    if (!studentName?.trim() || !issueDate || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Student name, issue date and due date are required",
      });
    }

    const issuedAt = new Date(issueDate);
    const dueAt = new Date(dueDate);

    if (
      Number.isNaN(issuedAt.getTime()) ||
      Number.isNaN(dueAt.getTime()) ||
      dueAt <= issuedAt
    ) {
      return res.status(400).json({
        success: false,
        message: "Due date must be after the issue date",
      });
    }

    const settings = await LibrarySettings.findOne();
    const maxBooks = settings?.maxBooksPerStudent ?? 3;

    const currentIssues = await BookIssue.countDocuments({
      studentId,
      status: { $in: ["Issued", "Late"] },
    });

    if (currentIssues >= maxBooks) {
      return res.status(400).json({
        success: false,
        message: `This student has reached the limit of ${maxBooks} books`,
      });
    }

    const book = await Book.findOneAndUpdate(
      { _id: bookId, availableQuantity: { $gt: 0 } },
      { $inc: { availableQuantity: -1 } },
      { new: true }
    );

    if (!book) {
      return res.status(400).json({
        success: false,
        message: "Book not found or no copies available",
      });
    }

    try {
      const issue = await BookIssue.create({
        bookId: book._id,
        studentId,
        studentName: studentName.trim(),
        bookName: book.bookName,
        issueDate: issuedAt,
        dueDate: dueAt,
      });

      return res.status(201).json({
        success: true,
        message: "Book issued successfully",
        issue,
      });
    } catch (error) {
      await Book.updateOne(
        { _id: book._id },
        { $inc: { availableQuantity: 1 } }
      );
      throw error;
    }
  } catch (error) {
    return sendError(res, error);
  }
};

// PATCH /api/library/issues/:id/return
export const returnBook = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue ID",
      });
    }

    const issue = await BookIssue.findOneAndUpdate(
      {
        _id: req.params.id,
        status: { $in: ["Issued", "Late"] },
        returnedAt: null,
      },
      { $set: { returnedAt: new Date() } },
      { new: true }
    );

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue record not found or book already returned",
      });
    }

    const settings = await LibrarySettings.findOne();
    const finePerLateDay = settings?.finePerLateDay ?? 5;
    const lateDays = Math.max(
      0,
      Math.ceil(
        (issue.returnedAt - issue.dueDate) / (1000 * 60 * 60 * 24)
      )
    );

    issue.fine = lateDays * finePerLateDay;
    issue.status = "Returned";
    await issue.save();

    await Book.updateOne(
      { _id: issue.bookId },
      { $inc: { availableQuantity: 1 } }
    );

    return res.json({
      success: true,
      message: "Book returned successfully",
      issue,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// GET /api/library/settings
export const getLibrarySettings = async (req, res) => {
  try {
    let settings = await LibrarySettings.findOne();

    if (!settings) {
      settings = await LibrarySettings.create({});
    }

    return res.json({ success: true, settings });
  } catch (error) {
    return sendError(res, error);
  }
};

// PUT /api/library/settings
export const updateLibrarySettings = async (req, res) => {
  try {
    const allowedFields = [
      "maxBooksPerStudent",
      "returnDuration",
      "finePerLateDay",
      "issueNotifications",
      "returnReminders",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    for (const field of [
      "maxBooksPerStudent",
      "returnDuration",
      "finePerLateDay",
    ]) {
      if (updates[field] !== undefined) {
        const value = Number(updates[field]);
        const minimum = field === "finePerLateDay" ? 0 : 1;

        if (!Number.isInteger(value) || value < minimum) {
          return res.status(400).json({
            success: false,
            message: `${field} has an invalid value`,
          });
        }

        updates[field] = value;
      }
    }

    let settings = await LibrarySettings.findOne();

    if (!settings) {
      settings = await LibrarySettings.create(updates);
    } else {
      Object.assign(settings, updates);
      await settings.save();
    }

    return res.json({
      success: true,
      message: "Library settings saved successfully",
      settings,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
