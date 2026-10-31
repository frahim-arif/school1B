import express from "express";
import {
  view,
  create,
  update,
  remove,
} from "../controllers/certificateTemplate.controller.js";

const router = express.Router();

router.get("/", view);
router.post("/", create);
router.put("/:id", update);
router.patch("/:id", update);
router.delete("/:id", remove);

export default router;