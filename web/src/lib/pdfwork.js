/* ==========================================================
   📄 pdfwork.js — 사이트 안에서 PDF 를 다루는 «엔진»

   소장님: 「건설맵 사이트 도구에 게시해 줘. 다운받게 말고
           사이트 내에서 작업할 수 있게 만들어 줘」 (2026-09-18)

   ■ 파일은 «서버로 올라가지 않습니다»
     전부 보는 사람 브라우저 안에서 처리합니다. 남의 설계도서·내역서를
     다루는 도구라 이것이 가장 중요합니다. 전송량도 0 이라 값도 안 듭니다.

   ■ 화면(Pdf.jsx)과 나눠 두었습니다
     여기에는 화면 코드가 없습니다. 그래서 «창 없이» 시험할 수 있습니다
     (tools/시험_pdfweb.mjs 가 node 로 이 파일을 그대로 돌립니다).

   ⚠️ 한글을 PDF 에 «찍을» 때는 캔버스로 그려 그림으로 붙입니다.
      pdf-lib 의 기본 글꼴에는 한글이 없고, 한글 글꼴 파일은 4MB 가 넘어
      보는 분께 내려받게 할 수 없습니다. 대신 브라우저가 이미 가진 글꼴을 씁니다.
   ========================================================== */

/* ── 바깥에서 갈아 끼울 수 있는 자리 (node 시험용) ──────── */
export const 환경 = {
  캔버스: null,          // (w,h) => canvas 비슷한 것
  그림읽기: null,        // (Uint8Array, mime) => {width,height,draw(ctx,x,y,w,h)}
  pdfjs: null,           // node 시험에서 pdf.js 를 갈아 끼웁니다
  더옵션: null,          // getDocument 에 더 넣을 것 (node: canvasFactory)
  cmap자리: null,        // 한글 푸는 표가 있는 자리 (기본 /pdfjs/cmaps/)
  글꼴자리: null,        // pdf.js 기본 글꼴 자리 (기본 /pdfjs/standard_fonts/)
}

function 캔버스만들기(w, h) {
  if (환경.캔버스) return 환경.캔버스(w, h)
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h))
  return c
}

/* ── 게으른 불러오기 — 쓸 때만 내려받습니다 ─────────────── */
let _lib = null, _pdfjs = null
async function L() {
  if (!_lib) _lib = await import('pdf-lib')
  return _lib
}
async function J() {
  if (!_pdfjs) {
    if (환경.pdfjs) { _pdfjs = 환경.pdfjs; return _pdfjs }
    const m = await import('pdfjs-dist')
    m.GlobalWorkerOptions.workerSrc =
      new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
    _pdfjs = m
  }
  return _pdfjs
}

/** pdf.js 로 열기 — 쪽 글자·그림을 «읽기만» 할 때 씁니다(고치기는 pdf-lib). */
async function 읽기열기(파일) {
  const j = await J()
  try {
    return await j.getDocument({
      data: await 바이트(파일), isEvalSupported: false,
      useSystemFonts: true, disableFontFace: !!환경.캔버스,
      //  🚨 2026-09-18 — 이 두 줄이 없으면 «한글이 통째로 안 읽힙니다».
      //     한글(HWP)·오피스가 만든 PDF 는 글자를 CJK 인코딩으로 넣는데,
      //     pdf.js 는 그 표(cmap)를 따로 받아야 풀 수 있습니다.
      //     시험에서 「흄관」 을 못 찾아 잡았습니다. 없으면 «조용히 빈 글자» 가 나옵니다.
      cMapUrl: 환경.cmap자리 || '/pdfjs/cmaps/', cMapPacked: true,
      standardFontDataUrl: 환경.글꼴자리 || '/pdfjs/standard_fonts/',
      ...(환경.더옵션 || {}),
    }).promise
  } catch (e) {
    const m = String(e && (e.message || e.name) || e)
    if (/password/i.test(m)) throw new Error('비밀번호가 걸린 PDF 입니다. 먼저 푸신 뒤에 올려 주십시오.')
    throw new Error(`이 파일을 열지 못했습니다 — PDF 가 맞는지 보십시오. (${m.slice(0, 80)})`)
  }
}

/** 한 쪽의 글자를 «줄» 로 묶어 돌려줍니다. */
async function 쪽글(페이지) {
  const tc = await 페이지.getTextContent()
  const 줄 = new Map()
  for (const it of tc.items) {
    if (typeof it.str !== 'string') continue
    const y = Math.round((it.transform ? it.transform[5] : 0) * 2) / 2
    if (!줄.has(y)) 줄.set(y, [])
    줄.get(y).push([it.transform ? it.transform[4] : 0, it.str])
  }
  return [...줄.entries()].sort((a, b) => b[0] - a[0])
    .map(([, xs]) => xs.sort((a, b) => a[0] - b[0]).map((x) => x[1]).join(''))
    .join('\n')
}

/** 이 쪽에 그림이 몇 개 있나 (백지인지 가리는 데 씁니다). */
async function 쪽그림수(페이지, j) {
  try {
    const ops = await 페이지.getOperatorList()
    const 그림 = new Set([j.OPS.paintImageXObject, j.OPS.paintJpegXObject,
                          j.OPS.paintInlineImageXObject, j.OPS.paintImageMaskXObject])
    let n = 0
    for (const f of ops.fnArray) if (그림.has(f)) n++
    return n
  } catch { return 0 }
}

/** 짧은 지문 — 같은 내용인 쪽을 찾는 데만 씁니다(보안용 아닙니다). */
function 지문(글) {
  let h = 0x811c9dc5
  for (let i = 0; i < 글.length; i++) { h ^= 글.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0 }
  return h.toString(16)
}

/* ══════════════════════════════════════════════════════════
   도움 것들
   ══════════════════════════════════════════════════════════ */

