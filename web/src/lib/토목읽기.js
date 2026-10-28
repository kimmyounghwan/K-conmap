/**
 * 🛣🏢 G397 K-적산컨맵 «함께 넣기» — 도면을 한 번 넣으면 골조(건축 탭)와 토목(토목 탭)을 같이 읽음 (2026-10-24)
 *
 * 소장님: 「토목하고 건축도 함께 세우는 거지? 골조 물량은 나오는 거고..」 · 「빔 할때 만든거 참고 하고 있지?」
 *   → BIM 물량 화면(pages/Bim.jsx 읽기)과 같은 길: DWG → DXF 를 «한 번» 바꾸고, 골조 읽기(lib/도면넣기.js)와 도면 3D 일꾼(토목 · 땅 · 건물)을 «같이» 돌림.
 * ■ 화면 줄기(브라우저)에서만 씀 — 일꾼 · DWG 바꾸기. 셈은 lib/토목작업.js.
 * ■ 토목 결과 저장소(토목상태) — 작업 화면(Model.jsx)과 토목 탭(토목판.jsx)이 같이 봄 · 이 브라우저 IndexedDB «kcm.civil.v1»(예시는 저장 안 함)
 */
import { 토목열쇠, 토목자료, 재료표철근 } from './토목작업.js'
import { 넣기 as 기억넣기, 꺼내기 as 기억꺼내기, 지우기 as 기억지우기 } from './기억자료.js'
import { 멈춤감시, 멈춤글 } from './파일한도.js'

/* ── 토목 결과 저장소 ── */
let 지금T = null, 읽음 = false
const 듣는이 = new Set()
const 알림 = () => { for (const f of 듣는이) { try { f(지금T) } catch (e) { /* 듣는 화면 오류는 무시 */ } } }
export const 토목상태 = {
  얻기: () => 지금T,
  /** 처음 한 번 — 이 브라우저에 저장한 것 꺼냄 */
  async 열기() {
    if (읽음) return 지금T
    읽음 = true
    try { const t = await 기억꺼내기(토목열쇠); if (t && t.활용 && !지금T) { 지금T = t; 알림() } } catch (e) { /* 저장소 막힘 */ }
    return 지금T
  },
  /** 바꿈 — 예시가 아니면 저장 */
  async 넣기(t, 저장 = true) {
    지금T = t; 읽음 = true; 알림()
    if (저장 && t && !t.예시) { try { await 기억넣기(토목열쇠, t) } catch (e) { /* 저장 못 해도 화면은 그대로 */ } }
  },
  async 지우기() { 지금T = null; 읽음 = true; 알림(); try { await 기억지우기(토목열쇠) } catch (e) { /* 없음 */ } },
  듣기(f) { 듣는이.add(f); return () => 듣는이.delete(f) },
}

/* ── 도면 3D 일꾼(토목 · 땅 · 건물) ── */
let 일꾼 = null
export function 토목일꾼멈춤() { if (일꾼) { 일꾼.terminate(); 일꾼 = null } }
/** DXF 목록 → 일꾼 결과 r (BIM 물량 화면 토목읽기와 같음) */
export function 토목일꾼(목록, 성과, 알려 = () => {}) {
  return new Promise((되면, 탈) => {
    토목일꾼멈춤()
    let w
    try { w = new Worker(new URL('./dxf3d.worker.js', import.meta.url), { type: 'module' }) } catch (e) { 탈(new Error('토목 읽기를 시작하지 못했습니다')); return }
    일꾼 = w
    const 감시 = 멈춤감시(() => { if (일꾼 === w) { w.terminate(); 일꾼 = null; 탈(new Error(멈춤글)) } })
    w.onmessage = (ev) => {
      const m = ev.data || {}
      if (일꾼 !== w) { 감시.끝(); return }
      감시.깨움()
      if (m.type === 'prog') 알려((m.msg || '읽는 중') + ' · ' + Math.round((m.p || 0) * 100) + '%')
      else if (m.type === 'err') { 감시.끝(); w.terminate(); 일꾼 = null; 탈(new Error(m.kind === 'mem' ? '이 기기의 기억이 모자랍니다 — 다른 창 · 탭을 닫고 다시 넣거나 PC 에서' : (m.msg || m.kind || '읽지 못함'))) }
      else if (m.type === 'done') { 감시.끝(); w.terminate(); 일꾼 = null; 되면(m.r || {}) }
    }
    w.onerror = (e) => { 감시.끝(); if (일꾼 === w) { w.terminate(); 일꾼 = null; 탈(new Error(e.message || '읽지 못함')) } }
    w.postMessage({ files: 목록.map((x) => ({ name: x.이름, blob: new Blob([x.buf]) })), 성과 })
  })
}

