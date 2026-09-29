# -*- coding: utf-8 -*-
"""강우 시 콘크리트 타설 계획서 — 원본 틀(공사명 · 타설일자 · 위치 · 시간 · 날씨 · 강우 · 규격 · 수량 · 레미콘 업체 · 장비 · 인원 ·
보양 · 이음대책 · 양생 · 품질시험 · 특기사항 · 제출/승인)을 새로 만든 것.
■ «( )» 로 고르던 칸은 목록에서 고릅니다(날씨·강우는 하나, 보양·이음·양생은 칸마다 □/■).
■ 수식: 타설 요일 · 계획 타설시간 · 레미콘 대수(= 수량 ÷ 1대 적재량) · 예상 타설시간(= 수량 ÷ (펌프카 × 시간당 타설량)) ·
        투입인원 계 · 권장 압축강도 시험 회수(120㎥마다 1회) · 비비기~타설 끝 시간 한도(외기온 25℃ 기준) · 빠진 것 안내."""
import datetime

from fb import F, I

SLUG = "o-gangu-taseol"
TITLE = "강우 시 콘크리트 타설 계획서"
WHERE = "orig"
PREV = [(1, "빈 서식"), (2, "작성 예시")]
PAGES = 1
NSHEETS = 1
SHORT = ("비 오는 날 콘크리트를 쳐야 할 때 내는 타설 계획서입니다. 레미콘 대수·예상 타설시간·투입인원 계·권장 시험 회수를 셈하고, "
         "강우 예보인데 보양·이음·양생 대책을 안 골랐거나 타설시간이 모자라면 알려 줍니다.")
NOTE = "노란 칸(레미콘 1대 적재량 6㎥ · 펌프카 시간당 타설량 25㎥ · 시험 기준 120㎥)은 현장에 맞게 고쳐 쓰세요. 보양·이음·양생 칸은 목록에서 ■ 를 고르세요."

D = datetime.date
T = datetime.time
W = [11] * 8
N = 8
L = {"kind": "label"}
LS = {"kind": "label", "size": 9.5}
CT = {"kind": "ctext", "size": 9.5}
WKD = 'CHOOSE(WEEKDAY({d}),"일","월","화","수","목","금","토")'
KO = "월화수목금토일"
WEATHER = ["맑음", "흐림", "우천"]
RAIN = ["해당없음", "강우", "강설"]
OPT = {"보양": ["해당없음", "호퍼외부천막", "비닐시트", "기타"],
       "이음": ["PVC 타설막이", "전단보강근", "기타"],
       "양생": ["비닐시트보양", "보온천막보양", "열풍기", "쇠흙손미장"]}
OPT_EX = {"보양": {"호퍼외부천막", "비닐시트"}, "이음": {"PVC 타설막이"}, "양생": {"비닐시트보양"}}


def _show(key, opts):
    return "=" + '&"  ·  "&'.join(f'"{o} ("&IF({{{key}}}="{o}","○","  ")&")"' for o in opts)


def _box(p, r1, r2, c1, c2):
    from openpyxl.styles import Border, Side
    s = Side(style="thin", color="374151")
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            cell = p.ws.cell(row=r, column=c)
            cell.border = Border(left=s if c == c1 else None, right=s if c == c2 else None,
                                 top=s if r == r1 else None, bottom=s if r == r2 else None)


