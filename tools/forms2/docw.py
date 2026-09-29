# -*- coding: utf-8 -*-
"""docw.py — 시공계획서처럼 «글이 긴 서류» 를 fb 틀로 쓰는 도움 함수 (2026-09-29)
  h1 · h2 · 글(para) · 줄 목록(items) · 표(table) · 흐름도(flow) · 그림(image)
  글은 칸 너비로 줄 수를 어림해 행 높이를 잡습니다(fb.text_lines). 한 쪽 넘게 길면 제목·표 머리가 쪽 끝에 홀로 남지 않게 fb 쪽 나눔을 씁니다."""
import math

from fb import F, I, text_lines


def _ph(p):
    m = p.ws.page_margins
    land = p.ws.page_setup.orientation == "landscape"
    return (595 if land else 842) - 72 * (m.top + m.bottom) - 6      # 6pt 여유 — 엑셀·리브레의 행 높이 반올림 차이


def _walk(p, upto):
    """1행부터 upto-1 행까지 쪽 나눔 어림 → (쪽 시작 행 목록, 마지막 쪽에서 쓴 높이)"""
    ph = _ph(p)
    forced = p.__dict__.setdefault("_brk", set())
    y, starts = 0.0, [1]
    for r in range(1, upto):
        if p.ws.row_dimensions[r].hidden:
            continue
        h = p.ws.row_dimensions[r].height or 15
        if r in forced or (y + h > ph and y > 0):
            if r != starts[-1]:
                starts.append(r)
            y = 0.0
        y += h
    return starts, y


def keep(p, need):
    """여러 쪽으로 넘어가는 시트에서 need(pt) 가 이 쪽에 안 들어가면 여기서 쪽을 넘김(제목·표 머리가 쪽 끝에 홀로 남지 않게).
    쪽 나눔은 done() 이 «수동 쪽 나눔» 으로 박아 두므로 엑셀·리브레오피스·한셀 어디서 열어도 같은 자리에서 넘어갑니다."""
    if p.ws.page_setup.fitToHeight != 0:
        return
    ph = _ph(p)
    if need >= ph * 0.9:
        return
    _s, y = _walk(p, p.r)
    if y > 0 and need > ph - y:
        p.__dict__.setdefault("_brk", set()).add(p.r)


def done(p):
    """인쇄 범위를 닫고, 여러 쪽 시트면 어림한 쪽 나눔을 모두 수동 쪽 나눔으로 박습니다."""
    from openpyxl.worksheet.pagebreak import Break, RowBreak
    p.end_print()
    if p.ws.page_setup.fitToHeight != 0:
        return
    starts, _y = _walk(p, p.last_print + 1)
    p.ws.row_breaks = RowBreak()
    for r in starts[1:]:
        p.ws.row_breaks.append(Break(id=r - 1))


def h1(p, t):
    keep(p, 34 + 60)
    p.gap(6)
    p.row([(p.pc, t, {"kind": "h2", "size": 13.5})], h=28)


def h2(p, t):
    keep(p, 24 + 50)
    p.gap(3)
    p.row([(p.pc, t, {"kind": "h2", "size": 11})], h=21)


def para(p, t, indent=2, size=10):
    """들여 쓴 글 한 덩이 — 칸 너비로 줄 수를 어림해 높이를 잡음"""
    wu = sum(p.widths[:p.pc]) - indent * 2
    n = text_lines(t, wu * 10.0 / size)
    p.row([(p.pc, t, {"kind": "free", "size": size, "valign": "top", "indent": indent})], h=n * size * 1.55 + 6)


def items(p, lst, marks=None, size=10, lead=1):
    """번호 붙은 줄 목록. marks 가 없으면 1) 2) …"""
    wu = sum(p.widths[lead:p.pc])
    for i, t in enumerate(lst):
        m = (marks[i] if marks else f"{i + 1})")
        n = text_lines(t, wu * 10.0 / size)
        p.row([(lead, m, {"kind": "free", "align": "right", "size": size, "valign": "top"}),
               (p.pc - lead, t, {"kind": "free", "size": size, "valign": "top"})], h=n * size * 1.55 + 5)


def table(p, heads, rows, h=22, head_h=24, size=9.5):
    """heads: [(이름, 칸수)] · rows: [[내용…]] (내용은 글 · I · F · (내용, {선택}))"""
    plan = []
    for r in rows:
        cells = []
        longest = 1
        c0 = 0
        for (t, sp), c in zip(heads, r):
            opt = {}
            if isinstance(c, tuple):
                c, opt = c
            txt = c if isinstance(c, str) else (c.ex if isinstance(c, I) and p.ex and isinstance(c.ex, str) else None)
            if txt:
                longest = max(longest, text_lines(txt, sum(p.widths[c0:c0 + sp]) * 10.0 / (opt.get("size") or size)))
            if isinstance(c, str):
                opt = {"kind": "text", "size": size, **opt}
            cells.append((sp, c, opt))
            c0 += sp
        plan.append((cells, max(h, longest * size * 1.5 + 6)))
    tot = head_h + sum(x[1] for x in plan)
    keep(p, tot if tot < 500 else head_h + sum(x[1] for x in plan[:2]))
    p.row([(sp, t, {"kind": "head"}) for t, sp in heads], h=head_h)
    for cells, hh in plan:
        p.row(cells, h=hh)


def flow(p, steps, span=None, gap_h=14):
    """흐름도 — 가운데 네모 칸을 ▼ 로 잇습니다. steps: [(글, 곁말 또는 None)]"""
    n = p.pc
    span = span or max(4, n // 2)
    left = (n - span) // 2
    for i, (t, side) in enumerate(steps):
        cells = []
        if left:
            cells.append((left, "", {"kind": "free"}))
        cells.append((span, t, {"kind": "label", "size": 10.5}))
        rest = n - left - span
        if rest:
            cells.append((rest, ("  ◀ " + side) if side else "", {"kind": "free", "size": 9.5, "align": "left"}))
        p.row(cells, h=30)
        if i < len(steps) - 1:
            p.row([(n, "▼", {"kind": "cfree", "size": 10})], h=gap_h)


def image(p, data, rows=8, row_h=20, c1=1, c2=None, caption=None):
    """그림을 (c1..c2) 칸 · rows 줄 자리에 비율 지켜 넣음(설명 그림은 원본 그대로 쓴다 — 소장님 말씀)"""
    c2 = c2 or p.pc
    r1 = p.r
    for _ in range(rows):
        p.gap(row_h)
    p.place_image(data, c1, c2, r1, p.r - 1)
    if caption:
        p.row([(p.pc, caption, {"kind": "cfree", "size": 9})], h=18)
