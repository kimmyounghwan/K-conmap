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
    # 2026-08-31 — 용역 제외. 3년치 482,630건 중 363,783건(75%)이 용역이라
    #   빼면 집계 파일이 크게 줄고 사이트가 가벼워집니다.
    #   되돌리려면 아래 두 줄의 주석을 풀면 됩니다. 원본 zip 은 지우지 않았습니다.
    # ("용역", ["data/service_data_3years.zip", "service_data_3years.zip",
    #           "data/service_data_3years.csv", "service_data_3years.csv"]),
]

# 최근 몇 년치만 쓸지. «3년 창»이 굴러가게 하는 값입니다.
#   오래된 자료를 계속 안고 가면 4년·5년치가 되면서
#   지금과 다른 옛날 투찰 관행이 평균을 끌어당깁니다.
#   집계할 때마다 이 창 밖의 자료는 자동으로 빠집니다.
WINDOW_YEARS = int(os.environ.get("WINDOW_YEARS", "3"))

# 한 묶음에 담을 기관/업체 수.
#   사용자는 검색한 업체가 든 «묶음 하나» 만 내려받습니다.
#   200개씩 담으면 한 번에 139KB(압축 30KB), 50개씩이면 그 1/4 입니다.
#   파일 수는 늘지만 Firebase 저장 한도(10GB)에 견주면 아무것도 아니고,
#   전송량(월 10GB)이 실제 비용이 걸리는 곳이라 이쪽을 아낍니다.
CHUNK = 50
MIN_ROWS = 2         # 이보다 적으면 통계가 무의미해서 상세를 만들지 않음
HIST_TOP = 30        # 히스토그램은 상위 구간만 (파일 크기 방어)
CASES = 3            # 최근 사례 보관 건수
CORP_MIN_SPLIT = 2   # 법인 단위로 따로 만들 최소 표본
NAME_CUT = 34        # 공고명 자르기

# ── 권장 투찰률의 근거가 되는 값들 (역검증 106,534건으로 정한 숫자) ──
HOT_DAYS = 30        # 전국 최빈 낙찰률을 볼 창. 90일은 제도 바뀔 때 실격추천 43%까지 뜀
HOT_DAYS_FAST = 14   # 제도 변동이 감지되면 이 창으로 좁힌다
HOT_OFFSET = 0.20    # 권장 = 최빈 − 0.20%p. 최빈에 딱 맞추면 승률 50.7%, 여기선 67.0%
KW_DAYS = 90         # 유사공고 창
REGIME_GAP = 0.3     # 최빈값이 이만큼(%p) 움직이면 제도 변동 경보
REGIME_MIN_N = 150   # 표본이 이보다 적으면 경보를 울리지 않는다 (연휴 오탐 방지)

