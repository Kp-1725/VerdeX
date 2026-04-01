const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const farmerRoutes = require("./routes/farmerRoutes");
const requestRoutes = require("./routes/requestRoutes");
const metricsRoutes = require("./routes/metricsRoutes");
const { globalLimiter } = require("./middleware/securityMiddleware");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = String(
  process.env.CLIENT_ORIGIN || "http://localhost:5173",
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(globalLimiter);

app.get("/health", (req, res) => {
  return res.json({ message: "API is running" });
});

app.use("/", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/farmers", farmerRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/metrics", metricsRoutes);

app.use((err, req, res, next) => {
  // Centralized error handling keeps responses friendly and consistent.
  console.error(err);
  return res
    .status(500)
    .json({ message: "Something went wrong. Please try again." });
});

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing.");
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
      throw new Error("JWT_SECRET must be at least 16 characters long.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start failed:", error.message);
    process.exit(1);
  }
}

startServer();
