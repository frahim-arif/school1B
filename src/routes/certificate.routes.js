import express from "express";
import {
  create,
  view,
  viewSingle,
  verify,
  revoke,
} from "../controllers/certificate.controller.js";

const router = express.Router();

// Create and issue a certificate
router.post("/create", create);

// Get all certificates with search and pagination
router.get("/", view);

// Verify certificate by certificate number
router.get("/verify/:certificateNumber", verify);

// Get one certificate by MongoDB ID
router.get("/single/:id", viewSingle);

// Revoke an issued certificate
router.patch("/:id/revoke", revoke);

export default router;