# -*- coding: utf-8 -*-
"""
✍️ G346 새 안전서식을 forms.json · forms_tab.json 에 넣습니다 (같은 slug 는 바꿈 · 여러 번 돌려도 같음).
   python3 tools/forms_web/더하기.py          — 넣기
   python3 tools/forms_web/더하기.py --check  — 고치지 않고 검사만(시험)
검사: 칸 꼴(kv · table · chk · cl · text · sign) · 예시(ex)가 칸 꼴과 맞나(화면 tools/서식작성.jsx 맞는꼴 과 같은 셈) ·
      필수 글(제목 · 짧은 말 · 언제 · 놓치기 쉬운 것 · 근거) · slug 겹침 · 예시에 실제처럼 보이는 전화 · 주민번호 없음.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import 안전서식 as S  # noqa: E402

DATA = os.path.join(ROOT, 'web', 'src', 'data')


def 줄수(b):
    return S.줄수(b)


def 꼴검사(f):
    틀 = []
    s = f.get('sheet') or {}
    if not s.get('heading'):
        틀.append('heading 없음')
    bl = s.get('blocks') or []
    if not bl:
        틀.append('blocks 없음')
    for i, b in enumerate(bl):
        t = b.get('t')
        if t == 'kv':
            if not b.get('rows') or any(not isinstance(r, list) or len(r) < 2 or not r[0] for r in b['rows']):
                틀.append(f'{i} kv rows')
        elif t == 'table':
            if not b.get('cols'):
                틀.append(f'{i} table cols')
            if b.get('w') and (len(b['w']) != len(b['cols']) or abs(sum(b['w']) - 100) > 1):
                틀.append(f'{i} table w 합 {sum(b["w"])} · 칸 {len(b["w"])}/{len(b["cols"])}')
            for r in b.get('rows') or []:
                if len(r) != len(b['cols']):
                    틀.append(f'{i} table rows 칸수')
        elif t == 'chk':
            if not b.get('items') or any(not isinstance(x, str) or not x for x in b['items']):
                틀.append(f'{i} chk items')
        elif t == 'cl':
            if not b.get('items') or any(not isinstance(x, list) or len(x) != 2 for x in b['items']):
                틀.append(f'{i} cl items')
        elif t == 'text':
            if not b.get('text'):
                틀.append(f'{i} text')
        elif t == 'sign':
            if not b.get('who'):
                틀.append(f'{i} sign who')
        else:
            틀.append(f'{i} 모르는 블록 {t}')
    return 틀


def 예시검사(f):
    """tools/서식작성.jsx 의 맞는꼴() 과 같은 셈"""
    틀 = []
    ex = f.get('ex')
    bl = f['sheet']['blocks']
    if not isinstance(ex, list) or len(ex) != len(bl):
        return ['ex 길이']
    for i, (b, x) in enumerate(zip(bl, ex)):
        t = b['t']
        if t == 'kv' and not (isinstance(x, list) and len(x) == len(b['rows']) and all(isinstance(v, str) for v in x)):
            틀.append(f'ex {i} kv')
        if t == 'table':
            if not (isinstance(x, list) and len(x) == 줄수(b) and all(isinstance(r, list) and len(r) == len(b['cols']) for r in x)):
                틀.append(f'ex {i} table 줄 {len(x) if isinstance(x, list) else x}/{줄수(b)}')
        if t == 'chk' and not (isinstance(x, list) and len(x) == len(b['items']) and all(isinstance(v, dict) and v.get('r') in ('', '양호', '불량', '해당없음') for v in x)):
            틀.append(f'ex {i} chk')
        if t == 'chk' and isinstance(x, list):
            for j, v in enumerate(x):
                if v.get('r') == '불량' and not v.get('m'):
                    틀.append(f'ex {i}.{j} 불량인데 조치 없음')
        if t == 'cl' and not (isinstance(x, list) and len(x) == len(b['items'])):
            틀.append(f'ex {i} cl')
        if t == 'sign' and not (isinstance(x, dict) and re.match(r'^\d{4}-\d{2}-\d{2}$', x.get('d') or '') and isinstance(x.get('n'), list) and len(x['n']) == len(b['who'])):
            틀.append(f'ex {i} sign')
    글 = json.dumps(ex, ensure_ascii=False)
    if re.search(r'01[016789]-?[1-9]\d{2,3}-?\d{4}', 글):
        틀.append('예시에 실제 같은 휴대폰 번호')
    if re.search(r'\d{6}-[1-4]\d{6}', 글):
        틀.append('예시에 주민번호 꼴')
    return 틀


def 글검사(f):
    틀 = []
    for k in ('slug', 'title', 'sub', 'icon', 'short', 'when', 'law'):
        if not f.get(k):
            틀.append(f'{k} 없음')
    if not re.match(r'^[a-z0-9-]+$', f.get('slug') or ''):
        틀.append('slug 꼴')
    if not (isinstance(f.get('notes'), list) and len(f['notes']) >= 2):
        틀.append('notes 2개 이상')
    if not isinstance(f.get('attach'), list):
        틀.append('attach')
    if f.get('group') != '안전' or f.get('gen') != 'web':
        틀.append('group/gen')
    if any(re.search(r'주민\s*등록\s*번호', r[0]) for b in f['sheet']['blocks'] if b['t'] == 'kv' for r in b['rows']):
        틀.append('주민등록번호 칸이 있음')
    return 틀


def main():
    only = '--check' in sys.argv
    fp = os.path.join(DATA, 'forms.json')
    tp = os.path.join(DATA, 'forms_tab.json')
    d = json.load(open(fp, encoding='utf-8'))
    tab = json.load(open(tp, encoding='utf-8'))
    새 = S.FORMS
    slugs = [f['slug'] for f in 새]
    틀 = []
    if len(set(slugs)) != len(slugs):
        틀.append('새 서식 slug 겹침')
    옛 = {f['slug'] for f in d['forms']} - set(slugs)
    try:
        orig = {f['slug'] for f in json.load(open(os.path.join(DATA, 'forms_orig.json'), encoding='utf-8'))['forms']}
    except Exception:
        orig = set()
    for f in 새:
        for e in 꼴검사(f) + 예시검사(f) + 글검사(f):
            틀.append(f'{f["slug"]}: {e}')
        if f['slug'] in orig:
            틀.append(f'{f["slug"]}: 원본 서식(forms_orig)과 slug 겹침')
    titles = [f['title'] for f in d['forms'] if f['slug'] not in slugs] + [f['title'] for f in 새]
    for t in set(titles):
        if titles.count(t) > 1:
            틀.append(f'제목 겹침: {t}')
    print(f'새 안전서식 {len(새)}가지 · 검사 틀림 {len(틀)}')
    for e in 틀:
        print('  ✗', e)
    if 틀:
        sys.exit(1)
    if only:
        print('✓ 검사만 — 고치지 않음')
        return
    by = {f['slug']: i for i, f in enumerate(d['forms'])}
    for f in 새:
        if f['slug'] in by:
            d['forms'][by[f['slug']]] = f
        else:
            d['forms'].append(f)
    # 묶음 — 작업계획서 · 작업허가서는 ③ · 나머지는 ⑥
    st = {s['k']: s for s in tab['stages']}
    놓인 = {k for s in tab['stages'] for k in s['slugs']}
    for f in 새:
        if f['slug'] in 놓인:
            continue
        k = 'plan' if f['slug'].startswith(('jg-', 'hg-')) else 'safety'
        st[k]['slugs'].append(f['slug'])
    open(fp, 'w', encoding='utf-8').write(json.dumps(d, ensure_ascii=False, indent=1))
    open(tp, 'w', encoding='utf-8').write(json.dumps(tab, ensure_ascii=False, indent=1))
    print(f'✓ forms.json {len(d["forms"])}가지 · 묶음 ③ {len(st["plan"]["slugs"])} · ⑥ {len(st["safety"]["slugs"])}')


if __name__ == '__main__':
    main()
