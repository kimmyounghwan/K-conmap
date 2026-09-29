# -*- coding: utf-8 -*-
"""주요자재 검사 수불부 — 현장에서 쓰던 서식의 틀(공사명·품명 · 설계량/단위/규격 · 반입일/반입량 · 합격량(금회·누계) ·
불합격(양·사유) · 출고일/출고량 · 잔량 · 검수자/서명, 25줄) 그대로 새로 만든 것.
얹은 것: 합격량(금회) = 반입량 − 불합격량 · 누계 = 금회 합격을 차례로 더함 · 잔량 = 합격 누계 − 출고 누계(모자라면 빨간 음수) ·
맨 아래 합계 줄 · 머리에 «설계량 대비 합격 누계 %».
원본은 자재마다 시트(망태·맨홀·수로관·잡석·시멘트·레미콘·철근)를 두고 썼습니다 — 빈 시트를 복사해 자재마다 한 장씩 쓰면 됩니다."""
import datetime

from fb import F, I

SLUG = "jajae-subulbu"
TITLE = "자재 수불부"
WHERE = "forms"
PREV = None
SHORT = "주요자재·관급자재 검사 수불부. 반입량·불합격량·출고량만 적으면 합격량(금회·누계)과 잔량이 저절로 나옵니다. 자재마다 시트를 복사해 씁니다."
NOTE_REPLACE = {
    "🏗 **현장에서 실제로 쓰던 서식입니다** — 내용만 지우고 틀은 원본 그대로 두었습니다.":
        "🏗 **현장에서 실제로 쓰던 서식의 틀**(칸·차례·검수자 서명란)을 그대로 두고 새로 만들었습니다 — 합격량(금회·누계)·잔량·설계량 대비 %가 자동입니다. 자재마다 시트를 복사해 쓰세요.",
}

W = [7, 5, 12, 8.5, 8, 8, 9, 6, 11, 8.5, 8, 9, 7, 6]
D = datetime.date
N = 25
Q = '#,##0.##;[Red]-#,##0.##;""'
Q0 = '#,##0.##;[Red]-#,##0.##;0'
EX = [  # 설계량, 단위, 규격, 반입일, 반입량, 불합격량, 사유, 출고일, 출고량, 검수자
    (862, "m", "D600, L=6m", D(2026, 4, 10), 300, 6, "관 끝 파손(반품)", D(2026, 4, 12), 120, "한품질"),
    (None, None, None, None, None, None, None, D(2026, 4, 18), 102, "한품질"),
    (None, None, None, D(2026, 5, 6), 312, None, None, D(2026, 5, 8), 150, "한품질"),
    (None, None, None, None, None, None, None, D(2026, 5, 15), 180, "한품질"),
    (None, None, None, D(2026, 5, 27), 252, None, None, D(2026, 5, 29), 240, "한품질"),
    (None, None, None, None, None, None, None, D(2026, 6, 5), 60, "한품질"),
]


def _t(x):
    """수량 글자로: 정수면 1,234 · 소수면 1,234.5 (엑셀 TEXT 의 «862.» 끝점 피하기)"""
    return f'IF({x}=INT({x}),TEXT({x},"#,##0"),TEXT({x},"#,##0.##"))'


