# -*- coding: utf-8 -*-
"""🗺 이용자 지도 시험 — python tools/시험_이용자지도.py (인터넷 · 비밀값 없이)
  합치기(옛 fresh/map + 이번 도시들): 크기 1·2·3 · 오늘 다녀간 곳 더하기 · 날이 바뀌면 새로 · 빈 것은 None"""
import importlib.util, os, sys
from datetime import datetime, timedelta, timezone
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
여기 = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("지도", os.path.join(여기, "이용자지도.py"))
M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
틀림 = 0
def 봄(이름, 참, 더=""):
    global 틀림
    if not 참: 틀림 += 1
    print(("  ✓ " if 참 else "  ✗ ") + 이름 + ((" — " + str(더)) if 더 else ""))
KST = timezone(timedelta(hours=9))
t = datetime(2026, 10, 2, 10, 30, tzinfo=KST)
새 = M.합치기(None, {"Anyang-si": 1, "Seoul": 3, "Gwangju": 7}, t)
봄("크기 1 · 2 · 3", 새["now"] == {"Anyang-si": 1, "Seoul": 2, "Gwangju": 3}, 새["now"])
봄("오늘 날짜 · 오늘 다녀간 곳", 새["day"]["d"] == "2026-10-02" and set(새["day"]["c"]) == {"Anyang-si", "Seoul", "Gwangju"})
두 = M.합치기(새, {"Yeosu-si": 1}, t + timedelta(minutes=10))
봄("다음 회차 — 지금은 그 회차 것만 · 오늘은 더함", 두["now"] == {"Yeosu-si": 1} and set(두["day"]["c"]) == {"Anyang-si", "Seoul", "Gwangju", "Yeosu-si"})
빈 = M.합치기(두, {}, t + timedelta(minutes=20))
봄("아무도 없으면 now 는 None(지움) · 오늘은 그대로", 빈["now"] is None and len(빈["day"]["c"]) == 4)
밤 = M.합치기(두, {"Busan": 1}, datetime(2026, 10, 3, 0, 5, tzinfo=KST))
봄("자정 넘으면 오늘을 새로", 밤["day"] == {"d": "2026-10-03", "c": {"Busan": 1}}, 밤["day"])
봄("at 은 ms", 새["at"] == int(t.timestamp() * 1000))
봄("데이터베이스 열쇠에 못 쓰는 글자(. # $ [ ] /) 바꿈", "St. Louis/x".translate(M.나쁜글자) == "St_ Louis_x")
print("✓ 모두 맞음" if not 틀림 else f"✗ {틀림}개 틀림")
sys.exit(1 if 틀림 else 0)
