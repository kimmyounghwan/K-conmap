/**
 * ▶ 예시로 해 보기 — 사진대지 · 영수증 정리 (2026-09-30)
 *   소장님: 「사용방법과 예시도 넣어줘.」
 *   ■ 예시 사진 · 영수증은 브라우저가 그 자리에서 «그려서» 만듭니다(내려받는 것 없음 · 실제 현장 · 상호 · 사람 이름 없음 — ○○ 로만).
 *   ■ 예시 사진에는 찍은 시각(EXIF)을 넣어 «찍은 차례 · 날짜 바뀌면 새 쪽» 이 실제처럼 돌고,
 *     한 장은 흐리게 · 한 장은 거의 같게 만들어 «표시 → 빼기» 를 보여 줍니다.
 */

function 캔버스(w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}
const jpg = (c, 질 = 0.86) => new Promise((ok, no) => c.toBlob((b) => (b ? b.arrayBuffer().then((a) => ok(new Uint8Array(a)), no) : no(new Error('그림을 만들지 못했습니다'))), 'image/jpeg', 질))
const 글꼴 = (px, 굵게 = false) => `${굵게 ? '700 ' : ''}${px}px "Malgun Gothic","맑은 고딕",AppleGothic,"Noto Sans KR",sans-serif`

/** JPEG 에 찍은 시각(DateTimeOriginal) 넣기 — 'YYYY:MM:DD HH:MM:SS' */
export function 때넣기(jpgBytes, 때) {
  const ifd0 = 8
  const exifIfd = ifd0 + 2 + 12 + 4
  const 글자리 = exifIfd + 2 + 12 + 4
  const 글 = new TextEncoder().encode(때.slice(0, 19) + '\0')
  const b = new Uint8Array(글자리 + 글.length)
  const v = new DataView(b.buffer)
  b.set([0x49, 0x49]); v.setUint16(2, 42, true); v.setUint32(4, 8, true)
  v.setUint16(ifd0, 1, true)
  v.setUint16(ifd0 + 2, 0x8769, true); v.setUint16(ifd0 + 4, 4, true); v.setUint32(ifd0 + 6, 1, true); v.setUint32(ifd0 + 10, exifIfd, true)
  v.setUint32(ifd0 + 14, 0, true)
  v.setUint16(exifIfd, 1, true)
  v.setUint16(exifIfd + 2, 0x9003, true); v.setUint16(exifIfd + 4, 2, true); v.setUint32(exifIfd + 6, 20, true); v.setUint32(exifIfd + 10, 글자리, true)
  v.setUint32(exifIfd + 14, 0, true)
  b.set(글, 글자리)
  const app1 = new Uint8Array(10 + b.length)
  app1[0] = 0xff; app1[1] = 0xe1
  new DataView(app1.buffer).setUint16(2, 8 + b.length)
  app1.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4)
  app1.set(b, 10)
  const out = new Uint8Array(jpgBytes.length + app1.length)
  out.set(jpgBytes.slice(0, 2)); out.set(app1, 2); out.set(jpgBytes.slice(2), 2 + app1.length)
  return out
}

