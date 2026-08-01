const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const dotenv = require("dotenv");

const env = process.env.NODE_ENV || "development";

dotenv.config({
  path: path.resolve(__dirname, `../.env.${env}`),
});

console.log(`Running in ${env} mode`);
console.log(`Loaded env file: .env.${env}`);

const pool = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const voteRoutes = require("./routes/voteRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
// const publicRoutes = require("./routes/publicRoutes"); // fixed typo
const ownerRoutes = require("./routes/ownerRoute");

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Middleware
app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL // restrict in production
        : "*", // allow all in development
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Serve uploads
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Cache-Control", "public, max-age=31536000");
    },
  }),
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "University Voting System Backend is running",
    environment: process.env.NODE_ENV,
    database: "connected",
    timestamp: new Date().toISOString(),
  });
});

// Routes
// app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/super", superAdminRoutes);
app.use("/api/owner", ownerRoutes);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Voting Server running on http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Access from LAN devices: http://YOUR_SERVER_IP:${PORT}`);
});
