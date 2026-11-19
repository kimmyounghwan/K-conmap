/**
 * 🖋 G780 도장 만들기 셈 시험 (2026-11-19) — lib/도장.js · lib/내도장.js · 등록(길 · 도구 목록 · 설명 · 굽기 · 사이트맵 · 빠른찾기 · 쓴수판)
 *   소장님 「도장만들기 도구 이것도 만들어 줘...사이트 찾아보고 최대한 간단하면서 실용적이게」 → 기획 → 「서식까지 연결하게 해줘」
 *   node tools/시험_도장.mjs   (PC 올리기에서도 돌림 — 캔버스 없이: 그리기는 가짜 붓으로 · 사진 뽑기는 숫자 그림으로)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const 뿌리 = fileURLToPath(new URL('..', import.meta.url))
let ok = 0, bad = 0
const eq = (a, b, m) => { const s = JSON.stringify(a) === JSON.stringify(b); if (s) ok++; else bad++; console.log(s ? '  ✓' : '  ✗', m, s ? '' : `— ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`) }
const 참 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : 더) }

/* 가짜 localStorage — 내도장 시험용(먼저 깔아 둠) */
const 칸 = new Map()
globalThis.localStorage = { getItem: (k) => (칸.has(k) ? 칸.get(k) : null), setItem: (k, v) => { 칸.set(k, String(v)) }, removeItem: (k) => { 칸.delete(k) } }
const D = await import('../web/src/lib/도장.js')
const M = await import('../web/src/lib/내도장.js')

console.log('■ 글 정리')
eq(D.글정리(' 홍 길동 '), ['홍', '길', '동'], '띄어쓰기 뺌')
eq(D.글정리('홍길동김철수'), ['홍', '길', '동', '김'], '이름은 4자까지')
eq(D.글정리('가상!@#건설', 16), ['가', '상', '건', '설'], '기호는 뺌')
eq(D.글정리('㈜가상(주)·건설', 16).join(''), '㈜가상(주)·건설', '㈜ · 괄호 · 가운뎃점은 둠(회사 이름)')
eq(D.글정리('洪吉童'), ['洪', '吉', '童'], '한자')
eq(D.글정리('홍'.normalize('NFD')).join(''), '홍', '풀어 쓴 한글(NFD) → 한 글자')
eq(D.글정리(null), [], '빈 값')

console.log('■ 글자 칸(옛 도장 차례 — 오른쪽 줄부터 위에서 아래로)')
const 칸들 = (n) => D.칸나누기(n)
eq(칸들(1), [{ x: 0, y: 0, w: 1, h: 1 }], '한 자 = 꽉')
eq(칸들(3).map((c) => [c.x, +(c.y.toFixed(3)), c.w, +(c.h.toFixed(3))]), [[0, 0, 1, 0.333], [0, 0.333, 1, 0.333], [0, 0.667, 1, 0.333]], '세 자 = 위에서 아래로 한 줄')
eq(칸들(4).map((c) => [c.x, c.y]), [[0.5, 0], [0.5, 0.5], [0, 0], [0, 0.5]], '네 자 = 오른쪽 줄 위 · 아래 → 왼쪽 줄 위 · 아래')
const 줄수 = (n) => { const m = new Map(); for (const c of 칸들(n)) m.set(c.x, (m.get(c.x) || 0) + 1); return [...m.entries()].sort((a, b) => b[0] - a[0]).map(([, v]) => v) }
eq(줄수(5), [3, 2], '다섯 = 오른쪽 셋 · 왼쪽 둘(대표이 / 사인)')
eq(줄수(7), [3, 2, 2], '일곱 = 셋 줄 고르게')
eq(줄수(12), [4, 4, 4], '열둘 = 넷씩 세 줄')
eq(줄수(13), [4, 3, 3, 3], '열셋 = 네 줄(오른쪽이 하나 더)')
for (const n of [1, 2, 3, 4, 5, 6, 7, 9, 10, 12, 13, 16]) {
  const cs = 칸들(n)
  const 안 = cs.every((c) => c.x >= -1e-9 && c.y >= -1e-9 && c.x + c.w <= 1 + 1e-9 && c.y + c.h <= 1 + 1e-9)
  const 겹침 = cs.some((a, i) => cs.some((b, j) => j > i && a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9))
  const 넓이 = cs.reduce((s, c) => s + c.w * c.h, 0)
  참(cs.length === n && 안 && !겹침 && Math.abs(넓이 - 1) < 1e-9, `${n} 자 — 칸 ${n}개 · 상자 안 · 안 겹침 · 빈 곳 없음`)
}

