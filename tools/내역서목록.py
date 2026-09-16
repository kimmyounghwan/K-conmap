# -*- coding: utf-8 -*-
"""내역서 목록 정리 (2026-09-16)

    python tools/내역서목록.py

  보는 것 : <내역서모음>/_수집기록.json · _뽑은단가_엑셀.json · _뽑은물량.json · _일위대가_호표.json
  내는 것 : <내역서모음>/_내역서목록.csv   한 파일에 한 줄 — 무엇이 들었는지
            <내역서모음>/_내역서목록.md    한눈에 보는 표

  ■ 왜 만드나
     1,375부를 모아 놓았는데 «무엇이 어디에 들었는지» 를 세어 본 적이 없습니다.
     적산에 쓸 재료표를 만들려면 **일위대가 호표가 든 파일** 을 찾아야 하고,
     단가사전을 키우려면 **단가가 든 파일** 을 찾아야 합니다.
     그때마다 807MB 를 다시 뒤지지 않게 목록을 한 장으로 만들어 둡니다.

  ⚠️ 이 목록은 «소장님 PC 안에서 파일을 찾는 용도» 입니다. 공고명·발주처가 들어갑니다.
     사이트에 올리거나 내보내지 않습니다. 저장소에도 넣지 않습니다(.gitignore).
"""
import os
import sys
import csv
import io
import json
import collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def 모음폴더():
    here = os.path.dirname(os.path.abspath(__file__))
    for c in (os.path.join(here, '..', '..', '내역서모음'),
              os.path.join(here, '..', '내역서모음')):
        c = os.path.abspath(c)
        if os.path.isdir(c):
            return c
    raise SystemExit('내역서모음 폴더를 못 찾았습니다.')


def 읽기(p):
    if not os.path.exists(p):
        return []
    with io.open(p, encoding='utf-8') as f:
        return json.load(f)


def 자리(x):
    """줄에서 «파일 경로» 를 꺼냅니다. 자료마다 자리가 다릅니다."""
    if isinstance(x, dict):
        return str(x.get('파일') or '')
    if isinstance(x, (list, tuple)):
        for v in x:
            s = str(v)
            if '\\' in s and s.lower().endswith(('.xlsx', '.xls', '.pdf', '.xlsm')):
                return s
    return ''


def 못읽은까닭(v, 단가줄):
    """«못읽음» 한 덩어리로 세면 안 됩니다 — 고칠 수 있는 것과 아닌 것이 섞입니다.

    ⚠️ 2026-09-16 — 처음엔 PDF 118부를 전부 «못읽음» 으로 셌습니다. 그런데 PDF 는
       엑셀 수집기가 «원래 안 보는» 것이고, 따로 만든 PDF 도구가 5부를 이미 뜯었습니다.
       그대로 두면 「118부가 고장」 으로 읽혀 남은 113부를 손도 안 대게 됩니다.
    """
    if v.get('price') != '못읽음':
        return ''
    memo = str(v.get('memo') or '')
    real = str(v.get('real') or '')
    if real == 'pdf':
        return 'PDF — 이미 뜯음' if 단가줄 else 'PDF — 아직 안 뜯음'
    if 'zip 인데 엑셀이 아님' in memo:
        return 'zip 묶음 — 풀어야 함'
    if 'KeyError' in memo:
        return 'xlsb/zip — 읽는 도구가 없음'
    if 'XLRDError' in memo:
        return 'hwp 등 — 엑셀이 아님'
    if 'UnicodeDecodeError' in memo:
        return '엑셀이 아닌 파일'
    return '모름'


