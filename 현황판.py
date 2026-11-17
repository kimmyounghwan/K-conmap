# -*- coding: utf-8 -*-
"""🗺 G756 건설맵 공사 현황판 자료 (2026-11-17)

  소장님: 「지도에 공사 현황판 만들어서, 클릭하면 공사 요약이 나오게 하는 걸 만들면.. ?? 아이디어 줘」
         → 「건설맵 공사 현황판 만들어 줘.」 · 「아이디어 추가 해서 최대한 이용자 입장에서 편하게 만들어」
         · 「맵톡 지도를 활용하면 어때???」(맵톡과 같은 바탕 지도 · 핀 · 위 알림)

  ■ 재료: 공고(data/store/live.json) · 1순위(data/store/first.json) — 공사만(con) · 새로 묻는 것 없음 · 비용 0
  ■ 단계(s): 0 입찰 중(마감 전) · 1 개찰 대기(마감 지남 · 1순위 아직 · 마감 14일 안) · 2 곧 착공(1순위 나옴 · 개찰 30일 안)
     · 취소공고 뺌 · 같은 공고번호는 1순위가 이김(공고 줄의 현장 · 면허 · 마감은 1순위 줄에 이어 씀)
  ■ 자리(k): 한국지도.json «곳»(시 · 군 161 · 광역시 · 세종은 한 곳) —
     시도는 collect.sido_of(공사현장 → 발주기관 → 전남광주 통합 단서) · 시 · 군은 «공사현장 → 발주기관 → 공고명» 차례로
     그 시도 안 시 · 군 이름(긴 것부터 · 두 글자 넘게)을 찾음. 광역시 · 세종은 시도만 알면 그 한 곳.
     시 · 군을 못 찾으면 k = ''(그 시도 목록에만 · 지도 핀 없음) · 시도도 모르면 뺌(셈 «모름» 에만)
  ■ 파일(web/public/data/now/):
     sum.json   — {at, n:[입찰 중, 개찰 대기, 곧 착공], 시도:{전남:[n0, n1, n2, 시·군 모름]}, 곳:{k:[n0, n1, n2]},
                   새:[[no, k, s, 공사명, 때]] 최근 12(위 알림) , 큰:[줄] 전국 큰 공사 20(첫 화면 목록)}
     {시도}.json — {at, 시도, 줄:[줄 …]}  ← 그 시도를 고르거나 시 · 군 핀을 누를 때만 받음
     줄 = [no, k, s, 공사명, 기관, 금액, 마감, 개찰, 1순위, 투찰률, 참가, 면허코드들, 면허이름, 현장, 공고일, 기초금액]
  ■ 싣지 않는 것: 담당자 이름 · 전화 · 사업자번호 · 대표 이름(현황판은 요약 · 자세한 것은 공고 화면)
  ■ 시험: python tools/시험_현황판.py
"""
import json
import os
import re
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
KST = timezone(timedelta(hours=9))
STORE = os.path.join(ROOT, "data", "store")
MAP = os.path.join(ROOT, "web", "src", "data", "한국지도.json")
OUT = os.path.join(ROOT, "web", "public", "data", "now")

대기날 = 14       # 마감 뒤 1순위가 이만큼 안 나오면 현황판에서 뺌(유찰 · 재공고 · 늦은 개찰)
착공날 = 30       # 개찰 뒤 이만큼은 «곧 착공» 으로 둠
새수 = 12
큰수 = 20
광역 = {"서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종"}


def 때글(v):
    """'2026-11-17 10:00:00' → '2026-11-17 10:00' · 못 읽으면 ''"""
    d = re.sub(r"\D", "", str(v or ""))
    if len(d) < 8:
        return ""
    s = f"{d[0:4]}-{d[4:6]}-{d[6:8]}"
    if len(d) >= 12:
        s += f" {d[8:10]}:{d[10:12]}"
    return s


def 때(v):
    d = re.sub(r"\D", "", str(v or ""))
    if len(d) < 8:
        return None
    try:
        return datetime(int(d[0:4]), int(d[4:6]), int(d[6:8]), int(d[8:10] or 0), int(d[10:12] or 0), tzinfo=KST)
    except ValueError:
        return None


def 곳표만들기(바탕):
    """한국지도.json → {시도: [(줄기, k), …] 긴 줄기부터} · 광역 {시도: k}"""
    표, 한곳 = {}, {}
    for g in 바탕.get("곳") or []:
        k, n, d = str(g.get("k")), str(g.get("n") or ""), str(g.get("d") or "")
        if d in 광역:
            한곳[d] = k
            continue
        줄기 = n[:-1] if n[-1:] in ("시", "군") and len(n) > 2 else n
        표.setdefault(d, []).append((줄기, k))
    for d in 표:
        표[d].sort(key=lambda x: -len(x[0]))
    return 표, 한곳


