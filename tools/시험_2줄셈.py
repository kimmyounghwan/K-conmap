# -*- coding: utf-8 -*-
"""🧪 설계변경 2줄 자동변환(lib/xlsx2line.js) — 가상 내역서 세 벌을 «엑셀처럼 다시 셈» 해서 숫자로 맞춰 봅니다 (2026-10-22 G377)
   python3 tools/시험_2줄셈.py      (LibreOffice · node 필요 — 클라우드 시험장)

   A 단순 꼴 2줄 — 내역서(공종 소계 · 합계) + 원가계산서(=내역서!G12 · 요율) 같이 벌림
   B 3줄(증감) — 머리 두 줄(병합 «재료비» / «단가 · 금액») · 식 안 SUM(공구손료 = 노무비 합 × 3%) · 띄어쓴 시트 이름('공종별 내역서'!M13)
   C 두 내역 시트(토목 · 전기) + 집계(=토목!$M$9+전기!$M$7) · 인쇄 영역 · 조건부 서식 · 틀 고정 · 숫자 꼴이 남는지
   셈: ① 바꾼 파일을 LibreOffice 로 «캐시 없이» 다시 셈 → 당초 = 원본 · 변경 = 원본(수량 그대로) · 증감 0
       ② 바꾼 파일의 «변경» 줄 수량 하나를 고쳐 다시 셈 = 원본에서 같은 수량을 고쳐 다시 셈한 값(변경) · 당초는 그대로 · 증감 = 차이
   공사명 · 기관은 모두 가상입니다.
"""
import os
import sys
import json
import shutil
import subprocess
import tempfile

import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.formatting.rule import CellIsRule

여기 = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, 여기)
from checkbook import recalc  # noqa: E402  LibreOffice «항상 다시 계산» 프로필

통과 = 실패 = 0


def 봄(무엇, ok, 값=None):
    global 통과, 실패
    if ok:
        통과 += 1
        print("  ✓", 무엇)
    else:
        실패 += 1
        print("  ✗", 무엇, "" if 값 is None else str(값)[:400])


곳 = tempfile.mkdtemp(prefix="시험2줄셈_")
변환기 = os.path.join(곳, "conv.mjs")
open(변환기, "w", encoding="utf-8").write("""
import { readFileSync, writeFileSync } from 'node:fs'
import { analyze, convert, suggestLabelCol } from '%s'
const [,, src, dst, lines, names] = process.argv
const b0 = readFileSync(src); const buf = b0.buffer.slice(b0.byteOffset, b0.byteOffset + b0.byteLength)
const b = analyze(buf)
const 고를 = names.split(',')
const sheets = b.sheets.filter((s) => 고를.includes(s.name))
  .map((s) => ({ path: s.path, startRow: s.guessStart, endRow: s.guessEnd, labelCol: suggestLabelCol(b.zip, s.path, s.guessStart, s.guessEnd, 16) }))
const res = convert(buf, { sheets, lines: +lines, color: 'blackred', diffFormula: true, labels: ['당초', '변경', '증감'] })
writeFileSync(dst, res.data)
console.log(JSON.stringify({ 고른: sheets.length, warns: res.report.warns }))
""" % os.path.join(여기, "..", "web", "src", "lib", "xlsx2line.js").replace("\\", "/"))


def 바꾸기(src, dst, lines, names):
    r = subprocess.run(["node", 변환기, src, dst, str(lines), ",".join(names)], capture_output=True, text=True, timeout=120)
    if r.returncode != 0:
        return {"err": (r.stderr or r.stdout)[-400:]}
    return json.loads(r.stdout.strip().splitlines()[-1])


def 셈(path, tag):
    d = os.path.join(곳, "lo_" + tag)
    os.makedirs(d, exist_ok=True)
    return openpyxl.load_workbook(recalc(path, d), data_only=True)


def 라벨열(ws):
    for row in ws.iter_rows(min_row=1, max_row=min(ws.max_row, 80)):
        for c in row:
            if c.value == "변경":
                return c.column_letter
    return None


def 줄찾기(ws, 열이름, 이름, 라벨, 라벨칸):
    """품명 칸(열이름)이 «이름» 인 줄 가운데 라벨 칸이 «라벨» 인 행 번호 — 변경 · 증감 줄은 품명이 비어 있을 수 있어 바로 위 당초 줄에서 셉니다"""
    for r in range(1, ws.max_row + 1):
        if str(ws[f"{열이름}{r}"].value or "").strip() == 이름:
            for k in range(0, 3):
                if str(ws[f"{라벨칸}{r + k}"].value or "") == 라벨:
                    return r + k
    return None


