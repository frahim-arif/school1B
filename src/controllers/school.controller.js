import School from "../models/School.js";

// Create or Update School
export const saveSchool = async (req, res) => {
  try {
    const {
      schoolName,
      address,
      phone,
      email,
      website,
      principal,
      logo,
      timezone,
      currency,
    } = req.body;

    let school = await School.findOne();

    if (school) {
      school.schoolName = schoolName;
      school.address = address;
      school.phone = phone;
      school.email = email;
      school.website = website;
      school.principal = principal;
      school.logo = logo;
      school.timezone = timezone || "Asia/Kolkata";
      school.currency = currency || "INR";

      await school.save();

      return res.json({
        success: true,
        message: "School Updated Successfully",
        school,
      });
    }

    school = await School.create({
      schoolName,
      address,
      phone,
      email,
      website,
      principal,
      logo,
      timezone,
      currency,
    });

    res.status(201).json({
      success: true,
      message: "School Created Successfully",
      school,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Get School Details
export const getSchool = async (req, res) => {
  try {
    const school = await School.findOne();

    res.json({
      success: true,
      school,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete School
export const deleteSchool = async (req, res) => {
  try {
    await School.deleteMany();

    res.json({
      success: true,
      message: "School Deleted Successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};