# -*- coding: utf-8 -*-
"""
tools/checkbook.py — 설계변경 통합 엑셀(chg-tonghap.xlsx)이 «정말로 규정대로 계산되는지» 확인합니다.

수식을 눈으로 읽는 것은 확인이 아닙니다. 그래서:
  ① 시험 자료를 넣은 사본을 만들고
  ② LibreOffice 로 실제로 열어 «처음부터» 재계산시킨 뒤
  ③ 파이썬으로 «따로» 계산한 정답(국가계약법 시행령 제65조 + 원가계산서 식)과 칸 하나하나 대조합니다.
한 군데라도 어긋나면 빨갛게 찍고 1 을 돌려줍니다.

🩹 2026-10-20 G329 — 다시 씀. 소장님 「내역서 부터 차례 차례 검증하자」 「완벽에 가깝게」
   · 예전 판은 시트 «당초내역 · 변경내역» 을 찾다가 멈췄습니다(9/15 에 내역서가 한 표로 바뀐 뒤로 한 번도 안 돌았음).
   · 예전 시험 자료는 당초 단가 = 단가마스터 단가 라서, 원가계산서 «변경 후» 가 단가마스터 단가를 쓰는 잘못을 못 잡았습니다.
     → 이번 자료는 «계약단가 ≠ 당시단가» · 예정가격단가 · 협의(Y) · 신규 · 감소 · 소수 수량 · 관급 · 간접재료비를 다 넣습니다.

쓰는 법:  python tools/checkbook.py [엑셀 경로]   (빼면 web/public/forms/chg-tonghap.xlsx)
"""
import os, shutil, subprocess, sys, tempfile, math, random
from openpyxl import load_workbook

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "web", "public", "forms", "chg-tonghap.xlsx")
HEAD = 4
N_ITEM = 200


def xround(x, d=0):
    """엑셀 ROUND(반올림 · 0 에서 먼 쪽) — 파이썬 round 는 짝수 쪽이라 다릅니다"""
    m = 10 ** d
    v = abs(x) * m
    r = math.floor(v + 0.5 + 1e-9) / m
    return r if x >= 0 else -r


# ── 시험 자료 셋 ───────────────────────────────────────────────
# 줄: (코드, 당초수량 또는 None(신규), 계약 재 · 노 · 경, 변경 «직접» 수량 또는 None(산출서로), 협의, 예정가격단가)
# 단가마스터: 코드 → (품명, 규격, 단위, 재, 노, 경)  ← 설계변경 «당시» 단가
DATA = [
    dict(이름="D1 계약단가 ≠ 당시단가 · 증가 · 감소 · 신규",
         계약=870_000_000, 예가=1_000_000_000, 낙찰률=87,
         마스터={"토공-001": ("터파기", "토사", "m3", 0, 9000, 2500),
                "포장-001": ("아스콘", "T=5", "m2", 13000, 3500, 1200),
                "신규-001": ("배수관", "D300", "m", 21000, 6500, 2100)},
         줄=[("토공-001", 100, (0, 8000, 2000), 130, "", None),
            ("포장-001", 200, (12000, 3000, 1000), 150, "", None),
            ("신규-001", None, None, 40, "", None)],
         산출=[], 관급=0, 간재=0),
    dict(이름="D2 예정가격단가 · 협의(Y) · 수량산출서로 변경",
         계약=1_234_000_000, 예가=1_350_000_000, 낙찰률=91.40741,
         마스터={"토공-002": ("되메우기", "다짐", "m3", 0, 6100, 1300),
                "철근-001": ("철근가공조립", "보통", "ton", 0, 410000, 21000),
                "콘크-001": ("레미콘타설", "25-24-150", "m3", 89000, 17500, 3100),
                "신규-002": ("PE관", "D200", "m", 15500, 4300, 800),
                "신규-003": ("맨홀", "1호", "개", 410000, 160000, 12000)},
         줄=[("토공-002", 340, (0, 5800, 1200), None, "", None),         # 산출서 변경 410
            ("철근-001", 12.5, (0, 395000, 20000), 14.25, "", 400000),   # 계약 415,000 > 예가 400,000 → 예가
            ("콘크-001", 85, (86000, 17000, 3000), 120, "Y", None),      # 협의
            ("신규-002", None, None, 66.6, "", None),
            ("신규-003", None, None, 3, "Y", None)],                      # 신규 협의
         산출=[("변경", "토공-002", 10, 20, 2, 1), ("변경", "토공-002", 5, 1, 2, 1), ("당초", "토공-002", 10, 17, 2, 1)],
         관급=55_000_000, 간재=1_200_000),
]
# D3 — 줄 많이 · 소수 수량 · 감소 많이(무작위지만 씨앗 고정)
random.seed(20261020)
마 = {}
줄 = []
for i in range(1, 31):
    code = f"공종-{i:03d}"
    재, 노, 경 = random.choice([0, 0, 5000, 12000, 38000]), random.randrange(2000, 90000, 10), random.randrange(0, 9000, 10)
    마[code] = (f"품목{i}", f"규격{i}", random.choice(["m", "m2", "m3", "개", "ton"]), 재, 노, 경)
    if i <= 24:
        q0 = round(random.uniform(1, 500), 3)
        k = random.choice([0.6, 0.85, 1.0, 1.15, 1.4])
        f = random.uniform(0.85, 1.05)
        줄.append((code, q0, (round(재 * f), round(노 * f), round(경 * f)), round(q0 * k, 3), "Y" if i % 9 == 0 else "", None))
    else:
        줄.append((code, None, None, round(random.uniform(1, 80), 2), "Y" if i == 27 else "", None))