/** 「1-5」 「1,5,9」 「8-」 「-3」 「전부」 를 0부터 세는 번호 목록으로. */
export function 쪽풀기(글, 전체) {
  const t = String(글 ?? '').trim()
  if (!t || t === '전부' || t === '모두' || t.toLowerCase() === 'all') {
    return Array.from({ length: 전체 }, (_, i) => i)
  }
  const 본 = new Set()
  for (const 조각 of t.split(/[,\s]+/).filter(Boolean)) {
    const m = 조각.match(/^(\d*)\s*-\s*(\d*)$/)
    if (m) {
      let a = m[1] ? parseInt(m[1], 10) : 1
      let b = m[2] ? parseInt(m[2], 10) : 전체
      if (a > b) [a, b] = [b, a]                 // 「3-1」 도 알아듣습니다
      for (let i = a; i <= b; i++) if (i >= 1 && i <= 전체) 본.add(i - 1)
    } else if (/^\d+$/.test(조각)) {
      const i = parseInt(조각, 10)
      if (i >= 1 && i <= 전체) 본.add(i - 1)
    } else {
      throw new Error(`쪽 번호를 못 알아듣겠습니다 : 「${조각}」 — 1-5 · 1,5,9 · 8- · 전부 처럼 적으십시오.`)
    }
  }
  if (!본.size) throw new Error(`이 파일은 ${전체}쪽입니다. 그 안의 쪽을 적으십시오.`)
  return [...본].sort((a, b) => a - b)
}

/** 원본 이름 옆에 꼬리를 붙인 새 이름. 원본은 절대 안 건드립니다. */
export function 낼이름(원본, 꼬리, 확장 = '.pdf') {
  const 바탕 = String(원본 || 'pdf').replace(/\.[^.]+$/, '')
  return `${바탕}_${꼬리}${확장}`
}

const 자리표 = {
  '오른쪽 아래': [1, 1], '왼쪽 아래': [0, 1], '가운데 아래': [0.5, 1],
  '오른쪽 위': [1, 0], '왼쪽 위': [0, 0], '가운데 위': [0.5, 0],
  '한가운데': [0.5, 0.5],
}
export const 자리들 = Object.keys(자리표)

async function 바이트(파일) {
  return new Uint8Array(await 파일.arrayBuffer())
}

/** 흔한 실수를 사람 말로 되돌려 줍니다. */
async function 열기(파일, 고칠수있게 = false) {
  const { PDFDocument } = await L()
  try {
    return await PDFDocument.load(await 바이트(파일),
      { ignoreEncryption: false, updateMetadata: false })
  } catch (e) {
    const m = String(e && e.message || e)
    if (/encrypt/i.test(m)) {
      throw new Error('비밀번호가 걸린 PDF 입니다. 먼저 푸신 뒤에 올려 주십시오.')
    }
    throw new Error(`이 파일을 열지 못했습니다 — PDF 가 맞는지 보십시오. (${m.slice(0, 80)})`)
  }
}

/* 캔버스에 한글을 그려 PNG 로 — pdf-lib 에 붙일 «글자 그림» */
async function 글자그림(글, { 크기 = 48, 색 = '#000000', 굵게 = false, 여백 = 6 } = {}) {
  const 글꼴 = `${굵게 ? '700 ' : ''}${크기}px "Malgun Gothic","맑은 고딕",AppleGothic,"Noto Sans KR",sans-serif`
  const 잼 = 캔버스만들기(10, 10).getContext('2d')
  잼.font = 글꼴
  const w = Math.ceil(잼.measureText(글).width) + 여백 * 2
  const h = Math.ceil(크기 * 1.35) + 여백 * 2
  const c = 캔버스만들기(w, h)
  const g = c.getContext('2d')
  g.font = 글꼴; g.fillStyle = 색
  g.textBaseline = 'middle'
  g.fillText(글, 여백, h / 2)
  return { png: await 캔버스PNG(c), w, h }
}

async function 캔버스PNG(c) {
  if (c.encode) return new Uint8Array(await c.encode('png'))        // node (@napi-rs/canvas)
  if (c.convertToBlob) {                                            // OffscreenCanvas
    const b = await c.convertToBlob({ type: 'image/png' })
    return new Uint8Array(await b.arrayBuffer())
  }
  const url = c.toDataURL('image/png')
  return Uint8Array.from(atob(url.split(',')[1]), (ch) => ch.charCodeAt(0))
}

async function 캔버스JPG(c, 질 = 0.82) {
  if (c.encode) return new Uint8Array(await c.encode('jpeg', Math.round(질 * 100)))
  if (c.convertToBlob) {
    const b = await c.convertToBlob({ type: 'image/jpeg', quality: 질 })
    return new Uint8Array(await b.arrayBuffer())
  }
  const url = c.toDataURL('image/jpeg', 질)
  return Uint8Array.from(atob(url.split(',')[1]), (ch) => ch.charCodeAt(0))
}

/** 엑셀이 한글을 안 깨뜨리도록 BOM 을 붙인 CSV. */
export function csv바이트(줄들) {
  const 칸 = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }
  const 글 = 줄들.map((r) => r.map(칸).join(',')).join('\r\n')
  const b = new TextEncoder().encode(글)
  const out = new Uint8Array(b.length + 3)
  out.set([0xef, 0xbb, 0xbf]); out.set(b, 3)
  return out
}

export function 글바이트(글) { return new TextEncoder().encode(글) }

