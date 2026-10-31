
import Staff from "../models/Staff.js";

// GET: All staff
export const getStaff = async (req, res) => {
  try {
    const staff = await Staff.find().sort({
      firstName: 1,
      lastName: 1,
    });

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("GET STAFF ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Staff list load nahi ho saki.",
      error: error.message,
    });
  }
};

// GET: Staff by ID
export const getStaffById = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff nahi mila.",
      });
    }

    return res.status(200).json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error("GET STAFF BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Staff details load nahi ho sakin.",
      error: error.message,
    });
  }
};

// POST: Create staff
export const createStaff = async (req, res) => {
  try {
    const {
      staffId,
      firstName,
      lastName,
      name,
      designation,
      role,
      department,
      phone,
      email,
      address,
      joiningDate,
      salary,
      status,
    } = req.body;

    const resolvedName = String(firstName || name || "").trim();
    const nameParts = resolvedName.split(/\s+/).filter(Boolean);

    const resolvedFirstName = String(
      firstName || nameParts.shift() || ""
    ).trim();

    const resolvedLastName = String(
      lastName || nameParts.join(" ") || ""
    ).trim();

    const resolvedDesignation = String(
      designation || role || ""
    ).trim();

    if (!resolvedFirstName || !resolvedDesignation) {
      return res.status(400).json({
        success: false,
        message: "Staff ka naam aur designation zaroori hain.",
      });
    }

    const resolvedSalary =
      salary === "" || salary == null ? 0 : Number(salary);

    if (!Number.isFinite(resolvedSalary) || resolvedSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid salary enter karein.",
      });
    }

    const resolvedStatus = status || "Active";

    if (!["Active", "Inactive"].includes(resolvedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Status Active ya Inactive hona chahiye.",
      });
    }

    const staffData = {
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      designation: resolvedDesignation,
      department: String(department || "General").trim() || "General",
      phone: String(phone || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      address: String(address || "").trim(),
      salary: resolvedSalary,
      status: resolvedStatus,
    };

    if (staffId && String(staffId).trim()) {
      staffData.staffId = String(staffId).trim();
    }

    if (joiningDate) {
      const parsedDate = new Date(joiningDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Valid joining date enter karein.",
        });
      }

      staffData.joiningDate = parsedDate;
    }

    const staff = await Staff.create(staffData);

    return res.status(201).json({
      success: true,
      message: "Staff successfully add ho gaya.",
      staff,
    });
  } catch (error) {
    console.error("CREATE STAFF ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Ye Staff ID pehle se maujood hai.",
        error: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Staff create nahi ho saka.",
      error: error.message,
    });
  }
};

// PATCH: Update staff
export const updateStaff = async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.name && !updates.firstName) {
      const parts = String(updates.name).trim().split(/\s+/);
      updates.firstName = parts.shift() || "";
      updates.lastName = parts.join(" ");
      delete updates.name;
    }

    if (updates.role && !updates.designation) {
      updates.designation = updates.role;
      delete updates.role;
    }

    const allowedFields = [
      "staffId",
      "firstName",
      "lastName",
      "designation",
      "department",
      "phone",
      "email",
      "address",
      "joiningDate",
      "salary",
      "status",
    ];

    const safeUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    if (safeUpdates.email !== undefined) {
      safeUpdates.email = String(safeUpdates.email).trim().toLowerCase();
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff nahi mila.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff update ho gaya.",
      staff,
    });
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);

    return res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: "Staff update nahi ho saka.",
      error: error.message,
    });
  }
};

// DELETE: Deactivate staff
export const deactivateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { $set: { status: "Inactive" } },
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff nahi mila.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Staff inactive kar diya gaya.",
      staff,
    });
  } catch (error) {
    console.error("DEACTIVATE STAFF ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Staff inactive nahi ho saka.",
      error: error.message,
    });
  }
};
