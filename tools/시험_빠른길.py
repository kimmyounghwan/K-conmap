# -*- coding: utf-8 -*-
"""🧪 fast.py «새 것» 가리기 — G193 (2026-10-07) · python tools/시험_빠른길.py
   소장님 폰 20:07: 11:00 개찰이 첫 묶음(500)과 둘째 묶음에 걸쳐 나뉘자 둘째 묶음의 11:00 개찰 94건이 «🆕 방금» 으로 다시 떴음.
   known_on_site · pick_fresh 를 인터넷 없이 가짜 묶음으로 봅니다(조달청 · 사이트 안 부름)."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import fast  # noqa: E402

통과 = 실패 = 0


def 봄(무엇, ok, 값=None):
    global 통과, 실패
    if ok:
        통과 += 1
        print("  ✓", 무엇)
    else:
        실패 += 1
        print("  ✗", 무엇, "" if 값 is None else str(값)[:300])


def 줄(no, dt):
    return {"no": no, "dt": dt, "name": "공사 " + no}


def 묶음들(시각들):
    """[(시각, 건수), …] (최신부터) → 500 건씩 자른 묶음 목록 · 공고번호는 B0001… 차례"""
    rows, n = [], 0
    for dt, c in 시각들:
        for _ in range(c):
            n += 1
            rows.append(줄(f"B{n:05d}", dt))
    return [rows[i:i + 500] for i in range(0, len(rows), 500)], rows


META = lambda parts: {"chunk": 500, "con": {"parts": parts}}  # noqa: E731

print("■ ① 그날의 모습 — 11:00 개찰 300건이 500 경계에 걸림(첫 묶음 206 · 둘째 묶음 94)")
# 17:30 100 · 16:00 100 · 14:00 94 · 11:00 300 · 10/02 15:00 300 → 첫 묶음 500 = 17:30~11:00(206건) · 둘째 = 11:00(94건) + 10/02
ch, 전부 = 묶음들([("2026-10-07 17:30:00", 100), ("2026-10-07 16:00:00", 100), ("2026-10-07 14:00:00", 94),
                   ("2026-10-07 11:00:00", 300), ("2026-10-02 15:00:00", 300)])
봄("가짜 묶음 모양 — 첫 묶음 500 · 끝이 11:00 · 둘째 묶음 첫 줄 11:00", len(ch[0]) == 500 and ch[0][-1]["dt"].startswith("2026-10-07 11:00") and ch[1][0]["dt"].startswith("2026-10-07 11:00"))
불림 = []
k = fast.known_on_site(META(len(ch)), ch[0], lambda i: (불림.append(i), ch[i] if i < len(ch) else None)[1])
봄("둘째 묶음까지 받고 거기서 멈춤(10/02 가 나와서)", 불림 == [1], 불림)
봄("있는 것 = 첫 묶음 + 둘째 묶음 · 경계 확실", len(k["have"]) == len(ch[0]) + len(ch[1]) and not k["edge"] and k["oldest"] == "202610071100", (len(k["have"]), k["edge"], k["oldest"]))
오늘 = [r for r in 전부 if r["dt"].startswith("2026-10-07")]
새것 = [줄("N0001", "2026-10-07 18:30:00"), 줄("N0002", "2026-10-07 11:00:00")]   # 진짜 새 줄 둘(하나는 경계 시각)
골라 = fast.pick_fresh(오늘 + 새것, ch[0], k)
봄("둘째 묶음에 있는 11:00 개찰 94건은 «방금» 이 아님 · 진짜 새 줄 둘만", [r["no"] for r in 골라] == ["N0001", "N0002"], [r["no"] for r in 골라][:10])

print("■ ② 고치기 전 셈(첫 묶음만)이라면 — 94건이 «방금» 으로 다시 올라감(그날의 오류를 그대로 재현)")
옛 = {"have": {r["no"] for r in ch[0]}, "oldest": "202610071100", "edge": False}
봄("옛 셈은 94 + 2 건을 골랐음", len(fast.pick_fresh(오늘 + 새것, ch[0], 옛)) == 96)

print("■ ③ 뒤 묶음을 못 받으면 — 경계 시각(11:00)과 같은 줄은 그 회차엔 뺌(겹치는 것보다 낫게)")
k3 = fast.known_on_site(META(len(ch)), ch[0], lambda i: None)
골라3 = fast.pick_fresh(오늘 + 새것, ch[0], k3)
봄("edge 표 · 18:30 새 줄만 남음", k3["edge"] and [r["no"] for r in 골라3] == ["N0001"], [r["no"] for r in 골라3][:5])
봄("known 없이 부르면(옛 호출) 같은 조심 — 첫 묶음이 꽉 찼으니 경계 시각 뺌", [r["no"] for r in fast.pick_fresh(오늘 + 새것, ch[0])] == ["N0001"])

print("■ ④ 첫 묶음이 덜 찼으면(묶음 하나) — 뒤를 안 부르고 예전과 같게")
ch4, 전부4 = 묶음들([("2026-10-07 17:30:00", 50), ("2026-10-07 11:00:00", 250)])
불림4 = []
k4 = fast.known_on_site(META(1), ch4[0], lambda i: (불림4.append(i), None)[1])
골라4 = fast.pick_fresh(전부4 + 새것 + [줄("OLD1", "2026-10-06 09:00:00")], ch4[0], k4)
봄("안 부름 · 경계 확실 · 새 줄 둘(같은 시각 포함) · 더 오래된 줄은 뺌", 불림4 == [] and not k4["edge"] and [r["no"] for r in 골라4] == ["N0001", "N0002"], [r["no"] for r in 골라4])

print("■ ⑤ 같은 시각 무리가 500 을 넘게 이어지면 — 셋째 묶음까지 받음")
ch5, 전부5 = 묶음들([("2026-10-07 17:30:00", 400), ("2026-10-07 11:00:00", 800), ("2026-10-02 15:00:00", 300)])
불림5 = []
k5 = fast.known_on_site(META(len(ch5)), ch5[0], lambda i: (불림5.append(i), ch5[i] if i < len(ch5) else None)[1])
봄("1 · 2번 묶음을 받고 멈춤 · 11:00 800건 모두 «있는 것»", 불림5 == [1, 2] and all(r["no"] in k5["have"] for r in 전부5 if r["dt"].startswith("2026-10-07 11")), 불림5)
봄("고르면 진짜 새 줄 둘만", [r["no"] for r in fast.pick_fresh([r for r in 전부5 if r["dt"] >= "2026-10-07"] + 새것, ch5[0], k5)] == ["N0001", "N0002"])

print("■ ⑥ 목록표가 «묶음 1개» 라면 첫 묶음이 꽉 차도 뒤를 안 부름")
불림6 = []
k6 = fast.known_on_site(META(1), ch[0], lambda i: (불림6.append(i), None)[1])
봄("안 부름 · edge 아님", 불림6 == [] and not k6["edge"])

print("■ ⑦ 같은 시각이 MORE_PARTS(3) 묶음을 넘게 이어지면 — 끝까지 못 봤으니 edge")
ch7, 전부7 = 묶음들([("2026-10-07 17:30:00", 100), ("2026-10-07 11:00:00", 2000), ("2026-10-02 15:00:00", 100)])
k7 = fast.known_on_site(META(len(ch7)), ch7[0], lambda i: ch7[i] if i < len(ch7) else None)
봄("edge 표(경계 시각 줄은 그 회차 뺌)", k7["edge"])

print("■ ⑧ 묶음이 비었거나 목록표가 이상해도 죽지 않음")
봄("빈 첫 묶음", fast.known_on_site({}, [], lambda i: None) == {"have": set(), "oldest": "", "edge": False})
봄("목록표가 글자", fast.known_on_site({"chunk": "x", "con": {"parts": "y"}}, ch[0], lambda i: ch[i] if i < len(ch) else None)["have"].__len__() == len(ch[0]) + len(ch[1]))

print(f"\n{통과} 통과 · {실패} 실패")
sys.exit(1 if 실패 else 0)
