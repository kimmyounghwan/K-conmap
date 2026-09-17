# -*- coding: utf-8 -*-
"""🏷️ 이름표 ↔ 숫자 대조 — 「추정가격」 이라 적고 «배정예산» 을 찍는 일을 막습니다.

═══════════════════════════════════════════════════════════════════
■ 왜 이 검사가 있나 — 2026-09-17 에 실제로 났던 사고입니다

    <span className="badge n">추정가격</span>
    <span className="amt">{wonShort(r.budget)}</span>   ← 배정예산입니다

  공고 하나에 금액이 셋이고 셋 다 다릅니다.
      추정가격 est     법정 경계가 걸리는 금액 (적격심사 구간이 이걸로 갈립니다)
      기초금액 base    추정가격 + 부가세
      배정예산 budget  총사업비. 제일 큼
  실측: 배정예산은 추정가격보다 가운데값 +10.0%, 상위 10% +67.4%.
        그중 13.7%(2,085건)는 2·3·4·10·50·100억 경계를 넘어 «다른 칸» 으로 보였습니다.
  8월 30일부터 18일간 그대로였습니다. **에러도 안 나고, 숫자도 그럴듯해서** 아무도 못 봤습니다.

  ⚠️ 더 나쁜 것은 — `BaroBid.jsx` 에 「배정예산을 추정가격으로 쓰면 안 됩니다」 라고
     **주석이 이미 있었다**는 것입니다. 계산하는 쪽은 맞게 쓰고 있었습니다.
     **주석은 옆 파일로 옮겨 다니지 않습니다.** 사람이 기억하는 것으로는 못 막습니다.
     그래서 «기계» 로 막습니다.

■ 무엇을 보나 — «이름표 바로 옆의 값» 하나만 봅니다
  화면에서 금액 이름표가 붙는 자리는 셋뿐입니다.
      <span>추정가격</span><b>{…}</b>              ← kv 줄
      <span className="badge n">추정가격</span><span className="amt">{…}</span>   ← 카드 아래
      <Row label="추정가격" …>                      ← 계산기
  이름표마다 «와야 할 값» 과 «오면 안 되는 값» 을 아래 표에 적습니다.

■ 일부러 좁게 만들었습니다
  설명글·주석·안내문에 나오는 금액 이름은 보지 않습니다.
  ⚠️ 2026-09-17 8절 22 — 틀린 경보 하나가 배포를 통째로 멈춘 적이 있습니다.
     이 검사는 «확실한 것만» 잡습니다. 애매하면 통과시킵니다.

■ 쓰는 법
    python tools/checklabels.py          잘못이 있으면 1 로 끝납니다
    python tools/checklabels.py --list   짝을 전부 찍어 봅니다 (눈으로 확인할 때)
    python tools/checklabels.py --self    일부러 틀린 것을 넣어 «정말 잡히는지» 확인
═══════════════════════════════════════════════════════════════════
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "web", "src")

# 이름표 → (반드시 들어 있어야 할 것, 절대 있으면 안 되는 것)
#   ⚠️ 「반드시」 는 여럿 중 «하나라도» 면 됩니다.
규칙 = {
    "추정가격": (["estOf", "est", "estimate", "estPrice"], ["budget"]),
    "기초금액": (["base", "bssamt"],                        ["budget", "est"]),
    "배정예산": (["budget"],                                []),
    "낙찰금액": (["amt", "win", "price", "bid"],            ["budget", "base"]),
}
# 「추정가격/배정예산」처럼 «모르면 이름을 바꾸는» 짝 — 값에 둘 다 있어야 맞습니다
갈아끼움 = {("추정가격", "배정예산"): ["estOf", "budget"]}

이름표 = "|".join(규칙.keys())
# ① <span …>이름표</span> … {값}          ② <Row label="이름표" …
쌍 = re.compile(
    r"<(?:span|b|div)[^>]*>\s*(" + 이름표 + r")\s*(?:\([^)]*\))?\s*</(?:span|b|div)>"
    r"(?P<뒤>(?:\s|<[^>]*>){0,80}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})",
    re.S)
표 = re.compile(r'label="(' + 이름표 + r')"(?P<뒤>[^>]{0,200})', re.S)
# ③ {조건 ? '추정가격' : '배정예산'} … {값}
갈아 = re.compile(
    r"\{[^{}]*\?\s*'(" + 이름표 + r")'\s*:\s*'(" + 이름표 + r")'[^{}]*\}"
    r"(?P<뒤>(?:\s|<[^>]*>){0,80}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})",
    re.S)


def 값뽑기(뒤):
    m = re.search(r"\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", 뒤)
    return (m.group(1).strip() if m else "")


def 훑기(글, 길):
    """(줄번호, 이름표, 값) 목록"""
    out = []
    for m in 쌍.finditer(글):
        out.append((글[:m.start()].count("\n") + 1, m.group(1), 값뽑기(m.group("뒤"))))
    for m in 갈아.finditer(글):
        out.append((글[:m.start()].count("\n") + 1, (m.group(1), m.group(2)), 값뽑기(m.group("뒤"))))
    for m in 표.finditer(글):
        뒤 = m.group("뒤")
        v = re.search(r"value=\{([^}]*)\}", 뒤)
        out.append((글[:m.start()].count("\n") + 1, m.group(1), (v.group(1).strip() if v else "")))
    return out


def 재기(글, 길):
    나쁨 = []
    for 줄, 표이름, 값 in 훑기(글, 길):
        if not 값:
            continue
        if isinstance(표이름, tuple):
            want = 갈아끼움.get(표이름)
            if want is None:
                continue                       # 모르는 짝은 건드리지 않습니다
            빠짐 = [w for w in want if w not in 값]
            if 빠짐:
                나쁨.append((줄, "/".join(표이름), 값, f"이 말들이 값에 없습니다: {', '.join(빠짐)}"))
            continue
        있어야, 없어야 = 규칙[표이름]
        for x in 없어야:
            if re.search(r"\b" + x + r"\b", 값):
                나쁨.append((줄, 표이름, 값, f"«{x}» 가 들어 있습니다 — 다른 금액입니다"))
                break
        else:
            if not any(re.search(r"\b" + y + r"\b", 값) for y in 있어야):
                나쁨.append((줄, 표이름, 값, f"{' / '.join(있어야)} 중 아무것도 없습니다"))
    return 나쁨


def 모으기():
    파일 = []
    for root, _, files in os.walk(SRC):
        if "node_modules" in root:
            continue
        for fn in sorted(files):
            if fn.endswith(".jsx"):
                파일.append(os.path.join(root, fn))
    return 파일


def 돌리기(보여주기=False):
    모두, 나쁨 = 0, []
    for p in 모으기():
        글 = io.open(p, encoding="utf-8").read().replace("\r\n", "\n")
        짝 = 훑기(글, p)
        모두 += len([x for x in 짝 if x[2]])
        if 보여주기:
            for 줄, 표이름, 값 in 짝:
                if 값:
                    이름 = "/".join(표이름) if isinstance(표이름, tuple) else 표이름
                    print(f"  {os.path.relpath(p, ROOT)}:{줄}  [{이름}]  ← {값[:80]}")
        for 줄, 이름, 값, 까닭 in 재기(글, p):
            나쁨.append((os.path.relpath(p, ROOT), 줄, 이름, 값, 까닭))
    return 모두, 나쁨


def 자가시험():
    """⚠️ «일부러 틀리게 해서 잡히는지» — 8절 11의 규칙입니다."""
    보기 = [
        ('<span className="badge n">추정가격</span><span className="amt">{wonShort(r.budget)}</span>',
         True,  "추정가격이라 적고 배정예산을 찍음 — 이번에 난 그 사고"),
        ("<span>추정가격</span><b>{won(r.est || r.budget)}</b>",
         True,  "est 가 없으면 배정예산으로 떨어짐"),
        ("<span>기초금액</span><b>{won(r.budget)}</b>",
         True,  "기초금액이라 적고 배정예산을 찍음"),
        ("<span>기초금액</span><b>{won(r.est)}</b>",
         True,  "기초금액이라 적고 추정가격을 찍음"),
        ('<span className="badge n">추정가격</span><span className="amt">{wonShort(estOf(r))}</span>',
         False, "맞게 쓴 것 — 잡으면 안 됩니다"),
        ("<span>기초금액</span><b>{r.base > 0 ? won(r.base) : '아직 공개 안 됨'}</b>",
         False, "맞게 쓴 것"),
        ("<span>배정예산</span><b>{won(r.budget)}</b>",
         False, "맞게 쓴 것"),
        ("<span>{estOf(r) > 0 ? '추정가격' : '배정예산'}</span><b>{won(estOf(r) || r.budget)}</b>",
         False, "모르면 이름을 바꾸는 짝 — 맞게 쓴 것"),
        ("<span>{estOf(r) > 0 ? '추정가격' : '배정예산'}</span><b>{won(r.budget)}</b>",
         True,  "이름은 갈아끼우는데 값은 늘 배정예산 — 반쪽짜리"),
    ]
    ok = bad = 0
    print("자가시험 — 일부러 틀린 것을 넣어 봅니다")
    for 글, 잡혀야, 설명 in 보기:
        잡힘 = bool(재기(글, "(시험)"))
        if 잡힘 == 잡혀야:
            ok += 1
            print(f"  ○ {'잡음  ' if 잡혀야 else '통과시킴'} — {설명}")
        else:
            bad += 1
            print(f"  ✕ {'못 잡았습니다' if 잡혀야 else '괜한 경보입니다'} — {설명}\n      {글}")
    print(f"  → 맞음 {ok} · 틀림 {bad}")
    return bad


def main():
    보여주기 = "--list" in sys.argv
    if "--self" in sys.argv:
        sys.exit(1 if 자가시험() else 0)
    print("=" * 64)
    print("  🏷️ 이름표 ↔ 숫자 대조 (checklabels)")
    print("=" * 64)
    나쁜자가시험 = 자가시험()
    print()
    모두, 나쁨 = 돌리기(보여주기)
    print(f"금액 이름표가 붙은 자리 {모두}곳을 봤습니다.")
    if 나쁜자가시험:
        print("❌ 자가시험이 깨졌습니다 — 검사 자체를 먼저 고치십시오.")
        sys.exit(1)
    if not 나쁨:
        print("✅ 이름표와 숫자가 전부 맞습니다.")
        sys.exit(0)
    print(f"❌ {len(나쁨)}곳이 어긋납니다 — 이름표와 «다른 금액» 을 찍고 있습니다:")
    for p, 줄, 이름, 값, 까닭 in 나쁨:
        print(f"   {p}:{줄}")
        print(f"      이름표 「{이름}」 · 값 {값[:80]}")
        print(f"      → {까닭}")
    print()
    print("  추정가격은 estOf(r) 로 뽑습니다 (web/src/lib/fmt.js).")
    print("  모르면(0) 이름표를 「배정예산」 으로 바꾸고 budget 을 보여 주십시오.")
    sys.exit(1)


if __name__ == "__main__":
    main()
