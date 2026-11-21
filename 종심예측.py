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

🛠 G812 (2026-11-21) 소장님 「종심제 오늘중 마무리 할 것」 → 여쭘 «예상 열기» → 고르심 «넓힌 범위로 열기(추천)»
  · 그때 80% 범위(10 ~ 90분위)는 매일 맞춰 본 성적이 간이형 74% · 지방종평 71% · 일반 45%(기준 75% 미달) —
    작은 표본 · 8-25(조달청 9-08) «3인 이상 같은 금액 1개만» 규칙 뒤 분포가 옮겨 감(간이형 가운데 84.6 → 83.8%).
  · 범위 = 90%(5 ~ 95분위 · lo · hi) · 규칙 뒤 공고(sm = 1)는 규칙 뒤 줄로 먼저(묶음 20건 넘으면) → 모자라면 모든 줄.
  · 맞춰 보기 = «매일» — 마지막 3개월의 개찰을 하나씩 그날 «앞» 자료로만 예측(사이트가 날마다 다시 굽는 것과 같음).
  · 갈래마다 맞춰 본 건수 15 이상 · 적중 75% 이상이면 그 갈래만 «예상»(갈래보임) — 떨어지면 저절로 분포(참고)로.
  · 그때 성적: 간이형 23/27(85.2% · 폭 6.4%p) · 지방종평 14/17(82.4% · 11.8%p) · 일반 17/22(77.3% · 8.6%p) — 이 고르심이 성적 확인(성적확인 True).

🛠 G813 (2026-11-21) 「종심제 오늘중 마무리」 ② 개찰 뒤 «실제 균형가격» — web/public/data/jongsim_open.json
  공고번호 → [개찰일시, 갈래, 배점, 기초, 균형(근사), 예정(근사), 받은 수, 셈에 든 수] — 공고 한 장 · 1순위 펼침 · 바로투찰(개찰 뒤)이 읽음(종심개찰.jsx)
  ⚠️ 업체 이름 · 사업자번호 · 공사명 없음(원본에도 없음) · 줄들() 과 같은 거름(기초 · 균형 · 60 ~ 120% · 개찰일시).
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
아래, 위 = 5, 95        # 🛠 G812 90% 범위(lo · hi) — 소장님 11-21 «넓힌 범위로 열기» (q10 · q90 은 참고로 그대로 실음)
적중기준 = 75.0         # 맞춰 보기 적중률(%) 이 이상이면 보임
검증최소 = 30           # 맞춰 본 건수가 이보다 적으면 아직 안 보임(전체 «보임»)
갈래검증최소 = 15       # 🛠 G812 갈래마다 맞춰 본 건수가 이보다 적으면 그 갈래는 «예상» 을 안 냄
뒤달 = 3                # 마지막 3개월을 빼 두고 맞춰 봄
성적확인 = True          # 🏛 G808 «성적을 숫자로 보여 드림 → 확인» — 🛠 G812 11-21 소장님 «넓힌 범위로 열기» 로 확인(갈래마다 매일 기준을 넘을 때만 열림)
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
                    "yr": yr if yr and 90.0 <= yr <= 110.0 else None, "n": int(r.get("n") or 0),
                    "sm": 1 if r.get("sm") else 0})   # 🛠 G812 «3인 이상 같은 금액 1개만» 규칙 뒤 공고(collect 종심넣기)
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
    """좁은 묶음 → 넓은 묶음(기획서 차례: 갈래 → 발주기관 → 금액대 → 주공종 — 넓힐 때는 뒤에서부터 뺌)
       🩹 G809 (11-21) 가장 넓은 묶음은 «갈래» — 전체(갈래를 섞음)로는 넓히지 않음.
       11-21 실측: 학습 30건뿐이라 모두 «전체» 로 예측 → 간이형(균형÷기초 83%대) 27건 중 17건이 범위 아래로 빠져 적중 64%(갈래마다 분포가 다름:
       간이형 가운데 83.8 · 실적제한 85.8 · 일반 91.6 · 지방종평 93.6). 갈래 표본이 20건이 안 되면 «표본 적음» — 예상은 안 냄."""
    k, i, b, m = r.get("kind") or "종심", r.get("inst") or "", r.get("band", -1), r.get("main") or ""
    return [(k, i, b, m), (k, i, b), (k, i), (k,)]


def 열쇠글(t):
    return "|".join(str(x) for x in t) if t else "전체"


def 맞는가(r, t):
    if not t:
        return True
    return (r.get("kind"), r.get("inst"), r.get("band", -1), r.get("main"))[:len(t)] == tuple(t)


def 통계(rs):
    brs = [r["br"] for r in rs]
    yrs = [r["yr"] for r in rs if r.get("yr")]
    return {"n": len(rs), "lo": 분위(brs, 아래), "q10": 분위(brs, 10), "q50": 분위(brs, 50), "q90": 분위(brs, 90), "hi": 분위(brs, 위),
            "y50": 분위(yrs, 50) if yrs else None, "d": [분위(brs, p) for p in 점들]}


