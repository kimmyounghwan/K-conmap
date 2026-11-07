# -*- coding: utf-8 -*-
"""⚖ G582(2026-11-07) 난이도계수 — 추정가격 50억 이상 적격심사 낙찰하한율 · 수집 쪽(kcm_rules · collect · fast · 성적표) 시험.

  소장님 「나머지도 고쳐 줘」 뒤 G581 확인 중 찾음: 50억 이상 적격심사는 «자재 및 인력조달 가격의 적정성» 점수에 난이도계수를
  곱해 계수가 작으면 낙찰하한율이 오르는데, 조달청 공고 목록은 기준값(81.995 · 87.495)만 줄 때가 있음
  (11-07 마감 전 100억+ 17건 중 5건 — 나라장터 «기초금액조회» 83.395 · 82.695 · 권장 금액이 참 하한 아래 → 실격).
  ① kcm_rules.하한율칸 — 셈 표(화면 bidmath.js 와 같은 표 · tools/시험_난이도하한.mjs)
  ② 기초금액 응답의 난이도계수(dfcltydgrCfcnt → dc) · 이어 두기 · 개찰 줄 이어붙임
  ③ 개별조회 — 마감 전(맨 앞) · 개찰(차례대로) «난이도계수» 까닭
  ④ 내보내기 — bidindex · bidresult · 묶음(사본만) · 빠른 길(fast.py) · 성적표(report_data.py) · 공고 페이지(prerender) · 확보 사정률(build_json)
  돌리기: python tools/시험_난이도하한.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
"""
import io
import os
import sys
import textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
sys.path.insert(0, os.path.join(ROOT, "tools"))
import kcm_rules as R  # noqa: E402

틀림 = []
셈 = [0]


def 봄(이름, 참, 덧=""):
    셈[0] += 1
    print(("✓ " if 참 else "✗ ") + 이름 + (f" — {덧}" if 덧 else ""))
    if not 참:
        틀림.append(이름)


S100 = "적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사(실적제한 아님, 종합공사)"
S100J = "적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사(실적제한, 종합공사)"
S100PQ = "적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사 평가기준(PQ대상)"
S50 = "적격심사제-추정가격이 100억원 미만 50억원 이상인 입찰공사(실적제한 아님, 종합공사)"
S50G = "적격심사제-추정가격 100억원 미만 50억원 이상인 공사(실적에 의한 경쟁입찰 이외, 종합공사)"
S50ETC = "적격심사제-추정가격이 100억원 미만 50억원 이상인 입찰공사(실적제한 아님, 그 밖의 공사)"
S50JN = "적격심사제-추정가격이 70억원미만 50억원이상인 재난복구공사 입찰공사(실적제한 아님, 종합공사)"
SMAN = "적격심사제-관리규정외 수기심사(총점입력)"
S40 = "적격심사제-추정가격이 50억원 미만 30억원 이상인 입찰공사(실적제한 아님, 종합공사)"
S2 = "적격심사제-추정가격이 2억원 미만인 입찰공사 평가기준 (실적제한 아님, 그 밖의 공사)"
SJS = "종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준"
SLIM = "제한적최저가(낙찰하한율)-제한적최저가(낙찰하한율)"

