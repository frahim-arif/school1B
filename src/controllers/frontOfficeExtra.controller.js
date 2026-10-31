
import mongoose from "mongoose";
import Visitor from "../models/Visitor.js";
import CallLog from "../models/CallLog.js";
import PostalRecord from "../models/PostalRecord.js";
import Complaint from "../models/Complaint.js";
import FrontOfficeSettings from "../models/FrontOfficeSettings.js";

const sendResponse = (res, code, success, message, data = null) =>
  res.status(code).json({
    _status: success,
    _message: message,
    _data: data,
  });

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const makeCrud = ({ Model, fields, searchFields, dateField }) => {
  const getList = async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const filter = {};

      for (const key of ["status", "recordType", "callType", "priority", "visitorType"]) {
        if (req.query[key]) filter[key] = req.query[key];
      }

      if (req.query.search?.trim()) {
        const regex = new RegExp(escapeRegex(req.query.search.trim()), "i");
        filter.$or = searchFields.map((field) => ({ [field]: regex }));
      }

      const [items, total] = await Promise.all([
        Model.find(filter)
          .sort({ [dateField]: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Model.countDocuments(filter),
      ]);

      return sendResponse(res, 200, true, "Records fetched successfully", {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error) {
      console.error("Front office list error:", error);
      return sendResponse(res, 500, false, "Failed to fetch records");
    }
  };

  const getStats = async (req, res) => {
    try {
      const [total, grouped] = await Promise.all([
        Model.countDocuments(),
        Model.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ]);

      const byStatus = {};
      grouped.forEach((item) => {
        byStatus[item._id] = item.count;
      });

      return sendResponse(res, 200, true, "Statistics fetched successfully", {
        total,
        byStatus,
      });
    } catch (error) {
      console.error("Front office stats error:", error);
      return sendResponse(res, 500, false, "Failed to fetch statistics");
    }
  };

  const getOne = async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return sendResponse(res, 400, false, "Invalid record ID");
      }

      const item = await Model.findById(req.params.id);
      if (!item) return sendResponse(res, 404, false, "Record not found");

      return sendResponse(res, 200, true, "Record fetched successfully", item);
    } catch (error) {
      console.error("Get record error:", error);
      return sendResponse(res, 500, false, "Failed to fetch record");
    }
  };

  const create = async (req, res) => {
    try {
      const payload = {};
      fields.forEach((field) => {
        if (req.body?.[field] !== undefined) payload[field] = req.body[field];
      });

      const item = await Model.create(payload);
      return sendResponse(res, 201, true, "Record created successfully", item);
    } catch (error) {
      const code = ["ValidationError", "CastError"].includes(error.name) ? 400 : 500;
      console.error("Create record error:", error);
      return sendResponse(res, code, false, code === 400 ? error.message : "Failed to create record");
    }
  };

  const update = async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return sendResponse(res, 400, false, "Invalid record ID");
      }

      const payload = {};
      fields.forEach((field) => {
        if (req.body?.[field] !== undefined) payload[field] = req.body[field];
      });

      if (!Object.keys(payload).length) {
        return sendResponse(res, 400, false, "No valid fields provided");
      }

      if (Model === Visitor && payload.status === "Checked Out") {
        payload.checkOutAt = payload.checkOutAt || new Date();
      }

      if (Model === Complaint && ["Resolved", "Closed"].includes(payload.status)) {
        payload.resolvedAt = payload.resolvedAt || new Date();
      }

      const item = await Model.findByIdAndUpdate(
        req.params.id,
        { $set: payload },
        { new: true, runValidators: true }
      );

      if (!item) return sendResponse(res, 404, false, "Record not found");

      return sendResponse(res, 200, true, "Record updated successfully", item);
    } catch (error) {
      const code = ["ValidationError", "CastError"].includes(error.name) ? 400 : 500;
      console.error("Update record error:", error);
      return sendResponse(res, code, false, code === 400 ? error.message : "Failed to update record");
    }
  };

  const remove = async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return sendResponse(res, 400, false, "Invalid record ID");
      }

      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return sendResponse(res, 404, false, "Record not found");

      return sendResponse(res, 200, true, "Record deleted successfully", item);
    } catch (error) {
      console.error("Delete record error:", error);
      return sendResponse(res, 500, false, "Failed to delete record");
    }
  };

  return { getList, getStats, getOne, create, update, remove };
};

export const visitorController = makeCrud({
  Model: Visitor,
  fields: ["visitorName", "phone", "email", "purpose", "personToMeet", "visitorType", "checkInAt", "checkOutAt", "status", "notes"],
  searchFields: ["visitorName", "phone", "purpose", "personToMeet"],
  dateField: "checkInAt",
});

export const callLogController = makeCrud({
  Model: CallLog,
  fields: ["callerName", "phone", "callType", "purpose", "callDate", "durationMinutes", "staffName", "status", "followUpDate", "notes"],
  searchFields: ["callerName", "phone", "purpose", "staffName"],
  dateField: "callDate",
});

export const postalRecordController = makeCrud({
  Model: PostalRecord,
  fields: ["recordType", "trackingNumber", "sender", "recipient", "address", "subject", "recordDate", "status", "handledBy", "notes"],
  searchFields: ["trackingNumber", "sender", "recipient", "subject", "handledBy"],
  dateField: "recordDate",
});

export const complaintController = makeCrud({
  Model: Complaint,
  fields: ["complainantName", "phone", "category", "subject", "description", "priority", "status", "assignedTo", "resolution", "resolvedAt"],
  searchFields: ["complainantName", "phone", "category", "subject", "description", "assignedTo"],
  dateField: "createdAt",
});

export const getFrontOfficeSettings = async (req, res) => {
  try {
    let settings = await FrontOfficeSettings.findOne({ settingsKey: "default" });

    if (!settings) {
      settings = await FrontOfficeSettings.create({ settingsKey: "default" });
    }

    return sendResponse(res, 200, true, "Settings fetched successfully", settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return sendResponse(res, 500, false, "Failed to fetch settings");
  }
};

export const updateFrontOfficeSettings = async (req, res) => {
  try {
    const allowedFields = [
      "schoolName", "contactPhone", "contactEmail", "address",
      "visitorPurposes", "complaintCategories", "updatedBy",
    ];
    const payload = {};

    allowedFields.forEach((field) => {
      if (req.body?.[field] !== undefined) payload[field] = req.body[field];
    });

    if (!Object.keys(payload).length) {
      return sendResponse(res, 400, false, "No valid settings provided");
    }

    const settings = await FrontOfficeSettings.findOneAndUpdate(
      { settingsKey: "default" },
      { $set: payload, $setOnInsert: { settingsKey: "default" } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return sendResponse(res, 200, true, "Settings updated successfully", settings);
  } catch (error) {
    const code = error.name === "ValidationError" ? 400 : 500;
    console.error("Update settings error:", error);
    return sendResponse(res, code, false, error.message);
  }
};
