import { create } from "zustand";

export const useUserStore = create((set) => ({
  users: [
    // {
    //   customerId: 1,
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
  setUsers: (rows) => set({ users: rows }),
}));
