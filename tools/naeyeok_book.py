# -*- coding: utf-8 -*-
"""naeyeok_book.py — 「내역서 찾아보기.xlsx」 를 만듭니다.

  쓰는 법:  python tools\\naeyeok_book.py
  읽는 것:  <내역서모음>/_수집기록.json · _뽑은단가_엑셀.json · _뽑은단가_pdf.json
            · _일위대가_호표.json · _뽑은물량.json · _사진PDF.json
  내는 것:  <내역서모음>/내역서 찾아보기.xlsx   (+ _단가사전.csv)

  ⚠️ 이 파일들은 소장님 PC 안에만 둡니다. 사이트에 올리지 않습니다.
"""
import io, json, os, re, sys, collections
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOX  = os.environ.get("KCM_BOX") or os.path.join(os.path.dirname(ROOT), "내역서모음")

def load(name, default):
    try:
        return json.load(io.open(os.path.join(BOX, name), encoding="utf-8"))
    except Exception:
        return default

LOG  = load("_수집기록.json", {})
XL   = load("_뽑은단가_엑셀.json", [])
PD   = load("_뽑은단가_pdf.json", [])
ILWI = load("_일위대가_호표.json", [])
QTY  = load("_뽑은물량.json", [])
SHOT = load("_사진PDF.json", [])
OUT  = os.path.join(BOX, "내역서 찾아보기.xlsx")

F   = lambda sz=10, b=False, c='000000': Font(name='Arial', size=sz, bold=b, color=c)
A   = lambda h='center', w=False: Alignment(horizontal=h, vertical='center', wrap_text=w)
THIN = Side(style='thin', color='C9D2E0')
BOX  = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
HEAD = PatternFill('solid', fgColor='DCE6F5')
WARN = PatternFill('solid', fgColor='FFF4E5')
WON  = '#,##0'

# ── 공사 종류 딱지 ────────────────────────────────────────────────────
KIND = [
    ('철도', r'철도|고속선|경부선|경인선|분당선|안산선|중앙선|충북선|교외선|전철|역사|'
             r'승강장|선로|차량사업소|에스컬레이터'),
    ('상하수도', r'상수도|하수도|하수관|상수관|급수|배수관|누수|정수|오수|우수|맨홀|준설|'
                r'수도시설|빗물받이|배수시설|배수개선|도시가스|가스\s*인입'),
    ('도로·포장', r'도로|포장|아스콘|아스팔트|소파|노면|차선|보도|측구|교통안전|표지판|가드레일|'
                  r'국도\d*호선|지방도|국지도|교차로|병목|주차장|임도|비탈면|교량|대교|갑문교'),
    ('하천·수리', r'하천|소하천|용수로|배수로|제방|호안|수문|저수지|양수장|농업생산기반|'
                r'경지정리|용배수로|간척|방조제'),
    ('전기·통신', r'전기|통신|조명|가로등|배전|수배전|케이블|변압기|태양광|신호등|CCTV'),
    ('기계·설비', r'설비|기계|배관|공조|냉난방|보일러|펌프|소방|승강기|위생'),
    ('조경·공원', r'조경|공원|녹지|식재|수목|잔디|화단|벌초|예초|전정|방제|제초|정원|가로수'),
    ('건축·리모델링', r'건축|증축|개축|리모델|방수|창호|지붕|도장|내진|화장실|급식실|교사|청사|체육관|'
                     r'학교|중학교|고등학교|초등학교|대학|환경개선|외벽|전시|실내|관사|병원|복지관|'
                     r'도서관|사무실|공간\s*조성|시설물\s*보수|(?<!이음)신축'),
    ('토목·구조', r'토목|옹벽|사면|절토|성토|교량|구조물|지반|흙막이|터널'),
]
def kindof(txt):
    t = txt or ''
    for name, rx in KIND:
        if re.search(rx, t):
            return name
    return '그 밖'

