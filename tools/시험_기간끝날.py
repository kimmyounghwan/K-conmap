# -*- coding: utf-8 -*-
"""시험_기간끝날 — «날부터 N달(해)» 끝날 셈이 민법 제157조 · 제160조 ② · ③ 그대로인지 + 서식 생성기에 EDATE 가 새로 들어오면 멈춤
   (2026-11-17 G738 — 착공연기신청서를 만들다 «EDATE(날+1, N) − 1» 이 윤년 2월 28일 허가에서 하루 이른 것을 찾음 ·
    이미 올린 건축허가 신청서 · 착공신고서의 «EDATE(허가일, 24)» 도 평년 2월 28일 허가 · 끝 해 윤년이면 하루 이름 → 같이 고침)

  python tools/시험_기간끝날.py          ① ② ③ 모두
  python tools/시험_기간끝날.py --목록   생성기마다 EDATE 수를 찍음(이미_있음 고칠 때)

  ① 끝날식(엑셀 식)을 파이썬으로 흉내 내 셈 = 끝날(조문 그대로 셈) — 2020-01-01 ~ 2032-12-31 모든 날 × 1 · 2 · 3 · 6 · 12 · 24 · 36 · 48달
  ② 손으로 고른 날(윤년 · 말일)
  ③ tools/forms2 생성기(f_* · b_* · sgw …)의 «식 글자» 안 EDATE( 수가 이미_있음 보다 늘면 ❌
     — 날부터 N달(해) 끝날이면 기간셈.끝날식 · 끝날 을 쓰고, 다른 뜻(달력 칸 · 근속 · 연차 …)이면 까닭과 함께 이미_있음 에 넣음
     (주석 · 설명 글(docstring)의 EDATE 는 세지 않음)
"""
import ast
import datetime
import glob
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
F2 = os.path.join(HERE, "forms2")
sys.path.insert(0, F2)
from 기간셈 import 끝날, 끝날식  # noqa: E402

D = datetime.date
ONE = datetime.timedelta(days=1)

# 생성기 «식 글자» 안 EDATE( 수(11-17 G738 때 센 것) — 늘면 ❌ · 줄면 알림
이미_있음 = {
    "b_pumjil.py": (1, "교정 다음 날짜(교정일 + 유효 달) — 끝날 아님"),
    "f_dalryeok_2027.py": (2, "제160조 ② · ③ 꼴(IF(DAY(EDATE)<DAY, EOMONTH, EDATE−1)) — 맞음"),
    "f_gaseol_chukjo_singo.py": (1, "존치끝일 ≤ 설치일 + 3년 대조(넉넉히 봄)"),
    "f_gaseol_jonchi_yeonjang.py": (2, "연장 3년 대조 · 사진 1개월 대조(넉넉히 봄)"),
    "f_gongjeongpyo.py": (3, "공정표 달 칸 머리(1일 · 말일)"),
    "f_gongsa_anjeon_daejang.py": (2, "3달마다 점검 칸"),
    "f_hasugwangeo_sigong.py": (3, "공정표 달 칸 머리"),
    "f_iryeokseo.py": (2, "경력 기간(그날 0시부터 · 제157조 단서) — f_jaejik_gyeongryeok 와 같음"),
    "f_jaejik_gyeongryeok.py": (2, "재직 · 경력 기간(그날 0시부터 · 제160조 ③ 다음 날)"),
    "f_o_gaseol_gyehoekseo.py": (1, "달 머리 글"),
    "f_otak_sigong.py": (3, "공정표 달 칸 머리"),
    "f_sajikseo.py": (3, "제160조 ② · ③ 꼴(_end_after) · 기간 3번째 달"),
    "f_sobang_chakgong_singo.py": (2, "제160조 ② · ③ 꼴(END3) — 맞음"),
    "f_yeoncha_gwanri.py": (11, "연차(입사일 0시부터 · 제160조 ③ 다음 날) · 촉진 기간"),
    "sgw.py": (3, "공정표 달 칸 머리"),
}


def edate(d, n):
    import calendar
    y, m = divmod(d.month - 1 + n, 12)
    y += d.year
    m += 1
    return D(y, m, min(d.day, calendar.monthrange(y, m)[1]))


def 흉내(d, n):
    """끝날식 이 엑셀에서 내는 값 — MAX(EDATE(d,n), EDATE(d+1,n)−1)"""
    s = 끝날식("D", "N")
    assert s == "MAX(EDATE(D,N),EDATE(D+1,N)-1)", s     # 식 꼴이 바뀌면 흉내도 고칠 것
    return max(edate(d, n), edate(d + ONE, n) - ONE)


def 조문(d, n):
    """끝날 과 따로 — 기산일 a = d+1 · 마지막 달 a 의 같은 날 전날 · 없으면 말일(날짜를 하루씩 세어 봄)"""
    a = d + ONE
    y, m = divmod(a.month - 1 + n, 12)
    y += a.year
    m += 1
    try:
        return D(y, m, a.day) - ONE
    except ValueError:
        x = D(y, m, 28)
        while (x + ONE).month == m:
            x += ONE
        return x


