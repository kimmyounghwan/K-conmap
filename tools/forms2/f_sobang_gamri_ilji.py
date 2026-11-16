# -*- coding: utf-8 -*-
"""소방공사 감리일지 — 새로 만든 서식 (2026-11-16 G717 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 감리기간 · 책임 · 보조감리원 배치기간(→ 일지 «년 월 일» 저절로) · 특정소방대상물 구조(지하 · 지상 · 연면적 · 바닥면적 · 동 → «구조» 한 줄) ·
     감리기간 일수 · 감리사항 날짜가 감리기간 안인지 · 배치기간이 감리기간 안인지 · 아직 안 적은 칸
   · 일지(소방시설공사업법 시행규칙 [별지 제13호서식] <개정 2016. 1. 27.> 칸 차례 그대로 — 세로 한 쪽 · 감리사항 6줄).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1115.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G717_소방감리일지_원문.txt — 글층 해시 같음 확인):
  · 소방시설공사업법 [시행 2025. 1. 31.] 제8조제4항(관계 서류를 하자보수 보증기간 동안 보관) ·
    시행규칙 [시행 2026. 10. 20.] 제8조제3호(소방공사감리업 — 별지 제12호서식 감리기록부 · 별지 제13호서식 감리일지 · 완공 당시 설계도서)
■ 짐작 안 함: 감리 횟수 · 방법(상주 · 일반)은 셈하지 않음 · 감리사항이 많으면 별지(원문 ※).
■ 면적 글: 정수면 «3,250» · 소수면 «3,250.5» (엑셀 TEXT 의 «3,250.» 끝점 피하기 — f_jajae_subulbu._t 와 같은 꼴)."""
import datetime

import sgw as g
from fb import F, I

SLUG = "sobang-gamri-ilji"
TITLE = "소방공사 감리일지"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방공사 감리일지(소방시설공사업법 시행규칙 별지 제13호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "소방공사 감리일지 — 작성 예시 (감리기간 · 배치기간 · 구조가 ① 장에서 저절로)"),
        (3, "① 감리기간 · 배치기간 · 구조 · 날짜 점검 — 작성 예시")]
MULTI = True
SHORT = ("소방공사 감리일지(소방시설공사업법 시행규칙 별지 제13호서식) — 감리기간 · 감리원 배치기간 · 구조를 적으면 일지 칸이 채워지고, "
         "감리사항 날짜와 배치기간이 감리기간 안인지 저절로 점검됩니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
NS = 6
BO = ("소방공사감리업자는 감리기록부 · 이 감리일지 · 완공 당시 설계도서를 하자보수 보증기간 동안 보관합니다(소방시설공사업법 제8조제4항 · "
      "시행규칙 제8조제3호).")
KG_A = "⚠ 감리 끝날이 시작일보다 앞섭니다"
OK_IN = "✓ 감리사항 날짜가 모두 감리기간 안"
OUT_A = "⚠ 감리기간 밖 날짜:"
NEED_D = "감리기간(위 ㉮)을 적으면 감리사항 날짜를 점검합니다"
PB_OK = "✓ 배치기간이 감리기간 안"
PB_A = "⚠ 배치기간을 다시 보세요(감리기간 밖이거나 끝이 시작보다 앞섬):"
NEED_B = "감리기간(위 ㉮)을 적으면 배치기간을 점검합니다"
BIN_OK = "✓ 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
YB = "년     월     일"           # 칸넘침점검 — 6칸 띄면 8.5pt 두 줄(16pt 칸 넘침) → 5칸
KB = "     년     월     일부터"
KE = "     년     월     일까지"

EX = {"감리시작": D(2027, 3, 2), "감리끝": D(2027, 8, 31), "책임시작": D(2027, 3, 2), "책임끝": D(2027, 8, 31), "보조시작": D(2027, 4, 1),
      "보조끝": D(2027, 8, 31), "지하": 1, "지상": 5, "연면적": 3250, "바닥면적": 640, "동수": 1}
EX_S = {"감리상호": "마바소방(주)", "감리등록번호": "0000-00", "감리대표": "서다온", "감리업종": "전문 소방공사감리업 / 기계 · 전기",
        "감리소재지": "가나시 마바구 공단로 21", "감리전화": "000-000-0000",
        "책임성명": "정민호", "책임분야": "기계 · 전기 / 특급", "보조성명": "한소영", "보조분야": "전기 / 초급",
        "대상상호": "가나빌딩", "주요용도": "근린생활시설", "대상소재지": "가나시 다라구 바사로 45", "대상전화": "000-000-0000",
        "관계인성명": "가나개발(주)", "관계인주소": "가나시 다라구 바사로 12", "관계인전화": "000-000-0000",
        "설계상호": "다라소방설계(주)", "설계등록번호": "0000-00", "설계대표": "이가람", "설계업종": "전문 소방시설설계업 / 기계 · 전기",
        "설계소재지": "가나시 다라구 카타로 9", "설계전화": "000-000-0000",
        "공사상호": "다라소방(주)", "공사등록번호": "0000-00", "공사대표": "최지훈", "공사업종": "전문 소방시설공사업 / 기계 · 전기",
        "공사소재지": "가나시 사아구 파하로 3", "공사전화": "000-000-0000",
        "개요": "스프링클러설비(습식) · 옥내소화전설비 · 자동화재탐지설비 · 비상방송설비 · 유도등 · 피난기구",
        "날짜#1": D(2027, 3, 2), "사항#1": "착공 전 설계도서 검토 · 시공계획 확인", "비고#1": "",
        "날짜#2": D(2027, 3, 16), "사항#2": "스프링클러 배관 자재 반입 검수(규격 · 시험성적서)", "비고#2": "",
        "날짜#3": D(2027, 4, 6), "사항#3": "지하 1층 배관 수압시험 입회", "비고#3": "적합",
        "날짜#4": D(2027, 5, 11), "사항#4": "감지기 · 발신기 설치 위치 확인", "비고#4": "1건 시정"}
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제13호서식] <개정 2016. 1. 27.>"
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ymdf(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _t(x):
    """면적 글자로: 정수면 3,250 · 소수면 3,250.5 (엑셀 TEXT 의 «3,250.» 끝점 피하기)"""
    return f'IF({x}=INT({x}),TEXT({x},"#,##0"),TEXT({x},"#,##0.##"))'


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1115)


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
CT = {"kind": "ctext", "size": 8.5}
NB = {"border": False}
F8 = {"kind": "free", "size": 8.5}
SM = {"kind": "free", "size": 7, "align": "right", "valign": "bottom"}
TL = {"kind": "free", "size": 8, "align": "right"}
TR = {"kind": "free", "size": 8}


