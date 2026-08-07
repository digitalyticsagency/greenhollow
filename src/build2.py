S = "/private/tmp/claude-501/-Users-limonghosh/68773a9a-8171-4685-a5ba-87df65a27c5a/scratchpad/"
OUT = "/Users/limonghosh/Downloads/greenhollow-homestead.html"
parts = ["p1_head.html","p2_art.js","p3_components.js","p4_data.js","p8_audio.js","p9_systems.js",
         "p12_world.js","p10_career.js","p5_engine.js","p11_avatar.js","p6_ui.js","p13_ui2.js","p15_life2.js","p7_boot.js","p14_wire.js","p16_fixes.js","p17_more.js","p18_family.js","p19_tiers2.js","p20_perf.js","p21_more2.js","p22_rules.js","p23_fixes3.js","p24_fleet.js","p25_weather.js","p26_offgrid.js","p27_arch.js","p28_depth.js","p29_detail.js","p30_sky.js","p31_storm.js","p32_birds.js","p33_indoors.js","p34_gate.js","p35_life_log.js","p36_you_life.js","p37_upgrades.js","p38_work_ui.js","p39_market.js","p40_neglect.js","p41_huddle.js","p42_fun_guests.js","p43_market_fix.js","p44_market2.js","p45_market_town.js","p46_sideshow.js","p47_fairground.js","p48_fixes4.js","p49_animals3d.js","p50_animal_life.js","p51_animal_panic.js","p52_shed_ufo.js"]

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