def 예측(학습, 대상, 최소=최소표본):
    """대상(공고 — kind · inst · band · main · sm)에 맞는 가장 좁은 묶음(표본 최소 이상)의 통계 + 묶음 이름
       · 🛠 G812 대상이 규칙 뒤(sm)면 규칙 뒤 줄로 먼저(좁은 → 넓은) · 모자라면 모든 줄로(좁은 → 넓은) — 화면(lib/종심고르기.js 묶음고르기)과 같은 차례
       · 갈래까지 넓혀도 모자라면 그 갈래 통계에 표본적음 True(갈래 자료가 아예 없으면 None) — 전체로는 안 넓힘(G809)"""
    ts = 열쇠들(대상)
    모음들 = ([([r for r in 학습 if r.get("sm")], True)] if 대상.get("sm") else []) + [(학습, False)]
    for 모음, 뒤 in 모음들:
        for t in ts:
            rs = [r for r in 모음 if 맞는가(r, t)]
            if len(rs) >= 최소:
                s = 통계(rs)
                s.update({"묶음": 열쇠글(t), "표본적음": False, "규칙뒤": 뒤})
                return s
    rs = [r for r in 학습 if 맞는가(r, ts[-1])]
    if not rs:
        return None
    s = 통계(rs)
    s.update({"묶음": 열쇠글(ts[-1]), "표본적음": True, "규칙뒤": False})
    return s


def _달빼기(dt, 달):
    y, m = int(dt[:4]), int(dt[5:7]) - 달
    while m <= 0:
        y, m = y - 1, m + 12
    return "%04d-%02d%s" % (y, m, dt[7:])


def 맞춰보기(rows, 뒤=뒤달, 최소=최소표본):
    """🛠 G812 «매일» 맞춰 보기 — 마지막 뒤(3)개월의 개찰을 하나씩, 그날 «앞» 개찰로만 예측(사이트가 날마다 다시 굽는 것과 같음 · 그날 것은 안 섞임)
       → 90% 범위(lo ~ hi) 적중률 · 가운데 오차(%p) · 갈래별(건수 · 적중 · 율 · 평균 폭) · 줄마다 한 줄"""
    if not rows:
        return {"n": 0, "적중": 0, "율": None, "오차": None, "자름": None, "학습": 0, "줄": [], "갈래": {}, "방식": "매일"}
    끝 = max(r["dt"] for r in rows)
    자름 = _달빼기(끝[:10], 뒤)
    시험 = [r for r in rows if r["dt"][:10] >= 자름]
    줄, 오차들, 갈래 = [], [], {}
    for r in 시험:
        날 = r["dt"][:10]
        p = 예측([x for x in rows if x["dt"][:10] < 날], r, 최소)
        if not p or p["표본적음"]:
            continue
        든 = p["lo"] <= r["br"] <= p["hi"]
        오차들.append(abs(r["br"] - p["q50"]))
        줄.append([r["no"], 날, r["kind"], round(p["lo"], 3), round(p["q50"], 3), round(p["hi"], 3), round(r["br"], 3), 1 if 든 else 0,
                  p["묶음"] + (" · 규칙 뒤" if p.get("규칙뒤") else "")])
        g = 갈래.setdefault(r["kind"], [0, 0, 0.0])
        g[0] += 1
        g[1] += 1 if 든 else 0
        g[2] += p["hi"] - p["lo"]
    n = len(줄)
    맞 = sum(x[7] for x in 줄)
    return {"n": n, "적중": 맞, "율": round(맞 * 100.0 / n, 1) if n else None, "오차": round(분위(오차들, 50), 3) if 오차들 else None,
            "자름": 자름, "학습": sum(1 for r in rows if r["dt"][:10] < 자름), "줄": 줄, "방식": "매일",
            "갈래": {k: {"n": v[0], "적중": v[1], "율": round(v[1] * 100.0 / v[0], 1), "폭": round(v[2] / v[0], 2)} for k, v in 갈래.items()}}


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
    if rows:
        열쇠모음.add(())                 # «전체» — 참고로만 싣고(운영자) 화면 예상에는 안 씀(G809)
    묶음뒤 = {}   # 🛠 G812 규칙 뒤(sm) 줄만 — 표본 최소 이상인 묶음만(화면은 이것부터 · 예측과 같은 차례)
    for t in sorted(열쇠모음, key=lambda t: (len(t), [str(x) for x in t])):
        rs = [r for r in rows if 맞는가(r, t)]
        if len(rs) >= 최소표본 or len(t) <= 1:
            s = 통계(rs)
            s["표본적음"] = len(rs) < 최소표본
            묶음[열쇠글(t)] = _둥글게(s)
        뒤 = [r for r in rs if r.get("sm")]
        if t and len(뒤) >= 최소표본:
            s = 통계(뒤)
            s["표본적음"] = False
            묶음뒤[열쇠글(t)] = _둥글게(s)
    맞 = 맞춰보기(rows)
    보임 = bool(맞["n"] >= 검증최소 and 맞["율"] is not None and 맞["율"] >= 적중기준)
    갈래보임 = sorted(k for k, v in (맞.get("갈래") or {}).items() if v["n"] >= 갈래검증최소 and v["율"] >= 적중기준)
    return {
        "_설명": "🏛 G807 종심제 균형가격 예측(균형÷기초 %) · 맞춰 보기 — 종심예측.py · 자료 data/seed/jongsim.json(건설맵이 공개 금액으로 다시 셈 · 근사값)",
        "t": now.strftime("%Y-%m-%d %H:%M"), "n": len(rows),
        "기간": [rows[0]["dt"][:10], rows[-1]["dt"][:10]] if rows else None,
        "갈래수": {k: sum(1 for r in rows if r["kind"] == k) for k in 갈래들 if any(r["kind"] == k for r in rows)},
        "묶음": 묶음, "묶음뒤": 묶음뒤, "맞춤": 맞, "보임": 보임, "갈래보임": 갈래보임, "확인": bool(성적확인),
        "기준": {"범위": [아래, 위], "적중": 적중기준, "검증최소": 검증최소, "갈래검증최소": 갈래검증최소, "최소표본": 최소표본, "뒤달": 뒤달, "점": list(점들), "맞춤": "매일"},
    }