def inp(k, ex, **kw):
    kw.setdefault("size", 8.5)
    return I(k, ex=_e(ex, k), **kw)


SI = [f"{{일지!날짜#{k}}}" for k in range(1, NS + 1)]
GS, GE = "{감리시작}", "{감리끝}"
NOGK = f"OR(N({GS})=0,N({GE})=0)"


def _ymd_cell(ref):
    return f'=IF(N({ref})=0,"{YB}",' + _ymdf(ref) + ')'


BIN = [("감리업체 상호", '{일지!감리상호}=""'), ("책임감리원 성명", '{일지!책임성명}=""'), ("특정소방대상물 상호", '{일지!대상상호}=""'),
       ("감리기간(① 장)", NOGK), ("소방시설 개요", '{일지!개요}=""'),
       ("감리사항", "AND(" + ",".join(f'{{일지!사항#{k}}}=""' for k in range(1, NS + 1)) + ")")]


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방공사 감리일지 — 감리기간 · 배치기간 · 구조 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ " + BO)
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  감리기간 · 감리원 배치기간 (→ 일지 «년 월 일»)", need=24 * 7 + 10)
    for k, lab in (("감리시작", "감리 시작일"), ("감리끝", "감리 끝날"), ("책임시작", "책임감리원 배치 시작"), ("책임끝", "책임감리원 배치 끝"),
                   ("보조시작", "보조감리원 배치 시작"), ("보조끝", "보조감리원 배치 끝")):
        p.row([(3, lab, g.L), (5, I(k, ex=EX[k] if ex else None, fmt=DT, align="center", size=9)), (4, "", s7)], h=22)
    p.row([(3, "감리기간", g.L),
           (9, F("기간", f'=IF({NOGK},"",IF({GS}>{GE},"{KG_A}","✓ 감리기간 "&({GE}-{GS}+1)&"일"))', align="left", size=8.5))], h=22)
    g.sec(p, "㉯  특정소방대상물 구조 (→ 일지 «구조»)", need=24 * 5 + 10)
    for k, lab, fmt in (("지하", "지하 층수", '0"층";;""'), ("지상", "지상 층수", '0"층";;""'), ("연면적", "연면적(㎡)", '#,##0.00" ㎡";;""'),
                        ("바닥면적", "바닥면적(㎡)", '#,##0.00" ㎡";;""'), ("동수", "동 수", '0"개동";;""')):
        p.row([(3, lab, g.L), (5, I(k, ex=EX[k] if ex else None, fmt=fmt, align="center", size=9)), (4, "", s7)], h=22)
    g.sec(p, "㉰  날짜 점검", need=30 * 2 + 10)
    out = "&".join(f'IF(AND(N({s})>0,OR({s}<{GS},{s}>{GE}))," {k}째 줄","")' for k, s in enumerate(SI, 1))
    cnt = "(" + "+".join(f"IF(N({s})>0,1,0)" for s in SI) + ")"
    p.row([(3, "감리사항 날짜", g.L),
           (9, F("날짜점검", f'=IF({cnt}=0,"",IF({NOGK},"{NEED_D}",IF(({out})="","{OK_IN}","{OUT_A}"&({out}))))', align="left", size=8.5))], h=30)
    pb = "&".join(f'IF(OR(AND(N({{{a}}})>0,{{{a}}}<{GS}),AND(N({{{b}}})>0,{{{b}}}>{GE}),AND(N({{{a}}})>0,N({{{b}}})>0,{{{a}}}>{{{b}}}))," {n}","")'
                  for a, b, n in (("책임시작", "책임끝", "책임감리원"), ("보조시작", "보조끝", "보조감리원")))
    anyb = "OR(N({책임시작})>0,N({책임끝})>0,N({보조시작})>0,N({보조끝})>0)"
    p.row([(3, "배치기간", g.L),
           (9, F("배치점검", f'=IF(NOT({anyb}),"",IF({NOGK},"{NEED_B}",IF(({pb})="","{PB_OK}","{PB_A}"&({pb}))))', align="left", size=8.5))], h=30)
    g.sec(p, "㉱  아직 안 적은 칸", need=40 + 10)
    c2 = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({일지!감리상호}="",{일지!대상상호}=""),"",IF(' + c2 + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=40)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 일지의 감리기간 · 배치기간 · 구조는 여기서 정해집니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def _tel(p, ex, x0, key):
    """«(전화 :      )» 한 줄 — x0 부터 오른쪽 끝까지 테 없이"""
    return prow(p, [(x0, 990, "(전화 :", TL), (990, 1100, inp(key, ex, align="center", size=8), NB), (1100, 1115, ")", TR)], h=14)


def _firm(p, ex, lab, pre, sign):
    """업체 칸 — 상호(기관명) · 등록번호 «제 호» · 대표자(공사업자 · 감리업자만 «(서명 또는 인)») / 업종·분야 · 소재지(전화)"""
    rs = 2 if sign else 1

    def S(d):
        return dict(d, rs=rs) if sign else d
    ra = prow(p, [(120, 253, lab, dict(LB, rs=2 + rs)), (253, 386, "상호(기관명)", S(CT)),
                  (386, 571, inp(f"{pre}상호", ex, align="left"), S(NB) if sign else {}),
                  (571, 702, "등록번호", S(CT)), (702, 735, "제", S(F8)), (735, 840, inp(f"{pre}등록번호", ex, align="center", size=8), S(NB)),
                  (840, 855, "호", S(F8)), (855, 941, "대표자", S(CT)), (941, 1115, inp(f"{pre}대표", ex, align="left"), NB if sign else {})],
              h=17 if sign else 18)
    rb = ra
    if sign:
        rb = prow(p, [(941, 1115, "(서명 또는 인)", SM)], h=12)
        _bd(p, ra, rb, 386, 571)
        _bd(p, ra, rb, 941, 1115)
    _bd(p, ra, rb, 702, 855)
    rc = prow(p, [(253, 386, "업종 / 분야", dict(CT, rs=2)), (386, 571, inp(f"{pre}업종", ex, align="left", size=7.5), dict(NB, rs=2)),
                  (571, 702, "소  재  지", dict(CT, rs=2)), (702, 1115, inp(f"{pre}소재지", ex, align="left"), NB)], h=17)
    rd = _tel(p, ex, 702, f"{pre}전화")
    _bd(p, rc, rd, 386, 571)
    _bd(p, rc, rd, 702, 1115)


def _person(p, ex, lab, pre, a, b):
    ra = prow(p, [(120, 253, lab, dict(LB, rs=2)), (253, 386, "성        명", dict(CT, rs=2)), (386, 571, inp(f"{pre}성명", ex, align="left"), dict(NB, rs=2)),
                  (571, 702, "분야 / 등급", dict(CT, rs=2)), (702, 855, inp(f"{pre}분야", ex, align="left", size=7.5), dict(NB, rs=2)),
                  (855, 941, "배    치\n기    간", dict(CT, rs=2)), (941, 1115, F(f"{pre}배치시작", _ymd_cell(f"{{셈!{a}}}"), align="right", size=8.5), {})], h=17.5)
    rb = prow(p, [(941, 1115, F(f"{pre}배치끝", _ymd_cell(f"{{셈!{b}}}"), align="right", size=8.5), {})], h=17.5)   # 칸넘침점검 — 8.5pt 한 줄 17.3
    _bd(p, ra, rb, 386, 571)
    _bd(p, ra, rb, 702, 855)


# ── 일지 ────────────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "일지", fit=1, widths=WP)
    X1, X2 = 120, 1115
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7})], h=12)
    prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center", "border": True})], h=30)
    _firm(p, ex, "업  체  명", "감리", True)
    _person(p, ex, "책임감리원", "책임", "책임시작", "책임끝")
    _person(p, ex, "보조감리원", "보조", "보조시작", "보조끝")
    # 특정소방대상물 — 상호 · 주요용도 / 소재지(전화) / 구조
    prow(p, [(X1, 253, "특정소방\n대 상 물", dict(LB, rs=4)), (253, 386, "상호(명칭)", CT), (386, 702, inp("대상상호", ex, align="left"), {}),
             (702, 855, "주 요 용 도", CT), (855, X2, inp("주요용도", ex, align="left"), {})], h=23)
    rc = prow(p, [(253, 386, "소  재  지", dict(CT, rs=2)), (386, X2, inp("대상소재지", ex, align="left"), NB)], h=17)
    rd = _tel(p, ex, 386, "대상전화")
    _bd(p, rc, rd, 386, X2)
    s = "{셈!"
    gj = ('="지하 "&IF(N(' + s + '지하})=0,"   ",' + s + '지하})&"층, 지상 "&IF(N(' + s + '지상})=0,"   ",' + s + '지상})&"층, 연면적 "&IF(N('
          + s + '연면적})=0,"        ",' + _t(s + "연면적}") + ')&"㎡, 바닥면적 "&IF(N(' + s + '바닥면적})=0,"        ",' + _t(s + "바닥면적}")
          + ')&"㎡, "&IF(N(' + s + '동수})=0,"   ",' + s + '동수})&"개동"')
    prow(p, [(253, 386, "구        조", CT), (386, X2, F("구조", gj, align="left", size=8.5), {})], h=21)
    # 관계인 또는 도급인
    ra = prow(p, [(X1, 253, "관계인\n또는 도급인", dict(LB, rs=4)), (253, 386, "성명(기관\n또는 법인명)", dict(CT, rs=2, size=8)),
                  (386, X2, inp("관계인성명", ex, align="left"), NB)], h=17)
    rb = prow(p, [(386, X2, "(서명 또는 인)", SM)], h=13)
    _bd(p, ra, rb, 386, X2)
    rc = prow(p, [(253, 386, "주        소", dict(CT, rs=2)), (386, X2, inp("관계인주소", ex, align="left"), NB)], h=17)
    rd = _tel(p, ex, 386, "관계인전화")
    _bd(p, rc, rd, 386, X2)
    _firm(p, ex, "소방시설\n설계업자", "설계", False)
    _firm(p, ex, "소방시설\n공사업자", "공사", True)
    kk = ('=IF(N({셈!감리시작})=0,"' + KB + '",' + _ymdf("{셈!감리시작}") + '&"부터")&"          "&'
          'IF(N({셈!감리끝})=0,"' + KE + '",' + _ymdf("{셈!감리끝}") + '&"까지")')
    prow(p, [(X1, 386, "소방공사  감리기간", CT), (386, X2, F("감리기간", kk, align="center", size=9), {})], h=21)
    prow(p, [(X1, 386, "소 방 시 설 개 요", CT), (386, X2, inp("개요", ex, align="left", size=8.5), {"valign": "top"})], h=56)
    prow(p, [(X1, X2, "소방공사 감리사항", {"kind": "ctext", "size": 12, "bold": True})], h=30)
    prow(p, [(X1, 253, "날    짜", CT), (253, 1000, "감          리          사          항", CT), (1000, X2, "비  고", CT)], h=21)
    for k in range(1, NS + 1):
        prow(p, [(X1, 253, inp(f"날짜#{k}", ex, fmt=DT, align="center", size=8), {}), (253, 1000, inp(f"사항#{k}", ex, align="left", size=8.5), {}),
                 (1000, X2, inp(f"비고#{k}", ex, align="center", size=8), {})], h=21)
    prow(p, [(X1, X2, "※ 상세 내용은 별지 작성", {"kind": "text", "size": 8})], h=17)
    p.gap(6)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["감리기간 · 배치기간 · 구조는 ① 장에서 들어옵니다. 감리사항이 많으면 별지에 이어 적습니다(원문 ※)."]
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


