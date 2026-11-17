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

■ ② (G737 더함) 도구 이름이 붙은 클래스(하이픈 있는 이름 · 예: sc-head)가 셀렉터에 나오는 자리를 300줄 넘게 벌어진
  «덩이» 로 묶어 셈 — 새 덩이가 생기면 = 다른 도구가 그 이름을 또 씀(조상 · 자식 셀렉터까지 봄).
  ①은 «.이름 { }» 다시 짓기만 봐서, 안전카드 .sc-head { } 가 용역 계산기 .sc-head .sc-sub 와 겹친 것은 못 잡았음(G737).
  이미 있는 덩이 수는 «이미_멀리»(--목록 으로 다시 뽑음 · 일부러 먼 곳에 고쳐 덮은 거면 그때 다시 뽑아 넣음).
■ 새 도구 CSS 는 고유 접두어로(예: 내 위치 좌표 = gps- · 안전카드 = sfc-) — 쓰기 전에 그 이름이 비었는지 grep 으로 봄.
  같은 도구를 일부러 고쳐 덮는 거면 «이미_있음» 에 까닭과 함께 넣음(몇 번 적혔는지도).

■ 쓰는 법
    python tools/시험_css겹침.py          새로 겹치면 1 로 끝납니다
    python tools/시험_css겹침.py --self   일부러 겹치게 해서 잡히는지
    python tools/시험_css겹침.py --목록   ② «이미_멀리» 를 지금 styles.css 로 다시 뽑음(일부러 고친 뒤에만)
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


덩이_떨어짐 = 300   # ② 이보다 멀리 벌어지면 다른 덩이(도구 묶음은 보통 300줄 안 · 다른 도구는 수천 줄 떨어짐)
# ② 이미 먼 곳에 나오던 도구 이름 · 덩이 수(2026-11-17 G737 · python tools/시험_css겹침.py --목록 으로 뽑음)
이미_멀리_글 = """
amt-read:2 ask-card:2 bim-big:2 bim-box:2 bim-box-list:2 bim-canvas:2 bim-chips:2 bim-out:2 bim-side:2 bim-sum:2 bim-tblwrap:2 bim-tool:2 bim-view:2
bim-views:2 bsr-cta:2 bsr-dock:2 bsr-title:2 btn-grid:2 btn-row:4 c-sim:2 cam-dim:2 cam-tab:2 cfx-view:2 cpl-view:2 cw-tiles:2 detail-h:5 dx3-err:2
dx3-file:2 dx3-tag:2 fill-go:2 fm-card:2 fm-grid:2 fw-in:2 gg-ask:2 gg-auto:2 gg-draw:2 gg-f:2 gg-t:2 gg-top:2 gj-check:2 gj-in:2 gj-num:3 gj-w:2
gmd-askbox:2 gmd-check-l:2 gmd-h:3 gmd-in:2 gmd-row:2 gmd-tab:3 gmd-tabs:2 gmd-tl:2 gmd-ws-tabs:3 gmd-ws-top:2 gmd-x:2 gmd-xlchk:2 gmd-xlchk-toast:2
gp-hint:2 gp-warn:2 gp-x:2 gx-ed:2 gz3-canvas:2 hm-paid-r:2 hm-row:2 il-paper:2 il-t:2 iy-bar:2 iy-cal:2 iy-cals:2 iy-d:2 iy-exd:2 iy-net:2 iy-out:2
ja-in:2 ja-num:2 jvs-m:2 kcm-help-back:2 kcm-help-dlg:2 lead-card:2 mb-card:2 mb-h:2 mb-no:2 mb-ok:2 mb-sec:2 mb-t:2 mc-savebar:2 mt-ans:2 mt-ans-h:2
mt-back:2 mt-fold:2 mt-lab:2 mt-meta:2 mt-sheet:2 mt-tag:2 mt-where:2 mt-who:2 naeyeok-strip:2 no-print:3 noti-pop:2 ns-go:2 ns-txt:2 ny-n:2 ny-sit:2
ny-sit-h:2 pb-modal:2 pb-note:2 pre-xgot:2 qs-back:2 r-hot:2 r-warm:2 rk-bigttl:2 rk-c:2 rk-foot:3 rk-paper:2 rk-sec:2 rk-t:2 rk-쪽:2 sec-title:5
sg-view:2 sn-date:2 sn-frame:2 sn-say:2 sn-sign:2 tl-h1:2 tl-out:2 tl-p:2 tl-row:2 tlx-body:2 tlx-card:3 tlx-d:3 tlx-dl:2 tlx-ex:2 tlx-grid:2 tlx-ic:3
tlx-new:3 tlx-row:2 tlx-t:3 topbar-in:2 topbar-r:2 tp-scroll:3 tp-src:2 tp-tab:2 tp-tabs:2 tp-warn:2 tp-x:3 umap-foot:2 umap-mini:2 umap-mini-n:2
umap-reg:2 xl-go:3 xl-i:2 xl-t:2 xv-고침판:2 xv-판:2
"""
이미_멀리 = {k: int(v) for k, v in (x.rsplit(":", 1) for x in 이미_멀리_글.split())}


