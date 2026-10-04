"""📰 오늘의 건설 소식 — 건설 전문지 RSS → 데이터베이스 fresh/news (2026-10-04 · G128)

소장님: 「건설뉴스?」 → (클로드) 사랑방 맨 위에 「오늘의 건설 소식」 · 소식마다 «이야기하기» → 사랑방 글
        → 「클로드가 다 해」

■ 어디서: 열쇠(API 키)가 필요 없는 언론사 RSS 만 씁니다 — 2026-10-04 클로드가 주소마다 실제로 열어 확인.
    · 대한전문건설신문 (koscaj.com)      — 전문건설 · 하도급 · 업계 소식 → 그대로
    · 조달경제신문     (jodaleconomy.com) — 물품 조달 기사가 섞여 «시설공사 · 입찰» 낱말 있는 것만
    · 안전신문         (safetynews.co.kr) — 지역 행사 기사가 섞여 «건설 현장 · 산재» 낱말 있는 것만
  ⛔ 네이버 «실시간 검색어» 는 없습니다(2021 폐지 · 2023 트렌드토픽도 폐지). 정책브리핑 RSS 도 중단됐습니다.
  ⛔ 확인 못 한 곳(대한경제 = robots 막힘 · 국토일보/한국건설신문/건설이코노미 = 인증서 오류 · 국토매일/건설타임즈 = 404)은 안 넣었습니다.
■ 무엇을: «제목 · 언론사 · 시각 · 원문 주소» 만. 기사 요약(description)·본문은 옮기지 않습니다(저작권 — 누르면 언론사로 갑니다).
■ 넣는 것: fresh/news = {at, n: {언론사: 받은 수}, items: [{t, s, u, d, p?, pl?}]}
    t 제목 · s 언론사 · u 원문 주소 · d 기사 시각(ms) · p/pl 이어 줄 우리 도구 주소/이름(있을 때만 — «도구잇기» 한 곳에서만 정함)
  fresh 는 누구나 읽고 아무도 못 씁니다(규칙) — 서비스 계정만 씀. 알림 함수(freshNotify)는 fresh/meta 만 보므로 건드리지 않습니다.
■ 한 곳이 실패하면 그 언론사는 «지난번 것» 을 그대로 둡니다. 전부 실패하면 아예 안 씁니다(빈 칸으로 덮지 않게).
■ 돌리는 곳: .github/workflows/건설소식.yml (매시 한 번 · 1분 안). 시험: python tools/시험_건설소식.py (인터넷 없이)
    손으로: python tools/건설소식.py --dry   (쓰지 않고 결과만 찍음)
"""
import html
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlparse
from xml.etree import ElementTree as ET

