# -*- coding: utf-8 -*-
"""🧪 설계변경 2줄 ↔ 1줄 자동변환(/change/twoline) «예시로 해 보기» 파일 두 벌 — G687 (2026-11-15)

   python3 tools/build_2줄예시.py      (openpyxl · LibreOffice 필요 — 클라우드 시험장)
     → web/public/tools/files/ex-twoline-1line.xlsx  (1줄 → 2줄 예시: 당초 내역서 한 벌)
     → web/public/tools/files/ex-twoline-2line.xlsx  (2줄 → 1줄 예시: 당초 · 변경 두 줄 변경내역서)

   공사 · 발주처 · 숫자 모두 지어낸 것입니다(가상 솔바람마을 안길 정비공사 · 가상군).
   2줄 예시는 설계변경 프로그램이 내는 꼴을 따릅니다 — 품목마다 당초 줄(검정 · 품명 있음) + 변경 줄(적색 · 수량 · 단가만),
   합계는 «당초 줄끼리 · 변경 줄끼리» 더한 셈, 원가계산서도 비목마다 당초 · 변경 두 줄, 머리에 «금 ○○원»,
   공사비증감대비표(당초 · 변경 · 증 · 감 — 1줄로 바꿔도 그대로 두는 시트).
   LibreOffice 로 한 번 열어 셈한 값을 담아 둡니다(엑셀에서 저장한 파일처럼 — 그때 값이 있어야 «그대로 둔 칸» 이 맞음).
"""
import os
import shutil
import sys
import tempfile

import openpyxl
from openpyxl.styles import Alignment, Border, Font, Side
from openpyxl.worksheet.page import PageMargins

여기 = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, 여기)
from checkbook import recalc  # noqa: E402

낼곳 = os.path.join(여기, '..', 'web', 'public', 'tools', 'files')
공사명 = '가상 솔바람마을 안길 정비공사'

# 공종 · 품목 — (품명, 규격, 단위, 당초 수량, 변경 수량, 재료비 단가, 노무비 단가, 경비 단가)
공종들 = [
    ('1. 토공', [
        ('터파기(토사)', '백호 0.7㎥', '㎥', 420, 465, 0, 2850, 1120),
        ('되메우기 및 다짐', '래머 80kg', '㎥', 310, 352, 0, 3200, 980),
        ('잔토처리', '덤프 15톤 L=5km', '㎥', 110, 113, 0, 1500, 4200),
    ]),
    ('2. 구조물공', [
        ('레미콘 타설', '25-24-15', '㎥', 86, 92, 92000, 18500, 1200),
        ('거푸집', '합판 3회', '㎡', 412, 438, 6800, 21500, 0),
        ('철근 가공 · 조립', '보통', 'ton', 6.2, 6.6, 0, 412000, 8000),
    ]),
    ('3. 배수공', [
        ('흄관 부설', 'D600', 'm', 120, 132, 68000, 12500, 3500),
        ('집수정 설치', '1.0×1.0m', '개소', 6, 7, 185000, 96000, 12000),
    ]),
    ('4. 포장공', [
        ('아스콘 포장', 't=5cm', '㎡', 980, 1020, 6200, 1400, 900),
        ('보도블록 포장', '300×300', '㎡', 240, 228, 14500, 9800, 0),
    ]),
]

가는 = Side(style='thin', color='FF808080')
테 = Border(left=가는, right=가는, top=가는, bottom=가는)
글꼴 = '맑은 고딕'
검정 = Font(name=글꼴, size=10)
빨강 = Font(name=글꼴, size=10, color='FFFF0000')
굵게 = Font(name=글꼴, size=10, bold=True)
제목 = Font(name=글꼴, size=16, bold=True)
가운데 = Alignment(horizontal='center', vertical='center', wrap_text=True)
왼쪽 = Alignment(horizontal='left', vertical='center')
오른쪽 = Alignment(horizontal='right', vertical='center')
수꼴 = '#,##0;[Red]-#,##0'
수꼴소 = '#,##0.0#'


