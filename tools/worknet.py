# -*- coding: utf-8 -*-
"""고용24(워크넷) 채용정보 API 가 «지금» 되는지 실제로 두드려 보는 도구.

    python tools\worknet.py

⚠️ 이 파일은 «확인»만 합니다. 자료를 저장하지도, 화면에 붙이지도 않습니다.
   결과는 화면과 tools/_worknet결과.txt 에 같이 씁니다(클로드가 그 파일을 읽습니다).

⚠️ 키 값은 절대 찍지 않습니다. 길이만 찍습니다.

2026-09-03 에 한 번 했고, 그때 답은 이랬습니다:
    <error>개인회원은 사용할 수 없는 OPEN-API입니다.</error>
채용정보 API 는 «사업자등록번호가 있는 기업회원» 만 씁니다.
그 뒤 계정을 기업회원으로 바꾸셨다면 **같은 키 문자열 그대로** 통과합니다.
그래서 다시 두드려 보는 것입니다.  (2026-09-14 다시 씀)

주소가 바뀌었습니다 — 옛 openapi.work.go.kr/…/wantedApi.do 는 더 안 씁니다.
    목록 210L01 : https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do
"""
import io
import os
import ssl
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "tools", "_worknet결과.txt")
URL = "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do"
ssl._create_default_https_context = ssl._create_unverified_context

_lines = []


def say(s=""):
    print(s)
    _lines.append(s)


def load_env():
    out = {}
    p = os.path.join(ROOT, ".env")
    if os.path.exists(p):
        for line in io.open(p, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def call(key, **extra):
    q = {"authKey": key, "callTp": "L", "returnType": "XML",
         "startPage": "1", "display": "100"}
    q.update(extra)
    try:
        with urllib.request.urlopen(URL + "?" + urllib.parse.urlencode(q), timeout=25) as r:
            return r.status, r.read()
    except Exception as e:
        return None, ("%s: %s" % (type(e).__name__, e)).encode()


def show(label, key, **extra):
    """(됐나, 받은 항목들) 을 돌려준다."""
    say()
    say("=" * 64)
    say("  " + label)
    say("=" * 64)
    st, body = call(key, **extra)
    if st is None:
        say("  [실패] 통신 자체가 안 됩니다 - " + body.decode("utf-8", "replace")[:200])
        return False, []
    txt = body.decode("utf-8", "replace")
    say("  HTTP %s · %s바이트" % (st, format(len(body), ",")))

    # ★ 0건이든 오류든, 원문 앞머리를 «항상» 남긴다 (이유 없는 0건은 다시 없다)
    say("  [응답 원문 앞 500자]")
    say("    " + txt[:500].replace("\n", " ").replace("\r", " "))

    try:
        root = ET.fromstring(txt)
    except Exception as e:
        say("  [실패] XML 로 안 읽힙니다 - %s" % e)
        return False, []

    err = (root.findtext(".//error") or root.findtext(".//message")
           or root.findtext(".//errMsg") or "")
    items = root.findall(".//wanted")
    if not items:
        items = [e for e in root if len(e) > 2]

    if err and not items:
        say("  [거절] 서버가 이렇게 답했습니다: " + err.strip())
        return False, []

    total = root.findtext(".//total") or root.findtext(".//totalCount") or "?"
    say("  [성공] 전체 %s건 · 이번에 받은 것 %d건" % (total, len(items)))
    return True, items


def dump(items, n=3):
    if not items:
        say("     (건수 0)")
        return
    names = []
    for e in items[0]:
        if e.tag not in names:
            names.append(e.tag)
    say()
    say("  [응답 항목 %d개]" % len(names))
    say("     " + ", ".join(names))

    say()
    say("  [업종(indTpNm) 분포 - 건설 거르기를 이걸로 정합니다]")
    c = Counter((it.findtext("indTpNm") or "(없음)").strip() for it in items)
    for k, v in c.most_common(30):
        say("     %4d  %s" % (v, k))

    say()
    say("  [직종코드(jobsCd) 분포]")
    c2 = Counter((it.findtext("jobsCd") or "(없음)").strip() for it in items)
    for k, v in c2.most_common(15):
        say("     %4d  %s" % (v, k))

    say()
    say("  [첫 %d건]" % n)
    for it in items[:n]:
        g = lambda t: (it.findtext(t) or "").strip()
        say("     · %s" % (g("title") or "(제목없음)"))
        say("       %s | %s | %s | 업종 %s" % (g("company"), g("region"), g("sal") or g("salTpNm"), g("indTpNm")))
        say("       등록 %s · 마감 %s" % (g("regDt"), g("closeDt")))
        say("       %s" % (g("wantedInfoUrl") or g("wantedMobileInfoUrl") or "(상세주소 없음)"))


def main():
    env = load_env()
    wk = env.get("WORKNET_API_KEY") or os.environ.get("WORKNET_API_KEY") or ""

    say("고용24(워크넷) 채용정보 API 확인  -  %s" % __import__("datetime").datetime.now().strftime("%Y-%m-%d %H:%M"))
    say("  주소            : " + URL)
    say("  WORKNET_API_KEY : %s" % ("있음 (길이 %d)" % len(wk) if wk else "없음"))
    say("  (키 값은 찍지 않습니다)")

    if not wk:
        say()
        say("  [멈춤] .env 에 WORKNET_API_KEY 가 없습니다.")
        return 1

    ok, items = show("① 그냥 불러보기 (조건 없음)", wk)
    if ok:
        dump(items)
        ok2, items2 = show("② 「건설」 로 걸러보기 (keyword=건설)", wk, keyword="건설")
        if ok2:
            dump(items2)

    say()
    say("=" * 64)
    if ok:
        say("  결론: 됩니다. 업종 분포를 보고 건설만 거르면 됩니다.")
    else:
        say("  결론: 아직 안 됩니다. 위 [거절] 줄이 이유입니다.")
        say("        '개인회원은 사용할 수 없는' 이면 -> 고용24 기업회원 전환이 필요합니다.")
    say("=" * 64)

    try:
        io.open(OUT, "w", encoding="utf-8").write("\n".join(_lines))
        print("\n결과를 %s 에 썼습니다." % OUT)
    except Exception as e:
        print("결과 파일 쓰기 실패: %s" % e)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
