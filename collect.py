# -*- coding: utf-8 -*-
"""
collect.py — 조달청 나라장터에서 최근 공고·개찰 결과를 받아온다.

기존 auto_collector.py 와 다른 점
  · Firebase 에 쓰지 않는다. 파일로 떨군다 → 읽기/쓰기 과금 0
  · 받은 것을 data/store/ 에 누적 보관하고,
    사이트에는 최근 것만 잘라서 web/public/data/ 로 내보낸다
  · API 키를 코드에 박지 않고 .env 에서 읽는다

실행
  python collect.py              최근 3일 (평소 운영)
  python collect.py --days 10    최근 10일
  python collect.py --backfill 90  90일치 몰아서 채우기 (최초 1회)
"""
import io
import os
import re
import csv
import json
import time
import argparse
import urllib.parse
from datetime import datetime, timedelta, timezone

import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

ROOT = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(ROOT, "data", "store")
OUT = os.path.join(ROOT, "web", "public", "data")
KST = timezone(timedelta(hours=9))

KEEP_DAYS = 70      # 파일로 보관하는 기간 (10주 — 여유를 두고 보관)
SHOW_DAYS = 49      # 사이트에 싣는 기간 (7주)
MAX_ROWS = 300      # first.json / live.json 에 싣는 건수 (첫 화면·옛 사이트용)
BOARD_CHUNK = 500   # 한 달치를 나눠 담는 묶음 크기

# 2026-08-31 — 용역을 빼고 «공사»만 다룹니다.
#   3년치 482,630건 중 용역이 363,783건(75%)이라, 빼면 사이트가 크게 가벼워집니다.
#   되돌리려면 여기에 "serv" 를 다시 넣기만 하면 됩니다. 원본 파일은 지우지 않았습니다.
KINDS = ("con",)

# 3년치 원본과 같은 모양으로 계속 쌓이는 누적 파일.
# build_json.py 가 data/extra_*.csv 를 자동으로 함께 읽으므로,
# 이 파일만 자라면 «3년치 분석»이 저절로 최신 상태를 유지한다.
# (store/*.json 은 45일이면 잘리므로 분석용 이력은 여기에 남긴다)
# 달마다 파일을 나눕니다.
#   자동화(GitHub)가 매일 이 파일을 저장소에 올리는데, 한 덩어리로 두면
#   14MB 파일이 매일 통째로 다시 올라가 저장소가 금방 무거워집니다.
#   달별로 쪼개면 이번 달 것(1~2MB)만 바뀝니다.
#   build_json.py 는 data/extra_*.csv 를 전부 읽으므로 그대로 동작합니다.
ARCHIVE_DIR = os.path.join(ROOT, "data")


def archive_path(ym):
    return os.path.join(ARCHIVE_DIR, f"extra_{ym}.csv")
# 사업자번호를 반드시 남깁니다.
#   같은 이름의 다른 법인이 아주 많습니다 — «대영건설» 한 이름에 법인 40곳.
#   3년치의 46%가 그런 이름이라, 번호가 없으면 업체 화면 절반이 남의 실적입니다.
#   조달청 응답에 이미 들어 있는데(업체명^사업자번호^대표^금액^투찰률) 그동안 버리고 있었습니다.
# ⚠️ A값 칸을 넣은 이유 —
#   가상 시뮬레이션의 «합격 판정»에 A값이 필요한데, 개찰결과 API 는 A값을 주지 않습니다.
#   그래서 그동안 «A값 5% 가정» 으로 돌렸습니다. 가정은 결과를 흔듭니다.
#   A값은 «공고» 쪽 오퍼레이션에만 있으므로, 받아 둘 때 누적 CSV 에도 같이 적어
#   앞으로는 실제값으로 시뮬레이션합니다.
# ⚠️ 예가범위·참가업체수 칸을 뒤늦게 넣은 이유 (2026-09-03) —
#   가상 시뮬레이션이 이 CSV 만 읽는데, 여기에 예가범위가 없어서
#   **모든 공고를 ±3% 로 가정**하고 있었습니다. 실제로는 11.1%가 ±2% 입니다.
#   ±2% 는 사정률 폭이 좁아 σ 가 0.7676 → 0.5118 로 달라지고,
#   등급도 +1 이 아니라 −2 를 받아야 합니다. 즉 화면과 시뮬레이션이 어긋나 있었습니다.
#   참가업체수는 «무작위로 넣었으면 1/N» 이라는 비교 기준을 내기 위한 것입니다.
#   옛 줄에는 이 칸이 비어 있습니다 — 오늘부터 쌓입니다.
ARCH_COLS = ["공고번호", "날짜", "발주기관", "공고명",
             "1순위업체", "사업자번호", "대표자", "투찰금액", "투찰률", "기초금액",
             "A값", "A값적용", "예가하한", "예가상한", "참가업체수"]

BASE = "http://apis.data.go.kr/1230000"
ENDPOINTS = {
    ("first", "con"):  f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwk",
    ("first", "serv"): f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoServc",
    ("live",  "con"):  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk",
    ("live",  "serv"): f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServc",
}

# ══════════════════════════════════════════════════════════════
#  ★ 개찰 순위 (1위 ~ 꼴찌) — 2026-09-02 발견
#
#  «조달청은 1순위만 준다» 고 제가 두 번 말했습니다. **둘 다 틀렸습니다.**
#  아래 오퍼레이션이 투찰업체를 **전부** 줍니다. 다만 조건이 있습니다:
#     · 날짜로 부르면 아무것도 안 옵니다
#     · **공고번호(bidNtceNo + bidNtceOrd)로 불러야** 옵니다
#  예전 진단은 날짜로만 두드렸고, 저는 그 빈 응답을 «없다» 로 읽었습니다.
#
#  실제 응답 항목:
#     opengRank(개찰순위) · prcbdrNm(투찰업체) · prcbdrBizno · prcbdrCeoNm
#     bidprcAmt(투찰금액) · bidprcrt(투찰률) · bidprcDt(투찰일시)
#     drwtNo1 · drwtNo2 (그 업체가 뽑은 예비가격 추첨번호)
# ══════════════════════════════════════════════════════════════
OPENG_RANK = f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoOpengCompt"

# 기초금액(예정가격 산정의 기준이 되는 금액). 공고 목록에는 안 들어있고 별도 오퍼레이션이다.
BSIS = {
    "con":  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwkBsisAmount",
    "serv": f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServcBsisAmount",
}
# 목록조회로 못 채운 건은 공고번호로 하나씩 조회합니다.
#   A값까지 채우게 되면서 대상이 늘었습니다 (마감 전 공고 1,500건쯤).
#   한 번에 250건이면 하루 세 번 돌아 이틀이면 다 찹니다.
#   조달청이 먹통이면 차단기가 8번 만에 끊으므로 오래 붙잡히지 않습니다.
BSIS_ONE_CAP = 250

# 면허·업종 제한. 입찰에서 이게 제일 먼저 걸리는 조건인데
# 공고 목록에는 안 들어 있고 별도 오퍼레이션으로 옵니다.
# 낙찰자 상세. 2026-09-02 진단으로 확인했습니다.
#   bidwinnrNm / bidwinnrBizno / bidwinnrCeoNm / bidwinnrAdrs / bidwinnrTelNo
#   sucsfbidAmt / sucsfbidRate / prtcptCnum(참가업체수) 까지 옵니다.
#   개찰결과 오퍼레이션에는 주소·전화가 없어서 이걸 따로 받습니다.
SCSBID = {
    "con":  f"{BASE}/as/ScsbidInfoService/getScsbidListSttusCnstwk",
    "serv": f"{BASE}/as/ScsbidInfoService/getScsbidListSttusServc",
}

LIC = {
    "con":  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoLicenseLimit",
    "serv": f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoLicenseLimit",
}


