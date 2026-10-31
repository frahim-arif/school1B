
import mongoose from "mongoose";
import CertificateTemplate from "../models/CertificateTemplate.js";

// GET: View all certificate templates
export const view = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const { search, certificateType, recipientType, isActive } = req.query;

    const filter = {};

    if (certificateType) {
      filter.certificateType = certificateType;
    }

    if (recipientType) {
      filter.recipientType = recipientType;
    }

    if (isActive !== undefined && isActive !== "") {
      filter.isActive = isActive === "true";
    }

    if (search && search.trim()) {
      const safeSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(safeSearch, "i");

      filter.$or = [
        { name: regex },
        { title: regex },
        { body: regex },
      ];
    }

    const [templates, total] = await Promise.all([
      CertificateTemplate.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      CertificateTemplate.countDocuments(filter),
    ]);

    return res.status(200).json({
      _status: true,
      _message: "Certificate templates fetched successfully",
      _data: {
        templates,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Certificate template view error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to fetch certificate templates",
      _data: null,
    });
  }
};

// POST: Create certificate template
export const create = async (req, res) => {
  try {
    const {
      name,
      certificateType,
      recipientType = "both",
      title,
      body,
      headerText = "",
      footerText = "",
      signatureName = "",
      signatureDesignation = "",
      isDefault = false,
      isActive = true,
    } = req.body;

    if (
      !name?.trim() ||
      !certificateType ||
      !title?.trim() ||
      !body?.trim()
    ) {
      return res.status(400).json({
        _status: false,
        _message: "Name, certificate type, title and body are required",
        _data: null,
      });
    }

    const allowedTypes = [
      "bonafide",
      "transfer",
      "character",
      "study",
      "birth",
      "achievement",
      "other",
    ];

    if (!allowedTypes.includes(certificateType)) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid certificate type",
        _data: null,
      });
    }

    if (!["student", "staff", "both"].includes(recipientType)) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid recipient type",
        _data: null,
      });
    }

    const duplicate = await CertificateTemplate.findOne({
      name: name.trim(),
    });

    if (duplicate) {
      return res.status(409).json({
        _status: false,
        _message: "A template with this name already exists",
        _data: null,
      });
    }

    if (isDefault === true) {
      await CertificateTemplate.updateMany(
        { certificateType },
        { $set: { isDefault: false } }
      );
    }

    const template = await CertificateTemplate.create({
      name: name.trim(),
      certificateType,
      recipientType,
      title: title.trim(),
      body: body.trim(),
      headerText,
      footerText,
      signatureName,
      signatureDesignation,
      isDefault: isDefault === true,
      isActive: isActive !== false,
    });

    return res.status(201).json({
      _status: true,
      _message: "Certificate template created successfully",
      _data: { template },
    });
  } catch (error) {
    console.error("Certificate template create error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to create certificate template",
      _data: null,
    });
  }
};

// PUT/PATCH: Update certificate template
export const update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid template ID",
        _data: null,
      });
    }

    const template = await CertificateTemplate.findById(id);

    if (!template) {
      return res.status(404).json({
        _status: false,
        _message: "Certificate template not found",
        _data: null,
      });
    }

    const allowedFields = [
      "name",
      "certificateType",
      "recipientType",
      "title",
      "body",
      "headerText",
      "footerText",
      "signatureName",
      "signatureDesignation",
      "isDefault",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({
          _status: false,
          _message: "Template name cannot be empty",
          _data: null,
        });
      }

      updates.name = updates.name.trim();

      const duplicate = await CertificateTemplate.findOne({
        name: updates.name,
        _id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          _status: false,
          _message: "A template with this name already exists",
          _data: null,
        });
      }
    }

    const allowedTypes = [
      "bonafide",
      "transfer",
      "character",
      "study",
      "birth",
      "achievement",
      "other",
    ];

    if (
      updates.certificateType !== undefined &&
      !allowedTypes.includes(updates.certificateType)
    ) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid certificate type",
        _data: null,
      });
    }

    if (
      updates.recipientType !== undefined &&
      !["student", "staff", "both"].includes(updates.recipientType)
    ) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid recipient type",
        _data: null,
      });
    }

    if (updates.isDefault === true) {
      const typeToUse =
        updates.certificateType || template.certificateType;

      await CertificateTemplate.updateMany(
        {
          certificateType: typeToUse,
          _id: { $ne: id },
        },
        { $set: { isDefault: false } }
      );
    }

    Object.assign(template, updates);
    await template.save();

    return res.status(200).json({
      _status: true,
      _message: "Certificate template updated successfully",
      _data: { template },
    });
  } catch (error) {
    console.error("Certificate template update error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to update certificate template",
      _data: null,
    });
  }
};

// DELETE: Remove certificate template
export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid template ID",
        _data: null,
      });
    }

    const template = await CertificateTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({
        _status: false,
        _message: "Certificate template not found",
        _data: null,
      });
    }

    return res.status(200).json({
      _status: true,
      _message: "Certificate template deleted successfully",
      _data: { template },
    });
  } catch (error) {
    console.error("Certificate template delete error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to delete certificate template",
      _data: null,
    });
  }
};
