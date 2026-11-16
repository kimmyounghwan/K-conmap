# -*- coding: utf-8 -*-
"""하도급 참여제한 확인서 — 새로 만든 서식 (2026-11-16 G727 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 제재기간(시작일 · 끝일 · 일수 — 시작일 · 끝일 모두 셈) · 확인한 날에 제한 중인지(시작 전 · 제한 중 · 끝남) · 알아 둘 것(법 제29조의3) · 아직 안 적은 칸
   · 확인서(건설산업기본법 시행규칙 [별지 제24호의3서식] <개정 2020.10.7.> 공문서 꼴 그대로 — 국토교통부 · 수신자 · (경유) · 제목 · 표 · 사유 · 참고 사항 ·
     국토교통부장관 직인 칸 · 회색 띠 · 기안자 ~ 공개구분 · 세로 한 쪽).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리 · 글자 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — 쪽 x 120~1112 · 표 x 124~1099
   (세로줄 259 · 407 · 684 · 849 / 직인 칸 709~829). 아래 공문 칸(우 · 주소 · 전화 …)은 원문 글을 빈 서식에 미리 넣어 둠 — 고쳐 씀.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G727_하도급참여제한확인서_원문.txt — 글층 해시 같음 확인):
  · 건설산업기본법 [시행 2025. 11. 27.] 제29조의3 ① 국토교통부장관은 1~6호 건설사업자의 공공건설공사 하도급 참여를 제한 — 기간 2년 이내(대통령령)
    ③ 즉시 건설산업종합정보망에 게재 ④ 시작 7일 전까지 업체에 통보 ⑤ 수급인은 제한 중인 건설사업자에게 하도급 금지 · 건설사업자는 제한 중 하도급 받기 금지
    ⑥ 공공건설공사 발주자는 하수급인 중 제한 중인 자가 있으면 즉시 하수급인 변경 요구 ⑦ 정보 제공 때부터 5년 지나면 제한 못 함
  · 시행령 [시행 2026. 6. 23.] 제33조(① 공공기관 = 공기업 · 준정부기관 · 지방공사 · 지방공단 ② 기간 기준 별표 3의2 ③ 시작일 전까지 게재 — 상호 · 주소 · 성명 · 번호 · 사유 · 기간 · 집행정지)
  · 시행규칙 [시행 2026. 1. 2.] 제27조(① 별지 제24호의3서식 확인서를 건설산업종합정보망에 게재 ② 공공건설공사 발주자는 정보망으로 확인해야 함)
■ 원문 그대로: 아래 «210㎜×297㎜(백상지 80g/㎡)» · 표 오른쪽 끝은 위 · 아래 가로줄보다 안쪽(x 1099).
■ 짐작 안 함: 제재기간은 별표 3의2 로 셈하지 않음(사유마다 다름 — 적힌 기간만 봄) · «제한 중» 은 확인한 날이 시작일 ~ 끝일 안에 있는지만 봄
  (집행정지 여부는 건설산업종합정보망에서 확인)."""
import datetime

import sgw as g
from fb import F, I
from sgw import L

SLUG = "hado-chamyeo-jehan"
TITLE = "하도급 참여제한 확인서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "하도급 참여제한 확인서(건설산업기본법 시행규칙 별지 제24호의3서식) — 빈 서식 (원문 공문서 꼴 그대로)"),
        (4, "하도급 참여제한 확인서 — 작성 예시 (제재기간이 ① 장에서 저절로)"),
        (3, "① 제재기간 · 확인한 날에 제한 중인지 — 작성 예시")]
