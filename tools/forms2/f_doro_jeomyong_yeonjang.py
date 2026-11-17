# -*- coding: utf-8 -*-
"""도로점용허가 기간연장 신청서 — 새로 만든 서식 (2026-11-17 G746 · 소장님 「그럼 이제 서식 10개만 만들자. 못 만든 서식...」 — 도로법 4종 셋째)
   → ① 최초 허가기간 · 지금 허가 끝날 · 연장할 끝날 · 연장 일수 · 처리 기한(7일 — 민원처리법 제19조②) ·
     «허가기간이 끝나기 전까지 연장허가»(뒤쪽 유의사항 4) 판정 · 신청하는 곳 · 담당부서(뒤쪽 신청안내) · 아직 안 적은 칸
   · 신청서 앞쪽(도로법 시행규칙 [별지 제25호서식] 칸 차례 그대로) · 뒤쪽(유의사항 · 작성방법 · 신청안내 및 처리절차 — 원문 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G746/구조.md — 앞 바깥 121 ~ 1122 · 이름 칸 232 · 가운데 730 · 수수료 칸 856 /
   뒤 바깥 120 ~ 1120 · 근거법률 288 · 신청안내 288 · 699 · 820 · 처리절차 상자).

근거(국가법령정보센터 · 2026-11-17 · 원문 /home/claude/g10/notes/G746/p1.txt · p2.txt(글층 해시 7c7b3a4efe11ea64 · 101b2300e5f5613e) · 조문 G746/근거.md — 세 번):
  · 도로법 [시행 2026. 9. 18.] 제61조① — 도로를 점용하려는 자는 도로관리청의 허가 · 허가받은 기간을 연장하거나 허가받은 사항을 변경하려는 때에도 같음
  · 도로법 시행규칙 [시행 2026. 9. 18.] 제26조② — 기간 연장은 별지 제25호서식 · 변경은 별지 제26호서식
  · 「민원 처리에 관한 법률」 제19조② — 처리기간 7일: 받은 날을 1일로 토 · 일 · 공휴일 빼고 7번째 근무일(민원기한.py)
■ 원문 그대로: 앞쪽 머리 «■ 도로법 시행규칙 [별지 제25호서식]»(개정 표시 없음) · 수수료 글 · 뒤쪽 유의사항 · 작성방법 · 신청안내 글.
■ 짐작 안 함: 수수료는 서식 글 그대로(조례 금액은 도로관리청 확인) · 신청하는 곳 · 담당부서는 뒤쪽 신청안내 글 그대로 고름."""
import datetime

import sgw as g
from fb import F, I
from sgw import L
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd, _yo
import 민원기한 as MW

SLUG = "doro-jeomyong-yeonjang"
TITLE = "도로점용허가 기간연장 신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
# 쪽: 빈 1 셈 · 2 앞쪽 · 3 뒤쪽 / 예시 4 ~ 6
PREV = [(2, "도로점용허가 기간연장 신청서(도로법 시행규칙 별지 제25호서식 앞쪽) — 빈 서식 (원문 칸 차례 그대로)"),
        (5, "도로점용허가 기간연장 신청서 — 작성 예시 (최초 허가기간 · 도로의 종류가 ① 장에서)"),
        (4, "① 연장 일수 · 처리 기한(7일) · 끝나기 전 연장 판정 · 신청하는 곳 — 작성 예시 (가상의 현장)"),
        (3, "뒤쪽 — 유의사항 · 작성방법 · 신청안내 및 처리절차 (원문 그대로)")]
