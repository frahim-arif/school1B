
import express from "express";

import {
  studentLogin,
  getStudentProfile,
} from "../controllers/studentAuth.controller.js";

import { protectStudent } from "../middleware/studentAuth.middleware.js";

const router = express.Router();

router.post("/login", studentLogin);

router.get("/profile", protectStudent, getStudentProfile);

export default router;
