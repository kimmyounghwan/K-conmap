/* 📦 도면 3D — 읽기 일꾼 (2026-09-25 · 2026-09-26 여러 장 · 건물 세우기)
   100MB 도면을 화면 줄기에서 읽으면 몇 초 동안 화면이 굳습니다. 그래서 따로 읽습니다.
   파일은 이 브라우저 안에서만 읽습니다 — 어디로도 보내지 않습니다.

   ■ 여러 장을 한꺼번에 받습니다 (평면도 + 입면도·단면도·골구도).
     - 평면도 묶음(「지상 2층 평면도」 같은 제목이 둘 이상)이 있고, 다른 도면 글자에서 층 높이를 찾으면
       → 층마다 나눠 제 높이에 쌓고 벽·기둥을 세웁니다 (lib/building3d.js)
     - 아니면 → 전처럼 도면에 적힌 높이 그대로 (여러 장이면 겹쳐 그림) */
import { parseDxf, decodeBytes, sniff, finish, F64, U8 } from './dxf3d.js'
import { 층높이찾기, 지붕채우기, 평면제목, 쌓기 } from './building3d.js'

const 새버킷 = () => ({ pos: new F64(), col: new U8(), pts: new F64(64), pcol: new U8(64) })

self.onmessage = (ev) => {
  const files = (ev.data && ev.data.files) || (ev.data && ev.data.buf ? [{ name: '도면.dxf', buf: ev.data.buf }] : [])
  try {
    const 읽은 = []
    const 못읽은 = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      const 앞 = i / files.length, 폭 = 0.8 / files.length
      const kind = sniff(f.buf)
      if (kind !== 'dxf') { 못읽은.push({ 이름: f.name, 까닭: kind }); continue }
      self.postMessage({ type: 'prog', p: 0.02 + 앞 * 0.8, msg: `${f.name} 읽는 중` })
      const text = decodeBytes(f.buf)
      f.buf = null
      if (!/(^|\n)\s*0\s*\r?\n\s*SECTION/.test(text.slice(0, 20000))) { 못읽은.push({ 이름: f.name, 까닭: 'notdxf' }); continue }
      const raw = parseDxf(text, (p) => self.postMessage({ type: 'prog', p: 0.02 + (앞 + p * 폭 / 0.8) * 0.8, msg: `${f.name} 선 세우는 중` }), { raw: true })
      if (!raw.stats.ents && !raw.texts.length) { 못읽은.push({ 이름: f.name, 까닭: 'empty' }); continue }
      읽은.push({ 이름: f.name, raw })
    }
    if (!읽은.length) {
      const k = 못읽은[0] ? 못읽은[0].까닭 : 'fail'
      self.postMessage({ type: 'err', kind: k === 'empty' ? 'fail' : k, msg: 못읽은.map((x) => x.이름).join(', ') })
      return
    }
    self.postMessage({ type: 'prog', p: 0.86, msg: '도면 글자에서 층 높이 찾는 중' })

    /* 🏢 건물 세우기 시도 */
    const 파일들 = 읽은.map((x) => ({ 이름: x.이름, texts: x.raw.texts }))
    const { 높이, 근거 } = 층높이찾기(파일들)
    const 평 = 읽은.map((x) => ({ x, 제목: 평면제목(x.raw.texts) })).filter((q) => q.제목.length >= 2)
    let 건물 = null
    let out = null, layerInfo = new Map(), stats = null
    if (평.length) {
      const 주 = 평.sort((a, b) => b.제목.length - a.제목.length)[0]
      const 지붕 = 지붕채우기(높이, 파일들, 주.제목.map((t) => t.층))
      const s = 쌓기(주.x.raw, 주.제목, 높이, 새버킷)
      if (s) {
        out = s.out
        layerInfo = 주.x.raw.layerInfo
        stats = 주.x.raw.stats
        건물 = {
          평면: 주.x.이름,
          층들: s.층들,
          근거: [...근거, ...지붕].filter((g) => s.층들.some((f) => f.층 === g.층)),
          세운벽: s.세운벽,
          빠진: s.빠진,
          참고: 읽은.filter((x) => x !== 주.x).map((x) => x.이름),
        }
      }
    }
    if (!out) {
      /* 전처럼 — 여러 장이면 레이어 이름끼리 합칩니다 */
      out = new Map()
      for (const x of 읽은) {
        for (const [k, b] of x.raw.out) {
          const has = out.get(k)
          if (!has) { out.set(k, b); continue }
          for (const [src, dst] of [[b.pos, has.pos], [b.pts, has.pts]]) for (let i = 0; i < src.n; i += 3) dst.push3(src.a[i], src.a[i + 1], src.a[i + 2])
          for (const [src, dst] of [[b.col, has.col], [b.pcol, has.pcol]]) for (let i = 0; i < src.n; i += 3) dst.push3(src.a[i], src.a[i + 1], src.a[i + 2])
        }
        for (const [k, v] of x.raw.layerInfo) if (!layerInfo.has(k)) layerInfo.set(k, v)
        if (!stats) stats = x.raw.stats
        else {
          stats.segs += x.raw.stats.segs; stats.pts += x.raw.stats.pts; stats.ents += x.raw.stats.ents
          stats.capped = stats.capped || x.raw.stats.capped; stats.depthCut += x.raw.stats.depthCut
          for (const [k, n] of Object.entries(x.raw.stats.skipped)) stats.skipped[k] = (stats.skipped[k] || 0) + n
          for (const [k, n] of Object.entries(x.raw.stats.unknown)) stats.unknown[k] = (stats.unknown[k] || 0) + n
        }
      }
      if (평.length || Object.keys(높이).length) {
        건물 = { 실패: true, 평면수: 평.length ? 평[0].제목.length : 0, 높이수: Object.keys(높이).length, 근거 }
      }
    }
    self.postMessage({ type: 'prog', p: 0.93, msg: '화면에 올리는 중' })
    const r = finish(out, layerInfo, stats)
    r.건물 = 건물
    r.파일 = 읽은.map((x) => x.이름)
    r.못읽은 = 못읽은
    const tr = []
    for (const l of r.layers) {
      tr.push(l.pos.buffer, l.col.buffer, l.pts.buffer, l.pcol.buffer)
      if (l.tri) tr.push(l.tri.buffer, l.trn.buffer, l.trc.buffer)
    }
    self.postMessage({ type: 'done', r }, tr)
  } catch (e) {
    self.postMessage({ type: 'err', kind: 'fail', msg: String((e && e.message) || e) })
  }
}
