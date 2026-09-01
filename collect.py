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
ARCH_COLS = ["공고번호", "날짜", "발주기관", "공고명",
             "1순위업체", "사업자번호", "대표자", "투찰금액", "투찰률", "기초금액"]

BASE = "http://apis.data.go.kr/1230000"
ENDPOINTS = {
    ("first", "con"):  f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwk",
    ("first", "serv"): f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoServc",
    ("live",  "con"):  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwk",
    ("live",  "serv"): f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServc",
}

# 기초금액(예정가격 산정의 기준이 되는 금액). 공고 목록에는 안 들어있고 별도 오퍼레이션이다.
BSIS = {
    "con":  f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoCnstwkBsisAmount",
    "serv": f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoServcBsisAmount",
}
BSIS_ONE_CAP = 150   # 목록조회로 못 채운 건은 공고번호로 개별조회 (하루 호출량 방어)

# 면허·업종 제한. 입찰에서 이게 제일 먼저 걸리는 조건인데
# 공고 목록에는 안 들어 있고 별도 오퍼레이션으로 옵니다.
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


def fetch(url, key, day=None, extra=None, label=""):
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
        return []
    try:
        j = r.json()
    except Exception:
        head = " ".join(r.text.split())[:180]
        print(f"    ! {tag} JSON 아님 → {head}")
        return []
    resp = j.get("response", {}) if isinstance(j, dict) else {}
    head = resp.get("header", {}) or {}
    code = str(head.get("resultCode", "")).strip()
    if code and code not in ("00", "0"):
        print(f"    ! {tag} 응답코드 {code} · {head.get('resultMsg', '')}")
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


def lic_by_day(key, day, kind):
    """하루치 면허·업종 제한을 통째로 받아 {공고번호: [제한명, ...]} 로.

    한 공고에 여러 줄이 올 수 있습니다 (토목 + 건축 처럼).
    항목 이름이 문서와 다를 때가 있어 후보를 여러 개 두고 찾습니다."""
    out = {}
    for it in fetch(LIC[kind], key, day, None, label=f"면허제한 {kind} {day:%m-%d}"):
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
PROBE_OPS = [
    ("개찰결과 투찰업체", f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoCnstwkPPSSrch"),
    ("개찰 참가업체",     f"{BASE}/as/ScsbidInfoService/getBidPblancListInfoCnstwkBidPrceList"),
    ("투찰 목록",         f"{BASE}/as/ScsbidInfoService/getOpengResultListInfoBidPrceList"),
    ("낙찰자 목록",       f"{BASE}/as/ScsbidInfoService/getScsbidListSttusCnstwk"),
    ("면허·업종 제한",    f"{BASE}/ad/BidPublicInfoService/getBidPblancListInfoLicenseLimit"),
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


def probe_ops(key, day):
    print("-" * 52)
    print("진단 — 투찰업체 전체를 주는 오퍼레이션이 있는지 확인")
    for label, url in PROBE_OPS:
        if NET_DOWN:
            print("  · 통신이 막혀 진단을 건너뜁니다")
            return
        items = fetch(url, key, day=day, label=f"[진단]{label}")
        op = url.rsplit("/", 1)[-1]
        if not items:
            DIAG.setdefault("_probe", {})[label] = {"op": op, "rows": 0}
            print(f"  · {label}: 응답 없음")
            continue
        one = items[0] if isinstance(items, list) else items
        keys = sorted(one.keys()) if isinstance(one, dict) else []
        DIAG.setdefault("_probe", {})[label] = {
            "op": op, "rows": len(items), "fields": keys,
            "sample": {k: str(v)[:60] for k, v in list(one.items())[:60]}
            if isinstance(one, dict) else {}}
        print(f"  ✓ {label}: {len(items)}건 · 항목 {', '.join(keys)[:400]}")
    print("-" * 52)


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


def archive(first):
    """이번에 받은 개찰 결과를 달별 누적 CSV 에 덧붙인다. 지우지 않는다."""
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
            })

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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--backfill", type=int, default=0)
    ap.add_argument("--sleep", type=float, default=0.6)
    ap.add_argument("--probe", action="store_true",
                    help="투찰업체 전체를 주는 오퍼레이션이 있는지 한 번 확인만 합니다")
    args = ap.parse_args()

    load_env()
    key = api_key()
    days = args.backfill or args.days
    today = datetime.now(KST)

    if args.probe:
        probe_ops(key, today - timedelta(days=1))
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
                    if row is not None and not row.get("base"):
                        row.update(b)
                        n_base += 1
            time.sleep(args.sleep)

            # ── 면허·업종 제한 ──────────────────────
            lm = lic_by_day(key, day, kind)
            for no, names in lm.items():
                row = live[kind].get(no)
                if row is not None:
                    row["lic"] = names[:6]
                    n_lic += 1
            time.sleep(args.sleep)

        print(f"  {ds}  1순위 {len(first['con']) + len(first['serv']):,}건 "
              f"/ 공고 {len(live['con']) + len(live['serv']):,}건 "
              f"/ 기초금액 {n_base:,}건 / 면허 {n_lic:,}건 누적")

    # ── 화면에 실릴 최근 건 중 기초금액이 빈 것만 공고번호로 개별 보충 ──
    todo = []
    for kind in KINDS:
        for store, fld in ((first, "dt"), (live, "dt")):
            rows = sorted(trim(store[kind], SHOW_DAYS, fld).values(),
                          key=lambda r: dt_digits(r.get(fld)), reverse=True)
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
    if uniq:
        print(f"  · 기초금액 개별조회 {min(len(uniq), BSIS_ONE_CAP):,}건 "
              f"(빈 건 {len(uniq):,})")
        for kind, r in uniq[:BSIS_ONE_CAP]:
            b = bsis_one(key, r["no"], kind)
            if b:
                r.update(b)
                n_base += 1
            time.sleep(args.sleep / 2)
    print(f"  · 기초금액 확보 {n_base:,}건")

    # ⚠️ 순서 중요: 잘라내기 전에 누적 CSV 로 먼저 옮긴다
    archive(first)

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
        print(f"  → board/{name}  {total:,}건 "
              f"(공사 {meta['con']['parts']}묶음 / 용역 {meta['serv']['parts']}묶음, "
              f"{size/1024/1024:.1f}MB)")


    def export_bidindex(store):
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
                r.get("aparts") or [],             # A값 내역
                r.get("ptot") or 0,                # 예비가격 개수
                r.get("pdrw") or 0,                # 추첨 개수
            ])
        rows.sort(key=lambda x: re.sub(r"[^0-9]", "", str(x[5])))
        out = {"built": built,
               "f": ["no", "name", "inst", "base", "budget", "close", "lo", "hi",
                     "llr", "est", "lic", "aval", "gmtrl",
                     "ayn", "aparts", "ptot", "pdrw"],
               "r": rows}
        path = os.path.join(OUT, "bidindex.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
        have = sum(1 for x in rows if x[3] > 0)
        print(f"  \u2192 bidindex  \ub9c8\uac10\uc804 {len(rows):,}\uac74 "
              f"(\uae30\ucd08\uae08\uc561 \uc788\ub294 \uac83 {have:,}\uac74, "
              f"{os.path.getsize(path)/1024:.0f}KB)")

    print("-" * 52)
    export("first", first, "dt")
    export("live", live, "dt")
    export_board("first", first, "dt")
    export_board("live", live, "dt")
    export_bidindex(live)
    save_diag()
    print("✅ 수집 완료")


if __name__ == "__main__":
    main()
