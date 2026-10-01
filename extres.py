# -*- coding: utf-8 -*-
"""extres.py — 🏗 나라장터 밖 공고의 «개찰 결과» 모으기 → 사정률 · 낙찰하한율 · 1순위 투찰률 (2026-09-30)

소장님: 「나라장터 밖 공고에는 바로 입찰 이런게 왜 없어?」 「한꺼번에 다 할 수 없어?」 → «LH · 국방 같이»
    수자원 · 아파트 · 민간은 공고에 기초금액 · 예정가격이 없어 누가 해도 투찰금액을 셈할 수 없습니다.
    LH · 국방(시설)은 공고에 기초금액이 있고, 개찰 결과 API 가 예정가격까지 줍니다 → 바로투찰과 같은 셈이 됩니다.

■ 무엇을 모으나
    LH   B552555/OpenTenderopenList/getOpenTenderopenList  (개찰일 openDtmStart~End · YYYYMMDD)
         한 줄 = 한 업체. 설계가격 · 예정가격 · 기초금액 · 가격점수제외금액(A값) · 업체별 투찰금액 · 예가대비 투찰률 ·
         상태(낙찰하한율 미만 · 미심사 · 예가초과) → 공고마다 한 줄로 접습니다.
    국방 1690000/BidResultInfoService — 시설 경쟁입찰결과 목록 → 상세(기초예비가격 · 사정률 상하한 · 낙찰하한율) ·
         복수예비가격(고른 것 평균 = 예정가격) · 참가업체(1순위 낙찰률 · 참가 수). 하루 100번 한도 → 회차당 몇 건만.
         ⚠️ 활용신청(2026-09-30 소장님 로그인 뒤)이 승인되기 전에는 «등록 안 된 키» 가 옵니다 — 조용히 넘어갑니다.

■ 셈 (공고 한 줄 · 화면에서 바로투찰과 «같은 함수» smartBid 로)
    사정률 = 예정가격 ÷ 기초금액 × 100   → 기관별 가운데값(p50) · 표준편차(sd)
    낙찰하한율 — LH 는 공고에 안 적혀 있어 개찰에서 거꾸로 봅니다: «낙찰하한율 미만» 이 아닌 가장 낮은 투찰률(llH)과
                 «미만» 가운데 가장 높은 투찰률(llL) 사이에 있습니다. 규모(기초금액)별 가운데값을 씁니다.
                 국방은 상세에 낙찰하한율이 적혀 옵니다.
    ⚠️ 모자라면 셈하지 않습니다 — 화면은 «자료 모으는 중 (N건)» 만 보입니다(CLAUDE.md «없는 숫자를 만들지 않는다»).

■ 🏆 1순위 · 낙찰 화면(G85 · /ext?t=first · publish_first → web/public/data/ext/first.json)
    위 둘에 1순위 업체 이름을 더하고, 셈에는 안 쓰는 세 곳을 더 모읍니다 — 수자원 입찰 결과현황(rstList) ·
    아파트 K-apt 마감일 조회(낙찰/유찰 사유) · 누리장터 민간낙찰정보(낙찰된 목록 + 개찰결과). 최근 30일만 내보냅니다.
    ⚠️ 업체 이름만 둡니다 — 사업자번호 · 대표자 · 주소 · 전화 · 담당자는 받아도 버립니다. 진단에는 이름을 안 남깁니다.

■ 어디에 두나   data/store/ext_res.json (공고별 한 줄 · 400일) · ext_res_book.json (받은 날 · 호출 수) — Actions cache
■ ⚠️ import 때 아무것도 읽지 않습니다 · 오류는 «종류 이름» 만(주소에 인증키) — extbids.py 와 같은 규칙.
"""
import json
import os
import re
import statistics
import time
from datetime import datetime, timedelta

import extbids as E

RES_STORE = os.path.join(E.STORE, "ext_res.json")
RES_BOOK = os.path.join(E.STORE, "ext_res_book.json")
RES_BUDGET_S = int(os.environ.get("EXT_RES_BUDGET_S", "150"))
RES_KEEP_DAYS = 400

LH_URL = f"{E.B}/B552555/OpenTenderopenList/getOpenTenderopenList"
LH_BACK = 120            # 이만큼 거슬러 올라가 모읍니다(회차마다 조금씩)
LH_OLD_PER_RUN = 3       # 한 회차에 채우는 옛날 날짜 수
LH_ROWS = 1000
LH_PAGES = 12            # 하루 치 쪽 상한(업체 줄이라 많습니다)
LH_CAP = 400             # 하루 호출 상한

D = f"{E.B}/1690000/BidResultInfoService"
DAPA_LIST = f"{D}/getFcltyCmpetBidResultList"
DAPA_DETAIL = f"{D}/getFcltyCmpetBidResultDetail"
DAPA_BSIC = f"{D}/getFcltyCmpetBidResultBsicList"
DAPA_MNUF = f"{D}/getFcltyCmpetBidResultMnufList"
DAPA_BACK = 120
DAPA_PER_RUN = 4         # 한 회차에 자세히 보는 공고 수(한 건에 3번 · 오퍼레이션마다 하루 100번)
DAPA_DAY = 25            # 하루에 자세히 보는 공고 수 상한 → 오퍼레이션마다 하루 25번 + 목록 하루 한두 번

