# -*- coding: utf-8 -*-
"""
run_all.py — 이거 하나만 돌리면 됩니다.

  ① inbox.py      바탕화면에서 받아 inbox 에 넣어둔 자료 반영
  ② collect.py    조달청 최신 공고·개찰 결과 수집
  ③ build_json.py 3년치 + 추가자료를 사이트용 JSON 으로 집계
  ④ sitemap.py    검색엔진용 주소 목록
  ⑤ npm run build + firebase deploy   배포

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

    if want("build") and not args.quick:
        result["③ 집계"] = step(3, "build_json — 사이트용 JSON 집계",
                              [PY, "build_json.py"], timeout=3600)[0]
    elif want("build"):
        print("\n  ③ 집계 — 건너뜀 (--quick)")

    if want("sitemap"):
        result["④ 사이트맵"] = step(4, "sitemap — 검색엔진 주소 목록",
                                [PY, "sitemap.py"], timeout=300)[0]

    if want("deploy"):
        result["⑤ 빌드"] = step(5, "npm run build", [npm_cmd(), "run", "build"],
                              cwd=WEB, timeout=1800, shell=os.name == "nt")[0]
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
