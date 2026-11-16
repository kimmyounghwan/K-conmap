# -*- coding: utf-8 -*-
"""작업중지명령([ ]전부 [ ]일부) 해제신청서 — 새로 만든 서식 (2026-11-16 G709 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 해제 범위(전부 · 일부 → 제목 [√]) · 근로자 의견 확인(규칙 제69조제2항) · 심의위원회 개최 기한(규칙 제69조제3항 — 해제요청일 다음 날부터 4일 이내) ·
     아직 안 적은 칸 · 신청서(산업안전보건법 시행규칙 [별지 제29호서식] 칸 차례 그대로 — 세로 한 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1122.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G709_작업중지해제_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 시행규칙 [시행 2026. 8. 1.] 제69조(작업중지의 해제) ① 별지 제29호서식 · 관할 지방고용노동관서의 장 ② 미리 해당작업 근로자 의견 ③ 해제요청일
    다음 날부터 4일 이내(토요일 · 공휴일 포함 — 토요일과 공휴일이 이어지면 3일까지만) 심의위원회 · 제70조(작업중지해제 심의위원회 — 4명 이상 · 개선되었다고 의결하면 즉시 해제)
■ 짐작 안 함: 4일은 달력 날로 셈(토 · 일요일 포함 — 원문 규정) · 공휴일이 토 · 일과 이어져 넷 이상 쉬는 경우(3일까지만 포함)는 글로만 알림 ·
  처리절차 화살표는 원문 글층 «‣» 대신 그림처럼 «▶»."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "jakeop-jungji-haeje"
TITLE = "작업중지명령 해제신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "작업중지명령 해제신청서(산업안전보건법 시행규칙 별지 제29호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "작업중지명령 해제신청서 — 작성 예시 (제목 [√] 가 ① 장에서 저절로)"),
        (3, "① 해제 범위 · 근로자 의견 · 심의위원회 개최 기한(4일) — 작성 예시")]
MULTI = True
SHORT = ("작업중지명령 해제신청서(산업안전보건법 시행규칙 별지 제29호서식) — 전부 · 일부를 고르면 제목 [√] 가 들어가고, 신청일을 적으면 "
         "심의위원회 개최 기한(해제요청일 다음 날부터 4일)이, 근로자 의견을 들었는지 확인이 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
WON = '#,##0"원";;""'
YOIL = "일월화수목금토"

BW = ["전부", "일부"]
YN = ["예", "아니오"]
GH_A = "해제요청일("
GH_B = ") 다음 날부터 4일: "
GH_C = "까지 심의위원회 개최 · 개선되었다고 의결하면 즉시 해제(규칙 제69조제3항 · 제70조제2항) — 토요일 · 공휴일도 넣어 셈(이어지면 3일까지만)"
GH_NEED = "⚠ 신청서 아래 «년 월 일»(신청일)을 적으면 심의위원회 개최 기한을 셉니다"
UI_OK = "✓ 해당작업 근로자 의견을 들음 — 붙임 2. 작업노동자 의견서"
UI_NO = "⚠ 해제신청서를 내기 전에 중대재해가 발생한 해당작업 근로자의 의견을 들어야 함(규칙 제69조제2항) — 붙임 2. 작업노동자 의견서"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"범위": BW[1], "의견": YN[0]}
EX_S = {"사업장명": "가나건설(주)", "공사명": "가나시 다목적체육관 신축공사", "전화번호": "000-000-0000", "팩스번호": "000-000-0000",
        "소재지": "가나시 다라구 마바동 123-4", "근로자수": "45명(6,450,000,000원)", "공사기간": "2026. 12. 14. ~ 2027. 12. 31.", "발주자": "가나시 도시공사",
        "해제범위": "B동 4층 거푸집 동바리 설치 · 해체 작업(작업중지명령 일부)",
        "개선사항": "동바리 전 구간 재설치(수평연결재 · 가새 보강) · 구조검토서 재작성 · 작업계획서 다시 작성 · 특별교육 실시(별지 사진 첨부)",
        "소속#1": "가나건설(주)", "직책#1": "현장소장", "성명#1": "정민호", "전화#1": "010-0000-0000",
        "소속#2": "가나건설(주)", "직책#2": "안전관리자", "성명#2": "한소영", "전화#2": "010-0000-0000",
        "소속#3": "마바토건(주)", "직책#3": "작업반장", "성명#3": "최지훈", "전화#3": "010-0000-0000",
        "제출일": D(2027, 3, 5), "제출자": "이가람"}
HEAD = "■ 산업안전보건법 시행규칙 [별지 제29호서식]"
STATEMENT = "작업중지명령에 따른 개선조치를 완료하여 작업중지 해제신청서를 제출합니다."
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1122)


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


def _bd(p, r1, r2, x1, x2, top=True, bot=True, left=True, right=True):
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=LINE if (left and c == c1) else None, right=LINE if (right and c == c2) else None,
                                                       top=LINE if (top and r == r1) else None, bottom=LINE if (bot and r == r2) else None)


LB = {"kind": "label", "size": 9}
SUB = {"kind": "text", "size": 7.5, "align": "left", "valign": "top"}
LT = {"kind": "free", "size": 8, "align": "left"}
NB = {"border": False}
GR = {"kind": "label", "size": 7, "align": "left", "valign": "top"}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  작업중지명령 해제신청서 — 해제 범위 · 근로자 의견 · 심의위원회 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 중대재해로 작업중지명령을 받은 사업주가 개선조치를 마치고 해제를 요청할 때 이 신청서를 관할 지방고용노동관서의 장에게 냅니다(산업안전보건법 "
              "시행규칙 제69조제1항). 내기 전에 해당작업 근로자의 의견을 들어야 하고(같은 조 제2항), 지방고용노동관서는 해제요청일 다음 날부터 4일 이내에 "
              "작업중지해제 심의위원회를 엽니다(같은 조 제3항).")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  해제 범위 · 근로자 의견", need=24 * 3 + 10)
    p.row([(3, "해제 범위", g.L), (5, I("범위", ex=EX["범위"] if ex else None, dv=",".join(BW), align="center", size=9)),
           (4, "작업중지명령이 전부인지 일부인지 — 제목 [√]", s7)], h=26)
    p.row([(3, "근로자 의견 들음", g.L), (5, I("의견", ex=EX["의견"] if ex else None, dv=",".join(YN), align="center", size=9)),
           (4, "중대재해가 발생한 해당작업 근로자의 의견(규칙 제69조제2항)", s7)], h=26)
    p.row([(3, "의견 확인", g.L), (9, F("의견확인", f'=IF({{의견}}="","",IF({{의견}}="{YN[0]}","{UI_OK}","{UI_NO}"))', align="left", size=8.5))], h=30)
    g.sec(p, "㉯  심의위원회 개최 기한 (규칙 제69조제3항)", need=26 * 2 + 10)
    ref = "{신청서!제출일}"
    due = f"({ref}+4)"
    p.row([(3, "개최 기한", g.L),
           (9, F("기한", f'=IF(N({ref})=0,IF({{범위}}="","","{GH_NEED}"),"{GH_A}"&' + _ymdf(ref) + f'&"{GH_B}"&' + _ymdf(due) + '&"("&' + _yo(due)
                 + f'&")"&"{GH_C}")', align="left", size=8.5))], h=44)
    g.sec(p, "㉰  아직 안 적은 칸", need=26 * 2 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({신청서!사업장명}="",{신청서!공사명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 제목의 [√] 전부 · 일부는 여기서 고릅니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


BIN = [("해제 범위(전부 · 일부)", '{범위}=""'), ("사업장명(건설업체명)", '{신청서!사업장명}=""'), ("공사명", '{신청서!공사명}=""'),
       ("소재지", '{신청서!소재지}=""'), ("작업중지 해제요청 범위", '{신청서!해제범위}=""'), ("안전ㆍ보건조치 개선사항", '{신청서!개선사항}=""'),
       ("확인자", 'AND({신청서!성명#1}="",{신청서!성명#2}="",{신청서!성명#3}="")'), ("제출자", '{신청서!제출자}=""')]


def form(bk, ex):
    p = g.pg(bk, ex, "신청서", fit=1, widths=WP)
    prow(p, [(120, 1122, HEAD, {"kind": "note", "size": 7.5})], h=13)
    tt = ('=IF({셈!범위}="전부","[√]","[   ]")&" 전부"&CHAR(10)&IF({셈!범위}="일부","[√]","[   ]")&" 일부"')
    prow(p, [(120, 540, "작업중지명령", {"kind": "free", "size": 15, "bold": True, "align": "right"}),
             (540, 710, F("제목범위", tt, align="center", size=11, bold=True), {"kind": "free", "border": False}),
             (710, 1122, "해제신청서", {"kind": "free", "size": 15, "bold": True, "align": "left"})], h=40)
    prow(p, [(120, 371, "접수번호", GR), (371, 621, "접수일시", GR), (621, 872, "처리일", GR), (872, 960, "처리기간", GR), (960, 1122, "4일", GR)], h=24)
    # 처리기간 · 4일 은 원문처럼 한 칸
    rr = p.r - 1
    _bd(p, rr, rr, 872, 1122)
    # 사업장(건설현장) 개요 — 칸 위쪽 이름 + 아래 적는 자리
    lab = "사 업 장\n(건설현장)\n개     요"
    pairs = [((252, 655, "사업장명(건설업체명)", "사업장명"), (655, 1122, "공사명", "공사명")),
             ((252, 655, "전화번호", "전화번호"), (655, 1122, "팩스번호", "팩스번호")),
             ((252, 1122, "소 재 지", "소재지"),),
             ((252, 655, "근로자 수(공사금액)", "근로자수"), (655, 1122, "공사기간", "공사기간")),
             ((252, 1122, "발주자", "발주자"),)]
    first = True
    for row in pairs:
        items = []
        if first:
            items.append((120, 252, lab, dict(LB, rs=10)))
            first = False
        items += [(x1, x2, name, SUB) for x1, x2, name, _ in row]
        ra = prow(p, items, h=12)
        rb = prow(p, [(x1, x2, inp(k, ex, align="left")) for x1, x2, _, k in row], h=16)
        for x1, x2, _, _ in row:
            _bd(p, ra, rb, x1, x2)
    # 작업중지 해제요청 범위 및 개선사항
    ra = prow(p, [(120, 252, "작업중지\n해제요청\n범위 및\n개선사항", dict(LB, rs=4)), (252, 1122, "작업중지 해제요청 범위[별지작성 가능]", SUB)], h=12)
    rb = prow(p, [(252, 1122, inp("해제범위", ex, align="left", size=8.5), {"valign": "top"})], h=32)
    _bd(p, ra, rb, 252, 1122)
    ra = prow(p, [(252, 1122, "안전ㆍ보건조치 개선사항 [별지작성 가능]", SUB)], h=12)
    rb = prow(p, [(252, 1122, inp("개선사항", ex, align="left", size=8.5), {"valign": "top"})], h=36)
    _bd(p, ra, rb, 252, 1122)
    # 확인자 셋
    first = True
    for j in (1, 2, 3):
        items = [(120, 252, "확인자", dict(LB, rs=6))] if first else []
        first = False
        items += [(252, 300, "소속:", dict(LT, rs=2, valign="top")), (300, 490, inp(f"소속#{j}", ex, align="left"), dict(NB, rs=2)),
                  (490, 545, "직책:", dict(LT, rs=2, valign="top")), (545, 675, inp(f"직책#{j}", ex, align="left"), dict(NB, rs=2)),
                  (675, 730, "성명", LT), (730, 960, inp(f"성명#{j}", ex, align="left"), NB), (960, 1122, "", g.FR)]
        ra = prow(p, items, h=16)
        rb = prow(p, [(675, 765, "(전화번호:", dict(LT, size=7.5)), (765, 940, inp(f"전화#{j}", ex, align="left", size=8), NB),
                      (940, 960, ")", dict(LT, size=7.5)), (960, 1122, "(서명 또는 인)", {"kind": "free", "size": 7, "align": "right", "valign": "top"})],
                  h=16)   # 원문 글 차례(성명 → 전화번호 → 서명 또는 인) 그대로
        _bd(p, ra, rb, 252, 490)
        _bd(p, ra, rb, 490, 675)
        _bd(p, ra, rb, 675, 1122)
    p.gap(8)
    prow(p, [(120, 1122, STATEMENT, {"kind": "free", "size": 9})], h=20)
    prow(p, [(120, 1122, inp("제출일", ex, blank="년          월          일", fmt="date", align="right", size=9), NB)], h=22)
    prow(p, [(120, 380, "", g.FR), (380, 700, "제출자(사업주 또는 대표자)", {"kind": "free", "size": 9, "align": "center"}),
             (700, 960, inp("제출자", ex, align="center", size=9), NB), (960, 1122, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=22)
    prow(p, [(120, 1122, "지방고용노동청(지청)장 귀하", {"kind": "free", "size": 13, "bold": True})], h=26)
    p.gap(4)
    prow(p, [(120, 252, "붙임 서류", {"kind": "label", "size": 8}),
             (252, 971, "1. 안전ㆍ보건조치 개선내용 증빙서류(사진 등)\n2. 작업노동자 의견서", {"kind": "text", "size": 8}),
             (971, 1122, "수수료\n없음", {"kind": "ctext", "size": 8})], h=34)
    prow(p, [(120, 1122, "처리절차", {"kind": "head", "size": 8.5})], h=16)
    box = {"kind": "ctext", "size": 7.5}
    arr = {"kind": "cfree", "size": 8}
    E = [(140, 271), (345, 476), (550, 681), (755, 886), (961, 1091)]
    steps = ["해제신청서\n제출", "현장 확인 및\n검토", "작업중지 해제\n심의위원회", "해제서 작성", "통보"]
    who = ["신청인", "산업안전ㆍ보건\n업무 담당부서", "지방고용노동(지)청", "산업안전ㆍ보건\n업무 담당부서", "문서 발송\n담당부서"]
    items = [(120, 140, "", g.FR)]
    for j, (a, b) in enumerate(E):
        items.append((a, b, steps[j], box))
        if j < 4:
            items.append((b, E[j + 1][0], "▶", arr))
    items.append((1091, 1122, "", g.FR))
    prow(p, items, h=28)
    items = [(120, 140, "", g.FR)]
    for j, (a, b) in enumerate(E):
        items.append((a - 20 if j else a, b + 20 if j < 4 else b, who[j], {"kind": "cfree", "size": 7}))
        if j < 4:
            items.append((b + 20, E[j + 1][0] - 20, "", g.FR))
    items.append((1091, 1122, "", g.FR))
    prow(p, items, h=24)
    prow(p, [(120, 1122, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["제목의 [√] 전부 · 일부는 ① 장에서 고르면 들어옵니다. 확인자는 개선조치를 확인한 사람(현장소장 · 안전관리자 · 근로자 대표 등)을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def _y(d):
    return YOIL[(d.weekday() + 1) % 7]


def expect(pages):
    a_in, s_in = pages["셈"], pages["신청서"]
    a, o = {}, {}
    ui = a_in.get("의견")
    a["의견확인"] = "" if not ui else (UI_OK if ui == YN[0] else UI_NO)
    d = _d(s_in.get("제출일"))
    if not d:
        a["기한"] = "" if not a_in.get("범위") else GH_NEED
    else:
        due = d + datetime.timedelta(days=4)
        a["기한"] = f"{GH_A}{_ymd(d)}{GH_B}{_ymd(due)}({_y(due)}){GH_C}"
    if not s_in.get("사업장명") and not s_in.get("공사명"):
        a["빈칸"] = ""
    else:
        mc = {"해제 범위(전부 · 일부)": not a_in.get("범위"), "사업장명(건설업체명)": not s_in.get("사업장명"), "공사명": not s_in.get("공사명"),
              "소재지": not s_in.get("소재지"), "작업중지 해제요청 범위": not s_in.get("해제범위"), "안전ㆍ보건조치 개선사항": not s_in.get("개선사항"),
              "확인자": not (s_in.get("성명#1") or s_in.get("성명#2") or s_in.get("성명#3")), "제출자": not s_in.get("제출자")}
        miss = [n for n, _ in BIN if mc[n]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    bw = a_in.get("범위")
    o["제목범위"] = ("[√]" if bw == "전부" else "[   ]") + " 전부\n" + ("[√]" if bw == "일부" else "[   ]") + " 일부"
    return {"셈": a, "신청서": o}


for _t in (GH_A, GH_B, GH_C, GH_NEED, UI_OK, UI_NO, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
for _t in (*BW, *YN):
    assert "," not in _t
