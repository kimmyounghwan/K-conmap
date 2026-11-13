# -*- coding: utf-8 -*-
"""쓰는데 import 안 한 이름을 잡습니다. (2026-09-09)

왜 만들었나 — 소장님: 「자가분석에서 업체이름 클릭하면 아무것도 안나와.
  잘됐는데 갑자기 왜 이러지?」
  원인: web/src/pages/CorpPage.jsx 가 `wasBaked` 를 쓰는데 **import 문이 없었습니다.**
        AgencyPage·NoticePage 에는 있었고 여기만 빠졌습니다.
        → 브라우저에서 ReferenceError, /corp/… 가 통째로 «흰 화면».
  ⚠️ 무서운 점: **빌드는 통과합니다.** Vite·esbuild 는 «전역에 있을지도 모르는 이름» 을
     오류로 보지 않습니다. 화면을 열어봐야만 드러납니다.
     그리고 묶음(chunk) 이 갈리는 방식이 바뀌면 «어제는 되던 것» 이 갑자기 깨집니다.

이 검사는 «파일이 내보내는 이름» 목록을 만들고, 그 이름을 «호출하는데(`이름(` 또는 `<이름`)
import 도 정의도 안 한» 파일을 찾습니다.
"""
import os, re, sys

# 🩹 2026-10-10 G228 — «가진 이름» 은 한글 이름도(전엔 첫 글자를 영문만 봐서 import { 도면준비 } · const 층차례 를 못 셈 →
#   lib/BIM모델.js 가 «import 안 하고 쓴다» 는 틀린 경보 2건으로 올리기가 멈출 뻔함). 내보내는 이름 목록은 그대로.
ID = r"(?:[^\W\d]|\$)[\w$]*"
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web", "src")


def scan(src=SRC):
    exports = {}
    files = []
    for root, _, fs in os.walk(src):
        if "node_modules" in root:
            continue
        for f in fs:
            if f.endswith((".js", ".jsx")):
                files.append(os.path.join(root, f))

    for p in files:
        s = open(p, encoding="utf-8").read()
        for m in re.finditer(r"export\s+(?:const|function|class|let)\s+([A-Za-z_$][\w$]*)", s):
            exports.setdefault(m.group(1), set()).add(p)
        for m in re.finditer(r"export\s*\{([^}]*)\}", s):
            for nm in m.group(1).split(","):
                nm = nm.strip().split(" as ")[-1].strip()
                if nm:
                    exports.setdefault(nm, set()).add(p)

    bad = []
    for p in files:
        s = open(p, encoding="utf-8").read()
        have = set()
        for m in re.finditer(r"import\s+([^;]+?)\s+from", s, re.S):
            have.update(re.findall(ID, m.group(1)))
        for m in re.finditer(r"(?:const|let|var|function|class)\s+(" + ID + ")", s):
            have.add(m.group(1))
        for m in re.finditer(r"\{\s*(" + ID + r"(?:\s*,\s*" + ID + r")*)\s*\}\s*=", s):
            for nm in m.group(1).split(","):
                have.add(nm.strip())
        # ⚠️ 2026-09-17 — «반 안에 든 이름(메서드)» 도 «이 파일이 가진 것» 으로 셉니다.
        #   왜: lib/susik.js 의  num(a, what) {   ← 반(class) 안의 메서드 선언
        #       lib/xlsx2line.js 의  build() {    ← 같은 것
        #   이 두 줄을 «호출» 로 보고, 마침 lib/fmt.js 가 num 을, lib/qto.js 가 build 를
        #   내보내고 있어서 «import 안 하고 쓴다» 고 잡았습니다. 둘 다 틀린 경보입니다.
        #   (실제 호출은 언제나 this.num(...) · styler.build(...) 이라 앞의 «.» 로 이미 걸러집니다)
        #   이것 때문에 배포가 통째로 멈췄습니다 — 진짜 잘못 하나를 놓치는 것보다
        #   틀린 경보로 매번 멈추는 쪽이 더 위험합니다(경보를 안 믿게 됩니다).
        for m in re.finditer(
                r"(?m)^\s*(?:static\s+|async\s+|get\s+|set\s+|\*\s*)*"
                r"(" + ID + r")\s*\([^)\n]*\)\s*\{", s):
            have.add(m.group(1))
        body = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
        body = re.sub(r"//[^\n]*", "", body)
        for nm, srcs in exports.items():
            if nm in have or p in srcs:
                continue
            # ⚠️ 2026-11-13 G666 — 따옴표(' ")와 같이 «`» 바로 뒤도 호출이 아님: `calc(50% - …)` 같은 CSS 글을 lib/susik.js 의 calc 호출로 잡았음(틀린 경보 · 8절 22)
            if re.search(r"(?<![\w$.'\"`])" + re.escape(nm) + r"\s*[(<]", body):
                bad.append((os.path.relpath(p, src), nm, os.path.relpath(sorted(srcs)[0], src)))
    return exports, bad


