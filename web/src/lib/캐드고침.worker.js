/* 🛠 캐드 고치기 — 일꾼 (2026-10-17)
   큰 도면(30 MB DXF)은 읽고 다시 쓰는 데 몇 초 걸립니다 → 화면이 굳지 않게 여기서 합니다.
   파일은 이 브라우저 안에서만 읽습니다 — 어디로도 보내지 않습니다.
   · 읽기: DXF 바이트 → 진단(판 · 글꼴 · 문제) — 바이트는 여기 두고(모두 합쳐 600 MB 까지) 풀어 놓은 것은 최근 2장만(크다) — 없으면 다시 품
   · 고치기: 설정대로 → 새 DXF 바이트 + 알림 + 미리보기(선 · 글 — lib/dxfplot.js parsePlot) */
import { 읽기, 고치기 } from './캐드고침하기.js'
import { 짝글 } from './캐드고침.js'
import { parsePlot } from './dxfplot.js'

const 둔 = new Map()          // id → { bytes, R | null }
const 한도 = 600 * 1024 * 1024
function 정리() {
  const ids = [...둔.keys()]
  ids.slice(0, -2).forEach((k) => { 둔.get(k).R = null })          // 풀어 놓은 것(짝 배열)은 최근 2장만
  let 합 = 0
  for (const k of ids) 합 += 둔.get(k).bytes.byteLength
  for (const k of ids) { if (합 <= 한도 || 둔.size <= 1) break; 합 -= 둔.get(k).bytes.byteLength; 둔.delete(k) }
}
const post = (m, tr) => self.postMessage(m, tr || [])

function 미리(글) {
  try {
    return parsePlot(글, () => {})
  } catch (e) { return null }
}

self.onmessage = async (ev) => {
  const d = ev.data || {}
  try {
    if (d.type === '읽기') {
      const bytes = new Uint8Array(d.buf)
      const R = 읽기(bytes)
      둔.delete(d.id)
      둔.set(d.id, { bytes, R })
      정리()
      const 진 = R.진
      post({ type: '진단', id: d.id, 진 })
    } else if (d.type === '고치기') {
      const x = 둔.get(d.id)
      if (!x) { post({ type: 'err', id: d.id, kind: 'gone' }); return }
      if (!x.R) x.R = 읽기(x.bytes)
      둔.delete(d.id); 둔.set(d.id, x); 정리()                       // 방금 쓴 것을 맨 뒤로
      const r = 고치기(x.bytes, x.R, d.설정 || {})
      const 글 = r.글 || (r.짝 ? 짝글(r.짝) : '')
      const 그림 = d.미리 ? 미리(글) : null
      const b = r.바이트
      const ab = b.byteOffset === 0 && b.byteLength === b.buffer.byteLength ? b.buffer : b.slice().buffer
      post({ type: '결과', id: d.id, buf: ab, 판: r.판, 판이름: r.판이름, 인코딩: r.인코딩, 알림: r.알림, 셈: r.셈, 그림 }, [ab])
    } else if (d.type === '버림') {
      둔.delete(d.id)
    }
  } catch (e) {
    post({ type: 'err', id: d.id, kind: (e && e.kind) || 'fail', msg: String((e && e.message) || e) })
  }
}