# ① 셈 표 — ⚠️ tools/시험_난이도하한.mjs 의 표와 «같은 줄 · 같은 답» (한쪽만 고치면 화면과 수집이 어긋남)
표 = [
    ("100억 적격 · 계수 0.9 · 목록 기준값 → 83.395(나라장터 R26BK01776892 꼴)", dict(llr=81.995, swin=S100, est=2.02e10, dc=0.9), (83.395, 81.995, None)),
    ("계수 0.95 → 82.695", dict(llr=81.995, swin=S100, est=2.02e10, dc=0.95), (82.695, 81.995, None)),
    ("계수 0.85 → 84.095", dict(llr=81.995, swin=S100, est=2.02e10, dc=0.85), (84.095, 81.995, None)),
    ("계수 0.8 → 84.795", dict(llr=81.995, swin=S100, est=2.02e10, dc=0.8), (84.795, 81.995, None)),
    ("계수 1 → 81.995 그대로", dict(llr=81.995, swin=S100, est=2.02e10, dc=1), (81.995, None, None)),
    ("계수 모름 · 목록 기준값 → 막음 dc", dict(llr=81.995, swin=S100, est=2.02e10), (81.995, None, "dc")),
    ("계수 모름 · 목록이 이미 반영(83.395) → 그대로", dict(llr=83.395, swin=S100, est=2.02e10), (83.395, None, None)),
    ("실적제한 종합공사 · 0.9 · 목록 83.395 → 같음", dict(llr=83.395, swin=S100J, est=1.2e10, dc=0.9), (83.395, None, None)),
    ("PQ대상 · 0.85 · 목록 기준값 → 셈 모름 nk(나라장터 84.245 — 다른 배점)", dict(llr=81.995, swin=S100PQ, est=2.38e10, dc=0.85), (81.995, None, "nk")),
    ("PQ대상 · 목록이 84.245 → 그대로", dict(llr=84.245, swin=S100PQ, est=2.38e10, dc=0.85), (84.245, None, None)),
    ("PQ대상 · 계수 1 → 그대로", dict(llr=81.995, swin=S100PQ, est=2.38e10, dc=1), (81.995, None, None)),
    ("50억 지자체 종합 · 0.9 → 87.995", dict(llr=87.495, swin=S50, est=6e9, dc=0.9), (87.995, 87.495, None)),
    ("50억 조달청 종합 · 0.8 → 88.495", dict(llr=87.495, swin=S50G, est=8.8e9, dc=0.8), (88.495, 87.495, None)),
    ("50억 그 밖의 공사 · 0.9 · 기준값 → 셈 모름 nk", dict(llr=87.495, swin=S50ETC, est=6e9, dc=0.9), (87.495, None, "nk")),
    ("50억 그 밖의 공사 · 계수 1 → 그대로", dict(llr=87.495, swin=S50ETC, est=6e9, dc=1), (87.495, None, None)),
    ("재난복구 50~70억 · 0.95 · 기준값 → 셈 모름 nk", dict(llr=87.495, swin=S50JN, est=6e9, dc=0.95), (87.495, None, "nk")),
    ("수기심사 50억대 · 계수 모름 · 기준값 → 막음 dc", dict(llr=87.495, swin=SMAN, est=6e9), (87.495, None, "dc")),
    ("수기심사 · 목록 88.245 → 그대로", dict(llr=88.245, swin=SMAN, est=6e9), (88.245, None, None)),
    ("50억 아래(30~50억 88.745) → 상관없음", dict(llr=88.745, swin=S40, est=4e9), (88.745, None, None)),
    ("2억 아래 → 상관없음", dict(llr=89.745, swin=S2, est=1.6e8), (89.745, None, None)),
    ("종합심사(하한율 없음) → 그대로(None)", dict(llr=None, swin=SJS, est=2e10), (None, None, None)),
    ("제한적최저가 · 0.9 → 적격심사 아님 · 그대로", dict(llr=87.495, swin=SLIM, est=6e9, dc=0.9), (87.495, None, None)),
    ("낙찰방법 글 없는 옛 줄 · 계수 모름 → 막지 않음(전과 같음)", dict(llr=87.495, est=6e9), (87.495, None, None)),
    ("낙찰방법 글 없음 · 계수 0.9 · 기준값 → 셈 모름 nk", dict(llr=87.495, est=6e9, dc=0.9), (87.495, None, "nk")),
    ("추정가격 없음 · 기초 220억(÷1.1) · 글 없음 · 계수 모름 → 그대로", dict(llr=81.995, base=2.2e10), (81.995, None, None)),
    ("추정가격 없음 · 기초 220억 · 100억 글 · 0.9 → 83.395", dict(llr=81.995, swin=S100, base=2.2e10, dc=0.9), (83.395, 81.995, None)),
    ("글자로 온 값(llr · est · dc) → 같은 셈", dict(llr="81.995", swin=S100, est="20200000000", dc="0.9"), (83.395, 81.995, None)),
    ("계수 빈칸('') → 모름 dc", dict(llr=81.995, swin=S100, est=2.02e10, dc=""), (81.995, None, "dc")),
    ("계수 이상한 값(1.5) → 모름 dc", dict(llr=81.995, swin=S100, est=2.02e10, dc=1.5), (81.995, None, "dc")),
    ("목록 83.395 인데 계수 0.95 → 셈(82.695) · 목록 값 llr0", dict(llr=83.395, swin=S100, est=2.02e10, dc=0.95), (82.695, 83.395, None)),
    ("하한율 이상한 값(1) → 그대로", dict(llr=1, swin=S100, est=2.02e10, dc=0.9), (1, None, None)),
    ("300억 넘음 · 글 없음 → 상관없음", dict(llr=81.995, est=3.5e10), (81.995, None, None)),
]
for 이름, 줄, 답 in 표:
    got = R.하한율칸(줄)
    봄("① " + 이름, got == 답, repr(got))

