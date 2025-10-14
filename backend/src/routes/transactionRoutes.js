import express from "express";
import {
  getTransactions,
  getMyTransactions,
  createTransaction,
} from "../controllers/transactionController.js";
import { verifyToken, requireCustomer } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getTransactions);
router.get("/my-transactions", verifyToken, requireCustomer, getMyTransactions);
router.post("/", createTransaction);

export default router;
