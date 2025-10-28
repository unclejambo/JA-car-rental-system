import express from "express";
import { updateDriverLicense, deleteLicenseImage, createDriverLicenseForCustomer } from "../controllers/driverLicenseController.js";

const router = express.Router();

// POST /driver-license/customer/:customerId - Create license for customer
router.post("/customer/:customerId", createDriverLicenseForCustomer);

// PUT /driver-license/:id
router.put("/:id", updateDriverLicense);

// DELETE /driver-license/:id/image
router.delete("/:id/image", deleteLicenseImage);

export default router;