def 같다(a, b):
    return isinstance(a, (int, float)) and isinstance(b, (int, float)) and abs(a - b) < 0.5


def 오류칸(wb):
    return [f"{ws.title}!{c.coordinate}={c.value}" for ws in wb.worksheets for row in ws.iter_rows() for c in row
            if isinstance(c.value, str) and c.value.startswith("#") and c.value.rstrip("!?/0").upper() in ("#REF", "#VALUE", "#NAME", "#DIV", "#N/A", "#NUM", "#NULL")]


# ── 가상 내역서 짓기 ────────────────────────────────────────────
def 내역줄(ws, r, 이름, 규격, 단위, 수량, 재, 노, 경):
    ws.append([None, 이름, 규격, 단위, 수량, 재, f"=ROUNDDOWN(E{r}*F{r},0)", 노, f"=ROUNDDOWN(E{r}*H{r},0)", 경, f"=ROUNDDOWN(E{r}*J{r},0)",
               f"=F{r}+H{r}+J{r}", f"=G{r}+I{r}+K{r}", None])


def 소계줄(ws, r, a, b, 이름="소    계"):
    ws.append([None, 이름, None, None, None, None, f"=SUM(G{a}:G{b})", None, f"=SUM(I{a}:I{b})", None, f"=SUM(K{a}:K{b})", None, f"=SUM(M{a}:M{b})", None])


머리 = ["번호", "품    명", "규    격", "단위", "수량", "재료비 단가", "재료비 금액", "노무비 단가", "노무비 금액", "경비 단가", "경비 금액", "합계 단가", "합계 금액", "비고"]


def 짓기A(p):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "내역서"
    ws.append(["가상 마을안길 포장공사 — 내역서"])
    ws.append(머리)
    ws.append(["1.", "토    공"])                                         # 3
    내역줄(ws, 4, "터파기", "토사, 백호 0.7㎥", "㎥", 120, 0, 1500, 900)
    내역줄(ws, 5, "되메우기", "토사, 다짐", "㎥", 80, 0, 2100, 600)
    소계줄(ws, 6, 4, 5)                                                     # 6
    ws.append(["2.", "포 장 공"])                                           # 7
    내역줄(ws, 8, "아스콘 표층", "#78 밀입도, t=5cm", "㎡", 400, 9800, 2100, 800)
    내역줄(ws, 9, "택코팅", "RSC-4", "㎡", 400, 300, 120, 40)
    소계줄(ws, 10, 8, 9)                                                    # 10
    ws.append([None, "합    계", None, None, None, None, "=G6+G10", None, "=I6+I10", None, "=K6+K10", None, "=M6+M10", None])   # 11
    for r in range(2, 12):
        for c in "FGHIJKLM":
            ws[f"{c}{r}"].number_format = "#,##0"
    w2 = wb.create_sheet("원가계산서")
    w2.append(["비    목", "금    액"])
    w2.append(["재 료 비", "=내역서!G11"])
    w2.append(["노 무 비", "=내역서!I11"])
    w2.append(["경    비", "=내역서!K11"])
    w2.append(["산재보험료", "=ROUNDDOWN(B3*3.56%,0)"])
    w2.append(["일반관리비", "=ROUNDDOWN((B2+B3+B4)*6%,0)"])
    w2.append(["총 원 가", "=SUM(B2:B6)"])
    wb.save(p)


