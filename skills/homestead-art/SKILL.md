---
name: homestead-art
description: Draw objects, buildings, characters and animals for the Greenhollow homestead game, and any other top-down 2D game built from procedurally generated SVG rather than sprites. Use when adding or upgrading a game object, designing a creature or character, giving something an upgrade tier, adding idle animation, or when art is landing flat, inconsistently lit, or dropping the frame rate. Covers the aerial projection, the fixed light direction, the shared gradient vocabulary, the four-tier architectural progression, character construction, and the measured performance budget that art must stay inside.
---

# Homestead game art

Art here is **generated, not drawn**. Every object is a JavaScript function returning an SVG
string, called with the object's pixel footprint. There are no image files. That means the
rules below are not style preferences — break them and objects stop matching the scene they
sit in.

Reference implementation: `~/greenhollow/src/`, built by `build2.py` into one HTML file.

## The five rules that keep a scene coherent

1. **Aerial three-quarter, never elevation.** You are looking down at a slight angle. You see
   roofs, the ground, and a thin band of wall under the eave. You never see a full façade.
2. **The sun is fixed at upper-left.** Every highlight goes top and left, every shadow goes
   down and right. One object lit from elsewhere destroys the illusion for the whole screen.
3. **Depth comes from stacked shapes, never filters.** `feGaussianBlur` and `feTurbulence` are
   banned in the scene layer — see the performance section for what they cost.
4. **Use the shared gradients.** Inventing colours makes objects look pasted in.
5. **Round every coordinate** through `n()`. Sub-pixel values bloat the SVG string, and string
   length is the real cost here.

## The gradient vocabulary

Defined once in `DEFS()` and referenced as `fill="url(#gRoof)"`:

| Purpose | Gradients |
|---|---|
| Roofing | `gRoof` (steel), `gRoofRed` (colorbond) |
| Structure | `gTimber`, `gStone`, `gGlass`, `gSolar`, `gTank` |
| Ground | `gLawn`, `gMeadow`, `gSoil`, `gSoilWet`, `gGravel` |
| Planting | `gCanopy`, `gCanopyD` (dark), `gCanopyO` (olive), `gHedge` |
| Atmosphere | `gWater`, `gSky`, `gHaze` |

Only introduce a new gradient when nothing above can carry the material, and add it to `DEFS()`
so it is defined once rather than per object.

## Building an object

Compose from the primitives in `p2_art.js` and `p27_arch.js` rather than drawing from scratch:

```
building(w,h,{roof,wall,solar,solar2,chimney,skylight,skirt})
                    -- pitched-roof volume: cast shadow, eave, corrugation,
                       wall band with door and windows, weathering
annex(w,h,{roof})   -- single-pitch lean-to
monitor(w,h)        -- clerestory glazing along a ridge
apron(x,y,w,h,r)    -- poured concrete hardstand
verandah(x,y,w,h)   -- decking on posts
planter / roofGarden / miniTank
canopy / conifer / hedge / water / gravel / fence / patch / panels
```

A new object is usually one `building()` plus two or three of the rest. Reaching for raw
`<rect>` is a sign you are re-implementing something that exists.

### Ground shadows are automatic — do not draw your own

`drawObj` casts the ground shadow for every object, in one direction, scaled by the object's
height from the `HEIGHT` table (`p28_depth.js`). Add your object's category there instead of
drawing a shadow inside the art function, or it will get two.

## Upgrade tiers: consolidation, not sprawl

Four tiers, `Mk I` to `Mk IV`. The principle that makes upgrades read as *investment* rather
than *more stuff*:

| Tier | Reads as | Typically gains |
|---|---|---|
| Mk I | Rough and improvised | The bare volume |
| Mk II | The obvious first fix | Lean-to, hardstand, water tank |
| Mk III | Pulled into one footprint | Clerestory, paved apron, service line |
| Mk IV | Architectural | Green roof, glazing, verandah, planting |

Living things follow the same arc differently: they **grow**, then gain **trellis and drip
line**, then **netting and a picking path**.

Tier layers are **cumulative** — a Mk IV shed still carries its Mk II lean-to. That is correct
visually and is also why the performance rules below matter.

Wire an object in by adding it to `ARCH_FAMILY` with one of: `shed`, `pavilion`, `paddock`,
`grove`, `water`, `infra`.

## Characters and animals

`person(x, y, sc, shirt, hat)` and `beast(kind, x, y, sc, idle)` build figures from stacked
rounded rects and circles at scale `sc`. Both start with a contact-shadow ellipse — a figure
without one floats.

