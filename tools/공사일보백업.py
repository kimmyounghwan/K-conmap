# -*- coding: utf-8 -*-
"""⛑ 공사일보(현장 투입비) 매일 백업 · 휴지통 비우기 · 되살리기 — 2026-09-27

  소장님: 「공사일보는 비번입력시 계속 자료가 보이도록 해야 해. 만약 지워져 버리면 큰일이야 알지?」

  ■ 백업       python tools/공사일보백업.py 백업 --out 백업
      cost_* 자리를 관리자 키로 통째로 읽어 «잠가서» 한 파일로 둡니다 → Actions 가 90일 보관.
      ⚠️ 저장소가 «공개» 라 Actions 보관 파일은 깃허브 회원 누구나 받을 수 있습니다.
         그래서 반드시 잠급니다(AES-256-GCM). 열쇠는 FIREBASE_SERVICE_ACCOUNT 의 개인 키에서
         뽑습니다(HKDF) — 그 비밀값을 가진 사람(= 이미 DB 를 다 읽을 수 있는 사람)만 풉니다.
         서비스 계정 키를 새로 바꾸면 그 전 백업은 못 풉니다 — 바꾸기 전에 되살릴 일이 없는지 볼 것.
      기록(로그)에는 «개수» 만 찍습니다. 이름·금액은 찍지 않습니다(로그도 공개).

  ■ 비우기     python tools/공사일보백업.py 비우기
      휴지통(cost_trash)에서 30일 지난 것 · 지운 지 30일 지난 현장(cost_sites/*/del)을 영영 지웁니다.
      «백업을 뜬 뒤에만» 돕니다(워크플로 차례). 비운 것도 90일 동안은 백업에 남습니다.

  ■ 되살리기   python tools/공사일보백업.py 되살리기 --이름 cost-backup-2026-09-28-0241 --현장 ABCDEFGHJ
      그날 백업에서 «그 현장 하나» 를 그때 모습으로 되돌립니다(적은 것·명부·출역·휴지통).
      되살리기 직전 모습도 같은 회차의 백업으로 먼저 떠 둡니다 → 되살리기도 되돌릴 수 있습니다.
      손으로만 돌립니다: Actions → 공사일보 백업 → Run workflow → 백업 이름 · 현장 코드.

  ■ 2026-09-29 — 🚜 장비 장부(eq_*) · ⚠️ 위험성평가(rk_*)도 같은 방식이라 같이 뜨고 비우고 되살립니다(묶음들).
      되살리기의 «현장 코드» 자리에 장부 코드를 넣으면 됩니다 — 어느 묶음인지는 스스로 찾습니다.

  ■ 시험       python tools/시험_공사일보백업.py   (인터넷·비밀값 없이 잠그기·풀기·비울 목록을 봅니다)
"""
import base64
import gzip
import io
import json
import os
import sys
import time
import urllib.request
import zipfile

DB = os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com"
# 📎 2026-09-27 — 업체 스스로 등록(cost_vlink · cost_vin, TuipbiVin.jsx)도 같이 백업·비우기·되살리기
# 📝 2026-09-28 — 공사일보 한 장(cost_day, TuipbiIlbo.jsx)도 같이
현장자리 = ["cost_sites", "cost_rows", "cost_people", "cost_equip", "cost_vendors", "cost_att", "cost_trash",
           "cost_vlink", "cost_vin", "cost_day"]
