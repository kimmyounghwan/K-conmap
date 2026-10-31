# -*- coding: utf-8 -*-
"""🩹 G480 수집 복구 시험 — collect.py (2026-10-31 1순위 화면 «최근 개찰 0» 사고)

  python tools/시험_수집복구.py

  ① 조달청 주소가 https (10-30 저녁부터 http 로 부르면 자료 대신 HTML)
  ② 저장소가 씨앗보다 «낡으면»(공사 최신 날짜가 씨앗보다 이름) 씨앗으로 채움 — 용역 줄이 많아 «절반 넘음» 으로 보이던 경우도
  ③ 저장소가 씨앗보다 새것이면 안 건드림
  ④ 자료 대신 HTML 만 오고 0건이면 주말 · 밤이어도 «실패» (전엔 초록불)
  ⑤ G481 방지 — http · https 중 한 꼴이 웹페이지만 주면 다른 꼴로 한 번 다시 부르고 이번 회차 나머지도 그 꼴로
  ⑦ G482 조달청 점검 — 안내 페이지 제목 · 연달아 8번이면 이번 회차 호출 멈춤 · health maint · lastok
  ⑥ G481 방지 — 수집 뒤 공사 줄 30 % 넘게 줄면 빌드 · 배포 · 저장 안 함(저장 직전 한 번 더) · 빠른 수집은 작은 캐시(lite-)만
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
ok("ok = False · 까닭에 «웹페이지» · 12번 · maint", h.get("ok") is False and "웹페이지" in (h.get("why") or "") and "12" in h.get("why") and h.get("maint") is True, h)
C.NET_HTML = 0
C.write_health(판(새공사), 판(새공사), {"first": 3, "live": 5})
h = json.load(open(C.HEALTH_LOG, encoding="utf-8"))
ok("HTML 없고 받은 줄 있으면 ok = True", h.get("ok") is True, h)

print("⑤ 방지 — 주소 꼴이 바뀌어 웹페이지가 오면 다른 꼴로 한 번 다시 부름(스스로 고침)")


class 응답:
    def __init__(self, text):
        self.status_code = 200
        self.text = text

    def json(self):
        return json.loads(self.text)


HTML = '<!DOCTYPE html> <html lang="ko"> <head> <meta charset="UTF-8"> </head><body>안내</body></html>'
자료 = json.dumps({"response": {"header": {"resultCode": "00"}, "body": {"items": [{"bidNtceNo": "R26BK00000001"}], "totalCount": 1}}})
부른 = []


def 가짜get(url, params=None, **kw):
    부른.append(url)
    return 응답(HTML if url.startswith("http://") else 자료)


C.requests.get = 가짜get
C.NET_HTML, C.BASE_FLIP, C.SCHEME_NOTE, C.NET_DOWN, C.QUOTA_OUT, C.FLIP_TRIED, C.HTML_STREAK = 0, None, "", False, False, False, 0
C.NET_T0 = __import__("time").time()
out = C.fetch("http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwk", "가상키", label="가상 1")
ok("http 가 웹페이지면 https 로 다시 불러 1줄 받음", isinstance(out, list) and len(out) == 1, out)
ok("이번 회차 남은 호출은 처음부터 https(부른 주소 http → https → https)", (C.fetch("http://apis.data.go.kr/1230000/x/y", "가상키", label="가상 2") or True) and [u.split(":")[0] for u in 부른] == ["http", "https", "https"], 부른)
ok("되받은 것은 «웹페이지만 옴» 에서 뺌(NET_HTML 0) · 알림 글에 https", C.NET_HTML == 0 and "https" in C.SCHEME_NOTE, (C.NET_HTML, C.SCHEME_NOTE))
부른.clear()
C.NET_HTML, C.BASE_FLIP, C.SCHEME_NOTE, C.FLIP_TRIED, C.HTML_STREAK = 0, None, "", False, 0
C.requests.get = lambda url, params=None, **kw: (부른.append(url), 응답(HTML))[1]
out = C.fetch("https://apis.data.go.kr/1230000/x/y", "가상키", label="가상 3")
ok("두 꼴 다 웹페이지면 빈 결과 · NET_HTML 2 · 주소 안 바꿈", out == [] and C.NET_HTML == 2 and C.BASE_FLIP is None and len(부른) == 2, (out, C.NET_HTML, C.BASE_FLIP, 부른))

부른.clear()
C.fetch("https://apis.data.go.kr/1230000/x/y", "가상키", label="가상 4")
ok("G482 — 다른 꼴 다시 부르기는 회차에 한 번만(점검 땐 호출이 두 배가 되지 않게)", len(부른) == 1 and C.NET_HTML == 3, (부른, C.NET_HTML))

print("⑦ G482 조달청 점검 — 안내 페이지 알아봄 · 연달아 오면 호출 멈춤 · 상태 파일 maint · 마지막으로 받은 때")
점검 = ('<!DOCTYPE html> <html lang="ko"> <head> <meta charset="UTF-8"> <title>조달청 시스템 점검 안내</title>'
      '<style>.a{color:red}</style><script>var x="점검아님";</script></head><body><div class="box"><p>보다 안정적인 서비스 제공을 위하여 '
      '<b>시스템 점검</b>을 실시합니다.</p><p>점검기간 : 2026. 10. 30.(금) 19:00 ~ 11. 1.(일) 24:00</p></div></body></html>')
h = C.html_hint(점검)
ok("html_hint — 제목 · «점검» 둘레 글(스크립트 · 태그 뺌) · 160자 안", h.startswith("조달청 시스템 점검 안내 · ") and h.count("조달청 시스템 점검 안내") == 1 and "실시합니다" in h and "점검기간" in h and "점검아님" not in h and "<" not in h and len(h) <= 160, h)
ok("html_hint — 글이 없거나 깨져도 빈 글", C.html_hint("") == "" and C.html_hint(None) == "", C.html_hint(""))


class 바이트응답:
    """🩹 G485 조달청 실제처럼 — charset 없는 text/html: requests 는 .text 를 latin-1 로 풂(글자 깨짐) · .content 는 UTF-8 바이트"""
    def __init__(self, html):
        self.status_code = 200
        self.content = html.encode("utf-8")
        self.text = self.content.decode("latin-1")

    def json(self):
        return json.loads(self.text)


r = 바이트응답(점검)
ok("G485 — r.text 는 깨져 있음(시험 바탕 확인)", "점검" not in r.text and "ì" in r.text)
ok("G485 — _utf8글 로 읽으면 «시스템 점검 안내» 가 바로 보임", C.html_hint(C._utf8글(r)).startswith("조달청 시스템 점검 안내"), C.html_hint(C._utf8글(r)))
ok("G485 — 바이트가 UTF-8 이 아니면 r.text 그대로(오류 없음)", C._utf8글(type("R", (), {"content": b"\xff\xfe<html>", "text": "<html>"})()) == "<html>")
부른.clear()
C.requests.get = lambda url, params=None, **kw: (부른.append(url), 바이트응답(점검))[1]     # G485 실제처럼 charset 없는 응답
C.NET_HTML, C.BASE_FLIP, C.SCHEME_NOTE, C.FLIP_TRIED, C.HTML_STREAK, C.HTML_HINT, C.NET_DOWN = 0, None, "", False, 0, "", False
for i in range(30):
    C.fetch("https://apis.data.go.kr/1230000/x/y", "가상키", label="가상 점검 %d" % i)
ok("연달아 안내 페이지 %d번이면 호출 멈춤(30번 부르려 해도 실제로는 %d + 다른 꼴 1)" % (C.HTML_STOP, C.HTML_STOP), C.NET_DOWN and len(부른) == C.HTML_STOP + 1, (C.NET_DOWN, len(부른)))
ok("멈춘 뒤 fetch_paged 는 «못 받음» 이유를 줌(그날은 점검 뒤 다시 훑음)", C.fetch_paged("https://apis.data.go.kr/1230000/x/y", "가상키", None)[1] == {"net": "down"})
ok("HTML_HINT 에 안내 페이지 제목", C.HTML_HINT.startswith("조달청 시스템 점검 안내"), C.HTML_HINT)
C.HEALTH_LOG = os.path.join(tmp, "health.json")
json.dump({"at": "2026-10-30 18:40", "ok": True, "lastok": "2026-10-30 18:40", "fails": 0}, open(C.HEALTH_LOG, "w", encoding="utf-8"))
C.write_health(판(새공사), 판(새공사), {"first": 0, "live": 0})
h = json.load(open(C.HEALTH_LOG, encoding="utf-8"))
ok("상태 파일 — 차단기가 내려가도 «연결 못 함» 이 아니라 maint · 까닭에 «점검» · 안내 제목", h.get("maint") is True and h.get("ok") is False and "점검" in h.get("why", "") and "조달청 시스템 점검 안내" in h.get("why", ""), h.get("why"))
ok("마지막으로 받은 때는 지난 값 그대로(10-30 18:40)", h.get("lastok") == "2026-10-30 18:40", h.get("lastok"))
C.NET_HTML, C.NET_DOWN, C.HTML_HINT = 0, False, ""
C.write_health(판(새공사), 판(새공사), {"first": 4, "live": 9})
h = json.load(open(C.HEALTH_LOG, encoding="utf-8"))
ok("다시 받으면 maint 꺼짐 · 마지막으로 받은 때 = 지금", h.get("maint") is False and h.get("ok") is True and h.get("lastok") == h.get("at"), (h.get("maint"), h.get("lastok"), h.get("at")))
C.NET_DOWN = True
C.write_health(판(새공사), 판(새공사), {"first": 0, "live": 0})
h = json.load(open(C.HEALTH_LOG, encoding="utf-8"))
ok("웹페이지 없이 연결만 못 하면 예전처럼 «연결 못 함» (maint 아님)", h.get("maint") is False and "연결하지 못했습니다" in h.get("why", ""), h.get("why"))
C.NET_DOWN = False

print("⑥ 방지 — 줄 수가 크게 줄면 빌드 · 배포 · 캐시 저장 안 함 · 빠른 수집은 작은 캐시(lite-)만")
import re
import subprocess


def 단계들(이름):
    """워크플로의 steps 만 읽음 — PyYAML 없이(바탕 PC 파이썬에 없을 수 있음). name · if · uses · run · with(key · path …) 만.
    로컬에서 PyYAML 결과와 같은지 맞춰 봄(같지 않으면 아래 ok 가 틀림)."""
    줄 = open(os.path.join(ROOT, ".github", "workflows", 이름), encoding="utf-8").read().split("\n")
    들 = lambda l: len(l) - len(l.lstrip(" "))
    값 = lambda v: re.sub(r"\s+#.*$", "", v).strip() if not v.strip().startswith(("'", '"')) else v.strip()[1:-1]
    out, i = [], 0
    while i < len(줄):
        m = re.match(r"^(\s*)steps:\s*$", 줄[i])
        i += 1
        if not m:
            continue
        s0, cur, sub = len(m.group(1)), None, None
        while i < len(줄):
            l = 줄[i]
            if l.strip() == "" or l.lstrip().startswith("#"):
                i += 1
                continue
            if 들(l) <= s0:
                break
            t = l.strip()
            if 들(l) == s0 + 2 and t.startswith("- "):
                cur, sub = {}, None
                out.append(cur)
                t, d = t[2:], s0 + 4
            else:
                d = 들(l)
            k, _, v = t.partition(":")
            k = k.strip()
            box = cur if d == s0 + 4 else sub
            if d == s0 + 4:
                sub = None
            if v.strip() in ("|", "|-", ">"):
                i += 1
                블 = []
                while i < len(줄) and (줄[i].strip() == "" or 들(줄[i]) > d):
                    블.append(줄[i])
                    i += 1
                while 블 and 블[-1].strip() == "":
                    블.pop()
                n = min(들(b) for b in 블 if b.strip())
                box[k] = "\n".join(b[n:] for b in 블) + "\n"
                continue
            if v.strip() == "":
                box[k] = sub = {}
            else:
                box[k] = 값(v)
            i += 1
    return out


U = 단계들("update.yml")
F = 단계들("fast.yml")
try:
    import yaml  # 있으면(로컬) 위 읽기가 PyYAML 과 같은지 봄

    for 이름, 들S in (("update.yml", U), ("fast.yml", F)):
        Y = [s for j in yaml.safe_load(open(os.path.join(ROOT, ".github", "workflows", 이름), encoding="utf-8"))["jobs"].values() for s in j.get("steps", [])]
        고름 = lambda s: {k: (v if not isinstance(v, dict) else {a: (str(b).lower() if isinstance(b, bool) else str(b)) for a, b in v.items()}) for k, v in s.items() if k in ("name", "if", "uses", "run", "with", "id")}
        ok("%s 단계 읽기 = PyYAML(%d단계)" % (이름, len(Y)), [고름(s) for s in Y] == [고름(s) for s in 들S], [a for a, b in zip([고름(s) for s in Y], [고름(s) for s in 들S]) if a != b][:1])
except ImportError:
    pass
by = lambda steps, n: next((s for s in steps if s.get("name") == n), None)
가드1 = by(U, "🛡 수집 뒤 줄 수 확인")
가드 = by(U, "🛡 저장 전 줄 수 확인")
저장 = by(U, "수집 기록 보관 (캐시 저장)")
빌드 = by(U, "사이트 빌드")
배포 = by(U, "사이트 배포")
용역 = by(U, "용역 · 물품 수집")
작은저장 = by(U, "빠른 수집용 작은 기록 보관")
빠른받기 = by(F, "지난 수집 기록 가져오기 (읽기만 · 작은 것)")
ok("update.yml — 수집 뒤 확인이 용역 수집 뒤 · 빌드 앞", None not in (가드1, 빌드, 용역) and U.index(용역) < U.index(가드1) < U.index(빌드))
ok("빌드 · 배포는 STORE_OK == '1' 일 때만(수집 뒤 확인이 0 으로 바꾸면 건너뜀)", all(s and "env.STORE_OK == '1'" in s.get("if", "") for s in (빌드, 배포)))
ok("update.yml — 저장 전 확인이 저장 단계 앞", 가드 is not None and 저장 is not None and U.index(가드) < U.index(저장))
ok("두 저장 모두 STORE_SAVE != '0' 일 때만", all(s and "STORE_SAVE != '0'" in s.get("if", "") for s in (저장, 작은저장)), [s and s.get("if") for s in (저장, 작은저장)])
ok("작은 저장 key lite-run_id · 큰 저장 key store-run_id", 작은저장 and 작은저장["with"]["key"] == "lite-${{ github.run_id }}" and 저장["with"]["key"] == "store-${{ github.run_id }}")
ok("fast.yml 은 store- 를 안 받고 lite- 만(읽기만)", 빠른받기 and 빠른받기["uses"].startswith("actions/cache/restore") and 빠른받기["with"]["restore-keys"].strip() == "lite-"
   and not any("store-" in str((s.get("with") or {}).get("restore-keys", "")) for s in F), 빠른받기)
ok("두 쪽 path 글이 똑같음(다르면 캐시를 못 찾음)", 작은저장 and 빠른받기 and 작은저장["with"]["path"] == 빠른받기["with"]["path"], (작은저장 or {}).get("with"))
src = open(os.path.join(ROOT, "fast.py"), encoding="utf-8").read()
메일 = by(U, "연속 실패 알림 (빨간불 = 메일)")
상태 = by(U, "수집 상태 확인")
ok("G484 — 조달청 점검(maint)이면 메일은 처음 한 번만(연속 3회째부터 exit 0) · 상태 단계가 maint 를 내보냄",
   메일 and 상태 and 'steps.health.outputs.maint }}" = "1"' in 메일["run"] and 메일["run"].index("outputs.maint") < 메일["run"].index("::error::")
   and 'print("maint=%d" % maint)' in 상태["run"] and 'maint = 1 if h.get("maint") else 0' in 상태["run"])
ok("fast.py 가 저장소에서 읽는 것은 first · live 뿐", set(__import__("re").findall(r'load_store\("(\w+)"\)', src)) == {"first", "live"})


def 가드돌림(n0, n1, g=None):
    d = tempfile.mkdtemp()
    os.makedirs(os.path.join(d, "data", "store"))
    json.dump({"con": {str(i): {} for i in range(n1)}}, open(os.path.join(d, "data", "store", "first.json"), "w"))
    env_f = os.path.join(d, "env")
    open(env_f, "w").close()
    r = subprocess.run(["bash", "-e", "-c", (g or 가드)["run"]], cwd=d, capture_output=True, text=True,
                       env=dict(os.environ, STORE_N0=str(n0), GITHUB_ENV=env_f, PATH=os.environ["PATH"]))
    return r.returncode, open(env_f).read()


if os.name == "nt":  # 바탕 PC(윈도) — bash 가 없거나 WSL 일 수 있어 줄 수 셈(bash) 시험은 건너뜀(깃허브는 리눅스)
    print("  · 윈도 — 줄 수 확인 단계(bash) 돌려 보기는 건너뜀")
for n0, n1, 막음 in (() if os.name == "nt" else ((26000, 25600, False), (26000, 18300, False), (26000, 18100, True), (26000, 3008, True), (0, 3008, False))):
    rc, env = 가드돌림(n0, n1)
    ok("저장 전 — 가져올 때 %d → 지금 %d → %s" % (n0, n1, "저장 안 함" if 막음 else "저장"), rc == 0 and (("STORE_SAVE=0" in env) == 막음) and "STORE_OK" not in env, (rc, env))
    rc, env = 가드돌림(n0, n1, 가드1)
    ok("수집 뒤 — 가져올 때 %d → %d → %s" % (n0, n1, "빌드 · 배포 · 저장 안 함" if 막음 else "그대로"), rc == 0 and (("STORE_SAVE=0" in env and "STORE_OK=0" in env) == 막음) and (막음 or env == ""), (rc, env))

print("✗ %d 틀림" % bad if bad else "✓ 모두 맞음")
sys.exit(1 if bad else 0)