DB = (os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com").rstrip("/")
KST = timezone(timedelta(hours=9))
UA = "Mozilla/5.0 (compatible; K-conmap-news/1.0; +https://k-conmap.com)"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# 건설 밖 기사가 섞인 곳은 제목에 이 낱말이 있어야 싣습니다 (2026-10-05 실제 RSS 를 보고 좁힘)
#   안전신문 — 지역 축제 «안전관리» · «착한아파트» 같은 것이 섞임 → 건설 현장 · 산재 쪽 낱말만
#   조달경제신문 — 우주선 · 로봇 · 소방헬기 같은 물품 조달이 섞임 → 시설공사 · 입찰 쪽 낱말만
안전거름 = re.compile(
    r"건설|공사|현장|시공|중대재해|산재|산업재해|추락|붕괴|매몰|끼임|안전보건|노동부|타워크레인|굴착|비계|거푸집|하도급|국토안전")
# 칼럼 · 논단 · 기고 · 사설 · 시각 — 건설 낱말이 있을 때만 (2026-10-05 [보라매칼럼] · [논단] 이 건설 밖 이야기)
의견머리 = re.compile(r"^\s*[\[【(<][^\]】)>]*(칼럼|논단|기고|사설|社說|視覺|시각|오피니언|데스크)[^\]】)>]*[\]】)>]")
조달거름 = re.compile(
    r"건설|공사|시설|토목|건축|입찰|낙찰|개찰|적격|하도급|발주|SOC|사정률|예정가격|기초금액")

출처들 = [
    {"s": "대한전문건설신문", "u": "https://www.koscaj.com/rss/allArticle.xml", "거름": None},
    {"s": "조달경제신문", "u": "https://www.jodaleconomy.com/rss/allArticle.xml", "거름": 조달거름},
    {"s": "안전신문", "u": "https://www.safetynews.co.kr/rss/allArticle.xml", "거름": 안전거름},
]

# 이런 머리가 붙은 기사는 뺍니다 — 사람 소식 · 사진 한 장 · 알림
#   (칼럼 · 기고 · 논단은 둡니다 — 실제 RSS 에 [법 상담] · [노무] · [세무회계] 같은 실무 글이 많고 이야깃거리가 됨)
뺄머리 = re.compile(r"^\s*[\[【(<]\s*(인사|부고|동정|포토|화촉|알림|게시판|社告|만평|신간|광고)\s*[\]】)>]")
뺄낱말 = re.compile(r"부고|별세|모친상|부친상|빙모상|빙부상|결혼|화촉")

며칠 = 4          # 이만큼 지난 기사는 안 실음 (연휴에도 비지 않게)
언론사마다 = 12    # 한 곳이 다 차지하지 않게
모두 = 30

# 🔧 소식 → 우리 도구 (첫 번째로 맞는 것 하나). 주소는 web/src/main.jsx 에 있는 것만.
도구잇기 = [
    (re.compile(r"4대\s*보험|국민연금|건강보험|고용보험|일용\s*근로|일용직"), "/tools/ilyong-boheom", "4대보험 판단기"),
    (re.compile(r"산재\s*보험|보험료"), "/tools/boheomryo", "고용·산재 보험료 계산기"),
    (re.compile(r"퇴직\s*공제"), "/tools/toejik", "퇴직공제 집계"),
    (re.compile(r"안전\s*관리비|산업안전보건관리비"), "/tools/sanan", "안전관리비 계상기"),
    (re.compile(r"중대재해|안전관리계획|유해\s*위험|추락|붕괴|매몰|끼임|사망\s*사고|안전보건|산업재해|산재"), "/safety", "안전 서류"),
    (re.compile(r"설계\s*변경|물가\s*변동|에스컬|계약금액\s*조정|공사비\s*(증액|현실화)"), "/change", "설계변경"),
    (re.compile(r"노임|노무비|일당"), "/tools/nomubi", "노무비 계산기"),
    (re.compile(r"낙찰\s*하한|적격\s*심사|입찰|낙찰|개찰|사정률|투찰|공동\s*도급|공동\s*수급"), "/", "바로투찰"),
]


def 지금():
    return datetime.now(KST)


def 적기(*a):
    print(지금().strftime("%H:%M:%S"), *a, flush=True)


def 글다듬기(s):
    s = html.unescape(html.unescape(str(s or "")))
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", s).strip()


def 시각(s):
    """RSS 날짜 → ms. 표준(RFC 822) 과 «2026-10-04 12:32:00»(한국시각) 둘 다. 모르면 None"""
    s = (s or "").strip()
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s)
        if d.tzinfo is None:
            d = d.replace(tzinfo=KST)
        return int(d.timestamp() * 1000)
    except Exception:
        pass
    m = re.match(r"(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?", s)
    if m:
        y, mo, dd, h, mi, se = (int(x or 0) for x in m.groups())
        try:
            return int(datetime(y, mo, dd, h, mi, se, tzinfo=KST).timestamp() * 1000)
        except ValueError:
            return None
    return None


def 열쇠(t):
    """같은 기사를 두 번 싣지 않게 — 글자·숫자만 남긴 앞 30자"""
    return re.sub(r"[^0-9A-Za-z가-힣]", "", t)[:30]


def 도구(t):
    for 꼴, p, pl in 도구잇기:
        if 꼴.search(t):
            return p, pl
    return None, None


def 읽기(xml, 출처, 지금ms):
    """RSS 글 → 기사 목록 (거르고 · 오래된 것 빼고 · 새것부터). 인터넷 없이 시험할 수 있게 따로."""
    root = ET.fromstring(xml)
    호스트 = urlparse(출처["u"]).hostname
    끝 = 지금ms - 며칠 * 86400000
    out = []
    for it in root.iter("item"):
        t = 글다듬기(it.findtext("title"))
        u = (it.findtext("link") or "").strip()
        d = 시각(it.findtext("pubDate") or it.findtext("{http://purl.org/dc/elements/1.1/}date"))
        if not t or len(t) < 6 or not u or d is None:
            continue
        pu = urlparse(u)
        if pu.scheme not in ("http", "https") or pu.hostname != 호스트:
            continue                     # 남의 주소로 새는 것은 싣지 않습니다
        u = "https://" + pu.netloc + pu.path + (("?" + pu.query) if pu.query else "")
        if 뺄머리.search(t) or 뺄낱말.search(t):
            continue
        if 출처["거름"] is not None and not 출처["거름"].search(t):
            continue
        if 의견머리.search(t) and not (안전거름.search(t) or 조달거름.search(t)):
            continue                     # [보라매칼럼] 공공기관 이전 · [논단] 에너지전략 같은 건설 밖 의견 글
        if d < 끝 or d > 지금ms + 3600000:   # 너무 옛것 · 앞날짜(잘못 찍힌 것)
            continue
        x = {"t": t[:120], "s": 출처["s"], "u": u[:300], "d": d}
        p, pl = 도구(t)
        if p:
            x["p"], x["pl"] = p, pl
        out.append(x)
    out.sort(key=lambda x: -x["d"])
    return out[:언론사마다]


