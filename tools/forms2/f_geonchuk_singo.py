# -*- coding: utf-8 -*-
"""건축ㆍ대수선ㆍ용도변경 (변경)신고서 — 새로 만든 서식 (2026-11-17 G751 · 소장님 「그럼 이제 서식 10개만 만들자. 못 만든 서식...」 — 건축법 여섯째)
   → ① 건축구분 · 송달 동의 · 일괄처리 √ · 동별 주구조 · 대수선 내용 고르기 · 건폐율 · 용적률(저절로) · 층별 면적 합계 대조 ·
     처리 기한(신고수리 여부 통지 — 5일은 받은 때부터 근무시간 · 협의 등이 필요하면 20일 근무일) · 착수 기한(신고일부터 1년) · 아직 안 적은 칸
   · 신고서 일곱 쪽(건축법 시행규칙 [별지 제6호서식] <개정 2025. 7. 31.> 칸 차례 그대로 — 법제처 서식 보기 일곱 쪽 모두):
     제1쪽 건축주 · 설계자 · 대지조건 · 전체 개요 / 제2쪽 하수 · 급수 · 주차장 · 협정 · 특례 · 일괄처리사항 · 서명 / 제3쪽 동별 개요 · 층별 개요 /
     제4쪽 대수선 개요 · 준주택 · 다가구 · 임대형기숙사 / 제5쪽 도면개요 · 작성방법 / 제6쪽 첨부서류 · 신고안내 · 근거규정 · 유의사항 /
     제7쪽 작성방법 · 특수구조 유형 · 작성례 · 처리절차.
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그대로 열 경계로 — 11-17 15:2x 그림을 다시 재서(notes/G743/띠/p1 ~ p7 · 글자 자리 t1 ~ t7)
   쪽마다 고르지 않은 열. 허가 신청서(f_geonchuk_heoga_sincheong)와 칸 꼴은 비슷하나 선 자리가 달라 쪽마다 새로 그음.

근거(국가법령정보센터 · 세 번 — notes/G743/근거.md):
  · 건축법 [시행 2026. 11. 12.] 제14조(건축신고) ③ 신고를 받은 날부터 5일 이내 신고수리 여부(또는 처리기간 연장 여부) 통지 —
    심의 · 동의 · 협의 · 확인 등이 필요하면 20일 이내 ⑤ 신고일부터 1년 이내 공사에 착수하지 않으면 신고의 효력이 없어짐(건축주 요청 ·
    정당한 사유면 1년 범위에서 연장) · 제16조(허가와 신고사항의 변경) · 제19조(용도변경) · 제55조(건폐율) · 제56조(용적률)
  · 건축법 시행규칙 [시행 2026. 2. 27.] 제12조(건축신고) · 제12조의2(용도변경) — 별지 제6호서식
  · 민원 처리에 관한 법률 제19조 ① 5일 이하 «시간» 단위(1일 = 8시간 · 토 · 공휴일 빼고) ② 6일 이상 «일» 단위 첫날 산입 — 민원기한.py
■ 원문 그대로: «철근콘트리트조»(원문 표기) · 「」 · ㆍ · ㎡ · ㎥ · √ · 제3쪽 ⑯ ⑰ ⑱ · 제4쪽 ⑲ ~ ㉖ · 제7쪽 ⑳ ㉓ ⑲ ㉒ ㉑ ㉔ ㉕ ㉖ ㉗ ㉘
  (글층은 글꼴 글자 U+F000 — 그림을 크게 보고 옮김) · 제2쪽 «비관리청 도로공사시행 허가»(붙여 씀) · 제3쪽 동별 개요 머리 «층별 개요»(원문 표기) ·
  제5쪽 «V. 도면개요»(로마 숫자 아닌 V).
■ 짐작 안 함: 건폐율 · 용적률은 적은 면적으로만 셈(최대한도는 용도지역 · 조례 — 허가권자 확인) · 신고 대상인지(법 제14조제1항)는 가리지 않음 ·
  처리 기한은 신고일(받은 날)로 셈 · 협의 등이 필요한지는 신고인이 고름 · 착수 기한은 신고일이 있을 때만 · 끝날이 토 · 공휴일이어도 미루지 않음(기간셈.py)."""
import datetime

import sgw as g
from fb import F, I, text_lines
from sgw import L
from 기간셈 import 끝날, 끝날식
import 민원기한 as MW
from f_geonchuk_heoga_sincheong import (Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd, _yo, _ck, _dae_opt,
                                        SONG, JU, GUJO, DAE_K, DAESU, HYEOP, KS_A, KS_B, KS_C, KS_D, YJ_A, YJ_B, CB_A, CB_B, CB_SAME,
                                        CB_DIFF, BIN_A, _n, _r2, _t2, _t0, _ymdp, _ck_t, YO)

SLUG = "geonchuk-singo"
TITLE = "건축ㆍ대수선ㆍ용도변경 (변경)신고서"
WHERE = "forms"
XLSX = False
PREV = [(2, "건축ㆍ대수선ㆍ용도변경 (변경)신고서(건축법 시행규칙 별지 제6호서식) 제1쪽 — 빈 서식 (원문 칸 차례 그대로)"),
        (10, "건축신고서 제1쪽 — 작성 예시 (건폐율 · 용적률이 저절로)"),
        (9, "① 건축구분 · 일괄처리 √ · 건폐율 · 용적률 · 처리 기한 · 착수 기한 — 작성 예시")]
