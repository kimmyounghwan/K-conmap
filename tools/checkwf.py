# -*- coding: utf-8 -*-
"""🛡 워크플로 모의 검사 — 깃허브 Actions 가 «받는 파일 · 까는 패키지» 그대로 파이썬을 켜 봅니다 (2026-09-30)

■ 왜 만들었나 — 2026-09-30 사고
    G78 에서 collect.py 가 켜질 때(import) web/src/data/공고유형.json 을 읽게 했습니다.
    그런데 공고 · 1순위 빠른 수집(fast.yml)은 빨리 돌려고 파일 몇 개만 받습니다(sparse-checkout).
    그 JSON 이 없어 fast.py 가 켜지자마자 죽었고, 화면의 «방금» 이 14:55 에서 70분 넘게 멈췄습니다.
    소장님: 「원인이 뭐지? 고쳤고, 이제 이런일 안 생기게 해줘」
    ⚠️ 제 작업 폴더에는 파일이 다 있어서 시험이 전부 통과했습니다. «워크플로가 보는 세상» 에서 돌려 봐야 잡힙니다.

■ 무엇을 보나 — .github/workflows/*.yml 하나하나에 대해
    ① 받는 파일   actions/checkout 의 sparse-checkout 목록 (없으면 저장소 전체)
    ② 까는 패키지  pip install 줄 (-r requirements.txt 면 그 파일)
    ③ 돌리는 파이썬 run 에 적힌 `python 무엇.py`
    → 임시 폴더에 ① 만 복사하고, 우리 코드가 ② 에 없는 바깥 패키지를 import 하면 막고,
      ③ 을 «켜기만» 합니다(맨 위 코드까지 · main 은 안 돌림). 파일 없음 · 패키지 없음이 여기서 드러납니다.
    fast.py 는 한 걸음 더 — 공고 · 1순위 한 줄씩 «데이터베이스에 싣는 모양»(finish · body_for)까지 만들어 봅니다(네트워크 없이).

■ 이 컴퓨터에 ② 의 패키지가 안 깔려 있으면 가짜로 채웁니다 — «워크플로엔 깔리는데 여기엔 없는» 것 때문에
    멈추지 않게. 이 검사는 «워크플로가 못 찾을 것을 찾는가» 만 봅니다.

■ 어디서 도나
    · tools/checkimports.py 가 끝에 이것을 부릅니다 → 올리기 bat · 클라우드 모의(dryrun)가 push 전에 멈춥니다.
    · 깃허브 Actions 안(update.yml 화면 검사)에서는 경고만 합니다 — 이미 올라간 뒤라 사이트 갱신까지 세우면 더 나쁩니다.

    python tools/checkwf.py            (0 = 통과 · 1 = 걸림)
"""
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WF = os.path.join(ROOT, ".github", "workflows")

# 패키지 이름 → import 이름 (다르게 부르는 것만)
IMPORT_NAME = {"pillow": "PIL", "pdfminer.six": "pdfminer", "google-auth": "google",
               "beautifulsoup4": "bs4", "pyyaml": "yaml", "python-dateutil": "dateutil",
               "opencv-python": "cv2", "scikit-learn": "sklearn"}


# ── 워크플로 읽기 (yaml 모듈 없이 — 올리기 PC 에 없을 수 있어서) ────────────
def _sparse(text):
    lines = text.splitlines()
    for i, ln in enumerate(lines):
        if re.match(r"\s*sparse-checkout:\s*\|\s*$", ln):
            ind = len(ln) - len(ln.lstrip())
            out = []
            for x in lines[i + 1:]:
                if not x.strip():
                    continue
                if len(x) - len(x.lstrip()) <= ind:
                    break
                out.append(x.strip())
            return out
    return None                                        # 저장소 전체


