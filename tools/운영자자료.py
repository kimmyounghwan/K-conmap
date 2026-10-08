# -*- coding: utf-8 -*-
"""🔒 성적표 재료(개찰 자료 통째)를 «운영자만 받는 자리» 에 올립니다 — G200 · 2026-10-08

  소장님: 「운영자만 받게하기로 해주고」 (안 ② — 배포 때마다 사이트에 41MB 를 싣던 것을 그만)

  ■ 전에는
      update.yml 이 배포 때마다 data/store/first.json 을 web/dist/data/first_full.json 으로 사이트에 실었습니다.
      원본 41MB · 받는 크기 8.3MB — 배포 한 벌마다 사이트 저장 용량을 먹고, 주소만 알면 누구나 받아 갈 수 있었습니다.
      쓰는 곳은 운영자 «업체 성적표 만들기»(web/src/pages/ReportMake.jsx) 하나뿐입니다.

  ■ 이제
      파이어베이스 저장소(Storage) op/first_full.json.gz 한 자리에 «압축해서» 덮어 올립니다(늘 한 벌).
      읽기는 저장소 규칙(web/storage.rules 의 match /op/)이 «소장님 기기 번호» 만 받습니다. 쓰기는 이 스크립트(서비스 계정 = 규칙 밖)만.
      지난번과 똑같은 내용이면 올리지 않습니다(md5 견줌).

  ■ 실패하면
      0 이 아닌 값으로 끝납니다 → update.yml 이 «그 회차만» 예전처럼 사이트에 싣습니다(성적표가 멈추지 않게).
      기록(로그)은 공개입니다 — 크기 · 줄 수 · 결과만 찍고, 열쇠 · 토큰은 찍지 않습니다.

  쓰는 법:
      python tools/운영자자료.py data/store/first.json          # Actions (FIREBASE_SERVICE_ACCOUNT 필요)
      python tools/운영자자료.py data/store/first.json --dry    # 압축 크기만 봄(인터넷 · 비밀값 없이)
  시험:  python tools/시험_운영자자료.py
"""
import base64
import gzip
import hashlib
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

BUCKET = os.environ.get("OP_BUCKET") or "k-conmap.firebasestorage.app"
NAME = "op/first_full.json.gz"
API = "https://storage.googleapis.com"


def 압축(raw):
    """같은 내용이면 늘 같은 바이트(mtime=0) — md5 로 «안 바뀜» 을 알아보려고"""
    return gzip.compress(raw, compresslevel=9, mtime=0)


def md5b64(b):
    return base64.b64encode(hashlib.md5(b).digest()).decode("ascii")


def 줄수(raw):
    try:
        return len((json.loads(raw.decode("utf-8")) or {}).get("con") or {})
    except Exception:
        return -1


def 토큰(범위="read_write"):
    raw = (os.environ.get("FIREBASE_SERVICE_ACCOUNT") or "").strip()
    if not raw:
        raise RuntimeError("FIREBASE_SERVICE_ACCOUNT 가 없습니다")
    sa = json.loads(raw)
    from google.oauth2 import service_account
    import google.auth.transport.requests as gr
    c = service_account.Credentials.from_service_account_info(
        sa, scopes=["https://www.googleapis.com/auth/devstorage." + 범위])
    c.refresh(gr.Request())
    return c.token


# 🩹 G203 (2026-10-08) 올린 뒤 점검 — 저장소의 파일을 «주소창으로 열면» 받아지는데, 사이트 화면(다른 출처 · Origin 머리)에서
#   받으면 503 이었습니다(32바이트 시험 파일도 같음 · 정보 읽기 · 올리기 · 규칙은 정상). 파이어베이스 안내:
#   «브라우저에서 직접 받으려면 버킷에 CORS 를 설정해야 한다». → 우리 사이트 출처의 GET 만 허락하는 CORS 한 줄을 버킷에 둡니다.
#   읽기 권한은 그대로 저장소 규칙이 정합니다(CORS 는 «어느 사이트 화면이 응답을 읽을 수 있나» 만). 이미 있으면 안 건드림.
CORS_출처 = ["https://k-conmap.com", "https://www.k-conmap.com", "https://k-conmap.web.app", "https://k-conmap.firebaseapp.com"]
CORS_줄 = {"origin": CORS_출처, "method": ["GET", "HEAD"],
          "responseHeader": ["Content-Type", "Content-Length", "Content-Encoding", "Content-Disposition", "Cache-Control",
                             "Authorization", "X-Firebase-Storage-Version", "X-Firebase-GMPID", "X-Firebase-AppCheck"],
          "maxAgeSeconds": 3600}


def CORS있나(목록):
    for c in 목록 or []:
        if set(CORS_출처) <= set(c.get("origin") or []) and "GET" in (c.get("method") or []):
            return True
    return False


