import express from "express";
import { updateDriverLicense } from "../controllers/driverLicenseController.js";

const router = express.Router();

// PUT /driver-license/:id
router.put("/:id", updateDriverLicense);

export default router;
