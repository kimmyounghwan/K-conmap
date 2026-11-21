# -*- coding: utf-8 -*-
"""🧪 G807 종심 균형가격 예측 · 맞춰 보기 — 종심예측.py (가상 자료 · 조달청 안 부름)
   ① 금액대 · 기관 · 분위(선형 보간) 손셈
   ② 줄들 — 기초 · 균형 없음 · 균형÷기초 60 ~ 120 밖 · 개찰일 없음은 뺌 · 예정÷기초(yr) 90 ~ 110 만 · 개찰일 차례
   ③ 예측 — 좁은 묶음(갈래 · 기관 · 금액대 · 주공종)부터 20건 넘는 곳 · 모자라면 한 단계씩 넓힘 · 전체도 모자라면 «표본 적음»
   ④ 맞춰 보기 — 마지막 3개월을 빼 두고 그 앞으로만(시험 기간 값이 예측에 안 섞임) · 적중률 = 손셈 · 가운데 오차 · 갈래별
   ⑤ 만들기 · build — 보임(30건 · 75% 이상) · 바뀐 뒤 3개월(쏠림)이면 안 보임 · 파일 · 업체 · 공사명 없음 · 셋째자리
   🛠 G812 (11-21 소장님 «넓힌 범위로 열기») — 90% 범위(lo · hi = 5 · 95분위) · 규칙 뒤(sm) 대상은 규칙 뒤 줄 먼저 ·
      맞춰 보기 = 매일(그날 앞 줄로만 · 손셈 · 그날 · 뒷날 값 안 섞임) · 갈래보임(15건 · 75%) · 묶음뒤 · 확인 True
   돌리기: python tools/시험_종심예측.py"""
import json, os, random, sys, tempfile
from datetime import datetime, timedelta
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import 종심예측 as P

n = bad = 0


def ok(이름, c, got=None):
    global n, bad
    n += 1
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + 이름 + ("" if c else " = " + json.dumps(got, ensure_ascii=False, default=str)[:500]))


print("① 금액대 · 기관 · 분위")
ok("금액대 — 150억 0 · 300억 1 · 700억 2 · 1000억 3 · 모름 -1", [P.금액대(1.5e10), P.금액대(3e10), P.금액대(7e10), P.금액대(1e11), P.금액대(None)] == [0, 1, 2, 3, -1])
ok("기관 첫 낱말", P.기관("조달청 가상지방조달청") == "조달청" and P.기관("") == "" and P.기관("가상시청") == "가상시청")
ok("분위 — [1,2,3,4] 50 → 2.5 · 10 → 1.3 · 90 → 3.7 · 빈 것 None", abs(P.분위([4, 1, 3, 2], 50) - 2.5) < 1e-9 and abs(P.분위([1, 2, 3, 4], 10) - 1.3) < 1e-9
   and abs(P.분위([1, 2, 3, 4], 90) - 3.7) < 1e-9 and P.분위([], 50) is None)


def 줄(no, dt, br, kind="간이형", inst="조달청 가상지방조달청", est=1.5e10, main="토목공사업", base=1.1e10, yr=100.2, sm=0):
    return {"no": no, "dt": dt, "kind": kind, "pt": 60, "inst": inst, "est": est, "main": main, "base": base,
            "bal": int(base * br / 100), "yp": int(base * yr / 100) if yr else None, "n": 100, "sm": sm}


print("② 줄들")
js = {"con": {
    "A": 줄("A", "2026-05-01 11:00", 87.0), "B": dict(줄("B", "2026-04-01 11:00", 88.0), base=None),
    "C": 줄("C", "2026-04-02 11:00", 130.0), "D": dict(줄("D", "", 87.0)), "E": 줄("E", "2026-03-01 11:00", 86.0, yr=120),
}}
rs = P.줄들(js)
ok("기초 없음 · 130% · 개찰일 없음 뺌 → E · A(개찰일 차례)", [r["no"] for r in rs] == ["E", "A"], rs)
ok("균형÷기초 87 · 예정÷기초 100.2 · 120 은 버림(None) · 기관 첫 낱말 · 금액대 0", abs(rs[1]["br"] - 87.0) < 0.001 and abs(rs[1]["yr"] - 100.2) < 0.01
   and rs[0]["yr"] is None and rs[1]["inst"] == "조달청" and rs[1]["band"] == 0, rs)