MULTI = True
SHORT = ("도로점용허가 기간연장 신청서(도로법 시행규칙 별지 제25호서식) — 점용기간을 늘리려면 허가기간이 끝나기 전까지 연장허가를 받아야 합니다. "
         "허가 끝날 · 연장할 끝날 · 신청일을 적으면 연장 일수 · 처리 기한(7일)이 나오고, 끝나기 전에 허가가 나는지 저절로 봅니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
ROADS = ["고속국도", "일반국도", "특별시도", "광역시도", "지방도", "시도", "군도", "구도"]

# 뒤쪽 원문(유의사항 · 작성방법 · 신청안내 — G746/p2.txt 글 그대로 · 띄어쓰기만)
GEUNGEO = "도로구역에서의 도로점용은 도로관리청의 허가를 받아야 합니다(「도로법」 제61조제1항)."
YU = ["1. 허가를 받지 않고 도로를 점용하는 경우에는 2년 이하의 징역 또는 2천만원 이하의 벌금을 물게 되며, 변상금이 부과됩니다(「도로법」 제72조 및 제114조제6호).",
      "2. 허가를 받은 자는 관계 규정에 따라 점용료를 납부하여야 하며, 허가면적을 초과하여 점용한 경우에는 300만원 이하의 과태료가 부과됩니다(「도로법」 제117조제2항제1호).",
      "3. 도로굴착을 수반하는 점용의 경우에는 도로점용허가 신청 전에 점용에 관한 사업계획서 등을 도로관리청에 제출하여 도로관리심의회의 조정을 받아야 합니다"
      "(「도로법 시행령」 제56조제1항).",
      "4. 점용기간을 연장하려는 경우에는 허가기간이 끝나기 전까지 연장허가를 받아야 합니다."]
JAK = ["1. ①에는 이미 허가받은 허가번호를 적습니다.",
       "2. ②에는 휴게소, 주유소, 공장, 아파트, 진입로 등 점용의 목적을 적습니다.",
       "3. ③에는 고속국도ㆍ일반국도ㆍ특별시도ㆍ광역시도ㆍ지방도ㆍ시도ㆍ군도ㆍ구도로 구분하고, 노선번호를 적습니다(예: 국도 ○○호선 등)."]
GOT = ["1. 고속국도: 한국도로공사지사", "2. 일반국도: 국토관리사무소",
       "3. 특별시도ㆍ광역시도ㆍ지방도ㆍ시도ㆍ군도ㆍ구도: 특별시ㆍ광역시ㆍ특별자치시ㆍ도ㆍ특별자치도ㆍ시ㆍ군ㆍ구(읍ㆍ면ㆍ동)"]
BUSEO = ["1. 고속국도: 도로과", "2. 일반국도: 보수과", "3. 특별시도ㆍ광역시도ㆍ지방도ㆍ시도ㆍ군도ㆍ구도: 건설과ㆍ건설관리과"]
FEE = "1,000원 또는 행정청이 속하는 지방자치단체의 조례로 정하는 금액"

GI_BAD = "⚠ 연장할 끝날이 지금 허가 끝날보다 앞(같은 날)입니다"
CH_A = "까지 — 신청서를 받은 날을 1일로 토 · 일 · 공휴일 빼고 7일(처리기간 · 민원처리법 제19조②)"
PAN_GONE_A = "⚠ 허가기간이 이미 끝났습니다("
PAN_GONE_B = ") — 연장허가는 허가기간이 끝나기 전까지 받아야 합니다(뒤쪽 유의사항 4) · 도로관리청에 바로 물어보십시오"
PAN_LATE_A = "⚠ 처리 기한이 허가 끝날("
PAN_LATE_B = ")보다 늦습니다 — 끝나기 전에 연장허가를 받으려면 더 일찍 내십시오(뒤쪽 유의사항 4)"
PAN_OK_A = "✓ 허가 끝날("
PAN_OK_B = ") 전에 처리 기한이 옵니다 — 끝날까지 "
NEXT = "연장허가를 받으면 늘어난 기간의 점용료를 냅니다(뒤쪽 유의사항 2) · 허가면적을 넘게 점용하면 과태료(유의사항 2)"
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 사람 · 번호) ─────────────────────────────────
EX = {"도로종류": "군도", "최초시작": D(2024, 4, 1), "최초끝": D(2027, 3, 31), "지금끝": None, "연장끝": D(2030, 3, 31), "신청일": D(2027, 3, 2)}
EX_S = {"성명": "가나상사(주) 대표이사 홍길동", "생년월일": "000000-0000000", "주소": "가나시 다라구 마바로 12", "전자우편": "gana@example.com",
        "전화": "000-0000-0000", "휴대": "010-0000-0000", "허가번호": "가나군 도로점용 제2024-000호", "목적": "공장 진입로",
        "장소": "가나군 다라면 마바리 123-4 일원 · 48.0㎡", "노선명": "군도 3호선(다라 ~ 마바)", "수신": "가나군수"}