def 쪽설정(ws, 가로, 머리줄):
    ws.page_setup.paperSize = ws.PAPERSIZE_A4
    ws.page_setup.orientation = 'landscape' if 가로 else 'portrait'
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.page_margins = PageMargins(left=0.4, right=0.4, top=0.6, bottom=0.6)
    ws.print_title_rows = 머리줄
    ws.oddFooter.center.text = '&P / &N'


def 칸(ws, ref, v, font=검정, al=None, fmt=None, border=True):
    c = ws[ref]
    c.value = v
    c.font = font
    if al is not None:
        c.alignment = al
    if fmt:
        c.number_format = fmt
    if border:
        c.border = 테
    return c


def 내역서(wb, 두줄):
    ws = wb.create_sheet('내역서')
    너비 = {'A': 9, 'B': 22, 'C': 16, 'D': 9, 'E': 6, 'F': 11, 'G': 14, 'H': 10, 'I': 13, 'J': 10, 'K': 13, 'L': 9, 'M': 12, 'N': 12}
    for k, w in 너비.items():
        ws.column_dimensions[k].width = w
    ws.merge_cells('A1:N1')
    칸(ws, 'A1', '내   역   서', 제목, 가운데, border=False)
    칸(ws, 'A2', f'공사명 : {공사명}', 검정, 왼쪽, border=False)
    for ref, t in [('A3', '공 종'), ('B3', '품    명'), ('C3', '규    격'), ('D3', '수 량'), ('E3', '단위'), ('F3', '합    계'), ('H3', '재 료 비'),
                   ('J3', '노 무 비'), ('L3', '경    비'), ('N3', '비  고')]:
        칸(ws, ref, t, 굵게, 가운데)
    for a in ['A3:A4', 'B3:B4', 'C3:C4', 'D3:D4', 'E3:E4', 'F3:G3', 'H3:I3', 'J3:K3', 'L3:M3', 'N3:N4']:
        ws.merge_cells(a)
    for i, col in enumerate('FGHIJKLM'):
        칸(ws, f'{col}4', '단  가' if i % 2 == 0 else '금  액', 굵게, 가운데)
    for col in 'ABCDEN':
        ws[f'{col}4'].border = 테
    k = 2 if 두줄 else 1
    r = 5
    총계줄 = r
    r += k
    공종줄 = []
    품목자리 = []

    def 금액줄(row, font, 공종칸=None, 품=None, 수량=None, 단가=None):
        if 품 is not None:
            칸(ws, f'B{row}', 품[0], font, 왼쪽)
            칸(ws, f'C{row}', 품[1], font, 왼쪽)
            칸(ws, f'E{row}', 품[2], font, 가운데)
        else:
            for col in 'BCE':
                칸(ws, f'{col}{row}', None, font)
        if 공종칸 is not None:
            칸(ws, f'A{row}', 공종칸, font, 가운데)
        else:
            칸(ws, f'A{row}', None, font)
        if 수량 is not None:
            칸(ws, f'D{row}', 수량, font, 오른쪽, 수꼴소 if isinstance(수량, float) else 수꼴)
            for j, col in enumerate('HJL'):
                칸(ws, f'{col}{row}', 단가[j], font, 오른쪽, 수꼴)
                금 = chr(ord(col) + 1)
                칸(ws, f'{금}{row}', f'=TRUNC(D{row}*{col}{row},0)', font, 오른쪽, 수꼴)
        else:
            칸(ws, f'D{row}', None, font)
        칸(ws, f'F{row}', f'=H{row}+J{row}+L{row}' if 수량 is not None else None, font, 오른쪽, 수꼴)
        칸(ws, f'G{row}', f'=I{row}+K{row}+M{row}', font, 오른쪽, 수꼴)
        칸(ws, f'N{row}', None, font)

    for 이름, 품목들 in 공종들:
        시작 = r
        r += k
        자리 = []
        for 품 in 품목들:
            금액줄(r, 검정, 품=품, 수량=품[3], 단가=품[5:8])
            if 두줄:
                금액줄(r + 1, 빨강, 수량=품[4], 단가=품[5:8])
            자리.append(r)
            r += k
        공종줄.append((시작, 이름, 자리))
        품목자리.append(자리)
    끝 = r
    # 공종 소계 줄 · 순공사비 줄(당초 줄끼리 · 변경 줄끼리)
    for 시작, 이름, 자리 in 공종줄:
        for d in range(k):
            row = 시작 + d
            font = 검정 if d == 0 else 빨강
            칸(ws, f'A{row}', 이름.split('.')[0] + '.' if d == 0 else None, font, 가운데)
            칸(ws, f'B{row}', 이름.split('. ', 1)[1] if d == 0 else None, Font(name=글꼴, size=10, bold=True, color=font.color), 왼쪽)
            for col in 'CDEFHJLN':
                칸(ws, f'{col}{row}', None, font)
            for col in 'IKM':
                칸(ws, f'{col}{row}', '=' + '+'.join(f'{col}{x + d}' for x in 자리), font, 오른쪽, 수꼴)
            칸(ws, f'G{row}', f'=I{row}+K{row}+M{row}', font, 오른쪽, 수꼴)
    for d in range(k):
        row = 총계줄 + d
        font = Font(name=글꼴, size=10, bold=True, color=(빨강 if d else 검정).color)
        칸(ws, f'A{row}', None, font)
        칸(ws, f'B{row}', '순 공 사 비' if d == 0 else None, font, 가운데)
        for col in 'CDEFHJLN':
            칸(ws, f'{col}{row}', None, font)
        for col in 'IKM':
            칸(ws, f'{col}{row}', '=' + '+'.join(f'{col}{s + d}' for s, _, _ in 공종줄), font, 오른쪽, 수꼴)
        칸(ws, f'G{row}', f'=I{row}+K{row}+M{row}', font, 오른쪽, 수꼴)
    for row in range(5, 끝):
        ws.row_dimensions[row].height = 20
    ws.freeze_panes = 'A5'
    쪽설정(ws, True, '3:4')
    ws.print_area = f'A1:N{끝 - 1}'
    return ws, 총계줄, 공종줄