# 원본 엑셀이 깨져 있어 «#REF!» 같은 오류 글자가 그대로 들어오는 칸이 있습니다.
ERRLIT = re.compile(r'#(REF|VALUE|NAME\?|DIV/0|N/A|NULL|NUM)!?')


def put(ws, row, col, v):
    """칸에 값을 넣습니다. «=» 로 시작하는 글자는 엑셀이 수식으로 오해하니 글자로 못 박습니다."""
    if isinstance(v, str) and ERRLIT.search(v):
        v = ERRLIT.sub('', v).strip()
    c = ws.cell(row=row, column=col)
    if isinstance(v, str) and v[:1] in ('=', '+', '@'):
        c.value = v
        c.data_type = 's'
    else:
        c.value = v
    return c


# 번호·코드만 있는 «품명» 은 사전에 넣지 않습니다 (1.02, L00001, SP3000 같은 것)
CODE_ONLY = re.compile(r'^[\d.\-\s]+$|^[A-Z]{0,3}[-\s]?\d{3,}$|^[0-9]+[-.][0-9.]+$')


def sheet(wb, title, cols, widths, freeze='A3'):
    ws = wb.create_sheet(title)
    ws.sheet_view.showGridLines = False
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(cols))
    c = ws.cell(row=1, column=1)
    c.font = F(9.5, True, '1A56DB'); c.alignment = A('left')
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    for i, n in enumerate(cols, 1):
        c = ws.cell(row=2, column=i, value=n)
        c.font = F(10, True); c.fill = HEAD; c.border = BOX; c.alignment = A('center', True)
    ws.row_dimensions[1].height = 18; ws.row_dimensions[2].height = 24
    ws.freeze_panes = freeze
    return ws

wb = Workbook(); wb.remove(wb.active)

# ── 2) 뽑은 줄 (원자료) ───────────────────────────────────────────────
raw = []
for r in XL:
    nm, sp, un, pr, where, inst, dt = r[0], r[1], r[2], r[3], r[4], r[5], r[6]
    path = r[7] if len(r) > 7 else ''
    raw.append([nm, sp, un, pr, str(where), inst, dt, path])
for r in PD:
    nm, sp, un, pr, inst, dt, path = r[0], r[1], r[2], r[3], r[4], r[5], r[6]
    raw.append([nm, sp, un, pr, 'PDF', inst, dt, path])

# ⚠️ 머리글·집계 줄이 «품명» 자리에 끼어 옵니다. 단가 사전에 들어가면 안 됩니다.
# 이름을 «벗겨서» 봅니다 — <노무비>, [ 합 계 ], (재료비) 처럼 괄호로 싸 놓는 일이 흔합니다.
STRIP = re.compile(r'^[\s<>\[\]()（）「」【】·※■□○●-]+|[\s<>\[\]()（）「」【】·※■□○●-]+$')
NOT_ITEM = re.compile(
    r'^(재\s*료\s*비|노\s*무\s*비|경\s*비|합\s*계|소\s*계|총\s*계|계|단가|금액|수량|규격|품명|공종|'
    r'직접\s*공사비|순\s*공사\s*원가|공사\s*원가|일위\s*대가|비고|산출근거|적요|구분|호표|번호|계산|'
    r'단위|소\s*요\s*량|잡재료비|기계경비|장비비|직접노무비|간접노무비|공\s*종\s*별|집\s*계)$'
    r'|^단가[/／]|^금액[/／]')


def clean_name(nm):
    return STRIP.sub('', re.sub(r'\s+', ' ', str(nm))).strip()


def key(nm, sp, un):
    f = lambda x: ERRLIT.sub('', re.sub(r'\s+', ' ', str(x or ''))).strip()
    return f(nm) + '|' + f(sp) + '|' + f(un)

ws2 = sheet(wb, '뽑은 줄(원자료)',
            ['찾을 열쇠', '품명', '규격', '단위', '단가', '어디서', '발주처', '공고일', '파일'],
            [30, 30, 22, 8, 14, 18, 26, 11, 60])
