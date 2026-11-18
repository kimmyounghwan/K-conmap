# -*- coding: utf-8 -*-
"""건축물 해체 현장 안전점검표 — 새로 만든 서식 (2026-11-18 G766 · 소장님 「…만들지 못한 서식도 10개 만들어 줘」 — 셋째)
   → ① 점검 항목 스물넷 적정 · 부적정 고르기 → 점검표 «○» · 적정 · 부적정 · 안 고른 수 · 부적정 목록 ·
     [장비를 올려 해체하는 경우만 해당] 세 항목은 장비를 안 올리면 «해당 없음» · 허가 · 신고 / 감리계약 / 상주 / 검토보고서 √ ·
     종합점검결과 √ · 공사기간 일수 · 아직 안 적은 칸
   · 점검표 여섯 쪽(건축물관리법 시행규칙 [별지 제6호의11서식] <신설 2022. 8. 4.> 칸 차례 그대로 — 1 · 2쪽 체크리스트 · 3쪽 추가 확인 사항 ·
     4 · 5 · 6쪽 사진 표(구분 | 사진 | 비고 — 사진 칸은 사이트에서 사진 넣기)).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 그림(1240×1752) 선 자리(notes/G766/구조.md — 1 · 2쪽 바깥 123 ~ 1125 · 항목 335 · 적정 799 · 부적정 867 · 의견 948 ·
     1쪽 정보 칸 208 · 연락처 512 · 608 / 3 ~ 6쪽 바깥 120 ~ 1122 · 구분 279 · 사진 | 비고 700).

근거(국가법령정보센터 · 2026-11-18 · 원문 /home/claude/g10/notes/G766/원문_대조용.txt · 조문 G766/근거.md — 세 번):
  · 건축물관리법 [시행 2025. 6. 4.] 제30조의4 — 해체 현장 현장점검 · 조치 명령 · 건축물관리점검기관에 대행
  · 시행규칙 [시행 2025. 6. 2.] 제12조의4 ③ 현장점검을 대행하는 건축물관리점검기관은 현장점검을 마치면 허가권자에게 별지 제6호의11서식 안전점검표를 냄
■ 원문 그대로: 머리 · 제목 · (6쪽 중 N쪽) · 점검 항목 글(▪ · [ ] · «ᆞ» 는 «ㆍ» 로) · 종합점검결과 · ※ 두 줄 · 사진 표 구분 글.
■ 짐작 안 함: 적정 · 부적정은 점검자가 고름(셈은 세기 · 목록만) · 종합점검결과(긴급 안전조치 · 보강조치 · 안전진단)도 점검자가 고름."""
import datetime

import sgw as g
from fb import F, I
from f_geonchuk_heoga_sincheong import Grid, prow, hline, vline, _sides, SUB, SUBC, FR, FRR, FRC, NB, _ymd
from sgw import L

SLUG = "haeche-anjeon-jeomgeom"
TITLE = "건축물 해체 현장 안전점검표"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
# 시트: 셈 · 1쪽 · 2쪽 · 3쪽 · 4쪽 · 5쪽 · 6쪽 → 빈 1 ~ 7 / 예시 8 ~ 14
PREV = [(2, "건축물 해체 현장 안전점검표(건축물관리법 시행규칙 별지 제6호의11서식) 1쪽 — 빈 서식 (원문 칸 차례 그대로)"),
        (9, "건축물 해체 현장 안전점검표 1쪽 — 작성 예시 (적정 · 부적정 ○ · 허가 · 감리 √ 가 ① 장에서)"),
        (10, "건축물 해체 현장 안전점검표 2쪽 — 작성 예시 (구조안전성 · 안전대책 · 종합점검결과)"),
        (8, "① 적정 · 부적정 · 부적정 목록 · 장비 항목 · 종합점검결과 — 작성 예시 (가상의 해체 현장)"),
        (5, "4쪽 — 임시시설물 및 건축물 외관조사 사진 표 (원문 그대로 — 사진 칸은 사이트에서 사진 넣기)")]
