# -*- coding: utf-8 -*-
"""웹예시.py — 옛 서식(b_*.py spec) «사이트에서 작성» 에 «✍ 예시 채우기» 를 넣습니다 (2026-10-21)

소장님: 「아까 하다 말았잖아. 작업 시작하자」 → 「편하게 해줘 이용자 입장에서」 — 서식 점검 C(옛 서식 153 에 «예시 채우기» 없음)를 먼저.
엑셀(인쇄용)의 «작성 예시» 시트와 «똑같은» 가상 값을 사이트 작성 칸으로 옮깁니다. 계산 칸(합계 · 증감 · 번호 …)까지 엑셀이 계산한 값 그대로.

■ 만드는 법(클라우드 · openpyxl + LibreOffice 필요):  python3 tools/forms2/웹예시.py
    ① spec 마다 gen.draw_form(작성 예시) 으로 엑셀을 그리고 칸 이름 → 셀 주소(page.k)를 받음
    ② LibreOffice 로 한 번에 다시 계산(수식 값) → ③ 칸 이름으로 값을 읽어 사이트 칸 꼴(서식작성.jsx 빈값 과 같은 모양)로
    ④ web/public/forms/ex/{slug}.json 에 씀 · forms.json 그 서식에 "wex": 1 (사이트는 누를 때만 받음 — forms.json 이 커지지 않게)
■ 시험(PC 올리기 bat · openpyxl 없이도):  python3 tools/forms2/웹예시.py --check
    wex 표시 ↔ 파일 있음 · 파일 모양이 forms.json 블록과 맞음(kv 줄 수 · 표 칸 수 · 서명 사람 수) · 남은 옛 파일 없음
■ 값은 모두 가상(가나지구 배수로 정비공사 · 예시건설(주) · 홍길동 …) — spec 의 ex 그대로.
"""
import datetime
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
ROOT = os.path.dirname(os.path.dirname(HERE))
FORMS = os.path.join(ROOT, "web", "src", "data", "forms.json")
EXDIR = os.path.join(ROOT, "web", "public", "forms", "ex")


def norm(t):
    return re.sub(r"\s+", "", str(t or ""))


# ── 숫자 → 엑셀 표시 꼴 ─────────────────────────────────────────
_수 = "영일이삼사오육칠팔구"