ws2['A1'] = '  K-건설맵  |  조달청 내역서에서 그대로 뽑은 줄입니다. 위 「단가 찾기」 시트가 이 표를 셉니다.'
for i, r in enumerate(raw, start=3):
    k = key(r[0], r[1], r[2])
    vals = [k, r[0], r[1], r[2], r[3], r[4], r[5], r[6], r[7]]
    for j, v in enumerate(vals, 1):
        c = put(ws2, i, j, v)
        c.font = F(9.5); c.border = BOX
        c.alignment = A('left' if j in (1, 2, 3, 6, 7, 9) else 'center')
        if j == 5: c.number_format = WON
ws2.auto_filter.ref = 'A2:I%d' % (len(raw) + 2)
NRAW = len(raw) + 2

# ── 1) 단가 찾기 ─────────────────────────────────────────────────────
# ⚠️ 2026-09-16 — 거르는 규칙을 «tools/단가규칙.py 한 곳» 으로 옮겼습니다.
#    여기와 단가사전.py 가 따로 거르면 두 결과가 갈라집니다 (CLAUDE.md 9절 ⑤).
#    옛 NOT_ITEM/CODE_ONLY 는 그물로 남겨 둡니다 — 규칙 쪽이 먼저 봅니다.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import 단가규칙 as _R

agg = {}
for r in raw:
    nmc = clean_name(r[0])
    if not nmc or NOT_ITEM.search(nmc) or CODE_ONLY.match(nmc):
        continue
    if _R.거를까(r[0], r[1], r[3], r[2]):
        continue
    k = key(r[0], r[1], r[2])
    a = agg.setdefault(k, {'nm': r[0], 'sp': r[1], 'un': r[2], 'n': 0,
                           'last': ('', ''), 'vals': []})
    a['n'] += 1
    a['vals'].append(r[3])
    if str(r[6] or '') >= str(a['last'][1] or ''):
        a['last'] = (r[5], r[6])
for a in agg.values():
    v = a['vals']
    a['avg'] = sum(v) / len(v); a['lo'] = min(v); a['hi'] = max(v)
items = sorted(agg.values(), key=lambda a: (-a['n'], a['nm']))

ws1 = sheet(wb, '단가 찾기',
            ['품명', '규격', '단위', '나온 횟수', '평균 단가', '가장 싼 것', '가장 비싼 것',
             '주의', '마지막 발주처', '마지막 공고일', '찾을 열쇠'],
            [30, 24, 9, 10, 14, 14, 14, 7, 26, 12, 30])
ws1['A1'] = ('  K-건설맵  |  조달청 공개 내역서에서 뽑은 단가입니다. Ctrl+F 로 품명을 찾으십시오.  '
             '※ 나온 횟수·평균·최저·최고는 「뽑은 줄(원자료)」 시트를 세어 넣은 값입니다'
             '(2만 줄이 넘어 수식으로 두면 파일이 너무 느려집니다). '
             '⚠ 는 최고가 최저의 10배를 넘는 것 — 규격이 섞였으니 「뽑은 줄」 을 보고 쓰십시오.')
RAW = "'뽑은 줄(원자료)'!"
for i, a in enumerate(items, start=3):
    k = key(a['nm'], a['sp'], a['un'])
    put(ws1, i, 1, a['nm']); put(ws1, i, 2, a['sp']); put(ws1, i, 3, a['un'])
    ws1.cell(row=i, column=4, value=a['n'])
    ws1.cell(row=i, column=5, value=round(a['avg']))
    ws1.cell(row=i, column=6, value=round(a['lo']))
    ws1.cell(row=i, column=7, value=round(a['hi']))
    # 최고가 최저의 10배를 넘으면 규격이 섞였거나 «금액» 이 끼어든 것입니다 — 눈에 띄게 표시합니다.
    warn = '⚠' if a['lo'] > 0 and a['hi'] / a['lo'] > 10 else ''
    put(ws1, i, 8, warn)
    put(ws1, i, 9, a['last'][0]); put(ws1, i, 10, a['last'][1]); put(ws1, i, 11, k)
    for j in range(1, 12):
        c = ws1.cell(row=i, column=j)
        c.font = F(9.5); c.border = BOX
        c.alignment = A('left' if j in (1, 2, 9, 11) else 'center')
        if j in (5, 6, 7): c.number_format = WON
        if j == 8 and warn:
            c.font = F(11, True, 'B45309'); c.fill = WARN