def 짓기B(p):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "공종별 내역서"
    ws.append(["가상 체육관 바닥 보수공사 — 공종별 내역서"])
    ws.append(["번호", "품    명", "규    격", "단위", "수량", "재  료  비", None, "노  무  비", None, "경    비", None, "합    계", None, "비고"])
    ws.append([None, None, None, None, None, "단  가", "금  액", "단  가", "금  액", "단  가", "금  액", "단  가", "금  액", None])
    for a, b in (("F2", "G2"), ("H2", "I2"), ("J2", "K2"), ("L2", "M2")):
        ws.merge_cells(f"{a}:{b}")
    for c in ("A", "B", "C", "D", "E", "N"):
        ws.merge_cells(f"{c}2:{c}3")
    ws["F2"].alignment = Alignment(horizontal="center")
    ws.append(["1.", "바닥 공사"])                                           # 4
    내역줄(ws, 5, "기존 마루 철거", "인력", "㎡", 620, 0, 8400, 300)
    내역줄(ws, 6, "합판 깔기", "t=12mm, 2겹", "㎡", 620, 14200, 9100, 0)
    내역줄(ws, 7, "스포츠 마루", "단풍나무, t=22mm", "㎡", 620, 61000, 15800, 0)
    내역줄(ws, 8, "라인 도장", "수성, 3색", "m", 410, 1200, 2600, 0)
    # 식 안 SUM — 공구손료 = 노무비 합 × 3% (경비 단가 칸)
    ws.append([None, "공구손료", "노무비의 3%", "식", 1, 0, "=ROUNDDOWN(E9*F9,0)", 0, "=ROUNDDOWN(E9*H9,0)", "=ROUNDDOWN(SUM(I5:I8)*3%,0)",
               "=ROUNDDOWN(E9*J9,0)", "=F9+H9+J9", "=G9+I9+K9", None])         # 9
    소계줄(ws, 10, 5, 9)                                                    # 10
    ws.append(["2.", "벽체 공사"])                                           # 11
    내역줄(ws, 12, "흡음판 붙이기", "PET 9mm", "㎡", 240, 18500, 7600, 0)
    소계줄(ws, 13, 12, 12)                                                  # 13
    ws.append([None, "합    계", None, None, None, None, "=G10+G13", None, "=I10+I13", None, "=K10+K13", None, "=M10+M13", None])   # 14
    w2 = wb.create_sheet("원가 계산서")
    w2.append(["비    목", "금    액"])
    w2.append(["재 료 비", "='공종별 내역서'!G14"])
    w2.append(["노 무 비", "='공종별 내역서'!I14"])
    w2.append(["경    비", "='공종별 내역서'!K14"])
    w2.append(["고용보험료", "=ROUNDDOWN(B3*1.15%,0)"])
    w2.append(["총 원 가", "=SUM(B2:B5)"])
    wb.save(p)


def 짓기C(p):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "토목"
    ws.append(["가상 소하천 정비공사 — 토목"])
    ws.append(머리)
    ws.append(["1.", "호안공"])                                              # 3
    내역줄(ws, 4, "블록 쌓기", "식생블록", "㎡", 860, 32000, 11800, 2400)
    내역줄(ws, 5, "뒤채움", "잡석", "㎥", 310, 21500, 6400, 3900)
    내역줄(ws, 6, "기초 콘크리트", "18-18-80", "㎥", 96, 79800, 31200, 2100)
    소계줄(ws, 7, 4, 6)                                                     # 7
    ws.append(["2.", "부대공"])                                              # 8
    내역줄(ws, 9, "안전난간", "SUS, H=1.2m", "m", 140, 98000, 24000, 0)
    소계줄(ws, 10, 9, 9)                                                    # 10
    ws.append([None, "합    계", None, None, None, None, "=G7+G10", None, "=I7+I10", None, "=K7+K10", None, "=M7+M10", None])   # 11
    ws.freeze_panes = "A3"
    ws.print_area = "A1:N11"
    for r in range(2, 12):
        for c in "FGHIJKLM":
            ws[f"{c}{r}"].number_format = "#,##0"
    w2 = wb.create_sheet("전기")
    w2.append(["가상 소하천 정비공사 — 전기"])
    w2.append(머리)
    내역줄(w2, 3, "LED 보안등", "30W, 폴 6m", "등", 18, 1150000, 186000, 21000)
    내역줄(w2, 4, "전선관 배관", "CD 28C", "m", 520, 1900, 3800, 0)
    내역줄(w2, 5, "전선", "F-CV 6㎟/2C", "m", 560, 2600, 1700, 0)
    소계줄(w2, 6, 3, 5)                                                     # 6
    w2.conditional_formatting.add("M3:M6", CellIsRule(operator="greaterThan", formula=["10000000"], fill=PatternFill("solid", fgColor="FFC7CE")))
    w3 = wb.create_sheet("집계")
    w3.append(["공    종", "금    액"])
    w3.append(["토    목", "=토목!$M$11"])
    w3.append(["전    기", "=전기!$M$6"])
    w3.append(["합    계", "=B2+B3"])
    wb.save(p)


