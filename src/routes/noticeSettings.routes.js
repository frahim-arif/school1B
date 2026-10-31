
import express from "express";
import * as controller from "../controllers/noticeSettings.controller.js";

const router = express.Router();

router.get("/", controller.getSettings);
router.put("/", controller.updateSettings);

export default router;