MULTI = True
SHORT = ("건축물 해체 현장 안전점검표(건축물관리법 시행규칙 별지 제6호의11서식) — 해체 현장 현장점검을 마치면 건축물관리점검기관이 허가권자에게 냅니다. "
         "점검 항목 스물넷을 적정 · 부적정으로 고르면 점검표에 ○ 가 들어가고 부적정 목록 · 수가 저절로 나옵니다. 4 ~ 6쪽 사진 표는 사이트에서 사진을 넣습니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
JANGBI = ["해체장비를 건축물에 올림", "해체장비를 건축물에 올리지 않음"]
RES = "적정,부적정"
PIL = ["필요", "불필요"]
# 점검 항목 — (열쇠, 줄, 글, 고르기(열쇠 · 둘) | None, 장비 항목)
SEC = [
    ("1. 해체계획서 및\n해체감리자", [
        ("h1", "해체허가(신고)여부", ("허신", ["허가", "신고"]), False),
        ("h2", "해체감리계약 체결여부", ("계약", ["체결", "미체결"]), False),
        ("h3", "해체감리원 상주여부", ("상주", ["상주", "비상주"]), False),
        ("h4", "감리업무일지 내용의 적정성 및 생애이력 정보체계에의 매일 등록 여부", None, False),
        ("h5", "감리자가 작성하는 안전점검표 내용의 적정성", None, False)]),
    ("2. 사전조사", [
        ("s1", "건축물의 현황, 증축 및 개축 이력 등에 대한 해체계획서 작성자의 사전 현장조사 여부", None, False)]),
    ("3. 주변 환경조사", [
        ("j1", "건축물의 해체 전 폐기물 반출을 위한 도로 여건 및 해체공사 현장 인근 지역의 피해 발생 가능성 검토 여부", None, False),
        ("j2", "전력ㆍ가스ㆍ수도 공급시설, 정보통신 케이블 등의 설치 현황에 대한 해체계획서 작성자의 확인 여부", None, False)]),
    ("4. 임시 시설물 및\n건축물 외관조사", [
        ("i1", "해체계획서에 따른 임시 시설물(외부 비계, 공사용 가설울타리, 안전난간대 및 작업자 안전통로 등) 설치의 적정성", None, False),
        ("i2", "[장비를 올려 해체하는 경우만 해당] 건축물 해체 공정에 따른 외부 비계의 적기 해체 여부", None, True),
        ("i3", "건축물 해체 시 분리ㆍ낙하의 우려가 있는 내장재ㆍ외장재의 사전 제거 여부", None, False)]),
    ("5. 구조안전계획에\n따른 구조안전성\n확인", [
        ("k1", "구조안전성 검토보고서", ("보고서", ["있음", "없음"]), False),
        ("k2", "[장비를 올려 해체하는 경우만 해당] 잭 서포트(jack support) 설치 수량 및 설치 상태의 적정성", None, True),
        ("k3", "해체계획서 상의 해체 순서 준수 여부", None, False),
        ("k4", "장비 용량(ton)의 적정성", None, False),
        ("k5", "[장비탑재만 해당] 해체계획서에 따른 해체장비 이동 동선과 실체 이동 동선의 일치 여부", None, True),
        ("k6", "슬래브 위 해체잔재물 적치 여부(40cm 이하로 적치 여부)", None, False),
        ("k7", "잔재물(殘滓物) 반출을 위한 개구부 및 낙하구 설치 위치의 적정성", None, False)]),
    ("6. 안전대책 및\n부산물 처리", [
        ("a1", "작업자 및 인접 건축물에 대한 안전대책 준수 여부", None, False),
        ("a2", "해체공사 현장 및 주변에 설치한 보행자 안전시설, 낙하물 방지망 및 방호시설 등에 대한 관리의 적정 여부", None, False),
        ("a3", "「소음ㆍ진동관리법」 준수 여부", None, False),
        ("a4", "비산(飛散) 먼지 예방 대책의 수립․시행 여부", None, False),
        ("a5", "폐기물 처리계획의 수립․시행 여부", None, False),
        ("a6", "안전사고 발생 시 대처방안의 적정성", None, False)]),
]
ITEMS = [it for _, its in SEC for it in its]
SHORTN = {"h1": "해체허가(신고)", "h2": "감리계약", "h3": "감리원 상주", "h4": "감리업무일지 등록", "h5": "감리자 안전점검표",
          "s1": "사전 현장조사", "j1": "도로 여건ㆍ피해 검토", "j2": "전력ㆍ가스ㆍ수도 확인", "i1": "임시 시설물", "i2": "외부 비계 적기 해체",
          "i3": "내ㆍ외장재 사전 제거", "k1": "구조안전성 검토보고서", "k2": "잭 서포트", "k3": "해체 순서", "k4": "장비 용량",
          "k5": "장비 이동 동선", "k6": "슬래브 위 잔재물 적치", "k7": "개구부ㆍ낙하구 위치", "a1": "작업자ㆍ인접 안전대책",
          "a2": "보행자 안전시설", "a3": "소음ㆍ진동관리법", "a4": "비산 먼지 예방", "a5": "폐기물 처리계획", "a6": "안전사고 대처방안"}
# 점검 줄 높이(pt) — 원문 그림 줄 높이(px) × 0.48
H_ITEM = {"h1": 29, "h2": 30, "h3": 30, "h4": 30, "h5": 35, "s1": 34, "j1": 40, "j2": 30, "i1": 40, "i2": 36, "i3": 30,
          "k1": 30, "k2": 35, "k3": 32, "k4": 29, "k5": 31, "k6": 29, "k7": 29, "a1": 29, "a2": 40, "a3": 29, "a4": 29, "a5": 29, "a6": 30}
JB_KEYS = [it[0] for it in ITEMS if it[3]]
NO_NEED = "해당 없음(장비를 안 올림)"
BU_A = "⚠ 부적정 "
BU_OK = "✓ 부적정 없음"
BIN_OK = "✓ 점검 항목을 다 골랐습니다"
BIN_A = "⚠ 아직 안 고른 항목 "
NEXT = ("현장점검을 마치면 건축물관리점검기관이 이 안전점검표를 허가권자에게 냅니다(시행규칙 제12조의4제3항) · "
        "점검자는 사진 · 동영상을 찍고(※) · 긴급히 조치할 것이 보이면 바로 안전조치(※)")
NOTE1 = "※ 점검자는 건축물 해체공사 현장에 대한 사진 또는 동영상 등을 촬영해야 합니다."
NOTE2 = "※ 점검자는 현장점검을 수행하는 과정에서 긴급히 조치해야 하는 사항이 발견되는 경우 즉시 안전조치를 실시해야 합니다."
HEAD = "■ 건축물관리법 시행규칙 [별지 제6호의11서식] <신설 2022. 8. 4.>"
GIGAN0 = "년    월    일  ~    년    월    일 (     일간)"   # 원문 «년 월 일 ~ 년 월 일 ( 일간)» — 칸 한 줄에 들게 띄움만 줄임
CUT = 84   # 목록(부적정 · 안 고른 항목)은 84자까지 — 넘으면 « …»(칸 두 줄 · 수는 앞에 다 나옴)


def _cut(lst):
    """« · 이름» 이어 붙인 목록 → 앞 « · » 를 떼고 CUT 자까지(넘으면 « …»)"""
    return f'IF(LEN({lst})>{CUT + 3},MID({lst},4,{CUT})&" …",MID({lst},4,800))'


def _cutp(names):
    full = "".join(" · " + n for n in names)
    return full[3:CUT + 3] + " …" if len(full) > CUT + 3 else full[3:]
P4 = ["가설울타리 및\n가설방음벽\n설치상태", "보행자\n안전조치 상태", "낙하물\n방지조치 상태", "외부비계 현황", "탈락위험 자재\n제거현황", "그 밖의 사항"]
P5 = ["잭서포트\n배치현황", "잔재물\n적치현황\n(슬래브 위 등)", "폐기물\n처리현황", "잔재물 반출\n개구부 및\n낙하구 설치위치", "주요 해체장비\n현황", "외벽\n전도방지장치\n설치상태", "그 밖의 사항"]
P6 = ["소음ㆍ진동\n방지장치\n설치 현황", "분진방지장치\n설치 현황", "그 밖의 사항"]

# ── 작성 예시(가상의 현장 · 회사 · 사람) ───────────────────────────────
EX = {"장비": "해체장비를 건축물에 올림", "점검일": D(2027, 3, 15), "점검시각": "10:00", "시작": D(2027, 3, 2), "끝": D(2027, 5, 31),
      "허신": "허가", "계약": "체결", "상주": "상주", "보고서": "있음", "긴급": "불필요", "보강": "필요", "진단": "불필요"}
EX.update({"결과" + k: "적정" for k, *_ in ITEMS})
EX["결과a4"] = "부적정"
EX_S = {"구조형식": "철근콘크리트조", "지상": "4층", "지하": "1층", "해체범위": "전체 해체(주 건축물 1동 · 부속 건축물 1동)", "시공자": "가나건설(주)",
        "현장소장": "홍길동", "소장연락처": "010-0000-0000", "현장주소": "가나시 다라구 마바동 123-4", "소속": "가나건축안전(주)", "직급": "책임",
        "점검자연락처": "000-0000-0000", "점검자": "김철수", "비고": "",
        "의견a4": "서측 보행통로 쪽 방진망 일부 찢어짐 — 보수 요청", "의견k4": "0.7㎥급 · 계획서와 같음",
        "특기": "서측 보행통로 쪽 방진망을 3. 17.까지 보수하고 사진을 보내도록 요청함. 그 밖의 항목은 해체계획서대로 관리되고 있음.",
        "추가": "인접 상가 영업시간(09:00 ~ 21:00) 중 압쇄 작업 소음 민원 1건 — 작업 시간 조정 협의 중",
        "비고4_1": "가설울타리 H=3m 연속 설치 · 방음벽 남측 설치", "비고4_2": "보행통로 유도원 1명 배치", "비고4_6": "",
        "비고5_1": "4층 슬래브 아래 잭서포트 계획 수량 설치", "비고6_1": "소음계 측정 68dB(A)"}


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _ex(ex, k):
    return EX.get(k) if ex else None


def _res(k):
    """셈의 결과 칸 — 장비 항목은 장비를 안 올리면 해당 없음(빈칸)"""
    return "{셈!결과" + k + "}"


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    s7 = {"kind": "text", "size": 7}
    p.row([(12, "①  해체 현장 안전점검 — 적정 · 부적정 · 부적정 목록 · 종합점검결과 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 해체 현장 현장점검을 대행하는 건축물관리점검기관은 현장점검을 마치면 이 안전점검표를 허가권자에게 냅니다(건축물관리법 시행규칙 제12조의4제3항). "
              "여기서 고른 적정 · 부적정이 점검표 칸에 ○ 로 들어가고, 고르는 칸([ ])도 √ 로 들어갑니다.")
    g.sec(p, "㉮  해체장비 · 점검일 · 공사기간", need=26 * 3 + 10)
    p.row([(3, "해체장비 탑재", L), (5, I("장비", ex=_ex(ex, "장비"), dv=",".join(JANGBI), align="center", size=8.5)),
           (4, "올리지 않으면 [장비 … 만 해당] 세 항목은 해당 없음", s7)], h=26)
    p.row([(3, "점검일", L), (3, I("점검일", ex=_ex(ex, "점검일"), fmt=DT, align="center", size=9)),
           (3, "점검 시각", dict(L, size=8.5)), (3, I("점검시각", ex=_ex(ex, "점검시각"), align="center", size=9))], h=26)
    p.row([(3, "공사기간", L), (2, I("시작", ex=_ex(ex, "시작"), fmt=DT, align="center", size=8.5)), (1, "~", {"kind": "cfree", "size": 9}),
           (2, I("끝", ex=_ex(ex, "끝"), fmt=DT, align="center", size=8.5)),
           (4, F("일간", '=IF(OR(N({시작})=0,N({끝})=0),"",IF({끝}<{시작},"⚠ 끝날이 시작일보다 앞입니다",({끝}-{시작}+1)&"일간(첫날 · 끝날 넣어 셈)"))', align="left", size=8.5))], h=26)
    g.sec(p, "㉯  고르는 칸 · 점검 결과 (적정 · 부적정)", need=26 * 15 + 10)
    p.row([(3, "해체허가(신고)", dict(L, size=8.5)), (3, I("허신", ex=_ex(ex, "허신"), dv="허가,신고", align="center", size=9)),
           (3, "해체감리계약", dict(L, size=8.5)), (3, I("계약", ex=_ex(ex, "계약"), dv="체결,미체결", align="center", size=9))], h=26)
    p.row([(3, "해체감리원", dict(L, size=8.5)), (3, I("상주", ex=_ex(ex, "상주"), dv="상주,비상주", align="center", size=9)),
           (3, "구조안전성 검토보고서", dict(L, size=7.5)), (3, I("보고서", ex=_ex(ex, "보고서"), dv="있음,없음", align="center", size=9))], h=26)
    for i in range(0, len(ITEMS), 2):
        cells = []
        for k, _, _, jb in ITEMS[i:i + 2]:
            cells += [(3, SHORTN[k] + (" *" if jb else ""), dict(L, size=7.5)),
                      (3, I("결과" + k, ex=_ex(ex, "결과" + k), dv=RES, align="center", size=9))]
        p.row(cells, h=26)
    p.row([(12, "* 표는 [장비를 올려 해체하는 경우만 해당] 항목 — 장비를 안 올리면 골라도 «해당 없음» 으로 셉니다.", s7)], h=18)
    g.sec(p, "㉰  셈 · 부적정 목록 · 종합점검결과", need=26 * 2 + 36 * 3 + 10)
    jb_off = '{장비}="' + JANGBI[1] + '"'

    def chk(k, jb, v):
        base = f'{{결과{k}}}="{v}"'
        return f'AND({base},NOT({jb_off}))' if jb else base

    cnt_ok = "+".join(f'IF({chk(k, jb, "적정")},1,0)' for k, _, _, jb in ITEMS)
    cnt_bu = "+".join(f'IF({chk(k, jb, "부적정")},1,0)' for k, _, _, jb in ITEMS)
    lst_bu = "&".join(f'IF({chk(k, jb, "부적정")}," · {SHORTN[k]}","")' for k, _, _, jb in ITEMS)
    lst_no = "&".join((f'IF(AND({{결과{k}}}="",NOT({jb_off}))," · {SHORTN[k]}","")' if jb else f'IF({{결과{k}}}=""," · {SHORTN[k]}","")')
                      for k, _, _, jb in ITEMS)
    p.row([(2, "적정", L), (2, F("적정수", "=" + cnt_ok, align="center", size=10)),
           (2, "부적정", L), (2, F("부적정수", "=" + cnt_bu, align="center", size=10)),
           (2, "점검할 항목", dict(L, size=8.5)), (2, F("점검수", f'={len(ITEMS)}-IF({jb_off},{len(JB_KEYS)},0)', align="center", size=10))], h=26)
    p.row([(3, "부적정 항목", L),
           (9, F("부적정", '=IF({적정수}+{부적정수}=0,"",IF({부적정수}=0,"' + BU_OK + '","' + BU_A + '"&{부적정수}&": "&' + _cut(lst_bu) + '))',
                 align="left", size=8.5))], h=36)
    p.row([(3, "아직 안 고른 항목", L),
           (9, F("안고름", '=IF({적정수}+{부적정수}=0,"",IF({적정수}+{부적정수}={점검수},"' + BIN_OK + '","' + BIN_A
                 + '"&({점검수}-{적정수}-{부적정수})&": "&' + _cut(lst_no) + '))', align="left", size=8.5))], h=36)
    p.row([(2, "긴급 안전조치", dict(L, size=8)), (2, I("긴급", ex=_ex(ex, "긴급"), dv=",".join(PIL), align="center", size=8.5)),
           (2, "보강조치", dict(L, size=8.5)), (2, I("보강", ex=_ex(ex, "보강"), dv=",".join(PIL), align="center", size=8.5)),
           (2, "안전진단", dict(L, size=8.5)), (2, I("진단", ex=_ex(ex, "진단"), dv=",".join(PIL), align="center", size=8.5))], h=26)
    p.row([(3, "다음 할 일", L), (9, F("다음", '=IF({적정수}+{부적정수}=0,"","' + NEXT + '")', align="left", size=8))], h=42)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 점검 항목마다 적정 · 부적정을 고르고, 점검자 의견은 점검표 칸에 바로 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 해체 현장 — 비산 먼지 한 항목 부적정)."])
    return p


# ── 1쪽 · 2쪽 ───────────────────────────────────────────────────────────
#   원문 선(11-18 캔버스로 다시 잼 · notes/G766/구조.md): 선은 모두 가는 검은 줄 · 1쪽은 바깥 세로줄 없음 · 2쪽은 바깥 세로줄(123 · 1125) 있음
#   1쪽 정보 칸은 왼쪽 · 오른쪽 줄 높이가 엇갈림(왼 420 · 466 · 530 · 594 · 640 · 687 / 오른 420 · 483 · 547 · 594 · 640) — 담당 점검자 칸이 420 ~ 733
#   바탕: 해체장비 이름 칸 · «안전관리 체크리스트» 띠 · 3 ~ 6쪽 머리 띠 = 짙은 회색(D9D9D9) · 1쪽 정보 이름 칸 · 1쪽 점검 머리 = 옅은 회색(E5E5E5) · 2쪽 머리는 흰 바탕
PAX1 = [123, 223, 335, 365, 400, 512, 577, 607, 799, 867, 948, 1060, 1125]
GA1 = Grid(PAX1)
PAX2 = [123, 335, 365, 507, 799, 867, 948, 1125]
GA2 = Grid(PAX2)


def _fills():
    from openpyxl.styles import PatternFill
    return PatternFill("solid", fgColor="D9D9D9"), PatternFill("solid", fgColor="E5E5E5")


def _item_row(p, G, S, k, txt, pick, jb, ex, first=None):
    """점검 한 줄 — ▪ · 글(+ 고르는 칸 √) · 적정 ○ · 부적정 ○ · 의견"""
    if pick:
        pk, (a, b) = pick
        body = F("글" + k, '="' + txt + '   "&IF({셈!' + pk + '}="' + a + '","[√]","[   ]")&" ' + a + '   "&IF({셈!' + pk + '}="' + b + '","[√]","[   ]")&" ' + b + '"',
                 align="left", size=8)
    else:
        body = txt
    jb_off = '{셈!장비}="' + JANGBI[1] + '"'
    on = (lambda v: f'IF(AND({_res(k)}="{v}",NOT({jb_off})),"○","")') if jb else (lambda v: f'IF({_res(k)}="{v}","○","")')
    cells = ([first] if first else []) + [
        (335, 365, "▪", {"kind": "free", "size": 8, "align": "center"}),
        (365, 799, body, {"kind": "free", "size": 8, "align": "left", "wrap": True}),
        (799, 867, F("적" + k, "=" + on("적정"), align="center", size=10), NB),
        (867, 948, F("부" + k, "=" + on("부적정"), align="center", size=10), NB),
        (948, 1125, I("의견" + k, ex=_e(ex, "의견" + k), align="left", size=7.5), NB)]
    r = prow(p, G, cells, h=H_ITEM[k])
    for x in (335, 799, 867, 948):
        vline(p, G, r, r, x, S["thin"])
    return r


def _head(p, G, S, fill=None):
    band = {"kind": "free", "size": 9.5, "bold": True, "align": "center"}
    if fill is not None:
        band["fill"] = fill
    a = prow(p, G, [(123, 335, "점검항목", dict(band, rs=2)), (335, 799, "점검내용", dict(band, rs=2)), (799, 1125, "점검결과", band)], h=19)
    b = prow(p, G, [(799, 867, "적정", dict(band, size=9)), (867, 948, "부적정", dict(band, size=9)), (948, 1125, "점검자 의견", dict(band, size=9))], h=20)
    hline(p, G, a, 123, 1125, S["thin"], below=False)
    hline(p, G, a, 799, 1125, S["thin"])
    for x in (335, 799):
        vline(p, G, a, b, x, S["thin"])
    for x in (867, 948):
        vline(p, G, b, b, x, S["thin"])
    hline(p, G, b, 123, 1125, S["thin"])
    return a


def _sections(p, G, S, ex, secs):
    last = None
    for name, its in secs:
        rows = []
        for j, (k, txt, pick, jb) in enumerate(its):
            first = (123, 335, name, dict(SUBC, size=9.5, align="left", wrap=True, rs=len(its), indent=1)) if j == 0 else None
            rows.append(_item_row(p, G, S, k, txt, pick, jb, ex, first=first))
        for r in rows[:-1]:
            hline(p, G, r, 335, 1125, S["thin"])
        hline(p, G, rows[-1], 123, 1125, S["thin"])
        last = rows[-1]
    return last


def page1(bk, ex):
    S = _sides()
    짙, 옅 = _fills()
    p = g.pg(bk, ex, "1쪽", fit=1, widths=GA1.w)
    X1, X2 = 123, 1125
    T = S["thin"]

    def inp(k, **kw):
        kw.setdefault("size", 8.5)
        kw.setdefault("align", "left")
        return I(k, ex=_e(ex, k), **kw)

    prow(p, GA1, [(X1, X2, HEAD, {"kind": "free", "size": 7.5})], h=13)
    p.gap(6)
    prow(p, GA1, [(X1, X2, TITLE, {"kind": "free", "size": 17, "bold": True, "align": "center"})], h=26)
    prow(p, GA1, [(X1, X2, "(6쪽 중 1쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=13)
    jk = "{셈!장비}"
    a = prow(p, GA1, [(X1, 335, "해체장비\n탑재여부", dict(SUBC, size=9.5, wrap=True, fill=짙, rs=2)),
                      (335, X2, F("장비1", '=IF(' + jk + '="' + JANGBI[0] + '","☑","□")&" ' + JANGBI[0] + '"', align="left", size=9), dict(NB, indent=1))], h=22)
    b = prow(p, GA1, [(335, X2, F("장비2", '=IF(' + jk + '="' + JANGBI[1] + '","☑","□")&" ' + JANGBI[1] + '"', align="left", size=9), dict(NB, indent=1))], h=22)
    hline(p, GA1, a, X1, X2, T, below=False)
    vline(p, GA1, a, b, 335, T)
    hline(p, GA1, b, X1, X2, T)
    r = prow(p, GA1, [(X1, X2, "안전관리 체크리스트", {"kind": "free", "size": 9.5, "bold": True, "align": "left", "indent": 1, "fill": 짙})], h=25)
    hline(p, GA1, r, X1, X2, T)
    lab = dict(SUBC, size=8.5, fill=옅)
    sd = "{셈!점검일}"
    ilsi = F("표점검일시", '=IF(N(' + sd + ')=0,"",' + _ymd(sd) + '&" "&{셈!점검시각})', align="center", size=7.5)
    s0, s1 = "{셈!시작}", "{셈!끝}"
    gigan = F("표공사기간", '=IF(OR(N(' + s0 + ')=0,N(' + s1 + ')=0),"' + GIGAN0 + '",'
              'YEAR(' + s0 + ')&"년 "&MONTH(' + s0 + ')&"월 "&DAY(' + s0 + ')&"일 ~ "&YEAR(' + s1 + ')&"년 "&MONTH(' + s1 + ')&"월 "&DAY(' + s1 + ')&"일 ("&IF(' + s1 + '<' + s0 + ',"   ",' + s1 + '-' + s0 + '+1)&"일간)")',
              align="center", size=8)
    sm = {"kind": "free", "size": 8.5, "align": "left", "indent": 1}
    r0 = prow(p, GA1, [(X1, 223, "건축물 및\n해체현장\n정보", dict(lab, size=9.5, wrap=True, rs=9)), (223, 335, "구조형식", lab), (335, 799, inp("구조형식"), dict(NB, indent=1)),
                       (799, 948, "점검일시", lab), (948, X2, ilsi, NB)], h=22)
    rA = prow(p, GA1, [(223, 335, "층수", lab), (335, 400, "(지상)", sm), (400, 512, inp("지상", align="center"), NB), (512, 577, "(지하)", sm),
                       (577, 799, inp("지하", align="left"), NB), (799, 867, "담당\n점검자", dict(lab, size=9, wrap=True, rs=8)),
                       (867, 948, "소속", dict(lab, rs=2)), (948, X2, inp("소속"), dict(NB, rs=2, indent=1))], h=22)
    rB = prow(p, GA1, [(223, 335, "해체범위", dict(lab, rs=2)), (335, 799, inp("해체범위"), dict(NB, rs=2, indent=1))], h=8)
    rC = prow(p, GA1, [(867, 948, "직급", dict(lab, rs=2)), (948, X2, inp("직급"), dict(NB, rs=2, indent=1))], h=22)
    rD = prow(p, GA1, [(223, 335, "시공자", dict(lab, rs=2)), (335, 799, inp("시공자"), dict(NB, rs=2, indent=1))], h=8)
    rE = prow(p, GA1, [(867, 948, "연락처", lab), (948, X2, inp("점검자연락처"), dict(NB, indent=1))], h=22)
    rF = prow(p, GA1, [(223, 335, "현장소장", lab), (335, 512, inp("현장소장"), dict(NB, indent=1)), (512, 607, "연락처", lab), (607, 799, inp("소장연락처"), dict(NB, indent=1)),
                       (867, 948, "성명", lab), (948, 1060, inp("점검자", align="center"), NB), (1060, X2, "(서명)", {"kind": "free", "size": 8, "align": "center"})], h=22)
    rG = prow(p, GA1, [(223, 335, "공사기간", lab), (335, 799, gigan, NB), (867, 948, "비고", dict(lab, rs=2)), (948, X2, inp("비고"), dict(NB, rs=2, indent=1))], h=22)
    rH = prow(p, GA1, [(223, 335, "현장주소", lab), (335, 799, inp("현장주소"), dict(NB, indent=1))], h=22)
    # 가로줄(원문 그대로 엇갈림)
    hline(p, GA1, r0, 223, X2, T)
    for r in (rA, rC, rG):
        hline(p, GA1, r, 223, 799, T)
    for r in (rB, rD):
        hline(p, GA1, r, 867, X2, T)
    for r in (rE, rF):
        hline(p, GA1, r, 223, 799, T)
        hline(p, GA1, r, 867, X2, T)
    hline(p, GA1, rH, X1, X2, T)
    # 세로줄
    for x in (223, 335, 799, 948):
        vline(p, GA1, r0, rH, x, T)
    vline(p, GA1, rA, rH, 867, T)
    for x in (512, 607):
        vline(p, GA1, rF, rF, x, T)
    _head(p, GA1, S, fill=옅)
    _sections(p, GA1, S, ex, SEC[:4])
    p.gap(4)
    prow(p, GA1, [(X1, X2, "210mm×297mm[백상지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["해체장비 □ · 점검일시 · 공사기간 · 고르는 칸 √ · 적정 · 부적정 ○ 는 ① 장에서 들어옵니다. 점검자 의견은 칸에 바로 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 현장 · 회사 · 사람)."])
    return p


def page2(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "2쪽", fit=1, widths=GA2.w)
    X1, X2 = 123, 1125
    T = S["thin"]
    prow(p, GA2, [(X1, X2, "(6쪽 중 2쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    top = _head(p, GA2, S)
    _sections(p, GA2, S, ex, SEC[4:])
    lab = {"kind": "free", "size": 9.5, "align": "center"}

    def pick(key):
        return F("종합" + key, '=IF({셈!' + key + '}="필요","[√]","[   ]")&" 필요   "&IF({셈!' + key + '}="불필요","[√]","[   ]")&" 불필요"', align="left", size=9)

    a = prow(p, GA2, [(X1, 335, "종합점검결과", dict(lab, rs=3)), (335, 507, "긴급 안전조치", lab), (507, X2, pick("긴급"), dict(NB, indent=1))], h=22)
    b = prow(p, GA2, [(335, 507, "보강조치", lab), (507, X2, pick("보강"), dict(NB, indent=1))], h=22)
    c = prow(p, GA2, [(335, 507, "안전진단", lab), (507, X2, pick("진단"), dict(NB, indent=1))], h=22)
    for r in (a, b):
        hline(p, GA2, r, 335, X2, T)
    vline(p, GA2, a, c, 335, T)
    vline(p, GA2, a, c, 507, T)
    hline(p, GA2, c, X1, X2, T)
    r = prow(p, GA2, [(X1, 335, "의견 및 특기사항", lab), (335, X2, I("특기", ex=_e(ex, "특기"), align="left", size=8.5), dict(NB, indent=1, valign="top"))], h=156)
    vline(p, GA2, r, r, 335, T)
    hline(p, GA2, r, X1, X2, T)
    n1 = prow(p, GA2, [(X1, X2, NOTE1, {"kind": "free", "size": 8, "align": "left", "indent": 1})], h=18)
    n2 = prow(p, GA2, [(X1, X2, NOTE2, {"kind": "free", "size": 8, "align": "left", "indent": 1, "wrap": True})], h=26)
    hline(p, GA2, n2, X1, X2, T)
    # 2쪽만 바깥 세로줄(원문 123 · 1125 — 머리부터 ※ 끝까지)
    vline(p, GA2, top, n2, X1, T)
    vline(p, GA2, top, n2, X2, T)
    p.gap(4)
    prow(p, GA2, [(X1, X2, "210mm×297mm[백상지(80g/㎡)]", {"kind": "free", "size": 7, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["적정 · 부적정 ○ · 검토보고서 √ · 종합점검결과 √ 는 ① 장에서 들어옵니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 현장)."])
    return p


# ── 3 ~ 6쪽 ─────────────────────────────────────────────────────────────
PAX3 = [120, 279, 700, 1122]
GA3 = Grid(PAX3)


def _band(p, title):
    S = _sides()
    짙, _ = _fills()
    a = prow(p, GA3, [(120, 1122, title, {"kind": "free", "size": 10, "bold": True, "align": "center", "fill": 짙})], h=19)
    hline(p, GA3, a, 120, 1122, S["thin"], below=False)
    hline(p, GA3, a, 120, 1122, S["thin"])
    return a


def page3(bk, ex):
    S = _sides()
    p = g.pg(bk, ex, "3쪽", fit=1, widths=GA3.w)
    X1, X2 = 120, 1122
    prow(p, GA3, [(X1, X2, "(6쪽 중 3쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    _band(p, "안전점검표")
    r = prow(p, GA3, [(X1, 279, "그 밖에 안전관리를\n위하여 추가로\n확인이 필요한 사항", dict(SUBC, size=9, wrap=True)),
                      (279, X2, I("추가", ex=_e(ex, "추가"), align="left", size=9), dict(NB, indent=1, valign="top"))], h=690)
    vline(p, GA3, r, r, 279, S["thin"])
    hline(p, GA3, r, X1, X2, S["thin"])
    p.end_print()
    p.after_note(["그 밖에 확인이 필요한 사항을 적습니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 현장)."])
    return p


def _photo(bk, ex, name, page, title, rows, hrow):
    S = _sides()
    p = g.pg(bk, ex, name, fit=1, widths=GA3.w)
    X1, X2 = 120, 1122
    T = S["thin"]
    prow(p, GA3, [(X1, X2, f"(6쪽 중 {page}쪽)", {"kind": "free", "size": 7.5, "align": "right"})], h=14)
    _band(p, title)
    hd = {"kind": "free", "size": 9.5, "align": "center"}
    b = prow(p, GA3, [(X1, 279, "구분", hd), (279, 700, "사진", hd), (700, X2, "비고\n(상황설명 등)", dict(hd, wrap=True, size=9))], h=27)
    for x in (279, 700):
        vline(p, GA3, b, b, x, T)
    hline(p, GA3, b, X1, X2, T)
    for i, t in enumerate(rows):
        r = prow(p, GA3, [(X1, 279, t, dict(SUBC, size=9, wrap=True)), (279, 700, I(f"사진{page}_{i + 1}", align="center", size=9), NB),
                          (700, X2, I(f"비고{page}_{i + 1}", ex=_e(ex, f"비고{page}_{i + 1}"), align="left", size=8.5), dict(NB, indent=1))], h=hrow[i])
        for x in (279, 700):
            vline(p, GA3, r, r, x, T)
        hline(p, GA3, r, X1, X2, T)
    p.end_print()
    p.after_note(["사진 칸을 누르면 사이트에서 사진을 넣을 수 있습니다(종이에 붙여도 됩니다)."] if not ex else ["이 시트는 작성 예시입니다(사진 칸은 비워 두었습니다 — 실제 현장 사진을 넣으세요)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    page1(bk, ex)
    page2(bk, ex)
    page3(bk, ex)
    # 줄 높이(pt) — 원문 그림 줄(px) × 0.48: 4쪽 231 · 232 · 232 · 231 · 253 · 211 / 5쪽 약 194 × 7 / 6쪽 232 · 232 · 916
    _photo(bk, ex, "4쪽", 4, "임시시설물 및 건축물 외관조사", P4, [111, 111, 111, 111, 121, 101])
    _photo(bk, ex, "5쪽", 5, "구조안전계획에 따른 구조안전성 확인", P5, [93] * 7)
    _photo(bk, ex, "6쪽", 6, "그 밖의 안전대책 현황", P6, [111, 111, 440])


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _ymdp(d):
    return f"{d.year}. {d.month}. {d.day}."


def expect(pages):
    sm = pages["셈"]
    a, b1, b2 = {}, {}, {}
    off = sm.get("장비") == JANGBI[1]
    s0, s1 = sm.get("시작"), sm.get("끝")
    a["일간"] = "" if (not s0 or not s1) else ("⚠ 끝날이 시작일보다 앞입니다" if s1 < s0 else f"{(s1 - s0).days + 1}일간(첫날 · 끝날 넣어 셈)")

    def r(k):
        return sm.get("결과" + k)

    ok = sum(1 for k, _, _, jb in ITEMS if r(k) == "적정" and not (jb and off))
    bu = sum(1 for k, _, _, jb in ITEMS if r(k) == "부적정" and not (jb and off))
    need = len(ITEMS) - (len(JB_KEYS) if off else 0)
    a["적정수"], a["부적정수"], a["점검수"] = ok, bu, need
    if ok + bu == 0:
        a["부적정"] = a["안고름"] = a["다음"] = ""
    else:
        a["부적정"] = BU_OK if bu == 0 else f"{BU_A}{bu}: " + _cutp([SHORTN[k] for k, _, _, jb in ITEMS if r(k) == "부적정" and not (jb and off)])
        miss = [SHORTN[k] for k, _, _, jb in ITEMS if not r(k) and not (jb and off)]
        a["안고름"] = BIN_OK if ok + bu == need else f"{BIN_A}{need - ok - bu}: " + _cutp(miss)
        a["다음"] = NEXT
    jb = sm.get("장비")
    b1["장비1"] = ("☑" if jb == JANGBI[0] else "□") + " " + JANGBI[0]
    b1["장비2"] = ("☑" if jb == JANGBI[1] else "□") + " " + JANGBI[1]
    sd = sm.get("점검일")
    b1["표점검일시"] = "" if not sd else f"{_ymdp(sd)} {sm.get('점검시각') or ''}"
    if not s0 or not s1:
        b1["표공사기간"] = GIGAN0
    else:
        b1["표공사기간"] = (f"{s0.year}년 {s0.month}월 {s0.day}일 ~ {s1.year}년 {s1.month}월 {s1.day}일 ("
                         + ("   " if s1 < s0 else str((s1 - s0).days + 1)) + "일간)")
    for k, txt, pick, jbk in ITEMS:
        tgt = b1 if k[0] in "hsji" else b2
        if pick:
            pk, (x, y) = pick
            v = sm.get(pk)
            tgt["글" + k] = f"{txt}   " + ("[√]" if v == x else "[   ]") + f" {x}   " + ("[√]" if v == y else "[   ]") + f" {y}"
        vv = r(k)
        tgt["적" + k] = "○" if (vv == "적정" and not (jbk and off)) else ""
        tgt["부" + k] = "○" if (vv == "부적정" and not (jbk and off)) else ""
    for key in ("긴급", "보강", "진단"):
        v = sm.get(key)
        b2["종합" + key] = ("[√]" if v == "필요" else "[   ]") + " 필요   " + ("[√]" if v == "불필요" else "[   ]") + " 불필요"
    return {"셈": a, "1쪽": b1, "2쪽": b2}
