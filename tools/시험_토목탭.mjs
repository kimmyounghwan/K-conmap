/**
 * 🛣 K-적산컨맵 «토목» 탭 — lib/토목작업.js · 토목시트.js · 도면 3D 일꾼(G396 고침) 시험 (2026-10-24)
 *   node tools/시험_토목탭.mjs            (실제 현장 S: SITE_S=<도면 DXF · 시공측량 엑셀 폴더> 를 주면 그것도 — 몇 분)
 *   ① STA 글 · 측점 풀기  ② TM ↔ 경위도(GRS80 네 원점 · 왕복)  ③ 가상 예시(배수로 · 배수장 · 측량점 · 측점 성과 CSV) — 노선 · 측점표 · 자리 · 길잡이 · 도면함 · 맞대기 · 엑셀 시트
 *   ④ 노선 정리(같은 자리 두 이름 · 같은 이름 간격 다름)  ⑤ 측점 성과(부호만 다름 · 노선 짝)  ⑥ 좌표계 짐작
 *   ⑦ 🛰 측량 도면 «먼 곳 사본» 떼기(기준점 이름 · 다른 도면이 있는 무더기 · 먼 사본)  ⑧ 성과표 머리 «X - LIST · Y - LIST · GH»
 *   ⑨ 실제 현장 S(SITE_S) — 노선 6(같은 노선 두 벌 하나로) · 모두 기준점 둘레 · 측점 성과 맞대기(2 · 3 · 4 · 5호 · 배수장 모두 같음 · 1호 부호만 8 · NO.15+20 3 cm) · 경위도
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 파일주소 = (p) => pathToFileURL(p).href
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const W = path.join(여기, '..', 'web', 'src', 'lib')
const 공 = path.join(여기, '..', 'web', 'public', 'jeoksan')
const T = await import(파일주소(path.join(W, '토목작업.js')))
const { 경위도TM, TM원점, 측설표, 노선자리 } = await import(파일주소(path.join(W, '활용3d.js')))
const { F64, U8 } = await import(파일주소(path.join(W, 'dxf3d.js')))
const 시 = await import(파일주소(path.join(W, '토목시트.js')))
const { 토목모델 } = await import(파일주소(path.join(W, 'BIM토목.js')))
const { 성과표풀기 } = await import(파일주소(path.join(W, '성과표.js')))
let 끝 = null
globalThis.self = { postMessage: (m) => { if (m.type !== 'prog') 끝 = m } }
const 일꾼 = await import(파일주소(path.join(W, 'dxf3d.worker.js')))

let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(더).slice(0, 300))) }
const 가까 = (a, b, e = 1e-6) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= e
const 바이트 = (p) => { const b = fs.readFileSync(p); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) }
const 돌리기 = async (files, 성과 = null) => { 끝 = null; await self.onmessage({ data: { files, 성과 } }); if (!끝 || 끝.type !== 'done') throw new Error('일꾼 실패 ' + JSON.stringify(끝 && 끝.msg)); return 끝.r }

console.log('① STA 글 · 측점 풀기')
봐(T.STA글(186) === 'STA 0+186.00' && T.STA글(1043) === 'STA 1+043.00' && T.STA글(-7) === 'STA -0+007.00' && T.STA글(6.5) === 'STA 0+006.50', 'STA 글 — 0+186.00 · 1+043.00 · -0+007.00 · 0+006.50', [T.STA글(186), T.STA글(1043), T.STA글(-7), T.STA글(6.5)])
const 풀 = ['NO.3+36.00', 'NO.0-7.0', 'No 2+16', 'NO.6', 'STA 0+186.00', '1+043.5'].map(T.측점풀기)
봐(풀[0].n === 3 && 풀[0].d === 36 && 풀[1].n === 0 && 풀[1].d === -7 && 풀[2].n === 2 && 풀[2].d === 16 && 풀[3].n === 6 && 풀[3].d === 0 && 풀[4].m === 186 && 풀[5].m === 1043.5, '측점 풀기 — NO.3+36 · NO.0-7.0(−7) · No 2+16 · NO.6 · STA 0+186 · 1+043.5', JSON.stringify(풀))

console.log('② TM ↔ 경위도(GRS80 · 네 원점 · 왕복)')
let 최대 = 0
/* 원점마다 그 띠(원점 경도 ±1.5° — 측량 좌표를 쓰는 곳) 안 점 */
for (const 원 of TM원점.slice(0, 4)) for (const [la, d] of [[33.5, -1.4], [35.03, 0.76], [37.56, -0.02], [36.0, 1.3], [38.5, -0.9]]) {
  const lo = 원.lon0 + d
  const p = 경위도TM(la, lo, 원), q = T.TM경위도(p.X, p.Y, 원)
  최대 = Math.max(최대, Math.abs(q.위도 - la), Math.abs(q.경도 - lo))
}
봐(최대 < 1e-8, `경위도 → TM → 경위도 왕복 어긋남 ${최대.toExponential(1)}° (1e-8° 안 = 1 mm 안)`, 최대)
const 중 = T.TM경위도(600000, 200000, TM원점[1])
봐(가까(중.위도, 38, 1e-9) && 가까(중.경도, 127, 1e-9), '중부원점 가산점 X 600,000 · Y 200,000 → 위도 38° · 경도 127°(원점)', JSON.stringify(중))
봐(T.지도주소(35.0346, 127.7613).startsWith('https://map.kakao.com/link/map/'), '지도 주소(카카오맵)')