# 🚜⚠️ 2026-09-29 — 같은 «코드+비밀번호» 방식의 장부 둘(web/src/lib/장부.js)도 같이 백업·비우기·되살리기
#   eq = 장비 임대료·수금 장부(EquipBook.jsx) · rk = 위험성평가(RiskBook.jsx)
#   책 = 장부 정보(지운 때 del 이 찍히는 곳) · 통 = 휴지통 · 딸림 = 휴지통에서 영영 지울 때 같이 지울 자리(사진)
묶음들 = [
    {"ns": "cost", "책": "cost_sites", "통": "cost_trash", "자리": 현장자리, "딸림": {}},
    {"ns": "eq", "책": "eq_books", "통": "eq_trash",
     "자리": ["eq_books", "eq_drivers", "eq_clients", "eq_rows", "eq_pay", "eq_cost", "eq_trash"], "딸림": {}},
    {"ns": "rk", "책": "rk_books", "통": "rk_trash",
     "자리": ["rk_books", "rk_docs", "rk_pics", "rk_trash"], "딸림": {"docs": "rk_pics"}},
]
자리들 = [x for g in 묶음들 for x in [g["ns"] + "_pins", g["ns"] + "_keys"] + g["자리"]] + ["cost_vlink", "cost_vin", "cost_day"]
자리들 = list(dict.fromkeys(자리들))
휴지통날 = 30                     # web/src/lib/tuipbi.js 의 휴지통날 과 같게
하루 = 86400000
머리 = b"KCMB1"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


# ───────────── 열쇠 · 잠그기 ─────────────
def 서비스계정():
    raw = (os.environ.get("FIREBASE_SERVICE_ACCOUNT") or "").strip()
    if not raw:
        raise SystemExit("[멈춤] FIREBASE_SERVICE_ACCOUNT 가 없습니다.")
    if not raw.startswith("{"):
        try:
            raw = base64.b64decode(raw).decode("utf-8")
        except Exception:
            pass
    return json.loads(raw)


def 열쇠(sa):
    """서비스 계정 개인 키 → 백업 열쇠 32바이트 (HKDF-SHA256)"""
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    pk = (sa.get("private_key") or "").encode("utf-8")
    if len(pk) < 100:
        raise SystemExit("[멈춤] 서비스 계정에 개인 키가 없습니다.")
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=b"kcm-cost-backup-v1", info=b"aes-256-gcm").derive(pk)


