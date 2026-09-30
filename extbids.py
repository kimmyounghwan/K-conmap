# -*- coding: utf-8 -*-
"""extbids.py — 🏗 나라장터 밖 공고 (2026-09-30)

소장님: 입찰나라에서 가져올 것 4번 «나라장터 밖 공고» ·
        「편리성, 기능성 유지하면서」 · 「핸드폰에서도 편리하게 사용가능해야 해. 건설맵은」
        고른 곳: LH · 수자원 · 방위사업청 + 아파트 공사(K-apt) + 민간 공사(누리장터). 한전은 나중에.

■ 무엇을 하나
    나라장터(조달청)에 올라오지 않는 «공사» 입찰공고를 공공데이터포털에서 받아
    한 파일(web/public/data/ext/list.json)로 내보냅니다. 화면은 /ext 한 장입니다.
    ⚠️ 나라장터 공고(/live)는 건드리지 않습니다 — 새 기능이 터져도 원래 공고판은 그대로.

■ 어디서 받나 (2026-09-30 활용신청 6개 승인 · 명세는 데이터셋 화면 swagger 에서 뽑음)
    lh    LH 입찰공고정보_GW      B552555/OpenBidInfoList/getOpenBidInfo
    kw    수자원 전자조달 입찰공고  B500001/ebid/tndr3/cntrwkList          (공사)
    dapa  방위사업청 입찰공고_GW   1690000/BidPblancInfoService/getFcltyCmpetBidPblancList (시설 = 공사)
    kapt  공동주택 입찰공고(K-apt)  1613000/ApHusBidPblAncInfoOfferServiceV3/getPblAncDeSearchV3
    nuri  누리장터 민간입찰공고    1230000/ao/PrvtBidNtceService/getPrvtBidPblancListInfoCnstwk (공사)

■ ⚠️ 인증키
    조달청과 같은 공공데이터포털 계정 키(GitHub 비밀값 G2B_API_KEY)를 씁니다. 파일에 적지 않습니다.
    **주소(URL)나 오류 글을 어디에도 남기지 않습니다** — requests 오류 글에는 serviceKey 가 든 주소가
    그대로 들어 있습니다. 그래서 오류는 «종류 이름» 만 적습니다(_why).

■ ⚠️ 하루 호출 한도 (기관마다 다릅니다 — 넘기면 그날은 그 기관만 쉽니다)
    방위사업청 100번 · 누리장터 1,000번 · K-apt 5,000번 · 수자원 10,000번 · LH (적힌 한도 없음 — 조심스럽게)
    → 기관마다 «하루 상한(CAP)» 을 한도보다 넉넉히 낮게 두고, 방위사업청은 50분에 한 번만 부릅니다.

■ ⚠️ 응답 모양은 첫 회차에 확인합니다
    명세의 칸 이름으로 짰지만 실제 응답(JSON/XML · 날짜 모양 · 코드값)은 받아 봐야 압니다.
    회차마다 data/diag.json 의 «_ext» 에 기관별 결과 · 칸 이름 · 표본 한 줄을 남깁니다.
    JSON 이든 XML 이든 둘 다 읽습니다.

■ ⚠️ import 할 때 아무것도 읽지 않습니다(G78b 교훈 — collect.py 가 import 때 JSON 을 읽어 빠른 수집이 멈췄음).
    collect.py 는 이 파일을 main() 안에서만 import 합니다(fast.yml 은 이 파일을 받지 않습니다).
    바깥 꾸러미는 requests 하나 — 그것도 부를 때만 import 합니다.
"""
import json
import os
import re
import time
from datetime import datetime, timedelta, timezone
from xml.etree import ElementTree as ET

ROOT = os.path.dirname(os.path.abspath(__file__))
STORE = os.path.join(ROOT, "data", "store")
EXT_STORE = os.path.join(STORE, "ext.json")
EXT_BOOK = os.path.join(STORE, "ext_book.json")
PUB_DIR = os.path.join(ROOT, "web", "public", "data", "ext")

KST = timezone(timedelta(hours=9))
B = "https://apis.data.go.kr"

EXT_BUDGET_S = int(os.environ.get("EXT_BUDGET_S", "150"))    # 한 회차에 쓰는 시간(초) — 다섯 곳 합쳐서
EXT_TIMEOUT_S = int(os.environ.get("EXT_TIMEOUT_S", "15"))
EXT_KEEP_DAYS = int(os.environ.get("EXT_KEEP_DAYS", "45"))    # 마감 뒤 이만큼 지나면 보관함에서도 지움
EXT_SHOW_MAX = int(os.environ.get("EXT_SHOW_MAX", "700"))     # 한 기관에서 내보내는 상한 (폰에서 가볍게)
ROWS = 100                                                    # 한 번에 받는 줄 수

