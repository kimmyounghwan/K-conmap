# -*- coding: utf-8 -*-
"""한중 · 서중 콘크리트 시공계획서(적산온도 · 기온보정강도) — 새로 만든 서식 (2026-11-04 G531 · 소장님 «도구화 후보» ⑦)
   소장님 「빠짐없이 기록하고 사이트에 작업하게 하고, 다운만 받고, 이용자 안오게 하면 안돼. 계속 사이트 찾게 해야 해」
   → ① 한중 · 서중 · 일반 저절로 판정(타설일 일평균기온 · 24시간 최저 · 최고 예보) · ② 레미콘 주문 강도(품질기준강도 + 기온보정강도 Tn = 호칭강도) ·
      ③ 타설 온도 · 운반 시간 · 양생 종료 소요 강도 · 양생일수(한중) · 습윤 양생 기간(일반 · 서중) · ④ 날마다 양생 온도 → 적산온도 · 20 ℃ 환산 재령 ·
      공시체 강도로 초기양생 끝 · ⑤ 시공 전 확인(한중 · 서중) · 책임기술자 승인 — 이 기기에 저장해 두고 날마다 온도를 적으러 다시 옴.

근거(원문 — 2026-11-04 국가건설기준센터 KCSC 뷰어 본문 · 표 · 식 그림 확대 / 농어촌공사 전문시방서 / 시멘트 심포지엄 — 메모 /tmp/g10/g531/근거_한중서중.md):
  · KCS 14 20 40 한중 콘크리트 : 2024(2024-12-30) — 1.1(2) 일평균 4 ℃ 이하 · 24시간 일최저 0 ℃ 이하 · 초기동해 위험 / 2.1 표 2.1-1 혼화재(FA 15 · 슬래그 30 · 혼합 30) /
      2.2.2 W/B 60 % 이하 · 호칭강도 = 품질기준강도 + Tn · 표 2.2-1(0 ~ 4 ℃ 미만: 28일 6¹ · 42일 6 · 56일 3 · 91일 0) · (5) 4 ℃ 이상이면 KCS 14 20 10 표 · (8) 적산온도 방식 /
      3.3 타설 (5 ~ 20) ℃ · 가혹 · 300 mm 이하 최저 10 ℃ / 3.4.1 5 ℃ 이상 → 소요 강도(표 3.4-1) → 2일간 0 ℃ 이상 · 표 3.4-2 양생일수 · (7) 공시체(KCI-CT 118) · 승인 / 3.5 식 (3.5-1) Z20 = M / 30
  · KCS 14 20 10 일반콘크리트 : 2024 — 식 (2.2-1) fcq = max(fck, fcd) · (2.2-2) fcn = fcq + Tn · 표 2.2-1(4 ℃ 이상 Tn) · 2.2.4 단위수량 185 ㎏/㎥ · 표 3.4-1 습윤 양생 기간
  · KCS 14 20 41 서중 콘크리트 : 2025(2025-12-24) — 1.1(2) 일평균 25 ℃ 초과 · 24시간 안 일최고 30 ℃ 초과 / 3.1(2) 시공계획서 책임기술자 승인 / 3.2 운반 / 3.3 1.5시간 · 35 ℃ / 3.4 = KCS 14 20 10
  · 적산온도 M = Σ(θ + A)Δt · A 10 ℃(KRCCS 67 71 20 3.6(2) 식 3.6-1 · 쌍용C&E 2022 시멘트 심포지엄 «KCS 14 20 40 에도 제안») — Z20 = M/30 과 맞음(20 ℃ 하루 = 30 °D·D).
■ 짐작 안 함: 표에 없는 경우(예상평균기온 0 ℃ 밑 · 4 ℃ 이상 91일)는 «Tn 직접» 칸(책임기술자와 정한 값) · 양생 종료는 공시체 강도로만(적산온도는 참고)."""
import datetime
from decimal import ROUND_HALF_UP, Decimal

import sgw as g
from fb import F, I
from sgw import FR, H, L, PC, S

SLUG = "hanjung-seojung"
TITLE = "한중 · 서중 콘크리트 시공계획서"
WHERE = "forms"
# 쪽: 빈 1 판정 · 2 배합 · 3 타설양생 · 4 온도기록 · 5 확인 / 예시 6 ~ 10 (같은 차례) — 쪽 수는 만든 뒤 맞춤
PREV = [(1, "① 한중 · 서중 · 일반 — 빈 서식 (타설일 기온 예보로 저절로 판정)"), (6, "① 판정 — 작성 예시 (12월 기초 · 벽체 타설 · 일평균 1.5 ℃ → 한중)"),
        (7, "② 주문 강도 — 기온보정강도 Tn · 호칭강도 — 작성 예시 (24 + 6 = 30 MPa)"),
        (8, "③ 타설 · 양생 계획 — 작성 예시 (타설 온도 · 소요 강도 5 MPa · 양생 3일)"),
        (9, "④ 양생 온도 기록 · 적산온도 — 작성 예시 (M · 20 ℃ 환산 재령 · 공시체 강도)"), (10, "⑤ 시공 전 확인 · 책임기술자 승인 — 작성 예시")]
MULTI = True
SHORT = ("한중 · 서중 콘크리트 시공계획서 — 타설일 기온 예보를 적으면 한중 · 서중 · 일반 가운데 무엇으로 시공할지 저절로 판정하고, "
         "레미콘 주문 강도(품질기준강도 + 기온보정강도 Tn = 호칭강도), 타설 온도 · 운반 시간, 양생 종료 소요 강도 · 양생일수가 KCS 기준대로 나옵니다. "
         "날마다 양생 온도를 적으면 적산온도 · 20 ℃ 환산 재령이 이어서 셈 됩니다.")
NOTE_REPLACE = None

D = datetime.date
CHK = "○,×,해당 없음"
YN = "있음,없음"
YA = "예,아니오"
DT = 'yyyy". "m". "d"."'
MD = 'm"/"d'
CEM1 = "보통포틀랜드 · 플라이 애시 1종 · 고로 슬래그 1종"
CEM2 = "플라이 애시 시멘트 2종"
CEM3 = "고로 슬래그 시멘트 2종"
CEMS = ",".join((CEM1, CEM2, CEM3))
AGES = "28일,42일,56일,91일"
WAYS = "기온보정강도(Tn),적산온도 방식"
EXPO1 = "계속 · 자주 물로 포화"
EXPO2 = "보통의 노출 상태"
CC1 = "보통포틀랜드"
CC2 = "조강포틀랜드 · 보통포틀랜드+촉진제"
CC3 = "혼합시멘트 B종(고로 · 플라이 애시 2종)"
CCS = ",".join((CC1, CC2, CC3))
HEAT = "급열 양생,단열 양생,피복 양생,단열 양생 + 피복 양생,급열 양생 + 피복 양생"
# 표 3.4-2(한중 · 보통 단면) 양생일수 — (노출, 양생온도) → (보통, 조강 · 촉진제, 혼합 B)
CURE = {(EXPO1, "5 ℃"): (9, 5, 12), (EXPO1, "10 ℃"): (7, 4, 9), (EXPO2, "5 ℃"): (4, 3, 5), (EXPO2, "10 ℃"): (3, 2, 4)}
# KCS 14 20 10 표 3.4-1 습윤 양생 기간 — 일평균기온 하한 → (보통, 조강, 혼합 B — 고로 2종 · FA 2종)
WET = [(15, (5, 3, 7)), (10, (7, 4, 9)), (5, (9, 5, 12))]

