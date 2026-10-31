import mongoose from "mongoose";
import Certificate from "../models/Certificate.js";
import CertificateTemplate from "../models/CertificateTemplate.js";
import CertificateSetting from "../models/CertificateSetting.js";

// Generate unique certificate number
const generateCertificateNumber = async () => {
  let setting = await CertificateSetting.findOne();

  if (!setting) {
    try {
      setting = await CertificateSetting.create({
        certificatePrefix: "CERT",
        nextCertificateNumber: 1,
      });
    } catch (error) {
      // Another request may have created the settings simultaneously.
      if (error.code !== 11000) throw error;
      setting = await CertificateSetting.findOne();
      if (!setting) throw error;
    }
  }

  while (true) {
    const updatedSetting = await CertificateSetting.findOneAndUpdate(
      { _id: setting._id },
      { $inc: { nextCertificateNumber: 1 } },
      { new: false }
    );

    if (!updatedSetting) {
      throw new Error("Certificate settings not found");
    }

    const prefix = updatedSetting.certificatePrefix || "CERT";
    const number = updatedSetting.nextCertificateNumber;

    const certificateNumber =
      `${prefix}-${String(number).padStart(5, "0")}`;

    const exists = await Certificate.exists({ certificateNumber });

    if (!exists) return certificateNumber;
  }
};

// Create / issue certificate
export const create = async (req, res) => {
  try {
    const {
      certificateType,
      recipientType = "student",
      student,
      staff,
      recipientName,
      admissionNumber,
      className,
      session,
      issueDate,
      purpose,
      remarks,
      templateId,
    } = req.body;

    const allowedTypes = [
      "bonafide",
      "transfer",
      "character",
      "study",
      "birth",
      "achievement",
      "other",
    ];

    if (!certificateType || !allowedTypes.includes(certificateType)) {
      return res.status(400).json({
        _status: false,
        _message: "Please select a valid certificate type",
        _data: null,
      });
    }

    if (!recipientName || !recipientName.trim()) {
      return res.status(400).json({
        _status: false,
        _message: "Recipient name is required",
        _data: null,
      });
    }

    if (!["student", "staff"].includes(recipientType)) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid recipient type",
        _data: null,
      });
    }

    if (recipientType === "student" && staff) {
      return res.status(400).json({
        _status: false,
        _message: "Staff ID is not allowed for a student certificate",
        _data: null,
      });
    }

    if (recipientType === "staff" && student) {
      return res.status(400).json({
        _status: false,
        _message: "Student ID is not allowed for a staff certificate",
        _data: null,
      });
    }

    if (
      (student && !mongoose.isValidObjectId(student)) ||
      (staff && !mongoose.isValidObjectId(staff))
    ) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid student or staff ID",
        _data: null,
      });
    }

    let templateName = "Default";

    if (templateId) {
      if (!mongoose.isValidObjectId(templateId)) {
        return res.status(400).json({
          _status: false,
          _message: "Invalid template ID",
          _data: null,
        });
      }

      const template = await CertificateTemplate.findOne({
        _id: templateId,
        isActive: true,
      });

      if (!template) {
        return res.status(404).json({
          _status: false,
          _message: "Active certificate template not found",
          _data: null,
        });
      }

      if (
        template.certificateType !== certificateType ||
        !["both", recipientType].includes(template.recipientType)
      ) {
        return res.status(400).json({
          _status: false,
          _message: "Template does not match certificate type or recipient",
          _data: null,
        });
      }

      templateName = template.name;
    }

    const validDate = issueDate ? new Date(issueDate) : new Date();

    if (Number.isNaN(validDate.getTime())) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid issue date",
        _data: null,
      });
    }

    const certificateNumber = await generateCertificateNumber();

    const certificate = await Certificate.create({
      certificateNumber,
      certificateType,
      recipientType,
      student: recipientType === "student" ? student || null : null,
      staff: recipientType === "staff" ? staff || null : null,
      recipientName: recipientName.trim(),
      admissionNumber: admissionNumber || "",
      className: className || "",
      session: session || "",
      issueDate: validDate,
      purpose: purpose || "",
      remarks: remarks || "",
      templateName,
      issuedBy: req.user?._id || req.user?.id || null,
      status: "issued",
    });

    return res.status(201).json({
      _status: true,
      _message: "Certificate issued successfully",
      _data: certificate,
    });
  } catch (error) {
    console.error("Certificate create error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to issue certificate",
      _data: null,
    });
  }
};

