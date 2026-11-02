# -*- coding: utf-8 -*-
"""🩹 옛 화면 묶음 이어 두기 — G512 (2026-11-02)

■ 왜 — 소장님 「사이트 화면이 어쩔때 잠깐 안 열려. 점검해봐」
    G511 로 «자료만 바뀐 배포»(20분쯤마다)에는 화면 묶음(/assets/*.js) 이름이 그대로가 됐습니다.
    그래도 «코드를 새로 올린 배포»(하루 몇 번)는 묶음 내용이 달라 이름이 바뀝니다.
    배포 전에 연 화면(폰에 띄워 둔 사이트)에서 다른 화면을 누르면 이미 없어진 파일을 부르다 404 →
    main.jsx lazyPage 가 한 번 새로 고침 = «잠깐 안 열림». (파이어베이스 호스팅은 배포마다 파일 한 벌을 통째로 바꿈)

■ 무엇을 — 배포 «앞» 에(update.yml «옛 화면 묶음 이어 두기»)
    ① 지금 사이트의 /assets-keep.json 을 읽습니다 — {own: 그 판 묶음 이름들, prev: 그 앞 판 것}
    ② 실을 «앞 판» = 묶음 목록이 이번과 같으면(자료만 바뀐 배포) 사이트가 들고 있던 prev 를 그대로 물려받고,
       다르면(코드가 바뀐 배포) 사이트의 own(= 바로 앞 판)
    ③ 그중 이번 빌드에 없는 이름만 사이트에서 받아 dist/assets 에 더 넣습니다 — 새 판 파일은 절대 덮어쓰지 않음
    ④ dist/assets-keep.json 을 새로 씁니다 — {own: 이번 묶음, prev: ②}
    · 한 세대만(바로 앞 판) — 계속 쌓이지 않음. 이름에 내용 지문(hash)이 들어 있어 같은 이름 = 같은 내용.
    · 받은 것이 HTML(404 쪽)이거나 200 이 아니면 버림 · 한 파일 15MB · 모두 80MB · 4분까지 · 이름에 / \\ .. 이 있으면 안 받음.
    · 무엇이든 실패하면 목록만 남기고 끝(종료 0) — 배포는 그대로(continue-on-error 이기도 함).
    · 파이어베이스는 같은 내용 파일을 다시 올리지 않습니다(지문으로 견줌) — 실어도 올리는 양은 거의 그대로.

■ 쓰는 법
    python tools/옛묶음잇기.py web/dist                    (사이트 = https://k-conmap.com)
    python tools/옛묶음잇기.py web/dist http://127.0.0.1:8123   (시험 — tools/시험_옛묶음잇기.py)
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

SITE = "https://k-conmap.com"
KEEP = "assets-keep.json"
ONE_MAX = 15 * 1024 * 1024
ALL_MAX = 80 * 1024 * 1024
TIME_MAX = 240      # 초 — 사이트가 느려도 배포를 오래 붙잡지 않음(넘으면 남은 것은 안 받음)


def _get(url, limit, timeout=30):
    """(바이트, content-type) — 200 이 아니거나 limit 를 넘으면 (None, 까닭)"""
    req = urllib.request.Request(url, headers={"User-Agent": "kconmap-keep-assets/1", "Cache-Control": "no-cache"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        if getattr(r, "status", 200) != 200:
            return None, "status"
        ct = (r.headers.get("Content-Type") or "").lower()
        b = r.read(limit + 1)
        if len(b) > limit:
            return None, "too big"
        return b, ct


def _safe(name):
    return (isinstance(name, str) and 0 < len(name) < 200 and "/" not in name and "\\" not in name
            and ".." not in name and not name.startswith(".") and name.strip() == name)


def keep(dist, site=SITE, one_max=ONE_MAX, all_max=ALL_MAX, log=print, time_max=TIME_MAX):
    t0 = time.time()
    adir = os.path.join(dist, "assets")
    if not os.path.isdir(adir):
        log(f"  · 옛 묶음 이어 두기: {adir} 가 없어 건너뜀")
        return {"ok": False, "carried": 0}
    new = sorted(f for f in os.listdir(adir) if os.path.isfile(os.path.join(adir, f)))
    newset = set(new)
    live = None
    try:
        b, _ = _get(f"{site}/{KEEP}?t={int(time.time())}", 4 * 1024 * 1024, timeout=20)
        if b:
            live = json.loads(b.decode("utf-8"))
    except Exception as e:      # 처음(사이트에 목록이 아직 없음) · 인터넷 · 모양 틀림 — 목록만 남기고 끝
        log(f"  · 옛 묶음 이어 두기: 사이트 {KEEP} 를 못 읽음({type(e).__name__}) — 이번엔 목록만 남김")
    prev = []
    mode = "처음"
    if isinstance(live, dict) and isinstance(live.get("own"), list):
        own = [x for x in live["own"] if _safe(x)]
        old_prev = [x for x in live["prev"] if _safe(x)] if isinstance(live.get("prev"), list) else []
        if set(own) == newset:
            prev, mode = old_prev, "자료만 바뀐 배포 — 앞 판 목록 그대로"
        else:
            prev, mode = own, "코드가 바뀐 배포 — 지금 사이트 판을 앞 판으로"
    want = sorted(x for x in set(prev) if x not in newset)
    carried, size, skipped = 0, 0, 0
    for n in want:
        if size >= all_max or time.time() - t0 > time_max:
            skipped += 1
            continue
        try:
            b, ct = _get(f"{site}/assets/{urllib.parse.quote(n)}", min(one_max, all_max - size), timeout=20)
        except Exception:
            b, ct = None, "error"
        if not b or "text/html" in ct:
            skipped += 1
            continue
        p = os.path.join(adir, n)
        if os.path.exists(p):      # 새 판 파일은 절대 안 덮음(같은 이름이면 같은 내용이기도)
            continue
        with open(p, "wb") as f:
            f.write(b)
        carried += 1
        size += len(b)
    with open(os.path.join(dist, KEEP), "w", encoding="utf-8") as f:
        json.dump({"own": new, "prev": sorted(set(prev)),
                   "at": time.strftime("%Y-%m-%d %H:%M KST", time.gmtime(time.time() + 9 * 3600)),
                   "carried": carried}, f, ensure_ascii=False)
    log(f"  · 옛 묶음 이어 두기: {mode} · 앞 판에만 있는 {len(want)}개 중 {carried}개 실음({size / 1048576:.1f}MB) · 못 받음 {skipped}")
    return {"ok": True, "carried": carried, "want": len(want), "skipped": skipped, "mode": mode, "size": size}


if __name__ == "__main__":
    d = sys.argv[1] if len(sys.argv) > 1 else os.path.join("web", "dist")
    s = sys.argv[2] if len(sys.argv) > 2 else SITE
    try:
        keep(d, s)
    except Exception as e:      # 배포를 세우지 않음
        print(f"  · 옛 묶음 이어 두기 실패({type(e).__name__}: {e}) — 배포는 그대로")
    sys.exit(0)