# 기관별 설정 — nm: 화면에 붙는 짧은 이름 · cap: 하루 상한 · pages: 한 회차 쪽 상한
#               gap: 이만큼(분) 안에 다시 부르지 않음 · back: 처음 · 평소에 며칠 치를 보나
SRC = {
    "lh":   dict(nm="LH", full="한국토지주택공사", cap=300, pages=6, gap=0, back=(21, 5), v=2,
                 url=f"{B}/B552555/OpenBidInfoList/getOpenBidInfo"),
    "kw":   dict(nm="수자원", full="한국수자원공사", cap=2000, pages=4, gap=0, back=(45, 0),
                 url=f"{B}/B500001/ebid/tndr3/cntrwkList"),
    "dapa": dict(nm="국방", full="방위사업청(시설)", cap=60, pages=2, gap=50, back=(30, 10),
                 url=f"{B}/1690000/BidPblancInfoService/getFcltyCmpetBidPblancList"),
    "kapt": dict(nm="아파트", full="공동주택(K-apt)", cap=1500, pages=12, pages1=25, gap=0, back=(14, 3), v=2,
                 url=f"{B}/1613000/ApHusBidPblAncInfoOfferServiceV3/getPblAncDeSearchV3"),
    "nuri": dict(nm="민간", full="누리장터 민간", cap=500, pages=6, gap=0, back=(21, 4),
                 url=f"{B}/1230000/ao/PrvtBidNtceService/getPrvtBidPblancListInfoCnstwk"),
}
ORDER = ["lh", "kw", "dapa", "kapt", "nuri"]

QUOTA_WORDS = ("LIMITED_NUMBER_OF_SERVICE_REQUESTS", "SERVICE_ACCESS_DENIED_TRAFFIC",
               "요청제한", "트래픽", "호출횟수", "이용횟수")
OK_CODES = {"00", "0", "000", "INFO-000", "INFO-0", "NORMAL_CODE", "NORMAL SERVICE."}


# ── 작은 도구 ─────────────────────────────────────────────────────
def _load(p, d):
    try:
        with open(p, encoding="utf-8") as f:
            v = json.load(f)
        return v if isinstance(v, type(d)) else d
    except Exception:
        return d


def _save(p, v):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    tmp = p + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(v, f, ensure_ascii=False, separators=(",", ":"))
    os.replace(tmp, p)


def _s(v, n=200):
    """글 한 칸 — 공백을 하나로, 길면 자름"""
    if v is None:
        return ""
    if isinstance(v, (dict, list)):
        return ""
    t = " ".join(str(v).split())
    return t[:n]


def _won(v):
    """금액 — 숫자만. 0 이나 못 읽으면 0"""
    t = re.sub(r"[^0-9.]", "", str(v or ""))
    try:
        return int(float(t)) if t else 0
    except Exception:
        return 0


def ymdhm(v):
    """'20260930' · '202609301000' · '2026-09-30 10:00:00' · 20260930100000 → 'YYYY-MM-DD[ HH:MM]'
       못 읽으면 ''. 시각이 00:00 이어도 그대로 둡니다(마감이 자정인 공고가 있습니다)."""
    d = re.sub(r"[^0-9]", "", str(v or ""))
    if len(d) >= 12 and d[:2] in ("19", "20"):
        return f"{d[0:4]}-{d[4:6]}-{d[6:8]} {d[8:10]}:{d[10:12]}"
    if len(d) == 8 and d[:2] in ("19", "20"):
        return f"{d[0:4]}-{d[4:6]}-{d[6:8]}"
    return ""


def _why(e):
    """오류는 «종류 이름» 만 — 글(str(e))에는 serviceKey 가 든 주소가 들어 있습니다."""
    return type(e).__name__


def decode(body):
    """응답 바이트 → 글. XML 머리에 적힌 글자 모양(EUC-KR 등)을 따릅니다.
       ⚠️ 2026-09-30 첫 회차 — LH 는 EUC-KR 로 적힌 XML 을 줬고, utf-8 로만 읽다가 한 건도 못 읽었습니다(진단 _ext.lh)."""
    b = body if isinstance(body, (bytes, bytearray)) else str(body or "").encode("utf-8")
    m = re.match(rb'\s*<\?xml[^>]*encoding=["\']([A-Za-z0-9_\-]+)["\']', b[:200])
    enc = (m.group(1).decode("ascii").lower() if m else "utf-8")
    if enc in ("euc-kr", "euckr", "ks_c_5601-1987", "cp949", "ms949"):
        enc = "cp949"
    try:
        return b.decode(enc, "replace")
    except LookupError:
        return b.decode("utf-8", "replace")


def _scrub(t):
    """혹시라도 인증키처럼 생긴 긴 글자 덩어리가 섞이면 지웁니다(오류 본문을 진단에 남길 때)"""
    return re.sub(r"[A-Za-z0-9%+/=_-]{36,}", "…", str(t or ""))


# ── 응답 읽기 (JSON · XML 둘 다) ───────────────────────────────────
def _find(d, *path):
    for k in path:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


def _as_list(x):
    if x is None or x == "":
        return []
    if isinstance(x, list):
        return [y for y in x if isinstance(y, dict)]
    if isinstance(x, dict):
        return [x]
    return []