/** 측량점 파일(엑셀 · CSV · TXT) → 좌표 성과표(점 · X · Y · Z — 기준) · 측점 성과(위치 · 설계 · 시공 지반고 — 맞대기) */
export async function 측량파일읽기(표들) {
  let 성과 = null
  const 측점성과 = []
  if (!표들.length) return { 성과, 측점성과 }
  const { 성과표읽기 } = await import('./성과표.js')
  const { 측점성과읽기 } = await import('./토목작업.js')
  for (const f of 표들) {
    try { const r = await 성과표읽기(f.이름, f.buf.slice(0)); if (r && (!성과 || r.점.length > 성과.점.length)) 성과 = { 파일: f.이름, 점: r.점, 북동확실: r.북동확실, 빠진줄: r.빠진줄 } } catch (e) { /* 좌표 꼴 아님 */ }
    try { for (const g of await 측점성과읽기(f.이름, f.buf.slice(0))) 측점성과.push({ ...g, 파일: f.이름 }) } catch (e) { /* 측점 꼴 아님 */ }
  }
  return { 성과, 측점성과 }
}

/** DWG → DXF(한 번) — [{이름, buf}] → { 바꾼: [{이름(.dxf), buf, 원본}], 못: [이름] } */
export async function DWG들바꾸기(목록, 알려 = () => {}) {
  const 바꾼 = [], 못 = []
  const 전 = 목록.length
  for (const [k, f] of 목록.entries()) {
    const 머리 = String.fromCharCode(...new Uint8Array(f.buf.slice(0, 6)))
    if (/^AC10\d\d/.test(머리)) {
      /* 🔰 G441 몇 장째인지(k / 전) — 여러 장이면 멈춘 줄 아는 일이 없게 */
      const 앞 = '도면 여는 중' + (전 > 1 ? ` ${k + 1} / ${전}` : '') + ' — ' + f.이름
      알려(앞 + ' (큰 도면은 30초~1분)')
      try { const { DWG바꾸기 } = await import('./dwg바꾸기.js'); const r0 = await DWG바꾸기(f.buf, f.이름, (d) => 알려(앞 + (d.msg ? ' · ' + d.msg : ''))); 바꾼.push({ 이름: f.이름.replace(/\.dwg$/i, '.dxf'), buf: r0.dxf, 원본: (r0.info && r0.info.원본) || null }) }
      catch (e) { 못.push(f.이름) }
    } else 바꾼.push(f)
  }
  return { 바꾼, 못 }
}

/** 토목 결과에 세울 것이 있나 — 노선 · 횡단 · 구조물 · 땅 · 흙막이 · 건물(평면) */
export const 토목있음 = (r) => { const a = r && r.활용; return !!(a && ((a.노선 || []).length || (a.횡단 || []).some((t) => (t.단면 || []).length) || (a.구조 || []).length || a.땅 || (a.흙막이 || []).length || (a.건물 || []).length)) }

/**
 * 🛣🏢 함께 읽기 — 파일들(DXF · DWG · 측량점 엑셀 · CSV) → 골조(도면읽어모델 결과) + 토목(토목 탭 자료) 를 같이
 * @param 옵 { 알려(글), 예시, 이름, 골조(false 면 골조는 안 읽음) }
 * @returns { 골조: r | null, 골조틀림, 토목: T | null, 토목틀림, 토목r, 못, 묶음, 파일 }
 */
