/* ══════════════════════════════════════════════════════════════
   명함그림.js — 🪪 마이컨맵 «명함 이미지» 를 브라우저 캔버스로 그림 (G188 · 2026-10-07)

   소장님: 「마이컨맵에 이미지 명함만들기 자동으로 생성 가능하지? 사용자」 → 「명함은 멋스럽게 해줘.」
   ■ 서버를 쓰지 않습니다 — 이 기기에서 그려 PNG 로 받음(비용 0).
   ■ 크기: 명함 90×50mm(9:5). 인쇄용 1063×591(300dpi — PNG 안에 300dpi 를 적어 둠) · 폰 · 카톡용은 1.6배.
   ■ 꼴 셋: 깔끔(흰 바탕 · 테마 색 띠) · 물결(테마 색 그라데이션) · 먹금(먹색 바탕 · 금색 선)
     바탕에 옅은 «등고선» — 건설 · 지도 느낌(이름으로 모양이 정해져 같은 사람은 늘 같은 무늬).
   ■ QR = 내 마이컨맵 공개 주소 — qrcode-generator(MIT)를 이 판을 열 때만 받습니다(첫 화면 무게 0).
   ⚠️ 전화번호는 주인이 «연락하기» 칸에 넣은 그대로(주인만 받는 그림) — 공유 미리보기 그림(굽기)에는 넣지 않습니다.
   ══════════════════════════════════════════════════════════════ */
import { 테마of, 종류들, 공개주소 } from './마이컨맵.js'

export const 꼴들 = [
  { k: 'clean', 이름: '깔끔', 설명: '흰 바탕' },
  { k: 'wave', 이름: '물결', 설명: '테마 색' },
  { k: 'ink', 이름: '먹금', 설명: '먹색 · 금색' },
]
export const 인쇄크기 = [1063, 591]
export const 폰크기 = [1701, 946]

/** QR 칸(참거짓 2차원) — 실패하면 null */
export async function qr칸(글) {
  try {
    const m = await import('qrcode-generator')
    const qrcode = m.default || m
    const q = qrcode(0, 'M')
    q.addData(글, 'Byte')
    q.make()
    const n = q.getModuleCount()
    return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => q.isDark(r, c)))
  } catch (e) { return null }
}

const 글꼴 = () => {
  try { return getComputedStyle(document.body).fontFamily || 'sans-serif' } catch (e) { return 'sans-serif' }
}
function 둥근(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}
/** 한 줄에 안 들어가면 줄을 나눔 — 띄어쓰기(어절)에서 나누고, 한 어절이 줄보다 길 때만 글자에서 · 최대 n줄 · 넘치면 … */
function 줄나눔(ctx, 글, 폭, n) {
  const 줄 = []; let 지금 = ''
  const 넣기 = (낱) => {
    const 시험 = 지금 ? 지금 + ' ' + 낱 : 낱
    if (ctx.measureText(시험).width <= 폭) { 지금 = 시험; return }
    if (지금) { 줄.push(지금); 지금 = '' }
    if (ctx.measureText(낱).width <= 폭) { 지금 = 낱; return }
    for (const ch of 낱) {                                   /* 너무 긴 한 어절 — 글자에서 */
      if (ctx.measureText(지금 + ch).width > 폭 && 지금) { 줄.push(지금); 지금 = ch } else 지금 += ch
    }
  }
  String(글 || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).forEach(넣기)
  if (지금) 줄.push(지금)
  if (줄.length > n) {
    줄.length = n
    let 끝 = 줄[n - 1]
    while (끝 && ctx.measureText(끝 + '…').width > 폭) 끝 = 끝.slice(0, -1)
    줄[n - 1] = 끝 + '…'
  }
  return 줄
}
function qr그림(ctx, 칸, x, y, 크기, 색) {
  if (!칸) return
  const n = 칸.length, 한 = 크기 / n
  ctx.fillStyle = 색
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (칸[r][c]) ctx.fillRect(Math.floor(x + c * 한), Math.floor(y + r * 한), Math.ceil(한), Math.ceil(한))
}
/** 글자 사이 — 되는 브라우저만(안 되면 그냥 붙여 씀) */
function 자간(ctx, px) { try { if ('letterSpacing' in ctx) ctx.letterSpacing = `${px}px` } catch (e) { /* 없음 */ } }
/** 이름 → 0~1 사이 고정 수(같은 이름이면 같은 무늬) */
function 씨앗(글) { let h = 2166136261; for (const ch of String(글 || '')) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) } return ((h >>> 0) % 10000) / 10000 }
/** 🗺 등고선 — 가운데(cx, cy)에서 바깥으로 n겹 */
function 등고선(ctx, cx, cy, n, r0, 간격, s, 색, 굵기) {
  ctx.save(); ctx.strokeStyle = 색; ctx.lineWidth = 굵기
  const a = s * Math.PI * 2, b = s * 7.3
  for (let i = 0; i < n; i++) {
    ctx.beginPath()
    const 흔들 = 간격 * (0.55 + i * 0.09)
    for (let k = 0; k <= 180; k++) {
      const t = (k / 180) * Math.PI * 2
      const r = r0 + i * 간격 + 흔들 * (Math.sin(3 * t + a) * 0.6 + Math.sin(5 * t + b) * 0.3 + Math.sin(2 * t + i * 0.35 + a) * 0.45)
      const x = cx + Math.cos(t) * r * 1.25, y = cy + Math.sin(t) * r
      if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y)
    }
    ctx.closePath(); ctx.stroke()
  }
  ctx.restore()
}
/** 색 섞기(#rrggbb) — t = 두 번째 색 몫 */
function 혼합(a, b, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [x, y] = [p(a), p(b)]
  return '#' + x.map((v, i) => Math.round(v * (1 - t) + y[i] * t).toString(16).padStart(2, '0')).join('')
}

