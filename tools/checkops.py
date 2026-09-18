# -*- coding: utf-8 -*-
"""🔑 운영자 브라우저 목록 대조 — 화면(lib/운영자.js) vs 서버(database.rules.json)

═══════════════════════════════════════════════════════════════════
■ 왜 이 검사가 있나 (2026-09-17)

  「K-건설맵 답변」 표는 이제 **비번이 아니라 브라우저 번호(uid)** 로 붙습니다.
  그런데 그 번호가 **두 곳에 적혀 있습니다.**

      web/src/lib/운영자.js          const OPS = [ … ]   ← 화면이 표를 붙일지 정할 때
      (2026-09-18 옮겼습니다 — 전에는 pages/Qna.jsx 안에 있었습니다. 운영자인지
       보려는 화면이 사랑방 화면을 통째로 끌고 오던 것을 끊기 위해서입니다.)
      web/database.rules.json        op 의 .validate     ← 서버가 허락할지 정할 때

  한쪽만 고치면 **조용히 어긋납니다.**
      화면에만 있고 규칙에 없으면 → 올릴 때 서버가 막아 「올리지 못했습니다」
      규칙에만 있고 화면에 없으면 → 표 없이 그냥 별명으로 올라감 (더 나쁩니다.
                                     소장님은 표가 붙은 줄 아는데 안 붙습니다)

  📌 이번 사고(「추정가격」 이라 적고 배정예산을 찍던 것)가 **두 벌이라서** 났습니다.
     두 벌을 못 없앨 자리면, **두 벌이 같은지 기계가 봐야 합니다.**

■ 쓰는 법
    python tools/checkops.py          어긋나면 1 로 끝납니다
    python tools/checkops.py --self   일부러 틀리게 해서 잡히는지
═══════════════════════════════════════════════════════════════════
"""
import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
화면 = os.path.join(ROOT, "web", "src", "lib", "운영자.js")
규칙 = os.path.join(ROOT, "web", "database.rules.json")

UID = re.compile(r"[A-Za-z0-9]{20,64}")


def 화면목록(글):
    m = re.search(r"const OPS = \[(.*?)\]", 글, re.S)
    if not m:
        return None
    return [x for x in UID.findall(re.sub(r"(?m)//.*$", "", m.group(1)))]


def 규칙목록(글):
    # op 의 .validate 한 줄만 봅니다 (주석은 걷어냅니다)
    민글 = re.sub(r"(?m)^\s*//.*$", "", 글)
    m = re.search(r'"op"\s*:\s*\{\s*"\.validate"\s*:\s*"([^"]*)"', 민글)
    if not m:
        return None
    return re.findall(r"auth\.uid\s*===\s*'([^']+)'", m.group(1))


def 규칙전체(글):
    """규칙 «전체» 에서 브라우저 번호가 박힌 자리를 모두 찾습니다. (2026-09-18)

    ⚠️ 전에는 op 의 .validate 한 줄만 봤습니다. 그런데 문의함(quotes·quote_a)을
       소장님 한 대에만 열면서 같은 번호가 **세 군데 더** 박혔습니다.
       한 곳만 고치고 나머지를 잊으면 「사랑방 답글은 되는데 문의함은 안 보이는」
       식으로 반쪽이 됩니다. 그래서 어디에 박혔든 전부 같은지 봅니다.
    """
    민글 = re.sub(r"(?m)^\s*//.*$", "", 글)
    return sorted(set(re.findall(r"auth\.uid\s*===\s*'([^']+)'", 민글)))


