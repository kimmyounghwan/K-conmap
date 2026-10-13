/* 📐 골조 수량산출 — 도면 읽기 일꾼 (2026-09-26)
 * 큰 도면(수십 MB)을 읽는 동안 화면이 멈추지 않게 따로 돌립니다. 파일은 어디로도 보내지 않습니다.
 * DWG 는 화면 쪽에서 먼저 DXF 로 바꿔서(dwgdxf.worker.js) 이리 넘깁니다. */
import { decodeBytes, sniff } from './dxf3d.js'
import { 도면읽기끝까지 } from './끝까지읽기.js'

self.onmessage = (ev) => {
  const d = ev.data || {}
  if (d.type !== 'read') return
  try {
    const k = sniff(d.buf)
    if (k !== 'dxf') { self.postMessage({ type: 'err', kind: k }); return }
    const text = decodeBytes(d.buf)
    if (!/SECTION/.test(text.slice(0, 4000))) { self.postMessage({ type: 'err', kind: 'notdxf' }); return }
    /* 🧭 G246 점이 아주 많은 통합본은 구조 판만 모양을 다시 읽음(첫 읽기에 점이 안 찼으면 그대로) */
    const M = 도면읽기끝까지(text, (p) => self.postMessage({ type: 'prog', p }))
    if (!M.E.t.length) { self.postMessage({ type: 'err', kind: 'empty' }); return }
    const tr = [M.E.t.buffer, M.E.ly.buffer, M.E.rgb.buffer, M.E.len.buffer, M.E.area.buffer, M.E.val.buffer, M.E.ins.buffer,
      M.Q.e.buffer, M.Q.p0.buffer, M.Q.pn.buffer, M.P.buffer, M.T.x.buffer, M.T.y.buffer, M.T.h.buffer, M.T.a.buffer, M.T.e.buffer]
    self.postMessage({ type: 'done', model: M }, tr)
  } catch (e) {
    /* 🧭 G243 기억이 모자라 멈춘 것은 «mem» 으로(화면이 «PC 에서 · 다른 창 닫고» 를 알림) */
    const msg = String((e && e.message) || e)
    self.postMessage({ type: 'err', kind: /memory|allocation|Invalid (string|array|typed array) length/i.test(msg) ? 'mem' : 'fail', msg })
  }
}
