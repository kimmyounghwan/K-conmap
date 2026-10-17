/* 🎨 컬러 평면도 · 🚪 피난 안내도 시험 — node tools/시험_컬러평면.mjs   (OUT=폴더 면 예시 PDF · DXF 를 씀)
   예시 도면 둘(tools/컬러평면_예시도면.py — 가상): 84㎡형 집 · 3층 학원. 손으로 셈한 안목 넓이 · 길 · 출구 · 별표 2의2 점검 · DXF 짜임 · PDF. */
import { readFileSync, writeFileSync } from 'fs'
import { createRequire } from 'module'
import { 도면읽기, 단위배율 } from '../web/src/lib/골조도면.js'
import * as C from '../web/src/lib/컬러평면.js'
import { 컬러장면, 피난장면, 기준점검, 빗금, 맞춤 } from '../web/src/lib/컬러평면장면.js'
import { DXF만들기 } from '../web/src/lib/컬러평면dxf.js'
import { 장면들PDF, PDF환경 } from '../web/src/lib/장면그림.js'

let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (!c && got !== undefined ? ' = ' + JSON.stringify(got) : '')) }
const 가까 = (a, b, 비) => Number.isFinite(a) && Math.abs(a - b) <= Math.abs(b) * 비
const 읽 = (n) => { const M = 도면읽기(readFileSync(new URL(`../web/public/tools/files/ex-colorplan-${n}.dxf`, import.meta.url), 'utf8')); return { M, k: 단위배율(M.units, M.box, M.ox, M.oy).k } }
PDF환경.글꼴 = new Uint8Array(readFileSync(new URL('../web/public/fonts/KCMGothic.ttf', import.meta.url)))
const OUT = process.env.OUT || ''

console.log('① 용도 · 무늬')
const 기대용도 = { 거실: '거실', 안방: '침실', 침실3: '침실', 드레스룸: '침실', '주방·식당': '주방', 욕실1: '욕실', 여자화장실: '욕실', 현관: '현관', 복도: '복도', 발코니: '발코니', 다용도실: '발코니', 실외기실: '발코니', 계단실1: '코어', EV: '코어', 교무실: '업무', 원장실: '업무', 강의실4: '영업', 창고: '창고', 휴게실: '거실', 주차장: '주차', '화장실(추정)': '욕실' }
const 틀린 = Object.entries(기대용도).filter(([s, u]) => C.용도(s) !== u).map(([s]) => s + '→' + C.용도(s))
ok('실 이름 → 용도 21가지', !틀린.length, 틀린)
const 네모 = [[[0, 0], [1000, 0], [1000, 600], [0, 600]]]
const 가로줄 = 빗금(네모, 0, 150, [0, 0])
ok('빗금 — 600 높이 · 150 간격 → 가로줄 5(0 · 150 · 300 · 450 · 600 중 안쪽)', 가로줄.length >= 4 && 가로줄.length <= 5 && 가로줄.every(([x0, , x1]) => Math.abs(Math.abs(x1 - x0) - 1000) < 1e-6), 가로줄.length)
const 구멍 = [[[0, 0], [1000, 0], [1000, 1000], [0, 1000]], [[400, 400], [600, 400], [600, 600], [400, 600]]]
const 가운데줄 = 빗금(구멍, 0, 100, [0, 50]).filter(([, y]) => Math.abs(y - 450) < 1e-6)
ok('빗금 — 구멍(기둥) 건너뜀(한 줄이 두 토막)', 가운데줄.length === 2, 가운데줄.length)

