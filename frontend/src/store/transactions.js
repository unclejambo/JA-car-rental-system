import { create } from 'zustand';
import { getApiBase } from '../utils/api';

export const useTransactionStore = create((set, get) => ({
  transactions: [],
  payments: [],
  refunds: [],
  loading: { TRANSACTIONS: false, PAYMENT: false, REFUND: false },
  loaded: { TRANSACTIONS: false, PAYMENT: false, REFUND: false },
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
      if (tab === 'TRANSACTIONS') set({ transactions: data });
      if (tab === 'PAYMENT') set({ payments: data });
      if (tab === 'REFUND') set({ refunds: data });
      set((s) => ({ loaded: { ...s.loaded, [tab]: true } }));
    } catch (e) {
      console.error(e);
      set({ error: e.message });
    } finally {
      set((s) => ({ loading: { ...s.loading, [tab]: false } }));
    }
  },

  loadTransactions: () => get()._fetch('TRANSACTIONS', '/transactions'),
  loadPayments: () => get()._fetch('PAYMENT', '/payments'),
  loadRefunds: () => get()._fetch('REFUND', '/refunds'),

  getRowsForTab: (tab) => {
    const { transactions, payments, refunds } = get();
    switch (tab) {
      case 'PAYMENT':
        return payments;
      case 'REFUND':
        return refunds;
      case 'TRANSACTIONS':
      default:
        return transactions;
    }
  },
}));
