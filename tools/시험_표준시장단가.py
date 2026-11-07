# -*- coding: utf-8 -*-
"""⚖ G578(2026-11-07) 표준시장단가를 A값에 — 100억~300억 «기술형 적격심사» 바로투찰 하한이 낮게 나오던 것을 잠급니다.

  근거: 2026.7 공공공사 낙찰제 개편 — 100억~300억 공사 «기술형 적격심사» · «표준시장단가 적용 항목은 낙찰률 산정 시 제외»
        (뉴스핌 2026-07-01). 나라장터 «기초금액조회» 의 A 도 7개 항목(국민연금 · 건강 · 퇴직공제 · 노인장기요양 · 산업안전보건관리비 ·
        안전관리비 · 품질관리비) + 표준시장단가. 11-07 마감 전 14건 대조: 우리 A + 표준시장단가 = 나라장터 A(모두 같음).
  ① extra_amounts — smkpAmt 를 A값 · 내역에 더하고 smk(Y 더함 · N 없음 · 칸 없으면 안 적음)
  ② 실제 14건 — 우리가 받던 A(7개 항목) + 표준시장단가 = 나라장터 A
  ③ 표준대상 선(추정가격 100억 · 없으면 기초금액 110억) — 화면 bidmath.js 와 같음
  ④ 표준바꿈 — smk 없던 줄을 응답 A값으로(0 원이면 지움)
  ⑤ bsis_one — 차수가 여럿이면 ayn 이 실린 가장 뒤 차수 · 없으면 첫 응답
  ⑥ 수집 흐름(글로 확인) — 하루치 덮어쓰기 · 개별조회 할 일(취소공고 뺌 · 100억 넘는 공고 앞) · 개찰 이어붙임 · 이어 두기 · bidindex smk
  돌리기: python tools/시험_표준시장단가.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
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


src = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read().replace("\r\n", "\n")

# collect.py 를 불러오지 않고 함수 글만 떼어 돌림(PC bat 에 requests 가 없어도 되게)
i0 = src.index("def pick(item, *names):")
i1 = src.index("# ─────────────────────────────────────────────────────────────\n#  누락 방지 두 가지")
ns = {}
exec(compile(src[i0:i1], "collect.py(일부)", "exec"), ns)
extra = ns["extra_amounts"]
표준대상 = ns["표준대상"]
표준바꿈 = ns["표준바꿈"]
bsis_row = ns["bsis_row"]

# ① extra_amounts
A7 = {"npnInsrprm": "100000", "mrfnHealthInsrprm": "200000", "rtrfundNon": "300000", "odsnLngtrmrcprInsrprm": "40000",
      "sftyMngcst": "500000", "sftyChckMngcst": "60000", "qltyMngcst": "7000", "qltyMngcstAObjYn": "Y", "bidPrceCalclAYn": "Y"}
r = extra(dict(A7, smkpAmt="2818684660", smkpAmtYn="Y"))
봄("① 표준시장단가 Y → A값에 더함 · 내역 맨 뒤 «표준시장단가» · smk Y",
   r.get("aval") == 1207000 + 2818684660 and r.get("aparts")[-1] == ["표준시장단가", 2818684660] and r.get("smk") == "Y" and r.get("ayn") == "Y", repr(r))
r = extra(dict(A7, smkpAmt="", smkpAmtYn="N"))
봄("① 표준시장단가 빈칸 · N → A값 그대로 · smk N", r.get("aval") == 1207000 and r.get("smk") == "N" and all(p[0] != "표준시장단가" for p in r["aparts"]), repr(r))
r = extra(dict(A7, smkpAmt="0", smkpAmtYn="N"))
봄("① 표준시장단가 0 · N → smk N", r.get("aval") == 1207000 and r.get("smk") == "N", repr(r))
r = extra(dict(A7))
봄("① 응답에 표준시장단가 칸이 없음 → smk 안 적음(화면이 100억 넘는 공고는 계산 안 함)", "smk" not in r and r.get("aval") == 1207000, repr(r))
r = extra(dict(A7, SMKPAMT="159,255", SmkpAmtYn="Y"))
봄("① 칸 이름 대소문자 · 쉼표가 달라도", r.get("aval") == 1207000 + 159255 and r.get("smk") == "Y", repr(r))
r = extra(dict(A7, smkpAmt="159255", smkpAmtYn="N"))
봄("① 0 보다 크면 포함 여부 N 이어도 더함(본 15건 모두 나라장터 A 에 들어 있음 · 크게 잡아 실격 막음)", r.get("aval") == 1207000 + 159255 and r.get("smk") == "Y", repr(r))
r = extra({"bidPrceCalclAYn": "Y", "smkpAmt": "", "smkpAmtYn": "N"})
봄("① A 항목이 모두 0 · 표준시장단가 없음 → A값 없음 · ayn Y · smk N(나라장터 «A 0 원»)", "aval" not in r and r.get("ayn") == "Y" and r.get("smk") == "N", repr(r))
r = extra({"bidPrceCalclAYn": "Y", "smkpAmt": "400000000", "smkpAmtYn": "Y"})
봄("① A 항목이 0 이어도 표준시장단가만 있으면 A값 = 표준시장단가", r.get("aval") == 400000000 and r.get("smk") == "Y", repr(r))
r = extra(dict(A7, qltyMngcstAObjYn="N", smkpAmt="1000", smkpAmtYn="Y"))
봄("① 품질관리비 A대상 아님(N) 규칙은 전과 같음", r.get("aval") == 1200000 + 1000, repr(r))
봄("① 진단 셈(SMKP_SEEN)에 «Y·Y» · «0·N» · «Y·N» 이 쌓임", ns["SMKP_SEEN"].get("Y·Y", 0) >= 3 and ns["SMKP_SEEN"].get("0·N", 0) >= 3 and ns["SMKP_SEEN"].get("Y·N", 0) == 1, repr(ns["SMKP_SEEN"]))

# ② 실제 14건(11-07 마감 전 · 공고번호는 안 적음 — 나라장터 «기초금액조회» A · 표준시장단가 · 우리가 받던 A 금액만)
실제 = [("실제01", 5272921372, 4019922105, 1252999267), ("실제02", 4198886031, 2818684660, 1380201371),
        ("실제03", 4253363486, 1635518820, 2617844666), ("실제04", 4229976343, 2963844146, 1266132197),
        ("실제05", 3077449865, 2100972376, 976477489), ("실제06", 2680396690, 1069404021, 1610992669),
        ("실제07", 4311554385, 3316935690, 994618695), ("실제08", 1083123788, 399887280, 683236508),
        ("실제09", 3425278348, 2593637040, 831641308), ("실제10", 2693793684, 1808442807, 885350877),
        ("실제11", 1631382116, 954813182, 676568934), ("실제12", 3247583638, 2327221071, 920362567),
        ("실제13", 2122340493, 1447143116, 675197377), ("실제14", 2546160738, 1407920409, 1138240329)]
맞음 = 0
for no, 나A, 표준, 우리 in 실제:
    r = extra({"bidPrceCalclAYn": "Y", "sftyMngcst": str(우리), "smkpAmt": str(표준), "smkpAmtYn": "Y"})
    맞음 += r.get("aval") == 나A
봄("② 14건 모두 «우리 A + 표준시장단가 = 나라장터 A»", 맞음 == 14, f"{맞음}/14")

# ③ 표준대상 선
봄("③ 추정가격 100억 → 대상 · 99.99억 → 아님", 표준대상({"est": 10_000_000_000}) and not 표준대상({"est": 9_999_999_999}))
봄("③ 추정가격 없으면 기초금액 110억 → 대상 · 109.99억 → 아님", 표준대상({"base": 11_000_000_000}) and not 표준대상({"base": 10_999_999_999}))
봄("③ 추정가격이 있으면 기초금액이 커도 추정가격으로(99억 · 기초 120억 → 아님)", not 표준대상({"est": 9_900_000_000, "base": 12_000_000_000}))
js = io.open(os.path.join(ROOT, "web", "src", "lib", "bidmath.js"), encoding="utf-8").read()
봄("③ 화면 bidmath.js 선과 같음(STD_EST 1e10 · 기초금액 × 1.1)", "export const STD_EST = 1e10" in js and "STD_EST * 1.1" in js and "e >= STD_EST" in js and ns["STD_EST"] == 10_000_000_000)

# ④ 표준바꿈
줄 = {"base": 1, "aval": 1380201371, "aparts": [["국민연금보험료", 1]], "ayn": "Y"}
표준바꿈(줄, {"aval": 4198886031, "aparts": [["표준시장단가", 2818684660]], "ayn": "Y", "smk": "Y"})
봄("④ smk 없던 줄 → 응답 A값 · 내역 · smk", 줄["aval"] == 4198886031 and 줄["smk"] == "Y" and 줄["aparts"][0][0] == "표준시장단가", repr(줄))
줄 = {"base": 1, "aval": 5, "aparts": [["x", 5]], "ayn": "Y"}
표준바꿈(줄, {"ayn": "Y", "smk": "N"})
봄("④ 응답 A값이 0 원이면 줄의 옛 A값 · 내역 지움", "aval" not in 줄 and "aparts" not in 줄 and 줄["smk"] == "N", repr(줄))

# ⑤ bsis_one — 차수가 여럿
j0 = src.index("def bsis_one(key, no, kind):")
j1 = src.index("\n\n\n", j0)
ns5 = dict(ns)
들 = []
ns5["fetch"] = lambda *a, **k: list(들)
ns5["BSIS"] = {"con": "가짜"}
exec(compile(src[j0:j1], "collect.py(bsis_one)", "exec"), ns5)
bsis_one = ns5["bsis_one"]
들[:] = [{"bidNtceOrd": "000", "bssamt": "100", "bidPrceCalclAYn": "Y", "sftyMngcst": "5"},
         {"bidNtceOrd": "001", "bssamt": "100", "bidPrceCalclAYn": "Y", "sftyMngcst": "7", "smkpAmt": "3", "smkpAmtYn": "Y"},
         {"bidNtceOrd": "002", "bssamt": "100"}]
r = bsis_one("열쇠", "R26BK0", "con")
봄("⑤ ayn 이 실린 가장 뒤 차수(001) — 취소 차수(002 · A 칸 빔)는 안 씀", r and r.get("aval") == 10 and r.get("smk") == "Y", repr(r))
들[:] = [{"bidNtceOrd": "000", "bssamt": "100"}, {"bidNtceOrd": "001", "bssamt": "200"}]
r = bsis_one("열쇠", "R26BK0", "con")
봄("⑤ ayn 이 실린 응답이 없으면 전처럼 첫 응답", r and r.get("base") == 100, repr(r))
들[:] = []
봄("⑤ 응답 없으면 None", bsis_one("열쇠", "R26BK0", "con") is None)


# ⑥ 수집 흐름 — 글로 확인(main 안이라 떼어 돌리기 어려움)
def 덩이(앞글, 길이=1400):
    k = src.index(앞글)
    return src[k:k + 길이]


d = 덩이('for f in ("lo", "hi", "aval", "aparts", "ayn", "gmtrl", "lic", "pc"):', 900)
봄("⑥ 하루치 기초금액 — smk 없던 줄은 응답 A값으로(ayn 있을 때만)",
   'if row.get("smk") is None and b.get("smk") is not None and b.get("ayn") in ("Y", "N"):' in d and "표준바꿈(row, b)" in d)
d = 덩이("todo_why = {", 3600)
봄("⑥ 개별조회 — 취소공고 뺌 · 100억 넘는 공고(smk 없음)를 먼저 · A값 적용 여부를 받은 줄은 다시 안 물음",
   'if str(r.get("kind") or "") == "취소공고":' in d and 'elif r.get("base") and r.get("smk") is None and 표준대상(r):' in d
   and 'elif not r.get("aval") and str(r.get("ayn") or "") not in ("Y", "N"):' in d)
봄("⑥ 개별조회 정렬 — ⚖ G581 표준시장단가 줄(앞 · 공고 · 개찰)을 맨 앞(3시간 안에 물어본 것은 차례대로) · 그 밖은 전처럼 오래 안 물어본 것부터",
   'uniq.sort(key=lambda kr: (0 if (kr[0], kr[1]["no"]) in 앞 and str(kr[1].get("bask") or "") < cut3 else 1,' in src
   and 'str(kr[1].get("bask") or "")))' in src and '앞.add((kind, r["no"]))' in src)
d = 덩이("b = bsis_one(key, r[\"no\"], kind)", 1200)
봄("⑥ 개별조회 결과 — 응답 A값이 0 원이면 줄의 옛 A값 지움", 'if b.get("ayn") in ("Y", "N") and b.get("aval") is None:' in d and 'r.pop("aval", None)' in d)
d = 덩이('"site", "pc"):\n                if (r.get(f) in (None, "", 0, []))', 700)
봄("⑥ 공고 → 개찰 이어붙임 — 공고 쪽 smk 가 있으면 개찰 줄 A값도", 'if src.get("smk") and not r.get("smk") and src.get("ayn") in ("Y", "N"):' in d and "표준바꿈(r, src)" in d)
봄("⑥ 이어 두기(BSIS_KEEP)에 smk", '"smk"' in src[src.index("BSIS_KEEP = ("):src.index("BSIS_KEEP = (") + 90])
d = 덩이("# 이미 받아둔 기초금액을 덮어쓰지 않는다", 600)
봄("⑥ 개찰 저장소 다시 받을 때 지키는 칸에도 smk", '"bask", "smk"' in d)
k = src.index('"f": ["no", "name"')
f = re.findall(r'"([a-z]+)"', src[src.index("[", k):src.index("]", src.index("[", k))])
봄("⑥ bidindex — smk 칸이 pc 바로 앞 · 줄에도 같은 자리", f[-2:] == ["smk", "pc"] and 'r.get("smk") or "",\n                # ⚖ 2026-10-21 기초금액 중 순공사원가' in src, repr(f[-3:]))
fsrc = io.open(os.path.join(ROOT, "fast.py"), encoding="utf-8").read().replace("\r\n", "\n")
봄("⑥ 빠른 수집(fast.py) — 지난 줄에서 A값을 옮길 때 smk 도", 'if not r.get("smk") and prev.get("smk") and r.get("aval") == prev.get("aval"):' in fsrc)

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
