# -*- coding: utf-8 -*-
"""한중 콘크리트 양생일지(부위 3곳 · 최저온도 · 적산온도 · 보온 공간 질식 예방) — 새로 만든 서식 (2026-11-20 G796)
   소장님 「우리 도구에 이거 있어? 없으면 만들어 줘. 아이디어 추가 해서 만들어 줘」(한중 콘크리트 관리 계획서 · 별첨1 양생일지 hwp)
   → 있는 것(한중 · 서중 시공계획서 · 양생 관리대장 · 혹서기 · 혹한기 대책)은 그대로 두고 «별첨 양생일지» 꼴을 새로:
   ① 양생일지 — 타설일 다음 날부터 7일(날짜 이어짐) · 부위 3곳(모퉁이 · 중앙 · 단부) 가장 낮은 온도 → 그날 최저 · 5 ℃ 밑 ⚠ · 0 ℃ 밑 ⚠ ·
      외기 최저 · 내일 최저 예보 · 조치 · 양생 담당 · 처음 3일 보온양생 확인 · 담당자 · 확인자
   ② 적산온도 · 초기양생 끝 — 그날 최저로 셈(안전쪽) M = Σ(θ + 10)Δt · Z20 = M / 30 · 공시체 강도 → 소요 압축강도 이상이면 초기양생 끝
   ③ 보온 공간 질식 · 화재 예방 — 들어가기 전 산소 · 일산화탄소 · 이산화탄소 → 적정공기 판정 · 환기 · 감시인 · 측정자 · 한 번 확인 6가지
근거(원문):
  · KCS 14 20 40 한중 콘크리트 : 2024 — 3.4.1 양생 중 콘크리트 온도 5 ℃ 이상 · 소요 압축강도(표 3.4-1)까지 · 그 뒤 2일간 0 ℃ 이상 · 3.5 식 (3.5-1) Z20 = M / 30
    (f_hanjung_seojung.py 에서 KCSC 원문으로 대조한 값 그대로 — 적산온도 A = 10 ℃ 도 같은 근거)
  · 산업안전보건기준에 관한 규칙 [시행 2026. 3. 2.] 제618조 3호 «적정공기» 산소 18 % 이상 23.5 % 미만 · 이산화탄소 1.5 % 미만 · 일산화탄소 30 ppm 미만 · 황화수소 10 ppm 미만 /
    제619조의2 측정 · 기록 · 제620조 환기 · 제621조 인원 점검 · 제622조 출입금지 표지 · 제623조 감시인 · 연락 설비 · 제625조 대피용 기구 (2026-11-20 국가법령정보센터 본문)
  · 받은 hwp «한중 콘크리트 관리 계획서»(별첨1 양생일지 · 7.보양 — 소화기 2개 이상 · 열원 위 함석 · 온도계는 열원에서 가장 먼 곳 바닥 1 m) — 현장 관리 글로만 씀
■ 짐작 안 함: 양생 끝 · 거푸집 해체는 공시체 강도로(2024 KCS) — 적산온도는 참고 · 소요 압축강도는 이용자가 적음(보통 단면 · 보통 노출 5 MPa)."""
import datetime
from decimal import ROUND_HALF_UP, Decimal

import sgw as g
from fb import F, I
from sgw import FR, H, L, PC, S

SLUG = "hanjung-ilji"
TITLE = "한중 콘크리트 양생일지"
WHERE = "forms"
XLSX = False          # 📄 G668 새 서식 — 사이트 작성 → 그림 PDF 만
MULTI = True
# 쪽: 빈 1 양생일지 · 2 적산온도 · 3 질식예방 / 예시 4 · 5 · 6
PREV = [(1, "① 양생일지 — 빈 서식 (부위 3곳 가장 낮은 온도 → 그날 최저 저절로)"),
        (4, "① 양생일지 — 작성 예시 (7일 · 5 ℃ 밑 ⚠ · 처음 3일 보온 확인)"),
        (5, "② 적산온도 · 초기양생 끝 — 작성 예시 (최저온도로 안전쪽 · 공시체 5 MPa)"),
        (6, "③ 보온 공간 질식 · 화재 예방 — 작성 예시 (산소 · 일산화탄소 → 적정공기)")]