def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


def _num(x):
    """IF(x=INT(x),TEXT(x,"#,##0"),TEXT(x,"#,##0.##")) 꼴"""
    if float(x).is_integer():
        return f"{int(x):,}"
    return f"{x:,.2f}".rstrip("0").rstrip(".")


def _gen(x):
    return str(int(x)) if float(x).is_integer() else repr(float(x))


def expect(pages):
    a_in, s_in = pages["셈"], pages["일지"]
    a, o = {}, {}
    gs, ge = _d(a_in.get("감리시작")), _d(a_in.get("감리끝"))
    nog = not (gs and ge)
    a["기간"] = "" if nog else (KG_A if gs > ge else f"✓ 감리기간 {(ge - gs).days + 1}일")
    ds = [_d(s_in.get(f"날짜#{k}")) for k in range(1, NS + 1)]
    n = sum(1 for d in ds if d)
    if n == 0:
        a["날짜점검"] = ""
    elif nog:
        a["날짜점검"] = NEED_D
    else:
        out = "".join(f" {k}째 줄" for k, d in enumerate(ds, 1) if d and (d < gs or d > ge))
        a["날짜점검"] = OK_IN if not out else OUT_A + out
    bb = {k: _d(a_in.get(k)) for k in ("책임시작", "책임끝", "보조시작", "보조끝")}
    if not any(bb.values()):
        a["배치점검"] = ""
    elif nog:
        a["배치점검"] = NEED_B
    else:
        pb = ""
        for x, y, nm in (("책임시작", "책임끝", "책임감리원"), ("보조시작", "보조끝", "보조감리원")):
            if (bb[x] and bb[x] < gs) or (bb[y] and bb[y] > ge) or (bb[x] and bb[y] and bb[x] > bb[y]):
                pb += " " + nm
        a["배치점검"] = PB_OK if not pb else PB_A + pb
    if not s_in.get("감리상호") and not s_in.get("대상상호"):
        a["빈칸"] = ""
    else:
        mc = {"감리업체 상호": not s_in.get("감리상호"), "책임감리원 성명": not s_in.get("책임성명"), "특정소방대상물 상호": not s_in.get("대상상호"),
              "감리기간(① 장)": nog, "소방시설 개요": not s_in.get("개요"),
              "감리사항": not any(s_in.get(f"사항#{k}") for k in range(1, NS + 1))}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    for pre, x, y in (("책임", "책임시작", "책임끝"), ("보조", "보조시작", "보조끝")):
        o[f"{pre}배치시작"] = _ymd(bb[x]) if bb[x] else YB
        o[f"{pre}배치끝"] = _ymd(bb[y]) if bb[y] else YB
    v = {k: _n(a_in.get(k)) for k in ("지하", "지상", "연면적", "바닥면적", "동수")}
    o["구조"] = ("지하 " + (_gen(v["지하"]) if v["지하"] else "   ") + "층, 지상 " + (_gen(v["지상"]) if v["지상"] else "   ") + "층, 연면적 "
               + (_num(v["연면적"]) if v["연면적"] else "        ") + "㎡, 바닥면적 " + (_num(v["바닥면적"]) if v["바닥면적"] else "        ") + "㎡, "
               + (_gen(v["동수"]) if v["동수"] else "   ") + "개동")
    o["감리기간"] = ((_ymd(gs) + "부터") if gs else KB) + "          " + ((_ymd(ge) + "까지") if ge else KE)
    return {"셈": a, "일지": o}


for _t_ in (KG_A, OK_IN, OUT_A, NEED_D, PB_OK, PB_A, NEED_B, BIN_OK, BIN_A, YB, KB, KE):
    assert len(_t_) < 255 and '"' not in _t_, _t_[:40]