def parse(text):
    """응답 글 → (줄들, 전체건수, 오류) · 오류는 None 이거나 {"code","msg"} (한도면 "quota": True)"""
    t = (text or "").strip()
    if not t:
        return [], 0, {"code": "empty", "msg": "빈 응답"}
    if t[:1] in "{[":
        try:
            j = json.loads(t)
        except Exception:
            return [], 0, {"code": "json", "msg": _s(t, 120)}
        root = j.get("response", j) if isinstance(j, dict) else {}
        head = root.get("header") or {}
        code = _s(head.get("resultCode"))
        msg = _s(head.get("resultMsg"), 160)
        body = root.get("body") or {}
        if _nodata(code, msg):
            return [], 0, None
        if code and code not in OK_CODES:
            return [], 0, _err(code, msg)
        items = body.get("items")
        if isinstance(items, dict):
            items = items.get("item", items)
        rows = _as_list(items)
        if not rows and isinstance(root.get("items"), (list, dict)):   # 봉투 없이 오는 곳
            rows = _as_list(root.get("items"))
        return rows, _won(body.get("totalCount")), None
    # XML
    try:
        # 글로 다 읽은 뒤라 머리의 encoding 선언은 떼고 넘깁니다(남겨 두면 EUC-KR 로 한 번 더 풀려 깨집니다)
        el = ET.fromstring(re.sub(r"^\s*<\?xml[^>]*\?>", "", t) if isinstance(t, str) else t)
    except Exception:
        return [], 0, {"code": "xml", "msg": _s(t, 120)}

    def txt(tag):
        x = el.find(".//" + tag)
        return _s(x.text if x is not None else "", 160)
    # 포털 공통 오류 봉투: <OpenAPI_ServiceResponse><cmmMsgHeader><returnAuthMsg>…<returnReasonCode>
    if el.tag == "OpenAPI_ServiceResponse" or el.find(".//cmmMsgHeader") is not None:
        return [], 0, _err(txt("returnReasonCode") or "portal",
                           (txt("returnAuthMsg") + " " + txt("errMsg")).strip())
    code, msg = txt("resultCode"), txt("resultMsg")
    if _nodata(code, msg):
        return [], 0, None
    if code and code not in OK_CODES:
        return [], 0, _err(code, msg)
    rows = []
    for it in el.iter("item"):
        r = {}
        for ch in list(it):
            if len(list(ch)):          # 안에 또 목록이 든 칸(아파트 상세 목록 등)은 건너뜀
                continue
            r[ch.tag] = (ch.text or "").strip()
        if r:
            rows.append(r)
    return rows, _won(txt("totalCount")), None


def _nodata(code, msg):
    """«자료 없음» 은 오류가 아닙니다(포털 공통 03 NODATA_ERROR) — 그날 공고가 없을 수 있습니다."""
    return str(code).strip() in ("03", "3") or "NODATA" in str(msg).upper()


def _keyish(e):
    """인증키 · 권한 쪽 오류인가 — 이런 때는 날짜 모양을 바꿔 봐야 소용없습니다
       (승인 직후 한두 시간은 SERVICE_KEY_IS_NOT_REGISTERED 가 나옵니다)"""
    t = (str(e.get("code", "")) + " " + str(e.get("msg", ""))).upper()
    return (str(e.get("code", "")).strip() in ("12", "20", "30", "31", "32", "33", "portal")
            or any(w in t for w in ("KEY", "ACCESS", "DENIED", "NO_OPENAPI", "SERVICE_NOT", "등록되지")))


def _err(code, msg):
    e = {"code": _scrub(_s(code, 40)), "msg": _scrub(_s(msg, 160))}
    if str(code).strip() in ("22", "022") or any(w in (str(code) + " " + str(msg)) for w in QUOTA_WORDS):
        e["quota"] = True
    return e


# ── 기관별 «한 줄» 맞추기 ──────────────────────────────────────────
#  모든 기관을 같은 모양으로:  s 기관 · id · no 공고번호 · nm 공고명 · org 발주 · dt 공고 · close 마감 …
#  금액은 m = [[이름, 원], …] — 기관마다 주는 금액이 달라(추정가격 · 기초금액 · 기준금액 · 예산) 이름을 붙여 둡니다.
def _m(*pairs):
    return [[k, v] for k, v in pairs if v]


def _uniq(xs, n=None):
    out = []
    for x in xs:
        x = _s(x, 60)
        if x and x not in out:
            out.append(x)
    return out[:n] if n else out