def draw(bk, ex):
    p = bk.page("자재 수불부" if not ex else "작성 예시", W, ex=ex, fit_height=1, margins=(0.35, 0.35, 0.45, 0.45))
    H = {"kind": "head"}
    p.gap(4)
    p.title("주 요 자 재  검 사 수 불 부", h=40)
    p.gap(4)
    p.row([(2, "공 사 명 :", {"kind": "free", "bold": True}), (7, I("공사명", ex="가나지구 배수로 정비공사"), {"border": False}),
           (5, "", {"kind": "free"})], h=24)
    p.row([(2, "품     명 :", {"kind": "free", "bold": True}), (5, I("품명", ex="PE 이중벽관(배수관)"), {"border": False}),
           (7, F("진척", '=IF(OR(SUM({설계량[]})=0,SUM({금회[]})=0),"","설계량 "&' + _t("SUM({설계량[]})") + '&" 대비 합격 누계 "'
                        '&' + _t("SUM({금회[]})") + '&" ("&TEXT(SUM({금회[]})/SUM({설계량[]}),"0.0%")&")")', align="right", ink=False),
            {"kind": "cfree", "border": False})], h=24)
    p.gap(2)
    r = p.r
    cols = [("설계량", 1), ("단위", 1), ("규    격", 1), ("반입일", 1), ("반입량", 1), ("합격량", 2), ("불 합 격", 2),
            ("출고일", 1), ("출고량", 1), ("잔    량", 1), ("검수자", 1), ("서명", 1)]
    cells = []
    for name, sp in cols:
        cells.append((sp, name, {"kind": "head"} if sp == 2 else {"kind": "head", "rs": 2}))
    p.row(cells, h=22)
    p.row([(1, "금  회", H), (1, "누  계", H), (1, "수  량", H), (1, "사    유", H)], h=22)
    r0 = p.r
    for i in range(1, N + 1):
        e = EX[i - 1] if i <= len(EX) else (None,) * 10
        dq, un, gy, di, qi, qb, why, do, qo, who = e
        p.row([(1, I(f"설계량#{i}", ex=dq, fmt=Q)), (1, I(f"단위#{i}", ex=un, align="center")),
               (1, I(f"규격#{i}", ex=gy, align="center", size=9)),
               (1, I(f"반입일#{i}", ex=di, fmt="md")), (1, I(f"반입량#{i}", ex=qi, fmt=Q)),
               (1, F(f"금회#{i}", f'=IF(N({{반입량#{i}}})=0,"",{{반입량#{i}}}-N({{불합격량#{i}}}))', fmt=Q)),
               (1, F(f"누계#{i}", f'=IF(N({{반입량#{i}}})=0,"",SUM($F${r0}:F{r0 + i - 1}))', fmt=Q)),
               (1, I(f"불합격량#{i}", ex=qb, fmt=Q)), (1, I(f"사유#{i}", ex=why, size=8.5)),
               (1, I(f"출고일#{i}", ex=do, fmt="md")), (1, I(f"출고량#{i}", ex=qo, fmt=Q)),
               (1, F(f"잔량#{i}", f'=IF(AND(N({{반입량#{i}}})=0,N({{출고량#{i}}})=0),"",SUM($F${r0}:F{r0 + i - 1})-SUM($K${r0}:K{r0 + i - 1}))',
                     fmt=Q0)),
               (1, I(f"검수자#{i}", ex=who, align="center", size=9)), (1, "")], h=20)
    r1 = p.r - 1
    for k, c in (("설계량", "A"), ("반입량", "E"), ("금회", "F"), ("불합격량", "H"), ("출고량", "K")):
        p.k[f"{k}[]"] = f"{c}{r0}:{c}{r1}"
    S = {"kind": "sum"}
    p.row([(1, F("합설계", "=SUM({설계량[]})", fmt=Q, bold=True)), (3, "합        계", S),
           (1, F("합반입", "=SUM({반입량[]})", fmt=Q, bold=True)), (1, F("합금회", "=SUM({금회[]})", fmt=Q, bold=True)),
           (1, "", S), (1, F("합불합격", "=SUM({불합격량[]})", fmt=Q, bold=True)), (1, "", S), (1, "", S),
           (1, F("합출고", "=SUM({출고량[]})", fmt=Q, bold=True)),
           (1, F("합잔량", '=IF(AND(SUM({금회[]})=0,SUM({출고량[]})=0),"",SUM({금회[]})-SUM({출고량[]}))', fmt=Q0, bold=True)),
           (2, "", S)], h=24)
    p.row([(14, F("경고", '=IF(COUNTIF({잔량[]},"<0")>0,"⚠ 잔량이 음수인 줄이 있습니다 — 출고량이 합격 누계보다 많습니다.","")', align="left"),
            {"kind": "warn", "border": False})], h=16)
    p.k["잔량[]"] = f"L{r0}:L{r1}"
    p.end_print()
    p.after_note([
        "하늘색 칸 = 자동. 합격량(금회) = 반입량 − 불합격량, 누계 = 금회 합격을 위에서부터 더한 값, 잔량 = 합격 누계 − 출고 누계.",
        "반입만 있는 날·출고만 있는 날 모두 한 줄씩 적으면 됩니다. 설계량·단위·규격은 첫 줄에만 적어도 됩니다.",
        "자재마다 이 시트를 복사해(시트 이름 오른쪽 클릭 → 이동/복사) 한 장씩 쓰세요. 관급자재도 같은 방법으로 씁니다.",
    ] if not ex else ["이 시트는 작성 예시입니다(가상의 현장 · 수량). 실제로는 앞 시트에 적으세요."])
    return p


def expect(inp):
    e = {}
    acc = out = 0
    for i in range(1, N + 1):
        qi = inp.get(f"반입량#{i}") or 0
        qb = inp.get(f"불합격량#{i}") or 0
        qo = inp.get(f"출고량#{i}") or 0
        g = qi - qb if qi else 0
        e[f"금회#{i}"] = g if qi else ""
        acc += g
        out += qo
        e[f"누계#{i}"] = acc if qi else ""
        e[f"잔량#{i}"] = (acc - out) if (qi or qo) else ""
    dsum = sum(inp.get(f"설계량#{i}") or 0 for i in range(1, N + 1))
    e.update({"합설계": dsum, "합반입": sum(inp.get(f"반입량#{i}") or 0 for i in range(1, N + 1)), "합금회": acc,
              "합불합격": sum(inp.get(f"불합격량#{i}") or 0 for i in range(1, N + 1)), "합출고": out, "합잔량": acc - out,
              "경고": "", "진척": f"설계량 {dsum:,} 대비 합격 누계 {acc:,} ({acc / dsum * 100:.1f}%)"})
    return e
