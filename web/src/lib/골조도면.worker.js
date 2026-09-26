/* 📐 골조 수량산출 — 도면 읽기 일꾼 (2026-09-26)
 * 큰 도면(수십 MB)을 읽는 동안 화면이 멈추지 않게 따로 돌립니다. 파일은 어디로도 보내지 않습니다.
 * DWG 는 화면 쪽에서 먼저 DXF 로 바꿔서(dwgdxf.worker.js) 이리 넘깁니다. */
import { decodeBytes, sniff } from './dxf3d.js'
import { 도면읽기 } from './골조도면.js'

self.onmessage = (ev) => {
  const d = ev.data || {}
  if (d.type !== 'read') return
  try {
    const k = sniff(d.buf)
    if (k !== 'dxf') { self.postMessage({ type: 'err', kind: k }); return }
    const text = decodeBytes(d.buf)
    if (!/SECTION/.test(text.slice(0, 4000))) { self.postMessage({ type: 'err', kind: 'notdxf' }); return }
    const M = 도면읽기(text, (p) => self.postMessage({ type: 'prog', p }))
    if (!M.E.t.length) { self.postMessage({ type: 'err', kind: 'empty' }); return }
    const tr = [M.E.t.buffer, M.E.ly.buffer, M.E.rgb.buffer, M.E.len.buffer, M.E.area.buffer, M.E.val.buffer, M.E.ins.buffer,
      M.Q.e.buffer, M.Q.p0.buffer, M.Q.pn.buffer, M.P.buffer, M.T.x.buffer, M.T.y.buffer, M.T.h.buffer, M.T.a.buffer, M.T.e.buffer]
    self.postMessage({ type: 'done', model: M }, tr)
  } catch (e) {
    self.postMessage({ type: 'err', kind: 'fail', msg: String((e && e.message) || e) })
  }
}
