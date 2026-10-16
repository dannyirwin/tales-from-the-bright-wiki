# Vault tag & property taxonomy

## Allowed properties (only these)

| Property | Where | Notes |
|----------|--------|--------|
| `aliases` | any | list of alternate titles / search names |
| `tags` | any | only values from **Allowed tags** below |
| `publish` | any | boolean `true` / `false` (never quoted) |
| `faction` | gods only | `Light` \| `Void` \| `Neutral` (not a tag) |
| `title` | wiki home only | optional page title override |

**Remove** any other frontmatter keys (typos, experiments, unused fields).

Do **not** duplicate `faction` as tags (`Light` / `Void` / `Neutral`). Bases filter on `faction`; type identity uses `God`.

---

## Allowed tags (singular, Title Case)

### Kind (pick one primary)

| Tag | Use for |
|-----|---------|
| `Place` | Locations: regions, mountains, cities, wilds |
| `Event` | Named happenings / ages in `Events/` (wars, festivals, eras) |
| `Concept` | Abstract lore: artifacts, inspiration, champions, terms |
| `God` | Individual deities in `People/Gods/` |
| `Faction` | Groups/pantheons in `Factions/` |
| `NPC` | Named non-player characters (when you add them) |
| `Player` | Player characters in `People/PCs/` |
| `Setting` | Broad setting overviews (e.g. World Overview) |

### Optional secondary (sparingly)

| Tag | Use for |
|-----|---------|
| `Session` | Session notes / templates under `Sessions/` |

**Do not use:** plurals (`Places`, `Events`, `Gods`), lowercase kinds (`place`, `event`), or mistypes (`city-state` unless you later add a deliberate subtype list).

---

## Folder → default kind

| Folder | Default tag |
|--------|-------------|
| `Locations/` | `Place` |
| `Events/` | `Event` |
| `Lore/` | `Concept` (or `Setting` for World Overview) |
| `People/Gods/` | `God` (+ `faction` property) |
| `Factions/` | `Faction` |
| `People/PCs/` | `Player` |
| `Sessions/` | `Session` |

---

## Publish defaults

- `publish: true` for common-knowledge lore (places, events, Light gods, concepts, factions-as-history).
- `publish: false` for Void gods, PC private notes, DM-only stubs.

---

## Formatting rules

1. Tags: singular **Title Case** (`Place`, not `places` / `place`).
2. Tag lists: YAML list under `tags:`, one `- Tag` per line, sorted alphabetically.
3. `publish:` unquoted boolean.
4. `faction:` only on `God` notes; Title Case values `Light` \| `Void` \| `Neutral`.
5. No empty `tags:` blocks; omit `tags` only if the note is intentionally untyped (rare; prefer a kind tag).
