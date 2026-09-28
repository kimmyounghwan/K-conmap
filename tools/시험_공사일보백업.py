# -*- coding: utf-8 -*-
"""⛑ 공사일보 백업 시험 — python tools/시험_공사일보백업.py
인터넷·비밀값 없이: 잠그기·풀기(틀린 열쇠는 못 풂) · 비울 목록(30일) · 되살릴 것 · 세기. (가상 자료)"""
import importlib.util, os, sys
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
여기 = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("백업", os.path.join(여기, "공사일보백업.py"))
M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
틀림 = 0
def 봄(이름, 참, 더=""):
    global 틀림
    if not 참: 틀림 += 1
    print(("  ✓ " if 참 else "  ✗ ") + 이름 + ((" — " + str(더)) if 더 else ""))

하루 = 86400000
지금 = 1_790_000_000_000
가짜키 = {"private_key": "-----BEGIN PRIVATE KEY-----\n" + "A" * 1600 + "\n-----END PRIVATE KEY-----\n"}
딴키 = {"private_key": "-----BEGIN PRIVATE KEY-----\n" + "B" * 1600 + "\n-----END PRIVATE KEY-----\n"}
자료 = {"at": "시험", "nodes": {
    "cost_pins": {"AAAAAAAAA": "h" * 64, "BBBBBBBBB": "g" * 64},
    "cost_keys": {"AAAAAAAAA": {"u1": "h" * 64}},
    "cost_sites": {"AAAAAAAAA": {"name": "가상 현장", "total": 100, "at": 1},
                   "BBBBBBBBB": {"name": "지운 현장", "total": 1, "at": 1, "del": 지금 - 31 * 하루},
                   "CCCCCCCCC": {"name": "어제 지움", "total": 1, "at": 1, "del": 지금 - 1 * 하루}},
    "cost_rows": {"AAAAAAAAA": {"r1": {"d": "2026-09-27", "k": "M", "amt": 1500000, "at": 1}}, "BBBBBBBBB": {"r9": {"d": "2026-01-01", "k": "L", "amt": 1, "at": 1}}},
    "cost_people": {"AAAAAAAAA": {"p1": {"n": "홍길동", "at": 1, "x": "v1.abc.def"}}},
    "cost_trash": {"AAAAAAAAA": {"t_old": {"p": "rows", "k": "r0", "v": {"amt": 1}, "at": 지금 - 31 * 하루},
                                 "t_new": {"p": "rows", "k": "r2", "v": {"amt": 2}, "at": 지금 - 2 * 하루}},
                   "BBBBBBBBB": {"t_b": {"p": "rows", "k": "r8", "v": {"amt": 3}, "at": 지금 - 40 * 하루}}},
}}
k = M.열쇠(가짜키)
b = M.잠그기(k, 자료)
봄("잠근 파일에 이름·금액이 안 보임", "홍길동".encode() not in b and b"1500000" not in b and b[:5] == b"KCMB1")
봄("같은 열쇠로 풀면 그대로", M.풀기(k, b) == 자료)
try:
    M.풀기(M.열쇠(딴키), b); 봄("딴 열쇠로는 못 풂", False)
except Exception:
    봄("딴 열쇠로는 못 풂", True)
봄("잠글 때마다 다른 글(같은 자료라도)", M.잠그기(k, 자료) != b)

지울 = M.비울목록(자료, 지금)
봄("30일 지난 휴지통만 비움", "cost_trash/AAAAAAAAA/t_old" in 지울 and "cost_trash/AAAAAAAAA/t_new" not in 지울, sorted(지울))
봄("지운 지 31일 된 현장은 모든 자리째", all(("%s/BBBBBBBBB" % x) in 지울 for x in ["cost_sites", "cost_rows", "cost_trash", "cost_pins", "cost_keys"]))
봄("통째로 지우는 현장 안의 낱개는 겹쳐 넣지 않음", "cost_trash/BBBBBBBBB/t_b" not in 지울)
봄("어제 지운 현장은 그대로", not any("CCCCCCCCC" in x for x in 지울))
봄("살아 있는 현장 자료는 안 건드림", not any(x.endswith("/AAAAAAAAA") for x in 지울))

쓸, 핀, 키들, ns = M.되살릴것(자료, "AAAAAAAAA")
봄("되살리기: 그 현장 자리 열 곳(업체 링크·업체 입력·공사일보 포함)을 그날 모습으로", len(쓸) == 10 and "cost_day/AAAAAAAAA" in 쓸 and "cost_vin/AAAAAAAAA" in 쓸 and "cost_vlink/AAAAAAAAA" in 쓸 and 쓸["cost_rows/AAAAAAAAA"]["r1"]["amt"] == 1500000 and 쓸["cost_att/AAAAAAAAA"] is None)
봄("되살리기: 비밀번호 해시·열쇠도 챙김", 핀 == "h" * 64 and 키들 == {"u1": "h" * 64})
try:
    M.되살릴것(자료, "ZZZZZZZZZ"); 봄("없는 현장은 멈춤", False)
