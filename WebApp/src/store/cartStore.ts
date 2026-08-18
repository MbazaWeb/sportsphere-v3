import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  title: string;
  image?: string | null;
  price: number;
  qty: number;
  sellerId: string;
  sellerName: string;
};

type CartState = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (item: Omit<CartItem, 'qty'>) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      setOpen: (open) => set({ open }),
      add: (item) => {
        const items = [...get().items];
        const i = items.findIndex((x) => x.id === item.id);
        if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + 1 };
        else items.push({ ...item, qty: 1 });
        set({ items, open: true });
      },
      remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, x) => s + x.price * x.qty, 0),
    }),
    { name: 'ss-cart' },
  ),
);