def 매크로꼴로(src, dst):
    """xlsx 를 «매크로 사용 통합 문서» 종류(.xlsm)로 — 안의 통합 문서 종류만 바꿉니다(매크로 본문은 없음 · 화면 시험용)"""
    import zipfile
    with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            b = zi.read(it.filename)
            if it.filename == "[Content_Types].xml":
                b = b.replace(b"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml",
                              b"application/vnd.ms-excel.sheet.macroEnabled.main+xml")
            zo.writestr(it, b)


if os.environ.get("TWOLINE_FILES"):          # 화면 시험(tools/시험_2줄화면.mjs)이 쓸 가상 내역서만 짓고 끝
    d = os.environ["TWOLINE_FILES"]
    os.makedirs(d, exist_ok=True)
    짓기A(os.path.join(d, "가상A_마을안길.xlsx"))
    짓기B(os.path.join(d, "가상B_체육관바닥.xlsx"))
    짓기C(os.path.join(d, "가상C_소하천.xlsx"))
    매크로꼴로(os.path.join(d, "가상C_소하천.xlsx"), os.path.join(d, "가상C_소하천.xlsm"))
    print("지음", sorted(os.listdir(d)))
    sys.exit(0)


def 원본셈(짓기, p, tag, 고칠=None):
    짓기(p)
    if 고칠:
        wb = openpyxl.load_workbook(p)
        for sh, ref, v in 고칠:
            wb[sh][ref] = v
        wb.save(p)
    return 셈(p, tag)


def 한벌(이름, 짓기, lines, 고를, 내역시트, 고칠줄, 새수량, 맞출):
    """고칠줄 = (시트, 품명, 원본 수량 칸) · 맞출 = [(시트, 이름 칸 열, 이름, 값 열)] — 당초 · 변경 · 증감 줄로 비교"""
    print(f"■ {이름} ({lines}줄 · 시트 {', '.join(고를)})")
    원 = os.path.join(곳, 이름 + "_원.xlsx")
    T0 = 원본셈(짓기, 원, 이름 + "_t0")
    T1 = 원본셈(짓기, os.path.join(곳, 이름 + "_원2.xlsx"), 이름 + "_t1", [(고칠줄[0], 고칠줄[2], 새수량)])
    봄(f"{이름} 원본 셈 오류 없음", not 오류칸(T0), 오류칸(T0)[:3])
    out = os.path.join(곳, 이름 + "_2줄.xlsx")
    rep = 바꾸기(원, out, lines, 고를)
    봄(f"{이름} 바꾸기 됨", "err" not in rep, rep)
    if "err" in rep:
        return None
    봄(f"{이름} 검산 경고 없음(못 고친 수식 0)", not rep.get("warns"), rep.get("warns"))
    S0 = 셈(out, 이름 + "_s0")
    봄(f"{이름} 바꾼 파일 다시 셈 오류 없음", not 오류칸(S0), 오류칸(S0)[:3])
    # 바꾼 파일에서 «변경» 줄 수량 고치기
    w = openpyxl.load_workbook(out)
    ws = w[고칠줄[0]]
    lc = 라벨열(ws)
    봄(f"{이름} 라벨 열(당초 · 변경{' · 증감' if lines == 3 else ''}) 있음", lc is not None)
    r변 = 줄찾기(ws, "B", 고칠줄[1], "변경", lc)
    봄(f"{이름} «{고칠줄[1]}» 변경 줄 찾음", r변 is not None)
    ws[f"E{r변}"] = 새수량
    out2 = os.path.join(곳, 이름 + "_2줄_고침.xlsx")
    w.save(out2)
    S1 = 셈(out2, 이름 + "_s1")
    for sh, 열, 품, 값열 in 맞출:
        a, b, c, d = T0[sh], T1[sh], S0[sh], S1[sh]
        원줄 = next((r for r in range(1, a.max_row + 1) if str(a[f"{열}{r}"].value or "").strip() == 품), None)
        lc_ = 라벨열(c)
        당, 변 = 줄찾기(c, 열, 품, "당초", lc_), 줄찾기(c, 열, 품, "변경", lc_)
        증 = 줄찾기(c, 열, 품, "증감", lc_) if lines == 3 else None
        v0, v1 = a[f"{값열}{원줄}"].value, b[f"{값열}{원줄}"].value
        봄(f"{이름} {sh} «{품}» 당초 = 원본 {v0:,.0f}", 같다(c[f"{값열}{당}"].value, v0), (c[f"{값열}{당}"].value, v0))
        봄(f"{이름} {sh} «{품}» 변경(수량 그대로) = 원본", 같다(c[f"{값열}{변}"].value, v0), (c[f"{값열}{변}"].value, v0))
        if 증:
            봄(f"{이름} {sh} «{품}» 증감(수량 그대로) = 0", 같다(c[f"{값열}{증}"].value or 0, 0), c[f"{값열}{증}"].value)
        봄(f"{이름} {sh} «{품}» 고친 뒤 변경 = 원본에서 고쳐 셈 {v1:,.0f}", 같다(d[f"{값열}{변}"].value, v1), (d[f"{값열}{변}"].value, v1))
        봄(f"{이름} {sh} «{품}» 고친 뒤 당초는 그대로", 같다(d[f"{값열}{당}"].value, v0), (d[f"{값열}{당}"].value, v0))
        if 증:
            봄(f"{이름} {sh} «{품}» 고친 뒤 증감 = {v1 - v0:,.0f}", 같다(d[f"{값열}{증}"].value, v1 - v0), d[f"{값열}{증}"].value)
    return out, S0