except SystemExit:
    봄("없는 현장은 멈춤", True)
봄("되살리기: 묶음은 cost", ns == "cost")

# 🚜⚠️ 2026-09-29 장비 장부(eq) · 위험성평가(rk) — 같은 방식
자료2 = {"nodes": {
    "eq_pins": {"EEEEEEEEE": "e" * 64}, "eq_keys": {"EEEEEEEEE": {"u2": "e" * 64}},
    "eq_books": {"EEEEEEEEE": {"name": "가상 중기", "at": 1}, "FFFFFFFFF": {"name": "지운 장부", "at": 1, "del": 지금 - 35 * 하루}},
    "eq_rows": {"EEEEEEEEE": {"r1": {"d": "2026-09-01", "cl": "c1", "q": 8, "un": "시간", "u": 1, "amt": 8, "ok": "G", "at": 1}}},
    "eq_trash": {"EEEEEEEEE": {"t1": {"p": "rows", "k": "r0", "v": {"amt": 1}, "at": 지금 - 31 * 하루}}},
    "rk_pins": {"RRRRRRRRR": "r" * 64},
    "rk_books": {"RRRRRRRRR": {"name": "가상 현장", "at": 1}},
    "rk_docs": {"RRRRRRRRR": {"d1": {"k": "3", "d": "2026-09-01", "j": "{}", "at": 1}}},
    "rk_pics": {"RRRRRRRRR": {"d1": {"a": "data:image/jpeg;base64,xx", "at": 1}, "d0": {"a": "data:image/jpeg;base64,yy", "at": 1}}},
    "rk_trash": {"RRRRRRRRR": {"t0": {"p": "docs", "k": "d0", "v": {"k": "4"}, "at": 지금 - 31 * 하루},
                               "t2": {"p": "docs", "k": "d2", "v": {"k": "4"}, "at": 지금 - 3 * 하루}}},
}}
지울2 = M.비울목록(자료2, 지금)
봄("장비 장부: 30일 지난 휴지통 비움", "eq_trash/EEEEEEEEE/t1" in 지울2)
봄("장비 장부: 지운 지 35일 된 장부는 자리째(핀·열쇠 포함)", all(("%s/FFFFFFFFF" % x) in 지울2 for x in ["eq_books", "eq_rows", "eq_pay", "eq_trash", "eq_pins", "eq_keys"]))
봄("위험성평가: 휴지통의 서류를 영영 지우면 그 사진도", "rk_trash/RRRRRRRRR/t0" in 지울2 and "rk_pics/RRRRRRRRR/d0" in 지울2)
봄("위험성평가: 살아 있는 서류 사진·3일 된 휴지통은 그대로", "rk_pics/RRRRRRRRR/d1" not in 지울2 and "rk_trash/RRRRRRRRR/t2" not in 지울2 and "rk_pics/RRRRRRRRR/d2" not in 지울2)
쓸2, 핀2, 키2, ns2 = M.되살릴것(자료2, "EEEEEEEEE")
봄("되살리기: 장부 코드로 묶음(eq)을 스스로 찾음", ns2 == "eq" and 핀2 == "e" * 64 and 키2 == {"u2": "e" * 64} and "eq_rows/EEEEEEEEE" in 쓸2 and len(쓸2) == 7)
쓸3, _, _, ns3 = M.되살릴것(자료2, "RRRRRRRRR")
봄("되살리기: 위험성평가는 서류·사진·휴지통까지", ns3 == "rk" and 쓸3["rk_pics/RRRRRRRRR"]["d1"]["a"].startswith("data:") and len(쓸3) == 4)
봄("백업 자리 목록에 eq·rk 핀·열쇠까지", all(x in M.자리들 for x in ["eq_pins", "eq_keys", "eq_rows", "rk_pins", "rk_keys", "rk_docs", "rk_pics", "cost_day"]) and len(M.자리들) == len(set(M.자리들)))
센2 = M.세기(자료2)
봄("세기: 장비 장부 2 · 위험성 서류 1", 센2["장비장부"] == 2 and 센2["위험성서류"] == 1, 센2)
센 = M.세기(자료)
봄("세기(로그엔 개수만)", 센["현장"] == 3 and 센["지운현장"] == 2 and 센["적은줄"] == 2 and 센["휴지통"] == 3, 센)
print("✗ %d" % 틀림 if 틀림 else "✓ 모두 맞음")
sys.exit(1 if 틀림 else 0)
