/**
 * 마감 수량산출 — 셈(lib/마감.js)·도면의 표 읽기 시험 (2026-09-27)
 *   node tools/시험_마감.mjs
 * 예시 공사(예시공사)와 예시 도면(web/public/jeoksan/마감_예시.dxf — tools/마감_예시도면.py 로 그린 가상 평면도)으로
 * 손셈한 값과 맞춰 봅니다.
 */
import fs from 'fs'
import { 셈, 예시공사, 창호풀기, 창호글, 마감표읽기, 창호표읽기 } from '../web/src/lib/마감.js'
import { 도면읽기, 품은도형, 종류 } from '../web/src/lib/골조도면.js'
import { 표찾기 } from '../web/src/lib/도면자동.js'
import { decodeBytes } from '../web/src/lib/dxf3d.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined ? ' = ' + JSON.stringify(got) : '')) }
const 같다 = (a, b) => Math.abs(a - b) < 1e-6

console.log('① 창호 글')
ok('「WD1*2 AW1 wd1」 → WD1 3개·AW1 1개', JSON.stringify(창호풀기('WD1*2 AW1 wd1')) === JSON.stringify([{ 기호: 'WD1', n: 3 }, { 기호: 'AW1', n: 1 }]), 창호풀기('WD1*2 AW1 wd1'))
ok('다시 글로', 창호글(창호풀기('WD1*2 AW1')) === 'WD1*2 AW1')

console.log('② 예시 공사 셈 (손셈)')
const R = 셈(예시공사())
const 합 = (재료, 규격) => R.집계.합.filter((a) => a.재료 === 재료 && (!규격 || a.규격 === 규격)).reduce((s, a) => s + a.수량, 0)
ok('경고 없음', R.경고.length === 0, R.경고)
ok('비닐타일 48+30 = 78', 같다(합('비닐타일'), 78), 합('비닐타일'))
ok('몰탈 (48+30)×0.024 = 1.872', 같다(합('시멘트 몰탈'), 1.872), 합('시멘트 몰탈'))
ok('벽 미장 = (28×2.7−0.9×2.1−1.8×1.5×2) + (22×2.7−0.9×2.1−1.8×1.5) = 68.31+54.81 = 123.12', 같다(합('벽 미장'), 123.12), 합('벽 미장'))
ok('화장실 벽 타일 12×2.4−0.8×2.1−0.6×0.6 = 26.76', 같다(합('자기질 타일', '200×250'), 26.76), 합('자기질 타일', '200×250'))
ok('걸레받이 (28−0.9)+(22−0.9) = 48.2 (창은 안 뺌)', 같다(합('비닐 걸레받이'), 48.2), 합('비닐 걸레받이'))
ok('몰딩 28+22 = 50', 같다(합('걸레받이·몰딩(PVC)'), 50), 합('걸레받이·몰딩(PVC)'))
ok('텍스 천장 78 · 석고보드 9', 같다(합('흡음텍스'), 78) && 같다(합('방수 석고보드'), 9))
const 한줄 = R.줄.find((x) => x.실명 === '사무실' && x.부위 === '벽' && x.재료 === '벽 미장')
ok('사무실 벽 산출근거 식', 한줄 && 한줄.식 === '(28*2.7-0.9*2.1-1.8*1.5*2)', 한줄 && 한줄.식)

console.log('③ 검산')
const P = 예시공사()
P.실[0].창호 = 'WD9'
P.실[1].면적 = ''
P.실[2].벽 = 'X9'
const R2 = 셈(P)
ok('없는 창호 · 빈 면적 · 없는 마감 기호 경고 3개 이상', R2.경고.length >= 3, R2.경고.map((w) => w.글))

console.log('④ 예시 도면')
const buf = fs.readFileSync(new URL('../web/public/jeoksan/마감_예시.dxf', import.meta.url))
const M = 도면읽기(decodeBytes(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)))
const 방 = []
for (let e = 0; e < M.E.t.length; e++) if (M.E.t[e] === 종류.닫힌폴리선 && M.layers[M.E.ly[e]].name === 'A-실') 방.push([Math.round(M.E.area[e] / 1e4) / 100, Math.round(M.E.len[e]) / 1000])
방.sort((a, b) => b[0] - a[0])
ok('방 3개 면적·둘레 (48,28) (30,22) (9,12)', JSON.stringify(방) === JSON.stringify([[48, 28], [30, 22], [9, 12]]), 방)
const e = 품은도형(M, 4000 - M.ox, 3000 - M.oy)
ok('사무실 안 누르면 48 m²', e >= 0 && Math.round(M.E.area[e] / 1e4) / 100 === 48)
const 창글 = (t) => M.T.s.filter((s, i) => s === t && M.layers[M.E.ly[M.T.e[i]]].name === 'A-창호').length
ok('평면의 WD1 글자 2개 · AW1 3개 (창호일람표 것은 빼고)', 창글('WD1') === 2 && 창글('AW1') === 3, [창글('WD1'), 창글('AW1')])
const 표 = 표찾기(M)
const 마 = 마감표읽기(표)
ok('실내재료마감표 3줄 (화장실 F2·W2·C2·2.4)', 마.length === 3 && 마[2].실명 === '화장실' && 마[2].바닥 === 'F2' && 마[2].천장고 === '2.4', 마)
const 창 = 창호표읽기(표)
ok('창호일람표 4개 (AW1 1.8×1.5 창 · WD1 문)', 창.length === 4 && 창.find((w) => w.기호 === 'AW1').폭 === '1.8' && 창.find((w) => w.기호 === 'WD1').구분 === '문', 창)
console.log(bad ? '\n✗ 틀린 것 ' + bad + '개' : '\n✓ 모두 맞음')
process.exit(bad ? 1 : 0)
