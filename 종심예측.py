# -*- coding: utf-8 -*-
"""종심예측.py — 🏛 G807 (2026-11-20) 종심제 · 종합평가 균형가격 «예측» 과 «맞춰 보기» — 바로투찰 종심제 기획 ④

소장님 11-20 「보내고, 바로투질 작업해줘」(기획 «다섯가지 다 하자» · ④ 성적 «80% 범위 적중 75% 이상»)

■ 무엇을
  data/seed/jongsim.json(G804 수집 · G806 지난 1년 채우기 — 공개 금액으로 다시 셈한 균형가격 줄)에서
  «균형가격 ÷ 기초금액(%)» 이 어디쯤 오는지 셉니다. 투찰 전에는 기초금액만 알기 때문입니다(남의 통계는 안 씀).
  · 묶음(기획서 «묶는 기준»): 갈래(간이형 · 일반 · 실적제한 · 고난도 · 지방종평) → 발주기관 → 금액대(추정가격) → 주공종 —
    표본이 20건(최소표본)이 안 되면 뒤에서부터 한 단계씩 넓힘(주공종 → 금액대 → 발주기관 → 갈래 → 전체).
  · 보여 줄 값: 가운데(50분위) · 80% 범위(10 ~ 90분위) · 표본 수 · 예정가격÷기초금액 가운데(가격점수 셈에 씀) · 5 ~ 95분위 열아홉 점(기대 점수 셈에 씀).
■ 맞춰 보기(기획서 «검증 ②»)
  마지막 3개월(개찰일)을 빼 두고 그 앞 자료로만 예측 → 실제(다시 셈) 균형가격이 80% 범위 안에 든 비율 · 가운데 오차.
  적중 75% 이상 · 맞춰 본 건수 30 이상이면 «보임»(화면이 예측 띠를 냄) — 아니면 화면은 «지난 개찰 분포» 만(맞지 않는 숫자를 권장처럼 내지 않음).
■ 내는 곳: web/public/data/jongsim.json(build_json.py 가 부름 · 실패해도 사이트 집계는 계속)
  ⚠️ 업체 이름 · 사업자번호 · 공사명은 원래 jongsim.json 에 없음 — 여기서도 공고번호 · 날짜 · 갈래 · 비율만.
  시험: python tools/시험_종심예측.py
"""
import io
import json
import os
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "data", "seed", "jongsim.json")
OUT = os.path.join(ROOT, "web", "public", "data", "jongsim.json")
KST = timezone(timedelta(hours=9))

최소표본 = 20          # 묶음 표본이 이보다 적으면 한 단계 넓힘 · 전체도 모자라면 «표본 적음»
아래, 위 = 10, 90       # 80% 범위
적중기준 = 75.0         # 맞춰 보기 적중률(%) 이 이상이면 보임
검증최소 = 30           # 맞춰 본 건수가 이보다 적으면 아직 안 보임
뒤달 = 3                # 마지막 3개월을 빼 두고 맞춰 봄
성적확인 = False         # 🏛 G808 기획서 «맞춰 보기 → 성적을 숫자로 보여 드림 → 확인» — 확인 받은 뒤 True(그 전엔 화면이 예상 띠 · 금액 고르기를 안 냄)
점들 = tuple(range(5, 100, 5))   # 5 ~ 95분위 열아홉 점(기대 가격점수 셈)
갈래들 = ("간이형", "일반", "실적제한", "고난도", "지방종평", "종심")


def 금액대(est):
    """추정가격 → 0: 300억 미만 · 1: 300 ~ 500억 · 2: 500 ~ 1000억 · 3: 1000억 이상 · 모르면 -1"""
    try:
        e = float(est or 0)
    except (TypeError, ValueError):
        return -1
    if e <= 0:
        return -1
    return 0 if e < 3e10 else 1 if e < 5e10 else 2 if e < 1e11 else 3


def 기관(inst):
    """발주기관 첫 낱말(«조달청 ○○지방조달청» → «조달청» · «국토교통부 ○○국토관리청» → «국토교통부»)"""
    s = str(inst or "").strip()
    return s.split()[0][:20] if s else ""