// Get certificates with search, filters and pagination
export const view = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const { search, certificateType, recipientType, status, session } =
      req.query;

    const filter = {};

    if (certificateType) filter.certificateType = certificateType;
    if (recipientType) filter.recipientType = recipientType;
    if (status) filter.status = status;
    if (session) filter.session = session;

    if (search && search.trim()) {
      const safeSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const regex = new RegExp(safeSearch, "i");

      filter.$or = [
        { certificateNumber: regex },
        { recipientName: regex },
        { admissionNumber: regex },
        { className: regex },
      ];
    }

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      Certificate.countDocuments(filter),
    ]);

    return res.status(200).json({
      _status: true,
      _message: "Certificates fetched successfully",
      _data: {
        certificates,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Certificate view error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to fetch certificates",
      _data: null,
    });
  }
};

// Get one certificate by MongoDB ID
export const viewSingle = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid certificate ID",
        _data: null,
      });
    }

    const certificate = await Certificate.findById(id).lean();

    if (!certificate) {
      return res.status(404).json({
        _status: false,
        _message: "Certificate not found",
        _data: null,
      });
    }

    return res.status(200).json({
      _status: true,
      _message: "Certificate fetched successfully",
      _data: certificate,
    });
  } catch (error) {
    console.error("Certificate single view error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to fetch certificate",
      _data: null,
    });
  }
};

// Public certificate verification
export const verify = async (req, res) => {
  try {
    const certificateNumber = String(
      req.params.certificateNumber || ""
    ).trim();

    if (!certificateNumber) {
      return res.status(400).json({
        _status: false,
        _message: "Certificate number is required",
        _data: null,
      });
    }

    const certificate = await Certificate.findOne({
      certificateNumber,
    })
      .select(
        "certificateNumber certificateType recipientType recipientName admissionNumber className session issueDate status revokedAt revokedReason"
      )
      .lean();

    if (!certificate) {
      return res.status(404).json({
        _status: false,
        _message: "Certificate not found",
        _data: null,
      });
    }

    const isValid = certificate.status === "issued";

    return res.status(200).json({
      _status: true,
      _message: isValid
        ? "Certificate is valid"
        : "Certificate has been revoked",
      _data: {
        ...certificate,
        isValid,
      },
    });
  } catch (error) {
    console.error("Certificate verification error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Certificate verification failed",
      _data: null,
    });
  }
};

// Revoke an issued certificate
export const revoke = async (req, res) => {
  try {
    const { id } = req.params;
    const { revokedReason } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        _status: false,
        _message: "Invalid certificate ID",
        _data: null,
      });
    }

    if (!revokedReason || !revokedReason.trim()) {
      return res.status(400).json({
        _status: false,
        _message: "Revocation reason is required",
        _data: null,
      });
    }

    const certificate = await Certificate.findOneAndUpdate(
      { _id: id, status: "issued" },
      {
        $set: {
          status: "revoked",
          revokedAt: new Date(),
          revokedReason: revokedReason.trim(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!certificate) {
      return res.status(404).json({
        _status: false,
        _message: "Issued certificate not found or already revoked",
        _data: null,
      });
    }

    return res.status(200).json({
      _status: true,
      _message: "Certificate revoked successfully",
      _data: certificate,
    });
  } catch (error) {
    console.error("Certificate revoke error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to revoke certificate",
      _data: null,
    });
  }
};