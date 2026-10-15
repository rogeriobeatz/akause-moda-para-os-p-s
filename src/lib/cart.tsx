import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { WHATSAPP_NUMBER, brl } from "./store";

export type CartItem = {
  reference: string;
  name: string;
  color: string;
  size: string;
  price: number;
  photo: string;
  qty: number;
  max: number;
};

type Ctx = {
  items: CartItem[];
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (i: CartItem) => void;
  update: (ref: string, size: string, qty: number) => void;
  remove: (ref: string, size: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "akause-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);
  const save = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const value: Ctx = {
    items,
    open,
    setOpen,
    add: (i) => {
      const ex = items.find((x) => x.reference === i.reference && x.size === i.size);
      save(
        ex
          ? items.map((x) => (x === ex ? { ...x, qty: Math.min(x.max, x.qty + i.qty) } : x))
          : [...items, i],
      );
      setOpen(true);
    },
    update: (ref, size, qty) =>
      save(items.map((x) => (x.reference === ref && x.size === size ? { ...x, qty: Math.max(1, Math.min(x.max, qty)) } : x))),
    remove: (ref, size) => save(items.filter((x) => !(x.reference === ref && x.size === size))),
    clear: () => save([]),
    total: items.reduce((a, x) => a + x.price * x.qty, 0),
    count: items.reduce((a, x) => a + x.qty, 0),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside provider");
  return c;
}

export function whatsappLink(items: CartItem[], total: number, customer: { name: string; city: string; note: string }) {
  const lines = [
    `Olá, Akause! Quero fazer um pedido:`,
    ``,
    ...items.map(
      (i) => `• ${i.qty}x ${i.name}${i.color ? ` (${i.color})` : ""} — Tam. ${i.size} — Ref. ${i.reference} — ${brl(i.price * i.qty)}`,
    ),
    ``,
    `*Total: ${brl(total)}*`,
    ``,
    `Nome: ${customer.name}`,
    customer.city && `Cidade/CEP: ${customer.city}`,
    customer.note && `Observação: ${customer.note}`,
  ].filter((l) => l !== false && l !== undefined) as string[];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
