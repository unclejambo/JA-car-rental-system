import { create } from 'zustand';
import { getApiBase } from '../utils/api.js';
import { createAuthenticatedFetch } from '../utils/api.js';

export const useScheduleStore = create((set, get) => ({
  schedules: [],
  loading: false,
  error: null,

  // Fetch all schedules
  fetchSchedules: async () => {
    try {
      set({ loading: true, error: null });
      const API_BASE = getApiBase();
      const authenticatedFetch = createAuthenticatedFetch();
      
      const response = await authenticatedFetch(`${API_BASE}/schedules`);
      if (response.ok) {
        const data = await response.json();
        set({ schedules: data, loading: false });
        return data;
      } else {
        throw new Error('Failed to fetch schedules');
      }
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update reservation status
  updateReservationStatus: async (reservationId, newStatus) => {
    try {
      const API_BASE = getApiBase();
      const authenticatedFetch = createAuthenticatedFetch();
      
      const response = await authenticatedFetch(`${API_BASE}/schedules/${reservationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedReservation = await response.json();
        
        // Update the local state
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === reservationId || schedule.reservationId === reservationId
              ? { ...schedule, status: newStatus }
              : schedule
          ),
        }));
        
        return updatedReservation;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update reservation status');
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Add new schedule/reservation
  addSchedule: async (scheduleData) => {
    try {
      const API_BASE = getApiBase();
      const authenticatedFetch = createAuthenticatedFetch();
      
      const response = await authenticatedFetch(`${API_BASE}/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        const newSchedule = await response.json();
        set((state) => ({
          schedules: [...state.schedules, newSchedule],
        }));
        return newSchedule;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add schedule');
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Update schedule
  updateSchedule: async (scheduleId, scheduleData) => {
    try {
      const API_BASE = getApiBase();
      const authenticatedFetch = createAuthenticatedFetch();
      
      const response = await authenticatedFetch(`${API_BASE}/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (response.ok) {
        const updatedSchedule = await response.json();
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === scheduleId || schedule.reservationId === scheduleId
              ? { ...schedule, ...updatedSchedule }
              : schedule
          ),
        }));
        return updatedSchedule;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update schedule');
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Delete schedule
  deleteSchedule: async (scheduleId) => {
    try {
      const API_BASE = getApiBase();
      const authenticatedFetch = createAuthenticatedFetch();
      
      const response = await authenticatedFetch(`${API_BASE}/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        set((state) => ({
          schedules: state.schedules.filter(
            (schedule) => schedule.id !== scheduleId && schedule.reservationId !== scheduleId
          ),
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete schedule');
      }
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Clear error state
  clearError: () => set({ error: null }),

  // Set schedules directly
  setSchedules: (schedules) => set({ schedules }),

  // Initialize store
  init: async () => {
    return get().fetchSchedules();
  },
}));