console.log('■ 그리기(가짜 붓 — 쓰는 글자 · 차례 · 테두리)')
const 가짜붓 = () => {
  const 글 = [], 선 = []
  const ctx = {
    font: '', textAlign: '', textBaseline: '', fillStyle: '', strokeStyle: '', lineWidth: 0, lineJoin: '', globalAlpha: 1, globalCompositeOperation: '',
    clearRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arcTo() {}, fill() {}, translate() {}, scale() {}, rotate() {},
    arc(x, y, r) { 선.push(['원', Math.round(r)]) }, ellipse(x, y, rx, ry) { 선.push(['타원', Math.round(rx), Math.round(ry)]) }, stroke() { 선.push(['획', this.lineWidth]) },
    measureText: () => ({ width: 200, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 180, actualBoundingBoxAscent: 170, actualBoundingBoxDescent: 10 }),
    fillText(t) { 글.push(t) }, strokeText() {},
  }
  return { ctx, 글, 선 }
}
{
  const p = 가짜붓(); const r = D.도장그리기(p.ctx, 1000, { 종류: '이름', 글: '홍길동', 모양: '원' })
  eq([r.그린, p.글.join('')], [3, '홍길동'], '이름 도장 — 세 자 그림')
  참(p.선.some((x) => x[0] === '원' && x[1] === 460), '원 테두리(반지름 0.46)')
}
{
  const p = 가짜붓(); D.도장그리기(p.ctx, 1000, { 종류: '이름', 글: '홍길동', 인붙임: true, 모양: '네모' })
  eq(p.글.join(''), '홍길동인', '«인» 붙이기 → 네 칸')
  const q = 가짜붓(); D.도장그리기(q.ctx, 1000, { 종류: '이름', 글: '洪吉童', 인붙임: true })
  eq(q.글.join(''), '洪吉童印', '한자 이름엔 «印»')
  const z = 가짜붓(); D.도장그리기(z.ctx, 1000, { 종류: '이름', 글: '홍길동김', 인붙임: true })
  eq(z.글.join(''), '홍길동김', '네 자면 «인» 안 붙음')
}
{
  const p = 가짜붓(); D.도장그리기(p.ctx, 1000, { 종류: '이름', 글: '길동', 모양: '타원' })
  참(p.선.some((x) => x[0] === '타원' && x[1] === 330 && x[2] === 460), '타원 테두리')
}
{
  const p = 가짜붓(); const r = D.도장그리기(p.ctx, 1000, { 종류: '직인', 둘레글: '가상건설 주식회사', 가운데글: '대표이사인', 모양: '원' })
  eq([r.그린, p.글.join('')], [13, '가상건설주식회사대표이사인'], '회사 직인(원형) — 둘레 여덟 + 가운데 다섯')
  참(p.선.filter((x) => x[0] === '원').map((x) => x[1]).join(',') === '470,300', '바깥 원 · 안쪽 원')
  const q = 가짜붓(); D.도장그리기(q.ctx, 1000, { 종류: '직인', 둘레글: '가상건설', 가운데글: null })
  eq(q.글.join(''), '가상건설대표이사인', '가운데 글이 없으면 «대표이사인»')
  const w = 가짜붓(); const rw = D.도장그리기(w.ctx, 1000, { 종류: '직인', 둘레글: '가상건설', 가운데글: '직인', 모양: '네모' })
  eq([rw.그린, w.글.join('')], [6, '가상건설직인'], '회사 직인(네모) — 칸에 모두')
}
{
  const a = D.씨앗난수('홍길동'), b = D.씨앗난수('홍길동'), c = D.씨앗난수('김길동')
  const xs = [a(), a(), a()], ys = [b(), b(), b()], zs = [c(), c(), c()]
  참(JSON.stringify(xs) === JSON.stringify(ys) && JSON.stringify(xs) !== JSON.stringify(zs) && xs.every((v) => v >= 0 && v < 1), '번짐 난수 — 같은 글이면 늘 같은 모양')
}

