import prisma from "../config/prisma.js";

// @desc    Update a driver license
// @route   PUT /driver-license/:id
// @access  Authenticated
export const updateDriverLicense = async (req, res) => {
  try {
    const driverLicenseNo = req.params.id;
    const { restrictions, expiry_date, dl_img_url } = req.body;

    console.log("🟢 Incoming update request:", req.body);

    // Find current record for comparison
    const existing = await prisma.driverLicense.findUnique({
      where: { driver_license_no: driverLicenseNo },
    });

    if (!existing) {
      return res.status(404).json({ error: "License not found" });
    }

    const updated = await prisma.driverLicense.update({
      where: { driver_license_no: driverLicenseNo },
      data: {
        restrictions:
          typeof restrictions === "string"
            ? restrictions.trim()
            : existing.restrictions,
        expiry_date: expiry_date ? new Date(expiry_date) : existing.expiry_date,
        dl_img_url: dl_img_url?.trim() || existing.dl_img_url,
      },
    });

    console.log("✅ Prisma updated license:", updated);
    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating driver license:", error);
    res.status(500).json({ error: "Failed to update driver license" });
  }
};