ws1.auto_filter.ref = 'A2:K%d' % (len(items) + 2)
ws1.column_dimensions['K'].hidden = True

# ── 3) 자료 목록 ─────────────────────────────────────────────────────
ok = [v for v in LOG.values() if v.get('ok')]
ok.sort(key=lambda v: (v.get('price') != '있음', str(v.get('dt') or '')), reverse=False)
ws3 = sheet(wb, '자료 목록',
            ['단가', '공사 종류', '갈래', '공고명', '발주처', '공고일',
             '무엇이 들었나', '폴더', '파일', '열기'],
            [7, 14, 12, 46, 26, 11, 34, 14, 46, 7])
ws3['A1'] = ('  K-건설맵  |  받아 둔 내역서 목록입니다. 「단가」 가 ○ 인 것에 단가가 들어 있습니다. '
             '「열기」 를 누르면 그 파일이 열립니다(이 파일과 같은 폴더에 두십시오).')
for i, v in enumerate(ok, start=3):
    p = (v.get('path') or '').replace('/', '\\')
    folder, _, fname = p.rpartition('\\')
    mark = {'있음': '○', '없음': '·', '못읽음': '△'}.get(v.get('price'), '')
    vals = [mark, kindof(v.get('name', '')), v.get('kind', ''), v.get('name', ''),
            v.get('inst', ''), v.get('dt', ''), v.get('memo', ''), folder, fname]
    for j, val in enumerate(vals, 1):
        c = put(ws3, i, j, val)
        c.font = F(9.5); c.border = BOX
        c.alignment = A('center' if j in (1, 2, 3, 6) else 'left')
        if v.get('price') == '있음' and j == 1:
            c.font = F(11, True, '1A56DB')
    c = ws3.cell(row=i, column=10, value='=HYPERLINK(".\\\\"&H%d&"\\\\"&I%d,"열기")' % (i, i))
    c.font = F(9.5, False, '1A56DB'); c.border = BOX; c.alignment = A('center')
ws3.auto_filter.ref = 'A2:J%d' % (len(ok) + 2)

# ── 4) 눈으로 볼 PDF ─────────────────────────────────────────────────
img = SHOT
ws4 = sheet(wb, '눈으로 볼 PDF', ['공고명', '발주처', '공고일', '쪽수', '폴더', '파일', '열기'],
            [46, 26, 11, 7, 14, 50, 7])
ws4['A1'] = ('  K-건설맵  |  글자가 없는 «사진으로 된» PDF 입니다. 기계가 못 읽으니 눈으로 보셔야 합니다. '
             '대부분 도급예산내역서라 단가가 들어 있습니다.')
for i, m in enumerate(img, start=3):
    d = m
    p = (m.get('path') or '').replace('/', '\\')
    folder, _, fname = p.rpartition('\\')
    for j, val in enumerate([m.get('name', ''), m.get('inst', ''), m.get('dt', ''),
                             d.get('pages', ''), folder, fname], 1):
        c = put(ws4, i, j, val)
        c.font = F(9.5); c.border = BOX; c.fill = WARN
        c.alignment = A('center' if j in (3, 4, 5) else 'left')
    c = ws4.cell(row=i, column=7, value='=HYPERLINK(".\\\\"&E%d&"\\\\"&F%d,"열기")' % (i, i))
    c.font = F(9.5, False, '1A56DB'); c.border = BOX; c.alignment = A('center'); c.fill = WARN

