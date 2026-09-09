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
            have.update(re.findall(r"[A-Za-z_$][\w$]*", m.group(1)))
        for m in re.finditer(r"(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)", s):
            have.add(m.group(1))
        for m in re.finditer(r"\{\s*([A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)*)\s*\}\s*=", s):
            for nm in m.group(1).split(","):
                have.add(nm.strip())
        body = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
        body = re.sub(r"//[^\n]*", "", body)
        for nm, srcs in exports.items():
            if nm in have or p in srcs:
                continue
            if re.search(r"(?<![\w$.'\"])" + re.escape(nm) + r"\s*[(<]", body):
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
    return 0


if __name__ == "__main__":
    sys.exit(main())
