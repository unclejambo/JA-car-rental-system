import { create } from "zustand";

// Global schedule store – holds reservation records used by AdminSchedulePage.
// You can later load real data from your backend and call setReservations().

export const useScheduleStore = create((set) => ({
  reservations: [
    {
      reservationId: 1,
      carPlate: "ABC-1234",
      customerName: "Juan Dela Cruz",
      pickupDate: "2025-07-06T08:00:00Z",
      returnDate: "2025-07-07T17:00:00Z",
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
      pickupDate: "2025-07-02T08:00:00Z",
      returnDate: "2025-07-03T17:00:00Z",
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
    {
      reservationId: 7,
      carPlate: "ABC-4321",
      customerName: "John Goy",
      pickupDate: "2025-09-10T08:00:00Z",
      returnDate: "2025-010-13T17:00:00Z",
      status: "Confirmed",
    },
    {
      reservationId: 8,
      carPlate: "GBC-4322",
      customerName: "Fein Geer",
      pickupDate: "2025-010-10T08:00:00Z",
      returnDate: "2025-010-13T17:00:00Z",
      status: "Confirmed",
    },
    {
      reservationId: 9,
      carPlate: "GBC-4322",
      customerName: "Fein Geer",
      pickupDate: "2025-010-15T08:00:00Z",
      returnDate: "2025-010-18T17:00:00Z",
      status: "Confirmed",
    },
    {
      reservationId: 10,
      carPlate: "GBC-4322",
      customerName: "Fein Geer",
      pickupDate: "2025-010-21T08:00:00Z",
      returnDate: "2025-010-23T17:00:00Z",
      status: "Confirmed",
    },
  ],
  setReservations: (rows) => set({ reservations: rows }),
}));