# ── 5) 일위대가(호표) 모음 ───────────────────────────────────────────
# 한 호표 = 「기존면 침투성 방수 / M2」 를 만드는 데 무엇이 얼마나 들어가는가.
# 그 «수량» 이 곧 품셈입니다. 단가가 바뀌어도 이것만 있으면 다시 계산됩니다.
HOPYO = re.compile(r'\(\s*호표\s*[0-9]+\s*\)|\[\s*호표\s*[0-9]+\s*\]')
ws5 = sheet(wb, '일위대가(호표)',
            ['호표(만드는 것)', '호표 단위', '들어가는 것', '규격', '단위', '수량(품셈)',
             '발주처', '공고일'],
            [42, 9, 30, 24, 8, 12, 24, 11])
ws5['A1'] = ('  K-건설맵  |  일위대가 «호표» 입니다. 「호표(만드는 것)」 한 가지를 1단위 만드는 데 '
             '무엇이 얼마나 들어가는지 — 그 「수량(품셈)」 이 핵심입니다. '
             '단가가 올라도 이 수량에 새 단가만 곱하면 됩니다.')
r5 = 3
for b in ILWI:
    nm = HOPYO.sub('', str(b.get('호표', ''))).strip()
    if not nm:
        continue
    for f in b.get('부속', []):
        for j, v in enumerate([nm, b.get('단위', ''), f[0], f[1], f[2], f[3],
                               b.get('발주처', ''), b.get('공고일', '')], 1):
            c = put(ws5, r5, j, v)
            c.font = F(9.5); c.border = BOX
            c.alignment = A('left' if j in (1, 3, 4, 7) else 'center')
            if j == 6: c.number_format = '#,##0.####'
        r5 += 1
ws5.auto_filter.ref = 'A2:H%d' % (r5 - 1)

# ── 6) 물량 찾아보기 ─────────────────────────────────────────────────
# 물량내역서·수량산출서에서 뽑은 «수량» 입니다. 단가는 비어 있는 자료입니다.
# 비슷한 공사에 어떤 품목이 얼마나 들어가는지 가늠할 때 씁니다.
if QTY:
    ws6 = sheet(wb, '물량 찾아보기',
                ['품명', '규격', '단위', '수량', '어디서', '공사 종류', '공고명', '발주처', '공고일'],
                [30, 24, 8, 12, 16, 13, 40, 24, 11])
    ws6['A1'] = ('  K-건설맵  |  물량내역서·수량산출서에서 뽑은 «수량» 입니다(단가는 없는 자료). '
                 '비슷한 공사에 무엇이 얼마나 들어가는지 가늠할 때 보십시오.')
    r6 = 3
    for q in QTY:
        nm = clean_name(q[0]) if len(q) > 0 else ''
        if not nm or NOT_ITEM.search(nm) or CODE_ONLY.match(nm):
            continue
        nmm = str(q[8]) if len(q) > 8 else ''
        vals = [q[0], q[1], q[2], q[3], q[4] if len(q) > 4 else '',
                kindof(nmm), nmm, q[5] if len(q) > 5 else '', q[6] if len(q) > 6 else '']
        for j, v in enumerate(vals, 1):
            c = put(ws6, r6, j, v)
            c.font = F(9.5); c.border = BOX
            c.alignment = A('left' if j in (1, 2, 7, 8) else 'center')
            if j == 4: c.number_format = '#,##0.####'
        r6 += 1
        if r6 > 60000:
            break
    ws6.auto_filter.ref = 'A2:I%d' % (r6 - 1)
    print('   물량 %d줄' % (r6 - 3))

wb.move_sheet('단가 찾기', offset=-4)
wb.save(OUT)
print('만듦: %s · 단가 %d가지 / 원자료 %d줄 / 자료 %d개 / 사진PDF %d개 / 일위대가 %d줄'
      % (OUT, len(items), len(raw), len(ok), len(img), r5 - 3))