console.log('② 학원(가상 3층 · 30 × 16 m)')
{
  const { M, k } = 읽('academy')
  const 판들 = C.판들찾기(M, k)
  ok('판 하나 · 제목 «3층 평면도»', 판들.length === 1 && 판들[0].제목 === '3층 평면도', 판들.map((p) => p.제목))
  const D = C.판읽기(M, k, 판들[0])
  const 이름 = (s) => D.방들.find((R) => R.이름 === s)
  ok('실 15', D.방들.length === 15, D.방들.map((R) => R.이름))
  /* 안목 = 벽 가운데선 − 반 두께(바깥 200 → 100 · 칸막이 150 → 75) */
  const 기대 = { 강의실1: 7.450 * 6.825, 강의실2: 7.450 * 6.825, 원장실: 3.825 * 6.825, 상담실: 3.450 * 6.825, 교무실: 5.850 * 6.825, 계단실1: 3.425 * 6.825, 강의실4: 4.425 * 6.825, 복도: 29.8 * 1.85 + 15 * 0.9 * 0.15 }
  for (const [s, A] of Object.entries(기대)) {
    const R = 이름(s)
    ok(`${s} 안목 ${A.toFixed(2)}㎡ (1.5% 안)`, R && 가까(R.면적, A, 0.015), R && R.면적)
  }
  ok('바닥(벽 포함) 30.2 × 16.2 = 489.2 ㎡ (1% 안)', 가까(D.발넓이, 30.2 * 16.2, 0.01), D.발넓이)
  ok('소방 설비 블록 — 소화기 4 · 소화전 2 · 발신기 2 · 완강기 1', ['소화기', 4, '소화전', 2, '발신기', 2, '완강기', 1].every((v, i, a) => i % 2 || D.장비들.filter((e) => e.종류 === v).length === a[i + 1]), D.장비들.map((e) => e.종류))
  ok('출구 — 계단실 둘', D.출구들.length === 2 && D.출구들.every((x) => x.종류 === '계단'), D.출구들.map((x) => x.이름))
  ok('실 이름 글 자리 = 라벨(강의실2)', 이름('강의실2') && Math.abs(이름('강의실2').라벨[0] - 0) < 200, 이름('강의실2')?.라벨)
  const G = C.피난준비(M, k, D)
  const 길 = C.피난길들(G, D, D.출구들, D.방들.map((R) => R.번호))
  const 없는 = D.방들.filter((R) => !길.길들.get(R.번호)?.첫 && !D.출구들.some((x) => x.방 === R.번호)).map((R) => R.이름)
  ok('길 — 계단실 빼고 모든 실(13)에서 출구까지', !없는.length, 없는)
  const w = 길.길들.get(이름('강의실2').번호)
  ok('강의실2 → 가까운 출구 계단실2 · 다른 출구 계단실1(두 방향)', w.첫.출구.이름 === '계단실2' && w.둘 && w.둘.출구.이름 === '계단실1', [w.첫.출구.이름, w.둘?.출구.이름])
  ok('강의실2 → 계단실2 길이 13 ~ 18 m (곧은 거리보다 길게 · 너무 돌지 않게)', w.첫.길이 > 13 && w.첫.길이 < 18, w.첫.길이)
  const w4 = 길.길들.get(이름('강의실4').번호)
  ok('강의실4(동쪽) → 계단실2 · 4 ~ 8 m', w4.첫.출구.이름 === '계단실2' && w4.첫.길이 > 4 && w4.첫.길이 < 8, [w4.첫.출구.이름, w4.첫.길이])
  /* 길이 벽을 뚫지 않음 — 길 점들 사이 곧은 줄이 막힌 칸을 안 지남 */
  let 뚫음 = 0
  for (const [, v] of 길.길들) {
    if (!v.첫) continue
    const p = v.첫.점들
    for (let i = 1; i < p.length; i++) {
      const n = Math.ceil(Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) / (G.cp / 2))
      for (let s = 0; s <= n; s++) {
        const x = p[i - 1][0] + ((p[i][0] - p[i - 1][0]) * s) / n, y = p[i - 1][1] + ((p[i][1] - p[i - 1][1]) * s) / n
        const ci = Math.floor((x - G.x0) / G.cp), cj = Math.floor((y - G.y0) / G.cp)
        if (G.막[cj * G.NX + ci]) { 뚫음++; break }
      }
    }
  }
  ok('길이 벽 · 창을 뚫지 않음(0.2 m 띄운 판)', 뚫음 === 0, 뚫음)
  const 나무 = 길.나무(-1)
  ok('길 나무 — 갈래가 줄기에 모임(닿음 ≥ 8)', 나무.filter((g) => g.닿음).length >= 8, 나무.map((g) => g.닿음))
  /* 계단실1 을 끄면 모두 계단실2 로 */
  const 길2 = C.피난길들(G, D, D.출구들.map((x, i) => (i === 0 ? { ...x, 켬: false } : x)), D.방들.map((R) => R.번호), 길.장캐시)
  ok('계단실1 끄면 원장실도 계단실2 로 · 둘째 길 없음', 길2.길들.get(이름('원장실').번호).첫.출구.이름 === '계단실2' && !길2.길들.get(이름('원장실').번호).둘)
  const 점 = 기준점검(D, 길, {})
  ok('별표 2의2 — ✔ 7 · ✖ 0 · A3(400㎡ 넘음)', 점.filter((c) => c.됨 === true).length === 7 && !점.some((c) => c.됨 === false), 점.map((c) => c.됨))
  const 장 = 피난장면(D, 길, { 현위치방: 이름('강의실2').번호 }, { 업소: '예시학원', 층: '3층', 작성일: '2026. 10. 17.' })
  ok('피난 장면 A3 가로 420 × 297', 장.종이 === 'A3' && 장.폭 === 420 && 장.높이 === 297)
  const 글들 = 장.그림들.filter((g) => g.t === '글').map((g) => g.글).join('|')
  for (const s of ['피난안내도', 'EVACUATION MAP', '현위치 YOU ARE HERE', '화재가 나면', '소화기 사용법', '옥내소화전 사용법', '119', 'Shout "Fire!"', '계단 Stairs'])
    ok(`안내도 글 «${s}»`, 글들.includes(s))
  ok('광고 · «무료» 없음', !/무료|광고|k-conmap/i.test(글들))
  const 컬 = 컬러장면(D, { 무늬: true, 면적: '㎡평' })
  ok('컬러 장면 — 실마다 칠한 면 15', 컬.그림들.filter((g) => g.t === '면' && g.방 !== undefined).length === 15)
  ok('컬러 장면 — 축척 1/120 (A3 가로)', 컬.축척 === 120, 컬.축척)
  const dxf = DXF만들기(D, M, { 축척: 120, 무늬: true, 면적: '㎡평', 피난: { 나무: 길.나무(이름('강의실2').번호), 첫: w.첫, 둘: w.둘, 출구들: D.출구들, 장비들: D.장비들, 현위치: 이름('강의실2').라벨 } })
  const 줄 = dxf.split('\n')
  const 손들 = []
  for (let i = 0; i + 1 < 줄.length; i++) if (줄[i] === '  5') 손들.push(parseInt(줄[i + 1], 16))
  const 씨 = parseInt(줄[줄.indexOf('$HANDSEED') + 2], 16)
  손들.splice(손들.indexOf(씨), 1)                 /* $HANDSEED 자신(머리의 «  5») */
  ok('DXF — 손잡이 겹침 없음 · HANDSEED 가 가장 큼', new Set(손들).size === 손들.length && 손들.every((h) => h < 씨), [손들.length, 씨, Math.max(...손들)])
  const 해치 = 줄.filter((l) => l === 'HATCH').length
  ok('DXF — HATCH(벽 채움 1 + 실 15 + 설비 · 출구 · 화살)', 해치 >= 16, 해치)
  const 층수 = Number(줄[줄.indexOf('LAYER', 줄.indexOf('TABLE')) + 8])
  ok('DXF — 층 표 개수 = 적은 층', 층수 === 줄.filter((l, i) => l === 'LAYER' && 줄[i - 1] === '  0').length, 층수)
  ok('DXF — 같은 자리(원래 좌표: 학원 0 ~ 30000)', /\n 10\n-?\d/.test(dxf) && dxf.includes('KCM-피난경로') && dxf.includes('KCM-색-강의·영업'))
  if (OUT) writeFileSync(`${OUT}/예시_학원_피난안내도.dxf`, dxf)
  const pdf = await 장면들PDF([장, 컬], { 제목: '시험' })
  const { PDFDocument } = createRequire(new URL('../web/package.json', import.meta.url))('pdf-lib')
  const 읽은 = await PDFDocument.load(pdf)
  ok('PDF — %PDF · 두 쪽 · A3 가로(1190.6 × 841.9 pt)', String.fromCharCode(...pdf.slice(0, 4)) === '%PDF' && 읽은.getPageCount() === 2 && Math.abs(읽은.getPage(0).getWidth() - 1190.55) < 1, [읽은.getPageCount(), 읽은.getPage(0).getSize()])
  if (OUT) writeFileSync(`${OUT}/예시_학원.pdf`, pdf)
}

