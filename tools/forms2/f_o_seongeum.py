# -*- coding: utf-8 -*-
"""선금 신청서 한 벌(공문 · 신청서 · 신청 사유서 · 사용계획서 · 청구서 · 이행각서) — 원본 틀(6장)을 새로 만든 것.

■ «신청서» 시트에만 적으면 나머지 다섯 장이 저절로 채워집니다(공사명·금액·날짜·회사).
■ 선금 한도 = 기준금액(차수 계약금액이 있으면 그것, 없으면 총 계약금액) × 한도율(노란 칸, 계약조건 확인)
■ 사용계획: 공급가액 = 금액 ÷ 1.1 (원 단위 반올림), 부가세 = 금액 − 공급가액 → 두 칸의 합이 금액과 꼭 맞습니다.
"""
import datetime

from fb import F, I, TR

SLUG = "o-seongeum"
TITLE = "선금 신청서"
WHERE = "orig"
PREV = [(2, "신청서 — 빈 서식"), (8, "신청서 — 작성 예시"), (7, "공문 — 작성 예시(신청서에서 저절로)")]
PAGES = 6
NSHEETS = 6
SHORT = "공문, 선금 신청서, 신청 사유서, 사용계획서, 청구서, 각서를 한 파일에 담은 선금 서류입니다. 신청서에만 적으면 나머지 다섯 장이 저절로 채워집니다."
NOTE = "«신청서» 시트에만 적으면 공문·사유서·사용계획서·청구서·각서가 저절로 채워집니다. 선금 한도율(노란 칸)은 계약조건(특수조건)을 확인해 적으세요."
MULTI = True

W = [5, 21, 16, 13, 13, 13, 13]
N = 7
D = datetime.date
HANGUL = '[DBNum4][$-412]"일금 "General"원정";;""'
WON = '"₩"#,##0;;""'
SHEETS = ["공문", "신청서", "신청사유서", "사용계획서", "청구서", "각서"]
USE = [("재 료 비", 120_000_000, "착공 후 1개월", "관·자재 선구매"), ("장 비 비", 60_000_000, "착공 후 2개월", ""),
       ("노 무 비", 70_000_000, "착공 후 2개월", "노임 지급"), ("경    비", 20_000_000, "착공 후 1개월", ""),
       ("일반관리비", 10_000_000, "착공 후 1개월", "")]
REASON = ("위 공사에 필요한 자재 구입과 장비 투입, 노임 지급 등 초기 공사비를 미리 확보하여 "
          "공사를 차질 없이 추진하고자 선금을 신청합니다.")


def LK(k, fmt=None):
    """신청서 칸을 끌어옴 — 비어 있으면 0 이 아니라 빈칸."""
    return F(None, f'=IF(신청서!{k}="","",신청서!{k})'.replace("신청서!" + k, "{신청서!" + k + "}"), fmt=fmt)


def _pg(bk, ex, name):
    return bk.page(name, W, ex=ex, fit_height=1, sheetname=name if not ex else "예시-" + name)


def _info(p, ex, src):
    """1~8 줄: 신청서면 입력칸, 나머지 시트면 신청서에서 끌어옴."""
    L = {"kind": "label", "align": "left", "indent": 1}
    rows = [("1. 공   사   명", "공사명", "text", "가나지구 배수로 정비공사"),
            ("2. 총 계약금액", "계약금액", "won", 1_842_650_000),
            ("3. 차수 계약금액", "차수금액", "won", 963_241_000),
            ("4. 계 약 연월일", "계약일", "date", D(2026, 3, 2)),
            ("5. 착 공 연월일", "착공일", "date", D(2026, 3, 9)),
            ("6. 총 준공 연월일", "준공일", "date", D(2027, 6, 30)),
            ("7. 차수 준공일", "차수준공일", "date", D(2026, 12, 31)),
            ("8. 선금 신청금액", "신청금액", "won", 280_000_000)]
    for lab, k, t, exv in rows:
        if t == "won":
            v = I(k, ex=exv, fmt=WON) if src else LK(k, fmt=WON)
            p.row([(2, lab, L), (2, v), (3, F(None, "=" + (f"{{{k}}}" if src else f"{{신청서!{k}}}"), fmt=HANGUL, align="left"))], h=23)
        elif t == "date":
            v = I(k, ex=exv, fmt="date", align="left") if src else LK(k, fmt="date")
            p.row([(2, lab, L), (5, v, {"align": "left"})], h=23)
        else:
            v = I(k, ex=exv) if src else LK(k)
            p.row([(2, lab, L), (5, v)], h=23)