console.log('③ 가상 예시 — 배수로 · 배수장 · 측량점 · 측점 성과 CSV')
const 예파일 = ['BIM예시_측량도면.dxf', 'BIM예시_계획평면도.dxf', 'BIM예시_종횡단면도.dxf', 'BIM예시_배수장일반도.dxf'].map((n) => ({ name: n, buf: 바이트(path.join(공, n)) }))
const r예 = await 돌리기(예파일)
const 예성 = await T.측점성과읽기('BIM예시_측점성과.csv', fs.readFileSync(path.join(공, 'BIM예시_측점성과.csv')))
const D = T.토목자료(r예, { 이름: '가상', 예시: true, 측점성과: 예성, 좌표글: r예.좌표글 })
const 활 = D.활용
const 목 = T.노선목록(활)
봐(목.length === 1 && 목[0].이름 === '가상 배수로' && 목[0].간격 === 20 && 목[0].범위[0] === 0 && 목[0].범위[1] === 360 && 목[0].단면수 === 26 && 목[0].종단줄 === 26 && 목[0].밖수 === 7 && 목[0].끝측 === 500, '노선 1 — 가상 배수로 · 간격 20 m · NO.0 ~ NO.18(360 m) · 단면 26 · 종단 26 · 평면 노선 밖 7곳(500 m 까지)', JSON.stringify(목))
const 땅 = T.땅찾개(활)
const 표 = T.측점표(활, '가상 배수로', { 땅 })
봐(표.length === 26 && 표.filter((r) => r.밖).length === 7 && 표.every((r) => r.단면) && 표[1].측글 === 'NO.1' && 표[1].STA === 'STA 0+020.00', '측점표 26줄(0 ~ 500 m · 20 m 마다 · 밖 7 · 모두 횡단 단면)', 표.length + ' ' + 표.filter((r) => r.밖).length)
const 종 = 활.종단[0]
봐(표.every((r) => { const q = 종.줄.find((z) => Math.abs(z.m - r.측) < 0.01); return q && q.지반고 === r.지반고 && q.계획고 === r.계획고 }), '측점표 지반고 · 계획고 = 종단 표 값 그대로(26줄)')
const 측설 = 측설표(활, { 간격: 20, 폭: false, 구조: false }).줄
봐(측설.length >= 19 && 측설.filter((q) => q.측 <= 360).every((q) => { const r = 표.find((x) => Math.abs(x.측 - q.측) < 0.01); return r && 가까(r.X, q.X, 0.0015) && 가까(r.Y, q.Y, 0.0015) }), '측점표 X · Y = 측설표(활용3d) 좌표 · 1.5 mm 안')
봐(표.filter((r) => !r.밖).filter((r) => Number.isFinite(r.땅EL)).length >= 15, '땅 면 EL(측량점 삼각망) — 노선 안 측점 15곳 넘게 값', 표.map((r) => r.땅EL).join(','))
const L = 활.노선[0]
const p100 = 노선자리(L, 100)
const 자 = T.자리읽기(활, p100.x + p100.ty * 5000, p100.y - p100.tx * 5000, 땅)
봐(자.노선.length && 자.노선[0].이름 === '가상 배수로' && 가까(자.노선[0].s, 100, 0.05) && 가까(자.노선[0].옆, 5, 0.05) && 자.노선[0].측글 === 'NO.5' && 자.노선[0].지반고 === 종.줄.find((z) => z.m === 100).지반고 && Number.isFinite(자.EL), '자리읽기 — NO.5 오른쪽 5 m 누름 → STA 0+100 · 옆 +5.00 · 그 측점 지반고 · 땅 EL', JSON.stringify(자))
const 좌 = T.자리읽기(활, p100.x - p100.ty * 3000, p100.y + p100.tx * 3000, 땅)
봐(가까(좌.노선[0].옆, -3, 0.05), '자리읽기 — 왼쪽은 옆 −3.00', JSON.stringify(좌.노선[0]))
const 길 = T.토목길잡이(D)
봐(길.length === 7 && 길.slice(0, 6).every((x) => x.상태 === '✓') && 길[6].상태 === '▶', '길잡이 — ① ~ ⑥ ✓ · ⑦ 물량 ▶', 길.map((x) => x.상태).join(''))
const 빈길 = T.토목길잡이({ 활용: { 노선: [], 종단: [], 횡단: [], 구조: [] } })
봐(빈길[0].상태 === '▶' && 빈길[1].상태 === '⚠', '길잡이 — 빈 것은 ① ▶ · ② ⚠', 빈길.map((x) => x.상태).join(''))
const 함 = T.도면함(D.그룹)
봐(함.some((x) => x.상태 === '기준' && /측량/.test(x.이름)) && 함.some((x) => x.상태 === '맞춤' && /계획평면도/.test(x.이름)), '도면함 — 측량도면 = 기준 · 계획평면도 = 같은 글자로 맞춤', JSON.stringify(함.map((x) => x.이름 + ':' + x.상태)))
const 대 = T.측점성과대조(활, D.측점성과)
봐(대.length === 1 && 대[0].노선 === '가상 배수로' && 대[0].요약.맞음 === 26 && 대[0].요약.맞댐 === 26 && 대[0].요약.부호만 === 0 && 대[0].요약.시공최대 === 0.03, '측점 성과 CSV(가상) ↔ 종단 — 26/26 같음 · 시공 − 설계 최대 0.03 m', JSON.stringify(대.map((g) => g.요약)))
봐(D.좌표계.k === '중부' && /중부원점/.test(D.좌표계.까닭), '좌표계 짐작 — 글자 없으면 중부원점(까닭 붙음)', JSON.stringify(D.좌표계))
봐(D.틀 && D.틀[2] > D.틀[0] && D.바탕 instanceof Float32Array && D.바탕.length > 400 && D.원점.every(Number.isFinite), '현장 틀 · 바탕 선(Float32 · 원점 빼고) · 원점', D.바탕.length)
const 토 = 토목모델(활, D.center, {})
봐(토.부재.length > 20 && 토.노선들.length === 1 && 토.합.터파기 > 0 && 토.합.콘크리트 > 0, '3D 토목 모델 — 배수로 · 배수장 · 땅 덩어리 · 평균단면 합', 토.부재.length)
const 시트들 = [...시.토목시트(토, { QTY: 3 }), ...시.측점표시트([{ 이름: '가상 배수로', 줄: 표 }], { QTY: 3 }), 시.대조시트(대, { QTY: 3 }), 시.좌표계시트([['좌표', '실제']])]
봐(시트들.some((s) => s.name === '토목 집계') && 시트들.some((s) => s.name === '측점표 가상 배수로' && s.rows.length === 26 && s.rows[25][9]) && 시트들.some((s) => s.name === '측점 성과 대조' && s.rows.length === 26), '엑셀 시트 — 토목 집계 · 측점표(26줄 · 밖 비고) · 측점 성과 대조 · 좌표계', 시트들.map((s) => s.name).join(' / '))
const csv = T.측점표CSV('가상 배수로', 표)
봐(csv.split('\r\n')[0].startsWith('노선,측점,STA,X(북),Y(동),지반고,계획고') && csv.split('\r\n').length === 28 && /평면 노선 밖/.test(csv), '측점표 CSV — 머리 · 26줄 · 밖 비고')