def 자리찾기(r, 시도, 표, 한곳):
    """그 시도 안 시 · 군 곳 번호 · 못 찾으면 ''"""
    if not 시도 or "," in 시도:
        return ""
    if 시도 in 한곳:
        return 한곳[시도]
    후보 = 표.get(시도) or []
    for 글 in (r.get("site"), r.get("inst"), r.get("dmnd"), r.get("name")):
        t = str(글 or "")
        if not t:
            continue
        for 줄기, k in 후보:
            if len(줄기) >= 2 and 줄기 in t:
                # «광주» 는 경기 광주시 · «고성» 은 강원 · 경남 — 시도가 먼저 정해져 있어 그 시도 안에서만 찾음
                return k
    return ""


def 면허(lic):
    """['전기공사업/0037', …] → (['0037', …], '전기공사업 외 1')
    collect.lic_pairs 와 똑같이 가름(앞뒤 빈칸 떼기 · «/» 가 없으면 이름이 곧 코드 · 글 하나면 [글]) —
    공고 탭 «내 면허»(lib/lic.js · meta.con.lics 코드)와 같은 코드여야 «🪪 내 면허만» 이 맞음 · 시험: tools/시험_현황판.py ③"""
    v = lic if isinstance(lic, list) else ([lic] if lic else [])
    codes, names = [], []
    for x in v:
        t = str(x).strip()
        if not t:
            continue
        if "/" in t:
            nm, cd = t.rsplit("/", 1)
            nm, cd = nm.strip(), cd.strip()
        else:
            nm, cd = t, t
        if cd:
            codes.append(cd)
            names.append(nm or cd)
    이름 = names[0] if names else ""
    if len(names) > 1:
        이름 += f" 외 {len(names) - 1}"
    return codes, 이름


def 읽기(이름, store=None):
    p = os.path.join(store or STORE, f"{이름}.json")
    try:
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
    except Exception:
        return {}
    return d.get("con") or {} if isinstance(d, dict) else {}