def 한글금액(n):
    n = int(n)
    if n == 0:
        return "영"
    out = ""
    큰 = ["", "만", "억", "조"]
    작 = ["", "십", "백", "천"]
    i = 0
    while n > 0:
        덩 = n % 10000
        if 덩:
            s = ""
            for j in range(3, -1, -1):
                d = (덩 // 10 ** j) % 10
                if d:
                    s += ("" if (d == 1 and j > 0) else _수[d]) + 작[j]
            out = s + 큰[i] + out
        n //= 10000
        i += 1
    return out


def _마디(nf):
    """엑셀 서식 «;» 로 나눔(따옴표 안의 ; 는 그대로)"""
    out, cur, q = [], "", False
    for ch in nf:
        if ch == '"':
            q = not q
        if ch == ";" and not q:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    out.append(cur)
    return out


def _수글(v, pat):
    정, _, 소 = pat.partition(".")
    최소 = 소.count("0")
    최대 = len(소)
    s = f"{abs(v):,.{최대}f}" if "," in 정 else f"{abs(v):.{최대}f}"
    if 최대 > 최소 and "." in s:
        s = s.rstrip("0")
        if "." in s:
            a, b = s.split(".")
            b = b.ljust(최소, "0")
            s = a + ("." + b if b else "")
        if s.endswith("."):
            s = s[:-1]
    return s


def 숫자글(v, nf):
    if nf in (None, "", "General", "@"):
        if isinstance(v, float) and v.is_integer():
            v = int(v)
        if isinstance(v, float):
            v = round(v, 6)
        return str(v)
    if "[DBNum4]" in nf:
        return f"일금 {한글금액(v)}원정"
    마 = _마디(nf)
    if v == 0 and len(마) >= 3:
        sec = 마[2]
    elif v < 0 and len(마) >= 2:
        sec = 마[1]
    else:
        sec = 마[0]
    sec = re.sub(r"\[[^\]]*\]", "", sec)
    퍼 = "%" in re.sub(r'"[^"]*"', "", sec)
    값 = v * 100 if 퍼 else v
    out, 넣음 = "", False
    for m in re.finditer(r'"([^"]*)"|([#0,]+(?:\.[#0]+)?)|\\(.)|(.)', sec):
        if m.group(1) is not None:
            out += m.group(1)
        elif m.group(2) is not None:
            if not 넣음:
                out += _수글(값, m.group(2))
                넣음 = True
        elif m.group(3) is not None:
            out += m.group(3)
        else:
            ch = m.group(4)
            if ch not in "_*":
                out += ch
    if v < 0 and len(마) < 2 and not out.startswith("-"):
        out = "-" + out
    return out.strip()


def 날글(v, nf):
    nf = nf or ""
    if isinstance(v, datetime.time):
        return f"{v.hour:02d}:{v.minute:02d}"
    시 = isinstance(v, datetime.datetime) and ("h" in nf.lower())
    d = v.date() if isinstance(v, datetime.datetime) else v
    if "년" in nf:
        s = f"{d.year}년 {d.month}월 {d.day}일"
    elif nf.startswith("m") and "y" not in nf:
        s = f"{d.month}/{d.day}" if "/" in nf else f"{d.month}. {d.day}."
    elif nf.lower().startswith("hh"):
        return f"{v.hour:02d}:{v.minute:02d}"
    else:
        s = f"{d.year}. {d.month}. {d.day}."
    if 시:
        s += f" {v.hour:02d}:{v.minute:02d}"
    return s


def 글(v, nf):
    if v is None:
        return ""
    if isinstance(v, bool):
        return "예" if v else ""
    if isinstance(v, (datetime.date, datetime.time)):
        return 날글(v, nf)
    if isinstance(v, (int, float)):
        if v == 0 and nf and len(_마디(nf)) >= 3 and _마디(nf)[2].strip() in ('""', ""):
            return ""
        return 숫자글(v, nf)
    return str(v).strip()


# ── 사이트 칸 꼴(서식작성.jsx 빈값 · 맞는꼴 과 같은 모양) ──────────────
def 줄수(b):
    rows = b.get("rows") or []
    return max(len(rows), b.get("n") or (0 if rows else 5), len(b.get("wpre") or []))


def 맞는꼴(blocks, v):
    if not isinstance(v, list) or len(v) != len(blocks):
        return False
    for b, x in zip(blocks, v):
        t = b["t"]
        if t == "kv" and not (isinstance(x, list) and len(x) == len(b["rows"])):
            return False
        if t == "table" and not (isinstance(x, list) and all(isinstance(r, list) and len(r) == len(b["cols"]) for r in x)):
            return False
        if t in ("chk", "cl") and not (isinstance(x, list) and len(x) == len(b["items"])):
            return False
        if t == "sign" and not (isinstance(x, dict) and isinstance(x.get("n"), list) and len(x["n"]) == len(b["who"]) and re.match(r"^\d{4}-\d{2}-\d{2}$", str(x.get("d", "")))):
            return False
    return True


def 예시값(form, spec, page, 값):
    """page.k(칸 이름 → 셀) · 값(셀 → (다시 계산한 값, 서식)) → 사이트 칸 꼴"""
    k = page.k
    읽 = lambda key: 글(*값.get(k[key], (None, None))) if key in k and ":" not in k[key] else ""
    blocks = form["sheet"]["blocks"]
    tabs = spec.get("tab") or []
    out, seen, ti, si = [], {}, 0, 0
    for b in blocks:
        t = b["t"]
        if t == "kv":
            row = []
            for label, _val, *_ in b["rows"]:
                seen[norm(label)] = seen.get(norm(label), 0) + 1
                nth = seen[norm(label)]
                목표 = norm(f"{label}#{nth}") if nth > 1 else norm(label)
                s = next((v for kk, v in (spec.get("kv") or {}).items() if norm(kk) == 목표), None)
                key = (s or {}).get("k") or (norm(label) + (str(nth) if nth > 1 else ""))
                v = 읽(key)
                r = (s or {}).get("r")
                if r and r.get("k") in k and v:
                    율 = 읽(r["k"])
                    if 율:
                        v = f"{v} (요율 {율})"
                row.append(v)
            out.append(row)
        elif t == "table":
            ts = tabs[ti] if ti < len(tabs) else (spec.get("tab_all") or {})
            kp = "" if ti == 0 else f"t{ti + 1}."
            ti += 1
            keys = ts.get("cols") or [norm(c) for c in b["cols"]]
            rows, i = [], 1
            while any(f"{kp}{kk}#{i}" in k for kk in keys):
                rows.append([읽(f"{kp}{kk}#{i}") for kk in keys])
                i += 1
            while rows and not any(rows[-1]) and len(rows) > 줄수(b):      # 엑셀 쪽 빈 줄은 사이트 줄 수까지만
                rows.pop()
            while len(rows) < 줄수(b):
                rows.append([""] * len(keys))
            out.append(rows)
        elif t == "cl":
            out.append([False] * len(b["items"]))
        elif t == "chk":
            out.append([{"r": "", "m": ""} for _ in b["items"]])
        elif t == "sign":
            si += 1
            sx = "" if si == 1 else str(si)
            d = 값.get(k.get("서명일" + sx), (None, None))[0]
            d = d.date() if isinstance(d, datetime.datetime) else d
            out.append({"d": d.isoformat() if isinstance(d, datetime.date) else "2026-09-29",
                        "n": [읽("서명:" + norm(w) + sx) for w in b["who"]]})
        else:
            out.append(None)
    return out


def 만들기():
    import importlib
    import openpyxl
    import registry
    import gen
    import fb
    forms = registry.forms()
    tmp = tempfile.mkdtemp(prefix="웹예시_")
    판 = {}
    for bn in registry.BATCHES:
        mod = importlib.import_module(bn)
        for slug, spec in mod.SPECS.items():
            f = forms.get(slug)
            if not f or not f.get("sheet") or f.get("ex") or f.get("gen") == "wihgen":
                continue
            if not any(b["t"] in ("kv", "table", "cl") for b in f["sheet"]["blocks"]):
                continue
            bk = fb.Book(f["title"])
            p = gen.draw_form(bk, True, f, spec)
            path = os.path.join(tmp, slug + ".xlsx")
            bk.save(path)
            판[slug] = (f, spec, p, path)
    out = os.path.join(tmp, "out")
    os.makedirs(out)
    files = [x[3] for x in 판.values()]
    for i in range(0, len(files), 40):
        subprocess.run(["soffice", "--headless", "--calc", "--convert-to", "xlsx", "--outdir", out] + files[i:i + 40],
                       check=True, capture_output=True, timeout=900)
    결과, 틀림 = {}, []
    for slug, (f, spec, p, path) in sorted(판.items()):
        w0 = openpyxl.load_workbook(path).worksheets[0]
        w1 = openpyxl.load_workbook(os.path.join(out, slug + ".xlsx"), data_only=True).worksheets[0]
        값 = {}
        for addr in p.k.values():
            if ":" in addr:
                continue
            값[addr] = (w1[addr].value, w0[addr].number_format)
        v = 예시값(f, spec, p, 값)
        if not 맞는꼴(f["sheet"]["blocks"], v):
            틀림.append(slug)
            continue
        채움 = sum(1 for b, x in zip(f["sheet"]["blocks"], v) if b["t"] == "kv" for y in x if y) + \
            sum(1 for b, x in zip(f["sheet"]["blocks"], v) if b["t"] == "table" for r in x for y in r if y)
        if 채움 < 2:
            틀림.append(slug + "(빈 예시)")
            continue
        결과[slug] = v
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(EXDIR, exist_ok=True)
    for p in glob.glob(os.path.join(EXDIR, "*.json")):
        if os.path.basename(p)[:-5] not in 결과:
            os.remove(p)
    for slug, v in 결과.items():
        open(os.path.join(EXDIR, slug + ".json"), "w", encoding="utf-8").write(json.dumps(v, ensure_ascii=False, separators=(",", ":")))
    d = json.loads(open(FORMS, "rb").read())
    for f in d["forms"]:
        f.pop("wex", None)
        if f["slug"] in 결과:
            f["wex"] = 1
    open(FORMS, "wb").write(json.dumps(d, ensure_ascii=False, indent=1).encode("utf-8"))
    print("웹예시 — 만든 것", len(결과), "· 못 만든 것", 틀림)


def 확인():
    d = json.loads(open(FORMS, "rb").read())
    틀 = []
    있는 = {os.path.basename(p)[:-5] for p in glob.glob(os.path.join(EXDIR, "*.json"))}
    n = 0
    for f in d["forms"]:
        if not f.get("wex"):
            if f["slug"] in 있는:
                틀.append(f"{f['slug']}: 표시 없는데 파일 있음")
            continue
        n += 1
        p = os.path.join(EXDIR, f["slug"] + ".json")
        if not os.path.exists(p):
            틀.append(f"{f['slug']}: 파일 없음")
            continue
        v = json.loads(open(p, encoding="utf-8").read())
        if not 맞는꼴(f["sheet"]["blocks"], v):
            틀.append(f"{f['slug']}: 모양이 서식과 다름")
        if f.get("ex"):
            틀.append(f"{f['slug']}: 웹 서식 예시(ex)와 겹침")
    print("웹예시 확인 —", f"예시 {n}개", "· 틀림", len(틀), 틀[:5])
    return not 틀


if __name__ == "__main__":
    if "--check" in sys.argv:
        sys.exit(0 if 확인() else 4)
    만들기()
    sys.exit(0 if 확인() else 4)
