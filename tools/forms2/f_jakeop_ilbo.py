# -*- coding: utf-8 -*-
"""작업일보(보할) — 현장에서 쓰던 틀(공사물량·보할·진도 / 인원동원 / 장비동원 / 작업내용 / 현장사진)을 새로 만든 것.

■ 날마다 이어 쓰기
  시트를 복사해 이름을 날짜로(예: 0930) 바꾸고, 오른쪽 노란 칸 «전날 시트» 에 어제 시트 이름(예: 0929)을 적으면
  전일 작업량·전일누계 인원·장비가 어제 시트의 «누계» 에서 저절로 들어옵니다(INDIRECT).
  첫날은 노란 칸을 비워 두고 전일 칸에 직접 적으면 됩니다.
■ 진도(%) = 작업량 ÷ 총량 × 보할,  진도율(공종) = 누계 작업량 ÷ 총량,  실적 공정률 = 진도 누계 합계
"""
import datetime

from fb import F, I

SLUG = "jakeop-ilbo"
TITLE = "작업일보"
WHERE = "forms"
PREV = [(1, "빈 서식"), (3, "작성 예시 — 둘째 날(전일 값이 저절로 들어옴)")]
SHORT = "작업일보(보할) — 공사물량·보할·진도(%)·인원동원·장비동원이 수식으로 이어져 있습니다. 전날 시트 이름만 적으면 전일 값이 따라옵니다."
NOTE_REPLACE = {"🏗 **현장에서 실제로 쓰던 서식입니다** — 내용만 지우고 틀은 원본 그대로 두었습니다.":
                "🏗 **현장에서 쓰던 작업일보 틀 그대로 새로 만들었습니다** — 시트를 복사해 날짜 이름을 붙이고, 맨 위 오른쪽 노란 칸에 전날 시트 이름만 적으면 전일 값이 따라옵니다."}
MULTI = True
V2_SKIP = ("예시0930",)       # 둘째 날은 INDIRECT 로 이어짐 → LibreOffice 대조로만

W = [6.5, 17, 5.5, 9, 8, 9, 9, 9, 8.5, 8.5, 8.5, 8.5, 15, 12]
PC = 12
NW, NP, NE, NT = 12, 10, 6, 4      # 공사물량 · 인원(한쪽) · 장비(한쪽) · 작업내용 줄 수

# 예시: (구분, 공종, 단위, 총량, 보할, 첫날 전일누계, 첫날 금일, 둘째날 금일)
WORK = [
    ("토공", "터파기", "m³", 4850, 0.12, 2910, 180, 175),
    ("토공", "되메우기", "m³", 3920, 0.08, 1960, 150, 160),
    ("배수공", "배수관 부설(D600)", "m", 1240, 0.30, 612, 36, 40),
    ("배수공", "집수정 설치", "개소", 42, 0.10, 18, 2, 2),
    ("구조물공", "암거(2.0×2.0)", "m", 85, 0.20, 34, 0, 3.5),
    ("포장공", "아스팔트 포장", "m²", 6300, 0.15, 0, 0, 0),
    ("부대공", "안전시설·정리", "식", 1, 0.05, 0.4, 0, 0.02),
]
PEOPLE_L = [("보통인부", 1245, 6, 7), ("특별인부", 382, 2, 2), ("배관공", 296, 4, 4), ("철근공", 188, 0, 2), ("형틀목공", 214, 0, 3)]
PEOPLE_R = [("콘크리트공", 96, 0, 0), ("신호수", 158, 1, 1), ("현장 관리", 520, 3, 3)]
EQUIP_L = [("굴착기 0.6㎥", 212, 2, 2), ("굴착기 0.3㎥", 148, 1, 1), ("덤프트럭 15t", 305, 3, 2)]
EQUIP_R = [("살수차", 42, 0, 1), ("진동롤러", 38, 0, 0), ("카고크레인 5t", 26, 1, 0)]
TASKS = [
    ("토공", "3공구 터파기 L=45m, 되메우기 L=40m", "3공구 터파기 L=45m 이어서"),
    ("배수공", "D600 흄관 부설 36m, 집수정 2개소", "D600 흄관 부설 40m, 집수정 2개소"),
    ("구조물공", "암거 기초 거푸집 조립", "암거 기초 콘크리트 타설(3.5m)"),
    ("안전", "TBM 실시 — 굴착 사면·장비 협착 주의", "우천 대비 가배수로 정비"),
]