def 만들기(live, first, 바탕, 지금, sido_of=None):
    """순수 셈(시험) — (sum, {시도: 줄들})"""
    if sido_of is None:
        try:
            from collect import sido_of as _s
            sido_of = _s
        except Exception:
            sido_of = lambda r, book=None: ""      # noqa: E731
    표, 한곳 = 곳표만들기(바탕)
    줄들 = []
    본 = set()
    # ① 1순위(곧 착공) — 개찰 착공날 안
    for no, f in (first or {}).items():
        t = 때(f.get("dt"))
        if not t or t > 지금 + timedelta(hours=1) or t < 지금 - timedelta(days=착공날):
            continue
        l = (live or {}).get(no) or {}
        if "취소" in str(l.get("kind") or ""):
            continue
        r = dict(l)
        r.update({k: v for k, v in f.items() if v not in (None, "", [])})
        r["ndt"] = l.get("dt") or ""          # 공고일(1순위 줄의 dt 는 개찰일)
        줄들.append((2, r))
        본.add(no)
    # ② 공고 — 마감 전(입찰 중) · 마감 지남 · 1순위 아직(개찰 대기)
    for no, l in (live or {}).items():
        if no in 본 or "취소" in str(l.get("kind") or ""):
            continue
        c = 때(l.get("close"))
        if not c:
            continue
        if c > 지금:
            s = 0
        elif c >= 지금 - timedelta(days=대기날):
            s = 1
        else:
            continue
        줄들.append((s, l))
    sum_ = {"at": 지금.strftime("%Y-%m-%d %H:%M"), "n": [0, 0, 0], "시도": {}, "곳": {}, "새": [], "큰": [], "모름": 0}
    by = {}
    for s, r in 줄들:
        try:
            시도 = sido_of(r) or ""
        except Exception:
            시도 = ""
        if "," in 시도:          # «전남,광주» — 하나로 못 정함 → 앞 것(전남)으로 · 시 · 군은 모름
            시도 = 시도.split(",")[0]
        if not 시도:
            sum_["모름"] += 1
            continue
        k = 자리찾기(r, 시도, 표, 한곳)
        codes, licname = 면허(r.get("lic"))
        if s == 2:
            금액 = r.get("amt") or r.get("base") or r.get("est") or 0
        else:
            금액 = r.get("base") or r.get("budget") or r.get("est") or 0
        try:
            금액 = int(float(금액))
        except (TypeError, ValueError):
            금액 = 0
        try:
            율 = round(float(r.get("rate")), 3) if s == 2 and r.get("rate") not in (None, "") else None
        except (TypeError, ValueError):
            율 = None
        try:
            참가 = int(r.get("np")) if s == 2 and r.get("np") not in (None, "") else None
        except (TypeError, ValueError):
            참가 = None
        기초 = r.get("base")
        try:
            기초 = int(float(기초)) if 기초 not in (None, "") else None
        except (TypeError, ValueError):
            기초 = None
        줄 = [str(r.get("no") or ""), k, s, str(r.get("name") or "")[:80], str(r.get("inst") or "")[:40], 금액,
              때글(r.get("close")), 때글(r.get("openg") or (r.get("dt") if s == 2 else "")),
              str(r.get("win") or "") if s == 2 else "", 율, 참가, codes[:6], licname[:30],
              str(r.get("site") or "")[:30], 때글(l_dt(r)), 기초]
        by.setdefault(시도, []).append(줄)
        sum_["n"][s] += 1
        t = sum_["시도"].setdefault(시도, [0, 0, 0, 0])
        t[s] += 1
        if not k:
            t[3] += 1
        else:
            g = sum_["곳"].setdefault(k, [0, 0, 0])
            g[s] += 1
    # 줄 차례: 입찰 중(마감 가까운 것부터) → 개찰 대기(마감 최근부터) → 곧 착공(개찰 최근부터)
    for 시도 in list(by):
        xs = by[시도]
        a = sorted((x for x in xs if x[2] == 0), key=lambda x: x[6] or "9")
        b = sorted((x for x in xs if x[2] == 1), key=lambda x: x[6] or "", reverse=True)
        c = sorted((x for x in xs if x[2] == 2), key=lambda x: x[7] or "", reverse=True)
        by[시도] = a + b + c
    모두 = [x for xs in by.values() for x in xs]
    # 위 알림 — 최근에 나온 것(공고일 · 개찰일) 12
    새 = sorted(모두, key=lambda x: (x[7] if x[2] == 2 else x[14]) or "", reverse=True)[:새수]
    sum_["새"] = [[x[0], x[1], x[2], x[3][:40], (x[7] if x[2] == 2 else x[14])] for x in 새]
    # 전국 큰 공사 — 입찰 중 · 개찰 대기 먼저(금액 큰 차례) 20
    큰 = sorted((x for x in 모두 if x[2] in (0, 1)), key=lambda x: -(x[5] or 0))[:큰수]
    sum_["큰"] = 큰
    return sum_, by


def l_dt(r):
    """공고일 — 1순위 줄은 이어 붙일 때 남긴 ndt(공고 줄의 dt) · 공고 줄은 dt"""
    if "ndt" in r:
        return r.get("ndt") or ""
    return r.get("dt") or ""


def build(out=None, store=None, map_json=None, now=None, log=print):
    out = out or OUT
    with open(map_json or MAP, encoding="utf-8") as f:
        바탕 = json.load(f)
    live, first = 읽기("live", store), 읽기("first", store)
    지금 = now or datetime.now(KST)
    sum_, by = 만들기(live, first, 바탕, 지금)
    os.makedirs(out, exist_ok=True)
    for fn in os.listdir(out):
        if fn.endswith(".json"):
            try:
                os.remove(os.path.join(out, fn))
            except OSError:
                pass
    n = 0
    with open(os.path.join(out, "sum.json"), "w", encoding="utf-8") as f:
        json.dump(sum_, f, ensure_ascii=False, separators=(",", ":"))
    for 시도, 줄 in by.items():
        with open(os.path.join(out, f"{시도}.json"), "w", encoding="utf-8") as f:
            json.dump({"at": sum_["at"], "시도": 시도, "줄": 줄}, f, ensure_ascii=False, separators=(",", ":"))
        n += 1
    log(f"🗺 현황판 — 입찰 중 {sum_['n'][0]:,} · 개찰 대기 {sum_['n'][1]:,} · 곧 착공 {sum_['n'][2]:,} · "
        f"시 · 군 {len(sum_['곳'])}곳 · 시도 파일 {n} · 시도 모름 {sum_['모름']:,}")
    return sum_, by


if __name__ == "__main__":
    import sys
    now = None
    if len(sys.argv) > 1:      # 시험: python 현황판.py 2026-09-01T12:00
        now = datetime.fromisoformat(sys.argv[1]).replace(tzinfo=KST)
    build(now=now)
