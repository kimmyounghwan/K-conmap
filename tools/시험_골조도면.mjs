/**
 * 골조 수량산출 — 도면 읽기(lib/골조도면.js) 시험 (2026-09-26)
 *   node tools/시험_골조도면.mjs
 * 예시 도면(web/public/jeoksan/골조_예시.dxf — tools/골조_예시도면.py 로 그린 가상 도면)을 읽어
 * 치수 값 · 선 길이 · 닫힌 선 면적 · 글자 · 누르기(가까운 도형·품은 도형)를 봅니다.
 */
import fs from 'fs'
import { 도면읽기, 찾기판, 가까운도형, 품은도형, 도형글자, 단위배율, 종류 } from '../web/src/lib/골조도면.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined ? ' = ' + JSON.stringify(got) : '')) }
const M = 도면읽기(fs.readFileSync(new URL('../web/public/jeoksan/골조_예시.dxf', import.meta.url), 'utf8'))
ok('단위 mm', 단위배율(M.units, M.box).k === 1, 단위배율(M.units, M.box))
const dims = []
for (let i = 0; i < M.E.t.length; i++) if (M.E.t[i] === 종류.치수) dims.push(M.E.val[i])
dims.sort((a, b) => a - b)
ok('치수 14개 (3500×6 · 7000×3 · 6000×3 · 2400 · 21000)', JSON.stringify(dims) === JSON.stringify([2400, 3500, 3500, 3500, 3500, 3500, 3500, 6000, 6000, 6000, 7000, 7000, 7000, 21000]), dims)
const 길 = {}
for (let i = 0; i < M.E.t.length; i++) if (M.E.t[i] === 종류.선) { const k = Math.round(M.E.len[i]); 길[k] = (길[k] || 0) + 1 }
ok('큰보 옆선 6400 (7000−600) 18개', 길[6400] === 18, 길[6400])
ok('작은보 옆선 5550 (6000−200−250) 12개', 길[5550] === 12, 길[5550])
const 면 = {}
for (let i = 0; i < M.E.t.length; i++) if (M.E.t[i] === 종류.닫힌폴리선) { const k = Math.round(M.E.area[i]); 면[k] = (면[k] || 0) + 1 }
ok('기둥 600각 0.36m² 13개 · 기초 2400각 5.76m² 1개', 면[360000] === 13 && 면[5760000] === 1, 면)
const 글 = new Set(M.T.s)
ok('글자 C1·G1·G2·B1·S1·F1 있음', ['C1', 'G1', 'G2', 'B1', 'S1', 'F1'].every((t) => 글.has(t)))
ok('C1 글자 12개', M.T.s.filter((t) => t === 'C1').length === 12)
const 판 = 찾기판(M)
const at = (X, Y, tol = 100) => 가까운도형(M, 판, X - M.ox, Y - M.oy, tol)
let e = at(3650, 3000)
ok('(3650,3000) 누르면 작은보 옆선 5550', e >= 0 && M.E.t[e] === 종류.선 && Math.round(M.E.len[e]) === 5550, e >= 0 ? M.E.len[e] : e)
e = at(3500, -1500, 300)
ok('치수선 누르면 7000', e >= 0 && M.E.t[e] === 종류.치수 && M.E.val[e] === 7000, e >= 0 ? M.E.val[e] : e)
e = at(620, 640, 200)
ok('C1 글자 누르면 «C1»', e >= 0 && 도형글자(M, e) === 'C1', e >= 0 ? 도형글자(M, e) : e)
e = 품은도형(M, 29000 - 900 - M.ox, 3000 - M.oy)
ok('기초 안쪽 누르면 5.76m²', e >= 0 && Math.round(M.E.area[e]) === 5760000, e >= 0 ? M.E.area[e] : e)
e = 품은도형(M, 29000 - M.ox, 3000 - M.oy)
ok('기초 속 기둥 안쪽은 더 작은 기둥 0.36m²', e >= 0 && Math.round(M.E.area[e]) === 360000, e >= 0 ? M.E.area[e] : e)
console.log(bad ? '\n✗ 틀린 것 ' + bad + '개' : '\n✓ 모두 맞음')
process.exit(bad ? 1 : 0)
