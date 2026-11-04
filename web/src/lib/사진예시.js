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

function 이름표(g, w, h, 글, 끝 = 'K-건설맵 예시 사진', 크기 = h, 끝y) {
  g.textAlign = 'left'
  g.font = 글꼴(Math.round(크기 * 0.045), true)
  const tw = g.measureText(글).width
  g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(w * 0.03, 크기 * 0.04, tw + 30, 크기 * 0.075)
  g.fillStyle = '#222'; g.fillText(글, w * 0.03 + 15, 크기 * 0.095)
  g.font = 글꼴(Math.round(크기 * 0.03), true)
  g.fillStyle = 'rgba(0,0,0,.45)'; g.textAlign = 'right'; g.fillText(끝, w * 0.97, 끝y ?? h - 크기 * 0.04)
}

/* ── 📐 G529 (2026-11-04) 예시 «그림» — 위치도 · 배치 도면 칸에는 현장 사진(관 부설 등) 대신 위에서 본 간단한 그림 ──
 *   특정공사 사전신고서 [첨부 2] 위치도 · [첨부 3] 방음 · 방진시설 배치 도면 — 작성 예시 피해 대상 표
 *   (① 학교 동 45 m · ② 공동주택 북 62 m · ③ 주택 서 15 m · ④ 같은 건물 상가)와 맞춤 · 축척 1 m ≈ 2.7 점.
 *   실제 장소 · 지도 · 이름 없음(○○로 · △△길만). */
function 둥근네모(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath()
}
function 쓰기(g, t, x, y, px, 색 = '#1f2937', 굵 = true, 줄 = 'center') { g.font = 글꼴(px, 굵); g.fillStyle = 색; g.textAlign = 줄; g.fillText(t, x, y) }
/* 🦺 G538 공사안전보건대장 «3. 기계·장비 배치 및 이동 경로» 예시 그림 네 장 — 같은 가상의 대지(가나시 복합청사 예시와 맞춤)
 *   서쪽 주차동(철골) · 가운데 청사동(철근콘크리트 · 흙막이) · 동쪽 인접 건물(대지 밖) · 남쪽 ○○로 · 출입구 — 오른쪽은 범례
 *   첨부 서식 1 예시(타워크레인 작업반경이 동쪽 인접 건물과 겹침 → 회전 제한 동쪽 90° · 펌프카 경사 5 % 구간 → 받침판 · 고임목)와 같은 내용 */
