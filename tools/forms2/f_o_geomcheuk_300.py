# -*- coding: utf-8 -*-
"""검측체크리스트(400여 공종) — 원본(한글에서 엑셀로 옮긴 682쪽, 공종 CODE · 위치 · 공종 · 공사량 · 검사항목 · 검사기준 · 합격/불합격 · 조치사항 ·
시공자 점검 / 감리원 검측)을 같은 틀로 새로 만든 것 (2026-09-29).
■ 검사항목 글은 원본 그대로(줄바꿈도 원본대로) — 한 체크리스트가 여러 쪽으로 이어지던 것은 번호가 이어지면 한 장으로 모음.
  원본 목차(121~522번)와 본문 차례가 어긋나 본문 차례대로 1번부터 다시 매김(426가지 · 3,295항목). 목차 시트에서 누르면 그 체크리스트로 감.
■ 바로잡은 글자: «표충 · 기충 · 선택충 · 보조기충 · 첫충 · 다짐충 · 지충 · 토사충 · 보호충 · 사석충» → «…층»(원본의 한글 변환 오타). 번호 없이 끊겨
  들어간 줄은 앞 항목에 붙임. 빈 «검사기준» 칸은 적을 수 있게 비워 둠(원본도 비어 있음).
■ 수식(체크리스트마다): 합격 · 불합격 건수 · 종합(전 항목 합격 / 미확인 n건 / 불합격 n건 — 조치 후 재검측) · 한 항목에 둘 다 표시 · 불합격인데 조치사항 빔 ·
  검측일이 점검일보다 빠름 — SHEET PILE 검측체크리스트와 같은 틀."""
import datetime
import json
import os

import docw as d
from fb import F, I, text_lines

SLUG = "o-geomcheuk-300"
TITLE = "검측체크리스트(300여 공종)"
WHERE = "orig"
PREV = [(1, "목차 — 누르면 그 체크리스트로 감"), (12, "관로공사 · 관부설공 — 빈 서식"), (473, "관로공사 · 관부설공 — 작성 예시"),
        (474, "철근공 · 철근가공, 조립 — 작성 예시")]
PAGES = 472
NSHEETS = 2
MULTI = True
SHORT = ("토목 · 건축 · 전기 · 기계 400여 공종(426가지)의 검측 체크리스트를 한 파일에 — 목차에서 누르면 그 공종으로 가고, 합격 · 불합격을 ○ 로 고르면 "
         "건수 · 종합이 저절로 나오며 불합격인데 조치사항이 비었으면 알려 줍니다.")
NOTE = "검사항목 글은 원본 그대로입니다(한글 변환 오타 «표충 · 기충» 등만 «층» 으로 바로잡음). 원본 목차 번호와 본문 차례가 어긋나 본문 차례대로 다시 매겼습니다."

D = datetime.date
W = [5, 39, 13, 7, 7, 14, 5]
N = 7
L = {"kind": "label"}
HD = {"kind": "head"}
DATA = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "o-geomcheuk-300.json"), encoding="utf-8"))
SHEET = "검측체크리스트"
# 작성 예시 — 두 가지 체크리스트(번호, 머리, 불합격 항목 {번호: 조치}, 미확인 항목, 날짜)
EXS = [(1, ("T-01-01", "STA.0+000 ~ 0+180", "D600 흄관 180m"), {3: "관계기관(하천) 협의 공문 받음(4/2) — 다시 확인"}, set(), (D(2026, 4, 1), D(2026, 4, 3))),
       (None, ("C-02-05", "배수박스 B1 구간", "철근 12.4t"), {}, {9, 10}, (D(2026, 4, 8), D(2026, 4, 8)))]


def _ex_index():
    """두 번째 예시는 «철근공» 체크리스트(없으면 10번)"""
    for o in DATA:
        if o["name"].startswith("철근공"):
            return o["n"]
    return 10


