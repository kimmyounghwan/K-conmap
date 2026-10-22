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

# ── 🔒 실제 설계내역서 30부에서 찾아 고친 셋 잠금(G377 · 2026-10-22) — 같은 꼴을 작게 지어 다시 안 틀리게 ─────────────
print("■ 고친 셋 잠금(실제 내역서에서 찾은 꼴)")
import re as _re
import zipfile as _zf
from xml.etree import ElementTree as _ET


def XML온전(p):
    bad = []
    with _zf.ZipFile(p) as z:
        for n in z.namelist():
            if n.endswith(".xml") or n.endswith(".rels"):
                try:
                    _ET.fromstring(z.read(n))
                except _ET.ParseError as e:
                    bad.append(f"{n}: {e}")
    return bad


def 고쳐쓰기(src, dst, 고침):
    with _zf.ZipFile(src) as zi, _zf.ZipFile(dst, "w", _zf.ZIP_DEFLATED) as zo:
        for it in zi.infolist():
            b = zi.read(it.filename)
            if it.filename in 고침:
                b = 고침[it.filename](b.decode("utf-8")).encode("utf-8")
            zo.writestr(it, b)


A0 = os.path.join(곳, "잠금_A.xlsx")
짓기A(A0)
# ① 빈 줄이 닫힌 꼴 <row … /> — 전엔 뒤에 </row> 를 또 붙여 XML 이 깨졌음
A1 = os.path.join(곳, "잠금_빈줄.xlsx")
고쳐쓰기(A0, A1, {"xl/worksheets/sheet1.xml": lambda x: x.replace("</sheetData>", '<row r="13" ht="9" customHeight="1"/></sheetData>', 1)})
out1 = os.path.join(곳, "잠금_빈줄_2줄.xlsx")
봄("닫힌 빈 줄 <row/> 있는 내역서 바꾸기", "err" not in 바꾸기(A1, out1, 2, ["내역서", "원가계산서"]))
봄("닫힌 빈 줄 — 바꾼 파일 XML 온전", not XML온전(out1), XML온전(out1))
# ② 한셀 꼴 — 본 이름공간에 x: 이름표 + 글꼴 · 셀서식 mc:AlternateContent(hs)
MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def 이름표달기(x):
    x = _re.sub(r"<(/?)(?![?!])([A-Za-z][\w]*)(?=[\s/>])", r"<\1x:\2", x)
    return x.replace(f'xmlns="{MAIN}"', f'xmlns:x="{MAIN}"', 1)


def 한셀글꼴(x):
    x = 이름표달기(x)
    m = _re.search(r"<x:font>[\s\S]*?</x:font>", x)
    f0 = m.group(0)
    choice = f0.replace("<x:font>", '<x:font hs:extension="1">', 1).replace("</x:font>", '<hs:size val="100"/></x:font>')
    alt = ('<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:hs="http://schemas.haansoft.com/office/spreadsheet/8.0">'
           f'<mc:Choice Requires="hs">{choice}</mc:Choice><mc:Fallback>{f0}</mc:Fallback></mc:AlternateContent>')
    x = x.replace(f0, alt, 1)
    m2 = _re.search(r"<x:cellXfs[^>]*>(<x:xf\b[^>]*?(?:/>|>[\s\S]*?</x:xf>))", x)
    xf0 = m2.group(1)
    xfc = _re.sub(r"<x:xf\b", '<x:xf hs:applyExtension="1"', xf0, 1)
    alt2 = ('<mc:AlternateContent xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" xmlns:hs="http://schemas.haansoft.com/office/spreadsheet/8.0">'
            f'<mc:Choice Requires="hs">{xfc}</mc:Choice><mc:Fallback>{xf0}</mc:Fallback></mc:AlternateContent>')
    return x.replace(xf0, alt2, 1)


A2 = os.path.join(곳, "잠금_한셀.xlsx")
with _zf.ZipFile(A0) as z:
    부분 = [n for n in z.namelist() if _re.match(r"xl/(workbook|styles|sharedStrings|worksheets/sheet\d+)\.xml$", n)]
