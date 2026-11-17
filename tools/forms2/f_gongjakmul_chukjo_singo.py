# -*- coding: utf-8 -*-
"""공작물축조신고서 — 새로 만든 서식 (2026-11-17 G742 · 소장님 「그럼 이제 서식 10개만 만들자. 못 만든 서식...」 — 건축법 6종 다섯째)
   → ① 공작물마다 신고 대상인가(건축법 시행령 제118조제1항 — 굴뚝 6m · 장식탑 · 광고탑 등 4m · 고가수조 8m · 옹벽 · 담장 2m · 지하대피호 30㎡ ·
     운동시설 · 통신용 철탑 6m · 기계식 · 철골 조립식 주차장 8m 이하 · 태양광 5m · 조례) · 붙일 서류(높이 8m 이상이면 구조안전 및 내진설계 확인서 ·
     내풍설계 확인서) · 축조 완료 예정일 확인 · 아직 안 적은 칸 · 다음 할 일
   · 신고서 한 쪽(건축법 시행규칙 [별지 제30호서식] <개정 2021. 12. 31.> 칸 차례 그대로 — 신고번호 띠 · 건축주 · 대지조건 · ※설계자 · ※공사시공자 ·
     축조 완료 예정일 · ※축조할 공작물의 종류 · 표 · 신고 문구 · 신고안내(첨부서류 · 수수료 · 제출하는 곳) · 유의사항).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G742/구조.md — 바깥 120 ~ 1121 · 이름 칸 245 · 784 · 515 · 표 286 · 452 · 617 · 783 · 949 · 신고안내 257 · 983 · 617 · 761).

근거(국가법령정보센터 · 2026-11-17 · 원문 /home/claude/g10/notes/G742/p1.txt(글층 해시 47af2461a611285e) · 조문 G742/근거.md — 세 번 같은 해시):
  · 건축법 [시행 2026. 11. 12.] 제83조 — ① 옹벽 · 굴뚝 · 광고탑 · 고가수조 · 지하 대피호 등 영으로 정하는 공작물을 축조하려는 자는 시장 · 군수 · 구청장에게 신고
    ③ 제14조 · … · 제55조(건폐율) · … 준용
  · 건축법 시행령 [시행 2026. 11. 12.] 제118조 — ① 신고 공작물(건축물과 분리하여 축조) 1 ~ 11호(위) ③ 준용 — 제8호(기계식 · 철골 조립식 주차장)는 제55조 준용 안 함
  · 건축법 시행규칙 [시행 2026. 2. 27.] 제41조 — ① 별지 제30호서식 + 1. 배치도 2. 구조도 3. 구조안전 및 내진설계 확인서(높이 8m 이상만)
    4. 공작물 내풍설계 확인서(별지 제30호의2 · 높이 8m 이상만) — 건축허가 신청 때 함께 냈으면 신고서 생략 ② 구조 안전 점검표(별지 제30호의3) 뒤 신고필증(별지 제31호)
■ 원문 그대로: 서식 ※ 공작물 종류 글(2021. 12. 31. 판) · 유의사항(「건축법」 제110조제3호) · 접수 띠 «처리기간 일»(날 수 빈칸 — 원문) · 가운데 점 «ㆍ».
■ 짐작 안 함: «넘는» = 초과(같으면 대상 아님) · 첨부 3 · 4 는 «8미터 이상» · 제7호 통신용 철탑은 주거 · 상업지역만 · 제8호는 8m 이하 · 외벽 없는 것만 ·
  제9 · 10호(조례)는 허가권자 확인 · 건폐율은 셈하지 않음(대지 안 다른 건축물과 함께 보는지 서식에 없음 — 적은 값 그대로)."""
import datetime

import sgw as g
from fb import F, I
from sgw import L
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd, _yo