SHORT = ("한중 콘크리트 양생일지 — 타설 다음 날부터 7일, 부위 3곳(모퉁이 · 중앙 · 단부)의 가장 낮은 온도를 적으면 그날 최저가 저절로 나오고 "
         "5 ℃ 밑 · 0 ℃ 밑이 표시됩니다. 처음 3일 보온양생 확인 · 적산온도 · 공시체로 초기양생 끝, 갈탄 · 열풍기 보온 공간의 산소 · 일산화탄소 확인까지 한 벌입니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
MD = 'm"/"d'
T1 = '0.0;-0.0;0.0'
CHK = "○,×,해당 없음"
HEAT = "급열 양생,단열 양생,피복 양생,단열 양생 + 피복 양생,급열 양생 + 피복 양생"
WARM = "열풍기(경유 · 등유),갈탄 · 숯 난로,전기 열풍기 · 전열,덮개 · 단열재만"
N_D = 7           # 날마다 — 타설 다음 날부터 7일(받은 hwp 주 1 «양생 기록은 7일간»)
N_K = 3           # 공시체

EX_D = [(8.5, 12.0, 9.0, -4.0, -6.0, "열풍기 4대", "박보온"), (7.0, 10.5, 8.0, -5.5, -3.0, "", "박보온"),
        (6.0, 9.0, 6.5, -2.0, -1.0, "", "박보온"), (4.5, 8.0, 5.5, -6.5, -2.0, "모서리 보강", "박보온"),
        (6.5, 9.5, 7.0, -1.0, 1.0, "", "박보온"), (7.5, 10.0, 8.0, 0.5, 2.0, "", "박보온"), (8.0, 11.0, 8.5, 1.5, None, "", "박보온")]
EX_K = [(D(2026, 12, 12), 4.1), (D(2026, 12, 13), 5.6)]
ONCE = ["출입금지 표지를 보온 공간 들어가는 곳에 붙임(제622조)",
        "감시인을 정해 바깥에 두고, 안과 바로 연락할 수 있게 함(제623조)",
        "공기호흡기 · 송기마스크 · 사다리 · 섬유로프 등 대피용 기구를 갖춤(제625조)",
        "산소 · 유해가스 측정자를 정하고 측정기를 줌 · 측정 방법 · 적정공기 기준을 알려 줌(제619조의2)",
        "열원 위 불막이(함석 등) · 소화기 2개 이상을 둠 · 연료는 열원에서 떨어뜨려 둠",
        "온도계는 열원에서 가장 먼 곳, 바닥에서 1 m 높이에 둠"]
EX_ONCE = ["○"] * len(ONCE)
EX_G = [(20.8, 12, 0.3, "○", "정감시", "한측정"), (20.5, 18, 0.4, "○", "정감시", "한측정"), (19.6, 35, 0.8, "○", "정감시", "한측정"),
        (20.9, 8, 0.2, "○", "정감시", "한측정"), (20.7, 10, 0.3, "○", "정감시", "한측정")]


def _rng(p, k, n):
    p.k[f"{k}[]"] = f"{p.k[f'{k}#1']}:{p.k[f'{k}#{n}']}"


# ── ① 양생일지 ─────────────────────────────────────────────────────────
def ilji(bk, ex):
    p = g.pg(bk, ex, "양생일지", fit=1)
    p.row([(PC, "①  한중 콘크리트 양생일지", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 부위 3곳(모퉁이 · 중앙 · 단부)에서 하루 2 ~ 3번 재고, 부위마다 가장 낮은 온도를 적습니다 — 그날 최저가 저절로 나옵니다. "
              "양생 중 콘크리트 온도는 5 ℃ 이상 — 소요 압축강도가 나올 때까지, 그 뒤 2일간은 0 ℃ 이상(KCS 14 20 40 3.4.1). 보온양생은 타설 뒤 3일 이상.")
    g.sec(p, "㉮  공사 · 타설", need=26 * 5)
    p.row([(3, "공  사  명", L), (9, I("공사명", ex="가나 물류센터 신축공사"))], h=26)
    p.row([(3, "시  공  사", L), (4, I("시공사", ex="예시건설(주)")), (2, "현장대리인", L), (3, I("현장대리인", ex="김철수", align="center"))], h=26)
    p.row([(3, "타 설 부 위", L), (5, I("타설부위", ex="지하 1층 기초 · 벽체")), (2, "타설량 ㎥", L),
           (2, I("타설량", ex=420, fmt='#,##0.#;;""', align="center"))], h=26)
    p.row([(3, "타  설  일", L), (3, I("타설일", ex=D(2026, 12, 9), fmt=DT, align="center")), (2, "양생 방법", L),
           (4, I("양생방법", ex="급열 양생 + 피복 양생", dv=HEAT, align="center", size=9))], h=26)
    p.row([(3, "보온 · 급열 설비", L), (9, I("설비", ex="열풍기(경유) 4대 · 천막 2겹 · 부직포 · 자기온도기록계 3곳"))], h=26)
    g.sec(p, "㉯  날마다 온도 — 부위마다 가장 낮은 온도 (℃)", need=30 + 22 * (N_D + 1))
    p.row([(2, "날    짜", H), (1, "재령", dict(H, size=9)), (1, "모퉁이", dict(H, size=8.5)), (1, "중앙", dict(H, size=8.5)), (1, "단부", dict(H, size=8.5)),
           (1, "그날 최저", dict(H, size=8)), (1, "판정", dict(H, size=8.5)), (1, "외기 최저", dict(H, size=8)), (1, "내일 예보", dict(H, size=8)),
           (1, "조치", dict(H, size=8.5)), (1, "양생 담당", dict(H, size=8))], h=30)
    for i in range(1, N_D + 1):
        e = EX_D[i - 1] if (ex and i <= len(EX_D)) else (None,) * 7
        dflt = '=IF(N({타설일})=0,"",{타설일}+1)' if i == 1 else f'=IF(N({{날짜#{i - 1}}})=0,"",{{날짜#{i - 1}}}+1)'
        three = f"{{모#{i}}},{{중#{i}}},{{단#{i}}}"
        p.row([(2, I(f"날짜#{i}", blank=dflt, fmt=DT, align="center", size=8.5)),
               (1, F(f"재령#{i}", f'=IF(OR(N({{날짜#{i}}})=0,N({{타설일}})=0),"",{{날짜#{i}}}-{{타설일}})', fmt='0;-0;0', align="center", size=8.5)),
               (1, I(f"모#{i}", ex=e[0], fmt=T1, align="center", size=8.5)),
               (1, I(f"중#{i}", ex=e[1], fmt=T1, align="center", size=8.5)),
               (1, I(f"단#{i}", ex=e[2], fmt=T1, align="center", size=8.5)),
               (1, F(f"최저#{i}", f'=IF(COUNT({three})=0,"",MIN({three}))', fmt=T1, align="center", bold=True, size=8.5)),
               (1, F(f"판#{i}", f'=IF({{최저#{i}}}="","",IF({{최저#{i}}}<0,"⚠ 0 ℃ 밑",IF({{최저#{i}}}<5,"⚠ 5 ℃ 밑","✓")))', align="center", size=8)),
               (1, I(f"외기#{i}", ex=e[3], fmt=T1, align="center", size=8.5)),
               (1, I(f"예보#{i}", ex=e[4], fmt=T1, align="center", size=8.5)),
               (1, I(f"조치#{i}", ex=(e[5] or None), size=7.5)),
               (1, I(f"담당#{i}", ex=e[6], align="center", size=8))], h=24)
    for k in ("최저", "판", "예보"):
        _rng(p, k, N_D)
    p.row([(3, "기    록", S),
           (9, F("기록", '=IF(COUNT({최저[]})=0,"","기록 "&COUNT({최저[]})&"일 · 5 ℃ 밑 "&COUNTIF({판[]},"⚠ 5*")&"일 · 0 ℃ 밑 "&COUNTIF({판[]},"⚠ 0*")&"일")',
                 align="left", size=9))], h=26)
    p.row([(3, "처음 3일 보온양생", S),
           (9, F("처음3일", '=IF(COUNT({최저#1},{최저#2},{최저#3})=0,"",IF(COUNTIF({판#1}:{판#3},"⚠*")>0,"⚠ 처음 3일 가운데 "&COUNTIF({판#1}:{판#3},"⚠*")&"일 5 ℃ 밑 — 보온 보강 · 책임기술자 확인",'
                            'IF(COUNT({최저#1},{최저#2},{최저#3})<3,"처음 3일 가운데 "&COUNT({최저#1},{최저#2},{최저#3})&"일 기록 — 이어서 적음","✓ 처음 3일 모두 5 ℃ 이상")))',
                 align="left", size=9))], h=26)
    p.row([(3, "내일 0 ℃ 밑 예보", S),
           (9, F("예보요약", '=IF(COUNT({예보[]})=0,"",IF(COUNTIF({예보[]},"<0")=0,"0 ℃ 밑 예보 없음","❄ "&COUNTIF({예보[]},"<0")&"번 — 전날 보온 덮개 · 급열 보강을 미리"))',
                 align="left", size=9))], h=26)
    g.sec(p, "㉰  확    인", need=26 * 3)
    p.row([(3, "담  당  자", L), (4, I("담당자", ex="이공사 (공사과장)", align="center")), (2, "확  인  자", L), (3, I("확인자", ex="최감리", align="center"))], h=26)
    p.date_line("작성일", ex=D(2026, 12, 16))
    g.note(p, "※ 담당자는 공사과장 · 시험실장, 확인자는 감리 · 관리단이 서명합니다. 양생 담당 칸은 양생을 직접 맡은 사람(양생공)이 적고 서명합니다. "
              "자기온도기록계 출력지를 붙이면 그것으로 대신할 수 있습니다.")
    g.d.done(p)
    p.after_note(["날짜는 타설일 다음 날부터 저절로 이어집니다(고쳐 써도 됩니다). 부위마다 2 ~ 3번 잰 가운데 가장 낮은 온도를 적습니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 공사 · 온도 · 사람)."])
    return p


# ── ② 적산온도 · 초기양생 끝 ───────────────────────────────────────────
def jeoksan(bk, ex):
    p = g.pg(bk, ex, "적산온도", fit=1)
    p.row([(PC, "②  적산온도 · 초기양생 끝", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 적산온도 M = Σ(θ + 10)Δt (°D·D) — 여기서는 θ 를 ① 장의 그날 최저온도로 셈 합니다(평균보다 낮아 실제보다 작게 나오는 안전쪽 값). "
              "20 ℃ 로 환산한 재령 Z20 = M / 30 (KCS 14 20 40 식 3.5-1). 양생 끝 · 거푸집 해체는 공시체 강도로 정합니다(2024 KCS — 적산온도는 참고).")
    p.row([(3, "날    짜", H), (1, "재령", dict(H, size=9)), (2, "그날 최저 θ ℃", dict(H, size=8.5)), (2, "θ + 10", dict(H, size=9)),
           (2, "적산온도 M", dict(H, size=8.5)), (2, "20 ℃ 환산 재령", dict(H, size=8.5))], h=28)
    for i in range(1, N_D + 1):
        p.row([(3, F(f"적날#{i}", f'=IF({{양생일지!날짜#{i}}}="","",{{양생일지!날짜#{i}}})', fmt=DT, align="center", size=9)),
               (1, F(f"적재령#{i}", f'=IF({{양생일지!재령#{i}}}="","",{{양생일지!재령#{i}}})', fmt='0;-0;0', align="center", size=9)),
               (2, F(f"θ#{i}", f'=IF({{양생일지!최저#{i}}}="","",{{양생일지!최저#{i}}})', fmt=T1, align="center", size=9)),
               (2, F(f"기여#{i}", f'=IF({{θ#{i}}}="","",MAX(0,{{θ#{i}}}+10))', fmt='0.0;;0.0', align="center", size=9)),
               (2, F(f"M#{i}", f'=IF({{θ#{i}}}="","",SUM({{기여#1}}:{{기여#{i}}}))', fmt='#,##0.0;;""', align="center", size=9)),
               (2, F(f"Z#{i}", f'=IF({{M#{i}}}="","",ROUND({{M#{i}}}/30,1))', fmt='0.0"일";;""', align="center", size=9))], h=24)
    _rng(p, "M", N_D)
    p.row([(4, "적산온도 (마지막 날)", S), (2, F("M끝", '=IF(COUNT({M[]})=0,"",MAX({M[]}))', fmt='#,##0.0;;""', align="center", bold=True)),
           (1, "°D·D", {"kind": "ctext", "size": 8}), (3, "20 ℃ 환산 재령 Z20", S),
           (2, F("Z끝", '=IF({M끝}="","",ROUND({M끝}/30,1))', fmt='0.0"일";;""', align="center", bold=True))], h=26)
    g.sec(p, "공시체 강도 — 현장과 같은 조건에서 양생 (KCI-CT 118)", need=26 * (N_K + 3))
    p.row([(4, "소요 압축강도 (MPa)", L), (2, I("소요", ex=5, fmt='0.#;;""', align="center")),
           (6, "보통 단면 · 보통 노출 5 MPa — 책임기술자와 정한 값(KCS 14 20 40 표 3.4-1)", {"kind": "text", "size": 8})], h=26)
    p.row([(3, "시 험 일", H), (2, "재령 (일)", H), (2, "강도 MPa", H), (5, "판    정", H)], h=26)
    for j in range(1, N_K + 1):
        e = EX_K[j - 1] if (ex and j <= len(EX_K)) else (None, None)
        p.row([(3, I(f"공날#{j}", ex=e[0], fmt=DT, align="center", size=9)),
               (2, F(f"공재령#{j}", f'=IF(OR(N({{공날#{j}}})=0,N({{양생일지!타설일}})=0),"",{{공날#{j}}}-{{양생일지!타설일}})', fmt='0;-0;0', align="center", size=9)),
               (2, I(f"공강도#{j}", ex=e[1], fmt='0.0#;;""', align="center", size=9)),
               (5, F(f"공판#{j}", f'=IF(COUNT({{공강도#{j}}})=0,"",IF(COUNT({{소요}})=0,"소요 압축강도를 위에 적음",IF({{공강도#{j}}}>={{소요}},"✓ 소요 "&{{소요}}&" MPa 이상",'
                                  f'"소요 "&{{소요}}&" MPa 밑 — 보온 양생 이어서")))', align="center", size=9))], h=24)
    _rng(p, "공판", N_K)
    _rng(p, "공강도", N_K)
    p.row([(3, "초기양생 끝", L),
           (9, F("종료", '=IF(COUNT({공강도[]})=0,"",IF(COUNTIF({공판[]},"✓*")>0,"✓ 소요 강도 이상 — 책임기술자 승인 뒤 초기양생 끝 · 그 뒤 2일간 0 ℃ 이상 유지",'
                         '"아직 — 소요 강도가 나올 때까지 콘크리트 온도 5 ℃ 이상"))', align="left", bold=True, size=9))], h=30)
    g.note(p, "※ 적산온도로 배합을 정했으면(적산온도 방식) 압축강도 시험 재령은 Z20 으로 정합니다. 날마다 평균온도로 셈 하려면 «한중 · 서중 콘크리트 시공계획서» ④ 장을 씁니다.")
    g.d.done(p)
    p.after_note(["날짜 · 최저온도는 ① 장에서 저절로 옵니다. 공시체 강도만 적습니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 강도)."])
    return p


# ── ③ 보온 공간 질식 · 화재 예방 ───────────────────────────────────────
def jilsik(bk, ex):
    p = g.pg(bk, ex, "질식예방", fit=1)
    p.row([(PC, "③  보온 공간 질식 · 화재 예방 — 들어가기 전 확인", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 갈탄 · 열풍기로 보온하는 막힌 공간에는 일산화탄소 · 이산화탄소가 차고 산소가 모자랄 수 있습니다. 들어가기 전에 재서 «적정공기»(산소 18 % 이상 23.5 % 미만 · "
              "이산화탄소 1.5 % 미만 · 일산화탄소 30 ppm 미만 · 황화수소 10 ppm 미만 — 산업안전보건기준에 관한 규칙 제618조)가 아니면 환기하고 다시 재거나 공기호흡기 · 송기마스크를 씁니다(제619조의2 · 제620조).")
    p.row([(3, "보 온 방 법", L), (5, I("보온방법", ex="열풍기(경유 · 등유)", dv=WARM, align="center", size=9)),
           (4, F("보온말", '=IF({보온방법}="","",IF({보온방법}="덮개 · 단열재만","불 없는 보온 — 막힌 곳이면 그래도 산소는 잼","불을 쓰는 보온 — 날마다 들어가기 전에 잼"))', align="left", size=8.5))], h=26)
    g.sec(p, "㉮  한 번 확인 (보온 시작 전)", need=26 + 24 * (len(ONCE) + 1))
    p.row([(1, "번호", H), (9, "확 인 할 것", H), (2, "확    인", H)], h=26)
    for j, t in enumerate(ONCE, 1):
        p.row([(1, str(j), {"kind": "ctext", "size": 9}), (9, t, {"kind": "text", "size": 8.5}),
               (2, I(f"한#{j}", ex=(EX_ONCE[j - 1] if ex else None), dv=CHK, align="center", size=9))], h=24)
    _rng(p, "한", len(ONCE))
    m = len(ONCE)
    p.row([(3, "확 인 요 약", S),
           (9, F("한요약", f'=IF(COUNTA({{한[]}})=0,"",IF(COUNTIF({{한[]}},"○")+COUNTIF({{한[]}},"해당 없음")={m},"✓ {m}가지 모두 확인",'
                          f'IF(COUNTIF({{한[]}},"×")>0,"⚠ × "&COUNTIF({{한[]}},"×")&"가지 — 갖춘 뒤 보온 시작","남은 것 "&({m}-COUNTA({{한[]}}))&"가지")))', align="left", bold=True, size=9))], h=26)
    g.sec(p, "㉯  날마다 들어가기 전 측정", need=30 + 24 * (N_D + 1))
    p.row([(2, "날    짜", H), (1, "산소 %", dict(H, size=8.5)), (1, "일산화탄소 ppm", dict(H, size=7.5)), (1, "이산화탄소 %", dict(H, size=7.5)),
           (3, "판    정", H), (1, "환기", dict(H, size=8.5)), (1, "감시인", dict(H, size=8.5)), (2, "측 정 자", dict(H, size=9))], h=30)
    for i in range(1, N_D + 1):
        e = EX_G[i - 1] if (ex and i <= len(EX_G)) else (None,) * 6
        p.row([(2, F(f"측날#{i}", f'=IF({{양생일지!날짜#{i}}}="","",{{양생일지!날짜#{i}}})', fmt=DT, align="center", size=8.5)),
               (1, I(f"산소#{i}", ex=e[0], fmt='0.0;;""', align="center", size=8.5)),
               (1, I(f"CO#{i}", ex=e[1], fmt='0;;0', align="center", size=8.5)),
               (1, I(f"CO2#{i}", ex=e[2], fmt='0.0#;;0', align="center", size=8.5)),
               (3, F(f"공기#{i}", f'=IF(COUNT({{산소#{i}}},{{CO#{i}}},{{CO2#{i}}})=0,"",IF(COUNT({{산소#{i}}})=0,"⚠ 산소를 재야 함",'
                                 f'IF(OR({{산소#{i}}}<18,{{산소#{i}}}>=23.5),"⚠ 산소 — 들어가지 말고 환기",IF(N({{CO#{i}}})>=30,"⚠ 일산화탄소 — 들어가지 말고 환기",'
                                 f'IF(N({{CO2#{i}}})>=1.5,"⚠ 이산화탄소 — 들어가지 말고 환기","✓ 적정공기")))))', align="center", size=8.5)),
               (1, I(f"환기#{i}", ex=e[3], dv="○,×", align="center", size=9)),
               (1, I(f"감시#{i}", ex=e[4], align="center", size=8)),
               (2, I(f"측정자#{i}", ex=e[5], align="center", size=8.5))], h=24)
    _rng(p, "공기", N_D)
    p.row([(3, "측 정 요 약", S),
           (9, F("공기요약", '=IF(COUNTIF({공기[]},"?*")=0,"",IF(COUNTIF({공기[]},"⚠*")=0,"✓ 측정 "&COUNTIF({공기[]},"✓*")&"일 모두 적정공기",'
                            '"⚠ 적정공기 아닌 날 "&COUNTIF({공기[]},"⚠*")&"일 — 환기한 뒤 다시 잰 값을 적고 들어감"))', align="left", bold=True, size=9))], h=26)
    p.row([(3, "관리감독자", L), (4, I("관리감독자", ex="이공사", align="center")), (5, "(서명 또는 인)", {"kind": "free", "align": "center", "size": 9})], h=26)
    g.note(p, "※ 들어갈 때와 나올 때마다 인원을 셉니다(제621조). 측정한 사람 · 일시 · 장소 · 결과를 남깁니다(제619조의2). 황화수소는 하수 · 오수 근처면 같이 잽니다(10 ppm 미만).")
    g.d.done(p)
    p.after_note(["날짜는 ① 장에서 저절로 옵니다. 들어가기 전에 잰 값을 적습니다 — 측정기 기록을 붙여도 됩니다."] if not ex else
                 ["이 시트는 작성 예시입니다(가상의 측정값 · 사람). 셋째 날 일산화탄소 35 ppm → 환기 뒤 다시 잼."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"
    ilji(bk, ex)
    jeoksan(bk, ex)
    jilsik(bk, ex)


# ── 파이썬으로 따로 셈 ──────────────────────────────────────────────────
def _num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def _r(v, nd):
    q = Decimal(1).scaleb(-nd)
    return float(Decimal(str(v)).quantize(q, rounding=ROUND_HALF_UP))


def _s(v):
    if isinstance(v, float) and v.is_integer():
        v = int(v)
    return str(v)


def expect(pages):
    il, js, jl = (pages[k] for k in ("양생일지", "적산온도", "질식예방"))
    a = {}
    st = il.get("타설일")
    dates, mins, pans, fcs = [], [], [], []
    prev = None
    for i in range(1, N_D + 1):
        dv = il.get(f"날짜#{i}")
        if isinstance(dv, str) and dv.startswith("="):
            dv = None
        if dv is None:
            dv = (st + datetime.timedelta(days=1)) if (i == 1 and st) else ((prev + datetime.timedelta(days=1)) if prev else None)
        dates.append(dv)
        prev = dv
        a[f"재령#{i}"] = "" if not (dv and st) else (dv - st).days
        three = [il.get(f"{k}#{i}") for k in ("모", "중", "단")]
        nums = [x for x in three if _num(x)]
        mn = min(nums) if nums else ""
        a[f"최저#{i}"] = mn
        pan = "" if mn == "" else ("⚠ 0 ℃ 밑" if mn < 0 else "⚠ 5 ℃ 밑" if mn < 5 else "✓")
        a[f"판#{i}"] = pan
        mins.append(mn)
        pans.append(pan)
        fc = il.get(f"예보#{i}")
        if _num(fc):
            fcs.append(fc)
    rec = [x for x in mins if x != ""]
    a["기록"] = "" if not rec else f"기록 {len(rec)}일 · 5 ℃ 밑 {sum(1 for x in pans if x.startswith('⚠ 5'))}일 · 0 ℃ 밑 {sum(1 for x in pans if x.startswith('⚠ 0'))}일"
    f3 = [x for x in mins[:3] if x != ""]
    w3 = sum(1 for x in pans[:3] if x.startswith("⚠"))
    a["처음3일"] = "" if not f3 else (f"⚠ 처음 3일 가운데 {w3}일 5 ℃ 밑 — 보온 보강 · 책임기술자 확인" if w3 else
                                   (f"처음 3일 가운데 {len(f3)}일 기록 — 이어서 적음" if len(f3) < 3 else "✓ 처음 3일 모두 5 ℃ 이상"))
    a["예보요약"] = "" if not fcs else ("0 ℃ 밑 예보 없음" if not any(x < 0 for x in fcs) else f"❄ {sum(1 for x in fcs if x < 0)}번 — 전날 보온 덮개 · 급열 보강을 미리")
    # ② 적산온도
    b = {}
    acc, ms = 0.0, []
    for i in range(1, N_D + 1):
        dv, mn = dates[i - 1], mins[i - 1]
        b[f"적날#{i}"] = dv if dv else ""
        b[f"적재령#{i}"] = a[f"재령#{i}"]
        b[f"θ#{i}"] = mn
        if mn == "":
            b[f"기여#{i}"] = ""
            b[f"M#{i}"] = ""
            b[f"Z#{i}"] = ""
            continue
        c = max(0.0, mn + 10)
        b[f"기여#{i}"] = c
        acc = _r(acc + c, 6)
        b[f"M#{i}"] = acc
        b[f"Z#{i}"] = _r(acc / 30, 1)
        ms.append(acc)
    mend = max(ms) if ms else ""
    b["M끝"] = mend
    b["Z끝"] = "" if mend == "" else _r(mend / 30, 1)
    need = js.get("소요")
    kp = []
    for j in range(1, N_K + 1):
        kd, ks = js.get(f"공날#{j}"), js.get(f"공강도#{j}")
        b[f"공재령#{j}"] = "" if not (kd and st) else (kd - st).days
        if not _num(ks):
            r = ""
        elif not _num(need):
            r = "소요 압축강도를 위에 적음"
        elif ks >= need:
            r = f"✓ 소요 {_s(need)} MPa 이상"
        else:
            r = f"소요 {_s(need)} MPa 밑 — 보온 양생 이어서"
        b[f"공판#{j}"] = r
        kp.append(r)
    b["종료"] = "" if not any(_num(js.get(f"공강도#{j}")) for j in range(1, N_K + 1)) else (
        "✓ 소요 강도 이상 — 책임기술자 승인 뒤 초기양생 끝 · 그 뒤 2일간 0 ℃ 이상 유지" if any(x.startswith("✓") for x in kp) else
        "아직 — 소요 강도가 나올 때까지 콘크리트 온도 5 ℃ 이상")
    # ③ 질식예방
    c = {}
    wm = jl.get("보온방법")
    c["보온말"] = "" if not wm else ("불 없는 보온 — 막힌 곳이면 그래도 산소는 잼" if wm == "덮개 · 단열재만" else "불을 쓰는 보온 — 날마다 들어가기 전에 잼")
    vals = [jl.get(f"한#{j}") for j in range(1, len(ONCE) + 1)]
    m = len(ONCE)
    filled = sum(1 for v in vals if v not in (None, ""))
    if not filled:
        c["한요약"] = ""
    elif vals.count("○") + vals.count("해당 없음") == m:
        c["한요약"] = f"✓ {m}가지 모두 확인"
    elif "×" in vals:
        c["한요약"] = f"⚠ × {vals.count('×')}가지 — 갖춘 뒤 보온 시작"
    else:
        c["한요약"] = f"남은 것 {m - filled}가지"
    gs = []
    for i in range(1, N_D + 1):
        c[f"측날#{i}"] = dates[i - 1] if dates[i - 1] else ""
        o2, co, co2 = jl.get(f"산소#{i}"), jl.get(f"CO#{i}"), jl.get(f"CO2#{i}")
        if not any(_num(x) for x in (o2, co, co2)):
            r = ""
        elif not _num(o2):
            r = "⚠ 산소를 재야 함"
        elif o2 < 18 or o2 >= 23.5:
            r = "⚠ 산소 — 들어가지 말고 환기"
        elif (co if _num(co) else 0) >= 30:
            r = "⚠ 일산화탄소 — 들어가지 말고 환기"
        elif (co2 if _num(co2) else 0) >= 1.5:
            r = "⚠ 이산화탄소 — 들어가지 말고 환기"
        else:
            r = "✓ 적정공기"
        c[f"공기#{i}"] = r
        gs.append(r)
    nn = [x for x in gs if x]
    c["공기요약"] = "" if not nn else (f"✓ 측정 {sum(1 for x in nn if x.startswith('✓'))}일 모두 적정공기" if not any(x.startswith("⚠") for x in nn) else
                                      f"⚠ 적정공기 아닌 날 {sum(1 for x in nn if x.startswith('⚠'))}일 — 환기한 뒤 다시 잰 값을 적고 들어감")
    return {"양생일지": a, "적산온도": b, "질식예방": c}