/** 브라우저에서 «내 컴퓨터에 저장». */
export function 저장(이름, 바이트들, 타입 = 'application/pdf') {
  const a = document.createElement('a')
  const url = URL.createObjectURL(new Blob([바이트들], { type: 타입 }))
  a.href = url; a.download = 이름
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

const 오늘 = () => new Date().toISOString().slice(0, 10)

/* ══════════════════════════════════════════════════════════
   ① 쪽 다루기
   ══════════════════════════════════════════════════════════ */

export async function 합치기(파일들) {
  if (!파일들 || 파일들.length < 2) throw new Error('두 개 이상 고르셔야 합칩니다.')
  const { PDFDocument } = await L()
  const 새 = await PDFDocument.create()
  const 쪽수 = []
  for (const f of 파일들) {
    const d = await 열기(f)
    const 쪽 = await 새.copyPages(d, d.getPageIndices())
    쪽.forEach((p) => 새.addPage(p))
    쪽수.push([f.name, d.getPageCount()])
  }
  return { 이름: '합친파일.pdf', 바이트: await 새.save(), 쪽수 }
}

export async function 쪽골라내기(파일, 범위) {
  const { PDFDocument } = await L()
  const d = await 열기(파일)
  const 골라 = 쪽풀기(범위, d.getPageCount())
  const 새 = await PDFDocument.create()
  const 쪽 = await 새.copyPages(d, 골라)
  쪽.forEach((p) => 새.addPage(p))
  return { 이름: 낼이름(파일.name, '골라낸것'), 바이트: await 새.save(), 남김: 골라.length }
}

export async function 쪽지우기(파일, 범위) {
  const { PDFDocument } = await L()
  const d = await 열기(파일)
  const 전체 = d.getPageCount()
  const 뺄 = new Set(쪽풀기(범위, 전체))
  const 남길 = d.getPageIndices().filter((i) => !뺄.has(i))
  if (!남길.length) throw new Error('모두 빼면 남는 쪽이 없습니다.')
  const 새 = await PDFDocument.create()
  const 쪽 = await 새.copyPages(d, 남길)
  쪽.forEach((p) => 새.addPage(p))
  return { 이름: 낼이름(파일.name, '쪽뺀것'), 바이트: await 새.save(), 뺌: 뺄.size, 남: 남길.length }
}

export async function 순서바꾸기(파일, 새순서) {
  const { PDFDocument } = await L()
  const d = await 열기(파일)
  const 차례 = 쪽풀기(새순서, d.getPageCount())
  // 🚨 쪽풀기는 «정렬해서» 돌려줍니다 — 차례를 바꾸려면 적으신 그대로 읽어야 합니다.
  const 적은대로 = String(새순서 || '').split(/[,\s]+/).filter(Boolean)
  let 목록 = []
  if (적은대로.every((x) => /^\d+$/.test(x))) {
    목록 = 적은대로.map((x) => parseInt(x, 10) - 1)
      .filter((i) => i >= 0 && i < d.getPageCount())
    if (!목록.length) throw new Error('쪽 번호를 못 알아듣겠습니다. 「3,1,2」 처럼 적으십시오.')
  } else {
    목록 = 차례
  }
  const 새 = await PDFDocument.create()
  const 쪽 = await 새.copyPages(d, 목록)
  쪽.forEach((p) => 새.addPage(p))
  return { 이름: 낼이름(파일.name, '순서바꿈'), 바이트: await 새.save(), 쪽수: 목록.length }
}

export async function 회전(파일, 범위, 각도) {
  const { degrees } = await L()
  const 각 = parseInt(각도, 10)
  if (![90, 180, 270].includes(각)) throw new Error('90 · 180 · 270 도 중에서 고르십시오.')
  const d = await 열기(파일)
  const 골라 = 쪽풀기(범위, d.getPageCount())
  for (const i of 골라) {
    const p = d.getPage(i)
    p.setRotation(degrees((p.getRotation().angle + 각) % 360))
  }
  return { 이름: 낼이름(파일.name, `${각}도돌림`), 바이트: await d.save(), 쪽수: 골라.length }
}

export async function 나누기(파일, 방식, 값) {
  const { PDFDocument } = await L()
  const { zipSync } = await import('fflate')
  const d = await 열기(파일)
  const 전체 = d.getPageCount()
  let 묶음 = []
  if (방식 === '낱장') {
    묶음 = d.getPageIndices().map((i) => [i])
  } else if (방식 === '몇쪽씩') {
    const n = parseInt(값, 10)
    if (!(n >= 1)) throw new Error('몇 쪽씩 나눌지 숫자로 적으십시오.')
    for (let i = 0; i < 전체; i += n) 묶음.push(d.getPageIndices().slice(i, i + n))
  } else {                                      // 여기서자르기 — 「5,12」 면 1-4 / 5-11 / 12-끝
    const 자리 = String(값 || '').split(/[,\s]+/).filter(Boolean)
      .map((x) => parseInt(x, 10)).filter((x) => x >= 2 && x <= 전체)
      .sort((a, b) => a - b)
    if (!자리.length) throw new Error('자를 쪽을 적으십시오 (예: 5,12 — 그 쪽부터 새 파일).')
    let 앞 = 0
    for (const c of 자리) { 묶음.push(d.getPageIndices().slice(앞, c - 1)); 앞 = c - 1 }
    묶음.push(d.getPageIndices().slice(앞))
    묶음 = 묶음.filter((g) => g.length)
  }
  const 바탕 = String(파일.name || 'pdf').replace(/\.[^.]+$/, '')
  const 짐 = {}
  let n = 1
  for (const g of 묶음) {
    const 새 = await PDFDocument.create()
    const 쪽 = await 새.copyPages(d, g)
    쪽.forEach((p) => 새.addPage(p))
    const 쪽말 = g.length === 1 ? `${g[0] + 1}쪽` : `${g[0] + 1}-${g[g.length - 1] + 1}쪽`
    짐[`${바탕}_${String(n).padStart(3, '0')}_${쪽말}.pdf`] = await 새.save()
    n++
  }
  return { 이름: `${바탕}_나눔.zip`, 바이트: zipSync(짐, { level: 0 }), 개수: 묶음.length, 타입: 'application/zip' }
}

/* ══════════════════════════════════════════════════════════
   ② 얹기 — 한글은 «캔버스로 그려 그림으로» 붙입니다
   ══════════════════════════════════════════════════════════ */

async function 그림붙이기(문서, 바이트들, 이름) {
  const 아래 = String(이름 || '').toLowerCase()
  try {
    if (아래.endsWith('.png')) return await 문서.embedPng(바이트들)
    if (/\.jpe?g$/.test(아래)) return await 문서.embedJpg(바이트들)
  } catch { /* 이름만 png 이고 속은 딴것일 수 있습니다 — 아래에서 다시 그립니다 */ }
  //  그 밖(webp·bmp·gif)이거나 위가 안 되면 캔버스를 거쳐 PNG 로 바꿔 붙입니다
  try {
    const g = await 그림열기(바이트들, 이름)
    const c = 캔버스만들기(g.width, g.height)
    g.draw(c.getContext('2d'), 0, 0, g.width, g.height)
    return await 문서.embedPng(await 캔버스PNG(c))
  } catch {
    throw new Error(`「${이름}」 을 그림으로 읽지 못했습니다. png 나 jpg 로 다시 골라 주십시오.`)
  }
}

async function 그림열기(바이트들, 이름 = '') {
  if (환경.그림읽기) return 환경.그림읽기(바이트들, 이름)
  const blob = new Blob([바이트들])
  const bmp = await createImageBitmap(blob)
  return {
    width: bmp.width, height: bmp.height,
    draw: (ctx, x, y, w, h) => ctx.drawImage(bmp, x, y, w, h),
  }
}

export async function 도장얹기(파일, 그림파일, 범위 = '전부', 자리 = '오른쪽 아래',
                                크기mm = 25, 여백mm = 12, 투명도 = 1) {
  if (!그림파일) throw new Error('도장·서명 그림을 먼저 고르십시오.')
  const d = await 열기(파일)
  const img = await 그림붙이기(d, await 바이트(그림파일), 그림파일.name)
  const 골라 = 쪽풀기(범위, d.getPageCount())
  const [ax, ay] = 자리표[자리] || 자리표['오른쪽 아래']
  const 폭 = (크기mm / 25.4) * 72
  const 높 = 폭 * (img.height / img.width)
  const 여 = (여백mm / 25.4) * 72
  for (const i of 골라) {
    const p = d.getPage(i)
    const { width: W, height: H } = p.getSize()
    const x = 여 + ax * (W - 폭 - 여 * 2)
    const y = 여 + (1 - ay) * (H - 높 - 여 * 2)
    p.drawImage(img, { x, y, width: 폭, height: 높, opacity: 투명도 })
  }
  return { 이름: 낼이름(파일.name, '도장'), 바이트: await d.save(), 쪽수: 골라.length }
}

export async function 워터마크(파일, 글자, 범위 = '전부', 크기 = 52,
                                기울기 = 45, 진하기 = 0.12) {
  if (!String(글자 || '').trim()) throw new Error('얹을 글자를 적으십시오.')
  const { degrees } = await L()
  const d = await 열기(파일)
  const 그림 = await 글자그림(글자, { 크기: 120, 색: '#000000', 굵게: true })
  const img = await d.embedPng(그림.png)
  const 골라 = 쪽풀기(범위, d.getPageCount())
  for (const i of 골라) {
    const p = d.getPage(i)
    const { width: W, height: H } = p.getSize()
    const 폭 = Math.min(W * 0.72, (크기 / 120) * 그림.w * 2.2)
    const 높 = 폭 * (그림.h / 그림.w)
    p.drawImage(img, {
      x: W / 2 - (폭 / 2) * Math.cos(기울기 * Math.PI / 180) + (높 / 2) * Math.sin(기울기 * Math.PI / 180),
      y: H / 2 - (폭 / 2) * Math.sin(기울기 * Math.PI / 180) - (높 / 2) * Math.cos(기울기 * Math.PI / 180),
      width: 폭, height: 높, opacity: 진하기, rotate: degrees(기울기),
    })
  }
  return { 이름: 낼이름(파일.name, '표시'), 바이트: await d.save(), 쪽수: 골라.length }
}

export async function 쪽번호(파일, 꼴 = '- {n} -', 첫번호 = 1,
                             자리 = '가운데 아래', 크기 = 10) {
  const { StandardFonts, rgb } = await L()
  const d = await 열기(파일)
  const 전체 = d.getPageCount()
  const [ax, ay] = 자리표[자리] || 자리표['가운데 아래']
  // 숫자·영문뿐이면 «진짜 글자» 로 찍습니다(가볍고 복사됩니다).
  // 한글이 섞이면 캔버스 그림으로 찍습니다 — pdf-lib 기본 글꼴에 한글이 없습니다.
  const 한글있나 = /[^\x00-\x7F]/.test(꼴)
  let 글꼴 = null
  if (!한글있나) 글꼴 = await d.embedFont(StandardFonts.Helvetica)
  const 여 = 24
  for (let i = 0; i < 전체; i++) {
    const p = d.getPage(i)
    const { width: W, height: H } = p.getSize()
    const 글 = String(꼴).replace(/\{n\}/g, String(첫번호 + i))
      .replace(/\{전체\}/g, String(전체)).replace(/\{total\}/g, String(전체))
    if (글꼴) {
      const w = 글꼴.widthOfTextAtSize(글, 크기)
      p.drawText(글, {
        x: 여 + ax * (W - w - 여 * 2), y: 여 + (1 - ay) * (H - 크기 - 여 * 2),
        size: 크기, font: 글꼴, color: rgb(0, 0, 0),
      })
    } else {
      const 그림 = await 글자그림(글, { 크기: 64 })
      const img = await d.embedPng(그림.png)
      const 폭 = (크기 / 64) * 그림.w, 높 = (크기 / 64) * 그림.h
      p.drawImage(img, {
        x: 여 + ax * (W - 폭 - 여 * 2), y: 여 + (1 - ay) * (H - 높 - 여 * 2),
        width: 폭, height: 높,
      })
    }
  }
  return { 이름: 낼이름(파일.name, '쪽번호'), 바이트: await d.save(), 쪽수: 전체 }
}

/* ══════════════════════════════════════════════════════════
   ③ 뽑기 · 찾기
   ══════════════════════════════════════════════════════════ */

export async function 살펴보기(파일) {
  const d = await 읽기열기(파일)
  const p1 = await d.getPage(1)
  const v = p1.getViewport({ scale: 1, rotation: 0 })
  let 글있는쪽 = 0
  const 볼쪽 = Math.min(d.numPages, 30)
  for (let i = 1; i <= 볼쪽; i++) {
    const p = await d.getPage(i)
    if ((await 쪽글(p)).trim()) 글있는쪽++
  }
  let 정보 = {}
  try { 정보 = (await d.getMetadata()).info || {} } catch { /* 없어도 됩니다 */ }
  return {
    '쪽수': d.numPages,
    '첫 쪽 크기': `${Math.round(v.width)} × ${Math.round(v.height)}`,
    '파일 크기(MB)': Math.round((파일.size || 0) / 1048576 * 100) / 100,
    '만든 프로그램': 정보.Producer || 정보.Creator || '(적혀 있지 않음)',
    '스캔본으로보임': 글있는쪽 === 0,
    [`앞 ${볼쪽}쪽을 보니`]: `글 있는 쪽 ${글있는쪽}개`,
  }
}

export async function 글자뽑기(파일) {
  const d = await 읽기열기(파일)
  const 조각 = []
  let 빈 = 0
  for (let i = 1; i <= d.numPages; i++) {
    const t = await 쪽글(await d.getPage(i))
    if (!t.trim()) 빈++
    조각.push(`${'='.repeat(56)}\n[${i} 쪽]\n${t}`)
  }
  return {
    이름: 낼이름(파일.name, '글자', '.txt'),
    바이트: 글바이트(조각.join('\n\n')),
    타입: 'text/plain;charset=utf-8', 빈,
  }
}

export async function 쪽을그림으로(파일, 범위 = '전부', 배율 = 2, 진도) {
  const { zipSync } = await import('fflate')
  const d = await 읽기열기(파일)
  const 골라 = 쪽풀기(범위, d.numPages)
  const 바탕 = String(파일.name || 'pdf').replace(/\.[^.]+$/, '')
  const 짐 = {}
  let k = 0
  for (const i of 골라) {
    k++; if (진도) await 진도(k, 골라.length)
    const p = await d.getPage(i + 1)
    const v = p.getViewport({ scale: 배율 })
    const c = 캔버스만들기(v.width, v.height)
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
    await p.render({ canvasContext: ctx, viewport: v }).promise
    짐[`${바탕}_${String(i + 1).padStart(3, '0')}쪽.png`] = await 캔버스PNG(c)
  }
  return {
    이름: `${바탕}_쪽그림.zip`, 바이트: zipSync(짐, { level: 0 }),
    타입: 'application/zip', 장수: 골라.length,
  }
}

export async function 낱말찾기(파일, 찾을말) {
  const 말 = String(찾을말 || '').trim()
  if (!말) throw new Error('찾을 말을 적으십시오.')
  const d = await 읽기열기(파일)
  const 자리 = []
  let 글있나 = false
  for (let i = 1; i <= d.numPages; i++) {
    const t = await 쪽글(await d.getPage(i))
    if (t.trim()) 글있나 = true
    const 몇 = t.split(말).length - 1
    if (몇 > 0) 자리.push({ 쪽: i, 몇 })
  }
  return { 자리, 모두: 자리.reduce((a, b) => a + b.몇, 0), 글있나 }
}

function 둘레글(글, 말, 폭 = 45) {
  const i = 글.indexOf(말)
  if (i < 0) return ''
  return 글.slice(Math.max(0, i - 폭), Math.min(글.length, i + 말.length + 폭))
    .replace(/\s+/g, ' ').trim()
}

/** 여러 파일(폴더째 고르기)에서 낱말 찾기 → 엑셀에서 열리는 CSV. */
export async function 여러파일에서찾기(파일들, 찾을말들, 진도) {
  const 말들 = String(찾을말들 || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean)
  if (!말들.length) throw new Error('찾을 말을 적으십시오.')
  const pdfs = (파일들 || []).filter((f) => /\.pdf$/i.test(f.name))
  if (!pdfs.length) throw new Error('고르신 것 중에 PDF 가 없습니다.')
  const 찾음 = [], 못읽음 = []
  let k = 0
  for (const f of pdfs) {
    k++; if (진도) await 진도(k, pdfs.length)
    try {
      const d = await 읽기열기(f)
      let 글있나 = false
      for (let i = 1; i <= d.numPages; i++) {
        const t = await 쪽글(await d.getPage(i))
        if (t.trim()) 글있나 = true
        for (const 말 of 말들) {
          if (t.includes(말)) 찾음.push([f.webkitRelativePath || f.name, i, 말, 둘레글(t, 말)])
        }
      }
      if (!글있나) 못읽음.push([f.webkitRelativePath || f.name, '글자가 없습니다(스캔본)'])
    } catch (e) {
      못읽음.push([f.webkitRelativePath || f.name, `열지 못함: ${String(e.message || e).slice(0, 60)}`])
    }
  }
  const 줄 = [['파일', '쪽', '찾은 말', '그 자리 글'], ...찾음]
  if (못읽음.length) {
    줄.push([], ['■ 못 읽은 파일 — 스캔본이라 글자가 없습니다'], ['파일', '까닭'], ...못읽음)
  }
  return {
    이름: `찾기결과_${오늘()}.csv`, 바이트: csv바이트(줄),
    타입: 'text/csv;charset=utf-8',
    파일수: pdfs.length, 찾은수: 찾음.length, 못읽음: 못읽음.length,
  }
}

/* ══════════════════════════════════════════════════════════
   ④ 제출본 점검표 — 내기 «전에» 파일을 훑습니다
      446쪽짜리를 사람이 넘겨 보며 백지·뒤집힘을 찾을 수는 없습니다.
   ══════════════════════════════════════════════════════════ */

export async function 점검(파일, 진도) {
  const j = await J()
  const d = await 읽기열기(파일)
  const 쪽들 = [], 크기셈 = new Map(), 지문표 = new Map()
  for (let i = 1; i <= d.numPages; i++) {
    if (진도) await 진도(i, d.numPages)
    const p = await d.getPage(i)
    const 글 = (await 쪽글(p)).trim()
    const 그림 = await 쪽그림수(p, j)
    const v = p.getViewport({ scale: 1, rotation: 0 })
    const 크기 = `${Math.round(v.width)}×${Math.round(v.height)}`
    크기셈.set(크기, (크기셈.get(크기) || 0) + 1)
    const h = 지문(글.slice(0, 400) + `|${크기}|${그림}`)
    if (!지문표.has(h)) 지문표.set(h, [])
    지문표.get(h).push(i)
    쪽들.push({ 쪽: i, 글자수: 글.length, 그림, 돌림: p.rotate || 0, 크기 })
  }
  let 흔한 = null, 최다 = -1
  for (const [k, v] of 크기셈) if (v > 최다) { 최다 = v; 흔한 = k }

  const 탈 = []
  for (const r of 쪽들) {
    if (r.글자수 === 0 && r.그림 === 0) {
      탈.push([r.쪽, '백지', '내용이 하나도 없습니다 — 빼야 할 쪽일 수 있습니다'])
    } else if (r.글자수 === 0 && r.그림 > 0) {
      탈.push([r.쪽, '글자 없음(스캔본)', '찾기·복사가 안 됩니다. 글자 인식(OCR)이 필요합니다'])
    }
    if (r.돌림 % 360 !== 0) {
      탈.push([r.쪽, `${r.돌림}도 돌아감`, '인쇄하면 눕거나 뒤집힙니다'])
    }
    if (흔한 && r.크기 !== 흔한) {
      탈.push([r.쪽, `쪽 크기 다름 ${r.크기}`, `대부분은 ${흔한} 입니다 — 제본 때 어긋납니다`])
    }
  }
  for (const [, 쪽번호들] of 지문표) {
    if (쪽번호들.length > 1) {
      탈.push([쪽번호들[0], '겹친 쪽 의심', '같은 내용으로 보이는 쪽 : ' + 쪽번호들.join(', ')])
    }
  }
  탈.sort((a, b) => a[0] - b[0] || String(a[1]).localeCompare(String(b[1])))
  const 요약 = {
    '쪽수': 쪽들.length,
    '글자 있는 쪽': 쪽들.filter((r) => r.글자수 > 0).length,
    '백지': 쪽들.filter((r) => r.글자수 === 0 && r.그림 === 0).length,
    '돌아간 쪽': 쪽들.filter((r) => r.돌림 % 360 !== 0).length,
    '쪽 크기 종류': 크기셈.size,
    '파일 크기(MB)': Math.round((파일.size || 0) / 1048576 * 100) / 100,
  }
  return { 요약, 탈 }
}

export async function 점검표내기(파일, 진도) {
  const { 요약, 탈 } = await 점검(파일, 진도)
  const 줄 = [['■ 요약'], ['항목', '값'],
    ...Object.entries(요약), [],
    ['■ 봐야 할 곳', 탈.length, '군데'], ['쪽', '무엇', '왜'], ...탈]
  return {
    이름: 낼이름(파일.name, '점검표', '.csv'), 바이트: csv바이트(줄),
    타입: 'text/csv;charset=utf-8', 요약, 탈,
  }
}

/* ══════════════════════════════════════════════════════════
   ⑤ 당초 ↔ 변경 비교
      쪽을 그림으로 떠서 «달라진 자리» 를 빨간 칸으로 표시합니다.
   ══════════════════════════════════════════════════════════ */

function 다른칸찾기(A, B, w, h, 민감도) {
  const 묶음 = 12
  const 칸 = []
  for (let y = 0; y < h; y += 묶음) {
    const 줄칸 = []
    for (let x = 0; x < w; x += 묶음) {
      let 다름 = false
      for (let yy = y; yy < Math.min(y + 묶음, h) && !다름; yy += 3) {
        const 기준 = yy * w * 4
        for (let xx = x; xx < Math.min(x + 묶음, w); xx += 3) {
          const p = 기준 + xx * 4
          if (Math.abs(A[p] - B[p]) > 민감도 || Math.abs(A[p + 1] - B[p + 1]) > 민감도) {
            다름 = true; break
          }
        }
      }
      if (다름) {
        if (줄칸.length && x - 줄칸[줄칸.length - 1][1] <= 묶음 * 2) {
          줄칸[줄칸.length - 1][1] = x + 묶음
        } else 줄칸.push([x, x + 묶음])
      }
    }
    for (const [x0, x1] of 줄칸) {
      let 붙임 = false
      for (const c of 칸) {
        if (c[3] >= y - 묶음 * 2 && !(x1 < c[0] - 묶음 || x0 > c[2] + 묶음)) {
          c[0] = Math.min(c[0], x0); c[2] = Math.max(c[2], x1); c[3] = y + 묶음
          붙임 = true; break
        }
      }
      if (!붙임) 칸.push([x0, y, x1, y + 묶음])
    }
  }
  return 칸.filter((c) => (c[2] - c[0]) * (c[3] - c[1]) > 200)
}

async function 쪽그림떠서(문서, i, 배율) {
  const p = await 문서.getPage(i)
  const v = p.getViewport({ scale: 배율 })
  const c = 캔버스만들기(v.width, v.height)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height)
  await p.render({ canvasContext: ctx, viewport: v }).promise
  return { 자료: ctx.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height, v }
}

