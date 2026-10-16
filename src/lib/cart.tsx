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
  add: (i: CartItem, options?: { openCart?: boolean }) => void;
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
      if (s) {
        const parsed: unknown = JSON.parse(s);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((item): item is CartItem =>
            item !== null && typeof item === "object" &&
            typeof item.reference === "string" && typeof item.name === "string" &&
            typeof item.size === "string" && typeof item.price === "number" &&
            Number.isFinite(item.price) && item.price >= 0 &&
            typeof item.qty === "number" && Number.isInteger(item.qty) && item.qty > 0 &&
            typeof item.max === "number" && Number.isInteger(item.max) && item.max > 0 &&
            item.qty <= item.max && typeof item.photo === "string" &&
            typeof item.color === "string"
          ));
        }
      }
    } catch {}
  }, []);
  const save = (next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // A sacola continua funcionando mesmo com armazenamento indisponível.
    }
  };

  const value: Ctx = {
    items,
    open,
    setOpen,
    add: (i, options) => {
      if (!Number.isFinite(i.price) || i.price < 0 || !Number.isInteger(i.max) || i.max < 1) return;
      const ex = items.find((x) => x.reference === i.reference && x.size === i.size);
      save(
        ex
          ? items.map((x) => (x === ex ? { ...x, qty: Math.min(x.max, x.qty + i.qty) } : x))
          : [...items, { ...i, qty: Math.max(1, Math.min(i.max, i.qty)) }],
      );
      if (options?.openCart !== false) setOpen(true);
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
  ].filter((l): l is string => typeof l === "string");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
