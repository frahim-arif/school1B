
import NoticeSettings from "../models/NoticeSettings.js";

export const getSettings = async (req, res, next) => {
  try {
    let settings = await NoticeSettings.findOne({
      key: "school-notice-settings",
    });

    if (!settings) {
      settings = await NoticeSettings.create({
        key: "school-notice-settings",
      });
    }

    return res.status(200).json({
      _status: true,
      _message: "Notice settings fetched successfully",
      _data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const allowedFields = [
      "defaultCategory",
      "autoExpire",
      "notifications",
      "studentView",
      "staffView",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const settings = await NoticeSettings.findOneAndUpdate(
      { key: "school-notice-settings" },
      {
        $set: updates,
        $setOnInsert: { key: "school-notice-settings" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      _status: true,
      _message: "Notice settings updated successfully",
      _data: settings,
    });
  } catch (error) {
    next(error);
  }
};