def form(p, j, name, items, ex=None):
    """체크리스트 한 장. ex = (머리, 불합격, 미확인, 날짜) 또는 None"""
    head, fail, skip, dates = ex if ex else ((None,) * 3, {}, set(), (None, None))
    p.row([(N, "검 측  체 크 리 스 트", {"kind": "title", "size": 18})], h=38)
    p.gap(4)
    p.row([(2, "공종 CODE №", L), (1, I(f"코드{j}", ex=head[0], align="center")), (2, "위치 및 부위", L), (2, I(f"위치{j}", ex=head[1], size=9))], h=26)
    nl = name.count("\n") + 1
    p.row([(2, "공종(세부공종)", L), (5, name, {"kind": "text", "size": 10, "bold": True})], h=max(26, nl * 14 + 8))
    p.row([(2, "공   사   량", L), (5, I(f"공사량{j}", ex=head[2], size=9.5))], h=24)
    p.gap(6)
    p.row([(2, "검 사 항 목", dict(HD, rs=2)), (1, "검 사 기 준\n(시방서 또는 도면 등)", dict(HD, rs=2, size=9)), (2, "검 사 결 과", HD),
           (2, "조 치 사 항", dict(HD, rs=2))], h=22)
    p.row([(1, "합 격", HD), (1, "불합격", HD)], h=20, start=4)
    n = len(items)
    for i, t in enumerate(items, 1):
        lines = text_lines(t, W[1] * 10.0 / 9.5)
        h = max(24, lines * 9.5 * 1.32 + 6)
        d.keep(p, h + (0 if i < n else 26 + 17 + 6 + 60 + 17))
        ok = ex is not None and i not in fail and i not in skip
        p.row([(1, f"{i}.", {"kind": "ctext", "size": 9.5, "valign": "top"}), (1, t, {"kind": "text", "size": 9.5, "valign": "top"}),
               (1, I(f"기준{j}#{i}", size=8.5)),
               (1, I(f"합{j}#{i}", ex="○" if ok else None, dv="○", align="center", size=12)),
               (1, I(f"불{j}#{i}", ex="○" if (ex is not None and i in fail) else None, dv="○", align="center", size=12)),
               (2, I(f"조{j}#{i}", ex=fail.get(i) if ex else None, size=8.5))], h=h)
    for k in ("합", "불", "조"):
        p.k[f"{k}{j}[]"] = f"{p.k[f'{k}{j}#1']}:{p.k[f'{k}{j}#{n}']}"
    a, x = f"{{합수{j}}}", f"{{불수{j}}}"
    p.row([(3, "계", {"kind": "sum"}), (1, F(f"합수{j}", f'=COUNTIF({{합{j}[]}},"○")', fmt='0"건";-0"건";""', align="center", bold=True)),
           (1, F(f"불수{j}", f'=COUNTIF({{불{j}[]}},"○")', fmt='0"건";-0"건";""', align="center", bold=True)),
           (2, F(f"종합{j}", f'=IF({a}+{x}=0,"",IF({x}>0,"불합격 "&{x}&"건 — 조치 후 재검측",IF({a}<{n},"미확인 "&({n}-{a})&"건","전 항목 합격")))',
                 align="center", bold=True, size=9))], h=26)
    rg = (f"{{합{j}[]}}", f"{{불{j}[]}}", f"{{조{j}[]}}")
    p.row([(N, F(f"경고{j}", f'=IF(COUNTIFS({rg[0]},"○",{rg[1]},"○")>0,"⚠ 한 항목에 합격·불합격을 함께 표시한 곳이 "&COUNTIFS({rg[0]},"○",{rg[1]},"○")&"곳 있습니다.",'
                             f'IF(COUNTIFS({rg[1]},"○",{rg[2]},"")>0,"⚠ 불합격 항목 "&COUNTIFS({rg[1]},"○",{rg[2]},"")&"건의 조치사항을 적으세요.",""))', align="left"),
            {"kind": "warn"})], h=17)
    p.gap(6)
    blank_d = "20     .     .     ."
    p.row([(2, "시공자 점검일자", L), (1, I(f"점검일{j}", ex=dates[0], fmt="ymd", blank=blank_d, align="center", size=9.5)), (2, "점 검 직 원", L),
           (1, I(f"점검자{j}", ex="이공무" if ex else None, align="center")), (1, "(인)", {"kind": "ctext", "size": 9})], h=30)
    p.row([(2, "감리원 검측일자", L), (1, I(f"검측일{j}", ex=dates[1], fmt="ymd", blank=blank_d, align="center", size=9.5)), (2, "검측감리원", L),
           (1, I(f"감리{j}", ex="김감리" if ex else None, align="center")), (1, "(인)", {"kind": "ctext", "size": 9})], h=30)
    p.row([(N, F(f"일자경고{j}", f'=IF(AND(N({{점검일{j}}})>0,N({{검측일{j}}})>0,{{검측일{j}}}<{{점검일{j}}}),"⚠ 감리원 검측일이 시공자 점검일보다 빠릅니다 — 날짜를 확인하세요.","")',
                 align="left"), {"kind": "warn"})], h=17)


