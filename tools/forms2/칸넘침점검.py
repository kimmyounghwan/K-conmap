# -*- coding: utf-8 -*-
"""수식 칸 글이 칸 높이에 들어가나 — 장면 파일(장면_<슬러그>.py)마다 expect() 값으로 어림(fb.text_lines · G699 · 2026-11-16)
   python3 tools/forms2/칸넘침점검.py <슬러그> — «⚠» 줄이 있으면 그 줄 높이(h)를 늘리거나 칸을 넓힘(어림이라 실제보다 조금 넉넉히 봄)."""
import copy
import importlib
import sys

import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fb import Book, text_lines  # noqa: E402
from openpyxl.utils import column_index_from_string as CI  # noqa: E402
from openpyxl.utils.cell import coordinate_from_string as CS  # noqa: E402

slug = sys.argv[1]
m = importlib.import_module("f_" + slug.replace("-", "_"))
sc = importlib.import_module("장면_" + slug.replace("-", "_"))
keys = sorted({k for s in sc.SCENES.values() for k in s if k != "EX"})
base = {"EX": copy.deepcopy(m.EX), **{k: copy.deepcopy(getattr(m, k)) for k in keys}}
worst = {}
for name, s in sc.SCENES.items():
    m.EX.clear(); m.EX.update(copy.deepcopy(base["EX"])); m.EX.update(s.get("EX", {}))
    for k in keys:
        setattr(m, k, copy.deepcopy(s[k]) if k in s else base[k])
    bk = Book(m.TITLE)
    m.draw(bk, True)
    pages = {lg: p for (st, lg), p in bk.pages.items() if st == "ex"}
    exp = m.expect({lg: p.inputs for lg, p in pages.items()})
    for lg, vals in exp.items():
        p = pages[lg]
        for key, v in vals.items():
            if not isinstance(v, str) or not v:
                continue
            ref = p.k[key]
            col, row = CS(ref)
            c = CI(col)
            ws = p.ws
            c2, r2 = c, row
            for rg in ws.merged_cells.ranges:
                if rg.min_row == row and rg.min_col == c:
                    c2, r2 = rg.max_col, rg.max_row
            wu = sum(p.widths[c - 1:c2])
            cell = ws.cell(row=row, column=c)
            sz = cell.font.sz or 10
            h = sum((ws.row_dimensions[r].height or 15) for r in range(row, r2 + 1))
            n = text_lines(v, wu * 10.0 / sz)
            need = n * sz * 1.45 + 5
            k = (lg, key)
            if k not in worst or need - h > worst[k][0]:
                worst[k] = (need - h, name, n, round(need, 1), h, v[:50])
bad = 0
for (lg, key), (d, name, n, need, h, v) in sorted(worst.items(), key=lambda x: -x[1][0]):
    flag = "⚠" if d > 0 else " "
    if d > 0:
        bad += 1
    print(f"{flag} {lg}:{key:<14} 줄 {n} · 필요 {need} · 높이 {h} · 장면 {name} · {v}")
print("넘침", bad)
