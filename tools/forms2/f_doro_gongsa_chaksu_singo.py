# -*- coding: utf-8 -*-
"""도로공사 착수 신고서 — 새로 만든 서식 (2026-11-17 G745 · 소장님 「그럼 이제 서식 10개만 만들자. 못 만든 서식...」 — 도로법 4종 둘째)
   → ① 공사시행 구간 길이 · 공사시행 일수 · 착수 신고 기한(착수한 날 다음 날부터 5일 · 끝날이 토 · 일 · 공휴일이면 다음 날) ·
     신고일 판정 · 허가 뒤 착수인지 · 아직 안 적은 칸
   · 신고서 한 쪽(도로법 시행규칙 [별지 제12호서식] 칸 차례 그대로 — 접수 띠 · 도로의 종류 · 노선번호 · 공사의 종류 · 공사시행 구간 ·
     허가 연월일 · 공사시행 기간 · 신고 문구 · 공사 시행자 · 도로관리청 귀하).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G745/구조.md — 바깥 90 ~ 1098 · 도로의 종류 | 노선번호 592 · 줄마다 가로줄).

근거(국가법령정보센터 · 2026-11-17 · 원문 /home/claude/g10/notes/G745/p1.txt(글층 해시 e04863e04191fc6e) · 조문 G744/근거.md — 세 번 같은 해시):
  · 도로법 [시행 2026. 9. 18.] 제36조 — ① 도로관리청이 아닌 자의 도로공사는 미리 허가 ② 허가를 받은 자는 공사착수 사실을 신고 · 준공하면 준공검사
  · 도로법 시행령 [시행 2026. 9. 18.] 제34조 — ③ 허가를 받은 자는 도로공사에 착수하였을 때 5일 이내에 도로관리청에 신고 · 준공하면 지체 없이 준공검사
  · 도로법 시행규칙 [시행 2026. 9. 18.] 제13조 — ③ 착수 신고 별지 제12호서식 · 준공검사 신청 별지 제13호서식
  · 민법 제157조(첫날 빼고) · 제161조(끝날이 토요일 · 공휴일이면 그다음 날) — G674 · G728 세 번 본 조문 · 민원기한.이월끝
■ 원문 그대로: 서식 머리 «■ 도로법 시행규칙 [별지 제12호서식]»(개정 표시 없음 · 처리기간 칸 없음) · «킬로미터» · «일간» · «공사 시행자».
■ 짐작 안 함: 착수한 날은 이용자가 적음(비우면 공사시행 기간 첫날) · 공휴일 표 밖은 토 · 일요일만 빼고 ⚠."""
import datetime

import sgw as g
from fb import F, I
from sgw import L
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, FR, FRR, FRC, NB, _ymd, _yo
import 민원기한 as MW

SLUG = "doro-gongsa-chaksu-singo"
TITLE = "도로공사 착수 신고서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "도로공사 착수 신고서(도로법 시행규칙 별지 제12호서식) — 빈 서식 (원문 칸 차례 그대로 · 한 쪽)"),
        (4, "도로공사 착수 신고서 — 작성 예시 (구간 · 허가 연월일 · 기간이 ① 장에서)"),
        (3, "① 구간 · 일수 · 착수 신고 기한(5일) · 신고일 판정 — 작성 예시 (가상의 현장)")]
