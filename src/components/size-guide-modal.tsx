import { useState } from "react";
import { MessageCircleHeart, Ruler, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { WOMENS_SHOE_SIZE_GUIDE, WHATSAPP_NUMBER } from "@/lib/store";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";

const centimeter = (value: number) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function GuideContent() {
  return (
    <div className="space-y-6 text-left">
      <section aria-labelledby="guide-how-to">
        <h3 id="guide-how-to" className="mb-3 text-sm font-extrabold uppercase tracking-wide text-primary">
          Como medir o seu pé
        </h3>
        <ol className="grid gap-3 text-sm leading-relaxed text-foreground">
          <li className="flex gap-3">
            <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-primary">1</span>
            <span>Pise descalça sobre uma folha de papel encostada na parede.</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-primary">2</span>
            <span>Marque a ponta do seu dedo mais longo e meça com uma régua.</span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-black text-primary">3</span>
            <span>Adicione 0,5 cm de folga para bicos finos ou conforto extra.</span>
          </li>
        </ol>
      </section>

      <section aria-labelledby="guide-size-table">
        <h3 id="guide-size-table" className="mb-3 text-sm font-extrabold uppercase tracking-wide text-primary">
          Qual numeração escolher?
        </h3>
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <table className="w-full table-fixed text-left text-sm">
            <caption className="sr-only">Correspondência aproximada entre numeração brasileira e comprimento do pé</caption>
            <thead className="bg-secondary/60 text-primary">
              <tr>
                <th className="px-4 py-2.5 font-extrabold">Tamanho BR</th>
                <th className="px-4 py-2.5 font-extrabold">Comprimento do pé</th>
              </tr>
            </thead>
            <tbody>
              {WOMENS_SHOE_SIZE_GUIDE.map((row) => (
                <tr key={row.size} className="border-t border-border/60 even:bg-muted/40">
                  <th scope="row" className="px-4 py-2 font-bold">{row.size}</th>
                  <td className="px-4 py-2 tabular-nums">{centimeter(row.minCm)} a {centimeter(row.maxCm)} cm</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Esta é uma tabela de referência. A forma e as medidas podem variar entre modelos e fabricantes.
        </p>
      </section>

      <div className="rounded-2xl bg-secondary/70 p-4">
        <p className="flex items-center gap-2 text-sm font-black text-primary">
          <Sparkles className="h-4 w-4" aria-hidden="true" /> Uma dica com carinho
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          Pé mais largo ou peito do pé alto? Recomendamos escolher um número acima para calçados de bico fino ou conversar conosco no WhatsApp.
        </p>
        <a
          href={"https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent("Olá! Preciso de ajuda para escolher o tamanho de um calçado da Akause.")}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-primary underline underline-offset-4"
        >
          <MessageCircleHeart className="h-4 w-4" aria-hidden="true" /> Conversar com consultora
        </a>
      </div>
    </div>
  );
}

export function SizeGuideModal() {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-haspopup="dialog"
      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary underline decoration-accent underline-offset-4 transition hover:text-foreground"
    >
      <Ruler className="h-4 w-4 shrink-0" aria-hidden="true" />
      Dúvida no tamanho? Guia de medidas
    </button>
  );

  return (
    <>
      {trigger}
      {isMobile ? (
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent className="max-h-[92dvh] rounded-t-3xl">
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-fraunces text-2xl font-bold text-primary">Guia de medidas</DrawerTitle>
              <DrawerDescription>O par ideal começa com o tamanho certo.</DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto px-5 pb-8">
              <GuideContent />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto rounded-3xl p-6 sm:p-8">
            <DialogHeader className="text-left">
              <DialogTitle className="font-fraunces text-3xl font-bold text-primary">Guia de medidas</DialogTitle>
              <DialogDescription>O par ideal começa com o tamanho certo.</DialogDescription>
            </DialogHeader>
            <GuideContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
