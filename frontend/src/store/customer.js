import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_LOCAL || 'http://localhost:3001';
const CUSTOMERS_URL = `${API_BASE}/customers`;

export const useCustomerStore = create((set, get) => ({
  customers: [],

  // Fetch all customers (optional, you might not even need this)
  fetchCustomers: async () => {
    try {
      const response = await axios.get(CUSTOMERS_URL);
      set({ customers: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },

  // Fetch a single customer (logged-in user)
  getCustomerById: async (customerId) => {
    try {
      const response = await axios.get(`${CUSTOMERS_URL}/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching customer by ID:', error);
      throw error;
    }
  },

  // Update a customer's profile
  updateCustomer: async (customerId, customerData) => {
    try {
      const isFormData =
        typeof FormData !== 'undefined' && customerData instanceof FormData;
      const response = await axios.put(
        `${CUSTOMERS_URL}/${customerId}`,
        customerData,
        {
          headers: isFormData
            ? { 'Content-Type': 'multipart/form-data' }
            : undefined,
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  },

  // Keep customers array in sync if needed
  setCustomers: (customers) => set({ customers }),
}));