def _foot(p, ex, src, sent_key="신청일"):
    """날짜 · 회사 · 수신 — 신청서에서 입력, 나머지는 끌어옴."""
    p.gap(10)
    if src:
        p.date_line("신청일", ex=D(2026, 3, 16))
    else:
        p.row([(p.pc, F(None, '=IF(ISNUMBER({신청서!신청일}),{신청서!신청일},"          년        월        일")', fmt="date",
                        align="center", ink=False), {"border": False})], h=26)
    p.gap(6)
    for lab, k, exv, tail in (("주      소", "주소", "가나시 마바로 45, 2층", ""), ("상      호", "상호", "예시건설(주)", ""),
                              ("대  표  자", "대표자", "홍길동", "(인)")):
        v = I(k, ex=exv, align="center") if src else F(None, f'=IF({{신청서!{k}}}="","",{{신청서!{k}}})', align="center", ink=False)
        p.row([(3, "", {"kind": "free"}), (1, lab, {"kind": "free", "bold": True, "align": "center"}),
               (2, v, {"border": False}), (1, tail, {"kind": "free", "align": "center", "size": 9})], h=24)
    p.gap(12)
    v = (I("수신", ex="가나시장 귀하", blank="                           귀하", size=13, bold=True, align="left") if src
         else F(None, '={신청서!수신}', size=13, bold=True, align="left", ink=False))
    p.row([(p.pc, v, {"border": False, "kind": "free"})], h=26)


