# -*- coding: utf-8 -*-
"""단가사전 만들기 (2026-09-16)

    python tools/단가사전.py

  보는 것 : <내역서모음>/_뽑은단가_엑셀.json · _뽑은단가_pdf.json
  내는 것 : <내역서모음>/_단가사전.csv        ← «내도 되는 것만» (표본 10줄 이상)
            <내역서모음>/_단가사전_전체.csv   ← 전부 + 등급 (소장님이 보시는 자리)
            <내역서모음>/_단가사전_보고.md    ← 무엇을 왜 버렸는지

  ■ 왜 다시 만들었나 (2026-09-16 점검)
     예전 사전은 9,886줄이었지만, 그 안에 네 가지가 뒤섞여 있었습니다.
       ① 진짜 자재·공종 단가
       ② 노임단가(유료 자료)
       ③ 일위대가 «안에서만» 뜻이 있는 계산 항목 — 공구손료 = 노무비의 3%
       ④ 머리글·소계·파싱 오류 줄
     그래서 「보통인부 최저 3,441원 ~ 최고 644,222원」 같은 것이 나왔습니다.
     이 값을 그대로 내보이면 «틀린 단가를 근거처럼» 쓰게 됩니다.

  ■ 규칙 여섯 (CLAUDE.md 9절)
     ① 기간 창 — 최근 12개월만. 오래된 달은 버립니다
     ② «언제 것인가» 를 늘 적습니다. 날짜 없는 단가는 내지 않습니다
     ③ 표본 30줄 이상 = 정식 · 10~29 = 「표본 적음」 · 10 미만 = 아예 안 냄
     ④ 중앙값만 내지 않습니다 — 25~75% 범위를 같이 냅니다
     ⑤ 묶는 규칙은 tools/단가규칙.py 한 곳에만
     ⑥ 갈래(자재·공종·합성·장비)를 갈라 받습니다. 섞으면 분포가 뭉개집니다
"""
import os
import sys
import csv
import json
import io
import collections
import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import 단가규칙 as R                                             # noqa: E402

창개월 = 12                    # 규칙 ① 기간 창


def 모음폴더():
    here = os.path.dirname(os.path.abspath(__file__))
    cand = [os.path.join(here, '..', '..', '내역서모음'),
            os.path.join(here, '..', '내역서모음')]
    for c in cand:
        c = os.path.abspath(c)
        if os.path.isdir(c):
            return c
    raise SystemExit('내역서모음 폴더를 못 찾았습니다.')


def 읽기(p):
    if not os.path.exists(p):
        return []
    with io.open(p, encoding='utf-8') as f:
        return json.load(f)


