import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_LOCAL || 'http://localhost:3001';
const CARS_URL = `${API_BASE}/cars`;

export const useCarStore = create((set, get) => ({
  cars: [],

  fetchCars: async () => {
    try {
      const response = await axios.get(CARS_URL);
      set({ cars: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  },

  addCar: async (carData) => {
    try {
      const response = await axios.post(CARS_URL, carData);
      await get().fetchCars();
      return response.data;
    } catch (error) {
      console.error('Error adding car:', error);
      throw error;
    }
  },

  updateCar: async (carId, carData) => {
    try {
      const isFormData = typeof FormData !== 'undefined' && carData instanceof FormData;
      const response = await axios.put(`${CARS_URL}/${carId}`, carData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
      });
      await get().fetchCars();
      return response.data;
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  },

  deleteCar: async (carId) => {
    try {
      await axios.delete(`${CARS_URL}/${carId}`);
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
