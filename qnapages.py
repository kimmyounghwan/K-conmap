# -*- coding: utf-8 -*-
"""
qnapages.py — 사랑방 글을 «글마다 한 장» 으로 검색에 내기 위한 자료 (2026-09-29)

소장님: 「사랑방 글도 페이지 넣어서 검색 되게 했지??」 → 「다 페이지 달아 줘.」

■ 왜 필요한가
    사랑방 글은 화면을 연 뒤에 데이터베이스(RTDB)에서 불러와 그렸습니다.
    검색엔진이 받는 것은 /qna 한 장(고정 소개 글)뿐이라 글 내용이 검색에 한 줄도 안 걸렸습니다.
    → 사이트를 굽는 회차마다(Actions) 글을 읽어 /qna/{글번호} 를 한 장씩 굽고(prerender.py),
      사이트맵(sitemap-qna.xml)에 냅니다(sitemap.py). 지운 글은 다음 회차에 빠집니다.

■ 읽는 곳 — database.rules.json 에서 누구나 읽게 열린 네 칸만 읽습니다(열쇠 없이).
    qna(글) · qna_a(답글) · qna_del(지운 글 표시) · qna_top(📌 고정)
    ⚠️ 못 읽으면(망 · 규칙) None — 사랑방 페이지만 건너뛰고 나머지 굽기는 그대로 갑니다.

■ 가리는 것 — 전화번호 · 메일 주소는 «(전화번호 가림)» 으로 바꿔 싣습니다.
    화면(Qna.jsx · lib/가림.js)도 같은 규칙으로 가립니다 — 굽는 글과 화면 글이 달라지면 안 됩니다(클로킹).
    ⚠️ 두 곳의 규칙을 바꿀 때는 같이 바꿉니다.

■ 한 회차 안에서 sitemap.py(빌드 앞)와 prerender.py(빌드 뒤)가 «같은 글 목록» 을 보도록
    처음 읽은 것을 임시 파일에 30분 남겨 둡니다(사이트맵에 있는데 안 구운 주소가 생기지 않게).
"""
import json
import os
import re
import tempfile
import time
import urllib.request
from datetime import datetime, timedelta, timezone