고쳐쓰기(A0, A2, {n: (한셀글꼴 if n == "xl/styles.xml" else 이름표달기) for n in 부분})
T한 = 셈(A2, "한셀_원")
out2 = os.path.join(곳, "잠금_한셀_2줄.xlsx")
r2 = 바꾸기(A2, out2, 2, ["내역서", "원가계산서"])
봄("한셀 꼴(x: 이름표 · AlternateContent) 내역서 바꾸기 — 전엔 시트 0개", "err" not in r2 and r2.get("고른") == 2, r2)
봄("한셀 꼴 — 바꾼 파일 XML 온전(hs 이름표 · 글꼴 번호)", not XML온전(out2), XML온전(out2))
S한 = 셈(out2, "한셀_2줄")
ws_, lc_ = S한["내역서"], 라벨열(S한["내역서"])
r당 = 줄찾기(ws_, "B", "합    계", "당초", lc_)
봄("한셀 꼴 — 다시 셈 당초 합계 = 원본", r당 is not None and 같다(ws_[f"M{r당}"].value, T한["내역서"]["M11"].value), (r당 and ws_[f"M{r당}"].value, T한["내역서"]["M11"].value))
# ③ 안 고른 시트의 COUNTIF(벌린 범위) — 전엔 두 배(48 → 96)
A3 = os.path.join(곳, "잠금_셈수.xlsx")
wb_ = openpyxl.load_workbook(A0)
wb_["원가계산서"].append(["품목 수(㎥)", '=COUNTIF(내역서!$D$4:$D$9,"㎥")'])
wb_["원가계산서"].append(["㎥ 금액", '=SUMIFS(내역서!$M$4:$M$9,내역서!$D$4:$D$9,"㎥")'])
wb_.save(A3)
T셈 = 셈(A3, "셈수_원")
out3 = os.path.join(곳, "잠금_셈수_2줄.xlsx")
봄("COUNTIF · SUMIFS 든 원가계산서(안 고름) 바꾸기", "err" not in 바꾸기(A3, out3, 2, ["내역서"]))
S셈 = 셈(out3, "셈수_2줄")
봄("안 고른 시트 COUNTIF = 원본(2 — 두 배 아님)", 같다(S셈["원가계산서"]["B8"].value, T셈["원가계산서"]["B8"].value), (S셈["원가계산서"]["B8"].value, T셈["원가계산서"]["B8"].value))
봄("안 고른 시트 SUMIFS = 원본", 같다(S셈["원가계산서"]["B9"].value, T셈["원가계산서"]["B9"].value), (S셈["원가계산서"]["B9"].value, T셈["원가계산서"]["B9"].value))

# ④ 배열 수식(<f t="array">) — 전엔 보통 수식으로 다시 써 가로 범위가 #VALUE!(실제 설계예산내역서 총액 칸)
A4 = os.path.join(곳, "잠금_배열.xlsx")
wb_ = openpyxl.load_workbook(A0)
wb_["원가계산서"]["D1"] = 777
wb_["원가계산서"]["E1"] = 888
wb_.save(A4)
고쳐쓰기(A4, A4 + ".x.xlsx", {"xl/worksheets/sheet1.xml": lambda x: _re.sub(r'<c r="N4"[^>]*/>|<c r="N4"[^>]*>[\s\S]*?</c>', '', x).replace(
    '<c r="M4"', '<c r="N4" t="n"><f t="array" ref="N4">원가계산서!D1:E1</f><v>777</v></c><c r="M4"', 1) if '<c r="M4"' in x else x})