def load_env():
    """.env 를 읽어 환경변수로 (python-dotenv 없이도 동작)"""
    p = os.path.join(ROOT, ".env")
    if not os.path.exists(p):
        return
    with open(p, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def api_key():
    k = os.environ.get("G2B_API_KEY", "").strip()
    if not k:
        raise SystemExit(
            "❌ G2B_API_KEY 가 없습니다.\n"
            "   .env 파일을 만들고 아래 한 줄을 넣어주세요:\n"
            "   G2B_API_KEY=발급받은_디코딩_키")
    return urllib.parse.unquote(k)


# 조달청이 통째로 먹통일 때를 대비한 «차단기».
#   2026-09-01 에 조달청 API 가 전부 ConnectTimeout 이 났는데,
#   한 건당 25초씩 150건을 계속 기다리느라 배치가 40분 넘게 늘어졌다.
#   연달아 실패하면 이번 회차는 통신을 포기하고 넘어간다 — 자료는 누적분이 지킨다.
FIELDS_SEEN = set()      # 오퍼레이션별로 응답 항목 이름을 한 번씩만 찍기 위한 표시
DIAG = {}                # 진단 결과 — 사이트에 파일로 남겨 나중에 읽습니다
NET_FAILS = 0            # 연속 통신 실패 횟수
NET_DOWN = False         # 차단기가 내려갔는지
NET_LIMIT = 8            # 이만큼 연달아 실패하면 포기
NET_TIMEOUT = 15         # 한 건당 기다리는 시간(초)


def fetch(url, key, day=None, extra=None, label="", why=None):
    """why 에 dict 를 넘기면 실패 이유(HTTP·resultCode·resultMsg)를 담아 줍니다.
       진단에서 «응답 없음» 과 «필수값이 달라서 안 됨» 을 구별하기 위한 것입니다."""
    """조달청 공통 호출.
    예전에 기초금액이 '계속 실패'했던 건 대부분 조용히 삼켜서 원인이 안 보였기 때문이다.
    그래서 여기서는 HTTP 코드 / resultCode / 본문 앞머리를 반드시 찍는다."""
    global NET_FAILS, NET_DOWN
    if NET_DOWN:
        return []
    params = {
        "serviceKey": key, "numOfRows": "999", "pageNo": "1",
        "inqryDiv": "1", "type": "json",
    }
    if day is not None:
        d = day.strftime("%Y%m%d")
        params["inqryBgnDt"] = d + "0000"
        params["inqryEndDt"] = d + "2359"
    if extra:
        params.update(extra)
    tag = label or url.rsplit("/", 1)[-1]
    try:
        r = requests.get(url, params=params, timeout=NET_TIMEOUT, verify=False,
                         headers={"User-Agent": "Mozilla/5.0"})
    except Exception as e:
        NET_FAILS += 1
        print(f"    ! {tag} 통신 실패 ({type(e).__name__})")
        if NET_FAILS >= NET_LIMIT:
            NET_DOWN = True
            print(f"    ⛔ 조달청 통신이 {NET_LIMIT}번 연달아 실패했습니다. "
                  f"이번 회차는 수집을 건너뜁니다 — 사이트는 누적 자료로 그대로 올라갑니다.")
        return []
    NET_FAILS = 0
    if r.status_code != 200:
        print(f"    ! {tag} HTTP {r.status_code}")
        if why is not None:
            why.update({"http": r.status_code, "body": " ".join(r.text.split())[:200]})
        return []
    try:
        j = r.json()
    except Exception:
        head = " ".join(r.text.split())[:180]
        print(f"    ! {tag} JSON 아님 → {head}")
        if why is not None:
            why.update({"http": r.status_code, "json": False, "body": head})
        return []
    resp = j.get("response", {}) if isinstance(j, dict) else {}
    head = resp.get("header", {}) or {}
    code = str(head.get("resultCode", "")).strip()
    if code and code not in ("00", "0"):
        print(f"    ! {tag} 응답코드 {code} · {head.get('resultMsg', '')}")
        if why is not None:
            why.update({"http": r.status_code, "code": code,
                        "msg": str(head.get("resultMsg", ""))[:160]})
        return []
    items = (resp.get("body", {}) or {}).get("items", [])
    # 오퍼레이션마다 어떤 항목이 오는지 한 번씩 찍어봅니다.
    #   아이건설넷은 A값(사회보험료 등 법정경비)과 관급자재금액을 자동으로 채웁니다.
    #   그렇다면 조달청 응답 어딘가에 들어 있다는 뜻입니다. 그걸 찾으려는 것입니다.
    op = url.rsplit("/", 1)[-1]
    if op not in FIELDS_SEEN and isinstance(items, (list, dict)):
        one = items[0] if isinstance(items, list) and items else (
            items if isinstance(items, dict) else None)
        if isinstance(one, dict) and one:
            FIELDS_SEEN.add(op)
            DIAG[op] = {"fields": sorted(one.keys()),
                        "sample": {k: str(v)[:40] for k, v in list(one.items())[:60]}}
            print(f"    · [진단] {op} 항목: {', '.join(sorted(one.keys()))}")
            # A값·관급자재로 보이는 항목이 있으면 값까지 보여줍니다
            hint = {k: v for k, v in one.items()
                    if any(w in str(k).lower() for w in
                           ("insrnc", "sfty", "safe", "retire", "govsply", "gov",
                            "mtrl", "amt", "prce", "rate"))}
            if hint:
                print(f"    · [진단] {op} 금액·비율 항목: "
                      + ", ".join(f"{k}={v}" for k, v in list(hint.items())[:24]))
    if isinstance(items, dict):
        items = items.get("item", [items])
    if isinstance(items, str):
        return []
    return items or []


def pick(item, *names):
    """조달청 응답은 문서와 필드 대소문자가 다를 때가 있다 (bssamt vs bssAmt).
    이름을 소문자로 눕혀서 찾는다 — 기초금액이 늘 비어 보이던 진짜 원인."""
    if not isinstance(item, dict):
        return None
    low = {str(k).lower(): v for k, v in item.items()}
    for n in names:
        v = low.get(n.lower())
        if v not in (None, "", "-", "0"):
            return v
    return None


def to_int(v):
    try:
        return int(float(str(v).replace(",", "").strip()))
    except Exception:
        return 0


def to_rate(v):
    try:
        f = float(str(v).replace("%", "").strip())
        return round(f, 3) if 0 < f <= 200 else None
    except Exception:
        return None


def to_f(v):
    try:
        return round(float(str(v).replace("%", "").strip()), 3)
    except Exception:
        return None


def bsis_row(it):
    """기초금액 응답 한 줄 → 화면에 쓸 형태.
    base 예정가격 기준금액 / lo,hi 예가범위(%) / a,b 낙찰하한율 참고용"""
    base = to_int(pick(it, "bssamt", "bssAmt", "bsisAmt", "BssAmt", "basisAmt"))
    if not base:
        return None
    return {
        "base": base,
        "lo": to_f(pick(it, "rsrvtnPrceRngBgnRate", "rsrvtnPrceRngBgnRt")),
        "hi": to_f(pick(it, "rsrvtnPrceRngEndRate", "rsrvtnPrceRngEndRt")),
    }


# ── A값(법정경비) 항목들 ────────────────────────
#   2026-09-01 진단으로 확인했습니다. 조달청 기초금액 응답에 항목별로 다 들어 있습니다.
#   그동안 이걸 안 뒤져봐서 «API 로는 못 가져온다» 고 잘못 말했습니다.
#
#   A값은 투찰률을 곱하지 않고 그대로 더하는 금액입니다.
#       투찰금액 = (예정가격 − A값) × 투찰률 + A값
#   그래서 A값을 빼먹으면 낙찰하한을 잘못 계산해 실격합니다.
A_PARTS = [
    ("sftyMngcst", "산업안전보건관리비"),
    ("sftyChckMngcst", "안전관리비"),
    ("rtrfundNon", "퇴직공제부금비"),
    ("envCnsrvcst", "환경보전비"),
    ("scontrctPayprcePayGrntyFee", "하도급대금지급보증수수료"),
    ("mrfnHealthInsrprm", "국민건강보험료"),
    ("npnInsrprm", "국민연금보험료"),
    ("odsnLngtrmrcprInsrprm", "노인장기요양보험료"),
    ("qltyMngcst", "품질관리비"),
]


def extra_amounts(item):
    """A값을 항목별로 모으고 합계를 냅니다.

    bidPrceCalclAYn 이 «Y» 면 이 공고가 A값을 적용한다는 뜻입니다.
    품질관리비는 qltyMngcstAObjYn 이 «Y» 일 때만 A값에 넣습니다.
    """
    out = {}
    parts, total = [], 0
    qobj = str(pick(item, "qltyMngcstAObjYn") or "").upper() == "Y"
    for k, label in A_PARTS:
        v = to_int(pick(item, k) or 0)
        if v <= 0:
            continue
        if k == "qltyMngcst" and not qobj:
            continue
        parts.append([label, v])
        total += v
    if total > 0:
        out["aval"] = total
        out["aparts"] = parts
    yn = str(pick(item, "bidPrceCalclAYn") or "").upper()
    if yn in ("Y", "N"):
        out["ayn"] = yn        # 이 공고가 A값을 적용하는지
    g = to_int(pick(item, "govsplyAmt", "govcnstrtnGovsplyMtrlAmt",
                    "contrctrcnstrtnGovsplyMtrlAmt", "govsplyMtrlAmt") or 0)
    if g > 0:
        out["gmtrl"] = g
    return out


def scsbid_by_day(key, day, kind):
    """하루치 낙찰자 상세를 받아 {공고번호: {...}} 로.

    사용자가 «1순위 업체 주소·전화를 보고 싶다» 고 해서 붙였습니다.
    나라장터 개찰 결과에 공개되는 정보입니다."""
    out = {}
    for pg in range(1, 6):
        got = fetch(SCSBID[kind], key, day, {"pageNo": str(pg)},
                    label=f"낙찰자 {kind} {day:%m-%d} {pg}쪽")
        for it in got:
            no = str(pick(it, "bidNtceNo") or "").strip()
            if not no:
                continue
            row = {}
            nm = pick(it, "bidwinnrNm")
            if nm:
                row["win"] = str(nm).strip()[:40]
            for src, dst in (("bidwinnrBizno", "bno"), ("bidwinnrCeoNm", "ceo"),
                             ("bidwinnrAdrs", "adr"), ("bidwinnrTelNo", "tel")):
                v = pick(it, src)
                if v:
                    row[dst] = str(v).strip()[:60]
            np = to_int(pick(it, "prtcptCnum") or 0)
            if np:
                row["np"] = np
            sa = to_int(pick(it, "sucsfbidAmt") or 0)
            if sa:
                row["sAmt"] = sa
            sr = to_rate(pick(it, "sucsfbidRate"))
            if sr is not None:
                row["sRate"] = sr
            if row:
                out[no] = row
        if len(got) < 999:
            break
    return out


def backfill_bsis(key, first, live, days, sleep=0.4):
    """지난 N일치 기초금액·A값을 다시 훑어 빈 칸을 채웁니다.

    왜 필요한가:
      기초금액과 A값은 «공고» 오퍼레이션에서만 옵니다. 그런데 배치는 최근 2~3일만
      훑기 때문에, 그 시점에 아직 공개되지 않은 기초금액·A값은 영영 못 받습니다.
      실측: 개찰 500건 중 기초금액 167건(33%), A값 42건(8.4%) 뿐이었습니다.
      그러면 시뮬레이션이 «A값 가정» 으로 돌아갑니다.
    비용:
      bsis_by_day 는 하루당 1~2회 호출입니다. 45일이면 50~90회 — 하루 한 번이면 부담 없습니다.
    """
    got = 0
    for i in range(days, 0, -1):
        day = datetime.now(KST) - timedelta(days=i)
        for kind in KINDS:
            bm = bsis_by_day(key, day, kind)
            for store in (first, live):
                for no, b in bm.items():
                    row = store.get(kind, {}).get(no)
                    if row is None:
                        continue
                    for f, v in b.items():
                        if v not in (None, "", 0) and not row.get(f):
                            row[f] = v
                            if f == "aval":
                                got += 1
            time.sleep(sleep)
        if NET_DOWN:
            break
    print(f"  → 소급 보충 {days}일치 — A값 {got:,}건 새로 채움")


def bsis_by_day(key, day, kind):
    """하루치 기초금액을 통째로 받아 {공고번호: {...}} 로."""
    out = {}
    for it in fetch(BSIS[kind], key, day, None,
                    label=f"기초금액 {kind} {day:%m-%d}"):
        no = str(pick(it, "bidNtceNo") or "").strip()
        r = bsis_row(it)
        if no and r:
            r.update(extra_amounts(it))
            out[no] = r
    return out


LIC_PAGES = 12       # 면허제한은 물품·용역까지 섞여 와서 한 쪽(999건)으로는 턱없이 모자람


def lic_by_day(key, day, kind):
    """하루치 면허·업종 제한을 통째로 받아 {공고번호: [제한명, ...]} 로.

    한 공고에 여러 줄이 올 수 있습니다 (토목 + 건축 처럼).

    ⚠️ 쪽넘김을 반드시 해야 합니다.
       이 오퍼레이션은 공사·용역·물품을 다 섞어서 줍니다.
       한 쪽(999건)만 받으면 대부분 물품이라 공사는 거의 안 걸립니다.
       실제로 1,946건 중 3건만 채워졌습니다."""
    out = {}
    rows = []
    for pg in range(1, LIC_PAGES + 1):
        got = fetch(LIC[kind], key, day, {"pageNo": str(pg)},
                    label=f"면허제한 {kind} {day:%m-%d} {pg}쪽")
        rows.extend(got)
        if len(got) < 999:          # 마지막 쪽
            break
    for it in rows:
        no = str(pick(it, "bidNtceNo") or "").strip()
        # bsnsDivNm 이 «물품»·«용역» 인 줄이 섞여 옵니다. 공사만 씁니다.
        div = str(pick(it, "bsnsDivNm") or "").strip()
        if div and div != "공사":
            continue
        nm = pick(it, "lcnsLmtNm", "licenseLmtNm", "indstrytyNm",
                  "bidprcPsblIndstrytyNm", "lmtNm", "prmsnCorpNm")
        if not no or not nm:
            continue
        nm = str(nm).strip()
        cur = out.setdefault(no, [])
        if nm not in cur:
            cur.append(nm)
    return out


def bsis_one(key, no, kind):
    """공고번호로 한 건만. 목록조회에서 빠진 건을 메운다 (inqryDiv=2)."""
    for it in fetch(BSIS[kind], key, None,
                    {"inqryDiv": "2", "bidNtceNo": no}, label=f"기초금액 {no}"):
        r = bsis_row(it)
        if r:
            r.update(extra_amounts(it))
            return r
    return None


# 화면에 싣는 순위 개수. 전부 실으면 파일이 터집니다 —
# 실측(2026-09-02): 한 공고에 999곳까지 옵니다. 60건만 채웠는데 목록 파일이
# 310KB → 743KB 로 뛰었습니다. 전부 채우면 80MB 가 됩니다.
# 우리에게 필요한 것은 «가장 낮게 쓴 쪽»입니다 — 낙찰하한 근처가 승부처이기 때문입니다.
# 그래서 낮은 금액 순으로 30곳만 싣고, 전체 참가업체수는 np 로 따로 보여줍니다.
RANK_KEEP = 30


def openg_ranks(key, no, ord_="000"):
    """공고 하나의 투찰업체를 순위대로 전부 가져온다.

    돌려주는 모양은 parse_corps 와 **똑같이** 맞춥니다:
        [[업체명, 투찰금액, 투찰률, 사업자번호, 대표자], ...]
    화면 코드가 corps[i][0..2] 로 읽고 있어서, 자리를 바꾸면 화면이 깨집니다.
    """
    items = fetch(OPENG_RANK, key,
                  extra={"bidNtceNo": no, "bidNtceOrd": str(ord_ or "000") or "000"},
                  label=f"개찰순위 {no}")
    out = []
    for it in items:
        nm = str(pick(it, "prcbdrNm") or "").strip()
        amt = to_int(pick(it, "bidprcAmt"))
        if not nm or amt <= 0:
            continue
        rank = to_int(pick(it, "opengRank")) or 9999
        bno = re.sub(r"[^0-9]", "", str(pick(it, "prcbdrBizno") or ""))
        ceo = str(pick(it, "prcbdrCeoNm") or "").strip()[:12]
        out.append((rank, amt, [nm, amt, to_rate(pick(it, "bidprcrt")),
                                bno if len(bno) == 10 else "", ceo]))
    # 순위가 비어 오는 경우가 있어 «금액이 낮은 순»을 보조 기준으로 둡니다
    out.sort(key=lambda x: (x[0], x[1]))

    # ── 순위 사다리 ────────────────────────────────────────────
    #  화면에 «우리 금액이면 몇 위» 를 말하려면 낮은 30곳만으론 부족합니다.
    #  851곳이 붙은 공고에서 우리 금액은 30위권 밖이라 «최소 31위» 밖에 못 합니다.
    #  그렇다고 851개 금액을 다 실으면 파일이 터집니다.
    #  그래서 **몇 등이 얼마였는지 사다리만** 담습니다 — 10칸이면 전 구간을 덮습니다.
    #  화면은 우리 금액이 어느 칸 사이에 떨어지는지 보고 등수를 좁힙니다.
    ladder = []
    n = len(out)
    for pos in (1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000):
        if pos <= n:
            ladder.append([pos, out[pos - 1][1]])
    if n and (not ladder or ladder[-1][0] != n):
        ladder.append([n, out[n - 1][1]])       # 꼴찌도 한 칸

    return [c for _, _, c in out[:RANK_KEEP]], n, ladder


def parse_corps(raw, limit=6):
    """'업체명^사업자번호^대표^금액^투찰률|업체명^...'
       → [[이름, 금액, 투찰률, 사업자번호, 대표자], ...]

    앞의 세 자리는 예전과 같은 자리에 둡니다 (화면 코드가 [0][1][2] 로 읽습니다).
    번호·대표는 뒤에 덧붙여서, 옛 자료와 섞여도 깨지지 않게 합니다."""
    out = []
    for chunk in str(raw or "").split("|")[:limit]:
        p = chunk.split("^")
        if len(p) >= 5 and p[0].strip():
            bno = re.sub(r"[^0-9]", "", p[1])
            out.append([p[0].strip(), to_int(p[3]), to_rate(p[4]),
                        bno if len(bno) == 10 else "", p[2].strip()[:12]])
    return out


def row_first(item):
    no = str(item.get("bidNtceNo", "")).strip()
    if not no:
        return None
    corps = parse_corps(item.get("opengCorpInfo", ""), limit=10)
    if not corps:
        return None
    win, amt, rate = corps[0][0], corps[0][1], corps[0][2]
    return {
        "no": no,
        # 공고차수 — 나라장터 원문 주소를 정확히 만들려면 필요합니다
        "ord": str(item.get("bidNtceOrd", "") or "").strip(),
        # 참가업체수 — 그 공고에 몇 곳이 들어왔는지. 경쟁 강도 그 자체입니다.
        "np": to_int(pick(item, "prtcptCnum") or 0),
        "name": str(item.get("bidNtceNm", "")).strip(),
        "inst": str(item.get("ntceInsttNm", "")).strip(),
        "dt": str(item.get("opengDt", "")).strip(),
        "win": win, "amt": amt, "rate": rate,
        # 업체를 이름이 아니라 «사업자번호» 로 가리기 위한 값
        "bno": corps[0][3] if len(corps[0]) > 3 else "",
        "ceo": corps[0][4] if len(corps[0]) > 4 else "",
        # 낙찰금액·낙찰률은 응답에 있을 때만 채워진다 (없으면 1순위 투찰금액이 곧 낙찰가)
        "sAmt": to_int(pick(item, "sucsfbidAmt", "sucsfbidPrce")) or 0,
        "sRate": to_rate(pick(item, "sucsfbidRate")),
        "corps": corps,
    }


def row_live(item):
    no = str(item.get("bidNtceNo", "")).strip()
    if not no:
        return None
    url = str(item.get("bidNtceDtlUrl", "") or "").replace(":8081", "").replace(":8101", "")

    def txt(*names):
        v = pick(item, *names)
        return str(v).strip() if v is not None else ""

    # 공고서에 있는 내용을 되도록 사이트 안에서 볼 수 있게 담아 옵니다.
    # 항목 이름이 문서와 다를 때가 있어 후보를 여러 개 적어 pick() 으로 찾습니다.
    # 비어 오면 화면에서 그 줄만 빠집니다.
    return {
        "no": no,
        "ord": txt("bidNtceOrd"),
        "name": str(item.get("bidNtceNm", "")).strip(),
        "inst": str(item.get("ntceInsttNm", "")).strip(),
        "dmnd": txt("dminsttNm"),                       # 수요기관
        "dt": str(item.get("bidNtceDt", "")).strip(),
        "budget": to_int(item.get("bdgtAmt", 0) or item.get("presmptPrce", 0)),
        "est": to_int(pick(item, "presmptPrce", "presmptPrceAmt") or 0),   # 추정가격
        "close": str(item.get("bidClseDt", "") or "").strip(),
        "openg": txt("opengDt"),                        # 개찰 일시
        "kind": txt("ntceKindNm"),                      # 공고종류(일반/긴급/재공고)
        "mthd": txt("cntrctCnclsMthdNm", "bidMethdNm"), # 계약방법
        "swin": txt("sucsfbidMthdNm"),                  # 낙찰자 결정방법
        # ★ 낙찰하한율 — 공고가 직접 알려주면 우리가 추정할 필요가 없습니다
        "llr": to_rate(pick(item, "sucsfbidLwltRate")),
        "rgn": txt("prtcptPsblRgnNm"),                  # 참가가능 지역
        "ind": txt("bidprcPsblIndstrytyNm", "indstrytyNm"),   # 참가가능 업종
        "joint": txt("cmmnSpldmdMethdNm"),              # 공동수급 방식
        "rebid": txt("rbidPermsnYn"),                   # 재입찰 허용
        "ofcl": txt("ntceInsttOfclNm"),                 # 담당자
        "tel": txt("ntceInsttOfclTelNo"),               # 연락처
        # 복수예비가격 — 사정률이 어떻게 정해지는지의 핵심입니다
        "pmth": txt("prearngPrceDcsnMthdNm"),           # 예정가격 결정방법
        "ptot": to_int(pick(item, "totPrdprcNum") or 0),   # 예비가격 개수 (보통 15)
        "pdrw": to_int(pick(item, "drwtPrdprcNum") or 0),  # 추첨 개수 (보통 4)
        "site": txt("cnstrtsiteRgnNm"),                 # 공사 현장 지역
        "rgnb": txt("rgnLmtBidLocplcJdgmBssNm"),        # 지역제한 판단기준
        "main": txt("mainCnsttyNm"),                    # 주공종
        # 공고문 첨부파일 — 나라장터에 안 가고 여기서 바로 받게 합니다
        "docs": [[n, u] for n, u in (
            (txt(f"ntceSpecFileNm{i}"), txt(f"ntceSpecDocUrl{i}"))
            for i in range(1, 11)) if n and u][:6],
        "url": url or "https://www.g2b.go.kr/index.jsp",
        # 조달청이 주는 또 다른 주소. 공고상세(bidNtceDtlUrl)와 다른 것인지,
        # 혹시 투찰 입구인지 확인하려고 담아둡니다.
        # 나라장터는 화면이 바뀌어도 주소가 안 바뀌는 구조라 투찰 딥링크가
        # 없을 가능성이 큽니다 — 추측하지 않고 실제 값을 보고 정합니다.
        "url2": txt("bidNtceUrl"),
    }



# ─────────────────────────────────────────────
#  진단 — 투찰업체 «전체» 를 주는 오퍼레이션 찾기
#
#  지금 쓰는 개찰결과 오퍼레이션은 1순위(낙찰자) 한 곳만 돌려줍니다.
#  (3년치 118,847건 전수 확인 — 전부 1곳)
#  그래서 사이트에 «1위~10위» 를 못 띄웁니다.
#  조달청에 투찰업체 목록을 주는 다른 오퍼레이션이 있는지
#  하루 한 번만 두드려 보고 결과를 기록에 남깁니다. (자료는 건드리지 않습니다)
# ─────────────────────────────────────────────
#  ⚠️ 2026-09-02 실측으로 확인된 것 (추측이 아닙니다):
#     지금 쓰는 «개찰결과»(getOpengResultListInfoCnstwk) 는
#     opengCorpInfo 에 **업체 한 곳만** 담아 줍니다.
#       예: "주식회사 와이티건설^1528601041^홍주호^6383600^90.341"
#       같은 공고의 prtcptCnum(참가업체수) 은 23 이었습니다.
#     저장소에 쌓인 개찰 10,913건 **전부** corps 가 1곳이었습니다.
#     → 이 오퍼레이션으로는 2~10위를 절대 못 가져옵니다.
#
#  그래서 아래에 «투찰내역을 줄 만한» 오퍼레이션 후보를 더 넣어 두고,
#  하루 한 번 두드려 응답이 오는지만 봅니다 (자료는 건드리지 않습니다).
#  결과는 data/diag.json 에 남으므로 다음 날 확인할 수 있습니다.
PROBE_OPS = [
    # ── 지금 쓰는 것 (1순위만 옵니다 — 위에 증거) ──
    ("낙찰자 목록",       f"{BASE}/as/ScsbidInfoService/getScsbidListSttusCnstwk"),
    ("면허·업종 제한",    f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoLicenseLimit"),
    # ── «전체 투찰내역» 후보 ──
    ("개찰결과 투찰업체", f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwkPPSSrch"),
    ("개찰 참가업체",     f"{BASE}/as/ScsbidInfoService/getBidPblancListInfoCnstwkBidPrceList"),
    ("투찰 목록",         f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoBidPrceList"),
    ("예비가격 상세",     f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwkPreparPcDetail"),
    ("개찰결과 상세",     f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwkDetail"),
    ("투찰가 상세",       f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwkBidPrceDetail"),
    ("개찰 순위",         f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoOpengCompt"),
    ("낙찰자 현황(용역)", f"{BASE}/as/ScsbidInfoService/getScsbidListSttusServc"),
    ("개찰결과(물품)",    f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoThng"),
    ("입찰가격산식A",     f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoBidPrceCalclA"),
]


def save_diag():
    """진단 결과를 사이트에 파일로 남깁니다.
    GitHub 기록 화면은 무거워서 읽기 어렵습니다. 파일이면 언제든 볼 수 있습니다."""
    if not DIAG:
        return
    try:
        os.makedirs(OUT, exist_ok=True)
        path = os.path.join(OUT, "diag.json")
        # 수집 단계와 진단 단계가 따로 돌기 때문에 서로 지우지 않도록 합칩니다
        old = {}
        if os.path.exists(path):
            try:
                with open(path, encoding="utf-8") as f:
                    old = (json.load(f) or {}).get("ops", {}) or {}
            except Exception:
                old = {}
        merged = dict(old)
        for k, v in DIAG.items():
            if k == "_probe" and isinstance(old.get(k), dict):
                m = dict(old[k])
                m.update(v)
                merged[k] = m
            else:
                merged[k] = v
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"built": datetime.now(KST).strftime("%Y-%m-%d %H:%M"),
                       "ops": merged}, f, ensure_ascii=False, indent=1)
        print(f"  · 진단 결과를 data/diag.json 에 남겼습니다 ({len(merged)}개)")
    except Exception as e:
        print(f"  ! 진단 저장 실패 ({type(e).__name__})")


def probe_ops(key, day, sample_no="", sample_ord="000"):
    """«투찰업체 전체»를 주는 오퍼레이션이 있는지 확인합니다.

    ⚠️ 2026-09-02 — 예전 진단은 **날짜로만** 두드렸습니다.
       공고번호를 받아야 하는 오퍼레이션은 그때 «응답 없음» 으로 나왔고,
       저는 그걸 «그런 오퍼레이션이 없다» 로 잘못 읽었습니다.
       그래서 이제 두 가지 방식으로 다 두드리고, **실패 이유(resultMsg)** 까지 적습니다.
         ① 날짜 범위 (inqryBgnDt~inqryEndDt)
         ② 공고번호 (bidNtceNo + bidNtceOrd)
       «응답 없음» 과 «필수값 누락» 과 «없는 서비스» 는 완전히 다른 이야기입니다.
    """
    print("-" * 52)
    print(f"진단 — 투찰업체 전체를 주는 오퍼레이션 찾기 (표본 공고 {sample_no or '없음'})")
    for label, url in PROBE_OPS:
        if NET_DOWN:
            print("  · 통신이 막혀 진단을 건너뜁니다")
            return
        op = url.rsplit("/", 1)[-1]
        rec = {"op": op, "tries": {}}
        modes = [("날짜", dict(day=day, extra=None))]
        if sample_no:
            modes.append(("공고번호", dict(
                day=None,
                extra={"bidNtceNo": sample_no, "bidNtceOrd": sample_ord})))
        for mname, kw in modes:
            why = {}
            items = fetch(url, key, label=f"[진단]{label}/{mname}", why=why, **kw)
            if items:
                one = items[0] if isinstance(items, list) else items
                keys = sorted(one.keys()) if isinstance(one, dict) else []
                rec["tries"][mname] = {
                    "rows": len(items), "fields": keys,
                    "sample": {k: str(v)[:80] for k, v in list(one.items())[:60]}
                    if isinstance(one, dict) else {}}
                print(f"  \u2713 {label}/{mname}: {len(items)}건 · "
                      f"항목 {', '.join(keys)[:300]}")
            else:
                rec["tries"][mname] = {"rows": 0, **why}
                print(f"  · {label}/{mname}: 응답 없음 "
                      f"({why.get('code', '')} {why.get('msg', '')})".rstrip())
            time.sleep(0.4)
        DIAG.setdefault("_probe", {})[label] = rec
    print("-" * 52)


def merge_ranks(first):
    """data/ranks.csv (사람이 조달데이터허브에서 받아 inbox 에 넣은 전체 투찰내역)를
       개찰 자료의 corps 에 붙인다 — 화면의 «투찰 순위»가 1위부터 10위까지 나옵니다.

    ⚠️ 조달청 공개 API 는 1순위만 줍니다(실측 10,913건 전부 1곳).
       그래서 순위는 이 파일이 있을 때만 채워집니다. 없으면 조용히 넘어갑니다.
    """
    path = os.path.join(ARCHIVE_DIR, "ranks.csv")
    if not os.path.exists(path):
        return 0
    by_no = {}
    try:
        with io.open(path, encoding="utf-8-sig", newline="") as f:
            for row in csv.DictReader(f):
                no = (row.get("공고번호") or "").strip()
                if not no:
                    continue
                try:
                    rank = int(float(row.get("순위") or 0))
                    amt = int(float(re.sub(r"[^0-9.]", "", str(row.get("투찰금액") or "0")) or 0))
                except Exception:
                    continue
                if not (1 <= rank <= 10) or amt <= 0:
                    continue
                rt = to_rate(row.get("투찰률"))
                bno = re.sub(r"[^0-9]", "", str(row.get("사업자번호") or ""))
                by_no.setdefault(no, []).append(
                    (rank, [str(row.get("업체명") or "").strip(), amt, rt,
                            bno if len(bno) == 10 else "", ""]))
    except Exception as e:
        print(f"  ! ranks.csv 읽기 실패 ({type(e).__name__}: {e}) — 넘어갑니다")
        return 0

    n = 0
    for kind in KINDS:
        for no, row in first[kind].items():
            got = by_no.get(no)
            if not got or len(got) < 2:
                continue          # 1위 하나뿐이면 지금 것과 같습니다
            got.sort(key=lambda x: x[0])
            row["corps"] = [c for _, c in got][:10]
            row["nrank"] = len(row["corps"])
            n += 1
    if n:
        print(f"  \u2192 투찰 순위 붙임 {n:,}건 (ranks.csv {len(by_no):,}공고)")
    return n


def load_store(name):
    p = os.path.join(STORE, f"{name}.json")
    if not os.path.exists(p):
        return {"con": {}, "serv": {}}
    try:
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
        return {"con": d.get("con", {}), "serv": d.get("serv", {})}
    except Exception:
        return {"con": {}, "serv": {}}


def save_store(name, data):
    os.makedirs(STORE, exist_ok=True)
    with open(os.path.join(STORE, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))


def archive(first, live=None):
    """이번에 받은 개찰 결과를 달별 누적 CSV 에 덧붙이고, 빈칸을 소급해 채운다.

    live 를 함께 받는 이유: 예가범위가 «공고» 쪽에만 실려 오기 때문입니다.
    """
    live = live or {"con": {}, "serv": {}}
    import glob as _glob

    have = set()
    for p in _glob.glob(os.path.join(ARCHIVE_DIR, "extra_*.csv")):
        try:
            with io.open(p, encoding="utf-8-sig", newline="") as f:
                for row in csv.DictReader(f):
                    no = (row.get("공고번호") or "").strip()
                    if no:
                        have.add(no)
        except Exception as e:
            print(f"  ! 누적 CSV 읽기 실패 {os.path.basename(p)} ({type(e).__name__})")

    buckets = {}
    for kind in ("con", "serv"):
        for no, r in first[kind].items():
            if no in have:
                continue
            d = dt_digits(r.get("dt"))
            if len(d) < 8:
                continue
            have.add(no)
            ym = f"{d[0:4]}-{d[4:6]}"
            buckets.setdefault(ym, []).append({
                "공고번호": no,
                "날짜": f"{d[0:4]}-{d[4:6]}-{d[6:8]}",
                "발주기관": r.get("inst", ""),
                "공고명": r.get("name", ""),
                "1순위업체": r.get("win", ""),
                "사업자번호": r.get("bno", "") or "",
                "대표자": r.get("ceo", "") or "",
                "투찰금액": r.get("amt", 0),
                "투찰률": "" if r.get("rate") is None else r.get("rate"),
                "기초금액": r.get("base", "") or "",
                "A값": r.get("aval", "") or "",
                "A값적용": r.get("ayn", "") or "",
                "예가하한": "" if r.get("lo") is None else r.get("lo"),
                "예가상한": "" if r.get("hi") is None else r.get("hi"),
                "참가업체수": r.get("np", "") or "",
            })

    # ══════════════════════════════════════════════════════════════
    #  이미 적힌 줄의 빈칸을, «지금 가진 것»으로 뒤늦게 채웁니다.
    #
    #  ⚠️ 2026-09-03 소장님 지적: 「오늘부터 쌓이는 게 아니라,
    #     조달청에서 가져와 지금 사이트에 있는 건 다 채워야 맞지 않아?」 — 맞습니다.
    #
    #  채우는 것: A값 · A값적용 · 예가하한 · 예가상한 · 참가업체수
    #  채우는 재료: data/store/{first,live}.json — **이미 받아 둔 것**입니다.
    #     → 조달청 호출 0번. 돈도 시간도 안 듭니다.
    #
    #  왜 live 까지 보나: 예가범위는 «공고» 쪽에만 실려 옵니다.
    #     개찰 저장소에는 12.6% 뿐인데 공고 저장소에는 77.8% 가 있습니다.
    #     같은 공고번호로 이어 붙이면 그만큼이 살아납니다.
    #
    #  ⚠️ 옛 달(4~6월)은 공고 저장소가 45일치라 재료가 없습니다.
    #     그건 이 함수로 못 채웁니다 — 애초에 가진 적이 없는 값입니다.
    #     시뮬레이션이 보는 창은 최근 30일이라 실질 손해는 없습니다.
    # ══════════════════════════════════════════════════════════════
    try:
        known = {}
        # 뒤에 넣는 쪽이 이깁니다 — 개찰(first)이 공고(live)보다 확정값입니다.
        for st in (live, first):
            for kind in ("con", "serv"):
                for no, r in (st.get(kind) or {}).items():
                    if not isinstance(r, dict):
                        continue
                    cur = known.setdefault(no, {})
                    for src, dst in (("aval", "A값"), ("ayn", "A값적용"),
                                     ("lo", "예가하한"), ("hi", "예가상한"),
                                     ("np", "참가업체수")):
                        v = r.get(src)
                        if v is not None and v != "" and v != 0:
                            cur[dst] = v
        known = {k: v for k, v in known.items() if v}

        if known:
            filled = {c: 0 for c in ("A값", "예가하한", "참가업체수")}
            n_files = 0
            for path in sorted(_glob.glob(os.path.join(ARCHIVE_DIR, "extra_*.csv"))):
                with io.open(path, encoding="utf-8-sig", newline="") as f:
                    rows = list(csv.DictReader(f))
                if not rows:
                    continue
                ch = False
                for row in rows:
                    k = known.get((row.get("공고번호") or "").strip())
                    if not k:
                        continue
                    # A값 — 적용여부(N)도 값이므로 둘을 한 쌍으로 봅니다
                    if k.get("A값") and not str(row.get("A값") or "").strip():
                        row["A값"] = k["A값"]
                        row["A값적용"] = k.get("A값적용", "")
                        filled["A값"] += 1
                        ch = True
                    # 예가범위 — 하한만 있고 상한이 없는 일은 없습니다. 쌍으로 채웁니다.
                    if k.get("예가하한") is not None and not str(row.get("예가하한") or "").strip():
                        row["예가하한"] = k["예가하한"]
                        row["예가상한"] = k.get("예가상한", "")
                        filled["예가하한"] += 1
                        ch = True
                    if k.get("참가업체수") and not str(row.get("참가업체수") or "").strip():
                        row["참가업체수"] = k["참가업체수"]
                        filled["참가업체수"] += 1
                        ch = True
                # 바뀐 파일만 다시 씁니다.
                # (안 바뀐 파일까지 쓰면 하루 21번 커밋이 통째로 부풀어 오릅니다)
                if ch:
                    n_files += 1
                    with io.open(path, "w", encoding="utf-8-sig", newline="") as g:
                        w = csv.DictWriter(g, fieldnames=ARCH_COLS, extrasaction="ignore")
                        w.writeheader()
                        for row in rows:
                            w.writerow({c: row.get(c, "") for c in ARCH_COLS})
            if any(filled.values()):
                print(f"  → 누적 CSV 소급 기록 ({n_files}개 파일) — "
                      f"A값 {filled['A값']:,} · 예가범위 {filled['예가하한']:,} · "
                      f"참가업체수 {filled['참가업체수']:,}칸 (조달청 호출 0번)")
    except Exception as e:
        print(f"  ! 소급 기록 실패 ({type(e).__name__}: {e}) — 넘어갑니다")

    if not buckets:
        print("  · 누적 CSV — 새로 추가할 건 없음")
        return

    added = 0
    for ym, rows in sorted(buckets.items()):
        p = archive_path(ym)
        fresh = not os.path.exists(p)

        # 칸이 늘어났을 때(사업자번호·대표자 추가) 옛 파일을 한 번 갈아끼웁니다.
        # 그냥 덧붙이면 머리글은 8칸인데 줄은 10칸이 되어 자료가 어긋납니다.
        if not fresh:
            try:
                with io.open(p, encoding="utf-8-sig", newline="") as f:
                    rd = csv.DictReader(f)
                    head = rd.fieldnames or []
                    if head != ARCH_COLS:
                        keep = [dict(x) for x in rd]
                        with io.open(p, "w", encoding="utf-8-sig", newline="") as g:
                            w = csv.DictWriter(g, fieldnames=ARCH_COLS,
                                               extrasaction="ignore")
                            w.writeheader()
                            for x in keep:
                                w.writerow({c: x.get(c, "") for c in ARCH_COLS})
                        print(f"  · {os.path.basename(p)} 칸 맞춤 "
                              f"({len(head)} → {len(ARCH_COLS)}칸, {len(keep):,}줄)")
            except Exception as e:
                print(f"  ! 누적 CSV 칸 맞춤 실패 {os.path.basename(p)} ({type(e).__name__})")

        with io.open(p, "a", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=ARCH_COLS, extrasaction="ignore")
            if fresh:
                w.writeheader()
            w.writerows(rows)
        added += len(rows)
    months = ", ".join(sorted(buckets))
    print(f"  · 누적 CSV +{added:,}건 ({months}) — 전체 {len(have):,}건")


def dt_digits(v):
    return re.sub(r"[^0-9]", "", str(v or ""))[:12]


def trim(bucket, days, date_field):
    """오래된 건 버린다 — 안 버리면 파일이 해마다 조용히 무거워진다"""
    cut = (datetime.now(KST) - timedelta(days=days)).strftime("%Y%m%d%H%M")
    return {k: v for k, v in bucket.items() if (dt_digits(v.get(date_field)) or "999") >= cut}



# ══════════════════════════════════════════════════════════════
#  워크넷 건설 채용 — 2026-09-03
#
#  소장님: 「워크넷 구인구직 공고를 건설맵에 띄울 수 없어? 우리는 보여주기만 하고 나머지는 워크넷에서.」
#
#  ⚠️ 크롤링이 아닙니다. 한국고용정보원이 공공데이터포털/워크넷 OpenAPI 로 «쓰라고 내준» 자료입니다.
#     전에 중지한 건 화면 긁기(잡코리아 v 사람인 판례)였고, 이건 그와 다릅니다.
#  ⚠️ 키는 조달청 키와 별개입니다. openapi.work.go.kr 에서 받아 .env 에:
#         WORKNET_API_KEY=…
#     키가 없으면 이 단계는 조용히 건너뜁니다 (배치가 멈추면 안 됩니다).
#  ⚠️ 본문은 안 가져옵니다. 제목·회사·지역·급여·조건·마감·링크만.
#     지원·문의는 전부 워크넷에서. 조달청 공고와 같은 원칙입니다 — 우리는 «목록»입니다.
#  ⚠️ 응답 항목 이름을 «짐작으로 박지 않습니다». 첫 응답의 항목을 diag.json 에 남기고,
#     여러 이름 후보 중 실제로 온 것을 씁니다 (조달청 때 «없다»고 세 번 틀린 그 실수 방지).
#
#  건설만 고르는 법 (지금은 «말»로, 나중엔 «코드»로):
#     · 워크넷 직종코드(occupation)로 거르는 게 정석인데, 어느 코드가 건설인지 실제 응답을
#       보기 전엔 단정 못 합니다. 그래서 첫 응답의 jobsCd/jobsNm 분포를 diag 에 남깁니다.
#     · 지금은 건설 낱말로 여러 번 조회 + 제목/직종명에 건설 낱말이 있는 것만 남깁니다.
#  호출량: 낱말 15개 × 1~3쪽 ≈ 40회. 08시·13시 회차에만 (순위 조회와 같은 배분).
# ══════════════════════════════════════════════════════════════
# ⚠️ 2026-09-03 정정 — 옛 워크넷 주소(openapi.work.go.kr/…/wantedApi.do)로 불렀더니
#    오류도 없이 «0건»이 왔다. 소장님 키는 **고용24(work24)** 에서 받은 것이고, 지금 주소는 이것이다:
#    https://www.work24.go.kr/cm/e/a/0110/selectOpenApiSvcInfo.do (채용정보 목록 = 210L01, 상세 = 210D01)
WORKNET_URL = "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do"
# 고용24 명세의 empTpCd — 이름은 안 오고 코드만 온다
WN_EMPTP = {"4": "파견", "10": "정규직", "11": "정규직(시간선택)", "20": "계약직",
            "21": "계약직(시간선택)", "Y": "대체인력"}
# 건설 «업종»(indTpNm) — 명세를 보니 직종명은 안 오고 업종명이 온다. 이게 제목보다 정확하다.
IND_RX = re.compile(r"건설|공사|토목|건축|설비|전기|조경|철강|철골|도장|방수|석공|미장|창호|"
                    r"포장|준설|굴착|비계|해체|지붕|판금|시설물|엔지니어링|측량|감리")
JOB_WORDS = ["건설", "토목", "건축", "시공", "현장소장", "현장관리", "공무", "견적",
             "설비", "전기공사", "조경", "철근", "측량", "안전관리자", "감리", "배관", "중장비"]
JOB_RX = re.compile(
    r"건설|토목|건축|시공|현장|공무|견적|설비|전기공사|전기 공사|조경|철근|콘크리트|측량|"
    r"안전관리|감리|배관|중장비|굴착|굴삭|덤프|타워크레인|비계|형틀|미장|방수|도장|"
    r"창호|금속|지붕|포장|도로|상하수도|하수관|준설|철골|용접|플랜트|CM|PM|공사")
JOB_KEEP_DAYS = 70

def _wn_get(el, *names):
    """XML 한 건에서 후보 이름 중 실제로 있는 값 (대소문자 무시)."""
    if el is None:
        return ""
    low = {c.tag.lower(): (c.text or "").strip() for c in el}
    for n in names:
        v = low.get(n.lower())
        if v:
            return v
    return ""

def worknet_fetch(key, keyword, page, display=100):
    import xml.etree.ElementTree as ET
    q = {"authKey": key, "callTp": "L", "returnType": "XML",
         "startPage": str(page), "display": str(display), "keyword": keyword,
         "regDate": "M-1"}                      # 최근 한 달 등록분만 (명세: D-0/D-3/W-1/W-2/M-1)
    try:
        r = requests.get(WORKNET_URL, params=q, timeout=NET_TIMEOUT, verify=False,
                         headers={"User-Agent": "k-conmap/1.0"})
        r.raise_for_status()
        raw = r.content
        root = ET.fromstring(raw)
    except Exception as e:
        print(f"    ! 워크넷 «{keyword}» {page}쪽 실패 ({type(e).__name__}: {str(e)[:80]})")
        return None, 0
    items = root.findall(".//wanted")
    total = 0
    try:
        total = int((root.findtext(".//total") or "0").strip() or 0)
    except Exception:
        pass
    if not items and "worknet_raw" not in DIAG:
        # ★ 0건이면 «왜»를 남긴다. 오류 XML 일 수도, 태그 이름이 다를 수도 있다.
        #   (2026-09-03 옛 주소로 0건이 왔을 때 이 자리에 아무것도 없어서 원인을 몰랐다)
        head = raw.decode("utf-8", "replace")[:600]
        DIAG["worknet_raw"] = {"status": r.status_code, "root": root.tag,
                               "children": [c.tag for c in root][:20], "head": head}
        print(f"    · 워크넷 «{keyword}» 0건 — 응답 앞부분: {head[:200].replace(chr(10), ' ')}")
    if items and "worknet_wantedApi" not in DIAG:
        one = items[0]
        DIAG["worknet_wantedApi"] = {
            "fields": sorted(c.tag for c in one),
            "sample": {c.tag: (c.text or "")[:40] for c in one},
        }
    return items, total

def _wn_date(v):
    """고용24 날짜를 YYYY-MM-DD 로. 형식이 명세에 없어 «YY-MM-DD» «YYYYMMDD» «YYYY-MM-DD» 다 받습니다.
    ⚠️ 이걸 안 하면 «26-09-20» 이 «2026-09-03» 보다 작다고 판정돼 마감 전 공고가 전부 지워집니다."""
    v = (v or "").strip()
    d = re.sub(r"[^0-9]", "", v)
    if len(d) == 8:
        return f"{d[:4]}-{d[4:6]}-{d[6:8]}"
    if len(d) == 6:
        return f"20{d[:2]}-{d[2:4]}-{d[4:6]}"
    return v[:10]

def worknet_row(el):
    """응답 한 건 → 우리 줄. 고용24 명세(2026-09-03 확인)의 태그 이름을 씁니다.
    후보를 두 개씩 둔 건 옛 워크넷 응답과의 호환용입니다."""
    g = lambda *n: _wn_get(el, *n)
    no = g("wantedAuthNo")
    if not no:
        return None
    emp = g("empTpCd")
    return {
        "id": no,
        "title": g("title")[:80],
        "co": g("company")[:40],
        "bno": g("busino"),
        "ind": g("indTpNm")[:30],                       # ★ 업종 — 건설 거르기의 주재료
        "reg": g("region")[:30],
        "addr": g("basicAddr")[:40],
        "sal": g("sal")[:30],
        "salTp": g("salTpNm")[:10],
        "minSal": g("minSal"), "maxSal": g("maxSal"),
        "career": g("career")[:12],
        "edu": g("minEdubg")[:12],
        "empTp": WN_EMPTP.get(emp, emp)[:12],
        "holi": g("holidayTpNm")[:10],
        "jobsCd": g("jobsCd"),                          # 직종코드 — 이름은 안 옵니다
        "regDt": _wn_date(g("regDt")),
        "closeDt": _wn_date(g("closeDt")),
        "src": g("infoSvc")[:20],
        # ★ 고용24가 주는 상세 주소 그대로. 손으로 만들지 않습니다.
        "url": g("wantedInfoUrl"),
        "murl": g("wantedMobileInfoUrl"),
    }

def is_construction(row):
    """업종(indTpNm)이 건설이면 통과. 업종이 비었거나 애매하면 제목으로 봅니다.
    회사명은 안 봅니다 — «OO건설» 의 경리 채용도 건설이긴 하지만 현장 사람이 찾는 건 아닙니다."""
    if IND_RX.search(row.get("ind") or ""):
        return True
    return bool(JOB_RX.search(row.get("title") or ""))

def load_jobs_store():
    """load_store 는 {con, serv} 모양으로 강제하므로 채용 저장소는 따로 읽습니다."""
    p = os.path.join(STORE, "jobs.json")
    try:
        with open(p, encoding="utf-8") as f:
            d = json.load(f)
        return d if isinstance(d, dict) and isinstance(d.get("r"), dict) else {"r": {}}
    except Exception:
        return {"r": {}}

def collect_jobs(key, sleep=0.4, max_pages=3):
    store = load_jobs_store()
    rows = store["r"]
    seen = set()
    n_get = n_new = n_skip = 0
    from collections import Counter
    cd = Counter()
    for w in JOB_WORDS:
        for pg in range(1, max_pages + 1):
            items, total = worknet_fetch(key, w, pg)
            if items is None:
                break
            for el in items:
                r = worknet_row(el)
                if not r:
                    continue
                n_get += 1
                cd[(r["jobsCd"], r["ind"])] += 1
                if r["id"] in seen:
                    continue
                seen.add(r["id"])
                if not is_construction(r):
                    n_skip += 1
                    continue
                if r["id"] not in rows:
                    n_new += 1
                rows[r["id"]] = r
            if len(items) < 100 or pg * 100 >= total:
                break
            time.sleep(sleep)
        time.sleep(sleep)

    # 오래된 건 버립니다 (안 버리면 파일이 해마다 조용히 무거워집니다)
    cut = (datetime.now(KST) - timedelta(days=JOB_KEEP_DAYS)).strftime("%Y-%m-%d")
    for k in [k for k, v in rows.items() if (v.get("regDt") or "9999") < cut]:
        del rows[k]
    store["r"] = rows
    save_store("jobs", store)

    # 직종코드 분포 — 다음에 «코드로 거르기» 로 바꿀 때 근거가 됩니다
    DIAG["worknet_jobs"] = {
        "got": n_get, "kept_new": n_new, "skipped_nonconstruction": n_skip,
        # (직종코드, 업종) 분포 — 이걸 보고 occupation 코드로 거르는 방식으로 바꿉니다
        "top_jobs": [[c, nm, n] for (c, nm), n in cd.most_common(40)],
    }
    print(f"  → 워크넷 채용 {n_get:,}건 받음 · 건설 아님 {n_skip:,}건 제외 · "
          f"새로 {n_new:,}건 · 보관 {len(rows):,}건")
    return store

def export_jobs(store):
    """마감 전 건설 채용만, 화면용으로 가볍게. 구인구직 탭에서만 받습니다."""
    today = datetime.now(KST).strftime("%Y-%m-%d")
    rows = [v for v in (store.get("r") or {}).values()
            if not v.get("closeDt") or v["closeDt"] >= today]
    rows.sort(key=lambda v: v.get("regDt") or "", reverse=True)
    rows = rows[:1000]
    f = ["id", "title", "co", "ind", "reg", "sal", "salTp", "career", "edu", "empTp",
         "regDt", "closeDt", "url", "murl"]
    out = {"built": datetime.now(KST).strftime("%Y-%m-%d %H:%M"), "src": "워크넷(한국고용정보원)",
           "f": f, "r": [[v.get(k, "") for k in f] for v in rows]}
    path = os.path.join(OUT, "jobs.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"  → jobs.json 마감 전 건설 채용 {len(rows):,}건 ({os.path.getsize(path)/1024:.0f}KB)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--backfill", type=int, default=0)
    ap.add_argument("--sleep", type=float, default=0.6)
    ap.add_argument("--ranks", type=int, default=-1,
                    help="개찰 순위(1위~꼴찌)를 이번 회차에 몇 건까지 채울지. "
                         "안 주면 시각을 보고 알아서 정합니다(정밀 회차 250 / 그 외 60). 0이면 안 함")
    ap.add_argument("--fillbsis", type=int, default=0,
                    help="지난 N일치 기초금액·A값을 소급해서 채웁니다 (하루 한 번이면 충분)")
    ap.add_argument("--jobs", action="store_true",
                    help="워크넷 건설 채용을 지금 당장 받습니다 (평소엔 08·13시 회차에만)")
    ap.add_argument("--jobsonly", action="store_true",
                    help="조달청은 건너뛰고 워크넷 건설 채용만 받습니다 (처음 확인할 때)")
    ap.add_argument("--fillonly", action="store_true",
                    help="조달청을 부르지 않고, 이미 받아 둔 자료로 "
                         "누적 CSV 의 빈칸만 채웁니다 (호출 0번 · 몇 초)")
    ap.add_argument("--probe", action="store_true",
                    help="투찰업체 전체를 주는 오퍼레이션이 있는지 한 번 확인만 합니다")
    args = ap.parse_args()

    # ── --fillonly : 조달청을 한 번도 부르지 않습니다 ────────────────
    #   이미 data/store/ 에 받아 둔 것으로 누적 CSV 의 빈칸만 채웁니다.
    #   API 키도 필요 없고, 몇 초면 끝납니다.
    #   («--days 30 이 중간에 끊겼다» 같은 상황에서 그때까지 받은 것만이라도
    #     바로 자료에 반영하려고 만들었습니다)
    if args.fillonly:
        print("=" * 52)
        print("  이미 받아 둔 자료로 누적 CSV 빈칸 채우기 (조달청 호출 0번)")
        print("=" * 52)
        _first = load_store("first")
        _live = load_store("live")
        archive(_first, _live)
        print("완료.")
        return

    load_env()

    # ── --jobsonly : 워크넷만. 조달청 키 없이도 돕니다 ──────────────
    if args.jobsonly:
        _wk = os.environ.get("WORKNET_API_KEY", "").strip()
        if not _wk:
            print("⛔ .env 에 WORKNET_API_KEY 가 없습니다.  예)  WORKNET_API_KEY=받은키")
            return
        print("=" * 52); print("  워크넷 건설 채용만 받기"); print("=" * 52)
        export_jobs(collect_jobs(_wk, args.sleep))
        save_diag()
        print("완료. 응답 항목은 web/public/data/diag.json 의 worknet_wantedApi 에 남겼습니다.")
        return

    key = api_key()

    # ── 순위 조회 건수를 «시각을 보고» 스스로 정합니다 ──────────────
    #   워크플로 파일(.github/workflows/update.yml)은 보안상 원격에서 못 고칩니다.
    #   그래서 명령에 --ranks 를 안 붙여도 알아서 배분하도록 여기에 둡니다.
    #     · 한국시간 08시·13시 (정밀 회차) → 250건
    #     · 그 밖의 회차                   → 60건
    #   하루 2×250 + 19×60 = 1,640건. 새 개찰이 하루 약 570건이라 밀린 물량을 따라잡습니다.
    #   ⚠️ 손으로 --ranks 를 주면 그 값이 이깁니다 (0 을 주면 순위 조회를 건너뜁니다).
    if args.ranks < 0:
        _h = datetime.now(KST).hour
        args.ranks = 250 if _h in (8, 13) else 60
        print(f"  · 개찰 순위 조회: 이번 회차 {args.ranks}건 "
              f"(한국시간 {_h}시 — 자동 배분)")
    days = args.backfill or args.days
    today = datetime.now(KST)

    if args.probe:
        # 이미 받아 둔 개찰 중 가장 최근 것을 표본 공고로 씁니다.
        # 공고번호를 받아야 하는 오퍼레이션을 «없다» 고 오판하지 않기 위해서입니다.
        _f = load_store("first")
        _rows = sorted((_f.get("con") or {}).values(),
                       key=lambda r: dt_digits(r.get("dt")), reverse=True)
        _no = _rows[0]["no"] if _rows else ""
        _ord = str((_rows[0].get("ord") if _rows else "") or "000") or "000"
        probe_ops(key, today - timedelta(days=1), _no, _ord)
        save_diag()
        return

    print("=" * 52)
    print(f"  조달청 수집 — 최근 {days}일")
    print("=" * 52)

    first = load_store("first")
    live = load_store("live")

    # 다루지 않기로 한 종류(용역)는 저장소에서도 비웁니다.
    # 안 그러면 안 쓰는 자료가 70일 동안 남아 파일만 무거워집니다.
    for _st in (first, live):
        for _k in list(_st.keys()):
            if _k not in KINDS:
                _st[_k] = {}
    added = {"first": 0, "live": 0}

    n_base = 0
    n_lic = 0
    n_aval = 0
    n_win = 0
    for i in range(days - 1, -1, -1):
        day = today - timedelta(days=i)
        ds = day.strftime("%m-%d")
        for kind in KINDS:
            for item in fetch(ENDPOINTS[("first", kind)], key, day,
                              label=f"개찰 {kind} {ds}"):
                r = row_first(item)
                if r:
                    prev = first[kind].get(r["no"]) or {}
                    # 이미 받아둔 기초금액을 덮어쓰지 않는다
                    for f in ("base", "lo", "hi", "lic",
                              "aval", "aparts", "ayn", "gmtrl"):
                        if prev.get(f) is not None:
                            r[f] = prev[f]
                    first[kind][r["no"]] = r
                    added["first"] += 1
            time.sleep(args.sleep)
            for item in fetch(ENDPOINTS[("live", kind)], key, day,
                              label=f"공고 {kind} {ds}"):
                r = row_live(item)
                if r:
                    prev = live[kind].get(r["no"]) or {}
                    for f in ("base", "lo", "hi"):
                        if prev.get(f) is not None:
                            r[f] = prev[f]
                    live[kind][r["no"]] = r
                    added["live"] += 1
            time.sleep(args.sleep)

            # ── 기초금액: 하루치를 통째로 받아 두 저장소에 같이 붙인다 ──
            bm = bsis_by_day(key, day, kind)
            for store in (first, live):
                for no, b in bm.items():
                    row = store[kind].get(no)
                    if row is None:
                        continue
                    if not row.get("base"):
                        row.update(b)
                        n_base += 1
                    else:
                        # ⚠️ 기초금액은 이미 있는데 «다른 칸»이 빈 경우.
                        #    2026-09-03 이전에는 A값만 채우고 예가범위는 안 채웠습니다.
                        #    그래서 base 를 먼저 받아 둔 공고는 lo/hi 를 영영 못 받았습니다.
                        #    응답에 이미 실려 온 값인데 버리고 있었던 것입니다.
                        #    («조달청이 주는 값은 그대로 쓴다» — 버리는 것도 안 쓰는 것입니다)
                        hit = False
                        for f in ("lo", "hi", "aval", "aparts", "ayn", "gmtrl", "lic"):
                            if row.get(f) is None and b.get(f) is not None:
                                row[f] = b[f]
                                hit = True
                        if hit:
                            n_aval += 1
            time.sleep(args.sleep)

            # ── 낙찰자 상세 (주소·전화·참가업체수) ──
            sm = scsbid_by_day(key, day, kind)
            for no, v in sm.items():
                row = first[kind].get(no)
                if row is not None:
                    for f, val in v.items():
                        if not row.get(f):
                            row[f] = val
                    n_win += 1
            time.sleep(args.sleep)

            # ── 면허·업종 제한 ──────────────────────
            # 면허제한은 «등록일» 기준으로 옵니다.
            # 그날 공고만 붙이면 대부분 비어 있게 됩니다 — 저장소 전체에 맞춰봅니다.
            lm = lic_by_day(key, day, kind)
            for no, names in lm.items():
                for store in (live, first):
                    row = store[kind].get(no)
                    if row is not None and not row.get("lic"):
                        row["lic"] = names[:6]
                        n_lic += 1
            time.sleep(args.sleep)

        print(f"  {ds}  1순위 {len(first['con']) + len(first['serv']):,}건 "
              f"/ 공고 {len(live['con']) + len(live['serv']):,}건 "
              f"/ 기초금액 {n_base:,}건 / 빈칸메움 {n_aval:,}건 "
              f"/ 면허 {n_lic:,}건 / 낙찰자상세 {n_win:,}건 누적")

        # ⚠️ 2026-09-03 — 하루가 끝날 때마다 저장합니다.
        #   전에는 «맨 끝에 한 번»만 저장했습니다. 그래서 --days 30 을 돌리다
        #   Ctrl+C 로 멈추면 16일치 조회가 통째로 날아갔습니다 (실제로 겪음).
        #   조달청을 다시 부르는 건 시간도 호출한도도 쓰는 일입니다. 버리면 안 됩니다.
        #   쓰는 비용은 7.8MB 두 번 — 0.3초쯤입니다. 날리는 쪽이 훨씬 비쌉니다.
        try:
            save_store("first", first)
            save_store("live", live)
        except Exception as e:
            print(f"    ! 중간 저장 실패 ({type(e).__name__}) — 계속합니다")

    # ── 화면에 실릴 최근 건 중 기초금액이 빈 것만 공고번호로 개별 보충 ──
    todo = []
    for kind in KINDS:
        # 마감 전 공고를 마감 임박 순으로 — 사람들이 실제로 계산하는 순서입니다
        live_rows = [r for r in live[kind].values()
                     if dt_digits(r.get("close")).ljust(14, "0")
                     >= datetime.now(KST).strftime("%Y%m%d%H%M%S")]
        live_rows.sort(key=lambda r: dt_digits(r.get("close")))
        for r in live_rows:
            if not r.get("base") or not r.get("aval"):
                todo.append((kind, r))
        # 그다음 개찰 목록에서 기초금액이 빈 것
        rows = sorted(trim(first[kind], SHOW_DAYS, "dt").values(),
                      key=lambda r: dt_digits(r.get("dt")), reverse=True)
        for r in rows[:MAX_ROWS]:
            if not r.get("base"):
                todo.append((kind, r))
    seen = set()
    uniq = []
    for kind, r in todo:
        k = (kind, r["no"])
        if k not in seen:
            seen.add(k)
            uniq.append((kind, r))
    # ⚠️ 2026-09-02 — 여기가 조달청 호출의 85% 를 먹고 있었습니다.
    #   빈 건이 1,931건인데 회차마다 «목록 앞에서 250건» 만 물어봤습니다.
    #   목록 순서가 매번 같으니 **같은 250건을 하루 21번 다시 물었고**,
    #   뒤쪽 1,681건은 영영 차례가 오지 않았습니다.
    #   고침: «마지막으로 물어본 시각»을 적어 두고 **오래된 것부터** 돌아가며 묻습니다.
    #   250건씩 돌아가면 1,931건을 8회차(약 4시간)면 한 바퀴 다 돕니다.
    #   ⚠️ 횟수 제한은 두지 않습니다 — 기초금액은 마감 직전에 공개되는 공고가 있어서,
    #      한 번 없다고 끊으면 영영 못 받습니다.
    now_ts = datetime.now(KST).strftime("%Y%m%d%H%M%S")
    uniq.sort(key=lambda kr: str(kr[1].get("bask") or ""))
    if uniq:
        print(f"  · 기초금액 개별조회 {min(len(uniq), BSIS_ONE_CAP):,}건 "
              f"(빈 건 {len(uniq):,} — 오래 안 물어본 것부터)")
        for kind, r in uniq[:BSIS_ONE_CAP]:
            b = bsis_one(key, r["no"], kind)
            r["bask"] = now_ts          # 물어본 시각 (다음 회차에서 뒤로 밀립니다)
            if b:
                had = bool(r.get("base"))
                r.update(b)
                if had:
                    n_aval += 1
                else:
                    n_base += 1
            time.sleep(args.sleep / 2)
    print(f"  · 기초금액 확보 {n_base:,}건")

    # ⚠️ 순서 중요: 잘라내기 전에 누적 CSV 로 먼저 옮긴다
    # ── 소급 보충 ────────────────────────────────────────────────
    #  A값이 비어 있으면 시뮬레이션이 «가정» 으로 돌아갑니다.
    #  그래서 «시켜야 하는» 일로 두지 않고, **모자라면 스스로 채우게** 합니다.
    #    · 최근 45일 개찰 중 A값(또는 A값미적용 표시)을 아는 비율이 60% 미만이면 자동 실행
    #    · 하루 한 번만 (data/store/.fill 에 날짜를 적어 둡니다)
    #    · --fillbsis N 을 주면 조건 없이 N일치 실행
    auto_days = 0
    try:
        cut45 = (datetime.now(KST) - timedelta(days=45)).strftime("%Y%m%d%H%M")
        recent = [r for r in first.get("con", {}).values()
                  if (dt_digits(r.get("dt")) or "0") >= cut45]
        if recent:
            known = sum(1 for r in recent if r.get("aval") or r.get("ayn"))
            cov = known / len(recent)
            mark = os.path.join(STORE, ".fill")
            today = datetime.now(KST).strftime("%Y-%m-%d")
            done_today = os.path.exists(mark) and open(mark).read().strip() == today
            print(f"  · 최근 45일 개찰 {len(recent):,}건 중 A값 아는 것 "
                  f"{known:,}건 ({cov*100:.1f}%)")
            if cov < 0.60 and not done_today:
                auto_days = 45
                print("  · A값이 모자랍니다 — 소급 보충을 스스로 돌립니다")
            elif cov < 0.60:
                print("  · 오늘 이미 소급 보충을 했습니다 — 건너뜁니다")
    except Exception as e:
        print(f"  ! 커버리지 확인 실패 ({type(e).__name__}) — 넘어갑니다")

    fill_days = args.fillbsis or auto_days
    if fill_days > 0 and not NET_DOWN:
        print("-" * 52)
        try:
            backfill_bsis(key, first, live, fill_days, args.sleep)
            try:
                with open(os.path.join(STORE, ".fill"), "w") as f:
                    f.write(datetime.now(KST).strftime("%Y-%m-%d"))
            except Exception:
                pass
            save_store("first", first)
            save_store("live", live)
        except Exception as e:
            print(f"  ! 소급 보충 실패 ({type(e).__name__}: {e}) — 넘어갑니다")

    # ── ★ 개찰 순위 (1위~꼴찌) — 공고번호로 하나씩 받아 채웁니다 ──
    #   날짜로 부르면 안 옵니다. 공고번호로만 옵니다.
    #   한 회차에 args.ranks 건만 채웁니다 (하루 21회차 × 40건 = 840건,
    #   하루 개찰이 약 570건이므로 하루면 다 따라잡습니다).
    #   최근 개찰부터, 아직 1곳뿐인 것만 채웁니다.
    if args.ranks > 0 and not NET_DOWN:
        todo_rank = []
        for kind in KINDS:
            rows = sorted(trim(first[kind], SHOW_DAYS, "dt").values(),
                          key=lambda r: dt_digits(r.get("dt")), reverse=True)
            for r in rows:
                if len(r.get("corps") or []) > 1:
                    continue            # 이미 순위가 붙은 공고는 건너뜁니다
                if r.get("nrank") == 1:
                    continue            # 참가업체가 정말 1곳인 공고 (다시 안 물어봅니다)
                todo_rank.append(r)
        # ⚠️ 기초금액 개별조회에서 겪은 것과 같은 함정을 피합니다.
        #   «앞에서 N건» 만 집으면 응답이 안 오는 공고를 매 회차 다시 묻고,
        #   뒤쪽은 영영 차례가 안 옵니다.
        #   ① 아직 한 번도 안 물어본 것 — 최근 개찰부터
        #   ② 물어봤는데 못 받은 것 — 오래된 것부터 돌아가며
        def _rank_key(r):
            asked = str(r.get("rask") or "")
            dt = (dt_digits(r.get("dt")) or "0")[:14].ljust(14, "0")
            #   ① 안 물어본 것(0) 먼저, ② 물어본 것은 오래된 순,
            #   ③ 같은 조건이면 최근 개찰부터 (문자열을 뒤집어 내림차순)
            return (1 if asked else 0, asked, "".join(chr(9 - int(c)) for c in dt))
        todo_rank.sort(key=_rank_key)
        got = ranked = 0
        for r in todo_rank[:args.ranks]:
            if NET_DOWN:
                break
            cs, total, ladder = openg_ranks(key, r["no"], r.get("ord"))
            r["rask"] = datetime.now(KST).strftime("%Y%m%d%H%M%S")
            time.sleep(args.sleep)
            if not cs:
                continue
            got += 1
            r["corps"] = cs          # 낮은 금액 순 30곳까지
            r["nrank"] = total       # 실제로 받은 전체 투찰 건수
            r["rq"] = ladder         # [[등수, 금액], ...] — 전 구간 사다리
            if len(cs) > 1:
                ranked += 1
                # 1순위 정보도 조달청 순위 자료로 맞춰 둡니다 (더 정확합니다)
                r["win"], r["amt"] = cs[0][0], cs[0][1]
                if cs[0][2]:
                    r["rate"] = cs[0][2]
                if len(cs[0]) > 3 and cs[0][3]:
                    r["bno"] = cs[0][3]
                if len(cs[0]) > 4 and cs[0][4]:
                    r["ceo"] = cs[0][4]
        if todo_rank:
            print(f"  → 개찰 순위 조회 {min(len(todo_rank), args.ranks):,}건 시도 · "
                  f"응답 {got:,}건 · 2곳 이상 {ranked:,}건 "
                  f"(남은 대상 {max(0, len(todo_rank) - args.ranks):,}건)")

    # 사람이 넣어 둔 전체 투찰내역이 있으면 여기서도 붙입니다 (파일로 받은 경우)
    merge_ranks(first)

    archive(first, live)

    for kind in ("con", "serv"):
        first[kind] = trim(first[kind], KEEP_DAYS, "dt")
        live[kind] = trim(live[kind], KEEP_DAYS, "dt")

    save_store("first", first)
    save_store("live", live)

    # 사이트용으로 최근분만 잘라서 내보낸다
    os.makedirs(OUT, exist_ok=True)
    built = datetime.now(KST).strftime("%Y-%m-%d %H:%M")

    def export(name, store, date_field):
        out = {"built": built}
        for kind in ("con", "serv"):   # serv 는 수집하지 않으므로 항상 [] — 형식 유지용
            rows = list(trim(store[kind], SHOW_DAYS, date_field).values())
            rows.sort(key=lambda r: dt_digits(r.get(date_field)), reverse=True)
            # 첫 화면에서 내려받는 파일이라 무겁게 두면 그대로 전송량이 된다
            out[kind] = rows[:MAX_ROWS]
        p = os.path.join(OUT, f"{name}.json")
        with open(p, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"  → {name}.json  공사 {len(out['con']):,} / 용역 {len(out['serv']):,}"
              f"  ({os.path.getsize(p)/1024:.0f}KB)")

    def export_board(name, store, date_field):
        """한 달치를 500건씩 나눠 담는다.

        하루에 1순위 570건·공고 600건이 나오므로 300건만 실으면 반나절치도 안 된다.
        그렇다고 한 달치(약 18,000건, 6MB)를 한 파일에 넣으면 휴대폰에서 무겁다.
        그래서 묶음으로 쪼갠다 — 첫 화면은 0번만 받고,
        검색하거나 지역을 고를 때 나머지를 뒤에서 받아온다.
        """
        out_dir = os.path.join(OUT, "board")
        os.makedirs(out_dir, exist_ok=True)
        meta = {"built": built, "chunk": BOARD_CHUNK}
        total = 0
        for kind in ("con", "serv"):   # serv 는 비어 있음 (형식 유지용)
            rows = list(trim(store[kind], SHOW_DAYS, date_field).values())
            rows.sort(key=lambda r: dt_digits(r.get(date_field)), reverse=True)
            parts = [rows[i:i + BOARD_CHUNK]
                     for i in range(0, len(rows), BOARD_CHUNK)] or [[]]
            for i, part in enumerate(parts):
                with open(os.path.join(out_dir, f"{name}-{kind}-{i}.json"),
                          "w", encoding="utf-8") as f:
                    json.dump(part, f, ensure_ascii=False, separators=(",", ":"))
            # 지난번보다 묶음 수가 줄었을 때 남는 옛 파일을 정리한다.
            # (마운트된 폴더는 삭제가 막힐 수 있어, 안 되면 빈 파일로 덮어쓴다)
            i = len(parts)
            while True:
                stale = os.path.join(out_dir, f"{name}-{kind}-{i}.json")
                if not os.path.exists(stale):
                    break
                try:
                    os.remove(stale)
                except Exception:
                    with open(stale, "w", encoding="utf-8") as f:
                        f.write("[]")
                i += 1

            # ══════════════════════════════════════════════════════════
            #  ★ 검색 색인 — 2026-09-03
            #
            #  검색하면 7주치를 다 뒤져야 하니, 전에는 묶음을 **전부** 받았습니다.
            #  실측 1순위 1,528KB · 공고 1,767KB. 한 번 검색이 안 하는 방문 16명분입니다.
            #
            #  그런데 사람이 실제로 보는 건 «첫 쪽 20건» 입니다. 실측:
            #      「도로」 597건 · 전체를 그리려면 23묶음 · **첫 20건은 1묶음**
            #      「경주시」 65건 · 19묶음      · **첫 20건은 5묶음**
            #  그래서 «걸러내기»에 필요한 최소한만 담은 색인을 따로 만듭니다.
            #  화면은 이 색인으로 몇 건인지·몇 쪽인지를 정확히 세고,
            #  **보고 있는 쪽에 필요한 묶음만** 받아옵니다.
            #
            #  색인 크기: 1순위 358KB · 공고 352KB (전부 받기의 1/4~1/5)
            #  ⚠️ 순서는 묶음을 이어붙인 것과 **정확히 같아야** 합니다.
            #     n번째 항목이 (n÷500)묶음의 (n%500)번째 줄입니다. 이게 어긋나면
            #     검색 결과가 엉뚱한 공고를 가리킵니다. 아래 IDX_F 를 바꿀 땐
            #     useBoard.js 의 읽는 순서도 같이 고치세요.
            # ══════════════════════════════════════════════════════════
            if kind == "con":
                if name == "first":
                    # 1순위: 검색은 공고명·기관·낙찰업체, 지역은 기관·공고명
                    idx = [[r.get("name") or "", r.get("inst") or "",
                            r.get("win") or ""] for r in rows]
                    fields = ["name", "inst", "win"]
                else:
                    # 공고: 검색은 공고명·기관. base/lo/hi 는 「해볼 만한 공고만」 등급 계산용
                    idx = [[r.get("name") or "", r.get("inst") or "",
                            int(r.get("base") or 0),
                            r.get("lo"), r.get("hi")] for r in rows]
                    fields = ["name", "inst", "base", "lo", "hi"]
                with open(os.path.join(out_dir, f"{name}-{kind}-idx.json"),
                          "w", encoding="utf-8") as f:
                    json.dump({"f": fields, "chunk": BOARD_CHUNK, "r": idx},
                              f, ensure_ascii=False, separators=(",", ":"))

            days = sorted({dt_digits(r.get(date_field))[:8] for r in rows if r.get(date_field)})
            meta[kind] = {
                "n": len(rows),
                "parts": len(parts),
                "from": days[0] if days else "",
                "to": days[-1] if days else "",
            }
            total += len(rows)
        with open(os.path.join(out_dir, f"{name}.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))
        size = sum(os.path.getsize(os.path.join(out_dir, x))
                   for x in os.listdir(out_dir) if x.startswith(name + "-"))
        _ix = os.path.join(out_dir, f"{name}-con-idx.json")
        _ixs = os.path.getsize(_ix) / 1024 if os.path.exists(_ix) else 0
        print(f"  → board/{name}  {total:,}건 "
              f"(공사 {meta['con']['parts']}묶음 / 용역 {meta['serv']['parts']}묶음, "
              f"{size/1024/1024:.1f}MB · 검색색인 {_ixs:.0f}KB)")


    def export_bidindex(store, fstore):
        """«바로투찰» 전용 — 아직 마감되지 않은 공고만 담은 가벼운 목록.

        투찰가를 계산하는 사람은 «앞으로 넣을 공고» 만 찾습니다.
        그런데 board/live-* 를 전부 받으면 4MB 가까이 됩니다.
        그래서 마감 전 공고만, 계산에 꼭 필요한 값만 골라
        배열 형태로 담습니다. (이름표를 빼면 크기가 절반쯤 됩니다)
        """
        # GitHub 서버는 세계표준시로 돕니다. 마감시각은 한국시간이라 KST 로 비교해야 합니다.
        now = datetime.now(KST).strftime("%Y%m%d%H%M%S")
        rows = []
        for r in store["con"].values():
            c = re.sub(r"[^0-9]", "", str(r.get("close") or ""))
            if not c:
                continue
            if c.ljust(14, "0") < now:      # 이미 마감된 공고는 뺀다
                continue
            rows.append([
                r.get("no") or "",
                r.get("name") or "",
                r.get("inst") or "",
                int(r.get("base") or 0),
                int(r.get("budget") or 0),
                r.get("close") or "",
                r.get("lo") if r.get("lo") is not None else -3,
                r.get("hi") if r.get("hi") is not None else 3,
                r.get("llr"),                      # 공고가 알려준 낙찰하한율
                int(r.get("est") or 0),            # 공고가 알려준 추정가격
                r.get("lic") or [],                # 면허·업종 제한
                int(r.get("aval") or 0),           # A값 합계 (법정경비)
                int(r.get("gmtrl") or 0),          # 관급자재금액
                r.get("ayn") or "",                # A값 적용 공고인지 (Y/N)
                # ⚠️ aparts(A값 내역)는 여기 없습니다 — aparts.json 으로 뺐습니다.
                #    이유는 아래 export_aparts 주석 참고. 첫 화면 전송량 −29%.
                r.get("ptot") or 0,                # 예비가격 개수
                r.get("pdrw") or 0,                # 추첨 개수
                # 나라장터 공고 주소 — 조달청이 준 것을 그대로 씁니다.
                # 손으로 만들면 차수(000/001/002)를 틀립니다. 실제로 틀렸습니다.
                r.get("url") or "",
                r.get("site") or "",               # 공사 현장 지역 (500/500 채워짐)
                r.get("rgnb") or "",               # 지역제한 판단기준 — 있으면 지역제한 공고
                r.get("joint") or "",              # 공동수급 방식
                r.get("mthd") or "",               # 계약방법 (제한경쟁/일반경쟁…)
                r.get("swin") or "",               # 낙찰방법 상세 (적격심사 기준까지 들어옵니다)
                r.get("rebid") or "",              # 재입찰 여부
            ])
        rows.sort(key=lambda x: re.sub(r"[^0-9]", "", str(x[5])))
        out = {"built": built,
               "f": ["no", "name", "inst", "base", "budget", "close", "lo", "hi",
                     "llr", "est", "lic", "aval", "gmtrl",
                     "ayn", "ptot", "pdrw", "url",
                     "site", "rgnb", "joint", "mthd", "swin", "rebid"],
               "r": rows}
        path = os.path.join(OUT, "bidindex.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        have = sum(1 for x in rows if x[3] > 0)
        print(f"  \u2192 bidindex  \ub9c8\uac10\uc804 {len(rows):,}\uac74 "
              f"(\uae30\ucd08\uae08\uc561 \uc788\ub294 \uac83 {have:,}\uac74, "
              f"{os.path.getsize(path)/1024:.0f}KB)")

    def export_aparts(store):
        """A값 내역(법정경비 항목별)만 따로 담습니다 — 2026-09-03.

        ══════════════════════════════════════════════════════════════
        왜 뺐나 — 실측하고 나서 답이 바뀐 사례입니다.

        bidindex.json 927KB 중 이 항목이 244KB 였습니다. 두 가지를 만들어 재봤습니다:

            ① 이름표(「산업안전보건관리비」…)를 번호로 + 범례
               → raw 927 → 766KB 인데 **gzip 153.7 → 148.1KB. 겨우 5.6KB.**
                 gzip 이 이미 반복 문자열을 지우고 있었습니다. 헛수고였습니다.
            ② 이 파일로 분리
               → **gzip 153.7 → 109.2KB (−29%)**. 이 파일은 37KB.

        ②가 이긴 이유는 «작아서»가 아니라 **첫 화면에서 아예 안 받아서** 입니다.
        A값 내역은 공고 하나를 «고른 뒤»에만 보여주는 것이라, 목록에 실을 이유가 없습니다.

        ⚠️ 교훈: 전송량을 논할 때 raw 크기를 보면 틀립니다. 반드시 gzip 후로 재세요.
        ══════════════════════════════════════════════════════════════
        """
        now = datetime.now(KST).strftime("%Y%m%d%H%M%S")
        ap = {}
        for r in store["con"].values():
            c = re.sub(r"[^0-9]", "", str(r.get("close") or ""))
            if not c or c.ljust(14, "0") < now:
                continue
            v = r.get("aparts")
            if v:
                ap[r.get("no") or ""] = v
        out = {"built": built, "a": ap}
        path = os.path.join(OUT, "aparts.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        print(f"  \u2192 aparts    A값 내역 {len(ap):,}건 "
              f"({os.path.getsize(path)/1024:.0f}KB · 바로투찰 열 때만 받음)")

    def export_bidresult(fstore):
        """«내 계산이 맞았나»를 확인하기 위한 최근 개찰 결과 색인.

        바로투찰 첫 화면에 얹으면 전송량이 두 배가 되므로 별도 파일로 두고
        필요할 때만 받아갑니다. 공고번호 하나로 바로 찾을 수 있게 «지도» 모양입니다.
        """
        cut = (datetime.now(KST) - timedelta(days=7)).strftime("%Y%m%d%H%M")
        out = {}
        for r in (fstore.get("con") or {}).values():
            if (dt_digits(r.get("dt")) or "0") < cut:
                continue
            no = r.get("no")
            if not no:
                continue
            # 전화·주소·대표자는 «있는 공고만» 옵니다(조달청 낙찰자 상세에 실릴 때만).
            # 없으면 빈 문자열로 두고, 화면에서는 아예 감춥니다.
            out[no] = [r.get("win") or "", int(r.get("amt") or 0),
                       r.get("rate"), int(r.get("np") or 0),
                       int(r.get("base") or 0), r.get("dt") or "",
                       r.get("tel") or "", r.get("ceo") or "",
                       r.get("bno") or "", r.get("adr") or "",
                       1 if r.get("tsrc") else 0,
                       # 어떤 공고를 채점하는지 화면에 밝혀야 합니다.
                       # 이게 없어서 «무슨 공고인지 모르겠다» 는 화면이 나왔습니다.
                       str(r.get("name") or "")[:60], str(r.get("inst") or "")[:30],
                       # 채점의 실격 판정에 필요합니다. A값을 모르면 하한을 낮게 잡아
                       # «가져갔을 자리»가 남발됩니다.
                       int(r.get("aval") or 0), r.get("ayn") or "",
                       # ★ 투찰금액 목록(낮은 순, 최대 12개) — «우리 금액이면 몇 위였나» 를
                       #   채점 화면에서 바로 셀 수 있게 합니다. 이름은 넣지 않습니다(용량).
                       [int(c[1]) for c in (r.get("corps") or [])[:12] if c and c[1]],
                       # 순위 사다리 [[등수, 금액], ...] — 우리 금액이 몇 등쯤인지 좁힙니다
                       r.get("rq") or [],
                       int(r.get("nrank") or 0),
                       # ⚠️ 예가범위 — 채점이 그 공고의 사정률 분포를 재현하려면 꼭 필요합니다.
                       #    없어서 ±2% 공고를 ±3% 로 채점했고, 5억 공고 기준 115만원이
                       #    어긋났습니다(실측 106건 중앙값).
                       r.get("lo"), r.get("hi"),
                       # ★ 면허·업종 제한 — 2026-09-03 추가.
                       #   소장님: 「투찰 업체가 1곳이라는 게 말이 돼?」
                       #   말이 됩니다. 그 공고는 면허를 「산림조합(지역조합)」으로 묶어
                       #   자격 되는 곳이 사실상 하나였습니다. 같은 «가곡지구» 사업의
                       #   일반 토목 공고는 같은 홍성군에서 323곳·377곳이 들어왔습니다.
                       #   **자료는 맞는데 화면이 «왜»를 안 알려줘서 의심을 샀습니다.**
                       #   조달청이 lcnsLmtNm 으로 주는 값이라 만들 필요도 없습니다.
                       (r.get("lic") or [])[:3]]
        path = os.path.join(OUT, "bidresult.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"built": built, "f": ["win", "amt", "rate", "np", "base", "dt",
                             "tel", "ceo", "bno", "adr", "tsrc", "name", "inst",
                             "aval", "ayn", "amts", "rq", "nrank", "lo", "hi", "lic"],
                       "r": out}, f, ensure_ascii=False, separators=(",", ":"))
        print(f"  → bidresult 최근 7일 개찰 {len(out):,}건 "
              f"({os.path.getsize(path)/1024:.0f}KB)")

    def export_bandstat(fstore, lstore):
        """규모(추정가격)별 «경쟁 강도»와 «A값 비율».

        - 참가업체수(np): 개찰결과에 조달청이 실어 줍니다. 몇 개사와 붙는지 알면
          투찰률을 얼마나 공격적으로 잡을지 감이 잡힙니다.
        - A값 비율: A값이 아직 공개되지 않은 공고에서 «대략 이만큼»을 보여주기 위한 값입니다.
          추정치라고 화면에 분명히 적습니다.
        """
        BND = [("s", 0, 10e8), ("m", 10e8, 50e8), ("l", 50e8, 100e8), ("xl", 100e8, None)]

        def band_of(est):
            for k, lo, hi in BND:
                if est >= lo and (hi is None or est < hi):
                    return k
            return None

        def med(v):
            if not v:
                return None
            v = sorted(v)
            n = len(v)
            return v[n // 2] if n % 2 else (v[n // 2 - 1] + v[n // 2]) / 2

        cut = (datetime.now(KST) - timedelta(days=60)).strftime("%Y%m%d%H%M")
        nps, ars = {k: [] for k, _, _ in BND}, {k: [] for k, _, _ in BND}

        for r in (fstore.get("con") or {}).values():
            if (dt_digits(r.get("dt")) or "0") < cut:
                continue
            base = int(r.get("base") or 0)
            np_ = int(r.get("np") or 0)
            if base <= 0 or np_ <= 0:
                continue
            b = band_of(base / 1.1)
            if b:
                nps[b].append(np_)

        for r in (lstore.get("con") or {}).values():
            base = int(r.get("base") or 0)
            av = int(r.get("aval") or 0)
            if base <= 0 or av <= 0 or r.get("ayn") == "N":
                continue
            b = band_of(int(r.get("est") or 0) or base / 1.1)
            if b:
                ars[b].append(av / base)

        out = {"built": built, "bands": {}}
        for k, _, _ in BND:
            v = sorted(nps[k])
            out["bands"][k] = {
                "n": len(v),
                "npMed": med(v),
                "npLo": v[int(len(v) * 0.25)] if v else None,
                "npHi": v[int(len(v) * 0.75)] if v else None,
                "arN": len(ars[k]),
                "ar": round(med(ars[k]), 5) if ars[k] else None,
            }
        path = os.path.join(OUT, "bandstat.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        line = " / ".join(
            f"{k}:{out['bands'][k]['n']}건·중앙{out['bands'][k]['npMed']}개사"
            for k, _, _ in BND)
        print(f"  → bandstat  {line}")

    def fill_contacts(fstore):
        """주소·전화 메우기.

        조달청은 낙찰자 상세를 «주는 공고»에만 실어 줍니다 — 실측 31%.
        그런데 같은 업체(사업자번호)가 다른 공고에서는 주소·전화와 함께 나옵니다.
        그래서 사업자번호로 이어 붙입니다. 가장 최근에 확인된 값을 씁니다.
        빌려온 값은 tsrc 로 표시해, 화면에서 «다른 공고에서 확인» 이라고 밝힙니다.
        (없는 걸 지어내지 않습니다 — 조달청이 준 값을 옮겨 담을 뿐입니다)"""
        book = {}
        for r in (fstore.get("con") or {}).values():
            bno = (r.get("bno") or "").strip()
            if not bno or not (r.get("tel") or r.get("adr")):
                continue
            d = dt_digits(r.get("dt")) or ""
            cur = book.get(bno)
            if cur is None or d > cur[0]:
                book[bno] = (d, r.get("tel") or "", r.get("adr") or "")
        n = 0
        for r in (fstore.get("con") or {}).values():
            if r.get("tel") or r.get("adr"):
                continue
            got = book.get((r.get("bno") or "").strip())
            if not got:
                continue
            _, tel, adr = got
            if tel:
                r["tel"] = tel
            if adr:
                r["adr"] = adr
            r["tsrc"] = 1
            n += 1
        have = sum(1 for r in (fstore.get("con") or {}).values() if r.get("tel") or r.get("adr"))
        tot = len(fstore.get("con") or {})
        print(f"  → 연락처 {n:,}건을 다른 공고에서 이어붙임 "
              f"(전체 {have:,}/{tot:,} = {have/max(tot,1)*100:.0f}%)")

    try:
        fill_contacts(first)
    except Exception as e:
        print(f"  ! 연락처 잇기 실패 ({type(e).__name__}: {e}) — 넘어갑니다")


    print("-" * 52)
    export("first", first, "dt")
    export("live", live, "dt")
    export_board("first", first, "dt")
    export_board("live", live, "dt")
    export_bidindex(live, first)
    export_aparts(live)
    # 새로 붙인 통계라 혹시 터져도 배치 전체를 멈추지 않게 감쌉니다.
    try:
        export_bidresult(first)
        export_bandstat(first, live)
    except Exception as e:
        print(f"  ! bandstat 실패 ({type(e).__name__}: {e}) — 넘어갑니다")
    # ── 워크넷 건설 채용 (키가 있을 때만) ──────────────────────
    try:
        _wk = os.environ.get("WORKNET_API_KEY", "").strip()
        _h = datetime.now(KST).hour
        if _wk and (args.jobs or _h in (8, 13)):
            print("-" * 52)
            export_jobs(collect_jobs(_wk, args.sleep))
        elif _wk:
            export_jobs(load_jobs_store())
        else:
            print("  · 워크넷: WORKNET_API_KEY 없음 — 건너뜀 (.env 에 넣으면 돕니다)")
    except Exception as e:
        print(f"  ! 워크넷 실패 ({type(e).__name__}: {e}) — 넘어갑니다")

    save_diag()
    print("✅ 수집 완료")


if __name__ == "__main__":
    main()
