# -*- coding: utf-8 -*-
"""🧩 CSS 이름 겹침 막기 — «한 도구를 올리면 다른 도구 모양이 틀어지는 것» 을 올리기 전에 잡음

══════════════════════════════════════════════════════════════════
■ 왜 이 검사가 있나 (2026-11-17 · G736)

  소장님: 「한가지를 올리거나 수정하면 다른게 틀어져. 항상 그래. 방안 마련해서 재발되지 않게 해」
          「예정공정표 고쳐서 올렸지? 하나하나 클릭해보고 점검해줘」

  예정공정표 막대(.gp-bar · 09-28)와 내 위치 좌표의 «평균 내기» 막대(.gp-bar · 11-10 G644)가
  이름이 같았습니다. 화면 꾸밈은 web/src/styles.css 한 파일이라 **뒤에 적힌 줄이 이깁니다** →
  11-10 부터 예정공정표 막대가 옅은 회색(화면 · PDF · 인쇄 모두 거의 안 보임),
  평균 내기 막대는 거꾸로 공정표의 position:absolute 를 받아 폭 0 으로 숨었습니다.
  두 도구를 따로 시험하면 둘 다 «맞음» 이라 일주일 동안 아무도 몰랐습니다.

■ 무엇을 보나

  styles.css 에서 «클래스 하나짜리» 규칙( .이름 { … } )이 같은 자리(맨 위 · 같은 @media)에서
  40줄 넘게 떨어져 두 번 이상 적힌 것 = 다른 도구가 같은 이름을 새로 지었을 수 있는 것.
  · 아래 «이미_있음» 에 있는 것(까닭 적음 · 몇 번 적혔는지까지)은 통과
  · 새로 생기거나, 이미 있던 이름이 한 번 더 적히면 ❌ → 올리지 않음
  · ⚠️겹침 = 다른 도구끼리 겹친 줄 알고 있는 것(하나씩 고칠 것 · 고치면 여기서 뺌)

■ 새 도구 CSS 는 고유 접두어로(예: 내 위치 좌표 = gps-) — 쓰기 전에 그 이름이 비었는지 grep 으로 봄.
  같은 도구를 일부러 고쳐 덮는 거면 «이미_있음» 에 까닭과 함께 넣음(몇 번 적혔는지도).

■ 쓰는 법
    python tools/시험_css겹침.py          새로 겹치면 1 로 끝납니다
    python tools/시험_css겹침.py --self   일부러 겹치게 해서 잡히는지
══════════════════════════════════════════════════════════════════
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSS = os.path.join(ROOT, "web", "src", "styles.css")
떨어짐 = 40   # 이보다 멀리 떨어져 다시 적히면 «다른 자리» 로 봄

# (자리, 이름) → (적힌 수, 까닭) · 자리 '' = 맨 위(@media 밖)
이미_있음 = {
    ("@media (min-width: 900px)", ".tabbar"): (2, "넓은 화면 위 메뉴 — 같은 틀을 뒤에서 고쳐 덮음"),
    ("@media (min-width: 900px)", ".shell"): (2, "넓은 화면 틀 — 같은 틀을 뒤에서 고쳐 덮음"),
    ("", ".notice"): (2, "공고 카드 — 뒤에서 cursor 덧붙임(같은 것)"),
    ("", ".two"): (2, "⚠️겹침 바로투찰(grid 두 칸) ↔ 보는 방법 /how(flex) — 고칠 것"),
    ("", ".hero"): (2, "결과 히어로 — 같은 것 꾸밈 덧붙임"),
    ("", ".jointbox"): (2, "공동도급 — G343 낱말 끊김(word-break) 덧붙임"),
    ("", ".mt-lab"): (2, "⚠️겹침 G109 접힌 한 줄 ↔ G158 맵톡 파일 — 고칠 것"),
    ("", ".tlx-grid"): (2, "도구 한 판 — 10-16 탭 꾸밈에서 일부러 다시 꾸밈(같은 것)"),
    ("", ".tlx-card"): (2, "도구 한 판 — 10-16 탭 꾸밈(같은 것)"),
    ("", ".tlx-ic"): (2, "도구 한 판 — 10-16 탭 꾸밈(같은 것)"),
    ("", ".tlx-body"): (2, "도구 한 판 — 10-16 탭 꾸밈(같은 것)"),
    ("", ".tlx-t"): (2, "도구 한 판 — 10-16 탭 꾸밈(같은 것)"),
    ("", ".tlx-d"): (2, "도구 한 판 — 10-16 탭 꾸밈(같은 것)"),
    ("@media (max-width: 560px)", ".tlx-grid"): (3, "도구 한 판(폰) — 10-16 탭 꾸밈(같은 것)"),
    ("", ".gg-draw"): (3, "골조 수량산출 — G585 그림 인쇄 scroll-margin 덧붙임"),
    ("", ".mb-h"): (2, "⚠️겹침 미불금 · 지급명령 종이 ↔ G298 마감 방 — 고칠 것"),
    ("", ".mb-sec"): (2, "⚠️겹침 미불금 · 지급명령 종이 ↔ G298 마감 방 — 고칠 것"),
    ("", ".ny-sit"): (2, "내역서 작업대 — 10-16 탭 꾸밈(같은 것)"),
    ("", ".ny-sit-h"): (2, "내역서 작업대 — 10-16 탭 꾸밈(같은 것)"),
    ("", ".fm-grid"): (2, "서식 작업대 — 10-16 탭 꾸밈(같은 것)"),
    ("@media (max-width: 560px)", ".fm-grid"): (3, "서식 작업대(폰) — 10-16 탭 꾸밈(같은 것)"),
    ("@media (max-width: 560px)", ".fm-card"): (2, "서식 작업대(폰) — 10-16 탭 꾸밈(같은 것)"),
    ("", ".pb-racts"): (2, "사진대지 — 같은 묶음 안 덧붙임"),
    ("", ".mt-card"): (2, "맵톡 카드 — G161 배치(같은 것)"),
    ("", ".sc-chips"): (2, "⚠️겹침 용역 · 물품 바로투찰(G194d) ↔ 다국어 안전카드 — 고칠 것"),
    ("", ".sc-list"): (2, "⚠️겹침 용역 · 물품 바로투찰(G207) ↔ 다국어 안전카드 — 고칠 것"),
    ("", ".sc-row"): (2, "⚠️겹침 사진 · 손그림 → 캐드(G287) ↔ 다국어 안전카드 — 고칠 것"),
    ("", ".sc-ok"): (2, "⚠️겹침 사진 · 손그림 → 캐드(G287) ↔ 다국어 안전카드 — 고칠 것"),
    ("", ".gx-sh"): (2, "종이에 바로 쓰기 — G554 폰 쪽 고르기(같은 것)"),
    ("", ".gmd-check-l"): (2, "골조 모델(Model.jsx) — G395 비스듬히(같은 것)"),
    ("", ".adc-h"): (2, "업체 광고 칸 — G549 같은 무게(같은 것)"),
}


def 규칙들(글):
    """[(자리, 셀렉터, 줄)] — 주석은 지우되 줄 수는 그대로 · @media/@supports 안은 자리로 · :is( , ) 안의 쉼표는 안 나눔"""
    글 = re.sub(r"/\*.*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), 글, flags=re.S)
    n = len(글)
    줄 = [0] * (n + 1)
    l = 1
    for k, ch in enumerate(글):
        줄[k] = l
        if ch == "\n":
            l += 1
    out = []

    def 나눔(머리):
        조각, 깊이, 지금 = [], 0, ""
        for ch in 머리:
            if ch == "(":
                깊이 += 1
            elif ch == ")":
                깊이 -= 1
            if ch == "," and 깊이 == 0:
                조각.append(지금)
                지금 = ""
            else:
                지금 += ch
        조각.append(지금)
        return [" ".join(x.split()) for x in 조각 if x.strip()]

    def 읽기(s, e, 자리):
        k = s
        while k < e:
            j = 글.find("{", k, e)
            if j < 0:
                return
            머리 = 글[k:j]
            앞 = len(머리) - len(머리.lstrip())
            머리 = " ".join(머리.split())
            d, m = 1, j + 1
            while m < e and d:
                if 글[m] == "{":
                    d += 1
                elif 글[m] == "}":
                    d -= 1
                m += 1
            hl = 줄[min(k + 앞, n)]
            if 머리.startswith("@media") or 머리.startswith("@supports"):
                읽기(j + 1, m - 1, 자리 + (머리,))
            elif not 머리.startswith("@"):
                for sel in 나눔(머리):
                    out.append((" ".join(자리), sel, hl))
            k = m

    읽기(0, n, ())
    return out


def 겹침들(글):
    """{(자리, 이름): [줄, …]} — 클래스 하나짜리 셀렉터가 «떨어짐» 줄 넘게 떨어져 두 번 이상 적힌 것"""
    by = {}
    for 자리, sel, ln in 규칙들(글):
        if re.fullmatch(r"\.[^\s.:#>+~\[\]()]+", sel):
            by.setdefault((자리, sel), []).append(ln)
    return {k: sorted(v) for k, v in by.items() if len(v) > 1 and max(v) - min(v) > 떨어짐}


def 재기(글):
    """(새로 겹침, 더 적힘, 이미 있음 수, 이제 안 겹침)"""
    g = 겹침들(글)
    새, 더 = [], []
    for k, lines in sorted(g.items(), key=lambda x: x[1][0]):
        if k not in 이미_있음:
            새.append((k, lines))
        elif len(lines) > 이미_있음[k][0]:
            더.append((k, lines))
    안겹침 = [k for k in 이미_있음 if k not in g]
    return 새, 더, len(g) - len(새), 안겹침


def 자가시험():
    """일부러 겹치게 한 글을 잡는지 · :is( ) 묶음은 안 잡는지 · 이미 있는 이름에 하나 더 적으면 잡는지"""
    나쁨 = 0
    바탕 = ".aa-bar { position: absolute; background: #2563eb; }\n" + "\n" * 60
    t1 = 바탕 + ".aa-bar { flex: 1 1 160px; background: #eee; }\n"
    새, 더, _, _ = 재기(t1)
    ok = any(k == ("", ".aa-bar") for k, _ in 새)
    print(f"  {'✓' if ok else '✗'} 자가시험 ① 다른 자리에서 같은 이름(.aa-bar) 다시 지음 → 잡음")
    나쁨 += 0 if ok else 1
    t2 = ".bb-a { color: red; }\n" + "\n" * 60 + "html.vv-fix :is(.bb-a, .bb-b) { translate: 0 1px; }\n"
    새, 더, _, _ = 재기(t2)
    ok = not 새
    print(f"  {'✓' if ok else '✗'} 자가시험 ② html.vv-fix :is(…) 묶음은 겹침 아님(쉼표를 안 나눔)")
    나쁨 += 0 if ok else 1
    t3 = ".two { display: grid; }\n" + "\n" * 60 + ".two { display: flex; }\n" + "\n" * 60 + ".two { gap: 3px; }\n"
    새, 더, _, _ = 재기(t3)
    ok = any(k == ("", ".two") for k, _ in 더)
    print(f"  {'✓' if ok else '✗'} 자가시험 ③ 이미 겹친 이름(.two)에 한 번 더 적음 → 잡음")
    나쁨 += 0 if ok else 1
    t4 = "@media (max-width: 560px) { .cc-x { color: red; } }\n" + "\n" * 60 + ".cc-x { color: blue; }\n"
    새, 더, _, _ = 재기(t4)
    ok = not 새
    print(f"  {'✓' if ok else '✗'} 자가시험 ④ @media 안과 밖은 다른 자리(폰에서만 고쳐 덮는 것은 겹침 아님)")
    나쁨 += 0 if ok else 1
    return 나쁨


def main():
    if "--self" in sys.argv:
        sys.exit(1 if 자가시험() else 0)
    print("=" * 64)
    print("  🧩 CSS 이름 겹침 막기 (시험_css겹침)")
    print("=" * 64)
    나쁜자가시험 = 자가시험()
    print()
    try:
        글 = io.open(CSS, encoding="utf-8").read()
    except Exception as e:
        print(f"❌ styles.css 를 읽지 못했습니다: {type(e).__name__}: {e}")
        sys.exit(1)
    새, 더, 있음, 안겹침 = 재기(글)
    알고있는겹침 = sorted(k[1] for k, v in 이미_있음.items() if v[1].startswith("⚠️겹침") and k not in 안겹침)
    print(f"  떨어져 다시 적힌 이름 {있음 + len(새)}개 — 이미 알고 있는 것 {있음}개 · 새로 {len(새)}개")
    if 알고있는겹침:
        print(f"  ⚠️ 다른 도구끼리 겹친 줄 아는 것(하나씩 고칠 것) {len(알고있는겹침)}개: {' '.join(알고있는겹침)}")
    if 안겹침:
        print(f"  ℹ️ 이제 안 겹침(이미_있음 에서 빼도 됨): {', '.join((a + ' ' if a else '') + b for a, b in 안겹침)}")
    if 나쁜자가시험:
        print("❌ 자가시험이 깨졌습니다 — 검사 자체를 먼저 고치십시오.")
        sys.exit(1)
    if not 새 and not 더:
        print(f"✓ 시험_css겹침 — 새로 겹친 이름 없음")
        sys.exit(0)
    for (자리, 이름), lines in 새:
        print(f"  ✗ 새로 겹침: {이름}{' (' + 자리 + ')' if 자리 else ''} — {', '.join(map(str, lines))}째 줄")
    for (자리, 이름), lines in 더:
        print(f"  ✗ 이미 겹친 이름에 또 적음: {이름}{' (' + 자리 + ')' if 자리 else ''} — {', '.join(map(str, lines))}째 줄")
    print()
    print("  → 새 도구는 고유 접두어로 이름을 바꾸십시오(예: gp- → gps-).")
    print("    같은 도구를 일부러 고쳐 덮은 거면 이 파일 «이미_있음» 에 까닭과 함께 넣으십시오.")
    print(f"❌ 시험_css겹침 — 새로 {len(새)} · 또 적음 {len(더)}")
    sys.exit(1)


if __name__ == "__main__":
    main()