DATA.append(dict(이름="D3 30줄 · 소수 수량 · 감소 · 협의 섞임", 계약=2_418_900_000, 예가=2_700_000_000, 낙찰률=89.58889,
                 마스터=마, 줄=줄, 산출=[], 관급=0, 간재=0))


def fill(path, D):
    wb = load_workbook(path)
    c = wb["설정"]
    c["C13"], c["C14"], c["C15"] = D["계약"], D["예가"], D["낙찰률"]
    m = wb["단가마스터"]
    for i, (code, v) in enumerate(D["마스터"].items()):
        for j, x in enumerate((code,) + v):
            m.cell(HEAD + i, j + 1, x)
    s = wb["수량산출서"]
    for i, (g, code, a, b, h, n) in enumerate(D["산출"]):
        r = HEAD + i
        s.cell(r, 1, g); s.cell(r, 2, code)
        for j, x in enumerate((a, b, h, n)):
            if x is not None:
                s.cell(r, 4 + j, x)
    n = wb["내역서"]
    z = wb["증감대비표"]
    for i, (code, q0, 계약, q1, 협, 예) in enumerate(D["줄"]):
        r = HEAD + i
        n.cell(r, 1, i + 1); n.cell(r, 2, code)
        if q0 is not None:
            n.cell(r, 6, q0)
            for j, x in enumerate(계약):
                n.cell(r, 7 + j, x)
        if q1 is not None:
            n.cell(r, 13, q1)
        if 협:
            z.cell(r, 13, 협)
        if 예:
            z.cell(r, 14, 예)
    w = wb["원가계산서"]
    for r in range(1, w.max_row + 1):
        nm = str(w.cell(r, 2).value or "").replace(" ", "")
        if nm == "관급자재대":
            w.cell(r, 5, D["관급"]); w.cell(r, 6, D["관급"])
        if nm == "간접재료비":
            w.cell(r, 5, D["간재"]); w.cell(r, 6, D["간재"])
    wb.save(path)


RECALC_XCU = """<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry"
           xmlns:xs="http://www.w3.org/2001/XMLSchema">
 <item oor:path="/org.openoffice.Office.Calc/Formula/Load">
  <prop oor:name="OOXMLRecalcMode" oor:op="fuse"><value>0</value></prop>
 </item>
 <item oor:path="/org.openoffice.Office.Calc/Formula/Load">
  <prop oor:name="ODFRecalcMode" oor:op="fuse"><value>0</value></prop>
 </item>
</oor:items>
"""


def recalc(path, outdir):
    """LibreOffice 로 실제 열어 계산시킵니다 — 임시 프로필에 «항상 다시 계산» 을 넣고 다른 폴더로 내보냅니다."""
    prof = os.path.join(outdir, "loprof")
    d = os.path.join(prof, "user")
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, "registrymodifications.xcu"), "w", encoding="utf-8") as f:
        f.write(RECALC_XCU)
    dst = os.path.join(outdir, "out")
    os.makedirs(dst, exist_ok=True)
    env = dict(os.environ, HOME=outdir)
    r = subprocess.run(["soffice", "-env:UserInstallation=file://" + prof, "--headless", "--norestore", "--nolockcheck",
                        "--convert-to", "xlsx", "--outdir", dst, path], capture_output=True, text=True, timeout=300, env=env)
    out = os.path.join(dst, os.path.basename(path))
    if not os.path.exists(out):
        print("⛔ LibreOffice 변환 실패:", r.stdout[-400:], r.stderr[-400:]); sys.exit(2)
    return out


