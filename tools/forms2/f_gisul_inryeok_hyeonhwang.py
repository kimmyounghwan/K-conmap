# -*- coding: utf-8 -*-
"""건설기술인력보유현황표 — 새로 만든 서식 (2026-11-16 G724 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 적은 인원 · 등급별 인원(특급 · 고급 · 중급 · 초급 · 그 밖) · 자격증 번호 · 취득연월일 · 입사일을 안 적은 줄 · 제출(규칙 제22조 — 매년 2월 15일까지
     기성실적신고서에 붙임) · 아직 안 적은 칸
   · 현황표(건설산업기본법 시행규칙 [별지 제21호서식] <개정 2012.12.5> 칸 차례 그대로 — 세로 한 쪽 · 본문 20줄 · 원문처럼 줄 사이 가로선 없음).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 바깥 굵은 테 x 149~1090.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G724_건설기술인력보유현황표_원문.txt — 글층 해시 같음 확인):
  · 건설산업기본법 시행규칙 [시행 2026. 1. 2.] 제22조(건설공사실적 등의 제출) ① 시공능력평가를 받으려는 건설사업자는 매년 2월 15일까지 별지 제18호서식
    기성실적신고서를 냄 ② 붙일 서류 4. 별지 제21호서식에 따른 건설기술인력보유현황표
■ 짐작 안 함: 등급은 적은 글에 «특급 · 고급 · 중급 · 초급» 이 들었는지로만 셈 · 업종별 기술인력 등록기준은 셈하지 않음 · 주민등록번호는 예시에 0 으로만 ·
  원문 아래 «30300-09211일 97.7.3 승인» 은 옛 서식 승인 번호 — 원문 그대로 둠."""
import datetime

import sgw as g
from fb import F, I
from sgw import L

SLUG = "gisul-inryeok-hyeonhwang"
TITLE = "건설기술인력보유현황표"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "건설기술인력보유현황표(건설산업기본법 시행규칙 별지 제21호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "건설기술인력보유현황표 — 작성 예시 (일련번호가 저절로)"),
        (3, "① 인원 · 등급별 인원 · 빠진 칸 — 작성 예시")]