# 🏆 1순위(낙찰) 화면 — 수자원 · 아파트 · 민간 (2026-09-30 소장님 「lh나 국방 등 이런 데는 낙찰된 것은 왜 없어?」 → «다섯 곳 다»)
KW_RST = f"{E.B}/B500001/ebid/tndr3/rstList"          # 입찰 결과현황 — 검색년월(YYYYMM) · 낙찰금액 · 낙찰자 · 상태
KW_PAGES = 6
KW_CAP = 300
KW_GAP_S = 110 * 60
# 🔁 2026-10-01 (G94) — «입찰공고» 서비스(ApHusBidPblAncInfoOfferServiceV3)의 마감일 조회에는 결과가 없었습니다
#    (10/1 08:31 진단: 받은 줄 31 · «낙찰/유찰 사유» 적힌 줄 0 → 아파트 1순위 0건).
#    결과는 따로인 «공동주택 입찰결과공지 정보제공 서비스»(data.go.kr 15059177) — 10/1 활용신청 · 자동승인.
#    같은 이름의 기능(getBidClosDeSearchV3)에 «낙찰/유찰사유 · 계약 · 낙찰금액» 칸이 더 있습니다.
KAPT_CLOS = f"{E.B}/1613000/ApHusBidResultNoticeInfoOfferServiceV3/getBidClosDeSearchV3"   # 마감일로 — «낙찰/유찰 사유»
KAPT_SVC = 2             # 부르는 서비스가 바뀌면 날짜 모양(v) · 돌림 자리(ptr) · 떠보기 날을 처음부터 다시
KAPT_BACK = 21           # 마감이 이만큼 지난 공고까지 사유를 다시 봅니다(사유는 며칠 뒤에 채워집니다)
KAPT_PER_RUN = 3         # 한 회차에 보는 마감일 수(어제는 늘 + 돌아가며 둘)
KAPT_PAGES = 4
KAPT_CAP = 400
NURI_S = f"{E.B}/1230000/ao/PrvtScsbidInfoService"    # 누리장터 민간낙찰정보(2026-09-30 활용신청 승인)
NURI_SCS = f"{NURI_S}/getPrvtScsbidListSttus"          # 낙찰된 목록 — 업무구분 · 최종낙찰업체 · 금액 · 낙찰률
NURI_OPENG = f"{NURI_S}/getPrvtOpengResultListInfo"    # 개찰결과 — 진행구분(개찰완료 · 유찰 · 재입찰) · 1순위
NURI_BACK = 35
NURI_OLD_PER_RUN = 2
NURI_PAGES = 5
NURI_CAP = 600
# 🔎 떠보기 — 명세만으로는 조회구분 · 날짜 모양을 확정할 수 없는 곳. 지금 모양으로 0건이면(하루 한 번) 다른 모양으로 1쪽씩 물어
#    건수가 나오는 모양을 골라 둡니다(book «v»). 진단 «probe» 에 모양마다 건수만 남깁니다.
NURI_SCS_TRY = [{"inqryDiv": "1"}, {"inqryDiv": "1", "bsnsDivCd": "3"}, {"inqryDiv": "3"},
                {"inqryDiv": "3", "bsnsDivCd": "3"}, {"inqryDiv": "2"}]
KW_TRY = [{"_type": "json"}, {}]                               # JSON · XML
KAPT_TRY = ["one", "range", "one-", "range-"]                   # 하루 · 사흘 · 대시 모양
FIRST_DAYS = 30          # 1순위 화면에 내보내는 날 수
FIRST_MAX = 400          # 기관마다 내보내는 상한(폰에서 가볍게)

EDGES = [3e8, 1e9, 5e9, 1e10]    # 규모(기초금액) 칸 — 3억 · 10억 · 50억 · 100억


def 칸(base):
    for i, e in enumerate(EDGES):
        if base < e:
            return i
    return len(EDGES)


def _f(v):
    try:
        return float(str(v).replace(",", "").strip())
    except Exception:
        return None


# ── LH: 업체 줄 → 공고 한 줄 ─────────────────────────────────────
def lh_fold(rows):
    """개찰 줄(업체마다 한 줄)을 공고마다 한 줄로 접습니다."""
    box = {}
    for r in rows:
        no = E._s(r.get("bidNum"), 40)
        if not no:
            continue
        k = f"{no}-{E._s(r.get('bidDegree'), 6) or '0'}"
        b = box.get(k)
        if b is None:
            b = box[k] = {"no": no, "ord": E._s(r.get("bidDegree"), 6),
                          "d": E.ymdhm(r.get("openDtm"))[:10], "nm": E._s(r.get("bidnmKor"), 80),
                          "kind": E._s(r.get("cstrtnJobGbNm"), 10),
                          "base": E._won(r.get("fdmtlAmt")), "exp": E._won(r.get("expectPrc")),
                          "des": E._won(r.get("designPrc")), "A": E._won(r.get("prcscoreExclusAmt")),
                          "np": 0, "_ok": [], "_under": []}
        b["np"] += 1
        rate = _f(r.get("invtgtRate"))
        st = E._s(r.get("vndrSccfBidStatusNm"), 30)
        if not rate or rate <= 0:
            continue
        if "미만" in st:
            b["_under"].append(rate)
        elif "초과" in st:
            continue
        else:
            # 🏆 업체 이름은 1순위 화면에만 씁니다(공개된 개찰 결과) — 진단(diag)에는 남기지 않습니다
            b["_ok"].append((rate, E._won(r.get("decTndrAmt")), E._s(r.get("tndrVndrNm"), 40)))
    out = {}
    for k, b in box.items():
        ok, under = b.pop("_ok"), b.pop("_under")
        if ok:
            r1 = min(ok)
            b["r1"], b["a1"], b["llH"] = round(r1[0], 4), r1[1], round(r1[0], 4)
            if r1[2]:
                b["w"] = r1[2]
        elif b["np"]:
            b["st"] = "유효 투찰 없음"      # 모두 낙찰하한율 미만 · 예가초과
        if under:
            b["llL"] = round(max(under), 4)
        if b["base"] > 0 and b["exp"] > 0:
            b["sj"] = round(b["exp"] / b["base"] * 100, 4)
        out[k] = {kk: v for kk, v in b.items() if v not in ("", None, 0) or kk in ("np",)}
    return out


# ── 🏆 수자원 · 아파트 · 민간: 한 줄 → 1순위 화면 한 줄 ────────────────
def _clean(v):
    return {k: x for k, x in v.items() if x not in ("", None, 0) or k == "np"}