def main():
    폴더 = 모음폴더()
    XL = 읽기(os.path.join(폴더, '_뽑은단가_엑셀.json'))
    PD = 읽기(os.path.join(폴더, '_뽑은단가_pdf.json'))
    print('원자료 : 엑셀 %d줄 · PDF %d줄' % (len(XL), len(PD)))

    # 엑셀 : [품명, 규격, 단위, 단가, 시트, 발주처, 공고일, 파일, 공고명]
    # PDF  : [품명, 규격, 단위, 단가, 발주처, 공고일, 파일, 공고명]   ← 시트가 없습니다
    줄 = []
    for r in XL:
        줄.append((r[4], r[0], r[1], r[2], r[3], r[6]))
    for r in PD:
        줄.append(('자재', r[0], r[1], r[2], r[3], r[5]))   # PDF 는 거의 관급자재 구입내역서입니다

    # ── 기간 창 (규칙 ①) — 가장 최근 공고일에서 12개월 뒤로
    날짜 = sorted(d for _, _, _, _, _, d in 줄 if str(d or '').strip())
    if not 날짜:
        raise SystemExit('공고일이 하나도 없습니다 — 날짜 없는 단가는 내지 않습니다.')
    끝 = 날짜[-1]
    처음 = 날짜[0]
    y, m, d = (int(x) for x in 끝.split('-')[:3])
    시작 = '%04d-%02d-%02d' % (y - 1, m, d)

    모음 = collections.defaultdict(list)
    버림 = collections.Counter()
    for 시트, 품명, 규격, 단위, 단가, 공고일 in 줄:
        g = R.갈래(시트)
        if g is None:
            버림['시트로 제외(노임·고시단가)'] += 1
            continue
        dt = str(공고일 or '').strip()
        if not dt:
            버림['공고일 없음'] += 1
            continue
        if dt < 시작:
            버림['기간 창(%d개월) 밖' % 창개월] += 1
            continue
        까닭 = R.거를까(품명, 규격, 단가, 단위)
        if 까닭:
            버림[까닭] += 1
            continue
        k = R.열쇠(g, 품명, 규격, 단위)
        모음[k].append((float(str(단가).replace(',', '')),
                        R.다듬기(품명), R.다듬기(규격), R.다듬기(단위), dt))

    print('버린 줄 %d — 남은 묶음 %d' % (sum(버림.values()), len(모음)))

    항목 = []
    for k, v in 모음.items():
        값 = [x[0] for x in v]
        날 = sorted(x[4] for x in v)
        항목.append({
            '갈래': k[0],
            '품명': v[0][1], '규격': v[0][2], '단위': v[0][3],
            '표본': len(값),
            '등급': R.등급(len(값)),
            '중앙단가': round(R.사분위(값, 0.5)),
            '25%': round(R.사분위(값, 0.25)),
            '75%': round(R.사분위(값, 0.75)),
            '처음 공고일': 날[0], '마지막 공고일': 날[-1],
        })
    # 등급 -> 표본 많은 순 -> 갈래 -> 품명
    순 = {'정식': 0, '표본적음': 1, '자료부족': 2}
    항목.sort(key=lambda a: (순[a['등급']], -a['표본'], a['갈래'], a['품명']))

    머리 = ['갈래', '품명', '규격', '단위', '표본', '등급',
            '중앙단가', '25%', '75%', '처음 공고일', '마지막 공고일']

    def 쓰기(path, rows):
        with io.open(path, 'w', encoding='utf-8-sig', newline='') as f:
            w = csv.DictWriter(f, fieldnames=머리)
            w.writeheader()
            for r in rows:
                w.writerow(r)

    낼것 = [a for a in 항목 if a['등급'] != '자료부족']
    쓰기(os.path.join(폴더, '_단가사전.csv'), 낼것)
    쓰기(os.path.join(폴더, '_단가사전_전체.csv'), 항목)

    셈 = collections.Counter(a['등급'] for a in 항목)
    갈래셈 = collections.Counter(a['갈래'] for a in 낼것)
    # 25%와 75%가 같으면 «값이 하나뿐» 이라 범위가 없는 것입니다 — 정직하게 셉니다
    납작 = sum(1 for a in 낼것 if a['25%'] == a['75%'])

    이제 = datetime.datetime.now().strftime('%Y-%m-%d %H:%M')
    보고 = []
    보고.append('# 단가사전 — 만든 기록')
    보고.append('')
    보고.append('- 만든 때 : **%s**' % 이제)
    보고.append('- 자료 기간 : **%s ~ %s** (모은 자료 전체는 %s 부터)' % (시작, 끝, 처음))
    보고.append('- 원자료 : 엑셀 %s줄 + PDF %s줄 = **%s줄**'
                % (format(len(XL), ','), format(len(PD), ','), format(len(줄), ',')))
    보고.append('')
    보고.append('## 낼 수 있는 것')
    보고.append('')
    보고.append('| 등급 | 뜻 | 묶음 |')
    보고.append('|---|---|---|')
    보고.append('| 정식 | 표본 %d줄 이상 — 중앙값과 25~75%% 범위를 냅니다 | **%d** |' % (R.정식, 셈['정식']))
    보고.append('| 표본적음 | %d~%d줄 — 「표본 적음」 딱지를 달고 범위만 | **%d** |'
                % (R.적음, R.정식 - 1, 셈['표본적음']))
    보고.append('| 자료부족 | %d줄 미만 — **내지 않습니다** | %d |' % (R.적음, 셈['자료부족']))
    보고.append('')
    보고.append('→ `_단가사전.csv` 에 들어간 것 : **%d 묶음** (자료부족을 뺀 것)' % len(낼것))
    보고.append('')
    보고.append('그 가운데 **25%%와 75%%가 같은 것이 %d개** 입니다. 값이 한 가지뿐이라 «범위» 가 없습니다 — '
                '고시 단가가 여러 내역서에 그대로 옮겨 적힌 것입니다. 참고로만 쓰십시오.' % 납작)
    보고.append('')
    보고.append('## 갈래별 (낸 것)')
    보고.append('')
    보고.append('| 갈래 | 묶음 | 무엇인가 |')
    보고.append('|---|---|---|')
    for g, c in 갈래셈.most_common():
        보고.append('| %s | %d | %s |' % (g, c, R.갈래설명.get(g, '')))
    보고.append('')
    보고.append('## 버린 줄')
    보고.append('')
    보고.append('| 까닭 | 줄 |')
    보고.append('|---|---|')
    for k, c in 버림.most_common():
        보고.append('| %s | %s |' % (k, format(c, ',')))
    보고.append('')
    보고.append('## 읽으실 때')
    보고.append('')
    보고.append('- **표준품셈·물가정보·노임단가를 실은 것이 아닙니다.** '
                '조달청이 공개한 내역서에 «적혀 있던 값» 의 분포입니다.')
    보고.append('- 노임 직종과 정부 고시 단가(표준시장단가)는 **일부러 뺐습니다.** 유료 자료이거나 시세가 아닙니다.')
    보고.append('- 일위대가 안의 «노무비의 3%» 같은 계산 항목도 뺐습니다. 단가가 아니라 계산 결과입니다.')
    보고.append('- 묶는 규칙은 `tools/단가규칙.py` **한 곳에만** 있습니다. 넓히고 싶으면 거기를 고치고 '
                '두 표를 견줘 보십시오.')
    with io.open(os.path.join(폴더, '_단가사전_보고.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(보고) + '\n')

    print('')
    print('기간      : %s ~ %s' % (시작, 끝))
    print('정식 %d · 표본적음 %d · 자료부족 %d (안 냄)' % (셈['정식'], 셈['표본적음'], 셈['자료부족']))
    print('낸 것     : %d 묶음  (그중 범위가 없는 것 %d)' % (len(낼것), 납작))
    print('')
    print('  _단가사전.csv        내도 되는 것만')
    print('  _단가사전_전체.csv   전부 + 등급')
    print('  _단가사전_보고.md    무엇을 왜 버렸는지')


if __name__ == '__main__':
    main()
