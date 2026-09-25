import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import cron from "node-cron";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import credentialRoutes from "./routes/credentialRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import clubmeetingRoutes from "./routes/clubmeetingRoutes.js";
import electionRoutes from "./routes/electionRoutes.js";
import mentorshipRoutes from "./routes/mentorshipRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";

// EVENT RELATED IMPORTS
import eventRoutes from "./routes/eventRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import Event from "./models/Event.js";
import Registration from "./models/Registration.js";
import { sendEventReminder } from "./utils/emailService.js";

dotenv.config();

const app = express();

// CORE MIDDLEWARE
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ENSURE UPLOADS FOLDER EXISTS
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// STATIC FILES
app.use("/uploads", express.static(uploadsDir));

// BASIC ROUTES
app.get("/", (req, res) => {
  res.status(200).json({
    message: "UniConnect backend is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is healthy",
  });
});

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/credentials", credentialRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/expenses", expenseRoutes);

// New primary route
app.use("/api/clubmeetings", clubmeetingRoutes);

// Legacy alias kept temporarily so current frontend does not break
app.use("/api/clubevents", clubmeetingRoutes);

app.use("/api/elections", electionRoutes);
app.use("/api/mentorships", mentorshipRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/membership", membershipRoutes);

// EVENT RELATED ROUTES
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);

// DAILY EVENT REMINDER CRON JOB
cron.schedule("0 9 * * *", async () => {
  console.log("Running daily reminder cron job...");

  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const upcomingEvents = await Event.find({
      eventDate: { $gte: tomorrow, $lt: dayAfterTomorrow },
    });

    for (const event of upcomingEvents) {
      const registrations = await Registration.find({
        eventId: event._id,
        status: "registered",
      });

      for (const reg of registrations) {
        try {
          await sendEventReminder(
            reg.studentEmail,
            reg.studentName,
            event.eventTitle,
            event.eventDate,
            event.venue,
            event.startTime
          );
        } catch (err) {
          console.error(`Failed to send reminder to ${reg.studentEmail}:`, err);
        }
      }
    }

    console.log(`Reminders sent for ${upcomingEvents.length} events`);
  } catch (error) {
    console.error("Cron job error:", error);
  }
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  if (err.name === "MulterError") {
    return res.status(400).json({
      message: err.message || "File upload error",
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

// MONGODB CONNECTION + SERVER
mongoose
  .connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");

    const port = Number(process.env.PORT) || 5000;

    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.log(
          `Server is already running on port ${port}. Reusing existing instance.`
        );
        process.exit(0);
      }

      console.error("Server startup error:", error.message);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  });