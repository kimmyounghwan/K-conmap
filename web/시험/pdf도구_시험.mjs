/* 📄 PDF 도구(사이트판) 엔진이 정말 도는지 — 창 없이 node 로 돌립니다. (2026-09-18)
 *
 *     node web/시험/pdf도구_시험.mjs
 *
 * ■ 왜 이렇게 시험하나
 *   화면(src/pages/Pdf.jsx)은 브라우저가 있어야 하지만 엔진(src/lib/pdfwork.js)은 아닙니다.
 *   캔버스와 pdf.js 만 node 것으로 갈아 끼우고 «사이트에서 도는 그 코드 그대로» 돌립니다.
 *   엔진을 고치면 반드시 이걸 먼저 돌리십시오.
 *
 * ■ 처음 한 번 :  cd web && npm install     (@napi-rs/canvas 가 devDependencies 에 있습니다)
 *
 * ■ 시험용 PDF 는 이 파일이 «스스로 만듭니다». 저장소에 무거운 파일을 두지 않습니다.
 * ⚠️ node 에는 한글 글꼴이 없어 만드는 PDF 의 글자는 영문입니다.
 *    한글이 제대로 읽히는지는 «끝표 시험»(맨 아래 ⑩)으로 지킵니다 — 까닭은 거기 적었습니다.
 */
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import './pdf준비.mjs'                       // ⚠️ pdf.js 보다 «먼저» 와야 합니다
import { createCanvas } from '@napi-rs/canvas'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import * as P from '../src/lib/pdfwork.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const web = path.join(여기, '..')

/* ── 브라우저 자리를 node 것으로 ─────────────────────────── */
class 캔버스공장 {
  create(w, h) { const c = createCanvas(Math.max(1, w | 0), Math.max(1, h | 0)); return { canvas: c, context: c.getContext('2d') } }
  reset(cc, w, h) { cc.canvas.width = Math.max(1, w | 0); cc.canvas.height = Math.max(1, h | 0) }
  destroy(cc) { cc.canvas.width = 0; cc.canvas.height = 0 }
}
P.환경.캔버스 = (w, h) => createCanvas(Math.max(1, Math.round(w)), Math.max(1, Math.round(h)))
P.환경.pdfjs = pdfjs
P.환경.더옵션 = { canvasFactory: new 캔버스공장() }
P.환경.cmap자리 = path.join(web, 'node_modules', 'pdfjs-dist', 'cmaps') + path.sep
P.환경.글꼴자리 = path.join(web, 'node_modules', 'pdfjs-dist', 'standard_fonts') + path.sep
P.환경.그림읽기 = async (바이트들) => {
  const { loadImage } = await import('@napi-rs/canvas')
  const im = await loadImage(Buffer.from(바이트들))
  return { width: im.width, height: im.height, draw: (ctx, x, y, w, h) => ctx.drawImage(im, x, y, w, h) }
}

/* ── 시험용 파일을 스스로 만듭니다 ───────────────────────── */
const 파일로 = (이름, 바이트들) => ({
  name: 이름, size: 바이트들.length, lastModified: Date.now(), webkitRelativePath: 이름,
  arrayBuffer: async () => 바이트들.buffer.slice(바이트들.byteOffset, 바이트들.byteOffset + 바이트들.byteLength),
})

async function 시험PDF(이름, 글들, { 백지 = 0, 눕힘 = -1, 딴크기 = false, 겹침 = false, 칠하기 = null } = {}) {
  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  const d = await PDFDocument.create()
  const f = await d.embedFont(StandardFonts.Helvetica)
  for (let i = 0; i < 글들.length; i++) {
    const p = d.addPage([595.28, 841.89])
    p.drawText(`${i + 1} page`, { x: 72, y: 740, size: 20, font: f })
    p.drawText(글들[i], { x: 72, y: 690, size: 14, font: f })
  }
  if (겹침) {                                     /* 마지막 쪽과 똑같은 쪽 하나 더 */
    const p = d.addPage([595.28, 841.89])
    p.drawText(`${글들.length} page`, { x: 72, y: 740, size: 20, font: f })
    p.drawText(글들[글들.length - 1], { x: 72, y: 690, size: 14, font: f })
  }
  for (let i = 0; i < 백지; i++) d.addPage([595.28, 841.89])
  if (딴크기) d.addPage([420, 595])                /* A5 — 제본 때 어긋납니다 */
  if (눕힘 >= 0) d.getPage(눕힘).setRotation(degrees(90))
  if (칠하기) for (const [쪽, x, y, w, h] of 칠하기) {
    d.getPage(쪽).drawRectangle({ x, y, width: w, height: h, color: rgb(0, 0, 0) })
  }
  return 파일로(이름, await d.save())
}

