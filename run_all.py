# -*- coding: utf-8 -*-
"""
run_all.py — 이거 하나만 돌리면 됩니다.

  ① inbox.py      바탕화면에서 받아 inbox 에 넣어둔 자료 반영
  ② collect.py    조달청 최신 공고·개찰 결과 수집
  ③ build_json.py 3년치 + 추가자료를 사이트용 JSON 으로 집계
  ④ sitemap.py    검색엔진용 주소 목록
  ⑤ npm run build + prerender.py + firebase deploy   배포

옵션
  python run_all.py                   전체 (배포까지)
  python run_all.py --no-deploy       빌드만 하고 배포는 안 함
  python run_all.py --quick           집계를 건너뜀 (공고만 새로 받아 배포)
  python run_all.py --days 7          수집 기간
  python run_all.py --only collect    한 단계만

집계(③)는 3~5분 걸립니다. 매번 돌릴 필요는 없고,
평소에는 --quick 으로 공고만 갱신하면 충분합니다.
"""
import os
import sys
import time
import shutil
import argparse
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(ROOT, "web")
PY = sys.executable


def npm_cmd():
    """윈도우에서는 npm.cmd 라 shutil.which 로 실제 경로를 찾아 쓴다"""
    return shutil.which("npm") or "npm"


def firebase_cmd():
    return shutil.which("firebase") or "firebase"


def step(no, title, args, cwd=ROOT, timeout=3600, shell=False):
    print()
    print("=" * 56)
    print(f"  {no}. {title}")
    print("=" * 56)
    t0 = time.time()
    try:
        r = subprocess.run(args, cwd=cwd, timeout=timeout, shell=shell)
        ok = r.returncode == 0
    except subprocess.TimeoutExpired:
        print(f"  ⏱  시간 초과 ({timeout}초)")
        return ("시간초과", 0)
    except FileNotFoundError:
        print(f"  ❌ 실행 파일을 찾을 수 없습니다: {args[0]}")
        return ("없음", 0)
    except Exception as e:
        print(f"  ❌ {type(e).__name__}: {e}")
        return ("실패", 0)
    dur = int(time.time() - t0)
    print(f"  {'✅ 성공' if ok else '❌ 실패'}  ({dur}초)")
    return ("성공" if ok else "실패", dur)