원가비목 = [
    # (묶음, 비목, 기호, 셈(당초/변경 줄 d 를 받아 수식), 요율, 산출근거)
    ('재료비', '직 접 재 료 비', '1', lambda F, d, 내: f'=내역서!I{내 + d}', None, '내역서 재료비'),
    ('', '간 접 재 료 비', '2', lambda F, d, 내: None, None, ''),
    ('', '소          계', 'A', lambda F, d, 내: f'=TRUNC(F{F("1") + d}+F{F("2") + d},0)', None, '(1 + 2)'),
    ('노무비', '직 접 노 무 비', '3', lambda F, d, 내: f'=내역서!K{내 + d}', None, '내역서 노무비'),
    ('', '간 접 노 무 비', '4', lambda F, d, 내: f'=TRUNC(F{F("3") + d}*0.146,0)', 0.146, '3 × 14.6%'),
    ('', '소          계', 'B', lambda F, d, 내: f'=TRUNC(F{F("3") + d}+F{F("4") + d},0)', None, '(3 + 4)'),
    ('경비', '기 계 경 비 등', '5', lambda F, d, 내: f'=내역서!M{내 + d}', None, '내역서 경비'),
    ('', '산 재 보 험 료', '6', lambda F, d, 내: f'=TRUNC(F{F("B") + d}*0.0356,0)', 0.0356, 'B × 3.56%'),
    ('', '고 용 보 험 료', '7', lambda F, d, 내: f'=TRUNC(F{F("B") + d}*0.0101,0)', 0.0101, 'B × 1.01%'),
    ('', '건 강 보 험 료', '8', lambda F, d, 내: f'=TRUNC(F{F("3") + d}*0.03595,0)', 0.03595, '3 × 3.595%'),
    ('', '연 금 보 험 료', '9', lambda F, d, 내: f'=TRUNC(F{F("3") + d}*0.0475,0)', 0.0475, '3 × 4.75%'),
    ('', '산업안전보건관리비', '10', lambda F, d, 내: f'=TRUNC((F{F("A") + d}+F{F("3") + d})*0.0207,0)', 0.0207, '(A + 3) × 2.07%'),
    ('', '기  타  경  비', '11', lambda F, d, 내: f'=TRUNC((F{F("A") + d}+F{F("B") + d})*0.049,0)', 0.049, '(A + B) × 4.9%'),
    ('', '소          계', 'C', lambda F, d, 내: '=' + '+'.join(f'F{F(x) + d}' for x in ['5', '6', '7', '8', '9', '10', '11']), None, '(5 ~ 11)'),
    ('', '순 공 사 원 가', 'D', lambda F, d, 내: f'=F{F("A") + d}+F{F("B") + d}+F{F("C") + d}', None, '(A + B + C)'),
    ('', '일 반 관 리 비', 'E', lambda F, d, 내: f'=TRUNC(F{F("D") + d}*0.06,0)', 0.06, 'D × 6%'),
    ('', '이          윤', 'F', lambda F, d, 내: f'=TRUNC((F{F("B") + d}+F{F("C") + d}+F{F("E") + d})*0.15,0)', 0.15, '(B + C + E) × 15%'),
    ('', '총    원    가', 'G', lambda F, d, 내: f'=F{F("D") + d}+F{F("E") + d}+F{F("F") + d}', None, '(D + E + F)'),
    ('', '부 가 가 치 세', 'H', lambda F, d, 내: f'=TRUNC(F{F("G") + d}*0.1,0)', 0.1, 'G × 10%'),
    ('', '도    급    액', 'I', lambda F, d, 내: f'=TRUNC((F{F("G") + d}+F{F("H") + d})/1000,0)*1000', None, '(G + H) 천 원 아래 버림'),
]