console.log('■ 도장 사진 → 투명(숫자 그림)')
const 그림 = (W, H, 칠) => { const data = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = 칠(x, y); const i = (y * W + x) * 4; data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255 } return { data, width: W, height: H } }
const 종이 = (x, y) => [236 - Math.round(x / 20), 233 - Math.round(x / 20), 226 - Math.round(y / 30)]     /* 한쪽이 조금 어두운 종이 */
const 빨간원 = (x, y) => (Math.hypot(x - 120, y - 90) <= 40 ? [205, 38, 42] : null)
const 검은글 = (x, y) => (y >= 150 && y < 160 && x >= 20 && x < 90 ? [40, 40, 40] : null)
{
  const img = 그림(240, 180, (x, y) => 빨간원(x, y) || 검은글(x, y) || 종이(x, y))
  eq(D.잉크짐작(img.data), '빨강', '빨간 도장으로 봄')
  const r = D.도장뽑기(img, { 진하기: 50 })
  const a = (x, y) => r.data[(y * 240 + x) * 4 + 3]
  참(a(120, 90) === 255 && a(5, 5) === 0 && a(50, 155) === 0 && a(200, 170) === 0, '도장 안은 불투명 · 종이 · 검은 글씨는 투명', JSON.stringify([a(120, 90), a(5, 5), a(50, 155), a(200, 170)]))
  참(r.상자 && Math.abs(r.상자.x - 80) <= 1 && Math.abs(r.상자.y - 50) <= 1 && Math.abs(r.상자.w - 81) <= 2 && Math.abs(r.상자.h - 81) <= 2, '잉크 상자 = 도장 둘레', JSON.stringify(r.상자))
  const c = (x, y) => [...r.data.slice((y * 240 + x) * 4, (y * 240 + x) * 4 + 3)]
  eq(c(120, 90), [0xcf, 0x1f, 0x25], '색은 인주 빨강으로 고름')
  const 그대로 = D.도장뽑기(img, { 색: '그대로' })
  eq([...그대로.data.slice((90 * 240 + 120) * 4, (90 * 240 + 120) * 4 + 3)], [205, 38, 42], '«그대로» 면 사진 색')
  const sq = D.정사각자리(r.상자, 240, 180)
  참(sq && Math.abs(sq.변 - 81 * 1.12) < 2.5 && Math.abs(sq.x + sq.변 / 2 - 120.5) < 1.5 && Math.abs(sq.y + sq.변 / 2 - 90.5) < 1.5, '정사각 자리 — 긴 변 + 여백 6% · 가운데', JSON.stringify(sq))
}
{
  /* 옅은 도장 — 진하기를 올리면 더 남음 */
  const img = 그림(200, 200, (x, y) => (Math.hypot(x - 100, y - 100) <= 50 ? [215, 125, 125] : [240, 238, 234]))
  const 보통 = D.도장뽑기(img, { 잉크: '빨강', 진하기: 50 }), 진 = D.도장뽑기(img, { 잉크: '빨강', 진하기: 90 })
  const 알 = (r) => r.data[(100 * 200 + 100) * 4 + 3]
  참(알(진) > 알(보통), `진하기를 올리면 옅은 잉크가 더 진하게(${알(보통)} → ${알(진)})`)
}
{
  const img = 그림(200, 160, (x, y) => (x >= 60 && x < 140 && y >= 40 && y < 120 && (x < 66 || x >= 134 || y < 46 || y >= 114 || (x >= 95 && x < 105)) ? [35, 35, 38] : [238, 237, 233]))
  eq(D.잉크짐작(img.data), '검정', '검은 도장(빨간 점 없음)으로 봄')
  const r = D.도장뽑기(img, {})
  참(r.잉크 === '검정' && r.data[(42 * 200 + 62) * 4 + 3] === 255 && r.data[(10 * 200 + 10) * 4 + 3] === 0, '검은 도장 — 잉크만 남고 종이는 투명')
  참(r.상자 && r.상자.x === 60 && r.상자.y === 40 && r.상자.w === 80 && r.상자.h === 80, '검은 도장 상자', JSON.stringify(r.상자))
}
{
  const img = 그림(100, 100, () => [240, 240, 240])
  const r = D.도장뽑기(img, {})
  참(r.상자 === null && D.정사각자리(null, 100, 100) === null, '도장이 없는 사진 → 상자 없음(화면은 «도장을 찾지 못했습니다»)')
}

