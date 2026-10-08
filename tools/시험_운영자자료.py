# -*- coding: utf-8 -*-
"""🧪 tools/운영자자료.py 시험 — 인터넷 · 비밀값 없이 (G200 · 2026-10-08)

  python tools/시험_운영자자료.py
"""
import gzip
import io
import json
import os
import sys
import tempfile
from contextlib import redirect_stdout

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import 운영자자료 as M  # noqa: E402

실패 = 0


def 확인(이름, 참, 더=""):
    global 실패
    print(("✓ " if 참 else "✗ ") + 이름 + ("" if 참 else "  " + str(더)))
    if not 참:
        실패 += 1


def 돌려(argv, **k):
    k.setdefault("CORS함수", None)
    b = io.StringIO()
    with redirect_stdout(b):
        r = M.main(argv, **k)
    return r, b.getvalue()


d = tempfile.mkdtemp()
p = os.path.join(d, "first.json")
자료 = {"con": {"R1": {"no": "R1", "dt": "2026-10-01"}, "R2": {"no": "R2", "dt": "2026-10-02"}}, "_lastrun": "x"}
open(p, "w", encoding="utf-8").write(json.dumps(자료, ensure_ascii=False))
raw = open(p, "rb").read()

# ① 압축 — 같은 내용이면 같은 바이트 · 풀면 원본
g1, g2 = M.압축(raw), M.압축(raw)
확인("같은 내용 → 같은 압축 바이트(md5 로 «안 바뀜» 알아봄)", g1 == g2)
확인("풀면 원본 그대로", gzip.decompress(g1) == raw)
확인("gzip 머리(1f 8b) — 화면이 이것을 보고 풂", g1[:2] == b"\x1f\x8b")

# ② --dry · 잘못된 자료
r, out = 돌려([p, "--dry"])
확인("--dry 는 0 · 올리지 않음", r == 0 and "올리지 않음" in out, out)
r, out = 돌려([os.path.join(d, "없음.json")])
확인("파일이 없으면 2", r == 2, out)
빈 = os.path.join(d, "빈.json"); open(빈, "w").write('{"con": {}}')
r, out = 돌려([빈])
확인("개찰이 비었으면 안 올림(2) — 빈 것으로 덮지 않음", r == 2 and "안 올림" in out, out)

# ③ 올리기 흐름 (가짜 저장소)
올린 = []
가짜토큰 = lambda: "TOKEN-SECRET-XYZ"
def 가짜올림(gz, tok, 줄):
    올린.append((len(gz), tok, 줄)); return {"md5Hash": M.md5b64(gz), "size": str(len(gz))}

r, out = 돌려([p], 토큰함수=가짜토큰, 지금함수=lambda t: None, 올림함수=가짜올림)
확인("처음 — 올림(새로) · 0", r == 0 and len(올린) == 1 and "새로" in out, out)
확인("줄 수 2 를 꼬리표로", 올린[0][2] == 2, 올린)
r, out = 돌려([p], 토큰함수=가짜토큰, 지금함수=lambda t: {"md5Hash": M.md5b64(M.압축(raw))}, 올림함수=가짜올림)
확인("같은 내용 — 안 올림 · 0", r == 0 and len(올린) == 1 and "안 올림" in out, out)
r, out = 돌려([p], 토큰함수=가짜토큰, 지금함수=lambda t: {"md5Hash": "다름"}, 올림함수=가짜올림)
확인("바뀐 내용 — 덮어씀 · 0", r == 0 and len(올린) == 2 and "덮어씀" in out, out)
r, out = 돌려([p], 토큰함수=가짜토큰, 지금함수=lambda t: None, 올림함수=lambda g, t, n: {"md5Hash": "틀림"})
확인("올린 뒤 md5 가 다르면 1(→ 그 회차는 사이트에 실음)", r == 1, out)

# ④ 실패 — 0 이 아님 · 토큰이 기록에 안 찍힘
import urllib.error
def 막힘(t):
    raise urllib.error.HTTPError("https://x", 403, "Forbidden TOKEN-SECRET-XYZ", {}, None)