def 개찰표(js, now=None):
    """🛠 G813 개찰 뒤 실제 균형가격 — 공고번호 → [개찰일시, 갈래, 배점, 기초, 균형, 예정, 받은 수, 셈에 든 수](원 · 정수) · 줄들() 과 같은 거름"""
    now = now or datetime.now(KST)
    표 = {}
    for no, r in ((js or {}).get("con") or {}).items():
        try:
            base, bal = float(r.get("base") or 0), float(r.get("bal") or 0)
        except (TypeError, ValueError):
            continue
        dt = str(r.get("dt") or "")[:16]
        if base <= 0 or bal <= 0 or len(dt) < 10 or not 60.0 <= bal * 100.0 / base <= 120.0:
            continue
        try:
            yp = int(float(r.get("yp") or 0))
        except (TypeError, ValueError):
            yp = 0
        try:
            pt = int(float(r.get("pt") or 0))
        except (TypeError, ValueError):
            pt = 0
        표[str(no)] = [dt, str(r.get("kind") or "종심"), pt, int(base), int(bal), yp if yp > 0 else None, int(r.get("n0") or r.get("n") or 0), int(r.get("n1") or 0)]
    return {"_설명": "🏛 G813 종심제 · 종합평가 개찰 — 건설맵이 공개 금액으로 다시 셈한 균형가격(근사) · 공고번호 → [개찰일시, 갈래, 배점, 기초, 균형, 예정(근사), 받은 수, 셈에 든 수]",
            "t": now.strftime("%Y-%m-%d %H:%M"), "n": len(표), "공고": 표}


def _쓰기(경로, d):
    os.makedirs(os.path.dirname(경로), exist_ok=True)
    tmp = 경로 + ".tmp"
    with io.open(tmp, "w", encoding="utf-8") as f:
        json.dump(d, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, 경로)


def build(out=OUT, src=SRC, log=print, now=None):
    try:
        with io.open(src, encoding="utf-8") as f:
            js = json.load(f)
    except FileNotFoundError:
        js = {"con": {}}
    d = 만들기(js, now)
    _쓰기(out, d)
    try:   # 🛠 G813 개찰 뒤 실제 균형가격 — 따로 한 장(예측 판이 커지지 않게) · 실패해도 예측 판은 그대로
        개 = 개찰표(js, now)
        _쓰기(os.path.join(os.path.dirname(out), "jongsim_open.json"), 개)
        log("🏛 종심 개찰 실제 균형가격 — %s건" % format(개["n"], ","))
    except Exception as e:   # noqa: BLE001
        log("🏛 종심 개찰 표 못 씀: %s" % e)
    m = d["맞춤"]
    log("🏛 종심 균형가격 예측 — 줄 %s · 묶음 %s(규칙 뒤 %s) · 매일 맞춰 보기 %s건 적중 %s%% · 보임 %s · 열린 갈래 %s"
        % (format(d["n"], ","), len(d["묶음"]), len(d["묶음뒤"]), m["n"], m["율"] if m["율"] is not None else "-", "예" if d["보임"] else "아니오",
           " · ".join(d["갈래보임"]) or "없음"))
    return d


if __name__ == "__main__":
    build()
