# -*- coding: utf-8 -*-
"""도로점용허가 변경 신청서 — 새로 만든 서식 (2026-11-17 G747 · 소장님 「그럼 이제 서식 10개만 만들자. 못 만든 서식...」 — 도로법 4종 넷째)
   → ① 신청하는 곳 · 담당부서 · 처리기간(뒤쪽 표: 점용의 구분 × 도로관리청 — 경찰 협의 일수) · 접수 → 처리 ·
     처리 기한(5일 이하는 시간 단위 · 6일 이상은 근무일 — 민원처리법 제19조) · 허가기간 · 끝나기 전인지 · 아직 안 적은 칸
   · 신청서 앞쪽(도로법 시행규칙 [별지 제26호서식] 칸 차례 그대로 — ④ 변경내용 · 첨부서류) · 뒤쪽(유의사항 · 작성방법 · 처리기간 표 · 신청안내 — 원문 그대로).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G747/구조.md — 앞 바깥 121 ~ 1122 · 232 · 730 · 첨부 225 · 839 /
   뒤 처리기간 표 |267,324,377,450,567,684,742,893,1026 · 신청안내 273 · 703 · 814 · 처리절차 상자).

근거(국가법령정보센터 · 2026-11-17 · 원문 /home/claude/g10/notes/G747/p1.txt · p2.txt(글층 해시 c4f8786b39735358 · 6f1f0349bd37ce39) · 조문 G746/근거.md — 세 번):
  · 도로법 [시행 2026. 9. 18.] 제61조① — 허가받은 사항을 변경하려는 때에도 도로관리청의 허가
  · 도로법 시행규칙 [시행 2026. 9. 18.] 제26조② — 변경은 별지 제26호서식
  · 「민원 처리에 관한 법률」 제19조 — ① 5일 이하: 접수시각부터 «시간» 단위(1일 = 8시간 · 토 · 공휴일 빼고) ② 6일 이상: 첫날 넣고 토 · 일 · 공휴일 빼고
■ 원문 그대로: 머리 «■ 도로법 시행규칙 [별지 제26호서식]»(개정 표시 없음) · 처리기간 «뒤쪽 참조» · 처리기간 표(국토교통부 칸 머리줄은 «접수 · 처리» 둘 — 원문대로) ·
  근거법률 «…받아야 함» · 작성방법 2 «점용목적».
■ 짐작 안 함: 처리기간은 뒤쪽 표 그대로 고름 · 수수료는 서식 글 그대로(조례 금액은 도로관리청 확인)."""
import datetime
import re

import sgw as g
from fb import F, I
from sgw import L
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd, _yo
import 민원기한 as MW

SLUG = "doro-jeomyong-byeongyeong"
TITLE = "도로점용허가 변경 신청서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "도로점용허가 변경 신청서(도로법 시행규칙 별지 제26호서식 앞쪽) — 빈 서식 (원문 칸 차례 그대로)"),
        (5, "도로점용허가 변경 신청서 — 작성 예시 (허가기간 · 도로의 종류가 ① 장에서)"),
        (4, "① 처리기간(뒤쪽 표) · 처리 기한 · 신청하는 곳 — 작성 예시 (가상의 현장)"),
        (3, "뒤쪽 — 유의사항 · 작성방법 · 처리기간 표 · 신청안내 및 처리절차 (원문 그대로)")]
