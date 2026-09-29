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
                "관리감독자": "이감독", "품질관리자": "한품질", "공무": "오공무"}


def _kv_spec(spec, label):
    kv = spec.get("kv") or {}
    for k, v in kv.items():
        if norm(k) == norm(label):
            return v
    return None


def draw_form(bk, ex, form, spec):
    blocks = form["sheet"]["blocks"]
    has_cl = any(b["t"] == "cl" for b in blocks)
    wide = spec.get("landscape", (not has_cl) and any(b["t"] == "table" and len(b["cols"]) >= 7 for b in blocks))
    name = form["title"] if not ex else "작성 예시"
    p = bk.page(name[:28] if not ex else name, [COLW] * COLS, ex=ex, landscape=wide, fit_height=spec.get("fit_height", 0),
                margins=(0.3, 0.3, 0.4, 0.4))
    p.gap(6)
    p.row([(COLS, form["sheet"]["heading"], {"kind": "title", "size": 19})], h=38)
    p.gap(10)
    missing = []
    ti = 0
    xi = 0
    for b in blocks:
        t = b["t"]
        if t == "kv":
            for label, val in b["rows"]:
                s = _kv_spec(spec, label)
                d = EX_DEFAULT.get(norm(label))
                key = (s or {}).get("k") or norm(label)
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
                    cell = I(key, ex=exv, fmt=fmt, blank=blank, rate=(s or {}).get("rate", False),
                             align=(s or {}).get("align"), dv=(s or {}).get("dv"))
                r = (s or {}).get("r")
                if r:        # 요율 칸(노란) + 금액 칸
                    rc = I(r["k"], ex=r.get("ex"), blank=r.get("blank"), fmt=r.get("fmt", "rate"), rate=True, align="center")
                    p.row([(6, "  " + label, {"kind": "label", "align": "left"}), (4, rc), (COLS - 10, cell)], minh=24)
                else:
                    p.row([(6, "  " + label, {"kind": "label", "align": "left"}), (COLS - 6, cell)], minh=24)
            p.gap(6)
        elif t == "text":
            tf = (spec.get("text") or {}).get(xi)
            content = F(f"글{xi}", tf, align="center", ink=False) if tf else b["text"]
            p.row([(COLS, content, {"kind": "cfree", "size": 10})], minh=26)
            xi += 1
            p.gap(6)
        elif t == "table":
            ts = (spec.get("tab") or [{}] * 99)[ti] if ti < len(spec.get("tab") or []) else {}
            _table(p, ex, b, ts, ti)
            ti += 1
            p.gap(6)
        elif t == "cl":
            per = max(20, int(COLS * COLW / 2.2))
            for head, body in b["items"]:
                p.row([(COLS, head, {"kind": "free", "bold": True, "size": 10.5})], h=20)
                if body:
                    cb = (spec.get("cl") or {}).get(head)
                    if cb:
                        p.row([(COLS, F(None, cb, align="left", ink=False), {"kind": "free", "valign": "top"})],
                              h=14.5 * (math.ceil(len(body) / per) + 1))
                    else:
                        p.row([(COLS, body, {"kind": "free", "valign": "top"})], h=14.5 * (math.ceil(len(body) / per) + 1))
                p.gap(4)
            p.gap(6)
        elif t == "sign":
            sg = spec.get("sign") or {}
            p.gap(10)
            p.date_line("서명일", ex=sg.get("date", D(2026, 9, 29)))
            for who in b["who"]:
                exn = sg.get(who)
                if exn is None:
                    base = norm(re.sub(r"\(.*?\)", "", who))
                    exn = SIGN_DEFAULT.get(base) or SIGN_DEFAULT.get(norm(who)) or "홍길동"
                p.row([(10, "", {"kind": "free"}), (6, who, {"kind": "free", "align": "right", "bold": True}),
                       (4, I("서명:" + norm(who), ex=exn, align="center"), {"border": False}),
                       (4, "(서명 또는 인)", {"kind": "free", "align": "center", "size": 8.5})], h=24)
            if b.get("note"):
                p.row([(COLS, b["note"], {"kind": "free", "align": "right", "size": 9})], h=18)
            p.gap(6)
    p.end_print()
    # 한 장에 거의 들어가면(1.35쪽 이하) 한 장으로 맞춤 — 두 번째 쪽에 서명만 넘어가는 일을 막음
    if "fit_height" not in spec:
        tot_h = sum((p.ws.row_dimensions[r].height or 15) for r in range(1, p.last_print + 1))
        wpt = COLS * COLW * 7 * 0.75
        pw, ph = (842 - 43, 595 - 58) if wide else (595 - 43, 842 - 58)
        sc = min(1.0, pw / wpt)
        if tot_h * sc / ph <= 1.35:
            p.ws.page_setup.fitToHeight = 1
    if not ex:
        p.after_note((spec.get("after") or []) + [
            "노란 칸 = 요율·기준값(발주기관 기준으로 고쳐 씀) · 옅은 하늘색 칸 = 자동 계산(지우지 마세요) · 뒤 시트에 «작성 예시» 가 있습니다.",
            "발주기관이 정한 서식이 있으면 그 서식을 쓰세요. 이 줄과 1행은 지워도 됩니다.",
        ])
    else:
        p.after_note(["이 시트는 작성 예시입니다(가상의 현장 · 이름 · 금액). 실제로는 앞 시트에 적으세요."])
    p.missing = missing
    return p