MULTI = True
SHORT = ("도로공사 착수 신고서(도로법 시행규칙 별지 제12호서식) — 도로공사 시행 허가를 받은 자가 공사에 착수하면 5일 이내에 냅니다. "
         "착수한 날을 적으면 신고 기한(다음 날부터 5일 · 끝날이 토 · 일 · 공휴일이면 그다음 날)이, 신고일을 적으면 기한 안인지가 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
KM = '#,##0.000;;""'
ROADS = ["고속국도", "일반국도", "특별시도", "광역시도", "지방도", "시도", "군도", "구도"]

KM_BAD = "⚠ 종점이 시점보다 앞(작은 값)입니다 — 두 값의 차로 셈"
GI_BAD = "⚠ 끝날이 시작일보다 앞입니다"
CK_A = "까지 — 착수한 날 다음 날부터 5일(영 제34조제3항) · 끝날이 토 · 일 · 공휴일이면 그다음 날(민법 제157조 · 제161조)"
PAN_BEFORE = "⚠ 신고일이 착수한 날보다 앞입니다 — 착수 신고는 착수한 뒤에 냅니다"
PAN_LATE_A = "⚠ 신고 기한("
PAN_LATE_B = ")이 지났습니다 — 지금이라도 바로 내십시오"
PAN_OK = "✓ 기한 안에 냅니다"
HEO_BAD = "⚠ 허가 연월일보다 먼저 착수 — 도로관리청의 허가를 받은 뒤에 착수합니다(법 제36조제1항)"
HEO_OK = "✓ 허가를 받은 뒤 착수"
NEXT = "착수 신고 뒤: 공사를 마치면(준공) 지체 없이 준공조서 · 설계도서 · 비용정산서를 붙여 준공검사를 신청(별지 제13호서식 · 영 제34조제3항)"
BIN_OK = "✓ 신고서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 사람 · 번호) ─────────────────────────────────
EX = {"도로종류": "군도", "시점": 2.35, "종점": 2.6, "허가일": D(2027, 3, 2), "시작": D(2027, 3, 15), "끝": D(2027, 5, 31),
      "착수일": None, "신고일": D(2027, 3, 17)}
EX_S = {"노선번호": "군도 3호선", "노선명": "다라 ~ 마바", "공사종류": "도로 확장 · 포장(진입로 접속부)",
        "시행자": "가나건설(주) 대표이사 홍길동", "수신": "가나군수"}

HEAD = "■ 도로법 시행규칙 [별지 제12호서식]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  도로공사 착수 신고 — 구간 · 기간 · 신고 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 도로공사 시행 허가를 받은 자는 도로공사에 착수하였을 때 5일 이내에 도로관리청에 신고합니다(도로법 제36조제2항 · 시행령 제34조제3항). "
              "여기 적은 값이 신고서의 도로의 종류 · 공사시행 구간 · 허가 연월일 · 기간 · 일수로 들어갑니다.")
    g.sec(p, "㉮  도로 · 공사시행 구간 · 허가 · 기간", need=26 * 6 + 10)
    p.row([(3, "도로의 종류", L), (3, I("도로종류", ex=_ex(ex, "도로종류"), dv=",".join(ROADS), align="center", size=9)),
           (6, "고속국도 · 일반국도 · 특별시도 · 광역시도 · 지방도 · 시도 · 군도 · 구도", s7)], h=26)
    p.row([(3, "시점(킬로미터)", L), (3, I("시점", ex=_ex(ex, "시점"), fmt=KM, align="center", size=9)),
           (3, "종점(킬로미터)", L), (3, I("종점", ex=_ex(ex, "종점"), fmt=KM, align="center", size=9))], h=26)
    p.row([(3, "구간 길이", L),
           (9, F("구간", '=IF(OR({시점}="",{종점}=""),"",IF({종점}<{시점},"' + KM_BAD + ' · ","")&TEXT(ABS({종점}-{시점}),"0.000")&" 킬로미터")',
                 align="left", size=9))], h=26)
    p.row([(3, "허가 연월일", L), (3, I("허가일", ex=_ex(ex, "허가일"), fmt=DT, align="center", size=9)),
           (6, "도로공사 시행 허가를 받은 날(허가서)", s7)], h=26)
    p.row([(3, "공사 시작일", L), (3, I("시작", ex=_ex(ex, "시작"), fmt=DT, align="center", size=9)),
           (3, "공사 끝날", L), (3, I("끝", ex=_ex(ex, "끝"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "공사시행 일수", L),
           (9, F("일수", '=IF(OR(N({시작})=0,N({끝})=0),"",IF({끝}<{시작},"' + GI_BAD + '",({끝}-{시작}+1)&"일간(첫날 · 끝날 넣어 셈)"))',
                 align="left", size=9))], h=26)
    g.sec(p, "㉯  착수 신고 기한 · 신고일", need=26 * 4 + 36 + 10)
    p.row([(3, "착수한 날", L), (3, I("착수일", ex=_ex(ex, "착수일"), fmt=DT, align="center", size=9)),
           (6, "실제로 공사에 착수한 날 — 비우면 공사 시작일로 셈", s7)], h=26)
    p.row([(3, "셈에 쓰는 착수일", L),
           (3, F("착", '=IF(N({착수일})>0,{착수일},IF(N({시작})>0,{시작},""))', fmt=DT, align="center", size=9)),
           (6, "", s7)], h=26)
    p.row([(3, "착수 신고 기한", L),
           (9, F("기한", '=IF(N({착})=0,"",' + _ymd("{착끝}") + '&"("&' + _yo("{착끝}") + '&")' + CK_A + '"&IF(' + MW.덮음식("{착}", "{착끝}")
                 + ',"' + MW.밖글 + '",""))', align="left", size=8.5))], h=36)
    p.row([(3, "신 고 일", L), (3, I("신고일", ex=_ex(ex, "신고일"), fmt=DT, align="center", size=9)),
           (6, "신고서 끝 날짜로 들어갑니다", s7)], h=26)
    p.row([(3, "판      정", L),
           (9, F("판정", '=IF(OR(N({신고일})=0,N({착})=0),"",IF({신고일}<{착},"' + PAN_BEFORE + '",IF({신고일}>{착끝},"' + PAN_LATE_A + '"&'
                 + _ymd("{착끝}") + '&"' + PAN_LATE_B + '","' + PAN_OK + '")))', align="left", size=9))], h=26)
    p.row([(3, "허가 · 착수", L),
           (9, F("허가확인", '=IF(OR(N({허가일})=0,N({착})=0),"",IF({착}<{허가일},"' + HEO_BAD + '","' + HEO_OK + '"))', align="left", size=8.5))], h=26)
    g.sec(p, "㉰  아직 안 적은 칸 · 다음 할 일", need=40 + 40 + 10)
    BIN = [("도로의 종류", '{도로종류}=""'), ("노선번호", '{신고서!노선번호}=""'), ("공사의 종류", '{신고서!공사종류}=""'),
           ("공사시행 구간", 'OR({시점}="",{종점}="")'), ("허가 연월일", "N({허가일})=0"), ("공사시행 기간", "OR(N({시작})=0,N({끝})=0)"),
           ("신고일", "N({신고일})=0"), ("공사 시행자", '{신고서!시행자}=""')]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({도로종류}="",{신고서!시행자}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))',
                 align="left", size=8.5))], h=40)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(AND({도로종류}="",{신고서!시행자}=""),"","' + NEXT + '")', align="left", size=8))], h=40)
    MW.넣기_이월(p, "{착}", 5, "착")            # 숨은 줄 — 평일 공휴일 표 · 미룸 칸({착끝})
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 시점 · 종점 · 허가 연월일 · 공사 기간 · 착수한 날 · 신고일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 군도 확장 공사 — 2.350 ~ 2.600 킬로미터)."])
    return p