export async function 함께읽기(목록, 옵 = {}) {
  const 알려 = 옵.알려 || (() => {})
  const 도 = 목록.filter((f) => /\.(dxf|dwg)$/i.test(f.이름)), 표 = 목록.filter((f) => /\.(xlsx?|csv|txt)$/i.test(f.이름))
  if (!도.length) throw new Error('DXF · DWG 도면을 넣어 주십시오(측량점 엑셀 · CSV 는 도면과 같이).')
  const { 성과, 측점성과 } = await 측량파일읽기(표)
  const { 바꾼, 못 } = await DWG들바꾸기(도, 알려)
  if (!바꾼.length) throw new Error('읽을 도면이 없습니다 — DWG 를 바꾸지 못함: ' + 못.join(', '))
  const 묶음 = Date.now()
  let 골조알림 = '', 토목알림 = ''
  let 철근표 = []                           // 📐 G399 배근도 «철근 재료표» — 골조 읽기가 읽은 도면에서(골조가 없어도)
  const 둘 = () => 알려([골조알림 && '🏢 ' + 골조알림, 토목알림 && '🛣 ' + 토목알림].filter(Boolean).join('  ·  '))
  /* 같이 돌림 — 토목 일꾼에는 사본(먼저 떠 둠) · 골조 읽기에는 원본(BIM 물량 화면과 같음) */
  const 토목목록 = 바꾼.map((x) => ({ 이름: x.이름, buf: x.buf.slice(0) }))
  const 토목일 = (async () => {
    try { return { r: await 토목일꾼(토목목록, 성과, (g) => { 토목알림 = g; 둘() }) } }
    catch (e) { return { 틀림: (e && e.message) || String(e) } }
  })()
  const 골조일 = 옵.골조 === false ? Promise.resolve({ 없음: true }) : (async () => {
    try {
      const 넣 = await import('./도면넣기.js')
      const r = await 넣.도면읽어모델(바꾼.map((x) => ({ 이름: x.이름, buf: x.buf })), (g) => { 골조알림 = g; 둘() }, { 들받기: async (들) => { 철근표 = await 재료표철근(들) } })
      골조알림 = `골조 다 읽음(부재 ${(r.부재수 || 0).toLocaleString('ko-KR')})`; 둘()       // 토목이 더 걸릴 때 «세우는 중» 이 남지 않게
      return { r }
    } catch (e) { 골조알림 = ''; 둘(); return { 틀림: (e && e.message) || String(e) } }   // 🔰 G441 읽는 동안 «골조 없음» 을 앞에 띄우지 않음(토목만 넣은 분이 헷갈림) — 끝난 뒤 알림에서 말함
  })()
  const [g, t] = await Promise.all([골조일, 토목일])
  let T = null, 토목틀림 = t.틀림 || ''
  if (t.r) {
    if (토목있음(t.r)) {
      const 이름 = 옵.이름 || (바꾼[0].이름.replace(/\.dxf$/i, '') + (바꾼.length > 1 ? ` 외 ${바꾼.length - 1}장` : ''))
      T = 토목자료(t.r, { 이름, 예시: !!옵.예시, 성과, 측점성과, 좌표글: t.r.좌표글 || [] })
      T.묶음 = 묶음
      T.철근표 = 철근표
    } else {
      const { 못찾음글 } = await import('./토목작업.js')
      토목틀림 = '토목(노선 · 횡단 · 구조물 · 측량 땅)을 찾지 못했습니다 — ' + 못찾음글(t.r, { 골조됨: !!(g.r && g.r.부재수 > 0) })
    }
  }
  return { 골조: g.r || null, 골조틀림: g.틀림 || '', 골조없음: !!g.없음, 토목: T, 토목틀림, 토목r: t.r || null, 못, 묶음, 파일: 바꾼.map((x) => x.이름) }
}
