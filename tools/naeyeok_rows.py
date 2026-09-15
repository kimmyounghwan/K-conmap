# -*- coding: utf-8 -*-
"""내역서에서 «품명·규격·단위·단가» 를 뽑습니다. (엑셀 · 맨 XML 훑개)

⚠️ 앞 판은 머리글에 「단가」 가 있어야만 읽었습니다. 그런데 정작 알짜인 **일위대가목록** 은
   「재료비 · 노무비 · 경비 · 합계」 로만 되어 있어 통째로 지나쳤습니다.
   → 「합계」 도 단가로 봅니다(재료비·노무비·경비가 같이 있을 때).
⚠️ 「재료비단가 금액 노무비단가 금액 계단가 금액」 꼴에서 단가를 다 더하면 두 번 셉니다.
   → 끝 값이 앞의 합과 거의 같으면 그것만 씁니다.
"""
import io, json, os, re, sys, time, collections, importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOX  = os.environ.get("KCM_BOX") or os.path.join(os.path.dirname(ROOT), "내역서모음")
BUDGET = float(sys.argv[1]) if len(sys.argv) > 1 else 1e9   # 초. 안 주면 끝까지
TOOL = os.path.join(ROOT, "tools", "naeyeok_fetch.py")
spec = importlib.util.spec_from_file_location("nf", TOOL)
m = importlib.util.module_from_spec(spec); sys.argv = ["x"]; spec.loader.exec_module(m)

OUT = os.path.join(BOX, "_뽑은단가_엑셀.json"); DONE = os.path.join(BOX, "_뽑은단가_한것.json")
N = lambda v: re.sub(r"\s+", "", str(v))

def is_name(t):  return t in ('품명','공종','명칭','품목','자재명','품명및규격','공정','규격및품명','품목명')
def is_spec(t):  return t in ('규격','형식','규격및단위')
def is_unit(t):  return t in ('단위','수량단위')
def is_price(t): return '단가' in t and '산출' not in t and '대비' not in t
def is_sum(t):   return t in ('합계','계','소계','총계','합계금액')
def is_cost(t):  return t in ('재료비','노무비','경비','재료','노무')

def header(cells):
    nm = sp = un = None
    pcols, scols, ccols = [], [], []
    for c, v in sorted(cells.items()):
        if not isinstance(v, str): continue
        t = N(v)
        if nm is None and is_name(t): nm = c
        elif sp is None and is_spec(t): sp = c
        elif un is None and is_unit(t): un = c
        elif is_price(t): pcols.append(c)
        elif is_sum(t): scols.append(c)
        elif is_cost(t): ccols.append(c)
    if nm is None: return None
    if not pcols and scols and len(ccols) >= 2:
        pcols = [scols[-1]]          # 일위대가목록 꼴: 재료비·노무비·경비 → 합계
    if not pcols: return None
    return {'name': nm, 'spec': sp, 'unit': un, 'price': pcols}

def value(cells, h):
    vals = []
    for c in h['price']:
        v = cells.get(c)
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            vals.append(float(v))
    if not vals: return 0.0
    if len(vals) >= 2:
        head = sum(vals[:-1])
        if head > 0 and abs(vals[-1] - head) <= max(1.0, 0.02 * abs(vals[-1])):
            return vals[-1]
        return sum(vals)
    return vals[0]

def pull(path):
    try:
        shs = m._xsheets(path); sst = m._xshared(path)
    except Exception:
        return []
    got = []
    for name, tgt in shs[:16]:
        if m.BAD_SHEET.search(name or ""): continue
        try: rr = m._xrows(path, tgt, sst, 1500)
        except Exception: continue
        h, hi = None, None
        for i, (ri, cells) in enumerate(rr[:80]):
            h = header(cells)
            if h: hi = i; break
        if not h: continue
        for ri, cells in rr[hi + 1:]:
            nm = cells.get(h['name'])
            if not isinstance(nm, str): continue
            nm = nm.strip()
            if not nm or len(nm) > 60: continue
            pr = value(cells, h)
            if pr <= 0 or pr > 5e9: continue
            got.append([nm,
                        str(cells.get(h['spec'], '') or '').strip()[:40],
                        str(cells.get(h['unit'], '') or '').strip()[:10],
                        pr, name[:16]])
        if len(got) > 6000: break
    return got

log = json.load(io.open(os.path.join(BOX, "_수집기록.json"), encoding="utf-8"))
try: rows = json.load(io.open(OUT, encoding="utf-8"))
except Exception: rows = []
try: done = set(json.load(io.open(DONE, encoding="utf-8")))
except Exception: done = set()
t0 = time.time(); n = 0
todo = [(u, v) for u, v in log.items()
        if v.get("ok") and v.get("price") == "있음" and u not in done]
for u, v in todo:
    if time.time() - t0 > BUDGET: break
    p = os.path.join(BOX, (v.get("path") or "").replace("\\", os.sep))
    done.add(u); n += 1
    if n % 200 == 0:
        print("   … %d개" % n); sys.stdout.flush()
    if not os.path.exists(p) or not p.lower().endswith((".xlsx", ".xlsm")): continue
    for g in pull(p):
        rows.append(g + [v.get("inst", ""), v.get("dt", ""), v.get("path", ""), v.get("name", "")])
json.dump(rows, io.open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
json.dump(sorted(done), io.open(DONE, "w", encoding="utf-8"), ensure_ascii=False)
print("이번 %d개 · 누적 줄 %d · 남은 %d" % (n, len(rows), len(todo) - n))
