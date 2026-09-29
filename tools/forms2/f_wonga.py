# -*- coding: utf-8 -*-
"""공사원가계산서 — 조달청식 비목·산출 기준(2026년 설계서 원가계산서 실물과 대조).

산출 기준(칸 이름 → 식)
  간접노무비  = 직접노무비 × 율
  산재·고용   = 노무비(직접+간접) × 율
  건강·연금·퇴직공제 = 직접노무비 × 율       ← 노무비 계가 아님(조달청식)
  노인장기요양 = 건강보험료 × 율
  산업안전보건관리비 = MIN((재료비+직접노무비+도급자설치 관급÷1.1)×율+기초액,
                           ((재료비+직접노무비)×율+기초액)×1.2)
  환경보전비·지급보증 수수료 = 직접공사비(재료비+직접노무비+기계경비) × 율
  기타경비   = (재료비+노무비) × 율
  임금채권부담금·석면분담금 = 노무비 × 율
  일반관리비 = 순공사원가 × 율,  이윤 = (노무비+경비+일반관리비) × 율
  부가세     = (총원가+손해보험료) × 율,  도급액 = 절사 단위 아래 버림
  각 비목은 원 미만 버림.
"""
from decimal import Decimal as D, ROUND_FLOOR

from fb import F, I, TR

SLUG = "wonga"
TITLE = "공사원가계산서"
WHERE = "forms"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
SHORT = "재료비·노무비·경비에 간접비와 이윤을 얹어 공사비를 세우는 표입니다. 조달청식 비목·수식과 2026년 법정 요율이 들어 있습니다."

W = [3.4, 3.4, 24, 16, 31, 9, 13]   # 대구분 · 중구분 · 비목 · 금액 · 산출근거 · 요율 · 비고