MULTI = True
SHORT = ("도로점용허가 변경 신청서(도로법 시행규칙 별지 제26호서식) — 허가받은 점용 사항을 바꿀 때 냅니다. 도로의 종류 · 도로관리청 · 점용의 구분을 고르면 "
         "처리기간(뒤쪽 표)과 처리 기한, 신청하는 곳 · 담당부서가 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
ROADS = ["고속국도", "일반국도", "특별시도", "광역시도", "지방도", "시도", "군도", "구도"]
GWAN = ["특별시", "광역시 · 도", "특별자치시 · 특별자치도", "국토교통부"]
GUBUN = ["도로의 일반점용", "도로의 일시점용", "아치 및 육교 사용", "공작물의 설치", "도로의 굴착"]
GUKTO = "지방국토관리청\n국토관리사무소"
# 뒤쪽 «처리기간» 표(원문 그대로 — G747/p2.txt) — 점용의 구분 × (특별시 · 광역시 및 도 · 국토교통부) → (접수, 처리, 기간)
TBL = [
    [("동", "구", "5일(3일)"), ("구ㆍ읍ㆍ면", "시ㆍ군", "5일(3일)"), (GUKTO, GUKTO, "7일(5일)")],
    [("동", "시", "2일"), ("구ㆍ시ㆍ읍ㆍ면", "구ㆍ시ㆍ읍ㆍ면", "2일"), (GUKTO, GUKTO, "7일(5일)")],
    [("시", "시", "4일(3일)"), ("시ㆍ군", "시ㆍ군", "4일(3일)"), (GUKTO, GUKTO, "7일(3일)")],
    [("구", "구", "10일(5일)"), ("구ㆍ시ㆍ군", "시ㆍ도", "8일(5일)"), (GUKTO, GUKTO, "7일(5일)")],
    [("구", "구", "10일(5일)"), ("구ㆍ시ㆍ군", "구ㆍ시ㆍ군", "5일(3일)"), (GUKTO, GUKTO, "7일(5일)")],
]
NAMES = ["도로의\n일반점용", "도로의\n일시점용", "아치 및\n육교 사용", "공작물의 설치", "도로의 굴착"]
BIGO = ["1. 특별자치시 및 특별자치도의 경우 도로점용허가 변경신청은 직접 접수하고 처리하며, 그 처리기간은 점용의 구분에 따라 광역시 및 도의 처리기간을 적용합니다.",
        "2. (   )안의 일수는 전체 처리기간 중 경찰청(경찰서)과의 협의처리기간입니다."]
GEUNGEO = "도로구역에서의 도로점용은 도로관리청의 허가를 받아야 함(「도로법」 제61조제1항)."
YU = ["1. 허가를 받지 않고 도로를 점용하는 경우에는 2년 이하의 징역 또는 2천만원 이하의 벌금을 물게 되며, 변상금이 부과됩니다(「도로법」 제72조 및 제114조제6호).",
      "2. 허가를 받은 자는 관계 규정에 따라 점용료를 납부하여야 하며, 허가면적을 초과하여 점용한 경우에는 300만원 이하의 과태료가 부과됩니다(「도로법」 제117조제2항제1호).",
      "3. 도로굴착을 수반하는 점용의 경우에는 도로점용허가 신청 전에 점용에 관한 사업계획서 등을 도로관리청에 제출하여 도로관리심의회의 조정을 받아야 합니다"
      "(「도로법 시행령」 제56조제1항).",
      "4. 점용기간을 연장하려는 경우에는 허가기간이 끝나기 전까지 연장허가를 받아야 합니다."]
JAK = ["1. ①에는 이미 허가받은 허가번호를 적습니다.",
       "2. ②에는 휴게소, 주유소, 공장, 아파트, 진입로 등 점용목적을 적습니다.",
       "3. ③에는 고속국도ㆍ일반국도ㆍ특별시도ㆍ광역시도ㆍ지방도ㆍ시도ㆍ군도ㆍ구도로 구분하고, 노선번호를 적습니다(예: 국도 ○○호선 등).",
       "4. ④에는 최초 허가사항을 변경하려는 내용을 적습니다."]
GOT = ["1. 고속국도: 한국도로공사지사", "2. 일반국도: 국토관리사무소",
       "3. 특별시도ㆍ광역시도ㆍ지방도ㆍ시도ㆍ군도ㆍ구도: 특별시ㆍ광역시ㆍ특별자치시ㆍ도ㆍ특별자치도ㆍ시ㆍ군ㆍ구(읍ㆍ면ㆍ동)"]
BUSEO = ["1. 고속국도: 도로과", "2. 일반국도: 보수과", "3. 특별시도ㆍ광역시도ㆍ지방도ㆍ시도ㆍ군도ㆍ구도: 건설과ㆍ건설관리과"]
FEE = "1,000원 또는 행정청이 속하는 지방자치단체의 조례로 정하는 금액"
ATT = "변경내용과 관련된 서류ㆍ도면 등"
JAGI = "특별자치시 · 특별자치도가 직접 접수하고 처리(뒤쪽 비고 1)"

CH6 = "까지 — 신청서를 받은 날을 1일로 토 · 일 · 공휴일 빼고 셈(6일 이상 · 민원처리법 제19조②)"
CH5 = " 받은 시각까지 — 5일 이하는 받은 때부터 근무시간으로 셈(1일 = 8시간 · 토 · 일 · 공휴일 빼고 · 민원처리법 제19조①)"
CH5_OFF = " 근무시간 끝까지 — 쉬는 날 받으면 다음 근무일부터 근무시간으로 셈(1일 = 8시간 · 민원처리법 제19조①)"
PAN_GONE_A = "⚠ 허가기간이 끝난 뒤입니다("
PAN_GONE_B = ") — 도로관리청에 먼저 물어보십시오"
PAN_LATE_A = "⚠ 처리 기한이 허가 끝날("
PAN_LATE_B = ")보다 늦습니다 — 기간도 늘려야 하면 기간연장 신청(별지 제25호서식)을 함께 내십시오(뒤쪽 유의사항 4)"
PAN_OK = "✓ 허가기간 안에 처리 기한이 옵니다"
NEXT = "변경허가를 받으면 바뀐 내용대로 점용 · 점용료를 냅니다(뒤쪽 유의사항 2) · 허가면적을 넘게 점용하면 과태료(유의사항 2)"
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 사람 · 번호) ─────────────────────────────────
EX = {"도로종류": "군도", "관할": "광역시 · 도", "구분": "공작물의 설치", "허가시작": D(2025, 6, 1), "허가끝": D(2028, 5, 31), "신청일": D(2027, 3, 2)}
EX_S = {"성명": "가나상사(주) 대표이사 홍길동", "생년월일": "000000-0000000", "주소": "가나시 다라구 마바로 12", "전자우편": "gana@example.com",
        "전화": "000-0000-0000", "휴대": "010-0000-0000", "허가번호": "가나군 도로점용 제2025-000호", "목적": "공장 진입로",
        "장소": "가나군 다라면 마바리 123-4 일원 · 48.0㎡", "노선명": "군도 3호선(다라 ~ 마바)",
        "변경": "점용 면적 48.0㎡ → 60.0㎡(진입로 폭 4.0 m → 5.0 m 넓힘 · 변경 평면도 붙임)", "수신": "가나군수"}