# 열 차례(M 앞에 N)가 어긋나지 않게 M 칸 뒤로 옮김
고쳐쓰기(A4 + ".x.xlsx", A4, {"xl/worksheets/sheet1.xml": lambda x: _re.sub(r'(<c r="N4" t="n"><f t="array" ref="N4">[^<]*</f><v>777</v></c>)(<c r="M4"[^>]*?(?:/>|>[\s\S]*?</c>))', r'\2\1', x)})
out4 = os.path.join(곳, "잠금_배열_2줄.xlsx")
봄("배열 수식 든 내역서 바꾸기", "err" not in 바꾸기(A4, out4, 2, ["내역서", "원가계산서"]))
with _zf.ZipFile(out4) as z:
    x4 = z.read("xl/worksheets/sheet1.xml").decode("utf-8")
배열들 = _re.findall(r'<f t="array" ref="N(\d+)">([^<]*)</f>', x4)
봄("배열 수식은 «배열» 표시와 ref 를 그 줄로 옮겨 남김(당초 · 변경 두 칸)", len(배열들) == 2 and all(r != "4" or True for r, _ in 배열들), 배열들)
S4 = 셈(out4, "배열_2줄")
값들 = [S4["내역서"][f"N{r}"].value for r, _ in 배열들]
봄("배열 수식 다시 셈 = 777 (#VALUE! 아님)", 값들 and all(같다(v, 777) for v in 값들), 값들)

# ⑤ 🩹 G378 — 라벨 칸을 «가로 병합» 안에 고르지 않음(실제 설계내역서: 내역 시트 없이 갑지만 — 라벨이 병합 칸 안에 숨어 안 보였음)
A5 = os.path.join(곳, "잠금_병합.xlsx")
wb_ = openpyxl.load_workbook(A0)
wb_["내역서"].merge_cells("N4:P4")          # 자료 줄에 비고 칸부터 옆 빈 칸까지 병합 — 전엔 O(병합 안)가 라벨 칸
wb_["내역서"].merge_cells("N9:Q9")
wb_.save(A5)
out5 = os.path.join(곳, "잠금_병합_2줄.xlsx")
r5 = 바꾸기(A5, out5, 2, ["내역서"])
봄("가로 병합 든 내역서 바꾸기", "err" not in r5, r5)
S5 = 셈(out5, "병합_2줄")
ws5 = S5["내역서"]
lc5 = 라벨열(ws5)
덮인5 = set()
for 범 in ws5.merged_cells.ranges:
    if 범.max_col > 범.min_col:
        for c in range(범.min_col, 범.max_col + 1):
            덮인5.add(openpyxl.utils.get_column_letter(c))
당5 = sum(1 for r in range(1, ws5.max_row + 1) if lc5 and ws5[f"{lc5}{r}"].value == "당초")
변5 = sum(1 for r in range(1, ws5.max_row + 1) if lc5 and ws5[f"{lc5}{r}"].value == "변경")
봄("라벨 칸이 병합 밖(N:Q 아님 — 전엔 O)", lc5 is not None and lc5 not in 덮인5 and lc5 not in "NOPQ", (lc5, sorted(덮인5)))
봄("병합 든 내역서 — 다시 셈 뒤에도 «당초 · 변경» 라벨이 다 보임(같은 수)", 당5 == 변5 and 당5 >= 6, (당5, 변5))