def 정답(D, 요율):
    rt = D["낙찰률"] / 100
    산 = {}
    for g, code, a, b, h, n in D["산출"]:
        v = 1.0
        for x in (a, b, h, n):
            v *= (x if x is not None else 1)
        산[(g, code)] = 산.get((g, code), 0) + round(v, 3)
    줄 = []
    for code, q0, 계약, q1, 협, 예 in D["줄"]:
        o, p, q = D["마스터"][code][3:6]
        J = o + p + q
        g, h, i = 계약 if 계약 else (0, 0, 0)
        G = g + h + i
        F = q0 or 0
        N = q1 if q1 is not None else 산.get(("변경", code), 0)
        K = N - F
        구 = "신규" if F == 0 else ("감소" if K < 0 else ("증가" if K > 0 else "-"))
        Y = 협 == "Y"
        if 구 == "감소":
            O = G
        elif 구 == "증가":
            O = xround((J + J * rt) / 2) if Y else (예 if (예 and G > 예) else G)
        elif 구 == "신규":
            O = xround((J + J * rt) / 2) if Y else xround(J * rt)
        else:
            O = 0
        P = xround(K * O)
        계약바탕 = 구 == "감소" or (구 == "증가" and not Y)
        b재, b노, b합 = (g, h, G) if 계약바탕 else (o, p, J)
        R = 0 if O == 0 or b합 == 0 else xround(b재 * O / b합)
        S = 0 if O == 0 or b합 == 0 else xround(b노 * O / b합)
        T = O - R - S
        U, V = xround(K * R), xround(K * S)
        W = P - U - V
        줄.append(dict(code=code, F=F, G=G, N=N, J=J, K=K, 구=구, O=O, P=P, R=R, S=S, T=T, U=U, V=V, W=W, g=g, h=h, i=i))
    def 원가(재, 노, 경):
        y = 요율
        A = 재 + D["간재"] + 0
        간 = xround(노 * y["간접노무비율 (%)"] / 100); B = 노 + 간
        r = {"1": 재, "A": A, "4": 노, "5": 간, "B": B, "6": 경}
        r["7"] = xround(B * y["산재보험료율 (%)"] / 100); r["8"] = xround(B * y["고용보험료율 (%)"] / 100)
        r["9"] = xround(노 * y["건강보험료율 (%)"] / 100); r["10"] = xround(노 * y["연금보험료율 (%)"] / 100)
        r["11"] = xround(r["9"] * y["노인장기요양보험료율 (%)"] / 100); r["12"] = xround(노 * y["퇴직공제부금비율 (%)"] / 100)
        r["13"] = xround((A + 노 + 경) * y["건설기계대여보증율 (%)"] / 100)
        r["14"] = xround(((A + 노) + D["관급"] / 1.1) * y["산업안전보건관리비율 (%)"] / 100)
        r["15"] = xround((A + 노 + 경) * y["환경보전비율 (%)"] / 100); r["16"] = 0
        r["17"] = xround((A + 노 + 경) * y["하도급대금보증수수료율 (%)"] / 100)
        r["18"] = xround(B * y["석면분담금율 (%)"] / 100); r["19"] = xround(B * y["임금채권부담금율 (%)"] / 100)
        r["20"] = xround((A + B) * y["기타경비율 (%)"] / 100)
        r["C"] = sum(r[k] for k in ("6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"))
        r["D"] = A + B + r["C"]; r["E"] = xround(r["D"] * y["일반관리비율 (%)"] / 100)
        r["F"] = xround((B + r["C"] + r["E"]) * y["이윤율 (%)"] / 100); r["H"] = r["D"] + r["E"] + r["F"]
        r["I"] = xround(r["H"] * y["부가가치세율 (%)"] / 100); r["J"] = r["H"] + r["I"]; r["L"] = r["J"] + D["관급"]
        return r
    재0 = sum(x["F"] * x["g"] for x in 줄); 노0 = sum(x["F"] * x["h"] for x in 줄); 경0 = sum(x["F"] * x["i"] for x in 줄)
    당 = 원가(재0, 노0, 경0)
    변 = 원가(재0 + sum(x["U"] for x in 줄), 노0 + sum(x["V"] for x in 줄), 경0 + sum(x["W"] for x in 줄))
    직 = sum(x["P"] for x in 줄)
    return dict(줄=줄, 당=당, 변=변, 직=직, 도증=변["J"] - 당["J"], 변경후=D["계약"] + 변["J"] - 당["J"])


