import { create } from "zustand";
import { getApiBase } from '../utils/api';

export const useUserStore = create((set, get) => ({
  customers: [],
  admins: [],
  drivers: [],
  loading: { CUSTOMER: false, ADMIN: false, DRIVER: false },
  loaded: { CUSTOMER: false, ADMIN: false, DRIVER: false },
  error: null,

  // Generic loader
  _fetch: async (tab, url) => {
    const { loading } = get();
    if (loading[tab]) return; // prevent duplicate
    set({ loading: { ...loading, [tab]: true }, error: null });
    try {
      const resp = await fetch(`${getApiBase()}${url}`);
      if (!resp.ok) throw new Error(`${tab} request failed`);
      const data = await resp.json();
      if (tab === 'CUSTOMER') set({ customers: data });
      if (tab === 'ADMIN') set({ admins: data });
      if (tab === 'DRIVER') set({ drivers: data });
      set((s) => ({ loaded: { ...s.loaded, [tab]: true } }));
    } catch (e) {
      console.error(e);
      set({ error: e.message });
    } finally {
      set((s) => ({ loading: { ...s.loading, [tab]: false } }));
    }
  },

  loadCustomers: () => get()._fetch('CUSTOMER', '/customers'),
  loadAdmins: () => get()._fetch('ADMIN', '/admins'),
  loadDrivers: () => get()._fetch('DRIVER', '/drivers'),

  getRowsForTab: (tab) => {
    const { customers, admins, drivers } = get();
    if (tab === 'CUSTOMER') return customers;
    if (tab === 'ADMIN') return admins;
    if (tab === 'DRIVER') return drivers;
    return [];
  },
}));