def 원가계산서(wb, 두줄, 총계줄):
    ws = wb.create_sheet('원가계산서', 0)
    for k_, w in {'A': 4, 'B': 9, 'C': 20, 'D': 6, 'E': 7, 'F': 16, 'G': 9, 'H': 22}.items():
        ws.column_dimensions[k_].width = w
    ws.merge_cells('A1:H1')
    칸(ws, 'A1', '원  가  계  산  서', 제목, 가운데, border=False)
    칸(ws, 'A2', f'공사명 : {공사명}', 검정, 왼쪽, border=False)
    for ref, t in [('A4', '비         목'), ('E4', '기호'), ('F4', '금      액'), ('G4', '요율'), ('H4', '산  출  근  거')]:
        칸(ws, ref, t, 굵게, 가운데)
    ws.merge_cells('A4:D4')
    for col in 'BCD':
        ws[f'{col}4'].border = 테
    k = 2 if 두줄 else 1
    자리 = {}
    r = 5
    for 묶, 이름, 기호, _, _, _ in 원가비목:
        자리[기호] = r
        r += k
    F = lambda x: 자리[x]  # noqa: E731
    r = 5
    묶시작 = {}
    for 묶, 이름, 기호, 셈, 요율, 근거 in 원가비목:
        if 묶:
            묶시작[묶] = r
        for d in range(k):
            row = r + d
            font = 검정 if d == 0 else 빨강
            칸(ws, f'A{row}', None, font)
            칸(ws, f'B{row}', 묶 if (d == 0 and 묶) else None, font, 가운데)
            칸(ws, f'C{row}', 이름 if d == 0 else None, font, 왼쪽)
            칸(ws, f'D{row}', None, font)
            칸(ws, f'E{row}', 기호 if d == 0 else None, font, 가운데)
            칸(ws, f'F{row}', 셈(F, d, 총계줄), font, 오른쪽, 수꼴)
            칸(ws, f'G{row}', 요율, font, 가운데, '0.00#%' if 요율 else None)
            칸(ws, f'H{row}', 근거 if d == 0 else None, font, 왼쪽)
            ws.row_dimensions[row].height = 20
        r += k
    끝 = r - 1
    # 비목 묶음 이름 칸(세로 병합) — 재료비 · 노무비 · 경비
    for 묶, 시작 in 묶시작.items():
        nxt = [v for kk, v in 묶시작.items() if v > 시작]
        아래 = (min(nxt) - 1) if nxt else 자리['C'] + k - 1
        ws.merge_cells(f'B{시작}:B{아래}')
    # 머리 «금 ○○원» — 2줄이면 변경 도급액(마지막 줄)을, 1줄이면 도급액을
    도급 = 자리['I'] + (k - 1)
    칸(ws, 'F3', f'="금 "&TEXT(F{도급},"#,##0")&"원"', 굵게, 오른쪽, border=False)
    ws.merge_cells('F3:H3')
    쪽설정(ws, False, '4:4')
    ws.print_area = f'A1:H{끝}'
    return ws