HEAD = "■ 도로법 시행규칙 [별지 제26호서식]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def _num(key, items):
    s = "0"
    for n, t in reversed(list(enumerate(items, 1))):
        s = f'IF({{{key}}}="{t}",{n},{s})'
    return s


def _gh(key="관할"):
    return f'IF({{{key}}}="특별시",1,IF(OR({{{key}}}="광역시 · 도",{{{key}}}="특별자치시 · 특별자치도"),2,IF({{{key}}}="국토교통부",3,0)))'


def _days(t):
    m = re.match(r"(\d+)일(?:\((\d+)일\))?", t)
    return int(m.group(1)), (int(m.group(2)) if m.group(2) else 0)


def _pick(fn):
    vals = []
    for row in TBL:
        for col in (0, 1, 2):
            vals.append(fn(row[col]))
    return ",".join(str(v) if isinstance(v, int) else f'"{v}"' for v in vals)


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  도로점용허가 변경 — 처리기간 · 처리 기한 · 신청하는 곳 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 허가받은 점용 사항을 바꾸려면 다시 도로관리청의 허가를 받아야 합니다(도로법 제61조제1항). 처리기간은 서식 뒤쪽 표(점용의 구분 × 도로관리청)대로 "
              "고르고, 여기 적은 허가기간 · 도로의 종류가 신청서로 들어갑니다.")
    gb, gh = _num("구분", GUBUN), _gh()
    idx = f"(({gb})-1)*3+({gh})"
    g.sec(p, "㉮  어디에 내나 · 처리기간 (뒤쪽 신청안내 · 처리기간 표)", need=26 * 7 + 10)
    p.row([(3, "도로의 종류", L), (3, I("도로종류", ex=_ex(ex, "도로종류"), dv=",".join(ROADS), align="center", size=9)),
           (6, "고속국도 · 일반국도 · 특별시도 · 광역시도 · 지방도 · 시도 · 군도 · 구도", s7)], h=26)
    p.row([(3, "신청하는 곳", L),
           (9, F("곳", '=IF({도로종류}="","",IF({도로종류}="고속국도","한국도로공사지사",IF({도로종류}="일반국도","국토관리사무소",'
                 '"특별시 · 광역시 · 특별자치시 · 도 · 특별자치도 · 시 · 군 · 구(읍 · 면 · 동)")))', align="left", size=8.5))], h=26)
    p.row([(3, "담당부서", L),
           (9, F("부서", '=IF({도로종류}="","",IF({도로종류}="고속국도","도로과",IF({도로종류}="일반국도","보수과","건설과 · 건설관리과")))',
                 align="left", size=9))], h=26)
    p.row([(3, "도로관리청", L), (3, I("관할", ex=_ex(ex, "관할"), dv=",".join(GWAN), align="center", size=9)),
           (6, "도로를 맡은 관청 — 특별시 · 광역시 · 도 · 특별자치시 · 특별자치도 · 국토교통부(국토관리사무소 등)", s7)], h=26)
    p.row([(3, "점용의 구분", L), (3, I("구분", ex=_ex(ex, "구분"), dv=",".join(GUBUN), align="center", size=9)),
           (6, "일반점용 · 일시점용 · 아치 및 육교 사용 · 공작물의 설치 · 도로의 굴착", s7)], h=26)
    p.row([(3, "처리기간", L),
           (2, F("처일수", f'=IF(OR({gb}=0,{gh}=0),"",CHOOSE({idx},{_pick(lambda c: _days(c[2])[0])}))', fmt='0"일";;""', align="center", size=9.5, bold=True)),
           (7, F("경찰글", f'=IF(OR({gb}=0,{gh}=0),"",IF(CHOOSE({idx},{_pick(lambda c: _days(c[2])[1])})=0,"경찰 협의 없음",'
                          f'"그중 경찰청(경찰서) 협의 "&CHOOSE({idx},{_pick(lambda c: _days(c[2])[1])})&"일(뒤쪽 비고 2)"))', align="left", size=8.5))], h=26)
    p.row([(3, "접수 → 처리", L),
           (9, F("접수처리", f'=IF(OR({gb}=0,{gh}=0),"",IF({{관할}}="특별자치시 · 특별자치도","{JAGI}",'
                            f'"접수 "&CHOOSE({idx},{_pick(lambda c: c[0].replace(chr(10), " "))})&"  →  처리 "&CHOOSE({idx},{_pick(lambda c: c[1].replace(chr(10), " "))})))',
                 align="left", size=8.5))], h=26)
    g.sec(p, "㉯  허가기간 · 신청일 · 처리 기한", need=26 * 2 + 36 * 2 + 10)
    p.row([(3, "허가 시작일", L), (3, I("허가시작", ex=_ex(ex, "허가시작"), fmt=DT, align="center", size=9)),
           (3, "허가 끝날", L), (3, I("허가끝", ex=_ex(ex, "허가끝"), fmt=DT, align="center", size=9))], h=26)
    p.row([(3, "신 청 일", L), (3, I("신청일", ex=_ex(ex, "신청일"), fmt=DT, align="center", size=9)),
           (3, "셈 시작일", L),
           (3, F("처시작", '=IF(OR(N({신청일})=0,N({처일수})=0),"",IF(AND({처일수}<=5,WEEKDAY({신청일},2)<=5,'
                 'COUNTIFS({처휴[]},">="&{신청일},{처휴[]},"<="&{신청일})=0),{신청일}+1,{신청일}))', fmt=DT, align="center", size=8.5))], h=26)
    쉼 = 'OR(WEEKDAY({신청일},2)>5,COUNTIFS({처휴[]},">="&{신청일},{처휴[]},"<="&{신청일})>0)'
    p.row([(3, "처리 기한", L),
           (9, F("처리", '=IF(OR(N({신청일})=0,N({처일수})=0),"",' + _ymd("{처끝}") + '&"("&' + _yo("{처끝}") + '&")"&IF({처일수}>=6,"' + CH6 + '",IF('
                 + 쉼 + ',"' + CH5_OFF + '","' + CH5 + '"))&IF(' + MW.덮음식("{신청일}", "{처끝}") + ',"' + MW.밖글 + '",""))', align="left", size=8.5))], h=36)
    p.row([(3, "판      정", L),
           (9, F("판정", '=IF(OR(N({신청일})=0,N({허가끝})=0,N({처일수})=0),"",IF({신청일}>{허가끝},"' + PAN_GONE_A + '"&' + _ymd("{허가끝}") + '&"'
                 + PAN_GONE_B + '",IF({처끝}>{허가끝},"' + PAN_LATE_A + '"&' + _ymd("{허가끝}") + '&"' + PAN_LATE_B + '","' + PAN_OK + '")))',
                 align="left", size=8.5))], h=36)
    g.sec(p, "㉰  아직 안 적은 칸 · 다음 할 일", need=40 + 40 + 10)
    BIN = [("신청인 성명", '{신청서!성명}=""'), ("주소", '{신청서!주소}=""'), ("허가번호", '{신청서!허가번호}=""'),
           ("허가기간", "OR(N({허가시작})=0,N({허가끝})=0)"), ("점용의 목적", '{신청서!목적}=""'), ("점용의 장소 및 면적", '{신청서!장소}=""'),
           ("도로의 종류", '{도로종류}=""'), ("변경내용", '{신청서!변경}=""'), ("신청일", "N({신청일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({도로종류}="",{신청서!성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))',
                 align="left", size=8.5))], h=40)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(AND({도로종류}="",{신청서!성명}=""),"","' + NEXT + '")', align="left", size=8))], h=40)
    MW.넣기(p, "{처시작}", "{처일수}", "처")
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 도로의 종류 · 도로관리청 · 점용의 구분 · 허가기간 · 신청일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공장 진입로 — 점용 면적 넓힘)."])
    return p


