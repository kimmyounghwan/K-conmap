# -*- coding: utf-8 -*-
"""📊 알림 신청 수 · 별명 — G222a (2026-10-09) 소장님 「알람신청 있었어??? 이용자 중에… 카운트 하고 있어??」 · 「지금 알려줘」 · 「별명하고 같이 숫자 세어」

  돌리는 곳: 소장님 PC(파이어베이스 관리자 로그인) — 건설맵_화면올리기\G222a_알림수세기.bat 이
            firebase database:get 으로 push(얕게) · watch · watch_cond · watch_last(얕게) 를 임시 폴더에 받아 이것을 돌리고 지웁니다(읽기만).
  찍는 것: 숫자와 별명(사이트와 같은 셈 — web/src/lib/nickname.js nickOf)만. 번호(uid) · 폰 주소는 안 찍습니다.
  돌리기: python tools/알림수세기.py <받은 JSON 폴더>
  하루 두 번 숫자는 함수가 fresh/stat/alert 에도 남깁니다(G222 · 별명 없이)."""
import collections, json, os, sys
from datetime import datetime, timedelta, timezone
d = sys.argv[1]
K = timezone(timedelta(hours=9))
def rd(n):
    p = os.path.join(d, n)
    try:
        t = open(p, encoding="utf-8").read().strip()
        return json.loads(t) if t else {}
    except Exception as e:
        print(f"  {n} 못 읽음 — {type(e).__name__}")
        return None
def 때(ms):
    return datetime.fromtimestamp(ms / 1000, K).strftime("%m-%d %H:%M")
push, watch, cond, last = rd("push.json"), rd("watch.json"), rd("cond.json"), rd("last.json")
사람 = set()
if isinstance(push, dict):
    print(f"📱 폰 · PC 알림창 허용한 사람: {len(push)}명")
    사람 |= set(push)
if isinstance(watch, dict):
    p, n = set(), 0
    for no, v in watch.items():
        if isinstance(v, dict) and v:
            n += 1
            p |= set(v)
    print(f"⭐ 담은 공고 알림(1순위 아직 안 나온 것): 공고 {n}건 · 사람 {len(p)}명")
    사람 |= p
if isinstance(cond, dict):
    cs = [c for c in cond.values() if isinstance(c, dict)]
    print(f"📍 내 조건(지역 · 면허) 새 공고 알림: {len(cs)}명")
    rg = collections.Counter(str(c.get("rg") or "전국") for c in cs)
    print("   지역: " + " · ".join(f"{k} {v}" for k, v in rg.most_common(10)))
    print(f"   면허까지 고른 사람: {sum(1 for c in cs if c.get('lic'))}명")
    at = [c["at"] for c in cs if isinstance(c.get("at"), (int, float))]
    if at:
        print(f"   처음 {때(min(at))} · 가장 최근 {때(max(at))}")
    사람 |= set(cond)
if isinstance(last, dict):
    print(f"📨 내 조건 알림을 한 번이라도 받아 본 사람(함수 기록): {len(last)}명")
print(f"👥 알림을 하나라도 켠 사람(겹침 뺌): {len(사람)}명  (소장님 기기도 들어 있음)")

# ── 별명과 함께(소장님 「별명하고 같이 숫자 세어」) — 별명은 사이트와 같은 셈(web/src/lib/nickname.js nickOf)
ADJ = ['성실한', '부지런한', '꼼꼼한', '든든한', '침착한', '노련한', '빠른', '정확한',
       '조용한', '기운찬', '단단한', '너그러운', '슬기로운', '묵직한', '반듯한', '깔끔한']
NOUN = ['굴착기', '덤프', '타워크레인', '지게차', '롤러', '불도저', '크레인', '펌프카',
        '측량사', '반장', '소장', '기사', '목수', '철근공', '미장공', '설비공']
def hash32(s):
    h = 0x811c9dc5
    for ch in s.encode("utf-16-le").decode("utf-16-le"):
        for cu in ([ord(ch)] if ord(ch) < 0x10000 else [0xD800 + ((ord(ch) - 0x10000) >> 10), 0xDC00 + ((ord(ch) - 0x10000) & 0x3FF)]):
            h ^= cu
            h = (h * 0x01000193) & 0xFFFFFFFF
    return h
def nick(uid):
    h = hash32(str(uid))
    return f"{ADJ[h % 16]} {NOUN[(h // 16) % 16]}{(h // 256) % 1000:03d}"
OP = "ZglL1g3X5UZFBA2590LirDnEnil1"
print("\n── 사람마다 (별명 · 켠 알림) ──")
담은 = collections.Counter()
if isinstance(watch, dict):
    for no, v in watch.items():
        if isinstance(v, dict):
            for r in v:
                담은[r] += 1
줄 = []
for r in 사람:
    무엇 = []
    if isinstance(push, dict) and r in push:
        무엇.append("📱폰·PC 알림창")
    if 담은.get(r):
        무엇.append(f"⭐담은 공고 {담은[r]}건")
    c = cond.get(r) if isinstance(cond, dict) else None
    if isinstance(c, dict):
        n면허 = len([x for x in str(c.get('lic') or '').split(',') if x])
        무엇.append(f"📍내 조건 {c.get('rg') or '전국'}" + (f" · 면허 {n면허}개" if n면허 else ""))
    if isinstance(last, dict) and r in last:
        무엇.append("📨받아 봄")
    t = c.get("at") if isinstance(c, dict) and isinstance(c.get("at"), (int, float)) else 0
    줄.append((t, ("👑 소장님 " if r == OP else "") + nick(r), " · ".join(무엇)))
for t, n, w in sorted(줄, reverse=True):
    print(f"  {n} — {w}" + (f" (조건 {때(t)})" if t else ""))