def _table(p, ex, b, ts, ti):
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
    n = len(pre_rows) if pre_rows else (ts.get("n") or b["n"])
    p.row([(sp, c, {"kind": "head"}) for c, sp in zip(cols, spans)], h=24)
    r0 = p.r
    per_w = max(16, int(spans[1 if len(spans) > 1 else 0] * COLW / 2.1))
    for i in range(1, n + 1):
        cells = []
        prow = (list(pre_rows[i - 1]) + [""] * len(cols))[:len(cols)] if pre_rows else [""] * len(cols)
        erow = exrows[i - 1] if (ex and i - 1 < len(exrows)) else None
        longest = 0
        for j, (key, sp) in enumerate(zip(keys, spans)):
            ck = f"{key}#{i}"
            ov = (ts.get("cells") or {}).get((i, key))

            def sub(f, i=i):
                f = re.sub(r"\{([^{}@]+)@-1\}", lambda m: "{" + f"{m.group(1)}#{i - 1}" + "}", f)
                return re.sub(r"\{([^{}@]+)@\}", lambda m: "{" + f"{m.group(1)}#{i}" + "}", f)
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
            if ex and ev is None and ts.get("ex_fill", {}).get(key) is not None and (pre_rows or i <= len(exrows)):
                ev = ts["ex_fill"][key]
            if ev is None:
                ev = pv
            longest = max(longest, len(str(pv or ev or "")))
            cells.append((sp, I(ck, ex=ev, blank=pv, fmt=fmt.get(key), dv=dv.get(key),
                                align=("left" if sp >= 6 and not fmt.get(key) else ("center" if not fmt.get(key) else None)),
                                size=(9 if sp >= 6 else None))))
        hh = 22 if longest <= per_w else 14.5 * (math.ceil(longest / per_w) + 1)
        p.row(cells, h=hh)
    r1 = p.r - 1
    # 열 전체 범위 이름
    c = 1
    from openpyxl.utils import get_column_letter as CL
    for key, sp in zip(keys, spans):
        p.k[f"{key}[]"] = f"{CL(c)}{r0}:{CL(c)}{r1}"
        c += sp
    sums = ts.get("sum") or []
    if sums:
        idx = [keys.index(s) for s in sums]
        lead = sum(spans[:min(idx)])
        cells = [(lead, ts.get("sum_label", "합        계"), {"kind": "sum"})]
        for j in range(min(idx), len(keys)):
            key = keys[j]
            if key in sums:
                cells.append((spans[j], F(f"합:{key}", f"=SUM({{{key}[]}})", fmt=fmt.get(key), bold=True)))
            elif key in (ts.get("sum_calc") or {}):
                cells.append((spans[j], F(f"합:{key}", ts["sum_calc"][key], fmt=fmt.get(key), bold=True)))
            else:
                cells.append((spans[j], "", {"kind": "sum"}))
        p.row(cells, h=22)
