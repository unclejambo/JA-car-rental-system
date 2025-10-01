import { create } from "zustand";

export const useUserStore = create((set) => ({
  users: [
    {
      customerId: 1,
      customerFirstName: "Juan",
      customerLastName: "Adonis",
      customerAddress: "Northtown, Cabancalan Cebu City, 6000",
      contactNumber: "09123456789",
      socMedLink: "https://www.facebook.com/jadonis",
      customerEmail: "jadonis@gmail.com",
      driverLicense: "123456789",
      username: "customer1",
      password: "123456",
      status: "Active",
    },
  ],
  setUsers: (rows) => set({ users: rows }),
}));
