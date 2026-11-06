/* 🏔 토적컨맵 — 횡단면도 읽는 일꾼(G572) · 큰 도면(수십 MB)도 화면이 멈추지 않게 따로 읽음 · 셈은 lib/토적횡단.js */
import { 횡단노선읽기 } from './토적횡단.js'

self.onmessage = (ev) => {
  const d = ev.data || {}
  try {
    let 앞 = -1
    const r = 횡단노선읽기(d.buf, d.name || '도면', (p) => { const n = Math.round(p * 100); if (n !== 앞) { 앞 = n; self.postMessage({ type: 'prog', p }) } })
    self.postMessage({ type: 'done', 노선: r.노선, 까닭: r.까닭 || '' })
  } catch (e) {
    self.postMessage({ type: 'err', msg: String((e && e.message) || e) })
  }
}
