# -*- coding: utf-8 -*-
"""워크넷 채용정보 API 가 되는지 «실제로» 두드려 보는 도구.

    python tools\worknet.py

⚠️ 이 파일은 «확인»만 합니다. 자료를 저장하지도, 화면에 붙이지도 않습니다.
   먼저 되는지 보고, 응답 항목을 눈으로 확인한 다음에 collect.py 에 넣습니다.
   (CLAUDE.md 1번 — 응답 필드를 한 번도 안 찍어보고 «없다»고 말한 적이 세 번 있습니다)

키를 어디서 받나
  · 워크넷 API 키는 **공공데이터포털 키와 별개**입니다.
    https://openapi.work.go.kr  에서 따로 받습니다.
  · 받으면 .env 에 이렇게 한 줄 넣으세요:
        WORKNET_API_KEY=받은키
  · 키가 없으면 이 도구가 조달청 키(G2B_API_KEY)로도 한 번 시험합니다.
    (같은 계정 키가 먹히는 경우가 있어서 확인차 해봅니다)
"""
import io
import os
import ssl
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
URL = "http://openapi.work.go.kr/opi/opi/opia/wantedApi.do"
ssl._create_default_https_context = ssl._create_unverified_context


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
         "startPage": "1", "display": "10"}
    q.update(extra)
    try:
        with urllib.request.urlopen(URL + "?" + urllib.parse.urlencode(q), timeout=20) as r:
            return r.status, r.read()
    except Exception as e:
        return None, f"{type(e).__name__}: {e}".encode()


def show(label, key, **extra):
    print(f"\n{'=' * 60}\n  {label}\n{'=' * 60}")
    st, body = call(key, **extra)
    if st is None:
        print(f"  ❌ 통신 실패 — {body.decode('utf-8', 'replace')[:200]}")
        return False
    txt = body.decode("utf-8", "replace")
    print(f"  HTTP {st} · {len(body):,}바이트")
    try:
        root = ET.fromstring(txt)
    except Exception:
        print("  ❌ XML 이 아닙니다. 앞부분:")
        print("     " + txt[:300].replace("\n", " "))
        return False

    # 오류 응답인지 먼저 본다
    msg = root.findtext(".//message") or root.findtext(".//errMsg") or ""
    total = root.findtext(".//total") or root.findtext(".//totalCount") or ""
    items = root.findall(".//wanted")
    if not items:
        items = [e for e in root if len(e) > 2]

    if msg and not items:
        print(f"  ❌ 서버가 거절했습니다: {msg}")
        print("     (키가 아직 승인 안 됐거나, 이 서비스에 신청이 안 된 키입니다)")
        return False

    print(f"  ✅ 응답 옴 · 전체 {total or '?'}건 · 이번에 받은 것 {len(items)}건")
    if not items:
        print("     (건수가 0입니다 — 조건을 바꿔 다시 보세요)")
        return True

    # ★ 응답 항목을 «전부» 찍는다. 없다고 말하기 전에 이걸 본다.
    names = []
    for e in items[0]:
        if e.tag not in names:
            names.append(e.tag)
    print(f"\n  [응답 항목 {len(names)}개]")
    print("     " + ", ".join(names))

    print("\n  [첫 3건]")
    for it in items[:3]:
        g = lambda t: (it.findtext(t) or "").strip()
        print(f"     · {g('title') or g('wantedTitle') or '(제목없음)'}")
        print(f"       {g('company')}  |  {g('region')}  |  {g('sal') or g('salTpNm')}")
        print(f"       마감 {g('closeDt')}  ·  {g('wantedInfoUrl') or g('wantedMobileInfoUrl') or '(상세주소 없음)'}")
    return True


def main():
    env = load_env()
    wk = env.get("WORKNET_API_KEY") or os.environ.get("WORKNET_API_KEY")
    g2b = env.get("G2B_API_KEY")

    print("워크넷 채용정보 API 확인")
    print(f"  WORKNET_API_KEY : {'있음 (길이 %d)' % len(wk) if wk else '없음'}")
    print(f"  G2B_API_KEY     : {'있음 (길이 %d)' % len(g2b) if g2b else '없음'}")

    ok = False
    if wk:
        ok = show("① 워크넷 키로", wk)
    if not ok and g2b:
        ok = show("② 조달청 키로 (같은 계정 키가 먹히나 확인)", g2b)

    if ok:
        # 건설 쪽만 걸러지는지도 본다
        show("③ 「건설」 로 걸러보기", wk or g2b, keyword="건설")
        print("\n" + "=" * 60)
        print("  ✅ 됩니다. 이 화면을 그대로 클로드에게 보여주세요.")
        print("     응답 항목을 보고 collect.py 에 붙이겠습니다.")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("  ⛔ 아직 안 됩니다.")
        print("     · 키를 아직 안 받으셨다면: https://openapi.work.go.kr 에서 신청")
        print("     · 받으셨다면 .env 에 한 줄 추가:  WORKNET_API_KEY=받은키")
        print("     · 신청 직후면 승인까지 시간이 걸릴 수 있습니다")
        print("     이 화면을 그대로 클로드에게 보여주세요.")
        print("=" * 60)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