def norm_lh(r):
    no, deg = _s(r.get("bidNum"), 40), _s(r.get("bidDegree"), 10)
    lic = []
    for i in range(1, 11):
        for j in range(1, 11):
            lic.append(r.get(f"req{i}Reqlic{j}Nm"))
    hq = _s(r.get("zoneHqCd"), 40)
    return {
        "s": "lh", "id": f"lh:{no}-{deg or '0'}", "no": no, "ord": deg,
        "nm": _s(r.get("bidnmKor")), "org": ("LH " + hq).strip(), "hq": hq,
        "kind": _s(r.get("cstrtnJobGbNm"), 20), "bk": _s(r.get("bidKind"), 30),
        "st": _s(r.get("bidProgrsStatus"), 20),
        "dt": ymdhm(r.get("tndrbidRegDt")), "bbgn": ymdhm(r.get("tndrdocAcptBgninDtm")),
        "close": ymdhm(r.get("tndrdocAcptEndDtm")), "openg": ymdhm(r.get("openDtm")),
        "jdoc": ymdhm(r.get("cooperdocAcptEndDtm")),
        "m": _m(["기초금액", _won(r.get("fdmtlAmt"))], ["추정가격", _won(r.get("presmtPrc"))],
                ["설계가격", _won(r.get("designPrc"))]),
        "mthd": _s(r.get("tndrCtrctMedCd"), 40), "win": _s(r.get("sunjungNm"), 40),
        "joint": _s(r.get("gongdongNm"), 40),
        "rgn": ", ".join(_uniq([r.get(f"zoneRstrct{i}") for i in range(1, 5)])),
        "rgnj": ", ".join(_uniq([r.get(f"vndrrstrctNm{i}") for i in range(1, 5)])),
        "lic": _uniq(lic, 8),
    }


def norm_kw(r):
    no = _s(r.get("tndrPbanno"), 40)
    return {
        "s": "kw", "id": f"kw:{no}", "no": no,
        "nm": _s(r.get("tndrPblancNm")), "org": ("수자원 " + _s(r.get("cntrctDeptNm"), 40)).strip(),
        "kind": _s(r.get("cntrctDivNm"), 20), "st": _s(r.get("tndrStat"), 20),
        "dt": ymdhm(r.get("tndrPblancDe")), "close": ymdhm(r.get("tndrPblancEnddt")),
        "m": _m(["금액", _won(r.get("tndrPlnprc"))]),
        "mthd": _s(r.get("ctrmthdCdNm"), 40), "ofcl": _s(r.get("intnChargerNm"), 20),
        "np": _won(r.get("tndrPartcptEntrpsCo")) or None,
    }


def norm_dapa(r):
    no, odr = _s(r.get("pblancNo"), 40), _s(r.get("pblancOdr"), 10)
    se = _s(r.get("pblancSe"), 20)
    g2b = _s(r.get("g2bPblancNo"), 40)
    return {
        "s": "dapa", "id": f"dapa:{_s(r.get('pblancYear'), 4)}-{no}-{odr or '0'}", "no": no, "ord": odr,
        "nm": _s(r.get("cntrwkNm")), "org": _s(r.get("ornt"), 60),
        "kind": _s(r.get("busiDivs"), 20), "st": se, "emg": 1 if "긴급" in se else 0,
        "dt": ymdhm(r.get("pblancDate")), "qreg": ymdhm(r.get("bidPartcptRegistClosDt")),
        "close": ymdhm(r.get("biddocPresentnClosDt")), "openg": ymdhm(r.get("opengDt")),
        "m": _m(["기초금액", _won(r.get("baseAmnt"))]),
        "mthd": _s(r.get("cntrctMth"), 40), "way": _s(r.get("bidStle"), 20),
        "g2b": g2b,
    }


KAPT_SIDO = {"11": "서울", "26": "부산", "27": "대구", "28": "인천", "29": "광주", "30": "대전",
             "31": "울산", "36": "세종", "41": "경기", "42": "강원", "51": "강원", "43": "충북",
             "44": "충남", "45": "전북", "52": "전북", "46": "전남", "47": "경북", "48": "경남",
             "50": "제주"}
KAPT_KIND = {"01": "일반경쟁", "02": "제한경쟁", "03": "지명경쟁", "04": "수의계약"}
KAPT_WAY = {"00": "직접입찰", "01": "전자입찰"}
KAPT_AUTH = {"01": "K-apt", "02": "조달청(누리장터)", "03": "아파트비드포유"}
KAPT_SUCWAY = {"01": "최저(고) 낙찰", "02": "적격심사", "03": "최저 낙찰", "04": "최고 낙찰",
               "05": "적격심사(최저)", "06": "적격심사(최고)"}
