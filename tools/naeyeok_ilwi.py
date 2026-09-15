# -*- coding: utf-8 -*-
"""일위대가 «호표» 를 통째로 뽑습니다 — 품명 + 그 안에 들어간 자재·품·장비와 «수량».

  한 호표는 이렇게 생겼습니다.
      기존면 침투성 방수 / 벽 / M2          ← 머리줄 (품명만 있고 나머지 칸은 빔)
        침투성방수  아쿠아크린  KG  0.38     ← 구성
        방수공     일반공사직종  인  0.03
        보통인부    일반공사직종  인  0.014
      [ 합  계 ]                          ← 끝줄
  구성줄의 «수량» 이 곧 품셈입니다. 이것만 있으면 단가가 바뀌어도 다시 계산할 수 있습니다.
"""
import io, json, os, re, sys, time, importlib.util, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOX  = os.environ.get("KCM_BOX") or os.path.join(os.path.dirname(ROOT), "내역서모음")
BUDGET = float(sys.argv[1]) if len(sys.argv) > 1 else 1e9   # 초. 안 주면 끝까지
TOOL = os.path.join(ROOT, "tools", "naeyeok_fetch.py")
spec = importlib.util.spec_from_file_location("nf", TOOL)
m = importlib.util.module_from_spec(spec); sys.argv = ["x"]; spec.loader.exec_module(m)
OUT = os.path.join(BOX, "_일위대가_호표.json"); DONE = os.path.join(BOX, "_일위대가_한것.json")

N = lambda v: re.sub(r"\s+", "", str(v))
END = re.compile(r"^\[?\s*(합\s*계|소\s*계|계)\s*\]?$")
SHEET = re.compile(r"일위|대가|단가산출|호표")

def head_row(cells):
    """머리글 줄: 품명·규격·단위·수량 이 한 줄에."""
    mp = {}
    for c, v in sorted(cells.items()):
        if not isinstance(v, str): continue
        t = N(v)
        if 'name' not in mp and t in ('품명','공종','명칭','품목'): mp['name'] = c
        elif 'spec' not in mp and t in ('규격','형식'): mp['spec'] = c
        elif 'unit' not in mp and t in ('단위',): mp['unit'] = c
        elif 'qty' not in mp and t in ('수량',): mp['qty'] = c
    return mp if len(mp) >= 3 and 'name' in mp and 'qty' in mp else None

def pull(path):
    try:
        shs = m._xsheets(path); sst = m._xshared(path)
    except Exception:
        return []
    out = []
    for name, tgt in shs[:16]:
        if not SHEET.search(name or ""): continue
        if m.BAD_SHEET.search(name or ""): continue
        try: rr = m._xrows(path, tgt, sst, 3000)
        except Exception: continue
        mp, hi = None, None
        for i, (ri, cells) in enumerate(rr[:40]):
            mp = head_row(cells)
            if mp: hi = i; break
        if not mp: continue
        cur = None
        for ri, cells in rr[hi + 1:]:
            nm = cells.get(mp['name'])
            if not isinstance(nm, str): continue
            nm = nm.strip()
            if not nm: continue
            qty = cells.get(mp['qty'])
            if END.match(N(nm)):
                if cur and cur['부속']: out.append(cur)
                cur = None; continue
            if not isinstance(qty, (int, float)) or isinstance(qty, bool) or qty <= 0:
                # 수량이 없는 줄 = 새 호표의 머리줄
                if cur and cur['부속']: out.append(cur)
                cur = {'호표': nm[:60], '단위': str(cells.get(mp.get('unit'), '') or '').strip()[:10],
                       '부속': [], '시트': name[:16]}
                continue
            if cur is None: continue
            cur['부속'].append([nm[:50],
                                str(cells.get(mp.get('spec'), '') or '').strip()[:40],
                                str(cells.get(mp.get('unit'), '') or '').strip()[:10],
                                float(qty)])
        if cur and cur['부속']: out.append(cur)
    return out

log = json.load(io.open(os.path.join(BOX, "_수집기록.json"), encoding="utf-8"))
try: res = json.load(io.open(OUT, encoding="utf-8"))
except Exception: res = []
try: done = set(json.load(io.open(DONE, encoding="utf-8")))
except Exception: done = set()
t0 = time.time(); n = 0
todo = [(u, v) for u, v in log.items()
        if v.get("ok") and str(v.get("path", "")).lower().endswith((".xlsx", ".xlsm")) and u not in done]
for u, v in todo:
    if time.time() - t0 > BUDGET: break
    p = os.path.join(BOX, (v.get("path") or "").replace("\\", os.sep))
    done.add(u); n += 1
    if n % 200 == 0:
        print("   … %d개" % n); sys.stdout.flush()
    if not os.path.exists(p): continue
    for b in pull(p):
        b['발주처'] = v.get('inst', ''); b['공고일'] = v.get('dt', ''); b['파일'] = v.get('path', '')
        res.append(b)
json.dump(res, io.open(OUT, "w", encoding="utf-8"), ensure_ascii=False)
json.dump(sorted(done), io.open(DONE, "w", encoding="utf-8"), ensure_ascii=False)
print("이번 %d개 · 누적 호표 %d · 남은 %d" % (n, len(res), len(todo) - n))