def _pull(prev_col):
    """전날 시트의 같은 행·지정 열 값을 끌어옴. 전날 칸이 비면 빈칸."""
    return '=IF({전날}="","",IFERROR(INDIRECT("\'"&{전날}&"\'!' + prev_col + '"&ROW()),""))'


def _day(bk, ex, logical, day):
    """day: None(빈 서식) 또는 0/1(예시 첫날·둘째날)."""
    p = bk.page(logical, W, ex=ex, fit_height=1, print_cols=PC, margins=(0.35, 0.3, 0.4, 0.4))
    E = day is not None
    first = (day == 0)
    L = {"kind": "label"}
    H = {"kind": "head"}
    dt = datetime.date(2026, 9, 29) + datetime.timedelta(days=day or 0)
    p.gap(2)
    p.row([(PC, "작  업  일  보", {"kind": "title"}), (1, "전날 시트 이름 →", {"kind": "note", "align": "right"}),
           (1, I("전날", ex=(None if first else "예시0929") if E else None, rate=True, fmt="text", align="center"))], h=34)
    p.gap(4)
    r = p.r
    p.row([(2, "공 사 명", L), (4, I("공사명", ex="가나지구 배수로 정비공사" if E else None)),
           (3, "계 획 / 실 적", H), (1, "결\n\n재", {"kind": "label", "rs": 3}), (1, "담 당", H), (1, "소 장", H)], h=20)
    p.row([(2, "일    자", L), (2, I("일자", ex=dt if E else None, fmt="date", align="center")),
           (2, F("요일", '=IF(ISNUMBER({일자}),"("&CHOOSE(WEEKDAY({일자}),"일","월","화","수","목","금","토")&")","")', align="center")),
           (1, "계  획", L), (2, I("계획", ex=(0.36 if first else 0.365) if E else None, fmt="pct", align="center")),
           (1, "", {"rs": 2}), (1, "", {"rs": 2})], h=22)
    p.row([(2, "날씨 · 기온", L), (4, I("날씨", ex=("맑음 / 13~24℃" if first else "구름 조금 / 14~23℃") if E else None, align="center")),
           (1, "실  적", L), (2, F("실적", "={진도누계합}", fmt="pct", align="center"))], h=22)
    p.gap(6)
    p.row([(6, "1. 공 사 물 량", {"kind": "h2"}), (6, "진도(%) = 작업량 ÷ 총량 × 보할", {"kind": "note", "align": "right"})], h=18)
    p.row([(1, "구분", {**H, "rs": 2}), (1, "공    종", {**H, "rs": 2}), (1, "단위", {**H, "rs": 2}), (1, "총  량", {**H, "rs": 2}),
           (1, "보할", {**H, "rs": 2}), (3, "작 업 량", H), (3, "진  도 (%)", H), (1, "진도율\n(공종)", {**H, "rs": 2, "size": 9})], h=18)
    p.row([(1, "전 일", H), (1, "금 일", H), (1, "누 계", H), (1, "전 일", H), (1, "금 일", H), (1, "누 계", H)], h=18)
    w0 = p.r
    for i in range(NW):
        rr = p.r
        w = WORK[i] if (E and i < len(WORK)) else None
        pre = (w[5] if w else None) if first else None
        today = (w[6] if day == 0 else w[7]) if w else None
        p.row([(1, I(f"구분#{i+1}", ex=w[0] if w else None, align="center", size=9)),
               (1, I(f"공종#{i+1}", ex=w[1] if w else None, size=9)),
               (1, I(f"단위#{i+1}", ex=w[2] if w else None, align="center", size=9)),
               (1, I(f"총량#{i+1}", ex=w[3] if w else None, fmt="num")),
               (1, I(f"보할#{i+1}", ex=w[4] if w else None, fmt="pct1")),
               (1, I(f"전일#{i+1}", ex=pre, blank=_pull("H"), fmt="num")),
               (1, I(f"금일#{i+1}", ex=today, fmt="num")),
               (1, F(f"누계#{i+1}", f"=N(F{rr})+N(G{rr})", fmt="num")),
               (1, F(f"진전#{i+1}", f'=IF(N(D{rr})=0,"",N(F{rr})/D{rr}*N(E{rr}))', fmt="pct")),
               (1, F(f"진금#{i+1}", f'=IF(N(D{rr})=0,"",N(G{rr})/D{rr}*N(E{rr}))', fmt="pct")),
               (1, F(f"진누#{i+1}", f'=IF(N(D{rr})=0,"",N(H{rr})/D{rr}*N(E{rr}))', fmt="pct")),
               (1, F(f"진도율#{i+1}", f'=IF(N(D{rr})=0,"",N(H{rr})/D{rr})', fmt="pct"))], h=17)
    w1 = p.r - 1
    S = {"kind": "sum"}
    p.row([(4, "합        계", S), (1, F("보할합", f"=SUM(E{w0}:E{w1})", fmt="pct1", bold=True)),
           (3, F("보할확인", f'=IF(COUNT(E{w0}:E{w1})=0,"",IF(ROUND(SUM(E{w0}:E{w1}),6)=1,"","⚠ 보할 합계가 100%가 아닙니다"))',
                 align="center", size=8.5)),
           (1, F("진도전일합", f"=SUM(I{w0}:I{w1})", fmt="pct", bold=True)),
           (1, F("진도금일합", f"=SUM(J{w0}:J{w1})", fmt="pct", bold=True)),
           (1, F("진도누계합", f"=SUM(K{w0}:K{w1})", fmt="pct", bold=True)), (1, "", S)], h=19)
    # ── 2. 인원 동원 · 3. 장비 동원 ─────────────────────
    blocks = {}
    for title, unit, n, left, right, tag in (("2. 인 원 동 원", "(단위: 명)", NP, PEOPLE_L, PEOPLE_R, "인"),
                                             ("3. 장 비 동 원", "(단위: 대)", NE, EQUIP_L, EQUIP_R, "장")):
        p.gap(6)
        p.row([(9, title, {"kind": "h2"}), (3, unit, {"kind": "note", "align": "right"})], h=18)
        nm = "직    종" if tag == "인" else "장  비  명"
        p.row([(3, nm, H), (1, "전일누계", H), (1, "금 일", H), (1, "누 계", H),
               (3, nm, H), (1, "전일누계", H), (1, "금 일", H), (1, "누 계", H)], h=18)
        b0 = p.r
        for i in range(n):
            rr = p.r
            a = left[i] if (E and i < len(left)) else None
            b = right[i] if (E and i < len(right)) else None
            p.row([(3, I(f"{tag}L이름#{i+1}", ex=a[0] if a else None, size=9)),
                   (1, I(f"{tag}L전#{i+1}", ex=(a[1] if a else None) if first else None, blank=_pull("F"), fmt="int")),
                   (1, I(f"{tag}L금#{i+1}", ex=(a[2] if day == 0 else a[3]) if a else None, fmt="int")),
                   (1, F(f"{tag}L누#{i+1}", f"=N(D{rr})+N(E{rr})", fmt="int")),
                   (3, I(f"{tag}R이름#{i+1}", ex=b[0] if b else None, size=9)),
                   (1, I(f"{tag}R전#{i+1}", ex=(b[1] if b else None) if first else None, blank=_pull("L"), fmt="int")),
                   (1, I(f"{tag}R금#{i+1}", ex=(b[2] if day == 0 else b[3]) if b else None, fmt="int")),
                   (1, F(f"{tag}R누#{i+1}", f"=N(J{rr})+N(K{rr})", fmt="int"))], h=17)
        b1 = p.r - 1
        p.row([(3, "합   계 (왼쪽 + 오른쪽)", S),
               (1, F(f"{tag}합전", f"=SUM(D{b0}:D{b1})+SUM(J{b0}:J{b1})", fmt="int", bold=True)),
               (1, F(f"{tag}합금", f"=SUM(E{b0}:E{b1})+SUM(K{b0}:K{b1})", fmt="int", bold=True)),
               (1, F(f"{tag}합누", f"=SUM(F{b0}:F{b1})+SUM(L{b0}:L{b1})", fmt="int", bold=True)),
               (6, "", S)], h=19)
    # ── 4. 작업 내용 ─────────────────────────────────────
    p.gap(6)
    p.row([(PC, "4. 작 업 내 용", {"kind": "h2"})], h=18)
    p.row([(1, "구 분", H), (5, "금  일  작  업", H), (6, "명  일  작  업", H)], h=18)
    for i in range(NT):
        t = TASKS[i] if E else None
        if t and day == 1:
            t = (t[0], t[2], "")
        p.row([(1, I(f"구분작업#{i+1}", ex=t[0] if t else None, align="center", size=9)),
               (5, I(f"금일작업#{i+1}", ex=t[1] if t else None, size=9)),
               (6, I(f"명일작업#{i+1}", ex=(t[2] or None) if t else None, size=9))], h=30)
    p.row([(1, "특기사항", {"kind": "label", "size": 9}),
           (11, I("특기", ex=("감독 현장점검 14:00 — 지적사항 없음" if first else "레미콘 07:30 반입 확인(24-21-150), 슬럼프 시험 합격") if E else None, size=9))], h=30)
    p.gap(6)
    p.row([(PC, "5. 현 장 사 진", {"kind": "h2"})], h=18)
    p.row([(6, "", {}), (6, "", {})], h=120)
    p.row([(6, I("사진1", ex="3공구 터파기 전경" if E else None, align="center", size=9)),
           (6, I("사진2", ex="D600 흄관 부설" if E else None, align="center", size=9))], h=18)
    p.end_print()
    if not E:
        p.after_note([
            "이어 쓰기: 이 시트를 복사(시트 탭 우클릭 → 이동/복사 → 복사본 만들기)해 이름을 날짜로(예: 0930) 바꾸고,",
            "      맨 위 오른쪽 노란 칸 «전날 시트 이름» 에 어제 시트 이름(예: 0929)을 적으면 전일 칸이 저절로 채워집니다. 첫날은 비워 두고 전일 칸에 직접 적으세요.",
            "하늘색 칸 = 자동 계산 칸(누계·진도·진도율·합계). 보할 합계가 100%가 아니면 빨간 글이 나옵니다.",
            "날씨·못 한 작업과 그 이유를 꼭 적으세요 — 나중에 공기연장·설계변경의 증거가 됩니다.",
        ])
    else:
        p.after_note(["이 시트는 작성 예시입니다(가상의 공사). «예시0930» 은 전날 칸에 «예시0929» 를 적어 전일 값이 저절로 들어온 모습입니다."])
    return p


