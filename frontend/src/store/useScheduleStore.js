import { create } from "zustand";

export const useScheduleStore = create((set) => ({
  reservations: [
    // FOR TESTING SA FRONT END NI... WILL REPLACE WITH ACTUAL DATABASE... SEE PRISMA SCHEMA (../prisma/schema.prisma) or run npx prisma studio sud sa backend
    {
      reservationId: 1,
      carPlate: "ABC-1234",
      customerName: "Juan Dela Cruz",
      pickupDate: "2025-07-6T08:00:00Z",
      returnDate: "2025-07-7T17:00:00Z",
      status: "Confirmed",
    },
    {
      reservationId: 2,
      carPlate: "GOY-4321",
      customerName: "Elijah Go",
      pickupDate: "2025-07-10T08:00:00Z",
      returnDate: "2025-07-13T17:00:00Z",
      status: "Ongoing",
    },
    {
      reservationId: 3,
      carPlate: "LAD-1234",
      customerName: "Juan Dela Cruz",
      pickupDate: "2025-07-2T08:00:00Z",
      returnDate: "2025-07-3T17:00:00Z",
      status: "Done",
    },
    {
      reservationId: 4,
      carPlate: "LAD-4321",
      customerName: "Elijah Go",
      pickupDate: "2025-08-10T08:00:00Z",
      returnDate: "2025-08-13T17:00:00Z",
      status: "Confirmed",
    },
    {
      reservationId: 5,
      carPlate: "GUY-1234",
      customerName: "Juan Dela Cruz",
      pickupDate: "2025-08-15T08:00:00Z",
      returnDate: "2025-08-16T17:00:00Z",
      status: "Confirmed",
    },
    {
      reservationId: 6,
      carPlate: "GUY-4321",
      customerName: "Elijah Go",
      pickupDate: "2025-09-10T08:00:00Z",
      returnDate: "2025-010-13T17:00:00Z",
      status: "Confirmed",
    },
  ],
  setReservations: (rows) => set({ reservations: rows }),
}));