def CORS맞춤(tok):
    """버킷 CORS 에 우리 출처 GET 이 없으면 더함 — 돌려줌: '있음' | '더함' (실패면 예외)"""
    url = "%s/storage/v1/b/%s?fields=cors" % (API, BUCKET)
    지금 = (요청(url, tok) or {}).get("cors") or []
    if CORS있나(지금):
        return "있음"
    새 = 지금 + [CORS_줄]
    r = 요청(url, tok, data=json.dumps({"cors": 새}).encode("utf-8"), 머리={"Content-Type": "application/json"}, 방법="PATCH")
    if not CORS있나((r or {}).get("cors")):
        raise RuntimeError("CORS 를 넣었는데 돌아온 값에 없음")
    return "더함"


def 요청(url, tok, data=None, 머리=None, 방법=None):
    """토큰은 주소가 아니라 머리(Authorization)에 넣습니다 — 주소는 기록에 남을 수 있습니다"""
    h = {"Authorization": "Bearer " + tok}
    h.update(머리 or {})
    r = urllib.request.Request(url, data=data, headers=h, method=방법 or ("POST" if data is not None else "GET"))
    with urllib.request.urlopen(r, timeout=120) as x:
        return json.loads(x.read().decode("utf-8") or "null")


def 지금것(tok):
    """올라가 있는 것의 md5 — 없으면 None"""
    url = "%s/storage/v1/b/%s/o/%s?fields=md5Hash,size" % (API, BUCKET, urllib.parse.quote(NAME, safe=""))
    try:
        return 요청(url, tok)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def 올리기(gz, tok, 줄):
    """multipart — 내용 + 꼬리표(종류 · 캐시 안 함 · 줄 수) 한 번에"""
    경계 = "kcm" + hashlib.md5(gz).hexdigest()[:16]
    meta = {"name": NAME, "contentType": "application/gzip", "cacheControl": "private, no-cache, max-age=0",
            "metadata": {"rows": str(줄), "by": "update.yml"}}
    몸 = ("--%s\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n%s\r\n--%s\r\nContent-Type: application/gzip\r\n\r\n"
         % (경계, json.dumps(meta), 경계)).encode("utf-8") + gz + ("\r\n--%s--\r\n" % 경계).encode("ascii")
    url = "%s/upload/storage/v1/b/%s/o?uploadType=multipart&fields=md5Hash,size" % (API, BUCKET)
    return 요청(url, tok, data=몸, 머리={"Content-Type": "multipart/related; boundary=" + 경계})


def _CORS():
    return CORS맞춤(토큰("full_control"))


def main(argv=None, 토큰함수=토큰, 지금함수=지금것, 올림함수=올리기, CORS함수=_CORS):
    a = list(sys.argv[1:] if argv is None else argv)
    dry = "--dry" in a
    a = [x for x in a if x != "--dry"]
    if not a:
        print("[멈춤] 파일 길을 주십시오 (data/store/first.json)")
        return 2
    try:
        raw = open(a[0], "rb").read()
    except OSError:
        print("[멈춤] 개찰 자료가 없습니다:", a[0])
        return 2
    줄 = 줄수(raw)
    if 줄 <= 0:
        print("[멈춤] 개찰 자료 모양이 아닙니다(con 이 비었음) — 안 올림")
        return 2
    gz = 압축(raw)
    print("▶ 개찰 %d건 · 원본 %.1fMB → 압축 %.1fMB" % (줄, len(raw) / 1e6, len(gz) / 1e6))
    if dry:
        print("(--dry) 올리지 않음")
        return 0
    if CORS함수 is not None:
        try:
            print("▶ 버킷 CORS(사이트 화면에서 받기) — %s" % CORS함수())
        except Exception as e:
            code = getattr(e, "code", None)
            print("⚠️ 버킷 CORS 를 못 봄/못 넣음 — %s%s (사이트에 실은 것으로 받으니 성적표는 됨)" % (type(e).__name__, " HTTP %s" % code if code else ""))
    try:
        tok = 토큰함수()
        전 = 지금함수(tok)
        if 전 and 전.get("md5Hash") == md5b64(gz):
            print("▶ 운영자 자리(op/) 그대로 — 지난번과 같은 내용이라 안 올림")
            return 0
        r = 올림함수(gz, tok, 줄)
        if not r or r.get("md5Hash") != md5b64(gz):
            print("[실패] 올린 뒤 확인이 맞지 않습니다")
            return 1
        print("▶ 운영자 자리(op/)에 올림 — %s" % ("새로" if not 전 else "덮어씀"))
        return 0
    except Exception as e:
        # 까닭의 «종류» 만 — 토큰 · 열쇠가 섞일 수 있는 긴 글은 찍지 않음
        code = getattr(e, "code", None)
        print("[실패] 운영자 자리에 못 올림 — %s%s" % (type(e).__name__, " HTTP %s" % code if code else ""))
        return 1


if __name__ == "__main__":
    sys.exit(main())
