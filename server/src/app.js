import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

import authRoutes from "./routes/authRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import connectDB from "./config/db.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error(
      "Database unavailable for request:",
      error.message
    );

    return res.status(503).json({
      success: false,
      message: "Database connection unavailable",
    });
  }
});


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),

    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Coach AI API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/voice", voiceRoutes);

export default app;