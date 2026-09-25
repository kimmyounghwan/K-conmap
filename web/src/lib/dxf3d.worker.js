/* 📦 도면 3D — 읽기 일꾼 (2026-09-25)
   100MB 도면을 화면 줄기에서 읽으면 몇 초 동안 화면이 굳습니다. 그래서 따로 읽습니다.
   파일은 이 브라우저 안에서만 읽습니다 — 어디로도 보내지 않습니다. */
import { parseDxf, decodeBytes, sniff } from './dxf3d.js'

self.onmessage = (ev) => {
  const { buf } = ev.data || {}
  try {
    const kind = sniff(buf)
    if (kind !== 'dxf') { self.postMessage({ type: 'err', kind }); return }
    self.postMessage({ type: 'prog', p: 0.02, msg: '글자 읽는 중' })
    const text = decodeBytes(buf)
    if (!/(^|\n)\s*0\s*\r?\n\s*SECTION/.test(text.slice(0, 20000))) { self.postMessage({ type: 'err', kind: 'notdxf' }); return }
    const r = parseDxf(text, (p) => self.postMessage({ type: 'prog', p: 0.05 + p * 0.9, msg: '선 세우는 중' }))
    const tr = []
    for (const l of r.layers) tr.push(l.pos.buffer, l.col.buffer, l.pts.buffer, l.pcol.buffer)
    self.postMessage({ type: 'done', r }, tr)
  } catch (e) {
    self.postMessage({ type: 'err', kind: 'fail', msg: String(e && e.message || e) })
  }
}
