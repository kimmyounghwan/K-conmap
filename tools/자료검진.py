# -*- coding: utf-8 -*-
"""🛡 자료 검진 · 틀린 칸만 지난 좋은 판으로 (G218 · 2026-10-09)

  소장님: 「더 이상 틀어지지 않게 하면서 업데이트 자동으로 되어야 하는 거잖아...우린 3년치만 보니까」
          「배포를 멈추거나. 작동이 안되면 더 문제 아냐?」 → 배포는 절대 안 멈춤 · 틀린 칸만 지난 판
  왜: 2026-10-09 에 드러난 세 가지(9월 번호 버림 · 4~8월 번호 없음 · 통합특별시 «광주»)는 모두
      «사이트는 멀쩡히 굽혔는데 자료만 조용히 틀린» 것이었고, 몇 주 동안 아무도 몰랐습니다.

  돌리는 곳: update.yml «3년치 집계» 바로 뒤(사이트 빌드 앞) · continue-on-error
            → 이 검사가 고장 나도 사이트 갱신은 그대로 갑니다(«검사 못 돎» 메일만).
  하는 일:
    1. data/store/검진_재료.json(build_json.py 가 남김)을 읽어 칸마다(업체 corp · 기관 agency) 판정
    2. 빨간불인 칸은 data/store/좋은판/{칸}.tar.gz 로 web/public/data/{칸} 을 바꿔 끼움(공고 · 1순위 · 바로투찰은 안 건드림)
       초록인 칸은 지금 것을 좋은판으로 저장
    3. 결과: data/store/검진.json · web/public/data/검진.json · GITHUB_OUTPUT(red · why · broken)
  기준:
    ① 번호   2026-09 이후 달(300건 넘는 달)에서 채운 뒤에도 사업자번호 빈 것 > 10% → 업체 빨강
             (그 전 달은 수집 때부터 번호가 없던 달 — 따지지 않음)
    ② 건수   이미 지난 달의 1순위 건수가 좋은판보다 10% 넘게 줆(맨 앞 달 빼고) → 업체 · 기관 빨강
             («앞 달들의 절반» 같은 기준은 못 씀 — 2026-03 부터 매일 수집이 붙어 달 건수가 원래 4배로 뜀)
             같은 달의 «채운 뒤 빈 번호» 가 좋은판보다 그 달의 5% 넘게 늘어도 업체 빨강(번호가 다시 빠짐)
    ③ 빈 달  3년 창 안(맨 앞 달 빼고)에 1순위 0건인 달 → 업체 · 기관 빨강
    ④ 지역   최근 90일 지역 못 정함 비율이 좋은판보다 5%p 넘게 늘면 업체 빨강(좋은판이 없으면 35% 넘을 때)
             (전국 기관 — 농어촌공사 지사 · 국토관리청 등 — 은 원래 못 정함 · 실측 20%)
    ⑤ 수     업체 · 기관 수가 좋은판보다 10% 넘게 줆 → 그 칸 빨강
  시험: python tools/시험_자료검진.py
"""
import io
import json
import os
import shutil
import sys
import tarfile
from datetime import datetime, timedelta, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE_YM = "2026-09"          # 이 달부터는 번호가 «있어야» 하는 달
칸들 = ("corp", "agency")