#  분류코드(2026-09-30 첫 회차 진단 _ext.kapt.codes 로 확인 — 코드 조합별 공고명):
#    1단 01 = 주택관리업자 선정(위탁관리) · 02 = 사업자 선정
#    2단 02 = 공사(도장 · 방수 · 변압기 교체 · 누수 …, 785건) · 03 = 용역(경비 · 청소 · 소독 · 승강기 유지 …) ·
#        04 = 물품(에어컨 설치 · 파지 수거) · 05 = 기타(재활용품 · 매각 · 보험)
KAPT_C2 = {"02": "공사", "03": "용역", "04": "물품", "05": "기타"}
KAPT_FILE = "http://www.k-apt.go.kr/bid/bidFileDownload.do?file_type=bid&file_num="   # 명세(bidFileSeq 설명)에 적힌 주소
#  공사 · 용역 가르기 — 분류코드(codeClassifyType1~3)의 뜻은 «코드정의서» 에 있습니다.
#  첫 회차 진단(_ext.kapt.codes)으로 확인하기 전까지는 공고명 낱말로 가릅니다.
#  ⚠️ 용역 낱말을 먼저 봅니다 — «승강기 유지보수 용역» 은 공사가 아닙니다.
_KAPT_SVC = re.compile(r"용역|위탁|청소|경비|소독|방역|보험|회계|감사|점검|유지관리|관리업체|수거|세탁|"
                       r"검침|측정|진단|컨설팅|자문|감리|설계|임대|구매|납품|물품")
_KAPT_CON = re.compile(r"공사|보수|교체|도장|방수|설치|개선|정비|포장|증설|이설|철거|리모델링|재도장|"
                       r"보강|수선|개량|시공|교환")


def kapt_kind(title, c1="", c2=""):
    """공사 · 용역 가르기 — 분류코드가 있으면 코드로(위 KAPT_C2), 없을 때만 공고명 낱말로"""
    if str(c1).strip() == "01":
        return "관리"
    if str(c2).strip() in KAPT_C2:
        return KAPT_C2[str(c2).strip()]
    t = str(title or "")
    if _KAPT_SVC.search(t):
        return "용역"
    if _KAPT_CON.search(t):
        return "공사"
    return ""


def norm_kapt(r):
    no = _s(r.get("bidNum"), 40)
    area = re.sub(r"[^0-9]", "", str(r.get("bidArea") or ""))[:2]
    st = str(r.get("bidState") or "").strip()
    docs = []
    fu = _s(r.get("bidFileSeq"), 400)
    if fu.startswith("http"):
        docs.append(["공고 첨부", fu])
    elif re.fullmatch(r"\d{3,15}", fu):                 # 번호만 옵니다(첫 회차 확인) — 명세의 내려받기 주소에 붙입니다
        docs.append(["공고 첨부(K-apt)", KAPT_FILE + fu])
    return {
        "s": "kapt", "id": f"kapt:{no}", "no": no,
        "nm": _s(r.get("bidTitle")), "org": _s(r.get("bidKaptname"), 60),
        "sido": KAPT_SIDO.get(area, ""),
        "kind": kapt_kind(r.get("bidTitle"), r.get("codeClassifyType1"), r.get("codeClassifyType2")),
        "c": [_s(r.get("codeClassifyType1"), 10), _s(r.get("codeClassifyType2"), 10),
              _s(r.get("codeClassifyType3"), 10)],
        "st": {"1": "신규", "2": "수정"}.get(st, _s(st, 10)),
        "emg": 1 if str(r.get("bidEmrgYn") or "").upper() == "Y" else 0,
        "dt": ymdhm(r.get("bidRegDate")), "close": ymdhm(r.get("bidDeadline")),
        "ddoc": ymdhm(r.get("bidDocsDeadline")), "spot": ymdhm(r.get("bidFieldDesDate")),
        "spotp": _s(r.get("bidFieldDesLoc"), 60),
        "mthd": KAPT_KIND.get(_s(r.get("codeKind"), 4), _s(r.get("codeKind"), 10)),
        "win": KAPT_SUCWAY.get(_s(r.get("codeSucWay"), 4), ""), "way": KAPT_WAY.get(_s(r.get("codeWay"), 4), ""),
        "auth": KAPT_AUTH.get(_s(r.get("codeAuth"), 4), ""),
        "req": _s(r.get("bidReqDocs"), 300),
        "docs": docs,
    }


def norm_nuri(r):
    no, odr = _s(r.get("bidNtceNo"), 40), _s(r.get("bidNtceOrd"), 10)
    docs = []
    for i in range(1, 11):
        u = _s(r.get(f"ntceSpecDocUrl{i}"), 400)
        if u.startswith("http"):
            docs.append([_s(r.get(f"ntceSpecDocNm{i}"), 80) or f"첨부 {i}", u])
    ref_open = str(r.get("refAmtOpenYn") or "").upper() != "N"
    apt = _s(r.get("aptHsmpNm"), 60)
    return {
        "s": "nuri", "id": f"nuri:{no}-{odr or '0'}", "no": no, "ord": odr,
        "nm": _s(r.get("ntceNm")), "org": _s(r.get("ntceInsttNm"), 60), "apt": apt,
        "addr": _s(r.get("aptCeoAdrs"), 80),
        "kind": "공사", "st": _s(r.get("ntceDivNm"), 20),
        "emg": 1 if "긴급" in str(r.get("ntceDivNm") or "") else 0,
        "dt": ymdhm(r.get("nticeDt") or r.get("rgstDt")), "bbgn": ymdhm(r.get("bidBeginDt")),
        "close": ymdhm(r.get("bidClseDt")), "openg": ymdhm(r.get("opengDt")),
        "spot": ymdhm(r.get("sptDscrptDt")), "spotp": _s(r.get("sptDscrptPlce"), 60),
        "m": _m(["기준금액", _won(r.get("refAmt")) if ref_open else 0],
                ["배정예산", _won(r.get("asignBdgtAmt"))]),
        "mthd": _s(r.get("cntrctMthdNm"), 40), "win": _s(r.get("sucsfbidMthdNm"), 40),
        "rgn": _s(r.get("rgnLmtDivNm"), 60), "qual": _s(r.get("bidQlfctNm"), 80),
        "ofcl": _s(r.get("ofclNm"), 20), "tel": _s(r.get("ofclTelNo"), 20),
        "docs": docs,
    }