print("③ 예측 — 묶음 넓히기")
random.seed(7)
학 = []
for i in range(25):
    학.append(P.줄들({"con": {f"S{i}": 줄(f"S{i}", f"2026-03-{i + 1:02d} 11:00", 86 + random.random() * 2)}})[0])
for i in range(6):
    학.append(P.줄들({"con": {f"G{i}": 줄(f"G{i}", f"2026-04-{i + 1:02d} 11:00", 90 + random.random(), main="건축공사업")}})[0])
p1 = P.예측(학, {"kind": "간이형", "inst": "조달청", "band": 0, "main": "토목공사업"})
ok("토목 25건 → 가장 좁은 묶음(간이형|조달청|0|토목공사업) · 표본 적음 아님", p1["묶음"] == "간이형|조달청|0|토목공사업" and p1["n"] == 25 and not p1["표본적음"], p1)
p2 = P.예측(학, {"kind": "간이형", "inst": "조달청", "band": 0, "main": "건축공사업"})
ok("건축 6건 → 넓혀 간이형|조달청|0(31건)", p2["묶음"] == "간이형|조달청|0" and p2["n"] == 31, p2)
p3 = P.예측(학, {"kind": "일반", "inst": "가상공단", "band": 2, "main": "토목공사업"})
ok("🩹 G809 일반 0건 → 예측 없음(전체로 안 넓힘 — 갈래마다 분포가 다름)", p3 is None, p3)
p4 = P.예측(학[:10], {"kind": "간이형", "inst": "조달청", "band": 0, "main": "토목공사업"})
ok("간이형 10건뿐 → 갈래 묶음(간이형) · 표본 적음", p4["묶음"] == "간이형" and p4["표본적음"] and p4["n"] == 10, p4)
섞음 = 학 + [P.줄들({"con": {f"J{i}": 줄(f"J{i}", f"2026-04-{i + 1:02d} 11:00", 95, kind="일반", inst="가상공단")}})[0] for i in range(25)]
p5 = P.예측(섞음, {"kind": "간이형", "inst": "조달청", "band": 0, "main": "건축공사업"})
ok("다른 갈래(일반 95%) 25건이 섞여도 간이형 예측엔 안 들어감", p5["n"] == 31 and p5["q90"] < 92, p5)
ok("q10 ≤ q50 ≤ q90 · 열아홉 점 · 예정÷기초 가운데", p1["q10"] <= p1["q50"] <= p1["q90"] and len(p1["d"]) == 19 and abs(p1["y50"] - 100.2) < 0.01, p1)
ok("🛠 G812 90% 범위 — lo = 5분위(d 첫) · hi = 95분위(d 끝) · lo ≤ q10 · q90 ≤ hi", abs(p1["lo"] - p1["d"][0]) < 1e-9 and abs(p1["hi"] - p1["d"][-1]) < 1e-9
   and p1["lo"] <= p1["q10"] and p1["q90"] <= p1["hi"], p1)

print("③-2 🛠 G812 규칙 뒤(sm — 3인 이상 같은 금액 1개만) 대상은 규칙 뒤 줄로 먼저")
random.seed(9)
앞줄 = [P.줄들({"con": {f"A{i}": 줄(f"A{i}", f"2026-05-{i + 1:02d} 11:00", 86.5 + random.random())}})[0] for i in range(25)]
뒤줄 = [P.줄들({"con": {f"B{i}": 줄(f"B{i}", f"2026-10-{i + 1:02d} 11:00", 83.2 + random.random() * 0.6, sm=1)}})[0] for i in range(22)]
q = {"kind": "간이형", "inst": "조달청", "band": 0, "main": "토목공사업"}
p = P.예측(앞줄 + 뒤줄, dict(q, sm=1))
ok("규칙 뒤 대상 — 규칙 뒤 22건(83%대)으로 · 규칙뒤 True", p["n"] == 22 and p["규칙뒤"] and p["q50"] < 84, p)
p = P.예측(앞줄 + 뒤줄, dict(q, sm=0))
ok("규칙 앞 대상 — 모든 줄 47건 · 규칙뒤 False", p["n"] == 47 and not p["규칙뒤"], p)
p = P.예측(앞줄 + 뒤줄[:10], dict(q, sm=1))
ok("규칙 뒤 줄이 20건 안 되면 모든 줄로(35건) · 규칙뒤 False", p["n"] == 35 and not p["규칙뒤"], p)