MULTI = True
SHORT = ("건축ㆍ대수선ㆍ용도변경 (변경)신고서(건축법 시행규칙 별지 제6호서식) — 대지면적 · 건축면적 · 연면적을 적으면 건폐율 · 용적률이, "
         "신고일을 적으면 처리 기한(5일 · 협의 등이 필요하면 20일)과 착수 기한(1년)이 저절로 나옵니다. 건축구분 · 일괄처리사항 · 주구조는 ① 장에서 고르면 √.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
AREA = '#,##0.00;;""'
NUM = '#,##0;;""'

GUBUN = ["신축", "증축", "개축", "재축", "이전", "대수선", "신고사항 변경", "용도변경"]
YN = ["예", "아니오"]
ILGWAL = ["공사용 가설건축물 축조신고", "공작물 축조신고", "개발행위허가", "도시ㆍ군계획시설사업 시행자의 지정 및 실시계획인가",
          "산지전용허가ㆍ신고, 산지일시사용 허가신고", "농지전용허가ㆍ신고 및 협의", "사도개설허가", "도로점용허가",
          "비관리청 도로공사시행 허가 및 도로의 연결허가", "하천점용허가", "개인하수처리시설 설치신고", "배수설비 설치신고", "상수도 공급신청",
          "자가용전기설비 공사계획 인가ㆍ신고", "수질오염물질 배출시설 설치 허가ㆍ신고", "대기오염물질 배출시설 설치 허가ㆍ신고",
          "소음ㆍ진동 배출시설 설치 허가ㆍ신고", "가축분뇨 배출시설 설치 허가ㆍ신고", "공원구역 행위허가", "도시공원 점용허가",
          "특정토양오염관리대상시설 신고", "수산자원보호구역 행위허가", "초지전용 허가ㆍ신고"]

SJ_A = "신고일 "
SJ_B = " → 착수 기한 "
SJ_C = ")까지 공사 착수(건축법 제14조제5항 — 1년 · 넘기면 신고의 효력이 없어짐 · 건축주가 요청하고 정당한 사유가 있으면 1년 범위에서 연장 가능)"
CH6 = "까지 — 신고서를 받은 날을 1일로 토 · 일 · 공휴일 빼고 셈(협의 등이 필요한 신고 20일 · 민원처리법 제19조②)"
CH5 = " 받은 시각까지 — 5일은 받은 때부터 근무시간으로 셈(1일 = 8시간 · 토 · 일 · 공휴일 빼고 · 민원처리법 제19조①)"
CH5_OFF = " 근무시간 끝까지 — 쉬는 날 받으면 다음 근무일부터 근무시간으로 셈(1일 = 8시간 · 민원처리법 제19조①)"
BIN_OK = "✓ 신고서 주요 칸을 다 적었습니다"
NEXT = ("신고수리 여부(협의 등이 필요하면 그 내용)를 알려 옵니다(건축법 제14조제3항 · 제4항). 수리되면 신고필증(별지 제7호서식)을 받고, "
        "신고일부터 1년 안에 공사에 착수합니다.")

EX = {"건축구분": GUBUN[0], "송달": SONG[0], "기존주부속": None, "신고주부속": JU[0], "기존주구조": None, "신고주구조": GUJO[0],
      "신고일": D(2027, 3, 2), "협의": YN[1]}
for _i in range(1, len(ILGWAL) + 1):
    EX[f"일괄#{_i}"] = "√" if _i == 11 else None
for _i in range(1, 5):
    EX[f"협정#{_i}"] = None
for _i in range(1, len(DAESU) + 1):
    EX[f"대수선#{_i}"] = None
    EX[f"대수량#{_i}"] = None

EX_S = {"발주자": "박가나", "생년월일": "1980. 1. 1.", "건축주주소": "가나시 다라구 마바로 12", "건축주전화": "000-0000-0000",
        "메일앞": "gana", "메일뒤": "example.com", "설계자": "박다라", "자격번호": "제00000호", "회원번호": "0000", "사무소명": "다라건축사사무소",
        "신고번호": "가나-0000", "사무소주소": "가나시 사아로 34", "사무소전화": "000-000-0000",
        "현장위치": "가나군 다라면 마바리", "지번": "123-4", "관련지번": None, "지목": "대", "용도지역1": "계획관리지역", "용도지역2": None,
        "용도지구1": "-", "용도지구2": "-", "용도구역1": "-", "용도구역2": "-",
        "대지면적": 660.0, "건축면적": 95.0, "연면적": 180.0, "연면적용적": 180.0,
        "건축물명칭": None, "주동수": 1, "부속동수": None, "부속면적": None, "주용도": "단독주택",
        "세대수": None, "호수": None, "가구수": 1, "주차대수": 2, "평균전용": None,
        # 제2쪽
        "하수형식": "오수처리시설(접촉산화방식)", "하수용량": 5, "급수지상수": None, "급수지상량": None, "급수지하수": None, "급수지하량": None,
        "공개공지": None, "조경면적": None, "후퇴면적": None, "후퇴거리": None,
        "고시명": None, "고시번호": None, "고시일자": None, "공고명": None, "공고번호": None, "공고일자": None, "특례73": None, "특례77": None,
        # 제3쪽 — 동별(신고 쪽만)
        "신동명칭": "주택", "신주용도": "단독주택", "신호수": None, "신가구": 1, "신세대": None, "신세부구조": "철근콘크리트 라멘조",
        "신지붕": "경사지붕", "신지붕마감": "금속판", "신건축면적": 95.0, "신연면적": 180.0, "신용적연면적": 180.0,
        "신지하": None, "신지상": 2, "신높이": 8.5, "신승용": None, "신비상": None, "신보차": None, "신기둥": None, "신내력": None, "신특수유형": None,
        # 제5쪽 — 도면종류 · 축척(그림은 따로 붙임 — 예시는 비움)
        "도면1": None, "축척1앞": None, "축척1뒤": None, "도면2": None, "축척2앞": None, "축척2뒤": None}
for _p in ("옥내", "옥외", "인근"):
    for _k in ("자주", "기계", "전기"):
        EX_S[f"{_p}{_k}대"] = None
        EX_S[f"{_p}{_k}면"] = None
EX_S["옥외자주대"], EX_S["옥외자주면"], EX_S["면제대"] = 2, 25.0, None
for _k in ("동명칭", "주용도", "호수", "가구", "세대", "세부구조", "지붕", "지붕마감", "건축면적", "연면적", "용적연면적", "지하", "지상", "높이",
           "승용", "비상", "보차", "기둥", "내력", "특수유형"):
    EX_S["구" + _k] = None
_FL = [("1층", "신축", "철근콘크리트조", "단독주택", 90.0), ("2층", "신축", "철근콘크리트조", "단독주택", 90.0)]
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

HEAD0 = "■ 건축법 시행규칙 [별지 제6호서식] <개정 2025. 7. 31.>"
HEAD = "■ 건축법 시행규칙 [별지 제6호서식]"
SEUM = "세움터(www.eais.go.kr)에서도 신청할 수 있습니다."
PAGE = "(7쪽 중 제{}쪽)"
FREE = {"kind": "free", "size": 7.5}
FREE_R = {"kind": "free", "size": 7.5, "align": "right"}
H11 = {"kind": "free", "size": 11, "bold": True, "align": "left"}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def _inp(ex, size=9, align="left"):
    def inp(k, **kw):
        kw.setdefault("size", size)
        kw.setdefault("align", align)
        return I(k, ex=_e(ex, k), **kw)
    return inp


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  건축신고 — 고르기 · 건폐율 · 용적률 · 처리 기한 · 착수 기한 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 신고서의 [ ] 칸은 여기서 고르면 √ 가 됩니다. 면적은 제1쪽 · 제3쪽에 적으면 건폐율 · 용적률 · 층별 합계가 저절로 나옵니다.")
    s7 = {"kind": "text", "size": 7}
    g.sec(p, "㉮  건축구분 · 전자우편 송달 동의 (제1쪽 √)", need=24 * 2 + 10)
    p.row([(3, "건축구분", L), (4, I("건축구분", ex=_ex(ex, "건축구분"), dv=",".join(GUBUN), align="left", size=9)),
           (5, "신축 · 증축 · 개축 · 재축 · 이전 · 대수선 · 신고사항 변경 · 용도변경 가운데 하나", s7)], h=24)
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
    g.sec(p, "㉰  일괄처리사항 √ (제2쪽 — 다른 법률의 허가 · 신고를 받은 것으로 보는 사항)", need=22 * 12 + 10)
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
    p.row([(4, "", L), (4, "기존 건축물", L), (4, "신고 건축물", L)], h=20)
    p.row([(4, "주/부속구분", L), (4, I("기존주부속", ex=_ex(ex, "기존주부속"), dv=",".join(JU), size=9)),
           (4, I("신고주부속", ex=_ex(ex, "신고주부속"), dv=",".join(JU), size=9))], h=24)
    p.row([(4, "주구조", L), (4, I("기존주구조", ex=_ex(ex, "기존주구조"), dv=",".join(GUJO), size=9)),
           (4, I("신고주구조", ex=_ex(ex, "신고주구조"), dv=",".join(GUJO), size=9))], h=24)
    g.sec(p, "㉲  대수선 내용 (제4쪽 √ — 증설 · 해체 · 수선 · 변경 가운데 하나 · 수량)", need=22 * 13 + 10)
    p.row([(4, "항목", L), (4, "증설 · 해체 · 수선 · 변경", L), (4, "수량(㎡ · 개)", L)], h=20)
    for i, (nm, unit) in enumerate(DAESU, 1):
        q = (I(f"대수량#{i}", ex=_ex(ex, f"대수량#{i}"), fmt=NUM if unit == "개" else AREA, align="right", size=9) if unit else
             ("— (원문에 수량 칸 없음)", {"kind": "text", "size": 7}))
        row = [(4, nm.replace("의", "") if unit is None else nm, {"kind": "text", "size": 8}),
               (4, I(f"대수선#{i}", ex=_ex(ex, f"대수선#{i}"), dv=",".join(DAE_K), align="center", size=9))]
        row.append((4,) + (q if isinstance(q, tuple) else (q,)))
        p.row(row, h=22)
    g.sec(p, "㉳  신고일 · 처리 기한(신고수리 여부 통지) · 착수 기한", need=24 * 3 + 36 + 46 + 10)
    p.row([(3, "신고일", L), (3, I("신고일", ex=_ex(ex, "신고일"), fmt=DT, align="center", size=9)),
           (6, "신고서를 내는 날(받은 날) — 신고서 제2쪽 끝 날짜로 들어갑니다", s7)], h=24)
    p.row([(3, "협의 등이 필요한 신고", dict(L, size=7.5)), (3, I("협의", ex=_ex(ex, "협의"), dv=",".join(YN), align="center", size=9)),
           (6, "이 법 또는 다른 법령에 따른 심의 · 동의 · 협의 · 확인 등이 필요하면 «예» — 처리기간 20일(건축법 제14조제3항 단서 · 제6쪽 신고안내)", s7)], h=24)
    p.row([(3, "처리기간", L), (3, F("처일수", '=IF(AND(N({신고일})=0,{협의}=""),"",IF({협의}="예",20,5))', fmt='0"일";;""', align="center", size=9.5, bold=True)),
           (3, "셈 시작일", L),
           (3, F("처시작", '=IF(N({신고일})=0,"",IF(AND({처일수}<=5,WEEKDAY({신고일},2)<=5,'
                 'COUNTIFS({처휴[]},">="&{신고일},{처휴[]},"<="&{신고일})=0),{신고일}+1,{신고일}))', fmt=DT, align="center", size=8.5))], h=24)
    쉼 = 'OR(WEEKDAY({신고일},2)>5,COUNTIFS({처휴[]},">="&{신고일},{처휴[]},"<="&{신고일})>0)'
    p.row([(3, "처리 기한\n(신고수리 여부 통지)", dict(L, size=8)),
           (9, F("처리", '=IF(N({신고일})=0,"",' + _ymd("{처끝}") + '&"("&' + _yo("{처끝}") + '&")"&IF({처일수}>=6,"' + CH6 + '",IF('
                 + 쉼 + ',"' + CH5_OFF + '","' + CH5 + '"))&IF(' + MW.덮음식("{신고일}", "{처끝}") + ',"' + MW.밖글 + '",""))', align="left", size=8.5))], h=36)
    SD = "{신고일}"
    DUE = "(" + 끝날식(SD, "12") + ")"
    f = f'=IF(N({SD})=0,"","{SJ_A}"&{_ymd(SD)}&"{SJ_B}"&{_ymd(DUE)}&"("&{_yo(DUE)}&"{SJ_C}")'
    p.row([(3, "착수 기한", L), (9, F("착수기한", f, align="left", size=8.5))], h=46)
    g.sec(p, "㉴  아직 안 적은 칸 · 다음 할 일", need=46 + 40 + 10)
    cnt = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {nm}","")' for nm, c in BIN)
    p.row([(2, "아직 안 적은 칸", dict(L, size=8.5)),
           (10, F("빈칸", '=IF(AND({제1쪽!발주자}="",{건축구분}=""),"",IF(' + cnt + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst
                  + ',4,300)))', align="left", size=8.5))], h=46)
    p.row([(2, "다음 할 일", dict(L, size=8.5)), (10, F("다음", '=IF(AND({제1쪽!발주자}="",{건축구분}=""),"","' + NEXT + '")', align="left", size=8))], h=40)
    MW.넣기(p, "{처시작}", "{처일수}", "처")
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 신고서의 [ ] 칸은 여기서 고르면 √ 가 됩니다. 면적 · 이름은 신고서 쪽에 바로 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축주 · 설계자 · 대지 · 면적)."])
    return p


BIN = [("건축구분", '{건축구분}=""'), ("건축주 성명", '{제1쪽!발주자}=""'), ("건축주 주소", '{제1쪽!건축주주소}=""'),
       ("대지위치", '{제1쪽!현장위치}=""'), ("지번", '{제1쪽!지번}=""'), ("대지면적", 'N({제1쪽!대지면적})=0'),
       ("건축면적", 'N({제1쪽!건축면적})=0'), ("연면적 합계", 'N({제1쪽!연면적})=0'), ("주용도", '{제1쪽!주용도}=""'), ("신고일", 'N({신고일})=0')]


# ── 제1쪽 ────────────────────────────────────────────────────────────────
P1X = [123, 252, 262, 389, 393, 455, 510, 530, 546, 585, 617, 625, 636, 640, 682, 688, 740, 752, 785, 787, 812, 830, 840, 850, 860, 873, 940,
       945, 958, 960, 985, 995, 1080, 1100, 1114]
G1 = Grid(P1X)