N_T = 14          # 온도 기록 — 타설 다음 날부터 14일
N_K = 3           # 공시체 시험
EX_T = [(14.5, 11.0, -3.5), (12.0, 9.5, -5.0), (10.5, 8.0, -4.0), (9.0, 6.5, -2.5), (8.0, 5.5, -1.0), (7.5, 3.0, 0.5), (6.0, 2.0, -1.5)]
EX_T_NOTE = ["열풍기 4대 가동", "", "공시체 1차", "공시체 2차 ✓", "초기양생 끝", "보온 덮개 유지", "해체 전 확인"]
EX_K = [(D(2026, 12, 12), 4.2), (D(2026, 12, 13), 5.8)]
HAN = ["제출물 — 사용 거푸집 및 보온 양생 방법 · 제품 자료(1.5)",
       "동결되거나 빙설이 섞인 골재를 쓰지 않음 — 가열은 물 · 골재만, 시멘트는 직접 가열하지 않음(2.1)",
       "방동 · 내한제 등 특수 혼화제는 품질이 확인된 것(2.1)",
       "철근 · 거푸집에 빙설이 없음 · 지반 동결을 막거나 녹인 뒤 타설 · 이음부 동결은 녹여서 이어 침(3.3)",
       "타설 즉시 시트 등으로 덮고 바람을 막음 · 모서리 · 가장자리를 더 보온(3.3 · 3.4.1)",
       "자기온도기록계로 콘크리트 · 보온 공간 · 기온을 기록(3.5)",
       "구조체 관리용 공시체(현장과 같은 조건 · KCI-CT 118)로 초기양생 끝 · 거푸집 · 동바리 해체 시기 확인(3.4.1 · 3.5)",
       "보온 양생을 끝낸 뒤 · 거푸집을 뗄 때 콘크리트 온도를 급격히 낮추지 않음(3.4.2 · 3.4.3)",
       "갈탄 · 난로 등 불을 피우는 보온이면 들어가기 전 환기 · 일산화탄소 측정(안전)"]
EX_HAN = ["○", "○", "○", "○", "○", "○", "○", "○", "해당 없음"]
SEO = ["공사 시작 전 서중 콘크리트 시공계획서(재료 · 배합 · 운반 · 양생) 책임기술자 승인(3.1)",
       "덤프트럭 운반은 표면을 덮음 · 펌프 관은 젖은 천으로 덮음(3.2)",
       "에지테이터 트럭이 햇볕에 오래 서 있지 않게 배차계획 · 트럭믹서 뚜껑(3.2)",
       "지반 · 거푸집을 습윤 상태로 · 거푸집 · 철근이 직사일광에 달궈지지 않게(3.3)",
       "비비기부터 타설 끝까지 1.5시간 이내 — 넘으면 슬럼프 유지 · 응결 지연 조치 + 책임기술자 승인(3.3)",
       "타설 때 콘크리트 온도 35 ℃ 이하(3.3)",
       "현장양생공시체로 품질관리(3.5)"]
EX_SEO = ["해당 없음"] * len(SEO)


def _rng(p, k, n):
    p.k[f"{k}[]"] = f"{p.k[f'{k}#1']}:{p.k[f'{k}#{n}']}"


def _cnt_warn(rng):
    return f'COUNTIF({rng},"⚠*")'


