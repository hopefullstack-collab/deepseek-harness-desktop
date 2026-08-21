# Company Store endpoint swap (desktop)

Built-in constants live in `src/adapters/company-store.ts`:

- `COMPANY_STORE_ENDPOINT` — full plugins list URL
- `COMPANY_STORE_HOSTNAME` — host allow-list for the restricted HTTP client
- `COMPANY_STORE_LOCAL_DEV` — `true` only when the local-dev env override is set

Also wired through `src/catalog/built-in-providers.ts` and
`src/host/company-store-http.ts`.

## Current placeholder (committed)

```text
COMPANY_STORE_ENDPOINT = https://plugins.company.example/api/v1/plugins
COMPANY_STORE_HOSTNAME = plugins.company.example
COMPANY_STORE_LOCAL_DEV = false   # when env unset
```

Do **not** change these committed defaults to a `*.trycloudflare.com` quick-tunnel
URL or to `http://127.0.0.1`. Ephemeral / loopback hosts must not ship as the
production built-in pin.

## Local development override (dev-only — not M1)

For local Market e2e against Store `wrangler dev --local` on `:8787`, set an
**environment variable on the Market host process** (do not edit and commit
constants):

```bash
# Store (separate terminal)
npm run smoke:company-plugins-api
# or: npx wrangler dev --local --port 8787  (from apps/web after build)

# Desktop / Market host
export DSH_COMPANY_STORE_LOCAL_ENDPOINT=1
# equivalent explicit URL:
# export DSH_COMPANY_STORE_LOCAL_ENDPOINT=http://127.0.0.1:8787/api/v1/plugins
```

Effects when set:

- `COMPANY_STORE_ENDPOINT` → `http://127.0.0.1:8787/api/v1/plugins` (or your URL)
- `COMPANY_STORE_HOSTNAME` → `127.0.0.1`
- HTTP client switches to a **loopback-only** plain-HTTP path (restricted HTTPS
  client still blocks loopback in the default path)

Rules:

| Rule | Required |
| --- | --- |
| Env unset | Placeholder HTTPS (production default) |
| Allowed URL | `http://127.0.0.1` only (`1` / `true` → default `:8787`) |
| Built-in selection | Still **not** default / not preferred / not fallback |
| Commit | Never commit localhost into `company-store.ts` constants |
| M1 gate | Localhost does **not** complete durable public HTTPS |

Unset the env for normal runs. Store-side laptop deploy + HTTPS verify:
`awesome-deepseek-harness-plugins` → `docs/company-fork-deploy.md` § Local-first.

## When to swap (production pin)

Swap committed constants only after a **durable** public HTTPS origin exists:

1. Company Cloudflare Worker on a real apex (preferred), **or**
2. A stable `https://company-store.<account>.workers.dev` Worker kept as the
   interim Market origin until DNS is ready.

Store-side checklist + secrets-gated deploy (sibling repo):
`hopefullstack-collab/awesome-deepseek-harness-plugins` →
`docs/company-fork-deploy.md` and `.github/workflows/company-fork-deploy.yml`.

## Swap steps

1. Confirm anonymous Market GET against the durable origin:

   ```bash
   curl -sS https://<apex>/api/v1/health
   curl -sS 'https://<apex>/api/v1/plugins?limit=1' | jq 'keys, (.packages|length), .meta'
   ```

2. Edit `src/adapters/company-store.ts` placeholder constants (or the values
   returned when `DSH_COMPANY_STORE_LOCAL_ENDPOINT` is unset):

   ```ts
   export const COMPANY_STORE_PLACEHOLDER_ENDPOINT = 'https://<apex>/api/v1/plugins'
   export const COMPANY_STORE_PLACEHOLDER_HOSTNAME = '<apex-host>'
   ```

3. Refresh README / market-shell placeholder mentions (edit templates used by
   `apply-company-store-docs.mjs`, or patch the generated paragraphs).

4. Re-run:

   ```bash
   node ./assemble-default-service.mjs
   node ./apply-company-store-wiring.mjs
   node ./apply-company-store-docs.mjs
   yarn vitest run
   ```

5. Do **not** retarget official `dsh-1024store` constants.

## CI note (this fork)

GitHub Actions lists workflow `CI` as `active`, but the Actions API still shows
**0 workflow runs** and `workflow_dispatch` / permissions APIs return **403** for
this integration. Only Cursor Bugbot / Approval Agent check-suite jobs appear on
PR #19.

**Owner must enable Actions** — step-by-step:
[`company-store-ci-note.md`](./company-store-ci-note.md).

Until a green `CI` run appears, local `yarn vitest run` after assemble/wiring/docs
is the automated evidence for this PR.