def page1(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제1쪽", fit=1, widths=G1.w)
    X1, XL, X2 = 123, 252, 1114
    inp = _inp(ex)
    U = dict(FRR, size=7.5)
    prow(p, G1, [(X1, 740, HEAD0, FREE), (740, X2, SEUM, FREE_R)], h=13)
    prow(p, G1, [(X1, X2, TITLE, {"kind": "free", "size": 16, "bold": True, "align": "center"})], h=30)
    prow(p, G1, [(X1, 958, "• 어두운 난(      )은 신고인이 작성하지 않으며, [ ]에는 해당하는 곳에 √ 표시를 합니다.", FREE),
                 (958, X2, PAGE.format(1), FREE_R)], h=12)
    band = dict(SUB, fill=S["gray"], size=7.5)
    rb = prow(p, G1, [(X1, 625, "신고번호(연도-기관코드-업무구분-신고일련번호)", band), (625, 873, "접수일자", band), (873, X2, "처리일자", band)], h=24)
    hline(p, G1, rb, X1, X2, S["med"], below=False)
    hline(p, G1, rb, X1, X2, S["med"])
    vline(p, G1, rb, rb, 625, S["gry"])
    vline(p, G1, rb, rb, 873, S["gry"])
    p.gap(6)

    # 건축구분 — 원문 두 줄(신축 · 증축 · 개축 · 재축 · 이전 · 대수선 / 신고사항 변경 · 용도변경) · 줄 사이 선 없음
    def ck(i, x1, x2):
        return (x1, x2, F(f"구분{i + 1}", "=" + _ck(f'{{셈!건축구분}}="{GUBUN[i]}"', GUBUN[i]), align="left", size=9), NB)
    r1 = prow(p, G1, [(X1, XL, "건축구분", dict(SUBC, size=9.5, rs=2)), (XL, 262, "", NB), ck(0, 262, 393), ck(1, 393, 546), ck(2, 546, 688),
                      ck(3, 688, 830), ck(4, 830, 958), ck(5, 958, X2)], h=23)
    r2 = prow(p, G1, [(XL, 262, "", NB), ck(6, 262, 546), ck(7, 546, X2)], h=23)
    hline(p, G1, r1, X1, X2, S["med"], below=False)
    hline(p, G1, r2, X1, X2, S["med"])
    vline(p, G1, r1, r2, XL, S["gry"])
    p.gap(6)
    # ① 건축주
    a = prow(p, G1, [(X1, XL, "① 건축주", dict(SUBC, size=9.5, rs=8)), (XL, 682, "성명(법인명)", SUB), (682, X2, "생년월일(사업자 또는 법인등록번호)", SUB)], h=11)
    b = prow(p, G1, [(XL, 682, inp("발주자"), NB), (682, X2, inp("생년월일"), NB)], h=13)
    hline(p, G1, b, XL, X2, S["lgt"])
    vline(p, G1, a, b, 682, S["lgt"])
    prow(p, G1, [(XL, X2, "주소", SUB)], h=11)
    c = prow(p, G1, [(XL, 860, inp("건축주주소"), NB), (860, 960, "(전화번호:", dict(FR, size=8)), (960, 1100, inp("건축주전화", size=8.5), NB),
                     (1100, X2, ")", FR)], h=14)
    hline(p, G1, c, XL, X2, S["gry"])
    gray = dict(FR, size=8, fill=S["gray"], wrap=True)
    d1 = prow(p, G1, [(XL, 389, "전자우편\n송달동의", dict(SUBC, size=8.5, rs=4)),
                      (389, X2, "「행정절차법」 제14조에 따라 정보통신망을 이용한 각종 부담금 부과 사전통지 등의 문서송달에 동의합니다.", gray)], h=25)
    prow(p, G1, [(389, 752, F("송달1", "=" + _ck(f'{{셈!송달}}="{SONG[0]}"', SONG[0]), align="center", size=9), NB),
                 (752, X2, F("송달2", "=" + _ck(f'{{셈!송달}}="{SONG[1]}"', SONG[1]), align="center", size=9), NB)], h=24)
    prow(p, G1, [(389, 785, "건축주", dict(FRR, size=9)), (785, 995, F("건축주서명", '=IF({발주자}="","",{발주자})', align="center", size=9), NB),
                 (995, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=24)
    d4 = prow(p, G1, [(389, 530, "전자우편 주소", dict(FR, size=8.5)), (530, 812, inp("메일앞", align="right"), NB), (812, 840, "@", FRC),
                      (840, X2, inp("메일뒤"), NB)], h=24)
    hline(p, G1, d1, 389, X2, S["gry"])
    hline(p, G1, d1 + 1, 389, X2, S["lgt"])
    hline(p, G1, d1 + 2, 389, X2, S["lgt"])
    vline(p, G1, d1, d4, 389, S["gry"])
    vline(p, G1, a, d4, XL, S["gry"])
    hline(p, G1, a, X1, X2, S["med"], below=False)
    hline(p, G1, d4, X1, X2, S["med"])
    p.gap(6)
    # ② 설계자
    a = prow(p, G1, [(X1, XL, "② 설계자", dict(SUBC, size=9.5, rs=6)), (XL, 636, "성명(법인명)", SUB), (636, 850, "자격번호", SUB),
                     (850, X2, "협회 회원번호", SUB)], h=11)
    b = prow(p, G1, [(XL, 510, inp("설계자"), NB), (510, 636, "(서명 또는 인)", dict(FRR, size=7)), (636, 850, inp("자격번호"), NB),
                     (850, X2, inp("회원번호"), NB)], h=13)
    hline(p, G1, b, XL, X2, S["lgt"])
    vline(p, G1, a, b, 636, S["lgt"])
    vline(p, G1, a, b, 850, S["lgt"])
    c = prow(p, G1, [(XL, 636, "사무소 명", SUB), (636, X2, "신고번호", SUB)], h=11)
    d = prow(p, G1, [(XL, 636, inp("사무소명"), NB), (636, X2, inp("신고번호"), NB)], h=13)
    hline(p, G1, d, XL, X2, S["lgt"])
    vline(p, G1, c, d, 636, S["lgt"])
    prow(p, G1, [(XL, X2, "사무소 주소", SUB)], h=11)
    e = prow(p, G1, [(XL, 850, inp("사무소주소"), NB), (850, 945, "(전화번호:", dict(FR, size=8)), (945, 1100, inp("사무소전화", size=8.5), NB),
                     (1100, X2, ")", FR)], h=14)
    vline(p, G1, a, e, XL, S["gry"])
    hline(p, G1, a, X1, X2, S["med"], below=False)
    hline(p, G1, e, X1, X2, S["med"])
    p.gap(6)
    # ③ 대지조건 — 신고서는 용도지역도 «/» 두 칸(허가 신청서와 다름)
    a = prow(p, G1, [(X1, XL, "③ 대지조건", dict(SUBC, size=9.5, rs=8)), (XL, X2, "대지위치", SUB)], h=11)
    b = prow(p, G1, [(XL, X2, inp("현장위치"), NB)], h=13)
    hline(p, G1, b, XL, X2, S["lgt"])
    c = prow(p, G1, [(XL, 682, "지번", SUB), (682, X2, "관련지번", SUB)], h=11)
    d = prow(p, G1, [(XL, 682, inp("지번"), NB), (682, X2, inp("관련지번"), NB)], h=13)
    hline(p, G1, d, XL, X2, S["lgt"])
    vline(p, G1, c, d, 682, S["lgt"])
    c = prow(p, G1, [(XL, 682, "지목", SUB), (682, X2, "용도지역", SUB)], h=11)
    d = prow(p, G1, [(XL, 682, inp("지목"), NB), (682, 940, inp("용도지역1", align="center"), NB), (940, 960, "/", FRC),
                     (960, X2, inp("용도지역2", align="center"), NB)], h=13)
    hline(p, G1, d, XL, X2, S["lgt"])
    vline(p, G1, c, d, 682, S["lgt"])
    c = prow(p, G1, [(XL, 682, "용도지구", SUB), (682, X2, "용도구역", SUB)], h=11)
    d = prow(p, G1, [(XL, 510, inp("용도지구1", align="center"), NB), (510, 530, "/", FRC), (530, 682, inp("용도지구2", align="center"), NB),
                     (682, 940, inp("용도구역1", align="center"), NB), (940, 960, "/", FRC), (960, X2, inp("용도구역2", align="center"), NB)], h=13)
    vline(p, G1, c, d, 682, S["lgt"])
    vline(p, G1, a, d, XL, S["gry"])
    hline(p, G1, a, X1, X2, S["med"], below=False)
    hline(p, G1, d, X1, X2, S["med"])
    p.gap(6)
    nt = ("• 대수선의 경우에는 대수선 개요(IV)만 적되, 대수선으로 인하여 층별 개요와 동별 개요의 (주)구조가 변경되는 경우에는 변경되는 (주)구조를 "
          "동별 개요와 층별 개요에 적습니다.\n• 건축구분에 관계없이 전체 건축물에 대한 개요를 적습니다.")
    rn = prow(p, G1, [(X1, X2, nt, dict(FR, size=8, fill=S["gray"], wrap=True, valign="top"))], h=42)
    hline(p, G1, rn, X1, X2, S["lgt"], below=False)
    hline(p, G1, rn, X1, X2, S["lgt"])
    p.gap(5)
    rh = prow(p, G1, [(X1, X2, "Ⅰ. 전체 개요", dict(H11, size=11.5))], h=26)
    hline(p, G1, rh, X1, X2, S["med"], below=False)
    hline(p, G1, rh, X1, X2, S["med"])
    # 전체 개요 — 넓이 셋 줄
    DJ, GC = "{대지면적}", "{건축면적}"
    pairs = [("대지면적", inp("대지면적", fmt=AREA, align="right"), "㎡", "건축면적", inp("건축면적", fmt=AREA, align="right"), "㎡"),
             ("건폐율", F("건폐율", f'=IF(OR(N({DJ})=0,N({GC})=0),"",ROUND({GC}/{DJ}*100,2))', fmt='0.00;;""', align="right", size=9), "%",
              "연면적 합계", inp("연면적", fmt=AREA, align="right"), "㎡"),
             ("연면적 합계(용적률 산정용)", inp("연면적용적", fmt=AREA, align="right"), "㎡",
              "용적률", F("용적률", '=IF(OR(N({대지면적})=0,N({연면적용적})=0),"",ROUND({연면적용적}/{대지면적}*100,2))', fmt='0.00;;""',
                       align="right", size=9), "%")]
    for l1, v1, u1, l2, v2, u2 in pairs:
        c = prow(p, G1, [(X1, 617, l1, SUB), (617, X2, l2, SUB)], h=11)
        d = prow(p, G1, [(X1, 585, v1, NB), (585, 617, u1, U), (617, 1080, v2, NB), (1080, X2, u2, U)], h=13)
        hline(p, G1, d, X1, X2, S["gry"])
        vline(p, G1, c, d, 617, S["gry"])
    # ④ ⑤
    c = prow(p, G1, [(X1, 455, "④ 건축물명", dict(SUB, size=9)), (455, 787, "주 건축물 수", SUB), (787, X2, "부속 건축물", SUB)], h=12)
    d = prow(p, G1, [(X1, 455, inp("건축물명칭", size=9), NB), (455, 740, inp("주동수", fmt=NUM, align="right"), NB), (740, 787, "동", dict(FRR, size=8)),
                     (787, 945, inp("부속동수", fmt=NUM, align="right"), NB), (945, 985, "동", dict(FRR, size=8)),
                     (985, 1080, inp("부속면적", fmt=AREA, align="right"), NB), (1080, X2, "㎡", U)], h=13)
    hline(p, G1, d, X1, X2, S["gry"])
    vline(p, G1, c, d, 455, S["gry"])
    vline(p, G1, c, d, 787, S["gry"])
    c = prow(p, G1, [(X1, 455, "⑤ 주용도", dict(SUB, size=9)), (455, 640, "세대/호/가구수", SUB), (640, 740, inp("세대수", fmt=NUM, align="right", size=8), NB),
                     (740, 787, "세대", U), (787, X2, "총 주차대수", SUB)], h=11)
    prow(p, G1, [(X1, 455, inp("주용도", size=9), NB), (455, 640, "", NB), (640, 740, inp("호수", fmt=NUM, align="right", size=8), NB),
                 (740, 787, "호", U), (787, X2, "", NB)], h=11)
    d = prow(p, G1, [(X1, 455, "", NB), (455, 640, "", NB), (640, 740, inp("가구수", fmt=NUM, align="right", size=8), NB), (740, 787, "가구", U),
                     (787, 1080, inp("주차대수", fmt=NUM, align="right"), NB), (1080, X2, "대", U)], h=12)
    hline(p, G1, d, X1, X2, S["gry"])
    vline(p, G1, c, d, 455, S["gry"])
    vline(p, G1, c, d, 787, S["gry"])
    prow(p, G1, [(X1, X2, "주택을 포함하는 경우 세대/가구/호별 평균 전용면적", SUB)], h=11)
    d = prow(p, G1, [(X1, 1080, inp("평균전용", fmt=AREA, align="right"), NB), (1080, X2, "㎡", U)], h=16)
    hline(p, G1, d, X1, X2, S["med"])
    p.end_print()
    p.after_note(["건폐율 · 용적률은 대지면적 · 건축면적 · 연면적 합계(용적률 산정용)를 적으면 저절로 나옵니다. [ ] 칸은 ① 장에서 고릅니다. "
                  "건축주 성명 · 대지위치는 공통 정보(발주자 · 현장 위치)가 있으면 먼저 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축주 · 설계자 · 대지 · 면적)."])
    return p


# ── 제2쪽 ────────────────────────────────────────────────────────────────
P2X = [123, 160, 253, 290, 323, 345, 370, 380, 398, 422, 458, 500, 523, 600, 627, 686, 698, 700, 723, 745, 780, 790, 792, 798, 822,
       824, 842, 850, 874, 898, 922, 958, 1010, 1080, 1095, 1100, 1128]
G2 = Grid(P2X)
# 일괄처리 줄 — (x 자리, 번호) : 원문 그림 차례 그대로(«[» 자리 263 · 611 · 852 · 708)
IL_ROWS = [[(253, 600, 1), (600, 842, 2), (842, 1128, 3)], [(253, 842, 4), (842, 1128, 5)], [(253, 600, 6), (600, 842, 7), (842, 1128, 8)],
           [(253, 842, 9), (842, 1128, 10)], [(253, 600, 11), (600, 842, 12), (842, 1128, 13)], [(253, 698, 14), (698, 1128, 15)],
           [(253, 698, 16), (698, 1128, 17)], [(253, 698, 18), (698, 1128, 19)], [(253, 698, 20), (698, 1128, 21)], [(253, 698, 22), (698, 1128, 23)]]


def page2(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제2쪽", fit=1, widths=G2.w)
    X1, XL, X2 = 123, 253, 1128
    inp = _inp(ex)

    def num(k, fmt=NUM, **kw):
        return inp(k, fmt=fmt, align="right", **kw)

    U = dict(FRR, size=7.5)
    prow(p, G2, [(X1, 958, HEAD, FREE), (958, X2, PAGE.format(2), FREE_R)], h=13)
    r0 = prow(p, G2, [(X1, 323, "⑥ 하수처리시설", dict(SUBC, size=9)), (323, 380, "형식", SUB), (380, 686, inp("하수형식"), NB),
                      (686, 745, "용량", SUB), (745, 1080, num("하수용량"), NB), (1080, X2, "인용", U)], h=18)
    vline(p, G2, r0, r0, 323, S["gry"])
    vline(p, G2, r0, r0, 686, S["lgt"])
    hline(p, G2, r0, X1, X2, S["med"], below=False)
    hline(p, G2, r0, X1, X2, S["gry"])
    a = prow(p, G2, [(X1, 323, "급수설비(저수조)", dict(SUBC, size=9, rs=3)), (323, 523, "구분", SUBC), (523, X2, "수량 및 총 용량", SUBC)], h=17)
    prow(p, G2, [(323, 523, "지상", SUBC), (523, 790, num("급수지상수"), NB), (790, 824, "개", U), (824, 1095, num("급수지상량", fmt=AREA), NB), (1095, X2, "㎥", U)], h=17)
    b = prow(p, G2, [(323, 523, "지하", SUBC), (523, 790, num("급수지하수"), NB), (790, 824, "개", U), (824, 1095, num("급수지하량", fmt=AREA), NB), (1095, X2, "㎥", U)], h=17)
    for r in (a, a + 1):
        hline(p, G2, r, 323, X2, S["gry"])
    vline(p, G2, a, b, 323, S["gry"])
    vline(p, G2, a, b, 523, S["gry"])
    vline(p, G2, a + 1, b, 824, S["lgt"])
    hline(p, G2, b, X1, X2, S["gry"])
    # 주차장
    a = prow(p, G2, [(X1, XL, "주차장", dict(SUBC, size=9, rs=4)), (XL, 323, "구분", SUBC), (323, 523, "옥내", SUBC), (523, 723, "옥외", SUBC),
                     (723, 922, "인근", SUBC), (922, X2, "면제", SUBC)], h=22)
    for j, (nm, kk) in enumerate([("자주식", "자주"), ("기계식", "기계"), ("전기차", "전기")]):
        it = [(XL, 323, nm, SUBC), (323, 398, num(f"옥내{kk}대"), NB), (398, 422, "대", U), (422, 500, num(f"옥내{kk}면", fmt=AREA, size=8), NB), (500, 523, "㎡", U),
              (523, 600, num(f"옥외{kk}대"), NB), (600, 627, "대", U), (627, 700, num(f"옥외{kk}면", fmt=AREA, size=8), NB), (700, 723, "㎡", U),
              (723, 798, num(f"인근{kk}대"), NB), (798, 822, "대", U), (822, 898, num(f"인근{kk}면", fmt=AREA, size=8), NB), (898, 922, "㎡", U)]
        if j == 0:
            it += [(922, 1100, num("면제대"), dict(NB, rs=3)), (1100, X2, "대", dict(U, rs=3))]
        prow(p, G2, it, h=16)
    b = a + 3
    hline(p, G2, a, XL, X2, S["lgt"])
    for r in range(a + 1, b):
        hline(p, G2, r, XL, 922, S["lgt"])
    for x in (323, 523, 723, 922):
        vline(p, G2, a, b, x, S["lgt"])
    for x in (422, 627, 822):
        vline(p, G2, a + 1, b, x, S["lgt"])
    vline(p, G2, a, b, XL, S["gry"])
    hline(p, G2, b, X1, X2, S["gry"])
    # 공개 공지 · 조경 · 건축선
    a = prow(p, G2, [(X1, 370, "공개 공지 면적", SUB), (370, 627, "조경 면적", SUB), (627, 874, "건축선 후퇴 면적", SUB), (874, X2, "건축선 후퇴 거리", SUB)], h=11)
    b = prow(p, G2, [(X1, 345, num("공개공지", fmt=AREA), NB), (345, 370, "㎡", U), (370, 600, num("조경면적", fmt=AREA), NB), (600, 627, "㎡", U),
                     (627, 850, num("후퇴면적", fmt=AREA), NB), (850, 874, "㎡", U), (874, 1100, num("후퇴거리", fmt='#,##0.00;;""'), NB), (1100, X2, "m", U)], h=14)
    for x in (370, 627, 874):
        vline(p, G2, a, b, x, S["lgt"])
    hline(p, G2, b, X1, X2, S["lgt"])

    # 협정 · 구역 √
    def hk(i):
        return F(f"협정표시{i}", "=" + _ck(f'{{셈!협정#{i}}}="√"', HYEOP[i - 1]), align="left", size=9)
    a = prow(p, G2, [(X1, 627, hk(1), NB), (627, X2, hk(2), NB)], h=17)
    b = prow(p, G2, [(X1, 627, hk(3), NB), (627, X2, hk(4), NB)], h=17)
    hline(p, G2, a, X1, X2, S["gry"])
    vline(p, G2, a, b, 627, S["lgt"])
    hline(p, G2, b, X1, X2, S["gry"])
    a = prow(p, G2, [(X1, 290, "고시명", SUBC), (290, 458, "고시번호", SUBC), (458, 627, "고시일자", SUBC), (627, 792, "공고명", SUBC),
                     (792, 958, "공고번호", SUBC), (958, X2, "공고일자", SUBC)], h=17)
    b = prow(p, G2, [(X1, 290, inp("고시명", size=8), NB), (290, 458, inp("고시번호", size=8), NB), (458, 627, inp("고시일자", size=8), NB),
                     (627, 792, inp("공고명", size=8), NB), (792, 958, inp("공고번호", size=8), NB), (958, X2, inp("공고일자", size=8), NB)], h=17)
    hline(p, G2, a, X1, X2, S["lgt"])
    for x in (290, 458, 627, 792, 958):
        vline(p, G2, a, b, x, S["lgt"])
    hline(p, G2, b, X1, X2, S["lgt"])
    a = prow(p, G2, [(X1, 627, "「건축법」 제73조에 따라 적용된 특례사항", SUBC), (627, X2, "「건축법」 제77조의3제2항에 따라 적용된 특례사항", SUBC)], h=17)
    b = prow(p, G2, [(X1, 627, inp("특례73", size=8, wrap=True), NB), (627, X2, inp("특례77", size=8, wrap=True), NB)], h=17)
    hline(p, G2, a, X1, X2, S["lgt"])
    vline(p, G2, a, b, 627, S["lgt"])
    hline(p, G2, b, X1, X2, S["med"])
    p.gap(6)
    a = p.r
    first = True
    for row in IL_ROWS:
        it = [(X1, XL, "일괄처리\n사항", dict(SUBC, size=9, rs=len(IL_ROWS) + 1))] if first else []
        first = False
        for x1, x2, n in row:
            it.append((x1, x2, F(f"일괄표시{n}", "=" + _ck(f'{{셈!일괄#{n}}}="√"', ILGWAL[n - 1]), align="left", size=8.5, wrap=True), NB))
        prow(p, G2, it, h=18 if row[-1][2] != 5 else 26)
    b = prow(p, G2, [(XL, X2, "※ 유의사항: 「건축법」 제14조, 제16조 및 제19조에 따라 다른 법률의 허가를 받거나 신고를 한 것으로 보는 사항에 √ 표시합니다.",
                      dict(FR, size=7, wrap=True))], h=20)
    vline(p, G2, a, b, XL, S["gry"])
    hline(p, G2, a, X1, X2, S["med"], below=False)
    hline(p, G2, b, X1, X2, S["med"])
    p.gap(6)
    prow(p, G2, [(X1, X2, "「건축법」 제14조, 제16조제1항 및 제19조와 같은 법 시행규칙 제12조 및 제12조의2에 따라 위와 같이\n"
                          "건축ㆍ대수선ㆍ용도변경 (변경)신고서를 제출합니다.", dict(FR, size=9, wrap=True))], h=36)
    prow(p, G2, [(X1, 700, "", NB), (700, X2, F("신고일표시", '=IF(N({셈!신고일})=0,"년          월          일",YEAR({셈!신고일})&"년      "'
                                                 '&MONTH({셈!신고일})&"월      "&DAY({셈!신고일})&"일")', align="right", size=9), NB)], h=24)
    prow(p, G2, [(X1, 700, "", NB), (700, 842, "건축주", dict(FRR, size=9)),
                 (842, 1010, F("건축주서명2", '=IF({제1쪽!발주자}="","",{제1쪽!발주자})', align="center", size=9), NB),
                 (1010, X2, "(서명 또는 인)", dict(FRR, size=7.5))], h=24)
    p.gap(52)
    prow(p, G2, [(X1, 160, "", NB), (160, 780, "특별자치시장ㆍ특별자치도지사ㆍ시장ㆍ군수ㆍ구청장", {"kind": "free", "size": 11, "bold": True, "align": "left"}),
                 (780, X2, "귀하", {"kind": "free", "size": 9, "align": "left"})], h=22)
    p.gap(44)
    e = prow(p, G2, [(X1, X2, "", NB)], h=4)
    hline(p, G2, e, X1, X2, S["med"], below=False)
    p.end_print()
    p.after_note(["[ ] 칸(협정 · 구역 · 일괄처리사항)은 ① 장에서 √ 를 고릅니다. 신고일은 ① 장에 적으면 여기 날짜로 들어갑니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축주 · 대지)."])
    return p


# ── 제3쪽 ────────────────────────────────────────────────────────────────
P3X = [120, 180, 267, 275, 290, 327, 380, 385, 476, 490, 527, 612, 708, 765, 850, 865, 876, 880, 910, 915, 969, 972, 1074, 1085, 1124]
G3 = Grid(P3X)


def page3(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제3쪽", fit=1, widths=G3.w)
    X1, XA, XB, X2 = 120, 527, 708, 1124
    inp = _inp(ex, size=8.5)

    def num(k, fmt=NUM, **kw):
        return inp(k, fmt=fmt, align="right", **kw)

    U = dict(FR, size=8)
    prow(p, G3, [(X1, 850, HEAD, FREE), (850, X2, PAGE.format(3), FREE_R)], h=13)
    prow(p, G3, [(X1, X2, "Ⅱ. 동별 개요", H11)], h=18)
    prow(p, G3, [(X1, X2, "※ 는 증축이 있는 경우 증가부분만 적습니다.", dict(FR, size=7.5))], h=12)
    top = prow(p, G3, [(X1, XA, "기존 건축물의 층별 개요", SUBC), (XA, XB, "구 분", SUBC), (XB, X2, "신고 건축물의 층별 개요", SUBC)], h=20)
    rows = [top]

    def ck2(side, key, opts, size=8.5):
        txt = "&\"   \"&".join(_ck(f'{{셈!{side}{key}}}="{o}"', o) for o in opts)
        return F(f"{side}{key}표시", "=" + txt, align="center", size=size)

    rows.append(prow(p, G3, [(X1, XA, ck2("기존", "주부속", JU), NB), (XA, XB, "주/부속구분", SUBC), (XB, X2, ck2("신고", "주부속", JU), NB)], h=18))
    for lab, k in [("⑦ 동 명칭 및 번호", "동명칭"), ("주용도", "주용도")]:
        rows.append(prow(p, G3, [(X1, XA, inp("구" + k), NB), (XA, XB, lab, SUBC), (XB, X2, inp("신" + k), NB)], h=19))
    rows.append(prow(p, G3, [(X1, 290, num("구호수"), NB), (290, XA, "호", U), (XA, XB, "※ ⑧ 호수", SUBC),
                             (XB, 876, num("신호수"), NB), (876, X2, "호", U)], h=19))
    r9 = prow(p, G3, [(X1, 275, num("구가구"), NB), (275, 327, "가구", U), (327, 476, num("구세대"), NB), (476, XA, "세대", U), (XA, XB, "※ ⑨ 가구/세대수", SUBC),
                      (XB, 865, num("신가구"), NB), (865, 915, "가구", U), (915, 1074, num("신세대"), NB), (1074, X2, "세대", U)], h=19)
    rows.append(r9)
    vline(p, G3, r9, r9, 327, S["lgt"])
    vline(p, G3, r9, r9, 915, S["lgt"])
    rows.append(prow(p, G3, [(X1, XA, ck2("기존", "주구조", GUJO, size=8), NB), (XA, XB, "주구조", SUBC), (XB, X2, ck2("신고", "주구조", GUJO, size=8), NB)], h=19))
    for lab, k, h, fmt in [("⑩ 세부구조", "세부구조", 19, None), ("지붕", "지붕", 19, None), ("⑪ 지붕마감재료", "지붕마감", 19, None),
                           ("※ 건축면적(㎡)", "건축면적", 19, AREA), ("※ 연면적(㎡)", "연면적", 19, AREA), ("※ 용적률 산정용\n연면적(㎡)", "용적연면적", 30, AREA)]:
        mk = (lambda kk: num(kk, fmt=fmt)) if fmt else (lambda kk: inp(kk, wrap=True))
        rows.append(prow(p, G3, [(X1, XA, mk("구" + k), NB), (XA, XB, lab, SUBC), (XB, X2, mk("신" + k), NB)], h=h))
    rf = prow(p, G3, [(X1, 180, "지하:", dict(FR, size=8)), (180, 290, num("구지하"), NB), (290, 327, "층", U), (327, 385, "지상:", dict(FR, size=8)),
                      (385, 490, num("구지상"), NB), (490, XA, "층", U), (XA, XB, "층수", SUBC),
                      (XB, 765, "지하:", dict(FR, size=8)), (765, 876, num("신지하"), NB), (876, 910, "층", U), (910, 972, "지상:", dict(FR, size=8)),
                      (972, 1085, num("신지상"), NB), (1085, X2, "층", U)], h=19)
    rows.append(rf)
    vline(p, G3, rf, rf, 327, S["lgt"])
    vline(p, G3, rf, rf, 910, S["lgt"])
    for lab, k, fmt in [("높이(m)", "높이", '#,##0.00;;""'), ("승용승강기", "승용", NUM), ("비상용승강기", "비상", NUM)]:
        rows.append(prow(p, G3, [(X1, XA, num("구" + k, fmt=fmt), NB), (XA, XB, lab, SUBC), (XB, X2, num("신" + k, fmt=fmt), NB)], h=19))
    sp = [("보ㆍ차양길이:", "보차"), ("기둥과 기둥사이:", "기둥"), ("내력벽과 내력벽사이:", "내력")]
    for j, (lab, k) in enumerate(sp):
        it = [(X1, 290, lab, dict(FR, size=8)), (290, 490, num("구" + k, fmt='#,##0.00;;""'), NB), (490, XA, "m", U)]
        if j == 0:
            it.append((XA, XB, "특수구조 건축물\n(「건축법 시행령」\n제2조제18호)", dict(SUBC, size=8, rs=3)))
        it += [(XB, 880, lab, dict(FR, size=8)), (880, 1085, num("신" + k, fmt='#,##0.00;;""'), NB), (1085, X2, "m", U)]
        prow(p, G3, it, h=14)
    rows.append(p.r - 1)
    last = prow(p, G3, [(X1, XA, inp("구특수유형", wrap=True), NB), (XA, XB, "※ ⑫ 특수구조\n건축물 유형", SUBC), (XB, X2, inp("신특수유형", wrap=True), NB)], h=31)
    rows.append(last)
    for r in rows[:-1]:
        hline(p, G3, r, X1, X2, S["lgt"])
    vline(p, G3, top, last, XA, S["gry"])
    vline(p, G3, top, last, XB, S["gry"])
    hline(p, G3, top, X1, X2, S["med"], below=False)
    hline(p, G3, last, X1, X2, S["med"])
    p.gap(8)
    # Ⅲ. 층별 개요
    prow(p, G3, [(X1, X2, "Ⅲ. 층별 개요", H11)], h=18)
    a = prow(p, G3, [(X1, XB, "• 동 명칭 및 번호 (⑦과 동일하게 적습니다)", dict(FR, size=8.5)),
                     (XB, X2, F("층별동", '=IF({신동명칭}="",IF({구동명칭}="","",{구동명칭}),{신동명칭})', align="left", size=9), NB)], h=21)
    hline(p, G3, a, X1, X2, S["med"], below=False)
    hline(p, G3, a, X1, X2, S["med"])
    b = prow(p, G3, [(X1, XA, "기존 건축물의 층별 개요", SUBC), (XA, XB, "구 분", SUBC), (XB, X2, "신고 건축물의 층별 개요", SUBC)], h=21)
    c = prow(p, G3, [(X1, 267, "⑬ 구조", SUBC), (267, 380, "⑭ 용도", SUBC), (380, XA, "⑮ 면적(㎡)", SUBC), (XA, 612, "층구분", SUBC), (612, XB, "건축구분", SUBC),
                     (XB, 850, "⑯ 구조", SUBC), (850, 969, "⑰ 용도", SUBC), (969, X2, "⑱ 면적(㎡)", SUBC)], h=19)
    rr = []
    for i in range(1, NF + 1):
        rr.append(prow(p, G3, [(X1, 267, inp(f"구구조#{i}", size=7.5, wrap=True), NB), (267, 380, inp(f"구용도#{i}", size=7.5, wrap=True), NB),
                               (380, XA, num(f"구면적#{i}", fmt=AREA, size=8), NB), (XA, 612, inp(f"층구분#{i}", size=8, align="center"), NB),
                               (612, XB, inp(f"건축구분#{i}", size=8, align="center"), NB), (XB, 850, inp(f"신구조#{i}", size=7.5, wrap=True), NB),
                               (850, 969, inp(f"신용도#{i}", size=7.5, wrap=True), NB), (969, X2, num(f"신면적#{i}", fmt=AREA, size=8), NB)], h=23))
    hline(p, G3, b, X1, X2, S["lgt"])
    hline(p, G3, c, X1, X2, S["gry"])
    for r in rr[:-1]:
        hline(p, G3, r, X1, X2, S["lgt"])
    for x in (XA, XB):
        vline(p, G3, b, rr[-1], x, S["gry"])
    for x in (267, 380, 612, 850, 969):
        vline(p, G3, c, rr[-1], x, S["lgt"])
    hline(p, G3, rr[-1], X1, X2, S["med"])
    p.end_print()
    p.after_note(["주/부속구분 · 주구조 [ ] 칸은 ① 장에서 고릅니다. 층별 개요 ⑱ 면적의 합계는 ① 장에서 전체 개요 연면적 합계와 대조합니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 건축물 · 면적)."])
    return p


# ── 제4쪽 ────────────────────────────────────────────────────────────────
P4X = [120, 286, 381, 411, 453, 620, 786, 891, 952, 1124]
G4 = Grid(P4X)


def page4(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제4쪽", fit=1, widths=G4.w)
    X1, XM, X2 = 120, 620, 1124
    inp = _inp(ex, size=8.5)

    def num(k, fmt=AREA, **kw):
        return inp(k, fmt=fmt, align="right", **kw)

    prow(p, G4, [(X1, 786, HEAD, FREE), (786, X2, PAGE.format(4), FREE_R)], h=13)
    prow(p, G4, [(X1, X2, "Ⅳ. 대수선 개요", H11)], h=18)
    prow(p, G4, [(X1, X2, "• 대수선을 하려는 해당 항목에 √를 표시하시고, 증설ㆍ해체ㆍ수선 또는 변경여부를 표시하시기 바랍니다.", dict(FR, size=7.5))], h=12)
    first = p.r
    for i, (nm, unit) in enumerate(DAESU, 1):
        chk = f'IF({{셈!대수선#{i}}}<>"","[√]","[   ]")'
        it = [(X1, 381, "대수선 내용", dict(SUBC, size=9, rs=len(DAESU)))] if i == 1 else []
        if unit is None:       # 다가구 · 다세대 경계벽 — 한 줄로
            it += [(381, 411, "", NB)]
            it.append((411, X2, F(f"대수선표시{i}", _dae_opt(i, "").replace("=", "=" + chk + '&" ' + nm + ' "&', 1), align="left", size=8.5), NB))
        else:
            it += [(381, 411, "", NB)]
            it.append((411, 620, F(f"대수선표시{i}", "=" + chk + f'&" {nm}"', align="left", size=8.5), NB))
            it.append((620, 891 if unit else X2, F(f"대수선고름{i}", _dae_opt(i), align="left", size=8.5), NB))
            if unit:
                q = f"{{셈!대수량#{i}}}"
                it.append((891, X2, F(f"대수선양{i}", f'="[ "&IF(N({q})=0,"            ",TEXT({q},"{"#,##0" if unit == "개" else "#,##0.00"}"))&" {unit}]"',
                                      align="left", size=8.5), NB))
        prow(p, G4, it, h=17)
    last = p.r - 1
    vline(p, G4, first, last, 381, S["gry"])
    hline(p, G4, first, X1, X2, S["med"], below=False)
    hline(p, G4, last, X1, X2, S["med"])
    p.gap(8)

    def table(title):
        prow(p, G4, [(X1, X2, title, {"kind": "free", "size": 10.5, "bold": True, "align": "left"})], h=18)
        a = prow(p, G4, [(X1, XM, "기존 건축물의 유형별 개요", SUBC), (XM, X2, "신고 건축물의 유형별 개요", SUBC)], h=17)
        hline(p, G4, a, X1, X2, S["med"], below=False)
        return a

    cols = [(X1, 286), (286, 453), (453, XM), (XM, 786), (786, 952), (952, X2)]

    def body(a, names, ks, nrow, mk, extra=()):
        b = prow(p, G4, [(x1, x2, t, dict(SUBC, size=8.5)) for (x1, x2), t in zip(cols, names)], h=28)
        rr = []
        for i in range(1, nrow + 1):
            rr.append(prow(p, G4, [(x1, x2, mk(k, i), NB) for (x1, x2), k in zip(cols, ks)], h=16))
        for r in [a] + list(extra) + rr[:-1]:
            hline(p, G4, r, X1, X2, S["lgt"])
        hline(p, G4, b, X1, X2, S["gry"])
        vline(p, G4, a, rr[-1], XM, S["gry"])
        for x in (286, 453, 786, 952):
            vline(p, G4, b, rr[-1], x, S["lgt"])
        hline(p, G4, rr[-1], X1, X2, S["med"])

    # 준주택 · 도시형 생활주택
    a = table("※ 준주택, 도시형 생활주택 개요")
    body(a, ["⑲ 유형", "⑳ 실/호/세대수", "㉑ 실/호/세대별\n면적(㎡)", "㉒ 유형", "㉓ 실/호/세대수", "㉔ 실/호/세대별\n면적(㎡)"],
         ["구유형", "구실수", "구실면적", "신유형", "신실수", "신실면적"], N4A,
         lambda k, i: num(f"{k}#{i}") if "면적" in k else num(f"{k}#{i}", fmt=NUM) if "실수" in k else inp(f"{k}#{i}", size=8))
    p.gap(8)
    # 다가구주택
    a = table("※ 다가구주택 호(가구)별 면적")
    body(a, ["호(가구) 구분", "층구분", "㉕ 호(가구)별\n전용면적(㎡)", "호(가구) 구분", "층구분", "㉖ 호(가구)별\n전용면적(㎡)"],
         ["구가구", "구가구층", "구가구면적", "신가구", "신가구층", "신가구면적"], N4B,
         lambda k, i: num(f"{k}#{i}") if "면적" in k else inp(f"{k}#{i}", size=8, align="center"))
    p.gap(8)
    # 임대형기숙사
    a = table("※ 임대형기숙사 호(실)별 면적")
    s1 = prow(p, G4, [(X1, 453, "㉗ 공유공간 전체 면적(㎡)", SUBC), (453, XM, num("구공유"), NB), (XM, 952, "㉘ 공유공간 전체 면적(㎡)", SUBC), (952, X2, num("신공유"), NB)], h=17)
    s2 = prow(p, G4, [(X1, 453, "㉙ 공용공간 전체 면적(㎡)", SUBC), (453, XM, num("구공용"), NB), (XM, 952, "㉚ 공용공간 전체 면적(㎡)", SUBC), (952, X2, num("신공용"), NB)], h=17)
    for x in (453, 952):
        vline(p, G4, s1, s2, x, S["lgt"])
    body(a, ["호(실) 구분", "층구분", "㉛ 호(실)별\n전용면적(㎡)", "호(실) 구분", "층구분", "㉜ 호(실)별\n전용면적(㎡)"],
         ["구기숙", "구기숙층", "구기숙면적", "신기숙", "신기숙층", "신기숙면적"], N4C,
         lambda k, i: num(f"{k}#{i}") if "면적" in k else inp(f"{k}#{i}", size=8, align="center"), extra=(s1, s2))
    p.end_print()
    p.after_note(["대수선 [ ] · 증설ㆍ해체ㆍ수선ㆍ변경 · 수량은 ① 장에서 고르고 적습니다(고른 것 앞에 ◯)."]
                 if not ex else ["이 시트는 작성 예시입니다(신축 예시라 대수선 · 준주택 · 다가구 · 임대형기숙사 칸은 비움)."])
    return p


# ── 제5쪽(도면개요 · 작성방법) ───────────────────────────────────────────────
P5X = [120, 615, 866, 886, 1124]
G5 = Grid(P5X)
JAK5 = ("1. 배치도에 표기해야 할 사항(증축의 경우에는 건축물대장을 참고하시면 편리합니다)\n"
        "   가. 방위,   나. 축척,   다. 대지경계선,   라. 기존건축물이 있는 경우 기존건축물의 외벽선,   마. 건축물의 외벽과 대지경계선 사이의 거리\n"
        "2. 평면도에 표기해야 할 사항\n"
        "   가. 방위,   나. 축척,   다. 각 실의 용도")


def _band(p, G, S, x1, x2, t, h=18):
    r = prow(p, G, [(x1, x2, t, {"kind": "free", "size": 9.5, "align": "center", "fill": S["band"]})], h=h)
    hline(p, G, r, x1, x2, S["med"], below=False)
    hline(p, G, r, x1, x2, S["gry"])
    vline(p, G, r, r, x1, S["gry"])
    vline(p, G, r, r, x2, S["gry"])
    return r


def page5(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제5쪽", fit=1, widths=G5.w)
    X1, X2 = 120, 1124
    inp = _inp(ex)
    prow(p, G5, [(X1, 886, HEAD, FREE), (886, X2, PAGE.format(5), FREE_R)], h=13)
    prow(p, G5, [(X1, X2, "V. 도면개요", H11)], h=18)
    prow(p, G5, [(X1, X2, "• 배치도 및 평면도를 층별로 작성합니다.", dict(FR, size=7.5))], h=12)
    for j in (1, 2):
        e = prow(p, G5, [(X1, X2, "", NB)], h=255)
        hline(p, G5, e, X1, X2, S["thin"] if j == 1 else S["thin"], below=False)
        a = prow(p, G5, [(X1, 615, "도면종류", SUB), (615, X2, "축 척", SUB)], h=11)
        b = prow(p, G5, [(X1, 615, inp(f"도면{j}"), NB), (615, 866, inp(f"축척{j}앞", align="right"), NB), (866, 886, "/", FRC),
                         (886, X2, inp(f"축척{j}뒤"), NB)], h=13)
        hline(p, G5, a, X1, X2, S["gry"], below=False)
        vline(p, G5, a, b, 615, S["gry"])
        hline(p, G5, b, X1, X2, S["thin"] if j == 1 else S["med"])
        if j == 1:
            p.gap(5)
    p.gap(6)
    _band(p, G5, S, X1, X2, "작성방법", h=21)
    r = prow(p, G5, [(X1, X2, JAK5, {"kind": "free", "size": 7.5, "align": "left", "valign": "top", "wrap": True})], h=56)
    hline(p, G5, r, X1, X2, S["thin"])
    p.end_print()
    p.after_note(["도면은 이 쪽을 뽑아 그리거나 따로 붙입니다(건축법 시행규칙 별표 2 · 제6쪽 첨부서류). 여기서는 도면종류 · 축척만 적습니다."])
    return p


# ── 제6쪽(첨부서류 · 신고안내 · 근거규정 · 유의사항 — 원문 글 그대로) ─────────────────────────
P6X = [120, 253, 610, 748, 1124]
G6 = Grid(P6X)
T1 = ("가. 「건축법 시행규칙」 별표 2 중 배치도ㆍ평면도(층별로 작성된 것만 해당합니다)ㆍ입면도 및 단면도. 다만, 다음 각 목의 경우에는 각 목의 구분에 "
      "따른 도서를 말합니다.\n"
      "  1) 연면적의 합계가 100제곱미터를 초과하는 「건축법 시행령」 별표 1 제1호의 단독주택을 건축하는 경우: 「건축법 시행규칙」 별표 2의 설계도서 중 "
      "건축계획서ㆍ배치도ㆍ평면도ㆍ입면도ㆍ단면도 및 구조도(구조내력상 주요한 부분의 평면 및 단면을 표시한 것만 해당합니다)\n"
      "  2) 「건축법」 제23조제4항에 따른 표준설계도서에 따라 건축하는 경우: 건축계획서 및 배치도\n"
      "  3) 「건축법」 제10조에 따른 사전결정을 받은 경우: 평면도\n"
      "나. 「건축법」 제11조제5항 각 호에 따른 허가 등을 받거나 신고를 하기 위해 해당 법령에서 제출하도록 규정하고 있는 신청서 및 구비서류(해당 사항이 "
      "있는 경우로 한정합니다)\n"
      "다. 건축할 대지의 범위에 관한 서류\n"
      "라. 건축할 대지의 소유 또는 사용에 관한 권리를 증명하는 서류. 다만, 건축할 대지에 포함된 국유지ㆍ공유지에 대해서는 특별자치시장ㆍ특별자치도지사 "
      "또는 시장ㆍ군수ㆍ구청장이 해당 토지의 관리청과 협의하여 그 관리청이 해당 토지를 건축주에게 매각하거나 양여할 것을 확인한 서류로 그 토지의 소유에 "
      "관한 권리를 증명하는 서류를 갈음할 수 있으며, 집합건물의 공용부분을 변경하는 경우에는 「집합건물의 소유 및 관리에 관한 법률」 제15조제1항에 따른 "
      "결의가 있었음을 증명하는 서류로 갈음할 수 있습니다.\n"
      "마. 「건축법」 제48조제2항에 따라 구조안전을 확인해야 하는 건축ㆍ대수선의 경우: 「건축법 시행규칙」 별표 2에 따른 구조도 및 구조계산서. 다만 "
      "「건축물의 구조기준 등에 관한 규칙」에 따른 소규모건축물로서 국토교통부장관이 고시하는 소규모건축구조기준에 따라 설계한 경우에는 구조도만 "
      "제출합니다.\n"
      "※ 특별자치시장ㆍ특별자치도지사 또는 시장ㆍ군수ㆍ구청장은 건축물을 건축하려는 대지에 재해의 위험이 있다고 인정하는 경우에는 지방건축위원회의 "
      "심의를 거쳐 「건축법 시행규칙」 별표 2의 서류 중 이미 제출된 서류를 제외한 나머지 서류를 추가로 제출하도록 요구할 수 있습니다.")
T3 = ("가. 용도를 변경하려는 층의 변경 후의 평면도\n나. 용도변경에 따라 변경되는 내화ㆍ방화ㆍ피난 또는 건축설비에 관한 사항을 표시한 도서\n"
      "※ 용도를 변경하려는 층의 변경 전 평면도는 행정정보의 공동이용 또는 「건축법」 제32조제1항에 따른 전산자료를 통해 확인되지 않는 경우 직접 "
      "제출해야 합니다.")
T4 = ("가. 제1호라목 관련: 토지등기사항증명서\n"
      "나. 제3호 중 용도를 변경하려는 층의 변경 전 평면도: 건축물대장 또는 「건축법」 제32조제1항에 따른 전산자료")
G14A = ("1. 바닥면적의 합계가 85제곱미터 이내의 증축ㆍ개축 또는 재축. 다만, 3층 이상 건축물인 경우에는 증축ㆍ개축 또는 재축하려는 부분의 바닥면적의 "
        "합계가 건축물 연면적의 10분의 1 이내인 경우로 한정합니다.\n"
        "2. 「국토의 계획 및 이용에 관한 법률」에 따른 관리지역ㆍ농림지역 또는 자연환경보전지역에서 연면적 200제곱미터 미만이고 3층 미만인 건축물의 건축. "
        "다만, 지구단위계획구역 및 「건축법 시행령」 제11조제1항에 따른 지구 또는 지역에서의 건축은 제외합니다.\n"
        "3. 연면적 200제곱미터 미만이고 3층 미만인 건축물의 대수선\n"
        "4. 다음 각 목의 어느 하나에 해당하는 대수선")
G14B = [("  가. 내력벽의 면적 30제곱미터 이상 수선,", "나. 세 개 이상의 기둥 수선"),
        ("  다. 세 개 이상의 보 수선,", "라. 세 개 이상의 지붕틀 수선"),
        ("  마. 방화벽 또는 방화구획을 위한 바닥 또는 벽 수선,", "바. 주계단ㆍ피난계단 또는 특별피난계단 수선")]
G14C = ("5. 다음 각 목의 어느 하나에 해당하는 건축물의 건축\n"
        "  가. 연면적의 합계가 100제곱미터 이하인 건축물,   나. 건축물의 높이를 3미터 이하의 범위에서 증축하는 건축물\n"
        "  다. 「건축법」 제23조 제4항에 따른 표준설계도서에 따라 건축하는 건축물로서 그 용도ㆍ규모가 주위환경ㆍ미관상 지장이 없다고 인정하여 건축조례로 "
        "정하는 건축물\n"
        "  라. 「국토의 계획 및 이용에 관한 법률」 제36조제1항제1호다목에 따른 공업지역, 같은 법 제51조제3항에 따른 지구단위계획구역(산업ㆍ유통형만 "
        "해당합니다) 및 「산업입지 및 개발에 관한 법률」에 따른 산업단지에서 건축하는 2층 이하인 건축물로서 연면적의 합계가 500제곱미터 이하인 "
        "공장(「건축법 시행령」 별표 1 제4호너목에 따른 제조업소 등의 물품 제조ㆍ 가공을 위한 시설을 포함합니다)\n"
        "  마. 농업이나 수산업을 영위하기 위해 읍ㆍ면지역(특별자치시장ㆍ특별자치도지사ㆍ시장ㆍ군수가 지역계획 또는 도시ㆍ군계획에 지장이 있다고 "
        "지정ㆍ공고한 구역은 제외합니다)에서 건축하는 연면적 200제곱미터 이하의 창고 및 연면적 400제곱미터 이하의 축사ㆍ작물재배사(作物栽培舍), "
        "종묘배양시설, 화초 및 분재 등의 온실")
YU = [("제14조ㆍ제19조", "건축 또는 용도변경 신고일부터 1년 이내에 공사에 착수하지 않으면 그 신고의 효력이 없어집니다."),
      ("제80조ㆍ\n제108조", "도시지역에서 신고 없이 용도변경을 한 경우에는 3년 이하의 징역 또는 5억원 이하의 벌금에 처하게 되며, 위반건축물은 "
                          "위반사항이 시정될 때까지 연 2회 이내의 이행강제금이 부과됩니다."),
      ("제80조ㆍ\n제110조", "도시지역 밖에서 신고 없이 용도변경을 한 경우에는 2년 이하의 징역 또는 1억원 이하의 벌금에 처하게 되며, 위반건축물은 "
                          "위반사항이 시정될 때까지 연 2회 이내의 이행강제금이 부과됩니다."),
      ("제80조ㆍ\n제111조", "신고 또는 변경신고 없이 건축물을 건축 또는 대수선하거나 거짓으로 신고한 경우에는 5천만원 이하의 벌금에 처하게 되며, "
                          "위반건축물은 위반사항이 시정될 때까지 연 2회 이내의 이행강제금이 부과됩니다.")]


def _hh(t, size, w):
    """글 줄 수(넉넉히 어림 — fb.text_lines) × 줄 높이. 줄 높이 1.32 — 1.42 는 제6 · 7쪽처럼 글이 긴 쪽에서 빈 줄이 남음(사이트 · 리브레오피스 모두 1.25 안팎)"""
    return max(14, text_lines(t, w * 10.0 / size) * size * 1.32 + 4)


def page6(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제6쪽", fit=1, widths=G6.w)
    X1, XL, X2 = 120, 253, 1124
    W = sum(G6.w[G6.ix[XL]:])
    W2 = sum(G6.w[G6.ix[748]:])
    W1 = W - W2
    TX = {"kind": "free", "size": 7.5, "align": "left", "valign": "top", "wrap": True}
    LB = dict(SUBC, size=8, wrap=True)

    def lrow(lab, t, line=True):
        r = prow(p, G6, [(X1, XL, lab, LB), (XL, X2, t, TX)], h=_hh(t, 7.5, W))
        if line:
            hline(p, G6, r, X1, X2, S["lgt"])
        vline(p, G6, r, r, XL, S["gry"])
        return r

    prow(p, G6, [(X1, 748, HEAD, FREE), (748, X2, PAGE.format(6), FREE_R)], h=13)
    _band(p, G6, S, X1, X2, "첨부서류 및 허가권자 확인사항")
    lrow("1. 신축, 증축,\n개축, 재축,\n이전 및 대수선", T1)
    lrow("2. 신고사항 변경", "변경하려는 부분에 대한 변경 전ㆍ후의 설계도서")
    lrow("3. 용도변경", T3)
    r = lrow("4. 허가권자\n확인사항", T4)
    hline(p, G6, r, X1, X2, S["med"])
    p.gap(5)
    _band(p, G6, S, X1, X2, "신고안내")
    a = prow(p, G6, [(X1, XL, "제출하는 곳", dict(LB, size=7.5)), (XL, 610, "특별자치시ㆍ특별자치도ㆍ시ㆍ군ㆍ구", dict(SUBC, size=7.5)),
                     (610, 748, "처리부서", dict(LB, size=7.5)), (748, X2, "건축신고 부서", dict(SUBC, size=7.5))], h=15)
    b = prow(p, G6, [(X1, XL, "수수료", dict(LB, size=7.5)), (XL, 610, "「건축법 시행규칙」 별표 4 참조", dict(SUBC, size=7.5)),
                     (610, 748, "처리기간", dict(LB, size=7.5)), (748, X2, "5일, 20일(협의 등이 필요한 신고)", dict(SUBC, size=7.5))], h=15)
    hline(p, G6, a, X1, X2, S["lgt"])
    for x in (XL, 610, 748):
        vline(p, G6, a, b, x, S["lgt"])
    hline(p, G6, b, X1, X2, S["med"])
    p.gap(5)
    _band(p, G6, S, X1, X2, "「건축법」 근거규정")
    n14 = 2 + len(G14B)
    a = prow(p, G6, [(X1, XL, "제14조\n제1항", dict(LB, rs=n14)), (XL, X2, G14A, TX)], h=_hh(G14A, 7.5, W))
    for l, r_ in G14B:
        prow(p, G6, [(XL, 748, l, TX), (748, X2, r_, TX)], h=max(_hh(l, 7.5, W1), _hh(r_, 7.5, W2), 12) - 2)
    b = prow(p, G6, [(XL, X2, G14C, TX)], h=_hh(G14C, 7.5, W))
    vline(p, G6, a, b, XL, S["gry"])
    hline(p, G6, b, X1, X2, S["lgt"])
    lrow("제16조제1항", "신고한 사항을 변경하려는 경우")
    r = lrow("제19조제2항", "용도변경(하위군으로의 용도변경을 말합니다)")
    hline(p, G6, r, X1, X2, S["med"])
    p.gap(5)
    _band(p, G6, S, X1, X2, "「건축법」에 따른 유의사항")
    for i, (lab, t) in enumerate(YU):
        r = lrow(lab, t)
    hline(p, G6, r, X1, X2, S["med"])
    p.end_print()
    p.after_note(["원문 글 그대로입니다(첨부서류 및 허가권자 확인사항 · 신고안내 · 근거규정 · 유의사항)."])
    return p


# ── 제7쪽(작성방법 · 특수구조 유형 · 작성례 · 처리절차 — 원문 글 그대로) ─────────────────────────
P7X = [120, 130, 136, 162, 220, 258, 308, 354, 427, 455, 478, 528, 545, 596, 620, 648, 715, 766, 817, 831, 837, 937, 987, 1036, 1103, 1124]
G7 = Grid(P7X)
JA1 = [("1.", "①ㆍ②: 해당하는 자가 다수인 경우에는 “○○○ 외 ○인”으로 적고, “외 ○인”의 현황도 제출합니다. 아울러, 각종 부담금 사전통지의 전자우편 송달에 "
               "대한 동의여부를 표시하고, 동의하는 경우에는 전자우편 주소를 적습니다."),
       ("2.", "③: 지번은 「공간정보의 구축 및 관리 등에 관한 법률」에 따른 지번을 적되, 여러 필지인 경우 “지번”란에 대표지번을 적고, “관련지번”란에 "
               "대표지번 외의 지번을 적으며, 「공유수면의 관리 및 매립에 관한 법률」 제8조에 따라 공유수면의 점용ㆍ사용 허가를 받은 경우 그 장소가 지번이 "
               "없으면 그 점용ㆍ사용 허가를 받은 장소를 적습니다."),
       ("3.", "④: 건축물(단독주택은 제외합니다)을 총칭할 수 있는 명칭을 반드시 적습니다(예: 쌍둥이빌딩, ○○아파트)."),
       ("4.", "⑤: 복합용도인 경우에는 주용도 하나만 적습니다(“주상복합” 등으로 적지 않습니다)."),
       ("5.", "⑥: 여러 형식이 혼용되는 경우에는 대표 형식을 적고(그 외의 형식도 적습니다), 하수처리시설의 용량은 대표형식과 그 외의 형식을 합한 용량을 "
               "적습니다."),
       ("6.", "⑦: 동의 명칭 및 번호는 다른 동과 중복되지 않도록 명확하게 적습니다(예: 101동, A동 등)."),
       ("7.", "⑧ㆍ⑨ㆍ⑳ㆍ㉓: 집합건물의 구분소유 업무구획 수는 “호수”, 단독주택의 주거구획 수는 “가구수”, 공동주택의 구분소유 주거구획 수는 "
               "“세대수”를 적고, 고시원의 구획 수는 “실수”를 적습니다."),
       ("8.", "⑩: 동별 구조 유형[단일 형강구조, 철골철근콘크리트 합성구조, 공업화 박판 강구조(PEB), 경량철골구조, 트러스구조, 기타]을 적습니다."),
       ("9.", "⑪: 지붕 마감재료(RC슬래브, 복합자재, 금속판, 유리, 기와, 기타)를 적습니다."),
       ("10.", "⑫: 「건축법 시행령」 제2조제18호다목에 따른 특수구조 건축물은 “무량판 구조”로 적고 같은 호 라목에 따른 특수구조 건축물은 다음 표에 따른 "
                "특수구조 건축물 유형을 적습니다. 이 경우 건축물이 복수의 유형에 해당하는 경우에는 모두 적습니다.")]
TUKSU = [("1. 주요구조부가 공업화박판강구조(PEB)인 건축물", "2. 주요구조부가 강관입체트러스(스페이스프레임)인 건축물"),
         ("3. 주요구조부가 막구조인 건축물", "4. 주요구조부가 케이블구조인 건축물"),
         ("5. 주요구조부가 부유식구조인 건축물", "6. 6개층 이상을 지지하는 기둥이나 벽체의 하중이 슬래브나 보에 전이되는 건축물"),
         ("7. 건축물의 주요구조부에 면진ㆍ제진장치를 사용한 건축물", "8. 기타")]
JA2 = [("11.", "⑲ㆍ㉒: 「주택법 시행령」 제4조 및 제10조에 따른 준주택과 도시형생활주택의 유형을 적습니다."),
       ("12.", "㉑ㆍ㉔: 층별 개요 내용과 관계없이 대지 전체를 기준으로 준주택은 실/호/세대별 면적을, 도시형생활주택은 주거전용면적(「주택법 시행규칙」 "
                "제2조)을 적습니다."),
       ("13.", "⑬ ~ ㉔")]
EXM = [("작성례 1)", "농림지역에서 지하 1층에 바닥면적 50㎡의 단독주택(단독주택)을 철근콘크리트조로, 지상 1층에 바닥면적 50㎡의 단독주택(단독주택)을 "
                    "조적조로 신축하려는 경우",
        [["", "", "", "지1", "신축", "철근콘크리트조", "단독주택(단독주택)", "50"], ["", "", "", "1", "신축", "조적조", "단독주택(단독주택)", "50"]]),
       ("작성례 2)", "기존 건축물(5층)의 각 층 바닥면적이 300㎡이고, 철근콘크리트조인 3층의 숙박시설(여관) 150㎡를 제2종근린생활시설(일반음식점)로 "
                    "용도변경하고, 6층에 숙박시설(여관) 80㎡를 증축하려는 경우",
        [["철근콘크리트조", "숙박시설(여관)", "150", "3", "용도변경", "철근콘크리트조", "제2종근린생활시설(일반음식점)", "150"],
         ["", "", "", "6", "증축", "철근콘크리트조", "제2종근린생활시설(사무소)", "80"]]),
       ("작성례 3)", "기존건축물(2층)의 연면적이 200㎡이고, 철근콘크리트구조인 1층의 제2종근린생활시설(사무소) 100㎡을 대수선하려는 경우",
        [["철근콘크리트조", "제2종근린생활시설(사무소)", "100", "1", "대수선", "철근콘크리트조", "제2종근린생활시설(사무소)", "100"]])]
EX4 = ("작성례 4)", "준주택(오피스텔) 호별 면적 25㎡- 2호를 증축하거나, 관리지역에서 도시형생활주택(원룸형주택) 전용면적 30㎡- 6세대를 건축(용도변경 "
                   "포함)하려는 경우",
       [["준주택(오피스텔)", "10", "25", "준주택(오피스텔)", "2", "25"], ["", "", "", "도시형생활주택(원룸형주택)", "6", "30"]])
JA3 = [("14.", "㉕ㆍ㉖: 「주택법 시행규칙」 제2조제1호에 따라 다가구주택의 각 호(가구)별 주거전용면적을 적습니다."),
       ("15.", "㉗ㆍ㉘: 임대형기숙사 내부에서 개인공간을 제외한 다수의 거주자가 공동으로 사용하는 거실ㆍ주방ㆍ공동욕실 등으로서 이동을 위한 복도, 계단, "
                "승강기 및 주차장 등을 제외한 면적을 적습니다."),
       ("16.", "㉙ㆍ㉚: 임대형기숙사 내부에서 호(실)별 전용면적 합계 및 공유공간 전체 면적을 제외하고 이동을 위한 복도, 계단, 승강기 및 주차장 등의 "
                "면적을 적습니다."),
       ("17.", "㉛ㆍ㉜: 「주택법 시행규칙」 제2조제2호에 따라 임대형기숙사(공동주택)의 각 호(실)별 주거전용면적을 적습니다.")]
FLOW = [(136, 258, "신고서\n작성"), (308, 427, "접 수"), (478, 596, "검 토\n(협 의)"), (648, 766, "결 재"), (817, 937, "신고필증\n작성"), (987, 1103, "신고필증\n교부")]


def page7(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "제7쪽", fit=1, widths=G7.w)
    X1, XT, X2 = 120, 1103, 1124
    TX = {"kind": "free", "size": 7.5, "align": "left", "valign": "top", "wrap": True}
    TC = {"kind": "free", "size": 7, "align": "center", "wrap": True}
    WT = sum(G7.w[G7.ix[162]:G7.ix[XT]])

    def items(lst):
        for n, t in lst:
            prow(p, G7, [(X1, 130, "", NB), (130, 162, n, dict(TX, align="right")), (162, XT, t, TX), (XT, X2, "", NB)], h=_hh(t, 7.5, WT))

    prow(p, G7, [(X1, X2, HEAD, FREE)], h=13)
    prow(p, G7, [(X1, X2, PAGE.format(7), FREE_R)], h=11)
    _band(p, G7, S, X1, X2, "작성방법")
    p.gap(3)
    items(JA1)
    # 특수구조 건축물 유형 표
    a = prow(p, G7, [(X1, 136, "", NB), (136, XT, "특수구조 건축물 유형", dict(TC, size=7.5)), (XT, X2, "", NB)], h=11)
    rr = [prow(p, G7, [(X1, 136, "", NB), (136, 545, l, dict(TX, size=7)), (545, XT, r_, dict(TX, size=7)), (XT, X2, "", NB)], h=10) for l, r_ in TUKSU]
    hline(p, G7, a, 136, XT, S["thin"], below=False)
    hline(p, G7, a, 136, XT, S["lgt"])
    hline(p, G7, rr[-1], 136, XT, S["thin"])
    vline(p, G7, a, rr[-1], 136, S["thin"])
    vline(p, G7, a, rr[-1], XT, S["thin"])
    p.gap(3)
    items(JA2)
    cols8 = [(136, 258), (258, 455), (455, 528), (528, 620), (620, 715), (715, 831), (831, 1036), (1036, XT)]
    for title, txt, data in EXM:
        prow(p, G7, [(X1, 136, "", NB), (136, 220, title, dict(TX, size=8, bold=True)), (220, XT, txt, TX), (XT, X2, "", NB)],
             h=_hh(txt, 7.5, sum(G7.w[G7.ix[220]:G7.ix[XT]])))
        h1 = prow(p, G7, [(X1, 136, "", NB), (136, 528, "기존 건축물 층별 개요", TC), (528, 715, "구분", TC), (715, XT, "신고 층별 개요", TC), (XT, X2, "", NB)], h=11)
        h2 = prow(p, G7, [(X1, 136, "", NB)] + [(x1, x2, t, TC) for (x1, x2), t in zip(cols8, ["구조", "용도", "면적(㎡)", "층구분", "건축구분", "구조", "용도", "면적(㎡)"])]
                  + [(XT, X2, "", NB)], h=11)
        rows = [prow(p, G7, [(X1, 136, "", NB)] + [(x1, x2, t, TC) for (x1, x2), t in zip(cols8, d)] + [(XT, X2, "", NB)], h=11) for d in data]
        for r in [h1, h2] + rows[:-1]:
            hline(p, G7, r, 136, XT, S["gry"])
        hline(p, G7, h1, 136, XT, S["thin"], below=False)
        hline(p, G7, rows[-1], 136, XT, S["thin"])
        for x in (136, XT):
            vline(p, G7, h1, rows[-1], x, S["gry"])
        for x in (528, 715):
            vline(p, G7, h1, rows[-1], x, S["gry"])
        for x in (258, 455, 620, 831, 1036):
            vline(p, G7, h2, rows[-1], x, S["lgt"])
        p.gap(3)
    title, txt, data = EX4
    prow(p, G7, [(X1, 136, "", NB), (136, 220, title, dict(TX, size=8, bold=True)), (220, XT, txt, TX), (XT, X2, "", NB)],
         h=_hh(txt, 7.5, sum(G7.w[G7.ix[220]:G7.ix[XT]])))
    prow(p, G7, [(X1, 136, "", NB), (136, XT, "※ 준주택ㆍ도시형생활주택 개요", dict(TX, size=8, bold=True)), (XT, X2, "", NB)], h=12)
    cols6 = [(136, 354), (354, 455), (455, 620), (620, 837), (837, 937), (937, XT)]
    h1 = prow(p, G7, [(X1, 136, "", NB), (136, 620, "기존 건축물의 유형별 개요", TC), (620, XT, "신고 건축물의 유형별 개요", TC), (XT, X2, "", NB)], h=11)
    h2 = prow(p, G7, [(X1, 136, "", NB)] + [(x1, x2, t, TC) for (x1, x2), t in zip(cols6, ["유 형", "실/호/세대수", "실/호/세대별 면적(㎡)", "유 형", "실/호/세대수",
                                                                                        "실/호/세대별 면적(㎡)"])] + [(XT, X2, "", NB)], h=11)
    rows = [prow(p, G7, [(X1, 136, "", NB)] + [(x1, x2, t, TC) for (x1, x2), t in zip(cols6, d)] + [(XT, X2, "", NB)], h=11) for d in data]
    for r in [h1, h2] + rows[:-1]:
        hline(p, G7, r, 136, XT, S["gry"])
    hline(p, G7, h1, 136, XT, S["thin"], below=False)
    hline(p, G7, rows[-1], 136, XT, S["thin"])
    for x in (136, 620, XT):
        vline(p, G7, h1, rows[-1], x, S["gry"])
    for x in (354, 455, 837, 937):
        vline(p, G7, h2, rows[-1], x, S["lgt"])
    p.gap(3)
    items(JA3)
    p.gap(8)
    _band(p, G7, S, X1, X2, "처리절차", h=20)
    p.gap(6)
    it = [(X1, 136, "", NB)]
    for k, (x1, x2, t) in enumerate(FLOW):
        it.append((x1, x2, t, dict(TC, size=7.5)))
        if k + 1 < len(FLOW):
            it.append((x2, FLOW[k + 1][0], "→", dict(TC, size=10)))
    it.append((XT, X2, "", NB))
    fr = prow(p, G7, it, h=24)
    for x1, x2, _ in FLOW:
        hline(p, G7, fr, x1, x2, S["gry"], below=False)
        hline(p, G7, fr, x1, x2, S["gry"])
        vline(p, G7, fr, fr, x1, S["gry"])
        vline(p, G7, fr, fr, x2, S["gry"])
    prow(p, G7, [(X1, 136, "", NB), (136, 308, "신고인(건축주)", dict(TX, size=7)), (308, 987, "특별자치시ㆍ특별자치도, 시ㆍ군ㆍ구(건축신고 부서)", dict(TC, size=7)),
                 (987, XT, "신고인(건축주)", dict(TC, size=7)), (XT, X2, "", NB)], h=13)
    p.gap(4)
    e = prow(p, G7, [(X1, X2, "", NB)], h=4)
    hline(p, G7, e, X1, X2, S["med"], below=False)
    p.end_print()
    p.after_note(["원문 글 그대로입니다(작성방법 · 특수구조 건축물 유형 · 작성례 · 처리절차)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    page1(bk, ex)
    page2(bk, ex)
    page3(bk, ex)
    page4(bk, ex)
    page5(bk, ex)
    page6(bk, ex)
    page7(bk, ex)


# ── 기대값(엑셀 식과 같은 셈 — 조문대로 따로 셈) ───────────────────────────────────
YOIL = "월화수목금토일"


def expect(pages):
    sm, p1, p3 = pages["셈"], pages["제1쪽"], pages["제3쪽"]
    a, b1, b2, b3, b4 = {}, {}, {}, {}, {}
    dj, gc, yn1, yn2 = _n(p1.get("대지면적")), _n(p1.get("건축면적")), _n(p1.get("연면적")), _n(p1.get("연면적용적"))
    a["건폐셈"] = "" if (dj == 0 or gc == 0) else f"{KS_A}{_t2(gc)}{KS_B}{_t2(dj)}{KS_C}{_r2(gc / dj * 100):.2f}{KS_D}"
    a["용적셈"] = "" if (dj == 0 or yn2 == 0) else f"{YJ_A}{_t2(yn2)}{YJ_B}{_t2(dj)}{KS_C}{_r2(yn2 / dj * 100):.2f}{KS_D}"
    sf = sum(_n(p3.get(f"신면적#{i}")) for i in range(1, NF + 1))
    if sf == 0:
        a["층별셈"] = ""
    else:
        a["층별셈"] = f"{CB_A}{_t2(sf)}{CB_B}{_t2(yn1)}" + (CB_SAME if _r2(sf) == _r2(yn1) else CB_DIFF)
    # 처리 기한 — 5일: 받은 때부터 근무시간(받은 날이 근무일이면 다음 근무일부터 5일째 같은 시각) · 20일: 받은 날을 1일로 근무일
    n_day = 20 if sm.get("협의") == "예" else 5
    a["처일수"] = "" if (not sm.get("신고일") and not sm.get("협의")) else n_day
    sd = sm.get("신고일")
    st = None if not sd else (sd + datetime.timedelta(days=1) if (n_day <= 5 and not MW.쉬는날(sd)) else sd)
    a["처시작"] = "" if st is None else st
    for k in range(1, MW.되풀이 + 1):
        a["처끝" if k == MW.되풀이 else f"처E{k}"] = "" if st is None else MW.식흉내(st, n_day, k)
    if st is None:
        a["처리"] = ""
    else:
        ce = MW.처리끝(st, n_day)
        tail = CH6 if n_day >= 6 else (CH5_OFF if MW.쉬는날(sd) else CH5)
        a["처리"] = f"{_ymdp(ce)}({YOIL[ce.weekday()]}){tail}" + ("" if MW.다덮음(sd, ce) else MW.밖글)
    if not sd:
        a["착수기한"] = ""
    else:
        due = 끝날(sd, 12)
        a["착수기한"] = f"{SJ_A}{_ymdp(sd)}{SJ_B}{_ymdp(due)}({YO[(due.weekday() + 1) % 7]}{SJ_C}"
    if not p1.get("발주자") and not sm.get("건축구분"):
        a["빈칸"] = ""
        a["다음"] = ""
    else:
        mc = {"건축구분": not sm.get("건축구분"), "건축주 성명": not p1.get("발주자"), "건축주 주소": not p1.get("건축주주소"),
              "대지위치": not p1.get("현장위치"), "지번": not p1.get("지번"), "대지면적": not dj,
              "건축면적": not gc, "연면적 합계": not yn1, "주용도": not p1.get("주용도"), "신고일": not sd}
        miss = [nm for nm, _ in BIN if mc[nm]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
        a["다음"] = NEXT
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
    b2["신고일표시"] = "년          월          일" if not sd else f"{sd.year}년      {sd.month}월      {sd.day}일"
    for side in ("기존", "신고"):
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


for _t in (SJ_A, SJ_B, SJ_C, CH5, CH5_OFF, CH6, NEXT, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