def draw(bk, ex):
    L = {"kind": "label"}
    H = {"kind": "head"}
    # ── 공문 ────────────────────────────────────────────
    p = _pg(bk, ex, "공문")
    p.gap(6)
    p.row([(p.pc, F(None, '=IF({신청서!상호}="","(회 사 명)",{신청서!상호})', size=20, bold=True, align="center", ink=False),
            {"border": False})], h=40)
    p.row([(p.pc, I("연락처", ex="가나시 마바로 45, 2층   전화 000-000-0000   팩스 000-000-0000",
                     blank="주소                        전화                    팩스", align="center", size=9), {"border": False})], h=18)
    p.row([(p.pc, "", {"kind": "free", "border": False})], h=4)
    from openpyxl.styles import Border, Side
    thick = Side(style="medium", color="111827")
    for c in range(1, p.pc + 1):
        p.ws.cell(row=p.r - 1, column=c).border = Border(bottom=thick)
    p.gap(8)
    FL = {"kind": "free", "bold": True}
    p.row([(2, "문 서 번 호 :", FL), (5, I("문서번호", ex="예시건설 제2026-031호"), {"border": False})], h=22)
    p.row([(2, "시 행 일 자 :", FL), (5, F(None, '=IF(ISNUMBER({신청서!신청일}),{신청서!신청일},"")', fmt="date", align="left", ink=False),
                                        {"border": False})], h=22)
    p.row([(2, "수        신 :", FL), (5, I("공문수신", ex="가나시장 (참조: 건설과장)"), {"border": False})], h=22)
    p.row([(2, "경        유 :", FL), (5, I("경유", ex=None), {"border": False})], h=22)
    p.row([(2, "제        목 :", FL), (5, I("제목", ex="선금 신청서 제출", blank="선금 신청서 제출", bold=True), {"border": False})], h=22)
    p.row([(p.pc, "", {"kind": "free"})], h=4)
    for c in range(1, p.pc + 1):
        p.ws.cell(row=p.r - 1, column=c).border = Border(bottom=Side(style="thin", color="111827"))
    p.gap(12)
    p.row([(1, "1.", {"kind": "cfree"}), (6, "귀 기관의 무궁한 발전을 기원합니다.", {"kind": "free"})], h=24)
    p.row([(1, "2.", {"kind": "cfree", "valign": "top"}),
           (6, F("본문2", '="당사가 귀 기관과 계약한 「"&IF({신청서!공사명}="","                    ",{신청서!공사명})&"」에 대하여 '
                          '선금 신청서를 붙임과 같이 제출하오니 검토 후 지급하여 주시기 바랍니다."', align="left", ink=False),
            {"kind": "free", "valign": "top"})], h=40)
    p.gap(10)
    att = ["선금 신청서 1부", "선금 신청 사유서 1부", "선금 사용계획서 1부", "선금 청구서 1부", "선금 지급조건 이행각서 1부",
           "선금 보증서(보증보험증권) 1부.  끝."]
    for i, a in enumerate(att):
        p.row([(1, "붙임" if i == 0 else "", {"kind": "cfree"}), (6, f"{i+1}. {a}", {"kind": "free"})], h=20)
    p.gap(40)
    p.row([(p.pc, F(None, '=IF({신청서!상호}="","(회사명)   대표   (이름)",{신청서!상호}&"   대표   "&{신청서!대표자})', size=15, bold=True,
                    align="center", ink=False), {"border": False})], h=30)
    p.end_print()
    p.after_note(["공문은 «신청서» 시트의 공사명·회사·날짜를 끌어옵니다. 문서번호·수신·경유만 여기에 적으세요."] if not ex
                 else ["작성 예시입니다(가상의 회사·공사)."])

    # ── 신청서(원천) ─────────────────────────────────────
    p = _pg(bk, ex, "신청서")
    p.gap(6)
    p.title("선 금 신 청 서", h=40)
    p.gap(8)
    _info(p, ex, True)
    p.gap(6)
    p.row([(2, "선금 한도 확인", {"kind": "label"}), (1, "한도율", {"kind": "label"}),
           (1, I("한도율", ex=0.7, rate=True, fmt="rate", align="center")),
           (1, "한 도 액", {"kind": "label"}), (2, F("한도액", "=" + TR("IF(N({차수금액})>0,{차수금액},N({계약금액}))*N({한도율})"), fmt="won"))], h=22)
    p.row([(2, "", {"kind": "label"}), (1, "신청 비율", {"kind": "label"}),
           (1, F("신청비율", '=IF(N({차수금액})+N({계약금액})=0,"",N({신청금액})/IF(N({차수금액})>0,{차수금액},{계약금액}))', fmt="pct", align="center")),
           (3, F("한도판정", '=IF(N({신청금액})=0,"",IF(N({한도율})=0,"← 한도율을 적으세요",IF({신청금액}>{한도액},"⚠ 한도를 넘었습니다","한도 이내")))',
                 align="center", bold=True))], h=22)
    p.gap(8)
    p.row([(2, "구    분", H), (2, "금액(부가세 포함)", H), (1, "공급가액", H), (1, "부가가치세", H), (1, "비  고", H)], h=22)
    t0 = p.r
    for i in range(N):
        rr = p.r
        u = USE[i] if (ex and i < len(USE)) else None
        nm = USE[i][0] if i < len(USE) else None
        p.row([(2, I(f"항목#{i+1}", ex=nm, blank=nm, align="center")),
               (2, I(f"금액#{i+1}", ex=u[1] if u else None, fmt="won")),
               (1, F(f"공급#{i+1}", f'=IF(C{rr}="","",ROUND(C{rr}/1.1,0))', fmt="won")),
               (1, F(f"부가#{i+1}", f'=IF(C{rr}="","",C{rr}-E{rr})', fmt="won")),
               (1, I(f"비고#{i+1}", ex=(u[3] or None) if u else None, size=8.5))], h=21)
    t1 = p.r - 1
    S = {"kind": "sum"}
    r = p.r
    p.row([(2, "합    계", S), (2, F("합금액", f"=SUM(C{t0}:C{t1})", fmt="won", bold=True)),
           (1, F("합공급", f"=SUM(E{t0}:E{t1})", fmt="won", bold=True)), (1, F("합부가", f"=SUM(F{t0}:F{t1})", fmt="won", bold=True)),
           (1, "", S)], h=22)
    p.row([(p.pc, F("합대조", f'=IF(OR(N({{신청금액}})=0,C{r}=0),"",IF(C{r}={{신청금액}},"","⚠ 합계가 신청금액과 "&TEXT(ABS(C{r}-{{신청금액}}),"#,##0")&"원 다릅니다"))',
                    align="left", size=9), {"kind": "warn", "border": False})], h=16)
    p.gap(4)
    p.para("위와 같이 관계 법령과 계약조건에 따라 선금을 신청합니다.", align="center", h=26)
    _foot(p, ex, True)
    p.end_print()
    p.after_note(["이 시트에만 적으면 공문·사유서·사용계획서·청구서·각서가 저절로 채워집니다.",
                  "노란 칸(한도율)은 계약조건(특수조건)에 적힌 선금 한도율을 적으세요. 차수 계약이 없으면 3번 칸은 비워 두세요.",
                  "발주기관이 정한 서식이 있으면 그 서식을 쓰세요."] if not ex else ["작성 예시입니다(가상의 회사·공사)."])

    # ── 신청 사유서 ─────────────────────────────────────
    p = _pg(bk, ex, "신청사유서")
    p.gap(6)
    p.title("선 금 신 청 사 유 서", h=40)
    p.gap(8)
    _info(p, ex, False)
    p.row([(2, "9. 신 청 사 유", {"kind": "label", "align": "left", "indent": 1}), (5, I("사유", ex=REASON, blank=REASON), {"valign": "top"})], h=70)
    _foot(p, ex, False)
    p.end_print()

    # ── 사용계획서 ───────────────────────────────────────
    p = _pg(bk, ex, "사용계획서")
    p.gap(6)
    p.title("선 금 사 용 계 획 서", h=40)
    p.gap(8)
    _info(p, ex, False)
    p.row([(p.pc, "9. 사용 계획 (부가세 포함)", {"kind": "h2"})], h=24)
    p.row([(2, "항    목", H), (2, "금    액", H), (1, "사용 시기", H), (2, "비    고", H)], h=22)
    u0 = p.r
    for i in range(N):
        rr = p.r
        u = USE[i] if (ex and i < len(USE)) else None
        p.row([(2, F(None, f'=IF({{신청서!항목#{i+1}}}="","",{{신청서!항목#{i+1}}})', align="center", ink=False)),
               (2, F(f"사용금액#{i+1}", f'=IF({{신청서!금액#{i+1}}}="","",{{신청서!금액#{i+1}}})', fmt="won")),
               (1, I(f"시기#{i+1}", ex=u[2] if u else None, align="center", size=9)),
               (2, F(None, f'=IF({{신청서!비고#{i+1}}}="","",{{신청서!비고#{i+1}}})', align="left", size=9, ink=False))], h=21)
    u1 = p.r - 1
    p.row([(2, "합    계", {"kind": "sum"}), (2, F("사용합계", f"=SUM(C{u0}:C{u1})", fmt="won", bold=True)), (3, "", {"kind": "sum"})], h=22)
    _foot(p, ex, False)
    p.end_print()

    # ── 청구서 ──────────────────────────────────────────
    p = _pg(bk, ex, "청구서")
    p.gap(6)
    p.title("선  금  청  구  서", h=40)
    p.gap(8)
    _info(p, ex, False)
    p.gap(8)
    p.row([(2, "청 구 금 액", {"kind": "label"}), (2, F("청구금액", '=IF(N({신청서!신청금액})=0,"",{신청서!신청금액})', fmt=WON)),
           (3, F(None, "={신청서!신청금액}", fmt=HANGUL, align="left"))], h=26)
    p.gap(8)
    p.para("위 선금을 청구합니다.", align="center", h=26)
    p.gap(4)
    p.row([(2, "◆ 지 급 계 좌", {"kind": "free", "bold": True}), (5, I("계좌", ex="예시은행 000-000000-00-000"), {"border": False})], h=22)
    p.row([(2, "◆ 예  금  주", {"kind": "free", "bold": True}), (5, I("예금주", ex="예시건설(주)"), {"border": False})], h=22)
    _foot(p, ex, False)
    p.end_print()

    # ── 이행각서 ────────────────────────────────────────
    p = _pg(bk, ex, "각서")
    p.gap(6)
    p.title("선금 지급조건 이행각서", h=40)
    p.gap(8)
    _info(p, ex, False)
    p.gap(8)
    p.row([(p.pc, F("각서머리", '=IF({신청서!상호}="","당사는",{신청서!상호}&"는(은)")&" 위 공사의 선금을 받으면서 다음 사항을 지킬 것을 약속합니다."',
                    align="left", ink=False), {"kind": "free"})], h=24)
    items = ["선금은 이 계약의 목적을 이루는 데에만 쓰고 다른 곳에 쓰지 않겠습니다.",
             "노임·자재대금·장비대금을 제때 지급하여 공사가 늦어지는 일이 없도록 하겠습니다.",
             "하도급 계약을 맺은 경우, 받은 선금 가운데 하도급 몫을 받은 날부터 15일 안에 하수급인에게 지급하겠습니다.",
             "선금 사용 내역을 요구하시면 증빙과 함께 바로 제출하겠습니다.",
             "위 사항을 지키지 않으면 선금 반환 등 관계 법령과 계약조건에 따른 조치를 따르겠습니다."]
    for i, t in enumerate(items):
        p.row([(1, f"{i+1}.", {"kind": "cfree", "valign": "top"}), (6, t, {"kind": "free", "valign": "top"})])
    p.gap(6)
    p.para("이에 각서를 제출합니다.", align="center", h=26)
    _foot(p, ex, False)
    p.end_print()


