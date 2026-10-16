# Vault tighten-up plan

Goal: Unify format, fix typos/frontmatter, reduce paste-duplication — without adding much new lore. Hubs keep short self-contained blurbs; deep pages hold detail.

## Acceptance criteria

1. God notes share one frontmatter + section shape (`aliases`, `tags`, `publish`; optional `## Domain` / short role line).
2. `publish` is boolean `true`/`false` (not quoted) where set; `alis:` typo fixed.
3. Spelling/typos fixed in World Overview, Divine Calamity, Heroic Age, Entrophea, Ophym, README/index as needed.
4. Divine Calamity is the deep war page; World Overview + Light/Void hubs have short blurbs (enough context without requiring a click) that link deeper — not copy-pasted paragraphs.
5. Repeated “One of Gods of the Light” lines removed from individual gods where the hub already lists them (spouse/role can stay).
6. Sumenadine naming consistent (Commerce in title/aliases; War only if intentional secondary alias).
7. Empty published stubs either get one honest line or `publish: false` (no new lore dumps).
8. No new major lore invented; placeholders like WORLD NAME / festival left as clear TODOs or lightly renamed only if already decided.

## Phase 1 — Frontmatter + typos

- Normalize frontmatter on all god notes + hubs + history notes.
- Fix typos listed in the audit (World Overview, Calamity, Heroic Age, Entrophea, Ophym, etc.).
- Fix `alis:` → `aliases` on Gods of the Light.
- Align Sumenadine aliases with Commerce-first naming.

## Phase 2 — God note template

- Apply consistent shape to Arecenia, Axiom, Ophym, Sumenadine, Entrophea, Etoile, Amonium, Void Mother, Entrophea.
- Strip redundant faction membership lines from individual Light gods.
- Keep DM `%%` blocks.

## Phase 3 — Layered blurbs (not single-source-only)

- Divine Calamity: full-ish war telling (cleaned).
- World Overview TLDR: short self-contained summary + link to Calamity.
- Gods of the Light / Void: short faction blurb + member list + link to Calamity.
- Arecenia / Void Mother: one-line role, not a second war essay.

## Phase 4 — Publish hygiene (minimal)

- Empty or near-empty published notes: one line or unpublish.
- Index: remove empty Getting Started if still empty; keep quick links.
- README: don’t conflict with index (point at wiki home or leave unpublished).

## Out of scope

- Filling WORLD NAME, festival name, Wilds, Divine Inspiration lore.
- Quartz/site tooling changes.
- New gods or plot.