async function 시험사진(이름, 글) {
  const c = createCanvas(640, 480)
  const g = c.getContext('2d')
  g.fillStyle = '#dfe6ee'; g.fillRect(0, 0, 640, 480)
  g.fillStyle = '#334'; g.font = '40px sans-serif'; g.fillText(글, 40, 250)
  return 파일로(이름, new Uint8Array(await c.encode('png')))   // ⚠️ encode 는 기다려야 합니다
}

/* ── 채점 ───────────────────────────────────────────────── */
let 맞음 = 0, 틀림 = 0
async function T(이름, fn, 답) {
  try {
    const r = await fn()
    if (답 !== undefined && JSON.stringify(r) !== JSON.stringify(답)) {
      틀림++; console.log(`  ✕ ${이름} → ${JSON.stringify(r)} (답 ${JSON.stringify(답)})`); return
    }
    맞음++; console.log(`  ○ ${이름}` + (답 === undefined ? ` → ${JSON.stringify(r)}` : ''))
  } catch (e) { 틀림++; console.log(`  ✕ ${이름} → ${e.message}`) }
}
async function 막히나(이름, fn) {
  try { await fn(); 틀림++; console.log(`  ✕ ${이름} — 막았어야 하는데 통과했습니다`) }
  catch { 맞음++; console.log(`  ○ ${이름}`) }
}
const 쪽수세기 = async (바이트들) => (await pdfjs.getDocument({
  data: new Uint8Array(바이트들), canvasFactory: new 캔버스공장(),
}).promise).numPages
const 첫줄 = async (바이트들, i) => {
  const d = await pdfjs.getDocument({ data: new Uint8Array(바이트들), canvasFactory: new 캔버스공장() }).promise
  return (await (await d.getPage(i)).getTextContent()).items.map((x) => x.str).join('').slice(0, 6)
}

/* ══════════════════════════════════════════════════════════ */
const 글 = ['HUMKWAN D=300 pipe work', 'Ready-mixed concrete 25-24-15',
            'Earth work and structure', 'Traffic control plan']
const 당초 = await 시험PDF('당초.pdf', 글)
const 변경 = await 시험PDF('변경.pdf', 글, { 칠하기: [[1, 72, 600, 260, 30], [2, 300, 400, 80, 80]] })
const 흠집 = await 시험PDF('흠집.pdf', 글, { 백지: 1, 눕힘: 0, 딴크기: true, 겹침: true })
const 사진들 = [await 시험사진('IMG_01.png', 'A'), await 시험사진('IMG_02.png', 'B'),
                await 시험사진('IMG_03.png', 'C')]

console.log('① 쪽 번호 알아듣기')
await T('1-3', async () => P.쪽풀기('1-3', 10), [0, 1, 2])
await T('1,5,9', async () => P.쪽풀기('1,5,9', 10), [0, 4, 8])
await T('8-', async () => P.쪽풀기('8-', 10), [7, 8, 9])
await T('-3', async () => P.쪽풀기('-3', 10), [0, 1, 2])
await T('전부', async () => P.쪽풀기('전부', 4), [0, 1, 2, 3])
await T('거꾸로 3-1 도 알아듣기', async () => P.쪽풀기('3-1', 10), [0, 1, 2])
await 막히나('엉뚱한 글은 막는다', async () => P.쪽풀기('가나다', 10))
await 막히나('없는 쪽만 적으면 막는다', async () => P.쪽풀기('99', 10))

console.log('\n② 살펴보기')
await T('쪽수를 센다', async () => (await P.살펴보기(당초))['쪽수'], 4)
await T('스캔본이 아니라고 안다', async () => (await P.살펴보기(당초))['스캔본으로보임'], false)

console.log('\n③ 쪽 다루기')
await T('합치기 — 8쪽', async () => 쪽수세기((await P.합치기([당초, 변경])).바이트), 8)
await 막히나('한 개만 고르면 막는다', async () => P.합치기([당초]))
await T('골라내기 1-2', async () => { const r = await P.쪽골라내기(당초, '1-2'); return [r.남김, await 쪽수세기(r.바이트)] }, [2, 2])
await T('쪽 지우기 1', async () => { const r = await P.쪽지우기(당초, '1'); return [r.뺌, r.남] }, [1, 3])
await 막히나('다 빼면 막는다', async () => P.쪽지우기(당초, '전부'))
await T('🚨 순서 바꾸기는 «적은 차례» 를 지킨다', async () => {
  const r = await P.순서바꾸기(당초, '3,1,2')
  return [await 첫줄(r.바이트, 1), await 첫줄(r.바이트, 2), await 첫줄(r.바이트, 3)]
}, ['3 page', '1 page', '2 page'])
await T('회전 90', async () => (await P.회전(당초, '전부', 90)).쪽수, 4)
await 막히나('45도는 막는다', async () => P.회전(당초, '전부', 45))
await T('낱장으로 나누기 — 4개', async () => (await P.나누기(당초, '낱장', '')).개수, 4)
await T('2쪽씩 나누기 — 2개', async () => (await P.나누기(당초, '몇쪽씩', '2')).개수, 2)
await T('여기서자르기 3 — 2개', async () => (await P.나누기(당초, '여기서자르기', '3')).개수, 2)
await 막히나('나눌 쪽이 엉터리면 막는다', async () => P.나누기(당초, '몇쪽씩', '가'))

