// backend/src/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const pool = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const voteRoutes = require("./routes/voteRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*", // For local LAN - you can restrict later
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Rate limiting (basic protection)
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Serve built React frontend (from Phase 1)
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "University Voting System Backend is running",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/superadmin", superAdminRoutes);

// Global error handler (must be last)
app.use(errorHandler);

// Catch-all route to serve React frontend for any unknown route
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Voting Server running on http://0.0.0.0:${PORT}`);
  console.log(`Access from LAN devices: http://YOUR_SERVER_IP:${PORT}`);
  console.log(`Database connected successfully`);
});