def 잠그기(k, 자료):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    글 = gzip.compress(json.dumps(자료, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
    iv = os.urandom(12)
    return 머리 + iv + AESGCM(k).encrypt(iv, 글, 머리)


def 풀기(k, b):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    if b[:5] != 머리:
        raise SystemExit("[멈춤] 백업 파일 모양이 아닙니다.")
    return json.loads(gzip.decompress(AESGCM(k).decrypt(b[5:17], b[17:], 머리)).decode("utf-8"))


# ───────────── 파이어베이스(관리자) ─────────────
def 토큰(sa):
    from google.oauth2 import service_account
    import google.auth.transport.requests as gr
    c = service_account.Credentials.from_service_account_info(
        sa, scopes=["https://www.googleapis.com/auth/firebase.database", "https://www.googleapis.com/auth/userinfo.email"])
    c.refresh(gr.Request())
    return c.token


def 요청(방법, 길, tok, 몸=None):
    """토큰은 주소가 아니라 머리(Authorization)에 넣습니다 — 주소는 기록에 남을 수 있습니다"""
    data = None if 몸 is None else json.dumps(몸, ensure_ascii=False).encode("utf-8")
    r = urllib.request.Request("%s/%s.json" % (DB, 길), data=data, method=방법,
                               headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
    with urllib.request.urlopen(r, timeout=60) as x:
        return json.loads(x.read().decode("utf-8") or "null")


# ───────────── 셈 (인터넷 없이 시험함) ─────────────
def 세기(자료):
    n = 자료.get("nodes", {})
    현장 = n.get("cost_sites") or {}
    센 = {"현장": len(현장), "지운현장": sum(1 for v in 현장.values() if isinstance(v, dict) and v.get("del"))}
    for k, 이름 in [("cost_rows", "적은줄"), ("cost_people", "근로자"), ("cost_equip", "장비"), ("cost_vendors", "업체"), ("cost_trash", "휴지통")]:
        센[이름] = sum(len(v) for v in (n.get(k) or {}).values() if isinstance(v, dict))
    센["출역달"] = sum(len(v) for v in (n.get("cost_att") or {}).values() if isinstance(v, dict))
    for 자리, 이름 in [("eq_books", "장비장부"), ("eq_rows", "장비줄"), ("rk_books", "위험성장부"), ("rk_docs", "위험성서류")]:
        v = n.get(자리) or {}
        센[이름] = len(v) if 자리.endswith("_books") else sum(len(x) for x in v.values() if isinstance(x, dict))
    return 센


def 비울목록(자료, 지금ms):
    """{경로: None} — 30일 지난 휴지통 · 지운 지 30일 지난 현장·장부(모든 자리). 세 묶음(cost·eq·rk) 모두"""
    n = 자료.get("nodes", {})
    지울 = {}
    for g in 묶음들:
        for 현장, 통 in (n.get(g["통"]) or {}).items():
            for t, x in (통 or {}).items():
                at = (x or {}).get("at") if isinstance(x, dict) else None
                if isinstance(at, (int, float)) and 지금ms - at >= 휴지통날 * 하루:
                    지울["%s/%s/%s" % (g["통"], 현장, t)] = None
                    딸 = g["딸림"].get(x.get("p"))
                    if 딸 and isinstance(x.get("k"), str) and x["k"]:
                        지울["%s/%s/%s" % (딸, 현장, x["k"])] = None
        for 현장, s in (n.get(g["책"]) or {}).items():
            d = s.get("del") if isinstance(s, dict) else None
            if isinstance(d, (int, float)) and 지금ms - d >= 휴지통날 * 하루:
                for 자리 in g["자리"] + [g["ns"] + "_keys", g["ns"] + "_pins"]:
                    지울["%s/%s" % (자리, 현장)] = None
    # 현장째 지우는 것 안의 휴지통 낱개는 겹치므로 뺍니다
    통째 = {k for k in 지울 if k.count("/") == 1}
    return {k: v for k, v in 지울.items() if not any(k.startswith(t + "/") for t in 통째)}


def 되살릴것(자료, 현장):
    """그 현장(장부) 하나를 백업 때 모습으로 — {경로: 값(없으면 None = 지움)}, 핀, 열쇠들, ns.
       코드가 어느 묶음(현장 투입비·장비 장부·위험성평가)의 것인지는 «책» 에서 찾습니다. 비밀번호 해시·열쇠는 없을 때만 채웁니다"""
    n = 자료.get("nodes", {})
    for g in 묶음들:
        if (n.get(g["책"]) or {}).get(현장):
            쓸 = {"%s/%s" % (자리, 현장): (n.get(자리) or {}).get(현장) for 자리 in g["자리"]}
            return 쓸, (n.get(g["ns"] + "_pins") or {}).get(현장), (n.get(g["ns"] + "_keys") or {}).get(현장) or {}, g["ns"]
    raise SystemExit("[멈춤] 그 백업에 현장(장부) %s 가 없습니다." % 현장)


# ───────────── 하는 일 ─────────────
def 백업(out):
    sa = 서비스계정()
    tok = 토큰(sa)
    자료 = {"at": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime()) + "Z", "nodes": {}}
    for 자리 in 자리들:
        자료["nodes"][자리] = 요청("GET", 자리, tok)
    센 = 세기(자료)
    os.makedirs(out, exist_ok=True)
    kst = time.gmtime(time.time() + 9 * 3600)
    이름 = time.strftime("cost-backup-%Y-%m-%d-%H%M", kst)
    b = 잠그기(열쇠(sa), 자료)
    with open(os.path.join(out, 이름 + ".kcmbak"), "wb") as f:
        f.write(b)
    print("⛑ 백업 %s — %s · %d바이트(잠금)" % (이름, " · ".join("%s %d" % kv for kv in 센.items()), len(b)))
    gh = os.environ.get("GITHUB_OUTPUT")
    if gh:
        with open(gh, "a", encoding="utf-8") as f:
            f.write("name=%s\n" % 이름)
    return 자료


def 비우기():
    sa = 서비스계정()
    tok = 토큰(sa)
    자료 = {"nodes": {}}
    for g in 묶음들:
        for 자리 in (g["책"], g["통"]):
            자료["nodes"][자리] = 요청("GET", 자리, tok)
    지울 = 비울목록(자료, int(time.time() * 1000))
    통들 = {g["통"] for g in 묶음들}
    책들 = {g["책"] for g in 묶음들}
    낱개 = sum(1 for k in 지울 if k.split("/")[0] in 통들 and k.count("/") == 2)
    현장 = len({k for k in 지울 if k.split("/")[0] in 책들})
    if not 지울:
        print("🗑 비울 것 없음")
        return
    요청("PATCH", "", tok, 지울)
    print("🗑 비움 — 휴지통 %d개 · 지운 지 %d일 지난 현장·장부 %d곳" % (낱개, 휴지통날, 현장))


def 백업받기(이름):
    """이 저장소 Actions 보관함에서 그 이름의 백업을 받아 옵니다"""
    import requests
    repo, gh = os.environ.get("REPO"), os.environ.get("GH_TOKEN")
    if not (repo and gh):
        raise SystemExit("[멈춤] REPO · GH_TOKEN 이 없습니다(워크플로에서만 돕니다).")
    h = {"Authorization": "Bearer " + gh, "Accept": "application/vnd.github+json"}
    r = requests.get("https://api.github.com/repos/%s/actions/artifacts" % repo, params={"name": 이름, "per_page": 20}, headers=h, timeout=30)
    r.raise_for_status()
    것 = [a for a in r.json().get("artifacts", []) if not a.get("expired")]
    if not 것:
        raise SystemExit("[멈춤] 백업 %s 을 찾지 못했습니다(90일 지나 사라졌거나 이름이 틀림)." % 이름)
    z = requests.get(것[0]["archive_download_url"], headers=h, timeout=120)
    z.raise_for_status()
    with zipfile.ZipFile(io.BytesIO(z.content)) as zf:
        n = [x for x in zf.namelist() if x.endswith(".kcmbak")]
        return zf.read(n[0])


def 되살리기(이름, 현장):
    현장 = (현장 or "").strip().upper().replace("-", "").replace(" ", "")
    if len(현장) != 9:
        raise SystemExit("[멈춤] 현장 코드는 9자리입니다.")
    sa = 서비스계정()
    자료 = 풀기(열쇠(sa), 백업받기(이름.strip()))
    쓸, 핀, 키들, ns = 되살릴것(자료, 현장)
    tok = 토큰(sa)
    요청("PATCH", "", tok, 쓸)
    if 핀 and not 요청("GET", "%s_pins/%s" % (ns, 현장), tok):
        요청("PUT", "%s_pins/%s" % (ns, 현장), tok, 핀)
    지금키 = 요청("GET", "%s_keys/%s" % (ns, 현장), tok) or {}
    빠진키 = {"%s_keys/%s/%s" % (ns, 현장, u): v for u, v in 키들.items() if u not in 지금키}
    if 빠진키:
        요청("PATCH", "", tok, 빠진키)
    센 = 세기({"nodes": {k.split("/")[0]: {현장: v} for k, v in 쓸.items() if v is not None}})
    print("↩ 되살림 — 백업 %s · 현장 %s… · %s" % (이름, 현장[:3], " · ".join("%s %d" % kv for kv in 센.items())))


if __name__ == "__main__":
    a = sys.argv[1:]
    def 값(이름, 기본=""):
        return a[a.index(이름) + 1] if 이름 in a and a.index(이름) + 1 < len(a) else 기본
    if a[:1] == ["백업"]:
        백업(값("--out", "백업"))
    elif a[:1] == ["비우기"]:
        비우기()
    elif a[:1] == ["되살리기"]:
        되살리기(값("--이름"), 값("--현장"))
    else:
        print(__doc__)
        sys.exit(2)