def _ym_add(ym, n):
    y, m = int(ym[:4]), int(ym[5:7]) - 1 + n
    return "%04d-%02d" % (y + m // 12, m % 12 + 1)


def 판정(재료, 좋은=None, 오늘=None):
    """돌려주는 것: {"red": {"corp": [이유…], "agency": [이유…]}, "숫자": {...}}"""
    오늘 = 오늘 or (datetime.now(timezone.utc) + timedelta(hours=9))
    이번달 = 오늘.strftime("%Y-%m")
    red = {k: [] for k in 칸들}
    달 = {k: v for k, v in (재료.get("달") or {}).items() if isinstance(v, list) and len(v) >= 3}
    # ① 번호
    for ym, (n, raw, left) in sorted(달.items()):
        if ym >= BASE_YM and n >= 300 and left / n > 0.10:
            red["corp"].append(f"{ym} 1순위 {n:,}건 중 사업자번호 빈 것 {left:,}건({left * 100 // n}%)")
    # ② 건수 · 번호 — 이미 지난 달은 줄지 않아야 함(좋은판과 같은 달끼리)
    전달 = {k: v for k, v in ((좋은 or {}).get("달") or {}).items() if isinstance(v, list) and len(v) >= 3}
    if 달 and 전달:
        맨앞 = min(달)
        for ym in sorted(달):
            if ym == 맨앞 or ym >= 이번달 or ym not in 전달:
                continue
            n, _, left = 달[ym]
            pn, _, pleft = 전달[ym]
            if pn > 0 and n < pn * 0.9:
                for k in 칸들:
                    red[k].append(f"{ym} 1순위 {n:,}건 — 좋은판 {pn:,}건보다 {100 - n * 100 // pn}% 줆")
            if n > 0 and left - pleft > n * 0.05:
                red["corp"].append(f"{ym} 빈 사업자번호 {left:,}건 — 좋은판 {pleft:,}건보다 늘어남")
    # ③ 빈 달
    if 달:
        ks = sorted(달)
        ym = _ym_add(ks[0], 1)
        while ym < ks[-1]:
            if ym not in 달 or 달[ym][0] == 0:
                for k in 칸들:
                    red[k].append(f"{ym} 1순위 0건(빈 달)")
            ym = _ym_add(ym, 1)
    # ④ 지역
    지 = 재료.get("지역")
    전지 = (좋은 or {}).get("지역")
    if isinstance(지, list) and len(지) == 2 and 지[0] >= 300:
        율 = 지[1] / 지[0]
        기준 = (전지[1] / 전지[0] + 0.05) if (isinstance(전지, list) and len(전지) == 2 and 전지[0] > 0) else 0.35
        if 율 > 기준:
            red["corp"].append(f"최근 90일 1순위 {지[0]:,}건 중 지역 못 정함 {지[1]:,}건({지[1] * 100 // 지[0]}%) — 기준 {기준:.0%}")
    # ⑤ 수
    for k, 이름 in (("corp", "업체"), ("agency", "기관")):
        지금, 전 = 재료.get(이름), (좋은 or {}).get(이름)
        if isinstance(지금, int) and isinstance(전, int) and 전 > 0 and 지금 < 전 * 0.9:
            red[k].append(f"{이름} 수 {지금:,} — 좋은판 {전:,}보다 {100 - 지금 * 100 // 전}% 줆")
    return {"red": red, "숫자": {"업체": 재료.get("업체"), "기관": 재료.get("기관"), "지역": 지}}


def _읽기(p):
    try:
        with io.open(p, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def _쓰기(p, v):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with io.open(p, "w", encoding="utf-8") as f:
        json.dump(v, f, ensure_ascii=False, indent=1)


def 저장(root, 칸):
    src = os.path.join(root, "web", "public", "data", 칸)
    dst = os.path.join(root, "data", "store", "좋은판", 칸 + ".tar.gz")
    if not os.path.isdir(src):
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + ".tmp"
    with tarfile.open(tmp, "w:gz", compresslevel=6) as t:
        t.add(src, arcname=칸)
    os.replace(tmp, dst)                   # 다 쓴 뒤에 바꿈 — 쓰다 끊겨도 옛 좋은판이 남음
    return True


def 되돌리기(root, 칸):
    src = os.path.join(root, "data", "store", "좋은판", 칸 + ".tar.gz")
    dst = os.path.join(root, "web", "public", "data")
    if not os.path.exists(src):
        return False
    tmp = os.path.join(dst, "." + 칸 + ".되돌림")
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)
    with tarfile.open(src, "r:gz") as t:
        t.extractall(tmp)                  # 우리가 만든 압축(칸 이름 하나) — 바깥 경로 없음
    shutil.rmtree(os.path.join(dst, 칸), ignore_errors=True)
    os.replace(os.path.join(tmp, 칸), os.path.join(dst, 칸))
    shutil.rmtree(tmp, ignore_errors=True)
    return True


def main(root=ROOT, out=None):
    out = out if out is not None else os.environ.get("GITHUB_OUTPUT")
    store = os.path.join(root, "data", "store")
    재료 = _읽기(os.path.join(store, "검진_재료.json"))
    좋은 = _읽기(os.path.join(store, "검진_좋은판.json")) or {}
    now = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime("%Y-%m-%d %H:%M")
    결과 = {"at": now, "broken": 0, "red": {}, "한일": {}}
    if not isinstance(재료, dict) or (재료.get("at") or "") < (datetime.now(timezone.utc) + timedelta(hours=8)).strftime("%Y-%m-%d %H:%M"):
        결과["broken"] = 1
        결과["why"] = "검진 재료가 없거나 이번 회차 것이 아닙니다 — 아무것도 안 바꿈"
    else:
        r = 판정(재료, 좋은)
        결과["red"], 결과["숫자"] = r["red"], r["숫자"]
        새좋은 = dict(좋은)
        for k in 칸들:
            if r["red"][k]:
                결과["한일"][k] = "지난 좋은판으로 바꿔 끼움" if 되돌리기(root, k) else "좋은판이 없어 그대로 둠"
            else:
                if 저장(root, k):
                    결과["한일"][k] = "좋은판 저장"
                    새좋은["업체" if k == "corp" else "기관"] = 재료.get("업체" if k == "corp" else "기관")
                    새좋은["at"] = now
        if not any(r["red"].values()):              # 둘 다 초록일 때만 «달 · 지역» 기준을 새로 잡음
            새좋은["달"], 새좋은["지역"] = 재료.get("달"), 재료.get("지역")
        _쓰기(os.path.join(store, "검진_좋은판.json"), 새좋은)
    _쓰기(os.path.join(store, "검진.json"), 결과)
    try:
        _쓰기(os.path.join(root, "web", "public", "data", "검진.json"), 결과)
    except Exception:
        pass
    why = " / ".join(f"{k}: {x}" for k in 칸들 for x in 결과["red"].get(k, [])) or 결과.get("why", "")
    red = ",".join(k for k in 칸들 if 결과["red"].get(k))
    print("🛡 자료 검진 — " + ("검사 못 돎: " + 결과["why"] if 결과["broken"] else
                             ("빨간불 " + red + " · " + why if red else "이상 없음")) +
          (" · " + ", ".join(f"{k} {v}" for k, v in 결과["한일"].items()) if 결과["한일"] else ""))
    # 메일 — 낮(06~19시)에만 · 하루 한 번만(빨간불이 며칠 이어져도 회차마다 메일이 쏟아지지 않게)
    mail = 0
    if red or 결과["broken"]:
        k = datetime.now(timezone.utc) + timedelta(hours=9)
        last = (_읽기(os.path.join(store, "검진_메일.json")) or {}).get("day")
        if 6 <= k.hour < 19 and last != k.strftime("%Y-%m-%d"):
            mail = 1
            _쓰기(os.path.join(store, "검진_메일.json"), {"day": k.strftime("%Y-%m-%d"), "why": why})
    결과["mail"] = mail
    if out:
        with io.open(out, "a", encoding="utf-8") as f:
            f.write("red=%s\nbroken=%d\nmail=%d\nwhy=%s\n" % (red, 결과["broken"], mail, why.replace("\n", " ")[:900]))
    return 결과


if __name__ == "__main__":
    try:
        main()
    except Exception as e:                   # 검사가 고장 나도 회차는 계속
        print(f"🛡 자료 검진이 고장 났습니다 — {type(e).__name__}: {e} (사이트 갱신은 그대로)")
        o = os.environ.get("GITHUB_OUTPUT")
        if o:
            with io.open(o, "a", encoding="utf-8") as f:
                f.write("red=\nbroken=1\nmail=0\nwhy=자료 검진 고장 (%s)\n" % type(e).__name__)
    sys.exit(0)
