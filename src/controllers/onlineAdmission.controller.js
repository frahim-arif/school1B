
import mongoose from "mongoose";
import OnlineAdmission from "../models/OnlineAdmission.js";
import AdmissionSetting from "../models/AdmissionSetting.js";

const validStatuses = ["Pending", "Under Review", "Approved", "Rejected"];

const makeApplicationNumber = () => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `ADM-${Date.now()}-${random}`;
};

// Public: Admission form settings
export const getPublicAdmissionSettings = async (req, res) => {
  try {
    const settings = await AdmissionSetting.findOne({ isOpen: true }).lean();

    if (
      !settings ||
      (settings.startDate && settings.startDate > new Date()) ||
      (settings.endDate && settings.endDate < new Date())
    ) {
      return res.status(200).json({
        success: true,
        admissionOpen: false,
        settings: null,
      });
    }

    return res.json({
      success: true,
      admissionOpen: true,
      settings: {
        academicSession: settings.academicSession,
        allowedClasses: settings.allowedClasses,
        instructions: settings.instructions,
        requiredFields: settings.requiredFields,
        startDate: settings.startDate,
        endDate: settings.endDate,
      },
    });
  } catch (error) {
    console.error("PUBLIC ADMISSION SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Admission settings load nahi ho sakin.",
    });
  }
};

// Public: Submit application
export const submitApplication = async (req, res) => {
  try {
    const body = req.body || {};
    const student = body.student || {};
    const admission = body.admission || {};
    const parents = body.parents || {};
    const address = body.address || {};

    const settings = await AdmissionSetting.findOne({
      isOpen: true,
    }).lean();

    const now = new Date();

    if (
      !settings ||
      (settings.startDate && settings.startDate > now) ||
      (settings.endDate && settings.endDate < now)
    ) {
      return res.status(403).json({
        success: false,
        message: "Online admission abhi open nahi hai.",
      });
    }

    const requiredValues = [
      student.firstName,
      student.dateOfBirth,
      student.gender,
      admission.classApplyingFor,
      parents.fatherName,
      parents.motherName,
      parents.phone,
      address.addressLine,
      address.city,
      address.state,
      address.postalCode,
    ];

    if (requiredValues.some((value) => !String(value ?? "").trim())) {
      return res.status(400).json({
        success: false,
        message: "Sabhi required fields fill karein.",
      });
    }

    if (
      !["Male", "Female", "Other"].includes(student.gender) ||
      Number.isNaN(new Date(student.dateOfBirth).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Date of birth ya gender valid nahi hai.",
      });
    }

    const phone = String(parents.phone).trim();

    if (!/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Valid parent phone number enter karein.",
      });
    }

    const requestedClass = String(admission.classApplyingFor).trim();

    if (
      !settings.allowedClasses.includes(requestedClass)
    ) {
      return res.status(400).json({
        success: false,
        message: "Selected class mein admission available nahi hai.",
      });
    }

    const application = await OnlineAdmission.create({
      applicationNumber: makeApplicationNumber(),
      academicSession: settings.academicSession,
      student: {
        firstName: student.firstName,
        middleName: student.middleName || "",
        lastName: student.lastName || "",
        dateOfBirth: new Date(student.dateOfBirth),
        gender: student.gender,
        bloodGroup: student.bloodGroup || "",
        nationality: student.nationality || "Indian",
      },
      admission: {
        classApplyingFor: requestedClass,
        previousSchool: admission.previousSchool || "",
        previousClass: admission.previousClass || "",
        previousResult: admission.previousResult || "",
      },
      parents: {
        fatherName: parents.fatherName,
        motherName: parents.motherName,
        guardianName: parents.guardianName || "",
        phone,
        alternatePhone: parents.alternatePhone || "",
        email: parents.email || "",
        occupation: parents.occupation || "",
      },
      address: {
        addressLine: address.addressLine,
        city: address.city,
        district: address.district || "",
        state: address.state,
        postalCode: address.postalCode,
      },
      documents: [],
    });

    return res.status(201).json({
      success: true,
      message: "Admission application successfully submit ho gayi.",
      application: {
        applicationNumber: application.applicationNumber,
        status: application.status,
        academicSession: application.academicSession,
      },
    });
  } catch (error) {
    console.error("SUBMIT ADMISSION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Application submit nahi ho saki.",
    });
  }
};

