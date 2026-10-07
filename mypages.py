# -*- coding: utf-8 -*-
"""
mypages.py — 🪪 마이컨맵 공개 페이지(/@주소)를 검색에 내기 위한 자료 (G188 · 2026-10-07)

소장님: 「검색에 걸리게 해줘. 그리고, 만들기 단추를 주고 … 자기가 원하는 것을 꾸미게」 → 「우선 만들어 줘. 컨맵에 띄우지는 말고」

■ 읽는 곳 — database.rules.json 에서 누구나 읽게 열린 두 칸만(열쇠 없이): mp_pub(공개 문서) · mp_flag(🚩 신고)
■ 공개 범위(G188 「공개, 비공개 선택」) — 🌐 공개만 검색 · 사이트맵 / 🔗 링크는 굽되 noindex / 🔒 나만은 안 굽음(mp_pub 에 표만)
■ 굽는 것 — «검색 등록» 칸을 다 채운 페이지만(lib/마이컨맵.js 검색칸 과 글자까지 같은 규칙):
      ① 이름 ② 한 줄 소개 5자 이상 ③ 소개 글 100자 이상 ④ 채운 블록 3개 이상 · 🚩 신고 3건 미만
   빈 페이지를 대량으로 내면 구글 «scaled content» 스팸 · 애드센스 «가치 낮은 콘텐츠» 에 걸립니다(기록 2026-10-07 13:46).
■ 📞 전화번호 · 카톡 주소는 굽지 않습니다 — 화면도 «누르면» 보입니다(광고 업자 긁기 막기). 글 속 전화 · 메일은 가림(qnapages.가림 = lib/가림.js).
■ prerender.py 가 /@{주소} 를 한 장씩 굽고, sitemap.py 가 sitemap-my.xml 로 냅니다(둘이 같은 목록 — 30분 남겨 둠).
⚠️ 못 읽으면(망 · 규칙) None — 마이컨맵 페이지만 건너뛰고 나머지 굽기는 그대로 갑니다.
"""
import json
import os
import re
import tempfile
import time
import urllib.request
from urllib.parse import quote

import qnapages