/* ── 현장 그림(간단한 그림 — 예시라는 것이 한눈에 보이게) ── */
function 하늘땅(g, w, h, 땅높 = 0.45) {
  const s = g.createLinearGradient(0, 0, 0, h * (1 - 땅높))
  s.addColorStop(0, '#8fbce6'); s.addColorStop(1, '#d9ebf7')
  g.fillStyle = s; g.fillRect(0, 0, w, h)
  g.fillStyle = '#6f8f4e'; g.fillRect(0, h * (1 - 땅높) - h * 0.03, w, h * 0.04)
  g.fillStyle = '#9c7b55'; g.fillRect(0, h * (1 - 땅높), w, h * 땅높)
  g.fillStyle = 'rgba(80,60,40,.25)'
  for (let i = 0; i < 60; i++) g.fillRect((i * 97) % w, h * (1 - 땅높) + ((i * 53) % (h * 땅높)), 10, 4)
}
function 굴삭기(g, x, y, s) {
  g.fillStyle = '#2b2b2b'; g.fillRect(x - 70 * s, y + 30 * s, 190 * s, 34 * s)
  g.fillStyle = '#f2b705'; g.fillRect(x - 60 * s, y - 40 * s, 150 * s, 70 * s)
  g.fillStyle = '#bcd7ea'; g.fillRect(x + 40 * s, y - 34 * s, 40 * s, 36 * s)
  g.strokeStyle = '#e0a800'; g.lineWidth = 18 * s; g.lineCap = 'round'
  g.beginPath(); g.moveTo(x - 50 * s, y - 20 * s); g.lineTo(x - 170 * s, y - 120 * s); g.lineTo(x - 250 * s, y + 20 * s); g.stroke()
  g.fillStyle = '#555'; g.beginPath(); g.moveTo(x - 275 * s, y + 10 * s); g.lineTo(x - 225 * s, y + 10 * s); g.lineTo(x - 240 * s, y + 55 * s); g.closePath(); g.fill()
}
function 고깔(g, x, y, s) {
  g.fillStyle = '#f36b1c'; g.beginPath(); g.moveTo(x, y - 60 * s); g.lineTo(x - 22 * s, y); g.lineTo(x + 22 * s, y); g.closePath(); g.fill()
  g.fillStyle = '#fff'; g.fillRect(x - 13 * s, y - 34 * s, 26 * s, 8 * s)
}
function 사람(g, x, y, s, 조끼 = '#f7d11e') {
  g.fillStyle = '#f5d0a9'; g.beginPath(); g.arc(x, y - 58 * s, 12 * s, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y - 64 * s, 13 * s, Math.PI, 0); g.fill()
  g.fillStyle = 조끼; g.fillRect(x - 15 * s, y - 45 * s, 30 * s, 36 * s)
  g.fillStyle = '#34495e'; g.fillRect(x - 13 * s, y - 9 * s, 11 * s, 30 * s); g.fillRect(x + 2 * s, y - 9 * s, 11 * s, 30 * s)
}
const 장면 = {
  '공사 전 전경': (g, w, h) => {
    하늘땅(g, w, h, 0.4)
    g.fillStyle = '#7a9a5a'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(80 + i * 190, h * 0.58, 50, 0, Math.PI * 2); g.fill() }
    g.fillStyle = '#b8b1a4'; g.fillRect(0, h * 0.72, w, h * 0.08)
    고깔(g, w * 0.3, h * 0.9, 1.2); 고깔(g, w * 0.5, h * 0.9, 1.2); 고깔(g, w * 0.7, h * 0.9, 1.2)
  },
  '터파기': (g, w, h, d = 0) => {
    하늘땅(g, w, h)
    g.fillStyle = '#5e4630'; g.fillRect(w * 0.12 + d, h * 0.68, w * 0.62, h * 0.24)
    g.fillStyle = '#a88660'; g.beginPath(); g.moveTo(w * 0.76 + d, h * 0.58); g.lineTo(w * 0.98 + d, h * 0.58); g.lineTo(w * 0.98 + d, h * 0.64); g.lineTo(w * 0.72 + d, h * 0.64); g.closePath(); g.fill()
    굴삭기(g, w * 0.78 + d, h * 0.5, 1.3)
    고깔(g, w * 0.08 + d, h * 0.66, 1)
  },
  '관 부설': (g, w, h) => {
    /* 가까이서 내려다본 관로 — 하늘 없이(다른 사진과 헷갈리지 않게) */
    g.fillStyle = '#8a6a48'; g.fillRect(0, 0, w, h)
    g.save(); g.translate(w / 2, h / 2); g.rotate(-0.35)
    g.fillStyle = '#4a3726'; g.fillRect(-w, -h * 0.22, w * 2, h * 0.44)
    g.fillStyle = '#e8d9a8'; g.fillRect(-w, h * 0.06, w * 2, h * 0.16)
    g.fillStyle = '#9aa3ad'; g.fillRect(-w, -h * 0.1, w * 2, h * 0.17)
    g.fillStyle = '#6f7780'; for (let i = -5; i < 6; i++) g.fillRect(i * w * 0.2, -h * 0.11, 16, h * 0.19)
    g.restore()
    사람(g, w * 0.2, h * 0.3, 1.5); 사람(g, w * 0.82, h * 0.86, 1.5, '#9be15d')
  },
  '철근 배근': (g, w, h) => {
    g.fillStyle = '#c9c9c4'; g.fillRect(0, 0, w, h)
    g.strokeStyle = '#7b3f1d'; g.lineWidth = 9
    for (let x = 60; x < w; x += 70) { g.beginPath(); g.moveTo(x, 40); g.lineTo(x - 40, h - 20); g.stroke() }
    for (let y = 60; y < h; y += 70) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 30); g.stroke() }
    g.fillStyle = '#555'; for (let i = 0; i < 20; i++) g.fillRect(100 + (i * 131) % (w - 200), 100 + (i * 89) % (h - 200), 16, 16)
    사람(g, w * 0.82, h * 0.7, 1.6)
  },
  '콘크리트 타설': (g, w, h) => {
    하늘땅(g, w, h, 0.5)
    g.fillStyle = '#a7a7a2'; g.fillRect(w * 0.08, h * 0.62, w * 0.84, h * 0.2)
    g.fillStyle = '#8c8c86'; g.beginPath(); g.ellipse(w * 0.45, h * 0.66, w * 0.18, h * 0.05, 0, 0, Math.PI * 2); g.fill()
    g.strokeStyle = '#d64541'; g.lineWidth = 16; g.lineCap = 'round'
    g.beginPath(); g.moveTo(w * 0.95, h * 0.55); g.lineTo(w * 0.75, h * 0.18); g.lineTo(w * 0.47, h * 0.3); g.lineTo(w * 0.46, h * 0.6); g.stroke()
    사람(g, w * 0.3, h * 0.66, 1.3); 사람(g, w * 0.6, h * 0.66, 1.3)
  },
  '안전교육': (g, w, h) => {
    g.fillStyle = '#dfe6ec'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#2f5d3a'; g.fillRect(w * 0.3, h * 0.08, w * 0.4, h * 0.26)
    g.fillStyle = '#fff'; g.font = 글꼴(Math.round(h * 0.06), true); g.textAlign = 'center'; g.fillText('안전교육(예시)', w * 0.5, h * 0.23)
    for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) 사람(g, w * 0.14 + c * w * 0.12, h * 0.6 + r * h * 0.13, 1.1 + r * 0.15, c % 2 ? '#f7d11e' : '#9be15d')
  },
}

