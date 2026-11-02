# -*- coding: utf-8 -*-
"""🧪 G512 — 옛 화면 묶음 이어 두기(tools/옛묶음잇기.py) 시험   python tools/시험_옛묶음잇기.py

가짜 «지금 사이트»(127.0.0.1 — 없는 파일은 파이어베이스처럼 404 + HTML)를 띄워 놓고
처음 · 코드가 바뀐 배포 · 자료만 바뀐 배포 · 없는 파일 · 큰 파일 · 위험한 이름 · 새 판 안 덮음 · 사이트가 안 될 때를 봅니다.
그리고 update.yml 에 «굽기 뒤 · 배포 앞» 으로 들어 있는지, firebase.json 이 목록을 캐시하지 않는지.
⚠️ PC 올리기 꾸러미 시험 목록에는 넣지 않습니다 — 127.0.0.1 에 작은 서버를 띄우므로 클라우드에서만 돌립니다.
   (PC 에서는 tools/시험_묶음이름.mjs 가 update.yml 자리 · firebase.json 을 봅니다)
"""
import http.server
import json
import os
import re
import shutil
import sys
import tempfile
import threading

os.environ["no_proxy"] = os.environ["NO_PROXY"] = "127.0.0.1,localhost"      # 가짜 사이트는 바로(프록시 거치지 않게)
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
import importlib.util
spec = importlib.util.spec_from_file_location("옛묶음잇기", os.path.join(HERE, "옛묶음잇기.py"))
K = importlib.util.module_from_spec(spec)
spec.loader.exec_module(K)

ok = bad = 0


def see(c, m, more=""):
    global ok, bad
    if c:
        ok += 1
    else:
        bad += 1
        print(f"  ✗ {m} {more}")


def write(p, b):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "wb") as f:
        f.write(b if isinstance(b, bytes) else b.encode("utf-8"))


tmp = tempfile.mkdtemp(prefix="keepassets_")
live = os.path.join(tmp, "live")


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=live, **k)

    def log_message(self, *a):
        pass

    def send_error(self, code, message=None, explain=None):      # 파이어베이스처럼 404 쪽은 HTML
        body = b"<!doctype html><title>404</title>not found"
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
threading.Thread(target=srv.serve_forever, daemon=True).start()
SITE = f"http://127.0.0.1:{srv.server_address[1]}"


def dist_with(names):
    d = tempfile.mkdtemp(prefix="dist_", dir=tmp)
    for n in names:
        write(os.path.join(d, "assets", n), f"새 판 {n}")
    return d


def keepfile(d):
    with open(os.path.join(d, "assets-keep.json"), encoding="utf-8") as f:
        return json.load(f)


