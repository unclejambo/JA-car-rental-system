import { create } from "zustand";

export const useStaffStore = create((set) => ({
  staff: [
    {
      staffId: 1,
      staffFirstName: "Juan",
      staffLastName: "Adonis",
      staffAddress: "Northtown, Cabancalan Cebu City, 6000",
      contactNumber: "09123456789",
      staffEmail: "jadonis@gmail.com",
      username: "admin",
      password: "admin",
      type: "ADMIN",
      status: "Active",
    },
    {
      staffId: 2,
      staffFirstName: "Sean",
      staffLastName: "Bascon",
      staffAddress: "Pit-os, Talamban, Cebu City, 6000",
      contactNumber: "09227658943",
      staffEmail: "seanbascon@gmail.com",
      username: "sean",
      password: "sean123",
      type: "STAFF",
      status: "Active",
    },
  ],
  setStaff: (rows) => set({ staff: rows }),
}));