# ② 기초금액 응답 · 이어 두기
import collect as C  # noqa: E402
b = C.bsis_row({"bssamt": "22500000000", "dfcltydgrCfcnt": "0.9"})
봄("② 기초금액 응답 dfcltydgrCfcnt «0.9» → dc 0.9", b and b.get("dc") == 0.9, repr(b))
봄("② 빈칸 · 0 · 1.5 → dc 안 적음 · «1» → 1.0",
   "dc" not in C.bsis_row({"bssamt": "1000", "dfcltydgrCfcnt": ""}) and "dc" not in C.bsis_row({"bssamt": "1000", "dfcltydgrCfcnt": "0"})
   and "dc" not in C.bsis_row({"bssamt": "1000", "dfcltydgrCfcnt": "1.5"}) and C.bsis_row({"bssamt": "1000", "dfcltydgrCfcnt": "1"}).get("dc") == 1.0)
봄("② 이어 두기(BSIS_KEEP)에 dc · 기초이어가 dc 를 이음", "dc" in C.BSIS_KEEP and C.기초이어({"base": 1, "dc": 0.9}, {"no": "x"}).get("dc") == 0.9)
src = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read().replace("\r\n", "\n")
봄("② 개찰 저장소 다시 받기 · 하루치 기초금액 · 공고→개찰 이어붙임에 dc(· swin)",
   'for f in ("dc", "swin"):\n                        if prev.get(f) is not None and r.get(f) is None:' in src
   and 'if row.get("dc") is None and b.get("dc") is not None:\n                            row["dc"] = b["dc"]' in src
   and 'for f in ("dc", "swin"):\n                if (r.get(f) in (None, "")) and src.get(f) not in (None, ""):' in src)

# ③ 개별조회 — 블록을 꺼내 가상 줄에 돌림
k0 = src.index('        for r in live_rows:\n            if str(r.get("kind") or "") == "취소공고":\n                todo_why["취소공고 뺌"] += 1')
k1 = src.index("        for r in live_rows:", k0 + 10)
앞블록 = textwrap.dedent(src[k0:k1])


def 공고고르기(줄들):
    env = {"live_rows": 줄들, "todo": [], "kind": "con", "앞": set(), "표준대상": C.표준대상, "R": R,
           "todo_why": {"취소공고 뺌": 0, "표준시장단가": 0, "난이도계수": 0}}
    exec(compile(앞블록, "G582 공고 앞 블록", "exec"), env)
    return env


줄 = lambda **k: dict({"no": "T0", "base": 22500000000, "est": 20200000000, "llr": 81.995, "swin": S100, "smk": "Y", "ayn": "Y", "aval": 4e9}, **k)
e = 공고고르기([줄(no="L1"), 줄(no="L2", dc=0.9), 줄(no="L3", dc=1), 줄(no="L4", llr=83.395), 줄(no="L5", base=0), 줄(no="L6", kind="취소공고"),
             줄(no="L7", est=4e9, base=4.4e9, llr=88.745, swin=S40), 줄(no="L8", smk=None)])