def 덩이들(글):
    """② {클래스: 덩이 수} — 하이픈 있는 클래스가 셀렉터(조상 · 자식 · 묶음 다)에 나오는 줄을 덩이_떨어짐 넘게 벌어진 덩이로 묶은 수(2 이상만)"""
    by = {}
    for 자리, sel, ln in 규칙들(글):
        for c in set(re.findall(r"\.([A-Za-z가-힣][\w가-힣-]*-[\w가-힣-]+)", sel)):
            by.setdefault(c, set()).add(ln)
    out = {}
    for k, v in by.items():
        v = sorted(v)
        n = 1 + sum(1 for a, b in zip(v, v[1:]) if b - a > 덩이_떨어짐)
        if n > 1:
            out[k] = n
    return out


def 재기2(글):
    """② (새로 먼 곳에 쓴 이름, 덩이가 늘어난 이름, 이제 한 덩이)"""
    g = 덩이들(글)
    새 = sorted(k for k in g if k not in 이미_멀리)
    더 = sorted(k for k in g if k in 이미_멀리 and g[k] > 이미_멀리[k])
    줄음 = sorted(k for k in 이미_멀리 if k not in g)
    return 새, 더, 줄음, g


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
    t5 = ".zz-head { display: flex; }\n" + "\n" * 400 + ".zz-head .zz-name { font-size: 15px; }\n"
    새2, _, _, _ = 재기2(t5)
    ok = "zz-head" in 새2
    print(f"  {'✓' if ok else '✗'} 자가시험 ⑤ ② 먼 곳에서 같은 이름을 조상으로 씀(.zz-head .zz-name) → 잡음")
    나쁨 += 0 if ok else 1
    t6 = ".yy-row { display: flex; }\n" + "\n" * 20 + "@media print { .yy-row { color: #000; } }\n"
    새2, _, _, _ = 재기2(t6)
    ok = not 새2
    print(f"  {'✓' if ok else '✗'} 자가시험 ⑥ ② 같은 도구 묶음 안(가까이) 다시 씀은 겹침 아님")
    나쁨 += 0 if ok else 1
    return 나쁨


def main():
    if "--self" in sys.argv:
        sys.exit(1 if 자가시험() else 0)
    if "--목록" in sys.argv:
        g = 덩이들(io.open(CSS, encoding="utf-8").read())
        print(" ".join(f"{k}:{v}" for k, v in sorted(g.items())))
        sys.exit(0)
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
    새2, 더2, 줄음2, g2 = 재기2(글)
    알고있는겹침 = sorted(k[1] for k, v in 이미_있음.items() if v[1].startswith("⚠️겹침") and k not in 안겹침)
    print(f"  떨어져 다시 적힌 이름 {있음 + len(새)}개 — 이미 알고 있는 것 {있음}개 · 새로 {len(새)}개")
    if 알고있는겹침:
        print(f"  ⚠️ 다른 도구끼리 겹친 줄 아는 것(하나씩 고칠 것) {len(알고있는겹침)}개: {' '.join(알고있는겹침)}")
    if 안겹침:
        print(f"  ℹ️ 이제 안 겹침(이미_있음 에서 빼도 됨): {', '.join((a + ' ' if a else '') + b for a, b in 안겹침)}")
    if 나쁜자가시험:
        print("❌ 자가시험이 깨졌습니다 — 검사 자체를 먼저 고치십시오.")
        sys.exit(1)
    print(f"  ② 먼 곳에 다시 나오는 도구 이름 {len(g2)}개 — 이미 알고 있는 것 {len(g2) - len(새2)}개 · 새로 {len(새2)}개 · 덩이 늚 {len(더2)}개")
    if 줄음2:
        print(f"  ℹ️ ② 이제 한 덩이(이미_멀리 를 --목록 으로 다시 뽑아도 됨): {' '.join(줄음2[:12])}{' …' if len(줄음2) > 12 else ''}")
    if not 새 and not 더 and not 새2 and not 더2:
        print(f"✓ 시험_css겹침 — 새로 겹친 이름 없음")
        sys.exit(0)
    for k in 새2:
        줄 = sorted({ln for _, sel, ln in 규칙들(글) if re.search(r"\." + re.escape(k) + r"(?![\w가-힣-])", sel)})
        print(f"  ✗ ② 먼 곳에서 같은 이름을 새로 씀: .{k} — {', '.join(map(str, 줄[:8]))}째 줄")
    for k in 더2:
        print(f"  ✗ ② 이미 먼 곳에 나오던 이름을 또 다른 곳에 씀: .{k} (덩이 {이미_멀리[k]} → {g2[k]})")
    for (자리, 이름), lines in 새:
        print(f"  ✗ 새로 겹침: {이름}{' (' + 자리 + ')' if 자리 else ''} — {', '.join(map(str, lines))}째 줄")
    for (자리, 이름), lines in 더:
        print(f"  ✗ 이미 겹친 이름에 또 적음: {이름}{' (' + 자리 + ')' if 자리 else ''} — {', '.join(map(str, lines))}째 줄")
    print()
    print("  → 새 도구는 고유 접두어로 이름을 바꾸십시오(예: gp- → gps-).")
    print("    같은 도구를 일부러 고쳐 덮은 거면 이 파일 «이미_있음» 에 까닭과 함께 넣으십시오.")
    print(f"❌ 시험_css겹침 — ① 새로 {len(새)} · 또 적음 {len(더)} · ② 새로 {len(새2)} · 덩이 늚 {len(더2)}")
    sys.exit(1)


if __name__ == "__main__":
    main()