# 어느 공고에나 들어가는 말은 «비슷한 공고»의 근거가 되지 못합니다.
# «입찰» 하나로 681건이 묶여서 아무 의미 없는 최빈값이 나오던 것을 막습니다.
STOPWORDS = {"공사", "용역", "설치", "사업", "시공", "및", "기타", "위한",
             "구입", "제작", "납품", "관리", "운영", "외", "년도", "정기",
             "입찰", "공고", "재공고", "긴급", "일반", "제한", "지명경쟁",
             "수의시담", "견적", "제출", "총괄분", "분리발주", "관급",
             "구매", "임차", "위탁", "본공사", "추가", "변경", "신규",
             "사업소", "지사", "본부", "관리소", "센터", "확정", "낙찰"}

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

    # ⚠️ 중복 제거 — 없으면 계산이 틀어집니다.
    #   3년치 원본과 매일 수집분(extra_collected.csv)은 구간이 겹칩니다.
    #   같은 공고가 두 번 세어지면 발주기관 평균·최다구간이 그쪽으로 쏠립니다.
    #   먼저 들어온 것(3년치 원본)을 남깁니다.
    before = len(df)
    if "공고번호" in df.columns:
        key = df["공고번호"].fillna("").astype(str).str.strip()
        has = key != ""
        # 공고번호가 있는 줄은 번호로, 없는 줄은 내용으로 중복을 판단
        df = pd.concat([
            df[has].loc[~key[has].duplicated(keep="first")],
            df[~has],
        ], ignore_index=True)
    df = df.drop_duplicates(
        subset=[c for c in ("발주기관", "공고명", "날짜", "1순위업체", "투찰금액")
                if c in df.columns],
        keep="first").reset_index(drop=True)
    if before != len(df):
        log(f"중복 {before - len(df):,}건 제거 → {len(df):,}건")

    for c in ("발주기관", "1순위업체", "공고명", "투찰률", "투찰금액", "날짜"):
        if c not in df.columns:
            df[c] = ""
    df["rate"] = df["투찰률"].map(to_rate)
    df["amt"] = df["투찰금액"].map(to_amt)
    # ⚠️ 날짜 형식이 두 가지로 섞여 있습니다.
    #    3년치 원본은 '2022-11-14 15:00:00', 매일 수집분은 '2026-08-31' 입니다.
    #    pd.to_datetime 에 그냥 넘기면 첫 줄 형식으로 고정해버려서
    #    뒤에 오는 수집분 날짜가 전부 버려집니다(NaT).
    #    → 실제로 2026-05 이후 78,064건의 날짜가 통째로 날아가 있었습니다.
    #    그래서 앞 10자리로 잘라 맞춰보고, 안 되면 숫자만 남겨 다시 시도합니다.
    _d = df["날짜"].astype(str).str.strip()
    df["dt"] = pd.to_datetime(
        _d.str.slice(0, 10), format="%Y-%m-%d", errors="coerce"
    ).fillna(pd.to_datetime(
        _d.str.replace(r"[^0-9]", "", regex=True).str.slice(0, 8),
        format="%Y%m%d", errors="coerce"))
    # ── 최근 WINDOW_YEARS 년만 남긴다 (창이 굴러간다) ──
    if WINDOW_YEARS > 0:
        cut = pd.Timestamp.now().normalize() - pd.DateOffset(years=WINDOW_YEARS)
        n0 = len(df)
        bad = int(df["dt"].isna().sum())
        df = df[df["dt"].notna() & (df["dt"] >= cut)].reset_index(drop=True)
        log(f"최근 {WINDOW_YEARS}년만 사용 ({cut.date()} 이후) — "
            f"{n0 - len(df):,}건 제외 → {len(df):,}건")
        if bad:
            log(f"⚠️  날짜를 못 읽은 {bad:,}건도 함께 빠졌습니다 (형식 확인 필요)")

    df["발주기관"] = df["발주기관"].fillna("").astype(str).str.strip()
    df["1순위업체"] = df["1순위업체"].fillna("").astype(str).str.strip()
    df["공고명"] = df["공고명"].fillna("").astype(str).str.strip()

    # ── 업체 사업자번호 ──────────────────────────
    #   같은 이름의 다른 법인이 아주 많습니다.
    #   «대영건설» 이라는 이름 하나에 서로 다른 법인이 40곳 있습니다.
    #   3년치 이름 37,301개 중 6,756개(18%)가 여러 법인이 섞인 이름이고,
    #   그 이름들이 낙찰 55,115건(46%)을 차지합니다.
    #   원자료 «전체업체» 가 '업체명^사업자번호^대표^금액^투찰률' 이라 번호를 꺼낼 수 있습니다.
    if "전체업체" in df.columns:
        head = df["전체업체"].fillna("").astype(str).str.split("|").str[0]
        part = head.str.split("^")
        df["bizno"] = (part.str[1].fillna("").astype(str)
                       .str.replace(r"[^0-9]", "", regex=True))
        df["ceo"] = part.str[2].fillna("").astype(str).str.strip().str.slice(0, 12)
    else:
        df["bizno"] = ""
        df["ceo"] = ""
    if "사업자번호" in df.columns:   # 수집분에 실려 오기 시작한 경우
        b2 = (df["사업자번호"].fillna("").astype(str)
              .str.replace(r"[^0-9]", "", regex=True))
        df["bizno"] = df["bizno"].where(df["bizno"].astype(str) != "", b2)
    df["bizno"] = df["bizno"].fillna("").astype(str)
    df["bizno"] = df["bizno"].where(df["bizno"].str.len() == 10, "")
    df["ceo"] = df["ceo"].fillna("").astype(str)

    # ── 사정률 역산 ──────────────────────────────
    #   예정가격 = 낙찰금액 ÷ 투찰률,  사정률 = 예정가격 ÷ 기초금액
    #   기초금액이 실린 줄(매일 수집분)에서만 구할 수 있습니다.
    #   이 값이 «내가 얼마를 써야 하나»의 핵심 재료입니다.
    if "기초금액" in df.columns:
        base = df["기초금액"].map(to_amt)
        ok = (base > 0) & df["rate"].notna() & (df["rate"] > 0) & (df["amt"] > 0)
        sj = (df["amt"] / (df["rate"] / 100.0)) / base * 100.0
        # 예가범위는 보통 ±3% 입니다. 그 밖은 자료 오류로 보고 버립니다.
        df["sj"] = sj.where(ok & sj.between(95, 105))
    else:
        df["sj"] = None
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

    # groupby 결과를 한 번만 훑는다.
    # (예전에는 get_group 을 1만 번 넘게 불렀는데, 그때마다 전체를 다시 훑어
    #  기관 수가 늘수록 급격히 느려지고 중간에 멈추기도 했다)
    agg = {}
    for name, g in df[df["발주기관"] != ""].groupby("발주기관", sort=False):
        n = len(g)
        rates = [r for r in g["rate"].tolist() if r is not None and not pd.isna(r)]
        if n < MIN_ROWS or not rates:
            continue

        st = stat(rates)
        sjs = [v for v in g["sj"].tolist() if v is not None and not pd.isna(v)]
        sj_stat = stat(sjs) if len(sjs) >= 3 else None
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
            # 사정률 — 이 기관이 실제로 예정가격을 어디쯤에서 뽑았는지
            "sj": sj_stat,
            "sjn": len(sjs),
            "h1": hist_top(rates, 0.1, HIST_TOP),
            "h01": hist_top(rates, 0.01, HIST_TOP + 20),
            "corps": [[c[:26], v] for c, v in top_corps],
            "mono": round(top_corps[0][1] / total_corp * 100, 1) if top_corps else 0,
            "m": monthly,
            "y": dict(sorted(yearly.items())),
            "amt": amt,
            "cases": cases,
        }
        agg[name] = cur.pop(name)

    for name in sorted(agg, key=lambda k: (first_key(k), k)):
        cur[name] = agg[name]
        idx[first_key(name)][name] = [n_ := agg[name]["n"], len(chunks)]
        cur_n += 1
        if cur_n >= CHUNK:
            chunks.append(cur)
            cur, cur_n = {}, 0
    if cur:
        chunks.append(cur)
    agg.clear()

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
    d2["cname"] = d2["1순위업체"].map(norm_corp)
    d2 = d2[d2["cname"] != ""]

    # ── 같은 이름의 다른 법인을 갈라 놓습니다 ─────────────────
    #   «대영건설» 한 이름에 서로 다른 법인이 40곳 있습니다.
    #   합계만 보여주면 남의 실적을 자기 실적으로 착각합니다.
    #   그래서 이름 단위 기록 «대영건설» 과
    #   법인 단위 기록 «대영건설#5048113189» 을 둘 다 만듭니다.
    #   샤드 키는 «이름 첫 글자» 라서 검색은 그대로 됩니다.
    #
    #   번호가 없는 줄(수집분 일부)은 이름 단위에만 들어갑니다.
    #   오늘부터 쌓이는 자료에는 번호가 들어가므로 시간이 지나면 저절로 좋아집니다.
    d2["ckey"] = d2["cname"]
    sub = d2[d2["bizno"] != ""].copy()
    if len(sub):
        sub["ckey"] = sub["cname"] + "#" + sub["bizno"]
        # 표본이 너무 적은 법인까지 만들면 파일만 무거워집니다
        keep = sub.groupby("ckey")["ckey"].transform("size") >= CORP_MIN_SPLIT
        sub = sub[keep]
        # 이름 안에 법인이 하나뿐이면 굳이 나눌 이유가 없습니다
        multi = d2[d2["bizno"] != ""].groupby("cname")["bizno"].nunique()
        multi = set(multi[multi > 1].index)
        sub = sub[sub["cname"].isin(multi)]
    if len(sub):
        d2 = pd.concat([d2, sub], ignore_index=True)
        log(f"  동명 법인 분리 {sub['ckey'].nunique():,}곳 (표본 {CORP_MIN_SPLIT}건 이상)")

    agg = {}
    for key, g in d2.groupby("ckey", sort=False):
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

        # 같은 이름으로 묶인 «서로 다른 법인» 들을 낱낱이 적어둔다.
        # 합쳐진 숫자를 그냥 보여주면 남의 실적을 자기 실적으로 착각합니다.
        bzc = Counter()
        bceo = {}
        for bz, ce in zip(g["bizno"], g["ceo"]):
            if bz:
                bzc[bz] += 1
                if ce and bz not in bceo:
                    bceo[bz] = ce
        firms = [[bz, bceo.get(bz, ""), c] for bz, c in bzc.most_common(8)]

        is_sub = "#" in key
        cur[key] = {
            "name": str(g["1순위업체"].mode().iat[0])[:40],
            # 법인 단위 기록이면 사업자번호·대표자를 함께 싣습니다
            "biz": key.split("#", 1)[1] if is_sub else "",
            "ceo": (str(g["ceo"].mode().iat[0])[:12]
                    if is_sub and not g["ceo"].mode().empty else ""),
            "n": n,
            # bzn: 이 이름에 섞여 있는 법인 수 · bzk: 번호가 확인된 건수 · bz: 법인 목록
            "bzn": len(bzc),
            "bzk": int(sum(bzc.values())),
            "bz": firms,
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
        agg[key] = cur.pop(key)

    for key in sorted(agg, key=lambda k: (first_key(k), k)):
        cur[key] = agg[key]
        _r = agg[key].get("reg") or {}
        idx[first_key(key)][key] = [agg[key]["n"], len(chunks),
                                    agg[key].get("bzn", 0),
                                    next(iter(_r), ""),
                                    agg[key].get("ceo", "")]
        cur_n += 1
        if cur_n >= CHUNK:
            chunks.append(cur)
            cur, cur_n = {}, 0
    if cur:
        chunks.append(cur)
    agg.clear()

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
    # ⚠️ 반드시 최근 자료만 씁니다.
    #   2025년에 낙찰하한율 체제가 바뀌면서 낙찰률 대역이 통째로 이동했습니다.
    #   과거 전체로 최빈값을 잡으면 2025Q3 오차가 1.763%p 까지 벌어졌고,
    #   최근 90일로 자르면 0.278%p 로 줄었습니다 (역검증 106,534건).
    kcut = pd.Timestamp.now().normalize() - pd.Timedelta(days=KW_DAYS)
    dk = df[df["dt"].notna() & (df["dt"] >= kcut)]
    if len(dk) < 500:      # 자료가 너무 적으면 창을 넓힌다
        dk = df[df["dt"].notna() & (df["dt"] >= kcut - pd.Timedelta(days=KW_DAYS))]
    log(f"유사공고 키워드 집계 중... (최근 {KW_DAYS}일 {len(dk):,}건)")
    bag = defaultdict(list)
    for nm, rate in zip(dk["공고명"], dk["rate"]):
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
# 3.5 전국 최근창 최빈 낙찰률 + 제도 변동 감시
#
#     이 사이트에서 제일 중요한 숫자입니다.
#     역검증 106,534건 결과:
#       · 발주기관별 핫존은 쓰면 안 됩니다.
#         표본 80건 쌓인 기관에서도 전국값이 4.6%p 이겼습니다.
#       · 창은 30일. 90일은 제도가 바뀔 때 실격추천이 43%까지 뜁니다.
#       · 최빈값에 딱 맞추면 안 됩니다. 최빈값은 낙찰하한율보다
#         중앙값 0.30%p 위에 있어서, 맞추면 낙찰자보다 높아 집니다.
#         0.20%p 낮추면 승률 50.7% → 67.0% 로 올라갑니다.
# ─────────────────────────────────────────────
def mode_rate(rates, unit=0.1):
    if not rates:
        return None, 0
    c = Counter(round(math.floor(r / unit) * unit, 2) for r in rates)
    best, cnt = c.most_common(1)[0]
    return best, cnt


def rates_within(df, days, offset=0):
    """오늘로부터 offset일 전을 끝으로, 그 앞 days일치 낙찰률."""
    end = pd.Timestamp.now().normalize() - pd.Timedelta(days=offset)
    beg = end - pd.Timedelta(days=days)
    g = df[df["dt"].notna() & (df["dt"] >= beg) & (df["dt"] < end)]
    return [r for r in g["rate"].tolist() if r is not None and not pd.isna(r)]


def build_hot(df):
    def win(days):
        rs = rates_within(df, days)
        m1, c1 = mode_rate(rs, 0.1)
        m01, _ = mode_rate([r for r in rs if m1 is not None and m1 <= r < m1 + 0.1], 0.01)
        return {
            "win": days,
            "n": len(rs),
            "mode": m1,
            "mode01": m01,
            "rec": round(m1 - HOT_OFFSET, 2) if m1 is not None else None,
            "top": hist_top(rs, 0.1, 8),
        }

    hot30 = win(HOT_DAYS)
    hot14 = win(HOT_DAYS_FAST)

    # 제도 변동 감시 — 3년치에 돌려보니 3년간 정확히 2번 울렸고 오탐 0건이었습니다.
    r7 = rates_within(df, 7)
    m7, _ = mode_rate(r7, 0.1)
    m30 = hot30["mode"]
    mPrev, _ = mode_rate(rates_within(df, 90, offset=30), 0.1)

    early = bool(m7 is not None and m30 is not None
                 and len(r7) >= REGIME_MIN_N
                 and abs(m7 - m30) >= REGIME_GAP)
    confirmed = bool(m30 is not None and mPrev is not None
                     and abs(m30 - mPrev) >= REGIME_GAP)

    regime = {
        "m7": m7, "n7": len(r7),
        "m30": m30, "mPrev90": mPrev,
        "shift7": round(abs(m7 - m30), 2) if (m7 is not None and m30 is not None) else None,
        "shift30": round(abs(m30 - mPrev), 2) if (m30 is not None and mPrev is not None) else None,
        "early": early,
        "confirmed": confirmed,
    }
    # 경보가 울리면 좁은 창을 쓴다 (제도 전환기에는 14일이 훨씬 정확)
    use = hot14 if (early or confirmed) else hot30
    if early or confirmed:
        log(f"⚠️  제도 변동 감지 — 최근7일 최빈 {m7} / 최근30일 {m30} / 직전90일 {mPrev}")
        log(f"    권장 투찰률 산출 창을 {HOT_DAYS}일 → {HOT_DAYS_FAST}일 로 좁힙니다")
    log(f"권장 투찰률 {use['rec']}% "
        f"(최근 {use['win']}일 최빈 {use['mode']}% − {HOT_OFFSET} / 표본 {use['n']:,}건)")
    return {"hot": use, "hot30": hot30, "hot14": hot14, "regime": regime,
            "offset": HOT_OFFSET}


# ─────────────────────────────────────────────
# 3.7 가상 시뮬레이션 — 지난 개찰에 우리 방식을 대보기
#
#     «우리가 그때 이렇게 넣었으면 어땠을까» 를 실제 개찰로 확인합니다.
#     후보 사정률 10개를 각각 대입해, 그 금액이 실제 1순위보다 낮으면서
#     낙찰하한을 넘겼는지 봅니다. 넘겼으면 «낙찰» 로 표시합니다.
#
#     ⚠️ 한계를 분명히 해둡니다.
#       조달청이 1순위(낙찰자)만 줍니다. 2위 이하 투찰 내역이 없습니다.
#       그래서 «실제 1순위보다 낮았다» 까지만 알 수 있고,
#       적격심사의 비가격 요소(경영상태·시공경험)는 반영하지 못합니다.
#       실제 승률은 여기 숫자보다 낮습니다. 화면에도 그렇게 적습니다.
# ─────────────────────────────────────────────
SIM_DAYS = 30        # 최근 며칠치 개찰로 시험할지
SIM_CASES = 24       # 화면에 보여줄 사례 수


def sj_candidates(sjs, k=10):
    """실측 사정률 분포를 10등분한 지점 — 이게 후보입니다.
    지어낸 값이 아니라 «실제로 이만큼 나왔다» 는 자리입니다."""
    if len(sjs) < 50:
        return []
    a = sorted(sjs)
    out = []
    for i in range(k):
        q = (i + 0.5) / k                     # 5%, 15%, ... 95%
        v = round(a[min(int(len(a) * q), len(a) - 1)], 4)
        if v not in out:
            out.append(v)
    return out


def build_sim(df, cands, rec_rate):
    if not cands or not rec_rate:
        return None

    cut = pd.Timestamp.now().normalize() - pd.Timedelta(days=SIM_DAYS)
    g = df[df["dt"].notna() & (df["dt"] >= cut)]
    if "기초금액" not in df.columns:
        return None
    base = g["기초금액"].map(to_amt)
    ok = (base > 0) & g["rate"].notna() & (g["rate"] > 0) & (g["amt"] > 0)
    g = g[ok].copy()
    g["base"] = base[ok]
    if not len(g):
        return None
    g = g.sort_values("dt", ascending=False)

    def limit_of(est):
        eok = est / 1e8
        if eok >= 100:
            return None
        if eok >= 50:
            return 87.495
        if eok >= 10:
            return 88.745
        return 89.745

    cases, hit_all, tried = [], 0, 0
    for _, r in g.iterrows():
        b = float(r["base"])
        win_amt = float(r["amt"])
        real_sj = (win_amt / (r["rate"] / 100.0)) / b * 100.0
        if not (95 <= real_sj <= 105):
            continue
        ll = limit_of(b / 1.1)
        marks = []
        for c in cands:
            yeje = b * (c / 100.0)
            amt = math.ceil(yeje * (rec_rate / 100.0))
            # 실제 예정가격(= 실제 사정률로 정해진 값) 기준으로 판정합니다
            real_yeje = b * (real_sj / 100.0)
            my_rate = (amt / real_yeje * 100.0) if real_yeje else 0
            passed = (ll is None or my_rate >= ll) and amt < win_amt
            marks.append([c, int(amt), bool(passed)])
        hits = sum(1 for m in marks if m[2])
        hit_all += hits
        tried += len(marks)
        if len(cases) < SIM_CASES:
            cases.append({
                "no": str(r.get("공고번호") or "")[:20],
                "name": str(r["공고명"])[:NAME_CUT],
                "inst": str(r["발주기관"])[:22],
                "dt": r["dt"].strftime("%Y-%m-%d"),
                "base": int(b),
                "win": int(win_amt),
                "rate": round(float(r["rate"]), 3),
                "sj": round(real_sj, 4),
                "ll": ll,
                "marks": marks,
                "hit": hits,
            })

    if not cases:
        return None
    won_any = sum(1 for c in cases if c["hit"] > 0)
    out = {
        "days": SIM_DAYS,
        "rate": rec_rate,
        "cands": cands,
        "n": len(cases),
        "hitRate": round(hit_all / tried * 100, 1) if tried else 0,
        "anyRate": round(won_any / len(cases) * 100, 1),
        "cases": cases,
    }
    write_json("sim.json", out)
    log(f"시뮬레이션 {len(cases)}건 · 후보 {len(cands)}개 중 평균 "
        f"{out['hitRate']}% 적중 · 한 개라도 맞은 공고 {out['anyRate']}%")
    return out


# ─────────────────────────────────────────────
# 4. 전체 시장 요약 (홈 상단 띠)
# ─────────────────────────────────────────────
def build_overview(df, n_agency, n_corp, n_kw):
    hot = build_hot(df)
    rates = [r for r in df["rate"].tolist() if r is not None and not pd.isna(r)]
    dts = df["dt"].dropna()
    sjs = [v for v in df["sj"].tolist() if v is not None and not pd.isna(v)]
    sj = stat(sjs) if len(sjs) >= 10 else None
    sjs_sorted = sorted(sjs)
    def _q(p):
        return round(sjs_sorted[int(len(sjs_sorted) * p)], 3) if sjs_sorted else None

    ov = {
        "built": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "rows": int(len(df)),
        "agencies": n_agency,
        "corps": n_corp,
        "keywords": n_kw,
        # 사정률 분포 — 투찰가 계산기의 «예정가격이 어디쯤 나올까» 재료
        "sj": sj,
        "sjn": len(sjs),
        "sjq": {"p10": _q(0.10), "p25": _q(0.25), "p50": _q(0.50),
                "p75": _q(0.75), "p90": _q(0.90)} if sjs_sorted else None,
        # 권장 투찰률 — 바로투찰 화면의 기본값
        "hot": hot["hot"],
        "hot30": hot["hot30"],
        "hot14": hot["hot14"],
        "regime": hot["regime"],
        "hotOffset": hot["offset"],
        # 사정률 후보 10개 — 지어낸 값이 아니라 실측 분포를 10등분한 지점
        "sjc": sj_candidates(sjs, 10),
        "kwDays": KW_DAYS,
        "rate": stat(rates),
        "hist": hist_top(rates, 0.5, 30),
        "from": dts.min().strftime("%Y-%m-%d") if len(dts) else "",
        "to": dts.max().strftime("%Y-%m-%d") if len(dts) else "",
        "byKind": {k: int(v) for k, v in df["__kind"].value_counts().items()},
    }
    write_json("overview.json", ov)
    build_sim(df, ov["sjc"], (hot["hot"] or {}).get("rec"))
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
