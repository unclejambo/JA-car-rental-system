import { create } from 'zustand';
import axios from 'axios';
import { getApiBase } from '../utils/api.js';

export const useCarStore = create((set, get) => ({
  cars: [],

  fetchCars: async () => {
    try {
      const API_BASE = getApiBase();
      const response = await axios.get(`${API_BASE}/cars`);
      set({ cars: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  },

  addCar: async (carData) => {
    try {
      const API_BASE = getApiBase();
      const response = await axios.post(
        `${API_BASE}/cars`,
        carData
      );
      await get().fetchCars();
      return response.data;
    } catch (error) {
      console.error('Error adding car:', error);
      throw error;
    }
  },

  updateCar: async (carId, carData) => {
    try {
      const API_BASE = getApiBase();
      const response = await axios.put(
        `${API_BASE}/cars/${carId}`,
        carData
      );
      await get().fetchCars();
      return response.data;
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  },

  deleteCar: async (carId) => {
    try {
      const API_BASE = getApiBase();
      await axios.delete(`${API_BASE}/cars/${carId}`);
      await get().fetchCars();
    } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  },

  init: async () => {
    return get().fetchCars();
  },

  setCars: (cars) => set({ cars }),
}));
