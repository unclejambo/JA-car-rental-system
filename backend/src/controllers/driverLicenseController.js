import prisma from "../config/prisma.js";

// @desc    Update a driver license
// @route   PUT /driver-license/:id
// @access  Authenticated
export const updateDriverLicense = async (req, res) => {
  try {
    const driverLicenseNo = req.params.id;
    const allowed = ["restrictions", "expiry_date", "dl_img_url"];
    const data = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) data[key] = req.body[key];
    }
    const updated = await prisma.driverLicense.update({
      where: { driver_license_no: driverLicenseNo },
      data,
    });
    res.json(updated);
  } catch (error) {
    console.error("Error updating driver license:", error);
    res.status(500).json({ error: "Failed to update driver license" });
  }
};
