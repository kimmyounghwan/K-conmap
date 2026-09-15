# -*- coding: utf-8 -*-
"""quote_mail.py — 새 «내역서 문의»가 들어오면 소장님께 메일로 알립니다.

  왜 이렇게 만들었나
    · 문의함(RTDB 의 quotes)은 «읽기 금지»입니다. 공사 정보와 연락처가 들어가서
      아무도 못 읽게 잠갔습니다. 그래서 소장님도 사이트에서는 못 보십니다.
    · 대신 GitHub Actions 가 관리자 키로 읽어 **메일로 밀어 드립니다.**
      나가 계셔도, PC 가 꺼져 있어도 옵니다.

  보내고 나면 그 글에 sent=True 를 찍습니다. 같은 문의를 두 번 보내지 않습니다.

  메일 보내는 길 두 가지 — 있는 것을 씁니다.
    ① MAIL_USER + MAIL_PASS (Gmail 앱 비밀번호) 가 있으면 → 제대로 된 메일
    ② 없으면 → 화면에 찍고 **0 이 아닌 값으로 끝냅니다.**
       그러면 GitHub 가 「작업 실패」 메일을 보내 줍니다. 모양은 거칠어도
       **알림은 옵니다.** 아무 준비 없이도 오늘부터 됩니다.

  쓰는 법:  python tools/quote_mail.py
  필요한 것: FIREBASE_SERVICE_ACCOUNT (이미 Actions 비밀값에 있습니다)
"""
import base64
import io
import json
import os
import smtplib
import sys
from email.header import Header
from email.mime.text import MIMEText
from email.utils import formataddr

DB = os.environ.get("RTDB_URL") or "https://k-conmap-default-rtdb.firebaseio.com"
TO = os.environ.get("MAIL_TO") or "kimmyounghwan259@gmail.com"
USER = os.environ.get("MAIL_USER") or ""
PASS = os.environ.get("MAIL_PASS") or ""


def creds():
    """서비스 계정을 환경변수에서 읽습니다. (JSON 그대로 또는 base64)"""
    raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT") or ""
    if not raw:
        print("[멈춤] FIREBASE_SERVICE_ACCOUNT 가 없습니다.")
        return None
    raw = raw.strip()
    if not raw.startswith("{"):
        try:
            raw = base64.b64decode(raw).decode("utf-8")
        except Exception:
            pass
    try:
        return json.loads(raw)
    except Exception as e:
        print("[멈춤] 서비스 계정을 읽지 못했습니다: %s" % type(e).__name__)
        return None


def token(sa):
    """서비스 계정으로 구글 토큰을 받습니다. (google-auth 만 있으면 됩니다)"""
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


def body(k, q):
    L = [
        "새 내역서 문의가 들어왔습니다.",
        "",
        "  공사명   : %s" % (q.get("work") or "-"),
        "  발주처   : %s" % (q.get("org") or "-"),
        "  공고번호 : %s" % (q.get("no") or "-"),
        "  공사금액 : %s" % (q.get("money") or "-"),
        "  필요한 것: %s" % (q.get("want") or "-"),
        "  언제까지 : %s" % (q.get("due") or "-"),
        "",
        "  성함     : %s" % (q.get("name") or "-"),
        "  연락처   : %s" % (q.get("phone") or "-"),
        "",
        "  하실 말씀:",
        "  %s" % (q.get("memo") or "(없음)"),
        "",
        "  글 번호  : %s" % k,
        "",
        "— K-건설맵 문의함",
    ]
    return "\n".join(L)


def send(subject, text):
    """메일을 보냅니다. 보냈으면 True."""
    if not (USER and PASS):
        return False
    msg = MIMEText(text, "plain", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = formataddr((str(Header("K-건설맵 문의함", "utf-8")), USER))
    msg["To"] = TO
    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=30) as s:
        s.login(USER, PASS)
        s.sendmail(USER, [TO], msg.as_string())
    return True


def main():
    sa = creds()
    if not sa:
        return 0                      # 키가 없으면 조용히 넘어갑니다(사슬을 막지 않게)
    try:
        tok = token(sa)
        rows = get("quotes", tok) or {}
    except Exception as e:
        print("문의함을 읽지 못했습니다: %s" % type(e).__name__)
        return 0
    # ⚠️ 2026-09-15 — 「notified」 를 같이 봅니다.
    #   메일을 못 보내면 「sent」 를 못 붙여서, 같은 문의로 **10분마다 영원히** 실패했습니다.
    #   (소장님: 「계속 메일이 건설맵 자동이 실패한다는 메일」 — 하루 144통이었습니다)
    #   → 거친 알림도 «한 번 알렸으면» notified 를 붙여 다음 회차부터는 조용히 넘어갑니다.
    new = {k: v for k, v in rows.items()
           if isinstance(v, dict) and not v.get("sent") and not v.get("notified")}
    if not new:
        print("새 문의 없음 (전체 %d건)" % len(rows))
        return 0

    print("새 문의 %d건" % len(new))
    texts = []
    for k, q in sorted(new.items(), key=lambda x: x[1].get("at") or 0):
        t = body(k, q)
        texts.append(t)
        print("-" * 56)
        print(t)

    subject = "[K-건설맵] 새 내역서 문의 %d건 — %s" % (
        len(new), (sorted(new.values(), key=lambda v: v.get("at") or 0)[-1].get("work") or "")[:40])
    mailed = False
    try:
        mailed = send(subject, ("\n\n" + "=" * 56 + "\n\n").join(texts))
    except Exception as e:
        print("메일을 보내지 못했습니다: %s" % type(e).__name__)

    if mailed:
        for k in new:
            try:
                put("quotes/%s/sent" % k, tok, True)
            except Exception:
                pass
        print("메일 보냈습니다 → %s" % TO)
        return 0

    # 메일 길이 없을 때 — GitHub 가 「실패」 메일을 보내도록 0 이 아닌 값으로 끝냅니다.
    # 다만 «한 번만» 입니다. 알렸다는 표시를 남겨 다음 회차부터는 조용히 넘어갑니다.
    for k in new:
        try:
            put("quotes/%s/notified" % k, tok, True)
        except Exception:
            pass
    print("")
    print("::error::새 내역서 문의 %d건이 들어왔습니다 — 위 내용을 확인하세요." % len(new))
    print("  이 알림은 «이 문의에 대해 한 번만» 갑니다. 위 내용을 꼭 갈무리해 두세요.")
    print("  (MAIL_USER·MAIL_PASS 를 넣으시면 이 거친 알림 대신 제대로 된 메일이 갑니다)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
