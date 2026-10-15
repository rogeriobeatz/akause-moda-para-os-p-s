// Parses the supplier's daily XML feed (xmldrop) without DOM APIs (Worker-safe).
export type FeedProduct = {
  reference: string;
  name: string;
  category: string;
  cost_price: number;
  on_sale: boolean;
  brand: string;
  description: string;
  color: string;
  group_code: string;
  photos: string[];
  stock: { size: string; qty: number }[];
  total_stock: number;
  registered_at: string | null;
};

function text(block: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  if (!m) return "";
  return decode(m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim());
}

function decode(s: string) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function parseFeed(xml: string): FeedProduct[] {
  const out: FeedProduct[] = [];
  const blocks = xml.match(/<produto\b[\s\S]*?<\/produto>/gi) ?? [];
  for (const b of blocks) {
    const reference = text(b, "referencia");
    if (!reference) continue;
    const photos = (b.match(/<fotos\b[\s\S]*?<\/fotos>/gi) ?? [])
      .map((f) => text(f, "url_foto"))
      .filter(Boolean);
    const stock = (b.match(/<estoque\b[\s\S]*?<\/estoque>/gi) ?? [])
      .map((e) => ({ size: text(e, "tamanho"), qty: parseInt(text(e, "quantidade"), 10) || 0 }))
      .filter((s) => s.size);
    const date = text(b, "data_cadastro");
    const dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);
    out.push({
      reference,
      name: text(b, "nome"),
      category: text(b, "categoria"),
      cost_price: parseFloat(text(b, "valor_dropshipping")) || 0,
      on_sale: text(b, "status_promocao") === "1",
      brand: text(b, "marca"),
      description: text(b, "descricao"),
      color: text(b, "cor"),
      group_code: text(b, "grupo"),
      photos,
      stock,
      total_stock: stock.reduce((a, s) => a + s.qty, 0),
      registered_at: dm ? `${dm[3]}-${dm[2]}-${dm[1]}` : null,
    });
  }
  return out;
}
