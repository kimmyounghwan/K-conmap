# -*- coding: utf-8 -*-
"""💬 사랑방 알림 — 새 글·새 답글이 오면 메일 한 통. (2026-09-17)

소장님: 「글이 올라오면 내가 알 수 있는 페이지가 있으면 좋겠어」
        「메일 보고 내가 관리자 페이지에서 클로드랑 답글 달면 되지」

■ 왜 메일인가
  브라우저 알림은 «사이트를 열어 둬야» 오고 폰에서는 거의 안 옵니다.
  소장님은 밖에 계실 때가 많습니다. 메일이 확실합니다.

■ tools/quote_mail.py 와 같은 얼개입니다 (내역서 문의 알림).
  다른 점은 «어디를 보나» 뿐입니다 — quotes 대신 qna · qna_a.

■ ⚠️ 같은 글로 두 번 알리지 않습니다 — 그리고 «표시를 글에 붙이지 않습니다»
  2026-09-15 에 quote_mail 이 하루 144통을 보낸 적이 있습니다. 메일을 못 보내면
  「보냈음」 표시를 못 붙여 같은 문의로 10분마다 영원히 실패했습니다.
  여기서는 표시를 **따로 둡니다** — qna_mail/{id} = true.
    · 글(qna)에 칸을 더하면 화면 규칙($other: .validate false)과 부딪힙니다
    · 이용자 글을 기계가 고치는 것도 내키지 않습니다
  ⚠️ 메일을 못 보내도 표시는 «남깁니다». 한 번 알리려다 못 알린 것은 넘어갑니다 —
     144통 사고가 그래서 났습니다. 진짜로 놓치면 /admin 에 그대로 남아 있습니다.

■ ⚠️ 소장님이 단 답글에는 알리지 않습니다 (op = true).
  본인이 쓴 것을 본인에게 메일로 보내면 그것도 소음입니다.
"""
import json
import os
import smtplib
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr

DB = os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com"
TO = os.environ.get("MAIL_TO") or "kimmyounghwan259@gmail.com"
USER = os.environ.get("MAIL_USER") or ""
PASS = os.environ.get("MAIL_PASS") or ""
SITE = "https://k-conmap.com"
최대 = 20            # 한 통에 담는 최대 건수 (첫 회차에 수백 건이 쏟아지지 않게)


def creds():
    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT") or ""
    raw = raw.strip()
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


def token(sa):
    from google.oauth2 import service_account
    import google.auth.transport.requests as gr
    scopes = ["https://www.googleapis.com/auth/firebase.database",
              "https://www.googleapis.com/auth/userinfo.email"]
    c = service_account.Credentials.from_service_account_info(sa, scopes=scopes)
    c.refresh(gr.Request())
    return c.token


def get(path, tok):
    import urllib.request
    url = "%s/%s.json?access_token=%s" % (DB, path, tok)
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def put(path, tok, value):
    import urllib.request
    url = "%s/%s.json?access_token=%s" % (DB, path, tok)
    req = urllib.request.Request(url, data=json.dumps(value).encode("utf-8"),
                                 method="PUT", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def 자르기(s, n):
    s = str(s or "").replace("\r", "").strip()
    return s if len(s) <= n else s[:n] + "…"


def 글본문(k, q):
    return "\n".join([
        "  ── 새 글 ──",
        "  제목 : %s" % 자르기(q.get("t"), 80),
        "  쓴이 : %s" % (q.get("nick") or "익명"),
        "",
        "  %s" % (자르기(q.get("b"), 700) or "(본문 없음)"),
        "",
        "  %s/qna" % SITE,
    ])


def 답본문(qid, 제목, a):
    return "\n".join([
        "  ── 새 답글 ──",
        "  («%s» 글에)" % 자르기(제목, 60),
        "  쓴이 : %s" % (a.get("nick") or "익명"),
        "",
        "  %s" % 자르기(a.get("b"), 700),
        "",
        "  %s/qna" % SITE,
    ])


def send(subject, text):
    if not (USER and PASS):
        print("메일 계정이 없습니다 — 보내지 않고 넘어갑니다")
        return False
    msg = MIMEText(text, "plain", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((str(Header("K-건설맵 사랑방", "utf-8")), USER))
    msg["To"] = TO
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
        s.login(USER, PASS)
        s.sendmail(USER, [TO], msg.as_string())
    return True


def main():
    sa = creds()
    if not sa:
        print("열쇠가 없습니다 — 조용히 넘어갑니다")
        return 0
    try:
        tok = token(sa)
        글 = get("qna", tok) or {}
        답 = get("qna_a", tok) or {}
        지움 = get("qna_del", tok) or {}
        알림 = get("qna_mail", tok) or {}
    except Exception as e:
        print("사랑방을 읽지 못했습니다: %s" % type(e).__name__)
        return 0

    새것 = []          # (표시열쇠, 언제, 본문)
    for k, q in 글.items():
        if not isinstance(q, dict) or q.get("deleted") or k in 지움:
            continue
        if alrdy(알림, "q:" + k):
            continue
        새것.append(("q:" + k, q.get("at") or 0, 글본문(k, q)))

    for qid, 묶음 in (답 or {}).items():
        if not isinstance(묶음, dict):
            continue
        제목 = (글.get(qid) or {}).get("t") if isinstance(글.get(qid), dict) else ""
        for aid, a in 묶음.items():
            if not isinstance(a, dict) or a.get("deleted"):
                continue
            if a.get("op"):            # 소장님이 단 답글 — 본인에게 알릴 것 없습니다
                continue
            if alrdy(알림, "a:" + aid):
                continue
            새것.append(("a:" + aid, a.get("at") or 0, 답본문(qid, 제목, a)))

    if not 새것:
        print("새 글·답글 없음 (글 %d건)" % len(글))
        return 0

    새것.sort(key=lambda x: x[1])
    담을것 = 새것[:최대]
    남은 = len(새것) - len(담을것)

    n글 = sum(1 for k, _, _ in 담을것 if k.startswith("q:"))
    n답 = len(담을것) - n글
    제목조각 = []
    if n글:
        제목조각.append("새 글 %d" % n글)
    if n답:
        제목조각.append("새 답글 %d" % n답)
    subject = "[K-건설맵 사랑방] " + " · ".join(제목조각)

    본문 = ["사랑방에 새로 올라왔습니다.", ""]
    본문 += ["\n\n".join(t for _, _, t in 담을것)]
    if 남은 > 0:
        본문 += ["", "… 그리고 %d건 더 있습니다." % 남은]
    본문 += ["", "─" * 30,
             "답글은 관리자 화면에서 바로 다실 수 있습니다:",
             "  %s/admin" % SITE,
             "  (소장님 브라우저에서만 열립니다 · 답글에 「K-건설맵 답변」 표가 붙습니다)"]

    보냈나 = False
    try:
        보냈나 = send(subject, "\n".join(본문))
        print("메일 %s — %d건" % ("보냈습니다" if 보냈나 else "안 보냈습니다", len(담을것)))
    except Exception as e:
        print("메일을 보내지 못했습니다: %s" % type(e).__name__)

    # ⚠️ 못 보냈어도 표시는 남깁니다 — 같은 건으로 10분마다 영원히 다시 시도하지 않게.
    for k, _, _ in 담을것:
        try:
            put("qna_mail/%s" % k.replace(":", "_"), tok, True)
        except Exception:
            pass
    return 0


def alrdy(알림, k):
    return bool((알림 or {}).get(k.replace(":", "_")))


if __name__ == "__main__":
    raise SystemExit(main())
