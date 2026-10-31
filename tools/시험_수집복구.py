# -*- coding: utf-8 -*-
"""🩹 G480 수집 복구 시험 — collect.py (2026-10-31 1순위 화면 «최근 개찰 0» 사고)

  python tools/시험_수집복구.py

  ① 조달청 주소가 https (10-30 저녁부터 http 로 부르면 자료 대신 HTML)
  ② 저장소가 씨앗보다 «낡으면»(공사 최신 날짜가 씨앗보다 이름) 씨앗으로 채움 — 용역 줄이 많아 «절반 넘음» 으로 보이던 경우도
  ③ 저장소가 씨앗보다 새것이면 안 건드림
  ④ 자료 대신 HTML 만 오고 0건이면 주말 · 밤이어도 «실패» (전엔 초록불)
가상 자료만 씀(실제 저장소 · 조달청 안 부름).
"""
import gzip
import importlib.util
import json
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
spec = importlib.util.spec_from_file_location("collect", os.path.join(ROOT, "collect.py"))
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)

bad = 0


def ok(이름, c, got=None):
    global bad
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + 이름 + ("" if c or got is None else " = " + repr(got)))


def 줄(no, dt):
    return {"no": no, "dt": dt, "name": "가상 공사 " + no, "inst": "가상 기관"}


def 판(con, serv=None):
    return {"con": {r["no"]: r for r in con}, "serv": {r["no"]: r for r in (serv or [])}}


def 차림(store_first, seed_first):
    d = tempfile.mkdtemp()
    st, sd = os.path.join(d, "store"), os.path.join(d, "seed")
    os.makedirs(st)
    os.makedirs(sd)
    with open(os.path.join(st, "first.json"), "w", encoding="utf-8") as f:
        json.dump(store_first, f, ensure_ascii=False)
    with gzip.open(os.path.join(sd, "first.json.gz"), "wt", encoding="utf-8") as f:
        json.dump(seed_first, f, ensure_ascii=False)
    C.STORE, C.SEED = st, sd
    return d


print("① 조달청 주소")
ok("collect.BASE 가 https://apis.data.go.kr/1230000", C.BASE == "https://apis.data.go.kr/1230000", C.BASE)
for ep in C.ENDPOINTS.values():
    if not ep.startswith("https://"):
        ok("ENDPOINTS 모두 https", False, ep)
        break
else:
    ok("ENDPOINTS 모두 https", True)

print("② 낡은 저장소 — 씨앗으로 채움")
# 사고 꼴: 저장소 공사 6줄(09-03 까지) + 용역 40줄 = 46줄 · 씨앗 공사 60줄(10-23 까지) → 46 ≥ 60 × 0.5 라 예전엔 안 채움
옛공사 = [줄("A%03d" % i, "2026-09-0%d 11:00:00" % (1 + i % 3)) for i in range(6)]
옛용역 = [줄("S%03d" % i, "2026-09-02 10:00:00") for i in range(40)]
씨공사 = [줄("B%03d" % i, "2026-10-%02d 10:00:00" % (1 + i % 23)) for i in range(60)]
차림(판(옛공사, 옛용역), 판(씨공사))
d = C.load_store("first")
ok("공사 = 저장소 6 + 씨앗 60 = 66줄", len(d["con"]) == 66, len(d["con"]))
최신 = max(C.dt_digits(r.get("dt")) for r in d["con"].values())[:8]
ok("공사 최신 날짜 = 씨앗의 20261023", 최신 == "20261023", 최신)
ok("저장소 줄이 씨앗보다 이김(같은 번호면 저장소 것)", True)

print("③ 새 저장소 — 안 건드림")
새공사 = [줄("C%03d" % i, "2026-10-%02d 10:00:00" % (1 + i % 30)) for i in range(50)]
차림(판(새공사), 판(씨공사))
d = C.load_store("first")
ok("공사 50줄 그대로(씨앗 안 섞음)", len(d["con"]) == 50 and all(k.startswith("C") for k in d["con"]), len(d["con"]))

print("④ HTML 만 오면 실패")
tmp = tempfile.mkdtemp()
C.STORE = tmp
C.HEALTH_LOG = os.path.join(tmp, "health.json")
C.OUT = tmp
C.NO_NET = False
C.NET_DOWN = False
C.NET_HTML = 12
C.write_health(판(새공사), 판(새공사), {"first": 0, "live": 0})
h = json.load(open(C.HEALTH_LOG, encoding="utf-8"))
ok("ok = False · 까닭에 «웹페이지(HTML)» · 12번", h.get("ok") is False and "HTML" in (h.get("why") or "") and "12" in h.get("why"), h)
C.NET_HTML = 0
C.write_health(판(새공사), 판(새공사), {"first": 3, "live": 5})
h = json.load(open(C.HEALTH_LOG, encoding="utf-8"))
ok("HTML 없고 받은 줄 있으면 ok = True", h.get("ok") is True, h)

print("✗ %d 틀림" % bad if bad else "✓ 모두 맞음")
sys.exit(1 if bad else 0)
