# -*- coding: utf-8 -*-
"""🚀 G366 사이트 배포 도구 판 묶기 시험 — python tools/시험_배포판.py
10-22 07:18 에 나온 firebase-tools 15.34.1 이 배포 앞에 서비스 사용량 API 를 물어 403 으로 멈춤(#1334).
① update.yml «사이트 배포» 단계에 firebaseToolsVersion 이 정확한 판(숫자.숫자.숫자)으로 묶여 있는지 — latest · 빈 값 아님
② 묶은 판 = 15.34.0 (마지막으로 된 판 · #1333)
③ 배포 단계의 다른 값(계정 · 프로젝트 · live · web)은 그대로
④ 다른 일꾼 파일에 «firebase-tools@latest» 로 배포하는 곳이 없는지
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WF = os.path.join(ROOT, '.github', 'workflows')
묶은판 = '15.34.0'
틀림 = 0


def 봐(c, m):
    global 틀림
    print(('  ✓ ' if c else '  ✗ ') + m)
    if not c:
        틀림 += 1


글 = open(os.path.join(WF, 'update.yml'), encoding='utf-8').read().replace('\r\n', '\n')
# «사이트 배포» 단계 한 덩어리(다음 «- name:» 앞까지)
m = re.search(r'\n      - name: 사이트 배포\n(.*?)(?=\n      - name: |\n      # ═)', 글, re.S)
봐(m is not None, '«사이트 배포» 단계가 있음')
단계 = m.group(1) if m else ''
판 = re.search(r'\n          firebaseToolsVersion:\s*([^\s#]+)', 단계)
봐(판 is not None and re.fullmatch(r'\d+\.\d+\.\d+', 판.group(1) or ''), '판이 정확한 숫자로 묶임 (latest 아님) — ' + (판.group(1) if 판 else '없음'))
봐(판 is not None and 판.group(1) == 묶은판, f'묶은 판 = {묶은판} (마지막으로 된 판)')
for 줄 in ('uses: FirebaseExtended/action-hosting-deploy@v0', 'firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}',
           'projectId: k-conmap', 'channelId: live', 'entryPoint: web', 'repoToken: ${{ secrets.GITHUB_TOKEN }}'):
    봐(줄 in 단계, '그대로 — ' + 줄)
봐(sum(1 for l in 단계.split('\n') if re.match(r'^ {10}\S', l)) == 6, '배포 값 6줄(전 5 + 판 1) — 더 바뀐 값 없음')
남 = []
for f in sorted(os.listdir(WF)):
    if f.endswith(('.yml', '.yaml')):
        t = open(os.path.join(WF, f), encoding='utf-8').read()
        if re.search(r'firebase-tools@latest|firebaseToolsVersion:\s*latest', t):
            남.append(f)
봐(not 남, '다른 일꾼 파일에 «latest» 배포 없음 ' + (str(남) if 남 else ''))
print('\n✓ 모두 맞음' if not 틀림 else f'\n✗ {틀림} 틀림')
sys.exit(1 if 틀림 else 0)
