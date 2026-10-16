---
aliases:
  - Gods
  - Bright
  - Gods of the Light
tags:
  - Faction
publish: true
---

The pantheon known as The Bright, or the Gods of the Light, were victorious in the [[Divine Calamity - The War of the Gods]]. The ruler of all, the [[Arecenia - The Bright Mother|Bright Mother]] and her 4 remaining children Gods uphold the [[Divine Calamity - The War of the Gods|Decennial Pact]], a promise never let the whims of gods make ruin of the [[Mundane Plane|Mundane World]] again. They decent only once a decade at the [[Stonewake Festival]] to re-embue the world with their divinity. The gods no longer are able to act on the world directly, they rely solely on the magics the grant their worshippers to enact their will. 

```base
filters:
  and:
    - file.hasTag("God")
    - faction == "Light"
views:
  - type: table
    name: Light
    order:
      - file.name
    sort:
      - property: faction
        direction: DESC

```

[[Entrophea - God of Death]] is not of the Light, nor the void, but she still walks free in the world.

Defeated the [[The Void]]
