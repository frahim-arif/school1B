
import mongoose from "mongoose";
import AdmissionEnquiry from "../models/AdmissionEnquiry.js";

const sendResponse = (res, statusCode, success, message, data = null) => {
  return res.status(statusCode).json({
    _status: success,
    _message: message,
    _data: data,
  });
};

// GET: Admission enquiries list with search, filters and pagination
export const getEnquiries = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.source) filter.source = req.query.source;

    const search = String(req.query.search || "").trim();

    if (search) {
      const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(safeSearch, "i");

      filter.$or = [
        { studentName: regex },
        { guardianName: regex },
        { phone: regex },
        { email: regex },
        { classApplying: regex },
      ];
    }

    const [items, total] = await Promise.all([
      AdmissionEnquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdmissionEnquiry.countDocuments(filter),
    ]);

    return sendResponse(res, 200, true, "Enquiries fetched successfully", {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get enquiries error:", error);
    return sendResponse(res, 500, false, "Failed to fetch enquiries");
  }
};

// GET: Dashboard statistics
export const getEnquiryStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [total, statusCounts, dueFollowUps, todayEnquiries] =
      await Promise.all([
        AdmissionEnquiry.countDocuments(),
        AdmissionEnquiry.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        AdmissionEnquiry.countDocuments({
          status: { $nin: ["Admitted", "Rejected"] },
          followUpDate: { $lt: tomorrow, $ne: null },
        }),
        AdmissionEnquiry.countDocuments({
          createdAt: { $gte: today, $lt: tomorrow },
        }),
      ]);

    const byStatus = {
      New: 0,
      Contacted: 0,
      "Follow-up": 0,
      Admitted: 0,
      Rejected: 0,
    };

    statusCounts.forEach((item) => {
      byStatus[item._id] = item.count;
    });

    return sendResponse(res, 200, true, "Statistics fetched successfully", {
      total,
      new: byStatus.New,
      contacted: byStatus.Contacted,
      followUp: byStatus["Follow-up"],
      admitted: byStatus.Admitted,
      rejected: byStatus.Rejected,
      dueFollowUps,
      todayEnquiries,
      byStatus,
    });
  } catch (error) {
    console.error("Enquiry stats error:", error);
    return sendResponse(res, 500, false, "Failed to fetch statistics");
  }
};

// GET: One enquiry
export const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, false, "Invalid enquiry ID");
    }

    const enquiry = await AdmissionEnquiry.findById(id);

    if (!enquiry) {
      return sendResponse(res, 404, false, "Enquiry not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Enquiry fetched successfully",
      enquiry
    );
  } catch (error) {
    console.error("Get enquiry by ID error:", error);
    return sendResponse(res, 500, false, "Failed to fetch enquiry");
  }
};

// POST: Create enquiry
export const createEnquiry = async (req, res) => {
  try {
    const {
      studentName,
      guardianName,
      phone,
      email,
      classApplying,
      source,
      status,
      followUpDate,
      notes,
      assignedTo,
    } = req.body || {};

    // Required field validation
    if (
      !studentName?.trim() ||
      !guardianName?.trim() ||
      !phone?.trim() ||
      !classApplying?.trim()
    ) {
      return sendResponse(
        res,
        400,
        false,
        "Student name, guardian name, phone and class are required"
      );
    }

    // Phone validation
    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return sendResponse(
        res,
        400,
        false,
        "Enter a valid 10-digit phone number"
      );
    }

    // Prevent invalid date values
    let parsedFollowUpDate = null;

    if (followUpDate) {
      parsedFollowUpDate = new Date(followUpDate);

      if (Number.isNaN(parsedFollowUpDate.getTime())) {
        return sendResponse(res, 400, false, "Invalid follow-up date");
      }
    }

    const enquiry = await AdmissionEnquiry.create({
      studentName: studentName.trim(),
      guardianName: guardianName.trim(),
      phone: phone.trim(),
      email,
      classApplying: classApplying.trim(),
      source,
      status,
      followUpDate: parsedFollowUpDate,
      notes,
      assignedTo,
    });

    return sendResponse(
      res,
      201,
      true,
      "Admission enquiry created successfully",
      enquiry
    );
  } catch (error) {
    console.error("Create enquiry error:", error);

    const statusCode =
      error.name === "ValidationError" ||
      error.name === "CastError"
        ? 400
        : 500;

    return sendResponse(
      res,
      statusCode,
      false,
      statusCode === 400
        ? error.message
        : "Failed to create admission enquiry"
    );
  }
};

// PUT: Update enquiry
export const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, false, "Invalid enquiry ID");
    }

    const allowedFields = [
      "studentName",
      "guardianName",
      "phone",
      "email",
      "classApplying",
      "source",
      "status",
      "followUpDate",
      "notes",
      "assignedTo",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] =
          field === "followUpDate" && !req.body[field]
            ? null
            : req.body[field];
      }
    }

    const enquiry = await AdmissionEnquiry.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!enquiry) {
      return sendResponse(res, 404, false, "Enquiry not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Admission enquiry updated successfully",
      enquiry
    );
  } catch (error) {
    console.error("Update enquiry error:", error);

    const statusCode =
      error.name === "ValidationError" ||
      error.name === "CastError"
        ? 400
        : 500;

    return sendResponse(
      res,
      statusCode,
      false,
      error.message || "Failed to update enquiry"
    );
  }
};

// DELETE: Delete enquiry
export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return sendResponse(res, 400, false, "Invalid enquiry ID");
    }

    const enquiry = await AdmissionEnquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return sendResponse(res, 404, false, "Enquiry not found");
    }

    return sendResponse(
      res,
      200,
      true,
      "Admission enquiry deleted successfully",
      enquiry
    );
  } catch (error) {
    console.error("Delete enquiry error:", error);
    return sendResponse(res, 500, false, "Failed to delete enquiry");
  }
};
