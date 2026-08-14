S = "/Users/limonghosh/greenhollow/src/"   # single source of truth; the guards below read the same files
OUT = "/Users/limonghosh/Downloads/greenhollow-homestead.html"
parts = ["p1_head.html","p2_art.js","p3_components.js","p4_data.js","p8_audio.js","p9_systems.js",
         "p12_world.js","p10_career.js","p5_engine.js","p11_avatar.js","p6_ui.js","p13_ui2.js","p15_life2.js","p7_boot.js","p14_wire.js","p16_fixes.js","p17_more.js","p18_family.js","p19_tiers2.js","p20_perf.js","p21_more2.js","p22_rules.js","p23_fixes3.js","p24_fleet.js","p25_weather.js","p26_offgrid.js","p27_arch.js","p28_depth.js","p29_detail.js","p30_sky.js","p31_storm.js","p32_birds.js","p33_indoors.js","p34_gate.js","p35_life_log.js","p36_you_life.js","p37_upgrades.js","p38_work_ui.js","p39_market.js","p40_neglect.js","p41_huddle.js","p42_fun_guests.js","p43_market_fix.js","p44_market2.js","p45_market_town.js","p46_sideshow.js","p47_fairground.js","p48_fixes4.js","p49_animals3d.js","p50_animal_life.js","p51_animal_panic.js","p52_shed_ufo.js","p53_animal_minds.js","p54_duck_bee.js","p55_strays.js","p56_people_lives.js","p57_fixes5.js","p58_ufo_fx.js","p59_animal_tongue.js","p60_lamps_actions.js","p61_fixes6.js","p62_human_minds.js","p63_pen_sync.js","p64_horse_guests.js","p65_phase1.js","p66_header.js","p67_items.js","p68_new_species.js","p69_bench.js","p70_tiers_bench3.js","p71_guest_stops.js","p72_defs_host.js","p73_economy.js","p74_economy2.js","p75_crops.js","p76_storage.js","p77_lots.js","p78_ambitions.js","p79_valley.js","p80_copy.js","p81_events.js","p82_joins.js","p83_align.js","p84_seasonal.js","p85_dog.js","p86_meals.js","p87_reviews.js"]

# --- guards: a SyntaxError anywhere kills the whole single-file game, so
# --- refuse to emit a build that would not parse.
import re as _re, collections as _c, subprocess as _sp, sys as _sys
_decl = _c.defaultdict(list)
for _f in parts:
    if not _f.endswith('.js'): continue
    for _i, _line in enumerate(open(_f), 1):
        _m = _re.match(r'(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=', _line)
        if _m: _decl[_m.group(1)].append(f"{_f}:{_i}")
_dups = {k: v for k, v in _decl.items() if len(v) > 1}
if _dups:
    print("BUILD FAILED - top-level redeclaration (SyntaxError at load):")
    for k, v in _dups.items(): print(f"   {k}: {v}")
    _sys.exit(1)
for _f in parts:
    if not _f.endswith('.js'): continue
    if _sp.run(['node','--check',_f], capture_output=True).returncode:
        print(f"BUILD FAILED - {_f} does not parse")
        _sys.exit(1)
buf = []
for p in parts:
    buf.append(open(S+p, encoding='utf-8').read())
buf.append("\n</script>\n</body>\n</html>\n")
html = "\n".join(buf)
open(OUT, 'w', encoding='utf-8').write(html)
print("built", OUT, len(html))
