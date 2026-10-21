# -*- coding: utf-8 -*-
"""
격자.py — 서식을 «사이트에서 작성»할 수 있게 엑셀 칸 그대로 JSON 으로 굽습니다 (G361 · 2026-10-21)

소장님: 「사이트에서 작업이 가능하게 해야 해. 그래야 계속 사람들이 오니까. 이게 내 밥 줄」
        「서식도 사이트에서… 값 없이… 작업하려면 다시 사이트 찾게」 → 고르심 «빈 틀만 엑셀»
        「불편하지 않게 · 간편하게 · 되도록 자동으로 — 서식 받아서 하는 것보다 사이트가 더 간편해야」

■ 엑셀을 굽는 그리기 함수(gen.py · f_*.py · fb.Book)를 «그대로» 한 번 더 돌려, 빈 서식 시트의 칸을 그대로 적습니다.
  그래서 사이트 종이 = 엑셀 종이(칸 · 합친 칸 · 선 · 바탕 · 글꼴 · 숫자 꼴 · 수식)입니다. 서식마다 화면을 따로 짜지 않습니다.
  수식은 엑셀 수식 그대로(A1 주소) — 사이트(web/src/lib/엑셀셈.js)가 풉니다. 검증은 LibreOffice 로 다시 계산한 값과 대조(격자검증.py).
■ 내놓는 것
  web/public/forms/g/{slug}.json   { v, slug, title, sheets:[{ name, w[], h[], pc, pr, land, fit, marg[], cells:[[r,c,rs,cs,스타일번호,종류,값,수식,꼴,고름]…], img:[…], notes:[…] }], st:[스타일…], ex:{ '시트!A1': 값 } }
     종류: 0 글(고정) · 1 입력 · 2 수식 · 3 입력(비우면 수식) · 값: 날짜는 엑셀 일련번호 + 꼴
  web/public/forms/g/i/{slug}-{시트}-{n}.webp   (설명 사진)
  --blank : 빈 틀 엑셀(수식 · 작성 예시 없이 칸 틀만)도 web/public/forms/{slug}.xlsx · orig/{slug}.xlsx 자리에 씁니다.
■ 돌리기:  python3 격자.py [슬러그 …] [--all] [--blank] [--out 폴더]
"""
import datetime
import io
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import fb  # noqa: E402
from fb import Book, I  # noqa: E402

PUB = os.path.join(ROOT, "web", "public", "forms")
EPOCH = datetime.datetime(1899, 12, 30)

# ── 입력칸 자리를 적어 두기(fb.Page.put 를 감쌈 — 그리기 함수는 손대지 않음) ──────────────
_put0 = fb.Page.put


def _put(self, r, c1, c2, content=None, **kw):
    cell = _put0(self, r, c1, c2, content, **kw)
    if isinstance(content, I):
        self.__dict__.setdefault("_inp", {})[(r, c1)] = content
    return cell


fb.Page.put = _put


def serial(v):
    """날짜 → 엑셀 일련번호(1900 체계). 1900-03-01 앞은 엑셀의 «1900-02-29» 버릇 때문에 하루 뺌."""
    if isinstance(v, datetime.datetime):
        d = v - EPOCH
        n = round(d.days + d.seconds / 86400, 8)
        return n - 1 if n < 61 else n
    if isinstance(v, datetime.date):
        n = (datetime.datetime(v.year, v.month, v.day) - EPOCH).days
        return n - 1 if n < 61 else n
    if isinstance(v, datetime.time):
        return round((v.hour * 3600 + v.minute * 60 + v.second) / 86400, 8)
    return v


def _col(c):
    s = ""
    while c:
        c, m = divmod(c - 1, 26)
        s = chr(65 + m) + s
    return s


def _rgb(color):
    if color is None:
        return None
    try:
        v = color.rgb
    except Exception:
        return None
    if not isinstance(v, str) or len(v) < 6:
        return None
    return v[-6:].upper()


def _side(s):
    if s is None or not s.style:
        return 0
    w = {"thin": 1, "hair": 1, "dotted": 1, "dashed": 1, "medium": 2, "mediumDashed": 2, "thick": 3, "double": 3}.get(s.style, 1)
    c = _rgb(s.color) or "000000"
    return f"{w}{'d' if s.style in ('dotted', 'dashed', 'hair', 'mediumDashed') else ''}#{c}"


class Styles:
    def __init__(self):
        self.list, self.idx = [], {}

    def get(self, d):
        k = json.dumps(d, sort_keys=True, ensure_ascii=False)
        if k not in self.idx:
            self.idx[k] = len(self.list)
            self.list.append(d)
        return self.idx[k]