MULTI = True
SHORT = ("하도급 참여제한 확인서(건설산업기본법 시행규칙 별지 제24호의3서식) — 제재기간을 적으면 일수와, 확인한 날에 하도급 참여제한 중인지"
         "(공공건설공사 하도급 금지) 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'

GG_REV = "⚠ 끝일이 시작일보다 앞섭니다"
GG_A, GG_B, GG_C, GG_D = "제재기간 ", " ~ ", " — ", "일(시작일 · 끝일 모두 셈)"
ST_PRE_A, ST_PRE_B = "제한 시작 전 — ", "부터 공공건설공사 하도급 참여제한"
ST_ON_A, ST_ON_B = "⚠ 하도급 참여제한 중(", "까지) — 공공건설공사에서 이 업체에 하도급하면 안 되고, 이 업체도 하도급을 받으면 안 됨(법 제29조의3제5항)"
ST_END_A, ST_END_B = "✓ 제한 기간이 끝났습니다(", " 끝)"
T_GONG = ("공공건설공사 = 국가 · 지방자치단체 또는 공기업 · 준정부기관 · 지방공사 · 지방공단이 발주하는 건설공사"
          "(건설산업기본법 제29조의3제1항 · 시행령 제33조제1항)")
T_BYEON = ("공공건설공사 발주자는 하수급인 중 제한 중인 자가 있으면 즉시 수급인에게 하수급인 변경을 요구하고, 수급인은 정당한 사유가 없으면 따름"
           "(법 제29조의3제6항) · 발주자는 건설산업종합정보망으로 확인해야 함(시행규칙 제27조제2항)")
T_GIGAN = ("제한 기간은 2년 이내(법 제29조의3제1항) · 기준은 시행령 별표 3의2(제33조제2항) · 국토교통부장관은 시작 7일 전까지 업체에 통보(법 제29조의3제4항)하고 "
           "시작일 전까지 건설산업종합정보망에 이 확인서를 게재(시행령 제33조제3항 · 시행규칙 제27조제1항)")
BIN_OK = "✓ 확인서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"제한시작": D(2027, 3, 1), "제한끝": D(2027, 8, 31), "점검일": D(2027, 5, 10)}
EX_S = {"수신자": "수신자 참조",
        "제한상호": "가나토건(주)", "제한사업자번호": "000-00-00000", "제한법인번호": "000000-0000000", "제한주소": "가나도 가나시 공단로 12",
        "제한대표자": "나대표", "제재근거": "건설산업기본법 제29조의3제1항제3호",
        "제재사유": "「근로기준법」 제43조의2제1항에 따라 체불사업주로 명단이 공개됨(2027. 1. 15. 공개)",
        "참고사항": "제한 기간 중에는 공공건설공사의 하도급을 받을 수 없음(건설산업기본법 제29조의3제5항)",
        "기안자": "주무관 가나다", "검토자": "사무관 라마바", "결재권자": "과장 사아자",
        "시행번호": "○○과-0000(2027. 2. 20.)", "우편번호": "우 00000", "기관주소": "가나도 가나시 가나로 1", "홈페이지": "/ www.○○○.go.kr",
        "기관전화": "전화(000-000-0000)", "기관전송": "전송(000-000-0000)", "전자우편": "/ ○○○@○○○.go.kr", "공개구분": "/ 대국민공개"}
HEAD = "■ 건설산업기본법 시행규칙 [별지 제24호의3서식] <개정 2020. 10. 7.>"
BODY = "  「건설산업기본법 시행령」 제33조제3항 및 같은 법 시행규칙 제27조제1항에 따라 하도급 참여제한 확인서를 아래와 같이 통보합니다."
PAPER = "210㎜×297㎜(백상지 80g/㎡)"


def _ex(ex, k):
    return EX.get(k) if ex else None


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


GX = Gx(120, 1112)
X1, X2 = 120, 1112
T1, T2 = 124, 1099          # 표 왼쪽 · 오른쪽 끝(원문 그대로 위 · 아래 가로줄보다 안쪽)


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


LB = {"kind": "label", "size": 9, "border": False}
LC = {"kind": "free", "size": 9, "align": "center"}
LT = {"kind": "free", "size": 10, "align": "left"}
NB = {"border": False}
FB = {"kind": "free", "size": 8}
FT = {"kind": "free", "size": 8.5, "align": "left"}


def inp(k, ex, **kw):
    kw.setdefault("size", 9)
    return I(k, ex=_e(ex, k), **kw)


S0, E0, C0 = "{제한시작}", "{제한끝}", "{점검일}"


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  하도급 참여제한 — 제재기간 · 확인한 날에 제한 중인지 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 국토교통부장관은 하도급 참여를 제한하는 건설사업자를 이 확인서로 건설산업종합정보망에 게재합니다"
              "(건설산업기본법 제29조의3제3항 · 시행령 제33조제3항 · 시행규칙 제27조제1항).")
    s7 = {"kind": "text", "size": 7}
    sz = {"kind": "text", "size": 7.5}
    g.sec(p, "㉮  제재기간 · 제한 중인지", need=24 * 5 + 20)
    p.row([(3, "제한 시작일", L), (5, I("제한시작", ex=_ex(ex, "제한시작"), fmt=DT, align="center", size=9)), (4, "하도급 참여제한이 시작되는 날", s7)], h=22)
    p.row([(3, "제한 끝일", L), (5, I("제한끝", ex=_ex(ex, "제한끝"), fmt=DT, align="center", size=9)), (4, "제한이 끝나는 날(이날까지 제한)", s7)], h=22)
    gg = (f'=IF(OR(N({S0})=0,N({E0})=0),"",IF({E0}<{S0},"{GG_REV}","{GG_A}"&' + _ymdf(S0) + f'&"{GG_B}"&' + _ymdf(E0)
          + f'&"{GG_C}"&({E0}-{S0}+1)&"{GG_D}"))')
    p.row([(3, "제재기간", L), (9, F("기간", gg, align="left", size=8.5))], h=24)
    p.row([(3, "확인한 날", L), (5, I("점검일", ex=_ex(ex, "점검일"), fmt=DT, align="center", size=9)), (4, "제한 중인지 볼 날 — 빈 서식은 오늘", s7)], h=22)
    st = (f'=IF(OR(N({S0})=0,N({E0})=0,N({C0})=0),"",IF({E0}<{S0},"",IF({C0}<{S0},"{ST_PRE_A}"&' + _ymdf(S0) + f'&"{ST_PRE_B}",'
          f'IF({C0}<={E0},"{ST_ON_A}"&' + _ymdf(E0) + f'&"{ST_ON_B}","{ST_END_A}"&' + _ymdf(E0) + f'&"{ST_END_B}"))))')
    p.row([(3, "제한 중인지", L), (9, F("상태", st, align="left", size=8.5, bold=True))], h=34)
    g.sec(p, "㉯  알아 둘 것 (건설산업기본법 제29조의3)", need=40 * 3 + 10)
    p.row([(3, "공공건설공사", L), (9, T_GONG, sz)])
    p.row([(3, "하도급 금지 · 변경", L), (9, T_BYEON, sz)])
    p.row([(3, "기간 · 게재", L), (9, T_GIGAN, sz)])
    g.sec(p, "㉰  아직 안 적은 칸", need=46 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", L),
           (9, F("빈칸", '=IF(AND({확인서!제한상호}="",{확인서!제재근거}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 확인서의 제재기간은 여기서 정해집니다. «확인한 날» 은 빈 서식을 열면 오늘로 먼저 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 번호 · 주소)."])
    return p


BIN = [("상호 또는 법인명칭", '{확인서!제한상호}=""'),
       ("사업자등록번호 또는 법인등록번호", 'AND({확인서!제한사업자번호}="",{확인서!제한법인번호}="")'),
       ("주소", '{확인서!제한주소}=""'), ("대표자", '{확인서!제한대표자}=""'), ("제재근거", '{확인서!제재근거}=""'),
       ("제재기간(① 장)", f'OR(N({S0})=0,N({E0})=0)'), ("제재에 대한 사유", '{확인서!제재사유}=""')]


# ── 확인서 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    from openpyxl.styles import Side
    p = g.pg(bk, ex, "확인서", fit=1, widths=WP)
    med = Side(style="medium", color="000000")
    prow(p, [(X1, X2, HEAD, {"kind": "free", "size": 8})], h=14)
    p.gap(6)
    prow(p, [(X1, X2, "국  토  교  통  부", {"kind": "free", "size": 18, "bold": True, "align": "center"})], h=34)
    p.gap(14)
    prow(p, [(X1, 248, "수신자", LT), (248, X2, inp("수신자", ex, align="left", size=10), NB)], h=19)
    prow(p, [(X1, 248, "(경유)", LT), (248, X2, inp("경유", ex, align="left", size=10), NB)], h=19)
    rt = prow(p, [(X1, 248, "제  목", LT), (248, X2, TITLE, dict(LT, size=10.5))], h=26)
    _bd(p, rt, rt, X1, X2, top=False, left=False, right=False, side=med)
    p.gap(6)
    prow(p, [(X1, X2, BODY, {"kind": "free", "size": 9.5, "align": "left"})], h=34)
    p.gap(10)
    # 표 — 하도급 참여제한자(5줄) · 제재내용(2줄)
    a1 = prow(p, [(T1, 259, "하도급\n참여\n제한자", dict(LB, rs=4)), (259, 407, "상호 또는\n법인명칭", dict(LC, rs=2)),
                  (407, 684, inp("제한상호", ex, align="left", size=9), dict(NB, rs=2)), (684, 849, "사업자등록번호", LC),
                  (849, T2, inp("제한사업자번호", ex, align="center", size=9), NB)], h=31)
    prow(p, [(684, 849, "법인등록번호", LC), (849, T2, inp("제한법인번호", ex, align="center", size=9), NB)], h=31)
    a3 = prow(p, [(259, 407, "주소", LC), (407, T2, inp("제한주소", ex, align="left", size=9), NB)], h=31)
    a4 = prow(p, [(259, 407, "대표자", LC), (407, T2, inp("제한대표자", ex, align="left", size=9), NB)], h=46)
    b1 = prow(p, [(T1, 259, "제재내용", dict(LB, rs=2)), (259, 407, "제재근거", LC), (407, T2, inp("제재근거", ex, align="left", size=9), NB)], h=31)
    ymd = 'IF(N({{셈!{k}}})=0,"",YEAR({{셈!{k}}})&". "&MONTH({{셈!{k}}})&". "&DAY({{셈!{k}}})&".")'
    gf = ('=IF(AND(N({셈!제한시작})=0,N({셈!제한끝})=0),"~",' + ymd.format(k="제한시작") + '&"   ~   "&' + ymd.format(k="제한끝") + ')')
    b2 = prow(p, [(259, 407, "제재기간", LC), (407, T2, F("제재기간표시", gf, align="center", size=9), NB)], h=31)
    _bd(p, a1, a4, T1, 259)
    _bd(p, a1, a1 + 1, 259, 407)
    _bd(p, a1, a1 + 1, 407, 684)
    for r in (a1, a1 + 1):
        _bd(p, r, r, 684, 849)
        _bd(p, r, r, 849, T2)
    for r in (a3, a4, b1, b2):
        _bd(p, r, r, 259, 407)
        _bd(p, r, r, 407, T2)
    _bd(p, b1, b2, T1, 259)
    _bd(p, a1, b2, T1, T2, top=True, bot=True, left=True, right=True, side=med)
    p.gap(14)
    prow(p, [(X1, X2, "(제재에 대한 사유)", LT)], h=18)
    prow(p, [(X1, X2, inp("제재사유", ex, align="left", size=9.5), dict(NB, valign="top"))], h=32)
    p.gap(4)
    prow(p, [(X1, X2, "(그 밖의 참고 사항)", LT)], h=18)
    prow(p, [(X1, X2, inp("참고사항", ex, align="left", size=9.5), dict(NB, valign="top"))], h=38)
    p.gap(10)
    rj = prow(p, [(X1, 700, "국  토  교  통  부  장  관", {"kind": "free", "size": 13, "bold": True, "align": "right"}), (700, 709, "", FB),
                  (709, 829, "직인", {"kind": "free", "size": 9, "align": "center"})], h=58)
    _bd(p, rj, rj, 709, 829, side=med)
    p.gap(36)
    from openpyxl.styles import PatternFill
    prow(p, [(X1, X2, "", {"kind": "free", "fill": PatternFill("solid", fgColor="C0C0C0")})], h=8)      # 원문 회색 띠(y 1462~1477)
    p.gap(4)
    prow(p, [(X1, 190, "기안자", FT), (190, 455, inp("기안자", ex, blank="직위(직급) 서명", align="left", size=8.5), NB),
             (455, 530, "검토자", FT), (530, 790, inp("검토자", ex, blank="직위(직급) 서명", align="left", size=8.5), NB),
             (790, 885, "결재권자", FT), (885, X2, inp("결재권자", ex, blank="직위(직급) 서명", align="left", size=8.5), NB)], h=19)
    prow(p, [(X1, 190, "협조자", FT), (190, X2, inp("협조자", ex, align="left", size=8.5), NB)], h=19)
    prow(p, [(X1, 200, "시행", FT), (200, 600, inp("시행번호", ex, blank="처리과-일련번호(시행일자)", align="center", size=8.5), NB),
             (600, 680, "접수", FT), (680, X2, inp("접수번호", ex, blank="처리과명-일련번호(접수일자)", align="center", size=8.5), NB)], h=19)
    prow(p, [(X1, 254, inp("우편번호", ex, blank="우", align="left", size=8.5), NB), (254, 688, inp("기관주소", ex, blank="주소", align="left", size=8.5), NB),
             (688, X2, inp("홈페이지", ex, blank="/ 홈페이지 주소", align="left", size=8.5), NB)], h=19)
    rf = prow(p, [(X1, 376, inp("기관전화", ex, blank="전화(          )", align="left", size=8.5), NB),
                  (376, 653, inp("기관전송", ex, blank="전송(          )", align="left", size=8.5), NB),
                  (653, 987, inp("전자우편", ex, blank="/ 기안자의 공식전자우편주소", align="left", size=8.5), NB),
                  (987, X2, inp("공개구분", ex, blank="/ 공개구분", align="left", size=8.5), NB)], h=19)
    _bd(p, rf, rf, X1, X2, top=False, left=False, right=False, side=med)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 7, "align": "right"})], h=14)
    p.end_print()
    p.after_note(["제재기간은 ① 장에서 들어옵니다. 아래 공문 칸(기안자 · 시행 · 우 · 주소 · 전화 …)은 원문 글이 미리 들어 있으니 지우고 고쳐 쓰세요(예: «전화(044-000-0000)»)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 번호 · 주소)."])
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


