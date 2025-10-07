import express from "express";
import {
  getSchedules,
  getSchedulesByCustomer,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getMySchedules,
  getMyDriverSchedules, // add this
} from "../controllers/scheduleController.js";
import { customerOnly, driverOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getSchedules);
router.get("/me", customerOnly, getMySchedules);
router.get("/driver/me", driverOnly, getMyDriverSchedules); // <-- new route

router.get("/customer/:id", getSchedulesByCustomer);
router.get("/:id", getScheduleById);
router.post("/", createSchedule);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;