/* ✏️ 명함에만 쓰는 설정 — 소장님 「명함 바탕색하고, 내용은 바꿀 수 있는 거지?」 → 「해」
   이 기기(localStorage)에만 · 서버에 안 감(비용 0) · 페이지는 안 바뀜. 비운 칸은 페이지 내용 그대로. */
export const 켬기본 = { 전화: true, 지역: true, 면허: true, qr: true }
const 설정열쇠 = (a) => `kcm.my.명함.${a}`
export function 설정읽기(a) {
  try { const v = JSON.parse(localStorage.getItem(설정열쇠(a))); if (v && typeof v === 'object') return { 꼴: 'clean', 색: '', 이름: '', 직함: '', 한줄: '', 전화: '', ...v, 켬: { ...켬기본, ...(v.켬 || {}) } } } catch (e) { /* 없음 */ }
  return { 꼴: 'clean', 색: '', 이름: '', 직함: '', 한줄: '', 전화: '', 켬: { ...켬기본 } }
}
export function 설정쓰기(a, v) { try { localStorage.setItem(설정열쇠(a), JSON.stringify(v)) } catch (e) { /* 개인 창 */ } }
export function 설정지우기(a) { try { localStorage.removeItem(설정열쇠(a)) } catch (e) { /* 없음 */ } }
export const 명함한도 = { 이름: 30, 직함: 30, 한줄: 60, 전화: 20 }

/** 그 사람의 명함에 들어갈 것 — 문서(정리된 것) + 명함에만 쓰는 설정(s) */
export function 명함내용(d, a, s = {}) {
  const 찾 = (t) => (d.블록 || []).find((b) => b.t === t) || {}
  const 연락 = 찾('연락'), 면허 = 찾('면허'), 지역 = 찾('지역')
  const 종 = 종류들[d.종류] || 종류들.업체
  const 켬 = { ...켬기본, ...(s.켬 || {}) }
  const 칩 = 켬.면허 ? [...(면허.면허 || []), ...(면허.자격 || [])].slice(0, 4) : []
  const 지역글 = 켬.지역 ? [(지역.시도 || []).slice(0, 3).join(' · '), 지역.글 || ''].filter(Boolean).join(' — ') : ''
  const 쓸 = (x, 기본, n) => (String(x || '').trim() ? String(x).trim().slice(0, n) : 기본)
  return {
    이름: 쓸(s.이름, d.이름 || '', 명함한도.이름), 직함: 쓸(s.직함, '', 명함한도.직함), 한줄: 쓸(s.한줄, d.한줄 || '', 명함한도.한줄),
    종류: 종.이름, 칩,
    전화: 켬.전화 ? 쓸(s.전화, 연락.전화 || '', 명함한도.전화) : '', 톡: 켬.전화 && 연락.톡 ? '카카오톡 오픈채팅 — 페이지에서 바로' : '', 지역글,
    주소: `k-conmap.com/@${a}`, qr주소: 공개주소(a), qr: 켬.qr, 테마: 테마of(s.색 || d.테마),
  }
}