def expect(pages):
    sm, sg = pages["셈"], pages["확인서"]
    a, b = {}, {}
    s, e, c = _d(sm.get("제한시작")), _d(sm.get("제한끝")), _d(sm.get("점검일"))
    if not (s and e):
        a["기간"] = ""
    elif e < s:
        a["기간"] = GG_REV
    else:
        a["기간"] = f"{GG_A}{_ymd(s)}{GG_B}{_ymd(e)}{GG_C}{(e - s).days + 1}{GG_D}"
    if not (s and e and c) or e < s:
        a["상태"] = ""
    elif c < s:
        a["상태"] = ST_PRE_A + _ymd(s) + ST_PRE_B
    elif c <= e:
        a["상태"] = ST_ON_A + _ymd(e) + ST_ON_B
    else:
        a["상태"] = ST_END_A + _ymd(e) + ST_END_B
    if not sg.get("제한상호") and not sg.get("제재근거"):
        a["빈칸"] = ""
    else:
        mc = {"상호 또는 법인명칭": not sg.get("제한상호"),
              "사업자등록번호 또는 법인등록번호": not sg.get("제한사업자번호") and not sg.get("제한법인번호"),
              "주소": not sg.get("제한주소"), "대표자": not sg.get("제한대표자"), "제재근거": not sg.get("제재근거"),
              "제재기간(① 장)": not (s and e), "제재에 대한 사유": not sg.get("제재사유")}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)[:300]
    if not s and not e:
        b["제재기간표시"] = "~"
    else:
        b["제재기간표시"] = (_ymd(s) if s else "") + "   ~   " + (_ymd(e) if e else "")
    return {"셈": a, "확인서": b}


for _t in (GG_REV, GG_A, GG_B, GG_C, GG_D, ST_PRE_A, ST_PRE_B, ST_ON_A, ST_ON_B, ST_END_A, ST_END_B, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