def 대비표(wb, 총계줄, 공종줄):
    """공사비증감대비표 — 당초 · 변경 금액을 옆으로 견줌(2줄 예시에만 · 1줄로 바꿔도 그대로 두는 시트)"""
    ws = wb.create_sheet('공사비증감대비표')
    for k_, w in {'A': 8, 'B': 22, 'C': 15, 'D': 15, 'E': 13, 'F': 13, 'G': 12}.items():
        ws.column_dimensions[k_].width = w
    ws.merge_cells('A1:G1')
    칸(ws, 'A1', '공 사 비 증 감 대 비 표', 제목, 가운데, border=False)
    for ref, t in [('A3', '공 종'), ('B3', '품    명'), ('C3', '당    초'), ('D3', '변    경'), ('E3', '증(+)'), ('F3', '감(-)'), ('G3', '비  고')]:
        칸(ws, ref, t, 굵게, 가운데)
    r = 4
    줄들 = [('', '순 공 사 비', 총계줄)] + [(이름.split('.')[0] + '.', 이름.split('. ', 1)[1], 시작) for 시작, 이름, _ in 공종줄]
    for 번, 이름, 줄 in 줄들:
        칸(ws, f'A{r}', 번, 검정, 가운데)
        칸(ws, f'B{r}', 이름, 검정, 왼쪽)
        칸(ws, f'C{r}', f'=내역서!G{줄}', 검정, 오른쪽, 수꼴)
        칸(ws, f'D{r}', f'=내역서!G{줄 + 1}', 빨강, 오른쪽, 수꼴)
        칸(ws, f'E{r}', f'=IF(D{r}-C{r}>0,D{r}-C{r},"")', 검정, 오른쪽, 수꼴)
        칸(ws, f'F{r}', f'=IF(C{r}-D{r}>0,C{r}-D{r},"")', 검정, 오른쪽, 수꼴)
        칸(ws, f'G{r}', None, 검정)
        ws.row_dimensions[r].height = 20
        r += 1
    쪽설정(ws, False, '3:3')
    return ws


def 짓기(두줄, 길):
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    _, 총계줄, 공종줄 = 내역서(wb, 두줄)
    원가계산서(wb, 두줄, 총계줄)
    if 두줄:
        대비표(wb, 총계줄, 공종줄)
    wb.active = 0
    wb.properties.creator = 'K-건설맵'
    wb.properties.title = f'{공사명} — {"설계변경 내역서(당초 · 변경 2줄)" if 두줄 else "내역서"} 예시(가상)'
    wb.save(길)


def main():
    os.makedirs(낼곳, exist_ok=True)
    일 = tempfile.mkdtemp(prefix='ex2line_')
    try:
        for 두줄, 이름 in [(False, 'ex-twoline-1line.xlsx'), (True, 'ex-twoline-2line.xlsx')]:
            원 = os.path.join(일, 이름)
            짓기(두줄, 원)
            곳 = os.path.join(일, '셈_' + 이름.replace('.xlsx', ''))
            os.makedirs(곳)
            셈한 = recalc(원, 곳)
            shutil.copyfile(셈한, os.path.join(낼곳, 이름))
            print('✓', 이름, os.path.getsize(os.path.join(낼곳, 이름)), 'B')
    finally:
        shutil.rmtree(일, ignore_errors=True)


if __name__ == '__main__':
    main()
