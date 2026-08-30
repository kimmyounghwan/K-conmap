# -*- coding: utf-8 -*-
"""
build_json.py — 3년치 낙찰 데이터를 사이트가 바로 읽는 정적 JSON으로 굽는다.

핵심 원칙
  1) 브라우저에는 큰 파일을 절대 보내지 않는다.
     이름 첫 글자로 색인(idx)을 나누고, 실제 집계는 200개씩 묶음(dat)으로 쪼갠다.
     사용자는 검색한 기관/업체가 든 묶음 하나만 내려받는다.
  2) 계산은 전부 여기서 미리 끝낸다. 사이트는 더하기 빼기만 한다.
  3) 결과는 web/public/data/ 에 떨어지고, 빌드하면 사이트에 그대로 실린다.
     → Firebase 읽기 0회. 서버 0대.

실행:  python build_json.py
"""
import os
import re
import json
import math
import shutil
from collections import Counter, defaultdict
from datetime import datetime

import pandas as pd

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "web", "public", "data")

# 원본 위치 — data/ 에 없으면 프로젝트 루트에서도 찾는다
SOURCES = [
    ("공사", ["data/bid_data_3years.zip", "bid_data_3years.zip",
              "data/bid_data_3years.csv", "bid_data_3years.csv"]),
    ("용역", ["data/service_data_3years.zip", "service_data_3years.zip",
              "data/service_data_3years.csv", "service_data_3years.csv"]),
]

CHUNK = 200          # 한 묶음에 담을 기관/업체 수
MIN_ROWS = 2         # 이보다 적으면 통계가 무의미해서 상세를 만들지 않음
HIST_TOP = 30        # 히스토그램은 상위 구간만 (파일 크기 방어)
CASES = 3            # 최근 사례 보관 건수
NAME_CUT = 34        # 공고명 자르기

STOPWORDS = {"공사", "용역", "설치", "사업", "시공", "및", "기타", "위한",
             "구입", "제작", "납품", "관리", "운영", "외", "년도", "정기"}

CORP_NOISE = ["주식회사", "(주)", "㈜", "유한회사", "합자회사", "(유)", "(합)", "주)", "유)"]

REGIONS = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기",
           "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"]
REGION_ALIAS = {
    "경기": ["경기"], "강원": ["강원"], "충북": ["충북", "충청북도"], "충남": ["충남", "충청남도"],
    "전북": ["전북", "전라북도"], "전남": ["전남", "전라남도"],
    "경북": ["경북", "경상북도"], "경남": ["경남", "경상남도"],
}


# ─────────────────────────────────────────────
# 유틸
# ─────────────────────────────────────────────
def log(msg):
    print(f"  {msg}", flush=True)


def find_source(paths):
    for p in paths:
        full = os.path.join(ROOT, p)
        if os.path.exists(full):
            return full
    return None


def read_any(path):
    comp = "zip" if path.lower().endswith(".zip") else None
    for enc in ("utf-8-sig", "cp949"):
        try:
            return pd.read_csv(path, compression=comp, encoding=enc, low_memory=False)
        except Exception:
            continue
    raise RuntimeError(f"읽기 실패: {path}")


def to_rate(v):
    """'74.746%' → 74.746 / 실패하면 None"""
    try:
        f = float(str(v).replace("%", "").strip())
        if math.isnan(f) or f <= 0 or f > 200:
            return None
        return f
    except Exception:
        return None


def to_amt(v):
    try:
        s = str(v).replace(",", "").replace("원", "").strip()
        return int(float(s))
    except Exception:
        return 0


def norm_corp(s):
    s = str(s)
    for t in CORP_NOISE:
        s = s.replace(t, "")
    return re.sub(r"\s+", "", s).strip()


def first_key(s):
    """샤드 키 = 이름 첫 글자의 유니코드 번호 (파일명 안전)"""
    s = str(s).strip()
    return str(ord(s[0])) if s else "0"


def hist_top(rates, unit, top):
    """투찰률을 unit 단위로 묶어 [[구간, 건수], ...] 상위 top개"""
    dec = 1 if unit >= 0.1 else 2
    c = Counter(round(math.floor(r / unit) * unit, dec) for r in rates)
    return [[k, v] for k, v in c.most_common(top)]


