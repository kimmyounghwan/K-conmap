# -*- coding: utf-8 -*-
"""🩹 G568(2026-11-06) 시험 — 사이트 자동 갱신(update.yml) «다음 회차 예약» 쉼에서, 쉬는 중에 회차가 잡히면(소장님 push) 바로 넘기는지.

왜: 쉼(낮 25분 · 밤 45분)이 동시성 자리를 쥔 채 sleep 만 해서, 쉬는 중에 올린 코드가 쉼이 끝날 때까지 기다렸다
    (11-06 G563: 15:31 올림 → 15:51 에야 회차 시작). 이제 1분마다 «기다리는 회차» 를 보고 잡혀 있으면 바로 끝냄.
무엇을: update.yml 에서 그 단계 글을 꺼내 가짜 gh(회차 목록 · 다음 회차 부르기) · 가짜 sleep(세기만)으로 bash 에서 돌림.
    bash · jq 가 없으면(PC) 글 검사만 하고 돌리기는 건너뜀.
씀: python tools/시험_회차쉼.py
"""
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
n = bad = 0


def ok(이름, 맞음, 덧=""):
    global n, bad
    n += 1
    if not 맞음:
        bad += 1
    print(("  ✓ " if 맞음 else "  ✗ ") + 이름 + ("" if 맞음 or not 덧 else "  ← " + str(덧)[:200]))


원문 = open(os.path.join(ROOT, ".github", "workflows", "update.yml"), encoding="utf-8").read().replace("\r\n", "\n")
try:
    import yaml  # noqa: E402
    wf = yaml.safe_load(원문)
    단계 = [s for s in wf["jobs"]["update"]["steps"] if str(s.get("name", "")).startswith("다음 회차 예약")]
except ImportError:      # PC 에 PyYAML 이 없으면 글에서 그 단계 run: 덩이만 꺼냄(들여쓰기 10칸)
    import re
    m = re.search(r"\n      - name: 다음 회차 예약[^\n]*\n(?:.*\n)*?        run: \|\n((?:          .*\n|\s*\n)+)", 원문)
    단계 = [{"run": "\n".join(l[10:] for l in m.group(1).split("\n"))}] if m else []
ok("«다음 회차 예약» 단계가 하나", len(단계) == 1, len(단계))
글 = 단계[0]["run"] if 단계 else ""
ok("쉬는 동안 1분마다 봄(while · sleep 60 · busy)", 'while [ "$S" -lt "$W" ]; do' in 글 and "sleep 60" in 글 and "if busy > /dev/null; then" in 글)
ok("통째로 쉬는 sleep \"$W\" 은 없음", 'sleep "$W"' not in 글)
ok("쉼 뒤 마지막 확인 · 다음 회차 부르기는 그대로", "자는 동안 다른 회차가 잡혔습니다" in 글 and "gh workflow run update.yml" in 글)
ok("맨 처음 «이미 잡혀 있으면 안 부름» 그대로", "이미 다른 회차가 잡혀 있습니다 — 부르지 않습니다" in 글)

bash, jq = shutil.which("bash"), shutil.which("jq")
if not (bash and jq) or os.name == "nt":
    print("  · bash · jq 가 없어 돌려 보기는 건너뜀(글 검사만)")
else:
    d = tempfile.mkdtemp(prefix="g568_")
    os.makedirs(os.path.join(d, "bin"))
    가짜gh = os.path.join(d, "bin", "gh")
    open(가짜gh, "w").write("""#!/bin/bash
if [ "$1" = "run" ] && [ "$2" = "list" ]; then
  n=$(cat "$D/n" 2>/dev/null || echo 0); n=$((n+1)); echo $n > "$D/n"
  if [ "${GH_FAIL:-0}" = "1" ]; then exit 1; fi
  if [ -n "${PEND_AT:-}" ] && [ "$n" -ge "$PEND_AT" ]; then echo '[{"status":"in_progress"},{"status":"pending"}]'; else echo '[{"status":"in_progress"},{"status":"completed"}]'; fi
elif [ "$1" = "workflow" ] && [ "$2" = "run" ]; then
  echo x >> "$D/dispatch"
fi
""")
    os.chmod(가짜gh, 0o755)

    def 돌림(ok_, fails, **env):
        for f in ("n", "dispatch", "slept"):
            p = os.path.join(d, f)
            if os.path.exists(p):
                os.remove(p)
        s = 글.replace("${{ steps.health.outputs.ok }}", ok_).replace("${{ steps.health.outputs.fails }}", fails).replace("${{ github.ref_name }}", "main")
        open(os.path.join(d, "step.sh"), "w", encoding="utf-8").write(s)
        e = dict(os.environ, D=d, PATH=os.path.join(d, "bin") + os.pathsep + os.environ.get("PATH", ""), TZ="Asia/Seoul", **env)
        e.pop("PEND_AT", None) if "PEND_AT" not in env else None
        r = subprocess.run([bash, "--noprofile", "--norc", "-c",
                            'sleep() { echo "$1" >> "$D/slept"; }; export -f sleep; bash --noprofile --norc -eo pipefail "$D/step.sh"'],
                           env=e, capture_output=True, text=True, timeout=60)
        셈 = lambda f: (len(open(os.path.join(d, f)).read().split()) if os.path.exists(os.path.join(d, f)) else 0)
        return r.returncode, 셈("slept"), 셈("dispatch"), r.stdout

    낮 = int(subprocess.run([bash, "-c", "echo $((10#$(TZ=Asia/Seoul date +%H)))"], capture_output=True, text=True).stdout.strip() or 12)
    쉼 = 25 if 6 <= 낮 < 19 else 45
    c, s, g, out = 돌림("1", "0")
    ok("아무 회차도 안 잡히면 %d분 다 쉬고 다음 회차 부름(1번)" % 쉼, c == 0 and s == 쉼 and g == 1, (c, s, g, out[-200:]))
    c, s, g, out = 돌림("1", "0", PEND_AT="4")
    ok("쉬는 중 3분째에 회차가 잡히면 바로 끝냄 · 안 부름", c == 0 and s == 3 and g == 0 and "쉬는 중(180초)에 다른 회차가 잡혔습니다" in out, (c, s, g, out[-200:]))
    c, s, g, out = 돌림("1", "0", PEND_AT="1")
    ok("처음부터 잡혀 있으면 안 쉬고 끝냄(예전 그대로)", c == 0 and s == 0 and g == 0 and "이미 다른 회차가 잡혀 있습니다" in out, (c, s, g))
    c, s, g, out = 돌림("0", "1")
    ok("조달청에서 한 줄도 못 받은 회차는 5분 쉬고 부름(예전 그대로)", c == 0 and s == 5 and g == 1, (c, s, g))
    c, s, g, out = 돌림("1", "0", GH_FAIL="1")
    ok("gh 가 안 되면(목록 못 봄) 예전처럼 다 쉬고 부름", c == 0 and s == 쉼 and g == 1, (c, s, g))
    c, s, g, out = 돌림("1", "0", PEND_AT=str(쉼 + 2))
    ok("쉼이 끝난 뒤 마지막 확인에서 잡히면 안 부름(예전 그대로)", c == 0 and s == 쉼 and g == 0 and "자는 동안 다른 회차가 잡혔습니다" in out, (c, s, g))
    shutil.rmtree(d, ignore_errors=True)

print(("\n✅ 시험_회차쉼 %d/%d\n" % (n, n)) if not bad else ("\n❌ 시험_회차쉼 틀림 %d / %d\n" % (bad, n)))
sys.exit(1 if bad else 0)
