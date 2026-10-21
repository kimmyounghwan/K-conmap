# -*- coding: utf-8 -*-
"""⚖ 2026-10-21 순공사원가(기초금액 중) 수집 — 바로투찰 «순공사원가 98 %» 선의 재료를 잃지 않게 잠급니다.

  근거: 「조달청 시설공사 적격심사세부기준」 제5조(조달청지침 제6481호 · 2026.7.1. 시행) — 예정가격 100억 미만 공사는
        입찰금액이 «예정가격 중 순공사원가»(기초금액 중 재료비 · 노무비 · 경비 + 부가세 × 예정가격 ÷ 기초금액 · 올림)의
        98 %(올림) 미만이면 심사 제외. 조달청 기초금액 응답의 bssAmtPurcnstcst 가 «기초금액 중 순공사원가».
  ① bsis_row — bssAmtPurcnstcst 를 pc 로(0 · 빈칸 · 기초금액보다 큰 값은 안 적음)
  ② 이어 받기 — 개찰 줄 다시 받을 때 지키는 칸 · 빈 칸 채우기 · 공고→개찰 이어붙임에 pc 가 있음
  ③ 내보내기 — bidindex · bidresult 맨 뒤 칸 pc
  돌리기: python tools/시험_순공사원가.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

틀림 = []
셈 = [0]


def 봄(이름, 참, 덧=""):
    셈[0] += 1
    print(("✓ " if 참 else "✗ ") + 이름 + (f" — {덧}" if 덧 else ""))
    if not 참:
        틀림.append(이름)


src = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read()

# ① bsis_row — collect.py 를 불러오지 않고 함수 글만 떼어 돌림(PC bat 에 requests 가 없어도 되게)
i0 = src.index("def pick(item, *names):")
i1 = src.index("# ── A값(법정경비) 항목들")
ns = {}
exec(compile(src[i0:i1], "collect.py(일부)", "exec"), ns)
bsis_row = ns["bsis_row"]
r1 = bsis_row({"bssamt": "204588000", "rsrvtnPrceRngBgnRate": "-2", "rsrvtnPrceRngEndRate": "+2", "bssAmtPurcnstcst": "181200000"})
봄("① 순공사원가 있음 → pc", r1 and r1.get("pc") == 181200000 and r1.get("base") == 204588000 and r1.get("lo") == -2.0, repr(r1))
r2 = bsis_row({"bssamt": "204588000", "bssAmtPurcnstcst": ""})
봄("① 빈칸 → pc 안 적음(뒤 회차가 채울 수 있게)", r2 and "pc" not in r2, repr(r2))
r3 = bsis_row({"bssamt": "100000000", "bssAmtPurcnstcst": "120000000"})
봄("① 기초금액보다 큰 값(잘못 온 값) → 안 적음", r3 and "pc" not in r3, repr(r3))
r4 = bsis_row({"bssAmt": "300000000", "BSSAMTPURCNSTCST": "250,000,000"})
봄("① 칸 이름 대소문자 · 쉼표가 달라도", r4 and r4.get("pc") == 250000000, repr(r4))
봄("① 기초금액 없으면 줄 없음(전과 같음)", bsis_row({"bssAmtPurcnstcst": "5"}) is None)

# ② 이어 받기
def 묶음(앞글):
    j = src.index(앞글)
    return src[j:src.index(")", j) + 1]
봄("② 개찰 줄 다시 받을 때 지키는 칸에 pc", '"pc"' in 묶음('for f in ("base", "lo", "hi", "lic",'))
봄("② 기초금액이 이미 있을 때 빈 칸 채우기에 pc", '"pc"' in 묶음('for f in ("lo", "hi", "aval", "aparts", "ayn", "gmtrl", "lic"'))
봄("② 공고 → 개찰 이어붙임에 pc", '"pc"' in 묶음('for f in ("llr", "est", "ptot", "pdrw",'))

fsrc = io.open(os.path.join(ROOT, "fast.py"), encoding="utf-8").read()
봄("② 빠른 수집(fast.py) 이어붙임 · 지난 줄 채우기에도 pc", '"site", "pc")' in fsrc and '"ptot", "pdrw", "pc"):' in fsrc and '"aval", "ayn", "pc"):' in fsrc)

# ③ 내보내기
k = src.index('"f": ["no", "name"')
f = re.findall(r'"([a-z]+)"', src[src.index("[", k):src.index("]", src.index("[", k))])
봄("③ bidindex 맨 뒤 칸 pc · 줄 맨 뒤 int(pc)", f[-1] == "pc" and 'int(r.get("pc") or 0),\n            ])' in src, repr(f[-3:]))
k2 = src.index('"f": ["win", "amt", "rate"')
f2 = re.findall(r'"([a-z]+)"', src[src.index("[", k2):src.index("]", src.index("[", k2))])
봄("③ bidresult 맨 뒤 칸 pc", f2[-1] == "pc" and f2[-2] == "enpb", repr(f2[-3:]))

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