def draw(bk, ex):
    p = bk.page("계획서", W, ex=ex, fit_height=1, sheetname="계획서" if not ex else "예시-계획서", margins=(0.5, 0.5, 0.4, 0.4))
    p.dv_list("날씨", WEATHER)
    p.dv_list("강우", RAIN)
    for g, opts in OPT.items():
        for o in opts:
            p.dv_list(f"{g}:{o}", [f"□ {o}", f"■ {o}"])
    p.title("강우 시 콘크리트 타설 계획서", h=38)
    p.gap(4)
    p.row([(2, "공 사 명", L), (6, I("공사명", ex="가나지구 배수로 정비공사"))], h=26)
    p.row([(2, "타설일자", L), (3, I("타설일", ex=D(2026, 6, 18), fmt="date", align="left")),
           (3, F("요일", '=IF(N({타설일})=0,"","("&' + WKD.format(d="{타설일}") + '&"요일)")', align="left"))], h=26)
    p.row([(2, "타설위치 및 부위", L), (6, I("위치", ex="PC 암거 기초 슬래브 STA.0+120 ~ 0+200"))], h=26)
    p.row([(2, "타설시간", L), (1, I("시작", ex=T(8, 0), fmt="hh:mm", align="center")), (1, "~", {"kind": "ctext"}),
           (1, I("종료", ex=T(12, 0), fmt="hh:mm", align="center")), (1, "계획 시간", LS),
           (2, F("계획시간", '=IF(OR(N({시작})=0,N({종료})=0),"",ROUND(({종료}-{시작})*24,2))', fmt='0.0#"시간"', align="center"))], h=26)
    p.row([(2, "예상날씨", L), (1, I("날씨", ex="흐림", dv="날씨", align="center")), (3, F("날씨표시", _show("날씨", WEATHER), align="left", size=9.5)),
           (1, "예상기온", LS), (1, I("기온", ex=24, fmt='0"℃"', align="center"))], h=26)
    p.row([(2, "강우여부", L), (1, I("강우", ex="강우", dv="강우", align="center")), (3, F("강우표시", _show("강우", RAIN), align="left", size=9.5)),
           (1, "강우 확률", LS), (1, I("확률", ex=60, fmt='0"%"', align="center"))], h=26)
    p.row([(2, "예상 강우량\n(전일 예보 기준)", LS), (1, "시간당", CT), (2, I("시간강우", ex=3, fmt='0.0" mm/hr"', align="center")),
           (1, "하루", CT), (2, I("하루강우", ex=15, fmt='0.0" mm/day"', align="center"))], h=28)
    p.row([(2, "CON'C 규격", L), (2, I("규격", ex="25 - 24 - 150", align="center")), (2, "타설 예상수량", L),
           (2, I("수량", ex=86, fmt='#,##0.0#" ㎥"', align="center"))], h=26)
    p.row([(2, "레미콘 공급업체명", dict(L, rs=2)), (3, I("업체1", ex="예시레미콘(주)")), (1, "운반거리", dict(LS, rs=2)),
           (2, I("거리1", ex=12.5, fmt='0.0#" km"', align="center"))], h=24)
    p.row([(3, I("업체2")), (2, I("거리2", fmt='0.0#" km"', align="center"))], h=24)
    p.row([(2, "레미콘 대수", L), (2, F("대수", '=IF(OR(N({수량})=0,N({적재})=0),"",ROUNDUP({수량}/{적재},0))', fmt='0"대"', align="center")),
           (2, "1대 적재량", LS), (2, I("적재", blank=6, rate=True, fmt='0.0#"㎥"', align="center"))], h=24)
    p.row([(2, "타설방법 및 장비", dict(L, rs=2)), (1, "진동기", CT), (1, I("진동기", ex=2, fmt='0"대"', align="center")),
           (1, "펌프카", CT), (1, I("펌프카", ex=1, fmt='0"대"', align="center")), (1, "백호", CT), (1, I("백호", fmt='0"대"', align="center"))], h=24)
    p.row([(1, "직접타설", CT), (1, I("직접", fmt='0"명"', align="center")), (1, "펌프 타설량", dict(CT, size=8.5)),
           (1, I("펌프능력", blank=25, rate=True, fmt='0"㎥/h"', align="center")), (1, "예상 시간", CT),
           (1, F("예상시간", '=IF(OR(N({수량})=0,N({펌프카})=0,N({펌프능력})=0),"",ROUND({수량}/({펌프카}*{펌프능력}),2))', fmt='0.0#"시간"', align="center"))],
          h=24)
    p.row([(N, F("시간안내", '=IF(OR({예상시간}="",{계획시간}=""),"",IF({예상시간}>{계획시간},"⚠ 예상 타설시간("&{예상시간}&"시간)이 계획 타설시간("&{계획시간}'
                          '&"시간)보다 깁니다 — 펌프카를 늘리거나 타설시간을 다시 잡으세요.",""))', align="left"), {"kind": "warn"})], h=16)
    p.row([(2, F("인원표시", '="투입인원"&IF(N({콘크리트공})+N({형틀공})+N({보통인부})=0,"",CHAR(10)&"(계 "&(N({콘크리트공})+N({형틀공})+N({보통인부}))&"명)")',
                 align="center", bold=True, size=9.5), L),
           (1, "CON'C공", CT), (1, I("콘크리트공", ex=4, fmt='0"명"', align="center")), (1, "형틀공", CT), (1, I("형틀공", ex=2, fmt='0"명"', align="center")),
           (1, "보통인부", CT), (1, I("보통인부", ex=3, fmt='0"명"', align="center"))], h=30)
    for g, lab in (("보양", "보양방법\n(강우 시)"), ("이음", "타설중 중단시\n이음대책"), ("양생", "양생방법")):
        cells = [(2, lab, LS)]
        for o in OPT[g]:
            on = ex and o in OPT_EX[g]
            cells.append((1, I(f"{g}:{o}", ex=f"■ {o}" if on else f"□ {o}", blank=f"□ {o}", dv=f"{g}:{o}", align="left", size=8.5)))
        left = N - 2 - len(OPT[g])
        if left:
            cells.append((left, I(f"{g}:기타내용", ex=None, align="left", size=9)))
        p.row(cells, h=28)
        from openpyxl.styles import Alignment
        for o in OPT[g]:       # 좁은 칸 — 두 줄로 쪼개지 말고 칸에 맞춰 줄임
            p.ws[p.k[f"{g}:{o}"]].alignment = Alignment(horizontal="left", vertical="center", shrink_to_fit=True)
        k1, k2 = p.k[f"{g}:{OPT[g][0]}"], p.k[f"{g}:{OPT[g][-1]}"]
        p.k[f"{g}[]"] = f"{k1}:{k2}"
    p.row([(N, F("강우안내", '=IF(OR({강우}="강우",{강우}="강설"),IF(COUNTIF({보양[]},"■*")+COUNTIF({이음[]},"■*")+COUNTIF({양생[]},"■*")=0,'
                          '"⚠ 강우·강설 예보입니다 — 보양방법·이음대책·양생방법을 고르세요.",IF(OR(COUNTIF({보양[]},"■*")=0,COUNTIF({이음[]},"■*")=0,'
                          'COUNTIF({양생[]},"■*")=0),"⚠ 강우·강설 예보입니다 — 보양방법·이음대책·양생방법 가운데 안 고른 것이 있습니다.","")),"")',
                 align="left"), {"kind": "warn"})], h=16)
    p.row([(2, "품질시험 및 회수", L), (2, "콘크리트 물성시험", CT), (1, I("시험회수", ex=1, fmt='0"회"', align="center")),
           (1, F("권장회수", '=IF(OR(N({수량})=0,N({시험기준})=0),"","권장 "&MAX(1,ROUNDUP({수량}/{시험기준},0))&"회")', align="center", size=9)),
           (2, I("시험기준", blank=120, rate=True, fmt='0"㎥마다 1회"', align="center", size=9))], h=26)
    p.row([(2, "비비기~타설 끝\n시간 한도", LS),
           (6, F("시간한도", '=IF({기온}="","",IF({기온}>=25,"1.5시간 이내 (외기온 25℃ 이상)","2시간 이내 (외기온 25℃ 미만)")&" — 콘크리트 표준시방서 KCS 14 20 10")',
                 align="left", size=9.5))], h=28)
    p.row([(2, "특기사항", dict(L, rs=4)), (6, I("특기사항", ex="타설 중 시간당 강우 5mm 이상이면 타설을 멈추고 이음부를 처리한 뒤 감리원과 다시 협의", size=9.5))], h=30)
    for a, b in ((1, 2), (3, 4)):
        p.row([(1, "감리원 :", {"kind": "text", "align": "right", "size": 9.5}), (1, I(f"감리원#{a}", ex="김감리" if (ex and a == 1) else None, align="center")),
               (1, "(인)", CT), (1, "감리원 :", {"kind": "text", "align": "right", "size": 9.5}), (1, I(f"감리원#{b}", align="center")), (1, "(인)", CT)], h=24)
    p.row([(6, "첨부: 타설부위 도면, 장비배치도, 기상청 일기예보", {"kind": "text", "size": 9.5})], h=22)
    p.gap(6)
    r1 = p.r
    p.row([(4, "상기와 같이 콘크리트 타설 계획서를\n제출합니다.", {"kind": "cfree"}), (4, "상기와 같이 콘크리트 타설 계획서에 의한\n콘크리트 타설을 승인합니다.", {"kind": "cfree"})], h=40)
    p.row([(4, I("제출일", ex=D(2026, 6, 17), fmt="date", blank="20     년      월      일", align="center"), {"border": False}),
           (4, I("승인일", ex=D(2026, 6, 17), fmt="date", blank="20     년      월      일", align="center"), {"border": False})], h=28)
    p.gap(16)
    p.row([(1, "현장대리인 :", {"kind": "free", "align": "right", "bold": True, "size": 9.5}), (2, I("현장대리인", ex="홍길동", align="center"), {"border": False}),
           (1, "(인)", {"kind": "cfree", "size": 9}),
           (1, "책임기술인 :", {"kind": "free", "align": "right", "bold": True, "size": 9.5}), (2, I("책임기술인", ex="박책임", align="center"), {"border": False}),
           (1, "(인)", {"kind": "cfree", "size": 9})], h=26)
    p.gap(8)
    _box(p, r1, p.r - 1, 1, 4)
    _box(p, r1, p.r - 1, 5, 8)
    p.end_print()
    p.after_note(["노란 칸 = 기준값(레미콘 1대 적재량 · 펌프카 시간당 실제 타설량 · 압축강도 시험 기준 수량) — 현장에 맞게 고치세요. 하늘색 칸 = 자동.",
                  "권장 시험 회수 = 타설수량 ÷ 시험 기준(120㎥마다 1회, 적어도 1회) · 시간 한도 = 비비기부터 타설 끝까지(외기온 25℃ 이상 1.5시간, 미만 2시간)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람)."])
    return p


