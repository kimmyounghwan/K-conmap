# -*- coding: utf-8 -*-
"""건축ㆍ대수선ㆍ용도변경 (변경)허가 신청서 — 새로 만든 서식 (2026-11-16 G731 · 소장님 「오늘 중으로 다 만들자. 서식」 — 건축법 7종 첫째)
   → ① 건축구분 · 송달 동의 · 일괄처리 √ · 동별 주구조 · 대수선 내용 고르기 · 건폐율 · 용적률(저절로) · 층별 면적 합계 대조 ·
     허가 뒤 착수 기한(허가일부터 2년 · 공장 3년) · 처리기간(허가안내 원문) · 아직 안 적은 칸
   · 신청서 다섯 쪽(건축법 시행규칙 [별지 제1호의4서식] <개정 2025. 7. 31.> 칸 차례 그대로 — 쪽 표기 «6쪽 중» 은 원문 그대로 ·
     법제처 서식 보기에 실린 다섯 쪽을 옮김): 제1쪽 건축주 · 설계자 · 대지조건 · 전체 개요 / 제2쪽 하수 · 급수 · 주차장 · 협정 · 특례 ·
     변경사항 · 일괄처리사항 · 존치기간 · 시공기간 · 서명 / 제3쪽 동별 개요 · 층별 개요 / 제4쪽 대수선 개요 · 준주택 · 다가구 · 임대형기숙사 /
     제5쪽 첨부서류 · 허가안내 · 근거규정 · 유의사항.
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그대로 열 경계로(쪽마다 고르지 않은 열).

근거(국가법령정보센터 · 2026-11-16 · 원문 /home/claude/g10/notes/G731_건축허가신청서_원문.txt):
  · 건축법 [시행 2026. 11. 12.] 제55조(건폐율 — 대지면적에 대한 건축면적의 비율) · 제56조(용적률 — 대지면적에 대한 연면적의 비율) ·
    제11조제7항(허가를 받은 날부터 2년(공장 신설ㆍ증설 또는 업종변경 승인 공장 3년) 이내 착수하지 않으면 허가 취소 · 정당한 사유면 1년 범위 연장)
    — 세 번(전체 쪽 · 조문 주소 · 전체 쪽 다시) 같은 해시.
■ 원문 그대로: «철근콘트리트조»(원문 표기) · 「」 · ㆍ · ㎡ · ㎥ · √ · 제4쪽 ⑲ ~ ㉖(글층은 글꼴 글자 U+F000 — 그림대로 동그라미 숫자).
■ 짐작 안 함: 건폐율 · 용적률은 적은 면적으로만 셈(최대한도는 용도지역 · 조례 — 허가권자 확인) · 층별 합계는 대조만(동이 여럿이면 다를 수 있음) ·
  착수 기한은 허가일이 있을 때만 · 처리기간은 서식 허가안내 원문."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L
from 기간셈 import 끝날, 끝날식

SLUG = "geonchuk-heoga-sincheong"
TITLE = "건축ㆍ대수선ㆍ용도변경 (변경)허가 신청서"
WHERE = "forms"
XLSX = False
PREV = [(2, "건축ㆍ대수선ㆍ용도변경 (변경)허가 신청서(건축법 시행규칙 별지 제1호의4서식) 제1쪽 — 빈 서식 (원문 칸 차례 그대로)"),
        (8, "건축허가 신청서 제1쪽 — 작성 예시 (건폐율 · 용적률이 저절로)"),
        (7, "① 건축구분 · 일괄처리 √ · 건폐율 · 용적률 · 착수 기한 — 작성 예시")]
MULTI = True
SHORT = ("건축ㆍ대수선ㆍ용도변경 (변경)허가 신청서(건축법 시행규칙 별지 제1호의4서식) — 대지면적 · 건축면적 · 연면적을 적으면 건폐율 · 용적률이, "
         "허가일을 적으면 착수 기한(2년 · 공장 3년)이 저절로 나옵니다. 건축구분 · 일괄처리사항 · 주구조는 ① 장에서 고르면 √.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
AREA = '#,##0.00;;""'
NUM = '#,##0;;""'

GUBUN = ["신축", "증축", "개축", "재축", "이전", "대수선", "허가사항 변경", "용도변경", "가설건축물 건축"]
SONG = ["동의함", "동의하지 않음"]
JU = ["주 건축물", "부속 건축물"]
GUJO = ["철근콘트리트조", "철골조", "기타"]
DAE_K = ["증설", "해체", "수선", "변경"]
HG = ["특별시ㆍ광역시(층수 21층 이상 · 연면적 합계 10만㎡ 이상 등)", "특별자치시ㆍ특별자치도ㆍ시ㆍ군ㆍ구", "도지사 사전승인 대상"]
HG_T = ["40일 ~ 50일", "2일 ~ 15일", "70일"]
YN = ["예", "아니오"]

ILGWAL = ["공사용 가설건축물 축조신고", "공작물 축조신고", "개발행위허가", "도시ㆍ군계획시설사업 시행자의 지정 및 실시계획인가",
          "산지전용허가ㆍ신고, 산지일시사용 허가신고", "농지전용허가ㆍ신고 및 협의", "사도개설허가", "도로점용허가",
          "비관리청 도로공사 시행 허가 및 도로의 연결허가", "하천점용허가", "개인하수처리시설 설치신고", "배수설비 설치신고", "상수도 공급신청",
          "자가용전기설비 공사계획 인가ㆍ신고", "수질오염물질 배출시설 설치 허가ㆍ신고", "대기오염물질 배출시설 설치 허가ㆍ신고",
          "소음ㆍ진동 배출시설 설치 허가ㆍ신고", "가축분뇨 배출시설 설치 허가ㆍ신고", "공원구역 행위허가", "도시공원 점용허가",
          "특정토양오염관리대상시설 신고", "수산자원보호구역 행위허가", "초지전용 허가ㆍ신고"]
DAESU = [("내력벽", "㎡"), ("기둥", "개"), ("보", "개"), ("지붕틀", "개"), ("방화벽", ""), ("방화구획", ""), ("주계단", ""), ("피난계단", ""),
         ("특별피난계단", ""), ("다가구주택의 가구 간 경계벽의", None), ("다세대주택의 세대 간 경계벽의", None), ("건축물의 외벽", "㎡")]

KS_A = "건폐율 = 건축면적 "
KS_B = "㎡ ÷ 대지면적 "
KS_C = "㎡ × 100 = "
KS_D = "%"
YJ_A = "용적률 = 연면적 합계(용적률 산정용) "
YJ_B = "㎡ ÷ 대지면적 "
CB_A = "층별 개요 ⑱ 면적 합계 "
CB_B = "㎡ · 전체 개요 연면적 합계 "
CB_SAME = "㎡ — 같음"
CB_DIFF = "㎡ — 다름(동이 여럿이면 동마다 따로 적으므로 다를 수 있음 · 한 동이면 다시 보세요)"
CJ_A = "허가일 "
CJ_B = " → 착수 기한 "
CJ_C = ")까지 공사 착수(건축법 제11조제7항 — "
CJ_D = "년 · 넘기면 허가 취소 · 정당한 사유가 있으면 1년 범위에서 연장 가능)"
CG_A = "처리기간 "
CG_B = "(서식 «허가안내» 원문)"
BIN_OK = "✓ 신청서 주요 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "

EX = {"건축구분": GUBUN[0], "송달": SONG[0], "기존주부속": None, "신청주부속": JU[0], "기존주구조": None, "신청주구조": GUJO[0],
      "허가일": D(2027, 4, 20), "공장": YN[1], "허가권자": HG[1]}
for _i in range(1, len(ILGWAL) + 1):
    EX[f"일괄#{_i}"] = "√" if _i in (1, 12, 13) else None
for _i in range(1, 5):
    EX[f"협정#{_i}"] = None
for _i in range(1, len(DAESU) + 1):
    EX[f"대수선#{_i}"] = None
    EX[f"대수량#{_i}"] = None

EX_S = {"발주자": "가나개발(주)", "생년월일": "123-45-67890", "건축주주소": "가나시 다라구 마바로 12", "건축주전화": "000-0000-0000",
        "메일앞": "gana", "메일뒤": "example.com", "설계자": "박다라", "자격번호": "제00000호", "회원번호": "0000", "사무소명": "다라건축사사무소",
        "신고번호": "가나-0000", "사무소주소": "가나시 사아로 34", "사무소전화": "000-000-0000",
        "현장위치": "가나시 다라구 마바동", "지번": "123-4", "관련지번": "123-5", "지목": "대", "용도지역": "제2종일반주거지역",
        "용도지구1": "-", "용도지구2": "-", "용도구역1": "-", "용도구역2": "-",
        "대지면적": 660.0, "건축면적": 330.0, "연면적": 1320.0, "연면적용적": 1180.0,
        "건축물명칭": "가나 근린생활시설", "주동수": 1, "부속동수": 0, "부속면적": None, "주용도": "제2종 근린생활시설",
        "세대수": None, "호수": 8, "가구수": None, "주차대수": 9, "평균전용": None,
        # 제2쪽
        "하수형식": "오수처리시설(접촉산화방식)", "하수용량": 50, "급수지상수": None, "급수지상량": None, "급수지하수": 1, "급수지하량": 20,
        "옥내자주대": 7, "옥내자주면": 175.0, "옥외자주대": 2, "옥외자주면": 25.0, "인근자주대": None, "인근자주면": None,
        "옥내기계대": None, "옥내기계면": None, "옥외기계대": None, "옥외기계면": None, "인근기계대": None, "인근기계면": None,
        "옥내전기대": None, "옥내전기면": None, "옥외전기대": 1, "옥외전기면": 12.5, "인근전기대": None, "인근전기면": None, "면제대": None,
        "공개공지": None, "조경면적": 45.0, "후퇴면적": None, "후퇴거리": None,
        "고시명": None, "고시번호": None, "고시일자": None, "공고명": None, "공고번호": None, "공고일자": None, "특례73": None, "특례77": None,
        "변경사항": None, "존치년": None, "존치월": None, "존치일": None, "시공기간": 1, "신청일": D(2027, 3, 2),
        # 제3쪽 — 동별(허가신청 쪽만)
        "신동명칭": "1동", "신주용도": "제2종 근린생활시설", "신호수": 8, "신가구": None, "신세대": None, "신세부구조": "철근콘크리트 라멘조",
        "신지붕": "평지붕", "신지붕마감": "우레탄 도막방수", "신건축면적": 330.0, "신연면적": 1320.0, "신용적연면적": 1180.0,
        "신지하": 1, "신지상": 4, "신높이": 16.5, "신승용": 1, "신비상": 0, "신보차": None, "신기둥": None, "신내력": None, "신특수유형": None}
for _k in ("동명칭", "주용도", "호수", "가구", "세대", "세부구조", "지붕", "지붕마감", "건축면적", "연면적", "용적연면적", "지하", "지상", "높이",
           "승용", "비상", "보차", "기둥", "내력", "특수유형"):
    EX_S["구" + _k] = None
_FL = [("지하1층", "신축", "철근콘크리트조", "주차장", 140.0), ("1층", "신축", "철근콘크리트조", "근린생활시설", 300.0),
       ("2층", "신축", "철근콘크리트조", "근린생활시설", 300.0), ("3층", "신축", "철근콘크리트조", "근린생활시설", 290.0),
       ("4층", "신축", "철근콘크리트조", "근린생활시설", 290.0)]
NF = 7
for _i in range(1, NF + 1):
    for _k in ("구구조", "구용도", "구면적", "층구분", "건축구분", "신구조", "신용도", "신면적"):
        EX_S[f"{_k}#{_i}"] = None
    if _i <= len(_FL):
        _a = _FL[_i - 1]
        EX_S.update({f"층구분#{_i}": _a[0], f"건축구분#{_i}": _a[1], f"신구조#{_i}": _a[2], f"신용도#{_i}": _a[3], f"신면적#{_i}": _a[4]})
# 제4쪽 표(모두 비움 — 신축 예시)
N4A, N4B, N4C = 5, 5, 4
for _i in range(1, N4A + 1):
    for _k in ("구유형", "구실수", "구실면적", "신유형", "신실수", "신실면적"):
        EX_S[f"{_k}#{_i}"] = None
for _i in range(1, N4B + 1):
    for _k in ("구가구", "구가구층", "구가구면적", "신가구", "신가구층", "신가구면적"):
        EX_S[f"{_k}#{_i}"] = None
for _i in range(1, N4C + 1):
    for _k in ("구기숙", "구기숙층", "구기숙면적", "신기숙", "신기숙층", "신기숙면적"):
        EX_S[f"{_k}#{_i}"] = None
for _k in ("구공유", "구공용", "신공유", "신공용"):
    EX_S[_k] = None

HEAD = "■ 건축법 시행규칙 [별지 제1호의4서식] <개정 2025. 7. 31.>"
SEUM = "세움터(www.eais.go.kr)에서도 신청할 수 있습니다."


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


class Grid:
    def __init__(s, bounds, total=91.2):
        s.b = sorted(set(bounds))
        s.ix = {x: i for i, x in enumerate(s.b)}
        span = s.b[-1] - s.b[0]
        s.w = [(s.b[i + 1] - s.b[i]) * total / span for i in range(len(s.b) - 1)]

    def cols(s, x1, x2):
        return s.ix[x1] + 1, s.ix[x2]


def prow(p, G, items, h):
    r = p.r
    cells = []
    c = 1
    for it in items:
        a, b = G.cols(it[0], it[1])
        assert b >= a, (p.name, r, it[:2])
        while (r, c) in p.occ:
            c += 1
        assert c == a, f"[{p.name}] {r}행 칸 자리 {c} ≠ {a} (x {it[0]})"
        cells.append((b - a + 1,) + tuple(it[2:]))
        c = b + 1
    return p.row(cells, h=h)


def _set(p, r, c, **kw):
    from openpyxl.styles import Border
    cell = p.ws.cell(row=r, column=c)
    b = cell.border
    cell.border = Border(left=kw.get("left", b.left), right=kw.get("right", b.right), top=kw.get("top", b.top), bottom=kw.get("bottom", b.bottom))


def hline(p, G, r, x1, x2, side, below=True):
    """r 행 아래(below) 또는 위에 가로줄 — 아래 행 위 테에도 같이(합친 칸에서 빠지지 않게)"""
    c1, c2 = G.cols(x1, x2)
    for c in range(c1, c2 + 1):
        if below:
            _set(p, r, c, bottom=side)
            _set(p, r + 1, c, top=side)
        else:
            _set(p, r, c, top=side)
            if r > 1:
                _set(p, r - 1, c, bottom=side)


def vline(p, G, r1, r2, x, side):
    """x 자리 세로줄(r1 ~ r2 행) — 왼쪽 칸 오른쪽 테 + 오른쪽 칸 왼쪽 테 둘 다(G729 재발 막기)"""
    c = G.ix[x] + 1
    for r in range(r1, r2 + 1):
        if c - 1 >= 1:
            _set(p, r, c - 1, right=side)
        if c <= len(G.w):
            _set(p, r, c, left=side)


def _sides():
    from openpyxl.styles import PatternFill, Side
    return {"med": Side(style="medium", color="000000"), "thin": Side(style="thin", color="000000"),
            "gry": Side(style="thin", color="9A9A9A"), "lgt": Side(style="thin", color="C8C8C8"),
            "gray": PatternFill("solid", fgColor="D9D9D9"), "band": PatternFill("solid", fgColor="BFBFBF")}


SUB = {"kind": "free", "size": 8, "align": "left", "valign": "top"}
SUBC = {"kind": "free", "size": 8.5, "align": "center"}
FR = {"kind": "free", "size": 8.5, "align": "left"}
FRR = {"kind": "free", "size": 8, "align": "right"}
FRC = {"kind": "free", "size": 8.5, "align": "center"}
NB = {"border": False}


def _ymd(ref):
    return f'YEAR({ref})&". "&MONTH({ref})&". "&DAY({ref})&"."'


def _yo(ref):
    return f'CHOOSE(WEEKDAY({ref}),"일","월","화","수","목","금","토")'


def _ck(cond, text):
    return f'IF({cond},"[√]","[   ]")&" {text}"'


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  건축허가 신청 — 고르기 · 건폐율 · 용적률 · 착수 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 신청서의 [ ] 칸은 여기서 고르면 √ 가 됩니다. 면적은 제1쪽 · 제3쪽에 적으면 건폐율 · 용적률 · 층별 합계가 저절로 나옵니다.")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  건축구분 · 전자우편 송달 동의 (제1쪽 √)", need=24 * 2 + 10)
    p.row([(3, "건축구분", L), (4, I("건축구분", ex=_ex(ex, "건축구분"), dv=",".join(GUBUN), align="left", size=9)),
           (5, "신축 · 증축 · 개축 · 재축 · 이전 · 대수선 · 허가사항 변경 · 용도변경 · 가설건축물 건축 가운데 하나", s7)], h=24)
    p.row([(3, "전자우편 송달", L), (4, I("송달", ex=_ex(ex, "송달"), dv=",".join(SONG), align="left", size=9)),
           (5, "「행정절차법」 제14조 — 부담금 부과 사전통지 등의 문서를 전자우편으로 받을지", s7)], h=24)
    g.sec(p, "㉯  건폐율 · 용적률 · 층별 면적 합계 (제1쪽 · 제3쪽에서)", need=34 * 3 + 10)
    DJ, GC, YN1, YN2 = "{제1쪽!대지면적}", "{제1쪽!건축면적}", "{제1쪽!연면적}", "{제1쪽!연면적용적}"
    f = (f'=IF(OR(N({DJ})=0,N({GC})=0),"","{KS_A}"&TEXT({GC},"#,##0.00")&"{KS_B}"&TEXT({DJ},"#,##0.00")&"{KS_C}"'
         f'&TEXT(ROUND({GC}/{DJ}*100,2),"0.00")&"{KS_D}")')
    p.row([(3, "건폐율(건축법 제55조)", dict(L, size=8.5)), (9, F("건폐셈", f, align="left", size=8.5))], h=34)
    f = (f'=IF(OR(N({DJ})=0,N({YN2})=0),"","{YJ_A}"&TEXT({YN2},"#,##0.00")&"{YJ_B}"&TEXT({DJ},"#,##0.00")&"{KS_C}"'
         f'&TEXT(ROUND({YN2}/{DJ}*100,2),"0.00")&"{KS_D}")')
    p.row([(3, "용적률(건축법 제56조)", dict(L, size=8.5)), (9, F("용적셈", f, align="left", size=8.5))], h=34)
    SUMF = "(" + "+".join(f"N({{제3쪽!신면적#{i}}})" for i in range(1, NF + 1)) + ")"
    f = (f'=IF({SUMF}=0,"","{CB_A}"&TEXT({SUMF},"#,##0.00")&"{CB_B}"&TEXT(N({YN1}),"#,##0.00")'
         f'&IF(ROUND({SUMF},2)=ROUND(N({YN1}),2),"{CB_SAME}","{CB_DIFF}"))')
    p.row([(3, "층별 면적 합계", dict(L, size=8.5)), (9, F("층별셈", f, align="left", size=8.5))], h=34)
    g.sec(p, "㉰  일괄처리사항 √ (제2쪽 — 「건축법」 제11조에 따라 허가 · 신고를 받은 것으로 보는 사항)", need=22 * 12 + 10)
    n = len(ILGWAL)
    for i in range(0, n, 2):
        row = []
        for j in (i, i + 1):
            if j < n:
                row += [(5, ILGWAL[j], {"kind": "text", "size": 7.5}), (1, I(f"일괄#{j + 1}", ex=_ex(ex, f"일괄#{j + 1}"), dv="√", align="center", size=9))]
            else:
                row += [(6, "", {"kind": "text"})]
        p.row(row, h=22)
    g.sec(p, "㉰-2  협정 · 특별구역 √ (제2쪽)", need=22 * 2 + 10)
    for i in (0, 2):
        p.row([(5, HYEOP[i], {"kind": "text", "size": 7.5}), (1, I(f"협정#{i + 1}", ex=_ex(ex, f"협정#{i + 1}"), dv="√", align="center", size=9)),
               (5, HYEOP[i + 1], {"kind": "text", "size": 7.5}), (1, I(f"협정#{i + 2}", ex=_ex(ex, f"협정#{i + 2}"), dv="√", align="center", size=9))], h=22)
    g.sec(p, "㉱  동별 개요 — 주/부속구분 · 주구조 (제3쪽 √)", need=24 * 3 + 10)
    p.row([(4, "", L), (4, "기존 건축물", L), (4, "허가신청 건축물", L)], h=20)
    p.row([(4, "주/부속구분", L), (4, I("기존주부속", ex=_ex(ex, "기존주부속"), dv=",".join(JU), size=9)),
           (4, I("신청주부속", ex=_ex(ex, "신청주부속"), dv=",".join(JU), size=9))], h=24)
    p.row([(4, "주구조", L), (4, I("기존주구조", ex=_ex(ex, "기존주구조"), dv=",".join(GUJO), size=9)),
           (4, I("신청주구조", ex=_ex(ex, "신청주구조"), dv=",".join(GUJO), size=9))], h=24)
    g.sec(p, "㉲  대수선 내용 (제4쪽 √ — 증설 · 해체 · 수선 · 변경 가운데 하나 · 수량)", need=22 * 13 + 10)
    p.row([(4, "항목", L), (4, "증설 · 해체 · 수선 · 변경", L), (4, "수량(㎡ · 개)", L)], h=20)
    for i, (nm, unit) in enumerate(DAESU, 1):
        q = (I(f"대수량#{i}", ex=_ex(ex, f"대수량#{i}"), fmt=NUM if unit == "개" else AREA, align="right", size=9) if unit else
             ("— (원문에 수량 칸 없음)", {"kind": "text", "size": 7}))
        row = [(4, nm.replace("의", "") if unit is None else nm, {"kind": "text", "size": 8}),
               (4, I(f"대수선#{i}", ex=_ex(ex, f"대수선#{i}"), dv=",".join(DAE_K), align="center", size=9))]
        row.append((4,) + (q if isinstance(q, tuple) else (q,)))
        p.row(row, h=22)
    g.sec(p, "㉳  허가 뒤 — 착수 기한 · 처리기간", need=24 * 3 + 46 * 2 + 10)
    p.row([(3, "허가일", L), (4, I("허가일", ex=_ex(ex, "허가일"), fmt=DT, size=9)), (5, "허가를 받은 날(허가서에 적힌 날)", s7)], h=24)
    p.row([(3, "공장(신설ㆍ증설 · 업종변경 승인)", dict(L, size=7.5)), (4, I("공장", ex=_ex(ex, "공장"), dv=",".join(YN), size=9)),
           (5, "「산업집적활성화 및 공장설립에 관한 법률」 제13조 승인을 받은 공장이면 «예»(3년)", s7)], h=24)
    HD = "{허가일}"
    YRS = '(IF({공장}="예",3,2))'
    DUE = "(" + 끝날식(HD, f"12*{YRS}") + ")"      # 🩹 11-17 G738: EDATE(허가일, 24) 는 평년 2월 28일 허가 · 끝 해 윤년이면 하루 이름 — 기간셈(민법 제160조 ② · ③)
    f = (f'=IF(N({HD})=0,"","{CJ_A}"&{_ymd(HD)}&"{CJ_B}"&{_ymd(DUE)}&"("&{_yo(DUE)}&"{CJ_C}"&{YRS}&"{CJ_D}")')
    p.row([(3, "착수 기한", L), (9, F("착수기한", f, align="left", size=8.5))], h=46)
    p.row([(3, "허가권자", L), (5, I("허가권자", ex=_ex(ex, "허가권자"), dv=",".join(HG), align="left", size=8)),
           (4, "제5쪽 «허가안내» 처리기간", s7)], h=24)
    f = '=IF({허가권자}="","","' + CG_A + '"&' + 'IF({허가권자}="' + HG[0] + '","' + HG_T[0] + '",IF({허가권자}="' + HG[1] + '","' + HG_T[1] + '","' + HG_T[2] + '"))&"' + CG_B + '")'
    p.row([(3, "처리기간", L), (9, F("처리기간", f, align="left", size=8.5))], h=24)
    g.sec(p, "㉴  아직 안 적은 칸", need=46 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({제1쪽!발주자}="",{건축구분}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst
                  + ',4,300)))', align="left", size=8.5))], h=46)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신청서의 [ ] 칸은 여기서 고르면 √ 가 됩니다. 면적 · 이름은 신청서 쪽에 바로 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축주 · 설계자 · 대지 · 면적)."])
    return p


BIN = [("건축구분", '{건축구분}=""'), ("건축주 성명", '{제1쪽!발주자}=""'), ("건축주 주소", '{제1쪽!건축주주소}=""'),
       ("설계자", '{제1쪽!설계자}=""'), ("대지위치", '{제1쪽!현장위치}=""'), ("지번", '{제1쪽!지번}=""'),
       ("대지면적", 'N({제1쪽!대지면적})=0'), ("건축면적", 'N({제1쪽!건축면적})=0'), ("연면적 합계", 'N({제1쪽!연면적})=0'),
       ("주용도", '{제1쪽!주용도}=""'), ("시공기간", 'N({제2쪽!시공기간})=0')]


# ── 제1쪽 ────────────────────────────────────────────────────────────────
P1X = [124, 259, 261, 367, 416, 455, 520, 557, 560, 618, 625, 675, 692, 707, 793, 851, 864, 930, 966, 980, 1000, 1060, 1100, 1118]
G1 = Grid(P1X)


def page1(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제1쪽", fit=1, widths=G1.w)
    X1, XL, X2 = 124, 259, 1118

    def inp(k, **kw):
        kw.setdefault("size", 9)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    prow(p, G1, [(X1, 707, HEAD, {"kind": "free", "size": 7.5}), (707, X2, SEUM, {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    prow(p, G1, [(X1, X2, TITLE, {"kind": "free", "size": 16, "bold": True, "align": "center"})], h=30)
    prow(p, G1, [(X1, 966, "• 어두운 난(      )은 신청인이 작성하지 않으며, [ ]에는 해당하는 곳에 √ 표시를 합니다.", {"kind": "free", "size": 7.5}),
                 (966, X2, "(6쪽 중 제1쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=12)
    band = dict(SUB, fill=S["gray"], size=7.5)
    rb = prow(p, G1, [(X1, 618, "허가번호(연도-기관코드-업무구분-허가일련번호)", band), (618, 870 if 870 in G1.ix else 864, "접수일자", band),
                      (870 if 870 in G1.ix else 864, X2, "처리일자", band)], h=24)
    hline(p, G1, rb, X1, X2, S["med"], below=False)
    hline(p, G1, rb, X1, X2, S["med"])
    vline(p, G1, rb, rb, 618, S["gry"])
    vline(p, G1, rb, rb, 864, S["gry"])
    p.gap(6)
    # 건축구분
    def ck(i, x1, x2):
        return (x1, x2, F(f"구분{i + 1}", "=" + _ck(f'{{셈!건축구분}}="{GUBUN[i]}"', GUBUN[i]), align="left", size=9), NB)
    r1 = prow(p, G1, [(X1, XL, "건축구분", dict(SUBC, size=9.5, rs=2)), ck(0, XL, 416), ck(1, 416, 557), ck(2, 557, 707), ck(3, 707, 851),
                      ck(4, 851, 966), ck(5, 966, X2)], h=21)
    r2 = prow(p, G1, [ck(6, XL, 557), ck(7, 557, 851), ck(8, 851, X2)], h=21)
    hline(p, G1, r1, X1, X2, S["med"], below=False)
    hline(p, G1, r2, X1, X2, S["med"])
    vline(p, G1, r1, r2, XL, S["gry"])
    p.gap(6)
    # ① 건축주
    a = prow(p, G1, [(X1, XL, "① 건축주", dict(SUBC, size=9.5, rs=8)), (XL, 692, "성명(법인명)", SUB), (692, X2, "생년월일(사업자 또는 법인등록번호)", SUB)], h=11)
    b = prow(p, G1, [(XL, 692, inp("발주자"), NB), (692, X2, inp("생년월일"), NB)], h=13)
    hline(p, G1, b, XL, X2, S["lgt"])
    vline(p, G1, a, b, 692, S["lgt"])
    prow(p, G1, [(XL, X2, "주소", SUB)], h=11)
    c = prow(p, G1, [(XL, 707, inp("건축주주소"), NB), (707, 864, "(전화번호:", dict(FRR, size=8)), (864, 1100, inp("건축주전화", size=8.5), NB), (1100, X2, ")", FR)], h=14)
    hline(p, G1, c, XL, X2, S["lgt"])
    gray = dict(FR, size=8, fill=S["gray"], wrap=True)
    d1 = prow(p, G1, [(XL, 367, "전자우편\n송달동의", dict(SUBC, size=8.5, rs=4)),
                      (367, X2, "「행정절차법」 제14조에 따라 정보통신망을 이용한 각종 부담금 부과 사전통지 등의 문서송달에 동의합니다.", gray)], h=25)
    prow(p, G1, [(367, 692, F("송달1", "=" + _ck(f'{{셈!송달}}="{SONG[0]}"', SONG[0]), align="center", size=9), NB),
                 (692, X2, F("송달2", "=" + _ck(f'{{셈!송달}}="{SONG[1]}"', SONG[1]), align="center", size=9), NB)], h=25)
    prow(p, G1, [(367, 793, "건축주", dict(FRR, size=9)), (793, 980, F("건축주서명", '=IF({발주자}="","",{발주자})', align="center", size=9), NB),
                 (980, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=26)
    d4 = prow(p, G1, [(367, 520, "전자우편 주소", dict(FR, size=8.5)), (520, 793, inp("메일앞", align="right"), NB), (793, 864, "@", FRC),
                      (864, X2, inp("메일뒤"), NB)], h=25)
    hline(p, G1, d1, 367, X2, S["lgt"])
    hline(p, G1, d1 + 1, 367, X2, S["lgt"])
    hline(p, G1, d1 + 2, 367, X2, S["lgt"])
    vline(p, G1, d1, d4, 367, S["lgt"])
    vline(p, G1, a, d4, XL, S["gry"])
    hline(p, G1, a, X1, X2, S["med"], below=False)
    hline(p, G1, d4, X1, X2, S["med"])
    p.gap(6)
    # ② 설계자
    a = prow(p, G1, [(X1, XL, "② 설계자", dict(SUBC, size=9.5, rs=6)), (XL, 675, "성명(법인명)", SUB), (675, 864, "자격번호", SUB),
                     (864, X2, "협회 회원번호", SUB)], h=11)
    b = prow(p, G1, [(XL, 560, inp("설계자"), NB), (560, 675, "(서명 또는 인)", dict(FRR, size=7)), (675, 864, inp("자격번호"), NB),
                     (864, X2, inp("회원번호"), NB)], h=13)
    hline(p, G1, b, XL, X2, S["lgt"])
    vline(p, G1, a, b, 675, S["lgt"])
    vline(p, G1, a, b, 864, S["lgt"])
    c = prow(p, G1, [(XL, 675, "사무소 명", SUB), (675, X2, "신고번호", SUB)], h=11)
    d = prow(p, G1, [(XL, 675, inp("사무소명"), NB), (675, X2, inp("신고번호"), NB)], h=13)
    hline(p, G1, d, XL, X2, S["lgt"])
    vline(p, G1, c, d, 675, S["lgt"])
    prow(p, G1, [(XL, X2, "사무소 주소", SUB)], h=11)
    e = prow(p, G1, [(XL, 707, inp("사무소주소"), NB), (707, 864, "(전화번호:", dict(FRR, size=8)), (864, 1100, inp("사무소전화", size=8.5), NB), (1100, X2, ")", FR)], h=14)
    vline(p, G1, a, e, XL, S["gry"])
    hline(p, G1, a, X1, X2, S["med"], below=False)
    hline(p, G1, e, X1, X2, S["med"])
    p.gap(6)
    # ③ 대지조건
    a = prow(p, G1, [(X1, XL, "③ 대지조건", dict(SUBC, size=9.5, rs=8)), (XL, X2, "대지위치", SUB)], h=11)
    b = prow(p, G1, [(XL, X2, inp("현장위치"), NB)], h=13)
    hline(p, G1, b, XL, X2, S["lgt"])
    rows = [("지번", "지번", "관련지번", "관련지번"), ("지목", "지목", "용도지역", "용도지역")]
    for l1, k1, l2, k2 in rows:
        c = prow(p, G1, [(XL, 692, l1, SUB), (692, X2, l2, SUB)], h=11)
        d = prow(p, G1, [(XL, 692, inp(k1), NB), (692, X2, inp(k2), NB)], h=13)
        hline(p, G1, d, XL, X2, S["lgt"])
        vline(p, G1, c, d, 692, S["lgt"])
    c = prow(p, G1, [(XL, 692, "용도지구", SUB), (692, X2, "용도구역", SUB)], h=11)
    d = prow(p, G1, [(XL, 520, inp("용도지구1", align="center"), NB), (520, 560, "/", FRC), (560, 692, inp("용도지구2", align="center"), NB),
                     (692, 930, inp("용도구역1", align="center"), NB), (930, 1000, "/", FRC), (1000, X2, inp("용도구역2", align="center"), NB)], h=13)
    vline(p, G1, c, d, 692, S["lgt"])
    vline(p, G1, a, d, XL, S["gry"])
    hline(p, G1, a, X1, X2, S["med"], below=False)
    hline(p, G1, d, X1, X2, S["med"])
    p.gap(6)
    nt = ("• 대수선의 경우에는 대수선 개요(IV)만 적되, 대수선으로 인하여 층별 개요와 동별 개요의 (주)구조가 변경되는 경우에는 변경되는 (주)구조를 "
          "동별 개요와 층별 개요에 적습니다.\n• 건축구분에 관계없이 전체 건축물에 대한 개요를 적습니다.")
    rn = prow(p, G1, [(X1, X2, nt, dict(FR, size=8, fill=S["gray"], wrap=True, valign="top"))], h=40)
    hline(p, G1, rn, X1, X2, S["med"], below=False)
    hline(p, G1, rn, X1, X2, S["med"])
    p.gap(6)
    rh = prow(p, G1, [(X1, X2, "Ⅰ. 전체 개요", {"kind": "free", "size": 11, "bold": True, "align": "left"})], h=20)
    hline(p, G1, rh, X1, X2, S["med"])
    # 전체 개요 — 넓이 셋 줄
    DJ, GC = "{대지면적}", "{건축면적}"
    pairs = [("대지면적", inp("대지면적", fmt=AREA, align="right"), "㎡", "건축면적", inp("건축면적", fmt=AREA, align="right"), "㎡"),
             ("건폐율", F("건폐율", f'=IF(OR(N({DJ})=0,N({GC})=0),"",ROUND({GC}/{DJ}*100,2))', fmt='0.00;;""', align="right", size=9), "%",
              "연면적 합계", inp("연면적", fmt=AREA, align="right"), "㎡"),
             ("연면적 합계(용적률 산정용)", inp("연면적용적", fmt=AREA, align="right"), "㎡",
              "용적률", F("용적률", '=IF(OR(N({대지면적})=0,N({연면적용적})=0),"",ROUND({연면적용적}/{대지면적}*100,2))', fmt='0.00;;""',
                       align="right", size=9), "%")]
    first = None
    for l1, v1, u1, l2, v2, u2 in pairs:
        c = prow(p, G1, [(X1, 625, l1, SUB), (625, X2, l2, SUB)], h=11)
        first = first or c
        d = prow(p, G1, [(X1, 560, v1, NB), (560, 625, u1, dict(FRR, size=7.5)), (625, 1060, v2, NB), (1060, X2, u2, dict(FRR, size=7.5))], h=13)
        hline(p, G1, d, X1, X2, S["lgt"])
        vline(p, G1, c, d, 625, S["lgt"])
    # ④ ⑤
    c = prow(p, G1, [(X1, 455, "④ 건축물 명칭", dict(SUB, size=9)), (455, 793, "주 건축물 수", SUB), (793, X2, "부속 건축물", SUB)], h=12)
    d = prow(p, G1, [(X1, 455, inp("건축물명칭", size=9), NB), (455, 692, inp("주동수", fmt=NUM, align="right"), NB), (692, 793, "동", dict(FRR, size=8)),
                     (793, 864, inp("부속동수", fmt=NUM, align="right"), NB), (864, 930, "동", dict(FRR, size=8)),
                     (930, 1060, inp("부속면적", fmt=AREA, align="right"), NB), (1060, X2, "㎡", dict(FRR, size=7.5))], h=13)
    hline(p, G1, d, X1, X2, S["lgt"])
    vline(p, G1, c, d, 455, S["lgt"])
    vline(p, G1, c, d, 793, S["lgt"])
    c = prow(p, G1, [(X1, 455, "⑤ 주용도", dict(SUB, size=9)), (455, 618, "세대/호/가구수", SUB), (618, 692, inp("세대수", fmt=NUM, align="right", size=8), NB),
                     (692, 793, "세대", dict(FRR, size=7.5)), (793, X2, "총 주차대수", SUB)], h=11)
    prow(p, G1, [(X1, 455, inp("주용도", size=9), NB), (455, 618, "", NB), (618, 692, inp("호수", fmt=NUM, align="right", size=8), NB),
                 (692, 793, "호", dict(FRR, size=7.5)), (793, X2, "", NB)], h=11)
    d = prow(p, G1, [(X1, 455, "", NB), (455, 618, "", NB), (618, 692, inp("가구수", fmt=NUM, align="right", size=8), NB), (692, 793, "가구", dict(FRR, size=7.5)),
                     (793, 1060, inp("주차대수", fmt=NUM, align="right"), NB), (1060, X2, "대", dict(FRR, size=7.5))], h=12)
    hline(p, G1, d, X1, X2, S["lgt"])
    vline(p, G1, c, d, 455, S["lgt"])
    vline(p, G1, c, d, 793, S["lgt"])
    c = prow(p, G1, [(X1, X2, "주택을 포함하는 경우 세대/가구/호별 평균 전용면적", SUB)], h=11)
    d = prow(p, G1, [(X1, 1060, inp("평균전용", fmt=AREA, align="right"), NB), (1060, X2, "㎡", dict(FRR, size=7.5))], h=14)
    hline(p, G1, d, X1, X2, S["med"])
    p.end_print()
    p.after_note(["건폐율 · 용적률은 대지면적 · 건축면적 · 연면적 합계(용적률 산정용)를 적으면 저절로 나옵니다. [ ] 칸은 ① 장에서 고릅니다. "
                  "건축주 성명 · 대지위치는 공통 정보(발주자 · 현장 위치)가 있으면 먼저 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축주 · 설계자 · 대지 · 면적)."])
    return p


# ── 제2쪽 ────────────────────────────────────────────────────────────────
HYEOP = ["건축협정을 체결한 건축물", "결합건축협정을 체결한 건축물", "특별건축구역에서 건축한 건축물", "특별가로구역에서 건축한 건축물"]
P2X = [120, 257, 288, 335, 370, 405, 433, 456, 505, 531, 597, 623, 629, 697, 727, 743, 789, 825, 841, 870, 924, 954, 1080, 1120]
G2 = Grid(P2X)
# 일괄처리 줄 — (x 자리, 번호) : 원문 그림 차례 그대로
IL_ROWS = [[(257, 597, 1), (597, 841, 2), (841, 1120, 3)], [(257, 841, 4), (841, 1120, 5)], [(257, 597, 6), (597, 841, 7), (841, 1120, 8)],
           [(257, 841, 9), (841, 1120, 10)], [(257, 597, 11), (597, 841, 12), (841, 1120, 13)], [(257, 697, 14), (697, 1120, 15)],
           [(257, 697, 16), (697, 1120, 17)], [(257, 697, 18), (697, 1120, 19)], [(257, 697, 20), (697, 1120, 21)], [(257, 697, 22), (697, 1120, 23)]]


def page2(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제2쪽", fit=1, widths=G2.w)
    X1, XL, X2 = 120, 257, 1120

    def inp(k, **kw):
        kw.setdefault("size", 9)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    def num(k, fmt=NUM, **kw):
        return inp(k, fmt=fmt, align="right", **kw)

    U = dict(FRR, size=7.5)
    prow(p, G2, [(X1, 789, "■ 건축법 시행규칙 [별지 제1호의4서식]", {"kind": "free", "size": 7.5}),
                 (789, X2, "(6쪽 중 제2쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    r0 = prow(p, G2, [(X1, 335, "⑥ 하수처리시설", dict(SUBC, size=9)), (335, 405, "형식", SUB), (405, 743, inp("하수형식"), NB),
                      (743, 789, "용량", SUB), (789, 1080, num("하수용량"), NB), (1080, X2, "인용", U)], h=18)
    vline(p, G2, r0, r0, 335, S["gry"])
    vline(p, G2, r0, r0, 743, S["gry"])
    hline(p, G2, r0, X1, X2, S["med"], below=False)
    hline(p, G2, r0, X1, X2, S["gry"])
    a = prow(p, G2, [(X1, 335, "급수설비(저수조)", dict(SUBC, size=9, rs=3)), (335, 531, "구분", SUBC), (531, X2, "수량 및 총 용량", SUBC)], h=18)
    prow(p, G2, [(335, 531, "지상", SUBC), (531, 789, num("급수지상수"), NB), (789, 825, "개", U), (825, 1080, num("급수지상량", fmt=AREA), NB), (1080, X2, "㎥", U)], h=18)
    b = prow(p, G2, [(335, 531, "지하", SUBC), (531, 789, num("급수지하수"), NB), (789, 825, "개", U), (825, 1080, num("급수지하량", fmt=AREA), NB), (1080, X2, "㎥", U)], h=18)
    for r in (a, a + 1):
        hline(p, G2, r, 335, X2, S["lgt"])
    vline(p, G2, a, b, 335, S["gry"])
    vline(p, G2, a, b, 531, S["lgt"])
    vline(p, G2, a + 1, b, 825, S["lgt"])
    hline(p, G2, b, X1, X2, S["gry"])
    # 주차장
    a = prow(p, G2, [(X1, XL, "주차장", dict(SUBC, size=9, rs=4)), (XL, 335, "구분", SUBC), (335, 531, "옥내", SUBC), (531, 727, "옥외", SUBC),
                     (727, 924, "인근", SUBC), (924, X2, "면제", SUBC)], h=22)
    for j, (nm, kk) in enumerate([("자주식", "자주"), ("기계식", "기계"), ("전기차", "전기")]):
        it = [(XL, 335, nm, SUBC), (335, 405, num(f"옥내{kk}대"), NB), (405, 433, "대", U), (433, 505, num(f"옥내{kk}면", fmt=AREA, size=8), NB), (505, 531, "㎡", U),
              (531, 597, num(f"옥외{kk}대"), NB), (597, 629, "대", U), (629, 697, num(f"옥외{kk}면", fmt=AREA, size=8), NB), (697, 727, "㎡", U),
              (727, 789, num(f"인근{kk}대"), NB), (789, 825, "대", U), (825, 870, num(f"인근{kk}면", fmt=AREA, size=8), NB), (870, 924, "㎡", U)]
        if j == 0:
            it += [(924, 1080, num("면제대"), dict(NB, rs=3)), (1080, X2, "대", dict(U, rs=3))]
        prow(p, G2, it, h=17)
    b = a + 3
    for r in range(a, b):
        hline(p, G2, r, XL, 924, S["lgt"])
    for x in (335, 531, 727, 924):
        vline(p, G2, a, b, x, S["lgt"])
    for x in (433, 629, 825):
        vline(p, G2, a + 1, b, x, S["lgt"])
    vline(p, G2, a, b, XL, S["gry"])
    hline(p, G2, b, X1, X2, S["gry"])
    # 공개 공지 · 조경 · 건축선
    a = prow(p, G2, [(X1, 370, "공개 공지 면적", SUB), (370, 623, "조경 면적", SUB), (623, 870, "건축선 후퇴 면적", SUB), (870, X2, "건축선 후퇴 거리", SUB)], h=11)
    b = prow(p, G2, [(X1, 335, num("공개공지", fmt=AREA), NB), (335, 370, "㎡", U), (370, 597, num("조경면적", fmt=AREA), NB), (597, 623, "㎡", U),
                     (623, 841, num("후퇴면적", fmt=AREA), NB), (841, 870, "㎡", U), (870, 1080, num("후퇴거리", fmt='#,##0.00;;""'), NB), (1080, X2, "m", U)], h=14)
    for x in (370, 623, 870):
        vline(p, G2, a, b, x, S["lgt"])
    hline(p, G2, b, X1, X2, S["gry"])
    # 협정 · 구역 √
    def hk(i):
        return F(f"협정표시{i}", "=" + _ck(f'{{셈!협정#{i}}}="√"', HYEOP[i - 1]), align="left", size=9)
    a = prow(p, G2, [(X1, 623, hk(1), NB), (623, X2, hk(2), NB)], h=18)
    b = prow(p, G2, [(X1, 623, hk(3), NB), (623, X2, hk(4), NB)], h=18)
    hline(p, G2, a, X1, X2, S["lgt"])
    vline(p, G2, a, b, 623, S["lgt"])
    hline(p, G2, b, X1, X2, S["lgt"])
    a = prow(p, G2, [(X1, 288, "고시명", SUBC), (288, 456, "고시번호", SUBC), (456, 623, "고시일자", SUBC), (623, 789, "공고명", SUBC),
                     (789, 954, "공고번호", SUBC), (954, X2, "공고일자", SUBC)], h=18)
    b = prow(p, G2, [(X1, 288, inp("고시명", size=8), NB), (288, 456, inp("고시번호", size=8), NB), (456, 623, inp("고시일자", size=8), NB),
                     (623, 789, inp("공고명", size=8), NB), (789, 954, inp("공고번호", size=8), NB), (954, X2, inp("공고일자", size=8), NB)], h=18)
    hline(p, G2, a, X1, X2, S["lgt"])
    for x in (288, 456, 623, 789, 954):
        vline(p, G2, a, b, x, S["lgt"])
    hline(p, G2, b, X1, X2, S["lgt"])
    a = prow(p, G2, [(X1, 623, "「건축법」 제73조에 따라 적용된 특례사항", SUBC), (623, X2, "「건축법」 제77조의3제2항에 따라 적용된 특례사항", SUBC)], h=18)
    b = prow(p, G2, [(X1, 623, inp("특례73", size=8, wrap=True), NB), (623, X2, inp("특례77", size=8, wrap=True), NB)], h=18)
    hline(p, G2, a, X1, X2, S["lgt"])
    vline(p, G2, a, b, 623, S["lgt"])
    hline(p, G2, b, X1, X2, S["med"])
    p.gap(6)
    a = prow(p, G2, [(X1, XL, "변경사항", dict(SUBC, size=9, rs=2)), (XL, X2, inp("변경사항", size=8.5, wrap=True), NB)], h=24)
    b = prow(p, G2, [(XL, X2, "※ 유의사항: 허가사항을 변경하려는 경우에만 그 내용을 간략하게 적습니다.", dict(FR, size=7))], h=11)
    vline(p, G2, a, b, XL, S["gry"])
    hline(p, G2, a, X1, X2, S["med"], below=False)
    hline(p, G2, b, X1, X2, S["med"])
    p.gap(6)
    a = p.r
    first = True
    for row in IL_ROWS:
        it = [(X1, XL, "일괄처리\n사항", dict(SUBC, size=9, rs=len(IL_ROWS) + 1))] if first else []
        first = False
        for x1, x2, n in row:
            it.append((x1, x2, F(f"일괄표시{n}", "=" + _ck(f'{{셈!일괄#{n}}}="√"', ILGWAL[n - 1]), align="left", size=8.5, wrap=True), NB))
        prow(p, G2, it, h=21 if row[-1][2] != 5 else 24)
    b = prow(p, G2, [(XL, X2, "※ 유의사항: 「건축법」 제11조에 따라 다른 법률의 허가를 받거나 신고를 한 것으로 보는 사항에 √ 표시합니다.", dict(FR, size=7))], h=12)
    vline(p, G2, a, b, XL, S["gry"])
    hline(p, G2, a, X1, X2, S["med"], below=False)
    hline(p, G2, b, X1, X2, S["med"])
    p.gap(6)
    a = prow(p, G2, [(X1, XL, "존치기간", SUBC), (XL, 335, num("존치년"), NB), (335, 370, "년", FR), (370, 433, num("존치월"), NB), (433, 456, "월", FR),
                     (456, 531, num("존치일"), NB), (531, X2, "일까지 (가설건축물 건축허가인 경우만 적습니다)", dict(FR, size=8.5))], h=24)
    b = prow(p, G2, [(X1, XL, "시공기간", SUBC), (XL, 370, "착공일부터", FR), (370, 433, num("시공기간"), NB), (433, 456, "년", FR), (456, X2, "", NB)], h=24)
    hline(p, G2, a, X1, X2, S["lgt"])
    vline(p, G2, a, b, XL, S["gry"])
    hline(p, G2, a, X1, X2, S["med"], below=False)
    hline(p, G2, b, X1, X2, S["med"])
    p.gap(6)
    prow(p, G2, [(X1, X2, "「건축법」 제11조ㆍ제16조ㆍ제19조 및 제20조제1항에 따라 위와 같이 (변경)허가를 신청합니다.", dict(FR, size=9))], h=20)
    prow(p, G2, [(X1, 743, "", NB), (743, X2, inp("신청일", blank="년          월          일", fmt="date", align="right", size=9), NB)], h=20)
    prow(p, G2, [(X1, 743, "", NB), (743, 841, "건축주", dict(FRR, size=9)), (841, 954, F("건축주서명2", '=IF({제1쪽!발주자}="","",{제1쪽!발주자})', align="center", size=9), NB),
                 (954, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=24)
    p.gap(10)
    rk = prow(p, G2, [(X1, X2, "특별시장ㆍ광역시장ㆍ특별자치시장ㆍ특별자치도지사, 시장ㆍ군수ㆍ구청장  귀하", {"kind": "free", "size": 11, "bold": True, "align": "left"})], h=22)
    hline(p, G2, rk, X1, X2, S["med"])
    p.end_print()
    p.after_note(["[ ] 칸(협정 · 구역 · 일괄처리사항)은 ① 장에서 √ 를 고릅니다. 신청일을 비우면 오늘 날짜가 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축주 · 설계자 · 대지 · 면적)."])
    return p


# ── 제3쪽 ────────────────────────────────────────────────────────────────
P3X = [120, 175, 250, 290, 315, 321, 362, 380, 470, 490, 521, 612, 708, 760, 838, 870, 898, 904, 960, 1060, 1080, 1118]
G3 = Grid(P3X)


def page3(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제3쪽", fit=1, widths=G3.w)
    X1, XA, XB, X2 = 120, 521, 708, 1118

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    def num(k, fmt=NUM, **kw):
        return inp(k, fmt=fmt, align="right", **kw)

    U = dict(FRR, size=8)
    prow(p, G3, [(X1, 838, "■ 건축법 시행규칙 [별지 제1호의4서식]", {"kind": "free", "size": 7.5}),
                 (838, X2, "(6쪽 중 제3쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    prow(p, G3, [(X1, X2, "Ⅱ. 동별 개요", {"kind": "free", "size": 11, "bold": True, "align": "left"})], h=18)
    prow(p, G3, [(X1, X2, "※ 는 증축이 있는 경우 증가부분만 적습니다.", dict(FR, size=7.5))], h=12)
    top = prow(p, G3, [(X1, XA, "기존 건축물의 동별 개요", SUBC), (XA, XB, "구 분", SUBC), (XB, X2, "허가신청 건축물의 동별 개요", SUBC)], h=18)
    rows = [top]

    def ck2(side, key, opts, size=8.5):
        txt = "&\"   \"&".join(_ck(f'{{셈!{side}{key}}}="{o}"', o) for o in opts)
        return F(f"{side}{key}표시", "=" + txt, align="center", size=size)

    rows.append(prow(p, G3, [(X1, XA, ck2("기존", "주부속", JU), NB), (XA, XB, "주/부속구분", SUBC), (XB, X2, ck2("신청", "주부속", JU), NB)], h=19))
    one = [("⑦ 동 명칭 및 번호", "동명칭", None), ("주용도", "주용도", None)]
    for lab, k, _ in one:
        rows.append(prow(p, G3, [(X1, XA, inp("구" + k), NB), (XA, XB, lab, SUBC), (XB, X2, inp("신" + k), NB)], h=19))
    rows.append(prow(p, G3, [(X1, 250, num("구호수"), NB), (250, XA, "호", dict(FR, size=8)), (XA, XB, "※ ⑧ 호수", SUBC),
                             (XB, 838, num("신호수"), NB), (838, X2, "호", dict(FR, size=8))], h=19))
    r9 = prow(p, G3, [(X1, 250, num("구가구"), NB), (250, 315, "가구", U), (315, 470, num("구세대"), NB), (470, XA, "세대", U), (XA, XB, "※ ⑨ 가구/세대수", SUBC),
                      (XB, 838, num("신가구"), NB), (838, 898, "가구", U), (898, 1060, num("신세대"), NB), (1060, X2, "세대", U)], h=19)
    rows.append(r9)
    vline(p, G3, r9, r9, 315, S["lgt"])
    vline(p, G3, r9, r9, 898, S["lgt"])
    rows.append(prow(p, G3, [(X1, XA, ck2("기존", "주구조", GUJO, size=8), NB), (XA, XB, "주구조", SUBC), (XB, X2, ck2("신청", "주구조", GUJO, size=8), NB)], h=19))
    for lab, k, h, fmt in [("⑩ 세부구조", "세부구조", 38, None), ("지붕", "지붕", 19, None), ("⑪ 지붕 마감재료", "지붕마감", 19, None),
                           ("※ 건축면적(㎡)", "건축면적", 19, AREA), ("※ 연면적(㎡)", "연면적", 19, AREA), ("※ 용적률 산정용\n연면적(㎡)", "용적연면적", 29, AREA)]:
        mk = (lambda kk: num(kk, fmt=fmt)) if fmt else (lambda kk: inp(kk, wrap=True))
        rows.append(prow(p, G3, [(X1, XA, mk("구" + k), NB), (XA, XB, lab, SUBC), (XB, X2, mk("신" + k), NB)], h=h))
    rf = prow(p, G3, [(X1, 175, "지하:", dict(FR, size=8)), (175, 290, num("구지하"), NB), (290, 321, "층", U), (321, 380, "지상:", dict(FR, size=8)),
                      (380, 490, num("구지상"), NB), (490, XA, "층", U), (XA, XB, "층수", SUBC),
                      (XB, 760, "지하:", dict(FR, size=8)), (760, 870, num("신지하"), NB), (870, 904, "층", U), (904, 960, "지상:", dict(FR, size=8)),
                      (960, 1080, num("신지상"), NB), (1080, X2, "층", U)], h=19)
    rows.append(rf)
    vline(p, G3, rf, rf, 321, S["lgt"])
    vline(p, G3, rf, rf, 904, S["lgt"])
    for lab, k, fmt in [("높이(m)", "높이", '#,##0.00;;""'), ("승용승강기", "승용", NUM), ("비상용승강기", "비상", NUM)]:
        rows.append(prow(p, G3, [(X1, XA, num("구" + k, fmt=fmt), NB), (XA, XB, lab, SUBC), (XB, X2, num("신" + k, fmt=fmt), NB)], h=19))
    sp = [("보ㆍ차양길이:", "보차"), ("기둥과 기둥사이:", "기둥"), ("내력벽과 내력벽사이:", "내력")]
    r_sp = p.r
    for j, (lab, k) in enumerate(sp):
        it = [(X1, 290, lab, dict(FR, size=8)), (290, 490, num("구" + k, fmt='#,##0.00;;""'), NB), (490, XA, "m", U)]
        if j == 0:
            it.append((XA, XB, "특수구조 건축물\n(「건축법 시행령」\n제2조제18호)", dict(SUBC, size=8, rs=3)))
        it += [(XB, 870, lab, dict(FR, size=8)), (870, 1080, num("신" + k, fmt='#,##0.00;;""'), NB), (1080, X2, "m", U)]
        prow(p, G3, it, h=14)
    rows.append(p.r - 1)
    last = prow(p, G3, [(X1, XA, inp("구특수유형", wrap=True), NB), (XA, XB, "※ ⑫ 특수구조\n건축물 유형", SUBC), (XB, X2, inp("신특수유형", wrap=True), NB)], h=29)
    rows.append(last)
    for r in rows[:-1]:
        hline(p, G3, r, X1, X2, S["lgt"])
    vline(p, G3, top, last, XA, S["gry"])
    vline(p, G3, top, last, XB, S["gry"])
    hline(p, G3, top, X1, X2, S["med"], below=False)
    hline(p, G3, last, X1, X2, S["med"])
    p.gap(14)
    # Ⅲ. 층별 개요
    prow(p, G3, [(X1, X2, "Ⅲ. 층별 개요", {"kind": "free", "size": 11, "bold": True, "align": "left"})], h=18)
    a = prow(p, G3, [(X1, XB, "• 동 명칭 및 번호 (⑦과 동일하게 적습니다)", dict(FR, size=8.5)),
                     (XB, X2, F("층별동", '=IF({신동명칭}="",IF({구동명칭}="","",{구동명칭}),{신동명칭})', align="left", size=9), NB)], h=19)
    hline(p, G3, a, X1, X2, S["med"], below=False)
    b = prow(p, G3, [(X1, XA, "기존 건축물의 층별 개요", SUBC), (XA, XB, "구 분", SUBC), (XB, X2, "허가신청 건축물의 층별 개요", SUBC)], h=19)
    c = prow(p, G3, [(X1, 250, "⑬ 구조", SUBC), (250, 362, "⑭ 용도", SUBC), (362, XA, "⑮ 면적(㎡)", SUBC), (XA, 612, "층구분", SUBC), (612, XB, "건축구분", SUBC),
                     (XB, 838, "⑯ 구조", SUBC), (838, 958 if 958 in G3.ix else 960, "⑰ 용도", SUBC), (958 if 958 in G3.ix else 960, X2, "⑱ 면적(㎡)", SUBC)], h=19)
    xs = [X1, 250, 362, XA, 612, XB, 838, 960, X2]
    rr = []
    for i in range(1, NF + 1):
        rr.append(prow(p, G3, [(X1, 250, inp(f"구구조#{i}", size=7.5, wrap=True), NB), (250, 362, inp(f"구용도#{i}", size=7.5, wrap=True), NB),
                               (362, XA, num(f"구면적#{i}", fmt=AREA, size=8), NB), (XA, 612, inp(f"층구분#{i}", size=8, align="center"), NB),
                               (612, XB, inp(f"건축구분#{i}", size=8, align="center"), NB), (XB, 838, inp(f"신구조#{i}", size=7.5, wrap=True), NB),
                               (838, 960, inp(f"신용도#{i}", size=7.5, wrap=True), NB), (960, X2, num(f"신면적#{i}", fmt=AREA, size=8), NB)], h=20))
    for r in [a, b, c] + rr[:-1]:
        hline(p, G3, r, X1, X2, S["lgt"])
    for x in (XA, XB):
        vline(p, G3, b, rr[-1], x, S["gry"])
    for x in (250, 362, 612, 838, 960):
        vline(p, G3, c, rr[-1], x, S["lgt"])
    hline(p, G3, rr[-1], X1, X2, S["med"])
    p.end_print()
    p.after_note(["주/부속구분 · 주구조 [ ] 칸은 ① 장에서 고릅니다. 층별 개요 ⑱ 면적의 합계는 ① 장에서 전체 개요 연면적 합계와 대조합니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축물 · 면적)."])
    return p


# ── 제4쪽 ────────────────────────────────────────────────────────────────
P4X = [120, 274, 382, 438, 622, 667, 772, 815, 937, 1118]
G4 = Grid(P4X)
DAE_OPT = "증설ㆍ해체ㆍ수선ㆍ변경"


def _dae_opt(i, prefix=""):
    """증설ㆍ해체ㆍ수선ㆍ변경 — 고른 것 앞에 ◯ (빈 서식은 원문 그대로)"""
    k = f"{{셈!대수선#{i}}}"
    parts = []
    for j, w in enumerate(DAE_K):
        parts.append(f'IF({k}="{w}","◯","")&"{w}"')
    return ("=" + (f'"{prefix}"&' if prefix else "") + '&"ㆍ"&'.join(parts))


def page4(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제4쪽", fit=1, widths=G4.w)
    X1, XM, X2 = 120, 622, 1118

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    def num(k, fmt=AREA, **kw):
        return inp(k, fmt=fmt, align="right", **kw)

    prow(p, G4, [(X1, 772, "■ 건축법 시행규칙 [별지 제1호의4서식]", {"kind": "free", "size": 7.5}),
                 (772, X2, "(6쪽 중 제4쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    prow(p, G4, [(X1, X2, "Ⅳ. 대수선 개요", {"kind": "free", "size": 11, "bold": True, "align": "left"})], h=18)
    prow(p, G4, [(X1, X2, "• 대수선을 하려는 항목에 √를 표시하시고, 증설ㆍ해체ㆍ수선 또는 변경여부를 표시하시기 바랍니다.", dict(FR, size=7.5))], h=12)
    first = p.r
    for i, (nm, unit) in enumerate(DAESU, 1):
        chk = f'IF({{셈!대수선#{i}}}<>"","[√]","[   ]")'
        it = [(X1, 382, "대수선 내용", dict(SUBC, size=9, rs=len(DAESU)))] if i == 1 else []
        if unit is None:       # 다가구 · 다세대 경계벽 — 한 줄로
            it.append((382, X2, F(f"대수선표시{i}", _dae_opt(i, "") .replace("=", "=" + chk + '&" ' + nm + ' "&', 1), align="left", size=8.5), NB))
        else:
            it.append((382, 667, F(f"대수선표시{i}", "=" + chk + f'&" {nm}"', align="left", size=8.5), NB))
            it.append((667, 937 if unit else X2, F(f"대수선고름{i}", _dae_opt(i), align="left", size=8.5), NB))
            if unit:
                q = f"{{셈!대수량#{i}}}"
                it.append((937, X2, F(f"대수선양{i}", f'="[ "&IF(N({q})=0,"            ",TEXT({q},"{"#,##0" if unit == "개" else "#,##0.00"}"))&" {unit}]"', align="right", size=8.5), NB))
        prow(p, G4, it, h=16)
    last = p.r - 1
    vline(p, G4, first, last, 382, S["gry"])
    hline(p, G4, first, X1, X2, S["med"], below=False)
    hline(p, G4, last, X1, X2, S["med"])
    p.gap(10)

    def table(title, h1, h2, n, keys, units):
        prow(p, G4, [(X1, X2, title, {"kind": "free", "size": 10.5, "bold": True, "align": "left"})], h=17)
        a = prow(p, G4, [(X1, XM, "기존 건축물의 유형별 개요", SUBC), (XM, X2, "허가신청 건축물의 유형별 개요", SUBC)], h=18)
        hline(p, G4, a, X1, X2, S["med"], below=False)
        return a

    cols = [(X1, 274), (274, 438), (438, XM), (XM, 772), (772, 937), (937, X2)]
    # 준주택 · 도시형 생활주택
    a = table("※ 준주택, 도시형 생활주택 개요", None, None, N4A, None, None)
    names = ["⑲ 유형", "⑳ 실/호/세대수", "㉑ 실/호/세대별\n면적(㎡)", "㉒ 유형", "㉓ 실/호/세대수", "㉔ 실/호/세대별\n면적(㎡)"]
    b = prow(p, G4, [(x1, x2, t, dict(SUBC, size=8.5)) for (x1, x2), t in zip(cols, names)], h=28)
    ks = ["구유형", "구실수", "구실면적", "신유형", "신실수", "신실면적"]
    rr = []
    for i in range(1, N4A + 1):
        rr.append(prow(p, G4, [(x1, x2, (num(f"{k}#{i}") if "면적" in k else num(f"{k}#{i}", fmt=NUM) if "실수" in k else inp(f"{k}#{i}", size=8)), NB)
                               for (x1, x2), k in zip(cols, ks)], h=18))
    for r in [a, b] + rr[:-1]:
        hline(p, G4, r, X1, X2, S["lgt"])
    vline(p, G4, a, rr[-1], XM, S["gry"])
    for x in (274, 438, 772, 937):
        vline(p, G4, b, rr[-1], x, S["lgt"])
    hline(p, G4, rr[-1], X1, X2, S["med"])
    p.gap(10)
    # 다가구주택
    a = table("※ 다가구주택 호(가구)별 면적", None, None, N4B, None, None)
    names = ["호(가구) 구분", "층구분", "㉕호(가구)별\n전용면적(㎡)", "호(가구) 구분", "층구분", "㉖ 호(가구)별\n전용면적(㎡)"]
    b = prow(p, G4, [(x1, x2, t, dict(SUBC, size=8.5)) for (x1, x2), t in zip(cols, names)], h=28)
    ks = ["구가구", "구가구층", "구가구면적", "신가구", "신가구층", "신가구면적"]
    rr = []
    for i in range(1, N4B + 1):
        rr.append(prow(p, G4, [(x1, x2, (num(f"{k}#{i}") if "면적" in k else inp(f"{k}#{i}", size=8, align="center")), NB)
                               for (x1, x2), k in zip(cols, ks)], h=18))
    for r in [a, b] + rr[:-1]:
        hline(p, G4, r, X1, X2, S["lgt"])
    vline(p, G4, a, rr[-1], XM, S["gry"])
    for x in (274, 438, 772, 937):
        vline(p, G4, b, rr[-1], x, S["lgt"])
    hline(p, G4, rr[-1], X1, X2, S["med"])
    p.gap(10)
    # 임대형기숙사
    a = table("※ 임대형기숙사 호(실)별 면적", None, None, N4C, None, None)
    s1 = prow(p, G4, [(X1, 438, "㉗ 공유공간 전체 면적(㎡)", SUBC), (438, XM, num("구공유"), NB), (XM, 937, "㉘ 공유공간 전체 면적(㎡)", SUBC), (937, X2, num("신공유"), NB)], h=18)
    s2 = prow(p, G4, [(X1, 438, "㉙ 공용공간 전체 면적(㎡)", SUBC), (438, XM, num("구공용"), NB), (XM, 937, "㉚ 공용공간 전체 면적(㎡)", SUBC), (937, X2, num("신공용"), NB)], h=18)
    names = ["호(실) 구분", "층구분", "㉛ 호(실)별\n전용면적(㎡)", "호(실) 구분", "층구분", "㉜ 호(실)별\n전용면적(㎡)"]
    b = prow(p, G4, [(x1, x2, t, dict(SUBC, size=8.5)) for (x1, x2), t in zip(cols, names)], h=28)
    ks = ["구기숙", "구기숙층", "구기숙면적", "신기숙", "신기숙층", "신기숙면적"]
    rr = []
    for i in range(1, N4C + 1):
        rr.append(prow(p, G4, [(x1, x2, (num(f"{k}#{i}") if "면적" in k else inp(f"{k}#{i}", size=8, align="center")), NB)
                               for (x1, x2), k in zip(cols, ks)], h=18))
    for r in [a, s1, s2, b] + rr[:-1]:
        hline(p, G4, r, X1, X2, S["lgt"])
    vline(p, G4, a, rr[-1], XM, S["gry"])
    for x in (438, 937):
        vline(p, G4, s1, s2, x, S["lgt"])
    for x in (274, 438, 772, 937):
        vline(p, G4, b, rr[-1], x, S["lgt"])
    hline(p, G4, rr[-1], X1, X2, S["med"])
    p.end_print()
    p.after_note(["대수선 [ ] · 증설ㆍ해체ㆍ수선ㆍ변경 · 수량은 ① 장에서 고르고 적습니다(고른 것 앞에 ◯)."]
                 if not ex else ["이 시트는 작성 예시입니다(신축 예시라 대수선 · 준주택 · 다가구 · 임대형기숙사 칸은 비움)."])
    return p


# ── 제5쪽(첨부서류 · 허가안내 · 근거규정 · 유의사항 — 원문 글 그대로) ──────────────────────────
P5X = [120, 208, 261, 560, 629, 1118]
G5 = Grid(P5X)
T1 = ("가. 건축할 대지의 범위에 관한 서류\n"
      "나. 건축할 대지의 소유에 관한 권리를 증명하는 서류. 다만, 다음 각 목의 경우에는 그에 따른 서류로 갈음할 수 있습니다.\n"
      " 1) 건축할 대지에 포함된 국유지 또는 공유지에 대해서는 허가권자가 해당 토지의 관리청과 협의하여 그 관리청이 해당 토지를 건축주에게 매각하거나 "
      "양여할 것을 확인한 서류\n"
      " 2) 집합건물의 공용부분을 변경하는 경우에는 「집합건물의 소유 및 관리에 관한 법률」 제15조제1항에 따른 결의가 있었음을 증명하는 서류\n"
      " 3) 「건축법」 제11조에 따라 주택과 주택 외의 시설을 동일 건축물로 건축하는 건축허가를 받아 「주택법 시행령」 제27조제1항에 따른 호수 또는 "
      "세대수 이상으로 건설ㆍ공급하는 경우 「주택법」 제21조제1항 각 호의 어느 하나에 해당함을 증명하는 서류\n"
      "다. 「건축법」 제11조제11항제1호에 해당하는 경우에는 건축할 대지를 사용할 수 있는 권원을 확보하였음을 증명하는 서류\n"
      "라. 「건축법」 제11조제11항제2호 및 같은 법 시행령 제9조의2제1항 각 호의 사유에 해당하는 경우에는 다음 각 목의 서류\n"
      " 1) 건축물 및 해당 대지의 공유자 수의 100분의 80 이상의 서면동의서: 공유자가 자필로 서명하는 서면동의의 방법으로 하며, 주민등록증, 여권 등 "
      "신원을 확인할 수 있는 신분증명서의 사본을 첨부해야 합니다. 다만, 공유자가 해외에 장기체류하거나 법인인 경우 등 불가피한 사유가 있다고 "
      "허가권자가 인정하는 경우에는 공유자가 인감도장을 날인하거나 서명한 서면동의서에 해당 인감증명서나 「본인서명사실 확인 등에 관한 법률」 "
      "제2조제3호에 따른 본인서명사실확인서 또는 같은 법 제7조제7항에 따른 전자본인서명확인서의 발급증을 첨부하는 방법으로 할 수 있습니다.\n"
      " 2) 가목에 따라 동의한 공유자의 지분 합계가 전체 지분의 100분의 80 이상임을 증명하는 서류\n"
      " 3) 「건축법 시행령」 제9조의2제1항 각 호의 어느 하나에 해당함을 증명하는 서류\n"
      " 4) 해당 건축물의 개요\n"
      "마. 「건축법 시행규칙」 제5조에 따른 사전결정서(「건축법」 제10조에 따라 건축에 관한 입지 및 규모의 사전결정서를 받은 경우만 해당합니다)\n"
      "바. 「건축법 시행규칙」 별표 2의 설계도서(「건축법」 제10조에 따른 사전결정을 받은 경우에는 건축계획서 및 배치도는 제외합니다). 다만, "
      "「건축법」 제23조제4항에 따른 표준설계도서에 따라 건축하는 경우에는 건축계획서 및 배치도만 제출하며, 구조도 및 구조계산서는 착공신고 전까지 "
      "제출할 수 있습니다.\n"
      "사. 「건축법」 제11조제5항 각 호에 따른 허가 등을 받거나 신고하기 위해 해당 법령에서 제출하도록 의무화하고 있는 신청서 및 구비서류(해당 사항이 "
      "있는 경우로 한정합니다)\n"
      "아. 「건축법 시행규칙」 별지 제27호의11서식에 따른 결합건축협정서(해당 사항이 있는 경우로 한정합니다)")
T3 = ("가. 용도를 변경하려는 층의 변경 후의 평면도\n나. 용도변경에 따라 변경되는 내화ㆍ방화ㆍ피난 또는 건축설비에 관한 사항을 표시한 도서\n"
      "※ 용도를 변경하려는 층의 변경 전 평면도는 행정정보의 공동이용 또는 「건축법」 제32조제1항에 따른 전산자료를 통해 확인되지 않는 경우 직접 "
      "제출해야 합니다.")
T4 = "가. 제1호나목: 토지등기사항증명서\n나. 제3호: 건축물대장 또는 「건축법」 제32조제1항에 따른 전산자료를 통해 변경 전의 평면도 확인"
TG1 = ("1. 건축물을 건축하거나 대수선하려는 자는 특별자치시장ㆍ특별자치도지사 또는 시장ㆍ군수ㆍ구청장의 허가를 받아야 합니다. 다만, 「건축법」 "
       "제14조제1항 및 같은 법 시행령 제11조제2항에 해당하는 경우에는 미리 특별자치시장ㆍ특별자치도지사 또는 시장ㆍ군수ㆍ구청장에게 같은 법 "
       "시행규칙 제12조에 따라 신고하면 건축허가를 받은 것으로 봅니다.\n"
       "2. 층수가 21층 이상이거나 연면적의 합계가 10만 제곱미터 이상인 건축물[공장, 창고 및 지방건축위원회의 심의를 거친 건축물(초고층 건축물은 "
       "제외)은 제외합니다]의 건축(연면적의 10분의 3 이상을 증축하여 층수가 21층 이상으로 되거나 연면적의 합계가 10만 제곱미터 이상으로 되는 경우를 "
       "포함합니다)을 특별시 또는 광역시에 하려면 특별시장 또는 광역시장의 허가를 받아야 합니다.")
TY = ("1. 건축 또는 용도변경 허가를 받은 후 다음 각 목의 어느 하나에 해당하는 경우에는 그 허가가 취소됩니다.\n"
      " 가. 허가를 받은 날부터 2년(신설ㆍ증설 또는 업종변경의 승인을 받은 공장: 3년) 이내에 공사에 착수하지 않은 경우\n"
      " 나. 가목의 기간 이내에 공사에 착수하였으나 공사의 완료가 불가능하다고 인정되는 경우\n"
      " 다. 「건축법」 제21조에 따른 착공신고 전에 경매 또는 공매 등으로 건축주가 대지의 소유권을 상실한 때부터 6개월이 경과한 이후 공사의 착수가 "
      "불가능하다고 판단되는 경우\n"
      "2. 도시지역에서 허가를 받지 않고 건축물을 건축ㆍ대수선 또는 용도변경을 한 경우에는 3년 이하의 징역 또는 5억원 이하의 벌금에 처하게 되며, "
      "위반건축물은 위반사항이 시정될 때까지 연 2회 이내의 이행강제금이 부과됩니다.\n"
      "3. 다음 각 목의 어느 하나에 해당하는 경우에는 2년 이하의 징역 또는 1억원 이하의 벌금에 처하게 되며, 위반건축물은 위반사항이 시정될 때까지 "
      "연 2회 이내의 이행강제금이 부과됩니다.\n"
      " 가. 도시지역 밖에서 허가를 받지 않고 건축물을 건축ㆍ대수선 또는 용도변경을 한 경우\n"
      " 나. 허가받은 사항을 허가 없이 변경한 경우\n"
      " 다. 허가받지 않고 가설건축물을 건축한 경우")


def page5(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제5쪽", fit=1, widths=G5.w)
    X1, XL, X2 = 120, 261, 1118
    W = sum(G5.w[G5.ix[XL]:])
    TX = {"kind": "free", "size": 7.5, "align": "left", "valign": "top", "wrap": True}
    LB = dict(SUBC, size=8, wrap=True)

    def hh(t, size=7.5, w=W):
        return max(15, text_lines(t, w * 10.0 / size) * size * 1.42 + 5)

    def band(t):
        r = prow(p, G5, [(X1, X2, t, {"kind": "free", "size": 9.5, "align": "center", "fill": S["band"]})], h=17)
        hline(p, G5, r, X1, X2, S["med"], below=False)
        hline(p, G5, r, X1, X2, S["gry"])
        vline(p, G5, r, r, X1, S["gry"])
        vline(p, G5, r, r, X2, S["gry"])
        return r

    def lrow(lab, t):
        r = prow(p, G5, [(X1, XL, lab, LB), (XL, X2, t, TX)], h=hh(t))
        hline(p, G5, r, X1, X2, S["lgt"])
        vline(p, G5, r, r, XL, S["lgt"])
        return r

    prow(p, G5, [(X1, 629, "■ 건축법 시행규칙 [별지 제1호의4서식]", {"kind": "free", "size": 7.5}),
                 (629, X2, "(6쪽 중 제5쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    band("첨부서류 및 허가권자 확인사항")
    lrow("1. 신축, 증축,\n개축, 재축,\n이전, 대수선\n및 가설건축\n물의 건축", T1)
    lrow("2. 허가사항 변경", "변경하려는 부분에 대한 변경 전ㆍ후의 설계도서")
    lrow("3. 용도변경", T3)
    r = lrow("4. 허가권자\n확인사항", T4)
    hline(p, G5, r, X1, X2, S["med"])
    p.gap(5)
    band("허가안내")
    a = prow(p, G5, [(X1, 208, "제출하는 곳", dict(LB, size=7.5)), (208, 560, "특별시ㆍ광역시ㆍ특별자치시ㆍ특별자치도ㆍ시ㆍ군ㆍ구", dict(SUBC, size=7.5, wrap=True)),
                     (560, 629, "처리부서", dict(LB, size=7.5)), (629, X2, "건축허가 부서", dict(SUBC, size=7.5))], h=24)
    b = prow(p, G5, [(X1, 208, "수수료", dict(LB, size=7.5)), (208, 560, "「건축법 시행규칙」 별표 4 참조", dict(SUBC, size=7.5)),
                     (560, 629, "처리기간", dict(LB, size=7.5)),
                     (629, X2, "특별시ㆍ광역시: 40일 ~ 50일\n특별자치시ㆍ특별자치도ㆍ시ㆍ군ㆍ구: 2일~15일(도지사 사전승인대상: 70일)", dict(TX, valign="center"))], h=36)
    hline(p, G5, a, X1, X2, S["lgt"])
    for x in (208, 560, 629):
        vline(p, G5, a, b, x, S["lgt"])
    hline(p, G5, b, X1, X2, S["med"])
    p.gap(5)
    band("「건축법」 근거규정")
    lrow("제11조제1항", TG1)
    lrow("제16조제1항", "허가받은 사항을 변경하려는 경우")
    lrow("제19조제2항", "용도변경(상위군으로의 용도변경을 말합니다)")
    r = lrow("제20조제1항", "도시ㆍ군계획시설 또는 도시ㆍ군계획시설예정지에 가설건축물을 건축하려는 경우")
    hline(p, G5, r, X1, X2, S["med"])
    p.gap(5)
    band("유의사항")
    r = lrow("「건축법」\n제11조,\n제19조,\n제80조,\n제108조 및\n제110조", TY)
    hline(p, G5, r, X1, X2, S["med"])
    p.end_print()
    p.after_note(["원문 글 그대로입니다(첨부서류 · 허가안내 · 근거규정 · 유의사항). 원문 쪽 표기는 «6쪽 중» 이나 법제처 서식 보기에 실린 다섯 쪽을 옮겼습니다."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    page1(bk, ex)
    page2(bk, ex)
    page3(bk, ex)
    page4(bk, ex)
    page5(bk, ex)


# ── 기대값(엑셀 식과 같은 셈) ───────────────────────────────────────────────
def _n(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else 0


YO = "일월화수목금토"


def _r2(x):
    """엑셀 ROUND(…,2) — 반올림(0.5 올림)"""
    import decimal
    return float(decimal.Decimal(repr(x)).quantize(decimal.Decimal("0.01"), rounding=decimal.ROUND_HALF_UP))


def _t2(x):
    return f"{_r2(x):,.2f}"


def _t0(x):
    import decimal
    return f"{int(decimal.Decimal(repr(x)).quantize(decimal.Decimal('1'), rounding=decimal.ROUND_HALF_UP)):,}"


def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def _ck_t(cond, text):
    return ("[√]" if cond else "[   ]") + " " + text


def expect(pages):
    sm, p1, p2, p3 = pages["셈"], pages["제1쪽"], pages["제2쪽"], pages["제3쪽"]
    a, b1, b2, b3, b4 = {}, {}, {}, {}, {}
    dj, gc, yn1, yn2 = _n(p1.get("대지면적")), _n(p1.get("건축면적")), _n(p1.get("연면적")), _n(p1.get("연면적용적"))
    a["건폐셈"] = "" if (dj == 0 or gc == 0) else f"{KS_A}{_t2(gc)}{KS_B}{_t2(dj)}{KS_C}{_r2(gc / dj * 100):.2f}{KS_D}"
    a["용적셈"] = "" if (dj == 0 or yn2 == 0) else f"{YJ_A}{_t2(yn2)}{YJ_B}{_t2(dj)}{KS_C}{_r2(yn2 / dj * 100):.2f}{KS_D}"
    sf = sum(_n(p3.get(f"신면적#{i}")) for i in range(1, NF + 1))
    if sf == 0:
        a["층별셈"] = ""
    else:
        a["층별셈"] = f"{CB_A}{_t2(sf)}{CB_B}{_t2(yn1)}" + (CB_SAME if _r2(sf) == _r2(yn1) else CB_DIFF)
    hd = sm.get("허가일")
    if not hd:
        a["착수기한"] = ""
    else:
        yrs = 3 if sm.get("공장") == "예" else 2
        due = 끝날(hd, 12 * yrs)
        a["착수기한"] = f"{CJ_A}{_ymdp(hd)}{CJ_B}{_ymdp(due)}({YO[(due.weekday() + 1) % 7]}{CJ_C}{yrs}{CJ_D}"
    hg = sm.get("허가권자")
    a["처리기간"] = "" if not hg else CG_A + (HG_T[0] if hg == HG[0] else HG_T[1] if hg == HG[1] else HG_T[2]) + CG_B
    if not p1.get("발주자") and not sm.get("건축구분"):
        a["빈칸"] = ""
    else:
        mc = {"건축구분": not sm.get("건축구분"), "건축주 성명": not p1.get("발주자"), "건축주 주소": not p1.get("건축주주소"),
              "설계자": not p1.get("설계자"), "대지위치": not p1.get("현장위치"), "지번": not p1.get("지번"), "대지면적": not dj,
              "건축면적": not gc, "연면적 합계": not yn1, "주용도": not p1.get("주용도"), "시공기간": not _n(p2.get("시공기간"))}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    for i, gname in enumerate(GUBUN):
        b1[f"구분{i + 1}"] = _ck_t(sm.get("건축구분") == gname, gname)
    b1["송달1"] = _ck_t(sm.get("송달") == SONG[0], SONG[0])
    b1["송달2"] = _ck_t(sm.get("송달") == SONG[1], SONG[1])
    b1["건축주서명"] = p1.get("발주자") or ""
    b1["건폐율"] = "" if (dj == 0 or gc == 0) else _r2(gc / dj * 100)
    b1["용적률"] = "" if (dj == 0 or yn2 == 0) else _r2(yn2 / dj * 100)
    for i in range(1, 5):
        b2[f"협정표시{i}"] = _ck_t(sm.get(f"협정#{i}") == "√", HYEOP[i - 1])
    for i in range(1, len(ILGWAL) + 1):
        b2[f"일괄표시{i}"] = _ck_t(sm.get(f"일괄#{i}") == "√", ILGWAL[i - 1])
    b2["건축주서명2"] = p1.get("발주자") or ""
    for side in ("기존", "신청"):
        b3[f"{side}주부속표시"] = "   ".join(_ck_t(sm.get(f"{side}주부속") == o, o) for o in JU)
        b3[f"{side}주구조표시"] = "   ".join(_ck_t(sm.get(f"{side}주구조") == o, o) for o in GUJO)
    b3["층별동"] = p3.get("신동명칭") or p3.get("구동명칭") or ""
    for i, (nm, unit) in enumerate(DAESU, 1):
        v = sm.get(f"대수선#{i}")
        chk = "[√]" if v else "[   ]"
        opt = "ㆍ".join(("◯" if v == w else "") + w for w in DAE_K)
        if unit is None:
            b4[f"대수선표시{i}"] = f"{chk} {nm} {opt}"
        else:
            b4[f"대수선표시{i}"] = f"{chk} {nm}"
            b4[f"대수선고름{i}"] = opt
            if unit:
                q = _n(sm.get(f"대수량#{i}"))
                qs = "            " if q == 0 else (_t0(q) if unit == "개" else _t2(q))
                b4[f"대수선양{i}"] = f"[ {qs} {unit}]"
    return {"셈": a, "제1쪽": b1, "제2쪽": b2, "제3쪽": b3, "제4쪽": b4}


for _t in (KS_A, KS_B, KS_C, KS_D, YJ_A, YJ_B, CB_A, CB_B, CB_SAME, CB_DIFF, CJ_A, CJ_B, CJ_C, CJ_D, CG_A, CG_B, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