def _pkgs(text):
    out = set()
    for m in re.finditer(r"pip install ([^\n]+)", text):
        toks = m.group(1).split()
        i = 0
        while i < len(toks):
            t = toks[i]
            if t == "-r" and i + 1 < len(toks):
                p = os.path.join(ROOT, toks[i + 1])
                if os.path.exists(p):
                    for ln in open(p, encoding="utf-8"):
                        ln = ln.split("#")[0].strip()
                        if ln:
                            out.add(re.split(r"[<>=!~\[; ]", ln)[0].strip())
                i += 2
                continue
            if not t.startswith("-") and not t.startswith("$"):
                out.add(re.split(r"[<>=!~\[]", t)[0])
            i += 1
    return {IMPORT_NAME.get(p.lower(), p.lower().replace("-", "_")) for p in out if p}


def _scripts(text):
    out = []
    text = "\n".join(ln for ln in text.splitlines() if not ln.lstrip().startswith("#"))   # 주석 속 «python …» 은 빼고
    for m in re.finditer(r"(?<![\w.-])python3?\s+(?!-m\b)([^\s\"']+\.py)\b", text):
        s = m.group(1)
        if s not in out:
            out.append(s)
    return out


def workflows():
    for fn in sorted(os.listdir(WF)):
        if fn.endswith((".yml", ".yaml")):
            t = open(os.path.join(WF, fn), encoding="utf-8").read()
            yield fn, _sparse(t), _pkgs(t), _scripts(t)


# ── 임시 폴더에서 켜 보는 쪽 (따로 뜬 파이썬 안에서 돕니다) ─────────────
HARNESS = r'''
import importlib.abc, importlib.machinery, importlib.util, json, os, sys, types
ROOT = os.getcwd()
ALLOW = set(json.loads(sys.argv[1]))
SCRIPT = sys.argv[2]
EXTRA = sys.argv[3]
STD = set(getattr(sys, "stdlib_module_names", ())) | set(sys.builtin_module_names)
FIRST = {os.path.splitext(n)[0] for n in os.listdir(ROOT)}
for d in ("tools",):
    if os.path.isdir(os.path.join(ROOT, d)):
        FIRST |= {os.path.splitext(n)[0] for n in os.listdir(os.path.join(ROOT, d))}

def _ours():
    f = sys._getframe(2)
    while f:
        fn = f.f_code.co_filename
        if not fn.startswith("<"):
            return os.path.abspath(fn).startswith(ROOT)
        f = f.f_back
    return False

class Gate(importlib.abc.MetaPathFinder):
    def find_spec(self, name, path, target=None):
        top = name.split(".")[0]
        if top in STD or top in FIRST or top in ALLOW:
            return None
        if _ours():
            raise ModuleNotFoundError("«%s» — 이 워크플로가 받지 않는 파일이거나 깔지 않는 패키지입니다" % top, name=name)
        return None

class _M(type):
    def __getattr__(cls, k):
        return _mk(k)
def _mk(n):
    return _M(str(n), (object,), {"__init__": lambda s, *a, **k: None, "__getattr__": lambda s, k: _mk(k),
                                   "__call__": lambda s, *a, **k: _mk("r")(), "__iter__": lambda s: iter(()),
                                   "__bool__": lambda s: False, "__enter__": lambda s: s, "__exit__": lambda s, *a: False})
class StubMod(types.ModuleType):
    def __getattr__(self, k):
        if k.startswith("__"):
            raise AttributeError(k)
        return _mk(k)
class StubLoader(importlib.abc.Loader):
    def create_module(self, spec):
        m = StubMod(spec.name); m.__path__ = []; return m
    def exec_module(self, m):
        pass
class Stub(importlib.abc.MetaPathFinder):
    """워크플로엔 깔리는데 이 컴퓨터엔 없는 패키지 — 가짜로 채웁니다"""
    def find_spec(self, name, path, target=None):
        if name.split(".")[0] in ALLOW:
            return importlib.machinery.ModuleSpec(name, StubLoader(), is_package=True)
        return None

sys.meta_path.insert(0, Gate())
sys.meta_path.append(Stub())
os.environ.setdefault("G2B_API_KEY", "wfcheck")
path = os.path.join(ROOT, SCRIPT)
if not os.path.exists(path):
    print("NOFILE"); sys.exit(3)
sys.path.insert(0, os.path.dirname(path))              # `python 무엇.py` 는 그 파일 폴더가 맨 앞
spec = importlib.util.spec_from_file_location("__wfcheck__", path)
mod = importlib.util.module_from_spec(spec)
sys.modules["__wfcheck__"] = mod
spec.loader.exec_module(mod)
if EXTRA == "fast":
    import collect as C
    live = {"no": "R00CHECK0001", "ord": "000", "name": "모의 공사 긴급", "inst": "○○시", "dt": "2026-09-30 10:00:00",
            "close": "2099-10-07 10:00:00", "base": 100000000, "est": 90909091, "lo": -3, "hi": 3,
            "kind": "재공고", "mthd": "제한경쟁", "swin": "적격심사제-모의", "joint": "(없음)공동수급불허",
            "rgn": "", "rgnb": "", "ayn": "Y", "aval": 1000000, "pmth": "복수예가", "lic": ["토목공사업/0001"],
            "docs": [["공고문.hwpx", "https://example.invalid/x"]]}
    first = {"no": "R00CHECK0002", "ord": "000", "name": "모의 개찰", "inst": "○○군", "dt": "2026-09-30 11:00:00",
             "win": "○○건설", "amt": 90000000, "rate": 90.1, "np": 12, "base": 100000000, "lic": ["토목공사업/0001"]}
    bk = C.region_book([live, first])
    a = mod.finish("live", [dict(live)], bk, None)
    b = mod.finish("first", [dict(first)], bk, None)
    mod.body_for("live", a, "")
    mod.body_for("first", b, "")
    assert a and a[0].get("_ix") and a[0]["_ix"][-1] == C.tag_of(live), "공고 색인 한 줄 모양"
print("OK")
'''