# ── 앞쪽 ────────────────────────────────────────────────────────────────
PAX = [121, 232, 388, 470, 545, 625, 730, 839, 851, 958, 1122]
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
    prow(p, GA, [(X1, X2, "도로점용허가 변경 신청서", {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=28)
    p.gap(6)
    prow(p, GA, [(X1, 958, "※ 뒤쪽의 유의사항 및 작성방법을 읽고 작성하시기 바랍니다.", {"kind": "free", "size": 7.5}),
                 (958, X2, "(앞쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    band = dict(SUB, fill=S["gray"], size=8)
    rb = prow(p, GA, [(X1, 388, "접수번호", band), (388, 851, "접수일", band), (851, 958, "처리기간", band), (958, X2, "뒤쪽 참조", dict(band, valign="center"))], h=23)
    for x in (388, 851):
        vline(p, GA, rb, rb, x, S["gry"])
    p.gap(2)
    a = prow(p, GA, [(X1, XL, "신청인", dict(SUBC, size=10, rs=6)), (XL, 730, "성명(법인의 경우는 법인명 및 대표자의 성명)", SB),
                     (730, X2, "생년월일(법인등록번호)", SB)], h=14)
    b = prow(p, GA, [(XL, 730, inp("성명"), NB), (730, X2, inp("생년월일"), NB)], h=28)
    prow(p, GA, [(XL, 730, "주소(법인의 경우는 주된 사무소의 소재지)", SB), (730, X2, "전자우편", SB)], h=14)
    d = prow(p, GA, [(XL, 730, inp("주소", size=8.5), NB), (730, X2, inp("전자우편", size=8.5), NB)], h=24)
    prow(p, GA, [(XL, 730, "전화번호", SB), (730, X2, "휴대전화번호", SB)], h=14)
    f = prow(p, GA, [(XL, 730, inp("전화", size=8.5), NB), (730, X2, inp("휴대", size=8.5), NB)], h=24)
    for r in (b, d):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a, f, 730, S["lgt"])
    vline(p, GA, a, f, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, f, X1, X2, S["med"])
    p.gap(3)
    a2 = prow(p, GA, [(X1, XL, "신청내용", dict(SUBC, size=10, rs=12)), (XL, X2, "① 허가번호", SB)], h=14)
    b2 = prow(p, GA, [(XL, X2, inp("허가번호", size=8.5), NB)], h=22)
    prow(p, GA, [(XL, X2, "허가기간", SB)], h=14)
    d2 = prow(p, GA, [(XL, X2, F("표허가", '=IF(OR(N({셈!허가시작})=0,N({셈!허가끝})=0),"",' + _ymd("{셈!허가시작}") + '&"  ~  "&' + _ymd("{셈!허가끝}") + ')',
                                 align="left", size=9), NB)], h=22)
    prow(p, GA, [(XL, X2, "② 점용의 목적", SB)], h=14)
    f2 = prow(p, GA, [(XL, X2, inp("목적", size=8.5), NB)], h=22)
    prow(p, GA, [(XL, X2, "점용의 장소 및 면적", SB)], h=14)
    h2 = prow(p, GA, [(XL, X2, inp("장소", size=8.5), NB)], h=22)
    prow(p, GA, [(XL, X2, "③ 도로의 종류 및 노선명", SB)], h=14)
    j2 = prow(p, GA, [(XL, 545, F("표도로", '=IF({셈!도로종류}="","",{셈!도로종류})', align="left", size=9), NB), (545, X2, inp("노선명", size=8.5), NB)], h=22)
    prow(p, GA, [(XL, X2, "④ 변경내용", SB)], h=14)
    l2 = prow(p, GA, [(XL, X2, inp("변경", size=8.5, wrap=True), NB)], h=30)
    for r in (b2, d2, f2, h2, j2):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a2, l2, XL, S["gry"])
    hline(p, GA, l2, X1, X2, S["thin"])
    p.gap(16)
    prow(p, GA, [(X1, X2, "「도로법」 제61조제1항 및 같은 법 시행규칙 제26조제2항에 따라 위와 같이 도로점용허가의 변경을 신청합니다.",
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
    p.gap(50)                                    # 원문 빈 자리(굵은 줄 아래 ~ 첨부서류 칸)
    rf = prow(p, GA, [(X1, XL, "첨부서류", dict(FRC, size=8.5)), (XL, 839, ATT, dict(FR, size=8.5, indent=1)),
                      (839, X2, "수수료\n" + FEE, dict(FRC, size=7.5, wrap=True))], h=56)
    hline(p, GA, rf, X1, X2, S["thin"], below=False)
    hline(p, GA, rf, X1, X2, S["thin"])
    for x in (XL, 839):
        vline(p, GA, rf, rf, x, S["lgt"])
    p.gap(8)
    prow(p, GA, [(X1, X2, "210mm×297mm[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["허가기간 · 도로의 종류 · 신청일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 장소)."])
    return p


# ── 뒤쪽 (원문 그대로) ──────────────────────────────────────────────────
BAX = [120, 267, 273, 324, 332, 377, 450, 502, 542, 567, 684, 699, 703, 742, 814, 893, 905, 951, 1026, 1120]
GB = Grid(BAX)


def dwi(bk, ex):
    from fb import text_lines
    S = _sides()
    p = g.pg(bk, ex, "뒤쪽", fit=1, widths=GB.w)
    X1, X2 = 120, 1120
    band = {"kind": "free", "size": 9.5, "bold": True, "align": "center", "fill": S["gray"]}
    tx = {"kind": "free", "size": 7.8, "align": "left", "wrap": True, "valign": "top"}

    def wid(x1, x2):
        return sum(GB.w[GB.ix[x1]:GB.ix[x2]])

    def txt(x1, x2, t, size=7.8):
        n = text_lines(t, wid(x1, x2) * 10.0 / size)
        return prow(p, GB, [(x1, x2, t, dict(tx, size=size))], h=n * size * 1.45 + 6)

    prow(p, GB, [(X1, X2, "(뒤쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=15)
    r0 = prow(p, GB, [(X1, X2, "", NB)], h=2)
    hline(p, GB, r0, X1, X2, S["med"])
    p.gap(20)
    prow(p, GB, [(X1, X2, "유의사항", band)], h=22)
    n = text_lines(GEUNGEO, wid(267, X2) * 10.0 / 7.8)
    rg = prow(p, GB, [(X1, 267, "근거법률", {"kind": "free", "size": 8.5, "align": "center"}), (267, X2, GEUNGEO, dict(tx, valign="center"))], h=max(26, n * 7.8 * 1.45 + 8))
    vline(p, GB, rg, rg, 267, S["lgt"])
    hline(p, GB, rg, X1, X2, S["lgt"])
    for t in YU:
        txt(X1, X2, t)
    hline(p, GB, p.r - 1, X1, X2, S["thin"])
    p.gap(4)
    prow(p, GB, [(X1, X2, "작성방법", band)], h=22)
    for t in JAK:
        txt(X1, X2, t)
    hline(p, GB, p.r - 1, X1, X2, S["thin"])
    p.gap(4)
    prow(p, GB, [(X1, X2, "처리기간", band)], h=22)
    hd = {"kind": "free", "size": 8, "align": "center"}
    h1 = prow(p, GB, [(X1, 267, "점용의 구분", dict(hd, rs=2)), (267, 450, "특별시", hd), (450, 742, "광역시 및 도", hd), (742, X2, "국토교통부", hd)], h=18)
    h2 = prow(p, GB, [(267, 324, "접수", hd), (324, 377, "처리", hd), (377, 450, "기간", hd), (450, 567, "접수", hd), (567, 684, "처리", hd),
                      (684, 742, "기간", hd), (742, 893, "접수", hd), (893, X2, "처리", hd)], h=18)
    c8 = {"kind": "free", "size": 7.8, "align": "center", "wrap": True}
    rows = []
    for k, (nm, row) in enumerate(zip(NAMES, TBL)):
        (a1, b1, c1), (a2, b2, c2), (a3, b3, c3) = row
        il = lambda t: t.replace("(", "\n(")         # «5일(3일)» 이 좁은 칸에서 «)» 만 넘어가지 않게(별지 제24호서식과 같은 꼴)
        cells = [(X1, 267, nm, c8), (267, 324, a1, c8), (324, 377, b1, c8), (377, 450, il(c1), c8), (450, 567, a2, c8), (567, 684, b2, c8), (684, 742, il(c2), c8)]
        if k == 0:
            cells += [(742, 893, a3, dict(c8, rs=5)), (893, 1026, b3, dict(c8, rs=5))]
        cells += [(1026, X2, il(c3), c8)]
        rows.append(prow(p, GB, cells, h=24))
    for x in (267, 324, 377, 450, 567, 684, 742, 893):
        vline(p, GB, h1 if x in (267, 450, 742) else h2, rows[-1], x, S["lgt"])
    vline(p, GB, rows[0], rows[-1], 1026, S["lgt"])
    hline(p, GB, h1, 267, X2, S["lgt"])
    hline(p, GB, h2, X1, X2, S["lgt"])
    for r in rows[:-1]:
        hline(p, GB, r, X1, 742, S["lgt"])
        hline(p, GB, r, 1026, X2, S["lgt"])
    hline(p, GB, rows[-1], X1, X2, S["lgt"])
    bg = "\n".join(BIGO)
    n = text_lines(bg, wid(267, X2) * 10.0 / 7.5) + 1
    rbg = prow(p, GB, [(X1, 267, "비고", {"kind": "free", "size": 8.5, "align": "center"}), (267, X2, bg, dict(tx, size=7.5, valign="center"))], h=n * 7.5 * 1.45 + 8)
    vline(p, GB, rbg, rbg, 267, S["lgt"])
    hline(p, GB, rbg, X1, X2, S["thin"])
    p.gap(4)
    prow(p, GB, [(X1, X2, "신청안내 및 처리절차", band)], h=22)
    gt, bs = "\n".join(GOT), "\n".join(BUSEO)
    n = max(text_lines(gt, wid(273, 703) * 10.0 / 7.5) + 2, text_lines(bs, wid(814, X2) * 10.0 / 7.5) + 2)
    rs = prow(p, GB, [(X1, 273, "신청하는 곳", {"kind": "free", "size": 8.5, "align": "center"}), (273, 703, gt, dict(tx, size=7.5, valign="center")),
                      (703, 814, "담당부서", {"kind": "free", "size": 8.5, "align": "center"}), (814, X2, bs, dict(tx, size=7.5, valign="center"))],
              h=n * 7.5 * 1.45 + 8)
    for x in (273, 703, 814):
        vline(p, GB, rs, rs, x, S["lgt"])
    hline(p, GB, rs, X1, X2, S["thin"])
    p.gap(6)
    box = {"kind": "free", "size": 8.5, "align": "center"}
    rbx = prow(p, GB, [(X1, 273, "신청서 작성", box), (273, 332, "→", box), (332, 502, "접수", box), (502, 542, "→", box), (542, 699, "검토", box),
                       (699, 742, "→", box), (742, 905, "결재", box), (905, 951, "→", box), (951, X2, "허가증 발급", box)], h=24)
    for x1, x2 in ((X1, 273), (332, 502), (542, 699), (742, 905), (951, X2)):
        hline(p, GB, rbx, x1, x2, S["thin"], below=False)
        hline(p, GB, rbx, x1, x2, S["thin"])
        vline(p, GB, rbx, rbx, x1, S["thin"])
        vline(p, GB, rbx, rbx, x2, S["thin"])
    sm = {"kind": "free", "size": 8, "align": "center"}
    prow(p, GB, [(X1, 273, "신청인", sm), (273, 332, "", NB), (332, 502, "도로관리청", sm), (502, 542, "", NB), (542, 699, "도로관리청", sm),
                 (699, 742, "", NB), (742, 905, "도로관리청", sm), (905, 951, "", NB), (951, X2, "", NB)], h=18)   # 원문: 허가증 발급 밑은 비어 있음
    p.gap(16)
    prow(p, GB, [(X1, X2, "210mm×297mm[백상지 80g/㎡(재활용품)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["뒤쪽은 원문 그대로입니다(도로법 시행규칙 별지 제26호서식)."])
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
    rd, gw, gu = sm.get("도로종류"), sm.get("관할"), sm.get("구분")
    a["곳"] = "" if not rd else ("한국도로공사지사" if rd == "고속국도" else "국토관리사무소" if rd == "일반국도"
                                 else "특별시 · 광역시 · 특별자치시 · 도 · 특별자치도 · 시 · 군 · 구(읍 · 면 · 동)")
    a["부서"] = "" if not rd else ("도로과" if rd == "고속국도" else "보수과" if rd == "일반국도" else "건설과 · 건설관리과")
    col = {"특별시": 0, "광역시 · 도": 1, "특별자치시 · 특별자치도": 1, "국토교통부": 2}.get(gw)
    row = GUBUN.index(gu) if gu in GUBUN else None
    if col is None or row is None:
        n_day, pol, a["처일수"], a["경찰글"], a["접수처리"] = None, None, "", "", ""
    else:
        cell = TBL[row][col]
        n_day, pol = _days(cell[2])
        a["처일수"] = n_day
        a["경찰글"] = "경찰 협의 없음" if not pol else f"그중 경찰청(경찰서) 협의 {pol}일(뒤쪽 비고 2)"
        a["접수처리"] = JAGI if gw == "특별자치시 · 특별자치도" else f"접수 {cell[0].replace(chr(10), ' ')}  →  처리 {cell[1].replace(chr(10), ' ')}"
    sd, he = sm.get("신청일"), sm.get("허가끝")
    if not sd or not n_day:
        a["처시작"] = ""
        st = None
    else:
        st = sd + datetime.timedelta(days=1) if (n_day <= 5 and not MW.쉬는날(sd)) else sd
        a["처시작"] = st
    for k in range(1, MW.되풀이 + 1):
        a["처끝" if k == MW.되풀이 else f"처E{k}"] = "" if st is None else MW.식흉내(st, n_day, k)
    if st is None:
        a["처리"] = ""
        ce = None
    else:
        ce = MW.식흉내(st, n_day)
        tail = CH6 if n_day >= 6 else (CH5_OFF if MW.쉬는날(sd) else CH5)
        a["처리"] = f"{_ymdp(ce)}({YOIL[ce.weekday()]}){tail}" + ("" if MW.다덮음(sd, ce) else MW.밖글)
    if not sd or not he or not n_day:
        a["판정"] = ""
    elif sd > he:
        a["판정"] = f"{PAN_GONE_A}{_ymdp(he)}{PAN_GONE_B}"
    elif ce > he:
        a["판정"] = f"{PAN_LATE_A}{_ymdp(he)}{PAN_LATE_B}"
    else:
        a["판정"] = PAN_OK
    keys = [("신청인 성명", not fr.get("성명")), ("주소", not fr.get("주소")), ("허가번호", not fr.get("허가번호")),
            ("허가기간", not sm.get("허가시작") or not he), ("점용의 목적", not fr.get("목적")), ("점용의 장소 및 면적", not fr.get("장소")),
            ("도로의 종류", not rd), ("변경내용", not fr.get("변경")), ("신청일", not sd)]
    if not rd and not fr.get("성명"):
        a["빈칸"] = ""
        a["다음"] = ""
    else:
        miss = [n for n, c in keys if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
        a["다음"] = NEXT
    hs = sm.get("허가시작")
    b["표허가"] = "" if (not hs or not he) else f"{_ymdp(hs)}  ~  {_ymdp(he)}"
    b["표도로"] = rd or ""
    b["신청일표시"] = "년         월         일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    b["신청인표시"] = fr.get("성명") or ""
    return {"셈": a, "신청서": b}
