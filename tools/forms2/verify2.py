# -*- coding: utf-8 -*-
"""
verify2.py — 두 번째 검증: LibreOffice 가 아닌 «다른 계산기»(formulas — 파이썬으로 엑셀 수식을 푸는 라이브러리)로
             작성 예시의 수식을 다시 풀어 expect() 값과 대조합니다.
             LibreOffice 와 formulas 가 둘 다 파이썬 계산과 맞으면, 수식이 한 프로그램의 버릇에 기대고 있지 않다는 뜻입니다.
  python3 verify2.py wonga chakgong …   (run.py 로 먼저 구운 뒤)
"""
import importlib
import os
import sys
import warnings

warnings.filterwarnings("ignore")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from fb import Book  # noqa: E402
from run import _eq  # noqa: E402

import formulas  # noqa: E402


def solve(path):
    """formulas 로 파일 전체를 계산 → {('시트','A1'): 값}"""
    import io
    import contextlib
    with contextlib.redirect_stderr(io.StringIO()):
        m = formulas.ExcelModel().loads(path).finish()
        sol = m.calculate()
    out = {}
    for k, v in sol.items():
        if "!" not in k or ":" in k.split("!")[1]:
            continue
        sh, a = k.rsplit("!", 1)
        sh = sh.strip("'")
        sh = sh.split("]", 1)[1] if "]" in sh else sh
        try:
            val = v.value[0][0]
        except Exception:
            continue
        out[(sh.upper(), a.upper())] = val
    return out


def main():
    out = "/tmp/g10/f2/out"
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    total_bad = 0
    for slug in args:
        m = importlib.import_module("f_" + slug.replace("-", "_"))
        bk = Book(m.TITLE)
        m.draw(bk, False)
        m.draw(bk, True)
        bk.finish()
        path = os.path.join(out, f"{m.SLUG}.xlsx")
        xl = solve(path)
        ex_pages = {lg: p for (st, lg), p in bk.pages.items() if st == "ex"}
        if getattr(m, "MULTI", False):
            exp = m.expect({lg: p.inputs for lg, p in ex_pages.items()})
        else:
            (lg, p), = ex_pages.items()
            exp = {lg: m.expect(p.inputs)}
        ok, bad, skip = 0, [], []
        for lg, kv in exp.items():
            p = ex_pages[lg]
            for k, want in kv.items():
                if lg in getattr(m, "V2_SKIP", ()):      # INDIRECT 로 이어지는 시트 — formulas 가 INDIRECT 를 못 풂
                    skip.append(f"{lg}")
                    break
                got = xl.get((p.name.upper(), p.k[k]))
                import numpy as np
                if isinstance(got, np.ndarray):                  # numpy 배열 → 값 하나
                    got = got.ravel()[0]
                if hasattr(got, "item"):
                    got = got.item()
                if type(got).__name__ in ("XlError", "Error"):
                    got = str(got)
                if isinstance(got, str) and got.startswith("#"):
                    skip.append(f"{k}: formulas {got}")
                    continue
                if hasattr(got, "item"):
                    got = got.item()
                if _eq(got, want) or (want == "" and got in (None, "")):
                    ok += 1
                else:
                    bad.append(f"[{p.name}] {k}({p.k[k]}): formulas {got!r} ≠ 파이썬 {want!r}")
        mark = "✅" if not bad else "❌"
        print(f"{mark} {m.SLUG:<22} formulas 대조 {ok}칸 맞음 · 틀림 {len(bad)} · 못 푼 칸 {len(skip)}")
        for b in bad[:20]:
            print("    ✗", b)
        if skip:
            print("    · 못 푼 칸(LibreOffice 대조로만 확인):", ", ".join(skip[:10]))
        total_bad += len(bad)
    sys.exit(1 if total_bad else 0)


if __name__ == "__main__":
    main()
