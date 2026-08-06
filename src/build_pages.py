#!/usr/bin/env python3
"""
Build the GitHub Pages copy, with visitor analytics.

Why this is a separate build: a published Artifact runs under a strict CSP
that blocks every external request, so an analytics snippet there would be
dead weight that only logs console errors. The Pages copy has no such
restriction, so this is the ONLY one of the three distribution channels
that can report real visitor numbers back to you.

To turn it on, set GOATCOUNTER_CODE below to your GoatCounter site code -
the "<code>" in https://<code>.goatcounter.com. Sign-up is free at
https://www.goatcounter.com. GoatCounter is used because it sets no
cookies and stores no personal data, so the page needs no consent banner.

Leave it empty and the Pages copy is built with no tracking at all.
"""

import sys

# ------------------------------------------------------------------
# PASTE YOUR GOATCOUNTER SITE CODE HERE  (just the code, not the URL)
GOATCOUNTER_CODE = 'greenhollow'
# ------------------------------------------------------------------

SRC = '/Users/limonghosh/Downloads/greenhollow-homestead.html'
DST = '/Users/limonghosh/greenhollow/index.html'

html = open(SRC, encoding='utf-8').read()

if GOATCOUNTER_CODE:
    snippet = (
        '\n<!-- visitor analytics: no cookies, no personal data -->\n'
        '<script data-goatcounter="https://%s.goatcounter.com/count"\n'
        '        async src="//gc.zgo.at/count.js"></script>\n'
        % GOATCOUNTER_CODE
    )
    if '</body>' in html:
        html = html.replace('</body>', snippet + '</body>')
    else:
        html += snippet
    note = 'with analytics (%s.goatcounter.com)' % GOATCOUNTER_CODE
else:
    note = 'NO analytics - set GOATCOUNTER_CODE to enable'

open(DST, 'w', encoding='utf-8').write(html)
print('pages build: %d chars, %s' % (len(html), note))

# guard: the artifact copy must never carry the snippet, it would only error
art = '/private/tmp/claude-501/-Users-limonghosh/68773a9a-8171-4685-a5ba-87df65a27c5a/scratchpad/greenhollow-artifact.html'
try:
    a = open(art, encoding='utf-8').read()
    # match the injected TAG, not the word: the game legitimately refers to
    # window.goatcounter in its milestone code, which must ship everywhere
    if 'data-goatcounter' in a or 'gc.zgo.at' in a:
        print('ERROR: analytics leaked into the artifact build', file=sys.stderr)
        sys.exit(1)
    print('artifact build clean of analytics - ok')
except FileNotFoundError:
    pass
