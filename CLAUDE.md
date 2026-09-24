# CLAUDE.md (Lumenook theme repo)
Project: Lumenook - premium lighting & desk-objects store for the UAE, built on the
Shopify Dwell theme (Horizon family, theme blocks architecture).
Full spec: docs/LUMENOOK_BRIEF.pdf - read the relevant section before every task.

Rules:
- Work only on the unpublished theme "Lumenook - Dev". Never publish.
- Run `shopify theme dev` for preview; run `shopify theme check` before every commit.
- Prefer theme settings, JSON templates and new blocks over editing core Dwell files.
- New files: prefix with `lumenook-` (blocks/lumenook-spec-table.liquid, etc.).
- All colors/fonts come from CSS variables in assets/lumenook.css (Section 5).
- Every string visible to shoppers goes through locales/en.default.json + ar.json.
- Must work in RTL (Arabic). Use logical CSS (margin-inline-start, not margin-left).
- No external JS libraries; vanilla JS web components only. No jQuery.
- Keep Lighthouse mobile performance >= 80 and accessibility >= 95.
- Small commits with clear messages, one feature per commit.