def 줄들(js):
    """쓸 수 있는 줄만 — 기초금액 · 균형가격이 있고 균형÷기초가 60 ~ 120% 안 · 개찰일시 있음 · 개찰일 차례"""
    out = []
    for no, r in ((js or {}).get("con") or {}).items():
        try:
            base, bal = float(r.get("base") or 0), float(r.get("bal") or 0)
        except (TypeError, ValueError):
            continue
        if base <= 0 or bal <= 0:
            continue
        br = bal * 100.0 / base
        if not 60.0 <= br <= 120.0:
            continue
        dt = str(r.get("dt") or "")[:16]
        if len(dt) < 10:
            continue
        yp = float(r.get("yp") or 0) if str(r.get("yp") or "").replace(".", "", 1).isdigit() else 0.0
        yr = yp * 100.0 / base if yp > 0 else None
        out.append({"no": str(no), "dt": dt, "kind": str(r.get("kind") or "종심"), "pt": r.get("pt"), "inst": 기관(r.get("inst")),
                    "band": 금액대(r.get("est")), "main": str(r.get("main") or "")[:30], "br": br,
                    "yr": yr if yr and 90.0 <= yr <= 110.0 else None, "n": int(r.get("n") or 0)})
    out.sort(key=lambda r: (r["dt"], r["no"]))
    return out


def 분위(xs, p):
    """선형 보간 분위수(p 0 ~ 100) · 빈 목록이면 None"""
    a = sorted(xs)
    if not a:
        return None
    if len(a) == 1:
        return a[0]
    k = (len(a) - 1) * p / 100.0
    i = int(k)
    j = min(i + 1, len(a) - 1)
    return a[i] + (a[j] - a[i]) * (k - i)


def 열쇠들(r):
    """좁은 묶음 → 넓은 묶음(기획서 차례: 갈래 → 발주기관 → 금액대 → 주공종 — 넓힐 때는 뒤에서부터 뺌)"""
    k, i, b, m = r.get("kind") or "종심", r.get("inst") or "", r.get("band", -1), r.get("main") or ""
    return [(k, i, b, m), (k, i, b), (k, i), (k,), ()]


def 열쇠글(t):
    return "|".join(str(x) for x in t) if t else "전체"


def 맞는가(r, t):
    if not t:
        return True
    return (r.get("kind"), r.get("inst"), r.get("band", -1), r.get("main"))[:len(t)] == tuple(t)


def 통계(rs):
    brs = [r["br"] for r in rs]
    yrs = [r["yr"] for r in rs if r.get("yr")]
    return {"n": len(rs), "q10": 분위(brs, 아래), "q50": 분위(brs, 50), "q90": 분위(brs, 위),
            "y50": 분위(yrs, 50) if yrs else None, "d": [분위(brs, p) for p in 점들]}


def 예측(학습, 대상, 최소=최소표본):
    """대상(공고 — kind · inst · band · main)에 맞는 가장 좁은 묶음(표본 최소 이상)의 통계 + 묶음 이름 · 전체도 모자라면 표본적음 True"""
    for t in 열쇠들(대상):
        rs = [r for r in 학습 if 맞는가(r, t)]
        if len(rs) >= 최소 or not t:
            if not rs:
                return None
            s = 통계(rs)
            s.update({"묶음": 열쇠글(t), "표본적음": len(rs) < 최소})
            return s
    return None


def _달빼기(dt, 달):
    y, m = int(dt[:4]), int(dt[5:7]) - 달
    while m <= 0:
        y, m = y - 1, m + 12
    return "%04d-%02d%s" % (y, m, dt[7:])