# ── ① 판정 ─────────────────────────────────────────────────────────────
def panjeong(bk, ex):
    p = g.pg(bk, ex, "판정", fit=1)
    p.row([(PC, "①  한중 · 서중 콘크리트 — 어느 것으로 시공하나 (저절로 판정)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 타설일의 일평균기온과 타설 뒤 24시간 기온 예보(기상청)를 적으면 한중 · 서중 · 일반 콘크리트 가운데 무엇으로 시공할지 저절로 나옵니다"
              "(KCS 14 20 40 · KCS 14 20 41 1.1). 일평균기온은 하루 8회(03 · 06 · 09 · 12 · 15 · 18 · 21 · 24시) 관측값의 평균입니다.")
    g.sec(p, "㉮  공사 · 타설", need=26 * 6)
    p.row([(3, "공  사  명", L), (9, I("공사명", ex="가나 물류센터 신축공사"))], h=26)
    p.row([(3, "시  공  사", L), (4, I("시공사", ex="예시건설(주)")), (2, "현장대리인", L), (3, I("현장대리인", ex="김철수", align="center"))], h=26)
    p.row([(3, "현 장 위 치", L), (9, I("현장위치", ex="가나시 다라구 사아동 56-7"))], h=26)
    p.row([(3, "타 설 부 위", L), (5, I("타설부위", ex="지하 1층 기초 · 벽체")), (2, "타설량 ㎥", L),
           (2, I("타설량", ex=420, fmt='#,##0.#;;""', align="center"))], h=26)
    p.row([(3, "타  설  일", L), (4, I("타설일", ex=D(2026, 12, 9), fmt=DT, align="center")), (5, "", FR)], h=26)
    g.sec(p, "㉯  기온 예보 (기상청)", need=26 * 6)
    p.row([(6, "항    목", H), (2, "적 는 값", H), (1, "단위", H), (3, "판    정", H)], h=26)
    p.row([(6, "타설일 일평균기온", {"kind": "text", "size": 9.5}), (2, I("일평균", ex=1.5, fmt='0.0;-0.0;0.0', align="center")),
           (1, "℃", {"kind": "ctext", "size": 9}),
           (3, F("판1", '=IF(COUNT({일평균})=0,"",IF({일평균}<=4,"❄ 4 ℃ 이하 — 한중",IF({일평균}>25,"☀ 25 ℃ 초과 — 서중","4 ℃ 초과 · 25 ℃ 이하")))',
                 align="center", size=9))], h=24)
    p.row([(6, "타설 완료 뒤 24시간 일최저기온", {"kind": "text", "size": 9.5}), (2, I("최저", ex=-3.5, fmt='0.0;-0.0;0.0', align="center")),
           (1, "℃", {"kind": "ctext", "size": 9}),
           (3, F("판2", '=IF(COUNT({최저})=0,"",IF({최저}<=0,"❄ 0 ℃ 이하 — 한중","0 ℃ 초과"))', align="center", size=9))], h=24)
    p.row([(6, "타설 완료 뒤 24시간 안 일최고기온", {"kind": "text", "size": 9.5}), (2, I("최고", ex=6, fmt='0.0;-0.0;0.0', align="center")),
           (1, "℃", {"kind": "ctext", "size": 9}),
           (3, F("판3", '=IF(COUNT({최고})=0,"",IF({최고}>30,"☀ 30 ℃ 초과 — 서중","30 ℃ 이하"))', align="center", size=9))], h=24)
    p.row([(6, "그 뒤라도 초기동해 위험(한파 예보 등)", {"kind": "text", "size": 9.5}), (2, I("동해", ex="없음", dv=YN, align="center")),
           (1, "—", {"kind": "ctext", "size": 9}),
           (3, F("판4", '=IF({동해}="","",IF({동해}="있음","❄ 초기동해 위험 — 한중","없음"))', align="center", size=9))], h=24)
    han = 'OR(LEFT({판1},1)="❄",LEFT({판2},1)="❄",LEFT({판4},1)="❄")'
    seo = 'OR(LEFT({판1},1)="☀",LEFT({판3},1)="☀")'
    g.sec(p, "㉰  판    정", need=34 + 26 * 2)
    p.row([(3, "판    정", L),
           (9, F("판정", '=IF(COUNT({일평균})+COUNT({최저})+COUNT({최고})+COUNTA({동해})=0,"",IF(AND(' + han + ',' + seo + '),'
                         '"⚠ 한중 · 서중 조건이 함께 나옵니다 — 예보 값을 다시 확인",IF(' + han + ',"❄ 한중 콘크리트로 시공 — KCS 14 20 40",IF(' + seo + ','
                         '"☀ 서중 콘크리트로 시공 — KCS 14 20 41 · 시공계획서 책임기술자 승인",IF(COUNT({일평균})+COUNT({최저})+COUNT({최고})<3,'
                         '"⚠ 일평균 · 최저 · 최고기온 예보를 모두 적으세요","일반 콘크리트 — 한중 · 서중 조건 아님 (KCS 14 20 10)")))))',
                 align="left", bold=True, size=10))], h=34)
    p.row([(3, "콘크리트 종류", L),
           (3, F("종류", '=IF(LEFT({판정},1)="❄","한중",IF(LEFT({판정},1)="☀","서중",IF(LEFT({판정},2)="일반","일반","")))', align="center", bold=True)),
           (6, F("따름", '=IF({종류}="한중","② ~ ⑤ 장 — KCS 14 20 40 한중 콘크리트(2024)",IF({종류}="서중","② ~ ⑤ 장 — KCS 14 20 41 서중 콘크리트(2025)",'
                         'IF({종류}="일반","② · ③ 장 — KCS 14 20 10 일반콘크리트(2024)","")))', align="left", size=9))], h=26)
    g.note(p, "※ 한중이면 기온보정강도 · 타설 온도 (5 ~ 20) ℃ · 초기양생 5 ℃ 이상, 서중이면 타설 온도 35 ℃ 이하 · 비빔부터 타설 끝까지 1.5시간 · "
              "공사 시작 전 시공계획서 승인(KCS 14 20 41 3.1)이 따라옵니다. 예보가 바뀌면 이 장의 값만 고치면 뒤 장이 모두 다시 셈 됩니다.")
    g.d.done(p)
    p.after_note(["공사명 · 시공사 · 현장대리인 · 현장 위치는 다른 서식에 한 번 쓴 것이 먼저 들어갑니다(이 기기에서)."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 현장 · 회사 · 사람 · 기온)."])
    return p


# ── ② 주문 강도 — 기온보정강도 · 호칭강도 ────────────────────────────────
def _tn_auto():
    t, a, c = "{예상}", "{재령}", "{시멘트}"
    gen1 = f'IF({a}="28일",IF({t}>=18,0,IF({t}>=8,3,6)),IF({a}="42일",IF({t}>=12,0,3),IF({t}>=7,0,3)))'
    gen2 = f'IF({a}="28일",IF({t}>=18,0,IF({t}>=10,3,6)),IF({a}="42일",IF({t}>=13,0,IF({t}>=5,3,6)),IF({t}>=8,0,3)))'
    gen3 = f'IF({a}="28일",IF({t}>=18,0,IF({t}>=13,3,6)),IF({a}="42일",IF({t}>=14,0,IF({t}>=10,3,6)),IF({t}>=10,0,IF({t}>=5,3,6))))'
    cold = f'IF({a}="28일",6,IF({a}="42일",6,IF({a}="56일",3,0)))'
    return (f'=IF(OR(COUNT({t})=0,{a}="",{c}=""),"",IF({t}<0,"",IF({t}<4,{cold},IF({a}="91일","",'
            f'IF({c}="{CEM1}",{gen1},IF({c}="{CEM2}",{gen2},{gen3}))))))')


def baehap(bk, ex):
    p = g.pg(bk, ex, "배합", fit=1)
    p.row([(PC, "②  주문 강도 — 기온보정강도(Tn) · 호칭강도", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 레미콘은 품질기준강도에 기온보정강도(Tn)를 더한 «호칭강도»로 주문합니다(KCS 14 20 10 2.2.2 · 식 2.2-2). 타설일부터 관리재령까지의 "
              "예상평균기온이 0 ℃ 이상 4 ℃ 미만이면 한중 표(KCS 14 20 40 표 2.2-1), 4 ℃ 이상이면 일반 표(KCS 14 20 10 표 2.2-1)로 셈 합니다.")
    g.sec(p, "㉮  품질기준강도", need=26 * 4)
    p.row([(6, "항    목", H), (2, "적 는 값", H), (1, "단위", H), (3, "비    고", H)], h=26)
    p.row([(6, "설계기준압축강도 fck", {"kind": "text", "size": 9.5}), (2, I("fck", ex=24, fmt='0.#;;""', align="center")), (1, "MPa", {"kind": "ctext", "size": 8.5}),
           (3, "구조 도면 · 설계도서", {"kind": "ctext", "size": 8.5})], h=24)
    p.row([(6, "내구성기준압축강도 fcd", {"kind": "text", "size": 9.5}), (2, I("fcd", ex=24, fmt='0.#;;""', align="center")), (1, "MPa", {"kind": "ctext", "size": 8.5}),
           (3, "노출 범주 — 없으면 빈칸", {"kind": "ctext", "size": 8.5})], h=24)
    p.row([(6, "품질기준강도 fcq = max(fck, fcd)  (식 2.2-1)", S), (2, F("fcq", '=IF(COUNT({fck},{fcd})=0,"",MAX(N({fck}),N({fcd})))', fmt='0.#;;""',
                                                                    align="center", bold=True)),
           (1, "MPa", {"kind": "ctext", "size": 8.5}), (3, "", S)], h=24)
    g.sec(p, "㉯  기온보정강도 Tn", need=26 * 8)
    p.row([(4, "시멘트 종류", L), (8, I("시멘트", ex=CEM1, dv=CEMS, align="center", size=9))], h=26)
    p.row([(4, "관리재령", L), (2, I("재령", ex="28일", dv=AGES, align="center")),
           (4, "타설일 → 관리재령 예상평균기온 ℃", dict(L, size=8.5)), (2, I("예상", ex=3.2, fmt='0.0;-0.0;0.0', align="center"))], h=26)
    p.row([(8, "28일 관리 · 0 ℃ 이상 4 ℃ 미만 — 28일 안에 품질기준강도가 나오게 초기 · 계속 보온 양생 계획을 세워 책임기술자 승인",
            {"kind": "text", "size": 8.5}), (2, I("승인28", ex="예", dv=YA, align="center")), (2, "", {"kind": "text"})], h=30)
    p.row([(4, "Tn (표에서 저절로)", L), (2, F("Tn자동", _tn_auto(), fmt='0;;0', align="center")),
           (6, F("Tn근거", '=IF(OR(COUNT({예상})=0,{재령}="",{시멘트}=""),"",IF({예상}<0,"⚠ 예상평균기온 0 ℃ 밑 — 표 범위 밖: 보온 양생 계획으로 0 ℃ 이상이 되게 하고 Tn 은 책임기술자와 정해 아래 칸에",'
                            'IF({예상}<4,"KCS 14 20 40 표 2.2-1 (0 ℃ 이상 4 ℃ 미만 · "&{재령}&")"&IF(AND({재령}="28일",{승인28}<>"예"),'
                            '" — ⚠ 28일 관리는 보온 양생 계획 승인이 있을 때만(아니면 42 · 56 · 91일)",""),'
                            'IF({재령}="91일","⚠ KCS 14 20 10 표 2.2-1 에 91일이 없음 — 책임기술자와 정해 아래 칸에",'
                            '"KCS 14 20 10 표 2.2-1 (4 ℃ 이상 · "&{재령}&")"))))', align="left", size=8.5))], h=30)
    p.row([(4, "Tn 직접 (책임기술자와 정한 값)", L), (2, I("Tn직접", fmt='0.#;;0', align="center")),
           (6, "적으면 이 값을 씁니다 — 표 범위 밖이거나 시험 · 실적으로 따로 정했을 때", {"kind": "text", "size": 8.5})], h=26)
    p.row([(4, "쓰는 Tn", S), (2, F("Tn", '=IF(COUNT({Tn직접})=1,{Tn직접},{Tn자동})', fmt='0.#;;0', align="center", bold=True)),
           (6, "MPa", {"kind": "text", "size": 9})], h=26)
    p.row([(4, "강도를 정하는 방법", L), (4, I("방법", ex="기온보정강도(Tn)", dv=WAYS, align="center", size=9)),
           (4, "적산온도 방식이면 Tn 을 더하지 않음(KCS 14 20 40 2.2.2(8))", {"kind": "text", "size": 8})], h=26)
    g.sec(p, "㉰  호칭강도 — 레미콘 주문", need=30 + 34)
    p.row([(4, "호칭강도 fcn = fcq + Tn  (식 2.2-2)", S),
           (2, F("fcn", '=IF(OR({fcq}="",{방법}="적산온도 방식",COUNT({Tn})=0),"",{fcq}+{Tn})', fmt='0.#;;""', align="center", bold=True)),
           (6, "MPa", {"kind": "text", "size": 9})], h=30)
    p.row([(3, "주    문", L),
           (9, F("주문", '=IF({방법}="적산온도 방식","적산온도 방식 — 기온보정강도를 더하지 않음 · 압축강도 시험 재령은 ④ 장의 Z20 = M / 30 (KCS 14 20 40 식 3.5-1)",'
                         'IF({fcn}="","","레미콘을 호칭강도 "&{fcn}&" MPa 이상으로 주문 (품질기준강도 "&{fcq}&" + Tn "&{Tn}&") — KS 규격에 없는 값이면 그보다 높은 규격"))',
                 align="left", bold=True, size=9.5))], h=34)
    g.sec(p, "㉱  배합 확인", need=26 * 7)
    p.row([(5, "항    목", H), (2, "적 는 값", H), (5, "판    정", H)], h=26)
    hj = '{판정!종류}="한중"'
    p.row([(5, "물-결합재비 W/B %", {"kind": "text", "size": 9.5}), (2, I("WB", ex=50, fmt='0.#;;""', align="center")),
           (5, F("WB판", f'=IF(COUNT({{WB}})=0,"",IF({hj},IF({{WB}}<=60,"✓ 60 % 이하 (한중 2.2.2)","⚠ 60 % 넘음 — 한중은 원칙적으로 60 % 이하"),"—"))',
                 align="center", size=9))], h=24)
    p.row([(5, "공기연행(AE) 콘크리트", {"kind": "text", "size": 9.5}), (2, I("AE", ex="예", dv=YA, align="center")),
           (5, F("AE판", f'=IF({{AE}}="","",IF({hj},IF({{AE}}="예","✓ 공기연행 — 한중의 원칙 (2.2.1)","⚠ 한중은 공기연행콘크리트가 원칙"),"—"))',
                 align="center", size=9))], h=24)
    p.row([(5, "플라이 애시 치환 % (결합재 대비)", {"kind": "text", "size": 9.5}), (2, I("FA", ex=10, fmt='0.#;;""', align="center")),
           (5, F("FA판", f'=IF(COUNT({{FA}})=0,"",IF({hj},IF({{FA}}<=15,"✓ 15 % 이하 (표 2.1-1)","⚠ 15 % 넘음 — 한중 최대 15 %"),"—"))', align="center", size=9))], h=24)
    p.row([(5, "고로슬래그 미분말 치환 %", {"kind": "text", "size": 9.5}), (2, I("BS", ex=0, fmt='0.#;;0', align="center")),
           (5, F("BS판", f'=IF(COUNT({{BS}})=0,"",IF({hj},IF(AND(N({{FA}})>0,N({{BS}})>0),IF(AND({{FA}}+{{BS}}<=30,{{FA}}<=15),"✓ 섞어 씀 30 % 이하 (FA 15 % 이하)",'
                         '"⚠ 섞어 쓰면 합 30 % · FA 15 % 이하"),IF({BS}<=30,"✓ 30 % 이하 (표 2.1-1)","⚠ 30 % 넘음 — 한중 최대 30 %")),"—"))', align="center", size=9))], h=24)
    p.row([(5, "단위수량 ㎏/㎥", {"kind": "text", "size": 9.5}), (2, I("단위수량", ex=172, fmt='0;;""', align="center")),
           (5, F("수량판", '=IF(COUNT({단위수량})=0,"",IF({단위수량}<=185,"✓ 185 ㎏/㎥ 이내 (KCS 14 20 10 2.2.4)","⚠ 185 ㎏/㎥ 넘음"))', align="center", size=9))], h=24)
    p.k["배판[]"] = f"{p.k['WB판']}:{p.k['수량판']}"
    p.row([(3, "배 합 요 약", S),
           (9, F("배합요약", '=IF(AND({fcn}="",COUNT({WB},{FA},{BS},{단위수량})=0,{AE}=""),"",IF(' + _cnt_warn("{배판[]}") + '>0,"⚠ 확인할 것 "&' + _cnt_warn("{배판[]}") + '&"곳 — 위 ⚠ 칸",'
                             'IF({fcn}="","✓ 배합 확인 — 호칭강도는 ㉯ · ㉰ 를 채우면","✓ 호칭강도 "&{fcn}&" MPa · 배합 확인 "&COUNTIF({배판[]},"✓*")&"가지")))',
                 align="left", bold=True, size=9.5))], h=26)
    g.d.done(p)
    p.after_note(["예상평균기온은 기상청 평년값에, 초기 보온 양생 동안은 구조체 표면의 예상 양생 온도를 넣어 구합니다(KCS 14 20 40 1.3). "
                  "보온 양생으로 4 ℃ 이상이 되게 계획하면 일반 표로 셈 합니다(2.2.2(5))."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 배합 · 기온)."])
    return p


# ── ③ 타설 · 양생 계획 ──────────────────────────────────────────────────
def yangsaeng(bk, ex):
    p = g.pg(bk, ex, "타설양생", fit=1)
    p.row([(PC, "③  타설 · 양생 계획", {"kind": "h2", "size": 14})], h=30)
    kind = "{판정!종류}"
    g.sec(p, "㉮  타    설", need=26 * 5)
    p.row([(4, "부재 단면 두께 mm", L), (2, I("두께", ex=600, fmt='#,##0;;""', align="center")),
           (4, "기상 조건이 가혹 (강풍 · 한파)", dict(L, size=8.5)), (2, I("가혹", ex="아니오", dv=YA, align="center"))], h=26)
    p.row([(4, "계획 타설 온도 최저 ℃", L), (2, I("타최저", ex=10, fmt='0.#;-0.#;0', align="center")),
           (4, "계획 타설 온도 최고 ℃", L), (2, I("타최고", ex=18, fmt='0.#;-0.#;0', align="center"))], h=26)
    low = 'IF(OR(AND(COUNT({두께})=1,N({두께})<=300),{가혹}="예"),10,5)'
    p.row([(4, "타설 온도 기준", L),
           (8, F("타기준", f'=IF({kind}="한중",IF({low}=10,"10 ~ 20 ℃ — 단면 300 mm 이하 · 가혹한 기상이면 최저 10 ℃ (3.3)","5 ~ 20 ℃ (KCS 14 20 40 3.3)"),'
                           f'IF({kind}="서중","35 ℃ 이하 (KCS 14 20 41 3.3)",""))', align="left", size=9))], h=26)
    p.row([(4, "타설 온도 판정", L),
           (8, F("타판정", f'=IF(OR({kind}="",{kind}="일반",COUNT({{타최저}},{{타최고}})=0),"",IF({kind}="한중",'
                           f'IF(AND(N({{타최저}})>={low},N({{타최고}})<=20,COUNT({{타최저}})=1,COUNT({{타최고}})=1),"✓ 계획 온도가 기준 안",'
                           f'"⚠ 기준 밖 — 최저 "&{low}&" ℃ 이상 · 최고 20 ℃ 이하로 계획"),IF(N({{타최고}})<=35,"✓ 35 ℃ 이하","⚠ 35 ℃ 넘음 — 재료 온도를 낮추고 다시 계획")))',
                 align="left", size=9))], h=26)
    p.row([(4, "비빔 → 타설 끝 시간 (h)", L), (2, I("운반", ex=1.2, fmt='0.0#;;""', align="center")),
           (6, F("운반판", f'=IF(COUNT({{운반}})=0,"",IF({kind}="서중",IF({{운반}}<=1.5,"✓ 1.5시간 이내 (3.3)","⚠ 1.5시간 넘음 — 슬럼프 유지 · 응결 지연 조치 + 책임기술자 승인"),'
                           f'IF({kind}="한중","열 손실을 줄이게 운반 (3.2) — 보온 덮개 · 대기 줄이기","")))', align="left", size=8.5))], h=26)
    g.sec(p, "㉯  초기양생 — 한중 (KCS 14 20 40 표 3.4-1 · 3.4-2)", need=26 * 5)
    p.row([(4, "구조물의 노출", L), (4, I("노출", ex=EXPO2, dv=f"{EXPO1},{EXPO2}", align="center", size=9)),
           (2, "양생 온도", L), (2, I("양생온도", ex="10 ℃", dv="5 ℃,10 ℃", align="center"))], h=26)
    p.row([(4, "시멘트 (양생 표)", L), (8, I("시멘트2", ex=CC1, dv=CCS, align="center", size=9))], h=26)
    need_f = (f'=IF(OR({kind}<>"한중",{{노출}}=""),"",IF({{노출}}="{EXPO2}",5,IF(COUNT({{두께}})=0,"",IF({{두께}}<=300,15,IF({{두께}}<=800,12,10)))))')
    p.row([(4, "양생 끝 소요 압축강도", L), (2, F("소요강도", need_f, fmt='0;;""', align="center", bold=True)), (1, "MPa", {"kind": "ctext", "size": 8.5}),
           (5, F("소요근거", f'=IF({{소요강도}}="",IF(AND({kind}="한중",{{노출}}="{EXPO1}",COUNT({{두께}})=0),"단면 두께를 적으세요",""),'
                             f'"표 3.4-1 — "&{{노출}}&IF({{노출}}="{EXPO1}"," · 단면 "&TEXT({{두께}},"#,##0")&" mm",""))', align="left", size=8.5))], h=26)
    def _pick(xs):
        return 'IF({시멘트2}="' + CC1 + '",' + str(xs[0]) + ',IF({시멘트2}="' + CC2 + '",' + str(xs[1]) + ',' + str(xs[2]) + '))'
    cure = ('IF(OR({노출}="",{양생온도}="",{시멘트2}=""),"",IF({노출}="' + EXPO1 + '",IF({양생온도}="5 ℃",' + _pick(CURE[(EXPO1, "5 ℃")]) + ',' + _pick(CURE[(EXPO1, "10 ℃")]) + '),'
            'IF({양생온도}="5 ℃",' + _pick(CURE[(EXPO2, "5 ℃")]) + ',' + _pick(CURE[(EXPO2, "10 ℃")]) + ')))')
    p.row([(4, "양생일수 표준 (보통 단면)", L), (2, F("양생일수", f'=IF({kind}<>"한중","",{cure})', fmt='0"일";;""', align="center", bold=True)),
           (6, F("초기양생", f'=IF(OR({kind}<>"한중",{{소요강도}}=""),"","콘크리트 온도 5 ℃ 이상으로 "&{{소요강도}}&" MPa 까지"&IF({{양생일수}}=""," ",'
                             f'"(표준 "&{{양생일수}}&"일)")&" → 그 뒤 2일간 어느 부분이라도 0 ℃ 이상 (3.4.1)")', align="left", size=8.5))], h=30)
    g.sec(p, "㉰  습윤 양생 — 일반 · 서중 (KCS 14 20 10 표 3.4-1)", need=26 * 2)
    wet = ('IF({습기온}>=15,' + _pick(WET[0][1]) + ',IF({습기온}>=10,' + _pick(WET[1][1]) + ',' + _pick(WET[2][1]) + '))')
    p.row([(4, "양생 기간 일평균기온 ℃", L), (2, I("습기온", blank='=IF(COUNT({판정!일평균})=1,{판정!일평균},"")', fmt='0.0;-0.0;0.0', align="center")),
           (6, F("습윤", f'=IF(OR({kind}="",COUNT({{습기온}})=0,{{시멘트2}}=""),"",IF({kind}="한중","한중 — 위 ㉯ 의 초기양생 · 보온 양생을 따름",'
                         f'IF({{습기온}}<5,"⚠ 5 ℃ 밑 — 한중 양생으로 다시 계획","습윤 양생 "&{wet}&"일 이상 — 노출면이 마르지 않게 살수 (3.4.2)")))',
                 align="left", size=8.5))], h=26)
    g.sec(p, "㉱  보온 · 온도 관리", need=26 * 5)
    p.row([(4, "보온 양생 방법", L), (8, I("보온방법", ex="단열 양생 + 피복 양생", dv=HEAT, align="center", size=9))], h=26)
    p.row([(4, "보온 설비 · 재료", L), (8, I("보온설비", ex="전기 열풍기 4대 · 보온 덮개 2겹 · 천막 바람막이", size=9))], h=26)
    p.row([(4, "사용 거푸집 (보온성)", L), (8, I("거푸집", ex="합판 거푸집 + 바깥 단열재", size=9))], h=26)
    p.row([(4, "온도 기록", L), (8, I("기록계", ex="자기온도기록계 3곳 (콘크리트 · 보온 공간 · 외기)", size=9))], h=26)
    p.row([(4, "서중 대책 (재료 · 운반)", L), (8, I("서중대책", size=9))], h=26)
    YW = '(IF(LEFT({타판정},1)="⚠",1,0)+IF(LEFT({운반판},1)="⚠",1,0))'
    p.row([(3, "요    약", S),
           (9, F("양생요약", f'=IF({kind}="","",IF(' + YW + '>0,"⚠ 확인할 것 "&' + YW + '&"곳 — 위 ⚠ 칸",'
                             f'IF({kind}="한중",IF({{초기양생}}="","❄ 한중 — 노출 · 양생 온도 · 시멘트를 고르면 양생 기준이 나옵니다","❄ "&{{초기양생}}),'
                             f'IF({{습윤}}="",{kind}&" 콘크리트","☀ "&{{습윤}}))))', align="left", bold=True, size=9))], h=30)
    g.d.done(p)
    p.after_note(["양생을 끝낼 때와 거푸집 · 동바리를 뗄 때는 현장과 같은 조건에서 양생한 공시체의 강도로 정합니다(KCS 14 20 40 3.4.1(7) · 3.5(2)) — ④ 장에 적습니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 부재 · 설비)."])
    return p


# ── ④ 양생 온도 기록 · 적산온도 ────────────────────────────────────────
def ondo(bk, ex):
    p = g.pg(bk, ex, "온도기록", fit=1)
    p.row([(PC, "④  양생 온도 기록 · 적산온도", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 적산온도 M = Σ(θ + 10)Δt (°D·D) — θ: 그날 콘크리트(보온 공간) 평균 온도 ℃ · Δt: 1일. 20 ℃ 로 환산한 재령 Z20 = M / 30 (KCS 14 20 40 식 3.5-1). "
              "타설 다음 날부터 날마다 적으면 저절로 이어서 셈 됩니다.")
    p.row([(2, "날    짜", H), (1, "재령", dict(H, size=9)), (1, "평균 θ ℃", dict(H, size=8)), (1, "최저 ℃", dict(H, size=8.5)), (1, "외기 최저", dict(H, size=8)),
           (1, "θ + 10", dict(H, size=8.5)), (1, "적산온도 M", dict(H, size=8)), (1, "20 ℃ 환산", dict(H, size=8)), (1, "온도 확인", dict(H, size=8)),
           (2, "비    고", dict(H, size=9))], h=30)
    for i in range(1, N_T + 1):
        e = EX_T[i - 1] if i <= len(EX_T) else (None, None, None)
        dflt = '=IF(N({판정!타설일})=0,"",{판정!타설일}+1)' if i == 1 else f'=IF(N({{날짜#{i - 1}}})=0,"",{{날짜#{i - 1}}}+1)'
        p.row([(2, I(f"날짜#{i}", blank=dflt, fmt=DT, align="center", size=8.5)),
               (1, F(f"재령#{i}", f'=IF(OR(N({{날짜#{i}}})=0,N({{판정!타설일}})=0),"",{{날짜#{i}}}-{{판정!타설일}})', fmt='0;-0;0', align="center", size=8.5)),
               (1, I(f"평균#{i}", ex=e[0], fmt='0.0;-0.0;0.0', align="center", size=8.5)),
               (1, I(f"최저#{i}", ex=e[1], fmt='0.0;-0.0;0.0', align="center", size=8.5)),
               (1, I(f"외기#{i}", ex=e[2], fmt='0.0;-0.0;0.0', align="center", size=8.5)),
               (1, F(f"기여#{i}", f'=IF(COUNT({{평균#{i}}})=0,"",MAX(0,{{평균#{i}}}+10))', fmt='0.0;;0.0', align="center", size=8.5)),
               (1, F(f"M#{i}", f'=IF(COUNT({{평균#{i}}})=0,"",SUM({{기여#1}}:{{기여#{i}}}))', fmt='#,##0.0;;""', align="center", size=8.5)),
               (1, F(f"Z#{i}", f'=IF({{M#{i}}}="","",ROUND({{M#{i}}}/30,1))', fmt='0.0"일";;""', align="center", size=8.5)),
               (1, F(f"확인#{i}", f'=IF(COUNT({{최저#{i}}})=0,"",IF({{최저#{i}}}<0,"⚠ 0 ℃ 밑",IF({{최저#{i}}}<5,"5 ℃ 밑","✓")))', align="center", size=8)),
               (2, I(f"비고#{i}", ex=(EX_T_NOTE[i - 1] or None) if i <= len(EX_T_NOTE) else None, size=8))], h=22)
    for k in ("M", "평균", "확인"):
        _rng(p, k, N_T)
    p.row([(4, "적산온도 (마지막 날)", S), (2, F("M끝", '=IF(COUNT({M[]})=0,"",MAX({M[]}))', fmt='#,##0.0;;""', align="center", bold=True)),
           (1, "°D·D", {"kind": "ctext", "size": 8}), (3, "20 ℃ 환산 재령 Z20", S),
           (2, F("Z끝", '=IF({M끝}="","",ROUND({M끝}/30,1))', fmt='0.0"일";;""', align="center", bold=True))], h=26)
    p.row([(4, "20 ℃ 28일(840 °D·D) 대비", S), (2, F("M비", '=IF({M끝}="","",ROUND({M끝}/840*100,0)&" %")', align="center")),
           (6, F("온도요약", '=IF(COUNT({평균[]})=0,"",IF(COUNTIF({확인[]},"⚠*")>0,"⚠ 0 ℃ 밑인 날 "&COUNTIF({확인[]},"⚠*")&"일 — 보온 보강 · 책임기술자 확인",'
                             '"기록 "&COUNT({평균[]})&"일 · 5 ℃ 밑 "&COUNTIF({확인[]},"5 ℃ 밑")&"일"&IF(COUNTIF({확인[]},"5 ℃ 밑")>0," (초기양생 중이면 안 됨)","")))',
                 align="left", size=8.5))], h=26)
    g.sec(p, "공시체 강도 — 현장과 같은 조건에서 양생 (KCI-CT 118)", need=26 * (N_K + 2))
    p.row([(3, "시 험 일", H), (2, "재령 (일)", H), (2, "강도 MPa", H), (5, "판    정", H)], h=26)
    need = "{타설양생!소요강도}"
    for j in range(1, N_K + 1):
        e = EX_K[j - 1] if j <= len(EX_K) else (None, None)
        p.row([(3, I(f"공날#{j}", ex=e[0], fmt=DT, align="center", size=9)),
               (2, F(f"공재령#{j}", f'=IF(OR(N({{공날#{j}}})=0,N({{판정!타설일}})=0),"",{{공날#{j}}}-{{판정!타설일}})', fmt='0;-0;0', align="center", size=9)),
               (2, I(f"공강도#{j}", ex=e[1], fmt='0.0#;;""', align="center", size=9)),
               (5, F(f"공판#{j}", f'=IF(COUNT({{공강도#{j}}})=0,"",IF(COUNT({need})=0,"③ 장의 소요 압축강도가 없음",IF({{공강도#{j}}}>={need},"✓ 소요 "&{need}&" MPa 이상",'
                                  f'"소요 "&{need}&" MPa 밑 — 보온 양생 이어서")))', align="center", size=9))], h=24)
    _rng(p, "공판", N_K)
    _rng(p, "공강도", N_K)
    p.row([(3, "초기양생 끝", L),
           (9, F("종료", '=IF(COUNT({공강도[]})=0,"",IF(COUNTIF({공판[]},"✓*")>0,"✓ 공시체 강도가 소요 강도 이상 — 책임기술자 승인 뒤 초기양생 끝 · 그 뒤 2일간 0 ℃ 이상 유지",'
                         '"아직 — 소요 강도가 나올 때까지 콘크리트 온도 5 ℃ 이상"))', align="left", bold=True, size=9))], h=30)
    g.note(p, "※ 2024 개정 KCS 14 20 40 은 양생 끝 · 거푸집 해체 시기를 공시체 강도로 정합니다 — 적산온도는 강도가 나는 정도를 가늠하는 참고 값입니다. "
              "적산온도 방식으로 배합을 정했으면 압축강도 시험 재령은 Z20 = M / 30 으로 정합니다(시험체는 (20 ± 2) ℃ 수중양생).")
    g.d.done(p)
    p.after_note(["날짜는 타설일 다음 날부터 저절로 이어집니다(고쳐 써도 됩니다). 평균 · 최저는 자기온도기록계의 콘크리트(보온 공간) 온도를 적습니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 온도 · 강도)."])
    return p


# ── ⑤ 시공 전 확인 · 승인 ──────────────────────────────────────────────
def hwagin(bk, ex):
    p = g.pg(bk, ex, "확인", fit=1)
    p.row([(PC, "⑤  시공 전 확인 · 책임기술자 승인", {"kind": "h2", "size": 14})], h=30)
    p.row([(3, "콘크리트 종류", L), (9, F("확판정", '=IF({판정!판정}="","",{판정!판정})', align="left", bold=True, size=9.5))], h=28)
    for title, key, items, exv, kind in (("1.  한중 콘크리트 — 확인할 것 (KCS 14 20 40)", "한", HAN, EX_HAN, "한중"),
                                         ("2.  서중 콘크리트 — 확인할 것 (KCS 14 20 41)", "서", SEO, EX_SEO, "서중")):
        g.sec(p, title, need=26 + 24 * (len(items) + 1))
        p.row([(1, "번호", H), (9, "확 인 할 것", H), (2, "확    인", H)], h=26)
        for j, t in enumerate(items, 1):
            p.row([(1, str(j), {"kind": "ctext", "size": 9}), (9, t, {"kind": "text", "size": 8.5}),
                   (2, I(f"{key}#{j}", ex=exv[j - 1], dv=CHK, align="center", size=9))], h=24)
        _rng(p, key, len(items))
        m = len(items)
        r = f"{{{key}[]}}"
        p.row([(3, "확 인 요 약", S),
               (9, F(f"{key}요약", f'=IF(COUNTA({r})=0,"",IF(COUNTIF({r},"해당 없음")={m},"해당 없음 ({kind} 아님)",IF(COUNTIF({r},"○")+COUNTIF({r},"해당 없음")={m},'
                                 f'"✓ {m}가지 모두 확인",IF(COUNTIF({r},"×")>0,"⚠ × "&COUNTIF({r},"×")&"가지 — 고친 뒤 타설","남은 것 "&({m}-COUNTA({r}))&"가지"))))',
                     align="left", bold=True, size=9))], h=26)
    g.sec(p, "3.  책임기술자 승인", need=26 * 3)
    p.row([(3, "책임기술자", L), (3, I("책임기술자", ex="이감리", align="center")), (2, "승 인 일", L),
           (4, I("승인일", ex=D(2026, 12, 2), fmt=DT, align="center"))], h=26)
    p.row([(3, "타설 전 승인", L),
           (9, F("승인판", '=IF(OR(N({승인일})=0,N({판정!타설일})=0),"",IF({승인일}>{판정!타설일},"⚠ 승인일이 타설일 뒤 — 타설 전에 승인받아야 합니다",'
                           '"✓ 타설 "&TEXT({판정!타설일}-{승인일},"0")&"일 전 승인"))', align="left", size=9.5))], h=26)
    p.date_line("작성일", ex=D(2026, 12, 1))
    p.row([(6, "", FR), (2, "작 성 자", {"kind": "free", "bold": True, "align": "center"}),
           (2, F("작성자표시", '=TRIM({판정!시공사}&" "&{판정!현장대리인})', align="center", size=9.5)), (2, "(서명 또는 인)", {"kind": "free", "align": "center", "size": 9})], h=26)
    g.note(p, "※ 서중 콘크리트는 공사 시작 전에 시공계획서를 책임기술자에게 승인받아야 합니다(KCS 14 20 41 3.1). 한중 콘크리트의 28일 관리(0 ~ 4 ℃)도 "
              "보온 양생 계획의 승인이 있어야 합니다(KCS 14 20 40 2.2.2(7)). 양생 중에는 «콘크리트 양생 관리대장»에 날마다 남깁니다.")
    g.d.done(p)
    p.after_note(["○ · × · 해당 없음을 고르면 요약이 저절로 바뀝니다. 한중이 아니면 1. 을, 서중이 아니면 2. 를 «해당 없음»으로 둡니다."] if not ex else
                 ["이 시트는 작성 예시입니다(× 없음 · 불 피우는 보온 없음)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    panjeong(bk, ex)
    baehap(bk, ex)
    yangsaeng(bk, ex)
    ondo(bk, ex)
    hwagin(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _n(v):
    return v if _num(v) else 0


def _r(v, nd):
    """엑셀 ROUND 처럼(0.5 는 올림)"""
    q = Decimal(1).scaleb(-nd)
    return float(Decimal(str(v)).quantize(q, rounding=ROUND_HALF_UP))


def _s(v):
    """수를 & 로 이을 때의 글(엑셀 · 사이트 셈과 같게 — 정수면 소수점 없이)"""
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v)


def _given(d, k):
    v = d.get(k)
    return None if (isinstance(v, str) and v.startswith("=")) else v


def tn_auto(t, a, c):
    if not _num(t) or not a or not c:
        return ""
    if t < 0:
        return ""
    if t < 4:
        return {"28일": 6, "42일": 6, "56일": 3}.get(a, 0)
    if a == "91일":
        return ""
    if c == CEM1:
        return (0 if t >= 18 else 3 if t >= 8 else 6) if a == "28일" else (0 if t >= 12 else 3) if a == "42일" else (0 if t >= 7 else 3)
    if c == CEM2:
        return (0 if t >= 18 else 3 if t >= 10 else 6) if a == "28일" else (0 if t >= 13 else 3 if t >= 5 else 6) if a == "42일" else (0 if t >= 8 else 3)
    return (0 if t >= 18 else 3 if t >= 13 else 6) if a == "28일" else (0 if t >= 14 else 3 if t >= 10 else 6) if a == "42일" else (0 if t >= 10 else 3 if t >= 5 else 6)


def expect(pages):
    pj, bh, ys, od, hw = (pages[k] for k in ("판정", "배합", "타설양생", "온도기록", "확인"))
    a = {}
    av, lo, hi, dh = pj.get("일평균"), pj.get("최저"), pj.get("최고"), pj.get("동해")
    a["판1"] = "" if not _num(av) else ("❄ 4 ℃ 이하 — 한중" if av <= 4 else "☀ 25 ℃ 초과 — 서중" if av > 25 else "4 ℃ 초과 · 25 ℃ 이하")
    a["판2"] = "" if not _num(lo) else ("❄ 0 ℃ 이하 — 한중" if lo <= 0 else "0 ℃ 초과")
    a["판3"] = "" if not _num(hi) else ("☀ 30 ℃ 초과 — 서중" if hi > 30 else "30 ℃ 이하")
    a["판4"] = "" if not dh else ("❄ 초기동해 위험 — 한중" if dh == "있음" else "없음")
    han = any(a[k].startswith("❄") for k in ("판1", "판2", "판4"))
    seo = any(a[k].startswith("☀") for k in ("판1", "판3"))
    nn = sum(_num(x) for x in (av, lo, hi))
    if nn + (1 if dh else 0) == 0:
        pr = ""
    elif han and seo:
        pr = "⚠ 한중 · 서중 조건이 함께 나옵니다 — 예보 값을 다시 확인"
    elif han:
        pr = "❄ 한중 콘크리트로 시공 — KCS 14 20 40"
    elif seo:
        pr = "☀ 서중 콘크리트로 시공 — KCS 14 20 41 · 시공계획서 책임기술자 승인"
    elif nn < 3:
        pr = "⚠ 일평균 · 최저 · 최고기온 예보를 모두 적으세요"
    else:
        pr = "일반 콘크리트 — 한중 · 서중 조건 아님 (KCS 14 20 10)"
    a["판정"] = pr
    kind = "한중" if pr.startswith("❄") else "서중" if pr.startswith("☀") else "일반" if pr.startswith("일반") else ""
    a["종류"] = kind
    a["따름"] = {"한중": "② ~ ⑤ 장 — KCS 14 20 40 한중 콘크리트(2024)", "서중": "② ~ ⑤ 장 — KCS 14 20 41 서중 콘크리트(2025)",
               "일반": "② · ③ 장 — KCS 14 20 10 일반콘크리트(2024)"}.get(kind, "")
    # 배합
    b = {}
    fck, fcd = bh.get("fck"), bh.get("fcd")
    fcq = "" if not (_num(fck) or _num(fcd)) else max(_n(fck), _n(fcd))
    b["fcq"] = fcq
    t, ag, cm, ok28 = bh.get("예상"), bh.get("재령"), bh.get("시멘트"), bh.get("승인28")
    ta = tn_auto(t, ag, cm)
    b["Tn자동"] = ta
    if not _num(t) or not ag or not cm:
        gn = ""
    elif t < 0:
        gn = "⚠ 예상평균기온 0 ℃ 밑 — 표 범위 밖: 보온 양생 계획으로 0 ℃ 이상이 되게 하고 Tn 은 책임기술자와 정해 아래 칸에"
    elif t < 4:
        gn = f"KCS 14 20 40 표 2.2-1 (0 ℃ 이상 4 ℃ 미만 · {ag})" + (" — ⚠ 28일 관리는 보온 양생 계획 승인이 있을 때만(아니면 42 · 56 · 91일)" if (ag == "28일" and ok28 != "예") else "")
    elif ag == "91일":
        gn = "⚠ KCS 14 20 10 표 2.2-1 에 91일이 없음 — 책임기술자와 정해 아래 칸에"
    else:
        gn = f"KCS 14 20 10 표 2.2-1 (4 ℃ 이상 · {ag})"
    b["Tn근거"] = gn
    td = bh.get("Tn직접")
    tn = td if _num(td) else ta
    b["Tn"] = tn
    way = bh.get("방법")
    fcn = "" if (fcq == "" or way == "적산온도 방식" or not _num(tn)) else fcq + tn
    b["fcn"] = fcn
    if way == "적산온도 방식":
        b["주문"] = "적산온도 방식 — 기온보정강도를 더하지 않음 · 압축강도 시험 재령은 ④ 장의 Z20 = M / 30 (KCS 14 20 40 식 3.5-1)"
    elif fcn == "":
        b["주문"] = ""
    else:
        b["주문"] = f"레미콘을 호칭강도 {_s(fcn)} MPa 이상으로 주문 (품질기준강도 {_s(fcq)} + Tn {_s(tn)}) — KS 규격에 없는 값이면 그보다 높은 규격"
    hj = kind == "한중"
    wb, ae, fa, bs, uw = bh.get("WB"), bh.get("AE"), bh.get("FA"), bh.get("BS"), bh.get("단위수량")
    b["WB판"] = "" if not _num(wb) else (("✓ 60 % 이하 (한중 2.2.2)" if wb <= 60 else "⚠ 60 % 넘음 — 한중은 원칙적으로 60 % 이하") if hj else "—")
    b["AE판"] = "" if not ae else (("✓ 공기연행 — 한중의 원칙 (2.2.1)" if ae == "예" else "⚠ 한중은 공기연행콘크리트가 원칙") if hj else "—")
    b["FA판"] = "" if not _num(fa) else (("✓ 15 % 이하 (표 2.1-1)" if fa <= 15 else "⚠ 15 % 넘음 — 한중 최대 15 %") if hj else "—")
    if not _num(bs):
        b["BS판"] = ""
    elif not hj:
        b["BS판"] = "—"
    elif _n(fa) > 0 and _n(bs) > 0:
        b["BS판"] = "✓ 섞어 씀 30 % 이하 (FA 15 % 이하)" if (fa + bs <= 30 and fa <= 15) else "⚠ 섞어 쓰면 합 30 % · FA 15 % 이하"
    else:
        b["BS판"] = "✓ 30 % 이하 (표 2.1-1)" if bs <= 30 else "⚠ 30 % 넘음 — 한중 최대 30 %"
    b["수량판"] = "" if not _num(uw) else ("✓ 185 ㎏/㎥ 이내 (KCS 14 20 10 2.2.4)" if uw <= 185 else "⚠ 185 ㎏/㎥ 넘음")
    jd = [b[k] for k in ("WB판", "AE판", "FA판", "BS판", "수량판")]
    nw = sum(1 for x in jd if x.startswith("⚠"))
    if fcn == "" and not any(_num(x) for x in (wb, fa, bs, uw)) and not ae:
        b["배합요약"] = ""
    elif nw:
        b["배합요약"] = f"⚠ 확인할 것 {nw}곳 — 위 ⚠ 칸"
    elif fcn == "":
        b["배합요약"] = "✓ 배합 확인 — 호칭강도는 ㉯ · ㉰ 를 채우면"
    else:
        b["배합요약"] = f"✓ 호칭강도 {_s(fcn)} MPa · 배합 확인 {sum(1 for x in jd if x.startswith('✓'))}가지"
    # 타설 · 양생
    c = {}
    th, hv = ys.get("두께"), ys.get("가혹")
    low = 10 if ((_num(th) and th <= 300) or hv == "예") else 5
    c["타기준"] = (("10 ~ 20 ℃ — 단면 300 mm 이하 · 가혹한 기상이면 최저 10 ℃ (3.3)" if low == 10 else "5 ~ 20 ℃ (KCS 14 20 40 3.3)") if kind == "한중" else
                 "35 ℃ 이하 (KCS 14 20 41 3.3)" if kind == "서중" else "")
    tl, tu = ys.get("타최저"), ys.get("타최고")
    if kind in ("", "일반") or not (_num(tl) or _num(tu)):
        c["타판정"] = ""
    elif kind == "한중":
        c["타판정"] = "✓ 계획 온도가 기준 안" if (_num(tl) and _num(tu) and tl >= low and tu <= 20) else f"⚠ 기준 밖 — 최저 {low} ℃ 이상 · 최고 20 ℃ 이하로 계획"
    else:
        c["타판정"] = "✓ 35 ℃ 이하" if _n(tu) <= 35 else "⚠ 35 ℃ 넘음 — 재료 온도를 낮추고 다시 계획"
    un = ys.get("운반")
    c["운반판"] = "" if not _num(un) else (("✓ 1.5시간 이내 (3.3)" if un <= 1.5 else "⚠ 1.5시간 넘음 — 슬럼프 유지 · 응결 지연 조치 + 책임기술자 승인") if kind == "서중" else
                                         "열 손실을 줄이게 운반 (3.2) — 보온 덮개 · 대기 줄이기" if kind == "한중" else "")
    ex_, tt, c2 = ys.get("노출"), ys.get("양생온도"), ys.get("시멘트2")
    if kind != "한중" or not ex_:
        need = ""
    elif ex_ == EXPO2:
        need = 5
    elif not _num(th):
        need = ""
    else:
        need = 15 if th <= 300 else 12 if th <= 800 else 10
    c["소요강도"] = need
    if need == "":
        c["소요근거"] = "단면 두께를 적으세요" if (kind == "한중" and ex_ == EXPO1 and not _num(th)) else ""
    else:
        c["소요근거"] = f"표 3.4-1 — {ex_}" + (f" · 단면 {th:,.0f} mm" if ex_ == EXPO1 else "")
    if kind != "한중" or not ex_ or not tt or not c2:
        days = ""
    else:
        days = CURE[(ex_, tt)][[CC1, CC2, CC3].index(c2)]
    c["양생일수"] = days
    c["초기양생"] = "" if (kind != "한중" or need == "") else (f"콘크리트 온도 5 ℃ 이상으로 {need} MPa 까지" + (" " if days == "" else f"(표준 {days}일)") +
                                                          " → 그 뒤 2일간 어느 부분이라도 0 ℃ 이상 (3.4.1)")
    wt = _given(ys, "습기온")
    if wt is None:
        wt = av if _num(av) else ""
    if kind == "" or not _num(wt) or not c2:
        c["습윤"] = ""
    elif kind == "한중":
        c["습윤"] = "한중 — 위 ㉯ 의 초기양생 · 보온 양생을 따름"
    elif wt < 5:
        c["습윤"] = "⚠ 5 ℃ 밑 — 한중 양생으로 다시 계획"
    else:
        j = [CC1, CC2, CC3].index(c2)
        dd = WET[0][1][j] if wt >= 15 else WET[1][1][j] if wt >= 10 else WET[2][1][j]
        c["습윤"] = f"습윤 양생 {dd}일 이상 — 노출면이 마르지 않게 살수 (3.4.2)"
    nw = sum(1 for k in ("타판정", "운반판") if c[k].startswith("⚠"))
    if kind == "":
        c["양생요약"] = ""
    elif nw:
        c["양생요약"] = f"⚠ 확인할 것 {nw}곳 — 위 ⚠ 칸"
    elif kind == "한중":
        c["양생요약"] = "❄ 한중 — 노출 · 양생 온도 · 시멘트를 고르면 양생 기준이 나옵니다" if c["초기양생"] == "" else "❄ " + c["초기양생"]
    else:
        c["양생요약"] = f"{kind} 콘크리트" if c["습윤"] == "" else "☀ " + c["습윤"]
    # 온도 기록
    o = {}
    st = pj.get("타설일")
    dates = []
    prev = None
    for i in range(1, N_T + 1):
        dv = _given(od, f"날짜#{i}")
        if dv is None:
            dv = (st + datetime.timedelta(days=1) if st else None) if i == 1 else (prev + datetime.timedelta(days=1) if prev else None)
        dates.append(dv)
        prev = dv
    tot, ms, avs, chk = 0.0, [], 0, []
    for i in range(1, N_T + 1):
        dv = dates[i - 1]
        o[f"재령#{i}"] = "" if not (dv and st) else (dv - st).days
        th_ = od.get(f"평균#{i}")
        if _num(th_):
            cv = max(0, th_ + 10)
            o[f"기여#{i}"] = cv
            tot += cv
            m = _r(tot, 6)
            o[f"M#{i}"] = m
            o[f"Z#{i}"] = _r(m / 30, 1)
            ms.append(m)
            avs += 1
        else:
            o[f"기여#{i}"] = ""
            o[f"M#{i}"] = ""
            o[f"Z#{i}"] = ""
        lw = od.get(f"최저#{i}")
        o[f"확인#{i}"] = "" if not _num(lw) else ("⚠ 0 ℃ 밑" if lw < 0 else "5 ℃ 밑" if lw < 5 else "✓")
        chk.append(o[f"확인#{i}"])
    mend = max(ms) if ms else ""
    o["M끝"] = mend
    o["Z끝"] = "" if mend == "" else _r(mend / 30, 1)
    o["M비"] = "" if mend == "" else f"{_s(_r(mend / 840 * 100, 0))} %"
    nz, n5 = sum(1 for x in chk if x.startswith("⚠")), chk.count("5 ℃ 밑")
    o["온도요약"] = "" if not avs else (f"⚠ 0 ℃ 밑인 날 {nz}일 — 보온 보강 · 책임기술자 확인" if nz else
                                     f"기록 {avs}일 · 5 ℃ 밑 {n5}일" + (" (초기양생 중이면 안 됨)" if n5 else ""))
    kp = []
    for j in range(1, N_K + 1):
        kd, ks = od.get(f"공날#{j}"), od.get(f"공강도#{j}")
        o[f"공재령#{j}"] = "" if not (kd and st) else (kd - st).days
        if not _num(ks):
            r = ""
        elif not _num(need):
            r = "③ 장의 소요 압축강도가 없음"
        elif ks >= need:
            r = f"✓ 소요 {need} MPa 이상"
        else:
            r = f"소요 {need} MPa 밑 — 보온 양생 이어서"
        o[f"공판#{j}"] = r
        kp.append(r)
    o["종료"] = "" if not any(_num(od.get(f"공강도#{j}")) for j in range(1, N_K + 1)) else ("✓ 공시체 강도가 소요 강도 이상 — 책임기술자 승인 뒤 초기양생 끝 · 그 뒤 2일간 0 ℃ 이상 유지" if any(x.startswith("✓") for x in kp) else
                                     "아직 — 소요 강도가 나올 때까지 콘크리트 온도 5 ℃ 이상")
    # 확인
    h = {"확판정": pr}
    for key, items, kd in (("한", HAN, "한중"), ("서", SEO, "서중")):
        vals = [hw.get(f"{key}#{j}") for j in range(1, len(items) + 1)]
        m = len(items)
        filled = sum(1 for v in vals if v not in (None, ""))
        if not filled:
            h[f"{key}요약"] = ""
        elif vals.count("해당 없음") == m:
            h[f"{key}요약"] = f"해당 없음 ({kd} 아님)"
        elif vals.count("○") + vals.count("해당 없음") == m:
            h[f"{key}요약"] = f"✓ {m}가지 모두 확인"
        elif "×" in vals:
            h[f"{key}요약"] = f"⚠ × {vals.count('×')}가지 — 고친 뒤 타설"
        else:
            h[f"{key}요약"] = f"남은 것 {m - filled}가지"
    sd = hw.get("승인일")
    h["승인판"] = "" if not (sd and st) else ("⚠ 승인일이 타설일 뒤 — 타설 전에 승인받아야 합니다" if sd > st else f"✓ 타설 {(st - sd).days}일 전 승인")
    h["작성자표시"] = " ".join(x for x in (pj.get("시공사") or "", pj.get("현장대리인") or "") if x).strip()
    return {"판정": a, "배합": b, "타설양생": c, "온도기록": o, "확인": h}
