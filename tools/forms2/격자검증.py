# -*- coding: utf-8 -*-
"""
격자검증.py — 사이트 자동 계산(web/src/lib/엑셀셈.js) = LibreOffice 다시 계산 — 서식마다 «세 벌» (G361 · 2026-10-21)

소장님: 「검증 세번씩 해…다른 예시로.. 알겠지??」
  벌 1  작성 예시 값(서식 엑셀의 «작성 예시» 시트와 같은 값)
  벌 2  작성 예시를 흔든 값(금액 × 0.55~1.6 · 날짜 −20~+45일 · 고르는 칸은 다른 말)
  벌 3  또 다르게 흔들고 + 15 % 는 비우고 + 비어 있던 칸 30 % 를 채움(빈 칸 · 0 · 글 처리까지)
  ① 벌마다 빈 서식 시트에 값을 넣은 엑셀을 만들어 LibreOffice 로 다시 계산 → 수식 칸 값
  ② node tools/격자셈시험.mjs 가 같은 값을 사이트 셈에 넣어 대조(원 단위 · 글자 · 오류까지)
  python3 격자검증.py [슬러그 …|--all] [--out /tmp/g10/g361/v] [--skip-lo]
"""
import datetime
import json
import os
import random
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)
import 격자  # noqa: E402

EPOCH = datetime.datetime(1899, 12, 30)


def 자리글(v, nf):
    if not isinstance(v, str):
        return v is None
    if re.fullmatch(r"[\s년월일시분초()~.:\-/]*", v):
        return True
    if nf:
        bare = re.sub(r'"[^"]*"', "", nf)
        if re.search(r'(^|[^"\\])[yd]|yyyy|(^|[^"])m+[^"]*d', bare, re.I):
            return True
    return False


def 꼴종류(nf, dv):
    if dv:
        return "dv"
    if not nf:
        return "text"
    bare = re.sub(r'"[^"]*"', "", nf)
    bare = re.sub(r"\[[^\]]*\]", "", bare)
    if re.search(r"[yd]", bare, re.I) or re.search(r"m.*d|d.*m", bare):
        return "date"
    if re.search(r"[0#]", bare):
        return "pct" if "%" in bare else "num"
    if "@" in bare:
        return "text"
    return "text"


def sets_for(doc, seed):
    ins = []
    for si, s in enumerate(doc["sheets"]):
        for c in s["cells"]:
            r, col, rs, cs, st, k = c[:6]
            if k not in (1, 3):
                continue
            v = c[6] if len(c) > 6 else None
            nf = c[8] if len(c) > 8 else None
            dv = c[9] if len(c) > 9 else None
            if col > s["pc"]:
                continue          # 인쇄 밖 도움 칸(작업일보 «전일 시트 이름» 등)은 사이트에서 안 씀
            ins.append((f"{si}!{격자._col(col)}{r}", v, nf, dv, k))
    ex = doc["ex"]
    A = {a: ex[a] for a, *_ in ins if a in ex}
    kinds = {a: k for a, v, nf, dv, k in ins}
    ins = [(a, v, nf, dv) for a, v, nf, dv, k in ins]

    def shake(rng, a, v, nf, dv):
        if isinstance(v, dict):
            return v
        kind = 꼴종류(nf, dv)
        if dv and isinstance(v, str) and len(dv) > 1:
            return rng.choice([x for x in dv if x != v] or dv)
        if isinstance(v, bool):
            return v
        if isinstance(v, (int, float)):
            if kind == "date" or (nf and re.search(r"[yd]", re.sub(r'"[^"]*"', "", nf))):
                return v + rng.randint(-20, 45) if v > 1000 else v
            if v == 0:
                return 0
            if float(v).is_integer() and 1900 <= v <= 2100:
                return int(v) + rng.randint(-1, 1)          # 연도 칸(년 · 월 · 일 따로 쓰는 장부) — 1900 앞은 엑셀 · LibreOffice 셈이 갈림
            f = rng.uniform(0.55, 1.6)
            if float(v).is_integer():
                return int(round(v * f))
            return round(v * f, 4)
        return v

    rng = random.Random(seed)
    B = {a: shake(rng, a, ex[a], nf, dv) for a, v, nf, dv in ins if a in ex}
    rng = random.Random(seed * 7 + 3)
    C = {}
    for a, v, nf, dv in ins:
        if a in ex:
            if rng.random() < 0.15:
                C[a] = None
            else:
                C[a] = shake(rng, a, ex[a], nf, dv)
        elif rng.random() < 0.3:
            kind = 꼴종류(nf, dv)
            if kind == "dv":
                C[a] = rng.choice(dv)
            elif kind == "date":
                C[a] = (datetime.datetime(2026, 1, 1) - EPOCH).days + rng.randint(0, 360)
            elif kind == "pct":
                C[a] = round(rng.uniform(0.001, 0.2), 4)
            elif kind == "num":
                돈 = bool(nf) and ("원" in nf or re.fullmatch(r'#,##0(;\[Red\]-#,##0)?(;"")?', nf or "") is not None)
                C[a] = rng.randint(1000, 50_000_000) // 1000 * 1000 if 돈 else rng.choice([rng.randint(1, 300), round(rng.uniform(0.5, 99.9), 2)])
            elif isinstance(v, str) and v and not 자리글(v, nf):
                pass
            else:
                C[a] = f"가상{rng.randint(1, 99)}"
    for a, v in ex.items():          # 작성 예시만의 수식(수식 칸) — 세 벌 모두 그대로
        if isinstance(v, dict) and a not in A:
            A[a] = B[a] = C[a] = v
    return ins, kinds, [("예시", A), ("흔듦1", B), ("흔듦2", C)]