console.log('④ 노선 정리')
const 줄만 = (pts, s0, s1) => { const a = []; const n = pts.length; for (let i = 0; i < n; i++) { const t = i / (n - 1); a.push(s0 + (s1 - s0) * t, pts[i][0], pts[i][1], 1, 0) } return Float64Array.from(a) }
const 곧 = (x0, len) => [[x0, 0], [x0 + len * 500, 0], [x0 + len * 1000, 0]]
const 활2 = {
  노선: [
    { 이름: 'A 사업', 간격: 50, 범위: [0, 300], 줄: 줄만(곧(0, 300), 0, 300) },
    { 이름: 'A 3호 배수로', 간격: 50, 범위: [0, 300.2], 줄: 줄만(곧(0, 300.2), 0, 300.2) },
    { 이름: '배수장 부근', 간격: 25, 범위: [0, 200], 줄: 줄만(곧(1e6, 160), 0, 200) },
    { 이름: '배수장 부근', 간격: 20, 범위: [0, 160], 줄: 줄만(곧(1e6, 160), 0, 160) },
  ],
  종단: [{ 노선: '배수장 부근', 줄: [{ m: 0, 글: 'No.0', 지반고: 1 }, { m: 20, 글: 'No.1', 지반고: 1 }, { m: 40, 글: 'No.2', 지반고: 1 }] }],
  횡단: [{ 노선: 'A 3호 배수로', 단면: [{ 측: 0 }] }],
}
const 정 = T.노선정리(활2)
봐(정.노선.length === 2 && 정.노선.some((x) => x.이름 === 'A 3호 배수로') && 정.노선.some((x) => x.이름 === '배수장 부근' && x.간격 === 20), '같은 자리 두 이름 → 횡단 붙은 «A 3호 배수로» · 같은 이름 간격 25 · 20 → 종단 표(No.1 = 20 m)와 맞는 20', JSON.stringify(정.노선.map((x) => x.이름 + ':' + x.간격)))
봐(정.겹.length === 2 && 정.겹.some((x) => /간격 20 m 인 것을 씀\(25 m/.test(x.까닭)), '정리한 까닭 둘(간격 다른 두 벌 글)', JSON.stringify(정.겹))

const 음 = T.노선목록({ 노선: [{ 이름: '2호', 간격: 50, 범위: [-7, 270], 줄: 줄만(곧(0, 277), -7, 270) }], 종단: [], 횡단: [] })[0]
봐(음.시작.측글 === 'NO.0-7.00' && 음.시작.STA === 'STA -0+007.00' && 음.끝.측글 === 'NO.5+20.00', '0 앞 측점 — «NO.0-7.00»(도면 꼴) · STA -0+007.00', JSON.stringify(음.시작))
console.log('⑤ 측점 성과 — 부호만 다름 · 노선 짝 · 머리')
const 성 = T.측점성과풀기([['▣ 측량성과표(1호배수로'], ['위치', '설계지반고', '시공측량 지반고', '오차'], ['NO.0', 0.44, 0.45, -0.01], ['NO.1', 0.31, 0.36, -0.05], ['NO.1+20', 1.2, 1.21, 0]], '측량성과표(1호 배수로)')
봐(성 && 성.노선글 === '1호 배수로' && 성.줄.length === 3 && 성.줄[2].n === 1 && 성.줄[2].d === 20, '측점 성과 풀기 — 시트 이름 괄호 → «1호 배수로» · 줄 3', JSON.stringify(성))
봐(T.노선짝('1호 배수로', ['○○지구 2호 배수로', '○○지구 1호(중앙)배수로', '배수장 부근']) === '○○지구 1호(중앙)배수로' && T.노선짝('배수장', ['○○지구 1호 배수로', '배수장 부근']) === '배수장 부근' && T.노선짝('7호 배수로', ['○○지구 1호 배수로']) === null, '노선 짝 — 1호 ↔ 1호(중앙) · 배수장 ↔ 배수장 부근 · 없는 7호는 없음')
const 활3 = { 노선: [{ 이름: '○○지구 1호(중앙)배수로', 간격: 50, 범위: [0, 100], 줄: 줄만(곧(0, 100), 0, 100) }], 종단: [{ 노선: '○○지구 1호(중앙)배수로', 줄: [{ m: 0, 지반고: -0.44 }, { m: 50, 지반고: -0.31 }, { m: 70, 지반고: 1.2 }] }] }
const 대3 = T.측점성과대조(활3, [성])
봐(대3[0].요약.맞댐 === 3 && 대3[0].요약.부호만 === 2 && 대3[0].요약.맞음 === 1 && 대3[0].줄[0].부호만 && 대3[0].요약.시공최대 === 0.05, '도면 −0.44 · 파일 0.44 → «부호만 다름» 2 · 같음 1 · 시공 − 설계 최대 0.05', JSON.stringify(대3[0].요약))
봐(T.측점성과풀기([['POINT', 'X - LIST', 'Y - LIST', 'GH'], ['송-1', 271195.3, 269465.0, 2.9]], '측량성과표') === null, '좌표 성과표(점 · X · Y)는 측점 성과로 안 읽음')

console.log('⑥ 좌표계 짐작')
봐(T.좌표계짐작(true, ['측량용역 현황도-GRS80좌표계']).k === '중부' && /GRS80/.test(T.좌표계짐작(true, ['GRS80좌표계']).까닭), '«GRS80» 글자 → 중부(원점 글자 없으면) · 까닭에 GRS80')
봐(T.좌표계짐작(true, ['동부원점 GRS80']).k === '동부' && T.좌표계짐작(true, ['서부 원점']).k === '서부', '«동부원점» → 동부 · «서부 원점» → 서부')
봐(/수백 m/.test(T.좌표계짐작(true, ['Bessel, 중부']).까닭), '«Bessel» → 옛 좌표 알림(수백 m 어긋남)')
봐(T.좌표계짐작(false, ['GRS80']).k === '도면', '측량 자료가 기준이 아니면 «도면 좌표»')

console.log('⑥½ 토목을 못 찾았을 때 까닭(도면 제목으로)')
const 못P = T.못찾음글({ 그룹: [{ 제목: 'ROAD ARRANGEMENT PLAN' }, { 제목: 'FOUNDATION PLAN (FL±0.000)' }, { 제목: 'BEAM PLAN' }, { 제목: 'EXCAVATION SECTION-1' }], 활용: { 흙막이: [] } })
봐(/건축 탭/.test(못P) && /측점\(NO\.0 · 0\+020\) 노선이 없어/.test(못P) && !/흙막이 평면도/.test(못P), '플랜트 기초 · 도로 도면 → «골조는 건축 탭» · «측점 노선 없음»', 못P)
const 못Y = T.못찾음글({ 그룹: [{ 제목: '가설흙막이 단면도(A)' }, { 제목: '가설흙막이 전개도(1)' }], 활용: { 흙막이: [] } })
봐(/흙막이 평면도\(H-PILE 자리/.test(못Y) && !/건축 탭/.test(못Y), '흙막이 단면 · 전개도만 → «흙막이 평면도를 같이»', 못Y)
console.log('⑦ 🛰 측량 도면 «먼 곳 사본» 떼기(dxf3d.worker.js 먼곳떼기)')
const 버킷 = () => ({ pos: new F64(), col: new U8(), pts: new F64(64), pcol: new U8(64) })
const 만들기 = (뭉치들) => {
  const out = new Map(), b = 버킷(), z = 버킷()
  for (const [cx, cy, n, 높] of 뭉치들) for (let i = 0; i < n; i++) {
    const x = cx + (i % 20) * 30000, y = cy + Math.floor(i / 20) * 30000
    b.pos.push6(x, y, 0, x + 20000, y, 0); b.col.push3(1, 1, 1); b.col.push3(1, 1, 1)
    if (높) { z.pts.push3(x, y, 3000 + i); z.pcol.push3(1, 1, 1) }
  }
  out.set('0\u0001선', b); out.set('0\u0001점', z)
  return out
}
const 표본 = (out) => { const xs = [], ys = [], ws = []; for (const [, b] of out) for (let i = 0; i < b.pos.n; i += 6) { xs.push(b.pos.a[i]); ys.push(b.pos.a[i + 1]); ws.push(1) } return { xs, ys, ws } }
const 상자 = (t) => (t.xs.length ? [Math.min(...t.xs), Math.min(...t.ys), Math.max(...t.xs), Math.max(...t.ys)] : null)
/* 진짜(0,0) · 4.3 km 남쪽 같은 측량(이름 같이 있음) · 445 km 밖 사본(점 없음) */
const 진 = [0, 0], 남 = [0, -4.3e6], 먼 = [-4.45e8, 7e7]
const g = { 제목: '도곽 밖', 파일: ['GPS도면.dxf'], 파일번: 1, 층들: ['1·도곽 밖'], out: 만들기([[...진, 400, true], [...남, 400, true], [...먼, 300, false]]),
  글: [...[진, 남, 먼].flatMap(([x, y]) => ['송-1', '송-2', 'TBM-1'].map((s, i) => ({ s, k: '점' + s, 종: '기준점', w: 1, x: x + i * 50000, y: y + 50000 })))] }
const 다른 = [{ 파일: ['계획평면도.dxf'], 파일번: 2, 표본: { xs: [200000, 300000], ys: [100000, 150000], ws: [1, 1] } }]
const 뗀 = 일꾼.먼곳떼기(g, 표본, 상자, [g, ...다른])
const 남은상자 = 상자(표본(g.out))
봐(뗀 && 뗀.켬 === false && 뗀.무리 == null && 뗀.먼곳 && 뗀.종류 === '밖', '먼 곳은 떼어 꺼 둔 «밖» 그룹(무리 없음)', JSON.stringify(뗀 && { 켬: 뗀.켬, 무리: 뗀.무리, 종류: 뗀.종류 }))
봐(남은상자[1] >= -1 && 남은상자[0] >= -1 && g.글.every((p) => p.y > 0 && p.x >= 0 && p.x < 5e6), '남은 것 = 다른 도면이 있는 진짜 자리(4.3 km 남쪽 같은 측량 · 445 km 사본 모두 뗌) · 기준점 글도 진짜 것만', JSON.stringify({ 남은상자, 글: g.글.length }))
/* 측량점 무더기 = 570 m 네모 → 둘레 1.5 km 안(1.6 km 옆 = 끝에서 1 km)은 그대로 · 3.6 km 옆(끝에서 3 km)은 뗌 */
const g2 = { 제목: '도곽 밖', 파일: ['GPS.dxf'], 파일번: 1, 층들: ['1'], out: 만들기([[...진, 400, true], [1.6e6, 0, 100, false]]), 글: [] }
봐(일꾼.먼곳떼기(g2, 표본, 상자, []) === null, '측량점 둘레 1.5 km 안 그림은 안 뗌(측량 끝에서 1 km 옆 — 토출부 · 가도 같은 곳)')
const g2b = { 제목: '도곽 밖', 파일: ['GPS.dxf'], 파일번: 1, 층들: ['1'], out: 만들기([[...진, 400, true], [3.6e6, 0, 100, false]]), 글: [] }
const 뗀2 = 일꾼.먼곳떼기(g2b, 표본, 상자, [])
봐(뗀2 && 표본(뗀2.out).xs.length === 100 && 표본(g2b.out).xs.length === 400, '측량 끝에서 3 km 옆 그림은 뗌(선 100 → 뗀 쪽 · 측량 400 남음)', 뗀2 && 표본(뗀2.out).xs.length)
const g3 = { 제목: '도곽 밖', 파일: ['GPS.dxf'], 파일번: 1, 층들: ['1'], out: 만들기([[...진, 5, true], [...먼, 300, false]]), 글: [] }
봐(일꾼.먼곳떼기(g3, 표본, 상자, []) === null, '높이 든 점이 12개 안 되면 어디가 측량 자리인지 몰라 그대로')

console.log('⑧ 성과표 머리 «X - LIST · Y - LIST · GH»')
const 성과 = 성과표풀기([['▣  측량성과표'], ['POINT ', 'X - LIST', 'Y - LIST', 'GH', 'REMARKS'], ['송-1', '271195.3173', '269465.0356', '2.934', '측량못'], ['송-2', '271005.8815', '269552.4819', '3.382', ''], ['TBM-1', '271195.5134', '269478.3937', '3.27', ''], ['', ' ', ' ', ' ', '']])
봐(성과 && 성과.점.length === 3 && 성과.점[0].이름 === '송-1' && 성과.점[0].N === 271195.3173 && 성과.점[0].E === 269465.0356 && 성과.점[0].Z === 2.934, '«X - LIST» = 북 · «Y - LIST» = 동 · «GH» = 표고 · 점 3', JSON.stringify(성과 && 성과.점))

if (process.env.SITE_S) {
  console.log('⑨ 실제 현장 S(SITE_S) — 도면 · 시공측량 결과')
  const 곳 = process.env.SITE_S
  const 들 = fs.readdirSync(곳).filter((f) => /\.dxf$/i.test(f)).map((f) => ({ name: f, buf: 바이트(path.join(곳, f)) }))
  const 엑 = fs.readdirSync(곳).filter((f) => /\.xlsx?$/i.test(f))
  const 측성 = []
  for (const f of 엑) for (const x of await T.측점성과읽기(f, fs.readFileSync(path.join(곳, f)))) 측성.push(x)
  const t0 = Date.now()
  const r = await 돌리기(들)
  console.log('   일꾼', Math.round((Date.now() - t0) / 1000), '초')
  const S = T.토목자료(r, { 측점성과: 측성, 좌표글: r.좌표글 })
  const 노 = S.활용.노선
  봐(노.length === 6 && S.겹노선.length >= 1, `노선 6(같은 노선 두 벌 · 같은 자리 두 이름은 하나로 · 정리 ${S.겹노선.length})`, 노.map((x) => x.이름).join(' / '))
  /* 기준 = 같은 엑셀의 좌표 성과표 첫 점(시트 «측량성과표») — 실제 좌표를 시험 파일에 적지 않음 */
  const { 성과표읽기 } = await import(파일주소(path.join(W, '성과표.js')))
  const 첫 = (await 성과표읽기(엑[0], fs.readFileSync(path.join(곳, 엑[0])))).점[0]
  const 기준 = [첫.E * 1000, 첫.N * 1000]
  const 멀리 = 노.map((L) => { let d = Infinity; for (let i = 0; i < L.줄.length; i += 5) d = Math.min(d, Math.hypot(L.줄[i + 1] - 기준[0], L.줄[i + 2] - 기준[1])); return d / 1000 })
  봐(멀리.every((d) => d < 2500), '모든 노선이 성과표 첫 기준점 2.5 km 안 — 먼 곳 사본(4.3 km · 445 km)에 안 섬', 멀리.map((d) => d.toFixed(0)).join(','))
  const 대S = T.측점성과대조(S.활용, 측성)
  const 호 = (n) => 대S.find((g) => new RegExp(n).test(g.노선글))
  봐(대S.length >= 6 && ['2호', '3호', '4호', '5호', '금동'].every((n) => { const g = 호(n); return g && g.노선 && g.요약.맞댐 === g.요약.n && g.요약.맞음 === g.요약.n }), '측점 성과 ↔ 도면 종단 — 2 · 3 · 4 · 5호 · 배수장 모든 측점 같음(NO.0-7.0 · NO.2+16 · NO.6+40.18 도)', JSON.stringify(대S.map((g) => g.노선글 + ' ' + g.요약.맞음 + '/' + g.요약.n)))
  const 일 = 호('1호')
  const 다른 = 일 ? 일.줄.filter((r) => !r.부호만 && Math.abs(r.차) > 0.005) : []
  봐(일 && 일.요약.맞댐 === 33 && 일.요약.부호만 === 8 && 일.요약.맞음 === 24 && 다른.length === 1 && 다른[0].글 === 'NO.15+20' && 다른[0].차 === -0.03, '1호 — 33 측점: 같음 24 · 부호만 다름 8(NO.0 ~ NO.6 도면 −0.44 · 파일 0.44) · NO.15+20 만 3 cm(도면 0.74 · 파일 0.71)', 일 && JSON.stringify(일.요약) + ' ' + JSON.stringify(다른))
  봐(/GRS80/.test(S.좌표계.까닭), '좌표계 — 도면 글자 «GRS80» 찾음', JSON.stringify(S.좌표계))
  const x = (S.틀[0] + S.틀[2]) / 2, y = (S.틀[1] + S.틀[3]) / 2
  const 경 = T.TM경위도(y / 1000, x / 1000, TM원점[1])
  봐(경 && 경.위도 > 34.9 && 경.위도 < 35.1 && 경.경도 > 127.6 && 경.경도 < 127.9, '현장 가운데 경위도(중부원점) — 현장 자리(위도 34.9 ~ 35.1 · 경도 127.6 ~ 127.9)', JSON.stringify(경))
}

console.log(`\n${ok + bad}개 중 맞음 ${ok} · 틀림 ${bad}`)
if (bad) { console.log('✗ 틀림 있음'); process.exit(1) } else console.log('✓ 모두 맞음')
