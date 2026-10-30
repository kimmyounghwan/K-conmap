/**
 * 💻 G468 PC 연결 — 내려받는 «K-적산컨맵 연결» 프로그램(이 PC 127.0.0.1:47321 ~ 47323)과 잇기
 *   소장님(10/23): 작업은 건설맵 사이트에서 · 내려받는 PC 프로그램은 연결용(캐드 연결 · PC 파일) · 배포는 사이트
 *   ① PC 폴더 — 프로그램에 정해 둔 도면 폴더의 DWG · DXF · 엑셀을 골라 «📐 도면 넣기» 와 같은 길(함께넣기)로 넣음
 *   ② 캐드에서 보내기 — 캐드 명령 KCM → 프로그램이 작업 화면을 «?pc=보냄» 으로 엶 → 보낸 도면을 받아 넣음
 * ■ 도면은 이 PC 안에서만 오감(브라우저 ↔ 127.0.0.1) — 서버로 올리지 않음
 * ■ 프로그램을 한 번도 안 쓴 브라우저는 이 PC 를 찾아보지 않음(브라우저의 «이 기기의 다른 앱 · 서비스 접근» 물음이 아무에게나 뜨지 않게)
 *   — 프로그램이 연 주소(?pc=…) 로 들어오거나 «💻 PC 연결» 을 누른 뒤부터 찾아봄(localStorage kcm.pc.v1)
 */
export const 문들 = [47321, 47322, 47323]
const 열쇠 = 'kcm.pc.v1'

export function pc쓴적() {
  try { return !!localStorage.getItem(열쇠) } catch (e) { return false }
}
export function pc기억(문) {
  try { localStorage.setItem(열쇠, JSON.stringify({ 문, 때: Date.now() })) } catch (e) { /* 막힘 */ }
}
export function pc잊기() {
  try { localStorage.removeItem(열쇠) } catch (e) { /* 막힘 */ }
}

async function 부름(문, 길, { 시간 = 8000, 바이트 = false, 머리 = true } = {}) {
  const c = typeof AbortController === 'function' ? new AbortController() : null
  const t = c ? setTimeout(() => c.abort(), 시간) : null
  try {
    const r = await fetch('http://127.0.0.1:' + 문 + 길, { headers: 머리 ? { 'X-KCM': '1' } : {}, cache: 'no-store', ...(c ? { signal: c.signal } : {}) })
    if (!r.ok) throw new Error('PC 연결 ' + r.status)
    if (!바이트) return await r.json()
    const 이름 = decodeURIComponent(r.headers.get('X-KCM-Name') || '')
    return { 이름, buf: await r.arrayBuffer() }
  } finally { if (t) clearTimeout(t) }
}

/** 켜진 프로그램 찾기 — {문, 이름, 판, 폴더수, 보낸} · 없으면 null */
export async function pc찾기({ 시간 = 1200 } = {}) {
  for (const 문 of 문들) {
    try {
      const j = await 부름(문, '/ping', { 시간, 머리: false })
      if (j && j.이름 === 'K-적산컨맵 연결') return { 문, ...j }
    } catch (e) { /* 다음 문 */ }
  }
  return null
}
export const pc폴더 = (연) => 부름(연.문, '/folders')
export const pc목록 = (연, n) => 부름(연.문, '/list?n=' + n, { 시간: 20000 })
export const pc파일 = (연, n, p) => 부름(연.문, '/file?n=' + n + '&p=' + encodeURIComponent(p), { 시간: 600000, 바이트: true })
export const pc보낸 = (연) => 부름(연.문, '/sent')
export const pc보낸파일 = (연, id) => 부름(연.문, '/sentfile?id=' + id, { 시간: 600000, 바이트: true })
export const pc받음 = (연, id) => 부름(연.문, '/taken?id=' + id)

export const 크기글 = (n) => (n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')
export const 때글 = (s) => { const d = new Date(s * 1000); return (d.getMonth() + 1) + '.' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') }
/** 내려받기 — 사이트에 올린 zip(빌드할 때 함께 올라감) */
export const pc받기주소 = '/pc/K-conmap-link-1.0.zip'
export const pc받기이름 = 'K-적산컨맵연결-1.0.zip'
