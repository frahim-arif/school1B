
import CertificateSetting from "../models/CertificateSetting.js";

const DEFAULT_SETTINGS = {
  schoolName: "",
  schoolAddress: "",
  schoolPhone: "",
  schoolEmail: "",
  schoolLogo: "",
  principalName: "",
  principalSignature: "",
  certificatePrefix: "CERT",
  nextCertificateNumber: 1,
};

// GET: Certificate settings
export const view = async (req, res) => {
  try {
    let settings = await CertificateSetting.findOne();

    if (!settings) {
      settings = await CertificateSetting.create(DEFAULT_SETTINGS);
    }

    return res.status(200).json({
      _status: true,
      _message: "Certificate settings fetched successfully.",
      _data: { settings },
    });
  } catch (error) {
    console.error("Certificate settings view error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to fetch certificate settings.",
      _data: null,
    });
  }
};

// PUT: Create or update certificate settings
export const update = async (req, res) => {
  try {
    const {
      schoolName,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      schoolLogo,
      principalName,
      principalSignature,
      certificatePrefix,
      nextCertificateNumber,
    } = req.body;

    if (schoolName !== undefined && !String(schoolName).trim()) {
      return res.status(400).json({
        _status: false,
        _message: "School name is required.",
        _data: null,
      });
    }

    if (
      certificatePrefix !== undefined &&
      !/^[A-Za-z0-9-]+$/.test(String(certificatePrefix).trim())
    ) {
      return res.status(400).json({
        _status: false,
        _message: "Prefix can contain only letters, numbers and hyphens.",
        _data: null,
      });
    }

    if (
      nextCertificateNumber !== undefined &&
      (!Number.isInteger(Number(nextCertificateNumber)) ||
        Number(nextCertificateNumber) < 1)
    ) {
      return res.status(400).json({
        _status: false,
        _message: "Next certificate number must be a positive integer.",
        _data: null,
      });
    }

    const updates = {};

    const allowedFields = {
      schoolName,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      schoolLogo,
      principalName,
      principalSignature,
      certificatePrefix,
      nextCertificateNumber,
    };

    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        updates[key] =
          typeof value === "string" ? value.trim() : value;
      }
    }

    let settings = await CertificateSetting.findOne();

    if (!settings) {
      settings = await CertificateSetting.create({
        ...DEFAULT_SETTINGS,
        ...updates,
      });
    } else {
      settings = await CertificateSetting.findByIdAndUpdate(
        settings._id,
        { $set: updates },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    return res.status(200).json({
      _status: true,
      _message: "Certificate settings saved successfully.",
      _data: { settings },
    });
  } catch (error) {
    console.error("Certificate settings update error:", error);

    return res.status(500).json({
      _status: false,
      _message: "Failed to save certificate settings.",
      _data: null,
    });
  }
};