NORM = {"lh": norm_lh, "kw": norm_kw, "dapa": norm_dapa, "kapt": norm_kapt, "nuri": norm_nuri}


def _clean(x):
    """빈 칸은 빼서 파일을 가볍게"""
    return {k: v for k, v in x.items() if v not in ("", None, [], 0) or k in ("s", "id")}


# ── 부를 때 넘길 값 ────────────────────────────────────────────────
def _params(src, now, first, page, alt=False):
    back = SRC[src]["back"][0 if first else 1]
    d0, d1 = (now - timedelta(days=back)), now
    fmt = (lambda d: d.strftime("%Y-%m-%d")) if alt else (lambda d: d.strftime("%Y%m%d"))
    p = {"pageNo": str(page), "numOfRows": str(ROWS)}
    if src == "lh":
        p.update(tndrbidRegDtStart=fmt(d0), tndrbidRegDtEnd=fmt(d1))
    elif src == "dapa":
        p.update(anmtDateBegin=fmt(d0), anmtDateEnd=fmt(d1))
    elif src == "kapt":
        p.update(startDate=fmt(d0), endDate=fmt(d1))
    elif src == "nuri":
        p.update(type="json", inqryDiv="1",
                 inqryBgnDt=d0.strftime("%Y%m%d") + "0000", inqryEndDt=d1.strftime("%Y%m%d") + "2359")
    return p


def _kw_months(now, first):
    """수자원은 «검색년월(YYYYMM)» 로만 묻습니다 — 이번 달 · (처음이거나 달 초면) 지난달"""
    ms = [now.strftime("%Y%m")]
    if first or now.day <= 12:
        prev = (now.replace(day=1) - timedelta(days=1)).strftime("%Y%m")
        ms.append(prev)
    return ms


