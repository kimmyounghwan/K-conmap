/**
 * 🧭 G479 벽 끝 «"U"형 BAR» 글 — lib/골조자동.js G281 U판 찾기(«U형 철근» · «U-BAR» 에 더해 «"U"형 BAR» · «“U”자형 BAR»)
 *   node tools/시험_벽끝U글.mjs
 * 현장 Y 일반사항 S-101 «6.2 벽체 단부 보강 상세» 그림 글은 «"U"형 BAR»(«* "U"형 BAR 배치간격 = A» · A = 벽체 수평근 간격) — 예전 글꼴(«U형 철근» · «U-BAR»)만 찾아 벽 끝 U 를 안 셈.
 * 가상 도면: 공개 예시 «골조자동_예시.dxf»(벽 W1 · 두께 200 · 수평 D10@200 · 1층 층고 3,600 · 길이 5,400) + 가상 일반사항 두 판(«구조일반사항» · «구조일반사항-2»).
 * 손셈(3D 없이 — 끝 몫 모름 → 양 끝): 한 끝 ⌈3,600/200⌉+1 = 19개 × 2 = 38개 · 한 개 = 인장이음 D10 610 × 2 + 두께 200 − 피복 20 × 2 = 1.38 m → 38 × 1.38 × 0.56 = 29.37 kg
 */
import fs from 'fs'
import { 도면읽기 } from '../web/src/lib/골조도면.js'
import { 골조읽기 } from '../web/src/lib/골조자동.js'
import { 셈 } from '../web/src/lib/골조.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
const 예 = fs.readFileSync(new URL('../web/public/jeoksan/골조자동_예시.dxf', import.meta.url), 'utf8')
const L = (x0, y0, x1, y1, ly = 'S-WALL') => ['0', 'LINE', '8', ly, '10', x0, '20', y0, '30', 0, '11', x1, '21', y1, '31', 0]
const T = (s, x, y, h = 100, ly = 'TEXT') => ['0', 'TEXT', '8', ly, '10', x, '20', y, '30', 0, '40', h, '1', s]
const 판 = (x, y, 이름) => [...L(x, y, x + 16820, y, 'FORM'), ...L(x + 16820, y, x + 16820, y + 11880, 'FORM'), ...L(x + 16820, y + 11880, x, y + 11880, 'FORM'), ...L(x, y + 11880, x, y, 'FORM'),
  ...Array.from({ length: 45 }, (_, i) => L(x + 1000 + i * 200, y + 2000, x + 1200 + i * 200, y + 2800, 'W')).flat(),
  ...T('TITLE', x + 12000, y + 800, 60), ...T(이름, x + 13600, y + 680, 70), ...T('가상 신축공사(rev.1)', x + 12800, y + 880, 90)]
/* 글들: [글, x, y] — 첫 판(0 ~ 16,820) · 둘째 판(20,000 ~ 36,820) */
const 일반 = (글들) => 도면읽기(['0', 'SECTION', '2', 'HEADER', '9', '$INSUNITS', '70', 4, '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES',
  ...판(0, 0, '구조일반사항'), ...판(20000, 0, '구조일반사항-2'), ...글들.flatMap(([s, x, y]) => T(s, x, y)), '0', 'ENDSEC', '0', 'EOF'].join('\n'))
const 읽 = (글들) => 골조읽기([{ 모델: 도면읽기(예), 이름: '골조자동_예시.dwg', k: 1 }, { 모델: 일반(글들), 이름: 'S-101 가상.dwg', k: 1 }])
const 제목 = ['6.2 벽체 단부 보강 상세', 1000, 9000]
const W1 = (R) => (R.공사.배근.벽 || []).find((r) => r.기호 === 'W1')
const U줄 = (R) => 셈(R.공사).줄.filter((x) => x.부재 === '벽' && /U형 철근/.test(x.비고 || ''))

console.log('① «"U"형 BAR»(현장 Y 글꼴) — 벽 끝 U 셈')
{
  const R = 읽([제목, ['"U"형 BAR', 2000, 8000], ['* "U"형 BAR 배치간격 = A', 2000, 7000], ['* 벽체 수평근 간격 = A', 2000, 7300]])
  ok('배근표 W1 단부U = U', W1(R) && W1(R).단부U === 'U', W1(R))
  const u = U줄(R)
  const kg = Math.round(u.reduce((a, x) => a + x.수량, 0) * 100) / 100
  ok('U 줄 하나 · D10 · 38본 × 1.38 m = 29.37 kg(손셈)', u.length === 1 && u[0].규격 === 'D10' && /38본 × 1\.38m/.test(u[0].비고) && Math.abs(kg - 29.37) < 0.02, u.map((x) => [x.규격, x.비고, x.수량]))
  ok('U 가 든 끝은 수평근 정착을 뺌(정착 0변)', 셈(R.공사).줄.some((x) => x.부재 === '벽' && /^수평근/.test(x.비고 || '') && !/정착 [12]변/.test(x.비고)), 셈(R.공사).줄.filter((x) => /^수평근/.test(x.비고 || '')).map((x) => x.비고))
}
console.log('② 다른 글꼴도 그대로 · 곱은 따옴표 · 자형')
for (const 글 of ['U형 철근', 'U-BAR', '“U”자형 BAR', "'U'형 bar"]) {
  const R = 읽([제목, [글, 2000, 8000]])
  ok(`«${글}» → 단부U = U · U 줄 38본`, W1(R) && W1(R).단부U === 'U' && U줄(R).some((x) => /38본/.test(x.비고)), W1(R))
}
console.log('③ 안 셈 — 글 없음 · 벽 글 없는 다른 판 · BARRIER(낱말이 다름)')
{
  const R0 = 읽([제목])
  ok('U 글 없음 → 단부U 없음 · U 줄 0', W1(R0) && !W1(R0).단부U && U줄(R0).length === 0, W1(R0))
  const R1 = 읽([제목, ['"U"형 BAR', 22000, 8000]])
  ok('«"U"형 BAR» 가 «벽체» 글 없는 다른 판에만 → 안 셈', W1(R1) && !W1(R1).단부U && U줄(R1).length === 0, W1(R1))
  const R2 = 읽([제목, ['U형 BARRIER', 2000, 8000]])
  ok('«U형 BARRIER» → 안 셈(BAR 낱말 아님)', W1(R2) && !W1(R2).단부U, W1(R2))
}

console.log(bad ? `✗ ${bad} 틀림` : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