def kw_row(r):
    """수자원 입찰 결과현황 한 줄 — 공사만 · 개찰일이 있는 것만. 담당자 이름은 두지 않습니다"""
    no = E._s(r.get("tndrPbanno"), 40)
    k = E._s(r.get("cntrctDivNm"), 20)
    if not no or (k and "공사" not in k):
        return None
    d = E.ymdhm(r.get("cardPrcsDt"))
    if not d:
        return None
    v = {"no": no, "d": d[:10], "nm": E._s(r.get("tndrPblancNm"), 80),
         "org": ("수자원 " + E._s(r.get("dept"), 40)).strip(), "kind": "공사",
         "st": E._s(r.get("cntrctPrgstsNm"), 20), "mthd": E._s(r.get("ctrmthdNm"), 30),
         "win": E._s(r.get("sucbidrDcsnMthNm"), 30),
         "a1": E._won(r.get("scsbidAmt")), "w": E._s(r.get("entrpsNm"), 40)}
    return _clean(v)


def kapt_state(why):
    """K-apt «낙찰/유찰 사유» 글 → 낙찰 · 유찰 · 결과(둘 다 아니면). 유찰을 먼저 봅니다(«낙찰자 없어 유찰»)"""
    t = str(why or "")
    if "유찰" in t:
        return "유찰"
    if "낙찰" in t:
        return "낙찰"
    return "결과"


def kapt_row(r):
    """K-apt 마감 지난 공고 한 줄 — 공사(분류코드)이고 «낙찰/유찰 사유» 가 적힌 것만"""
    no = E._s(r.get("bidNum"), 40)
    why = E._s(r.get("bidReason"), 120)
    if not no or not why:
        return None
    if E.kapt_kind(r.get("bidTitle"), r.get("codeClassifyType1"), r.get("codeClassifyType2")) != "공사":
        return None
    area = re.sub(r"[^0-9]", "", str(r.get("bidArea") or ""))[:2]
    v = {"no": no, "d": E.ymdhm(r.get("bidDeadline"))[:10], "nm": E._s(r.get("bidTitle"), 80),
         "org": E._s(r.get("bidKaptname"), 60), "sido": E.KAPT_SIDO.get(area, ""), "kind": "공사",
         "st": kapt_state(why), "why": why, "win": E.KAPT_SUCWAY.get(E._s(r.get("codeSucWay"), 4), "")}
    return _clean(v) if v["d"] else None


def kapt_q(day, v):
    """K-apt 마감일 조회 값 — v: KAPT_TRY 번호 (day = YYYYMMDD)"""
    kind = KAPT_TRY[v if 0 <= v < len(KAPT_TRY) else 0]
    d1 = datetime.strptime(day, "%Y%m%d")
    d0 = d1 - timedelta(days=2) if kind.startswith("range") else d1
    f = (lambda d: d.strftime("%Y-%m-%d")) if kind.endswith("-") else (lambda d: d.strftime("%Y%m%d"))
    return {"startDate": f(d0), "endDate": f(d1)}


def nuri_key(r):
    return f"{E._s(r.get('bidNtceNo'), 40)}-{E._s(r.get('bidNtceOrd'), 6) or '0'}"


def nuri_scs_row(r):
    """누리장터 민간 «낙찰된 목록» 한 줄 — 공사만. 대표자 · 주소 · 전화는 받아도 두지 않습니다"""
    no = E._s(r.get("bidNtceNo"), 40)
    if not no or "공사" not in E._s(r.get("bsnsDivNm"), 20):
        return None
    v = {"no": no, "ord": E._s(r.get("bidNtceOrd"), 6), "rb": E._s(r.get("rbidNo"), 6),
         "d": E.ymdhm(r.get("rlOpengDt")), "nm": E._s(r.get("bidNtceNm"), 80),
         "org": E._s(r.get("dminsttNm"), 60), "kind": "공사", "st": "낙찰",
         "np": E._won(r.get("prtcptCnum")), "a1": E._won(r.get("sucsfbidAmt")),
         "r1": _f(r.get("sucsfbidRate")), "w": E._s(r.get("bidwinnrNm"), 40)}
    return _clean(v) if v["d"] else None


def nuri_corp(raw):
    """개찰업체정보 '업체명^사업자번호^대표자^금액^투찰률|…' → (이름, 금액, 투찰률) 1순위만. 번호 · 대표자는 버립니다"""
    for chunk in str(raw or "").split("|")[:1]:
        p = chunk.split("^")
        if len(p) >= 5 and p[0].strip():
            return E._s(p[0], 40), E._won(p[3]), _f(p[4])
    return None


def nuri_openg_row(r, old=None):
    """누리장터 민간 «개찰결과» 한 줄 → 진행구분 · 참가 수 · 1순위. 이미 «낙찰» 로 받은 줄이면 낙찰 값을 지킵니다"""
    v = dict(old or {})
    no = E._s(r.get("bidNtceNo"), 40)
    if not no:
        return None
    v.update({k: x for k, x in {
        "no": no, "ord": E._s(r.get("bidNtceOrd"), 6), "rb": E._s(r.get("rbidNo"), 6),
        "nm": v.get("nm") or E._s(r.get("bidNtceNm"), 80), "org": v.get("org") or E._s(r.get("dminsttNm"), 60),
        "kind": "공사"}.items() if x})
    d = E.ymdhm(r.get("opengDt"))
    if d and d > (v.get("d") or ""):
        v["d"] = d                      # 재입찰이면 늦은 개찰일로
    n = E._won(r.get("prtcptCnum"))
    if n:
        v["np"] = n
    if v.get("st") != "낙찰":
        st = E._s(r.get("progrsDivCdNm"), 20)
        if st:
            v["st"] = st
        c = nuri_corp(r.get("opengCorpInfo"))
        if c:
            v["w"], v["a1"], v["r1"] = c
    return _clean(v) if v.get("d") else None