def _style(ws, r, c, r2, c2, S):
    cell = ws.cell(row=r, column=c)
    f, a = cell.font, cell.alignment
    fill = cell.fill
    bg = _rgb(fill.fgColor) if fill is not None and fill.fill_type == "solid" else None
    d = {}
    if f is not None:
        if f.sz and float(f.sz) != 10:
            d["z"] = float(f.sz)
        if f.b:
            d["b"] = 1
        if f.i:
            d["i"] = 1
        if f.u:
            d["u"] = 1
        ink = _rgb(f.color)
        if ink and ink not in ("000000", "1F2937"):
            d["k"] = ink
    if bg and bg != "FFFFFF":
        d["g"] = bg
    if a is not None:
        if a.horizontal and a.horizontal != "general":
            d["a"] = a.horizontal
        if a.vertical and a.vertical != "center":
            d["v"] = a.vertical
        elif not a.vertical:
            d["v"] = "bottom"
        if a.wrap_text:
            d["w"] = 1
        if a.shrink_to_fit:
            d["s"] = 1
        if a.textRotation:
            d["rot"] = int(a.textRotation)
        if a.indent:
            d["ind"] = int(a.indent)
    tl = ws.cell(row=r, column=c).border
    top, left = _side(tl.top), _side(tl.left)
    right = _side(ws.cell(row=r, column=c2).border.right)
    bot = _side(ws.cell(row=r2, column=c).border.bottom)
    if top or right or bot or left:
        d["bd"] = [top, right, bot, left]
    return S.get(d)


def _merges(ws):
    m = {}
    cover = set()
    for rg in ws.merged_cells.ranges:
        m[(rg.min_row, rg.min_col)] = (rg.max_row, rg.max_col)
        for rr in range(rg.min_row, rg.max_row + 1):
            for cc in range(rg.min_col, rg.max_col + 1):
                if (rr, cc) != (rg.min_row, rg.min_col):
                    cover.add((rr, cc))
    return m, cover


def _val(v):
    if isinstance(v, (datetime.date, datetime.datetime, datetime.time)):
        return serial(v)
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return v
    if v is None:
        return None
    return str(v)


def _dvs(ws):
    """칸 주소 → 고르는 말 목록"""
    out = {}
    for dv in ws.data_validations.dataValidation:
        if dv.type != "list" or not dv.formula1:
            continue
        f = dv.formula1.strip()
        if not (f.startswith('"') and f.endswith('"')):
            continue
        items = f[1:-1].split(",")
        for rg in dv.sqref.ranges:
            for rr in range(rg.min_row, rg.max_row + 1):
                for cc in range(rg.min_col, rg.max_col + 1):
                    out[(rr, cc)] = items
    return out


def _images(ws, slug, si, widths_pt, heights_pt, out_dir):
    res = []
    from PIL import Image as PImage
    for n, img in enumerate(getattr(ws, "_images", [])):
        an = img.anchor
        fr = getattr(an, "_from", None)
        if fr is None:
            continue
        emu = 12700.0
        x = sum(widths_pt[:fr.col]) + fr.colOff / emu
        y = sum(heights_pt[:fr.row]) + fr.rowOff / emu
        ext = getattr(an, "ext", None)
        if ext is not None and getattr(ext, "width", None):
            w, h = ext.width / emu, ext.height / emu
        else:
            to = an.to
            x2 = sum(widths_pt[:to.col]) + to.colOff / emu
            y2 = sum(heights_pt[:to.row]) + to.rowOff / emu
            w, h = x2 - x, y2 - y
        ref = img.ref                      # img._data() 는 속 파일을 닫아 «빈 틀 엑셀» 저장이 깨짐 → 바이트만 읽고 되감기
        if hasattr(ref, "seek"):
            ref.seek(0)
            data = ref.read()
            ref.seek(0)
        else:
            data = open(ref, "rb").read()
        name = f"{slug}-{si}-{n}.webp"
        os.makedirs(os.path.join(out_dir, "i"), exist_ok=True)
        im = PImage.open(io.BytesIO(data)).convert("RGB")
        scale = min(1.0, 1400 / max(im.size))
        if scale < 1:
            im = im.resize((int(im.size[0] * scale), int(im.size[1] * scale)))
        im.save(os.path.join(out_dir, "i", name), "WEBP", quality=80, method=6)
        res.append([round(x, 1), round(y, 1), round(w, 1), round(h, 1), name])
    return res


def colw_pt(w):
    """엑셀 열 너비(파일에 적힌 값 — 여백 포함) → 포인트. 기본 글꼴 숫자 폭 7px:
    픽셀 = 버림(((256·w + 버림(128/7)) / 256) · 7) — 3.6 → 25px(18.75pt) · 24칸 = 450pt (gen.py 주석과 같음)"""
    import math
    return round(math.floor((256 * w + 18) / 256 * 7) * 0.75, 2)