# A
한벌("A", 짓기A, 2, ["내역서", "원가계산서"], "내역서", ("내역서", "터파기", "E4"), 150,
     [("내역서", "B", "터파기", "M"), ("내역서", "B", "소    계", "M"), ("내역서", "B", "합    계", "M"),
      ("원가계산서", "A", "노 무 비", "B"), ("원가계산서", "A", "산재보험료", "B"), ("원가계산서", "A", "총 원 가", "B")])
# B
rB = 한벌("B", 짓기B, 3, ["공종별 내역서", "원가 계산서"], "공종별 내역서", ("공종별 내역서", "기존 마루 철거", "E5"), 700,
          [("공종별 내역서", "B", "기존 마루 철거", "M"), ("공종별 내역서", "B", "공구손료", "M"), ("공종별 내역서", "B", "합    계", "M"),
           ("원가 계산서", "A", "노 무 비", "B"), ("원가 계산서", "A", "총 원 가", "B")])
if rB:
    wb = openpyxl.load_workbook(rB[0])
    ws = wb["공종별 내역서"]
    병합 = [str(m) for m in ws.merged_cells.ranges]
    봄("B 머리 병합(재료비 F2:G2 · 번호 A2:A3)은 그대로 · 머리는 벌리지 않음", "F2:G2" in 병합 and "A2:A3" in 병합, 병합[:12])
    빨강 = [c for row in ws.iter_rows(min_row=4) for c in row if c.font and c.font.color is not None and c.font.color.rgb and str(c.font.color.rgb).upper() == "FFC00000"]
    봄("B 변경 줄은 붉은 글씨(FFC00000)", len(빨강) > 0, len(빨강))
# C
rC = 한벌("C", 짓기C, 2, ["토목", "전기", "집계"], "토목", ("토목", "블록 쌓기", "E4"), 900,
          [("토목", "B", "블록 쌓기", "M"), ("토목", "B", "합    계", "M"), ("전기", "B", "소    계", "M"),
           ("집계", "A", "토    목", "B"), ("집계", "A", "합    계", "B")])
if rC:
    wb = openpyxl.load_workbook(rC[0])
    t, e = wb["토목"], wb["전기"]
    봄("C 틀 고정 그대로(A3)", t.freeze_panes == "A3", t.freeze_panes)
    pa = str(t.print_area or "")
    봄("C 인쇄 영역이 늘어난 줄까지 따라감(A1:N…)", pa.replace("$", "").startswith("'토목'!A1:N") or pa.replace("$", "").startswith("토목!A1:N"), pa)
    try:
        끝 = int(pa.replace("$", "").split(":N")[-1])
    except Exception:
        끝 = 0
    봄("C 인쇄 영역 끝 행 ≥ 늘어난 합계 행", 끝 >= max(r for r in range(1, t.max_row + 1) if str(t[f'B{r}'].value or '').strip() == '합    계'), (pa, t.max_row))
    봄("C 조건부 서식 남음(전기)", len(e.conditional_formatting) > 0)
    봄("C 숫자 꼴 #,##0 남음", t["M4"].number_format == "#,##0", t["M4"].number_format)

shutil.rmtree(곳, ignore_errors=True)
print("\n%s 2줄 다시 셈 시험 %d개 중 %d 맞음 · %d 틀림" % ("❌" if 실패 else "✅", 통과 + 실패, 통과, 실패))
sys.exit(1 if 실패 else 0)
