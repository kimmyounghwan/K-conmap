# -*- coding: utf-8 -*-
"""🔑 운영자 브라우저 더하기 — 번호(uid) 하나를 «모든 자리» 에 한 번에 넣습니다 (G528 · 2026-11-03)

소장님 「아니 왜 내가 써도 건설맵이 안뜨지? 맵톡에..이거 해결홰줘」 「오늘자 올린 거 모두 내가 쓴거야」
「브라우저가 바뀌어도 컴이 같으면 동일한 사람으로 안돼???」
  → 브라우저마다 파이어베이스 번호가 따로 생깁니다(사이트는 «같은 컴퓨터» 인지 알 수 없음).
    운영자 번호 목록에 없는 브라우저에서 쓰면 «K-건설맵» 대신 자동 별명으로 올라갑니다.
    10-19(G324 노트북 엣지)에 이어 두 번째 — 손으로 15곳을 고치다 빠뜨리지 않게 이 도구로만 더합니다.

  python tools/운영자더하기.py <번호> "<메모 — 어느 기기 · 언제 · 왜>"
  python tools/운영자더하기.py --self      일부러 만든 글에 넣어 보고 자리 수를 맞춰 봄

넣는 자리(하나라도 못 찾으면 아무것도 안 바꾸고 멈춤):
  ① web/src/lib/운영자.js           const OPS = [ … ] 맨 끝 줄
  ② web/database.rules.json         «auth.uid === '…' || …» 묶음마다 · «$uid !== '…' && …» · «newData.child('r').val() !== '…' && …»
  ③ web/storage.rules               request.auth.uid in [ … ]
  ④ tools/알림수세기.py              OP = ( … )
다 넣은 뒤: python tools/checkops.py · node tools/시험_명패규칙.mjs 가 «모든 자리에 모든 번호» 를 봅니다.
⚠️ 사이트(화면)와 규칙(database · storage) 둘 다 올려야 합니다 — 규칙을 먼저(안 그러면 그 브라우저에서 «올리지 못했습니다»).
⚠️ K-적산웹 functions/main.py OPS 도 같게(점검_명단요율.py 가 다르면 멈춤) — 소장님 PC 폴더에 있습니다.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = {
    "화면": os.path.join(ROOT, "web", "src", "lib", "운영자.js"),
    "규칙": os.path.join(ROOT, "web", "database.rules.json"),
    "창고": os.path.join(ROOT, "web", "storage.rules"),
    "알림": os.path.join(ROOT, "tools", "알림수세기.py"),
}
UID = re.compile(r"^[A-Za-z0-9]{20,64}$")


def 화면목록(글):
    m = re.search(r"const OPS = \[(.*?)\]", 글, re.S)
    return re.findall(r"'([A-Za-z0-9]{20,64})'", re.sub(r"(?m)//.*$", "", m.group(1))) if m else None


def 더하기(글들, 새, 메모):
    """글들: {이름: 글} → (새 글들, 바꾼 자리 수 {이름: n}) — 못 찾으면 ValueError"""
    ops = 화면목록(글들["화면"])
    if not ops:
        raise ValueError("운영자.js 에서 OPS 를 못 찾음")
    if 새 in ops:
        raise ValueError("이미 들어 있는 번호")
    out, n = dict(글들), {}
    # ① 화면 — 마지막 번호 줄 뒤에
    m = re.search(r"const OPS = \[(.*?)\n\]", out["화면"], re.S)
    if not m:
        raise ValueError("OPS 끝 «]» 를 못 찾음")
    줄 = f"\n  '{새}',      // {메모}"
    out["화면"] = out["화면"][:m.end(1)] + 줄 + out["화면"][m.end(1):]
    n["화면"] = 1
    # ② 규칙 — 세 꼴
    규 = out["규칙"]
    묶음 = " || ".join(f"auth.uid === '{u}'" for u in ops)
    ㄱ = 규.count(묶음)
    규 = 규.replace(묶음, 묶음 + f" || auth.uid === '{새}'")
    아님 = " && ".join(f"$uid !== '{u}'" for u in ops)
    ㄴ = 규.count(아님)
    규 = 규.replace(아님, 아님 + f" && $uid !== '{새}'")
    옛 = " && ".join(f"newData.child('r').val() !== '{u}'" for u in ops)
    ㄷ = 규.count(옛)
    규 = 규.replace(옛, 옛 + f" && newData.child('r').val() !== '{새}'")
    첫 = 글들["규칙"].count(f"'{ops[0]}'")
    if ㄱ + ㄴ + ㄷ != 첫 or ㄱ == 0:
        raise ValueError(f"규칙의 운영자 자리 {첫}곳 가운데 {ㄱ + ㄴ + ㄷ}곳만 꼴이 맞음(묶음 {ㄱ} · $uid {ㄴ} · r {ㄷ}) — 손으로 보십시오")
    out["규칙"], n["규칙"] = 규, ㄱ + ㄴ + ㄷ
    # ③ 창고
    목 = "[" + ", ".join(f"'{u}'" for u in ops) + "]"
    if out["창고"].count(목) != 1:
        raise ValueError("storage.rules 의 운영자 목록을 못 찾음")
    out["창고"] = out["창고"].replace(목, 목[:-1] + f", '{새}']")
    n["창고"] = 1
    # ④ 알림수세기
    튜 = "(" + ", ".join(f'"{u}"' for u in ops) + ")"
    if out["알림"].count(튜) != 1:
        raise ValueError("알림수세기.py 의 OP 를 못 찾음")
    out["알림"] = out["알림"].replace(튜, 튜[:-1] + f', "{새}")')
    n["알림"] = 1
    return out, n


def 자가시험():
    a, b = "A" * 28, "B" * 28
    글 = {"화면": f"export const OPS = [\n  '{a}',      // 하나\n  '{b}',      // 둘\n]\n",
         "규칙": (f"x: (auth.uid === '{a}' || auth.uid === '{b}') y: (auth.uid === '{a}' || auth.uid === '{b}') "
                f"$uid !== '{a}' && $uid !== '{b}' && newData.child('r').val() !== '{a}' && newData.child('r').val() !== '{b}'"),
         "창고": f"allow read: if request.auth.uid in ['{a}', '{b}'];",
         "알림": f'OP = ("{a}", "{b}")   # 메모'}
    c = "C" * 28
    out, n = 더하기(글, c, "셋")
    좋 = (화면목록(out["화면"]) == [a, b, c] and out["규칙"].count(f"'{c}'") == 4 and n["규칙"] == 4
          and f"'{b}', '{c}']" in out["창고"] and f'"{b}", "{c}")' in out["알림"])
    틀림 = 0
    try:
        더하기(out, c, "또")
    except ValueError:
        pass
    else:
        틀림 += 1
    나쁜 = dict(글)
    나쁜["규칙"] = 글["규칙"] + f" z: auth.uid === '{a}'"        # 꼴이 다른 자리 — 멈춰야 함
    try:
        더하기(나쁜, c, "셋")
    except ValueError:
        pass
    else:
        틀림 += 1
    print(("✓" if 좋 and not 틀림 else "✗") + f" 자가시험 — 넣기 {'맞음' if 좋 else '틀림'} · 겹침 · 다른 꼴 멈춤 {'맞음' if not 틀림 else '틀림'}")
    return 0 if 좋 and not 틀림 else 1


def main():
    if "--self" in sys.argv:
        sys.exit(자가시험())
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    새, 메모 = sys.argv[1].strip(), sys.argv[2].strip()
    if not UID.match(새):
        print("✗ 번호 꼴이 아님(영문 · 숫자 20~64자)")
        sys.exit(2)
    글들 = {k: open(p, encoding="utf-8", newline="").read() for k, p in P.items()}
    try:
        out, n = 더하기(글들, 새, 메모)
    except ValueError as e:
        print("✗ 멈춤 —", e, "(아무것도 안 바꿈)")
        sys.exit(1)
    for k, p in P.items():
        with open(p, "w", encoding="utf-8", newline="") as f:
            f.write(out[k])
    print("✓ 더함:", " · ".join(f"{k} {v}곳" for k, v in n.items()))


if __name__ == "__main__":
    main()