고른 = [r["no"] for _, r in e["todo"]]
봄("③ 마감 전 — 계수 모르고 목록 기준값인 50억+ 적격(L1)만 «난이도계수» · smk 없는 100억(L8)은 전처럼 «표준시장단가»",
   고른 == ["L1", "L8"] and e["todo_why"]["난이도계수"] == 1 and e["todo_why"]["표준시장단가"] == 1, repr((고른, e["todo_why"])))
봄("③ 난이도계수 줄은 «앞»(맨 앞에 물음)", ("con", "L1") in e["앞"], repr(e["앞"]))
k0 = src.index("        # ⚖ G581 개찰 7주치 전체에서")
k1 = src.index("    seen = set()\n    uniq = []", k0)
개찰블록 = textwrap.dedent(src[k0:k1])
env = {"rows": [줄(no="F1"), 줄(no="F2", dc=0.9), 줄(no="F3", swin=""), 줄(no="F4", base=0)], "todo": [], "kind": "con", "앞": set(),
       "표준대상": C.표준대상, "to_f": C.to_f, "R": R, "todo_why": {"개찰 표준시장단가": 0, "개찰 A값 0원 확인": 0, "개찰 난이도계수": 0}}
exec(compile(개찰블록, "G582 개찰 블록", "exec"), env)
고른 = [r["no"] for _, r in env["todo"]]
봄("③ 개찰 — 계수 모르는 50억+ 적격(F1)만 «개찰 난이도계수» · 차례대로(앞 아님) · 글 없는 옛 줄(F3)은 안 물음",
   고른 == ["F1"] and env["todo_why"]["개찰 난이도계수"] == 1 and env["앞"] == set(), repr((고른, env["todo_why"], env["앞"])))
봄("③ 줄 글에 «50억 이상 난이도계수 · 개찰 난이도계수» · 회차마다 «🎚 난이도계수» 셈 줄",
   "· 50억 이상 난이도계수 {todo_why['난이도계수']:,} · 개찰 난이도계수 {todo_why['개찰 난이도계수']:,}" in src
   and "🎚 난이도계수(마감 전 50억 이상 적격)" in src and "하한율 바로잡음" in src)
봄("③ 개별조회 결과 r.update(b) — 응답의 dc 가 줄에 들어감(bsis_row 가 dc 를 실음)", 'r.update(b)' in src[src.index('b = bsis_one(key, r["no"], kind)'):][:600])

# ④ 내보내기
k = src.index('"f": ["no", "name"')
fb = src[src.index("[", k):src.index("]", src.index("[", k)) + 1]
봄("④ bidindex 칸 끝 «… pc · dc · llr0 · llw» · pc 자리 36 그대로", fb.replace("\n", "").replace(" ", "").endswith('"az","smk","pc","dc","llr0","llw"]')
   and eval(fb).index("pc") == 36, fb[-60:])
봄("④ bidindex 줄 — 하한율 자리에 하한율칸 값 · 끝에 dc · llr0 · llw", "_ll = R.하한율칸(r)     # ⚖ G582" in src
   and "                _ll[0],                            # 공고가 알려준 낙찰하한율" in src
   and '                r.get("dc") if r.get("dc") is not None else "",\n                _ll[1] if _ll[1] is not None else "",\n                _ll[2] or "",\n            ])' in src)
k = src.index('"f": ["win", "amt", "rate"')
fr = eval(src[src.index("[", k):src.index("]", src.index("[", k)) + 1])
봄("④ bidresult 칸 32 · 끝 «pc · az · smk · dc · llr0 · llw»(BaroBid a[29] · a[30] · a[31])", len(fr) == 32 and fr[-6:] == ["pc", "az", "smk", "dc", "llr0", "llw"], repr(fr[-6:]))
봄("④ bidresult 줄 — 하한율칸 값 · 끝에 dc · llr0 · llw", "                       _ll[0], int(r.get(\"est\") or 0)," in src
   and '_ll[1] if _ll[1] is not None else "", _ll[2] or ""]' in src)
