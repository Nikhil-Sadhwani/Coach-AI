
import {
  ensureRoleBank,
  getQuestionsForRole,
  getAvailableRoles,
  getRandomQuestionsForRole,
} from "../services/questionBank.js";

import { answerSimilarityScore } from "../services/scoring.js";

// --------------------------------------------------
// Authentication
// --------------------------------------------------

const isAuthenticated = (req) => Boolean(req.session?.uid);

// --------------------------------------------------
// Get the questions for the current interview.
//
// IMPORTANT:
// Always use the randomized question set saved in
// the session before falling back to the role bank.
// This keeps displayed questions and scoring aligned.
// --------------------------------------------------

const getCurrentQuestions = (req) => {
  if (
    Array.isArray(req.session.questions) &&
    req.session.questions.length > 0
  ) {
    return req.session.questions;
  }

  const role = req.session.mode || req.session.selected_role;
  const ensuredRole = role ? ensureRoleBank(role) : null;

  return (
    (ensuredRole && getQuestionsForRole(ensuredRole)) ||
    getQuestionsForRole("Software Engineer") ||
    []
  );
};

// --------------------------------------------------
// Select Role
// POST /select_role
// --------------------------------------------------

export const selectRole = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const customRole =
      typeof req.body?.customRole === "string"
        ? req.body.customRole.trim()
        : "";

    const selectedMode =
      typeof req.body?.mode === "string"
        ? req.body.mode.trim()
        : "";

    const requestedRole = customRole || selectedMode;

    if (!requestedRole) {
      return res.status(400).json({
        success: false,
        message: "Please select or enter a job role.",
      });
    }

    const role = ensureRoleBank(requestedRole);

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Unable to prepare questions for this role.",
      });
    }

    req.session.selected_role = role;

    // Clear any previous interview when selecting a role.
    req.session.active = false;
    delete req.session.questions;
    delete req.session.history;
    delete req.session.step;
    delete req.session.mode;
    delete req.session.interview_type;

    return res.status(200).json({
      success: true,
      message: "Role selected successfully",
      role,
    });
  } catch (error) {
    console.error("Select Role Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to select role",
    });
  }
};

// --------------------------------------------------
// Choose Interview
// GET /choose
// --------------------------------------------------

export const chooseInterview = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const role = req.session.selected_role;

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Choose your job role first.",
      });
    }

    return res.status(200).json({
      success: true,
      role,
    });
  } catch (error) {
    console.error("Choose Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load interview options",
    });
  }
};

// --------------------------------------------------
// Start Interview
// POST /start
//
// Generate a new random question set every time a
// new interview is started.
// --------------------------------------------------

export const startInterview = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const selectedRole = req.session.selected_role;

    if (!selectedRole) {
      return res.status(400).json({
        success: false,
        message: "Please select a job role first.",
      });
    }

    const role = ensureRoleBank(selectedRole);

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Unable to prepare questions for this role.",
      });
    }

    // Select a fresh random set for this interview.
    const selectedQuestions = getRandomQuestionsForRole(role, 7);

    if (
      !Array.isArray(selectedQuestions) ||
      selectedQuestions.length === 0 ||
      selectedQuestions.some(
        (question) =>
          !question ||
          typeof question.q !== "string" ||
          typeof question.a !== "string"
      )
    ) {
      console.error("Invalid question set for role:", role);

      return res.status(500).json({
        success: false,
        message: "Unable to generate a valid interview question set.",
      });
    }

    const interviewType =
      req.body?.interviewType === "voice" ? "voice" : "text";

    // Store the exact set used by this interview.
    req.session.selected_role = role;
    req.session.mode = role;
    req.session.questions = selectedQuestions;
    req.session.step = 0;
    req.session.history = Array(selectedQuestions.length).fill(0);
    req.session.active = true;
    req.session.interview_type = interviewType;

    return res.status(200).json({
      success: true,
      message: "Interview started successfully",
      interviewType,
      role,
      step: 0,
      number: 1,
      total: selectedQuestions.length,
      active: true,
    });
  } catch (error) {
    console.error("Start Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to start interview",
    });
  }
};

// --------------------------------------------------
// Camera Check
// GET /camera-check
// --------------------------------------------------

export const cameraCheck = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.session.active) {
      return res.status(400).json({
        success: false,
        message: "No active interview session.",
      });
    }

    return res.status(200).json({
      success: true,
      active: true,
      interviewType: req.session.interview_type,
      nextRoom:
        req.session.interview_type === "voice" ? "voice" : "text",
    });
  } catch (error) {
    console.error("Camera Check Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load camera check",
    });
  }
};

// --------------------------------------------------
// Get Current Interview Question
// GET /current
//
// Both Text and Voice use this same session question set.
// --------------------------------------------------