def main():
    폴더 = 모음폴더()
    LOG = 읽기(os.path.join(폴더, '_수집기록.json'))
    if not LOG:
        raise SystemExit('_수집기록.json 이 없습니다.')

    # ── 파일마다 «무엇이 몇 줄 나왔나» 를 셉니다
    단가수 = collections.Counter()
    물량수 = collections.Counter()
    호표수 = collections.Counter()
    for r in 읽기(os.path.join(폴더, '_뽑은단가_엑셀.json')):
        단가수[자리(r)] += 1
    for r in 읽기(os.path.join(폴더, '_뽑은단가_pdf.json')):
        단가수[자리(r)] += 1
    for r in 읽기(os.path.join(폴더, '_뽑은물량.json')):
        물량수[자리(r)] += 1
    for r in 읽기(os.path.join(폴더, '_일위대가_호표.json')):
        호표수[자리(r)] += 1

    줄 = []
    for v in LOG.values():
        if not isinstance(v, dict) or not v.get('ok'):
            continue
        p = str(v.get('path') or '')
        내림 = os.path.join(폴더, p.replace('\\', '/'))
        단, 물, 호 = 단가수.get(p, 0), 물량수.get(p, 0), 호표수.get(p, 0)
        # 적산에 쓸모 — 호표(재료표 씨앗)가 가장 값집니다
        if 호:
            쓸모 = '재료표 씨앗'
        elif 단 and 물:
            쓸모 = '단가+물량'
        elif 단:
            쓸모 = '단가'
        elif 물:
            쓸모 = '물량'
        elif 못읽은까닭(v, 단) == 'PDF — 아직 안 뜯음':
            쓸모 = 'PDF 뜯어야'
        else:
            쓸모 = '아직 못 씀'
        줄.append({
            '못 읽은 까닭': 못읽은까닭(v, 단),
            '갈래': v.get('kind', ''),
            '공고일': v.get('dt', ''),
            '발주처': v.get('inst', ''),
            '공고명': v.get('name', ''),
            '파일': p,
            '형식': v.get('real', ''),
            'MB': round((v.get('bytes') or 0) / 1048576.0, 2),
            '읽었나': '못읽음' if v.get('price') == '못읽음' else '읽음',
            '단가 줄': 단, '물량 줄': 물, '일위대가 호표': 호,
            '적산 쓸모': 쓸모,
            '메모': v.get('memo', ''),
            '있나': '있음' if os.path.exists(내림) else '없음',
        })
    순 = {'재료표 씨앗': 0, '단가+물량': 1, '단가': 2, '물량': 3, 'PDF 뜯어야': 4, '아직 못 씀': 5}
    줄.sort(key=lambda r: (순[r['적산 쓸모']], -r['일위대가 호표'], -r['단가 줄'], r['갈래']))

    머리 = ['적산 쓸모', '갈래', '일위대가 호표', '단가 줄', '물량 줄', '공고일',
            '발주처', '공고명', '형식', 'MB', '읽었나', '못 읽은 까닭', '있나', '파일', '메모']
    with io.open(os.path.join(폴더, '_내역서목록.csv'), 'w',
                 encoding='utf-8-sig', newline='') as f:
        w = csv.DictWriter(f, fieldnames=머리)
        w.writeheader()
        for r in 줄:
            w.writerow({k: r[k] for k in 머리})

    # ── 한눈에 보는 표
    갈래 = sorted({r['갈래'] for r in 줄})
    def 세기(조건):
        return sum(1 for r in 줄 if 조건(r))

    M = []
    M.append('# 내역서 목록 — 무엇을 모았고, 무엇에 쓸 수 있나')
    M.append('')
    M.append('- 파일 **%s부** · 공고일 **%s ~ %s**'
             % (format(len(줄), ','),
                min(r['공고일'] for r in 줄 if r['공고일']),
                max(r['공고일'] for r in 줄 if r['공고일'])))
    M.append('- 뽑아 놓은 것 : 단가 **%s줄** · 물량 **%s줄** · 일위대가 호표 **%s개**'
             % (format(sum(단가수.values()), ','), format(sum(물량수.values()), ','),
                format(sum(호표수.values()), ',')))
    M.append('')
    M.append('## 적산에 쓸모 — 이 순서로 씁니다')
    M.append('')
    M.append('| 쓸모 | 파일 | 무엇인가 |')
    M.append('|---|---|---|')
    설명 = {
        '재료표 씨앗': '**일위대가 호표가 들었습니다.** 「공종 하나에 무엇이 얼마나」 — 재료표와 같은 모양입니다',
        '단가+물량': '단가와 물량이 둘 다. 내역서 만들 때 견줄 자리가 됩니다',
        '단가': '단가만. 단가사전 재료입니다',
        '물량': '물량만. 물량내역서가 대부분입니다(원래 단가가 없습니다)',
        'PDF 뜯어야': '**PDF 입니다.** 엑셀 수집기가 원래 안 봅니다 — `tools/naeyeok_pdf.py` 로 뜯으면 됩니다',
        '아직 못 씀': '표를 못 찾았거나 못 읽은 파일',
    }
    for k in ['재료표 씨앗', '단가+물량', '단가', '물량', 'PDF 뜯어야', '아직 못 씀']:
        n = 세기(lambda r, k=k: r['적산 쓸모'] == k)
        if n:
            M.append('| %s | **%s** | %s |' % (k, format(n, ','), 설명[k]))
    M.append('')
    M.append('## 갈래별')
    M.append('')
    M.append('| 갈래 | 파일 | 재료표 씨앗 | 단가 든 것 | 물량 든 것 | 못 읽음 |')
    M.append('|---|---|---|---|---|---|')
    for k in 갈래:
        M.append('| %s | %s | %s | %s | %s | %s |' % (
            k,
            format(세기(lambda r, k=k: r['갈래'] == k), ','),
            format(세기(lambda r, k=k: r['갈래'] == k and r['일위대가 호표']), ','),
            format(세기(lambda r, k=k: r['갈래'] == k and r['단가 줄']), ','),
            format(세기(lambda r, k=k: r['갈래'] == k and r['물량 줄']), ','),
            format(세기(lambda r, k=k: r['갈래'] == k and r['읽었나'] == '못읽음'), ',')))
    M.append('| **합** | **%s** | **%s** | **%s** | **%s** | **%s** |' % (
        format(len(줄), ','),
        format(세기(lambda r: r['일위대가 호표']), ','),
        format(세기(lambda r: r['단가 줄']), ','),
        format(세기(lambda r: r['물량 줄']), ','),
        format(세기(lambda r: r['읽었나'] == '못읽음'), ',')))
    M.append('')
    M.append('## 파일 형식')
    M.append('')
    M.append('| 형식 | 파일 | 못 읽음 |')
    M.append('|---|---|---|')
    for k, c in collections.Counter(r['형식'] for r in 줄).most_common():
        M.append('| %s | %s | %s |' % (
            k, format(c, ','),
            format(세기(lambda r, k=k: r['형식'] == k and r['읽었나'] == '못읽음'), ',')))
    까닭 = collections.Counter(r['못 읽은 까닭'] for r in 줄 if r['못 읽은 까닭'])
    if 까닭:
        M.append('')
        M.append('## 못 읽은 %s부 — «까닭» 이 다릅니다' % format(sum(까닭.values()), ','))
        M.append('')
        M.append('| 까닭 | 파일 | 고칠 수 있나 |')
        M.append('|---|---|---|')
        고침 = {
            'PDF — 아직 안 뜯음': '**예** — `tools/naeyeok_pdf.py` 를 이 파일들에 돌리면 됩니다',
            'PDF — 이미 뜯음': '이미 뜯었습니다',
            'zip 묶음 — 풀어야 함': '**예** — 압축을 풀고 안의 엑셀을 읽으면 됩니다',
            'xlsb/zip — 읽는 도구가 없음': '`.xlsb`(바이너리 엑셀)입니다. 읽는 라이브러리를 더하면 됩니다',
            'hwp 등 — 엑셀이 아님': '한글 파일입니다. 엑셀이 아니라 애초에 표가 없을 수도 있습니다',
            '엑셀이 아닌 파일': '이름만 xls 이고 속은 다른 것입니다. 하나씩 봐야 합니다',
            '모름': '확장자·속 둘 다 모릅니다. 하나씩 열어 봐야 합니다',
        }
        for k, c in 까닭.most_common():
            M.append('| %s | %s | %s |' % (k, format(c, ','), 고침.get(k, '')))

    없 = 세기(lambda r: r['있나'] == '없음')
    if 없:
        M.append('')
        M.append('⚠️ 기록에는 있는데 **폴더에 없는 파일 %s개** 입니다.' % format(없, ','))
    M.append('')
    M.append('## 읽으실 때')
    M.append('')
    M.append('- `_내역서목록.csv` 를 엑셀로 열고 **「적산 쓸모」로 거르십시오.**')
    M.append('- **「재료표 씨앗」이 가장 값집니다** — 여기서 재료표를 만듭니다.')
    M.append('- 물량내역서에 단가가 없는 것은 **고장이 아닙니다.** 원래 수량만 적는 서류입니다.')
    M.append('- 이 목록에는 공고명·발주처가 들어갑니다. **PC 안에서만** 쓰십시오 — '
             '사이트에 올리거나 내보내지 않습니다.')
    with io.open(os.path.join(폴더, '_내역서목록.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(M) + '\n')

    print('파일 %s부' % format(len(줄), ','))
    for k in ['재료표 씨앗', '단가+물량', '단가', '물량', 'PDF 뜯어야', '아직 못 씀']:
        n = 세기(lambda r, k=k: r['적산 쓸모'] == k)
        if n:
            print('  %-10s %s부' % (k, format(n, ',')))
    print('')
    for k, c in collections.Counter(r['못 읽은 까닭'] for r in 줄 if r['못 읽은 까닭']).most_common():
        print('  못읽음 · %-26s %s부' % (k, format(c, ',')))
    print('')
    print('  _내역서목록.csv   한 파일에 한 줄')
    print('  _내역서목록.md    한눈에 보는 표')


if __name__ == '__main__':
    main()
