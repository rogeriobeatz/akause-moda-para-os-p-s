import { useState } from "react";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart, whatsappLink } from "@/lib/cart";
import { brl } from "@/lib/store";

export function CartDrawer() {
  const { items, open, setOpen, update, remove, total } = useCart();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [note, setNote] = useState("");
  if (!open) return null;

  const canSend = items.length > 0 && name.trim().length > 1;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-2xl text-primary">Sua sacola</h2>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {items.length === 0 && <p className="text-muted-foreground">Sua sacola está vazia.</p>}
          {items.map((i) => (
            <div key={i.reference + i.size} className="flex gap-3">
              <img src={i.photo} alt={i.name} className="h-24 w-20 rounded-xl object-cover" />
              <div className="flex-1 text-sm">
                <p className="font-medium">{i.name}</p>
                <p className="text-muted-foreground">
                  {i.color} · Tam. {i.size}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button className="rounded-full border p-1" onClick={() => update(i.reference, i.size, i.qty - 1)} aria-label="Menos">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-5 text-center">{i.qty}</span>
                  <button className="rounded-full border p-1" onClick={() => update(i.reference, i.size, i.qty + 1)} aria-label="Mais">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => remove(i.reference, i.size)} aria-label="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold">{brl(i.price * i.qty)}</p>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="space-y-3 border-t border-border p-5">
            <input className="w-full rounded-full border border-input bg-card px-4 py-2.5 text-sm" placeholder="Seu nome *" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            <input className="w-full rounded-full border border-input bg-card px-4 py-2.5 text-sm" placeholder="Cidade ou CEP" value={city} onChange={(e) => setCity(e.target.value)} maxLength={80} />
            <input className="w-full rounded-full border border-input bg-card px-4 py-2.5 text-sm" placeholder="Observação (opcional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
            <div className="flex justify-between pt-1 text-lg">
              <span>Total</span>
              <span className="font-semibold">{brl(total)}</span>
            </div>
            <a
              href={canSend ? whatsappLink(items, total, { name, city, note }) : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!canSend}
              className={`block rounded-full py-3.5 text-center font-semibold transition ${canSend ? "bg-primary text-primary-foreground hover:bg-primary/90" : "pointer-events-none bg-muted text-muted-foreground"}`}
            >
              Finalizar pedido no WhatsApp
            </a>
            <p className="text-center text-xs text-muted-foreground">Frete e pagamento combinados no WhatsApp.</p>
          </div>
        )}
      </aside>
    </div>
  );
}
