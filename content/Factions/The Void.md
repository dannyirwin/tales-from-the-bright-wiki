---
aliases:
  - Void
tags:
  - Faction
publish: true
---

The Void were the fallen pantheon in [[Divine Calamity - The War of the Gods]]. Their defeat ushered in the modern age.

References to the fallen gods and their leader the [[Void Mother]] are considered taboo at best and blasphemy at worst. Useful perhaps only for the occasion off color curse, polite society does not linger on the dead gods.

[[Entrophea - God of Death]] stood neutral in the conflict.

%% DM: individual Void gods stay unpublished. Vault list:
```base
filters:
  and:
    - file.hasTag("God")
    - faction == "Void"
views:
  - type: table
    name: Void
    order:
      - file.name
    sort:
      - property: faction
        direction: ASC

```
%%