# ── 신고서(한 쪽) ─────────────────────────────────────────────────────────
# 원문 그림 줄 자리(notes/G745/구조.md): 바깥 90 ~ 1098 · 접수 띠 · 도로의 종류 | 노선번호 592 · 줄마다 가로줄(세로 없음)
PAX = [90, 327, 395, 445, 455, 470, 545, 592, 625, 655, 730, 740, 760, 815, 820, 840, 915, 958, 1050, 1098]
GA = Grid(PAX)


def form(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신고서", fit=1, widths=GA.w)
    X1, X2 = 90, 1098

    def inp(k, **kw):
        kw.setdefault("size", 9)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    SB = dict(SUB, size=8.5)
    prow(p, GA, [(X1, X2, HEAD, {"kind": "free", "size": 7.5})], h=13)
    p.gap(14)
    prow(p, GA, [(X1, X2, "도로공사 착수 신고서", {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=28)
    p.gap(12)
    band = dict(SUB, fill=S["gray"], size=8)
    rb = prow(p, GA, [(X1, 327, "접수번호", band), (327, X2, "접수일", band)], h=23)
    vline(p, GA, rb, rb, 327, S["gry"])
    p.gap(2)
    a = prow(p, GA, [(X1, 592, "도로의 종류", SB), (592, X2, "노선번호(노선명)", SB)], h=14)
    b = prow(p, GA, [(X1, 592, F("표도로", '=IF({셈!도로종류}="","",{셈!도로종류})', align="left", size=9), NB),
                     (592, 820, inp("노선번호", size=8.5), NB), (820, 840, "(", dict(FRC, size=9)), (840, 1050, inp("노선명", size=8.5, align="center"), NB),
                     (1050, X2, ")", dict(FR, size=9))], h=34)
    vline(p, GA, a, b, 592, S["lgt"])
    c = prow(p, GA, [(X1, X2, "공사의 종류", SB)], h=14)
    d = prow(p, GA, [(X1, X2, inp("공사종류", size=8.5), NB)], h=34)
    e = prow(p, GA, [(X1, X2, "공사시행 구간", SB)], h=14)
    f = prow(p, GA, [(X1, 395, F("표시점", '=IF({셈!시점}="","",{셈!시점})', fmt=KM, align="right", size=9), NB), (395, 455, "부터", dict(FRC, size=9)),
                     (455, 655, F("표종점", '=IF({셈!종점}="","",{셈!종점})', fmt=KM, align="right", size=9), NB), (655, 740, "까지 (", dict(FR, size=9)),
                     (740, 815, F("표길이", '=IF(OR({셈!시점}="",{셈!종점}=""),"",ABS({셈!종점}-{셈!시점}))', fmt=KM, align="right", size=9), NB),
                     (815, X2, "킬로미터)", dict(FR, size=9))], h=34)
    g_ = prow(p, GA, [(X1, X2, "허가 연월일", SB)], h=14)
    h_ = prow(p, GA, [(X1, 730, F("표허가", '=IF(N({셈!허가일})=0,"년           월           일",YEAR({셈!허가일})&"년    "&MONTH({셈!허가일})&"월    "&DAY({셈!허가일})&"일")',
                                  align="right", size=9), NB), (730, X2, "", NB)], h=34)
    i_ = prow(p, GA, [(X1, X2, "공사시행 기간", SB)], h=14)
    j_ = prow(p, GA, [(X1, 445, F("표시작", '=IF(N({셈!시작})=0,"         년       월       일부터",YEAR({셈!시작})&"년  "&MONTH({셈!시작})&"월  "&DAY({셈!시작})&"일부터")',
                                  align="right", size=9), NB),
                      (445, 760, F("표끝", '=IF(N({셈!끝})=0,"           년       월       일까지 (",YEAR({셈!끝})&"년  "&MONTH({셈!끝})&"월  "&DAY({셈!끝})&"일까지 (")',
                                   align="right", size=9), NB),
                      (760, 915, F("표일수", '=IF(OR(N({셈!시작})=0,N({셈!끝})=0,{셈!끝}<{셈!시작}),"",{셈!끝}-{셈!시작}+1)', fmt='#,##0;;""', align="right", size=9), NB),
                      (915, X2, "일간)", dict(FR, size=9))], h=34)
    for r in (b, d, f, h_):
        hline(p, GA, r, X1, X2, S["lgt"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, j_, X1, X2, S["thin"])
    p.gap(40)
    prow(p, GA, [(X1, X2, "「도로법」 제36조제2항, 같은 법 시행령 제34조제3항 및 같은 법 시행규칙 제13조제3항에 따라 위와 같이 도로공사에 착수하였음을 신고합니다.",
                  {"kind": "free", "size": 9.5, "indent": 2, "wrap": True})], h=34)
    p.gap(18)
    prow(p, GA, [(X1, X2, F("신고일표시", '=IF(N({셈!신고일})=0,"년         월         일",YEAR({셈!신고일})&"년      "&MONTH({셈!신고일})&"월      "&DAY({셈!신고일})&"일")',
                             align="right", size=9), NB)], h=16)
    p.gap(20)
    prow(p, GA, [(X1, 470, "", NB), (470, 625, "공사 시행자", dict(FRC, size=9.5)), (625, 958, inp("시행자", size=8.5, align="center"), NB),
                 (958, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)
    p.gap(18)
    r = prow(p, GA, [(X1, 545, inp("수신", blank="도로관리청", size=12, bold=True, align="center"), NB), (545, X2, "귀하", dict(FR, size=9.5))], h=24)
    hline(p, GA, r, X1, X2, S["med"])
    p.gap(220)                                   # 원문 빈 자리(굵은 줄 아래 ~ 종이 크기 글)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지 80g/㎡]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["도로의 종류 · 구간 · 허가 연월일 · 기간 · 일수 · 신고일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 장소)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
YOIL = "월화수목금토일"


def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def _n(v):
    return None if v in (None, "") else float(v)


def expect(pages):
    sm, fr = pages["셈"], pages["신고서"]
    a, b = {}, {}
    s0, s1 = _n(sm.get("시점")), _n(sm.get("종점"))
    a["구간"] = "" if (s0 is None or s1 is None) else (KM_BAD + " · " if s1 < s0 else "") + f"{abs(s1 - s0):.3f} 킬로미터"
    st, en = sm.get("시작"), sm.get("끝")
    a["일수"] = "" if (not st or not en) else (GI_BAD if en < st else f"{(en - st).days + 1}일간(첫날 · 끝날 넣어 셈)")
    ck = sm.get("착수일") or st or None
    a["착"] = ck or ""
    seq = MW.이월흉내(ck, 5) if ck else []
    for k in range(1, MW.이월되풀이 + 1):
        a["착끝" if k == MW.이월되풀이 else f"착E{k}"] = seq[k - 1] if ck else ""
    ke = seq[-1] if ck else None
    if not ck:
        a["기한"] = ""
    else:
        a["기한"] = f"{_ymdp(ke)}({YOIL[ke.weekday()]}){CK_A}" + ("" if MW.다덮음(ck, ke) else MW.밖글)
    sd = sm.get("신고일")
    if not sd or not ck:
        a["판정"] = ""
    elif sd < ck:
        a["판정"] = PAN_BEFORE
    elif sd > ke:
        a["판정"] = f"{PAN_LATE_A}{_ymdp(ke)}{PAN_LATE_B}"
    else:
        a["판정"] = PAN_OK
    hd = sm.get("허가일")
    a["허가확인"] = "" if (not hd or not ck) else (HEO_BAD if ck < hd else HEO_OK)
    rd = sm.get("도로종류")
    keys = [("도로의 종류", not rd), ("노선번호", not fr.get("노선번호")), ("공사의 종류", not fr.get("공사종류")),
            ("공사시행 구간", s0 is None or s1 is None), ("허가 연월일", not hd), ("공사시행 기간", not st or not en),
            ("신고일", not sd), ("공사 시행자", not fr.get("시행자"))]
    if not rd and not fr.get("시행자"):
        a["빈칸"] = ""
        a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT
    b["표도로"] = rd or ""
    b["표시점"] = s0 if s0 is not None else ""
    b["표종점"] = s1 if s1 is not None else ""
    b["표길이"] = "" if (s0 is None or s1 is None) else abs(s1 - s0)
    b["표허가"] = "년           월           일" if not hd else f"{hd.year}년    {hd.month}월    {hd.day}일"
    b["표시작"] = "         년       월       일부터" if not st else f"{st.year}년  {st.month}월  {st.day}일부터"
    b["표끝"] = "           년       월       일까지 (" if not en else f"{en.year}년  {en.month}월  {en.day}일까지 ("
    b["표일수"] = "" if (not st or not en or en < st) else (en - st).days + 1
    b["신고일표시"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    return {"셈": a, "신고서": b}