# ── 받기 ──────────────────────────────────────────────────────────
def fetch(key, now=None, no_net=False, diag=None, get=None):
    """다섯 곳에서 받아 data/store/ext.json 에 합칩니다. 돌려주는 것: {기관: 새로 받은 줄 수}
       get: 시험용 — (url, params, timeout) → 응답 글. 없으면 requests 로 부릅니다."""
    now = now or datetime.now(KST)
    store = _load(EXT_STORE, {})
    book = _load(EXT_BOOK, {})
    today = now.strftime("%Y-%m-%d")
    dg = {}
    got = {}
    if no_net or not key:
        if diag is not None:
            diag["_ext"] = {"건너뜀": "바깥을 부르지 않는 회차" if no_net else "인증키 없음"}
        return got
    if get is None:
        import requests            # 부를 때만 — import 때 바깥 꾸러미를 요구하지 않게
        try:
            import urllib3
            urllib3.disable_warnings()
        except Exception:
            pass

        def get(url, params, timeout):
            q = dict(params)
            q["serviceKey"] = key
            r = requests.get(url, params=q, timeout=timeout, verify=False,
                             headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code != 200:
                raise _Http(r.status_code, _scrub(_s(r.content.decode("utf-8", "replace"), 160)))
            return decode(r.content)     # XML 머리의 글자 모양대로(LH = EUC-KR). requests 의 추측(latin-1)은 쓰지 않습니다
    t0 = time.time()
    for src in ORDER:
        cfg = SRC[src]
        bk = book.setdefault(src, {})
        if bk.get("day") != today:
            bk.update(day=today, calls=0, quota=False, alt_tried=False)
        rec = {"calls": 0, "rows": 0}
        dg[src] = rec
        if bk.get("quota"):
            rec["skip"] = "오늘 한도 다 씀"
            continue
        if cfg["gap"] and bk.get("last"):
            try:
                last = datetime.strptime(bk["last"], "%Y-%m-%d %H:%M").replace(tzinfo=KST)
                if (now - last).total_seconds() < cfg["gap"] * 60:
                    rec["skip"] = f"{cfg['gap']}분 안에 불렀음"
                    continue
            except Exception:
                pass
        # 처음이거나, 읽는 법을 고쳐 판(v)이 올라갔으면 «처음처럼» 넓게 다시 받습니다(옛 줄의 첨부 · 분류를 새로 채우려고)
        first = not (store.get(src) or {}) or int(bk.get("v") or 1) != int(cfg.get("v") or 1)
        box = store.setdefault(src, {})
        jobs = ([("m", m) for m in _kw_months(now, first)] if src == "kw" else [("d", None)])
        alt = bool(bk.get("alt"))       # 날짜를 2026-09-30 모양으로 받는 곳이면(첫 회차에 알아냄) 그렇게
        fails = 0
        for jk, jv in jobs:
            page, total, seen = 1, None, 0
            while page <= (cfg.get("pages1", cfg["pages"]) if first else cfg["pages"]):
                if time.time() - t0 > EXT_BUDGET_S:
                    rec["cut"] = "시간 예산"
                    break
                if bk["calls"] >= cfg["cap"]:
                    rec["cut"] = "하루 상한"
                    break
                if jk == "m":
                    p = {"pageNo": str(page), "numOfRows": str(ROWS), "_type": "json", "searchDt": jv}
                else:
                    p = _params(src, now, first, page, alt=alt)
                bk["calls"] += 1
                rec["calls"] += 1
                try:
                    text = get(cfg["url"], p, EXT_TIMEOUT_S)
                except _Http as e:
                    rec["err"] = {"http": e.status, "body": e.body}
                    fails += 1
                    break
                except Exception as e:
                    rec["err"] = {"net": _why(e)}
                    fails += 1
                    break
                rows, tot, err = parse(text)
                if err:
                    # 날짜 모양이 틀렸다는 뜻일 수 있습니다 — 한 번만 2026-09-30 모양으로 다시 봅니다
                    if (src in ("dapa", "kapt", "lh") and page == 1 and not alt and not err.get("quota")
                            and not _keyish(err) and err.get("code") not in ("xml", "json", "empty")
                            and not bk.get("alt_tried")):
                        bk["alt_tried"] = True
                        alt = True
                        rec["alt"] = err
                        continue
                    if err.get("quota"):
                        bk["quota"] = True
                    rec["err"] = err
                    fails += 1
                    break
                if alt and not bk.get("alt"):
                    bk["alt"] = True
                if rows and "fields" not in rec:
                    rec["fields"] = sorted(rows[0].keys())[:120]
                    rec["sample"] = {k: _s(v, 40) for k, v in list(rows[0].items())[:50]}
                total = tot if total is None else total
                for raw in rows:
                    try:
                        x = _clean(NORM[src](raw))
                    except Exception as e:
                        rec["norm_err"] = _why(e)
                        continue
                    if not x.get("no") or not x.get("nm"):
                        continue
                    x["got"] = now.strftime("%Y-%m-%d %H:%M")
                    old = box.get(x["id"])
                    if old and old.get("first"):
                        x["first"] = old["first"]
                    else:
                        x["first"] = x["got"]
                    box[x["id"]] = x
                    seen += 1
                if src == "kapt":
                    _kapt_codes(rows, rec)
                if not rows or len(rows) < ROWS or (total and page * ROWS >= total):
                    break
                page += 1
            rec["rows"] += seen
            if total is not None:
                rec["total"] = rec.get("total", 0) + (total or 0)
            if fails and src != "kw":
                break
        if rec["calls"] and not rec.get("err"):
            bk["last"] = now.strftime("%Y-%m-%d %H:%M")
            bk["ok"] = bk["last"]
            bk["v"] = int(cfg.get("v") or 1)
        got[src] = rec["rows"]
    _prune(store, now)
    _save(EXT_STORE, store)
    _save(EXT_BOOK, book)
    if diag is not None:
        diag["_ext"] = dg
    return got


class _Http(Exception):
    def __init__(self, status, body):
        super().__init__(f"HTTP {status}")
        self.status, self.body = status, body


def _kapt_codes(rows, rec):
    """K-apt 분류코드 뜻을 알아내려고 — 코드 조합별 건수와 공고명 두 개씩 (진단용)"""
    c = rec.setdefault("codes", {})
    for r in rows:
        k = "/".join(_s(r.get(f"codeClassifyType{i}"), 10) for i in (1, 2, 3))
        e = c.setdefault(k, {"n": 0, "ex": []})
        e["n"] += 1
        if len(e["ex"]) < 2:
            e["ex"].append(_s(r.get("bidTitle"), 40))
    if len(c) > 60:     # 너무 많으면 큰 것만
        rec["codes"] = dict(sorted(c.items(), key=lambda kv: -kv[1]["n"])[:60])


def _prune(store, now):
    cut = (now - timedelta(days=EXT_KEEP_DAYS)).strftime("%Y-%m-%d")
    for src, box in list(store.items()):
        if not isinstance(box, dict):
            store.pop(src, None)
            continue
        for k in [k for k, v in box.items()
                  if (v.get("close") or v.get("dt") or v.get("first") or "")[:10] < cut]:
            box.pop(k, None)


# ── 내보내기 ──────────────────────────────────────────────────────
def _open_now(x, now_s, recent_s):
    """아직 넣을 수 있는 공고인가 — 마감이 있으면 마감으로, 없으면 공고일이 최근이면"""
    c = x.get("close") or ""
    if c:
        if len(c) == 10:          # 날짜만 있으면 그날 끝까지
            c += " 23:59"
        return c >= now_s
    return (x.get("dt") or x.get("first") or "") >= recent_s


def sido_ext(x, sido_fn):
    """어느 시도 공고인가 — ① 참가지역(여럿이면 «경기,서울») ② 주소 · 발주 이름.
       나라장터 공고의 sido 는 «현장» 이지만, 여기는 현장을 안 주는 곳이 많아 «참가지역» 을 먼저 봅니다
       (내 지역에서 넣을 수 있나 — 거르는 뜻은 같습니다). 못 정하면 '' — 화면에서 따로 모아 보여 줍니다."""
    out = []
    try:
        for part in re.split(r"[,/·]", x.get("rgn") or ""):
            part = part.strip()
            if not part or "전국" in part:
                continue
            ab = sido_fn({"site": part, "inst": part, "name": ""}) or ""
            for a in ab.split(","):
                if a and a not in out:
                    out.append(a)
        if not out:
            ab = sido_fn({"site": x.get("addr") or "", "inst": x.get("org") or "",
                          "name": x.get("nm") or ""}) or ""
            out = [a for a in ab.split(",") if a]
    except Exception:
        return ""
    return ",".join(out)


def publish(now=None, g2b_nos=None, sido_fn=None, store=None):
    """보관함 → web/public/data/ext/list.json (+ meta.json)
       g2b_nos: 나라장터 공고번호 모음 — 방위사업청 공고 가운데 나라장터에도 올린 것은 뺍니다(/live 에 이미 있음)
       sido_fn: (pseudo_row) → '경기' 같은 시도 — collect.py 의 sido_of 를 그대로 씁니다(같은 규칙)"""
    now = now or datetime.now(KST)
    store = store if store is not None else _load(EXT_STORE, {})
    book = _load(EXT_BOOK, {})
    now_s = now.strftime("%Y-%m-%d %H:%M")
    recent_s = (now - timedelta(days=10)).strftime("%Y-%m-%d")
    g2b_nos = set(g2b_nos or ())
    rows, by = [], {}
    nuri_titles = set()
    for x in (store.get("nuri") or {}).values():
        nuri_titles.add(re.sub(r"\s+", "", x.get("nm") or ""))
    for src in ORDER:
        keep = []
        for x in (store.get(src) or {}).values():
            if not _open_now(x, now_s, recent_s):
                continue
            k = x.get("kind") or ""
            if src in ("lh", "dapa") and k and "공사" not in k:
                continue                      # LH · 방위사업청은 용역 · 물품도 함께 옵니다
            if src == "kw" and k and "공사" not in k:
                continue
            if src == "kapt":
                c = list(x.get("c") or []) + ["", ""]
                if kapt_kind(x.get("nm"), c[0], c[1]) != "공사":
                    continue                  # K-apt 는 분류코드로 «공사» 만(용역 · 물품 · 관리업자 선정은 뺌) — 보관된 옛 줄도 여기서 다시 가름
            if src == "dapa" and x.get("g2b") and g2b_nos and \
                    {re.sub(r"[^0-9A-Za-z]", "", x["g2b"]),
                     re.sub(r"[^0-9A-Za-z]", "", x["g2b"].split("-")[0])} & g2b_nos:
                continue                      # 나라장터에도 올린 것 — /live 에 있습니다
            if src == "kapt" and x.get("auth", "").startswith("조달청") and \
                    re.sub(r"\s+", "", x.get("nm") or "") in nuri_titles:
                continue                      # 누리장터 쪽에 같은 공고가 있습니다
            y = {k2: v for k2, v in x.items() if k2 not in ("got", "c", "hq", "g2b", "addr")}
            if not y.get("sido") and sido_fn:
                y["sido"] = sido_ext(x, sido_fn)
            if not y.get("sido"):
                y.pop("sido", None)
            keep.append(y)
        keep.sort(key=lambda y: (y.get("dt") or y.get("first") or ""), reverse=True)
        keep = keep[:EXT_SHOW_MAX]
        by[src] = len(keep)
        rows.extend(keep)
    rows.sort(key=lambda y: (y.get("first") or y.get("dt") or ""), reverse=True)
    src_meta = {}
    for src in ORDER:
        b = book.get(src) or {}
        src_meta[src] = {"nm": SRC[src]["nm"], "full": SRC[src]["full"], "n": by.get(src, 0),
                         "ok": b.get("ok", "")}
    os.makedirs(PUB_DIR, exist_ok=True)
    out = {"at": now_s, "src": src_meta, "rows": rows}
    _save(os.path.join(PUB_DIR, "list.json"), out)
    _save(os.path.join(PUB_DIR, "meta.json"), {"at": now_s, "n": len(rows), "by": by})
    return by