def 맞춰보기(rows, 뒤=뒤달, 최소=최소표본):
    """마지막 뒤(3)개월을 빼 두고 그 앞 자료로만 예측 → 80% 범위 적중률 · 가운데 오차(%p) · 줄마다 한 줄"""
    if not rows:
        return {"n": 0, "적중": 0, "율": None, "오차": None, "자름": None, "학습": 0, "줄": [], "갈래": {}}
    끝 = max(r["dt"] for r in rows)
    자름 = _달빼기(끝[:10], 뒤)
    학습 = [r for r in rows if r["dt"][:10] < 자름]
    시험 = [r for r in rows if r["dt"][:10] >= 자름]
    줄, 오차들, 갈래 = [], [], {}
    for r in 시험:
        p = 예측(학습, r, 최소)
        if not p or p["표본적음"]:
            continue
        든 = p["q10"] <= r["br"] <= p["q90"]
        오차들.append(abs(r["br"] - p["q50"]))
        줄.append([r["no"], r["dt"][:10], r["kind"], round(p["q10"], 3), round(p["q50"], 3), round(p["q90"], 3), round(r["br"], 3), 1 if 든 else 0, p["묶음"]])
        g = 갈래.setdefault(r["kind"], [0, 0])
        g[0] += 1
        g[1] += 1 if 든 else 0
    n = len(줄)
    맞 = sum(x[7] for x in 줄)
    return {"n": n, "적중": 맞, "율": round(맞 * 100.0 / n, 1) if n else None, "오차": round(분위(오차들, 50), 3) if 오차들 else None,
            "자름": 자름, "학습": len(학습), "줄": 줄,
            "갈래": {k: {"n": v[0], "적중": v[1], "율": round(v[1] * 100.0 / v[0], 1)} for k, v in 갈래.items()}}


def _둥글게(s, 자리=3):
    if s is None:
        return None
    o = {}
    for k, v in s.items():
        if isinstance(v, float):
            o[k] = round(v, 자리)
        elif isinstance(v, list):
            o[k] = [round(x, 자리) if isinstance(x, float) else x for x in v]
        else:
            o[k] = v
    return o


def 만들기(js, now=None):
    """화면에 낼 한 장 — 묶음마다 통계(표본 최소 이상만 · 갈래 · 전체는 늘) · 맞춰 보기 · 보임"""
    now = now or datetime.now(KST)
    rows = 줄들(js)
    묶음 = {}
    열쇠모음 = set()
    for r in rows:
        for t in 열쇠들(r):
            열쇠모음.add(t)
    for t in sorted(열쇠모음, key=lambda t: (len(t), [str(x) for x in t])):
        rs = [r for r in rows if 맞는가(r, t)]
        if len(rs) >= 최소표본 or len(t) <= 1:
            s = 통계(rs)
            s["표본적음"] = len(rs) < 최소표본
            묶음[열쇠글(t)] = _둥글게(s)
    맞 = 맞춰보기(rows)
    보임 = bool(맞["n"] >= 검증최소 and 맞["율"] is not None and 맞["율"] >= 적중기준)
    return {
        "_설명": "🏛 G807 종심제 균형가격 예측(균형÷기초 %) · 맞춰 보기 — 종심예측.py · 자료 data/seed/jongsim.json(건설맵이 공개 금액으로 다시 셈 · 근사값)",
        "t": now.strftime("%Y-%m-%d %H:%M"), "n": len(rows),
        "기간": [rows[0]["dt"][:10], rows[-1]["dt"][:10]] if rows else None,
        "갈래수": {k: sum(1 for r in rows if r["kind"] == k) for k in 갈래들 if any(r["kind"] == k for r in rows)},
        "묶음": 묶음, "맞춤": 맞, "보임": 보임, "확인": bool(성적확인),
        "기준": {"범위": [아래, 위], "적중": 적중기준, "검증최소": 검증최소, "최소표본": 최소표본, "뒤달": 뒤달, "점": list(점들)},
    }


def build(out=OUT, src=SRC, log=print, now=None):
    try:
        with io.open(src, encoding="utf-8") as f:
            js = json.load(f)
    except FileNotFoundError:
        js = {"con": {}}
    d = 만들기(js, now)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    tmp = out + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, out)
    m = d["맞춤"]
    log("🏛 종심 균형가격 예측 — 줄 %s · 묶음 %s · 맞춰 보기 %s건 적중 %s%% · 보임 %s"
        % (format(d["n"], ","), len(d["묶음"]), m["n"], m["율"] if m["율"] is not None else "-", "예" if d["보임"] else "아니오"))
    return d


if __name__ == "__main__":
    build()