console.log('③ 집(가상 84㎡형 · 트인 거실 · 주방)')
{
  const { M, k } = 읽('apt')
  const 판들 = C.판들찾기(M, k)
  const D = C.판읽기(M, k, 판들[0])
  const 이름 = (s) => D.방들.find((R) => R.이름 === s)
  ok('실 13 — 거실 · 주방·식당 · 복도 · 현관이 따로(면적선으로 나눔)', D.방들.length === 13 && ['거실', '주방·식당', '복도', '현관'].every((s) => 이름(s)), D.방들.map((R) => R.이름))
  ok('거실 면적선 18.90 ㎡ · 안목 18 ~ 18.9', 이름('거실').면적선 && 가까(이름('거실').면적선, 18.9, 0.002) && 이름('거실').면적 > 18 && 이름('거실').면적 <= 18.9, [이름('거실').면적선, 이름('거실').면적])
  const 기대 = { 침실2: 3.14 * 3.44, 침실3: 3.14 * 2.54, 욕실1: 1.68 * 1.98, 드레스룸: 1.94 * 1.98, 발코니: 11.25 * 1.325 }
  for (const [s, A] of Object.entries(기대)) { const R = 이름(s); ok(`${s} 안목 ${A.toFixed(2)}㎡ (2.5% 안)`, R && 가까(R.면적, A, 0.025), R && R.면적) }
  ok('출구 — 현관문(바깥으로 난 문) 하나', D.출구들.length === 1 && D.출구들[0].종류 === '출입구', D.출구들)
  const G = C.피난준비(M, k, D)
  const 길 = C.피난길들(G, D, D.출구들, D.방들.map((R) => R.번호))
  ok('발코니(문 없음)는 길 없음 · 다른 방은 모두 길', !길.길들.get(이름('발코니').번호).첫 && D.방들.filter((R) => !['발코니', '현관'].includes(R.이름)).every((R) => 길.길들.get(R.번호).첫), [...길.길들].filter(([, v]) => !v.첫).map(([b]) => D.방들[b].이름))
  const 점 = 기준점검(D, 길, {})
  ok('B4 로 충분(121㎡ < 400)', 점[5].됨 === true && 점[5].글.includes('B4'), 점[5].글)
  const 장 = 컬러장면(D, { 무늬: true, 면적: '㎡평', 색판: '선명하게' })
  ok('컬러 장면 — 축척 1/50 (A3)', 장.축척 === 50, 장.축척)
  const 표글 = 장.그림들.filter((g) => g.t === '글').map((g) => g.글)
  ok('면적표 — 실내 합계 · 발코니 · 다용도 따로', 표글.includes('실내 합계') && 표글.includes('* 발코니 · 다용도'))
  const 무늬선 = 장.그림들.filter((g) => g.t === '선' && g.굵기 === 0.07).length
  ok('바닥 무늬 선 300 넘음(마루 · 타일)', 무늬선 > 300, 무늬선)
  const 바꾼 = 컬러장면(D, { 방바꿈: { [이름('침실3').번호]: { 이름: '서재', 색: '#123456' } } })
  ok('실 이름 · 색 바꾸기', 바꾼.그림들.some((g) => g.t === '글' && g.글 === '서재') && 바꾼.그림들.some((g) => g.t === '면' && g.채움 === '#123456'))
  const V = 맞춤(D, { x: 0, y: 0, w: 200, h: 200 }, 100)
  ok('고정 축척 1/100', V.N === 100)
  if (OUT) {
    writeFileSync(`${OUT}/예시_집_컬러.dxf`, DXF만들기(D, M, { 축척: 50, 무늬: true, 면적: '㎡평' }))
    writeFileSync(`${OUT}/예시_집_컬러.pdf`, await 장면들PDF([장], { 제목: '84㎡형 컬러 평면도' }))
  }
}

