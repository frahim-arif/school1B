
import AdmissionSetting from "../models/AdmissionSetting.js";

// Admin: View all session settings
export const getAdmissionSettings = async (req, res) => {
  try {
    const settings = await AdmissionSetting.find()
      .sort({ academicSession: -1 })
      .lean();

    return res.json({ success: true, settings });
  } catch (error) {
    console.error("GET ADMISSION SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Admission settings load nahi ho sakin.",
    });
  }
};

// Admin: Create or update settings for a session
export const saveAdmissionSettings = async (req, res) => {
  try {
    const {
      academicSession,
      isOpen,
      allowedClasses,
      instructions,
      requiredFields,
      startDate,
      endDate,
    } = req.body || {};

    if (!String(academicSession || "").trim()) {
      return res.status(400).json({
        success: false,
        message: "Academic session zaroori hai.",
      });
    }

    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOpen true ya false hona chahiye.",
      });
    }

    if (!Array.isArray(allowedClasses) || allowedClasses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Kam se kam ek class select karein.",
      });
    }

    const parseDate = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? "INVALID" : date;
    };

    const parsedStart = parseDate(startDate);
    const parsedEnd = parseDate(endDate);

    if (parsedStart === "INVALID" || parsedEnd === "INVALID") {
      return res.status(400).json({
        success: false,
        message: "Admission start/end date valid honi chahiye.",
      });
    }

    if (parsedStart && parsedEnd && parsedEnd < parsedStart) {
      return res.status(400).json({
        success: false,
        message: "End date, start date se pehle nahi ho sakti.",
      });
    }

    const update = {
      isOpen,
      allowedClasses: [
        ...new Set(
          allowedClasses
            .map((value) => String(value).trim())
            .filter(Boolean)
        ),
      ],
      instructions: String(instructions || "").trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
    };

    if (Array.isArray(requiredFields)) {
      update.requiredFields = [
        ...new Set(
          requiredFields
            .map((value) => String(value).trim())
            .filter(Boolean)
        ),
      ];
    }

    const settings = await AdmissionSetting.findOneAndUpdate(
      { academicSession: String(academicSession).trim() },
      { $set: update },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.json({
      success: true,
      message: "Admission settings save ho gayi hain.",
      settings,
    });
  } catch (error) {
    console.error("SAVE ADMISSION SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Admission settings save nahi ho sakin.",
    });
  }
};

// Admin: Delete a session's settings
export const deleteAdmissionSettings = async (req, res) => {
  try {
    const settings = await AdmissionSetting.findByIdAndDelete(
      req.params.id
    );

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Admission settings nahi mili.",
      });
    }

    return res.json({
      success: true,
      message: "Admission settings delete ho gayi hain.",
    });
  } catch (error) {
    console.error("DELETE ADMISSION SETTINGS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Admission settings delete nahi ho sakin.",
    });
  }
};
