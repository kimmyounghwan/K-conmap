# -*- coding: utf-8 -*-
"""소방시설공사등의 하도급통지서 — 새로 만든 서식 (2026-11-16 G723 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 하도급 구분(설계 · 시공 · 감리 · 방염 → 법 제22조제1항 하도급 제한 판정) · 통지 시기(법 제21조의3제4항 «미리» — 착수 예정일 전 통지인지) ·
     붙일 서류(규칙 제20조제1항 1~4) · 사본 하수급자에게(제2항) · 변경 · 해지(법 제21조의3제4항 후단 · 규칙 제20조제3항) · 재하도급 금지(법 제22조제2항) · 아직 안 적은 칸
   · 통지서(소방시설공사업법 시행규칙 [별지 제31호서식] <개정 2021. 6. 10.> 칸 차례 그대로 — 한 쪽 · 칸 안 위쪽 이름표).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1120.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G723_소방하도급통지_원문.txt — 글층 해시 같음 확인):
  · 소방시설공사업법 [시행 2025. 1. 31.] 제21조의3제4항(도급을 받은 자가 하도급할 때 미리 관계인과 발주자에게 알림 · 하수급인 변경 · 하도급 계약 해지도 같음) ·
    제22조(① 설계 · 시공 · 감리는 제3자에게 하도급할 수 없음 — 시공은 대통령령으로 정하는 바에 따라 일부를 다른 공사업자에게 ② 하수급인은 다시 하도급할 수 없음)
  · 시행규칙 [시행 2026. 10. 20.] 제20조(① 별지 제31호서식 + 1. 하도급계약서(안) 2. 예정공정표 3. 하도급내역서 4. 하수급인의 소방시설업 등록증 사본 —
    미리 관계인 및 발주자에게 ② 통지서 사본을 하수급자에게 ③ 해지하면 해지 증명 서류를 알림)
■ 짐작 안 함: «미리» 는 날 수가 없어 착수 예정일보다 앞선 날인지만 봄 · 시공 하도급이 되는 «대통령령으로 정하는 바» 의 범위는 셈하지 않음(글로만)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L

SLUG = "sobang-hado-tongji"
TITLE = "소방시설공사등의 하도급통지서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방시설공사등의 하도급통지서(소방시설공사업법 시행규칙 별지 제31호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "소방시설공사등의 하도급통지서 — 작성 예시 (통보인 칸이 원도급자에서 저절로)"),
        (3, "① 하도급 구분 · 통지 시기 · 서류 — 작성 예시")]
MULTI = True
SHORT = ("소방시설공사등의 하도급통지서(소방시설공사업법 시행규칙 별지 제31호서식) — 하도급 구분(설계 · 시공 · 감리 · 방염)을 고르면 하도급 제한(법 제22조)이 나오고, "
         "착수 예정일과 통지일로 «미리» 알렸는지 저절로 점검됩니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
AREA = '#,##0.00;;""'
GB = ["시공", "설계", "감리", "방염"]

PJ_SG = "시공 — 도급받은 소방시설공사의 일부를 대통령령으로 정하는 바에 따라 다른 공사업자에게 하도급할 수 있음(법 제22조제1항 단서)"
PJ_NO = "⚠ 설계 · 감리는 제3자에게 하도급할 수 없음(법 제22조제1항 본문) — 하도급하면 안 됩니다"
PJ_BY = "방염 — 법 제22조제1항(설계 · 시공 · 감리 하도급 제한)에 들지 않음 · 하도급하면 이 통지서로 미리 알림(법 제21조의3제4항)"
JS_A = "미리 알림(법 제21조의3제4항 · 규칙 제20조제1항) — 착수 예정일 "
JS_B = " 전에 관계인 · 발주자에게"
JS_OK = " · ✓ 통지일이 착수 예정일 전"
JS_LATE = " · ⚠ 통지일이 착수 예정일 전이 아님"
SR = ("붙일 서류(규칙 제20조제1항) — 1. 하도급계약서(안) 1부 · 2. 예정공정표 1부 · 3. 하도급내역서 1부 · 4. 하수급인의 소방시설업 등록증 사본 1부 / "
      "통지한 통지서 사본은 하수급자에게 줌(제2항)")
BG = ("※ 하수급인을 바꾸거나 하도급 계약을 해지할 때에도 미리 알림(법 제21조의3제4항 후단) — 해지하면 해지 사실을 증명할 수 있는 서류를 관계인 · 발주자에게(규칙 제20조제3항) · "
      "하수급인은 하도급받은 소방시설공사를 다시 하도급할 수 없음(법 제22조제2항)")
BIN_OK = "✓ 통지서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 회사 · 사람 · 번호) ─────────────────────────
EX = {"구분": GB[0], "착수일": D(2027, 5, 3)}
EX_S = {"대상명칭": "가나타워(가칭)", "용도구분": "업무시설", "대상소재지": "가나도 다라시 마바동 123-4", "대상전화": "000-000-0000",
        "지하": 3, "지상": 20, "연면적": 32500, "바닥면적": 1620, "동수": 1,
        "발주자": "가나개발(주)", "관계인주소": "가나도 다라시 바사로 12", "관계인전화": "000-000-0000",
        "상호": "다라소방(주)", "등록번호": "0000-00", "대표자": "최지훈", "소재지": "가나도 다라시 사아로 7", "전화번호": "000-000-0000",
        "하도상호": "사아전기소방(주)", "하도등록번호": "0000-00", "하도대표": "문가온", "하도소재지": "가나도 마바시 하하로 8", "하도전화": "000-000-0000",
        "하도내용": "자동화재탐지설비 · 비상방송설비 시공(지하 3층 ~ 지상 20층 전체)",
        "기술자성명": "한도윤", "기술자주소": "가나도 다라시 카타로 15", "자격종류": "소방설비기사(전기) · 고급", "자격발급": D(2015, 6, 30),
        "자격번호": "00000000000", "제출일": D(2027, 4, 26), "수신": "가나개발(주)"}
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제31호서식] <개정 2021. 6. 10.>"
STATEMENT = "「소방시설공사업법」 제21조의3제4항 및 같은 법 시행규칙 제20조제1항에 따라 소방시설공사등을 하도급하려고 통지합니다."
ATTACH = "1. 하도급계약서(안) 1부\n2. 예정공정표 1부\n3. 하도급내역서 1부\n4. 하수급인의 소방시설업 등록증 사본 1부"
PAPER = "210mm×297mm[백상지 80g/㎡ 또는 중질지 80g/㎡]"


def _ex(ex, k):
    return EX[k] if ex else None


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1120)
X1, X2 = 120, 1120


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
            p.ws.cell(row=r, column=c).border = Border(left=sd if (left and c == c1) else None, right=sd if (right and c == c2) else None,
                                                       top=sd if (top and r == r1) else None, bottom=sd if (bot and r == r2) else None)


LB = {"kind": "label", "size": 9}
SUB = {"kind": "text", "size": 7.5, "align": "left", "valign": "top"}
NB = {"border": False}
F8 = {"kind": "free", "size": 8, "align": "center"}
FB = {"kind": "free", "size": 8}
TL = {"kind": "free", "size": 7.5, "align": "right"}
TR = {"kind": "free", "size": 7.5}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SD, QD = "{착수일}", "{통지서!제출일}"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방시설공사등의 하도급 — 제한 · 통지 시기 · 서류 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 도급을 받은 자가 소방시설공사등을 하도급할 때에는 미리 관계인과 발주자에게 알립니다(소방시설공사업법 제21조의3제4항).")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  하도급 구분 (법 제22조)", need=26 * 2 + 10)
    p.row([(3, "하도급 구분", L), (4, I("구분", ex=_ex(ex, "구분"), dv=",".join(GB), align="center", size=8.5)), (5, "하도급하려는 일", s7)], h=24)
    pj = f'=IF({{구분}}="","",IF({{구분}}="{GB[0]}","{PJ_SG}",IF({{구분}}="{GB[3]}","{PJ_BY}","{PJ_NO}")))'
    p.row([(3, "판    정", L), (9, F("판정", pj, align="left", size=8.5, bold=True))], h=40)
    g.sec(p, "㉯  통지 시기 (법 제21조의3제4항 «미리»)", need=26 * 2 + 10)
    p.row([(3, "착수 예정일", L), (5, I("착수일", ex=_ex(ex, "착수일"), fmt=DT, align="center", size=9)), (4, "하도급 공사를 시작할 날", s7)], h=24)
    f = (f'=IF(N({SD})=0,"","{JS_A}"&' + _ymdf(SD) + f'&"{JS_B}"&IF(N({QD})=0,"",IF(N({QD})<N({SD}),"{JS_OK}","{JS_LATE}")))')
    p.row([(3, "통지 시기", L), (9, F("시기", f, align="left", size=8.5))], h=34)
    g.sec(p, "㉰  붙일 서류 · 바뀌면", need=40 * 2 + 10)
    p.row([(3, "붙일 서류", L), (9, SR, sz)])
    p.row([(3, "변경 · 해지", L), (9, BG, sz)])
    g.sec(p, "㉱  아직 안 적은 칸", need=46 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({통지서!대상명칭}="",{통지서!하도상호}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 통지서의 통보인 칸은 원도급자 상호 · 대표자에서 들어옵니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


BIN = [("대상 상호(명칭)", '{통지서!대상명칭}=""'), ("관계인 성명", '{통지서!발주자}=""'), ("원도급자 상호", '{통지서!상호}=""'),
       ("하도급자 상호", '{통지서!하도상호}=""'), ("하도급자 등록번호", '{통지서!하도등록번호}=""'), ("하도급 내용", '{통지서!하도내용}=""'),
       ("책임소방기술자 성명", '{통지서!기술자성명}=""'), ("하도급 구분(① 장)", '{구분}=""'), ("착수 예정일(① 장)", 'N({착수일})=0')]


def _two(p, top, bot, h1, h2):
    ra = prow(p, top, h=h1)
    rb = prow(p, bot, h=h2)
    return ra, rb


def _addr(p, ex, lab, key, tel, h1=13, h2=21):
    """칸 안 위쪽 «소재지 · 주소» + 아래 적는 칸 · 오른쪽 아래 «(전화번호 : )»"""
    ra, rb = _two(p, [(252, X2, lab, SUB)],
                  [(252, 784, inp(key, ex, align="left"), NB), (784, 990, "(전화번호 :", TL), (990, 1100, inp(tel, ex, align="center", size=8), NB),
                   (1100, X2, ")", TR)], h1, h2)
    _bd(p, ra, rb, 252, X2)
    return ra, rb


def _firm(p, ex, lab, keys):
    sh, dn, dp, so, te = keys
    ra, rb = _two(p, [(X1, 252, lab, dict(LB, rs=4)), (252, 494, "상호(명칭)", SUB), (494, 610, "등록번호", SUB), (610, 640, "(제", dict(SUB, align="right")),
                      (640, 745, inp(dn, ex, align="center", size=8), NB), (745, 777, "호)", SUB), (777, X2, "대표자", SUB)],
                  [(252, 494, inp(sh, ex, align="left", size=8.5), NB), (494, 777, "", FB), (777, X2, inp(dp, ex, align="left"), NB)], 13, 18)
    for x1, x2 in ((252, 494), (494, 777), (777, X2)):
        _bd(p, ra, rb, x1, x2)
    _addr(p, ex, "소재지", so, te, 13, 20.5)
    _bd(p, ra, ra + 3, X1, 252)


# ── 통지서 ────────────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "통지서", fit=1, widths=WP)
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=40)
    # 특정소방대상물
    r1, r2 = _two(p, [(X1, 252, "특정소방\n대상물", dict(LB, rs=6)), (252, 777, "상호(명칭)", SUB), (777, X2, "용도 구분", SUB)],
                  [(252, 777, inp("대상명칭", ex, align="left"), NB), (777, X2, inp("용도구분", ex, align="left"), NB)], 13, 21)
    _bd(p, r1, r2, 252, 777)
    _bd(p, r1, r2, 777, X2)
    _addr(p, ex, "소재지", "대상소재지", "대상전화")
    n0 = {"fmt": '0;;""', "align": "center", "size": 8.5, "wrap": "shrink"}
    na = {"fmt": AREA, "align": "right", "size": 8.5, "wrap": "shrink"}
    r5, r6 = _two(p, [(252, X2, "구        조", SUB)],
                  [(252, 330, "", FB), (330, 385, "지하", F8), (385, 440, inp("지하", ex, **n0), NB), (440, 475, "층,", FB), (475, 515, "지상", F8),
                   (515, 570, inp("지상", ex, **n0), NB), (570, 605, "층,", FB), (605, 665, "연면적", F8), (665, 760, inp("연면적", ex, **na), NB),
                   (760, 785, "㎡,", FB), (785, 860, "바닥면적", F8), (860, 950, inp("바닥면적", ex, **na), NB), (950, 980, "㎡,", FB),
                   (980, 1020, inp("동수", ex, **n0), NB), (1020, 1070, "개동", FB), (1070, X2, "", FB)], 13, 20)
    _bd(p, r5, r6, 252, X2)
    _bd(p, r1, r6, X1, 252)
    p.gap(2)
    # 관계인
    a1, a2 = _two(p, [(X1, 252, "관계인", dict(LB, rs=4)), (252, X2, "성명(기관 또는 법인명)", SUB)],
                  [(252, X2, inp("발주자", ex, align="left", size=9), NB)], 13, 18.5)
    _bd(p, a1, a2, 252, X2)
    _addr(p, ex, "주소", "관계인주소", "관계인전화", 13, 21)
    _bd(p, a1, a1 + 3, X1, 252)
    p.gap(2)
    _firm(p, ex, "원도급자", ("상호", "등록번호", "대표자", "소재지", "전화번호"))
    _firm(p, ex, "하도급자", ("하도상호", "하도등록번호", "하도대표", "하도소재지", "하도전화"))
    p.gap(2)
    prow(p, [(X1, 252, "하도급 내용\n(공사의 하도급은\n하도급하는 소방\n시설의 종류를\n말합니다.)", dict(LB, size=7.5)),
             (252, X2, inp("하도내용", ex, align="left", size=9), {"valign": "top"})], h=72)
    p.gap(2)
    t1, t2 = _two(p, [(X1, 252, "책임소방\n기술자", dict(LB, rs=6)), (252, X2, "성명", SUB)],
                  [(252, X2, inp("기술자성명", ex, align="left", size=9), NB)], 13, 20.5)
    _bd(p, t1, t2, 252, X2)
    t3, t4 = _two(p, [(252, X2, "주소", SUB)], [(252, X2, inp("기술자주소", ex, align="left"), NB)], 13, 20.5)
    _bd(p, t3, t4, 252, X2)
    t5, t6 = _two(p, [(252, 494, "자격의 종류 및 구분", SUB), (494, 777, "자격증 발급연월일", SUB), (777, X2, "자격증 번호", SUB)],
                  [(252, 494, inp("자격종류", ex, align="left", size=8), NB), (494, 777, inp("자격발급", ex, fmt=DT, align="center", size=8.5), NB),
                   (777, X2, inp("자격번호", ex, align="left", size=8.5), NB)], 13, 16)
    for x1, x2 in ((252, 494), (494, 777), (777, X2)):
        _bd(p, t5, t6, x1, x2)
    _bd(p, t1, t6, X1, 252)
    p.gap(6)
    prow(p, [(X1, X2, STATEMENT, {"kind": "free", "size": 9.5})], h=36)
    prow(p, [(X1, X2, inp("제출일", ex, blank="년          월          일", fmt="date", align="right", size=9), NB)], h=24)
    prow(p, [(X1, 340, "", g.FR), (340, 520, "통보인", {"kind": "free", "size": 9.5, "align": "center"}),
             (520, 960, F("통보인표시", '=IF(AND({대표자}="",{상호}=""),"",IF({대표자}="",{상호},IF({상호}="","대표 "&{대표자},{상호}&" 대표 "&{대표자})))',
                          align="center", size=8.5), NB),
             (960, X2, "(서명 또는 인)", {"kind": "free", "size": 7.5, "align": "right"})], h=24)
    prow(p, [(X1, 530, inp("수신", ex, align="right", size=11, bold=True), NB), (530, 620, "귀하", {"kind": "free", "size": 12, "bold": True})], h=24)
    from openpyxl.styles import Side
    med = Side(style="medium", color="000000")
    r = prow(p, [(X1, X2, "", FB)], h=4)
    _bd(p, r, r, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(8)
    a, b = GX.cols(242, 998)
    na_ = text_lines(ATTACH, sum(WP[a - 1:b]) * 10.0 / 8)
    prow(p, [(X1, 242, "첨부서류", {"kind": "label", "size": 8.5}), (242, 998, ATTACH, {"kind": "text", "size": 8, "valign": "center"}),
             (998, X2, "수수료\n\n없음", {"kind": "ctext", "size": 8.5})], h=max(50, na_ * 8 * 1.45 + 12))
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["통보인 칸은 원도급자 상호 · 대표자에서 들어옵니다. «귀하» 앞에는 관계인 · 발주자를 적습니다(관계인 성명은 공통 정보 «발주자» 에서)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _d(v):
    if isinstance(v, datetime.datetime):
        return v.date()
    return v if isinstance(v, datetime.date) else None


def _ymd(d):
    return f"{d.year}. {d.month}. {d.day}."


def expect(pages):
    sm, sg = pages["셈"], pages["통지서"]
    a, b = {}, {}
    gb = sm.get("구분")
    a["판정"] = "" if not gb else (PJ_SG if gb == GB[0] else (PJ_BY if gb == GB[3] else PJ_NO))
    sd, qd = _d(sm.get("착수일")), _d(sg.get("제출일"))
    if not sd:
        a["시기"] = ""
    else:
        t = f"{JS_A}{_ymd(sd)}{JS_B}"
        if qd:
            t += JS_OK if qd < sd else JS_LATE
        a["시기"] = t
    if not sg.get("대상명칭") and not sg.get("하도상호"):
        a["빈칸"] = ""
    else:
        mc = {"대상 상호(명칭)": not sg.get("대상명칭"), "관계인 성명": not sg.get("발주자"), "원도급자 상호": not sg.get("상호"),
              "하도급자 상호": not sg.get("하도상호"), "하도급자 등록번호": not sg.get("하도등록번호"), "하도급 내용": not sg.get("하도내용"),
              "책임소방기술자 성명": not sg.get("기술자성명"), "하도급 구분(① 장)": not gb, "착수 예정일(① 장)": not sd}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    sang, dae = sg.get("상호") or "", sg.get("대표자") or ""
    b["통보인표시"] = "" if not (sang or dae) else (sang if not dae else ("대표 " + dae if not sang else sang + " 대표 " + dae))
    return {"셈": a, "통지서": b}


for _t in (PJ_SG, PJ_NO, PJ_BY, JS_A, JS_B, JS_OK, JS_LATE, BIN_OK, BIN_A, *GB):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
assert len(",".join(GB)) < 255
