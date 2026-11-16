# -*- coding: utf-8 -*-
"""원문 읽기 셋째 — 만든 빈 서식 시트(인쇄 영역) 글 ↔ 법제처 보기 창 글층(띄어쓰기 뺌) difflib 대조 (G699 · 2026-11-16)
   python3 tools/forms2/원문대조.py <run.py 가 만든 _recalc/<슬러그>.xlsx> <원문.txt> <시트:글층머리> …   예) 신고서:앞 뒤쪽:뒤
   원문.txt 는 «앞: …» · «뒤: …» 줄(보기 창 .textLayer innerText 에서 띄어쓰기 뺀 것). 다른 곳이 1행 «K-건설맵» 머리글뿐이면 맞음."""
import difflib
import re
import sys

import openpyxl

xl, txt = sys.argv[1], sys.argv[2]
pairs = [a.split(":") for a in sys.argv[3:]]
raw = open(txt, encoding="utf-8").read()
layer = {}
for line in raw.splitlines():
    m = re.match(r"^(앞|뒤): (.*)$", line)
    if m:
        layer[m.group(1)] = m.group(2)
wb = openpyxl.load_workbook(xl, data_only=True)
bad = 0
for sheet, head in pairs:
    ws = wb[sheet]
    pa = ws.print_area
    rng = pa[0] if isinstance(pa, (list, tuple)) else pa
    rng = str(rng).split("!")[-1].replace("$", "")
    a, b = rng.split(":")
    ca, ra = openpyxl.utils.cell.coordinate_from_string(a)
    cb, rb = openpyxl.utils.cell.coordinate_from_string(b)
    c1, c2 = openpyxl.utils.column_index_from_string(ca), openpyxl.utils.column_index_from_string(cb)
    out = []
    for r in range(ra, rb + 1):
        for c in range(c1, c2 + 1):
            v = ws.cell(row=r, column=c).value
            if v is None:
                continue
            out.append(str(v))
    got = re.sub(r"\s+", "", "".join(out))
    want = re.sub(r"\s+", "", layer[head])
    sm = difflib.SequenceMatcher(None, want, got, autojunk=False)
    print(f"== {sheet} ↔ 글층 {head}: 같음 {sm.ratio():.4f} · 원문 {len(want)}자 · 시트 {len(got)}자")
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        bad += 1
        print(f"  {op:7s} 원문[{want[max(0,i1-8):i1]}‹{want[i1:i2]}›{want[i2:i2+8]}]  시트‹{got[j1:j2]}›")
print("다름 묶음", bad)