def stat(rates):
    n = len(rates)
    if n == 0:
        return None
    m = sum(rates) / n
    if n > 1:
        var = sum((r - m) ** 2 for r in rates) / (n - 1)
        sd = math.sqrt(var)
    else:
        sd = 0.0
    return {
        "avg": round(m, 3),
        "std": round(sd, 3),
        "min": round(min(rates), 2),
        "max": round(max(rates), 2),
        "med": round(sorted(rates)[n // 2], 3),
    }


def write_json(relpath, obj):
    path = os.path.join(OUT, relpath)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    return os.path.getsize(path)


# ─────────────────────────────────────────────
# 로딩
# ─────────────────────────────────────────────
def load_all():
    frames = []
    for kind, paths in SOURCES:
        p = find_source(paths)
        if not p:
            log(f"⚠️  {kind} 원본을 찾지 못했습니다 → 건너뜁니다")
            continue
        df = read_any(p)
        df["__kind"] = kind
        frames.append(df)
        log(f"{kind}: {len(df):,}건  ({os.path.basename(p)})")

    # inbox.py 가 정리해 둔 추가 자료도 함께 읽는다 (있으면)
    import glob as _glob
    for p in sorted(_glob.glob(os.path.join(ROOT, "data", "extra_*.csv"))):
        try:
            df = read_any(p)
            df["__kind"] = "추가"
            frames.append(df)
            log(f"추가자료: {len(df):,}건  ({os.path.basename(p)})")
        except Exception as e:
            log(f"⚠️  추가자료 읽기 실패 {os.path.basename(p)}: {e}")
    if not frames:
        raise SystemExit("❌ 원본 데이터가 하나도 없습니다. data/ 폴더에 zip 또는 csv를 넣어주세요.")
    df = pd.concat(frames, ignore_index=True)

    for c in ("발주기관", "1순위업체", "공고명", "투찰률", "투찰금액", "날짜"):
        if c not in df.columns:
            df[c] = ""
    df["rate"] = df["투찰률"].map(to_rate)
    df["amt"] = df["투찰금액"].map(to_amt)
    df["dt"] = pd.to_datetime(df["날짜"], errors="coerce")
    df["발주기관"] = df["발주기관"].fillna("").astype(str).str.strip()
    df["1순위업체"] = df["1순위업체"].fillna("").astype(str).str.strip()
    df["공고명"] = df["공고명"].fillna("").astype(str).str.strip()
    return df


# ─────────────────────────────────────────────
# 1. 발주기관 집계
# ─────────────────────────────────────────────
def build_agency(df):
    log("발주기관 집계 중...")
    idx = defaultdict(dict)      # 첫글자 → {기관명: [건수, 묶음번호]}
    chunks = []                  # [{기관명: 집계}, ...]
    cur, cur_n = {}, 0
    written = 0

    groups = df[df["발주기관"] != ""].groupby("발주기관", sort=False)
    order = sorted(groups.groups.keys(), key=lambda k: (first_key(k), k))

    for name in order:
        g = groups.get_group(name)
        n = len(g)
        rates = [r for r in g["rate"].tolist() if r is not None and not pd.isna(r)]
        if n < MIN_ROWS or not rates:
            continue

        st = stat(rates)
        corp_counts = Counter(g["1순위업체"])
        corp_counts.pop("", None)
        top_corps = corp_counts.most_common(7)
        total_corp = sum(corp_counts.values()) or 1

        dts = g["dt"].dropna()
        monthly = [0] * 12
        yearly = Counter()
        for d in dts:
            monthly[d.month - 1] += 1
            yearly[str(d.year)] += 1

        amts = [a for a in g["amt"].tolist() if a > 0]
        amt = None
        if amts:
            amts_s = sorted(amts)
            amt = {"avg": int(sum(amts) / len(amts)), "min": amts_s[0],
                   "max": amts_s[-1], "med": amts_s[len(amts_s) // 2]}

        recent = g.sort_values("dt", ascending=False).head(CASES)
        cases = [[
            (str(r["공고명"])[:NAME_CUT]),
            (r["dt"].strftime("%Y-%m-%d") if pd.notna(r["dt"]) else ""),
            str(r["1순위업체"])[:24],
            (round(r["rate"], 3) if r["rate"] is not None and not pd.isna(r["rate"]) else None),
            int(r["amt"] or 0),
        ] for _, r in recent.iterrows()]

        cur[name] = {
            "n": n,
            "kind": g["__kind"].mode().iat[0] if not g["__kind"].mode().empty else "공사",
            "s": st,
            "h1": hist_top(rates, 0.1, HIST_TOP),
            "h01": hist_top(rates, 0.01, HIST_TOP + 20),
            "corps": [[c[:26], v] for c, v in top_corps],
            "mono": round(top_corps[0][1] / total_corp * 100, 1) if top_corps else 0,
            "m": monthly,
            "y": dict(sorted(yearly.items())),
            "amt": amt,
            "cases": cases,
        }
        idx[first_key(name)][name] = [n, len(chunks)]
        cur_n += 1
        if cur_n >= CHUNK:
            chunks.append(cur)
            cur, cur_n = {}, 0
    if cur:
        chunks.append(cur)

    for i, ch in enumerate(chunks):
        written += write_json(f"agency/dat/{i}.json", ch)
    for k, v in idx.items():
        written += write_json(f"agency/idx/{k}.json", v)

    # 건수 상위 300개는 첫 화면 추천용으로 따로
    top = sorted(
        ((nm, meta[0], meta[1]) for d in idx.values() for nm, meta in d.items()),
        key=lambda x: -x[1])[:300]
    write_json("agency/top.json", [[t[0], t[1], t[2]] for t in top])

    log(f"발주기관 {sum(len(c) for c in chunks):,}곳 / 묶음 {len(chunks)}개 / {written/1024/1024:.1f}MB")
    return sum(len(c) for c in chunks)


# ─────────────────────────────────────────────
# 2. 업체 집계 (자가진단)
# ─────────────────────────────────────────────
def build_corp(df):
    log("업체 집계 중...")
    idx = defaultdict(dict)
    chunks = []
    cur, cur_n = {}, 0
    written = 0

    d2 = df[df["1순위업체"] != ""].copy()
    d2["ckey"] = d2["1순위업체"].map(norm_corp)
    d2 = d2[d2["ckey"] != ""]

    groups = d2.groupby("ckey", sort=False)
    order = sorted(groups.groups.keys(), key=lambda k: (first_key(k), k))

    for key in order:
        g = groups.get_group(key)
        n = len(g)
        rates = [r for r in g["rate"].tolist() if r is not None and not pd.isna(r)]

        region = Counter()
        for inst, nm in zip(g["발주기관"], g["공고명"]):
            blob = f"{inst} {nm}"
            for reg in REGIONS:
                pats = REGION_ALIAS.get(reg, [reg])
                if any(p in blob for p in pats):
                    region[reg] += 1
                    break

        dts = g["dt"].dropna()
        monthly = [0] * 12
        yearly = Counter()
        for d in dts:
            monthly[d.month - 1] += 1
            yearly[str(d.year)] += 1

        amts = [a for a in g["amt"].tolist() if a > 0]
        recent = g.sort_values("dt", ascending=False).head(CASES)

        cur[key] = {
            "name": str(g["1순위업체"].mode().iat[0])[:40],
            "n": n,
            "s": stat(rates),
            "h": hist_top(rates, 0.5, 12) if rates else [],
            "reg": dict(region.most_common(8)),
            "m": monthly,
            "y": dict(sorted(yearly.items())),
            "inst": [[str(i)[:26], v] for i, v in Counter(g["발주기관"]).most_common(5)],
            "amt": {"avg": int(sum(amts) / len(amts)), "max": max(amts)} if amts else None,
            "cases": [[
                str(r["공고명"])[:NAME_CUT],
                (r["dt"].strftime("%Y-%m-%d") if pd.notna(r["dt"]) else ""),
                str(r["발주기관"])[:24],
                (round(r["rate"], 3) if r["rate"] is not None and not pd.isna(r["rate"]) else None),
                int(r["amt"] or 0),
            ] for _, r in recent.iterrows()],
        }
        idx[first_key(key)][key] = [n, len(chunks)]
        cur_n += 1
        if cur_n >= CHUNK:
            chunks.append(cur)
            cur, cur_n = {}, 0
    if cur:
        chunks.append(cur)

    for i, ch in enumerate(chunks):
        written += write_json(f"corp/dat/{i}.json", ch)
    for k, v in idx.items():
        written += write_json(f"corp/idx/{k}.json", v)

    log(f"업체 {sum(len(c) for c in chunks):,}곳 / 묶음 {len(chunks)}개 / {written/1024/1024:.1f}MB")
    return sum(len(c) for c in chunks)


# ─────────────────────────────────────────────
# 3. 공고명 키워드 → 유사공고 낙찰 구간
#    (낙찰스코어 3번 항목 재료)
# ─────────────────────────────────────────────
def build_keyword(df):
    log("유사공고 키워드 집계 중...")
    bag = defaultdict(list)
    for nm, rate in zip(df["공고명"], df["rate"]):
        if rate is None or pd.isna(rate):
            continue
        for w in set(re.findall(r"[가-힣]{2,}", str(nm))):
            if w in STOPWORDS or len(w) > 8:
                continue
            bag[w].append(rate)

    shards = defaultdict(dict)
    kept = 0
    for w, rates in bag.items():
        if len(rates) < 5:          # 표본 5건 미만은 근거로 쓰지 않음
            continue
        c = Counter(round(math.floor(r / 0.1) * 0.1, 1) for r in rates)
        best, cnt = c.most_common(1)[0]
        shards[first_key(w)][w] = [len(rates), best, round(sum(rates) / len(rates), 2),
                                   round(cnt / len(rates) * 100)]
        kept += 1

    written = 0
    for k, v in shards.items():
        written += write_json(f"kw/{k}.json", v)
    log(f"키워드 {kept:,}개 / 샤드 {len(shards)}개 / {written/1024/1024:.1f}MB")
    return kept


# ─────────────────────────────────────────────
# 4. 전체 시장 요약 (홈 상단 띠)
# ─────────────────────────────────────────────
def build_overview(df, n_agency, n_corp, n_kw):
    rates = [r for r in df["rate"].tolist() if r is not None and not pd.isna(r)]
    dts = df["dt"].dropna()
    ov = {
        "built": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "rows": int(len(df)),
        "agencies": n_agency,
        "corps": n_corp,
        "keywords": n_kw,
        "rate": stat(rates),
        "hist": hist_top(rates, 0.5, 30),
        "from": dts.min().strftime("%Y-%m-%d") if len(dts) else "",
        "to": dts.max().strftime("%Y-%m-%d") if len(dts) else "",
        "byKind": {k: int(v) for k, v in df["__kind"].value_counts().items()},
    }
    write_json("overview.json", ov)
    log(f"기간 {ov['from']} ~ {ov['to']} / 총 {ov['rows']:,}건")
    return ov


# ─────────────────────────────────────────────
def main():
    t0 = datetime.now()
    print("=" * 52)
    print("  K-건설맵 정적 데이터 빌드")
    print("=" * 52)

    for sub in ("agency", "corp", "kw"):
        p = os.path.join(OUT, sub)
        if os.path.isdir(p):
            shutil.rmtree(p)
    os.makedirs(OUT, exist_ok=True)

    df = load_all()
    n_ag = build_agency(df)
    n_co = build_corp(df)
    n_kw = build_keyword(df)
    build_overview(df, n_ag, n_co, n_kw)

    total = sum(os.path.getsize(os.path.join(r, f))
                for r, _, fs in os.walk(OUT) for f in fs)
    files = sum(len(fs) for _, _, fs in os.walk(OUT))
    print("-" * 52)
    print(f"✅ 완료  파일 {files:,}개 / {total/1024/1024:.1f}MB / {(datetime.now()-t0).seconds}초")
    print(f"   위치: {OUT}")


if __name__ == "__main__":
    main()