logs = []
L = logs.append
try:
    print("① 처음 — 사이트에 목록이 아직 없음")
    write(os.path.join(live, "assets", "Forms-OLD1.js"), "옛 Forms")
    write(os.path.join(live, "assets", "react-SAME.js"), "react")
    d = dist_with(["Forms-NEW1.js", "react-SAME.js"])
    r = K.keep(d, SITE, log=L)
    k = keepfile(d)
    see(r["ok"] and r["carried"] == 0 and k["own"] == ["Forms-NEW1.js", "react-SAME.js"] and k["prev"] == [], "처음 — 실은 것 없음 · 목록(own)만 남김", json.dumps(k, ensure_ascii=False))

    print("② 코드가 바뀐 배포 — 사이트 판(own)을 앞 판으로 · 이번에 없는 것만 받음")
    write(os.path.join(live, "assets-keep.json"), json.dumps({"own": ["Forms-OLD1.js", "react-SAME.js", "BIM모델-OLD.js"], "prev": []}, ensure_ascii=False))
    write(os.path.join(live, "assets", "BIM모델-OLD.js"), "옛 BIM")
    d = dist_with(["Forms-NEW1.js", "react-SAME.js"])
    r = K.keep(d, SITE, log=L)
    k = keepfile(d)
    with open(os.path.join(d, "assets", "Forms-OLD1.js"), encoding="utf-8") as f:
        got = f.read()
    see(r["carried"] == 2 and got == "옛 Forms" and os.path.exists(os.path.join(d, "assets", "BIM모델-OLD.js")), "앞 판에만 있는 Forms-OLD1 · BIM모델-OLD(한글 이름) 실음", str(r))
    see(k["own"] == ["Forms-NEW1.js", "react-SAME.js"] and k["prev"] == ["BIM모델-OLD.js", "Forms-OLD1.js", "react-SAME.js"], "새 목록 — own 이번 · prev 사이트 판", json.dumps(k, ensure_ascii=False))
    with open(os.path.join(d, "assets", "react-SAME.js"), encoding="utf-8") as f:
        see(f.read() == "새 판 react-SAME.js", "같은 이름(react-SAME)은 새 판 그대로(안 받음 · 안 덮음)")

    print("③ 자료만 바뀐 배포 — 묶음 목록이 같으면 앞 판 목록(prev)을 그대로 물려받아 또 실음")
    # 사이트가 ② 를 배포한 모습: own = 새 판, prev = 옛 판 · 옛 파일들도 사이트에 있음
    write(os.path.join(live, "assets-keep.json"), json.dumps({"own": ["Forms-NEW1.js", "react-SAME.js"], "prev": ["BIM모델-OLD.js", "Forms-OLD1.js", "react-SAME.js"]}, ensure_ascii=False))
    write(os.path.join(live, "assets", "Forms-NEW1.js"), "새 판 Forms-NEW1.js")
    d = dist_with(["Forms-NEW1.js", "react-SAME.js"])
    r = K.keep(d, SITE, log=L)
    k = keepfile(d)
    see(r["carried"] == 2 and "자료만" in r["mode"] and k["prev"] == ["BIM모델-OLD.js", "Forms-OLD1.js", "react-SAME.js"], "자료만 바뀐 배포 — 옛 판 둘 다시 실음 · prev 그대로", str(r))

    print("④ 그다음 코드 배포 — 두 판 전 것은 안 실음(한 세대만)")
    d = dist_with(["Forms-NEW2.js", "react-SAME.js"])
    r = K.keep(d, SITE, log=L)
    k = keepfile(d)
    see(r["carried"] == 1 and os.path.exists(os.path.join(d, "assets", "Forms-NEW1.js")) and not os.path.exists(os.path.join(d, "assets", "Forms-OLD1.js")), "바로 앞 판(Forms-NEW1)만 · 두 판 전(Forms-OLD1)은 안 실음", str(r))

    print("⑤ 사이트에 없는 파일(404 HTML) · 너무 큰 파일 · 위험한 이름")
    write(os.path.join(live, "assets-keep.json"), json.dumps({"own": ["없는-X.js", "큰-Y.js", "../밖.js", "a/b.js", ".숨김.js", "react-SAME.js"], "prev": []}, ensure_ascii=False))
    write(os.path.join(live, "assets", "큰-Y.js"), b"x" * 5000)
    write(os.path.join(tmp, "밖.js"), "밖")
    d = dist_with(["react-SAME.js"])
    r = K.keep(d, SITE, one_max=1000, log=L)
    names = sorted(os.listdir(os.path.join(d, "assets")))
    see(names == ["react-SAME.js"] and r["carried"] == 0 and r["skipped"] == 2, "404(HTML) · 1000바이트 넘는 파일은 버림 · ../ · / · . 로 시작하는 이름은 아예 안 봄", f"{names} {r}")
    k = keepfile(d)
    see("../밖.js" not in k["prev"] and "a/b.js" not in k["prev"] and ".숨김.js" not in k["prev"], "위험한 이름은 목록에도 안 남김", json.dumps(k, ensure_ascii=False))

    print("⑥ 모두 합쳐 넘치면 거기서 멈춤")
    for i in range(5):
        write(os.path.join(live, "assets", f"A{i}.js"), b"y" * 400)
    write(os.path.join(live, "assets-keep.json"), json.dumps({"own": [f"A{i}.js" for i in range(5)], "prev": []}))
    d = dist_with(["react-SAME.js"])
    r = K.keep(d, SITE, all_max=1000, log=L)
    see(r["carried"] == 2 and r["size"] <= 1000, "모두 1000바이트까지 — 400 × 2 만 실음", str(r))
    d = dist_with(["react-SAME.js"])
    r = K.keep(d, SITE, time_max=-1, log=L)
    see(r["ok"] and r["carried"] == 0 and r["skipped"] == 5 and keepfile(d)["own"] == ["react-SAME.js"], "시간(4분)을 넘기면 더 안 받고 목록만 남김", str(r))

    print("⑦ 사이트가 안 될 때 · 목록 모양이 틀릴 때 — 배포를 세우지 않음")
    d = dist_with(["react-SAME.js"])
    r = K.keep(d, "http://127.0.0.1:9", log=L)
    see(r["ok"] and r["carried"] == 0 and keepfile(d)["prev"] == [], "사이트 안 됨 → 목록만 남기고 끝")
    write(os.path.join(live, "assets-keep.json"), "이건 JSON 이 아님")
    d = dist_with(["react-SAME.js"])
    r = K.keep(d, SITE, log=L)
    see(r["ok"] and r["carried"] == 0, "목록이 깨져 있어도 → 목록만 남기고 끝")
    write(os.path.join(live, "assets-keep.json"), json.dumps({"own": ["react-SAME.js"], "prev": "A0.js"}))
    d = dist_with(["react-SAME.js"])
    r = K.keep(d, SITE, log=L)
    see(r["ok"] and r["carried"] == 0 and r["want"] == 0 and keepfile(d)["prev"] == [], "prev 가 목록이 아니면(글자) 안 씀 — 글자 하나씩 받으려 들지 않음", str(r))
    see(re.match(r"^\d{4}-\d\d-\d\d \d\d:\d\d KST$", keepfile(d)["at"]) is not None, "목록에 한국 시각", keepfile(d)["at"])
    see(K.keep(os.path.join(tmp, "없는폴더"), SITE, log=L)["ok"] is False, "dist/assets 가 없으면 건너뜀")