def make_files(slug, out, seed=11):
    import registry
    from fb import Book
    gdir = os.path.join(out, "g")
    _, doc = 격자.export(slug, gdir)
    m = registry.get(slug)
    bk = Book(m.TITLE)
    m.draw(bk, False)
    m.draw(bk, True)
    base = os.path.join(out, "base", f"{slug}.xlsx")
    os.makedirs(os.path.dirname(base), exist_ok=True)
    bk.save(base)
    import openpyxl
    ins, kinds, sets = sets_for(doc, seed + sum(map(ord, slug)))
    names = [s["name"] for s in doc["sheets"]]
    plan = {"slug": slug, "sets": []}
    for tag, vals in sets:
        wb = openpyxl.load_workbook(base)
        for ws in list(wb.worksheets):
            if ws.title not in names:
                wb.remove(ws)
        for a, v, nf, dv in ins:
            si, addr = a.split("!")
            ws = wb[names[int(si)]]
            if a in vals:
                val = vals[a]
                if isinstance(val, dict) and "f" in val:
                    val = "=" + val["f"]          # 작성 예시만의 수식
            elif kinds[a] == 3:
                continue                      # 비우면 수식 — 그대로
            else:
                val = None if 자리글(v, nf) else v
            ws[addr].value = val
        done = {a for a, *_ in ins}
        for a, val in vals.items():
            if a in done or not (isinstance(val, dict) and "f" in val):
                continue
            si, addr = a.split("!")
            wb[names[int(si)]][addr].value = "=" + val["f"]
        p = os.path.join(out, "in", f"{slug}__{tag}.xlsx")
        os.makedirs(os.path.dirname(p), exist_ok=True)
        wb.save(p)
        plan["sets"].append({"tag": tag, "file": p, "inputs": {a: vals.get(a) for a in vals}})
    return doc, plan


def lo_recalc(files, out):
    rd = os.path.join(out, "re")
    os.makedirs(rd, exist_ok=True)
    for i in range(0, len(files), 40):
        subprocess.run(["soffice", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", rd] + files[i:i + 40],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=1800)
    return rd


def _raw_values(path):
    """다시 계산한 엑셀의 칸 값을 XML 에서 바로 읽음(날짜 꼴 칸을 datetime 으로 바꾸다 생기는 오류 · 1900 버릇을 피함)"""
    import zipfile
    import xml.etree.ElementTree as ET
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    z = zipfile.ZipFile(path)
    ss = []
    if "xl/sharedStrings.xml" in z.namelist():
        for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", ns):
            ss.append("".join(t.text or "" for t in si.iter("{%s}t" % ns["m"])))
    wbx = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid = {r.get("Id"): r.get("Target") for r in rels}
    out = {}
    for sh in wbx.find("m:sheets", ns):
        name = sh.get("name")
        tgt = rid[sh.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")]
        tgt = tgt.lstrip("/")
        if not tgt.startswith("xl/"):
            tgt = "xl/" + tgt
        vals = {}
        for c in ET.fromstring(z.read(tgt)).iter("{%s}c" % ns["m"]):
            t = c.get("t")
            v = c.find("m:v", ns)
            if v is None:
                isv = c.find("m:is", ns)
                vals[c.get("r")] = "".join(x.text or "" for x in isv.iter("{%s}t" % ns["m"])) if isv is not None else None
                continue
            x = v.text
            if t == "s":
                x = ss[int(x)]
            elif t in ("str", "inlineStr"):
                x = x or ""
            elif t == "b":
                x = x == "1"
            elif t == "e":
                x = x
            else:
                x = float(x)
                if x.is_integer():
                    x = int(x)
            vals[c.get("r")] = x
        out[name] = vals
    return out


def read_want(doc, path):
    raw = _raw_values(path)
    want = {}
    for si, s in enumerate(doc["sheets"]):
        vals = raw.get(s["name"], {})
        for c in s["cells"]:
            if c[5] not in (2, 3):
                continue
            addr = f"{격자._col(c[1])}{c[0]}"
            want[f"{si}!{addr}"] = vals.get(addr)
    return want


if __name__ == "__main__":
    args = sys.argv[1:]
    out = "/tmp/g10/g361/v"
    if "--out" in args:
        i = args.index("--out")
        out = args[i + 1]
        del args[i:i + 2]
    skip_lo = "--skip-lo" in args
    slugs = 격자.all_slugs() if "--all" in args else [a for a in args if not a.startswith("--")]
    plans = []
    docs = {}
    for s in slugs:
        try:
            doc, plan = make_files(s, out)
        except Exception as e:
            print("✗ 굽기 실패", s, e)
            continue
        docs[s] = doc
        plans.append(plan)
    files = [st["file"] for p in plans for st in p["sets"]]
    if not skip_lo:
        rd = lo_recalc(files, out)
    else:
        rd = os.path.join(out, "re")
    res = []
    for p in plans:
        doc = docs[p["slug"]]
        for st in p["sets"]:
            rp = os.path.join(rd, os.path.basename(st["file"]))
            if not os.path.exists(rp):
                print("✗ LibreOffice 결과 없음", rp)
                continue
            res.append({"slug": p["slug"], "tag": st["tag"], "inputs": st["inputs"], "want": read_want(doc, rp)})
    json.dump(res, open(os.path.join(out, "want.json"), "w", encoding="utf-8"), ensure_ascii=False, default=str)
    print(f"서식 {len(plans)} · 벌 {len(res)} → {out}/want.json · 다음: node tools/격자셈시험.mjs {out}")