function 이름표(g, w, h, 글) {
  g.textAlign = 'left'
  g.font = 글꼴(Math.round(h * 0.045), true)
  const tw = g.measureText(글).width
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(w * 0.03, h * 0.04, tw + 30, h * 0.075)
  g.fillStyle = '#222'; g.fillText(글, w * 0.03 + 15, h * 0.095)
  g.font = 글꼴(Math.round(h * 0.03), true)
  g.fillStyle = 'rgba(0,0,0,.45)'; g.textAlign = 'right'; g.fillText('K-건설맵 예시 사진', w * 0.97, h * 0.96)
}

/** 예시 사진 8장 — File 목록(찍은 시각 들어 있음) */
export async function 예시사진파일들() {
  const w = 1600, h = 1200
  const 목록 = [
    ['01_공사 전 전경.jpg', '공사 전 전경', '2026:09:01 08:40:00'],
    ['IMG_20260901_100500.jpg', '터파기', '2026:09:01 10:05:00'],
    ['IMG_20260901_100503.jpg', '터파기', '2026:09:01 10:05:03', { 옮김: 8 }],   /* 거의 같은 사진(연속 촬영) */
    ['관 부설.jpg', '관 부설', '2026:09:02 09:30:00'],
    ['IMG_20260902_093100.jpg', '관 부설', '2026:09:02 09:31:00', { 흐림: true }],
    ['철근 배근 검측.jpg', '철근 배근', '2026:09:03 13:20:00'],
    ['콘크리트 타설.jpg', '콘크리트 타설', '2026:09:04 10:00:00'],
    ['안전교육 실시.jpg', '안전교육', '2026:09:04 07:30:00'],
  ]
  const out = []
  for (const [이름, 종류, 때, 더 = {}] of 목록) {
    const c = 캔버스(w, h)
    const g = c.getContext('2d')
    장면[종류](g, w, h, 더.옮김 || 0)
    이름표(g, w, h, `예시 · ${종류}`)
    let 최종 = c
    if (더.흐림) {
      const 작 = 캔버스(w / 14, h / 14)
      작.getContext('2d').drawImage(c, 0, 0, 작.width, 작.height)
      const 큰 = 캔버스(w, h)
      const kg = 큰.getContext('2d')
      kg.imageSmoothingEnabled = true; kg.imageSmoothingQuality = 'high'
      kg.drawImage(작, 0, 0, w, h)
      최종 = 큰
    }
    const 바이트 = 때넣기(await jpg(최종), 때)
    const [d, t] = 때.split(' ')
    out.push(new File([바이트], 이름, { type: 'image/jpeg', lastModified: Date.parse(`${d.replace(/:/g, '-')}T${t}+09:00`) }))
  }
  return out
}

