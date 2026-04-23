import { create } from 'zustand';

const usePosStore = create((set) => ({
  cart: [],
  search: "",
  category: "Todas",
  // paymentBreakdown: [{ method: "Efectivo"|"Tarjeta"|"Transferencia", amount: number }]
  paymentBreakdown: [],
  selectedClient: null,
  clientSearchText: "",

  setCart: (cartOrUpdater) => set((state) => ({ 
      cart: typeof cartOrUpdater === 'function' ? cartOrUpdater(state.cart) : cartOrUpdater 
  })),
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),

  addPayment: (method, amount) => set((state) => ({
    paymentBreakdown: [...state.paymentBreakdown, { method, amount }]
  })),
  updatePayment: (index, method, amount) => set((state) => {
    const updated = [...state.paymentBreakdown];
    updated[index] = { method, amount };
    return { paymentBreakdown: updated };
  }),
  removePayment: (index) => set((state) => ({
    paymentBreakdown: state.paymentBreakdown.filter((_, i) => i !== index)
  })),
  clearPayments: () => set({ paymentBreakdown: [] }),

  setSelectedClient: (selectedClient) => set({ selectedClient }),
  setClientSearchText: (clientSearchText) => set({ clientSearchText }),
  
  clearPos: () => set({
    cart: [],
    search: "",
    category: "Todas",
    paymentBreakdown: [],
    selectedClient: null,
    clientSearchText: ""
  })
}));

export default usePosStore;
