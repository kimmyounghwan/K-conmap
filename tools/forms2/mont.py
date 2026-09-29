# -*- coding: utf-8 -*-
"""mont.py — 구운 서식들의 «작성 예시» 첫 쪽을 6장씩 한 그림으로 (눈으로 확인용). python3 mont.py 이름 슬러그…"""
import os, subprocess, sys
from PIL import Image, ImageDraw
out = '/tmp/g10/f2/out'
name, slugs = sys.argv[1], sys.argv[2:]
tiles = []
for s in slugs:
    pdf = f'{out}/_pdf/{s}.pdf'
    n = int([l for l in subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.splitlines() if l.startswith('Pages')][0].split()[1])
    pg = n // 2 + 1
    pre = f'/tmp/g10/f2/_m_{s}'
    subprocess.run(['pdftoppm', '-f', str(pg), '-l', str(pg), '-scale-to', '620', '-png', pdf, pre], check=True)
    f = sorted(x for x in os.listdir('/tmp/g10/f2') if x.startswith(f'_m_{s}-'))[0]
    im = Image.open('/tmp/g10/f2/' + f).convert('RGB'); os.remove('/tmp/g10/f2/' + f)
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 330, 16], fill='yellow'); d.text((3, 2), f'{s} p{pg}/{n}', fill='black')
    tiles.append(im)
for k in range(0, len(tiles), 6):
    g = tiles[k:k + 6]
    W = max(t.size[0] for t in g); H = max(t.size[1] for t in g)
    m = Image.new('RGB', (W * 3, H * ((len(g) + 2) // 3)), 'white')
    for i, t in enumerate(g): m.paste(t, ((i % 3) * W, (i // 3) * H))
    m.save(f'/tmp/g10/f2/mont_{name}_{k // 6}.png'); print(f'/tmp/g10/f2/mont_{name}_{k // 6}.png', m.size)
