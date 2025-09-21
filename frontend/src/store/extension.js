import { create } from "zustand";

export const useExtensionStore = create((set) => ({
  extensions: [
    {
      extensionId: 1,
      customerName: "Juan Dela Cruz",
      carModel: "Nissan",
      bookingDate: "2025-06-06",
      startDate: "2025-07-06",
      newEndDate: "2025-07-07",
      paymentStatus: "Paid",
    },
    {
      extensionId: 2,
      customerName: "Juan Dela Cruz",
      carModel: "Nissan",
      bookingDate: "2025-07-06",
      startDate: "2025-08-06",
      newEndDate: "2025-08-07",
      paymentStatus: "Unpaid",
    },
  ],
  setExtensions: (rows) => set({ extensions: rows }),
}));