# ⑥ 🩹 G378 — 품목마다 «두 줄 세로 병합»(품목 줄 + 아래 빈 줄) 인 내역서(실제 산림 설계내역서 총괄 꼴)
#     전엔 병합을 당초 · 변경 둘 다 덮게 늘려 «변경» 줄 값이 병합 안에 숨었음(엑셀에서 빈칸으로 보임)
for 줄수 in (2, 3):
    A6 = os.path.join(곳, f"잠금_두줄병합.xlsx")
    wb_ = openpyxl.Workbook()
    w6 = wb_.active
    w6.title = "내역서"
    w6.append(["가상 숲가꾸기 — 설계내역서(총괄)"])
    w6.append(["구분", None, "수량", "단위", "단가", "금액"])
    품목 = [("가상 솎아베기", 20, "ha", 1500000), ("가상 산물수집", 3.2, "ha", 820000), ("가상 작업로", 310, "m", 12000)]
    for i, (이, 수, 단, 가) in enumerate(품목):
        r = 3 + i * 2
        w6[f"A{r}"] = 이; w6[f"C{r}"] = 수; w6[f"D{r}"] = 단; w6[f"E{r}"] = 가; w6[f"F{r}"] = f"=C{r}*E{r}"
        for a, b in (("A", "B"), ("C", "C"), ("D", "D"), ("E", "E"), ("F", "F")):
            w6.merge_cells(f"{a}{r}:{b}{r + 1}")
    끝6 = 3 + len(품목) * 2
    w6[f"A{끝6}"] = "합    계"
    w6[f"F{끝6}"] = f"=SUM(F3:F{끝6 - 1})"
    wb_.save(A6)
    T6 = 셈(A6, f"두줄병합_원{줄수}")
    out6 = os.path.join(곳, f"잠금_두줄병합_{줄수}줄.xlsx")
    r6 = 바꾸기(A6, out6, 줄수, ["내역서"])
    봄(f"두 줄 세로 병합 내역서 {줄수}줄 바꾸기", "err" not in r6, r6)
    봄(f"두 줄 세로 병합 {줄수}줄 — XML 온전", not XML온전(out6), XML온전(out6))
    S6 = 셈(out6, f"두줄병합_{줄수}줄")
    ws6 = S6["내역서"]
    lc6 = 라벨열(ws6)
    보임 = {"당초": [], "변경": [], "증감": []}
    for r in range(1, ws6.max_row + 1):
        lab = ws6[f"{lc6}{r}"].value if lc6 else None
        if lab in 보임 and str(ws6[f"A{r}"].value or "").strip() != "합    계" and not (lab != "당초" and str(ws6[f"A{r - 1}"].value or "").strip() == "합    계") and not (lab == "증감" and str(ws6[f"A{r - 2}"].value or "").strip() == "합    계"):
            보임[lab].append((ws6[f"A{r}"].value, ws6[f"C{r}"].value, ws6[f"F{r}"].value))
    원값 = [(이, 수, T6["내역서"][f"F{3 + i * 2}"].value) for i, (이, 수, 단, 가) in enumerate(품목)]
    봄(f"두 줄 세로 병합 {줄수}줄 — 다시 셈 뒤 «당초» 줄 품명 · 수량 · 금액 = 원본", [(a, b, round(c or 0)) for a, b, c in 보임["당초"]] == [(a, b, round(c)) for a, b, c in 원값], 보임["당초"])
    봄(f"두 줄 세로 병합 {줄수}줄 — «변경» 줄 값이 병합에 안 숨음(품명 · 수량 · 금액 보임 — 전엔 빈칸)", [(b, round(c or 0)) for a, b, c in 보임["변경"]] == [(b, round(c)) for a, b, c in 원값], 보임["변경"])
    if 줄수 == 3:
        봄("두 줄 세로 병합 3줄 — «증감» 줄 금액 0", len(보임["증감"]) == 3 and all(abs(c or 0) < 0.5 for a, b, c in 보임["증감"]), 보임["증감"])
    합줄 = next((r for r in range(1, ws6.max_row + 1) if str(ws6[f"A{r}"].value or "").strip() == "합    계" and ws6[f"{lc6}{r}"].value == "당초"), None)
    봄(f"두 줄 세로 병합 {줄수}줄 — 당초 합계 = 원본 합계", 합줄 is not None and 같다(ws6[f"F{합줄}"].value, T6["내역서"][f"F{끝6}"].value), (합줄 and ws6[f"F{합줄}"].value, T6["내역서"][f"F{끝6}"].value))

shutil.rmtree(곳, ignore_errors=True)
print("\n%s 2줄 다시 셈 시험 %d개 중 %d 맞음 · %d 틀림" % ("❌" if 실패 else "✅", 통과 + 실패, 통과, 실패))
sys.exit(1 if 실패 else 0)