print("④ 맞춰 보기 — 🛠 G812 매일(그날 앞 줄로만 그날을 맞춤)")
random.seed(11)
전 = {}
날 = datetime(2025, 11, 25, 11, 0)
for i in range(240):
    d = 날 + timedelta(hours=36 * i)
    br = 85 + random.random() * 4                 # 85 ~ 89 고르게 — 80% 범위 ≈ 85.4 ~ 88.6
    전[f"R{i:03d}"] = 줄(f"R{i:03d}", d.strftime("%Y-%m-%d %H:%M"), br)
rows = P.줄들({"con": 전})
m = P.맞춰보기(rows)
끝 = rows[-1]["dt"][:10]
ok("자름 = 마지막 개찰일 3개월 앞 · 방식 매일 · 학습 = 자름 앞 줄 수", m["자름"] == P._달빼기(끝, 3) and m["방식"] == "매일"
   and m["학습"] == sum(1 for r in rows if r["dt"][:10] < m["자름"]), [m["자름"], 끝, m["학습"]])
시험 = [r for r in rows if r["dt"][:10] >= m["자름"]]
손n = 손맞 = 0
for r in 시험:
    p = P.예측([x for x in rows if x["dt"][:10] < r["dt"][:10]], r)
    if not p or p["표본적음"]:
        continue
    손n += 1
    손맞 += 1 if p["lo"] <= r["br"] <= p["hi"] else 0
ok("적중 = 손셈(줄마다 그날 앞 줄로만 · 90% 범위 lo ~ hi)", m["n"] == 손n == len(시험) and m["적중"] == 손맞 and abs(m["율"] - round(손맞 * 100 / 손n, 1)) < 1e-9, [m["n"], m["적중"], 손n, 손맞])
ok("고른 분포 → 적중 80 ~ 100%(90% 범위)", 80 <= m["율"] <= 100, m["율"])
ok("가운데 오차(%p) · 갈래별(건수 · 적중 · 율 · 평균 폭 · 🛠 G815 구간 · 고른 · 짧은) · 줄 열두 칸", m["오차"] is not None and m["갈래"]["간이형"]["n"] == m["n"] and m["갈래"]["간이형"]["폭"] > 0
   and m["갈래"]["간이형"]["구간"] in ("짧은", "고른") and "율" in m["갈래"]["간이형"]["고른"] and "율" in m["갈래"]["간이형"]["짧은"] and len(m["줄"][0]) == 12, [m["갈래"], m["줄"][:1]])
고른맞 = sum(x[7] for x in m["줄"])
짧은맞 = sum(x[11] for x in m["줄"])
g = m["갈래"]["간이형"]
ok("🛠 G815 갈래 고른 · 짧은 적중 = 줄 손셈 · 고른 구간이 짧은 구간 고름(75% 이상 · 더 좁으면 짧은)", g["고른"]["적중"] == 고른맞 and g["짧은"]["적중"] == 짧은맞
   and g["구간"] == ("짧은" if g["짧은"]["율"] >= 75 and g["짧은"]["폭"] < g["고른"]["폭"] else "고른") and g["율"] == g[g["구간"]]["율"], g)
손잔 = []
for r in 시험:
    p = P.예측([x for x in rows if x["dt"][:10] < r["dt"][:10]], r)
    if p and not p["표본적음"]:
        손잔.append([round(r["br"] - p["q50"], 3), round(r["yr"] - p["y50"], 3) if r.get("yr") and p.get("y50") else None])
ok("🛠 G815 갈래 «잔»(어긋남) — 맞춰 본 줄마다 [실제 − 예상 가운데(균형÷기초 %p), 실제 − 예상(예정÷기초 %p)] = 손셈 · 수 = n · 줄의 실제 − 가운데와 같음",
   g["잔"] == 손잔 and len(g["잔"]) == g["n"] and all(abs(z[0] - (x[6] - x[4])) <= 0.0015 for z, x in zip(g["잔"], m["줄"])), [g["잔"][:3], 손잔[:3]])
