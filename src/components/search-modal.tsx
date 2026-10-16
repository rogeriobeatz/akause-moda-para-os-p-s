import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, X } from "lucide-react";
import { searchProducts } from "@/lib/products.functions";
import { brl, priceOf } from "@/lib/store";
import { sanitizeSearchInput } from "@/lib/search";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

const DEBOUNCE_MS = 300;
const PREVIEW_LIMIT = 6;

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const term = sanitizeSearchInput(value);
  const shouldSearch = open && debounced.length >= 2;
  const { data: matches = [], isFetching, isError } = useQuery({
    queryKey: ["search-preview", debounced],
    queryFn: () => searchProducts({ data: { query: debounced, limit: PREVIEW_LIMIT } }),
    enabled: shouldSearch,
    staleTime: 60_000,
  });
  // Não mostrar resultados anteriores enquanto a pessoa digita outro termo.
  const showPreview = shouldSearch && term === debounced;
  const previews = showPreview ? matches : [];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(sanitizeSearchInput(value));
      setActiveIndex(-1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open, isMobile]);

  useEffect(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, [location.href]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      const typing = target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (!typing) {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open || isMobile) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !desktopRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, isMobile]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const goToResults = (event?: FormEvent) => {
    event?.preventDefault();
    if (!term) return;
    close();
    void navigate({ to: "/busca", search: { q: term } });
  };

  const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" && previews.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % previews.length);
    } else if (event.key === "ArrowUp" && previews.length > 0) {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? previews.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0 && previews[activeIndex]) {
      event.preventDefault();
      const selected = previews[activeIndex];
      close();
      void navigate({ to: "/produto/$ref", params: { ref: selected.reference } });
    }
  };

  const searchContent = (
    <div className="space-y-3">
      <form onSubmit={goToResults} role="search" aria-label="Buscar no catálogo Akause">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
          <Search className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={value}
            onChange={(event) => { setValue(event.target.value); setActiveIndex(-1); }}
            onKeyDown={onInputKeyDown}
            placeholder="Modelo, cor ou referência..."
            aria-label="Buscar calçados"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open && previews.length > 0}
            aria-controls={id + "-options"}
            aria-activedescendant={activeIndex >= 0 && previews[activeIndex] ? id + "-option-" + activeIndex : undefined}
            autoComplete="off"
            maxLength={80}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {value && (
            <button
              type="button"
              onClick={() => { setValue(""); setDebounced(""); setActiveIndex(-1); inputRef.current?.focus(); }}
              aria-label="Limpar busca"
              className="rounded-full p-2 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={!term}
            aria-label="Ver resultados da busca"
            className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>

      {term.length === 0 ? (
        <p className="px-2 pb-2 text-xs text-muted-foreground">Experimente “scarpin”, “nude” ou um código. Atalho: /</p>
      ) : term.length < 2 ? (
        <p className="px-2 pb-2 text-xs text-muted-foreground">Digite pelo menos 2 caracteres para ver sugestões.</p>
      ) : (
        <div aria-live="polite" className="max-h-[min(62dvh,29rem)] overflow-y-auto">
          {(isFetching || !showPreview) && <p className="px-2 py-4 text-sm text-muted-foreground">Buscando os melhores pares...</p>}
          {isError && <p className="px-2 py-4 text-sm text-destructive">Não foi possível buscar agora. Tente novamente.</p>}
          {showPreview && !isFetching && !isError && previews.length === 0 && (
            <p className="px-2 py-4 text-sm text-muted-foreground">Nenhum resultado rápido. Veja a busca completa abaixo.</p>
          )}
          {showPreview && previews.length > 0 && (
            <div id={id + "-options"} role="listbox" aria-label="Sugestões de produtos" className="divide-y divide-border/60">
              {previews.map((product, index) => (
                <Link
                  key={product.reference}
                  id={id + "-option-" + index}
                  to="/produto/$ref"
                  params={{ ref: product.reference }}
                  role="option"
                  aria-selected={activeIndex === index}
                  onClick={close}
                  className={
                    "flex items-center gap-3 rounded-xl p-2 transition hover:bg-secondary/40 " +
                    (activeIndex === index ? "bg-secondary/50" : "")
                  }
                >
                  <img
                    src={product.photos[0]}
                    alt=""
                    loading="lazy"
                    className="h-16 w-14 shrink-0 rounded-lg bg-white object-contain p-1"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold">{product.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {product.color} · Ref. {product.reference}
                    </span>
                    <span className="mt-1 block text-sm font-black text-primary">{brl(priceOf(product.cost_price))}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                </Link>
              ))}
            </div>
          )}
          <Link
            to="/busca"
            search={{ q: term }}
            onClick={close}
            className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-secondary/50 px-4 py-3 text-xs font-extrabold uppercase tracking-wide text-primary transition hover:bg-secondary"
          >
            Ver todos os resultados para “{term}” <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <>
          <button
            type="button"
            aria-label="Buscar produtos"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:bg-secondary"
          >
            <Search className="h-5 w-5" />
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="top" className="max-h-[92dvh] overflow-y-auto rounded-b-3xl px-5 pb-5 pt-8">
              <SheetHeader className="mb-4 text-left">
                <SheetTitle className="font-fraunces text-2xl text-primary">Encontre seu próximo par</SheetTitle>
                <SheetDescription>Busque por modelo, cor, estilo ou referência.</SheetDescription>
              </SheetHeader>
              {searchContent}
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <div ref={desktopRef} className="relative">
          <button
            type="button"
            aria-label="Buscar produtos"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-primary transition hover:bg-secondary"
          >
            <Search className="h-5 w-5" />
          </button>
          {open && (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[min(29rem,calc(100vw-2rem))] rounded-3xl border border-border bg-background p-4 shadow-2xl">
              <p className="mb-3 px-1 font-fraunces text-xl font-bold text-primary">O que vamos encontrar hoje?</p>
              {searchContent}
            </div>
          )}
        </div>
      )}
    </>
  );
}
