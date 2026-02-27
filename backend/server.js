import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import tenantRoutes from "./routes/tenantRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import rentRoutes from "./routes/rentRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import vacatingRequestRoutes from "./routes/vacatingRequestRoutes.js";
import exchangeRequestRoutes from "./routes/exchangeRequestRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import setupSwagger from './swagger.js';
import { authLimiter, chatLimiter, smsLimiter, apiLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["JWT_SECRET", "MONGO_URI"];
const optionalEnvVars = ["GEMINI_API_KEY", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ FATAL: Missing required env var: ${envVar}`);
    process.exit(1);
  }
}
for (const envVar of optionalEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️  WARNING: Missing optional env var: ${envVar} — related features may not work.`);
  }
}

connectDB();

const app = express();
app.use(helmet());
app.use(express.json());
// Allow frontend origin from env or common dev ports (Vite defaults)
const frontendEnv = process.env.FRONTEND_URL;
const allowedOrigins = [];
if (frontendEnv) {
  allowedOrigins.push(...frontendEnv.split(","));
} else {
  allowedOrigins.push("http://localhost:8080", "http://localhost:5173");
}
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Apply general API rate limiter to all /api routes
app.use("/api", apiLimiter);

app.get("/api/test", (req, res) => res.json({ ok: true, time: new Date() }));

// Health check endpoint for AWS ALB / target group
app.get("/health", (req, res) => res.status(200).json({ status: "healthy", uptime: process.uptime() }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/chat", chatLimiter, chatRoutes);
app.use("/api/rent", rentRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/vacating-requests", vacatingRequestRoutes);
app.use("/api/exchange-requests", exchangeRequestRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/superadmin", superAdminRoutes);

// Swagger UI
setupSwagger(app);

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
