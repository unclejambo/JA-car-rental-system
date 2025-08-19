import { create } from "zustand";

export const useTransactionStore = create((set) => ({
  transactions: [
    {
      transactionId: 1,
      bookingDate: "2025-06-06",
      customerName: "Juan Dela Cruz",
      carModel: "Nissan",
      completionDate: "2025-07-06",
      cancellationDate: "2025-07-07",
      paymentStatus: "Paid",
    },
    {
      transactionId: 2,
      customerName: "Juan Dela Cruz",
      carModel: "Nissan",
      bookingDate: "2025-07-06",
      completionDate: "2025-08-06",
      cancellationDate: "2025-08-07",
      paymentStatus: "Unpaid",
    },
    {
      transactionId: 3,
      customerName: "Maria Santos",
      carModel: "Toyota Vios",
      bookingDate: "2025-07-15",
      completionDate: "2025-07-20",
      cancellationDate: "2025-07-16",
      paymentStatus: "Refunded",
      refundDate: "2025-07-17",
      refundAmount: 5000,
      refundReason: "Early return"
    },
  ],
  setTransactions: (rows) => set({ transactions: rows }),
}));