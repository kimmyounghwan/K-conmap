# -*- coding: utf-8 -*-
"""naeyeokgen.py — 공내역서 «한 벌» (시트 11장 · 수식 연동)"""
import os
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT  = os.path.join(ROOT, "web", "public", "forms")
KF   = "맑은 고딕"
THIN = Side(style="thin", color="BFC7D5")
BOX  = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
HEAD = PatternFill("solid", fgColor="EEF3FB")
LBL  = PatternFill("solid", fgColor="F6F8FC")
INP  = PatternFill("solid", fgColor="FFFDE7")   # 채우는 칸
CALC = PatternFill("solid", fgColor="F2F6F2")   # 자동 계산 칸
BLUE = Font(name=KF, size=10, color="1A56DB")
N_ROWS = 60          # 내역서·일위대가 등 기본 줄 수

def F(sz=10, b=False, c="000000"): return Font(name=KF, size=sz, bold=b, color=c)
def A(h="center", w=False): return Alignment(horizontal=h, vertical="center", wrap_text=w)

def title(ws, cols, text, sub=""):
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=cols)
    c = ws.cell(row=1, column=1, value="  K-건설맵  |  k-conmap.com   무료 건설 서식")
    c.font = F(9.5, True, "1A56DB"); c.alignment = A("left")
    ws.row_dimensions[1].height = 18
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=cols)
    c = ws.cell(row=2, column=2 if cols > 1 else 1)
    c = ws.cell(row=2, column=1, value=text)
    c.font = F(17, True); c.alignment = A("center"); ws.row_dimensions[2].height = 32
    if sub:
        ws.merge_cells(start_row=3, start_column=1, end_row=3, end_column=cols)
        c = ws.cell(row=3, column=1, value=sub); c.font = F(9, False, "666666"); c.alignment = A("center")
    return 5 if sub else 4

