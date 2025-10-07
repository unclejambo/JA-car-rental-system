import "dotenv/config"; // <-- MUST be first so process.env is populated for modules
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import carRoutes from "./routes/carRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import customerRoutes from "./routes/customerRoute.js";
import bookingRoutes from "./routes/bookingRoute.js";
import scheduleRoutes from "./routes/scheduleRoute.js"; // <--- added
import authRoutes from "./routes/authRoutes.js"; // <--- added
import registrationRoutes from "./routes/registrationRoutes.js"; // <--- added
import forgotPasswordRoutes from "./routes/forgotPasswordRoutes.js"; // <--- added forgot password routes
import storageRouter from "./routes/storage.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import refundRoutes from "./routes/refundRoute.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import adminProfileRoutes from "./routes/adminProfileRoutes.js";
import driverProfileRoutes from "./routes/driverProfileRoutes.js";
import driverLicenseRoutes from "./routes/driverLicenseRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import maintenanceRoutes from "./routes/maintenanceRoutes.js"; // <--- added maintenance routes
import waitlistRoutes from "./routes/waitlistRoutes.js"; // <--- added waitlist routes
import manageFeesRoutes from "./routes/manageFeesRoutes.js"; // <--- added manage fees routes
import releaseRoutes from "./routes/releaseRoute.js"; // <--- added release routes
import releasePaymentRoutes from "./routes/releasePaymentRoute.js"; // <--- added release payment routes
import adminRoutes from "./routes/adminRoutes.js";

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

// Test route
app.get("/", (req, res) => {
  res.send("JA Car Rental Backend is running!");
});

// API Routes
app.use("/cars", carRoutes);
app.use("/drivers", driverRoutes);
app.use("/customers", customerRoutes);
app.use("/bookings", bookingRoutes);
app.use("/schedules", scheduleRoutes); // <--- added
app.use("/api/auth", authRoutes); // <--- added
app.use("/api/auth", forgotPasswordRoutes); // <--- added forgot password routes
app.use("/api/registration", registrationRoutes); // <--- added
app.use("/api/storage", storageRouter);
app.use("/api", waitlistRoutes); // <--- added waitlist routes
app.use("/payments", paymentRoutes);
app.use("/refunds", refundRoutes);
app.use("/transactions", transactionRoutes);
app.use("/api/admin-profile", adminProfileRoutes);
app.use("/api/driver-profile", driverProfileRoutes);
app.use("/api/driver-license", driverLicenseRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/cars/:carId/maintenance", maintenanceRoutes); // <--- added maintenance routes
app.use("/manage-fees", manageFeesRoutes); // <--- added manage fees routes
app.use("/releases", releaseRoutes); // <--- added release routes
app.use("/release-payments", releasePaymentRoutes); // <--- added release payment routes
app.use("/admins", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