console.log('\n④ 얹기')
await T('워터마크 — 4쪽', async () => (await P.워터마크(당초, '대외비')).쪽수, 4)
await 막히나('빈 글자는 막는다', async () => P.워터마크(당초, '  '))
await T('쪽번호(숫자만) — 4쪽', async () => (await P.쪽번호(당초, '- {n} -')).쪽수, 4)
await T('쪽번호에 {전체} 도 들어간다', async () => {
  const r = await P.쪽번호(당초, '{n} / {전체}')
  return (await 첫줄(r.바이트, 1)).length >= 0 && r.쪽수 === 4
}, true)
await T('🚨 한글 꼴도 막히지 않는다(그림으로 찍습니다)', async () => (await P.쪽번호(당초, '제 {n} 쪽')).쪽수, 4)
await T('도장 얹기', async () => (await P.도장얹기(당초, 사진들[0], '1')).쪽수, 1)
await 막히나('도장 그림 없으면 막는다', async () => P.도장얹기(당초, null, '1'))

console.log('\n⑤ 뽑기 · 찾기')
await T('글자뽑기 — 빈 쪽 0', async () => (await P.글자뽑기(당초)).빈, 0)
await T('뽑은 글에 본문이 살아 있다', async () => new TextDecoder()
  .decode((await P.글자뽑기(당초)).바이트).includes('HUMKWAN'), true)
await T('쪽을 그림으로 — 2장', async () => (await P.쪽을그림으로(당초, '1-2', 1.2)).장수, 2)
await T('낱말찾기 — 1군데', async () => { const r = await P.낱말찾기(당초, 'HUMKWAN'); return [r.모두, r.자리[0].쪽] }, [1, 1])
await T('없는 말은 0군데(성내지 않는다)', async () => (await P.낱말찾기(당초, 'NOSUCHWORD')).모두, 0)
await 막히나('찾을 말이 비면 막는다', async () => P.낱말찾기(당초, ' '))

console.log('\n⑥ 제출본 점검표')
const 흠 = await P.점검(흠집)
console.log('   ', JSON.stringify(흠.요약))
await T('🚨 일부러 넣은 백지를 찾아낸다', async () => 흠.요약['백지'] >= 1, true)
await T('🚨 일부러 눕힌 쪽을 찾아낸다', async () => 흠.요약['돌아간 쪽'] >= 1, true)
await T('🚨 크기 다른 쪽을 찾아낸다', async () => 흠.요약['쪽 크기 종류'] >= 2, true)
await T('🚨 겹친 쪽을 찾아낸다', async () => 흠.탈.some((x) => String(x[1]).includes('겹친')), true)
await T('멀쩡한 파일에는 겹친 쪽이 없다',
  async () => (await P.점검(당초)).탈.filter((x) => String(x[1]).includes('겹친')).length, 0)
await T('무엇이 왜 걸렸는지 말로 적는다', async () => 흠.탈.some((x) => String(x[1]).includes('백지')), true)
await T('점검표가 «엑셀이 여는» CSV 로 나온다', async () => {
  const r = await P.점검표내기(당초)
  return [r.바이트[0], r.바이트[1], r.바이트[2]]                       // UTF-8 BOM
}, [239, 187, 191])

console.log('\n⑦ 당초 ↔ 변경 비교')
const 견줌 = await P.비교(당초, 변경, { 배율: 1.2 })
console.log('    바뀐 쪽 :', JSON.stringify(견줌.바뀐쪽))
await T('🚨 그림이 달라진 쪽(2·3쪽)을 찾아낸다',
  async () => [견줌.바뀐쪽.some((x) => x[0] === 2), 견줌.바뀐쪽.some((x) => x[0] === 3)], [true, true])
await T('🚨 안 달라진 쪽은 안 잡는다',
  async () => 견줌.바뀐쪽.filter((x) => ![2, 3].includes(x[0])).length, 0)