/** 예시 영수증 — 스캔 한 장에 영수증 셋(흰 바탕) + 채울 값 */
export async function 예시영수증() {
  const w = 2200, h = 1556
  const c = 캔버스(w, h)
  const g = c.getContext('2d')
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h)
  const 영수증들 = [
    { x: 150, y: 190, 줄: ['○○주유소 (예시)', '2026-09-03 08:12', '휘발유 40.00L', '단가 1,800', '', '합계 72,000원', '카드 승인'],
      값: { 일자: '2026.09.03', 사용처: '○○주유소', 과목: '유류비', 금액: '72,000', 결제: '카드', 비고: '장비 주유' } },
    { x: 860, y: 280, 줄: ['○○식당 (예시)', '2026.09.03 12:30', '백반 6인분', '', '합계 54,000원', '감사합니다'],
      값: { 일자: '2026.09.03', 사용처: '○○식당', 과목: '식대', 금액: '54,000', 결제: '카드', 비고: '현장 점심 6명' } },
    { x: 1560, y: 220, 줄: ['○○철물 (예시)', '26.09.04', '장갑 10켤레', '안전테이프 2개', '', '합계 23,500원'],
      값: { 일자: '2026.09.04', 사용처: '○○철물', 과목: '소모품비', 금액: '23,500', 결제: '현금', 비고: '' } },
  ]
  for (const r of 영수증들) {
    const rw = 480, rh = 110 + r.줄.length * 64
    g.fillStyle = '#fbfbf8'; g.fillRect(r.x, r.y, rw, rh)
    g.strokeStyle = '#dcdcdc'; g.lineWidth = 2; g.strokeRect(r.x, r.y, rw, rh)
    g.fillStyle = '#1e1e1e'; g.textAlign = 'left'
    r.줄.forEach((줄, i) => {
      g.font = 글꼴(i === 0 ? 38 : 32, i === 0 || /합계/.test(줄))
      g.fillText(줄, r.x + 34, r.y + 80 + i * 64)
    })
    g.strokeStyle = '#999'; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(r.x + 30, r.y + 110); g.lineTo(r.x + rw - 30, r.y + 110); g.stroke(); g.setLineDash([])
  }
  g.font = 글꼴(28, true); g.fillStyle = 'rgba(0,0,0,.4)'; g.textAlign = 'right'; g.fillText('K-건설맵 예시 스캔', w - 60, h - 50)
  const 파일 = new File([await jpg(c, 0.9)], '예시_영수증스캔.jpg', { type: 'image/jpeg' })
  return { 파일, 값들: 영수증들.map((r) => r.값) }
}