export async function 비교(당초, 변경, { 배율 = 1.6, 민감도 = 28 } = {}, 진도) {
  const { PDFDocument, rgb } = await L()
  const a = await 읽기열기(당초)
  const b = await 읽기열기(변경)
  const 낸 = await 열기(변경)                   // 표시는 «변경본» 위에 그립니다
  const 쪽수 = Math.max(a.numPages, b.numPages)
  const 바뀐쪽 = [], 말바뀜 = []

  for (let i = 1; i <= 쪽수; i++) {
    if (진도) await 진도(i, 쪽수)
    const 있A = i <= a.numPages, 있B = i <= b.numPages
    if (!있B) { 바뀐쪽.push([i, '당초에만 있는 쪽']); continue }
    if (!있A) {
      바뀐쪽.push([i, '변경에서 새로 생긴 쪽'])
      const p = 낸.getPage(i - 1), s = p.getSize()
      p.drawRectangle({
        x: 6, y: 6, width: s.width - 12, height: s.height - 12,
        borderColor: rgb(1, 0, 0), borderWidth: 3,
      })
      continue
    }
    const A = await 쪽그림떠서(a, i, 배율)
    const B = await 쪽그림떠서(b, i, 배율)
    if (A.w !== B.w || A.h !== B.h) {
      바뀐쪽.push([i, '쪽 크기가 다릅니다 — 그림 비교를 건너뜁니다'])
    } else {
      const 칸 = 다른칸찾기(A.자료, B.자료, A.w, A.h, 민감도)
      if (칸.length) {
        바뀐쪽.push([i, `${칸.length}곳 달라짐`])
        const p = 낸.getPage(i - 1)
        for (const [x0, y0, x1, y1] of 칸) {
          //  화면 좌표 → PDF 좌표. 돌아간 쪽도 viewport 가 알아서 되돌려 줍니다.
          const [px0, py0] = B.v.convertToPdfPoint(x0 - 2, y0 - 2)
          const [px1, py1] = B.v.convertToPdfPoint(x1 + 2, y1 + 2)
          p.drawRectangle({
            x: Math.min(px0, px1), y: Math.min(py0, py1),
            width: Math.abs(px1 - px0), height: Math.abs(py1 - py0),
            borderColor: rgb(1, 0, 0), borderWidth: 1.2,
            color: rgb(1, 0, 0), opacity: 0.12,
          })
        }
      }
    }
    const ta = new Set((await 쪽글(await a.getPage(i))).split(/\s+/).filter(Boolean))
    const tb = new Set((await 쪽글(await b.getPage(i))).split(/\s+/).filter(Boolean))
    const 빠짐 = [...ta].filter((x) => !tb.has(x)).sort()
    const 생김 = [...tb].filter((x) => !ta.has(x)).sort()
    if (빠짐.length || 생김.length) 말바뀜.push([i, 빠짐.slice(0, 25), 생김.slice(0, 25)])
  }

  const 글 = [`당초 : ${당초.name}`, `변경 : ${변경.name}`, `본 날 : ${오늘()}`, '']
  if (!말바뀜.length) 글.push('글자로는 달라진 곳을 찾지 못했습니다.')
  for (const [쪽, 빠짐, 생김] of 말바뀜) {
    글.push('', '='.repeat(56), `[${쪽} 쪽]`)
    if (빠짐.length) 글.push('  - 없어진 말 : ' + 빠짐.join(', '))
    if (생김.length) 글.push('  + 새로 생긴 말 : ' + 생김.join(', '))
  }
  return {
    표시: { 이름: 낼이름(변경.name, '비교표시'), 바이트: await 낸.save() },
    글: {
      이름: 낼이름(변경.name, '바뀐말', '.txt'), 바이트: 글바이트(글.join('\n')),
      타입: 'text/plain;charset=utf-8',
    },
    바뀐쪽, 말바뀜,
  }
}