r, out = 돌려([p], 토큰함수=가짜토큰, 지금함수=막힘, 올림함수=가짜올림)
확인("권한 없음(403) — 1", r == 1 and "HTTP 403" in out, out)
확인("기록에 토큰이 안 찍힘", "TOKEN-SECRET" not in out, out)
os.environ.pop("FIREBASE_SERVICE_ACCOUNT", None)
r, out = 돌려([p])
확인("비밀값이 없으면 1 (멈추지 않고 실패만 알림)", r == 1 and "실패" in out, out)

# ⑤ 올리는 몸(multipart) 모양
class 받이:
    def __init__(s): s.got = None
받 = 받이()
def 가짜요청(url, tok, data=None, 머리=None, 방법=None):
    받.got = (url, data, 머리); return {"md5Hash": M.md5b64(g1)}
원래 = M.요청; M.요청 = 가짜요청
try:
    M.올리기(g1, "TOKENZZ", 2)
finally:
    M.요청 = 원래
url, data, 머리 = 받.got
확인("올리는 자리 = op/first_full.json.gz · multipart", "uploadType=multipart" in url and b'"name": "op/first_full.json.gz"' in data, url)
확인("내용 종류 application/gzip · 캐시 안 함", b'"contentType": "application/gzip"' in data and b"no-cache" in data)
확인("압축 바이트가 몸 안에 그대로", g1 in data)
확인("토큰은 주소에 없음", "TOKENZZ" not in url, url)

# ⑥ 🩹 G203 버킷 CORS — 우리 출처 GET 이 없으면 더하고, 다른 줄은 그대로 · 있으면 안 건드림
불린 = []
def 가짜요청2(url, tok, data=None, 머리=None, 방법=None):
    불린.append((방법 or ("POST" if data is not None else "GET"), url, data))
    if 방법 == "PATCH":
        return json.loads(data.decode("utf-8"))
    return {"cors": 지금cors}
원래 = M.요청; M.요청 = 가짜요청2
try:
    지금cors = [{"origin": ["https://다른.example"], "method": ["PUT"]}]
    r = M.CORS맞춤("T")
    patch = [x for x in 불린 if x[0] == "PATCH"]
    몸 = json.loads(patch[0][2].decode("utf-8"))["cors"] if patch else []
    확인("CORS 없으면 더함 · 다른 줄 그대로", r == "더함" and len(몸) == 2 and 몸[0]["origin"] == ["https://다른.example"] and "https://k-conmap.com" in 몸[1]["origin"], 몸)
    확인("CORS 는 GET · HEAD 만(쓰기 없음)", 몸 and set(몸[1]["method"]) == {"GET", "HEAD"}, 몸)
    확인("CORS 주소에 토큰 없음", all("T" not in x[1].split("?")[0][-3:] for x in 불린))
    불린.clear(); 지금cors = [M.CORS_줄]
    r = M.CORS맞춤("T")
    확인("이미 있으면 안 건드림(PATCH 0)", r == "있음" and not [x for x in 불린 if x[0] == "PATCH"], 불린)
finally:
    M.요청 = 원래
def 터짐():
    raise urllib.error.HTTPError("https://x", 403, "Forbidden", {}, None)
올린.clear()
r, out = 돌려([p], 토큰함수=가짜토큰, 지금함수=lambda t: None, 올림함수=가짜올림, CORS함수=터짐)
확인("CORS 권한 없어도 자료는 올림 · 0", r == 0 and len(올린) == 1 and "CORS 를 못" in out and "HTTP 403" in out, out)
r, out = 돌려([p], 토큰함수=가짜토큰, 지금함수=lambda t: None, 올림함수=가짜올림, CORS함수=lambda: "있음")
확인("CORS 있으면 한 줄 «있음»", "버킷 CORS(사이트 화면에서 받기) — 있음" in out, out)

print("\n실패", 실패)
sys.exit(1 if 실패 else 0)