def draw(bk, ex):
    p = bk.page("공사원가계산서" if not ex else "작성 예시", W, ex=ex, fit_height=1,
                sheetname=None if not ex else "작성 예시")
    n = p.ncol
    p.gap(4)
    p.title("공 사 원 가 계 산 서", h=36)
    p.gap(4)
    p.row([(3, "공 사 명", {"kind": "label"}), (4, I("공사명", ex="가나지구 배수로 정비공사"))], h=22)
    p.row([(3, "발 주 기 관", {"kind": "label"}), (2, I("발주기관", ex="가나시 건설과")),
           (1, "작성일", {"kind": "label"}), (1, I("작성일", ex=_d(2026, 9, 29), fmt="ymd"))], h=22)
    p.row([(3, "도 급 액", {"kind": "label"}), (2, F("도급액_한글", "={도급액}", fmt="hangul", align="left")),
           (2, F("도급액_숫자", "={도급액}", fmt="wonsign", align="center"))], h=22)
    p.gap(6)
    p.row([(2, "구 분", {"kind": "head"}), (1, "비    목", {"kind": "head"}), (1, "금    액", {"kind": "head"}),
           (1, "산 출 근 거", {"kind": "head"}), (1, "요 율", {"kind": "head"}), (1, "비 고", {"kind": "head"})], h=22)

    def line(name, val, basis="", rate=None, note=None, fmt="won", nkind="text"):
        cells = [(1, name, {"kind": nkind, "indent": 1 if nkind == "text" else 0, "align": None if nkind == "text" else "center"}),
                 (1, val, {"fmt": fmt}),
                 (1, basis, {"kind": "text", "size": 8.5}),
                 (1, rate if rate is not None else "", {"fmt": getattr(rate, "fmt", None) or "rate", "align": "center"} if rate is not None else {}),
                 (1, note if note is not None else "", {"size": 8.5} if isinstance(note, str) else {"fmt": '"기초 "#,##0;;""', "size": 8.5})]
        return p.row(cells, minh=18, start=3)

    # ── 재료비 ───────────────────────────────────────────
    r0 = p.r
    line("직접재료비", I("재직", ex=312_456_700, fmt="won"), "재료비 집계표(내역서)")
    line("간접재료비", I("재간", ex=4_870_000, fmt="won"), "소모·보조 재료")
    line("작업설·부산물 등(△)", I("재부", ex=1_250_000, fmt="won"), "되파는 고철 등 — 빼는 금액을 양수로")
    line("소    계", F("재계", "={재직}+{재간}-{재부}", fmt="won"), "직접 + 간접 − 작업설", nkind="sum")
    p.vlabel(r0, p.r - 1, 2, "재료비")

    r1 = p.r
    line("직접노무비", I("직노", ex=268_345_000, fmt="won"), "노무비 집계표(내역서)")
    line("간접노무비", F("간노", "=" + TR("{직노}*{간노율}"), fmt="won"), "직접노무비 × 율",
         I("간노율", ex=0.145, rate=True, fmt="rate"))
    line("소    계", F("노계", "={직노}+{간노}", fmt="won"), "직접노무비 + 간접노무비", nkind="sum")
    p.vlabel(r1, p.r - 1, 2, "노무비")

    r2 = p.r
    line("기계경비", I("기계", ex=86_720_000, fmt="won"), "장비 사용료 집계(내역서)")
    line("산재보험료", F("산재", "=" + TR("{노계}*{산재율}"), fmt="won"), "노무비 × 율",
         I("산재율", ex=0.0356, blank=0.0356, rate=True, fmt="rate"), "2026년 요율")
    line("고용보험료", F("고용", "=" + TR("{노계}*{고용율}"), fmt="won"), "노무비 × 율",
         I("고용율", ex=0.0101, blank=0.0101, rate=True, fmt="rate"), "2026년 요율")
    line("국민건강보험료", F("건강", "=" + TR("{직노}*{건강율}"), fmt="won"), "직접노무비 × 율",
         I("건강율", ex=0.03595, blank=0.03595, rate=True, fmt="rate"), "2026년 요율")
    line("국민연금보험료", F("연금", "=" + TR("{직노}*{연금율}"), fmt="won"), "직접노무비 × 율",
         I("연금율", ex=0.0475, blank=0.0475, rate=True, fmt="rate"), "2026년 요율")
    line("노인장기요양보험료", F("노인", "=" + TR("{건강}*{노인율}"), fmt="won"), "건강보험료 × 율",
         I("노인율", ex=0.1314, blank=0.1314, rate=True, fmt="rate"), "2026년 요율")
    line("퇴직공제부금", F("퇴직", "=" + TR("{직노}*{퇴직율}"), fmt="won"), "직접노무비 × 율 (대상 공사만)",
         I("퇴직율", ex=0.023, rate=True, fmt="rate"))
    line("산업안전보건관리비",
         F("산안", "=" + TR("MIN(({재계}+{직노}+{관급도}/1.1)*{산안율}+{산안기초},(({재계}+{직노})*{산안율}+{산안기초})*1.2)"), fmt="won"),
         "(재료비+직접노무비+도급자설치 관급÷1.1)×율+기초액(비고 칸) — 관급 뺀 값의 1.2배 한도",
         I("산안율", ex=0.0253, rate=True, fmt="rate"), I("산안기초", ex=3_300_000, rate=True))
    line("안전관리비", I("안전", ex=5_200_000, fmt="won"), "건설기술진흥법 — 대상 공사면 산출해 적기")
    line("품질관리비", I("품질", ex=3_150_000, fmt="won"), "품질시험·관리비 산출해 적기")
    line("환경보전비", F("환경", "=" + TR("({재계}+{직노}+{기계})*{환경율}"), fmt="won"),
         "직접공사비(재료비+직접노무비+기계경비) × 율", I("환경율", ex=0.005, rate=True, fmt="rate"))
    line("기타경비", F("기타", "=" + TR("({재계}+{노계})*{기타율}"), fmt="won"), "(재료비 + 노무비) × 율",
         I("기타율", ex=0.055, rate=True, fmt="rate"))
    line("하도급대금 지급보증서 발급수수료", F("하보", "=" + TR("({재계}+{직노}+{기계})*{하보율}"), fmt="won"),
         "직접공사비 × 율", I("하보율", ex=0.00081, rate=True, fmt="rate"))
    line("건설기계대여대금 지급보증서 발급수수료", F("기보", "=" + TR("({재계}+{직노}+{기계})*{기보율}"), fmt="won"),
         "직접공사비 × 율", I("기보율", ex=0.00076, rate=True, fmt="rate"))
    line("임금채권부담금", F("임금", "=" + TR("{노계}*{임금율}"), fmt="won"), "노무비 × 율",
         I("임금율", ex=0.0009, blank=0.0009, rate=True, fmt="rate"), "2026년 요율")
    line("석면피해구제분담금", F("석면", "=" + TR("{노계}*{석면율}"), fmt="won"), "노무비 × 율",
         I("석면율", ex=0.00006, blank=0.00006, rate=True, fmt="rate"), "2026년 요율")
    line("그 밖의 경비", I("경기타", ex=2_000_000, fmt="won"), "공사이행보증·지급수수료 등 산출해 적기")
    line("소    계", F("경계", f"=SUM(D{r2}:D{p.r - 1})", fmt="won"), "경비 합계", nkind="sum")
    p.vlabel(r2, p.r - 1, 2, "경  비")
    p.vlabel(r0, p.r - 1, 1, "순 공 사 원 가")


    def big(name, val, basis="", rate=None, note=None, kind="label"):
        cells = [(3, name, {"kind": kind}), (1, val, {"fmt": "won", "bold": kind == "sum"}),
                 (1, basis, {"kind": "text", "size": 8.5}),
                 (1, rate if rate is not None else "", {"fmt": getattr(rate, "fmt", None) or "rate", "align": "center"} if rate is not None else {}),
                 (1, note or "", {"size": 8.5})]
        return p.row(cells, minh=18)

    big("순공사원가 (계)", F("순원가", "={재계}+{노계}+{경계}", fmt="won"), "재료비 + 노무비 + 경비", kind="sum")
    big("일 반 관 리 비", F("일관", "=" + TR("{순원가}*{일관율}"), fmt="won"), "순공사원가 × 율",
        I("일관율", ex=0.065, rate=True, fmt="rate"))
    big("이          윤", F("이윤", "=" + TR("({노계}+{경계}+{일관})*{이윤율}"), fmt="won"),
        "(노무비 + 경비 + 일반관리비) × 율", I("이윤율", ex=0.15, rate=True, fmt="rate"))
    big("사 급 자 재 비", I("사급", ex=None, fmt="won"), "일반관리비·이윤을 붙이지 않는 자재(해당 시)")
    big("총원가 (공급가액)", F("총원가", "={순원가}+{일관}+{이윤}+{사급}", fmt="won"),
        "순공사원가 + 일반관리비 + 이윤 + 사급자재", kind="sum")
    big("공사손해보험료", I("손보", ex=1_450_000, fmt="won"), "보험·공제 요율로 산출해 적기(해당 시)")
    big("부 가 가 치 세", F("부가세", "=" + TR("({총원가}+{손보})*{부가율}"), fmt="won"),
        "(총원가 + 공사손해보험료) × 율", I("부가율", ex=0.1, blank=0.1, rate=True, fmt="rate"))
    big("폐 기 물 처 리 비", I("폐기물", ex=12_870_000, fmt="won"), "별도 계상(부가세 포함) — 해당 시")
    big("도   급   액", F("도급액", "=IF({절사}>0,INT(ROUND(({총원가}+{손보}+{부가세}+{폐기물})/{절사},6))*{절사},{총원가}+{손보}+{부가세}+{폐기물})", fmt="won"),
        "총원가+손해보험료+부가세+폐기물 — 요율 칸의 단위 아래 버림", I("절사", ex=1000, blank=1000, rate=True, fmt='#,##0"원"'),
        "1이면 안 버림", kind="sum")
    big("관급자재비(도급자 설치)", I("관급도", ex=45_600_000, fmt="won"), "발주기관이 주고 시공사가 설치(부가세 포함)")
    big("관급자재비(발주자 설치)", I("관급발", ex=None, fmt="won"), "발주기관이 사서 직접 설치")
    big("총   공   사   비", F("총공사비", "={도급액}+{관급도}+{관급발}", fmt="won"), "도급액 + 관급자재비", kind="sum")

    p.gap(10)
    p.sign_block([("작 성 자", "작성자", "김철수"), ("현장대리인", "현장대리인", "이영희")], lab_span=1, val_span=1, left=4)
    p.end_print()
    p.after_note([
        "노란 칸 = 요율·기준값입니다. 발주기관(설계서) 기준을 확인해 고쳐 쓰세요. «2026년 요율» 은 전국 공통 법정 요율입니다.",
        "하늘색 칸 = 자동 계산 칸입니다(지우지 마세요). 각 비목은 원 미만 버림입니다.",
        "산업안전보건관리비 요율·기초액은 공사 종류와 대상액 구간에 따라 다릅니다 — k-conmap.com 산안비 계산기로 확인하세요.",
        "발주기관이 정한 서식이 있으면 그 서식을 쓰세요. 이 줄과 1행은 인쇄되지 않거나 지워도 됩니다.",
    ] if not ex else ["이 시트는 작성 예시입니다(가상의 공사). 실제로는 앞 시트에 적으세요."])
    return p


