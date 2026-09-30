/**
 * 🧾 영수증 — 브라우저에서 스캔 열기(사진 · PDF) · 나누기 · 잘라내기 (2026-09-30) — 셈은 영수증.js
 */
import { 영수증찾기 } from './영수증.js'
import { 새id } from './사진정리.js'

const 긴쪽 = 2400

function 캔버스(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h))
  return c
}
const jpg = (c, 질 = 0.86) => new Promise((ok, no) => c.toBlob((b) => (b ? b.arrayBuffer().then((a) => ok(new Uint8Array(a)), no) : no(new Error('그림을 만들지 못했습니다'))), 'image/jpeg', 질))
async function 풀기(blob) {
  try { return await createImageBitmap(blob, { imageOrientation: 'from-image' }) } catch (e) {
    const url = URL.createObjectURL(blob)
    try { const img = new Image(); img.src = url; await img.decode(); return img } finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
  }
}

/** 그림(캔버스에 그릴 수 있는 것) → 스캔 한 장 + 저절로 나눈 칸들 */
async function 스캔짓기(원, 이름) {
  const s = Math.min(1, 긴쪽 / Math.max(원.width, 원.height))
  const w = Math.round(원.width * s), h = Math.round(원.height * s)
  const c = 캔버스(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h)
  g.drawImage(원, 0, 0, w, h)
  const 작업본 = await jpg(c)
  const ts = Math.min(1, 480 / Math.max(w, h))
  const t = 캔버스(w * ts, h * ts)
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height)
  const 칸들 = 자동칸(c)
  return { id: 새id('s'), 이름, 작업본, 너비: w, 높이: h, 작은그림: t.toDataURL('image/jpeg', 0.7), 칸들 }
}

/** 캔버스 → 칸들(0~1) — 긴 쪽 800 점 회색으로 */
export function 자동칸(c) {
  const s = Math.min(1, 800 / Math.max(c.width, c.height))
  const w = Math.max(8, Math.round(c.width * s)), h = Math.max(8, Math.round(c.height * s))
  const k = 캔버스(w, h)
  const g = k.getContext('2d', { willReadFrequently: true })
  g.drawImage(c, 0, 0, w, h)
  const d = g.getImageData(0, 0, w, h).data
  const gray = new Uint8Array(w * h)
  for (let i = 0; i < gray.length; i++) gray[i] = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000
  return 영수증찾기(gray, w, h).map((b) => ({ id: 새id('r'), ...b, 돌림: 0 }))
}

/** 스캔 작업본을 다시 풀어 자동으로 나누기 */
export async function 다시나누기(스캔) {
  const 원 = await 풀기(new Blob([스캔.작업본], { type: 'image/jpeg' }))
  const c = 캔버스(스캔.너비, 스캔.높이)
  c.getContext('2d').drawImage(원, 0, 0, c.width, c.height)
  return 자동칸(c)
}

let _pdfjs = null
async function pdfjs() {
  if (_pdfjs) return _pdfjs
  const m = await import('pdfjs-dist')
  m.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  _pdfjs = m
  return m
}

/** 파일(사진 · PDF) → 스캔들 */
export async function 스캔열기(파일, 진도) {
  if (/\.pdf$/i.test(파일.name) || 파일.type === 'application/pdf') {
    const j = await pdfjs()
    let doc
    try {
      doc = await j.getDocument({ data: new Uint8Array(await 파일.arrayBuffer()), isEvalSupported: false, cMapUrl: '/pdfjs/cmaps/', cMapPacked: true, standardFontDataUrl: '/pdfjs/standard_fonts/' }).promise
    } catch (e) {
      if (/password/i.test(String(e && e.message))) throw new Error(`「${파일.name}」 — 비밀번호가 걸린 PDF 입니다`)
      throw new Error(`「${파일.name}」 을 PDF 로 읽지 못했습니다`)
    }
    const out = []
    const n = Math.min(doc.numPages, 60)
    for (let i = 1; i <= n; i++) {
      const pg = await doc.getPage(i)
      const v1 = pg.getViewport({ scale: 1 })
      const sc = Math.min(3, 긴쪽 / Math.max(v1.width, v1.height))
      const vp = pg.getViewport({ scale: sc })
      const c = 캔버스(vp.width, vp.height)
      const g = c.getContext('2d')
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height)
      await pg.render({ canvasContext: g, viewport: vp }).promise
      out.push(await 스캔짓기(c, `${파일.name} ${i}쪽`))
      if (진도) 진도(i, n)
    }
    try { doc.destroy() } catch (e) { /* 없음 */ }
    return out
  }
  let 원
  try { 원 = await 풀기(파일) } catch (e) {
    if (/\.hei[cf]$/i.test(파일.name)) throw new Error(`「${파일.name}」 — 아이폰 HEIC 는 이 브라우저가 못 엽니다. JPG 로 보내 주십시오.`)
    throw new Error(`「${파일.name}」 을 그림으로 읽지 못했습니다`)
  }
  const s = await 스캔짓기(원, 파일.name)
  if (원.close) 원.close()
  return [s]
}

/** 스캔 + 칸 → 영수증 그림(돌림 반영) { 작업본, 너비, 높이, 작은그림 } */
export async function 잘라내기(스캔, 칸, 원 = null) {
  const 그림 = 원 || await 풀기(new Blob([스캔.작업본], { type: 'image/jpeg' }))
  const sx = 칸.x * 스캔.너비, sy = 칸.y * 스캔.높이, sw = Math.max(4, 칸.w * 스캔.너비), sh = Math.max(4, 칸.h * 스캔.높이)
  const s = Math.min(1, 1800 / Math.max(sw, sh))
  const w0 = Math.round(sw * s), h0 = Math.round(sh * s)
  const 옆 = (칸.돌림 || 0) % 180 !== 0
  const w = 옆 ? h0 : w0, h = 옆 ? w0 : h0
  const c = 캔버스(w, h)
  const g = c.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h)
  g.translate(w / 2, h / 2); g.rotate(((칸.돌림 || 0) * Math.PI) / 180)
  g.drawImage(그림, sx, sy, sw, sh, -w0 / 2, -h0 / 2, w0, h0)
  const 작업본 = await jpg(c, 0.86)
  const ts = Math.min(1, 320 / Math.max(w, h))
  const t = 캔버스(w * ts, h * ts)
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height)
  return { 작업본, 너비: w, 높이: h, 작은그림: t.toDataURL('image/jpeg', 0.72) }
}

/** 스캔 한 장의 칸들을 모두 잘라내기(한 번만 풀어서) */
export async function 모두잘라내기(스캔) {
  const 원 = await 풀기(new Blob([스캔.작업본], { type: 'image/jpeg' }))
  const out = []
  for (const 칸 of 스캔.칸들) out.push({ 칸, ...(await 잘라내기(스캔, 칸, 원)) })
  if (원.close) 원.close()
  return out
}
