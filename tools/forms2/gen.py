# -*- coding: utf-8 -*-
"""
gen.py — 일반 서식(forms.json) «틀 그대로» 다시 그리기 + 내용·수식·작성 예시 얹기 (2026-09-29)

틀: formsgen.py 와 똑같이 24칸 × 3.6 격자 · 1행 K-건설맵 · 제목 · kv(이름 6칸 + 값 18칸) · 표(가중치로 칸 나눔) ·
    조문(cl) · 글(text) · 서명(년 월 일 + (서명 또는 인)). 칸 이름·차례·결재란은 forms.json 그대로입니다.
얹는 것(서식마다 SPEC — b_*.py):
  kv   : {'이름표': dict(k=, ex=, fmt=, f=, blank=, rate=)}   (이름표는 띄어쓰기 무시하고 맞춤)
  tab  : [ {cols:[열이름…], fmt:{열:서식}, calc:{열:'={열@}*{열@}'}, ex:[[…]…], sum:[열…], dv:{열:'가,나'},
            first:{열:'=첫 줄 수식'}, pre:{열:[미리 적을 값…]} } … ]  — 표 차례대로
            {열@} 같은 줄 · {열@-1} 윗줄 · {열[]} 열 전체 범위 · {합:열} 합계 칸
  text : {차례: '=수식'}   (text 블록을 수식으로 바꿀 때)
  sign : {'date': 날짜, '이름표': 이름}
  expect(inp) → {이름: 값}   (파이썬으로 따로 계산해 엑셀 수식과 대조)
"""
import datetime
import math
import re

from fb import F, I

COLS = 24
COLW = 3.6
D = datetime.date