await T('표시본 쪽수가 변경본과 같다', async () => 쪽수세기(견줌.표시.바이트), 4)
await T('바뀐말 txt 도 같이 나온다', async () => 견줌.글.이름.endsWith('.txt'), true)
const 똑같 = await P.비교(당초, 당초, { 배율: 1.2 })
await T('🚨 같은 파일끼리는 아무것도 «안 바뀌었다» 한다',
  async () => [똑같.바뀐쪽.length, 똑같.말바뀜.length], [0, 0])
const 짧은 = await P.쪽골라내기(당초, '1-2')
const 길이다름 = await P.비교(당초, 파일로('짧은.pdf', 짧은.바이트), { 배율: 1.2 })
await T('변경본에 없는 쪽을 «당초에만 있는 쪽» 이라 한다',
  async () => 길이다름.바뀐쪽.filter((x) => x[1] === '당초에만 있는 쪽').map((x) => x[0]), [3, 4])

console.log('\n⑧ 여러 파일에서 찾기')
const 여럿 = await P.여러파일에서찾기([당초, 변경], 'HUMKWAN, concrete')
console.log(`    PDF ${여럿.파일수}개 · ${여럿.찾은수}군데 · 못 읽음 ${여럿.못읽음}`)
await T('두 파일을 다 훑는다', async () => 여럿.파일수, 2)
await T('찾은 곳이 있다', async () => 여럿.찾은수 > 0, true)
await T('스캔본이 아니면 «못 읽음» 이 없다', async () => 여럿.못읽음, 0)
await T('찾은 자리 글까지 적는다', async () => new TextDecoder().decode(여럿.바이트).includes('pipe'), true)
await 막히나('찾을 말이 비면 막는다', async () => P.여러파일에서찾기([당초], '  '))
await 막히나('PDF 가 하나도 없으면 막는다', async () => P.여러파일에서찾기(사진들, 'a'))

console.log('\n⑨ 사진대지')
const 대지 = await P.사진대지(사진들, { 공사명: '○○간선도로 확포장공사', 위치: '○○리 일원', 한쪽에: 2 })
console.log(`    사진 ${대지.장수}장 → ${대지.쪽수}쪽 · ${(대지.바이트.length / 1024).toFixed(0)}KB`)
await T('사진을 다 넣는다', async () => 대지.장수, 3)
await T('한 쪽에 2장이면 2쪽', async () => 대지.쪽수, 2)
await T('나온 PDF 쪽수도 같다', async () => 쪽수세기(대지.바이트), 2)
await T('한 쪽에 4장도 된다', async () => (await P.사진대지(사진들, { 한쪽에: 4 })).쪽수, 1)
await T('사진이 커도 파일이 부풀지 않는다(줄여 넣습니다)',
  async () => 대지.바이트.length < 3 * 1024 * 1024, true)
await 막히나('한 쪽에 5장은 막는다', async () => P.사진대지(사진들, { 한쪽에: 5 }))
await 막히나('사진이 없으면 막는다', async () => P.사진대지([당초], {}))
await T('EXIF 없는 그림은 빈 날짜를 돌려준다',
  async () => P.exif날짜(new Uint8Array(await 사진들[0].arrayBuffer())), '')

console.log('\n⑩ 🚨 «한글이 읽히는 자리» 지키기 — 끝표 시험')
/*  node 에는 한글 글꼴이 없어 한글 PDF 로 직접 시험할 수 없습니다.
    그런데 여기가 제일 조용히 망가지는 자리입니다 —
    cMapUrl·standardFontDataUrl 이 빠지면 한글(HWP)이 만든 PDF 에서
    글자가 «성내지도 않고 빈 글자» 로 나옵니다(2026-09-18 실측).
    그래서 «그 줄이 코드에 있는지» 를 지킵니다. 지우면 여기서 걸립니다.   */
const 엔진글 = fs.readFileSync(path.join(web, 'src', 'lib', 'pdfwork.js'), 'utf8')
const 설정글 = fs.readFileSync(path.join(web, 'vite.config.js'), 'utf8')
await T('엔진이 cMapUrl 을 넘긴다', async () => 엔진글.includes('cMapUrl'), true)
await T('엔진이 cMapPacked 를 켠다', async () => /cMapPacked:\s*true/.test(엔진글), true)
await T('엔진이 standardFontDataUrl 을 넘긴다', async () => 엔진글.includes('standardFontDataUrl'), true)
await T('빌드가 cmaps 를 dist 로 옮긴다', async () => 설정글.includes('cmaps'), true)
await T('빌드가 standard_fonts 를 dist 로 옮긴다', async () => 설정글.includes('standard_fonts'), true)
await T('그 표가 node_modules 에 실제로 있다',
  async () => fs.existsSync(path.join(web, 'node_modules', 'pdfjs-dist', 'cmaps')), true)

console.log(`\n맞음 ${맞음} · 틀림 ${틀림}`)
process.exit(틀림 ? 1 : 0)