export const getCurrentQuestion = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.session.active) {
      return res.status(400).json({
        success: false,
        message: "Session terminated. Please start a new interview.",
      });
    }

    const questions = getCurrentQuestions(req);
    const step = Number(req.session.step ?? 0);

    if (
      !questions.length ||
      !Number.isInteger(step) ||
      step < 0 ||
      step >= questions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Interview question not found",
      });
    }

    const question = questions[step];

    return res.status(200).json({
      success: true,
      role: req.session.mode,
      interviewType: req.session.interview_type || "text",
      question: question.q,
      step,
      number: step + 1,
      total: questions.length,
      active: true,
    });
  } catch (error) {
    console.error("Current Question Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load current question",
    });
  }
};

// --------------------------------------------------
// Answer / Next / Previous / Submit
// POST /answer
//
// Score the answer against the expected answer for the
// exact question displayed in the current session.
// --------------------------------------------------

export const advanceInterview = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!req.session.active) {
      return res.status(400).json({
        success: false,
        message: "Session terminated. Please start a new interview.",
      });
    }

    const questions = getCurrentQuestions(req);
    const step = Number(req.session.step ?? 0);
    const action = req.body?.action;

    const answer =
      typeof req.body?.answer === "string"
        ? req.body.answer
        : "";

    if (
      !questions.length ||
      !Number.isInteger(step) ||
      step < 0 ||
      step >= questions.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Interview question not found",
      });
    }

    if (!["next", "submit", "prev"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid interview action",
      });
    }

    const currentQuestion = questions[step];

    // Always score against the matching answer from the
    // randomized session question set.
    const score = answerSimilarityScore(
      currentQuestion.a,
      answer
    );

    const history = Array.isArray(req.session.history)
      ? [...req.session.history]
      : Array(questions.length).fill(0);

    // Keep the history array aligned with the question set.
    while (history.length < questions.length) {
      history.push(0);
    }

    history.length = questions.length;
    history[step] = score;

    req.session.history = history;

    // NEXT / SUBMIT: preserve the existing app behavior.
    if (action === "next" || action === "submit") {
      if (step + 1 >= questions.length) {
        req.session.active = false;

        return res.status(200).json({
          success: true,
          completed: true,
          score,
          total: questions.length,
          message: "Interview completed",
        });
      }

      req.session.step = step + 1;

      return res.status(200).json({
        success: true,
        completed: false,
        score,
        step: req.session.step,
        number: req.session.step + 1,
        total: questions.length,
      });
    }

    // PREVIOUS
    if (action === "prev") {
      if (step === 0) {
        return res.status(400).json({
          success: false,
          message: "You are already on the first question.",
        });
      }

      req.session.step = step - 1;

      return res.status(200).json({
        success: true,
        completed: false,
        score,
        step: req.session.step,
        number: req.session.step + 1,
        total: questions.length,
      });
    }
  } catch (error) {
    console.error("Advance Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process interview answer",
    });
  }
};

// --------------------------------------------------
// Terminate Interview
// POST /terminate
// --------------------------------------------------

export const terminateInterview = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    req.session.active = false;

    return res.status(200).json({
      success: true,
      message: "Current interview session terminated.",
    });
  } catch (error) {
    console.error("Terminate Interview Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to terminate interview",
    });
  }
};

// --------------------------------------------------
// Summary
// GET /summary
// --------------------------------------------------

export const getSummary = (req, res) => {
  try {
    if (!isAuthenticated(req)) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const history = Array.isArray(req.session.history)
      ? req.session.history
      : [];

    const average =
      history.length > 0
        ? history.reduce((sum, value) => sum + value, 0) /
          history.length
        : 0;

    const avg = Math.round(average);

    // Preserve the original app's presence-score behavior.
    const presenceScore =
      Math.floor(Math.random() * 14) + 85;

    const interviewType = req.session.interview_type;

    const feedback =
      `Presence verified at ${presenceScore}%. ` +
      (interviewType === "voice"
        ? "Excellent vocal clarity and pacing in your live session."
        : "Strong on-camera presence and steady delivery.");

    const rubric = analyzeRubric(history);

    return res.status(200).json({
      success: true,
      avg,
      presenceScore,
      feedback,
      rubric,
      history,
      interviewType,
      role: req.session.mode || null,
    });
  } catch (error) {
    console.error("Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate summary",
    });
  }
};

// --------------------------------------------------
// Rubric Analysis
// --------------------------------------------------

const analyzeRubric = (scores) => {
  const average =
    scores.length > 0
      ? scores.reduce((sum, value) => sum + value, 0) /
        scores.length
      : 0;

  if (average >= 75) {
    return {
      tone: "Executive",
      pacing: "Perfect",
      content: "Expert",
    };
  }

  return {
    tone: "Professional",
    pacing: "Steady",
    content: "Competent",
  };
};

// --------------------------------------------------
// Available Job Roles
// --------------------------------------------------

export const listRoles = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      roles: getAvailableRoles(),
    });
  } catch (error) {
    console.error("List Roles Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load job roles",
    });
  }
};