finally:
    srv.shutdown()
    shutil.rmtree(tmp, ignore_errors=True)

print("⑧ 배포 길에 들어 있나")
wf = open(os.path.join(ROOT, ".github", "workflows", "update.yml"), encoding="utf-8").read()
i_bake, i_keep, i_dep = wf.find("- name: 주소별 HTML 굽기"), wf.find("- name: 옛 화면 묶음 이어 두기"), wf.find("- name: 사이트 배포")
step = wf[i_keep:i_dep] if i_keep > 0 else ""
see(0 < i_bake < i_keep < i_dep, "update.yml — «주소별 HTML 굽기» 뒤 · «사이트 배포» 앞", f"{i_bake} {i_keep} {i_dep}")
see("continue-on-error: true" in step and "python tools/옛묶음잇기.py web/dist" in step and "STORE_OK" in step, "실패해도 배포는 그대로(continue-on-error) · web/dist · 수집 기록 받은 회차만")
fb = json.load(open(os.path.join(ROOT, "web", "firebase.json"), encoding="utf-8"))
hs = fb["hosting"]["headers"] if isinstance(fb.get("hosting"), dict) else fb["hosting"][0]["headers"]
keep_h = [h for h in hs if h.get("source") == "/assets-keep.json"]
see(keep_h and any(x["key"] == "Cache-Control" and "no-store" in x["value"] for x in keep_h[0]["headers"]), "firebase.json — /assets-keep.json 은 캐시 안 함(배포 앞에 늘 지금 것을 읽게)")

print(f"\n옛 묶음 이어 두기 {ok}/{ok + bad}")
sys.exit(1 if bad else 0)
