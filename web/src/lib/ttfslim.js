/**
 * ✂️ 글꼴 줄이기 — «쓴 글자만 남기고 나머지 글자 모양을 비웁니다» (2026-09-26)
 *
 * ⚠️ 왜 직접 만드나: pdf-lib 의 글꼴 서브셋(subset:true)이 나눔고딕(KCM Gothic)에서 글자를 빠뜨립니다.
 *   2026-09-26 시험: 「여수한려새마을금고 회관 CONTRACT ELT」 → 「관 C TRACT T」 만 찍힘.
 *   한글 글자 모양 8,822개가 «부품(자모) 조합형(composite)» 인데 부품을 제대로 안 챙기는 것으로 보입니다.
 *   subset:false 로 통째로 넣으면 PDF 마다 +500KB.
 * ■ 그래서: 글자 번호(GID)는 그대로 두고, 쓰지 않는 글자의 모양만 비웁니다(부품은 따라 넣음).
 *   번호가 안 바뀌니 pdf-lib 는 그대로(subset:false) 쓰면 되고, 글꼴은 쓴 글자만큼만 커집니다.
 */
const tagOf = (dv, o) => String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3))

function checksum(u8, off, len) {
  let s = 0
  const n = len + ((4 - (len % 4)) % 4)
  for (let i = 0; i < n; i += 4) {
    const b0 = off + i < off + len ? u8[off + i] : 0
    const b1 = off + i + 1 < off + len ? u8[off + i + 1] : 0
    const b2 = off + i + 2 < off + len ? u8[off + i + 2] : 0
    const b3 = off + i + 3 < off + len ? u8[off + i + 3] : 0
    s = (s + ((b0 << 24) >>> 0) + (b1 << 16) + (b2 << 8) + b3) >>> 0
  }
  return s >>> 0
}

/**
 * @param {Uint8Array} bytes TrueType 글꼴
 * @param {Iterable<number>} keep 남길 글자 번호(GID)
 * @returns {Uint8Array}
 */
export function slimFont(bytes, keep) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)
  const nt = dv.getUint16(4)
  const tabs = new Map()
  for (let i = 0; i < nt; i++) {
    const r = 12 + i * 16
    tabs.set(tagOf(dv, r), { off: dv.getUint32(r + 8), len: dv.getUint32(r + 12) })
  }
  const head = tabs.get('head'), maxp = tabs.get('maxp'), loca = tabs.get('loca'), glyf = tabs.get('glyf')
  if (!head || !maxp || !loca || !glyf) return u8                 // CFF 글꼴 등 — 그대로
  const longLoca = dv.getInt16(head.off + 50) === 1
  const ng = dv.getUint16(maxp.off + 4)
  const at = (g) => (longLoca ? dv.getUint32(loca.off + g * 4) : dv.getUint16(loca.off + g * 2) * 2)
  /* 남길 것 + 부품 */
  const want = new Set([0])
  for (const g of keep) if (g >= 0 && g < ng) want.add(g)
  const q = [...want]
  while (q.length) {
    const g = q.pop()
    const s = at(g), e = at(g + 1)
    if (e - s < 10) continue
    const base = glyf.off + s
    if (dv.getInt16(base) >= 0) continue
    let p = base + 10
    for (let guard = 0; guard < 64; guard++) {
      const fl = dv.getUint16(p), gi = dv.getUint16(p + 2)
      if (!want.has(gi)) { want.add(gi); q.push(gi) }
      p += 4 + (fl & 1 ? 4 : 2)
      if (fl & 8) p += 2
      else if (fl & 0x40) p += 4
      else if (fl & 0x80) p += 8
      if (!(fl & 0x20)) break
    }
  }
  /* 새 glyf · loca(긴 형식) */
  let size = 0
  for (const g of want) { const l = at(g + 1) - at(g); size += l + ((4 - (l % 4)) % 4) }
  const nglyf = new Uint8Array(size)
  const nloca = new Uint8Array((ng + 1) * 4)
  const lv = new DataView(nloca.buffer)
  let o = 0
  for (let g = 0; g < ng; g++) {
    lv.setUint32(g * 4, o)
    if (!want.has(g)) continue
    const s = at(g), e = at(g + 1)
    if (e > s) { nglyf.set(u8.subarray(glyf.off + s, glyf.off + e), o); o += e - s; o += (4 - ((e - s) % 4)) % 4 }
  }
  lv.setUint32(ng * 4, o)
  const nhead = u8.slice(head.off, head.off + head.len)
  const hv = new DataView(nhead.buffer)
  hv.setUint32(8, 0)                                            // checkSumAdjustment — 아래에서 다시
  hv.setInt16(50, 1)
  /* 다시 묶기 */
  const out = []
  for (const [tag, t] of tabs) {
    if (tag === 'DSIG') continue
    let data
    if (tag === 'glyf') data = nglyf.subarray(0, o)
    else if (tag === 'loca') data = nloca
    else if (tag === 'head') data = nhead
    else data = u8.subarray(t.off, t.off + t.len)
    out.push({ tag, data })
  }
  out.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0))
  const n = out.length
  let total = 12 + n * 16
  for (const t of out) total += t.data.length + ((4 - (t.data.length % 4)) % 4)
  const res = new Uint8Array(total)
  const rv = new DataView(res.buffer)
  rv.setUint32(0, dv.getUint32(0))
  rv.setUint16(4, n)
  let es = 0
  while (1 << (es + 1) <= n) es++
  rv.setUint16(6, (1 << es) * 16); rv.setUint16(8, es); rv.setUint16(10, n * 16 - (1 << es) * 16)
  let off = 12 + n * 16
  let headAt = 0
  out.forEach((t, i) => {
    const r = 12 + i * 16
    for (let k = 0; k < 4; k++) rv.setUint8(r + k, t.tag.charCodeAt(k))
    res.set(t.data, off)
    rv.setUint32(r + 4, checksum(res, off, t.data.length))
    rv.setUint32(r + 8, off)
    rv.setUint32(r + 12, t.data.length)
    if (t.tag === 'head') headAt = off
    off += t.data.length + ((4 - (t.data.length % 4)) % 4)
  })
  if (headAt) rv.setUint32(headAt + 8, (0xb1b0afba - checksum(res, 0, res.length)) >>> 0)
  return res
}