Proportions that work at this scale, in units of `sc`:

- Head circle `r≈2.9`, skin `#e2b98f`
- Torso `6×5.6` rounded rect, `rx≈2.2`, in the shirt colour
- Arms `1.9×4.4`, legs `1.8×6`, `#3f4a5a`
- Shadow ellipse `rx≈4.4 ry≈1.8`, `#16240c` at `0.32`

Animals read through **silhouette and one colour accent**, not detail: a chicken is a cream
ellipse, a smaller body ellipse, a head circle, a red comb dot, an orange beak triangle. At 40px
a tile, anything finer is invisible and only costs string length.

Characters animate through CSS classes (`youwalk`, `youwork`, `bwalkA`, `brunA`), never by
regenerating the SVG per frame.

## Idle animation

Add motion by returning a class from `idleClass(bp)` in `p28_depth.js`:

`lf-sway` (plants) · `lf-shimmer` (water) · `lf-glow` (lights, electronics) ·
`lf-work` (processing buildings) · `lf-spin` (turbines)

Rules that keep animation affordable:

- **Transform and opacity only.** Anything that triggers layout or an offscreen pass is out.
- **Stagger the delay** so objects do not pulse in unison.
- **Respect the budget.** `IDLE_CAP` (44) limits how many objects may move at once; beyond it
  objects still draw, they just hold still, which nobody notices in a crowd.
- **Honour `prefers-reduced-motion`** and the in-game `motion` setting.

## The performance budget — measured, not guessed

### How to measure, or the numbers will lie to you

This matters more than any single figure below. Getting it wrong produced a full round of
false conclusions once already:

- **Pause the simulation** (`S.speed = 0`) before sampling. The game's own tickers run
  `render()` mid-sample and dominate the result. A pass measured with the sim running reported
  animation costing ~45fps; measured properly it costs ~6–11fps.
- **Take a median of 5 short runs**, not one. Run-to-run spread on the same configuration is
  around ±10fps.
- **Change one thing at a time** and re-measure. Toggling a CSS class off (`animation:none`)
  isolates a system without rebuilding.
- **Distrust a single surprising number.** If disabling something makes the scene *slower*,
  that is noise, not a finding.

### What actually costs

Real numbers from this codebase, measured as above:

- 183 `feGaussianBlur` + 81 `feTurbulence` filters took the scene to **15fps**. Removing them
  and splitting static backdrop from live foreground: **121fps**, render 22ms → 10.6ms.
- **Overdraw is the dominant cost at scale, not element count.** Large translucent overlays
  (netting sheets, shade sails, aprons) stacking across a farm took 190 maxed objects to
  **4fps** — while adding only 30% more SVG. Level-of-detail that sheds the broad alpha
  surfaces first took 126 objects from 19fps to 31, and a 46-object farm sits at **82fps**.
- The whole foreground SVG is re-serialised per render, so **string length is a real cost**.
  Cap decorative loops: a green roof reads from ~24 scattered tufts; 184 is invisible spend.
- **In SVG an animated child repaints its region — it does not composite on the GPU** the way
  an animated HTML element does. So "transform and opacity only" is necessary but not
  sufficient: what you are really spending is animated **area × frequency**. Prefer small
  movements over large sweeps. A ripple growing to `scale(2.4)` is affordable; the same ripple
  at `scale(5)`, or a specular band sweeping a full object width, is not.
- Animation caps are `IDLE_CAP` 20 (whole-object idle) and `DETAIL_CAP` 8 (working detail).
  Going to 26 and 10 cost roughly 11fps on a busy farm for very little visible gain.

On an all-Mk IV stress farm, measured medians: **46 objects ≈ 32–43fps**, 76 ≈ 23–33,
126 ≈ 18–22, 190 ≈ 12–14. Treat these as ranges, not points.

`ARCH_LOD` (2 → full, 1 → reduced, 0 → structure only) switches on object count. Fine detail
drops out; **structure never does** — a building must not lose its shape, only its garnish.

### Before shipping art

1. Render it at all four tiers and confirm four visibly distinct results.
2. Check the light still comes from upper-left.
3. Measure fps on a crowded scene, do not assume.
4. `node --check` the part. **A single top-level `const` redeclaration is a SyntaxError that
   kills the entire single-file game** — blank page, nothing defined. `build2.py` guards this;
   do not bypass it.
