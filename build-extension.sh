#!/bin/sh
# Re-extracts the generator (data + checksums) from index.html into the extension so both stay in sync.
python3 - <<'PY'
s = open('index.html', encoding='utf-8').read()
js = s.split('<script>')[1].split('/* ---------- UI ---------- */')[0]
open('extension/generator.js', 'w', encoding='utf-8').write('/* AUTO-GENERATED from index.html by build-extension.sh — do not edit */\n' + js)
PY
