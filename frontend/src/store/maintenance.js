import { create } from "zustand";

export const useMaintenanceStore = create((set) => ({
  maintenances: [
    // {
    //   maintenanceId: 1,
    //   customerName: "Juan Dela Cruz",
    //   carModel: "Nissan",
    //   bookingDate: "2025-06-06",
    //   purpose: "Vacation",
    //   startDate: "2025-07-06",
    //   endDate: "2025-07-07",
    //   paymentStatus: "Paid",
    //   bookingStatus: "Confirmed",
    // },
  ],
  setMaintenances: (rows) => set({ maintenances: rows }),
}));