DB = (os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com").rstrip("/")
CACHE = os.environ.get("MY_SNAPSHOT") or os.path.join(tempfile.gettempdir(), "kcm_my_snapshot.json")
TTL = 30 * 60
SITE = "https://k-conmap.com"

_주소 = re.compile(r"^[0-9a-z가-힣_-]{2,20}$")
종류이름 = {"업체": "건설업체", "사람": "현장 사람", "장비": "장비 · 자재"}
블록이름 = {"소개": "소개", "면허": "면허 · 자격", "지역": "일하는 지역", "연락": "연락하기", "구인": "구인 · 구직", "도구": "함께 쓰는 도구 · 서식",
          "실적": "K-건설맵 개찰 실적", "소식": "소식"}   # 📊 📣 G188 「모두 다 하자」
소개글자 = 100
채운블록수 = 3


def _get(node):
    with urllib.request.urlopen(f"{DB}/{node}.json", timeout=25) as r:
        return json.loads(r.read().decode("utf-8")) or {}


def snapshot(fresh=False):
    """{'pub': {...}, 'flag': {...}} 또는 None(못 읽음)."""
    if not fresh:
        try:
            if time.time() - os.path.getmtime(CACHE) < TTL:
                with open(CACHE, encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
    try:
        snap = {"pub": _get("mp_pub")}
    except Exception as e:
        print(f"  · 마이컨맵 페이지를 못 읽었습니다({type(e).__name__}: {e}) — 마이컨맵은 건너뜁니다")
        return None
    try:
        snap["flag"] = _get("mp_flag")
    except Exception:
        snap["flag"] = {}
    try:
        with open(CACHE, "w", encoding="utf-8") as f:
            json.dump(snap, f, ensure_ascii=False)
    except Exception:
        pass
    return snap


def _목록(v):
    if isinstance(v, list):
        return [x for x in v if isinstance(x, str) and x.strip()]
    if isinstance(v, dict):
        return [v[k] for k in sorted(v, key=lambda k: int(k) if str(k).isdigit() else 999) if isinstance(v[k], str) and v[k].strip()]
    return []


def 블록들(d):
    b = d.get("블록")
    if isinstance(b, dict):
        b = [b[k] for k in sorted(b, key=lambda k: int(k) if str(k).isdigit() else 999)]
    return [x for x in (b or []) if isinstance(x, dict) and x.get("t") in 블록이름]


def 채움(b):
    t = b.get("t")
    if t == "소개":
        return len(str(b.get("글") or "").strip()) >= 20
    if t == "면허":
        return len(_목록(b.get("면허"))) + len(_목록(b.get("자격"))) > 0
    if t == "지역":
        return len(_목록(b.get("시도"))) > 0 or bool(str(b.get("글") or "").strip())
    if t == "연락":
        return bool(b.get("전화") or b.get("톡"))
    if t == "구인":
        return bool(str(b.get("글") or "").strip())
    if t == "도구":
        return len(_목록(b.get("곳"))) > 0
    if t == "실적":
        return bool(re.match(r"^[0-9]{10}$", str(b.get("사업자") or "")))
    if t == "소식":
        return len(소식들(b)) > 0
    return False


def 소식들(b):
    """[{d, 글}] — 날짜 · 글 둘 다 있는 것만(lib/마이컨맵.js 블록정리 와 같음) · 10개까지."""
    v = b.get("글들")
    if isinstance(v, dict):
        v = [v[k] for k in sorted(v, key=lambda k: int(k) if str(k).isdigit() else 999)]
    out = []
    for x in v or []:
        if isinstance(x, dict) and re.match(r"^\d{4}-\d{2}-\d{2}$", str(x.get("d") or "")) and str(x.get("글") or "").strip():
            out.append({"d": x["d"], "글": str(x["글"]).strip()[:300]})
    return out[:10]


# 📊 실적 — 확보예가굽기.mjs 가 먼저 구운 업체 조각(web/dist/data/kb/c/{n}.json)을 읽음(화면과 같은 파일 · 없으면 건너뜀)
_조각 = {}
KB_DIR = os.environ.get("MY_KB_DIR") or os.path.join(os.path.dirname(os.path.abspath(__file__)), "web", "dist", "data", "kb", "c")


def 실적자료(biz):
    d = re.sub(r"[^0-9]", "", str(biz or ""))
    if len(d) != 10:
        return None
    n = int(d[-4:-1])
    if n not in _조각:
        try:
            with open(os.path.join(KB_DIR, f"{n}.json"), encoding="utf-8") as f:
                _조각[n] = (json.load(f) or {}).get("업체") or {}
        except Exception:
            _조각[n] = {}
    return _조각[n].get(d)


def 가린번호(d):
    return f"{d[:3]}-{d[3:5]}-***{d[8:]}"


def 검색칸(d):
    """lib/마이컨맵.js 검색칸 과 같은 규칙 — 다 채웠으면 True."""
    bs = 블록들(d)
    소개 = "".join(str(b.get("글") or "").strip() for b in bs if b.get("t") == "소개")
    채운 = sum(1 for b in bs if 채움(b))
    return (len(str(d.get("한줄") or "").strip()) >= 5 and len(소개) >= 소개글자 and 채운 >= 채운블록수
            and bool(str(d.get("이름") or "").strip()))


def pages(snap, 전부=False):
    """검색에 낼 페이지 — [{a, d, mod, ok}] (최근 고친 것부터).
    전부=True — 칸을 덜 채운 것도(카톡 · 문자 미리보기용으로 굽되 noindex · 사이트맵에는 안 냄). 🚩 3건 · 이름 없는 것은 늘 뺌."""
    if not snap:
        return []
    flag = snap.get("flag") or {}
    out = []
    for a, d in (snap.get("pub") or {}).items():
        if not isinstance(d, dict) or not _주소.match(str(a)):
            continue
        if len(flag.get(a) or {}) >= 3 or not str(d.get("이름") or "").strip() or d.get("나만") is True:
            continue                     # 🔒 나만 보기 — mp_pub 에는 표만 있음(속은 mp_priv · 굽지 않음)
        ok = 검색칸(d) and (d.get("공개") or "공개") == "공개"     # 🔗 «주소 아는 사람만» 은 굽되 noindex · 사이트맵 빼고
        if not ok and not 전부:
            continue
        out.append({"a": a, "d": d, "mod": int(d.get("upd") or d.get("at") or 0), "ok": ok})
    out.sort(key=lambda x: -x["mod"])
    return out


def 주소(a):
    return f"/@{a}"


def 사이트맵주소(a):
    return f"{SITE}/@{quote(a)}"


def _e(s):
    return (str(s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;"))


def html(x):
    """(제목, 설명, 본문 HTML, json-ld) — 화면(pages/MyConmap.jsx 페이지그림)과 같은 내용 · 전화 · 카톡 주소 빼고."""
    a, d = x["a"], x["d"]
    이름 = str(d.get("이름") or "").strip()
    한줄 = str(d.get("한줄") or "").strip()
    종류 = 종류이름.get(d.get("종류"), "건설업체")
    bs = [b for b in 블록들(d) if 채움(b)]
    면허 = next((b for b in bs if b.get("t") == "면허"), {})
    지역 = next((b for b in bs if b.get("t") == "지역"), {})
    낱말 = _목록(면허.get("면허"))[:3] + _목록(지역.get("시도"))[:2]
    제목 = f"{이름} — {한줄}" if 한줄 else 이름
    if 낱말:
        제목 += " · " + " · ".join(낱말)
    제목 = 제목[:80] + " | K-건설맵"
    소개 = next((qnapages.가림(b.get("글")) for b in bs if b.get("t") == "소개"), "")
    설명 = (f"{종류} {이름}. " + 소개.replace("\n", " "))[:150]
    body = [f'<div class="card"><div class="muted" style="font-size:12px">🪪 마이컨맵 · {_e(종류)}</div>'
            f'<h1 style="margin:4px 0">{_e(이름)}</h1>' + (f'<p class="cp">{_e(한줄)}</p>' if 한줄 else "") + "</div>"]
    for b in bs:
        t = b.get("t")
        h = f'<h2 style="font-size:15px;margin:0 0 6px">{_e(블록이름[t])}</h2>'
        if t == "소개":
            안 = f'<div style="white-space:pre-wrap;line-height:1.8">{_e(qnapages.가림(b.get("글")))}</div>'
        elif t == "면허":
            안 = "<p>" + " · ".join(_e(v) for v in _목록(b.get("면허")) + _목록(b.get("자격"))) + "</p>"
        elif t == "지역":
            안 = "<p>" + " · ".join(_e(v) for v in _목록(b.get("시도"))) + (f" — {_e(b.get('글'))}" if b.get("글") else "") + "</p>"
        elif t == "연락":
            안 = '<p>📞 연락처는 이 페이지에서 «전화 걸기 · 카카오톡» 단추를 누르면 보입니다.</p>' + (f'<p class="muted">연락 받는 시간 · {_e(b.get("시간"))}</p>' if b.get("시간") else "")
        elif t == "구인":
            갈 = {"구함": "사람 구함", "찾음": "일 찾음"}.get(b.get("갈래"), "")
            안 = (f"<p><b>{_e(갈)}</b></p>" if 갈 else "") + f'<div style="white-space:pre-wrap;line-height:1.8">{_e(qnapages.가림(b.get("글")))}</div>'
        elif t == "도구":
            안 = "<ul>" + "".join(f'<li><a href="{_e(p)}">{_e(p)}</a></li>' for p in _목록(b.get("곳"))) + "</ul>"
        elif t == "실적":
            biz = str(b.get("사업자"))
            r = 실적자료(biz)
            if r:
                확 = (r.get("확보합") or 0) / r["평균합"] if r.get("평균합") else None
                안 = (f'<p>넣은 개찰 <b>{int(r.get("잰개찰") or 0):,}건</b> · 1순위 <b>{r.get("실제1순위", "-")}건</b>'
                     + (f' · 확보 예가 평균의 <b>{확:.2f}배</b>' if 확 is not None else "") + "</p>")
                줄 = list(reversed((r.get("최근") or [])[-5:]))
                if 줄:
                    안 += "<ul>" + "".join(f'<li>{_e(str(x.get("dt"))[:10])} · {_e(x.get("name"))} · {_e(x.get("rank"))}/{_e(x.get("n"))}</li>' for x in 줄) + "</ul>"
                안 += f'<p class="muted" style="font-size:12px">K-건설맵에 실린 최근 개찰로 셉니다 · 사업자번호 {_e(가린번호(biz))}</p>'
            else:
                안 = f'<p class="muted">사업자번호 {_e(가린번호(biz))} — 최근 개찰 기록을 이 페이지에서 봅니다.</p>'
        elif t == "소식":
            안 = "".join(f'<p><b>{_e(x["d"][2:].replace("-", "."))}</b> {_e(qnapages.가림(x["글"]))}</p>' for x in 소식들(b))
        else:
            continue
        body.append(f'<div class="card">{h}{안}</div>')
    body.append('<div class="card"><a href="/my">🪪 나도 마이컨맵 만들기</a></div>')
    ld = {"@context": "https://schema.org", "@type": "ProfilePage", "url": 사이트맵주소(a),
          "mainEntity": {"@type": "Organization" if d.get("종류") != "사람" else "Person", "name": 이름, "description": 한줄 or 설명}}
    return 제목, 설명, "".join(body), ld


if __name__ == "__main__":
    import sys
    s = snapshot(fresh="--fresh" in sys.argv)
    ps = pages(s)
    print(f"마이컨맵 — 공개 {len((s or {}).get('pub') or {})}곳 · 검색에 낼 것 {len(ps)}곳")
    for x in ps[:10]:
        print(" ", 주소(x["a"]), html(x)[0])