/** 캔버스에 그림 — W×H(9:5) · 꼴 · 내용 · QR 칸 */
export function 명함그리기(cv, W, H, 꼴, 내, 칸) {
  if (내.qr === false) 칸 = null                         /* QR 끔 — 글 칸이 오른쪽까지 넓어짐 */
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d')
  const u = W / 1063                                   /* 인쇄 크기(1063×591) 기준 한 칸 */
  const F = 글꼴()
  const 색 = 내.테마.a
  const 레몬 = 내.테마.k === 'lemon'
  const 짙 = 꼴 === 'ink', 물 = 꼴 === 'wave'
  const s = 씨앗(내.이름 + 내.주소)
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'
  /* ── 바탕 ── */
  if (짙) {
    ctx.fillStyle = '#171a21'; ctx.fillRect(0, 0, W, H)
    const g = ctx.createRadialGradient(W * 0.88, H * 0.05, 10 * u, W * 0.88, H * 0.05, 620 * u)
    g.addColorStop(0, 'rgba(212,175,55,0.20)'); g.addColorStop(1, 'rgba(212,175,55,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    등고선(ctx, W * 0.86, H * 0.08, 9, 70 * u, 42 * u, s, 'rgba(212,175,55,0.10)', 1.6 * u)
    ctx.strokeStyle = 'rgba(212,175,55,0.8)'; ctx.lineWidth = 2 * u
    둥근(ctx, 24 * u, 24 * u, W - 48 * u, H - 48 * u, 16 * u); ctx.stroke()
    ctx.strokeStyle = 'rgba(212,175,55,0.3)'; ctx.lineWidth = 1 * u
    둥근(ctx, 32 * u, 32 * u, W - 64 * u, H - 64 * u, 12 * u); ctx.stroke()
  } else if (물) {
    const g = ctx.createLinearGradient(0, 0, W, H)
    g.addColorStop(0, 레몬 ? '#f2c230' : 혼합(색, '#000000', 0.12)); g.addColorStop(1, 레몬 ? '#ffe680' : 혼합(색, '#ffffff', 0.3))
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    등고선(ctx, W * 0.9, H * 0.02, 10, 60 * u, 40 * u, s, 레몬 ? 'rgba(43,33,0,0.10)' : 'rgba(255,255,255,0.16)', 1.8 * u)
    ctx.fillStyle = 레몬 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)'
    ctx.beginPath(); ctx.arc(-40 * u, H + 40 * u, 260 * u, 0, Math.PI * 2); ctx.fill()
  } else {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
    등고선(ctx, W * 0.9, H * 0.04, 9, 60 * u, 40 * u, s, 혼합(색, '#ffffff', 0.82), 1.6 * u)
    ctx.fillStyle = 색; ctx.fillRect(0, 0, 18 * u, H)
    ctx.fillStyle = 혼합(색, '#ffffff', 0.55); ctx.fillRect(18 * u, 0, 5 * u, H)
  }
  const 글색 = 짙 ? '#f5f1e6' : 물 ? (레몬 ? '#2b2100' : '#ffffff') : '#0f172a'
  const 옅은 = 짙 ? '#b9bfcb' : 물 ? (레몬 ? 'rgba(43,33,0,0.78)' : 'rgba(255,255,255,0.86)') : '#475569'
  const 점색 = 짙 ? '#d4af37' : 물 ? 글색 : (레몬 ? '#8a6a00' : 색)
  const 왼 = 76 * u
  /* ── QR(오른쪽 아래 · 흰 판) ── */
  const q크기 = 190 * u, q틀 = 16 * u
  const qx = W - 78 * u - q크기, qy = H - 84 * u - q크기
  if (칸) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 18 * u; ctx.shadowOffsetY = 4 * u
    ctx.fillStyle = '#ffffff'
    둥근(ctx, qx - q틀, qy - q틀, q크기 + q틀 * 2, q크기 + q틀 * 2, 18 * u); ctx.fill()
    ctx.restore()
    if (!짙 && !물) { ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.5 * u; 둥근(ctx, qx - q틀, qy - q틀, q크기 + q틀 * 2, q크기 + q틀 * 2, 18 * u); ctx.stroke() }
    qr그림(ctx, 칸, qx, qy, q크기, '#0f172a')
    ctx.fillStyle = 옅은; ctx.font = `700 ${16 * u}px ${F}`; ctx.textAlign = 'center'; 자간(ctx, 1 * u)
    ctx.fillText('QR 찍으면 마이컨맵으로', qx + q크기 / 2, qy - q틀 - 14 * u)      /* 위에 — 아래는 바닥 글 자리 */
    자간(ctx, 0); ctx.textAlign = 'left'
  }
  const 글폭 = (칸 ? qx - q틀 - 44 * u : W - 76 * u) - 왼
  /* ── 위: 종류 · 이름 · 한 줄 ── */
  ctx.fillStyle = 점색; ctx.font = `800 ${21 * u}px ${F}`; 자간(ctx, 5 * u)
  ctx.fillText(내.종류, 왼, 96 * u)
  자간(ctx, 0)
  ctx.fillRect(왼, 112 * u, 40 * u, 4 * u)
  ctx.fillStyle = 글색
  let 크 = 74 * u
  ctx.font = `800 ${크}px ${F}`
  while (ctx.measureText(내.이름).width > 글폭 && 크 > 38 * u) { 크 -= 2 * u; ctx.font = `800 ${크}px ${F}` }
  ctx.fillText(내.이름, 왼 - 2 * u, 196 * u)
  /* 직함 — 이름 오른쪽(남으면) · 안 남으면 위 «종류» 줄 끝에 */
  if (내.직함) {
    const 이름폭 = ctx.measureText(내.이름).width
    ctx.font = `600 ${28 * u}px ${F}`
    const 직폭 = ctx.measureText(내.직함).width
    if (이름폭 + 22 * u + 직폭 <= 글폭) {
      ctx.fillStyle = 옅은; ctx.fillText(내.직함, 왼 + 이름폭 + 20 * u, 196 * u)
    } else {
      ctx.font = `800 ${21 * u}px ${F}`; 자간(ctx, 5 * u)
      const 앞폭 = ctx.measureText(내.종류).width
      자간(ctx, 0); ctx.font = `700 ${21 * u}px ${F}`
      ctx.fillStyle = 점색
      ctx.fillText('·  ' + (줄나눔(ctx, 내.직함, 글폭 - 앞폭 - 40 * u, 1)[0] || ''), 왼 + 앞폭 + 14 * u, 96 * u)
    }
  }
  ctx.fillStyle = 옅은; ctx.font = `500 ${27 * u}px ${F}`
  const 한줄들 = 줄나눔(ctx, 내.한줄, 글폭, 2)
  한줄들.forEach((줄, i) => ctx.fillText(줄, 왼, 246 * u + i * 38 * u))
  /* ── 면허 · 자격 칩 ── */
  let cx = 왼; const cy = (한줄들.length > 1 ? 302 : 276) * u
  ctx.font = `700 ${19 * u}px ${F}`
  for (const 칩 of 내.칩) {
    const w = ctx.measureText(칩).width + 26 * u
    if (cx + w > 왼 + 글폭) break
    ctx.fillStyle = 짙 ? 'rgba(212,175,55,0.14)' : 물 ? (레몬 ? 'rgba(43,33,0,0.10)' : 'rgba(255,255,255,0.2)') : 혼합(색, '#ffffff', 0.88)
    둥근(ctx, cx, cy, w, 36 * u, 18 * u); ctx.fill()
    if (짙) { ctx.strokeStyle = 'rgba(212,175,55,0.45)'; ctx.lineWidth = 1.2 * u; ctx.stroke() }
    ctx.fillStyle = 짙 ? '#e9d48b' : 물 ? 글색 : (레몬 ? '#7a5d00' : 색)
    ctx.fillText(칩, cx + 13 * u, cy + 25 * u)
    cx += w + 8 * u
  }
  /* ── 아래: 연락 · 지역 · 주소 ── */
  const 줄들 = []
  if (내.전화) 줄들.push(['TEL', 내.전화])
  else if (내.톡) 줄들.push(['TALK', 내.톡])
  if (내.지역글) 줄들.push(['AREA', 내.지역글])
  줄들.push(['WEB', 내.주소])
  const 아래 = H - 72 * u                              /* 마지막 줄 바닥 */
  const 줄간 = 42 * u
  const 첫 = 아래 - (줄들.length - 1) * 줄간
  ctx.strokeStyle = 짙 ? 'rgba(212,175,55,0.4)' : 물 ? (레몬 ? 'rgba(43,33,0,0.25)' : 'rgba(255,255,255,0.4)') : '#e2e8f0'
  ctx.lineWidth = 1.5 * u
  ctx.beginPath(); ctx.moveTo(왼, 첫 - 46 * u); ctx.lineTo(왼 + 글폭, 첫 - 46 * u); ctx.stroke()
  줄들.forEach(([k, v], i) => {
    const y = 첫 + i * 줄간
    ctx.fillStyle = 점색; ctx.font = `800 ${15 * u}px ${F}`; 자간(ctx, 2 * u)
    ctx.fillText(k, 왼, y - 3 * u)
    자간(ctx, 0)
    const 큰 = k === 'TEL'
    ctx.fillStyle = 글색; ctx.font = `${큰 ? 800 : 600} ${(큰 ? 30 : 23) * u}px ${F}`
    ctx.fillText(줄나눔(ctx, v, 글폭 - 78 * u, 1)[0] || '', 왼 + 78 * u, y)
  })
  /* ── 바닥 글 ── */
  ctx.fillStyle = 짙 ? 'rgba(212,175,55,0.55)' : 물 ? (레몬 ? 'rgba(43,33,0,0.5)' : 'rgba(255,255,255,0.65)') : '#94a3b8'
  ctx.font = `700 ${14 * u}px ${F}`; ctx.textAlign = 'right'; 자간(ctx, 2 * u)
  ctx.fillText('K-건설맵 · MY CONMAP', W - 48 * u, H - 40 * u)
  자간(ctx, 0); ctx.textAlign = 'left'
  return cv
}