function 화살(g, 점들, 색, 굵기 = 10) {
  g.strokeStyle = 색; g.lineWidth = 굵기; g.lineCap = 'round'; g.lineJoin = 'round'
  g.beginPath(); g.moveTo(점들[0][0], 점들[0][1]); for (const [x, y] of 점들.slice(1)) g.lineTo(x, y); g.stroke()
  const [x1, y1] = 점들[점들.length - 2], [x2, y2] = 점들[점들.length - 1]
  const a = Math.atan2(y2 - y1, x2 - x1), L = 굵기 * 2.6
  g.fillStyle = 색; g.beginPath(); g.moveTo(x2 + Math.cos(a) * L * 0.6, y2 + Math.sin(a) * L * 0.6)
  g.lineTo(x2 + Math.cos(a + 2.5) * L, y2 + Math.sin(a + 2.5) * L); g.lineTo(x2 + Math.cos(a - 2.5) * L, y2 + Math.sin(a - 2.5) * L); g.closePath(); g.fill()
}
function 빗금(g, x, y, w, h, 색, 바탕) {
  if (바탕) { g.fillStyle = 바탕; g.fillRect(x, y, w, h) }
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.strokeStyle = 색; g.lineWidth = 3
  for (let i = -h; i < w + h; i += 18) { g.beginPath(); g.moveTo(x + i, y + h); g.lineTo(x + i + h, y); g.stroke() }
  g.restore()
}
function 점선원(g, x, y, r, 색, 굵기 = 5) { g.strokeStyle = 색; g.lineWidth = 굵기; g.setLineDash([18, 10]); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.setLineDash([]) }
function 신호수(g, x, y, 글쪽 = 'left') {
  g.fillStyle = '#facc15'; g.strokeStyle = '#a16207'; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 12, 0, Math.PI * 2); g.fill(); g.stroke()
  if (글쪽) 쓰기(g, '신호수', 글쪽 === 'left' ? x - 20 : x + 20, y + 7, 20, '#854d0e', true, 글쪽 === 'left' ? 'right' : 'left')
}
function 받침(g, 점들) { g.fillStyle = '#6b7280'; for (const [x, y] of 점들) g.fillRect(x - 11, y - 11, 22, 22) }
/** 장비 몸체(위에서 본 모양) — 몸 · 운전석 */
function 장비몸(g, x, y, w, h, 글) {
  g.fillStyle = '#f59e0b'; g.fillRect(x, y, w, h); g.strokeStyle = '#92400e'; g.lineWidth = 3; g.strokeRect(x, y, w, h)
  g.fillStyle = '#fde68a'; g.fillRect(x + w - 26, y + 6, 20, h - 12)
  if (글) 쓰기(g, 글, x + (w - 26) / 2, y + h / 2 + 8, 20, '#1f2937')
}
function 장비대지(g, w, h, 흙막이글 = true) {
  g.fillStyle = '#f5f2ea'; g.fillRect(0, 0, w, h)
  /* ○○로(남쪽) */
  g.fillStyle = '#cfc9bc'; g.fillRect(0, 800, w, 80)
  g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.setLineDash([26, 20]); g.beginPath(); g.moveTo(0, 840); g.lineTo(w, 840); g.stroke(); g.setLineDash([])
  쓰기(g, '○○로', 1280, 852, 30, '#5b5446')
  /* 대지 경계(점선) · 남쪽 출입구 */
  g.strokeStyle = '#374151'; g.lineWidth = 5; g.setLineDash([20, 12])
  g.beginPath(); g.moveTo(380, 780); g.lineTo(90, 780); g.lineTo(90, 140); g.lineTo(1130, 140); g.lineTo(1130, 780); g.lineTo(520, 780); g.stroke(); g.setLineDash([])
  쓰기(g, '대지 경계', 110, 172, 24, '#374151', false, 'left')
  쓰기(g, '출입구', 372, 770, 22, '#374151', true, 'right')
  /* 주차동(철골) · 청사동(철근콘크리트) · 흙막이 */
  g.fillStyle = '#e5e7eb'; g.fillRect(160, 220, 260, 250); g.strokeStyle = '#6b7280'; g.lineWidth = 5; g.strokeRect(160, 220, 260, 250)
  쓰기(g, '주차동', 290, 330, 30, '#374151'); 쓰기(g, '철골 · 12 m', 290, 370, 22, '#4b5563', false)
  g.strokeStyle = '#92400e'; g.lineWidth = 4; g.setLineDash([10, 7]); g.strokeRect(530, 190, 500, 440); g.setLineDash([])
  if (흙막이글) 쓰기(g, '흙막이', 1040, 622, 22, '#92400e', true, 'left')
  g.fillStyle = '#d1d5db'; g.fillRect(560, 220, 440, 380); g.strokeStyle = '#4b5563'; g.lineWidth = 5; g.strokeRect(560, 220, 440, 380)
  쓰기(g, '청사동', 780, 282, 32, '#1f2937'); 쓰기(g, '철근콘크리트 · 21.6 m', 780, 320, 22, '#374151', false); 쓰기(g, '굴착 6.5 m', 780, 350, 22, '#374151', false)
  /* 인접 건물(대지 밖 · 동쪽) */
  g.fillStyle = '#ffedd5'; g.fillRect(1160, 220, 200, 380); g.strokeStyle = '#c2410c'; g.lineWidth = 5; g.strokeRect(1160, 220, 200, 380)
  쓰기(g, '인접 건물', 1260, 395, 28, '#9a3412'); 쓰기(g, '동쪽 · 5층', 1260, 433, 22, '#9a3412', false)
  /* 북쪽 */
  g.fillStyle = '#374151'; g.beginPath(); g.moveTo(2080, 70); g.lineTo(2056, 140); g.lineTo(2080, 124); g.lineTo(2104, 140); g.closePath(); g.fill()
  쓰기(g, 'N', 2080, 60, 34, '#374151')
}
/** 범례 — [그리기(g, x, y), 글, 둘째 줄?] · 끝에 회색 덧말 */
function 범례(g, 줄들, 덧말 = []) {
  쓰기(g, '범  례', 1460, 196, 30, '#1f2937', true, 'left')
  let y = 250
  for (const [그리기, 글, 둘] of 줄들) {
    그리기(g, 1500, y)
    쓰기(g, 글, 1560, y + 9, 25, '#1f2937', true, 'left')
    if (둘) { 쓰기(g, 둘, 1560, y + 41, 21, '#4b5563', false, 'left'); y += 32 }
    y += 60
  }
  y += 6
  for (const t of 덧말) { 쓰기(g, '· ' + t, 1460, y, 22, '#4b5563', false, 'left'); y += 34 }
}
const 그림장면 = {
  '공사장 위치도': { w: 1600, h: 1030, 표: 1030, 그리기: (g, w, h) => {
    g.fillStyle = '#f5f2ea'; g.fillRect(0, 0, w, h)
    /* 길 — 아래 가로 ○○로 · 왼쪽 세로 △△길 */
    g.fillStyle = '#cfc9bc'; g.fillRect(0, 830, w, 84); g.fillRect(380, 0, 84, 830)
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.setLineDash([26, 20])
    g.beginPath(); g.moveTo(0, 872); g.lineTo(w, 872); g.moveTo(422, 0); g.lineTo(422, 830); g.stroke(); g.setLineDash([])
    쓰기(g, '○○로', 160, 885, 34, '#5b5446'); g.save(); g.translate(436, 640); g.rotate(-Math.PI / 2); 쓰기(g, '△△길', 0, 0, 34, '#5b5446'); g.restore()
    /* 공사장 부지 경계에서 50 m */
    g.strokeStyle = '#2563eb'; g.lineWidth = 5; g.setLineDash([18, 12]); 둥근네모(g, 544, 164, 592, 572, 60); g.stroke(); g.setLineDash([])
    쓰기(g, '부지 경계에서 50 m', 1100, 202, 30, '#1d4ed8', true, 'right')
    /* 공사장 — 빨간 점선 */
    g.fillStyle = '#fde8e5'; g.fillRect(680, 300, 320, 300)
    g.strokeStyle = '#d92d20'; g.lineWidth = 7; g.setLineDash([22, 12]); g.strokeRect(680, 300, 320, 300); g.setLineDash([])
    쓰기(g, '공 사 장', 840, 370, 40, '#b42318'); 쓰기(g, '(건물 안 내부 철거)', 840, 414, 28, '#b42318', false)
    for (const x of [730, 880]) { g.fillStyle = '#f59e0b'; g.fillRect(x, 470, 70, 46); 쓰기(g, '장비', x + 35, 503, 24) }
    쓰기(g, '④ 1층 상가(같은 건물)', 840, 578, 26, '#7c2d12')
    /* ① 학교 — 동 45 m(50 m 안) */
    g.fillStyle = '#dcfce7'; g.fillRect(1122, 250, 300, 310); g.strokeStyle = '#15803d'; g.lineWidth = 5; g.strokeRect(1122, 250, 300, 310)
    g.fillStyle = '#bbf7d0'; g.fillRect(1180, 300, 190, 120)
    쓰기(g, '① 학교', 1272, 470, 40, '#166534'); 쓰기(g, '동 45 m', 1272, 516, 30, '#166534', false)
    /* ② 공동주택 — 북 62 m(50 m 밖) */
    g.fillStyle = '#e0e7ff'; g.fillRect(640, 24, 400, 106); g.strokeStyle = '#4338ca'; g.lineWidth = 5; g.strokeRect(640, 24, 400, 106)
    쓰기(g, '② 공동주택  북 62 m', 840, 92, 32, '#3730a3')
    /* ③ 단독주택 4동 — 서 15 m */
    for (const [x, y] of [[490, 330], [570, 330], [490, 430], [570, 430]]) { g.fillStyle = '#fef3c7'; g.fillRect(x, y, 66, 74); g.strokeStyle = '#b45309'; g.lineWidth = 4; g.strokeRect(x, y, 66, 74) }
    쓰기(g, '③ 주택', 568, 548, 34, '#92400e'); 쓰기(g, '서 15 m', 568, 588, 28, '#92400e', false)
    /* 북쪽 */
    g.fillStyle = '#374151'; g.beginPath(); g.moveTo(1520, 70); g.lineTo(1496, 140); g.lineTo(1520, 124); g.lineTo(1544, 140); g.closePath(); g.fill()
    쓰기(g, 'N', 1520, 60, 34, '#374151')
  } },
  '방음 · 방진시설 배치': { w: 2160, h: 400, 표: 700, 그리기: (g, w, h) => {
    g.fillStyle = '#f5f2ea'; g.fillRect(0, 0, w, h)
    /* 건물 한 층(위에서) — 벽 · 철거하는 칸막이(점선) */
    g.strokeStyle = '#374151'; g.lineWidth = 12; g.strokeRect(300, 96, 1380, 220)
    g.lineWidth = 6; g.setLineDash([16, 12]); g.beginPath(); g.moveTo(760, 96); g.lineTo(760, 316); g.moveTo(1220, 96); g.lineTo(1220, 316); g.stroke(); g.setLineDash([])
    쓰기(g, '철거하는 칸막이(점선)', 990, 150, 32, '#6b7280', false)
    /* 창 · 출입구 방음막(굵은 파랑) */
    g.strokeStyle = '#2563eb'; g.lineWidth = 16
    for (const [x1, x2] of [[420, 620], [880, 1080], [1340, 1540]]) { g.beginPath(); g.moveTo(x1, 316); g.lineTo(x2, 316); g.stroke() }
    g.beginPath(); g.moveTo(300, 150); g.lineTo(300, 262); g.stroke()
    쓰기(g, '창 · 출입구 방음막(파랑)', 990, 370, 34, '#1d4ed8')
    /* 장비 · 방진매트(빗금) */
    for (const [x, t] of [[480, '압쇄기'], [1330, '브레이커']]) {
      g.fillStyle = '#fed7aa'; g.fillRect(x - 20, 160, 220, 110)
      g.save(); g.beginPath(); g.rect(x - 20, 160, 220, 110); g.clip()
      g.strokeStyle = '#ea580c'; g.lineWidth = 3
      for (let i = -120; i < 240; i += 22) { g.beginPath(); g.moveTo(x - 20 + i, 270); g.lineTo(x - 20 + i + 110, 160); g.stroke() }
      g.restore()
      g.fillStyle = '#f59e0b'; g.fillRect(x + 30, 185, 120, 60); 쓰기(g, t, x + 90, 226, 28)
      쓰기(g, '방진매트', x + 90, 296, 24, '#9a3412', false)
    }
    /* 이동식 방음벽 · 학교 쪽 */
    g.strokeStyle = '#1e3a8a'; g.lineWidth = 22; g.beginPath(); g.moveTo(1760, 60); g.lineTo(1760, 350); g.stroke()
    쓰기(g, '이동식 방음벽', 1800, 160, 34, '#1e3a8a', true, 'left'); 쓰기(g, '높이 3 m', 1800, 204, 28, '#1e3a8a', false, 'left')
    쓰기(g, '① 학교 쪽 →', 1800, 290, 34, '#166534', true, 'left')
  } },
  /* 📐 G530 비산먼지 발생사업 신고서 작성 예시(신축 · 터파기)와 맞춤 — ① 공동주택 북 35 m · ② 상가 동 28 m(50 m 안 → 방진벽 3 m) · ③ 학교 남 140 m · ④ 주택 서 60 m */
  '공사장 위치도 · 신축': { w: 1600, h: 1030, 표: 1030, 그리기: (g, w, h) => {
    g.fillStyle = '#f5f2ea'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#cfc9bc'; g.fillRect(0, 800, w, 80); g.fillRect(200, 0, 80, 800)
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.setLineDash([26, 20])
    g.beginPath(); g.moveTo(0, 840); g.lineTo(w, 840); g.moveTo(240, 0); g.lineTo(240, 800); g.stroke(); g.setLineDash([])
    쓰기(g, '○○로', 120, 853, 34, '#5b5446'); g.save(); g.translate(254, 600); g.rotate(-Math.PI / 2); 쓰기(g, '△△길', 0, 0, 34, '#5b5446'); g.restore()
    /* 부지 경계에서 50 m */
    g.strokeStyle = '#2563eb'; g.lineWidth = 5; g.setLineDash([18, 12]); 둥근네모(g, 504, 194, 612, 562, 60); g.stroke(); g.setLineDash([])
    쓰기(g, '부지 경계에서 50 m', 530, 740, 30, '#1d4ed8', true, 'left')
    /* 공사장 — 경계 전체 방진벽(굵은 남색) · 남쪽 출입구 · 세륜 */
    g.fillStyle = '#fde8e5'; g.fillRect(640, 330, 340, 290)
    g.strokeStyle = '#1e3a8a'; g.lineWidth = 12
    g.beginPath(); g.moveTo(780, 620); g.lineTo(640, 620); g.lineTo(640, 330); g.lineTo(980, 330); g.lineTo(980, 620); g.lineTo(860, 620); g.stroke()
    쓰기(g, '공 사 장', 810, 400, 40, '#b42318'); 쓰기(g, '(신축 · 터파기)', 810, 444, 28, '#b42318', false)
    g.fillStyle = '#a16207'; g.fillRect(880, 480, 80, 60); 쓰기(g, '흙', 920, 521, 26, '#fff')
    쓰기(g, '방진벽 3 m(경계 전체)', 810, 590, 26, '#1e3a8a')
    g.fillStyle = '#93c5fd'; g.fillRect(770, 630, 100, 46); 쓰기(g, '세륜', 820, 662, 26, '#1e3a8a')
    g.strokeStyle = '#6b7280'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(820, 680); g.lineTo(820, 800); g.stroke(); g.setLineDash([])
    쓰기(g, '출입구', 900, 740, 26, '#374151', false, 'left')
    /* ① 공동주택 북 35 m · ② 상가 동 28 m · ④ 주택 서 60 m · ③ 학교 남 140 m(그림 밖) */
    g.fillStyle = '#e0e7ff'; g.fillRect(620, 110, 380, 125); g.strokeStyle = '#4338ca'; g.lineWidth = 5; g.strokeRect(620, 110, 380, 125)
    쓰기(g, '① 공동주택  북 35 m', 810, 186, 32, '#3730a3')
    g.fillStyle = '#ffedd5'; g.fillRect(1056, 380, 250, 190); g.strokeStyle = '#c2410c'; g.lineWidth = 5; g.strokeRect(1056, 380, 250, 190)
    쓰기(g, '② 상가', 1181, 468, 34, '#9a3412'); 쓰기(g, '동 28 m', 1181, 510, 28, '#9a3412', false)
    for (const y of [360, 440, 520]) { g.fillStyle = '#fef3c7'; g.fillRect(330, y, 140, 64); g.strokeStyle = '#b45309'; g.lineWidth = 4; g.strokeRect(330, y, 140, 64) }
    쓰기(g, '④ 주택', 400, 630, 32, '#92400e'); 쓰기(g, '서 60 m', 400, 668, 26, '#92400e', false)
    g.fillStyle = '#166534'; g.beginPath(); g.moveTo(820, 1000); g.lineTo(796, 960); g.lineTo(844, 960); g.closePath(); g.fill()
    쓰기(g, '③ 학교 — 남쪽 140 m (그림 밖)', 820, 935, 30, '#166534')
    g.fillStyle = '#374151'; g.beginPath(); g.moveTo(1520, 70); g.lineTo(1496, 140); g.lineTo(1520, 124); g.lineTo(1544, 140); g.closePath(); g.fill()
    쓰기(g, 'N', 1520, 60, 34, '#374151')
  } },
  /* 끝y — «K-건설맵 예시 그림»을 아래 길(585~) 위 · 범례 밑 빈 곳에(길과 겹치지 않게) */
  '비산먼지 억제시설 배치': { w: 2160, h: 630, 표: 800, 끝y: 552, 그리기: (g, w, h) => {
    g.fillStyle = '#f5f2ea'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#cfc9bc'; g.fillRect(0, 585, w, 45); 쓰기(g, '○○로', 120, 618, 28, '#5b5446')
    /* 공사장 경계 방진벽(굵은 남색 · 남쪽 출입구) */
    g.strokeStyle = '#1e3a8a'; g.lineWidth = 14
    g.beginPath(); g.moveTo(1300, 560); g.lineTo(160, 560); g.lineTo(160, 112); g.lineTo(1700, 112); g.lineTo(1700, 560); g.lineTo(1460, 560); g.stroke()
    /* 흙 야적 — 방진덮개(빗금) */
    g.fillStyle = '#d6b98c'; g.fillRect(220, 130, 300, 180)
    g.save(); g.beginPath(); g.rect(220, 130, 300, 180); g.clip(); g.strokeStyle = '#7c5a2a'; g.lineWidth = 3
    for (let i = -200; i < 320; i += 24) { g.beginPath(); g.moveTo(220 + i, 310); g.lineTo(220 + i + 180, 130); g.stroke() }
    g.restore(); 쓰기(g, '흙 야적 · 방진덮개', 370, 350, 30, '#78350f')
    /* 싣기 · 내리기 살수시설(반경 5 m) */
    g.strokeStyle = '#0284c7'; g.lineWidth = 4; g.setLineDash([12, 8])
    for (const [x, y] of [[620, 200], [620, 400]]) { g.beginPath(); g.arc(x, y, 70, 0, Math.PI * 2); g.stroke() }
    g.setLineDash([]); g.fillStyle = '#0284c7'; for (const [x, y] of [[620, 200], [620, 400]]) { g.beginPath(); g.arc(x, y, 10, 0, Math.PI * 2); g.fill() }
    쓰기(g, '살수시설 반경 5 m', 620, 515, 28, '#0369a1')
    /* 신축 건물(작업 층 방진막) */
    g.fillStyle = '#d1d5db'; g.fillRect(800, 140, 420, 300); g.strokeStyle = '#4b5563'; g.lineWidth = 5; g.strokeRect(800, 140, 420, 300)
    쓰기(g, '신축 건물', 1010, 280, 34, '#1f2937'); 쓰기(g, '작업 층 방진막', 1010, 324, 28, '#374151', false)
    /* 공사장 안 통행로 · 살수 — 싣는 곳(살수시설) → 통행로 → 세륜 · 측면 살수 → 출입구(세륜을 거쳐서만 나감) */
    g.strokeStyle = '#6b7280'; g.lineWidth = 5; g.setLineDash([16, 12]); g.beginPath(); g.moveTo(700, 460); g.lineTo(1380, 460); g.lineTo(1380, 585); g.stroke(); g.setLineDash([])
    쓰기(g, '통행로 시속 20 ㎞ · 하루 3회 살수', 1040, 500, 26, '#374151', false)
    /* 출입구 자동식 세륜 · 측면 살수(세륜 양옆) */
    g.fillStyle = '#93c5fd'; g.fillRect(1305, 485, 150, 60); 쓰기(g, '자동식 세륜', 1380, 524, 26, '#1e3a8a')
    g.strokeStyle = '#2563eb'; g.lineWidth = 6; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(1293, 478); g.lineTo(1293, 548); g.moveTo(1467, 478); g.lineTo(1467, 548); g.stroke(); g.setLineDash([])
    쓰기(g, '측면 살수', 1485, 524, 26, '#1d4ed8', true, 'left')
    /* 범례 */
    g.strokeStyle = '#1e3a8a'; g.lineWidth = 14; g.beginPath(); g.moveTo(1760, 150); g.lineTo(1840, 150); g.stroke(); 쓰기(g, '방진벽 3 m', 1860, 160, 28, '#1e3a8a', true, 'left')
    g.strokeStyle = '#2563eb'; g.lineWidth = 6; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(1760, 230); g.lineTo(1840, 230); g.stroke(); g.setLineDash([]); 쓰기(g, '측면 살수', 1860, 240, 28, '#1d4ed8', true, 'left')
    g.strokeStyle = '#0284c7'; g.lineWidth = 4; g.setLineDash([12, 8]); g.beginPath(); g.arc(1800, 310, 28, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); 쓰기(g, '살수시설', 1860, 320, 28, '#0369a1', true, 'left')
    g.fillStyle = '#d6b98c'; g.fillRect(1772, 370, 56, 40); 쓰기(g, '방진덮개', 1860, 400, 28, '#78350f', true, 'left')
  } },
  /* 🦺 G538 공사안전보건대장 «3. 1) 타워크레인 배치 위치 및 작업구간» — 작업반경이 동쪽 인접 건물과 겹침 → 회전 제한(동쪽 90°) · 인양 구역 · 신호수 */
  '장비 배치 · 타워크레인': { w: 2160, h: 880, 표: 880, 끝y: 792, 그리기: (g, w, h) => {
    장비대지(g, w, h)
    const cx = 780, cy = 450, R = 450
    g.fillStyle = 'rgba(220,38,38,.16)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, -Math.PI / 4, Math.PI / 4); g.closePath(); g.fill()
    g.strokeStyle = '#dc2626'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * Math.SQRT1_2, cy - R * Math.SQRT1_2); g.moveTo(cx, cy); g.lineTo(cx + R * Math.SQRT1_2, cy + R * Math.SQRT1_2); g.stroke()
    점선원(g, cx, cy, R, '#dc2626')
    g.fillStyle = 'rgba(250,204,21,.38)'; g.fillRect(440, 645, 120, 90); g.strokeStyle = '#ca8a04'; g.lineWidth = 4; g.setLineDash([10, 6]); g.strokeRect(440, 645, 120, 90); g.setLineDash([])
    쓰기(g, '인양 구역', 500, 698, 22, '#854d0e')
    g.fillStyle = '#dc2626'; g.fillRect(cx - 20, cy - 20, 40, 40)
    g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx - 20, cy - 20); g.lineTo(cx + 20, cy + 20); g.moveTo(cx + 20, cy - 20); g.lineTo(cx - 20, cy + 20); g.stroke()
    쓰기(g, 'T-1', cx, cy + 52, 26, '#b91c1c')
    신호수(g, 1075, 690); 신호수(g, 420, 600)
    범례(g, [
      [(g, x, y) => { g.fillStyle = '#dc2626'; g.fillRect(x - 16, y - 16, 32, 32) }, 'T-1 타워크레인 · 작업반경 R = 50 m'],
      [(g, x, y) => { g.strokeStyle = '#dc2626'; g.lineWidth = 5; g.setLineDash([18, 10]); g.beginPath(); g.moveTo(x - 40, y); g.lineTo(x + 40, y); g.stroke(); g.setLineDash([]) }, '작업반경(점선)'],
      [(g, x, y) => { g.fillStyle = 'rgba(220,38,38,.16)'; g.fillRect(x - 40, y - 20, 80, 40); g.strokeStyle = '#dc2626'; g.lineWidth = 3; g.strokeRect(x - 40, y - 20, 80, 40) }, '회전 제한 — 동쪽 90°', '인접 건물 위로 돌리지 않음(제한 장치)'],
      [(g, x, y) => { g.fillStyle = 'rgba(250,204,21,.38)'; g.fillRect(x - 40, y - 20, 80, 40); g.strokeStyle = '#ca8a04'; g.lineWidth = 4; g.setLineDash([10, 6]); g.strokeRect(x - 40, y - 20, 80, 40); g.setLineDash([]) }, '자재 인양 구역 — 출입 통제'],
      [(g, x, y) => 신호수(g, x, y, ''), '신호수 — 작업 전 회전 구역 표시'],
    ], ['기초 — 지내력 확인 · 기초 구조검토', '다른 타워크레인 없음 — 작업구간 겹침 없음'])
  } },
  /* 🦺 G538 «2) 콘크리트 펌프카 배치 위치 및 이동 경로» — 출입구 경사 5 % 구간 → 받침판 · 고임목(첨부 서식 1 예시와 같게) */
  '장비 배치 · 콘크리트 펌프카': { w: 2160, h: 880, 표: 880, 끝y: 792, 그리기: (g, w, h) => {
    장비대지(g, w, h)
    빗금(g, 420, 730, 60, 70, '#ea580c', 'rgba(234,88,12,.18)')
    쓰기(g, '경사 5 %', 488, 772, 22, '#9a3412', true, 'left')
    점선원(g, 800, 715, 330, '#ea580c')
    g.strokeStyle = '#ea580c'; g.lineWidth = 4; g.setLineDash([10, 6]); g.strokeRect(585, 638, 365, 138); g.setLineDash([])
    화살(g, [[120, 840], [450, 840], [450, 715], [588, 715]], '#2563eb')
    g.fillStyle = '#e5e7eb'; g.fillRect(600, 695, 110, 40); g.strokeStyle = '#4b5563'; g.lineWidth = 3; g.strokeRect(600, 695, 110, 40)
    쓰기(g, '레미콘', 655, 723, 20, '#1f2937')
    g.strokeStyle = '#4b5563'; g.lineWidth = 5
    g.beginPath(); g.moveTo(725, 695); g.lineTo(692, 662); g.moveTo(875, 695); g.lineTo(908, 662); g.moveTo(725, 735); g.lineTo(692, 762); g.moveTo(875, 735); g.lineTo(908, 762); g.stroke()
    받침(g, [[688, 658], [912, 658], [688, 762], [912, 762]])
    장비몸(g, 720, 690, 190, 50, '펌프카')
    신호수(g, 1075, 690)
    범례(g, [
      [(g, x, y) => 화살(g, [[x - 40, y], [x + 34, y]], '#2563eb', 8), '이동 경로 — ○○로 → 출입구 → 타설 위치'],
      [(g, x, y) => 장비몸(g, x - 40, y - 18, 80, 36), '콘크리트 펌프카 · 붐 36 m'],
      [(g, x, y) => { g.strokeStyle = '#ea580c'; g.lineWidth = 5; g.setLineDash([18, 10]); g.beginPath(); g.moveTo(x - 40, y); g.lineTo(x + 40, y); g.stroke(); g.setLineDash([]) }, '붐 작업반경(점선)'],
      [(g, x, y) => 받침(g, [[x - 20, y], [x + 20, y]]), '아웃트리거 — 끝까지 펴고 받침판'],
      [(g, x, y) => 빗금(g, x - 40, y - 20, 80, 40, '#ea580c', 'rgba(234,88,12,.18)'), '경사 5 % 구간 — 받침판 · 고임목', '작업 전 지반(지내력) 확인'],
      [(g, x, y) => { g.strokeStyle = '#ea580c'; g.lineWidth = 4; g.setLineDash([10, 6]); g.strokeRect(x - 40, y - 20, 80, 40); g.setLineDash([]) }, '작업구역 — 출입 통제'],
    ], ['레미콘은 작업구역 안에서 대기 · 유도자 배치'])
  } },
  /* 🦺 G538 «3) 이동식크레인 배치 위치 및 이동 경로» — 주차동 철골 세우기 · 철판 깔기 · 작업반경 출입 금지 */
  '장비 배치 · 이동식크레인': { w: 2160, h: 880, 표: 880, 끝y: 792, 그리기: (g, w, h) => {
    장비대지(g, w, h)
    빗금(g, 190, 560, 200, 130, '#6b7280', 'rgba(107,114,128,.16)')
    점선원(g, 290, 625, 430, '#dc2626')
    화살(g, [[900, 840], [450, 840], [450, 625], [398, 625]], '#2563eb')
    g.strokeStyle = '#4b5563'; g.lineWidth = 5
    g.beginPath(); g.moveTo(235, 605); g.lineTo(212, 582); g.moveTo(345, 605); g.lineTo(368, 582); g.moveTo(235, 645); g.lineTo(212, 668); g.moveTo(345, 645); g.lineTo(368, 668); g.stroke()
    받침(g, [[208, 578], [372, 578], [208, 672], [372, 672]])
    g.strokeStyle = '#b45309'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(290, 610); g.lineTo(390, 290); g.stroke()
    장비몸(g, 230, 600, 130, 50, '50 t')
    신호수(g, 480, 560)
    범례(g, [
      [(g, x, y) => 장비몸(g, x - 40, y - 18, 80, 36), '이동식크레인 50 t', '주차동 철골 세우기'],
      [(g, x, y) => 화살(g, [[x - 40, y], [x + 34, y]], '#2563eb', 8), '이동 경로 — 출입구 → 설치 위치'],
      [(g, x, y) => { g.strokeStyle = '#dc2626'; g.lineWidth = 5; g.setLineDash([18, 10]); g.beginPath(); g.moveTo(x - 40, y); g.lineTo(x + 40, y); g.stroke(); g.setLineDash([]) }, '작업반경 — 출입 금지'],
      [(g, x, y) => 빗금(g, x - 40, y - 20, 80, 40, '#6b7280', 'rgba(107,114,128,.16)'), '철판 깔기 — 지내력 확인'],
      [(g, x, y) => 받침(g, [[x - 20, y], [x + 20, y]]), '아웃트리거 받침판'],
      [(g, x, y) => 신호수(g, x, y, ''), '신호수 · 유도로프'],
    ], ['인양물 아래 출입 금지'])
  } },
  /* 🦺 G538 «4) 항타·항발기 배치 위치 및 이동 경로» — 흙막이(H-pile) 선 따라 ① → ④ · 전도 위험 구역 · 작업 지반 */
  '장비 배치 · 항타·항발기': { w: 2160, h: 880, 표: 880, 끝y: 792, 그리기: (g, w, h) => {
    장비대지(g, w, h, false)
    g.fillStyle = 'rgba(107,114,128,.16)'; g.beginPath(); g.rect(480, 150, 600, 530); g.rect(530, 190, 500, 440); g.fill('evenodd')
    g.save(); g.beginPath(); g.rect(480, 150, 600, 530); g.rect(530, 190, 500, 440); g.clip('evenodd'); g.strokeStyle = 'rgba(107,114,128,.55)'; g.lineWidth = 3
    for (let i = -600; i < 1200; i += 18) { g.beginPath(); g.moveTo(480 + i, 680); g.lineTo(480 + i + 530, 150); g.stroke() }
    g.restore()
    g.strokeStyle = '#92400e'; g.lineWidth = 8; g.strokeRect(530, 190, 500, 440)
    g.fillStyle = '#92400e'
    for (let x = 550; x < 1030; x += 40) { g.fillRect(x - 5, 184, 10, 12); g.fillRect(x - 5, 624, 10, 12) }
    for (let y = 210; y < 630; y += 40) { g.fillRect(524, y - 5, 12, 10); g.fillRect(1024, y - 5, 12, 10) }
    g.strokeStyle = '#2563eb'; g.lineWidth = 5; g.setLineDash([16, 10]); g.strokeRect(505, 168, 550, 488); g.setLineDash([])
    화살(g, [[505, 470], [505, 400]], '#2563eb', 6); 화살(g, [[740, 168], [820, 168]], '#2563eb', 6)
    화살(g, [[1055, 380], [1055, 450]], '#2563eb', 6); 화살(g, [[820, 656], [740, 656]], '#2563eb', 6)
    for (const [t, x, y] of [['1', 505, 560], ['2', 640, 168], ['3', 1055, 260], ['4', 940, 656]]) {
      g.fillStyle = '#ffffff'; g.strokeStyle = '#1d4ed8'; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 21, 0, Math.PI * 2); g.fill(); g.stroke()
      쓰기(g, t, x, y + 10, 28, '#1d4ed8')
    }
    화살(g, [[450, 840], [450, 700], [505, 700], [505, 664]], '#2563eb', 8)
    점선원(g, 470, 300, 150, '#dc2626')
    g.fillStyle = '#374151'; g.fillRect(420, 268, 80, 12); g.fillRect(420, 320, 80, 12)
    장비몸(g, 425, 278, 70, 44)
    g.fillStyle = '#1f2937'; g.fillRect(512, 286, 30, 28)
    쓰기(g, '항타기', 415, 205, 22, '#1f2937', true, 'right')
    범례(g, [
      [(g, x, y) => { 장비몸(g, x - 40, y - 16, 56, 32); g.fillStyle = '#1f2937'; g.fillRect(x + 22, y - 12, 22, 24) }, '항타·항발기 — H-pile 박기 · 뽑기'],
      [(g, x, y) => { g.strokeStyle = '#92400e'; g.lineWidth = 8; g.beginPath(); g.moveTo(x - 40, y); g.lineTo(x + 40, y); g.stroke() }, '흙막이 선(H-pile 자리)'],
      [(g, x, y) => 화살(g, [[x - 40, y], [x + 34, y]], '#2563eb', 6), '이동 경로 — 출입구 → ① → ② → ③ → ④'],
      [(g, x, y) => { g.strokeStyle = '#dc2626'; g.lineWidth = 5; g.setLineDash([18, 10]); g.beginPath(); g.moveTo(x - 40, y); g.lineTo(x + 40, y); g.stroke(); g.setLineDash([]) }, '전도 위험 구역 — 출입 금지'],
      [(g, x, y) => 빗금(g, x - 40, y - 20, 80, 40, 'rgba(107,114,128,.55)', 'rgba(107,114,128,.16)'), '작업 지반 — 쇄석 깔기 · 다짐 · 철판', '경사 · 지내력 확인 뒤 이동'],
    ], ['매설물 확인 뒤 박기(시험굴)'])
  } },
}
const png = (c) => new Promise((ok, no) => c.toBlob((b) => (b ? b.arrayBuffer().then((a) => ok(new Uint8Array(a)), no) : no(new Error('그림을 만들지 못했습니다'))), 'image/png'))
/** 예시 그림 한 장 — 종류: '공사장 위치도' · '방음 · 방진시설 배치'(없는 종류면 null) */
export async function 예시그림파일(종류) {
  const s = 그림장면[종류]
  if (!s) return null
  const c = 캔버스(s.w, s.h)
  const g = c.getContext('2d')
  s.그리기(g, s.w, s.h)
  이름표(g, s.w, s.h, `예시 · ${종류}`, 'K-건설맵 예시 그림', s.표, s.끝y)
  return new File([await png(c)], `예시_${종류.replace(/[ ·]+/g, '_')}.png`, { type: 'image/png' })
}
/** 사진 칸 머리글 → 맞는 예시 그림 종류(현장 사진이면 null) — 격자작성.jsx «✍ 예시 채우기»
 *  위치도: 머리글에 세륜 · 방진벽이 있으면(비산먼지 신고서) 신축 그림 · 아니면(특정공사) 내부 철거 그림 / 세륜 · 비산 배치 도면 → 비산먼지 억제시설 그림
 *  🦺 G538 «… 배치 위치 및 작업구간 · 이동 경로»(공사안전보건대장) → 장비 배치 그림 네 가지(타워크레인 · 펌프카 · 이동식크레인 · 항타·항발기) */
export function 그림종류(머리) {
  const t = String(머리 || '')
  /* 🦺 G538 공사안전보건대장 «3.» 네 칸 — 머리글 «… 배치 위치 및 작업구간 · 이동 경로» 의 장비 이름으로 */
  if (/배치 위치 및/.test(t)) {
    if (/타워\s*크레인/.test(t)) return '장비 배치 · 타워크레인'
    if (/펌프\s*카/.test(t)) return '장비 배치 · 콘크리트 펌프카'
    if (/이동식\s*크레인/.test(t)) return '장비 배치 · 이동식크레인'
    if (/항타|항발/.test(t)) return '장비 배치 · 항타·항발기'
  }
  if (/위\s*치\s*도|지도/.test(t)) return /세륜|방진벽/.test(t) ? '공사장 위치도 · 신축' : '공사장 위치도'
  if (/세륜|비산/.test(t)) return '비산먼지 억제시설 배치'
  if (/(방음|방진).*(배치|도면)|(배치|도면).*(방음|방진)/.test(t)) return '방음 · 방진시설 배치'
  return null
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