전예 = dict(전)
k첫 = [k for k in 전예 if 전예[k]["dt"][:10] >= m["자름"]][0]
전예[k첫] = dict(전예[k첫], yp="")                                   # 예정가격 모르는 줄 → 예정 차이 None
m예 = P.맞춰보기(P.줄들({"con": 전예}))
ok("🛠 G815 예정가격 모르는 줄 → 잔의 예정 차이 None(균형 차이는 그대로)", m예["갈래"]["간이형"]["잔"][0][1] is None and m예["갈래"]["간이형"]["잔"][0][0] == g["잔"][0][0], m예["갈래"]["간이형"]["잔"][:2])
성 = P.성적판({"con": 전}, {"갈래보임": ["간이형"]})
줄0 = 성["줄"][0]
ok("📊 G816 성적판 — 줄 열일곱 칸(맞춰 보기 열두 칸 + 기초 · 예정÷기초 · 배점 · y50 · 열아홉 점) · 건수 = 맞춰 본 수 · 갈래보임 그대로 · 갈래에 잔 없음",
   len(성["줄"]) == m["n"] and all(len(x) == 17 for x in 성["줄"]) and 줄0[:12] == m["줄"][0] and 줄0[12] == int(1.1e10) and abs(줄0[13] - 100.2) < 0.01
   and 줄0[14] == 60 and len(줄0[16]) == 19 and 성["갈래보임"] == ["간이형"] and "잔" not in 성["갈래"]["간이형"] and 성["n"] == m["n"] and len(성["칸"]) == 17, [len(성["줄"]), 줄0[12:16]])
ok("📊 G816 성적판 — 열아홉 점 = 그날 앞 줄로 셈한 예측의 d(손셈 첫 줄)", 줄0[16] == [round(x, 3) for x in P.예측([x for x in rows if x["dt"][:10] < 줄0[1]], [r for r in rows if r["no"] == 줄0[0]][0])["d"]], 줄0[16][:3])
전2 = dict(전)
k끝 = list(전2)[-1]
전2[k끝] = dict(전2[k끝], bal=int(전2[k끝]["base"] * 0.99))          # 마지막 개찰 하나가 99% 로 튀어도
m2 = P.맞춰보기(P.줄들({"con": 전2}))
ok("그날 · 뒷날 값은 그 줄 예측에 안 섞임 — 마지막 줄을 99% 로 바꿔도 모든 줄의 예측 띠 같음 · 그 줄만 빗나감", [x[3:6] for x in m2["줄"]] == [x[3:6] for x in m["줄"]]
   and m2["줄"][-1][7] == 0, [m2["줄"][-1], m["줄"][-1]])

print("④-2 🛠 G815 짧은 구간 · 확률 막대 · 구간 고르기 · 열고 닫기(75 · 70)")
ok("짧은구간 — [1, 2, 3, 4, 10] 80%(넷) → 1 ~ 4 · [1, 5, 6, 7, 8] → 5 ~ 8 · 1건 None", P.짧은구간([1, 2, 3, 4, 10]) == (1, 4) and P.짧은구간([8, 7, 6, 5, 1]) == (5, 8) and P.짧은구간([3]) is None)
h = P.막대([83.2, 83.7, 84.1, 84.2, 90.0], 83.0, 85.0)
ok("막대 — 0.5%p 칸 · 시작 = 아래 내림 − 0.5 · 합 1 · 칸 밖(90)은 끝 칸", h["s"] == 82.5 and h["w"] == 0.5 and abs(sum(h["p"]) - 1) < 0.002 and h["p"][-1] == 0.2 and len(h["p"]) == 6, h)
random.seed(21)
긴판 = {}
날2 = datetime(2025, 11, 25, 11, 0)
for i in range(240):   # 간이형처럼 한쪽으로 긴 분포 — 대부분 83 ~ 85 · 열에 하나 90 ~ 94
    d_ = 날2 + timedelta(hours=36 * i)
    br = 90 + random.random() * 4 if i % 10 == 7 else 83 + random.random() * 2
    긴판[f"L{i:03d}"] = 줄(f"L{i:03d}", d_.strftime("%Y-%m-%d %H:%M"), br)
