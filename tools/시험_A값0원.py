# -*- coding: utf-8 -*-
"""⚖ G579(2026-11-07) A값 0원 — 조달청 응답에 A값 칸이 «0» 으로 실려 온 공고를 «A값 0원» 으로(az = 1) 잠급니다.

  소장님 「사이트에서 다시 이용자 입장에서 하나 하나 해봐. 고칠 것 고쳐야 해」 — 바로투찰을 이용자처럼 해 보니
  나라장터 «기초금액조회» 가 «A 0 원» 인 공고(11-07 10건 대조)가 «A값이 아직 안 실려 왔습니다» 로 막혀 금액이 안 나옴.
  ① extra_amounts — 적용 여부 Y · A 항목(표준시장단가 포함) 0 · 나라장터 7개 항목 가운데 셋 넘게 «0» → az 1 / 빈칸뿐 → az 0(모름 그대로)
  ② 표준바꿈 — az 도 같이 바꿈
  ③ 수집 흐름(글로 확인) — 개별조회 «A값 0원 확인»(az 없는 줄만 한 번) · 하루치 채우기 · 개별조회 결과 · 개찰 이어붙임 · 이어 두기 · bidindex «az»
  돌리기: python tools/시험_A값0원.py   (올리기 bat 이 올리기 전에 돌립니다 — 틀리면 멈춤)
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
틀림 = []
셈 = [0]


def 봄(이름, 참, 덧=""):
    셈[0] += 1
    print(("✓ " if 참 else "✗ ") + 이름 + (f" — {덧}" if 덧 else ""))
    if not 참:
        틀림.append(이름)


src = io.open(os.path.join(ROOT, "collect.py"), encoding="utf-8").read().replace("\r\n", "\n")
i0 = src.index("def pick(item, *names):")
i1 = src.index("# ─────────────────────────────────────────────────────────────\n#  누락 방지 두 가지")
ns = {}
exec(compile(src[i0:i1], "collect.py(일부)", "exec"), ns)
extra = ns["extra_amounts"]
표준바꿈 = ns["표준바꿈"]

# ① extra_amounts
# 나라장터 «기초금액조회» A 0 원 공고의 꼴(11-07 본 그대로): 국민연금 · 건강 · 노인장기요양 · 안전관리비 · 품질관리비 0 · 산업안전 · 퇴직공제 빈칸
나라꼴 = {"bidPrceCalclAYn": "Y", "npnInsrprm": "0", "mrfnHealthInsrprm": "0", "odsnLngtrmrcprInsrprm": "0", "sftyChckMngcst": "0",
         "qltyMngcst": "0", "sftyMngcst": "", "rtrfundNon": "", "smkpAmt": "", "smkpAmtYn": "N"}
r = extra(dict(나라꼴))
봄("① 나라장터 «A 0 원» 꼴(0 다섯 · 빈칸 둘) → az 1 · A값 없음 · smk N", r.get("az") == 1 and "aval" not in r and r.get("ayn") == "Y" and r.get("smk") == "N", repr(r))
r = extra({"bidPrceCalclAYn": "Y", "npnInsrprm": "", "mrfnHealthInsrprm": "", "sftyMngcst": "", "rtrfundNon": ""})
봄("① A 칸이 빈칸뿐 → az 0(확인했지만 0 근거 없음 — 화면은 «모름»)", r.get("az") == 0 and "aval" not in r, repr(r))
r = extra({"bidPrceCalclAYn": "Y"})
봄("① A 칸이 아예 없음 → az 0", r.get("az") == 0, repr(r))
r = extra({"bidPrceCalclAYn": "Y", "npnInsrprm": "0", "mrfnHealthInsrprm": "0", "sftyMngcst": ""})
봄("① 0 이 둘뿐 → az 0(셋 넘어야 1)", r.get("az") == 0, repr(r))
r = extra({"bidPrceCalclAYn": "Y", "envCnsrvcst": "0", "scontrctPayprcePayGrntyFee": "0", "usefulAmt": "0", "evlBssAmt": "0", "npnInsrprm": ""})
봄("① A 7개 항목이 아닌 칸의 0(환경보전비 · 하도급보증 …)은 안 셈 → az 0", r.get("az") == 0, repr(r))
r = extra(dict(나라꼴, sftyMngcst="1500000"))
봄("① A값이 있으면 az 안 붙음", "az" not in r and r.get("aval") == 1500000, repr(r))
r = extra(dict(나라꼴, smkpAmt="300000000", smkpAmtYn="Y"))
봄("① 7개 항목이 0 이어도 표준시장단가가 있으면 A값 = 표준시장단가 · az 안 붙음", "az" not in r and r.get("aval") == 300000000, repr(r))
r = extra(dict(나라꼴, bidPrceCalclAYn="N"))
봄("① A값 미적용(N) → az 안 붙음", "az" not in r and r.get("ayn") == "N", repr(r))
r = extra(dict(나라꼴, NPNINSRPRM="0", npnInsrprm=None))
봄("① 칸 이름 대소문자가 달라도", r.get("az") == 1, repr(r))
봄("① A7_KEYS 는 나라장터 «A» 7개 항목 그대로", ns["A7_KEYS"] == ("npnInsrprm", "mrfnHealthInsrprm", "rtrfundNon", "odsnLngtrmrcprInsrprm",
                                                         "sftyMngcst", "sftyChckMngcst", "qltyMngcst"))

# ② 표준바꿈
줄 = {"aval": 5, "aparts": [["x", 5]], "ayn": "Y"}
표준바꿈(줄, {"ayn": "Y", "smk": "N", "az": 1})
봄("② 표준바꿈 — 응답 az 도 같이", 줄.get("az") == 1 and "aval" not in 줄, repr(줄))
줄 = {"aval": 5, "ayn": "Y", "az": 1}
표준바꿈(줄, {"ayn": "Y", "smk": "Y", "aval": 9, "aparts": [["표준시장단가", 9]]})
봄("② 표준바꿈 — 응답에 az 가 없으면 지움", "az" not in 줄 and 줄["aval"] == 9, repr(줄))


# ③ 수집 흐름 — 글로 확인
def 덩이(앞글, 길이=1400):
    k = src.index(앞글)
    return src[k:k + 길이]


d = 덩이("todo_why = {", 3800)
봄("③ 개별조회 — A값 적용(Y)인데 A값도 az 도 없는 줄은 «A값 0원 확인» 으로 한 번 물음",
   'elif str(r.get("ayn") or "") == "Y" and not r.get("aval") and r.get("az") is None:' in d and 'todo_why["A값 0원 확인"] += 1' in d)
d = 덩이('for f in ("lo", "hi", "aval", "aparts", "ayn", "gmtrl", "lic", "pc"):', 1500)
봄("③ 하루치 기초금액 — az 없는 줄은 응답 az 로(두 줄 다 A값 없을 때만)",
   'if row.get("az") is None and b.get("az") is not None and not row.get("aval") and not b.get("aval")' in d)
d = 덩이('b = bsis_one(key, r["no"], kind)', 1500)
봄("③ 개별조회 결과 — 응답에 az 가 없으면(A값 있음 · N) 줄의 az 지움", 'if b.get("ayn") in ("Y", "N") and b.get("az") is None:' in d and 'r.pop("az", None)' in d)
d = 덩이('"site", "pc"):\n                if (r.get(f) in (None, "", 0, []))', 900)
봄("③ 공고 → 개찰 이어붙임 — az 도(두 줄 다 A값 없을 때만)", 'if r.get("az") is None and src.get("az") is not None and not r.get("aval") and not src.get("aval"):' in d)
봄("③ 이어 두기(BSIS_KEEP) · 개찰 저장소 지키는 칸에 az", '"az")' in src[src.index("BSIS_KEEP = ("):src.index("BSIS_KEEP = (") + 90]
   and '"pc", "bask", "smk", "az"):' in src)
k = src.index('"f": ["no", "name"')
f = re.findall(r'"([a-z]+)"', src[src.index("[", k):src.index("]", src.index("[", k))])
봄("③ bidindex — «az» 칸이 smk 앞(pc 맨 뒤 그대로) · 줄에도 같은 자리", f[-4:] == ["rgs", "az", "smk", "pc"]
   and '1 if r.get("az") == 1 else 0,\n                # ⚖ G578 표준시장단가 칸을 받았나' in src, repr(f[-4:]))
fsrc = io.open(os.path.join(ROOT, "fast.py"), encoding="utf-8").read().replace("\r\n", "\n")
봄("③ 빠른 수집(fast.py) — 지난 줄의 az 1 도(두 줄 다 A값 없을 때만)", 'if r.get("az") is None and prev.get("az") == 1 and not r.get("aval") and not prev.get("aval"):' in fsrc)
js = io.open(os.path.join(ROOT, "web", "src", "lib", "bidmath.js"), encoding="utf-8").read()
봄("③ 화면 bidmath.js — az 1 이면 A값 앎(같은 칸 이름)", "Number(r.az) === 1" in js)

print(f"\n{셈[0]}개 중 틀림 {len(틀림)}")
sys.exit(1 if 틀림 else 0)