def checklists(bk, ex):
    p = bk.page(SHEET, W, ex=ex, fit_height=0, sheetname=SHEET if not ex else "예시-" + SHEET, margins=(0.5, 0.5, 0.45, 0.45))
    p.dv_list("○", ["○"])
    rows = {}
    if not ex:
        for o in DATA:
            if o["n"] > 1:
                p.__dict__.setdefault("_brk", set()).add(p.r)
            rows[o["n"]] = p.r
            form(p, o["n"], o["name"], o["items"])
    else:
        for k, (jn, head, fail, skip, dates) in enumerate(EXS):
            jn = jn or _ex_index()
            o = DATA[jn - 1]
            if k:
                p.__dict__.setdefault("_brk", set()).add(p.r)
            form(p, jn, o["name"], o["items"], ex=(head, fail, skip, dates))
    d.done(p)
    p.after_note(["합격 · 불합격 칸은 목록에서 ○ 를 고르세요(지우려면 Delete). 검사기준 · 공종 CODE · 위치 · 공사량은 현장에 맞게 적으세요.",
                  "필요한 체크리스트만 인쇄하려면 «목차» 에서 눌러 가서 그 쪽만 인쇄하세요(인쇄 → 페이지 지정)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 사람) — 두 가지 체크리스트만 채워 보았습니다."])
    return p, rows


def mokcha(bk, rows):
    Wm = [7, 60, 9, 14]
    p = bk.page("목차", Wm, ex=False, fit_height=0, sheetname="목차", margins=(0.5, 0.5, 0.45, 0.45))
    p.row([(4, "검 측 체 크 리 스 트  목 차", {"kind": "title", "size": 18})], h=36)
    p.row([(4, f"모두 {len(DATA)}가지 · {sum(len(o['items']) for o in DATA):,}항목 — 공종 이름을 누르면 그 체크리스트로 갑니다.", {"kind": "sub", "size": 9.5})], h=18)
    p.row([(1, "번호", HD), (1, "공종(세부공종)", HD), (1, "항목 수", HD), (1, "바로가기", HD)], h=24)
    p.ws.print_title_rows = f"{p.r - 1}:{p.r - 1}"
    for o in DATA:
        r = p.r
        nm = o["name"].replace("\n", "  ·  ")
        p.row([(1, o["n"], {"kind": "ctext", "size": 9}), (1, nm, {"kind": "text", "size": 9.5}), (1, len(o["items"]), {"kind": "ctext", "size": 9}),
               (1, "→ 가기", {"kind": "ctext", "size": 9})], h=18)
        for c in (2, 4):
            cell = p.ws.cell(row=r, column=c)
            cell.hyperlink = f"#'{SHEET}'!A{rows[o['n']]}"
            cell.font = cell.font.copy(color="1D4ED8", underline="single")
    d.done(p)
    p.after_note(["원본 목차(121~522번)는 본문 차례와 어긋나(예: 142번 자리에 «강선설치» 가 먼저 나옴) 본문 차례대로 다시 매겼습니다."])
    return p


def draw(bk, ex):
    p, rows = checklists(bk, ex)
    if not ex:
        mokcha(bk, rows)
        wb = bk.wb
        wb._sheets = [wb["목차"], wb[SHEET]] + [s for s in wb._sheets if s.title not in ("목차", SHEET)]


def _one(inp, j, n):
    ok = sum(1 for i in range(1, n + 1) if inp.get(f"합{j}#{i}") == "○")
    ng = sum(1 for i in range(1, n + 1) if inp.get(f"불{j}#{i}") == "○")
    both = sum(1 for i in range(1, n + 1) if inp.get(f"합{j}#{i}") == "○" and inp.get(f"불{j}#{i}") == "○")
    nofix = sum(1 for i in range(1, n + 1) if inp.get(f"불{j}#{i}") == "○" and not inp.get(f"조{j}#{i}"))
    if ok + ng == 0:
        tot = ""
    elif ng:
        tot = f"불합격 {ng}건 — 조치 후 재검측"
    elif ok < n:
        tot = f"미확인 {n - ok}건"
    else:
        tot = "전 항목 합격"
    warn = (f"⚠ 한 항목에 합격·불합격을 함께 표시한 곳이 {both}곳 있습니다." if both else
            f"⚠ 불합격 항목 {nofix}건의 조치사항을 적으세요." if nofix else "")
    d1, d2 = inp.get(f"점검일{j}"), inp.get(f"검측일{j}")
    if isinstance(d1, str) or isinstance(d2, str):
        dw = ""
    else:
        dw = "⚠ 감리원 검측일이 시공자 점검일보다 빠릅니다 — 날짜를 확인하세요." if (d1 and d2 and d2 < d1) else ""
    return {f"합수{j}": ok, f"불수{j}": ng, f"종합{j}": tot, f"경고{j}": warn, f"일자경고{j}": dw}


def expect(pages):
    inp = pages[SHEET]
    out = {}
    for jn, *_r in EXS:
        jn = jn or _ex_index()
        out.update(_one(inp, jn, len(DATA[jn - 1]["items"])))
    return {SHEET: out}
