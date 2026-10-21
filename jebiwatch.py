# -*- coding: utf-8 -*-
"""
jebiwatch.py — 📋 조달청 «간접공사비(제비율) 적용기준» 새 글 지키기 (G350 · 2026-10-21)

소장님: 「계속 바뀌는 건 아니야? 계속 바뀐다면 거기에 따른 대비책도 있어야 하잖아.」
  → 2026년만 세 번 바뀜(1. 1. · 3. 13. · 4. 13.). 표는 web/src/data/jebiyul.json(판마다 · 원문 엑셀에서 옮김).

■ 하는 일 — 하루 한 번만(6시간 안에 다시 안 봄)
  조달청 시설공사 자료실 목록(https://pps.go.kr/kor/bbs/list.do?key=00038) 1 ~ 2쪽을 읽어
  제목에 «간접공사비» 또는 «제비율» 이 든 글 가운데 jebiyul.json 판(글번호)에 없는 것 = «새것».
  · prerender.py 가 부름 → web/dist/data/jebi_watch.json (화면 /tools/jebiyul 이 «새 기준이 올라왔습니다» 를 띄움)
  · tools/qna_mail.py 가 부름 → 새것이면 소장님께 메일 한 통(같은 글로 두 번 안 보냄 — RTDB jebi_mail/{글번호})
  상태(마지막으로 본 때 · 결과)는 data/store/jebi_watch.json — 회차 사이에 넘어가는 곳.

■ ⚠️ 못 읽어도 사이트는 그대로 — 실패하면 «ok: false» 만 적고 지난 결과를 둡니다(화면은 «마지막 확인» 날짜만 그대로).
■ 비용: 한 번에 작은 요청 1 ~ 2번 · 하루 4번 안쪽.
"""
import json
import os
import re
import time
import urllib.request
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "web", "src", "data", "jebiyul.json")
STORE = os.path.join(ROOT, "data", "store", "jebi_watch.json")
LIST = "https://pps.go.kr/kor/bbs/list.do?key=00038&pageIndex={}"
KST = timezone(timedelta(hours=9))
UA = {"User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                     "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"), "Accept-Language": "ko-KR,ko;q=0.9"}
제목꼴 = re.compile(r"간접공사비|제비율")
쉼 = 6 * 3600


def 알려진글():
    """jebiyul.json 판의 글번호들 · 가장 늦은 게시일(이보다 앞선 옛 글은 «새것» 으로 보지 않음)"""
    try:
        d = json.load(open(DATA, encoding="utf-8"))
        판 = d.get("판") or []
        return {str(p.get("글번호")) for p in 판 if p.get("글번호")}, max((p.get("게시") or "") for p in 판) if 판 else ""
    except Exception:
        return set(), ""


def 줄뽑기(html):
    """목록 HTML → [{sn, 제목, 날}] — 제목에 간접공사비 · 제비율이 든 줄만.
    줄(<tr>) 안의 10자리 글번호(bbsSn) · 날짜(YYYY-MM-DD) · 링크 글을 읽습니다."""
    out = []
    for tr in re.findall(r"<tr\b.*?</tr>", html or "", flags=re.S | re.I):
        글 = re.sub(r"<[^>]+>", " ", tr)
        글 = re.sub(r"\s+", " ", 글).strip()
        if not 제목꼴.search(글):
            continue
        sn = None
        for m in re.findall(r"(?<!\d)(2\d{9})(?!\d)", tr):
            sn = m
            break
        m = re.search(r"20\d\d[-.]\d\d[-.]\d\d", 글)
        날 = m.group(0).replace(".", "-") if m else ""
        제목 = ""
        for a in re.findall(r"<a\b[^>]*>(.*?)</a>", tr, flags=re.S | re.I):
            t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", a)).strip()
            if 제목꼴.search(t):
                제목 = t
                break
        if not 제목:
            제목 = 글
        if sn:
            out.append({"sn": sn, "제목": 제목[:120], "날": 날})
    return out


def 받기(url, timeout=15):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def 지금():
    return datetime.now(KST).strftime("%Y-%m-%d %H:%M")


def 읽기():
    try:
        return json.load(open(STORE, encoding="utf-8")) or {}
    except Exception:
        return {}


def 보기(억지=False, 쪽=2):
    """자료실을 봅니다(6시간 안이면 지난 결과 그대로). 돌려주는 것 = 상태 {at, ok, 새것, 본것}"""
    st = 읽기()
    if not 억지 and st.get("t") and time.time() - float(st.get("t") or 0) < 쉼:
        return st
    알, 최근 = 알려진글()
    줄 = []
    try:
        for p in range(1, 쪽 + 1):
            줄 += 줄뽑기(받기(LIST.format(p)))
        ok = True
    except Exception as e:
        ok = False
        st["까닭"] = f"{type(e).__name__}: {str(e)[:80]}"
    if ok:
        seen = {}
        for x in 줄:
            seen.setdefault(x["sn"], x)
        새것 = [x for sn, x in seen.items() if sn not in 알 and (x.get("날") or "9999") >= 최근]
        새것.sort(key=lambda x: x.get("날") or "", reverse=True)
        st = {"t": time.time(), "at": 지금(), "ok": True, "새것": 새것[:5], "본것": len(seen), "알려진": sorted(알)}
    else:
        st.update({"t": time.time(), "ok": False, "시도": 지금()})
    try:
        os.makedirs(os.path.dirname(STORE), exist_ok=True)
        json.dump(st, open(STORE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception:
        pass
    return st


def 굽기(dist):
    """prerender.py — dist/data/jebi_watch.json (화면이 읽음 · 몇백 바이트)"""
    try:
        st = 보기()
        pub = {"at": st.get("at") or "", "ok": bool(st.get("ok")), "새것": st.get("새것") or []}
        os.makedirs(os.path.join(dist, "data"), exist_ok=True)
        json.dump(pub, open(os.path.join(dist, "data", "jebi_watch.json"), "w", encoding="utf-8"), ensure_ascii=False)
        print(f"  · 📋 제비율 지킴: {'새 글 ' + str(len(pub['새것'])) + '개' if pub['새것'] else '새 글 없음'} · {pub['at'] or '못 읽음'}")
        return pub
    except Exception as e:
        print(f"  · 📋 제비율 지킴 건너뜀 ({type(e).__name__})")
        return None


def 메일글(새것):
    줄 = ["조달청 시설공사 자료실에 «간접공사비(제비율) 적용기준» 새 글이 올라왔습니다.", ""]
    for x in 새것:
        줄.append(f"· {x.get('날') or ''} {x.get('제목') or ''}")
        줄.append(f"  https://pps.go.kr/kor/bbs/view.do?bbsSn={x['sn']}&key=00038")
    줄 += ["", "건설맵 «간접공사비 요율 찾기»(/tools/jebiyul)에는 아직 옛 판이 나옵니다 — 화면에 «새 기준이 올라왔습니다» 가 떠 있습니다.",
          "새 판 넣는 법: 원문 엑셀 → tools/jebiyul/만들기.py 에 줄 더하기(원문 지문 · 칸 대조 두 번) → 올리기.", "", "— K-건설맵"]
    return "\n".join(줄)


if __name__ == "__main__":
    import sys
    s = 보기(억지="--now" in sys.argv)
    print(json.dumps(s, ensure_ascii=False, indent=1)[:1500])