def _g(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def expect(inp):
    import math
    d = inp["타설일"]
    e = {"요일": f"({KO[d.weekday()]}요일)"}
    s, t = inp["시작"], inp["종료"]
    plan = round(((t.hour * 60 + t.minute) - (s.hour * 60 + s.minute)) / 60, 2)
    e["계획시간"] = plan
    e["날씨표시"] = "  ·  ".join(f"{o} ({'○' if inp['날씨'] == o else '  '})" for o in WEATHER)
    e["강우표시"] = "  ·  ".join(f"{o} ({'○' if inp['강우'] == o else '  '})" for o in RAIN)
    q = inp["수량"]
    e["대수"] = math.ceil(q / inp["적재"])
    est = round(q / (inp["펌프카"] * inp["펌프능력"]), 2)
    e["예상시간"] = est
    e["시간안내"] = f"⚠ 예상 타설시간({_g(est)}시간)이 계획 타설시간({_g(plan)}시간)보다 깁니다 — 펌프카를 늘리거나 타설시간을 다시 잡으세요." if est > plan else ""
    n = sum(inp.get(k) or 0 for k in ("콘크리트공", "형틀공", "보통인부"))
    e["인원표시"] = "투입인원" + (f"\n(계 {n}명)" if n else "")
    cnt = {g: sum(1 for o in OPT[g] if str(inp.get(f"{g}:{o}", "")).startswith("■")) for g in OPT}
    if inp["강우"] in ("강우", "강설"):
        if sum(cnt.values()) == 0:
            e["강우안내"] = "⚠ 강우·강설 예보입니다 — 보양방법·이음대책·양생방법을 고르세요."
        elif min(cnt.values()) == 0:
            e["강우안내"] = "⚠ 강우·강설 예보입니다 — 보양방법·이음대책·양생방법 가운데 안 고른 것이 있습니다."
        else:
            e["강우안내"] = ""
    else:
        e["강우안내"] = ""
    e["권장회수"] = f"권장 {max(1, math.ceil(q / inp['시험기준']))}회"
    e["시간한도"] = ("1.5시간 이내 (외기온 25℃ 이상)" if inp["기온"] >= 25 else "2시간 이내 (외기온 25℃ 미만)") + " — 콘크리트 표준시방서 KCS 14 20 10"
    return e
