import { create } from "zustand";

export const useCancellationStore = create((set) => ({
  cancellations: [
    {
      cancellationId: 1,
      customerName: "Juan Dela Cruz",
      carModel: "Nissan",
      bookingDate: "2025-06-06",
      reason: "Change my mind.",
      startDate: "2025-07-06",
      endDate: "2025-07-07",
    },
  ],
  setCancellation: (rows) => set({ cancellations: rows }),
}));
