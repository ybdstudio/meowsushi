"""Bundle the game into one self-contained HTML file (CSS, JS and WebP atlases inlined).
   Writes dist/cat-sushi-tycoon.html (full document, open locally) and
   dist/cat-sushi-tycoon-artifact.html (head/body tags stripped for claude.ai artifact publishing)."""
import re, base64, os, sys
G = os.path.join(os.path.dirname(__file__), '..'); OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(G, 'dist')
os.makedirs(OUT, exist_ok=True)
html = open(f'{G}/index.html', encoding='utf8').read()
css = open(f'{G}/css/style.css', encoding='utf8').read()
html = html.replace('<link rel="stylesheet" href="css/style.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<link rel="icon" href="data:,">\n', '')
def js(m):
    src = m.group(1); code = open(f'{G}/{src}', encoding='utf8').read()
    if src == 'js/manifest.js':
        code = re.sub(r'"file":"(assets/[^"]+\.webp)"', lambda f: '"file":"data:image/webp;base64,' + base64.b64encode(open(f'{G}/{f.group(1)}', 'rb').read()).decode() + '"', code)
    return '<script>\n' + code.replace('</script', '<\\/script') + '\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', js, html)
full = html; open(f'{OUT}/cat-sushi-tycoon.html', 'w', encoding='utf8').write(full)
# artifact version: no doctype/html/head/body wrappers
head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
body = re.search(r'<body>(.*)</body>', html, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*', '', head)
head = re.sub(r'<meta name="viewport"[^>]*>\s*', '', head)
title = re.search(r'<title>.*?</title>', head).group(0); head = head.replace(title, '')
art = title + '\n' + head.strip() + '\n' + body
open(f'{OUT}/cat-sushi-tycoon-artifact.html', 'w', encoding='utf8').write(art)
for f in os.listdir(OUT): print(f, round(os.path.getsize(f'{OUT}/{f}') / 1e6, 2), 'MB')