def _spans(weights, total=COLS, least=2):
    s = sum(weights) or 1
    out = [max(least, round(total * w / s)) for w in weights]
    diff = total - sum(out)
    i = out.index(max(out))
    out[i] += diff
    if out[i] < least:
        out = [total // len(weights)] * len(weights)
        out[-1] += total - sum(out)
    return out


def norm(t):
    return re.sub(r"\s+", "", str(t or ""))


# 여러 서식에 두루 쓰는 작성 예시 값(가상의 현장) — SPEC 이 따로 주면 그것을 씁니다.
EX_DEFAULT = {
    "공사명": ("가나지구 배수로 정비공사", None),
    "원도급공사명": ("가나지구 배수로 정비공사", None),
    "계약번호": ("제2026-0312호", None),
    "발주기관": ("가나시 건설과", None),
    "계약금액": (963_241_000, "won"),
    "공기": ("2026. 3. 9. ~ 2026. 12. 31. (298일)", None),
    "공사기간": ("2026. 3. 9. ~ 2026. 12. 31. (298일)", None),
    "계약기간": ("2026. 3. 9. ~ 2026. 12. 31. (298일)", None),
    "작성일자": (D(2026, 9, 29), "date"),
    "작성일": (D(2026, 9, 29), "date"),
    "계약일자": (D(2026, 3, 2), "date"),
    "착공일": (D(2026, 3, 9), "date"),
    "준공일": (D(2026, 12, 31), "date"),
    "준공예정일": (D(2026, 12, 31), "date"),
    "현장위치": ("가나시 다라동 123-4 일원", None),
    "공사장소": ("가나시 다라동 123-4 일원", None),
    "예금주": ("예시건설(주)", None),
    "은행명": ("예시은행", None),
    "계좌번호": ("000-000000-00-000", None),
    "사업자등록번호": ("000-00-00000", None),
    "대표자": ("홍길동", None),
    "연락처": ("000-0000-0000", None),
    "시공사": ("예시건설(주)", None),
    "상호": ("예시건설(주)", None),
}
SIGN_DEFAULT = {"현장대리인": "김철수", "대표자": "홍길동", "작성자": "이영희", "감독": "박감독", "감독(감리)": "박감독",
                "발주기관": "가나시장", "시공자": "예시건설(주)", "확인자": "최확인", "현장소장": "김철수", "안전관리자": "정안전",
                "관리감독자": "이감독", "품질관리자": "한품질", "공무": "오공무",
                "점검자": "정안전", "보고자": "정안전", "품질담당": "한품질", "검수자": "한품질", "시공자점검직원": "이감독",
                "검측감리원": "박감리", "감리확인": "박감리", "시공확인": "이감독", "감독(감리)": "박감리", "진행자": "김철수", "측정자": "한품질", "시험자": "한품질", "검사자": "한품질"}


def _kv_spec(spec, label):
    kv = spec.get("kv") or {}
    for k, v in kv.items():
        if norm(k) == norm(label):
            return v
    return None


# ── 쪽 나눔(2026-09-29 오후) ──────────────────────────────────────────
# 여백 위아래 0.4in → A4 세로 784pt · 가로 537pt 가 한 쪽. 가로 폭은 24칸×3.6 = 450pt 라 줄지 않음(배율 1).
PH_PORT, PH_LAND = 842 - 58, 595 - 58
_PLANS = {}


def _ph(wide):
    return PH_LAND if wide else PH_PORT


def _units(p, wide):
    """인쇄 범위의 높이를 «쪽» 단위로(1.0 = 한 쪽 꽉)."""
    tot = sum((p.ws.row_dimensions[r].height or 15) for r in range(1, p.last_print + 1))
    return tot / _ph(wide)


def _page_y(p, wide):
    """지금 그릴 줄이 그 쪽에서 몇 pt 아래에서 시작하는지 — 엑셀·리브레처럼 «줄이 안 들어가면 통째로 다음 쪽»."""
    ph = _ph(wide)
    y = 0.0
    for r in range(1, p.r):
        h = p.ws.row_dimensions[r].height or 15
        if y + h > ph and y > 0:
            y = 0.0
        y += h
    return y


def _keep(p, wide, need):
    """need(pt) 만큼이 이 쪽에 안 들어가면(8pt 여유) 빈 줄로 채워 다음 쪽에서 시작 — 조항 제목·표 머리·서명이 홀로 남지 않게."""
    ph = _ph(wide)
    if need >= ph * 0.9:
        return
    y = _page_y(p, wide)
    rem = ph - y
    if y <= 0 or need <= rem - 8:
        return
    k = max(1, math.ceil(rem / 8))
    for _ in range(k):
        p.gap(rem / k)


def _refs(spec):
    """SPEC 수식이 줄 번호로 콕 집어 부르는 칸(#12 같은) — 그 줄은 지우면 안 됨."""
    mx = 0

    def walk(o):
        nonlocal mx
        if isinstance(o, str):
            for m in re.finditer(r"#(\d+)\}", o):
                mx = max(mx, int(m.group(1)))
        elif isinstance(o, dict):
            for k, v in o.items():
                if isinstance(k, tuple) and k and isinstance(k[0], int):
                    mx = max(mx, k[0])
                walk(v)
        elif isinstance(o, (list, tuple)):
            for v in o:
                walk(v)
    walk({k: v for k, v in spec.items() if k not in ("expect",)})
    return mx


def plan(form, spec):
    """한 서식(빈 서식 + 작성 예시 두 벌 같은 모양)의 쪽 계획:
       · 1.12쪽 넘으면 빈 줄을 줄여(원래 빈 줄의 40%까지만) 1.12쪽 안으로 → 한 장에 맞춤(글씨 89% 이상)
       · 그래도 넘으면 1.35쪽 안으로 → 한 장에 맞춤
       · 그래도 넘으면(계약서·긴 체크리스트) 여러 쪽 그대로 + 조항 제목·표 머리·서명이 쪽 끝에 홀로 남지 않게 빈 줄로 밀기"""
    key = id(spec)
    if key in _PLANS:
        return _PLANS[key]
    from fb import Book
    blocks = form["sheet"]["blocks"]
    has_cl = any(b["t"] == "cl" for b in blocks)

    def measure(nover):
        hs, infos = [], None
        for ex in (False, True):
            p, wide = _draw(Book("m"), ex, form, spec, nover, pad=False)
            hs.append(_units(p, wide))
            infos = infos or p.tinfo
        return max(hs), infos, wide
    H, infos, wide = measure({})
    pl = {"n": {}, "fit": None, "pad": False, "H0": round(H, 3)}
    if "fit_height" in spec:
        pl["pad"] = spec["fit_height"] != 1 and H > 1.0
        _PLANS[key] = pl
        return pl
    if H <= 1.0:
        pass
    elif H <= 1.12 or has_cl and H <= 1.35:
        pl["fit"] = 1
    else:
        ph = _ph(wide)
        ref = _refs(spec)
        cand = []
        for t in infos:
            if t["trim"]:
                lo = max(t["exn"] + 2, ref, t["pren"], math.ceil(t["n"] * 0.6), 4)
                if t["n"] > lo:
                    cand.append([t["ti"], t["n"], lo, t["hh"]])

        def trim_to(target):
            nov, h = {}, H
            cs = [c[:] for c in cand]
            while h > target:
                cs2 = [c for c in cs if c[1] > c[2]]
                if not cs2:
                    return None
                c = max(cs2, key=lambda c: (c[1] - c[2], c[1]))
                c[1] -= 1
                nov[c[0]] = c[1]
                h -= c[3] / ph
            return nov
        for target in (1.12, 1.35):
            if has_cl:
                break
            nov = trim_to(target)
            if nov is not None:
                H2, _, _ = measure(nov)
                if H2 <= target + 0.005:
                    pl.update(n=nov, fit=1, H1=round(H2, 3))
                    break
        if pl["fit"] is None:
            pl["pad"] = True
    _PLANS[key] = pl
    return pl


def draw_form(bk, ex, form, spec):
    pl = plan(form, spec)
    p, wide = _draw(bk, ex, form, spec, pl["n"], pad=pl["pad"])
    if pl["fit"]:
        p.ws.page_setup.fitToHeight = pl["fit"]
    p.plan = pl
    if not ex:
        p.after_note((spec.get("after") or []) + [
            "노란 칸 = 요율·기준값(발주기관 기준으로 고쳐 씀) · 옅은 하늘색 칸 = 자동 계산(지우지 마세요) · 뒤 시트에 «작성 예시» 가 있습니다.",
            "발주기관이 정한 서식이 있으면 그 서식을 쓰세요. 이 줄과 1행은 지워도 됩니다.",
        ])
    else:
        p.after_note(["이 시트는 작성 예시입니다(가상의 현장 · 이름 · 금액). 실제로는 앞 시트에 적으세요."])
    return p


def _draw(bk, ex, form, spec, nover, pad):
    blocks = form["sheet"]["blocks"]
    has_cl = any(b["t"] == "cl" for b in blocks)
    wide = spec.get("landscape", (not has_cl) and any(b["t"] == "table" and len(b["cols"]) >= 7 for b in blocks))
    name = form["title"] if not ex else "작성 예시"
    p = bk.page(name[:28] if not ex else name, [COLW] * COLS, ex=ex, landscape=wide, fit_height=spec.get("fit_height", 0),
                margins=(0.3, 0.3, 0.4, 0.4))
    p.tinfo = []
    keep = (lambda need: _keep(p, wide, need)) if pad else (lambda need: None)
    p.gap(6)
    p.row([(COLS, form["sheet"]["heading"], {"kind": "title", "size": 19})], h=38)
    p.gap(10)
    missing = []
    seen = {}
    si = 0
    ti = 0
    xi = 0
    for bi, b in enumerate(blocks):
        t = b["t"]
        if t == "kv":
            for label, val in b["rows"]:
                seen[norm(label)] = seen.get(norm(label), 0) + 1
                nth = seen[norm(label)]
                s = _kv_spec(spec, f"{label}#{nth}") if nth > 1 else None
                s = s or (_kv_spec(spec, label) if nth == 1 else None)
                d = EX_DEFAULT.get(norm(label))
                key = (s or {}).get("k") or (norm(label) + (str(nth) if nth > 1 else ""))
                if s and s.get("f"):
                    cell = F(key, s["f"], fmt=s.get("fmt"), align=s.get("align"))
                else:
                    if s is not None and "ex" in s:
                        exv = s["ex"]
                    else:
                        exv = d[0] if d else None
                    fmt = (s or {}).get("fmt") or (d[1] if d else None)
                    blank = (s or {}).get("blank", val or None)
                    if ex and exv is None and not (s or {}).get("opt"):
                        missing.append(label)
                    cell = I(key, ex=exv, blank=blank, fmt=fmt, rate=(s or {}).get("rate", False),
                             align=(s or {}).get("align"), dv=(s or {}).get("dv"))
                r = (s or {}).get("r")
                if r:        # 요율 칸(노란) + 금액 칸
                    rc = I(r["k"], ex=r.get("ex"), blank=r.get("blank"), fmt=r.get("fmt", "rate"), rate=True, align="center")
                    p.row([(6, "  " + label, {"kind": "label", "align": "left"}), (4, rc), (COLS - 10, cell)], minh=24)
                else:
                    p.row([(6, "  " + label, {"kind": "label", "align": "left"}), (COLS - 6, cell)], minh=24)
            p.gap(6)
        elif t == "text":
            nxt = blocks[bi + 1] if bi + 1 < len(blocks) else None
            if nxt is not None and nxt["t"] == "table":      # «■ 제목» 글은 뒤 표 머리 + 두 줄과 함께
                keep(26 + 6 + 24 + 2 * 22)
            elif nxt is not None and nxt["t"] == "sign":     # «위와 같이 …합니다» 는 서명과 함께
                keep(26 + 6 + 10 + 26 + 24 * len(nxt["who"]) + (18 if nxt.get("note") else 0))
            tf = (spec.get("text") or {}).get(xi)
            content = (F(f"글{xi}", tf, align="center", ink=False) if tf.startswith("=") else tf) if tf else b["text"]
            p.row([(COLS, content, {"kind": "cfree", "size": 10})], minh=26)
            xi += 1
            p.gap(6)
        elif t == "table":
            ts = (spec.get("tab") or [{}] * 99)[ti] if ti < len(spec.get("tab") or []) else (spec.get("tab_all") or {})
            _table(p, ex, b, ts, ti, nover, keep)
            ti += 1
            p.gap(6)
        elif t == "cl":
            per = max(20, int(COLS * COLW / 2.2))
            for head, body in b["items"]:
                if ex and (spec.get("cl_ex") or {}).get(head):
                    body = spec["cl_ex"][head]
                bh = 14.5 * (math.ceil(len(body) / per) + 1) if body else 0
                keep(20 + bh)                                  # 조항 제목과 본문은 한 쪽에
                p.row([(COLS, head, {"kind": "free", "bold": True, "size": 10.5})], h=20)
                if body:
                    cb = (spec.get("cl") or {}).get(head)
                    if cb:
                        p.row([(COLS, F(None, cb, align="left", ink=False), {"kind": "free", "valign": "top"})], h=bh)
                    else:
                        p.row([(COLS, body, {"kind": "free", "valign": "top"})], h=bh)
                p.gap(4)
            p.gap(6)
        elif t == "sign":
            sg = {norm(k): v for k, v in (spec.get("sign") or {}).items() if k != "date"}
            sg["date"] = (spec.get("sign") or {}).get("date", D(2026, 9, 29))
            keep(10 + 26 + 24 * len(b["who"]) + (18 if b.get("note") else 0))   # 날짜와 서명은 한 쪽에
            p.gap(10)
            si += 1
            sx = "" if si == 1 else str(si)
            p.date_line("서명일" + sx, ex=sg["date"])
            for who in b["who"]:
                exn = sg.get(norm(who))
                if exn is None:
                    base = norm(re.sub(r"\(.*?\)", "", who))
                    exn = SIGN_DEFAULT.get(base) or SIGN_DEFAULT.get(norm(who)) or "홍길동"
                p.row([(10, "", {"kind": "free"}), (6, who, {"kind": "free", "align": "right", "bold": True}),
                       (4, I("서명:" + norm(who) + sx, ex=exn, align="center"), {"border": False}),
                       (4, "(서명 또는 인)", {"kind": "free", "align": "center", "size": 8.5})], h=24)
            if b.get("note"):
                p.row([(COLS, b["note"], {"kind": "free", "align": "right", "size": 9})], h=18)
            p.gap(6)
    p.end_print()
    p.missing = missing
    return p, wide


def _table(p, ex, b, ts, ti, nover=None, keep=None):
    cols = b["cols"]
    spans = _spans(b.get("w") or [100 / len(cols)] * len(cols))
    keys = ts.get("cols") or [norm(c) for c in cols]
    assert len(keys) == len(cols), (cols, keys)
    fmt = ts.get("fmt") or {}
    calc = ts.get("calc") or {}
    first = ts.get("first") or {}
    dv = ts.get("dv") or {}
    exrows = ts.get("ex") or []
    pre_rows = b.get("rows") or []
    pre = ts.get("pre") or {}
    n = len(pre_rows) if pre_rows else ((nover or {}).get(ti) or ts.get("n") or b["n"])
    hh0 = ts.get("h") or 22
    p.tinfo.append({"ti": ti, "n": n, "trim": not pre_rows and not ts.get("n"), "exn": len(exrows),
                    "pren": max([len(v) for v in pre.values()] or [0]), "hh": hh0})
    if keep:                                           # 표 머리가 쪽 끝에 홀로 남지 않게(작은 표는 통째로)
        small = n <= 6
        keep(24 + (n if small else 2) * hh0 + (22 if small and (ts.get("sum") or ts.get("sum_calc")) else 0))
    kp = "" if ti == 0 else f"t{ti + 1}."          # 한 시트에 표가 여럿이면 두 번째 표부터 이름 앞에 t2. t3. …
    ks = set(keys)

    def loc(f):
        f = re.sub(r"\{([^{}#\[\]:]+)(#\d+|\[\])\}", lambda m: "{" + (kp if m.group(1) in ks else "") + m.group(1) + m.group(2) + "}", f)
        return re.sub(r"\{합:([^{}]+)\}", lambda m: "{합:" + (kp if m.group(1) in ks else "") + m.group(1) + "}", f)
    p.row([(sp, c, {"kind": "head"}) for c, sp in zip(cols, spans)], h=24)
    r0 = p.r
    per_w = max(16, int(spans[1 if len(spans) > 1 else 0] * COLW / 2.1))
    for i in range(1, n + 1):
        cells = []
        prow = (list(pre_rows[i - 1]) + [""] * len(cols))[:len(cols)] if pre_rows else [""] * len(cols)
        erow = exrows[i - 1] if (ex and i - 1 < len(exrows)) else None
        longest = 0
        for j, (key, sp) in enumerate(zip(keys, spans)):
            ck = f"{kp}{key}#{i}"
            ov = (ts.get("cells") or {}).get((i, key))

            def sub(f, i=i):
                f = re.sub(r"\{([^{}@]+)@-(\d+)\}", lambda m: "{" + f"{m.group(1)}#{i - int(m.group(2))}" + "}", f)
                return loc(re.sub(r"\{([^{}@]+)@\}", lambda m: "{" + f"{m.group(1)}#{i}" + "}", f))
            if ov is not None:
                if ov.get("f"):
                    cells.append((sp, F(ck, sub(ov["f"]), fmt=ov.get("fmt", fmt.get(key)), align=ov.get("align"))))
                else:
                    cells.append((sp, I(ck, ex=ov.get("ex"), blank=ov.get("blank"), fmt=ov.get("fmt", fmt.get(key)),
                                        rate=ov.get("rate", False), align=ov.get("align"))))
                continue
            f = first.get(key) if i == 1 and key in first else calc.get(key)
            if f:
                ff = sub(f)
                cells.append((sp, F(ck, ff, fmt=fmt.get(key), align=("center" if sp < 4 and not fmt.get(key) else None))))
                continue
            if prow[j]:
                pv = prow[j]
            elif key in pre and i - 1 < len(pre[key]):
                pv = pre[key][i - 1]
            else:
                pv = None
            ev = None
            if erow is not None:
                ev = erow.get(key) if isinstance(erow, dict) else (erow[j] if j < len(erow) else None)
            has_pre = bool(pre_rows) or any(i - 1 < len(v) for v in pre.values())
            if ex and ev is None and ts.get("ex_fill", {}).get(key) is not None and (has_pre or i <= len(exrows)):
                ev = ts["ex_fill"][key]
            if ev is None:
                ev = pv
            txt = pv if not ex else (ev if ev is not None else pv)
            if isinstance(txt, str) and not fmt.get(key):
                from fb import text_lines
                sz = 9 if sp >= 6 else 10
                longest = max(longest, text_lines(txt, sp * COLW * 10 / sz))
            cells.append((sp, I(ck, ex=ev, blank=pv, fmt=fmt.get(key), dv=dv.get(key),
                                align=("left" if sp >= 6 and not fmt.get(key) else ("center" if not fmt.get(key) else None)),
                                size=(9 if sp >= 6 else None))))
        hh = max(22, longest * 13 + 6) if longest > 1 else 22
        hh = ts.get("h") or hh
        p.row(cells, h=hh)
    r1 = p.r - 1
    # 열 전체 범위 이름
    c = 1
    from openpyxl.utils import get_column_letter as CL
    for key, sp in zip(keys, spans):
        p.k[f"{kp}{key}[]"] = f"{CL(c)}{r0}:{CL(c)}{r1}"
        c += sp
    sums = ts.get("sum") or []
    if sums or ts.get("sum_calc"):
        idx = [keys.index(s) for s in list(sums) + list(ts.get("sum_calc") or {})]
        lead = sum(spans[:min(idx)])
        cells = [(lead, ts.get("sum_label", "합        계"), {"kind": "sum"})]
        for j in range(min(idx), len(keys)):
            key = keys[j]
            if key in sums:
                cells.append((spans[j], F(f"합:{kp}{key}", f"=SUM({{{kp}{key}[]}})", fmt=fmt.get(key), bold=True)))
            elif key in (ts.get("sum_calc") or {}):
                cells.append((spans[j], F(f"합:{kp}{key}", loc(ts["sum_calc"][key]), fmt=fmt.get(key), bold=True)))
            else:
                cells.append((spans[j], "", {"kind": "sum"}))
        p.row(cells, h=22)
