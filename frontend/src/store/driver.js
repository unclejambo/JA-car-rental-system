import { create } from "zustand";

export const useDriverStore = create((set) => ({
  driver: [
    {
      driverId: 1,
      driverFirstName: "Juan",
      driverLastName: "Adonis",
      driverAddress: "Northtown, Cabancalan Cebu City, 6000",
      contactNumber: "09123456789",
      driverEmail: "jadonis@gmail.com",
      driverLicense: "123456789",
      restriction: "1,2",
      expirationDate: "2029-12-31",
      username: "driver",
      password: "123456",
      status: "Active",
    },
  ],
  setDriver: (rows) => set({ driver: rows }),
}));