def _copy(files, dst):
    for f in files:
        f = f.strip().strip("/")
        src = os.path.join(ROOT, f)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(dst, f), dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns("__pycache__", "node_modules"))
        elif os.path.exists(src):
            os.makedirs(os.path.dirname(os.path.join(dst, f)) or dst, exist_ok=True)
            shutil.copy2(src, os.path.join(dst, f))


def run_one(sparse, allow, script, extra=""):
    # 저장소 전체를 받는 워크플로는 이 저장소에서 그대로 켭니다(받는 파일이 같습니다). 일부만 받으면 임시 폴더에 그것만.
    tmp = tempfile.mkdtemp(prefix="wfcheck-") if sparse is not None else None
    try:
        if sparse is not None:
            _copy(sparse, tmp)
        env = dict(os.environ, PYTHONUTF8="1", PYTHONIOENCODING="utf-8", PYTHONDONTWRITEBYTECODE="1")
        r = subprocess.run([sys.executable, "-c", HARNESS, json.dumps(sorted(allow)), script, extra],
                           cwd=tmp or ROOT, env=env, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=180)
        out = (r.stdout or "") + (r.stderr or "")
        if r.returncode == 0 and "OK" in r.stdout:
            return True, ""
        if "NOFILE" in r.stdout:
            return False, "돌리라는 파일이 받는 목록에 없습니다"
        tail = [x for x in out.strip().splitlines() if x.strip()][-2:]
        return False, " / ".join(tail)[:300]
    except subprocess.TimeoutExpired:
        return False, "180초 안에 켜지지 않음"
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)


def main():
    bad = 0
    n = 0
    print("=" * 64)
    print("  워크플로 모의 검사 — Actions 가 받는 파일 · 까는 패키지로 켜 보기")
    print("=" * 64)
    for fn, sparse, allow, scripts in workflows():
        for s in scripts:
            n += 1
            ok, why = run_one(sparse, allow, s, "fast" if os.path.basename(s) == "fast.py" else "")
            what = "파일 %d개만" % len(sparse) if sparse is not None else "저장소 전체"
            if ok:
                print(f"✅ {fn:<14} {s:<28} ({what})")
            else:
                bad += 1
                print(f"⛔ {fn:<14} {s:<28} ({what}) — {why}")
    if bad:
        print(f"\n⛔ 워크플로에서 켜지지 않는 파이썬 {bad}개 — 올리지 마십시오 (tools/checkwf.py 머리말)")
        return 1
    print(f"✅ 워크플로 파이썬 {n}개 모두 Actions 와 같은 조건에서 켜짐")
    return 0


if __name__ == "__main__":
    sys.exit(main())