def main():
    exports, bad = scan()
    print(f"import 검사 — 내보내는 이름 {len(exports)}개")
    if bad:
        print(f"⛔ 쓰는데 import 안 한 것 {len(bad)}건")
        for p, nm, src in bad:
            print(f"   {p:<34} {nm:<16} ← {src}")
        return 1
    print("✅ 빠진 import 없음")
    m = _mjs_paths()
    w = _workflows()             # 마지막 줄 = 워크플로 검사 결과 (✅ … 켜짐 / ⛔ …)
    return w or m


def _mjs_paths():
    """🪟 2026-11-03 G518 — tools 의 .mjs 가 import 에 «맨 경로»(path.join · path.resolve)를 넣으면
    리눅스(클라우드 · 리허설)에서는 되는데 소장님 PC(Windows)에서는 ERR_UNSUPPORTED_ESM_URL_SCHEME 로 넘어집니다
    (G518 첫 올리기가 PC 시험에서 멈춤 — 안전장치로 안 올라감). CLAUDE.md §6 «내 환경에서 됐다는 확인이 아니다» 와 같은 일.
    → import(pathToFileURL(path.join(…)).href) 또는 상대 import('../web/…'). 리허설은 이것을 Windows 흉내(맨 경로 import 막음)로도 돌립니다.
    ⚠️ 깃허브 Actions 안에서는 경고만(사이트 갱신을 세우지 않음) · 검사기가 넘어져도 건너뜀."""
    try:
        d = os.path.dirname(os.path.abspath(__file__))
        bad = []
        for f in sorted(os.listdir(d)):
            if not f.endswith(".mjs"):
                continue
            속 = False   # /* … */ 안(설명 글)은 건너뜀
            for i, line in enumerate(open(os.path.join(d, f), encoding="utf-8").read().splitlines(), 1):
                s = line.strip()
                if 속:
                    if "*/" in s:
                        속 = False
                    continue
                if s.startswith("/*") and "*/" not in s:
                    속 = True
                    continue
                if s.startswith("//") or s.startswith("*") or s.startswith("/*"):
                    continue
                if re.search(r"\bimport\(\s*path\.(join|resolve)\(", line):
                    bad.append((f, i))
                # 🪟 G543(11-05) URL.pathname 을 파일 경로로 쓰면 윈도우에서 «/C:/…» → «C:\\C:\\…» (G543 PC 시험에서 멈춤 · tools/checkmath.mjs 에 같은 사고) → fileURLToPath
                if re.search(r"import\.meta\.url\)\.pathname", line):
                    bad.append((f, i))
        if bad:
            print(f"⛔ tools 의 .mjs 가 import 에 맨 경로를 쓰거나 URL.pathname 을 파일 경로로 씀 {len(bad)}곳 — PC(Windows)에서 넘어짐 · pathToFileURL(…).href / fileURLToPath(…) 로")
            for f, i in bad[:20]:
                print(f"   tools/{f}:{i}")
            if os.environ.get("GITHUB_ACTIONS") == "true":
                print("⚠️ (Actions 안이라 경고만 합니다 — 바로 고치십시오)")
                return 0
            return 1
        print("✅ tools .mjs import — 맨 경로 없음(PC Windows 에서도 열림)")
        return 0
    except Exception as e:
        print(f"⚠️ .mjs import 경로 검사를 못 돌렸습니다({type(e).__name__}: {e}) — 건너뜀")
        return 0


def _workflows():
    """🛡 워크플로 모의 검사(tools/checkwf.py) — 2026-09-30 빠른 수집 멈춤 사고 뒤 붙였습니다.
    올리기 bat · 클라우드 모의(dryrun)가 이 파일을 push 전에 부르므로, 여기 붙이면 모든 올리기가 이 검사를 거칩니다.
    ⚠️ 깃허브 Actions 안(update.yml)에서는 경고만 — 이미 올라간 뒤라 사이트 갱신까지 세우면 더 나쁩니다."""
    try:
        import checkwf
        r = checkwf.main()
    except Exception as e:                          # 검사기 자체가 넘어지면 그 사실을 적고 멈춥니다
        print(f"⛔ 워크플로 모의 검사를 못 돌렸습니다 ({type(e).__name__}: {e})")
        r = 1
    if r and os.environ.get("GITHUB_ACTIONS") == "true":
        print("⚠️ (Actions 안이라 경고만 합니다 — 바로 고치십시오)")
        return 0
    return r


if __name__ == "__main__":
    sys.exit(main())
