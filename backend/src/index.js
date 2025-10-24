import "dotenv/config"; // <-- MUST be first so process.env is populated for modules
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import carRoutes from "./routes/carRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import customerRoutes from "./routes/customerRoute.js";
import bookingRoutes from "./routes/bookingRoute.js";
import scheduleRoutes from "./routes/scheduleRoute.js";
import authRoutes from "./routes/authRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js";
import storageRouter from "./routes/storage.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import refundRoutes from "./routes/refundRoute.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import adminProfileRoutes from "./routes/adminProfileRoutes.js";
import driverProfileRoutes from "./routes/driverProfileRoutes.js";
import customerProfileRoutes from "./routes/customerProfileRoutes.js";
import driverLicenseRoutes from "./routes/driverLicenseRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js";
import { getAllMaintenanceRecords } from "./controllers/maintenanceController.js";
import waitlistRoutes from "./routes/waitlistRoutes.js";
import manageFeesRoutes from "./routes/manageFeesRoutes.js";
import releaseRoutes from "./routes/releaseRoute.js";
import releasePaymentRoutes from "./routes/releasePaymentRoute.js";
import returnRoutes from "./routes/returnRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import autoCancelRoutes from "./routes/autoCancelRoutes.js";
import phoneVerificationRoutes from "./routes/phoneVerificationRoutes.js";
import { autoCancelExpiredBookings, autoCancelExpiredExtensions } from "./utils/autoCancel.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // <--- added

// Serve static files (uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Debug middleware - log all requests
app.use((req, res, next) => {
  next();
});

// Test route
app.get("/", (req, res) => {
  res.send("JA Car Rental Backend is running!");
});

// API Routes
app.use("/cars", carRoutes);
app.use("/drivers", driverRoutes);
app.use("/api/customers", customerRoutes); // ✅ Fixed: Added /api prefix to match frontend calls
app.use("/bookings", bookingRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auth", forgotPasswordRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/storage", storageRouter);
app.use("/api", waitlistRoutes);
app.use("/payments", paymentRoutes);
app.use("/refunds", refundRoutes);
app.use("/transactions", transactionRoutes);
app.use("/api/admin-profile", adminProfileRoutes);
app.use("/api/driver-profile", driverProfileRoutes);
app.use("/api/customer-profile", customerProfileRoutes);
app.use("/api/driver-license", driverLicenseRoutes);
app.use("/api/customer-license", driverLicenseRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/maintenance", (req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return getAllMaintenanceRecords(req, res);
  }
  next();
});
app.use("/cars/:carId/maintenance", maintenanceRoutes);
app.use("/manage-fees", manageFeesRoutes);
app.use("/releases", releaseRoutes);
app.use("/release-payments", releasePaymentRoutes);
app.use("/returns", returnRoutes);
app.use("/admins", adminRoutes);
app.use("/api", autoCancelRoutes);
app.use("/api/phone-verification", phoneVerificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  // Setup auto-cancel scheduler
  // Runs every hour to check for expired bookings AND extensions
  const AUTO_CANCEL_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
  // Run immediately on startup (after 30 seconds to let server initialize)
  setTimeout(async () => {
    await autoCancelExpiredExtensions();
    await autoCancelExpiredBookings();
  }, 30000);

  // Then run every hour
  setInterval(async () => {
    await autoCancelExpiredExtensions();
    await autoCancelExpiredBookings();
  }, AUTO_CANCEL_INTERVAL);
});
