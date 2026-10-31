
import express from "express";

import {
  promoteStudents,
  getPromotionHistory,
} from "../controllers/studentPromotion.controller.js";

const router = express.Router();

router.get("/history", getPromotionHistory);
router.post("/", promoteStudents);

export default router;