/** QR 만 — 현장 게시판 · 차량 · 견적서에 붙이기 */
export function qr만그리기(cv, 칸, a) {
  const W = 900, H = 1060
  cv.width = W; cv.height = H
  const ctx = cv.getContext('2d'); const F = 글꼴()
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
  if (칸) qr그림(ctx, 칸, 90, 90, 720, '#0f172a')
  ctx.fillStyle = '#0f172a'; ctx.textAlign = 'center'
  ctx.font = `800 44px ${F}`; ctx.fillText(`@${a}`, W / 2, 900)
  ctx.fillStyle = '#64748b'; ctx.font = `600 28px ${F}`; ctx.fillText('k-conmap.com · 마이컨맵', W / 2, 960)
  return cv
}

/* ── PNG 에 300dpi 적기(pHYs) — 인쇄소 프로그램이 90×50mm 로 바로 읽게 ── */
const crc표 = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0 } return t })()
function crc32(b) { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = crc표[(c ^ b[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
export async function dpi적기(blob, dpi) {
  try {
    const 원 = new Uint8Array(await blob.arrayBuffer())
    const ppm = Math.round(dpi / 0.0254)
    const 칸 = new Uint8Array(21)
    const v = new DataView(칸.buffer)
    v.setUint32(0, 9); 칸.set([0x70, 0x48, 0x59, 0x73], 4)       /* 'pHYs' */
    v.setUint32(8, ppm); v.setUint32(12, ppm); 칸[16] = 1
    v.setUint32(17, crc32(칸.subarray(4, 17)))
    const 자리 = 33                                                  /* 서명 8 + IHDR 25 */
    const 새 = new Uint8Array(원.length + 21)
    새.set(원.subarray(0, 자리)); 새.set(칸, 자리); 새.set(원.subarray(자리), 자리 + 21)
    return new Blob([새], { type: 'image/png' })
  } catch (e) { return blob }
}
export const 그림덩이 = (cv) => new Promise((ok) => cv.toBlob((b) => ok(b), 'image/png'))
/** 받기 — 링크로 내려받음 */
export function 내려받기(blob, 이름) {
  const u = URL.createObjectURL(blob)
  const el = document.createElement('a')
  el.href = u; el.download = 이름; document.body.appendChild(el); el.click(); el.remove()
  setTimeout(() => URL.revokeObjectURL(u), 4000)
}
/** 폰 공유(카톡 등) — 되면 true */
export async function 그림공유(blob, 이름, 글) {
  try {
    const f = new File([blob], 이름, { type: 'image/png' })
    if (!navigator.canShare || !navigator.canShare({ files: [f] })) return false
    await navigator.share({ files: [f], title: 이름, text: 글 })
    return true
  } catch (e) { return e && e.name === 'AbortError' }
}
