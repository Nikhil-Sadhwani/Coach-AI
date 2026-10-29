import express from "express";

import {
  listRoles,
  selectRole,
  chooseInterview,
  startInterview,
  cameraCheck,
  getCurrentQuestion,
  advanceInterview,
  terminateInterview,
  getSummary,
} from "../controllers/interviewController.js";

import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/roles", requireAuth, listRoles);

router.post("/select-role", requireAuth, selectRole);

router.get("/choose", requireAuth, chooseInterview);

router.post("/start", requireAuth, startInterview);

router.get("/camera-check", requireAuth, cameraCheck);

router.get("/current", requireAuth, getCurrentQuestion);

router.post("/answer", requireAuth, advanceInterview);

router.post("/terminate", requireAuth, terminateInterview);

router.get("/summary", requireAuth, getSummary);

export default router;