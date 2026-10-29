import express from "express";

import { coachSpeak } from "../controllers/voiceController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/coach-speak",
  requireAuth,
  coachSpeak
);

export default router;