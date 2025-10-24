import { create } from 'zustand';
import axios from 'axios';
import { getApiBase } from '../utils/api.js';

const getCustomersUrl = () => `${getApiBase()}/api/customers`; // ✅ Fixed: Added /api prefix

export const useCustomerStore = create((set, get) => ({
  customers: [],

  // Fetch all customers (optional, you might not even need this)
  fetchCustomers: async () => {
    try {
      const customersUrl = getCustomersUrl();
      const response = await axios.get(customersUrl);
      set({ customers: response.data });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Fetch a single customer (logged-in user)
  getCustomerById: async (customerId) => {
    try {
      const customersUrl = getCustomersUrl();
      const response = await axios.get(`${customersUrl}/${customerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update a customer's profile
  updateCustomer: async (customerId, customerData) => {
    try {
      const customersUrl = getCustomersUrl();
      const isFormData =
        typeof FormData !== 'undefined' && customerData instanceof FormData;
      const response = await axios.put(
        `${customersUrl}/${customerId}`,
        customerData,
        {
          headers: isFormData
            ? { 'Content-Type': 'multipart/form-data' }
            : undefined,
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Keep customers array in sync if needed
  setCustomers: (customers) => set({ customers }),
}));