def draw(bk, ex):
    if not ex:
        return _day(bk, False, "작업일보", None)
    _day(bk, True, "예시0929", 0)
    _day(bk, True, "예시0930", 1)


def _expect_day(inp, prev):
    e = {}
    kt = it = jt = et = 0.0
    for i in range(1, NW + 1):
        D = inp.get(f"총량#{i}") or 0
        Eb = inp.get(f"보할#{i}") or 0
        f = inp.get(f"전일#{i}")
        if isinstance(f, str) or f is None:
            f = prev.get(f"누계#{i}", 0) if prev else 0
        g = inp.get(f"금일#{i}") or 0
        h = f + g
        e[f"전일#{i}"] = f if (prev is not None) else inp.get(f"전일#{i}")
        e[f"누계#{i}"] = h
        if D:
            e[f"진전#{i}"] = f / D * Eb
            e[f"진금#{i}"] = g / D * Eb
            e[f"진누#{i}"] = h / D * Eb
            e[f"진도율#{i}"] = h / D
            it += f / D * Eb; jt += g / D * Eb; kt += h / D * Eb
        else:
            for k in ("진전", "진금", "진누", "진도율"):
                e[f"{k}#{i}"] = ""
        et += Eb
    e.update({"보할합": et, "진도전일합": it, "진도금일합": jt, "진도누계합": kt, "실적": kt,
              "보할확인": "" if round(et, 6) == 1 else "⚠ 보할 합계가 100%가 아닙니다"})
    for tag, n in (("인", NP), ("장", NE)):
        s_pre = s_now = s_cum = 0
        for side in "LR":
            for i in range(1, n + 1):
                pre = inp.get(f"{tag}{side}전#{i}")
                if isinstance(pre, str) or pre is None:
                    pre = prev.get(f"{tag}{side}누#{i}", 0) if prev else 0
                now = inp.get(f"{tag}{side}금#{i}") or 0
                e[f"{tag}{side}누#{i}"] = pre + now
                s_pre += pre; s_now += now; s_cum += pre + now
        e.update({f"{tag}합전": s_pre, f"{tag}합금": s_now, f"{tag}합누": s_cum})
    e["요일"] = "(" + "월화수목금토일"[inp["일자"].weekday()] + ")"
    return e


def expect(pages):
    d1 = _expect_day(pages["예시0929"], None)
    d2 = _expect_day(pages["예시0930"], d1)
    # 첫날 전일 칸은 손으로 적은 값(수식 아님) → 대조에서 뺌
    d1 = {k: v for k, v in d1.items() if not k.startswith("전일#")}
    return {"예시0929": d1, "예시0930": d2}
