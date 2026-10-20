# -*- coding: utf-8 -*-
"""✍️ G346 시험 — 새 안전서식(tools/forms_web/안전서식.py) 검사 · forms.json · forms_tab.json 과 같은지(손으로 고쳐 어긋나지 않았나)
   python tools/시험_웹서식.py"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'forms_web'))
import 안전서식 as S  # noqa: E402

틀 = 0
def 봐(c, m):
    global 틀
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c:
        틀 += 1

r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'forms_web', '더하기.py'), '--check'], capture_output=True, text=True, encoding='utf-8')
봐(r.returncode == 0, '더하기.py --check 통과 — ' + (r.stdout.strip().splitlines() or [''])[0])
d = json.load(open(os.path.join(ROOT, 'web', 'src', 'data', 'forms.json'), encoding='utf-8'))
by = {f['slug']: f for f in d['forms']}
tab = json.load(open(os.path.join(ROOT, 'web', 'src', 'data', 'forms_tab.json'), encoding='utf-8'))
놓인 = {k for s in tab['stages'] for k in s['slugs']}
같음 = [f['slug'] for f in S.FORMS if by.get(f['slug']) == f]
봐(len(같음) == len(S.FORMS), f'forms.json 에 새 서식 {len(같음)}/{len(S.FORMS)}가지가 원본과 같음')
봐(all(f['slug'] in 놓인 for f in S.FORMS), '모든 새 서식이 서식 탭 묶음에 놓임')
봐(all(f['group'] == '안전' and f['gen'] == 'web' for f in S.FORMS), '모두 안전 · gen web(엑셀 없이 작성 → PDF)')
봐(not any(os.path.exists(os.path.join(ROOT, 'web', 'public', 'forms', f['slug'] + '.xlsx')) for f in S.FORMS), '새 서식에 엑셀 파일 없음')
봐(len({f['title'] for f in d['forms']}) == len(d['forms']), '서식 제목 겹침 없음')
print(f'\n웹서식 {len(S.FORMS)}가지 · 틀림 {틀}')
sys.exit(1 if 틀 else 0)
