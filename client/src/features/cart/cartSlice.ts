import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// ---- Types ----
export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  sku: string;
  imageUrl: string | null;
  finish: string | null;
  size: string | null;
  unitPrice: number;  // selling or sale price
  mrp: number;
  gstRate: number;    // e.g. 18
  quantity: number;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
}

// ---- localStorage persistence ----
const STORAGE_KEY = 'abpatel_cart';

function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ---- Initial state ----
const initialState: CartState = {
  items: loadCartFromStorage(),
  isDrawerOpen: false,
};

// ---- Slice ----
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<CartItem>) {
      const incoming = action.payload;
      const existing = state.items.find(
        (i) => i.productId === incoming.productId && i.variantId === incoming.variantId
      );

      if (existing) {
        existing.quantity = Math.min(existing.quantity + incoming.quantity, existing.maxStock);
      } else {
        state.items.push({ ...incoming });
      }
      saveCartToStorage(state.items);
    },

    removeFromCart(state, action: PayloadAction<{ productId: string; variantId: string }>) {
      state.items = state.items.filter(
        (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
      );
      saveCartToStorage(state.items);
    },

    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; variantId: string; quantity: number }>
    ) {
      const item = state.items.find(
        (i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId
      );
      if (item) {
        item.quantity = Math.max(1, Math.min(action.payload.quantity, item.maxStock));
      }
      saveCartToStorage(state.items);
    },

    clearCart(state) {
      state.items = [];
      saveCartToStorage(state.items);
    },

    openCartDrawer(state) {
      state.isDrawerOpen = true;
    },

    closeCartDrawer(state) {
      state.isDrawerOpen = false;
    },

    toggleCartDrawer(state) {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
  },
});

// ---- Selectors ----
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.quantity, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
export const selectCartGst = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, i) => {
    const lineTotal = i.unitPrice * i.quantity;
    // Price is inclusive of GST, extract the GST component
    const gstComponent = lineTotal - lineTotal / (1 + i.gstRate / 100);
    return sum + gstComponent;
  }, 0);
export const selectIsDrawerOpen = (state: { cart: CartState }) => state.cart.isDrawerOpen;

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCartDrawer,
  closeCartDrawer,
  toggleCartDrawer,
} = cartSlice.actions;

export default cartSlice.reducer;