SLUG = "gongjakmul-chukjo-singo"
TITLE = "공작물축조신고서"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "공작물축조신고서(건축법 시행규칙 별지 제30호서식) — 빈 서식 (원문 칸 차례 그대로 · 한 쪽)"),
        (4, "공작물축조신고서 — 작성 예시 (공작물 표 · 날짜가 ① 장에서)"),
        (3, "① 공작물마다 신고 대상 · 붙일 서류 · 날짜 — 작성 예시 (가상의 현장)")]
MULTI = True
SHORT = ("공작물축조신고서(건축법 시행규칙 별지 제30호서식) — 옹벽 · 담장 · 광고탑 · 굴뚝 · 기계식 주차장 · 태양광 같은 공작물을 고르고 높이를 적으면 "
         "신고 대상인지(건축법 시행령 제118조), 높이 8m 이상이라 구조안전 · 내풍설계 확인서를 붙여야 하는지 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
M2 = '#,##0.0#;;""'
YN = ["예", "아니오"]
N = 3                  # 서식 표 줄 수(원문 세 줄)

# 공작물 고르기 — (이름 · 영 제118조제1항 호 · 셈 꼴 · 기준)  셈 꼴: H = 높이 넘음 · A = 바닥면적 넘음 · P = 주차장(8m 이하) · Z = 조례 · X = 제7호 밖
KIND = [("굴뚝", 1, "H", 6), ("장식탑", 3, "H", 4), ("기념탑", 3, "H", 4), ("첨탑", 3, "H", 4), ("광고탑", 3, "H", 4), ("광고판", 3, "H", 4),
        ("고가수조", 4, "H", 8), ("옹벽", 5, "H", 2), ("담장", 5, "H", 2), ("지하대피호", 6, "A", 30),
        ("골프연습장 등 운동시설용 철탑", 7, "H", 6), ("통신용 철탑(주거지역 · 상업지역)", 7, "H", 6), ("통신용 철탑(그 밖의 지역)", 7, "X", 6),
        ("기계식 주차장", 8, "P", 8), ("철골 조립식 주차장", 8, "P", 8), ("태양광 발전설비", 11, "H", 5),
        ("제조시설 · 저장시설(시멘트사일로 등) · 유희시설", 9, "Z", 0), ("건축물 구조에 큰 영향을 주는 중량물", 10, "Z", 0)]
KN = [k[0] for k in KIND]
J_Y = "✓ 신고 대상 — 영 제118조제1항제{}호({})"
J_N = "신고 대상 아님 — 영 제118조제1항제{}호는 {}(축조 신고 없이 — 다른 법 · 조례는 허가권자 확인)"
J_P_OK = "✓ 신고 대상 — 영 제118조제1항제8호(높이 8m 이하 · 외벽이 없는 것만 — 외벽이 있으면 허가권자 확인)"
J_P_NG = "⚠ 8m를 넘음 — 영 제118조제1항제8호는 높이 8m(난간 높이 빼고) 이하 주차장만 · 허가권자 확인"
J_X = "제7호 통신용 철탑은 주거지역 · 상업지역만 — 그 밖의 지역은 허가권자 확인"
J_Z = "제{}호 — 건축조례로 정하는 것만 신고 대상 · 허가권자(시 · 군 · 구) 조례 확인"
J_H0 = "⚠ 높이를 적습니다"
J_A0 = "⚠ 바닥면적(면적 칸)을 적습니다"
AT_8 = ("붙일 서류: 1. 공작물의 배치도 · 2. 공작물의 구조도 · 3. 구조안전 및 내진설계 확인서 · 4. 공작물 내풍설계 확인서(별지 제30호의2서식) — "
        "높이 8m 이상 공작물이 있음(시행규칙 제41조제1항제3 · 4호)")
AT_0 = "붙일 서류: 1. 공작물의 배치도 · 2. 공작물의 구조도 (높이 8m 이상 공작물이 없어 3 · 4 는 안 붙임 — 시행규칙 제41조제1항)"
DT_BAD = "⚠ 축조 완료 예정일이 신고일보다 앞입니다"
DT_OK = "✓ 신고일 뒤 완료 예정"
NEXT = ("신고서 제출(배치도 · 구조도 등) ➔ 허가권자가 공작물의 구조 안전 점검표(별지 제30호의3서식) 작성 · 검토 ➔ 공작물축조신고필증(별지 제31호서식) 발급"
        "(시행규칙 제41조제2항) · 건축허가 신청 때 공작물 축조신고 사항을 함께 냈으면 이 신고서는 생략(제41조제1항 단서)")
BIN_OK = "✓ 신고서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

# ── 작성 예시(가상의 땅 · 사람 · 번호) ─────────────────────────────────
EX = {"종류#1": "옹벽", "구조#1": "철근콘크리트조", "높이#1": 3.5, "길이#1": 42.0, "면적#1": None, "건폐#1": None,
      "종류#2": "광고탑", "구조#2": "철골조", "높이#2": 9.0, "길이#2": None, "면적#2": 6.0, "건폐#2": None,
      "종류#3": None, "구조#3": None, "높이#3": None, "길이#3": None, "면적#3": None, "건폐#3": None,
      "완료예정": D(2027, 5, 31), "신고일": D(2027, 3, 8)}
EX_S = {"성명": "홍길동", "생년월일": "1970-01-01", "주소": "가나시 다라구 마바로 12", "전화": "000-0000-0000",
        "대지위치": "가나시 다라구 마바동", "지번": "123-4", "지목": "대", "지역": "제2종일반주거지역", "지구": None, "구역": None,
        "설계자": "박설계", "자격번호": "건축사 제0000호", "사무소명": "다라건축사사무소", "신고번호": "가나-0000", "설계주소": "가나시 사아로 34",
        "시공자": "김시공", "시공생년": "1975-05-05", "회사명": "가나종합건설(주)", "면허번호": "가나-00-0000", "시공주소": "가나시 자차로 56",
        "수신": "가나시 다라구청장"}

HEAD = "■ 건축법 시행규칙 [별지 제30호서식] <개정 2021. 12. 31.>"
SEUM = "세움터(www.eais.go.kr)에서도 신청할 수 있습니다."
SUSIN = "특별자치시장ㆍ특별자치도지사, 시장ㆍ군수ㆍ구청장"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def _판정식(i):
    """종류 #i · 높이 · 면적 → 판정 글"""
    k, h, a = f"{{종류#{i}}}", f"{{높이#{i}}}", f"{{면적#{i}}}"
    parts = []
    for name, ho, kind, lim in KIND:
        if kind == "H":
            v = (f'IF(N({h})=0,"{J_H0}",IF({h}>{lim},"{J_Y.format(ho, f"높이 {lim}m를 넘는 {name}")}",'
                 f'"{J_N.format(ho, f"높이 {lim}m를 넘는 것만")}"))')
        elif kind == "A":
            v = (f'IF(N({a})=0,"{J_A0}",IF({a}>{lim},"{J_Y.format(ho, f"바닥면적 {lim}㎡를 넘는 {name}")}",'
                 f'"{J_N.format(ho, f"바닥면적 {lim}㎡를 넘는 것만")}"))')
        elif kind == "P":
            v = f'IF(N({h})=0,"{J_H0}",IF({h}<=8,"{J_P_OK}","{J_P_NG}"))'
        elif kind == "X":
            v = f'"{J_X}"'
        else:
            v = f'"{J_Z.format(ho)}"'
        parts.append((name, v))
    f = '""'
    for name, v in reversed(parts):
        f = f'IF({k}="{name}",{v},{f})'
    return f'=IF({k}="","",{f})'


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  공작물 축조 — 신고 대상 · 붙일 서류 · 날짜 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 건축물과 따로 축조하는 옹벽 · 담장 · 굴뚝 · 광고탑 · 고가수조 · 기계식 주차장 · 태양광 같은 공작물은 높이(지하대피호는 바닥면적)가 기준을 넘으면 "
              "시장 · 군수 · 구청장에게 신고합니다(건축법 제83조 · 시행령 제118조제1항). 여기 적은 공작물이 신고서 표(세 줄)로 들어갑니다.")
    g.sec(p, "㉮  축조할 공작물 — 고르고 높이를 적으면 신고 대상인지 나옵니다 (서식 표 세 줄)", need=22 + (24 + 24) * N + 10)
    p.row([(3, "종  류", L), (2, "구  조", L), (1, "높이(m)", dict(L, size=8.5)), (2, "길이(m)", dict(L, size=8.5)), (2, "면적(㎡)", dict(L, size=8.5)),
           (2, "건폐율(%)", dict(L, size=8.5))], h=22)
    for i in range(1, N + 1):
        p.row([(3, I(f"종류#{i}", ex=_ex(ex, f"종류#{i}"), dv=",".join(KN), align="left", size=8.5)),
               (2, I(f"구조#{i}", ex=_ex(ex, f"구조#{i}"), align="center", size=8.5)),
               (1, I(f"높이#{i}", ex=_ex(ex, f"높이#{i}"), fmt=M2, align="center", size=9)),
               (2, I(f"길이#{i}", ex=_ex(ex, f"길이#{i}"), fmt=M2, align="center", size=9)),
               (2, I(f"면적#{i}", ex=_ex(ex, f"면적#{i}"), fmt=M2, align="center", size=9)),
               (2, I(f"건폐#{i}", ex=_ex(ex, f"건폐#{i}"), fmt=M2, align="center", size=9))], h=24)
        p.row([(1, f"{i}번 판정", dict(L, size=8)), (11, F(f"판정#{i}", _판정식(i), align="left", size=8.5))], h=24)
    g.note(p, "※ 건폐율 칸은 적은 값 그대로 신고서에 들어갑니다(공작물에도 건축법 제55조 준용 — 영 제118조제3항 · 제8호 기계식 · 철골 조립식 주차장은 준용 안 함).")
    g.sec(p, "㉯  붙일 서류 · 날짜", need=40 + 24 * 2 + 10)
    hi = "OR(" + ",".join(f"N({{높이#{i}}})>=8" for i in range(1, N + 1)) + ")"
    any_ = "OR(" + ",".join(f'{{종류#{i}}}<>""' for i in range(1, N + 1)) + ")"
    p.row([(3, "붙일 서류", L), (9, F("첨부", f'=IF(NOT({any_}),"",IF({hi},"{AT_8}","{AT_0}"))', align="left", size=8.5))], h=40)
    p.row([(3, "신 고 일", L), (3, I("신고일", ex=_ex(ex, "신고일"), fmt=DT, align="center", size=9)),
           (3, "축조 완료 예정일", L), (3, I("완료예정", ex=_ex(ex, "완료예정"), fmt=DT, align="center", size=9))], h=24)
    p.row([(3, "날짜 확인", L),
           (9, F("날짜", '=IF(OR(N({신고일})=0,N({완료예정})=0),"",IF({완료예정}<{신고일},"' + DT_BAD + '","' + DT_OK + '"))', align="left", size=8.5))], h=24)
    g.sec(p, "㉰  아직 안 적은 칸 · 다음 할 일", need=40 + 46 + 10)
    BIN = [("건축주 성명", '{신고서!성명}=""'), ("건축주 주소", '{신고서!주소}=""'), ("대지위치", '{신고서!대지위치}=""'), ("지번", '{신고서!지번}=""'),
           ("공작물 종류", "NOT(" + any_ + ")"), ("축조 완료 예정일", "N({완료예정})=0"), ("신고일", "N({신고일})=0")]
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND(NOT(' + any_ + '),{신고서!성명}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,500)))',
                 align="left", size=8.5))], h=40)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(NOT(' + any_ + '),"","' + NEXT + '")', align="left", size=8))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 공작물을 고르고 높이 · 길이 · 면적을 적고, 신고일 · 축조 완료 예정일을 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 땅 · 사람 · 번호 — 높이 3.5m 옹벽 · 9m 광고탑)."])
    return p


