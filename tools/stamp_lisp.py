# -*- coding: utf-8 -*-
"""web/public/lisp/k-conmap.lsp 에 「오늘 + 30일」 유효기간을 찍습니다.

소장님: 「한달에 한번 다운 받게 해줘」 (2026-09-14)

왜 이렇게 하나
  손으로 기한을 박아 두면 그 날이 왔을 때 쓰던 분들이 «전부» 멈춥니다.
  그래서 배포할 때마다 「받는 날 기준」으로 다시 찍습니다.
  - 사이트에서 오늘 받은 사람 -> 오늘부터 30일
  - 카톡방으로 넘어간 사본    -> 원래 받은 날 기준 30일 뒤 멈춤 -> 사이트로 옴
  - 소장님이 하실 일          -> 없음

⚠️ npm run build 보다 «먼저» 돌아야 합니다. 안 돌리면 2099 년이 박힌 채 나갑니다.
⚠️ cp949 판과 UTF-8 판을 둘 다 찍습니다. 인코딩이 다르니 따로 읽고 씁니다.
"""
import datetime
import os
import re
import sys

DAYS = 30          # 받은 날부터 며칠 쓰실 수 있나
WARN = 7           # 끝나기 며칠 전부터 미리 알릴까

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LISP = os.path.join(ROOT, "web", "public", "lisp", "k-conmap.lsp")
LISP_U = os.path.join(ROOT, "web", "public", "lisp", "k-conmap_utf8.lsp")


def stamp(path, enc, exp, warn):
    if not os.path.exists(path):
        print("  · 없습니다 - 건너뜁니다: " + path)
        return False
    with open(path, encoding=enc, newline="") as f:
        t = f.read()
    # ⚠️ «바뀐 게 없다» 로 판단하면 안 됩니다 - 같은 날 두 번 돌리면 값이 같습니다.
    #    찍을 «자리가 있나» 로 봐야 합니다.
    if not (re.search(r"\(setq kcm\*exp\s+\d{8}\)", t)
            and re.search(r"\(setq kcm\*warn\s+\d{8}\)", t)):
        print("  ❌ 찍을 자리를 못 찾았습니다: " + path)
        return False
    t2 = re.sub(r"\(setq kcm\*exp\s+\d{8}\)",
                "(setq kcm*exp  %s)" % exp.strftime("%Y%m%d"), t, count=1)
    t2 = re.sub(r"\(setq kcm\*warn\s+\d{8}\)",
                "(setq kcm*warn %s)" % warn.strftime("%Y%m%d"), t2, count=1)
    with open(path, "w", encoding=enc, newline="") as f:
        f.write(t2)
    return True


def main():
    today = datetime.date.today()
    exp = today + datetime.timedelta(days=DAYS)
    warn = exp - datetime.timedelta(days=WARN)
    ok = stamp(LISP, "cp949", exp, warn)
    ok = stamp(LISP_U, "utf-8", exp, warn) and ok
    if ok:
        print("  ✅ 캐드 유틸 유효기간 %s 까지 (알림 %s 부터)" % (exp, warn))
        return 0
    print("  ⚠️ 유효기간을 못 찍었습니다 - 그대로 배포하면 기한이 안 걸립니다")
    return 1


if __name__ == "__main__":
    sys.exit(main())