MULTI = True
SHORT = ("건설기술인력보유현황표(건설산업기본법 시행규칙 별지 제21호서식) — 기술인력을 한 줄씩 적으면 일련번호 · 인원 · 등급별 인원이 저절로 셈되고, "
         "자격증 번호 · 취득연월일을 빠뜨린 줄을 알려 줍니다. 시공능력평가 때 기성실적신고서에 붙입니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
NR = 20
GRADES = ["특급", "고급", "중급", "초급"]
JE = "시공능력평가를 받으려면 매년 2월 15일까지 건설공사 기성실적신고서(별지 제18호서식)에 이 현황표를 붙여 냄(건설산업기본법 시행규칙 제22조제1항 · 제2항제4호)"
IN_A, IN_B = "적은 인원 ", "명"
BB_OK = "✓ 적은 줄의 자격증 번호 · 취득연월일 · 입사일을 다 적었습니다"
BB_A = "⚠ 빠진 칸이 있는 줄(일련번호): "
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX_R = [("정민호", "000000-0000000", D(2019, 3, 4), "토목", "특급", "00-0-00000", D(2008, 5, 30)),
        ("한소영", "000000-0000000", D(2021, 7, 1), "건축", "고급", "00-0-00000", D(2012, 11, 23)),
        ("이가람", "000000-0000000", D(2022, 2, 14), "토목", "중급", "00-0-00000", D(2016, 8, 19)),
        ("최지훈", "000000-0000000", D(2024, 9, 2), "건축", "초급", "00-0-00000", D(2020, 6, 5)),
        ("서다온", "000000-0000000", D(2025, 3, 17), "토목", "초급", "00-0-00000", D(2023, 9, 1))]
EX_S = {}
for _i, _r in enumerate(EX_R, 1):
    for _k, _v in zip(("성명", "주민", "입사", "종목", "등급", "자격번호", "취득"), _r):
        EX_S[f"{_k}#{_i}"] = _v
EX_S["비고#3"] = "현장 배치"
EX = {}
HEAD = "[별지 제21호서식] <개정 2012.12.5>"


def _e(ex, k):
    return EX_S.get(k) if ex else None


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(149, 1090)
X1, X2 = 149, 1090
CX = [149, 214, 313, 476, 576, 681, 774, 874, 995, 1090]      # 일련번호 · 성명 · 주민 · 입사일 · 종목 · 등급 · 자격증 번호 · 취득연월일 · 비고


def prow(p, items, h):
    r = p.r
    cells = []
    c = 1
    for it in items:
        a, b = GX.cols(it[0], it[1])
        assert b >= a, (p.name, r, it[:2])
        while (r, c) in p.occ:
            c += 1
        assert c == a, f"[{p.name}] {r}행 칸 자리 {c} ≠ {a} (x {it[0]})"
        cells.append((b - a + 1,) + tuple(it[2:]))
        c = b + 1
    return p.row(cells, h=h)


def _bd(p, r1, r2, x1, x2, top=True, bot=True, left=True, right=True, side=None):
    from openpyxl.styles import Border
    from fb import LINE
    sd = side or LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            b = p.ws.cell(row=r, column=c).border
            p.ws.cell(row=r, column=c).border = Border(left=sd if (left and c == c1) else b.left, right=sd if (right and c == c2) else b.right,
                                                       top=sd if (top and r == r1) else b.top, bottom=sd if (bot and r == r2) else b.bottom)


HD = {"kind": "ctext", "size": 9}
NB = {"border": False}


def _row_has(i):
    return f'{{현황표!성명#{i}}}<>""'


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  건설기술인력보유현황표 — 인원 · 등급 · 빠진 칸 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ " + JE)
    g.sec(p, "㉮  인원 · 등급별 인원", need=24 * 7 + 10)
    cnt = "(" + "+".join(f"IF({_row_has(i)},1,0)" for i in range(1, NR + 1)) + ")"
    p.row([(3, "적은 인원", L), (2, F("인원수", f"={cnt}", fmt='0"명"', align="center", size=9)),
           (7, F("인원", f'=IF({{인원수}}=0,"","{IN_A}"&{{인원수}}&"{IN_B}")', align="left", size=9))], h=22)
    for j, gname in enumerate(GRADES):
        # 한 줄은 한 등급만 — 앞 등급(특급 → 고급 → 중급 → 초급)이 들었으면 뒤 등급으로 셈하지 않음(수식 8,192자 안 — 등급마다 칸 하나)
        nots = "".join(f',NOT(ISNUMBER(SEARCH("{q}",{{현황표!등급#{{i}}}})))' for q in GRADES[:j])
        gf = "=" + "+".join(f'IF(AND({_row_has(i)},ISNUMBER(SEARCH("{gname}",{{현황표!등급#{i}}})){nots.replace("{i}", str(i))}),1,0)'
                            for i in range(1, NR + 1))
        assert len(gf) < 8000, (gname, len(gf))
        p.row([(3, gname, L), (2, F(f"등급수#{j + 1}", gf, fmt='0"명"', align="center", size=9)), (7, "", {"kind": "text", "size": 7})], h=22)
    oth = "{인원수}-" + "-".join(f"{{등급수#{j + 1}}}" for j in range(len(GRADES)))
    gtxt = "&".join(f'"{gname} "&{{등급수#{j + 1}}}&"명 · "' for j, gname in enumerate(GRADES)) + f'&"그 밖 "&({oth})&"명"'
    p.row([(3, "등급별", L), (9, F("등급별", f'=IF({{인원수}}=0,"",{gtxt})', align="left", size=9))], h=24)
    p.row([(3, "", L), (9, "※ 등급 칸 글에 든 «특급 · 고급 · 중급 · 초급» 으로 셈 — 한 줄은 한 등급만(앞 등급 먼저) · 그 밖 = 등급 글이 없는 줄", {"kind": "text", "size": 7})])
    g.sec(p, "㉯  빠진 칸 (자격증 번호 · 취득연월일 · 입사일)", need=40 + 10)
    miss = "&".join(f'IF(AND({_row_has(i)},OR({{현황표!자격번호#{i}}}="",N({{현황표!취득#{i}}})=0,N({{현황표!입사#{i}}})=0))," {i}","")'
                    for i in range(1, NR + 1))
    p.row([(3, "빠진 칸", L), (9, F("빠짐", f'=IF({{인원수}}=0,"",IF(({miss})="","{BB_OK}","{BB_A}"&({miss})))', align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 현황표 일련번호는 성명을 적은 줄에 저절로 매겨집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 사람 · 번호 — 주민등록번호 · 자격증 번호는 0 으로만)."])
    return p


# ── 현황표 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    from openpyxl.styles import Side
    p = g.pg(bk, ex, "현황표", fit=1, widths=WP)
    thick = Side(style="medium", color="000000")
    prow(p, [(X1, X2, HEAD, {"kind": "free", "size": 9})], h=16)
    rt = prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=26)
    r1 = prow(p, [(CX[0], CX[1], "일련\n번호", dict(HD, rs=2)), (CX[1], CX[2], "성    명", dict(HD, rs=2)), (CX[2], CX[3], "주민등록번호", dict(HD, rs=2)),
                  (CX[3], CX[4], "입사일", dict(HD, rs=2)), (CX[4], CX[8], "자  격  내  용", HD), (CX[8], CX[9], "비고", dict(HD, rs=2))], h=26)
    prow(p, [(CX[4], CX[5], "종    목", HD), (CX[5], CX[6], "등    급", HD), (CX[6], CX[7], "자격증\n번    호", HD), (CX[7], CX[8], "취득\n연월일", HD)], h=45)
    rh = 516.0 / NR
    rows = []
    for i in range(1, NR + 1):
        its = [(CX[0], CX[1], F(f"번호#{i}", f'=IF({{성명#{i}}}="","",{i})', align="center", size=8.5), NB),
               (CX[1], CX[2], I(f"성명#{i}", ex=_e(ex, f"성명#{i}"), align="center", size=8.5), NB),
               (CX[2], CX[3], I(f"주민#{i}", ex=_e(ex, f"주민#{i}"), align="center", size=8), NB),
               (CX[3], CX[4], I(f"입사#{i}", ex=_e(ex, f"입사#{i}"), fmt=DT, align="center", size=8), NB),
               (CX[4], CX[5], I(f"종목#{i}", ex=_e(ex, f"종목#{i}"), align="center", size=8), NB),
               (CX[5], CX[6], I(f"등급#{i}", ex=_e(ex, f"등급#{i}"), align="center", size=8), NB),
               (CX[6], CX[7], I(f"자격번호#{i}", ex=_e(ex, f"자격번호#{i}"), align="center", size=7.5), NB),
               (CX[7], CX[8], I(f"취득#{i}", ex=_e(ex, f"취득#{i}"), fmt=DT, align="center", size=8), NB),
               (CX[8], CX[9], I(f"비고#{i}", ex=_e(ex, f"비고#{i}"), align="center", size=7.5), NB)]
        rows.append(prow(p, its, h=rh))
    rb = rows[-1]
    # 원문처럼 본문 줄 사이 가로선 없음 — 세로선(칸 경계)만
    for a, b in zip(CX[:-1], CX[1:]):
        _bd(p, rows[0], rb, a, b, top=False, bot=False)
    _bd(p, rows[0], rb, X1, X2, top=True, bot=False, left=False, right=False)
    # 바깥 굵은 테
    _bd(p, rt, rb, X1, X2, side=thick)
    nb = prow(p, [(X1, 520, "30300-09211일\n97. 7. 3 승인", {"kind": "free", "size": 8}), (520, 840, "", {"kind": "free", "size": 6}),
                  (840, X2, "210mm×297mm\n(신문용지 54g/㎡)", {"kind": "free", "size": 8, "align": "right"})], h=30)
    p.end_print()
    p.after_note(["일련번호는 성명을 적은 줄에 저절로 매겨집니다. 20명을 넘으면 같은 서식을 한 장 더 씁니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def expect(pages):
    sg = pages["현황표"]
    a, b = {}, {}
    has = [bool(sg.get(f"성명#{i}")) for i in range(1, NR + 1)]
    n = sum(has)
    a["인원수"] = n
    a["인원"] = "" if n == 0 else f"{IN_A}{n}{IN_B}"
    gc = []
    for j, gname in enumerate(GRADES):
        gc.append(sum(1 for i in range(1, NR + 1) if has[i - 1] and gname in str(sg.get(f"등급#{i}") or "")
                      and not any(q in str(sg.get(f"등급#{i}") or "") for q in GRADES[:j])))
        a[f"등급수#{j + 1}"] = gc[-1]
    a["등급별"] = "" if n == 0 else "".join(f"{gname} {c}명 · " for gname, c in zip(GRADES, gc)) + f"그 밖 {n - sum(gc)}명"
    miss = "".join(f" {i}" for i in range(1, NR + 1)
                   if has[i - 1] and (not sg.get(f"자격번호#{i}") or not _d(sg.get(f"취득#{i}")) or not _d(sg.get(f"입사#{i}"))))
    a["빠짐"] = "" if n == 0 else (BB_OK if not miss else BB_A + miss)
    for i in range(1, NR + 1):
        b[f"번호#{i}"] = i if has[i - 1] else ""
    return {"셈": a, "현황표": b}


for _t in (IN_A, IN_B, BB_OK, BB_A, BIN_OK, BIN_A, *GRADES):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