console.log('■ 내 도장(이 기기)')
const 머리 = 'data:image/png;base64,'
칸.clear()
eq(M.내도장들(), [], '처음엔 빈 목록')
const r1 = M.내도장더하기('홍길동', 머리 + 'AAAA', 1000)
참(r1.ok && r1.목록.length === 1 && r1.목록[0].이름 === '홍길동' && /^d[0-9a-z]+$/.test(r1.목록[0].id), '저장 · 이름 · 번호')
참(!M.내도장더하기('x', 'data:image/jpeg;base64,AAAA').ok && !M.내도장더하기('x', '').ok, 'PNG 가 아니면 안 받음')
참(!M.내도장더하기('x', 머리 + 'A'.repeat(M.그림최대)).ok, '너무 큰 그림은 안 받음')
M.내도장더하기('홍길동', 머리 + 'AAAA', 2000)
eq(M.내도장들().length, 1, '같은 그림은 한 번만(새로 앞으로)')
for (let i = 0; i < 7; i++) M.내도장더하기('도장' + i, 머리 + 'B' + i, 3000 + i)
const 목 = M.내도장들()
참(목.length === M.내도장최대 && 목[0].이름 === '도장6' && !목.some((x) => x.이름 === '홍길동'), '여섯 개까지 · 새것부터 · 옛것이 빠짐')
const 남 = M.내도장빼기(목[0].id)
참(남.length === 5 && !남.some((x) => x.id === 목[0].id) && M.내도장들().length === 5, '지우기')
칸.set(M.내도장열쇠, '[{"id":"x!","그림":"data:image/png;base64,AA"},{"id":"dabc12","이름":"좋음","그림":"data:image/png;base64,AA"}, 5]')
eq(M.내도장들().map((x) => x.이름), ['좋음'], '꼴이 틀린 것은 버림')
칸.set(M.내도장열쇠, '{깨짐')
eq(M.내도장들(), [], '깨진 값 → 빈 목록')

console.log('■ 등록 · 글')
const 읽 = (p) => readFileSync(뿌리 + p, 'utf8').replace(/\r\n/g, '\n')
const 쪽 = 읽('web/src/pages/Dojang.jsx')
참(/const Dojang = lazyPage\(\(\) => import\('\.\/pages\/Dojang\.jsx'\)\)/.test(읽('web/src/main.jsx')) && /<Route path="\/tools\/dojang" element=\{<Suspense fallback=\{<Loading \/>\}><Dojang \/><\/Suspense>\} \/>/.test(읽('web/src/main.jsx')), 'main.jsx 길 /tools/dojang')
const T = JSON.parse(읽('web/src/data/tools.json'))
const 칸목록 = T.pages.flatMap((p) => p.items.map((it) => [p.key, it]))
const 내것 = 칸목록.find(([, it]) => it.to === '/tools/dojang')
참(!!내것 && 내것[0] === 'file' && 내것[1].w === 'site' && 내것[1].new === true && 내것[1].t.length <= 60, '도구 목록 «서류 · 현장 실무» 에 한 칸')
const G = JSON.parse(읽('web/src/data/tools_guide.json'))
참(G.dojang && G.dojang.how.length === 4 && G.dojang.faq.length >= 4 && G.dojang.at === '2026-11-19', '설명(tools_guide «dojang»)')
const P = 읽('prerender.py')
참(/def dojang_page\(shell, image=None\):/.test(P) && /write\("tools\/dojang\.html", dojang_page\(shell,/.test(P) && /key="dojang"\)/.test(P), '굽기(prerender dojang_page)')
참(/"\/tools\/esc", "\/tools\/dojang"\]:/.test(읽('sitemap.py')), '사이트맵')
참(/'\/tools\/dojang': '도장 /.test(읽('web/src/lib/빠른찾기.js')), '빠른찾기 낱말')
참(/\['\/tools\/dojang', \['\|도장'\]\]/.test(읽('web/src/lib/쓴수판.jsx')), '쓴수판 자리표 |도장')
for (const k of ['|도장|이름', '|도장|직인', '|도장|사진', '|도장|예시', '|도장|받기', '|도장|저장']) 참(쪽.includes(`'${k}'`), `숨은 셈 ${k}`)
참(/<도구설명 k="dojang" \/>/.test(쪽), '화면 아래 설명(도구설명)')
const 새글 = [쪽, JSON.stringify(G.dojang), JSON.stringify(내것 && 내것[1]), P.slice(P.indexOf('def dojang_page'), P.indexOf('def jeongsan_page'))].join('\n')
참(!/무료|클로드|유료|이용권/.test(새글), '새 글에 «무료 · 클로드 · 유료 · 이용권» 없음')
참(/본인 · 자기 회사 도장만 만드세요/.test(쪽) && /인감 증명이 필요한 서류에는 실제 인감/.test(쪽), '«본인 · 자기 회사 도장만» · 인감 안내 한 줄')
참(/어디에도 보내지 않습니다/.test(쪽) && !/fetch\(|firebase|XMLHttpRequest/.test(읽('web/src/lib/도장.js') + 읽('web/src/lib/내도장.js') + 쪽), '그림은 이 기기 안에서만(서버로 보내는 코드 없음)')

console.log(`\n${bad ? '❌' : '✅'} 시험_도장 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