def 합치기(언론사별, 옛):
    """{언론사: [기사] 또는 None(실패)} + 옛 fresh/news → 새 fresh/news. 실패한 곳은 옛것을 이어 씀."""
    옛것 = {}
    for x in ((옛 or {}).get("items") or []):
        if isinstance(x, dict) and x.get("s"):
            옛것.setdefault(x["s"], []).append(x)
    모음, n = [], {}
    for s, 목록 in 언론사별.items():
        if 목록 is None:
            목록 = 옛것.get(s, [])
        n[s] = len(목록)
        모음.extend(목록)
    모음.sort(key=lambda x: -x["d"])
    본, 줄 = set(), {}
    for x in 모음:
        k = 열쇠(x["t"])
        if k in 본:
            continue
        본.add(k)
        줄.setdefault(x["s"], []).append(x)
    # 🔀 언론사를 번갈아 — 주간지가 월요일 아침에 한꺼번에 내면(2026-10-05 실제 7건이 07:00) 첫 다섯 줄이 한 곳으로 차서
    #    가장 새 기사가 있는 언론사부터 한 줄씩 돌아가며 놓습니다. 줄마다 «몇 시간 전» 이 보이니 섞여도 헷갈리지 않음.
    차례 = sorted(줄, key=lambda s: -줄[s][0]["d"])
    남김 = []
    while len(남김) < 모두 and any(줄[s] for s in 차례):
        for s in 차례:
            if 줄[s] and len(남김) < 모두:
                남김.append(줄[s].pop(0))
    return {"at": int(time.time() * 1000), "n": n, "items": 남김}


def 계정():
    raw = (os.environ.get("FIREBASE_SERVICE_ACCOUNT") or "").strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        import base64
        try:
            return json.loads(base64.b64decode(raw).decode("utf-8"))
        except Exception:
            return None


def 토큰(sa):
    from google.oauth2 import service_account
    import google.auth.transport.requests as gr
    c = service_account.Credentials.from_service_account_info(
        sa, scopes=["https://www.googleapis.com/auth/firebase.database",
                    "https://www.googleapis.com/auth/userinfo.email"])
    c.refresh(gr.Request())
    return c.token


def main():
    import requests
    a = sys.argv[1:]
    dry = "--dry" in a
    지금ms = int(time.time() * 1000)
    언론사별 = {}
    for 출처 in 출처들:
        try:
            r = requests.get(출처["u"], headers={"User-Agent": UA}, timeout=20)
            r.raise_for_status()
            목록 = 읽기(r.content, 출처, 지금ms)
            언론사별[출처["s"]] = 목록
            적기(f"  · {출처['s']}: {len(목록)}건")
        except Exception as e:
            언론사별[출처["s"]] = None
            적기(f"  ! {출처['s']} 못 받음 ({type(e).__name__}: {str(e)[:160]})")
    if all(v is None for v in 언론사별.values()):
        적기("⛔ 한 곳도 못 받았습니다 — 지난 소식을 그대로 둡니다.")
        return
    try:
        옛 = requests.get(f"{DB}/fresh/news.json", timeout=20).json()
    except Exception:
        옛 = None
    새 = 합치기(언론사별, 옛)
    적기(f"  → {len(새['items'])}건 (도구 이음 {sum(1 for x in 새['items'] if x.get('p'))}건)")
    if dry:
        print(json.dumps(새, ensure_ascii=False, indent=1)[:4000])
        return
    sa = 계정()
    if not sa:
        적기("[멈춤] FIREBASE_SERVICE_ACCOUNT 가 없습니다.")
        sys.exit(1)
    r = requests.put(f"{DB}/fresh/news.json",
                     headers={"Authorization": "Bearer " + 토큰(sa), "Content-Type": "application/json"},
                     data=json.dumps(새, ensure_ascii=False).encode("utf-8"), timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f"데이터베이스 HTTP {r.status_code} {r.text[:120]}")
    적기("✅ fresh/news 넣음")


if __name__ == "__main__":
    main()
