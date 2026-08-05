# Greenhollow — Homestead Land Planner

A single-file farm management game. Open `greenhollow-homestead.html` in any
browser — no server, no build step, no external requests.

## Playing
Build on the land, plant and water beds, keep animals fed and their pens clean,
craft raw produce into higher-value goods, fill village orders, and automate the
whole thing once you can afford a control hub.

Controls: `R` rotate · `U` upgrade selected · `W` water all beds · `M` mute ·
`Space` pause · `1`/`2` speed · `Esc` cancel · `Del` remove · `H` help

## Source layout
The game is assembled from parts in `src/` so it stays editable:

| file | contents |
|---|---|
| `p1_head.html` | markup + all CSS |
| `p2_art.js` | material defs, lighting, shared drawing primitives |
| `p3_components.js` | every building's artwork |
| `p4_data.js` | crops, goods, seasons, weather, building catalogue |
| `p8_audio.js` | synthesised SFX, ambience, weather and music |
| `p9_systems.js` | upgrade tiers, animal life, husbandry, soil, automation |
| `p5_engine.js` | world grid, camera, road network, daily simulation |
| `p6_ui.js` | panels, tooltips, inspector |
| `p7_boot.js` | actions, input, game loop, save/load |

Rebuild the single file after editing:

```bash
python3 src/build2.py
```

Note: `build2.py` writes to an absolute path — change `OUT` if you move this folder.