def head(ws, r, cols, names, widths):
    for i, w in enumerate(widths, start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for i, n in enumerate(names, start=1):
        c = ws.cell(row=r, column=i, value=n)
        c.font = F(10, True); c.fill = HEAD; c.border = BOX; c.alignment = A("center", True)
    ws.row_dimensions[r].height = 26
    return r + 1

def grid(ws, r0, n, cols, fills=None, fmt=None):
    for r in range(r0, r0 + n):
        for c in range(1, cols + 1):
            cell = ws.cell(row=r, column=c)
            cell.border = BOX; cell.font = F(10)
            cell.alignment = A("left" if c in (2, 3) else "center", True)
            if fills and c in fills: cell.fill = fills[c]
            if fmt and c in fmt: cell.number_format = fmt[c]
        ws.row_dimensions[r].height = 20
    return r0 + n

def note(ws, r, cols, lines):
    for i, t in enumerate(lines):
        ws.merge_cells(start_row=r + i, start_column=1, end_row=r + i, end_column=cols)
        c = ws.cell(row=r + i, column=1, value=t)
        c.font = F(9, False, "555555"); c.alignment = A("left")
    return r + len(lines)

MONEY = '#,##0'
RATE  = '0.00'
QTY   = '#,##0.###'

def build():
    wb = Workbook(); wb.remove(wb.active)

    # ── 1. 표지 ────────────────────────────────────────────
    ws = wb.create_sheet("표지")
    for i, w in enumerate([4, 22, 46, 4], start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.merge_cells("B3:C3"); c = ws["B3"]; c.value = "공  내  역  서"
    c.font = F(28, True); c.alignment = A("center"); ws.row_dimensions[3].height = 56
    ws.merge_cells("B4:C4"); c = ws["B4"]; c.value = "(단가 미기재 · 낙찰자가 단가를 채워 넣는 내역서)"
    c.font = F(10, False, "666666"); c.alignment = A("center")
    r = 7
    for lab in ["공  사  명", "발 주 기 관", "공 사 위 치", "계 약 방 법",
                "공        기", "작 성 일 자", "업        체", "현장대리인"]:
        a = ws.cell(row=r, column=2, value="  " + lab); a.font = F(11, True); a.fill = LBL; a.border = BOX
        b = ws.cell(row=r, column=3); b.fill = INP; b.border = BOX
        ws.row_dimensions[r].height = 28; r += 1
    r += 2
    note(ws, r, 4, [
        "■ 쓰는 순서",
        "   ① 「수량산출서」에 산출근거와 물량을 적습니다.",
        "   ② 「자재단가·노임단가·기계경비」에 단가를 채웁니다.",
        "   ③ 「일위대가」에 품을 넣으면 합계가 자동으로 나옵니다.",
        "   ④ 「내역서」에 수량과 단가를 넣으면 금액·총괄표·원가계산서까지 자동으로 올라갑니다.",
        "",
        "■ 칸 색깔",
        "   연노랑 = 사람이 채우는 칸        연회색 = 수식이 자동으로 채우는 칸 (건드리지 마십시오)",
        "",
        "※ 발주처가 준 공내역서가 있으면 그것을 쓰십시오. 이 서식은 없을 때 쓰는 것입니다.",
        "※ 양식 제공 : K-건설맵  k-conmap.com  —  공공 입찰 투찰금액 계산 · 개찰 결과 무료",
    ])
    ws.sheet_view.showGridLines = False

    # ── 2. 원가계산서 ──────────────────────────────────────
    ws = wb.create_sheet("원가계산서")
    r = title(ws, 5, "원 가 계 산 서", "내역서총괄표에서 자동으로 올라옵니다 · 요율만 채우십시오")
    r = head(ws, r, 5, ["비        목", "구분", "금        액", "요율(%)", "산 출 근 거"], [26, 8, 20, 10, 34])
    top = r
    rows = [
        ("직 접 재 료 비", "①", "=내역서총괄표!H6", "", ""),
        ("간 접 재 료 비", "②", None, "", "직접재료비 × 요율"),
        ("작업설·부산물(△)", "③", None, "", ""),
        ("재  료  비  계", "A", "=SUM(C{0}:C{2})".format(top, 0, top + 2), "", "( ① + ② + ③ )"),
        ("직 접 노 무 비", "④", "=내역서총괄표!G6", "", ""),
        ("간 접 노 무 비", "⑤", None, "", "직접노무비 × 요율"),
        ("노  무  비  계", "B", "=C{0}+C{1}".format(top + 4, top + 5), "", "( ④ + ⑤ )"),
        ("직 접 경 비", "⑥", "=내역서총괄표!I6", "", ""),
        ("산업안전보건관리비", "⑦", None, "", "(재료비+직접노무비) × 요율"),
        ("기 타 경 비", "⑧", None, "", "(재료비+노무비) × 요율"),
        ("환 경 보 전 비", "⑨", None, "", "(재료비+노무비+기타경비) × 요율"),
        ("경  비  계", "C", "=SUM(C{0}:C{1})".format(top + 7, top + 10), "", "( ⑥ ~ ⑨ )"),
        ("순  공  사  비", "D", "=C{0}+C{1}+C{2}".format(top + 3, top + 6, top + 11), "", "( A + B + C )"),
        ("일 반 관 리 비", "⑩", None, "", "순공사비 × 요율"),
        ("이            윤", "⑪", None, "", "(노무비+경비+일반관리비) × 요율"),
        ("총  원  가", "E", "=C{0}+C{1}+C{2}".format(top + 12, top + 13, top + 14), "", "( D + ⑩ + ⑪ )"),
        ("부 가 가 치 세", "⑫", "=ROUND(C{0}*0.1,0)".format(top + 15), "10", "총원가 × 10%"),
        ("도  급  금  액", "F", "=C{0}+C{1}".format(top + 15, top + 16), "", "( E + ⑫ )"),
    ]
    for i, (nm, gb, formula, rate, basis) in enumerate(rows):
        rr = top + i
        a = ws.cell(row=rr, column=1, value="  " + nm)
        a.font = F(10, gb in "ABCDEF")
        if gb in "ABCDEF": a.fill = LBL
        ws.cell(row=rr, column=2, value=gb).font = F(10, True)
        c = ws.cell(row=rr, column=3)
        if formula: c.value = formula; c.fill = CALC
        else: c.fill = INP
        c.number_format = MONEY
        d = ws.cell(row=rr, column=4, value=(rate or None)); d.fill = INP if not rate else CALC
        d.number_format = RATE
        ws.cell(row=rr, column=5, value=basis).font = F(9, False, "666666")
        for cc in range(1, 6):
            x = ws.cell(row=rr, column=cc); x.border = BOX
            x.alignment = A("left" if cc in (1, 5) else "center")
        ws.row_dimensions[rr].height = 22
    r = top + len(rows) + 1
    note(ws, r, 5, [
        "※ 요율(연노랑)은 발주처 기준·계약조건에 맞게 채우십시오. 금액 칸은 수식이니 건드리지 마십시오.",
        "※ 간접재료비·간접노무비 등 요율로 계산하는 항목은 금액 칸에 직접 적어도 됩니다(수식이 없는 칸입니다).",
    ])
    ws.sheet_view.showGridLines = False

    # ── 3. 내역서총괄표 ────────────────────────────────────
    ws = wb.create_sheet("내역서총괄표")
    r = title(ws, 9, "내 역 서  총 괄 표", "내역서의 공종별 합계가 자동으로 올라옵니다")
    r = head(ws, r, 9, ["공종코드", "공        종", "규격·비고", "단위", "수량",
                        "합        계", "노 무 비", "재 료 비", "경        비"],
             [10, 30, 18, 8, 10, 16, 14, 14, 14])
    tot = r                       # 합계 줄
    a = ws.cell(row=tot, column=2, value="  순 공 사 비"); a.font = F(11, True); a.fill = LBL
    for cc in (6, 7, 8, 9):
        L = get_column_letter(cc)
        c = ws.cell(row=tot, column=cc, value="=SUM({0}{1}:{0}{2})".format(L, tot + 1, tot + 40))
        c.fill = CALC; c.number_format = MONEY; c.font = F(11, True)
    for cc in range(1, 10):
        x = ws.cell(row=tot, column=cc); x.border = BOX; x.alignment = A()
    ws.row_dimensions[tot].height = 24
    r0 = tot + 1
    for i in range(40):
        rr = r0 + i
        for cc in range(1, 10):
            x = ws.cell(row=rr, column=cc); x.border = BOX; x.font = F(10)
            x.alignment = A("left" if cc in (2, 3) else "center", True)
            if cc in (1, 2, 3, 4, 5): x.fill = INP
        for cc, col in ((6, "H"), (7, "J"), (8, "L"), (9, "N")):
            c = ws.cell(row=rr, column=cc)
            c.value = ('=IF($B{0}="","",SUMIF(내역서!$A$6:$A${1},$A{0},내역서!${2}$6:${2}${1}))'
                       .format(rr, 5 + N_ROWS, col))
            c.fill = CALC; c.number_format = MONEY
        ws.row_dimensions[rr].height = 20
    r = r0 + 40 + 1
    note(ws, r, 9, [
        "※ 공종코드를 내역서의 공종코드와 같게 적으면 그 공종의 금액이 자동으로 모입니다.",
        "※ 합계 줄(순공사비)이 원가계산서로 올라갑니다.",
    ])
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A{}".format(r0)

    # ── 4. 내역서 ─────────────────────────────────────────
    ws = wb.create_sheet("내역서")
    r = title(ws, 15, "내        역        서",
              "수량과 단가를 넣으면 금액이 자동으로 계산됩니다 · 단가는 일위대가 호표로도 끌어올 수 있습니다")
    hdr = ["공종코드", "품        명", "규        격", "단위", "수량",
           "일위대가\n호표", "합계\n단가", "합계\n금액", "노무비\n단가", "노무비\n금액",
           "재료비\n단가", "재료비\n금액", "경비\n단가", "경비\n금액", "비고"]
    r = head(ws, r, 15, hdr, [10, 26, 18, 7, 9, 9, 12, 14, 11, 13, 11, 13, 11, 13, 14])
    r0 = r
    for i in range(N_ROWS):
        rr = r0 + i
        for cc in range(1, 16):
            x = ws.cell(row=rr, column=cc); x.border = BOX; x.font = F(10)
            x.alignment = A("left" if cc in (2, 3) else "center", True)
        for cc in (1, 2, 3, 4, 5, 6, 15): ws.cell(row=rr, column=cc).fill = INP
        ws.cell(row=rr, column=5).number_format = QTY
        # 단가 : 호표가 있으면 일위대가 총괄표에서 끌어오고, 없으면 손으로 넣습니다
        for dan, wonga in ((9, "E"), (11, "F"), (13, "G")):
            c = ws.cell(row=rr, column=dan)
            c.value = ('=IF($F{0}="","",IFERROR(VLOOKUP($F{0},일위대가총괄표!$A$6:$G$65,{1},FALSE),""))'
                       .format(rr, {9: 5, 11: 6, 13: 7}[dan]))
            c.fill = CALC; c.number_format = MONEY
        c = ws.cell(row=rr, column=7)
        c.value = "=IF(COUNT(I{0},K{0},M{0})=0,\"\",N(I{0})+N(K{0})+N(M{0}))".format(rr)
        c.fill = CALC; c.number_format = MONEY
        for dan, geum in ((7, 8), (9, 10), (11, 12), (13, 14)):
            L = get_column_letter(dan)
            c = ws.cell(row=rr, column=geum)
            c.value = '=IF(OR($E{0}="",{1}{0}=""),"",ROUND($E{0}*{1}{0},0))'.format(rr, L)
            c.fill = CALC; c.number_format = MONEY
        ws.row_dimensions[rr].height = 20
    rr = r0 + N_ROWS
    a = ws.cell(row=rr, column=2, value="  합        계"); a.font = F(11, True); a.fill = LBL
    for cc in (8, 10, 12, 14):
        L = get_column_letter(cc)
        c = ws.cell(row=rr, column=cc, value="=SUM({0}{1}:{0}{2})".format(L, r0, r0 + N_ROWS - 1))
        c.fill = CALC; c.number_format = MONEY; c.font = F(11, True)
    for cc in range(1, 16):
        x = ws.cell(row=rr, column=cc); x.border = BOX; x.alignment = A()
    r = rr + 2
    note(ws, r, 15, [
        "※ 「일위대가 호표」에 호표번호(예: 1)를 적으면 일위대가총괄표에서 단가가 자동으로 옵니다.",
        "※ 호표가 없는 품목은 노무비·재료비·경비 단가를 직접 적으십시오(수식을 지우고 숫자를 넣으면 됩니다).",
        "※ 공종코드는 내역서총괄표의 공종코드와 같게 적어야 합계가 모입니다.",
    ])
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A{}".format(r0)

    # ── 5. 일위대가총괄표 ──────────────────────────────────
    ws = wb.create_sheet("일위대가총괄표")
    r = title(ws, 7, "일 위 대 가  총 괄 표", "일위대가 시트의 호표별 합계가 자동으로 올라옵니다")
    r = head(ws, r, 7, ["호표", "품        명", "규        격", "단위",
                        "노 무 비", "재 료 비", "경        비"],
             [8, 30, 22, 8, 14, 14, 14])
    r0 = r
    for i in range(60):
        rr = r0 + i
        for cc in range(1, 8):
            x = ws.cell(row=rr, column=cc); x.border = BOX; x.font = F(10)
            x.alignment = A("left" if cc in (2, 3) else "center", True)
            if cc in (1, 2, 3, 4): x.fill = INP
        for cc, col in ((5, "I"), (6, "K"), (7, "M")):
            c = ws.cell(row=rr, column=cc)
            c.value = ('=IF($A{0}="","",SUMIF(일위대가!$A$6:$A$305,$A{0},일위대가!${1}$6:${1}$305))'
                       .format(rr, col))
            c.fill = CALC; c.number_format = MONEY
        ws.row_dimensions[rr].height = 20
    r = r0 + 60 + 1
    note(ws, r, 7, ["※ 호표번호는 일위대가 시트의 호표와 같게 적습니다. 내역서에서 이 호표로 단가를 끌어갑니다."])
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A{}".format(r0)

    # ── 6. 일위대가 ───────────────────────────────────────
    ws = wb.create_sheet("일위대가")
    r = title(ws, 13, "일  위  대  가", "품·자재를 넣으면 호표별 합계가 총괄표로 올라갑니다")
    hdr = ["호표", "품        명", "규        격", "단위", "수량",
           "구분", "단가\n(자동)", "노무비\n단가", "노무비\n금액",
           "재료비\n단가", "재료비\n금액", "경비\n단가", "경비\n금액"]
    r = head(ws, r, 13, hdr, [7, 26, 20, 7, 9, 10, 12, 11, 13, 11, 13, 11, 13])
    r0 = r
    for i in range(300):
        rr = r0 + i
        for cc in range(1, 14):
            x = ws.cell(row=rr, column=cc); x.border = BOX; x.font = F(10)
            x.alignment = A("left" if cc in (2, 3) else "center", True)
        for cc in (1, 2, 3, 4, 5, 6): ws.cell(row=rr, column=cc).fill = INP
        ws.cell(row=rr, column=5).number_format = QTY
        # 구분(노임/자재/기계)에 따라 단가표에서 자동으로 끌어옵니다
        c = ws.cell(row=rr, column=7)
        c.value = ('=IF($B{0}="","",IFERROR(IF($F{0}="노임",VLOOKUP($B{0},노임단가!$A$6:$D$105,4,FALSE),'
                   'IF($F{0}="자재",VLOOKUP($B{0},자재단가!$A$6:$E$205,5,FALSE),'
                   'IF($F{0}="기계",VLOOKUP($B{0},기계경비!$A$6:$E$105,5,FALSE),""))),""))'.format(rr))
        c.fill = CALC; c.number_format = MONEY
        for dan, geum, gubun in ((8, 9, "노임"), (10, 11, "자재"), (12, 13, "기계")):
            L = get_column_letter(dan)
            c = ws.cell(row=rr, column=dan)
            c.value = '=IF($F{0}="{1}",N($G{0}),"")'.format(rr, gubun)
            c.fill = CALC; c.number_format = MONEY
            c = ws.cell(row=rr, column=geum)
            c.value = '=IF(OR($E{0}="",{1}{0}=""),"",ROUND($E{0}*{1}{0},0))'.format(rr, L)
            c.fill = CALC; c.number_format = MONEY
        ws.row_dimensions[rr].height = 19
    r = r0 + 300 + 1
    note(ws, r, 13, [
        "※ 「구분」에 노임 / 자재 / 기계 를 적으면 각 단가표에서 단가가 자동으로 옵니다.",
        "※ 단가표에 없는 품목은 단가 칸에 직접 숫자를 넣으십시오(수식을 지우면 됩니다).",
        "※ 같은 호표번호로 여러 줄을 적으면 총괄표에서 하나로 모입니다.",
    ])
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A{}".format(r0)

    # ── 7~9. 단가표 세 가지 ────────────────────────────────
    def danga(name, heading, sub, cols, widths, n, last_calc=None):
        ws = wb.create_sheet(name)
        r = title(ws, len(cols), heading, sub)
        r = head(ws, r, len(cols), cols, widths)
        r0 = r
        for i in range(n):
            rr = r0 + i
            for cc in range(1, len(cols) + 1):
                x = ws.cell(row=rr, column=cc); x.border = BOX; x.font = F(10)
                x.alignment = A("left" if cc in (1, 2) else "center", True)
                x.fill = INP
                if cc >= 3: x.number_format = MONEY
            if last_calc:
                c = ws.cell(row=rr, column=len(cols)); c.value = last_calc.format(rr)
                c.fill = CALC; c.number_format = MONEY
            ws.row_dimensions[rr].height = 19
        ws.sheet_view.showGridLines = False
        ws.freeze_panes = "A{}".format(r0)
        return ws, r0 + n + 1

    ws, r = danga("노임단가", "노 임 단 가 표",
                  "대한건설협회 시중노임단가 등을 적습니다 · 일위대가에서 직종명으로 찾아 씁니다",
                  ["직  종  명", "적용 기준(고시·시점)", "1일 노임", "적용 단가"],
                  [26, 34, 16, 16], 100, '=IF(C{0}="","",C{0})')
    note(ws, r, 4, ["※ 「적용 단가」가 일위대가로 갑니다. 할증이 있으면 이 칸에 직접 적으십시오.",
                    "※ 직종명을 일위대가의 품명과 **똑같이** 적어야 찾아옵니다."])

    ws, r = danga("자재단가", "자 재 단 가 표",
                  "견적·물가자료 단가를 적습니다 · 일위대가에서 자재명으로 찾아 씁니다",
                  ["자  재  명", "규        격", "단위", "단가①", "적용 단가"],
                  [26, 26, 8, 16, 16], 200, '=IF(D{0}="","",D{0})')
    note(ws, r, 5, ["※ 여러 곳에서 견적을 받았으면 낮은 것을 「적용 단가」에 적습니다.",
                    "※ 자재명을 일위대가의 품명과 **똑같이** 적어야 찾아옵니다."])

    ws, r = danga("기계경비", "기 계 경 비 (건설기계 손료)",
                  "표준품셈 기계경비 산정 기준으로 적습니다 · 일위대가에서 기계명으로 찾아 씁니다",
                  ["기  계  명", "규        격", "단위", "시간당 경비", "적용 단가"],
                  [26, 24, 8, 16, 16], 100, '=IF(D{0}="","",D{0})')
    note(ws, r, 5, ["※ 손료·연료비·운전노무비를 합한 값을 적습니다.",
                    "※ 기계명을 일위대가의 품명과 **똑같이** 적어야 찾아옵니다."])

    # ── 10. 수량산출서 ─────────────────────────────────────
    ws = wb.create_sheet("수량산출서")
    r = title(ws, 9, "수 량 산 출 서", "산출근거를 적으면 수량이 계산됩니다 · 내역서로 옮겨 적습니다")
    r = head(ws, r, 9, ["번호", "공        종", "품        명", "규        격",
                        "산  출  근  거", "단위", "수량", "개소", "계"],
             [6, 18, 22, 20, 36, 8, 12, 8, 12])
    r0 = r
    for i in range(80):
        rr = r0 + i
        for cc in range(1, 10):
            x = ws.cell(row=rr, column=cc); x.border = BOX; x.font = F(10)
            x.alignment = A("left" if cc in (2, 3, 4, 5) else "center", True)
            if cc != 9: x.fill = INP
        ws.cell(row=rr, column=7).number_format = QTY
        c = ws.cell(row=rr, column=9)
        c.value = '=IF(OR(G{0}="",H{0}=""),"",ROUND(G{0}*H{0},3))'.format(rr)
        c.fill = CALC; c.number_format = QTY
        ws.row_dimensions[rr].height = 20
    r = r0 + 80 + 1
    note(ws, r, 9, [
        "※ 「계 = 수량 × 개소」가 자동으로 나옵니다. 이 값을 내역서의 수량 칸에 옮겨 적습니다.",
        "※ 산출근거는 「가로×세로×높이」처럼 계산이 보이게 적으십시오. 검측·정산 때 근거가 됩니다.",
    ])
    ws.sheet_view.showGridLines = False
    ws.freeze_panes = "A{}".format(r0)

    # ── 11. 도급내역 요약(갑지) ────────────────────────────
    ws = wb.create_sheet("갑지")
    r = title(ws, 4, "도 급 내 역  갑 지", "원가계산서에서 자동으로 올라옵니다")
    for i, w in enumerate([6, 30, 24, 30], start=1):
        ws.column_dimensions[get_column_letter(i)].width = w
    rows = [("재  료  비", "=원가계산서!C9"), ("노  무  비", "=원가계산서!C12"),
            ("경        비", "=원가계산서!C17"), ("순 공 사 비", "=원가계산서!C18"),
            ("일반관리비", "=원가계산서!C19"), ("이        윤", "=원가계산서!C20"),
            ("총  원  가", "=원가계산서!C21"), ("부가가치세", "=원가계산서!C22"),
            ("도 급 금 액", "=원가계산서!C23")]
    for i, (nm, fm) in enumerate(rows):
        rr = r + i
        a = ws.cell(row=rr, column=2, value="  " + nm)
        a.font = F(12, nm in ("순 공 사 비", "총  원  가", "도 급 금 액")); a.fill = LBL; a.border = BOX
        c = ws.cell(row=rr, column=3, value=fm); c.fill = CALC; c.border = BOX
        c.number_format = MONEY; c.font = F(12, nm == "도 급 금 액"); c.alignment = A("right")
        ws.cell(row=rr, column=4).border = BOX
        ws.row_dimensions[rr].height = 30
    note(ws, r + len(rows) + 2, 4,
         ["※ 이 시트는 보기용입니다. 값은 전부 원가계산서에서 옵니다.",
          "※ 양식 제공 : K-건설맵  k-conmap.com"])
    ws.sheet_view.showGridLines = False

    order = ["표지", "갑지", "원가계산서", "내역서총괄표", "내역서",
             "일위대가총괄표", "일위대가", "노임단가", "자재단가", "기계경비", "수량산출서"]
    wb._sheets.sort(key=lambda s: order.index(s.title) if s.title in order else 99)
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, "gongnaeyeok-hanbeol.xlsx")
    wb.save(p)
    print("만듦:", p, "· 시트", len(wb.sheetnames), wb.sheetnames)

if __name__ == "__main__":
    build()