console.log('④ 다른 도면 — 3D 도구 가상 평면도(한 층 한 실 · 벽 선만 · 문이 벽 선 위에 그려짐)')
{
  const M = 도면읽기(readFileSync(new URL('../web/public/tools/files/ex-building-plan.dxf', import.meta.url), 'utf8'))
  const k = 단위배율(M.units, M.box, M.ox, M.oy).k
  const 판들 = C.판들찾기(M, k)
  ok('판 넷(지하 1층 · 지상 1 ~ 3층) — 실 이름 하나뿐인 층도 «… 평면도» 제목으로', 판들.length === 4 && 판들[0].제목 === '지하 1층 평면도', 판들.map((p) => p.제목))
  const D = C.판읽기(M, k, 판들[1])
  ok('지상 1층 — 근린생활시설(강의 · 영업) · 계단실(추정)', D.방들.length === 2 && D.방들[0].용도 === '영업' && D.방들.some((R) => R.짐작 && R.용도 === '코어'), D.방들.map((R) => [R.이름, R.용도]))
  ok('계단실 출구 = 계단실 문 자리', D.출구들.length === 1 && D.출구들[0].종류 === '계단' && Math.abs(D.출구들[0].y - D.방들.find((R) => R.용도 === '코어').라벨[1]) > 1000, D.출구들)
  const G = C.피난준비(M, k, D)
  const 길 = C.피난길들(G, D, D.출구들, D.방들.map((R) => R.번호))
  const w = 길.길들.get(D.방들[0].번호)
  ok('근린생활시설 → 계단실 길(문 그림 자리를 뚫어 지나감) 5 ~ 20 m', w.첫 && w.첫.길이 > 5 && w.첫.길이 < 20, w.첫 && w.첫.길이)
}

console.log(bad ? `✗ ${bad}개 틀림` : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