def 재기(화면글, 규칙글):
    a, b = 화면목록(화면글), 규칙목록(규칙글)
    나쁨 = []
    if a is None:
        나쁨.append("lib/운영자.js 에서 OPS = [ … ] 를 못 찾았습니다")
    if b is None:
        나쁨.append("database.rules.json 에서 op 의 .validate 를 못 찾았습니다")
    if 나쁨:
        return 나쁨, a, b
    if not a:
        나쁨.append("운영자 브라우저가 화면 목록에 하나도 없습니다")
    for u in a:
        if u not in b:
            나쁨.append(f"화면에만 있습니다 (서버가 막습니다 → 「올리지 못했습니다」): {u}")
    for u in b:
        if u not in a:
            나쁨.append(f"규칙에만 있습니다 (표가 안 붙습니다 — 더 나쁩니다): {u}")
    # 규칙 «전체» — op 말고 다른 자리(문의함 등)에 박힌 번호도 같은지
    for u in 규칙전체(규칙글):
        if u not in a:
            나쁨.append(f"규칙 어딘가에만 있습니다 (화면 OPS 에 없는 번호): {u}")
    for u in a:
        if u not in 규칙전체(규칙글):
            나쁨.append(f"규칙 어디에도 없습니다: {u}")
    return 나쁨, a, b


def 자가시험():
    화면좋음 = "const OPS = [\n  'AAAAAAAAAAAAAAAAAAAAAAAAAAAA',  // 소장님\n]"
    규칙좋음 = '"op": { ".validate": "newData.isBoolean() && ( newData.val() === false || auth.uid === \'AAAAAAAAAAAAAAAAAAAAAAAAAAAA\' )" },'
    화면둘 = "const OPS = [\n  'AAAAAAAAAAAAAAAAAAAAAAAAAAAA',\n  'BBBBBBBBBBBBBBBBBBBBBBBBBBBB',\n]"
    규칙둘 = '"op": { ".validate": "… auth.uid === \'AAAAAAAAAAAAAAAAAAAAAAAAAAAA\' || auth.uid === \'BBBBBBBBBBBBBBBBBBBBBBBBBBBB\' )" },'
    보기 = [
        (화면좋음, 규칙좋음, False, "한 대가 양쪽에 똑같이 — 통과해야 합니다"),
        (화면둘,  규칙둘,  False, "두 대가 양쪽에 똑같이 — 통과해야 합니다"),
        (화면둘,  규칙좋음, True,  "화면에만 한 대 더 — 올릴 때 서버가 막습니다"),
        (화면좋음, 규칙둘,  True,  "규칙에만 한 대 더 — 표가 안 붙습니다"),
        ("const OPS = [\n]", 규칙좋음, True, "화면 목록이 비었습니다"),
        ("(OPS 가 없는 파일)", 규칙좋음, True, "화면에서 OPS 를 못 찾음"),
    ]
    ok = bad = 0
    print("자가시험 — 일부러 어긋나게 해 봅니다")
    for a, b, 잡혀야, 설명 in 보기:
        잡힘 = bool(재기(a, b)[0])
        if 잡힘 == 잡혀야:
            ok += 1
            print(f"  ○ {'잡음  ' if 잡혀야 else '통과시킴'} — {설명}")
        else:
            bad += 1
            print(f"  ✕ {'못 잡았습니다' if 잡혀야 else '괜한 경보입니다'} — {설명}")
    print(f"  → 맞음 {ok} · 틀림 {bad}")
    return bad


def main():
    if "--self" in sys.argv:
        sys.exit(1 if 자가시험() else 0)
    print("=" * 64)
    print("  🔑 운영자 브라우저 목록 대조 (checkops)")
    print("=" * 64)
    나쁜자가시험 = 자가시험()
    print()
    try:
        화면글 = io.open(화면, encoding="utf-8").read()
        규칙글 = io.open(규칙, encoding="utf-8").read()
    except Exception as e:
        print(f"(건너뜀 — 읽지 못했습니다: {type(e).__name__}: {e})")
        sys.exit(0)
    나쁨, a, b = 재기(화면글, 규칙글)
    print(f"화면 lib/운영자.js       {len(a or [])}대")
    print(f"서버 database.rules.json {len(b or [])}대")
    if 나쁜자가시험:
        print("❌ 자가시험이 깨졌습니다 — 검사 자체를 먼저 고치십시오.")
        sys.exit(1)
    if not 나쁨:
        print("✅ 두 곳이 같습니다.")
        sys.exit(0)
    print("❌ 어긋납니다:")
    for x in 나쁨:
        print(f"   · {x}")
    print()
    print("  두 곳 다 고치고 3_규칙올리기.bat 을 한 번 돌리십시오.")
    sys.exit(1)


if __name__ == "__main__":
    main()
