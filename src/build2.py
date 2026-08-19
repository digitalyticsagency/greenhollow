S = "/Users/limonghosh/greenhollow/src/"   # single source of truth; the guards below read the same files
OUT = "/Users/limonghosh/Downloads/greenhollow-homestead.html"
parts = ["p1_head.html","p2_art.js","p3_components.js","p4_data.js","p8_audio.js","p9_systems.js",
         "p12_world.js","p10_career.js","p5_engine.js","p11_avatar.js","p6_ui.js","p13_ui2.js","p15_life2.js","p7_boot.js","p14_wire.js","p16_fixes.js","p17_more.js","p18_family.js","p19_tiers2.js","p20_perf.js","p21_more2.js","p22_rules.js","p23_fixes3.js","p24_fleet.js","p25_weather.js","p26_offgrid.js","p27_arch.js","p28_depth.js","p29_detail.js","p30_sky.js","p31_storm.js","p32_birds.js","p33_indoors.js","p34_gate.js","p35_life_log.js","p36_you_life.js","p37_upgrades.js","p38_work_ui.js","p39_market.js","p40_neglect.js","p41_huddle.js","p42_fun_guests.js","p43_market_fix.js","p44_market2.js","p45_market_town.js","p46_sideshow.js","p47_fairground.js","p48_fixes4.js","p49_animals3d.js","p50_animal_life.js","p51_animal_panic.js","p52_shed_ufo.js","p53_animal_minds.js","p54_duck_bee.js","p55_strays.js","p56_people_lives.js","p57_fixes5.js","p58_ufo_fx.js","p59_animal_tongue.js","p60_lamps_actions.js","p61_fixes6.js","p62_human_minds.js","p63_pen_sync.js","p64_horse_guests.js","p65_phase1.js","p66_header.js","p67_items.js","p68_new_species.js","p69_bench.js","p70_tiers_bench3.js","p71_guest_stops.js","p72_defs_host.js","p73_economy.js","p74_economy2.js","p75_crops.js","p76_storage.js","p77_lots.js","p78_ambitions.js","p79_valley.js","p80_copy.js","p81_events.js","p82_joins.js","p83_align.js","p84_seasonal.js","p85_dog.js","p86_meals.js","p87_reviews.js","p88_sunlight.js","p89_lod.js","p90_ground.js","p91_relief.js","p92_dogmind.js","p93_placing.js","p94_wildlife.js","p95_barn.js","p96_nightlights.js","p97_priorities.js","p98_hub.js","p99_rooms.js","p100_interior.js","p101_furnish.js","p102_rooms_people.js","p103_chase.js","p104_arena.js","p105_ledger.js","p106_expand.js","p107_arena_stage.js","p108_dragon.js","p109_mountain.js","p110_ride.js","p111_dragon_trust.js","p112_visitors_sound.js","p113_wild_paint.js","p114_dragon_life.js","p115_ride_fx.js","p116_roost_show.js","p117_dragon_art.js","p118_almanac.js","p119_village.js","p120_ride_games.js","p121_kennel.js","p122_interiors.js","p123_dragon_duel.js","p124_hub_robots.js","p125_dragon_lord.js","p126_gate.js","p127_dog_play.js","p128_settings.js","p129_market_tabs.js","p130_dog_world.js","p131_dragon_world.js","p132_birds.js","p133_market_visit.js","p134_bird_life.js","p135_market_trip.js","p136_market_folk.js","p137_bird_lives.js","p138_scene_shroud.js","p139_lights.js","p140_dog_home_sleep.js","p141_dragon_duel.js","p142_dragon_morning.js","p143_shed_identity.js","p144_shifts.js","p145_contribution.js","p146_reel.js","p147_more_interiors.js","p148_pressure.js","p149_dollhouse.js","p150_cameras.js","p151_money_guard.js","p152_machinery.js","p153_wwoof.js","p154_evidence.js","p155_askwhy.js"]

# --- guards: a SyntaxError anywhere kills the whole single-file game, so
# --- refuse to emit a build that would not parse.
import re as _re, collections as _c, subprocess as _sp, sys as _sys
_decl = _c.defaultdict(list)
for _f in parts:
    if not _f.endswith('.js'): continue
    for _i, _line in enumerate(open(_f), 1):
        _m = _re.match(r'(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=', _line)
        if _m: _decl[_m.group(1)].append(f"{_f}:{_i}")
# Top-level function declarations collide silently: the later one simply
# replaces the earlier, no error, and every existing caller now gets the
# wrong shape back. That is exactly how p149's household() replaced
# p86_meals' household() and put NaN into the player's cash. Same guard,
# same failure, so check them together.
for _f in parts:
    if not _f.endswith('.js'): continue
    for _i, _line in enumerate(open(_f), 1):
        _m = _re.match(r'function\s+([A-Za-z_$][\w$]*)\s*\(', _line)
        if _m: _decl[_m.group(1)].append(f"{_f}:{_i} (function)")

_dups = {k: v for k, v in _decl.items() if len(v) > 1}
# const/let collisions are a SyntaxError and must stop the build. Duplicate
# function declarations are legal JavaScript and this codebase uses them on
# purpose in places - p33 replaces p31's interiorArt, p58 replaces p52's
# ufoArt - so they are reported rather than fatal. Read the list every time:
# a name appearing twice with different arguments is a silent bug, which is
# how p136's folkArt took over p110's and drew the ride's people at
# scale(undefined).
_fatal = {k: v for k, v in _dups.items() if any('(function)' not in x for x in v)}
_warn  = {k: v for k, v in _dups.items() if k not in _fatal}
if _warn:
    print("NOTE - duplicate top-level function declarations (later one wins):")
    for k, v in _warn.items(): print(f"   {k}: {v}")
if _fatal:
    print("BUILD FAILED - top-level redeclaration (SyntaxError at load):")
    for k, v in _fatal.items(): print(f"   {k}: {v}")
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
