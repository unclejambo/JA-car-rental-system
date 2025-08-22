import { create } from "zustand";
import axios from 'axios';

export const useCarStore = create((set, get) => ({
  cars: [],
  
  fetchCars: async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/cars');
      set({ cars: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  },
  
  addCar: async (carData) => {
    try {
      const response = await axios.post('http://localhost:3001/api/cars', carData);
      await get().fetchCars();
      return response.data;
    } catch (error) {
      console.error('Error adding car:', error);
      throw error;
    }
  },
  
  updateCar: async (carId, carData) => {
    try {
      const response = await axios.put(`http://localhost:3001/api/cars/${carId}`, carData);
      await get().fetchCars();
      return response.data;
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  },
  
  deleteCar: async (carId) => {
    try {
      await axios.delete(`http://localhost:3001/api/cars/${carId}`);
      await get().fetchCars();
    } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  },
  
  init: async () => {
    return get().fetchCars();
  },
  
  setCars: (cars) => set({ cars })
}));