m3 = P.맞춰보기(P.줄들({"con": 긴판}))
g3 = m3["갈래"]["간이형"]
ok("한쪽으로 긴 분포 → 짧은 구간(더 좁고 75% 넘음) · 폭이 고른 구간보다 좁음", g3["구간"] == "짧은" and g3["짧은"]["폭"] < g3["고른"]["폭"] and g3["율"] >= 75, g3)
ok("고른 분포(85 ~ 89 고르게) → 짧은 구간이 더 좁지 않거나 75% 못 넘으면 고른", m["갈래"]["간이형"]["구간"] == ("짧은" if m["갈래"]["간이형"]["짧은"]["율"] >= 75 and m["갈래"]["간이형"]["짧은"]["폭"] < m["갈래"]["간이형"]["고른"]["폭"] else "고른"))
성 = {"간이형": {"n": 27, "율": 72.0}, "일반": {"n": 22, "율": 69.0}, "지방종평": {"n": 10, "율": 90.0}, "고난도": {"n": 20, "율": 80.0}}
보, 상 = P.열림셈(성, {"간이형": {"열림": True, "날": "2026-11-10"}, "일반": {"열림": True, "날": "2026-11-10"}}, "2026-11-21")
ok("열고 닫기 — 열려 있던 간이형 72%(70 넘음) 그대로 · 열려 있던 일반 69% 닫음 · 15건 안 되는 지방종평 닫힘 · 처음 고난도 80% 엶 · 바뀐 날", 보 == ["간이형", "고난도"]
   and 상["간이형"]["날"] == "2026-11-10" and 상["일반"]["날"] == "2026-11-21" and not 상["일반"]["열림"] and 상["고난도"]["열림"] and not 상["지방종평"]["열림"], [보, 상])
보2, _ = P.열림셈({"간이형": {"n": 27, "율": 72.0}}, None, "2026-11-21")
ok("어제 상태 없음 · 닫혀 있던 갈래 72% → 안 엶(75% 에 엶)", 보2 == [], 보2)

print("⑤ 만들기 · build")
지금 = datetime(2026, 11, 20, 21, 0, tzinfo=P.KST)
d = P.만들기({"con": 전}, now=지금)
ok("고른 분포 240건 → 보임(맞춰 본 건수 30 이상 · 75% 이상) · 🛠 G812 갈래보임 = [간이형]", d["보임"] and d["맞춤"]["n"] >= 30 and d["맞춤"]["율"] >= 75
   and d["갈래보임"] == ["간이형"], [d["맞춤"]["율"], d["갈래보임"]])
ok("🛠 G812 확인 = 성적확인 True(11-21 소장님 «넓힌 범위로 열기» — 갈래마다 매일 기준을 넘을 때만 열림)", d["확인"] is True and P.성적확인 is True, d.get("확인"))
ok("🛠 G812 기준 — 범위 [5, 95] · 갈래검증최소 15 · 맞춤 매일", d["기준"]["범위"] == [5, 95] and d["기준"]["갈래검증최소"] == 15 and d["기준"]["맞춤"] == "매일", d["기준"])
ok("묶음 — 전체 · 간이형 · 좁은 묶음(표본 20 이상) · 셋째자리", {"전체", "간이형", "간이형|조달청|0|토목공사업"} <= set(d["묶음"])
   and all(round(v, 3) == v for v in d["묶음"]["전체"]["d"]), list(d["묶음"]))
흔들 = dict(전)
for j, k in enumerate(list(흔들)[-60:]):
    흔들[k] = dict(흔들[k], bal=int(흔들[k]["base"] * (0.80 if j % 2 else 0.98)))   # 마지막 3개월이 80 · 98% 로 크게 흔들리면