봄("④ 묶음(board) — 사본에만 llr · llr0 · llw · 개찰 묶음은 swin 을 안 실음(저장소 줄은 안 건드림)",
   'for x, r in zip(slim, part):\n                    _v, _o, _w = R.하한율칸(r)' in src and 'if name == "first":\n                        x.pop("swin", None)' in src)
봄("④ _pick_llr(예상 참가 표) — 하한율칸 · 막힌 줄은 셈에서 뺌", "def _pick_llr(r):\n    # ⚖ G582" in src and "    llr, _o, _w = R.하한율칸(r)\n    if _w:\n        return None" in src)

import fast as F  # noqa: E402
x = F.finish("live", [dict(no="T1", name="가상 공고", inst="가상군", llr=81.995, swin=S100, est=2.02e10, base=2.25e10, dc=0.9)], {}, None)[0]
봄("④ 빠른 길(fast.finish) 공고 — 계수 0.9 → llr 83.395 · llr0 81.995 · swin 그대로", x.get("llr") == 83.395 and x.get("llr0") == 81.995 and "llw" not in x and x.get("swin") == S100, repr({k: x.get(k) for k in ("llr", "llr0", "llw")}))
x = F.finish("first", [dict(no="T2", name="가상 개찰", inst="가상군", llr=81.995, swin=S100, est=2.02e10, base=2.25e10, amt=1, rate=86.0, win="가상건설")], {}, None)[0]
봄("④ 빠른 길 개찰 — 계수 모름 → llw dc · swin 은 안 실음", x.get("llw") == "dc" and "swin" not in x and x.get("llr") == 81.995, repr({k: x.get(k) for k in ("llr", "llw", "swin")}))
rows = [{"no": "T3"}]
F.enrich_first(rows, {"con": {"T3": {"dc": 0.9, "swin": S100, "llr": 81.995}}}, {"con": {}})
봄("④ 빠른 길 이어붙임 — 공고 저장소의 dc · swin 을 개찰 줄에", rows[0].get("dc") == 0.9 and rows[0].get("swin") == S100, repr(rows[0]))

import report_data as RD  # noqa: E402
BNO = "1238112345"
개 = dict(no="T4", name="가상 청사 신축", inst="가상시", dt="2026-11-06 11:00:00", base=22500000000, est=20200000000, llr=81.995, swin=S100,
         aval=4200000000, ayn="Y", lo=-3, hi=3, ptot=15, pdrw=4, nrank=3,
         corps=[["가상건설1", 19500000000, 86.7, "1111111111", ""], ["가상건설2", 19550000000, 86.9, BNO, ""], ["가상건설3", 19600000000, 87.1, "2222222222", ""]])
o1 = RD.one(dict(개, dc=0.9), BNO, 99.886)
o2 = RD.one(dict(개), BNO, 99.886)
봄("④ 성적표(report_data.one) — 계수 0.9 는 하한율 83.395 로 채점", o1 and o1.get("llr") == 83.395 and o1.get("baro"), repr(o1 and o1.get("llr")))
봄("④ 성적표 — 계수 모름 · 목록 기준값(llw) → 채점 안 함(baro 없음)", o2 and o2.get("baro") is None and "llr" not in o2, repr(o2 and (o2.get("baro"), o2.get("llr"))))

psrc = io.open(os.path.join(ROOT, "prerender.py"), encoding="utf-8").read().replace("\r\n", "\n")
봄("④ 공고 페이지(prerender) — 하한율칸 값 · «난이도계수 0.9 반영 · 공고 목록 …» · 확정 못 하면 «나라장터 «기초금액조회» 에서 확인»",
   "from kcm_rules import 하한율칸" in psrc and '("낙찰하한율", _llt),' in psrc and "반영 · 공고 목록" in psrc and "기초금액조회» 에서 확인" in psrc)
bsrc = io.open(os.path.join(ROOT, "build_json.py"), encoding="utf-8").read().replace("\r\n", "\n")
봄("④ 확보 사정률(build_json) — 하한율칸 값 · 막힌 줄 뺌", "_ll = 하한율칸(L)\n        if _ll[2]:\n            continue" in bsrc and "norm_corp, region_of, bizno10, 하한율칸)" in bsrc)

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