def _shape(text, params=None):
    """0건일 때 진단에 남기는 «응답 모양» — 칸 이름 · 결과코드 · 전체건수만(값은 남기지 않습니다 — 업체 이름이 들 수 있음).
       params 는 인증키를 뺀 요청 값(날짜 · 조회구분)만."""
    t = (text or "").strip()
    out = {"len": len(t)}
    if params:
        out["q"] = {k: str(v)[:16] for k, v in params.items() if k.lower() != "servicekey"}
    if t[:1] in "{[":
        try:
            j = json.loads(t)
        except Exception:
            out["fmt"] = "json?"
            return out

        def walk(x, d=0):
            if d > 5:
                return "…"
            if isinstance(x, dict):
                return {k: (E._s(v, 40) if k in ("resultCode", "resultMsg", "totalCount", "numOfRows", "pageNo")
                            else walk(v, d + 1)) for k, v in list(x.items())[:14]}
            if isinstance(x, list):
                return [walk(x[0], d + 1), len(x)] if x else []
            return type(x).__name__
        out["fmt"], out["keys"] = "json", walk(j)
        return out
    out["fmt"] = "xml" if t[:1] == "<" else "text"
    tags = []
    for m in re.finditer(r"<([A-Za-z_][\w.-]*)", t[:6000]):
        if m.group(1) not in tags:
            tags.append(m.group(1))
    out["tags"] = tags[:30]
    for k in ("resultCode", "resultMsg", "totalCount", "returnReasonCode", "returnAuthMsg"):
        m = re.search(r"<%s>([^<]{0,60})</%s>" % (k, k), t)
        if m:
            out[k] = m.group(1)
    return out


def _day_list(now, book, back, per_run):
    """오늘 · 어제는 늘 · 그보다 옛날은 아직 안 받은 날부터 per_run 개"""
    done = set(book.get("days") or [])
    days = [now.strftime("%Y%m%d"), (now - timedelta(days=1)).strftime("%Y%m%d")]
    old = [(now - timedelta(days=i)).strftime("%Y%m%d") for i in range(2, back + 1)]
    days += [d for d in old if d not in done][:per_run]
    return days