HEAD = "■ 도로법 시행규칙 [별지 제25호서식]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  도로점용허가 기간연장 — 연장 일수 · 처리 기한 · 끝나기 전 연장 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 허가받은 점용기간을 늘리려면 허가기간이 끝나기 전까지 연장허가를 받아야 합니다(도로법 제61조제1항 · 서식 뒤쪽 유의사항 4). "
              "여기 적은 값이 신청서의 최초 허가기간 · 도로의 종류로 들어가고, 처리 기한 · 신청하는 곳이 나옵니다.")
    g.sec(p, "㉮  허가기간 · 연장", need=26 * 5 + 10)
    p.row([(3, "도로의 종류", L), (3, I("도로종류", ex=_ex(ex, "도로종류"), dv=",".join(ROADS), align="center", size=9)),
           (6, "고속국도 · 일반국도 · 특별시도 · 광역시도 · 지방도 · 시도 · 군도 · 구도", s7)], h=26)
    p.row([(3, "최초 허가 시작일", L), (3, I("최초시작", ex=_ex(ex, "최초시작"), fmt=DT, align="center", size=9)),
           (3, "최초 허가 끝날", L), (3, I("최초끝", ex=_ex(ex, "최초끝"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "지금 허가 끝날", L), (3, I("지금끝", ex=_ex(ex, "지금끝"), fmt=DT, align="center", size=9)),
           (6, "전에 연장받은 적이 있으면 그 끝날 — 비우면 최초 허가 끝날", s7)], h=26)
    p.row([(3, "셈에 쓰는 허가 끝날", L),
           (3, F("끝", '=IF(N({지금끝})>0,{지금끝},IF(N({최초끝})>0,{최초끝},""))', fmt=DT, align="center", size=9)), (6, "", s7)], h=26)
    p.row([(3, "연장할 끝날", L), (3, I("연장끝", ex=_ex(ex, "연장끝"), fmt=DT, align="center", size=9)),
           (6, F("연장", '=IF(OR(N({끝})=0,N({연장끝})=0),"",IF({연장끝}<={끝},"' + GI_BAD + '","늘어나는 기간 "&({연장끝}-{끝})&"일(허가 끝날 다음 날부터)"))',
                 align="left", size=8.5))], h=26)
    g.sec(p, "㉯  신청일 · 처리 기한 · 판정", need=26 + 36 * 2 + 10)
    p.row([(3, "신 청 일", L), (3, I("신청일", ex=_ex(ex, "신청일"), fmt=DT, align="center", size=9)),
           (6, "신청서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "처리 기한", L),
           (9, F("처리", '=IF(N({신청일})=0,"",' + _ymd("{처끝}") + '&"("&' + _yo("{처끝}") + '&")' + CH_A + '"&IF(' + MW.덮음식("{신청일}", "{처끝}")
                 + ',"' + MW.밖글 + '",""))', align="left", size=8.5))], h=36)
    p.row([(3, "판      정", L),
           (9, F("판정", '=IF(OR(N({신청일})=0,N({끝})=0),"",IF({신청일}>{끝},"' + PAN_GONE_A + '"&' + _ymd("{끝}") + '&"' + PAN_GONE_B + '",'
                 'IF({처끝}>{끝},"' + PAN_LATE_A + '"&' + _ymd("{끝}") + '&"' + PAN_LATE_B + '","' + PAN_OK_A + '"&' + _ymd("{끝}") + '&"' + PAN_OK_B
                 + '"&({끝}-{신청일})&"일 남음")))', align="left", size=8.5))], h=36)
    g.sec(p, "㉰  신청하는 곳 · 담당부서 · 수수료 (서식 뒤쪽 신청안내)", need=26 * 3 + 10)
    p.row([(3, "신청하는 곳", L),
           (9, F("곳", '=IF({도로종류}="","",IF({도로종류}="고속국도","한국도로공사지사",IF({도로종류}="일반국도","국토관리사무소",'
                 '"특별시 · 광역시 · 특별자치시 · 도 · 특별자치도 · 시 · 군 · 구(읍 · 면 · 동)")))', align="left", size=8.5))], h=26)
    p.row([(3, "담당부서", L),
           (9, F("부서", '=IF({도로종류}="","",IF({도로종류}="고속국도","도로과",IF({도로종류}="일반국도","보수과","건설과 · 건설관리과")))',
                 align="left", size=9))], h=26)
    p.row([(3, "수 수 료", L), (9, FEE + "(서식 글 — 조례 금액은 도로관리청에 확인)", {"kind": "text", "size": 8.5})], h=26)
    g.sec(p, "㉱  아직 안 적은 칸 · 다음 할 일", need=40 + 40 + 10)
    BIN = [("신청인 성명", '{신청서!성명}=""'), ("주소", '{신청서!주소}=""'), ("허가번호", '{신청서!허가번호}=""'),
           ("최초 허가기간", "OR(N({최초시작})=0,N({최초끝})=0)"), ("점용의 목적", '{신청서!목적}=""'), ("점용의 장소 및 면적", '{신청서!장소}=""'),
           ("도로의 종류", '{도로종류}=""'), ("연장할 끝날", "N({연장끝})=0"), ("신청일", "N({신청일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({도로종류}="",{신청서!성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))',
                 align="left", size=8.5))], h=40)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(AND({도로종류}="",{신청서!성명}=""),"","' + NEXT + '")', align="left", size=8))], h=40)
    MW.넣기(p, "{신청일}", 7, "처")
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 허가 끝날 · 연장할 끝날 · 신청일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공장 진입로 점용 — 2030. 3. 31.까지 연장)."])
    return p