def 대조(path, D):
    wb = load_workbook(path, data_only=True)
    s = wb["설정"]
    요율 = {}
    for r in range(1, s.max_row + 1):
        k = s.cell(r, 2).value
        if isinstance(k, str) and "(%)" in k and isinstance(s.cell(r, 3).value, (int, float)):
            요율[k.strip()] = s.cell(r, 3).value
    e = 정답(D, 요율)
    틀 = []
    셈 = [0]
    def 봄(뜻, a, b, tol=0.5):
        셈[0] += 1
        if a is None or b is None or abs(float(a) - float(b)) > tol:
            틀.append(f"{뜻}: 엑셀 {a} · 정답 {b}")
    z = wb["증감대비표"]
    for i, x in enumerate(e["줄"]):
        r = HEAD + i
        for col, k in ((11, "K"), (15, "O"), (16, "P"), (18, "R"), (19, "S"), (20, "T"), (21, "U"), (22, "V"), (23, "W")):
            봄(f"{x['code']} {k}", z.cell(r, col).value, x[k], 1e-6 if k == "K" else 0.5)
        if z.cell(r, 12).value != x["구"]:
            틀.append(f"{x['code']} 구분: 엑셀 {z.cell(r, 12).value} · 정답 {x['구']}")
    아래 = {}
    for r in range(HEAD + N_ITEM, HEAD + N_ITEM + 12):
        if z.cell(r, 14).value:
            아래[str(z.cell(r, 14).value)] = z.cell(r, 16).value
    봄("직접공사비 증감 합계", 아래.get("직접공사비 증감 합계"), e["직"])
    봄("계약금액 증감", 아래.get("계약금액 증감 (원가계산서 도급액)"), e["도증"])
    봄("변경 후 계약금액", 아래.get("변경 후 계약금액"), e["변경후"])
    w = wb["원가계산서"]
    for r in range(1, w.max_row + 1):
        sym = w.cell(r, 1).value
        if sym is None or str(sym) not in e["당"]:
            continue
        sym = str(sym)
        봄(f"원가 {sym} 당초", w.cell(r, 5).value, e["당"][sym], 0.5)
        봄(f"원가 {sym} 변경 후", w.cell(r, 6).value, e["변"][sym], 0.5)
    sub = wb["제출서식"]
    본 = {str(sub.cell(r, 2).value): sub.cell(r, 3).value for r in range(1, sub.max_row + 1) if sub.cell(r, 2).value}
    봄("제출서식 계약금액 증감", 본.get("계약금액 증감"), e["도증"])
    봄("제출서식 변경 후 계약금액", 본.get("변경 후 계약금액"), e["변경후"])
    봄("제출서식 직접공사비 증감", 본.get("직접공사비 증감"), e["직"])
    오류칸 = [f"{ws.title}!{c.coordinate}" for ws in wb for row in ws.iter_rows() for c in row
             if isinstance(c.value, str) and c.value.startswith("#") and c.value[1:3].isupper()]
    if 오류칸:
        틀.append("오류 칸 " + ", ".join(오류칸[:8]))
    return 셈[0], 틀, e


def main():
    if not os.path.exists(SRC):
        print("⛔ 엑셀이 없습니다:", SRC); sys.exit(2)
    전체틀 = 0
    for D in DATA:
        tmp = tempfile.mkdtemp(prefix="chgbook_")
        work = os.path.join(tmp, "시험.xlsx")
        shutil.copy(SRC, work)
        fill(work, D)
        out = recalc(work, tmp)
        n, 틀, e = 대조(out, D)
        print(f"■ {D['이름']} — {n}칸 대조 · 틀림 {len(틀)}")
        print(f"   직접공사비 증감 {e['직']:,.0f} · 원가 당초 도급액 {e['당']['J']:,.0f} → 변경 후 {e['변']['J']:,.0f} · 계약금액 증감 {e['도증']:,.0f} · 변경 후 계약금액 {e['변경후']:,.0f}")
        for t in 틀[:12]:
            print("   ✗", t)
        전체틀 += len(틀)
        shutil.rmtree(tmp, ignore_errors=True)
    print("✅ 모두 맞음" if 전체틀 == 0 else f"⛔ 틀림 {전체틀}")
    sys.exit(1 if 전체틀 else 0)


if __name__ == "__main__":
    main()
