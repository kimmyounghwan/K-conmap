/**
 * 📑 판마다 층 고르기 — 골조읽기(…, { 판층 }) (2026-10-16 · 다)
 *   node tools/시험_판층.mjs
 * 소장님 「박스형으로 여러 장이 든 도면에서 판 제목을 못 읽은 장은 «이 장은 몇 층?» 을 고르게」
 * 가상 2층 라멘조(web/public/jeoksan/골조자동_예시.dxf)를 판(도곽) 네 장으로 두르고 «지붕층 구조평면도» 제목을 층 없는 «구조평면도» 로 바꾸면
 *   그 판의 부재가 «제목 없는 평면(2)» 으로 가 물량이 달라짐 → 판 목록에서 그 판을 «지붕» 으로 고르면 처음과 같은 물량.
 */
import fs from 'fs'
import { 도면읽기, 단위배율 } from '../web/src/lib/골조도면.js'
import { decodeBytes } from '../web/src/lib/dxf3d.js'
import { 골조읽기 } from '../web/src/lib/골조자동.js'
import { 셈 } from '../web/src/lib/골조.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
/* 예시 도면엔 판 테두리가 없어 — 평면 셋을 «박스(도곽)» 셋으로 둘러 한 파일 여러 장으로 만듦 */
const 네 = (x0, y0, x1, y1) => ['  0', 'LWPOLYLINE', '  8', 'SHEET', ' 90', '4', ' 70', '1', ...[[x0, y0], [x1, y0], [x1, y1], [x0, y1]].flatMap(([x, y]) => [' 10', String(x), ' 20', String(y)])].join('\n')
const 박스 = [네(-6000, -7200, 27000, 16135), 네(-6000, 17300, 27000, 40635), 네(28000, -7200, 61000, 16135), 네(28000, 17300, 61000, 40635)].join('\n')   /* 종이 비율(A) 네 장 — 2층 · 지붕 · 기초 · 일람 */
const 원 = fs.readFileSync(new URL('../web/public/jeoksan/골조자동_예시.dxf', import.meta.url), 'utf8').replace(/\r\n/g, '\n')   /* PC(윈도) 는 깃이 줄끝을 CRLF 로 받음 — LF 로 맞춰 박스를 끼움(G302 1회째 PC 시험에서 멈춘 까닭) */
const 글0 = 원.replace('ENTITIES\n', 'ENTITIES\n' + 박스 + '\n')
const 모델 = (글) => { const M = 도면읽기(글); return [{ 모델: M, 이름: '예시.dxf', k: 단위배율(M.units, M.box, M.ox, M.oy).k || 1 }] }
const 콘 = (R) => { const S = 셈(R.공사); return Math.round(S.줄.filter((x) => x.항목 === '콘크리트').reduce((a, x) => a + x.수량, 0) * 1000) / 1000 }

const R0 = 골조읽기(모델(글0))
const c0 = 콘(R0)
const 판들0 = R0.읽음.판[0].판
const 이층 = 판들0.find((x) => x.층.includes('R'))      /* 지붕층 판 — 제목이 없으면 «2» 로 보던 것과 달라야 시험이 됨 */
ok('처음 — 판 목록에 판마다 층(제목에서) · 지붕층 판 있음', !!이층 && 판들0.some((x) => x.층.includes('FT')), 판들0.map((x) => [x.p, x.이름, x.층]))

const 글1 = 글0.replace('지붕층 구조평면도', '구조평면도')
const R1 = 골조읽기(모델(글1))
const c1 = 콘(R1)
const 그판 = R1.읽음.판[0].판.find((x) => x.p === 이층.p)
ok('제목에서 층을 지우면 — 그 판 층 없음 · 물량이 달라짐', 그판 && 그판.층.length === 0 && Math.abs(c1 - c0) > 0.5, [그판 && 그판.층, c0, c1])

const R2 = 골조읽기(모델(글1), { 판층: { ['0|' + 이층.p]: 'R' } })
const c2 = 콘(R2)
const 고른판 = R2.읽음.판[0].판.find((x) => x.p === 이층.p)
ok('그 판을 «지붕(R)» 으로 고르면 — 처음과 같은 콘크리트(' + c0 + ' ㎥)', Math.abs(c2 - c0) < 0.001, [c0, c2])
ok('판 목록에 고른 층 표시(고른층 R · 층 [R])', 고른판 && 고른판.고른층 === 'R' && 고른판.층.includes('R'), 고른판 && [고른판.고른층, 고른판.층])
ok('판 목록 파일마다 번(도면 차례)', R2.읽음.판[0].번 === 0)

const R3 = 골조읽기(모델(글0), { 판층: { ['0|' + 이층.p]: '' } })
ok('빈 값(자동)은 그대로', Math.abs(콘(R3) - c0) < 0.001)

console.log(bad ? `\n✗ ${bad}건 틀림` : '\n✓ 모두 맞음')
process.exit(bad ? 1 : 0)