# ── 신고서(한 쪽) ─────────────────────────────────────────────────────────
# 원문 그림 줄 자리(notes/G742/구조.md): 접수 띠 618 · 784 · 950 / 이름 칸 245 / 784 / 지역 · 지구 · 구역 515 · 784 / 표 286 · 452 · 618 · 784 · 950 /
#   첨부 257 · 983 / 제출 257 · 618 · 761 / 유의 257 — 글 자리(전화번호 870 · 지목 790 · 년 월 일 · 귀하)는 칸 경계로 맞춤
PAX = [120, 245, 257, 286, 300, 310, 345, 380, 452, 515, 570, 618, 761, 784, 840, 860, 870, 950, 983, 1100, 1121]
GA = Grid(PAX)


def form(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "신고서", fit=1, widths=GA.w)
    X1, XL, X2 = 120, 245, 1121

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    lab = dict(FR, size=8.5)              # 줄 안 이름(대지위치 · 주소 …)
    SB = dict(SUB, size=8.5)
    prow(p, GA, [(X1, 784, HEAD, {"kind": "free", "size": 7.5}), (784, X2, SEUM, {"kind": "free", "size": 7, "align": "right"})], h=13)
    p.gap(4)
    prow(p, GA, [(X1, X2, "공 작 물 축 조 신 고 서", {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=28)
    p.gap(4)
    prow(p, GA, [(X1, X2, "• 어두운 난(      )은 신고인이 작성하지 않으며, ※ 설계자ㆍ공사시공자란은 해당 사항이 있는 경우에만 작성합니다.",
                  {"kind": "free", "size": 7.5})], h=12)
    band = dict(SUB, fill=S["gray"], size=8)
    rb = prow(p, GA, [(X1, 618, "신고번호(연도-기관코드-업무구분-신고일련번호)", dict(band, size=7.5)), (618, 784, "접수일자", band), (784, 950, "처리일자", band),
                      (950, 1100, "처리기간", band), (1100, X2, "일", dict(band, align="right"))], h=23)
    for x in (618, 784, 950):
        vline(p, GA, rb, rb, x, S["gry"])
    p.gap(4)
    # 건축주
    a = prow(p, GA, [(X1, XL, "건축주", dict(SUBC, size=9.5, rs=3)), (XL, 784, "성명(법인명)", SB), (784, X2, "생년월일(사업자 또는 법인등록번호)", SB)], h=11)
    b = prow(p, GA, [(XL, 784, inp("성명"), NB), (784, X2, inp("생년월일"), NB)], h=13)
    hline(p, GA, b, XL, X2, S["lgt"])
    vline(p, GA, a, b, 784, S["lgt"])
    c = prow(p, GA, [(XL, 310, "주소", lab), (310, 860, inp("주소"), NB), (860, 950, "(전화번호:", dict(FR, size=8)), (950, 1100, inp("전화", size=8), NB),
                     (1100, X2, ")", dict(FR, size=8))], h=17)
    vline(p, GA, a, c, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, c, X1, X2, S["med"])
    p.gap(3)
    # 대지조건
    a = prow(p, GA, [(X1, XL, "대지조건", dict(SUBC, size=9.5, rs=4)), (XL, 345, "대지위치", lab), (345, X2, inp("대지위치"), NB)], h=17)
    b = prow(p, GA, [(XL, 300, "지번", lab), (300, 784, inp("지번"), NB), (784, 860, "(지목 :", dict(FR, size=8.5)), (860, 1100, inp("지목"), NB),
                     (1100, X2, ")", dict(FR, size=8.5))], h=16)
    b2 = prow(p, GA, [(XL, X2, "※ 「공간정보의 구축 및 관리 등에 관한 법률」에 따른 지번을 적으며, 「공유수면의 관리 및 매립에 관한 법률」 제8조에\n"
                               "   따라 공유수면의 점용ㆍ사용 허가를 받은 경우 그 장소가 지번이 없으면 그 점용ㆍ사용 허가를 받은 장소를 적습니다.",
                       dict(FR, size=7, wrap=True))], h=22)
    c = prow(p, GA, [(XL, 300, "지역", lab), (300, 515, inp("지역", size=8), NB), (515, 570, "지구", lab), (570, 784, inp("지구", size=8), NB),
                     (784, 840, "구역", lab), (840, X2, inp("구역", size=8), NB)], h=17)
    hline(p, GA, a, XL, X2, S["lgt"])
    hline(p, GA, b2, XL, X2, S["lgt"])
    for x in (515, 784):
        vline(p, GA, c, c, x, S["lgt"])
    vline(p, GA, a, c, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, c, X1, X2, S["med"])
    p.gap(3)
    # ※ 설계자
    a = prow(p, GA, [(X1, XL, "※\n설계자", dict(SUBC, size=9.5, rs=3)), (XL, 380, "성명(법인명)", lab), (380, 784, inp("설계자"), NB),
                     (784, 870, "자격번호", lab), (870, X2, inp("자격번호"), NB)], h=17)
    b = prow(p, GA, [(XL, 345, "사무소명", lab), (345, 784, inp("사무소명"), NB), (784, 870, "신고번호", lab), (870, X2, inp("신고번호"), NB)], h=17)
    c = prow(p, GA, [(XL, 310, "주소", lab), (310, X2, inp("설계주소"), NB)], h=17)
    for r in (a, b):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a, b, 784, S["lgt"])
    vline(p, GA, a, c, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, c, X1, X2, S["med"])
    p.gap(3)
    # ※ 공사시공자
    a = prow(p, GA, [(X1, XL, "※\n공사시공자", dict(SUBC, size=9.5, rs=4)), (XL, 784, "성명", SB), (784, X2, "생년월일(사업자 또는 법인등록번호)", SB)], h=11)
    a2 = prow(p, GA, [(XL, 784, inp("시공자"), NB), (784, X2, inp("시공생년"), NB)], h=13)
    b = prow(p, GA, [(XL, 345, "회사명", lab), (345, 784, inp("회사명"), NB), (784, 870, "면허번호", lab), (870, X2, inp("면허번호"), NB)], h=17)
    c = prow(p, GA, [(XL, 310, "주소", lab), (310, X2, inp("시공주소"), NB)], h=17)
    for r in (a2, b):
        hline(p, GA, r, XL, X2, S["lgt"])
    vline(p, GA, a, b, 784, S["lgt"])
    vline(p, GA, a, c, XL, S["gry"])
    hline(p, GA, a, X1, X2, S["med"], below=False)
    hline(p, GA, c, X1, X2, S["thin"])
    p.gap(5)
    # 축조 완료 예정일
    r1 = prow(p, GA, [(X1, X2, "축조완료예정일", SB)], h=11)
    r2 = prow(p, GA, [(X1, X2, F("완료표시", '=IF(N({셈!완료예정})=0,"년      월      일",YEAR({셈!완료예정})&"년   "&MONTH({셈!완료예정})&"월   "&DAY({셈!완료예정})&"일")',
                                align="right", size=8.5), NB)], h=13)
    hline(p, GA, r1, X1, X2, S["thin"], below=False)
    hline(p, GA, r2, X1, X2, S["thin"])
    p.gap(6)
    # ※ 축조할 공작물의 종류 + 표
    prow(p, GA, [(X1, X2, "※ 축조할 공작물의 종류 ( 「건축법 시행령」 제118조제1항 )", {"kind": "free", "size": 9, "bold": True})], h=14)
    prow(p, GA, [(X1, X2, "• 굴뚝, 장식탑, 기념탑, 광고탑, 광고판, 고가수조, 옹벽, 담장, 지하대피호, 골프연습장 철탑, 통신용 철탑, 기계식 주차장, 철골 조립식 주차장,\n"
                          "   건축조례로 정한 공작물 및 그 밖에 이와 비슷한 것", dict(FR, size=7.5, wrap=True))], h=22)
    T = [(120, 286), (286, 452), (452, 618), (618, 784), (784, 950), (950, X2)]
    hd = prow(p, GA, [(x1, x2, t, dict(FRC, size=8.5)) for (x1, x2), t in zip(T, ["종류", "구조", "높이(m)", "길이(m)", "면적(㎡)", "건폐율(%)"])], h=21)
    rows = []
    for i in range(1, N + 1):
        cells = [(120, 286, F(f"표종류#{i}", f'=IF({{셈!종류#{i}}}="","",{{셈!종류#{i}}})', align="center", size=8), NB),
                 (286, 452, F(f"표구조#{i}", f'=IF({{셈!구조#{i}}}="","",{{셈!구조#{i}}})', align="center", size=8), NB)]
        for (x1, x2), k in zip(T[2:], ["높이", "길이", "면적", "건폐"]):
            cells.append((x1, x2, F(f"표{k}#{i}", f'=IF(N({{셈!{k}#{i}}})=0,"",{{셈!{k}#{i}}})', fmt=M2, align="center", size=8.5), NB))
        rows.append(prow(p, GA, cells, h=21))
    for r in [hd] + rows[:-1]:
        hline(p, GA, r, X1, X2, S["lgt"])
    for x in (286, 452, 618, 784, 950):
        vline(p, GA, hd, rows[-1], x, S["lgt"])
    hline(p, GA, hd, X1, X2, S["thin"], below=False)
    hline(p, GA, rows[-1], X1, X2, S["thin"])
    p.gap(10)
    prow(p, GA, [(X1, X2, "「건축법」 제83조 및 같은 법 시행규칙 제41조에 따라 위와 같이 공작물축조신고서를 제출합니다.", {"kind": "free", "size": 9.5, "indent": 2})], h=16)
    prow(p, GA, [(X1, X2, F("신고일표시", '=IF(N({셈!신고일})=0,"년              월              일",YEAR({셈!신고일})&"년        "&MONTH({셈!신고일})&"월        "&DAY({셈!신고일})&"일")',
                             align="right", size=8.5), NB)], h=16)
    prow(p, GA, [(X1, 618, "", NB), (618, 784, "건축주", dict(FRC, size=9)), (784, 983, F("건축주표시", '=IF({성명}="","",{성명})', align="center", size=8.5), NB),
                 (983, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=18)
    p.gap(14)
    r = prow(p, GA, [(X1, 840, inp("수신", blank=SUSIN, size=12, bold=True, align="right"), NB), (840, X2, "귀하", dict(FR, size=9, indent=1))], h=24)
    hline(p, GA, r, X1, X2, S["med"])
    p.gap(5)
    bnd = {"kind": "free", "size": 9, "align": "center", "fill": S["band"]}
    r = prow(p, GA, [(X1, X2, "신고안내", bnd)], h=24)
    t_at = ("1. 공작물의 배치도 1부\n2. 공작물의 구조도 1부\n3. 「건축물의 구조기준 등에 관한 규칙」 별지 제2호서식의 구조안전 및 내진설계 확인서(높이가\n"
            "   8미터 이상인 경우만 해당합니다)\n4. 별지 제30호의2서식의 공작물 내풍설계 확인서(높이가 8미터 이상인 공작물인 경우에만\n   첨부합니다)")
    ra0 = prow(p, GA, [(X1, 257, "첨부서류", dict(FRC, size=8.5, rs=2)), (257, 983, t_at, dict(FR, size=7.5, wrap=True, rs=2)),
                       (983, X2, "수수료", dict(FR, size=8, valign="bottom"))], h=40)
    ra = prow(p, GA, [(983, X2, "원", dict(FRR, size=8, valign="top"))], h=26)
    rs_ = prow(p, GA, [(X1, 257, "제출하는 곳", dict(FRC, size=8.5)), (257, 618, "특별자치시ㆍ특별자치도, 시ㆍ군ㆍ구", dict(FRC, size=8)),
                       (618, 761, "처리부서", dict(FRC, size=8.5)), (761, X2, "건축허가(신고) 부서", dict(FRC, size=8))], h=21)
    hline(p, GA, ra, X1, X2, S["lgt"])
    for x in (257, 983):
        vline(p, GA, ra0, ra, x, S["lgt"])
    for x in (257, 618, 761):
        vline(p, GA, rs_, rs_, x, S["lgt"])
    hline(p, GA, rs_, X1, X2, S["thin"])
    p.gap(6)
    r = prow(p, GA, [(X1, X2, "유의사항", bnd)], h=22)
    hline(p, GA, r, X1, X2, S["med"], below=False)
    ru = prow(p, GA, [(X1, 257, "「건축법」\n제110조제3호", dict(FRC, size=8)),
                      (257, X2, "• 신고를 하지 않고 공작물을 축조한 자는 2년 이하의 징역 또는 1억원 이하의 벌금에 처하여 집니다.", dict(FR, size=8, indent=1))], h=27)
    vline(p, GA, ru, ru, 257, S["lgt"])
    hline(p, GA, ru, X1, X2, S["thin"])
    prow(p, GA, [(X1, X2, "210㎜×297㎜[보존용지(2종) 70g/㎡]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["공작물 표 · 축조 완료 예정일 · 신고일은 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 건축주 · 설계자 · 시공자 · 대지)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _num(v):
    try:
        return float(v) if v not in (None, "") else 0.0
    except (TypeError, ValueError):
        return 0.0


def 판정(kind, h, a):
    if not kind:
        return ""
    name, ho, kd, lim = next(k for k in KIND if k[0] == kind)
    if kd == "H":
        return J_H0 if not h else (J_Y.format(ho, f"높이 {lim}m를 넘는 {name}") if h > lim else J_N.format(ho, f"높이 {lim}m를 넘는 것만"))
    if kd == "A":
        return J_A0 if not a else (J_Y.format(ho, f"바닥면적 {lim}㎡를 넘는 {name}") if a > lim else J_N.format(ho, f"바닥면적 {lim}㎡를 넘는 것만"))
    if kd == "P":
        return J_H0 if not h else (J_P_OK if h <= 8 else J_P_NG)
    if kd == "X":
        return J_X
    return J_Z.format(ho)


def expect(pages):
    sm, fr = pages["셈"], pages["신고서"]
    a, b = {}, {}
    any_ = False
    hi = False
    for i in range(1, N + 1):
        k, h, ar = sm.get(f"종류#{i}"), _num(sm.get(f"높이#{i}")), _num(sm.get(f"면적#{i}"))
        a[f"판정#{i}"] = 판정(k, h, ar)
        any_ = any_ or bool(k)
        hi = hi or h >= 8
        b[f"표종류#{i}"] = k or ""
        b[f"표구조#{i}"] = sm.get(f"구조#{i}") or ""
        for kk in ("높이", "길이", "면적", "건폐"):
            v = _num(sm.get(f"{kk}#{i}"))
            b[f"표{kk}#{i}"] = v if v else ""
    a["첨부"] = "" if not any_ else (AT_8 if hi else AT_0)
    sd, cd = sm.get("신고일"), sm.get("완료예정")
    a["날짜"] = "" if (not sd or not cd) else (DT_BAD if cd < sd else DT_OK)
    if not any_ and not fr.get("성명"):
        a["빈칸"] = ""
    else:
        mc = [("건축주 성명", not fr.get("성명")), ("건축주 주소", not fr.get("주소")), ("대지위치", not fr.get("대지위치")), ("지번", not fr.get("지번")),
              ("공작물 종류", not any_), ("축조 완료 예정일", not cd), ("신고일", not sd)]
        miss = [n for n, c in mc if c]
        a["빈칸"] = BIN_OK if not miss else BIN_A + " · ".join(miss)
    a["다음"] = "" if not any_ else NEXT
    b["완료표시"] = "년      월      일" if not cd else f"{cd.year}년   {cd.month}월   {cd.day}일"
    b["신고일표시"] = "년              월              일" if not sd else f"{sd.year}년        {sd.month}월        {sd.day}일"
    b["건축주표시"] = fr.get("성명") or ""
    return {"셈": a, "신고서": b}