def _집계가_낡았나(하루=1):
    """집계 결과(web/public/data)가 «원본보다 오래됐거나 너무 묵었으면» 까닭을 돌려준다.

    ⚠️ 집계 결과는 저장소에 안 들어갑니다(.gitignore). 깃허브 쪽은 회차마다 새로 굽지만
       이 컴퓨터는 여기서 돌린 날에 멈춰 있습니다. 그대로 배포하면 그 옛 자료가 올라갑니다.
    돌려주는 값 — 낡았으면 «왜 낡았는지» 한 줄, 멀쩡하면 빈 글자.
    """
    import glob as _g
    낸곳 = os.path.join(ROOT, "web", "public", "data", "corp", "idx")
    if not os.path.isdir(낸곳):
        return "집계 결과가 아예 없어서"
    것들 = _g.glob(os.path.join(낸곳, "*.json"))
    if not 것들:
        return "집계 결과가 비어 있어서"
    낸때 = max(os.path.getmtime(f) for f in 것들)

    원본 = []
    for 꼴 in ("data/bid_data_3years.*", "data/extra_*.csv", "data/store/*.json"):
        원본 += _g.glob(os.path.join(ROOT, *꼴.split("/")))
    if 원본:
        원본때 = max(os.path.getmtime(f) for f in 원본)
        if 원본때 > 낸때:
            return "원본이 집계보다 새로워서"

    묵은날 = (time.time() - 낸때) / 86400
    if 묵은날 > 하루:
        return "집계한 지 %.0f일 지나서" % 묵은날
    return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-deploy", action="store_true")
    ap.add_argument("--quick", action="store_true", help="집계(build_json) 건너뛰기")
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--only", choices=["inbox", "collect", "build", "sitemap", "deploy"])
    args = ap.parse_args()

    want = (lambda s: args.only is None or args.only == s)
    result = {}

    print("\n🏗️  K-건설맵 통합 실행")

    if want("inbox"):
        result["① 자료 반영"] = step(1, "inbox — 받은 자료 반영", [PY, "inbox.py"], timeout=600)[0]

    if want("collect"):
        result["② 조달청 수집"] = step(
            2, "collect — 조달청 최신 데이터", [PY, "collect.py", "--days", str(args.days)],
            timeout=1800)[0]

    # 🚨 2026-09-18 — --quick 이라도 «집계 결과가 낡았으면» 반드시 다시 굽습니다.
    #   왜 : web/public/data 는 저장소에 안 들어갑니다(.gitignore). 그래서 이 컴퓨터의
    #        집계 결과는 «마지막으로 여기서 build_json 을 돌린 날» 그대로 멈춰 있습니다.
    #        그걸 그대로 배포하면 보는 분들이 보름 전 자료를 봅니다 —
    #        실제로 2026-09-16 에 고친 «법인 칸은 자기 기록만» 이 되돌아가고,
    #        「이 법인만 보기」 8,785개가 빈 페이지로 갑니다(실측).
    #   전에는 selfcheck 가 배포 직전에 막아 주기는 했지만, 20분을 돌리고 나서
    #   ⛔ 로 끝났습니다. 막지 말고 «처음부터 제대로 굽는» 것이 맞습니다.
    if want("build"):
        낡음 = _집계가_낡았나()
        if not args.quick or 낡음:
            if args.quick and 낡음:
                print("\n  ③ 집계 — --quick 이지만 %s 라서 새로 굽습니다" % 낡음)
            result["③ 집계"] = step(3, "build_json — 사이트용 JSON 집계",
                                  [PY, "build_json.py"], timeout=3600)[0]
        else:
            print("\n  ③ 집계 — 건너뜀 (--quick · 결과가 최신입니다)")

    if want("sitemap"):
        result["④ 사이트맵"] = step(4, "sitemap — 검색엔진 주소 목록",
                                [PY, "sitemap.py"], timeout=300)[0]

    if want("deploy"):
        result["⑤ 빌드"] = step(5, "npm run build", [npm_cmd(), "run", "build"],
                              cwd=WEB, timeout=1800, shell=os.name == "nt")[0]

        # ⚠️ 2026-09-03 추가 — 배포 «전»에 계산이 맞는지 기계가 먼저 확인합니다.
        #   하루에 계산 오류가 셋 나왔고 전부 소장님이 화면을 보고 찾았습니다.
        #   selfcheck 는 화면이 쓰는 계산(web/src/lib/bidmath.js)을
        #   «따로 쓴 계산기»(tools/bidmath.py)와 맞춰 봅니다.
        #   브라우저가 없어도 돕니다 — node 만 있으면 됩니다.
        #   어긋나면 배포하지 않습니다.
        if result["⑤ 빌드"] == "성공":
            result["⑤-1 계산 검사"] = step(
                5, "selfcheck — 화면 숫자 대조", [PY, "tools/selfcheck.py"],
                timeout=900)[0]
            if result["⑤-1 계산 검사"] != "성공":
                print("\n  ⛔ 계산이 어긋납니다 — 배포를 멈춥니다.")
                args.no_deploy = True

        # ★ 2026-09-04 — 주소마다 «진짜 HTML» 을 굽습니다.
        #   빌드가 만든 dist 안에 넣는 것이므로 반드시 빌드 «뒤», 배포 «앞» 입니다.
        #   (npm run build 가 dist 를 비우므로 순서를 바꾸면 통째로 사라집니다)
        #   실패해도 배포는 계속합니다 — 사이트가 안 뜨는 것보다는 낫습니다.
        if result["⑤ 빌드"] == "성공":
            result["⑤-2 페이지 굽기"] = step(
                5, "prerender — 주소별 HTML", [PY, "prerender.py"], timeout=900)[0]

        if not args.no_deploy and result["⑤ 빌드"] == "성공":
            result["⑥ 배포"] = step(6, "firebase deploy",
                                  [firebase_cmd(), "deploy", "--only", "hosting"],
                                  cwd=WEB, timeout=3600, shell=os.name == "nt")[0]
        elif args.no_deploy:
            print("\n  ⑥ 배포 — 건너뜀 (--no-deploy)")

    print()
    print("=" * 56)
    print("  요약")
    print("=" * 56)
    for k, v in result.items():
        mark = "✅" if v == "성공" else "❌"
        print(f"  {mark} {k}: {v}")
    bad = [k for k, v in result.items() if v != "성공"]
    if bad:
        print(f"\n  ⚠️  확인 필요: {', '.join(bad)}")
    else:
        print("\n  🎉 전부 정상입니다.")


if __name__ == "__main__":
    main()
