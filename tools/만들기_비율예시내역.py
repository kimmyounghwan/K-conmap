"""🧪 G636 (2026-11-10) 내역서 비율 맞추기(/naeyeok/ratio) «예시로 해 보기» 내역서 만들기 — 지어낸 공사(가상 마을안길 정비공사)
   python tools/만들기_비율예시내역.py web/public/sigong/예시_내역서.xlsx web/public/jeoksan/비율예시_내역서.xlsx
   시공계획서 예시(/sigong/예시_내역서.xlsx)에서 «사급 레미콘 · 사급 이형철근» 두 줄을 뺀 판 — 그 두 자재는 아래 «관급 자재» 에도 있어
   두 번 들어가 있었음(관급이면 도급 쪽엔 타설 · 가공조립 같은 일만). 원가계산서는 같은 요율 · 원 미만 버림으로 다시 셈
   (뺄 줄 없이 같은 셈을 하면 원본 원가계산서가 한 원도 안 틀리고 그대로 나옴 — 요율 · 버림 꼴 확인)."""
import sys, openpyxl
from decimal import Decimal as D, ROUND_FLOOR
src, out = sys.argv[1], sys.argv[2]
wb = openpyxl.load_workbook(src)
ws = wb['내역서']
뺄 = [r for r in range(1, ws.max_row + 1) if ws.cell(r, 2).value in ('레미콘', '이형철근') and not str(ws.cell(r, 2).value).startswith('[관급]')]
assert len(뺄) == 2, 뺄
for r in reversed(뺄):
    ws.delete_rows(r, 1)
# 내역 합(관급 뺌)
재 = 노 = 경 = 0
관 = 0
for r in range(1, ws.max_row + 1):
    q = ws.cell(r, 4).value
    if not isinstance(q, (int, float)): continue
    이름 = str(ws.cell(r, 2).value)
    v = [ws.cell(r, c).value or 0 for c in (7, 8, 9, 10, 11, 12, 13)]
    # 확인: 금액 = 단가 × 수량 · 합계 = 셋 합
    assert abs(v[1] * q - v[2]) < 1 and abs(v[3] * q - v[4]) < 1 and abs(v[5] * q - v[6]) < 1, (r, 이름)
    assert ws.cell(r, 6).value == v[1] + v[3] + v[5] and abs(ws.cell(r, 7).value - (v[2] + v[4] + v[6])) < 1, (r, 이름)
    if 이름.startswith('[관급]'): 관 += v[0]; continue
    노 += v[2]; 재 += v[4]; 경 += v[6]
f = lambda x: int(D(x).to_integral_value(rounding=ROUND_FLOOR))
x = {}
x['1'] = 재; x['A'] = x['1']
x['4'] = 노; x['5'] = f(D(x['4']) * D('0.146')); x['B'] = x['4'] + x['5']
x['6'] = 경
x['7'] = f(D(x['B']) * D('0.0356')); x['8'] = f(D(x['B']) * D('0.0101'))
x['9'] = f(D(x['4']) * D('0.03545')); x['10'] = f(D(x['4']) * D('0.045'))
x['11'] = f(D(x['9']) * D('0.1295')); x['12'] = f(D(x['4']) * D('0.023'))
x['13'] = f(D(x['A'] + x['4']) * D('0.0197')); x['14'] = f(D(x['A'] + x['4'] + x['6']) * D('0.008'))
x['15'] = f(D(x['A'] + x['B']) * D('0.0553'))
x['C'] = sum(x[str(i)] for i in range(6, 16))
x['D'] = x['A'] + x['B'] + x['C']; x['E'] = f(D(x['D']) * D('0.055'))
x['F'] = f(D(x['B'] + x['C'] + x['E']) * D('0.1135'))
x['G'] = x['D'] + x['E'] + x['F']; x['H'] = f(D(x['G']) * D('0.1')); x['I'] = x['G'] + x['H']
x['J'] = 관; x['K'] = x['I'] + x['J']
wc = wb['원가계산서']
for r in range(4, wc.max_row + 1):
    k = wc.cell(r, 3).value
    if k is None: continue
    k = str(k).strip()
    if k in x:
        wc.cell(r, 4).value = x[k]
# 셈 확인: 원본 예시에 같은 셈을 하면 원본 값이 그대로 나오는지(요율 · 버림 꼴이 맞나)
wb.save(out)
print({k: x[k] for k in ['1', '4', '6', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']})
