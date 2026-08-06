S = "/private/tmp/claude-501/-Users-limonghosh/68773a9a-8171-4685-a5ba-87df65a27c5a/scratchpad/"
OUT = "/Users/limonghosh/Downloads/greenhollow-homestead.html"
parts = ["p1_head.html","p2_art.js","p3_components.js","p4_data.js","p8_audio.js","p9_systems.js",
         "p12_world.js","p10_career.js","p5_engine.js","p11_avatar.js","p6_ui.js","p13_ui2.js","p15_life2.js","p7_boot.js","p14_wire.js","p16_fixes.js","p17_more.js","p18_family.js","p19_tiers2.js","p20_perf.js","p21_more2.js","p22_rules.js"]
buf = []
for p in parts:
    buf.append(open(S+p, encoding='utf-8').read())
buf.append("\n</script>\n</body>\n</html>\n")
html = "\n".join(buf)
open(OUT, 'w', encoding='utf-8').write(html)
print("built", OUT, len(html))