def _d(y, m, d):
    import datetime
    return datetime.date(y, m, d)


def _tr(x):
    return int(D(x).to_integral_value(rounding=ROUND_FLOOR))


def expect(inp):
    """파이썬으로 따로 계산(Decimal) — 엑셀 수식과 원 단위까지 대조합니다."""
    g = {k: D(str(v)) if v is not None and not hasattr(v, "year") and not isinstance(v, str) else (D(0) if v is None else v)
         for k, v in inp.items()}
    e = {}
    e["재계"] = g["재직"] + g["재간"] - g["재부"]
    e["간노"] = _tr(g["직노"] * g["간노율"])
    e["노계"] = g["직노"] + e["간노"]
    e["산재"] = _tr(e["노계"] * g["산재율"])
    e["고용"] = _tr(e["노계"] * g["고용율"])
    e["건강"] = _tr(g["직노"] * g["건강율"])
    e["연금"] = _tr(g["직노"] * g["연금율"])
    e["노인"] = _tr(e["건강"] * g["노인율"])
    e["퇴직"] = _tr(g["직노"] * g["퇴직율"])
    a = (e["재계"] + g["직노"] + g["관급도"] / D("1.1")) * g["산안율"] + g["산안기초"]
    b = ((e["재계"] + g["직노"]) * g["산안율"] + g["산안기초"]) * D("1.2")
    e["산안"] = _tr(min(a, b))
    direct = e["재계"] + g["직노"] + g["기계"]
    e["환경"] = _tr(direct * g["환경율"])
    e["기타"] = _tr((e["재계"] + e["노계"]) * g["기타율"])
    e["하보"] = _tr(direct * g["하보율"])
    e["기보"] = _tr(direct * g["기보율"])
    e["임금"] = _tr(e["노계"] * g["임금율"])
    e["석면"] = _tr(e["노계"] * g["석면율"])
    e["경계"] = (g["기계"] + e["산재"] + e["고용"] + e["건강"] + e["연금"] + e["노인"] + e["퇴직"] + e["산안"]
               + g["안전"] + g["품질"] + e["환경"] + e["기타"] + e["하보"] + e["기보"] + e["임금"] + e["석면"] + g["경기타"])
    e["순원가"] = e["재계"] + e["노계"] + e["경계"]
    e["일관"] = _tr(e["순원가"] * g["일관율"])
    e["이윤"] = _tr((e["노계"] + e["경계"] + e["일관"]) * g["이윤율"])
    e["총원가"] = e["순원가"] + e["일관"] + e["이윤"] + g["사급"]
    e["부가세"] = _tr((e["총원가"] + g["손보"]) * g["부가율"])
    s = e["총원가"] + g["손보"] + e["부가세"] + g["폐기물"]
    e["도급액"] = _tr(s / g["절사"]) * g["절사"] if g["절사"] > 0 else s
    e["총공사비"] = e["도급액"] + g["관급도"] + g["관급발"]
    e["도급액_한글"] = e["도급액"]
    e["도급액_숫자"] = e["도급액"]
    return {k: int(v) for k, v in e.items()}