d2 = P.만들기({"con": 흔들}, now=지금)
ok("마지막 3개월이 크게 흔들리면(80 · 98%) → 안 보임 · 갈래보임 없음(적중 75% 미만)", not d2["보임"] and d2["맞춤"]["율"] < 75 and d2["갈래보임"] == [], [d2["맞춤"]["율"], d2["갈래보임"]])
d3 = P.만들기({"con": dict(list(전.items())[:32])}, now=지금)
ok("맞춰 본 건수가 적으면(15 미만) → 갈래보임 없음 · 안 보임", not d3["보임"] and d3["갈래보임"] == [] and d3["맞춤"]["n"] < 15, [d3["맞춤"]["n"], d3["갈래보임"]])
뒤판 = {k: dict(v, sm=1) if i >= 200 else v for i, (k, v) in enumerate(전.items())}   # 마지막 40건이 규칙 뒤
d4 = P.만들기({"con": 뒤판}, now=지금)
ok("🛠 G812 묶음뒤 — 규칙 뒤 줄 20건 이상인 묶음만(갈래 · 좁은 묶음) · 건수 40 · 전체(빈 열쇠)는 없음", "간이형" in d4["묶음뒤"] and d4["묶음뒤"]["간이형"]["n"] == 40
   and "전체" not in d4["묶음뒤"] and all(v["n"] >= 20 for v in d4["묶음뒤"].values()), list(d4["묶음뒤"]))
d0 = P.만들기({"con": {}}, now=지금)
ok("자료 없음 → n 0 · 안 보임 · 묶음 빔", d0["n"] == 0 and not d0["보임"] and d0["묶음"] == {} and d0["기간"] is None, d0)
with tempfile.TemporaryDirectory() as t:
    src, out = os.path.join(t, "s.json"), os.path.join(t, "o", "jongsim.json")
    json.dump({"con": 전}, open(src, "w", encoding="utf-8"), ensure_ascii=False)
    for k in 전:
        전[k]["name"] = "가상 공사명 ○○"                          # 혹시 칸이 섞여 와도
    json.dump({"con": 전}, open(src, "w", encoding="utf-8"), ensure_ascii=False)
    b = P.build(out=out, src=src, log=lambda s: None, now=지금)
    글 = open(out, encoding="utf-8").read()
    상태글 = json.load(open(os.path.join(t, "jongsim_state.json"), encoding="utf-8"))
    ok("🛠 G815 build — src 옆 jongsim_state.json 에 갈래 열림 상태 씀(워크플로가 data/seed 를 커밋)", 상태글["갈래"]["간이형"]["열림"] is True and "t" in 상태글, 상태글)
    json.dump({"갈래": {"간이형": {"열림": True, "날": "2026-11-01"}}}, open(os.path.join(t, "jongsim_state.json"), "w", encoding="utf-8"))
    b3 = P.build(out=out, src=src, log=lambda s: None, now=지금)
    ok("🛠 G815 build — 어제 상태를 읽음(열린 날 그대로)", b3["상태"]["간이형"]["날"] == "2026-11-01", b3["상태"])
    ok("build — 파일 · 공사명 · 업체 칸 안 실림 · 다시 읽으면 같음", json.loads(글)["n"] == 240 and "가상 공사명" not in 글 and "bizno" not in 글, 글[:200])
    b2 = P.build(out=out, src=os.path.join(t, "없음.json"), log=lambda s: None, now=지금)
    ok("원본 파일 없음 → 빈 판(멈추지 않음)", b2["n"] == 0 and not b2["보임"])

