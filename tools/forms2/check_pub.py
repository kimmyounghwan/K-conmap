# -*- coding: utf-8 -*-
"""check_pub.py — «올라갈 파일 그 자체»(web/public/forms/…xlsx)를 두 계산기로 다시 검증합니다.
   run.py/verify2.py 는 /tmp 에 새로 구운 파일을 보므로, 게시 직전에는 이것으로 한 번 더 봅니다.
   python3 check_pub.py wonga …"""
import importlib, os, shutil, sys, tempfile
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
from fb import Book
from run import verify, _eq
from verify2 import solve
bad = 0
for slug in [a for a in sys.argv[1:] if not a.startswith("--")]:
    m = importlib.import_module("f_" + slug.replace("-", "_"))
    bk = Book(m.TITLE); m.draw(bk, False); m.draw(bk, True); bk.finish()
    pub = os.path.join(ROOT, "web", "public", "forms", "orig" if m.WHERE == "orig" else "", f"{m.SLUG}.xlsx")
    tmp = tempfile.mkdtemp()
    n1, b1, _ = verify(m, bk, pub, tmp)
    xl = solve(pub)
    ex = {lg: p for (st, lg), p in bk.pages.items() if st == "ex"}
    exp = m.expect({lg: p.inputs for lg, p in ex.items()}) if getattr(m, "MULTI", False) else {next(iter(ex)): m.expect(next(iter(ex.values())).inputs)}
    n2, b2 = 0, []
    import numpy as np
    for lg, kv in exp.items():
        if lg in getattr(m, "V2_SKIP", ()):
            continue
        p = ex[lg]
        for k, want in kv.items():
            got = xl.get((p.name.upper(), p.k[k]))
            if isinstance(got, np.ndarray): got = got.ravel()[0]
            if hasattr(got, "item"): got = got.item()
            if _eq(got, want) or (want == "" and got in (None, "")): n2 += 1
            else: b2.append(f"{k}: {got!r} ≠ {want!r}")
    shutil.rmtree(tmp)
    mark = "✅" if not (b1 or b2) else "❌"
    print(f"{mark} {m.SLUG:<20} 올라갈 파일 — LibreOffice {n1}칸 · formulas {n2}칸 맞음 · 틀림 {len(b1) + len(b2)}")
    for x in (b1 + b2)[:10]: print("    ✗", x)
    bad += len(b1) + len(b2)
sys.exit(1 if bad else 0)
