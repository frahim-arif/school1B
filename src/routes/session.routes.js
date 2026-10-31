import express from "express";

import {
  createSession,
  getSessions,
  getCurrentSession,
} from "../controllers/session.controller.js";

const router = express.Router();

router.post("/", createSession);

router.get("/", getSessions);

router.get("/current", getCurrentSession);

export default router;