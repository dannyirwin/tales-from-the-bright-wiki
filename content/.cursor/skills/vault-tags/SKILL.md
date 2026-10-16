---
name: vault-tags
description: >-
  Audit and apply Obsidian frontmatter tags/properties across this vault.
  Enforces singular Title Case kinds (Place, Event, Concept, God, Faction, NPC,
  Player, Setting), prunes unused properties, and keeps faction on gods only.
  Use when the user asks to tag notes, audit tags, fix frontmatter, normalize
  pluralization/capitalization, or prune mistyped properties.
---

# Vault tags

Canonical rules live in [taxonomy.md](taxonomy.md). Read that file before changing notes.

## When to run

- User asks to audit/apply tags, fix frontmatter, or normalize casing/plurals
- After adding a batch of notes
- Before a wiki sync if tag pages look messy

## Workflow

Copy and track:

```
Tag audit:
- [ ] 1. Inventory current tags + properties
- [ ] 2. Diff against taxonomy.md
- [ ] 3. Apply renames / adds / property pruning
- [ ] 4. Spot-check Bases filters still work
- [ ] 5. Report summary to user
```

### 1. Inventory

Scan `**/*.md` excluding `.obsidian/`, `.cursor/`, `Excalidraw/`.

Collect:

- Every unique `tags:` value
- Every frontmatter key and count
- Notes missing a kind tag or with multiple kind tags

### 2. Diff

For each note:

1. Infer kind from folder (see taxonomy) + content if folder is ambiguous
2. Map old tags → allowed tags (see **Migrations** below)
3. Flag unknown tags / extra properties for removal
4. Ensure gods have `faction:` and **no** Light/Void/Neutral tags

### 3. Apply

Edit frontmatter only (preserve body). Rules:

- Only properties listed in taxonomy.md
- Only allowed tags; singular Title Case
- Sort tags alphabetically
- Keep existing correct aliases / publish / faction
- Do not invent aliases unless renaming a note

### 4. Bases spot-check

After changes, confirm pantheon Bases still match:

- Light gods: `file.hasTag("God")` and `faction == "Light"`
- Void gods: same with `"Void"`

If you rename `God` → something else, update Bases in the same pass.

### 5. Report

Tell the user:

- Tag renames / removals (old → new)
- Properties removed
- Notes that still need a human decision
- Do **not** commit unless asked

## Migrations (current vault → taxonomy)

| Old | New |
|-----|-----|
| `place` | `Place` |
| `city-state` | drop (Arecene is a region; use `Place` only) |
| `Concept` | keep |
| `Setting` | keep |
| `God` | keep |
| `PC` | `Player` |
| `Light` / `Void` / `Neutral` as tags | remove; keep `faction:` property on gods |

Add if missing:

| Path pattern | Tag |
|--------------|-----|
| `Locations/*` | `Place` |
| `Events/*` | `Event` |
| `Lore/World Overview.md` | `Setting` |
| other `Lore/*` | `Concept` |
| `Factions/*` | `Faction` |
| `People/Gods/*` | `God` |
| `People/PCs/*` | `Player` |

## Do not

- Add plural tags (`Places`, `Events`, `Gods`)
- Put faction membership in tags when `faction:` exists
- Create new property keys without updating taxonomy.md first
- Rewrite note bodies while tagging