def export(slug, out_dir=None, blank_xlsx=False):
    import registry
    out_dir = out_dir or os.path.join(PUB, "g")
    m = registry.get(slug)
    bk = Book(m.TITLE)
    m.draw(bk, False)
    m.draw(bk, True)
    bk.finish()
    S = Styles()
    sheets = []
    ex = {}
    차례 = {id(ws): i for i, ws in enumerate(bk.wb.worksheets)}          # 엑셀 시트 차례 그대로(그리기 함수가 시트를 옮긴 서식 — 표지가 맨 앞)
    blank_pages = sorted([(lg, p) for (st, lg), p in bk.pages.items() if st == "blank"], key=lambda x: 차례.get(id(x[1].ws), 0))
    ex_list = sorted([p for (st, lg), p in bk.pages.items() if st == "ex"], key=lambda p: 차례.get(id(p.ws), 0))
    ex_lg = {lg: p for (st, lg), p in bk.pages.items() if st == "ex"}
    ex_title = {p.ws.title: p for p in ex_list}

    def 예시짝(si, lg, p):
        """빈 서식 시트의 작성 예시 시트 — 같은 이름(logical) · «예시-제목» · 수가 같으면 같은 차례(작성 예시가 몇 장만 있는 서식이 있음)"""
        if lg in ex_lg and ex_lg[lg] is not p:
            return ex_lg[lg]
        t = ("예시-" + p.ws.title)[:31]
        if t in ex_title:
            return ex_title[t]
        if len(ex_list) == len(blank_pages):
            return ex_list[si]
        if len(blank_pages) == 1 and ex_list:
            return ex_list[0]          # 빈 서식 한 장 · 예시 여러 날(작업일보 0929 · 0930) — 첫 예시
        return None
    짝이름 = {}
    for si, (lg, p) in enumerate(blank_pages):
        q = 예시짝(si, lg, p)
        if q is not None:
            짝이름[q.ws.title] = p.ws.title

    def 예시이름풀기(fml):
        def rep(m):
            nm = m.group(1) if m.group(1) is not None else m.group(2)
            if nm in 짝이름:
                b = 짝이름[nm]
                return ("'" + b.replace("'", "''") + "'!") if re.search(r"[^\w.]", b) else (b + "!")
            return m.group(0)
        return re.sub(r"'((?:[^']|'')+)'!|([A-Za-z0-9_가-힣.\-]+)!", lambda m: rep(m) if m.group(1) is None else (lambda nm: ("'" + 짝이름[nm].replace("'", "''") + "'!") if nm in 짝이름 else m.group(0))(m.group(1).replace("''", "'")), fml)

    for si, (lg, p) in enumerate(blank_pages):
        ws = p.ws
        짝 = 예시짝(si, lg, p)
        pr = p.last_print or ws.max_row
        maxc = max(ws.max_column, p.ncol)
        widths = [p.widths[i] if i < len(p.widths) else (ws.column_dimensions[_col(i + 1)].width or 8.43) for i in range(maxc)]
        wpt = [colw_pt(w) for w in widths]
        maxr = ws.max_row
        hpt = [float(ws.row_dimensions[r].height or 15) for r in range(1, maxr + 1)]
        merges, cover = _merges(ws)
        dvs = _dvs(ws)
        inp = getattr(p, "_inp", {})
        cells = []
        for r in range(1, maxr + 1):
            for c in range(1, maxc + 1):
                if (r, c) in cover:
                    continue
                cell = ws.cell(row=r, column=c)
                r2, c2 = merges.get((r, c), (r, c))
                v = cell.value
                isin = (r, c) in inp
                styled = (cell.fill is not None and cell.fill.fill_type == "solid") or any(
                    _side(getattr(cell.border, s)) for s in ("top", "left", "right", "bottom"))
                if v is None and not isin and not styled and (r, c) not in merges:
                    continue
                if r > pr and not isin and not (isinstance(v, str) and v.startswith("=")):
                    continue        # 인쇄 아래 안내 글은 notes 로
                sti = _style(ws, r, c, r2, c2, S)
                kind = 0
                f = None
                val = _val(v)
                if r == 1 and isinstance(val, str) and val.strip().startswith("← 이 1행을 지우고"):
                    val = ""          # 엑셀 빈 틀에만 맞는 말 — 사이트 종이 · PDF 에는 안 찍음(왼쪽 «K-건설맵 | k-conmap.com» 은 그대로)
                if isinstance(v, str) and v.startswith("="):
                    f = v[1:]
                    val = None
                    # 다른 시트 이름(INDIRECT)으로 «전일 값» 을 끌어오는 칸 — 사이트엔 날짜 시트가 없으니 쓸 수 있게(비우면 수식) ·
                    # «복사해 새로» 가 어제 누계로 채움(tools/격자작성.jsx)
                    kind = 3 if (isin or "INDIRECT(" in v) else 2
                elif isin:
                    kind = 1
                nf = cell.number_format if cell.number_format and cell.number_format != "General" else None
                ent = [r, c, r2 - r + 1, c2 - c + 1, sti, kind]
                tail = [val, f, nf, dvs.get((r, c))]
                while tail and tail[-1] is None:
                    tail.pop()
                cells.append(ent + tail)
                if isin and 짝 is not None:
                    exv = 짝.ws.cell(row=r, column=c).value
                    if exv is not None and not (isinstance(exv, str) and exv.startswith("=")) and exv != v:
                        ex[f"{si}!{_col(c)}{r}"] = _val(exv)
                if f and 짝 is not None:
                    # 작성 예시에서만 수식이 다른 칸(예: 안전세부 L8 = 노임명세서 합계) — 예시 채우기 때 그 수식으로(시트 이름은 빈 서식 이름으로)
                    exf = 짝.ws.cell(row=r, column=c).value
                    if isinstance(exf, str) and exf.startswith("="):
                        g = 예시이름풀기(exf[1:])
                        if g != f:
                            ex[f"{si}!{_col(c)}{r}"] = {"f": g}
        notes = []
        for r in range(pr + 1, maxr + 1):
            for c in range(1, maxc + 1):
                v = ws.cell(row=r, column=c).value
                if isinstance(v, str) and v.strip() and not v.startswith("="):
                    notes.append(v.strip())
        ps = ws.page_setup
        mg = ws.page_margins
        sheets.append({
            "name": ws.title, "exn": 짝.ws.title if 짝 is not None else None, "w": wpt, "h": hpt, "pc": p.pc, "pr": pr,
            "land": 1 if ps.orientation == "landscape" else 0, "fit": int(ps.fitToHeight or 0),
            "marg": [mg.left, mg.right, mg.top, mg.bottom], "cells": cells,
            "img": _images(ws, slug, si, wpt, hpt, out_dir), "notes": notes,
            "brk": sorted({b.id for b in ws.row_breaks.brk if b.id}) if ws.row_breaks else [],
            "keys": {a: k for k, a in p.k.items() if not k.startswith("합:")},     # 칸 이름(공사명 · 서명일 …) — 저절로 채우기에 씀
        })
    doc = {"v": 1, "slug": slug, "title": m.TITLE, "sheets": sheets, "st": S.list, "ex": ex}
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f"{slug}.json")
    open(path, "w", encoding="utf-8").write(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    if blank_xlsx:
        write_blank(bk, slug)
    return path, doc


def write_blank(bk, slug, dst=None):
    """빈 틀 엑셀 — 작성 예시 시트를 빼고, 수식 칸은 비웁니다(칸 · 선 · 바탕 · 숫자 꼴은 그대로)."""
    wb = bk.wb
    ex_names = {p.ws.title for (st, lg), p in bk.pages.items() if st == "ex"}
    for ws in list(wb.worksheets):
        if ws.title in ex_names:
            wb.remove(ws)
    for ws in wb.worksheets:
        for row in ws.iter_rows():
            for c in row:
                if isinstance(c.value, str) and c.value.startswith("="):
                    c.value = None
        ws.conditional_formatting = type(ws.conditional_formatting)()
    if dst is None:
        orig = slug.startswith("o-")
        dst = os.path.join(PUB, "orig" if orig else "", f"{slug}.xlsx")
    wb.save(dst)
    return dst


def all_slugs():
    import registry
    forms = [s for s, f in registry.forms().items() if f.get("gen") == "forms2"]
    orig = sorted(f[2:-3].replace("_", "-") for f in os.listdir(HERE) if f.startswith("f_o_") and f.endswith(".py"))
    return forms + orig


if __name__ == "__main__":
    args = sys.argv[1:]
    out = None
    if "--out" in args:
        i = args.index("--out")
        out = args[i + 1]
        del args[i:i + 2]
    blank = "--blank" in args
    slugs = all_slugs() if "--all" in args else [a for a in args if not a.startswith("--")]
    tot = 0
    for s in slugs:
        path, doc = export(s, out, blank)
        n = sum(len(x["cells"]) for x in doc["sheets"])
        nf = sum(1 for x in doc["sheets"] for c in x["cells"] if c[5] in (2, 3))
        ni = sum(1 for x in doc["sheets"] for c in x["cells"] if c[5] in (1, 3))
        kb = os.path.getsize(path) / 1024
        tot += kb
        print(f"{s:<28} 시트 {len(doc['sheets'])} · 칸 {n} · 입력 {ni} · 수식 {nf} · 예시 {len(doc['ex'])} · {kb:.0f}KB")
    print(f"모두 {len(slugs)} · {tot:.0f}KB")
