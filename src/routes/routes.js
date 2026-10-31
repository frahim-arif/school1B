import express from "express";

import {
  saveSchool,
  getSchool,
  deleteSchool,
} from "../controllers/school.controller.js";

const router = express.Router();

router.post("/", saveSchool);

router.get("/", getSchool);

router.delete("/", deleteSchool);

export default router;