/* ══════════════════════════════════════════════════════════
   ⑥ 사진대지 — 현장 사진 폴더 → A4 사진대지 PDF
   ══════════════════════════════════════════════════════════ */

/** 사진 안(EXIF)에 든 «찍은 날». 없으면 빈 글자. */
export function exif날짜(바이트들) {
  try {
    const v = new DataView(바이트들.buffer, 바이트들.byteOffset, 바이트들.byteLength)
    if (v.getUint16(0) !== 0xffd8) return ''                 // JPEG 가 아님
    let p = 2
    while (p + 4 < v.byteLength) {
      if (v.getUint8(p) !== 0xff) break
      const 표 = v.getUint8(p + 1), 길이 = v.getUint16(p + 2)
      if (표 === 0xe1) {
        const s = p + 4
        if (v.getUint32(s) !== 0x45786966) break             // "Exif"
        const tiff = s + 6
        const 작은쪽 = v.getUint16(tiff) === 0x4949
        const u16 = (o) => v.getUint16(o, 작은쪽)
        const u32 = (o) => v.getUint32(o, 작은쪽)
        let ifd = tiff + u32(tiff + 4)
        for (let 바퀴 = 0; 바퀴 < 2; 바퀴++) {
          const n = u16(ifd)
          let exif = 0
          for (let i = 0; i < n; i++) {
            const e = ifd + 2 + i * 12
            const 표번 = u16(e)
            if (표번 === 0x9003 || 표번 === 0x9004 || 표번 === 0x0132) {
              const off = tiff + u32(e + 8)
              let 글 = ''
              for (let k = 0; k < 19 && off + k < v.byteLength; k++) {
                글 += String.fromCharCode(v.getUint8(off + k))
              }
              const m = 글.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})/)
              if (m) return `${m[1]}-${m[2]}-${m[3]}`
            }
            if (표번 === 0x8769) exif = tiff + u32(e + 8)
          }
          if (!exif) break
          ifd = exif
        }
      }
      if (표 === 0xda) break
      p += 2 + 길이
    }
  } catch { /* 없으면 없는 대로 */ }
  return ''
}