def expect(pages):
    s = pages["신청서"]
    base = s["차수금액"] or s["계약금액"]
    e = {"한도액": int(base * s["한도율"]), "신청비율": s["신청금액"] / base,
         "한도판정": "⚠ 한도를 넘었습니다" if s["신청금액"] > int(base * s["한도율"]) else "한도 이내"}
    tot = tg = tv = 0
    for i in range(1, N + 1):
        a = s.get(f"금액#{i}")
        if a is None:
            e[f"공급#{i}"] = ""
            e[f"부가#{i}"] = ""
            continue
        g = int((a / 1.1) + 0.5)
        e[f"공급#{i}"] = g
        e[f"부가#{i}"] = a - g
        tot += a; tg += g; tv += a - g
    e.update({"합금액": tot, "합공급": tg, "합부가": tv, "합대조": "" if tot == s["신청금액"] else "?"})
    u = {f"사용금액#{i}": (s.get(f"금액#{i}") if s.get(f"금액#{i}") is not None else "") for i in range(1, N + 1)}
    u["사용합계"] = tot
    k = s["공사명"]
    return {
        "신청서": e,
        "공문": {"본문2": f"당사가 귀 기관과 계약한 「{k}」에 대하여 선금 신청서를 붙임과 같이 제출하오니 검토 후 지급하여 주시기 바랍니다."},
        "사용계획서": u,
        "청구서": {"청구금액": s["신청금액"]},
        "각서": {"각서머리": f"{s['상호']}는(은) 위 공사의 선금을 받으면서 다음 사항을 지킬 것을 약속합니다."},
    }