# ── 앞쪽 ────────────────────────────────────────────────────────────────
PAX = [121, 232, 388, 470, 545, 625, 730, 851, 958, 1122]
GA = Grid(PAX)


def form(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신청서", fit=1, widths=GA.w)
    X1, XL, X2 = 121, 232, 1122

    def inp(k, **kw):
        kw.setdefault("size", 9)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    SB = dict(SUB, size=8.5)
    prow(p, GA, [(X1, X2, HEAD, {"kind": "free", "size": 7.5})], h=13)
    p.gap(12)
    prow(p, GA, [(X1, X2, "도로점용허가 기간연장 신청서", {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=28)
    p.gap(6)
    prow(p, GA, [(X1, 958, "※ 뒤쪽의 유의사항 및 작성방법을 읽고 작성하시기 바랍니다.", {"kind": "free", "size": 7.5}),
                 (958, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    band = dict(SUB, fill=S["gray"], size=8)
    rb = prow(p, GA, [(X1, 388, "접수번호", band), (388, 851, "접수일", band), (851, 958, "처리기간", band), (958, X2, "7일", dict(band, valign="center"))], h=23)
    for x in (388, 851):
        vline(p, GA, rb, rb, x, S["gry"])
    p.gap(2)
    a = prow(p, GA, [(X1, XL, "신청인", dict(SUBC, size=10, rs=6)), (XL, 730, "성명(법인의 경우는 법인명 및 대표자의 성명)", SB),
                     (730, X2, "생년월일(법인등록번호)", SB)], h=14)
    b = prow(p, GA, [(XL, 730, inp("성명"), NB), (730, X2, inp("생년월일"), NB)], h=30)
    c = prow(p, GA, [(XL, 730, "주소(법인의 경우는 주된 사무소의 소재지)", SB), (730, X2, "전자우편", SB)], h=14)
    d = prow(p, GA, [(XL, 730, inp("주소", size=8.5), NB), (730, X2, inp("전자우편", size=8.5), NB)], h=24)
    e = prow(p, GA, [(XL, 730, "전화번호", SB), (730, X2, "휴대전화번호", SB)], h=14)
    f = prow(p, GA, [(XL, 730, inp("전화", size=8.5), NB), (730, X2, inp("휴대", size=8.5), NB)], h=24)
    for r in (b, d):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a, f, 730, S["lgt"])
    vline(p, GA, a, f, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, f, X1, X2, S["med"])
    p.gap(3)
    a2 = prow(p, GA, [(X1, XL, "신청내용", dict(SUBC, size=10, rs=10)), (XL, X2, "① 허가번호", SB)], h=14)
    b2 = prow(p, GA, [(XL, X2, inp("허가번호", size=8.5), NB)], h=22)
    prow(p, GA, [(XL, X2, "최초 허가기간", SB)], h=14)
    d2 = prow(p, GA, [(XL, X2, F("표최초", '=IF(OR(N({셈!최초시작})=0,N({셈!최초끝})=0),"",' + _ymd("{셈!최초시작}") + '&"  ~  "&' + _ymd("{셈!최초끝}") + ')',
                                 align="left", size=9), NB)], h=22)
    prow(p, GA, [(XL, X2, "② 점용의 목적", SB)], h=14)
    f2 = prow(p, GA, [(XL, X2, inp("목적", size=8.5), NB)], h=22)
    prow(p, GA, [(XL, X2, "점용의 장소 및 면적", SB)], h=14)
    h2 = prow(p, GA, [(XL, X2, inp("장소", size=8.5), NB)], h=22)
    prow(p, GA, [(XL, X2, "③ 도로의 종류 및 노선명", SB)], h=14)
    j2 = prow(p, GA, [(XL, 545, F("표도로", '=IF({셈!도로종류}="","",{셈!도로종류})', align="left", size=9), NB), (545, X2, inp("노선명", size=8.5), NB)], h=22)
    for r in (b2, d2, f2, h2):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a2, j2, XL, S["gry"])
    hline(p, GA, j2, X1, X2, S["thin"])
    p.gap(16)
    prow(p, GA, [(X1, X2, "「도로법」 제61조제1항 및 같은 법 시행규칙 제26조제2항에 따라 위와 같이 도로점용허가 기간연장을 신청합니다.",
                  {"kind": "free", "size": 9.5, "indent": 2, "wrap": True})], h=34)
    p.gap(14)
    prow(p, GA, [(X1, X2, F("신청일표시", '=IF(N({셈!신청일})=0,"년         월         일",YEAR({셈!신청일})&"년      "&MONTH({셈!신청일})&"월      "&DAY({셈!신청일})&"일")',
                             align="right", size=9), NB)], h=16)
    p.gap(14)
    prow(p, GA, [(X1, 470, "", NB), (470, 625, "신청인", dict(FRC, size=9.5)), (625, 958, F("신청인표시", '=IF({성명}="","",{성명})', align="center", size=8.5), NB),
                 (958, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)
    p.gap(14)
    r = prow(p, GA, [(X1, 545, inp("수신", blank="도로관리청", size=12, bold=True, align="center"), NB), (545, X2, "귀하", dict(FR, size=9.5))], h=24)
    hline(p, GA, r, X1, X2, S["med"])
    p.gap(66)                                    # 원문 빈 자리(굵은 줄 아래 ~ 수수료 칸)
    rf = prow(p, GA, [(X1, 851, "", NB), (851, X2, "수수료\n" + FEE, dict(FRC, size=7.5, wrap=True))], h=56)
    hline(p, GA, rf, X1, X2, S["thin"], below=False)
    hline(p, GA, rf, X1, X2, S["thin"])
    vline(p, GA, rf, rf, 851, S["lgt"])
    p.gap(8)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["최초 허가기간 · 도로의 종류 · 신청일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 장소)."])
    return p


# ── 뒤쪽 (원문 그대로) ──────────────────────────────────────────────────
BAX = [120, 288, 332, 502, 542, 699, 742, 820, 905, 951, 1120]
GB = Grid(BAX)


def dwi(bk, ex):
    from fb import text_lines
    S = _sides()
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=GB.w)
    X1, X2 = 120, 1120
    band = {"kind": "free", "size": 9.5, "bold": True, "align": "center", "fill": S["gray"]}
    tx = {"kind": "free", "size": 7.8, "align": "left", "wrap": True, "valign": "top"}

    def txt(x1, x2, t, size=7.8, extra=None):
        cols = sum(GB.w[GB.ix[x1]:GB.ix[x2]])
        n = text_lines(t, cols * 10.0 / size)
        return prow(p, GB, [(x1, x2, t, dict(tx, size=size))] + (extra or []), h=n * size * 1.45 + 6)

    prow(p, GB, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=15)
    r0 = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, r0, X1, X2, S["med"])
    p.gap(150)                                   # 원문 빈 자리(굵은 줄 아래 ~ 유의사항 띠)
    rb = prow(p, GB, [(X1, X2, "유의사항", band)], h=22)
    cols = sum(GB.w[GB.ix[288]:GB.ix[X2]])
    n = text_lines(GEUNGEO, cols * 10.0 / 7.8)
    rg = prow(p, GB, [(X1, 288, "근거법률", {"kind": "free", "size": 8.5, "align": "center"}), (288, X2, GEUNGEO, dict(tx, valign="center"))], h=max(26, n * 7.8 * 1.45 + 8))
    vline(p, GB, rg, rg, 288, S["lgt"])
    hline(p, GB, rg, X1, X2, S["lgt"])
    for t in YU:
        txt(X1, X2, t)
    rlast = p.r - 1
    hline(p, GB, rlast, X1, X2, S["thin"])
    p.gap(4)
    prow(p, GB, [(X1, X2, "작성방법", band)], h=22)
    for t in JAK:
        txt(X1, X2, t)
    hline(p, GB, p.r - 1, X1, X2, S["thin"])
    p.gap(4)
    prow(p, GB, [(X1, X2, "신청안내 및 처리절차", band)], h=22)
    gt, bs = "\n".join(GOT), "\n".join(BUSEO)
    n = max(text_lines(gt, sum(GB.w[GB.ix[288]:GB.ix[699]]) * 10.0 / 7.5) + 2, text_lines(bs, sum(GB.w[GB.ix[820]:GB.ix[X2]]) * 10.0 / 7.5) + 2)
    rs = prow(p, GB, [(X1, 288, "신청하는 곳", {"kind": "free", "size": 8.5, "align": "center"}), (288, 699, gt, dict(tx, size=7.5, valign="center")),
                      (699, 820, "담당부서", {"kind": "free", "size": 8.5, "align": "center"}), (820, X2, bs, dict(tx, size=7.5, valign="center"))],
              h=n * 7.5 * 1.45 + 8)
    for x in (288, 699, 820):
        vline(p, GB, rs, rs, x, S["lgt"])
    hline(p, GB, rs, X1, X2, S["thin"])
    p.gap(6)
    box = {"kind": "free", "size": 8.5, "align": "center"}
    rbx = prow(p, GB, [(X1, 288, "신청서 작성", box), (288, 332, "→", box), (332, 502, "접수", box), (502, 542, "→", box), (542, 699, "검토", box),
                       (699, 742, "→", box), (742, 905, "결재", box), (905, 951, "→", box), (951, X2, "허가증 발급", box)], h=24)
    for x1, x2 in ((X1, 288), (332, 502), (542, 699), (742, 905), (951, X2)):
        hline(p, GB, rbx, x1, x2, S["thin"], below=False)
        hline(p, GB, rbx, x1, x2, S["thin"])
        vline(p, GB, rbx, rbx, x1, S["thin"])
        vline(p, GB, rbx, rbx, x2, S["thin"])
    sm = {"kind": "free", "size": 8, "align": "center"}
    prow(p, GB, [(X1, 288, "신청인", sm), (288, 332, "", NB), (332, 502, "도로관리청", sm), (502, 542, "", NB), (542, 699, "도로관리청", sm),
                 (699, 742, "", NB), (742, 905, "도로관리청", sm), (905, 951, "", NB), (951, X2, "", NB)], h=18)   # 원문: 허가증 발급 밑은 비어 있음(글층 x 자리)
    p.gap(20)
    prow(p, GB, [(X1, X2, "210mm×297mm[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["뒤쪽은 원문 그대로입니다(도로법 시행규칙 별지 제25호서식)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)
    dwi(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
YOIL = "월화수목금토일"


def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def expect(pages):
    sm, fr = pages["셈"], pages["신청서"]
    a, b = {}, {}
    s0, e0, now, ext, sd = sm.get("최초시작"), sm.get("최초끝"), sm.get("지금끝"), sm.get("연장끝"), sm.get("신청일")
    end = now or e0 or None
    a["끝"] = end or ""
    a["연장"] = "" if (not end or not ext) else (GI_BAD if ext <= end else f"늘어나는 기간 {(ext - end).days}일(허가 끝날 다음 날부터)")
    if not sd:
        a["처리"] = ""
        dd = None
    else:
        dd = MW.처리끝(sd, 7)
        a["처리"] = f"{_ymdp(dd)}({YOIL[dd.weekday()]}){CH_A}" + ("" if MW.다덮음(sd, dd) else MW.밖글)
    for k in range(1, MW.되풀이 + 1):
        a["처끝" if k == MW.되풀이 else f"처E{k}"] = "" if not sd else MW.식흉내(sd, 7, k)
    if not sd or not end:
        a["판정"] = ""
    elif sd > end:
        a["판정"] = f"{PAN_GONE_A}{_ymdp(end)}{PAN_GONE_B}"
    elif MW.식흉내(sd, 7) > end:
        a["판정"] = f"{PAN_LATE_A}{_ymdp(end)}{PAN_LATE_B}"
    else:
        a["판정"] = f"{PAN_OK_A}{_ymdp(end)}{PAN_OK_B}{(end - sd).days}일 남음"
    rd = sm.get("도로종류")
    a["곳"] = "" if not rd else ("한국도로공사지사" if rd == "고속국도" else "국토관리사무소" if rd == "일반국도"
                                 else "특별시 · 광역시 · 특별자치시 · 도 · 특별자치도 · 시 · 군 · 구(읍 · 면 · 동)")
    a["부서"] = "" if not rd else ("도로과" if rd == "고속국도" else "보수과" if rd == "일반국도" else "건설과 · 건설관리과")
    keys = [("신청인 성명", not fr.get("성명")), ("주소", not fr.get("주소")), ("허가번호", not fr.get("허가번호")),
            ("최초 허가기간", not s0 or not e0), ("점용의 목적", not fr.get("목적")), ("점용의 장소 및 면적", not fr.get("장소")),
            ("도로의 종류", not rd), ("연장할 끝날", not ext), ("신청일", not sd)]
    if not rd and not fr.get("성명"):
        a["빈칸"] = ""
        a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT
    b["표최초"] = "" if (not s0 or not e0) else f"{_ymdp(s0)}  ~  {_ymdp(e0)}"
    b["표도로"] = rd or ""
    b["신청일표시"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["신청인표시"] = fr.get("성명") or ""
    return {"셈": a, "신청서": b}