DB = (os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com").rstrip("/")
CACHE = os.environ.get("QNA_SNAPSHOT") or os.path.join(tempfile.gettempdir(), "kcm_qna_snapshot.json")
TTL = 30 * 60
KST = timezone(timedelta(hours=9))

# lib/말머리.js 와 같게 — 제목 앞 [말머리]
갈래들 = ["후기·건의", "K-건설맵"]
옛갈래들 = ["질문", "현장", "공동도급", "구인구직"]
_머리 = re.compile(r"^\[([^\]]{1,8})\]\s*")
# 파이어베이스 push 번호: 영문 · 숫자 · - · _ (주소 · 파일 이름에 그대로 씁니다)
_번호 = re.compile(r"^[A-Za-z0-9_-]{6,40}$")

# lib/가림.js 와 같게
# ⚠️ 뒤돌아보기((?<!…))는 옛 아이폰 사파리(16.4 전)가 못 읽어 화면이 통째로 멈춥니다 — 앞 글자를 묶어 되돌려 넣습니다
_전화 = re.compile(r"(^|[^0-9])((?:\+82[\s.\-]*|0)1[016789][\s.\-)]*\d{3,4}[\s.\-]*\d{4}"
                 r"|0\d{1,2}[\s.\-)]+\d{3,4}[\s.\-]+\d{4}"
                 r"|0\d{1,2}\d{7,8})(?![0-9])", re.ASCII)   # \d 를 JS 처럼 0~9 만
_메일 = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(?:\.[A-Za-z0-9\-]+)+")


def 가림(s):
    s = str(s or "")
    s = _메일.sub("(메일 주소 가림)", s)
    return _전화.sub(lambda m: m.group(1) + "(전화번호 가림)", s)


def 갈래떼기(t):
    s = str(t or "")
    m = _머리.match(s)
    if m and m.group(1) in 갈래들:
        return m.group(1), s[m.end():], ""
    if m and m.group(1) in 옛갈래들:
        return "후기·건의", s[m.end():], m.group(1)
    return "후기·건의", s, ""


def _get(node):
    with urllib.request.urlopen(f"{DB}/{node}.json", timeout=25) as r:
        return json.loads(r.read().decode("utf-8")) or {}


def snapshot(fresh=False):
    """{'qna','qna_a','qna_del','qna_top'} 또는 None(못 읽음)."""
    if not fresh:
        try:
            if time.time() - os.path.getmtime(CACHE) < TTL:
                with open(CACHE, encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
    try:
        snap = {"qna": _get("qna")}
    except Exception as e:
        print(f"  · 사랑방 글을 못 읽었습니다({type(e).__name__}: {e}) — 사랑방 글 페이지는 건너뜁니다")
        return None
    for k in ("qna_a", "qna_del", "qna_top"):
        try:
            snap[k] = _get(k)
        except Exception as e:
            print(f"  · {k} 를 못 읽었습니다({type(e).__name__}) — 빈 것으로 봅니다")
            snap[k] = {}
    # ⚠️ 이용자 번호(uid)는 굽는 데 쓰지 않습니다 — 임시 파일에도 남기지 않습니다
    for r in (snap["qna"] or {}).values():
        if isinstance(r, dict):
            r.pop("uid", None)
    for g in (snap["qna_a"] or {}).values():
        for a in (g or {}).values() if isinstance(g, dict) else []:
            if isinstance(a, dict):
                a.pop("uid", None)
    try:
        with open(CACHE, "w", encoding="utf-8") as f:
            json.dump(snap, f, ensure_ascii=False)
    except Exception:
        pass
    return snap


def posts(snap):
    """지운 글을 뺀 사랑방 글 — 새 글부터. 글마다 답글(지운 것 빼고, 오래된 것부터)."""
    if not snap:
        return []
    q = snap.get("qna") or {}
    dl = snap.get("qna_del") or {}
    aa = snap.get("qna_a") or {}
    top = snap.get("qna_top") or {}
    out = []
    for pid, r in q.items():
        # 🙈 sb = 몰래 차단 기기의 글(G101) — 쓴 기기 · 운영자에게만 보이므로 굽지도 사이트맵에 넣지도 않습니다
        if not isinstance(r, dict) or r.get("deleted") or r.get("sb") or pid in dl or not _번호.match(pid):
            continue
        c, t, 옛 = 갈래떼기(r.get("t"))
        t = 가림(t).strip()
        if not t:
            continue
        ans = []
        for aid, a in ((aa.get(pid) or {}).items() if isinstance(aa.get(pid), dict) else []):
            if not isinstance(a, dict) or a.get("deleted") or a.get("sb") or not str(a.get("b") or "").strip():
                continue
            ans.append({"id": aid, "b": 가림(a.get("b")).strip(), "nick": str(a.get("nick") or "익명")[:20],
                        "at": _num(a.get("at")), "op": a.get("op") is True})
        ans.sort(key=lambda a: a["at"])
        at = _num(r.get("at"))
        e = _num(r.get("e"))
        out.append({"id": pid, "c": c, "t": t, "옛": 옛, "b": 가림(r.get("b")).strip(),
                    "nick": str(r.get("nick") or "익명")[:20], "at": at, "e": e, "ans": ans,
                    "pin": pid in top, "pin_at": _num(top.get(pid)),
                    "mod": max([at, e] + [a["at"] for a in ans])})
    out.sort(key=lambda p: -p["at"])
    return out


def _num(v):
    try:
        return int(v)
    except Exception:
        return 0


def ymd(ms, sep="-"):
    if not ms:
        return ""
    return datetime.fromtimestamp(ms / 1000, KST).strftime(f"%Y{sep}%m{sep}%d")


def iso(ms):
    if not ms:
        return None
    return datetime.fromtimestamp(ms / 1000, KST).isoformat(timespec="seconds")


if __name__ == "__main__":
    ps = posts(snapshot(fresh=True))
    print(f"사랑방 글 {len(ps)}편 (📌 {sum(1 for p in ps if p['pin'])}) · 답글 {sum(len(p['ans']) for p in ps)}")
    for p in ps[:10]:
        print(f"  /qna/{p['id']}  [{p['c']}] {p['t'][:40]}  답 {len(p['ans'])}")