def fetch(key, now=None, no_net=False, diag=None, get=None):
    now = now or datetime.now(E.KST)
    store = E._load(RES_STORE, {})
    book = E._load(RES_BOOK, {})
    today = now.strftime("%Y-%m-%d")
    dg = {}
    if no_net or not key:
        if diag is not None:
            diag["_extres"] = {"건너뜀": "바깥을 부르지 않는 회차" if no_net else "인증키 없음"}
        return {}
    if get is None:
        import requests
        try:
            import urllib3
            urllib3.disable_warnings()
        except Exception:
            pass

        def get(url, params, timeout):
            q = dict(params)
            q["serviceKey"] = key
            r = requests.get(url, params=q, timeout=timeout, verify=False, headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code != 200:
                raise E._Http(r.status_code, E._scrub(E._s(E.decode(r.content), 160)))
            return E.decode(r.content)
    t0 = time.time()
    got = {}

    def 부름(bk, url, params, rec):
        if bk.get("day") != today:
            bk.update(day=today, calls=0, quota=False)
        if bk.get("quota") or time.time() - t0 > RES_BUDGET_S:
            return None, {"code": "skip"}
        bk["calls"] = int(bk.get("calls") or 0) + 1
        rec["calls"] = rec.get("calls", 0) + 1
        try:
            text = get(url, params, E.EXT_TIMEOUT_S)
        except E._Http as e:
            return None, {"http": e.status, "body": e.body}
        except Exception as e:
            return None, {"net": E._why(e)}
        rows, tot, err = E.parse(text)
        if err and err.get("quota"):
            bk["quota"] = True
        if not rows and "shape" not in rec:
            rec["shape"] = _shape(text, params)          # 0건이면 왜 0건인지 볼 수 있게(칸 이름 · 결과코드만)
        return (rows, tot), err

    def 떠보기(bk, rec, url, qs):
        """qs: 물어볼 값들(쪽 · 줄 수 빼고). 건수가 나오는 첫 번호 — 없으면 None. 하루 한 번만"""
        if bk.get("probe_at") == today:
            return None
        bk["probe_at"] = today
        seen = []
        for i, q in enumerate(qs):
            res, err = 부름(bk, url, dict(q, pageNo="1", numOfRows="10"), rec)
            if err:
                if err.get("code") == "skip":              # 시간 · 한도로 못 물었으면 오늘 다시 떠볼 수 있게
                    bk["probe_at"] = ""
                    break
                seen.append("x" + str(err.get("code") or err.get("http") or err.get("net") or "?")[:12])
                continue
            n = res[1] or len(res[0])
            seen.append(n)
            if n > 0:
                rec["probe"] = seen
                return i
        rec["probe"] = seen
        return None

    # ── LH ──
    bk = book.setdefault("lhr", {})
    rec = dg.setdefault("lhr", {})
    box = store.setdefault("lhr", {})
    n0 = len(box)
    if bk.get("wv") != 1:
        # 🏆 1순위 업체 이름을 모으기 전(G84)에 받은 날 — 1순위 화면에 보일 최근 날들은 다시 받습니다
        cut = (now - timedelta(days=FIRST_DAYS + 5)).strftime("%Y%m%d")
        bk["days"] = [d for d in (bk.get("days") or []) if d < cut]
        bk["wv"] = 1
    for day in _day_list(now, bk, LH_BACK, LH_OLD_PER_RUN):
        rows_all, ok_day = [], True
        for page in range(1, LH_PAGES + 1):
            if int(bk.get("calls") or 0) >= LH_CAP:
                ok_day = False
                rec["cut"] = "하루 상한"
                break
            res, err = 부름(bk, LH_URL, {"pageNo": str(page), "numOfRows": str(LH_ROWS),
                                         "openDtmStart": day, "openDtmEnd": day}, rec)
            if err:
                ok_day = False
                if err.get("code") != "skip":
                    rec["err"] = err
                break
            rows, tot = res
            if rows and "fields" not in rec:
                rec["fields"] = sorted(rows[0].keys())[:60]
                rec["sample"] = {k: E._s(v, 30) for k, v in list(rows[0].items())[:40]
                                 if k not in ("taxregno", "tndrVndrNm")}   # 업체 이름 · 번호는 진단에 안 남김
            rows_all += rows
            # ⚠️ 한 쪽 줄 수를 포털이 줄여 줄 수도 있어 «받은 줄 수 · 전체 건수» 로 끝을 봅니다
            if not rows or (tot and len(rows_all) >= tot) or (not tot and len(rows) < LH_ROWS):
                break
        else:
            ok_day = False                                  # 쪽 상한에 걸림 — 그날은 다음에 다시
        if rec.get("err") and not rows_all:
            break
        for k, v in lh_fold(rows_all).items():
            box[k] = v
        if ok_day and day < (now - timedelta(days=1)).strftime("%Y%m%d"):
            bk["days"] = sorted(set(bk.get("days") or []) | {day})[-LH_BACK - 10:]
    got["lhr"] = len(box) - n0

    # ── 국방(시설) ──
    bk = book.setdefault("dapar", {})
    rec = dg.setdefault("dapar", {})
    box = store.setdefault("dapar", {})
    n0 = len(box)
    lst = []
    # 🏆 G84 때 받은 줄은 1순위 업체 · 결과가 없습니다(화면에 «결과» 만) — 한 번은 120일 목록을 다시 받아 다시 자세히 봅니다
    again = bk.get("wv") != 1
    if again:
        bk["list_at"] = ""
    if bk.get("list_at") != today:                          # 목록은 하루 한 번(오퍼레이션마다 하루 100번 한도)
        d0 = (now - timedelta(days=DAPA_BACK if (not box or again) else 10)).strftime("%Y%m%d")
        for page in range(1, 4):
            res, err = 부름(bk, DAPA_LIST, {"pageNo": str(page), "numOfRows": "100",
                                            "opengDateBegin": d0, "opengDateEnd": now.strftime("%Y%m%d")}, rec)
            if err:
                if err.get("code") != "skip":
                    rec["err"] = err
                break
            rows, tot = res
            if rows and "fields" not in rec:
                rec["fields"] = sorted(rows[0].keys())[:40]
                rec["sample"] = {k: E._s(v, 30) for k, v in list(rows[0].items())[:30]}
            lst += rows
            if len(rows) < 100 or (tot and page * 100 >= tot):
                break
        pend = []
        for r in lst:
            k = f"{E._s(r.get('orntCode'), 10)}:{E._s(r.get('cntrwkNo'), 30)}:{E._s(r.get('pblancOdr'), 4)}"
            if k in box and (box[k].get("w") or box[k].get("st")):
                continue
            od = re.sub(r"\D", "", str(r.get("opengDate") or r.get("opengDt") or ""))[:8]
            res_ = E._s(r.get("bidResult"), 20)
            if "유찰" in res_:
                # 🏆 유찰은 목록만으로 1순위 화면에 «유찰» 한 줄 — 자세히 부르지 않습니다(하루 100번 한도)
                box[k] = {kk: vv for kk, vv in {
                    "no": E._s(r.get("pblancNo"), 30), "ord": E._s(r.get("pblancOdr"), 4),
                    "d": E.ymdhm(od)[:10], "nm": E._s(r.get("cntrwkNm"), 80), "org": E._s(r.get("ornt"), 60),
                    "kind": "공사", "st": res_, "win": E._s(r.get("sucbidrDecsnMth"), 30)}.items() if vv}
                continue
            pend.append({"k": k, "no": E._s(r.get("pblancNo"), 30), "odr": E._s(r.get("pblancOdr"), 4),
                         "cw": E._s(r.get("cntrwkNo"), 30), "oc": E._s(r.get("orntCode"), 10),
                         # 개찰일자 — 상세는 목록이 준 모양 그대로(odr) · 예비가격 · 참가업체는 숫자 8자리(od)
                         "odr_": E._s(r.get("opengDate") or r.get("opengDt"), 20),
                         "od": od, "org": E._s(r.get("ornt"), 60), "rs": res_,
                         "win": E._s(r.get("sucbidrDecsnMth"), 30),
                         "nm": E._s(r.get("cntrwkNm"), 80)})
        if lst or not rec.get("err"):
            bk["pending"] = pend[:200]
            bk["list_at"] = today
            if again and lst:
                bk["wv"] = 1
        bk["dday"], bk["dn"] = today, 0
    done = 0
    for p in list(bk.get("pending") or []):
        if bk.get("dday") != today:
            bk["dday"], bk["dn"] = today, 0
        if done >= DAPA_PER_RUN or int(bk.get("dn") or 0) >= DAPA_DAY:
            break
        bk["dn"] = int(bk.get("dn") or 0) + 1
        base_p = {"cntrwkNo": p["cw"], "orntCode": p["oc"]}
        res, err = 부름(bk, DAPA_DETAIL, dict(base_p, pageNo="1", numOfRows="10", opengDate=p.get("odr_") or p["od"],
                                            pblancNo=p["no"], pblancOdr=p["odr"]), rec)
        if err:
            if err.get("code") != "skip":
                rec["err"] = err
            break
        det = (res[0] or [{}])[0]
        res2, err2 = 부름(bk, DAPA_BSIC, dict(base_p, pageNo="1", numOfRows="30", ntatPlanDate=p["od"]), rec)
        pr = [(_f(x.get("planPrce")) or 0) for x in ((res2 or ([], 0))[0] or [])
              if str(x.get("choiYsno") or "").upper() in ("Y", "1", "예")]
        res3, err3 = 부름(bk, DAPA_MNUF, dict(base_p, pageNo="1", numOfRows="300", ntatPlanDate=p["od"]), rec)
        mn = (res3 or ([], 0))[0] or []
        r1 = [x for x in mn if str(x.get("bidnRank") or "").strip() == "1"]
        base = E._won(det.get("bsisPreparPc"))
        exp = round(sum(pr) / len(pr)) if pr else 0
        v = {"no": p["no"], "ord": p["odr"], "d": E.ymdhm(p["od"])[:10],
             "nm": p["nm"] or E._s(det.get("cntrwkNm"), 80), "kind": "공사",
             "org": p.get("org") or E._s(det.get("ornt"), 60),
             "st": E._s(det.get("bidResult"), 20) or p.get("rs", ""),
             "win": p.get("win") or E._s(det.get("sucbidrDecsnMth"), 30),
             "base": base, "exp": exp, "ll": _f(det.get("scsbidLwltRt")),
             "lo": _f(det.get("asessRtLwlt")), "hi": _f(det.get("asessRtUplmt")), "np": len(mn)}
        if base > 0 and exp > 0:
            v["sj"] = round(exp / base * 100, 4)
        if r1:
            v["r1"], v["a1"] = _f(r1[0].get("bidnRate")), E._won(r1[0].get("tbidAmnt"))
        # 🏆 1순위(낙찰) 업체 — 상세의 낙찰업체명, 없으면 참가업체 1순위. 사업자번호 · 대표자는 받지도 두지도 않습니다
        v["w"] = E._s(det.get("scsbidEntrpsNm"), 40) or (E._s(r1[0].get("mfkrName"), 40) if r1 else "")
        box[p["k"]] = {kk: vv for kk, vv in v.items() if vv not in ("", None, 0) or kk == "np"}
        bk["pending"] = [x for x in bk["pending"] if x["k"] != p["k"]]
        done += 1
    got["dapar"] = len(box) - n0

    # ── 🏆 민간(누리장터) — 낙찰된 목록(공사) + 개찰결과(진행구분 · 1순위) ──
    bk = book.setdefault("nurir", {})
    rec = dg.setdefault("nurir", {})
    box = store.setdefault("nurir", {})
    n0 = len(box)
    # 개찰결과에는 업무구분이 없습니다 — 우리가 받아 둔 누리장터 «공사» 공고 번호 · 낙찰 목록의 공사 번호만 씁니다
    con = {k.split(":", 1)[1] for k in ((E._load(E.EXT_STORE, {}).get("nuri")) or {})}
    for day in _day_list(now, bk, NURI_BACK, NURI_OLD_PER_RUN):
        ok_day = True
        for url, kind in ((NURI_SCS, "scs"), (NURI_OPENG, "opg")):
            got_n = 0
            for page in range(1, NURI_PAGES + 1):
                if int(bk.get("calls") or 0) >= NURI_CAP:
                    ok_day = False
                    rec["cut"] = "하루 상한"
                    break
                q = {"pageNo": str(page), "numOfRows": "100", "type": "json", "inqryDiv": "1",
                     "inqryBgnDt": day + "0000", "inqryEndDt": day + "2359"}
                if kind == "scs":
                    q.update(NURI_SCS_TRY[int(bk.get("v") or 0) % len(NURI_SCS_TRY)])
                res, err = 부름(bk, url, q, rec)
                if err:
                    ok_day = False
                    if err.get("code") != "skip":
                        rec["err_" + kind] = err
                    break
                rows, tot = res
                if rows and ("f_" + kind) not in rec:
                    rec["f_" + kind] = sorted(rows[0].keys())[:40]
                    rec["d_" + kind] = [day, E._s(rows[0].get("rlOpengDt") or rows[0].get("opengDt"), 20)]
                if kind == "scs":
                    rec["scs_raw"] = rec.get("scs_raw", 0) + len(rows)
                for r in rows:
                    k = nuri_key(r)
                    if kind == "scs":
                        v = nuri_scs_row(r)
                        if v:
                            old = box.get(k) or {}
                            box[k] = dict(old, **v)
                            con.add(k)
                            got_n += 1
                    elif k in con or k in box:
                        v = nuri_openg_row(r, box.get(k))
                        if v:
                            box[k] = v
                            got_n += 1
                if not rows or len(rows) < 100 or (tot and page * 100 >= tot):
                    break
            rec[kind] = rec.get(kind, 0) + got_n
            if not ok_day:
                break
        if not ok_day and rec.get("err_scs") and rec.get("calls", 0) <= 2:
            break                                           # 첫 부름부터 안 되면(승인 전 · 키) 그만
        if ok_day and day < (now - timedelta(days=1)).strftime("%Y%m%d"):
            bk["days"] = sorted(set(bk.get("days") or []) | {day})[-NURI_BACK - 10:]
    if not rec.get("scs_raw") and not rec.get("err_scs") and rec.get("calls"):
        # 낙찰 목록이 이 모양으로 한 건도 안 옵니다 — 사흘 치로 다른 모양들을 떠봅니다
        d0, d1 = (now - timedelta(days=3)).strftime("%Y%m%d"), now.strftime("%Y%m%d")
        cur = int(bk.get("v") or 0) % len(NURI_SCS_TRY)
        order = [cur] + [i for i in range(len(NURI_SCS_TRY)) if i != cur]
        i = 떠보기(bk, rec, NURI_SCS, [dict({"type": "json", "inqryBgnDt": d0 + "0000", "inqryEndDt": d1 + "2359"},
                                          **NURI_SCS_TRY[j]) for j in order])
        if i is not None and order[i] != cur:
            bk["v"], bk["days"] = order[i], []          # 고른 모양으로 옛날 날도 다시
    rec["v"] = int(bk.get("v") or 0)
    got["nurir"] = len(box) - n0

    # ── 🏆 수자원 — 입찰 결과현황(이번 달 · 달 초면 지난달도) ──
    bk = book.setdefault("kwr", {})
    rec = dg.setdefault("kwr", {})
    box = store.setdefault("kwr", {})
    n0 = len(box)
    months = [now.strftime("%Y%m")]
    if not box or now.day <= 10:
        months.append((now.replace(day=1) - timedelta(days=1)).strftime("%Y%m"))
    try:        # 달 단위로 묻는 곳이라 두 시간에 한 번이면 넉넉합니다(한 번에 몇 쪽씩)
        if bk.get("at") and (now - datetime.strptime(bk["at"], "%Y-%m-%d %H:%M").replace(tzinfo=E.KST)).total_seconds() < KW_GAP_S:
            months, rec["skip"] = [], "두 시간 안에 받았음"
    except Exception:
        pass
    for m in months:
        for page in range(1, KW_PAGES + 1):
            if int(bk.get("calls") or 0) >= KW_CAP:
                rec["cut"] = "하루 상한"
                break
            res, err = 부름(bk, KW_RST, dict({"pageNo": str(page), "numOfRows": "100", "searchDt": m},
                                             **KW_TRY[int(bk.get("v") or 0) % len(KW_TRY)]), rec)
            if err:
                if err.get("code") != "skip":
                    rec["err"] = err
                break
            rows, tot = res
            if rows and "fields" not in rec:
                rec["fields"] = sorted(rows[0].keys())[:30]
                rec["sample"] = {k: E._s(v, 30) for k, v in rows[0].items()
                                 if k not in ("entrpsNm", "intnChargerNm")}   # 업체 · 담당자 이름은 진단에 안 남김
            for r in rows:
                v = kw_row(r)
                if v:
                    box[f"kw:{v['no']}"] = v
            rec["rows"] = rec.get("rows", 0) + len(rows)
            if not rows or len(rows) < 100 or (tot and page * 100 >= tot):
                break
        if rec.get("err"):
            break
    if months and not rec.get("err") and rec.get("calls") and not rec.get("rows"):
        cur = int(bk.get("v") or 0) % len(KW_TRY)
        order = [cur] + [i for i in range(len(KW_TRY)) if i != cur]
        i = 떠보기(bk, rec, KW_RST, [dict({"searchDt": months[-1]}, **KW_TRY[j]) for j in order])
        if i is not None and order[i] != cur:
            bk["v"], months = order[i], []              # 다음 회차에 고른 모양으로(두 시간 기다리지 않게 at 을 안 적음)
    if months and not rec.get("err") and rec.get("calls"):
        bk["at"] = now.strftime("%Y-%m-%d %H:%M")
    rec["v"] = int(bk.get("v") or 0)
    got["kwr"] = len(box) - n0

    # ── 🏆 아파트(K-apt) — 마감 지난 공고의 «낙찰/유찰 사유» ──
    bk = book.setdefault("kaptr", {})
    rec = dg.setdefault("kaptr", {})
    box = store.setdefault("kaptr", {})
    n0 = len(box)
    if bk.get("svc") != KAPT_SVC:
        # 🔁 G94 — 결과 서비스로 바꿈: 옛 서비스에서 고른 날짜 모양 · 자리 · 떠보기 표시는 버리고 새로 고릅니다
        for k in ("v", "ptr", "probe_at"):
            bk.pop(k, None)
        bk["svc"] = KAPT_SVC
        rec["svc"] = "바꿈"
    ptr = int(bk.get("ptr") or 0)
    span = max(1, KAPT_BACK - 1)
    days = [(now - timedelta(days=1)).strftime("%Y%m%d")]
    days += [(now - timedelta(days=2 + (ptr + i) % span)).strftime("%Y%m%d") for i in range(KAPT_PER_RUN - 1)]
    bk["ptr"] = (ptr + KAPT_PER_RUN - 1) % span
    words = rec.setdefault("words", {})
    for day in days:
        for page in range(1, KAPT_PAGES + 1):
            if int(bk.get("calls") or 0) >= KAPT_CAP:
                rec["cut"] = "하루 상한"
                break
            res, err = 부름(bk, KAPT_CLOS, dict({"pageNo": str(page), "numOfRows": "100"},
                                               **kapt_q(day, int(bk.get("v") or 0) % len(KAPT_TRY))), rec)
            if err:
                if err.get("code") != "skip":
                    rec["err"] = err
                break
            rows, tot = res
            rec["rows"] = rec.get("rows", 0) + len(rows)
            if rows and "f" not in rec and isinstance(rows[0], dict):
                rec["f"] = sorted(rows[0].keys())[:60]          # 칸 «이름» 만(값은 안 남김) — 낙찰금액 칸 이름 확인용
            for r in rows:
                why = str(r.get("bidReason") or "")
                if why.strip():
                    rec["why_n"] = rec.get("why_n", 0) + 1
                    # 사유 글은 진단에 남기지 않습니다(업체 이름이 들 수 있음) — 낱말 건수만
                    for w in ("낙찰", "유찰", "재공고", "취소", "수의"):
                        if w in why:
                            words[w] = words.get(w, 0) + 1
                v = kapt_row(r)
                if v:
                    box[f"kapt:{v['no']}"] = v
            if not rows or len(rows) < 100 or (tot and page * 100 >= tot):
                break
        if rec.get("err"):
            break
    if not rec.get("rows") and not rec.get("err") and rec.get("calls"):
        # 마감 지난 공고가 사흘 동안 한 건도 없을 수는 없습니다 — 날짜 모양을 떠봅니다
        day = (now - timedelta(days=3)).strftime("%Y%m%d")
        cur = int(bk.get("v") or 0) % len(KAPT_TRY)
        order = [cur] + [i for i in range(len(KAPT_TRY)) if i != cur]
        i = 떠보기(bk, rec, KAPT_CLOS, [kapt_q(day, j) for j in order])
        if i is not None and order[i] != cur:
            bk["v"] = order[i]
    rec["v"] = int(bk.get("v") or 0)
    got["kaptr"] = len(box) - n0

    # 오래된 것 지우기
    cut = (now - timedelta(days=RES_KEEP_DAYS)).strftime("%Y-%m-%d")
    for src in ("lhr", "dapar"):
        b = store.get(src) or {}
        for k in [k for k, v in b.items() if (v.get("d") or "9") < cut]:
            b.pop(k, None)
    # 🏆 1순위 화면에만 쓰는 곳(셈에 안 씀)은 화면에 보이는 날보다 조금 더만 둡니다
    cut2 = (now - timedelta(days=FIRST_DAYS + 15)).strftime("%Y-%m-%d")
    for src in ("kwr", "kaptr", "nurir"):
        b = store.get(src) or {}
        for k in [k for k, v in b.items() if (v.get("d") or "9") < cut2]:
            b.pop(k, None)
    E._save(RES_STORE, store)
    E._save(RES_BOOK, book)
    for s in ("lhr", "dapar", "kwr", "kaptr", "nurir"):
        dg.setdefault(s, {})["n"] = len(store.get(s) or {})
    if diag is not None:
        diag["_extres"] = dg
    return got


# ── 셈에 쓸 값 (publish 가 list.json 의 «st» 로 내보냄) ───────────────
def stats(store=None):
    store = store if store is not None else E._load(RES_STORE, {})
    out = {}
    for src, key in (("lh", "lhr"), ("dapa", "dapar")):
        xs = [v for v in (store.get(key) or {}).values() if "공사" in (v.get("kind") or "공사")]
        sj = [v["sj"] for v in xs if 95 <= (v.get("sj") or 0) <= 105]
        s = {"n": len(sj), "edges": EDGES}
        if len(sj) >= 5:
            s["p50"] = round(statistics.median(sj), 3)
            s["sd"] = round(statistics.pstdev(sj), 3)
        # 낙찰하한율 — 규모 칸마다 가운데값
        ll = {}
        for v in xs:
            if not (v.get("base") or 0) > 0:
                continue
            if src == "lh":
                h, lo = v.get("llH"), v.get("llL")
                if not h or (lo and h - lo > 0.3):          # 위 · 아래가 벌어져 있으면 하한을 모름
                    continue
                val = h if not lo else (h + lo) / 2
            else:
                val = v.get("ll")
            if val and 70 < val < 100:
                ll.setdefault(칸(v["base"]), []).append(val)
        s["ll"] = {str(b): [round(statistics.median(a), 3), len(a)] for b, a in ll.items() if len(a) >= 3}
        np_ = [v["np"] for v in xs if v.get("np")]
        if np_:
            s["np"] = int(statistics.median(np_))
        out[src] = s
    return out


# ── 🏆 1순위(낙찰) 화면 — web/public/data/ext/first.json ─────────────────
FIRST_SRC = (("lh", "lhr"), ("kw", "kwr"), ("dapa", "dapar"), ("kapt", "kaptr"), ("nuri", "nurir"))
FIRST_KEYS = ("no", "ord", "nm", "org", "d", "st", "w", "np", "base", "exp", "sj", "ll", "why", "win", "mthd")


def publish_first(now=None, sido_fn=None, store=None, ext=None):
    """개찰 보관함(ext_res.json) → 최근 FIRST_DAYS 일 «1순위 · 낙찰 · 유찰» 한 파일.
       공고 보관함(ext.json)에서 같은 번호의 공고를 찾아 기관 · 지역 · 공고명을 채웁니다.
       sido_fn: collect.py 의 sido_of 그대로(공고판 · 바로투찰과 같은 지역 규칙)."""
    now = now or datetime.now(E.KST)
    store = store if store is not None else E._load(RES_STORE, {})
    ext = ext if ext is not None else E._load(E.EXT_STORE, {})
    today = now.strftime("%Y-%m-%d")
    cut = (now - timedelta(days=FIRST_DAYS)).strftime("%Y-%m-%d")
    dapa_by = {}
    for x in (ext.get("dapa") or {}).values():
        dapa_by.setdefault((x.get("no"), x.get("ord") or ""), x)
    rows, by = [], {}
    for s, key in FIRST_SRC:
        keep = []
        gbox = ext.get(s) or {}
        for k, v in (store.get(key) or {}).items():
            d = v.get("d") or ""
            if not d or d[:10] < cut or d[:10] > today:
                continue
            if "공사" not in (v.get("kind") or "공사"):
                continue
            # 공고 찾기 — 기관마다 번호 모양이 다릅니다
            if s == "lh":
                g = gbox.get(f"lh:{k}")
            elif s == "dapa":
                g = dapa_by.get((v.get("no"), v.get("ord") or ""))
            elif s == "nuri":
                g = gbox.get(f"nuri:{k}")
            else:
                g = gbox.get(k)
            g = g or {}
            y = {"s": s, "id": k if k.startswith(s + ":") else f"{s}:{k}"}
            for kk in FIRST_KEYS:
                if v.get(kk) not in (None, "", 0):
                    y[kk] = v[kk]
            if v.get("a1"):
                y["a"] = v["a1"]
            if v.get("r1"):
                y["r"] = v["r1"]
            if not y.get("nm") and g.get("nm"):
                y["nm"] = g["nm"]
            if not y.get("org") and g.get("org"):
                y["org"] = g["org"]                 # LH 개찰에는 발주 본부가 없습니다 — 공고의 «LH ○○본부»
            if not y.get("win") and g.get("win"):
                y["win"] = g["win"]
            if not y.get("base") and g.get("base"):
                y["base"] = g["base"]
            sido = v.get("sido") or g.get("sido") or ""
            if not sido and sido_fn:
                try:
                    sido = E.sido_ext(g, sido_fn) if g else (sido_fn({"site": "", "inst": y.get("org") or "",
                                                                      "name": y.get("nm") or ""}) or "")
                except Exception:
                    sido = ""
            if sido:
                y["sido"] = sido
            if not y.get("nm"):
                continue
            keep.append(y)
        keep.sort(key=lambda y: y.get("d") or "", reverse=True)
        keep = keep[:FIRST_MAX]
        by[s] = len(keep)
        rows.extend(keep)
    rows.sort(key=lambda y: y.get("d") or "", reverse=True)
    now_s = now.strftime("%Y-%m-%d %H:%M")
    os.makedirs(E.PUB_DIR, exist_ok=True)
    E._save(os.path.join(E.PUB_DIR, "first.json"), {"at": now_s, "days": FIRST_DAYS, "by": by, "rows": rows})
    # /first 화면의 한 줄(밖공고줄)이 읽는 작은 파일에 건수만 얹습니다
    mp = os.path.join(E.PUB_DIR, "meta.json")
    m = E._load(mp, {})
    if isinstance(m, dict):
        m["first"] = len(rows)
        E._save(mp, m)
    return by
