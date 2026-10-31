
import express from "express";
import {
  view,
  update,
} from "../controllers/certificateSetting.controller.js";

const router = express.Router();

router.get("/", view);
router.put("/", update);

export default router;
