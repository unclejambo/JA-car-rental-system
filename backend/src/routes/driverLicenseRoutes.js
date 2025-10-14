import express from "express";
import { updateDriverLicense, deleteLicenseImage } from "../controllers/driverLicenseController.js";

const router = express.Router();

// PUT /driver-license/:id
router.put("/:id", updateDriverLicense);

// DELETE /driver-license/:id/image
router.delete("/:id/image", deleteLicenseImage);

export default router;