print("⑦ 🎲 G817 금액표(jongsim_bids.json) — 모의 개찰 재료")
금판 = {"con": {}}
for i in range(45):
    v = dict(줄("G%02d" % i, "2026-%02d-%02d 11:00" % (9 + i // 28, 1 + i % 28), 84 + i * 0.01), yp=int(1.1e10 * 1.002), a=[int(1.1e10 * (0.84 + 0.001 * k)) for k in range(10)])
    금판["con"]["G%02d" % i] = v
금판["con"]["H1"] = dict(줄("H1", "2026-10-02 11:00", 90.0, kind="일반"), yp=int(1.1e10), a=[3, 1, 2])
금판["con"]["H2"] = dict(줄("H2", "2026-10-03 11:00", 90.0, kind="일반"), yp=int(1.1e10))                     # 금액 없음 → 안 실음
금판["con"]["H3"] = dict(줄("H3", "", 90.0, kind="일반"), yp=int(1.1e10), a=[1, 2])                              # 개찰일 없음 → 안 실음
금 = P.금액표(금판, now=지금)
ok("금액표 — 금액(a) 있고 기초 · 예정 · 균형 · 개찰일 있는 줄만 · 갈래마다 새것부터 40건(간이형 45 → 40) · 일반 1",
   금["n"] == 41 and 금["갈래수"] == {"간이형": 40, "일반": 1} and "G00" not in 금["공고"] and "G44" in 금["공고"] and "H1" in 금["공고"] and "H2" not in 금["공고"] and "H3" not in 금["공고"], 금["갈래수"])
h1 = 금["공고"]["H1"]
ok("금액표 한 줄 — [개찰일시, 갈래, 배점, 기초, 예정, 규칙뒤, 균형, 금액(오름차순), 묶음 열쇠(가장 좁은 — 예측 열쇠들 첫째와 같음)] · 칸 이름", h1[:2] == ["2026-10-02 11:00", "일반"] and h1[3] == int(1.1e10) and h1[4] == int(1.1e10)
   and h1[7] == [1, 2, 3] and h1[6] == int(1.1e10 * 90.0 / 100) and len(금["칸"]) == 9 and h1[8] == P.열쇠글(P.열쇠들([r for r in P.줄들(금판) if r["no"] == "H1"][0])[0]) == "일반|조달청|0|토목공사업", h1)

print("⑥ 🛠 G813 개찰표(jongsim_open.json) — 개찰 뒤 실제 균형가격")
개판 = {"con": {
    "K1": dict(줄("K1", "2026-11-18 11:00", 84.5), n0=62, n1=60, yp=16480000000),
    "K2": dict(줄("K2", "", 84.5)), "K3": dict(줄("K3", "2026-11-18 11:00", 130.0)), "K4": dict(줄("K4", "2026-11-18 11:00", 84.0), base=None),
}}
개 = P.개찰표(개판, now=지금)
k1 = 개["공고"].get("K1")
ok("개찰표 — 쓸 수 있는 줄만(개찰일 없음 · 130% · 기초 없음 뺌) · [개찰일시, 갈래, 배점, 기초, 균형, 예정, 받은 수, 빼기 뒤 수] · 정수",
   list(개["공고"]) == ["K1"] and 개["n"] == 1 and k1 == ["2026-11-18 11:00", "간이형", 60, 11000000000, int(1.1e10 * 84.5 / 100), 16480000000, 62, 60], 개)
with tempfile.TemporaryDirectory() as t:
    src, out = os.path.join(t, "s.json"), os.path.join(t, "o", "jongsim.json")
    json.dump(dict(개판["con"]["K1"], name="가상 공사명 ○○", corp="가상건설(주)") and {"con": {"K1": dict(개판["con"]["K1"], name="가상 공사명 ○○")}}, open(src, "w", encoding="utf-8"), ensure_ascii=False)
    P.build(out=out, src=src, log=lambda s: None, now=지금)
    글 = open(os.path.join(t, "o", "jongsim_open.json"), encoding="utf-8").read()
    ok("build — jongsim_open.json 도 씀 · 공사명 · 업체 칸 안 실림", json.loads(글)["n"] == 1 and "가상 공사명" not in 글 and "가상건설" not in 글, 글[:200])
    금글 = open(os.path.join(t, "o", "jongsim_bids.json"), encoding="utf-8").read()
    ok("🎲 G817 build — jongsim_bids.json 도 씀(금액 없으면 빈 공고) · 공사명 · 업체 칸 안 실림", "공고" in json.loads(금글) and "가상 공사명" not in 금글 and "가상건설" not in 금글, 금글[:200])
    성글 = open(os.path.join(t, "o", "jongsim_score.json"), encoding="utf-8").read()
    ok("📊 G816 build — jongsim_score.json 도 씀 · 공사명 · 업체 칸 안 실림", "줄" in json.loads(성글) and "가상 공사명" not in 성글 and "가상건설" not in 성글, 성글[:200])

print(f"\n{'✗' if bad else '✓'} 시험_종심예측 {n - bad}/{n}")
sys.exit(1 if bad else 0)