// Admin: Dashboard statistics
export const getAdmissionDashboard = async (req, res) => {
  try {
    const [total, pending, underReview, approved, rejected, recent] =
      await Promise.all([
        OnlineAdmission.countDocuments(),
        OnlineAdmission.countDocuments({ status: "Pending" }),
        OnlineAdmission.countDocuments({ status: "Under Review" }),
        OnlineAdmission.countDocuments({ status: "Approved" }),
        OnlineAdmission.countDocuments({ status: "Rejected" }),
        OnlineAdmission.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select("applicationNumber student admission parents status createdAt")
          .lean(),
      ]);

    return res.json({
      success: true,
      stats: { total, pending, underReview, approved, rejected },
      recent,
    });
  } catch (error) {
    console.error("ADMISSION DASHBOARD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Dashboard data load nahi ho saka.",
    });
  }
};

// Admin: Search/filter/paginate applications
export const getApplications = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 10)
    );

    const filter = {};
    const status = String(req.query.status || "").trim();
    const className = String(req.query.className || "").trim();
    const session = String(req.query.session || "").trim();
    const search = String(req.query.search || "").trim();

    if (validStatuses.includes(status)) filter.status = status;
    if (className) filter["admission.classApplyingFor"] = className;
    if (session) filter.academicSession = session;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { applicationNumber: regex },
        { "student.firstName": regex },
        { "student.middleName": regex },
        { "student.lastName": regex },
        { "parents.fatherName": regex },
        { "parents.motherName": regex },
        { "parents.phone": regex },
      ];
    }

    const [applications, total] = await Promise.all([
      OnlineAdmission.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      OnlineAdmission.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      applications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET ADMISSIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Applications load nahi ho sakin.",
    });
  }
};

// Admin: Single application
export const getApplicationById = async (req, res) => {
  try {
    const id = req.params.id;
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { applicationNumber: id };

    const application = await OnlineAdmission.findOne(query).lean();

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application nahi mili.",
      });
    }

    return res.json({ success: true, application });
  } catch (error) {
    console.error("GET ADMISSION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Application details load nahi ho sakin.",
    });
  }
};

// Admin: Change review status
export const reviewApplication = async (req, res) => {
  try {
    const { status, adminRemarks = "" } = req.body || {};

    if (!["Under Review", "Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admission status.",
      });
    }

    const id = req.params.id;
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { applicationNumber: id };

    const application = await OnlineAdmission.findOneAndUpdate(
      query,
      {
        $set: {
          status,
          adminRemarks: String(adminRemarks).trim(),
          reviewedAt: new Date(),
          reviewedBy: req.user?.id || req.user?._id
            ? String(req.user.id || req.user._id)
            : "admin",
        },
      },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application nahi mili.",
      });
    }

    return res.json({
      success: true,
      message: `Application status ${status} kar diya gaya.`,
      application,
    });
  } catch (error) {
    console.error("REVIEW ADMISSION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Application review update nahi ho saka.",
    });
  }
};

// Admin: Reports summary
export const getAdmissionReports = async (req, res) => {
  try {
    const match = {};

    if (req.query.session) {
      match.academicSession = String(req.query.session);
    }

    if (req.query.from || req.query.to) {
      match.createdAt = {};

      if (req.query.from) {
        const from = new Date(req.query.from);
        if (Number.isNaN(from.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid from date.",
          });
        }
        from.setHours(0, 0, 0, 0);
        match.createdAt.$gte = from;
      }

      if (req.query.to) {
        const to = new Date(req.query.to);
        if (Number.isNaN(to.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid to date.",
          });
        }
        to.setHours(23, 59, 59, 999);
        match.createdAt.$lte = to;
      }
    }

    const [byStatus, byClass, total] = await Promise.all([
      OnlineAdmission.aggregate([
        { $match: match },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      OnlineAdmission.aggregate([
        { $match: match },
        {
          $group: {
            _id: "$admission.classApplyingFor",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      OnlineAdmission.countDocuments(match),
    ]);

    return res.json({
      success: true,
      total,
      byStatus,
      byClass,
    });
  } catch (error) {
    console.error("ADMISSION REPORT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Admission reports load nahi ho sakin.",
    });
  }
};