def 셈글자(path):
    """파일의 식 글자(주석 · docstring 빼고) 안 EDATE( 수"""
    src = open(path, encoding="utf-8").read()
    try:
        tree = ast.parse(src)
    except SyntaxError:
        # 🩹 11-17 G738: PC 파이썬 3.11 은 3.12 f-string 꼴(식 안 \ 등 · f_jichul_gyeoluiseo)을 못 읽어 시험이 멈췄음(올리기 멈춤)
        #   → 못 읽는 파일은 날 글자 전체(주석 · 설명 글까지)의 EDATE( 를 셈 — 넉넉히 세므로 새 EDATE 는 그래도 잡힘
        return src.count("EDATE(")
    doc = set()
    for node in [tree] + [n for n in ast.walk(tree) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef))]:
        b = getattr(node, "body", None)
        if b and isinstance(b[0], ast.Expr) and isinstance(b[0].value, ast.Constant) and isinstance(b[0].value.value, str):
            doc.add(id(b[0].value))
    n = 0
    for x in ast.walk(tree):
        if isinstance(x, ast.Constant) and isinstance(x.value, str) and id(x) not in doc:
            n += x.value.count("EDATE(")
    return n


def main():
    if "--목록" in sys.argv:
        for f in sorted(glob.glob(os.path.join(F2, "*.py"))):
            b = os.path.basename(f)
            if b.startswith("장면_") or b == "기간셈.py":
                continue
            n = 셈글자(f)
            if n:
                print(f'    "{b}": ({n}, ""),')
        return 0
    bad = 0
    # ①
    n_all = 0
    d = D(2020, 1, 1)
    while d <= D(2032, 12, 31):
        for n in (1, 2, 3, 6, 12, 24, 36, 48):
            w, x, y = 끝날(d, n), 흉내(d, n), 조문(d, n)
            n_all += 1
            if not (w == x == y):
                bad += 1
                if bad <= 5:
                    print(f"  ✗ {d} + {n}달: 끝날 {w} · 엑셀 식 {x} · 조문 {y}")
        d += ONE
    print(f"  {'✓' if not bad else '❌'} ① 끝날 = 엑셀 식 = 조문 셈 — {n_all:,}가지 중 틀림 {bad}")
    # ②
    손 = [((2024, 2, 28), 36, (2027, 2, 28)), ((2026, 2, 28), 24, (2028, 2, 29)), ((2025, 3, 10), 24, (2027, 3, 10)),
         ((2024, 2, 29), 36, (2027, 2, 28)), ((2027, 2, 28), 12, (2028, 2, 29)), ((2024, 1, 30), 1, (2024, 2, 29)),
         ((2025, 1, 30), 1, (2025, 2, 28)), ((2025, 1, 27), 1, (2025, 2, 27)), ((2025, 10, 30), 4, (2026, 2, 28)),
         ((2025, 12, 31), 12, (2026, 12, 31)), ((2026, 1, 31), 1, (2026, 2, 28)), ((2026, 3, 31), 1, (2026, 4, 30))]
    b2 = 0
    for (dd, n, want) in 손:
        got = 끝날(D(*dd), n)
        if got != D(*want) or 흉내(D(*dd), n) != D(*want):
            b2 += 1
            print(f"  ✗ {D(*dd)} + {n}달 = {got} (바라는 값 {D(*want)})")
    print(f"  {'✓' if not b2 else '❌'} ② 손으로 고른 날 {len(손)}개 중 틀림 {b2}")
    bad += b2
    # ③
    b3 = 0
    본것 = set()
    for f in sorted(glob.glob(os.path.join(F2, "*.py"))):
        b = os.path.basename(f)
        if b.startswith("장면_") or b == "기간셈.py":
            continue
        n = 셈글자(f)
        if not n:
            continue
        본것.add(b)
        allow = 이미_있음.get(b, (0, ""))[0]
        if n > allow:
            b3 += 1
            print(f"  ❌ {b}: 식 글자 안 EDATE {n}개(알고 있는 것 {allow}) — «날부터 N달(해)» 끝날이면 기간셈.끝날식 · 끝날 을 쓰고,"
                  f" 다른 뜻이면 tools/시험_기간끝날.py 이미_있음 에 까닭과 함께")
        elif n < allow:
            print(f"  · {b}: EDATE {n}개로 줄었음(알고 있는 것 {allow}) — 이미_있음 을 낮춰도 됨")
    for b in 이미_있음:
        if b not in 본것:
            print(f"  · {b}: EDATE 없음 — 이미_있음 에서 빼도 됨")
    print(f"  {'✓' if not b3 else '❌'} ③ 생성기 새 EDATE — 늘어난 파일 {b3}")
    bad += b3
    # ④ 자가시험 — 세는 틀이 식 글자 안 EDATE 는 잡고 주석 · 설명 글은 넘기는지
    import tempfile
    본보기 = ('"""설명 EDATE(날,1)"""\n# 주석 EDATE(x,1)\nX = \'=EDATE({허가일},24)\'\n'
           'def f():\n    """EDATE 설명"""\n    return f\'=IF(A,EDATE({{a}},{3}),"")\'\n')
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as t:
        t.write(본보기)
    n4 = 셈글자(t.name)
    os.unlink(t.name)
    print(f"  {'✓' if n4 == 2 else '❌'} ④ 자가시험 — 식 글자 EDATE 2개만 셈(주석 · 설명 글 뺌): {n4}")
    bad += (n4 != 2)
    # ④-2 이 파이썬이 못 읽는 파일(PC 3.11 의 3.12 f-string 등)도 멈추지 않고 넉넉히 셈
    with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as t:
        t.write("X = '=EDATE({허가일},24)'\nif:\n")
    n5 = 셈글자(t.name)
    os.unlink(t.name)
    print(f"  {'✓' if n5 == 1 else '❌'} ④-2 자가시험 — 못 읽는 파일도 멈추지 않고 셈(넉넉히): {n5}")
    bad += (n5 != 1)
    print(("✅" if not bad else "❌") + f" 시험_기간끝날 {'모두 맞음' if not bad else f'틀림 {bad}'}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
