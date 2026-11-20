# -*- coding: utf-8 -*-
"""🧪 G807 종심 균형가격 예측 · 맞춰 보기 — 종심예측.py (가상 자료 · 조달청 안 부름)
   ① 금액대 · 기관 · 분위(선형 보간) 손셈
   ② 줄들 — 기초 · 균형 없음 · 균형÷기초 60 ~ 120 밖 · 개찰일 없음은 뺌 · 예정÷기초(yr) 90 ~ 110 만 · 개찰일 차례
   ③ 예측 — 좁은 묶음(갈래 · 기관 · 금액대 · 주공종)부터 20건 넘는 곳 · 모자라면 한 단계씩 넓힘 · 전체도 모자라면 «표본 적음»
   ④ 맞춰 보기 — 마지막 3개월을 빼 두고 그 앞으로만(시험 기간 값이 예측에 안 섞임) · 적중률 = 손셈 · 가운데 오차 · 갈래별
   ⑤ 만들기 · build — 보임(30건 · 75% 이상) · 바뀐 뒤 3개월(쏠림)이면 안 보임 · 파일 · 업체 · 공사명 없음 · 셋째자리
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


def 줄(no, dt, br, kind="간이형", inst="조달청 가상지방조달청", est=1.5e10, main="토목공사업", base=1.1e10, yr=100.2):
    return {"no": no, "dt": dt, "kind": kind, "pt": 60, "inst": inst, "est": est, "main": main, "base": base,
            "bal": int(base * br / 100), "yp": int(base * yr / 100) if yr else None, "n": 100}


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

print("④ 맞춰 보기")
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
ok("자름 = 마지막 개찰일 3개월 앞 · 학습은 그 앞만", m["자름"] == P._달빼기(끝, 3) and m["학습"] == sum(1 for r in rows if r["dt"][:10] < m["자름"]), [m["자름"], 끝, m["학습"]])
학습 = [r for r in rows if r["dt"][:10] < m["자름"]]
시험 = [r for r in rows if r["dt"][:10] >= m["자름"]]
손 = P.예측(학습, 시험[0])
손맞 = sum(1 for r in 시험 if 손["q10"] <= r["br"] <= 손["q90"])
ok("적중 = 손셈(같은 학습 · 같은 범위)", m["n"] == len(시험) and m["적중"] == 손맞 and abs(m["율"] - round(손맞 * 100 / len(시험), 1)) < 1e-9, [m["n"], m["적중"], 손맞])
ok("고른 분포 → 적중 70 ~ 90%(80% 범위)", 70 <= m["율"] <= 90, m["율"])
ok("가운데 오차(%p) · 갈래별 · 줄 꼴", m["오차"] is not None and m["갈래"]["간이형"]["n"] == m["n"] and len(m["줄"][0]) == 9, m["줄"][:1])
전2 = dict(전)
for k in list(전2)[-40:]:
    전2[k] = dict(전2[k], bal=int(전2[k]["base"] * 0.99))          # 시험 기간 값이 99% 로 튀어도
m2 = P.맞춰보기(P.줄들({"con": 전2}))
ok("시험 기간 값은 예측(학습)에 안 섞임 — 예측 띠 같음", m2["줄"] and m2["줄"][0][3:6] == next(x for x in m["줄"] if x[0] == m2["줄"][0][0])[3:6], [m2["줄"][:1], m["줄"][:1]])

print("⑤ 만들기 · build")
지금 = datetime(2026, 11, 20, 21, 0, tzinfo=P.KST)
d = P.만들기({"con": 전}, now=지금)
ok("고른 분포 240건 → 보임(맞춰 본 건수 30 이상 · 75% 이상)", d["보임"] and d["맞춤"]["n"] >= 30 and d["맞춤"]["율"] >= 75, d["맞춤"]["율"])
ok("확인 칸 — 성적을 보여 드리고 확인 받기 전엔 False(화면은 예상 띠를 안 냄)", d["확인"] is P.성적확인 and P.성적확인 is False, d.get("확인"))
ok("묶음 — 전체 · 간이형 · 좁은 묶음(표본 20 이상) · 셋째자리", {"전체", "간이형", "간이형|조달청|0|토목공사업"} <= set(d["묶음"])
   and all(round(v, 3) == v for v in d["묶음"]["전체"]["d"]), list(d["묶음"]))
쏠림 = dict(전)
for k in list(쏠림)[-60:]:
    쏠림[k] = dict(쏠림[k], bal=int(쏠림[k]["base"] * 0.93))
d2 = P.만들기({"con": 쏠림}, now=지금)
ok("마지막 3개월이 쏠리면(93%) → 안 보임", not d2["보임"] and d2["맞춤"]["율"] < 75, d2["맞춤"]["율"])
d3 = P.만들기({"con": dict(list(전.items())[:50])}, now=지금)
ok("맞춰 본 건수가 적으면(30 미만) → 안 보임", not d3["보임"] and d3["맞춤"]["n"] < 30, d3["맞춤"]["n"])
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
    ok("build — 파일 · 공사명 · 업체 칸 안 실림 · 다시 읽으면 같음", json.loads(글)["n"] == 240 and "가상 공사명" not in 글 and "bizno" not in 글, 글[:200])
    b2 = P.build(out=out, src=os.path.join(t, "없음.json"), log=lambda s: None, now=지금)
    ok("원본 파일 없음 → 빈 판(멈추지 않음)", b2["n"] == 0 and not b2["보임"])

print(f"\n{'✗' if bad else '✓'} 시험_종심예측 {n - bad}/{n}")
sys.exit(1 if bad else 0)
