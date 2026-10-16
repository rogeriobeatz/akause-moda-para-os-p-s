<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Catalog lives in the `products` table, refreshed only by the daily scheduled route `/api/public/jobs/sync-stock` (parses supplier XML server-side); why: supplier allows one fetch/day and the token must stay server-only.
- Sale prices are computed from `cost_price` via `priceOf` in `src/lib/store.ts`, never stored; why: changing the margin updates the whole store instantly.