export async function 사진대지(사진들, {
  공사명 = '', 위치 = '', 한쪽에 = 2, 설명들 = null, 긴쪽 = 1600,
} = {}, 진도) {
  const 보임 = /\.(jpe?g|png|bmp|gif|webp)$/i
  const 목록 = (사진들 || []).filter((f) => 보임.test(f.name))
    .sort((a, b) => String(a.webkitRelativePath || a.name)
      .localeCompare(String(b.webkitRelativePath || b.name), 'ko'))
  if (!목록.length) throw new Error('고르신 것 중에 사진이 없습니다.')
  const 칸수표 = { 2: [1, 2], 4: [2, 2], 6: [2, 3] }
  if (!칸수표[한쪽에]) throw new Error('한 쪽에 2 · 4 · 6 장 중에서 고르십시오.')
  설명들 = 설명들 || {}

  const { PDFDocument, rgb } = await L()
  const doc = await PDFDocument.create()
  const W = 595.28, H = 841.89, 여백 = 36, 머리높이 = 56, 글칸높 = 46
  const [가로칸, 세로칸] = 칸수표[한쪽에]

  const 글캐시 = new Map()
  const 글붙이기 = async (p, 글, x, y, 크기, 색 = '#111111', 굵게 = false) => {
    if (!String(글).trim()) return 0
    const 열쇠 = `${글}|${굵게}|${색}`
    if (!글캐시.has(열쇠)) {
      const g = await 글자그림(글, { 크기: 64, 색, 굵게 })
      글캐시.set(열쇠, { img: await doc.embedPng(g.png), w: g.w, h: g.h })
    }
    const { img, w, h } = 글캐시.get(열쇠)
    const 폭 = (크기 / 64) * w, 높 = (크기 / 64) * h
    p.drawImage(img, { x, y: y - 높 * 0.78, width: 폭, height: 높 })
    return 폭
  }

  for (let k = 0; k < 목록.length; k += 한쪽에) {
    const 묶음 = 목록.slice(k, k + 한쪽에)
    if (진도) await 진도(k + 묶음.length, 목록.length)
    const p = doc.addPage([W, H])

    // ── 머리 ──
    p.drawRectangle({
      x: 여백, y: H - 여백 - 머리높이, width: W - 여백 * 2, height: 머리높이,
      borderColor: rgb(0.3, 0.3, 0.3), borderWidth: 0.8,
    })
    const 제목 = 공사명 || '공 사 명'
    const 잼 = await 글자그림(제목, { 크기: 64, 굵게: true })
    const 제목폭 = (13 / 64) * 잼.w
    await 글붙이기(p, 제목, W / 2 - 제목폭 / 2, H - 여백 - 20, 13, '#111111', true)
    const 밑 = `위치 : ${위치 || ''}      쪽 : ${Math.floor(k / 한쪽에) + 1} / ${Math.ceil(목록.length / 한쪽에)}`
    const 잼2 = await 글자그림(밑, { 크기: 64 })
    await 글붙이기(p, 밑, W / 2 - (9 / 64) * 잼2.w / 2, H - 여백 - 40, 9, '#333333')

    // ── 사진 칸 ──
    const 위 = H - 여백 - 머리높이 - 10
    const 아래 = 여백
    const 칸폭 = (W - 여백 * 2) / 가로칸
    const 칸높 = (위 - 아래) / 세로칸
    for (let n = 0; n < 묶음.length; n++) {
      const cx = n % 가로칸, cy = Math.floor(n / 가로칸)
      const x0 = 여백 + cx * 칸폭 + 4
      const y1 = 위 - cy * 칸높 - 4
      const x1 = 여백 + (cx + 1) * 칸폭 - 4
      const y0 = 위 - (cy + 1) * 칸높 + 4
      p.drawRectangle({
        x: x0, y: y0, width: x1 - x0, height: y1 - y0,
        borderColor: rgb(0.45, 0.45, 0.45), borderWidth: 0.8,
      })
      const 사진 = 묶음[n]
      const 원바이트 = await 바이트(사진)
      const 그림칸 = { x: x0 + 5, y: y0 + 글칸높, w: x1 - x0 - 10, h: y1 - y0 - 글칸높 - 5 }
      try {
        const g = await 그림열기(원바이트, 사진.name)
        const 줄임 = Math.min(1, 긴쪽 / Math.max(g.width, g.height))
        const cw = Math.max(1, Math.round(g.width * 줄임))
        const ch = Math.max(1, Math.round(g.height * 줄임))
        const c = 캔버스만들기(cw, ch)
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, cw, ch)
        g.draw(ctx, 0, 0, cw, ch)
        const img = await doc.embedJpg(await 캔버스JPG(c))
        const 비 = Math.min(그림칸.w / cw, 그림칸.h / ch)
        const dw = cw * 비, dh = ch * 비
        p.drawImage(img, {
          x: 그림칸.x + (그림칸.w - dw) / 2, y: 그림칸.y + (그림칸.h - dh) / 2,
          width: dw, height: dh,
        })
      } catch {
        await 글붙이기(p, '(사진을 넣지 못했습니다)', 그림칸.x + 10,
                       그림칸.y + 그림칸.h / 2, 9, '#999999')
      }
      // ── 촬영일 · 설명 칸 ──
      const 찍은날 = exif날짜(원바이트)
        || (사진.lastModified ? new Date(사진.lastModified).toISOString().slice(0, 10) : '')
      p.drawLine({
        start: { x: x0 + 5, y: y0 + 글칸높 }, end: { x: x1 - 5, y: y0 + 글칸높 },
        color: rgb(0.6, 0.6, 0.6), thickness: 0.6,
      })
      await 글붙이기(p, `촬영일 : ${찍은날}`, x0 + 8, y0 + 글칸높 - 12, 8.5, '#333333')
      const 설명 = 설명들[사진.name] || '설명 : '
      await 글붙이기(p, 설명, x0 + 8, y0 + 글칸높 - 28, 9, '#111111')
    }
  }
  return {
    이름: `사진대지_${오늘()}.pdf`, 바이트: await doc.save(),
    장수: 목록.length, 쪽수: Math.ceil(목록.length / 한쪽에),
  }
}
