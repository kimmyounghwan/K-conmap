# -*- coding: utf-8 -*-
"""
장면시험.py — 갈래가 많은 서식(기한 · 단계 · 판정)을 «여러 장면» 으로 셈해 봅니다 (G672 · 2026-11-13 연차 관리대장에서 만듦)

  python3 tools/forms2/장면시험.py <슬러그> [장면이름 …] [--site]

  장면 파일: tools/forms2/장면_<슬러그(- → _)>.py 의 SCENES = {이름: {바꿀 것}}
    · "EX": {...}        → 생성기 모듈의 EX(작성 예시 값)를 처음 값에서 이것만 바꿈
    · 그 밖의 이름(EX_USE …) → 생성기 모듈의 그 이름을 이 값으로(None 도 그대로 넣음 — 빼면 처음 값)
  ① 장면마다 작성 예시를 바꿔 굽고 LibreOffice 다시 셈 = 파이썬 expect() (run.py 의 build · verify 그대로)
  ② --site: 장면마다 «예시» 한 벌을 만들어 사이트 셈(web/src/lib/엑셀셈.js) = LibreOffice 도 대조(격자셈시험.mjs)
     → /tmp/g10/g361/장면_<슬러그>/want.json
  작성 예시 하나 · 흔든 값 두 벌(격자검증.py)로는 안 지나가는 갈래(1년 미만 · 윤년 · 말일 · 4명 이하 · 기한 지남 …)를 지나가게 하려고 만듦.
  클라우드 전용(LibreOffice 필요) — PC 올리기 꾸러미 시험에는 넣지 않음.
"""
import copy
import importlib
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
os.chdir(HERE)
import run  # noqa: E402
import registry  # noqa: E402


def main():
    args = sys.argv[1:]
    site = "--site" in args
    args = [a for a in args if not a.startswith("--")]
    slug, want = args[0], args[1:]
    m = registry.get(slug)
    sc = importlib.import_module("장면_" + slug.replace("-", "_"))
    keys = sorted({k for s in sc.SCENES.values() for k in s if k != "EX"})
    base = {"EX": copy.deepcopy(m.EX), **{k: copy.deepcopy(getattr(m, k)) for k in keys}}
    names = want or list(sc.SCENES)

    def put(s):
        m.EX.clear()
        m.EX.update(copy.deepcopy(base["EX"]))
        m.EX.update(s.get("EX", {}))
        for k in keys:
            setattr(m, k, copy.deepcopy(s[k]) if k in s else base[k])

    out = f"/tmp/g10/f2/장면_{slug}"
    bad_all = 0
    for name in names:
        put(sc.SCENES[name])
        mm, bk, path = run.build(slug, out)
        n_ok, bad, _ = run.verify(mm, bk, path, out)
        line = sc.show(m.expect({lg: p.inputs for (st, lg), p in bk.pages.items() if st == "ex"})) if hasattr(sc, "show") else ""
        print(f"{'✅' if not bad else '❌'} {name:<16} {n_ok}칸 · 틀림 {len(bad)} {line}")
        for b in bad[:12]:
            print("    ✗", b)
        bad_all += len(bad)
    if site:
        import 격자검증 as V
        gout = f"/tmp/g10/g361/장면_{slug}"
        shutil.rmtree(gout, ignore_errors=True)
        files, plans, doc0 = [], [], None
        for name in names:
            put(sc.SCENES[name])
            doc, plan = V.make_files(slug, os.path.join(gout, "_s", name))
            st = next(s for s in plan["sets"] if s["tag"] == "예시")
            dst = os.path.join(gout, "in", f"{slug}__{name}.xlsx")
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy(st["file"], dst)
            files.append(dst)
            plans.append((name, st["inputs"], dst))
            doc0 = doc
        os.makedirs(os.path.join(gout, "g"), exist_ok=True)
        shutil.copy(os.path.join(gout, "_s", names[0], "g", f"{slug}.json"), os.path.join(gout, "g", f"{slug}.json"))
        rd = V.lo_recalc(files, gout)
        import json
        res = [{"slug": slug, "tag": n, "inputs": i, "want": V.read_want(doc0, os.path.join(rd, os.path.basename(f)))} for n, i, f in plans]
        json.dump(res, open(os.path.join(gout, "want.json"), "w", encoding="utf-8"), ensure_ascii=False, default=str)
        r = subprocess.run(["node", "tools/격자셈시험.mjs", gout, slug], cwd=ROOT, capture_output=True, text=True)
        print(r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr[-500:])
        bad_all += r.returncode
    put({})
    sys.exit(1 if bad_all else 0)


if __name__ == "__main__":
    main()
