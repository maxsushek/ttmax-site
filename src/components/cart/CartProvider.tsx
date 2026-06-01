"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/types";
import { trackEvent } from "@/lib/analytics/events";
import { CURRENCY, linesValue, toAnalyticsItems } from "@/lib/analytics/ecommerce";
import { siteConfig } from "@/config/site";

type CartState = { items: CartItem[]; hydrated: boolean };

type CartAction =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; product: Product }
  | { type: "remove"; productId: string }
  | { type: "changeQty"; productId: string; delta: number }
  | { type: "clear" };

const STORAGE_KEY = "ttmax_cart_v1";

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };
    case "add": {
      const existing = state.items.find((i) => i.id === action.product.id);
      const items = existing
        ? state.items.map((i) => (i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i))
        : [...state.items, { ...action.product, qty: 1 }];
      return { ...state, items };
    }
    case "remove":
      return { ...state, items: state.items.filter((i) => i.id !== action.productId) };
    case "changeQty":
      return {
        ...state,
        items: state.items
          .map((i) =>
            i.id === action.productId ? { ...i, qty: Math.max(1, i.qty + action.delta) } : i,
          )
          .filter((i) => i.qty > 0),
      };
    case "clear":
      return { ...state, items: [] };
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  freeShipProgress: number;
  freeShipRemaining: number;
  hasFreeShip: boolean;
  shippingFee: number;
  freeShippingThreshold: number;
  isOpen: boolean;
  justAddedId: string | null;
  open: () => void;
  close: () => void;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  changeQty: (productId: string, delta: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  children,
  freeShippingThreshold = siteConfig.freeShippingThreshold,
  shippingFee = 99,
}: {
  children: ReactNode;
  freeShippingThreshold?: number;
  shippingFee?: number;
}) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const [isOpen, setIsOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      if (Array.isArray(parsed)) {
        dispatch({ type: "hydrate", items: parsed as CartItem[] });
      } else {
        dispatch({ type: "hydrate", items: [] });
      }
    } catch {
      dispatch({ type: "hydrate", items: [] });
    }
  }, []);

  // Persist
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore quota errors
    }
  }, [state.items, state.hydrated]);

  // Поточні позиції для подій (view_cart / remove_from_cart) без stale-closure
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const count = useMemo(() => state.items.reduce((s, i) => s + i.qty, 0), [state.items]);
  const total = useMemo(() => state.items.reduce((s, i) => s + i.price * i.qty, 0), [state.items]);
  const threshold = freeShippingThreshold;
  const hasFreeShip = total >= threshold;
  const freeShipProgress = Math.min(100, (total / threshold) * 100);
  const freeShipRemaining = Math.max(0, threshold - total);

  const open = useCallback(() => {
    setIsOpen(true);
    trackEvent({
      name: "view_cart",
      params: {
        currency: CURRENCY,
        value: linesValue(itemsRef.current),
        items: toAnalyticsItems(itemsRef.current),
      },
    });
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const add = useCallback((product: Product) => {
    dispatch({ type: "add", product });
    setJustAddedId(product.id);
    setIsOpen(true);
    trackEvent({
      name: "add_to_cart",
      params: {
        currency: CURRENCY,
        value: product.price,
        items: [
          {
            id: product.id,
            name: product.model,
            brand: product.brand,
            price: product.price,
            quantity: 1,
          },
        ],
      },
    });
    window.setTimeout(() => setJustAddedId(null), 1200);
  }, []);

  const remove = useCallback((productId: string) => {
    const item = itemsRef.current.find((i) => i.id === productId);
    trackEvent({
      name: "remove_from_cart",
      params: {
        currency: CURRENCY,
        value: item ? item.price * item.qty : 0,
        items: item ? toAnalyticsItems([item]) : [],
      },
    });
    dispatch({ type: "remove", productId });
  }, []);

  const changeQty = useCallback((productId: string, delta: number) => {
    dispatch({ type: "changeQty", productId, delta });
  }, []);

  const clear = useCallback(() => dispatch({ type: "clear" }), []);

  const value: CartContextValue = {
    items: state.items,
    count,
    total,
    freeShipProgress,
    freeShipRemaining,
    hasFreeShip,
    shippingFee,
    freeShippingThreshold: threshold,
    isOpen,
    justAddedId,
    open,
    close,
    add,
    remove,
    changeQty,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
