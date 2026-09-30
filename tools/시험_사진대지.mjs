/**
 * 시험 — 📷 사진대지 · 🧾 영수증 정리 (2026-09-30)
 *   node tools/시험_사진대지.mjs   (web/node_modules 가 있어야 함 · 지어낸 그림만 씀)
 *   OUT=폴더 를 주면 만든 PDF · 엑셀 · 한글 · 워드를 그 폴더에 둡니다(눈으로 보기 · 리브레오피스 · 한글로 열어 보기).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createCanvas } from '../web/node_modules/@napi-rs/canvas/index.js'
import { unzipSync, strFromU8 } from '../web/node_modules/fflate/esm/index.mjs'
import { exif읽기, 이름설명, 정렬하기, 표시하기, 사진대지쪽들, 지문, 지문거리, 선명도, 칸값, 기본설정, 항목꼴들 } from '../web/src/lib/사진정리.js'
import { 격자로, 글맞춤, 공통가로 } from '../web/src/lib/쪽문서.js'
import { 쪽들PDF, 환경 as pdf환경 } from '../web/src/lib/쪽pdf.js'
import { 쪽들워드 } from '../web/src/lib/쪽워드.js'
import { 쪽들한글 } from '../web/src/lib/쪽한글.js'
import { 엑셀책, 쪽들시트 } from '../web/src/lib/쪽엑셀.js'
import { 영수증찾기, 과목추천, 금액읽기, 한글금액, 날짜고르기, 모으기, 영수증쪽들, 영수증수식시트들 } from '../web/src/lib/영수증.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
pdf환경.글꼴 = new Uint8Array(fs.readFileSync(path.join(여기, '../web/public/fonts/KCMGothic.ttf')))
const OUT = process.env.OUT || ''
if (OUT) fs.mkdirSync(OUT, { recursive: true })

let 통과 = 0, 실패 = 0
const 확인 = (이름, 참, 더 = '') => { if (참) { 통과++; console.log('  ✔', 이름) } else { 실패++; console.log('  ✘', 이름, 더) } }

/* ── 지어낸 JPEG (+ EXIF) ── */
function jpeg(w, h, 칠) {
  const c = createCanvas(w, h)
  const g = c.getContext('2d')
  칠(g, w, h)
  return new Uint8Array(c.toBuffer('image/jpeg', 85))
}
function exif붙이기(jpg, { 때 = '', 방향 = 0 } = {}) {
  /* 작은쪽(II) TIFF — IFD0: Orientation · ExifIFD 포인터 / ExifIFD: DateTimeOriginal */
  const 항 = []
  if (방향) 항.push([0x0112, 3, 1, 방향])
  항.push([0x8769, 4, 1, 0])
  const ifd0 = 8, ifd0크기 = 2 + 항.length * 12 + 4
  const exifIfd = ifd0 + ifd0크기
  const 글자리 = exifIfd + 2 + 12 + 4
  const 글 = new TextEncoder().encode(때.padEnd(19, ' ').slice(0, 19) + '\0')
  const b = new Uint8Array(글자리 + 글.length)
  const v = new DataView(b.buffer)
  b.set([0x49, 0x49]); v.setUint16(2, 42, true); v.setUint32(4, 8, true)
  v.setUint16(ifd0, 항.length, true)
  항.forEach(([t, ty, n, val], i) => {
    const e = ifd0 + 2 + i * 12
    v.setUint16(e, t, true); v.setUint16(e + 2, ty, true); v.setUint32(e + 4, n, true)
    if (t === 0x8769) v.setUint32(e + 8, exifIfd, true); else v.setUint16(e + 8, val, true)
  })
  v.setUint32(ifd0 + 2 + 항.length * 12, 0, true)
  v.setUint16(exifIfd, 1, true)
  v.setUint16(exifIfd + 2, 0x9003, true); v.setUint16(exifIfd + 4, 2, true); v.setUint32(exifIfd + 6, 20, true); v.setUint32(exifIfd + 10, 글자리, true)
  v.setUint32(exifIfd + 14, 0, true)
  b.set(글, 글자리)
  const app1 = new Uint8Array(4 + 6 + b.length)
  app1[0] = 0xff; app1[1] = 0xe1
  new DataView(app1.buffer).setUint16(2, 2 + 6 + b.length)
  app1.set([0x45, 0x78, 0x69, 0x66, 0, 0], 4)
  app1.set(b, 10)
  const out = new Uint8Array(jpg.length + app1.length)
  out.set(jpg.slice(0, 2)); out.set(app1, 2); out.set(jpg.slice(2), 2 + app1.length)
  return out
}

console.log('① 사진 속 정보 · 이름')
{
  const j = exif붙이기(jpeg(64, 48, (g) => { g.fillStyle = '#884'; g.fillRect(0, 0, 64, 48) }), { 때: '2026:09:01 09:10:05', 방향: 6 })
  const e = exif읽기(j)
  확인('찍은 때', e.때 === '2026-09-01 09:10:05', e.때)
  확인('방향', e.방향 === 6, e.방향)
  확인('EXIF 없음 → 빈 때', exif읽기(jpeg(8, 8, () => {})).때 === '')
  확인('JPEG 아님 → 빈 때', exif읽기(new Uint8Array([1, 2, 3, 4, 5])).때 === '')
  const 이름들 = {
    '03_터파기 전경.jpg': '터파기 전경', 'IMG_20260901_101500.jpg': '', 'KakaoTalk_20260903_120000123.jpg': '',
    '관 부설(2).JPG': '관 부설', 'DSC01234.JPG': '', '2026-09-01 철근 배근 검측.jpeg': '철근 배근 검측', 'P1010123.jpg': '',
    '사진 3.png': '', 'Screenshot_20260930-101010.png': '', '1.jpg': '',
  }
  for (const [n, 기대] of Object.entries(이름들)) 확인(`이름설명 「${n}」`, 이름설명(n) === 기대, `→ 「${이름설명(n)}」`)
}

console.log('② 차례 · 흐림 · 닮음')
{
  const 회 = (w, h, f) => { const a = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) a[y * w + x] = f(x, y); return a }
  const 선명 = 선명도(회(80, 60, (x, y) => ((x >> 2) + (y >> 2)) % 2 ? 230 : 20), 80, 60)
  const 흐림 = 선명도(회(80, 60, (x) => 100 + x), 80, 60)
  확인('선명도: 무늬 ≫ 밋밋', 선명 > 1000 && 흐림 < 10, `${선명} / ${흐림}`)
  const a = 지문(회(9, 8, (x, y) => (x * 17 + y * 29) % 255))
  const b = 지문(회(9, 8, (x, y) => ((x * 17 + y * 29) % 255) + (x === 3 && y === 3 ? 1 : 0)))
  const c = 지문(회(9, 8, (x, y) => 255 - ((x * 31 + y * 7) % 255)))
  확인('지문 거의 같음', 지문거리(a, b) <= 2, 지문거리(a, b))
  확인('지문 다름', 지문거리(a, c) > 10, 지문거리(a, c))
  const 사진 = [
    { id: 'a', 이름: 'b.jpg', 때: '2026-09-02 08:00:00', 선명: 300, 밝기: 120, 지문: a },
    { id: 'b', 이름: 'a.jpg', 때: '2026-09-01 10:00:00', 선명: 20, 밝기: 120, 지문: c },
    { id: 'c', 이름: 'c.jpg', 때: '', 파일때: Date.parse('2026-09-01T00:30:00Z'), 선명: 300, 밝기: 20, 지문: a },
    { id: 'd', 이름: 'd.jpg', 때: '2026-09-02 08:00:01', 선명: 300, 밝기: 120, 지문: b },
  ]
  const 차 = 정렬하기(사진, '때').map((p) => p.id).join('')
  확인('찍은 때 차례(파일 시각은 한국 시각으로)', 차 === 'cbad', 차)
  const 표 = 표시하기(정렬하기(사진, '때'))
  확인('흐림 표시', (표.get('b') || []).includes('흐림'))
  확인('어둠 표시', (표.get('c') || []).includes('어둠'))
  확인('닮음 표시(바로 앞과)', (표.get('d') || []).includes('닮음'))
  확인('일자 칸 = 찍은 날', 칸값(사진[0], 'd', 기본설정) === '2026.09.02')
  확인('내용 칸 = 파일 이름 설명', 칸값({ 이름: '07_콘크리트 타설.jpg', 값: {} }, 'n', 기본설정) === '콘크리트 타설')
  확인('적은 값이 먼저', 칸값({ 이름: '07_콘크리트 타설.jpg', 값: { n: '고친 글' } }, 'n', 기본설정) === '고친 글')
}

/* ── 쪽 검사: 칸이 안에 · 서로 안 겹침 · 격자가 모두 한 번씩 덮음 ── */
function 쪽검사(이름, 쪽) {
  const 안 = 쪽.안
  const 밖 = 쪽.칸들.filter((k) => k.x < 안.x - 0.01 || k.y < 안.y - 0.01 || k.x + k.w > 안.x + 안.w + 0.01 || k.y + k.h > 안.y + 안.h + 0.01)
  확인(`${이름}: 칸이 여백 안`, !밖.length, JSON.stringify(밖[0] || {}))
  let 겹 = 0
  for (let i = 0; i < 쪽.칸들.length; i++) for (let j = i + 1; j < 쪽.칸들.length; j++) {
    const a = 쪽.칸들[i], b = 쪽.칸들[j]
    if (Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.3 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.3) 겹++
  }
  확인(`${이름}: 칸끼리 안 겹침`, !겹, 겹)
  const g = 격자로(쪽)
  const 덮 = Array.from({ length: g.줄.length }, () => new Array(g.열.length).fill(0))
  for (const p of g.칸) for (let r = p.r; r < p.r + p.rs; r++) for (let c = p.c; c < p.c + p.cs; c++) 덮[r][c]++
  확인(`${이름}: 격자 모든 자리 한 번씩`, 덮.every((줄) => 줄.every((v) => v === 1)))
  확인(`${이름}: 격자 넓이 = 안`, Math.abs(g.열.reduce((a, b) => a + b, 0) - 안.w) < 0.01 && Math.abs(g.줄.reduce((a, b) => a + b, 0) - 안.h) < 0.01)
  const 그린칸 = 쪽.칸들.filter((k) => k.w > 0.3 && k.h > 0.3).length
  확인(`${이름}: 모든 칸이 격자에`, g.칸.filter((p) => p.칸).length === 그린칸, `${g.칸.filter((p) => p.칸).length}/${그린칸}`)
  확인(`${이름}: 죽은 줄 없음`, g.줄.every((_, r) => g.칸.some((p) => p.r === r)))
  return g
}

console.log('③ 사진대지 쪽')
const 가짜사진 = Array.from({ length: 7 }, (_, i) => ({
  id: 'p' + i, 이름: ['03_터파기 전경.jpg', 'IMG_1.jpg', 'IMG_2.jpg', '관 부설.jpg', 'IMG_4.jpg', '철근 배근.jpg', 'IMG_6.jpg'][i],
  때: `2026-09-0${1 + Math.floor(i / 3)} 0${i}:00:00`, 너비: i === 4 ? 1200 : 1600, 높이: i === 4 ? 1600 : 1200, 값: i === 1 ? { n: '아주 긴 설명 '.repeat(12), p: '○○리 산 12-3 일원' } : {},
}))
const 그림들 = new Map()
const 그림하나 = (w, h, 색) => ({ 바이트: jpeg(w, h, (g) => { g.fillStyle = 색; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.fillRect(w * 0.1, h * 0.1, w * 0.3, h * 0.2) }), w, h })
for (const 한쪽에 of [1, 2, 3, 4, 6, 8]) {
  const { 쪽들, 그림요청 } = 사진대지쪽들(가짜사진, { ...기본설정, 한쪽에, 공사명: '○○지구 배수로 정비공사', 위치: '○○리 일원', 결재: ['담당', '대리인', '감독'] })
  확인(`${한쪽에}장씩 → ${Math.ceil(7 / 한쪽에)}쪽`, 쪽들.length === Math.ceil(7 / 한쪽에), 쪽들.length)
  확인(`${한쪽에}장씩: 그림 ${7}장 요청`, 그림요청.size === 7)
  쪽검사(`세로 ${한쪽에}장`, 쪽들[0])
}
for (const 한쪽에 of [2, 4, 6]) {
  const { 쪽들 } = 사진대지쪽들(가짜사진, { ...기본설정, 한쪽에, 용지: '가로', 항목줄: 항목꼴들['일자·공종·위치 / 내용 / 비고'] })
  확인(`가로 ${한쪽에}장: 쪽 크기`, 쪽들[0].폭 === 297 && 쪽들[0].높이 === 210)
  쪽검사(`가로 ${한쪽에}장`, 쪽들[0])
}
{
  const { 쪽들 } = 사진대지쪽들(가짜사진, { ...기본설정, 한쪽에: 2, 날짜쪽: true })
  /* 9/1: 3장 → 2+1 · 9/2: 3장 → 2+1 · 9/3: 1장 */
  확인('날짜가 바뀌면 새 쪽', 쪽들.length === 5, 쪽들.length)
  const r = 사진대지쪽들(가짜사진, { ...기본설정, 한쪽에: 2, 비교: true, 맞춤: '채움' })
  확인('전·후 비교: 7장 → 4짝 → 2쪽', r.쪽들.length === 2, r.쪽들.length)
  확인('채움: 칸 비율로 자른 그림 요청', [...r.그림요청.values()].every((x) => x.비율 > 0.5 && x.비율 < 3))
  쪽검사('전·후 비교', r.쪽들[0])
  const 마지막 = r.쪽들[1].칸들.filter((k) => k.테 && !k.글 && !k.그림 && k.h > 30)
  확인('짝 없는 마지막 «후» 는 빈 칸', 마지막.length === 1)
  const 긴 = 글맞춤('아주 긴 설명 '.repeat(12), 80, 7.5, 9)
  확인('긴 글 → 줄이거나 나눠 칸 안에', 긴.줄들.length * 긴.크기 * 0.3528 * 1.22 <= 7.5, JSON.stringify(긴))
}

console.log('④ 영수증')
{
  확인('한글 금액 123,000', 한글금액(123000) === '일십이만삼천', 한글금액(123000))
  확인('한글 금액 1,005,000,000', 한글금액(1005000000) === '일십억오백만', 한글금액(1005000000))
  확인('한글 금액 72,000', 한글금액(72000) === '칠만이천')
  확인('금액 읽기', 금액읽기('55,000원') === 55000 && 금액읽기('₩ 7,500') === 7500 && 금액읽기('5만5천') === 55000 && 금액읽기('') === 0)
  확인('날짜 고르기', 날짜고르기('2026-9-3') === '2026.09.03' && 날짜고르기('26.09.04') === '2026.09.04' && 날짜고르기('9/5', 2026) === '2026.09.05')
  const 과 = { 'GS칼텍스 셀프주유소': '유류비', '원조 국밥': '식대', '스타벅스 ○○점': '식대', '○○철물': '소모품비', '한국도로공사': '교통비', 'CJ대한통운': '운반비', '○○레미콘': '자재비', '○○약국': '복리후생비', '이마트24': '식대', '알 수 없음': '' }
  for (const [s, 기대] of Object.entries(과)) 확인(`과목 추천 「${s}」`, 과목추천(s) === 기대, 과목추천(s))

  const 스캔 = (w, h, 바탕, 영수증들) => {
    const c = createCanvas(w, h)
    const g = c.getContext('2d')
    g.fillStyle = 바탕; g.fillRect(0, 0, w, h)
    for (const [x, y, rw, rh] of 영수증들) {
      g.fillStyle = '#fafafa'; g.fillRect(x, y, rw, rh)
      g.strokeStyle = '#d8d8d8'; g.strokeRect(x, y, rw, rh)
      g.fillStyle = '#222'
      for (let k = 0; k < rh / 22 - 2; k++) if (k % 5 !== 3) g.fillRect(x + 12, y + 14 + k * 22, rw * (0.4 + ((k * 37) % 50) / 100), 8)
    }
    const d = g.getImageData(0, 0, w, h).data
    const gray = new Uint8Array(w * h)
    for (let i = 0; i < gray.length; i++) gray[i] = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000
    return gray
  }
  const 흰 = 영수증찾기(스캔(800, 566, '#ffffff', [[40, 60, 150, 300], [290, 120, 140, 260], [540, 40, 170, 420]]), 800, 566)
  확인('흰 바탕 스캔 → 3장', 흰.length === 3, JSON.stringify(흰))
  확인('왼쪽부터 차례', 흰.length === 3 && 흰[0].x < 흰[1].x && 흰[1].x < 흰[2].x)
  const 어 = 영수증찾기(스캔(800, 600, '#2c2826', [[80, 100, 200, 380], [420, 120, 220, 330]]), 800, 600)
  확인('어두운 바탕 사진 → 2장', 어.length === 2, JSON.stringify(어))
  const 한 = 영수증찾기(스캔(400, 700, '#ffffff', [[5, 5, 390, 690]]), 400, 700)
  확인('영수증 한 장이 꽉 차면 → 1장', 한.length === 1, JSON.stringify(한))
  const 두줄 = 영수증찾기(스캔(800, 800, '#ffffff', [[60, 40, 250, 300], [450, 40, 250, 300], [60, 450, 250, 300], [450, 450, 250, 300]]), 800, 800)
  확인('2×2 → 4장 · 위 줄 먼저', 두줄.length === 4 && 두줄[0].y < 0.2 && 두줄[1].y < 0.2 && 두줄[2].y > 0.4, JSON.stringify(두줄))
}

const 목록 = Array.from({ length: 33 }, (_, i) => ({
  id: 'r' + i, 일자: `2026.09.${String(1 + (i % 28)).padStart(2, '0')}`, 사용처: ['GS칼텍스', '원조국밥', '○○철물'][i % 3],
  과목: ['유류비', '식대', '소모품비'][i % 3], 금액: [72000, 54000, 23500][i % 3], 결제: '카드', 그림: 'r' + i,
}))
{
  const 합 = 모으기(목록)
  확인('과목별 합계', 합.과목별.length === 3 && 합.모두 === 11 * (72000 + 54000 + 23500), 합.모두)
  확인('기간', 합.기간 === '2026.09.01 ~ 2026.09.28', 합.기간)
  const { 쪽들 } = 영수증쪽들(목록, { 공사명: '○○공사', 증빙한쪽에: 4 })
  /* 결의서 1 + 명세 2(28줄씩) + 증빙 9(4장씩) */
  확인('영수증 쪽 수 = 1 + 2 + 9', 쪽들.length === 12, 쪽들.length)
  쪽들.slice(0, 4).forEach((쪽, i) => 쪽검사(`영수증 ${i + 1}쪽`, 쪽))
  const [명세, 과] = 영수증수식시트들(목록, {})
  const 합칸 = 명세.칸들.find((k) => k.수식 && k.수식.startsWith('SUM'))
  확인('지출명세 합계 = SUM 수식 + 값', 합칸 && 합칸.수식 === 'SUM(F4:F36)' && 합칸.값 === 합.모두, 합칸 && 합칸.수식)
  확인('과목별 = SUMIF', 과.칸들.some((k) => /^SUMIF\(지출명세!\$C\$4:\$C\$36,A4,지출명세!\$F\$4:\$F\$36\)$/.test(k.수식 || '')), 과.칸들.filter((k) => k.수식).map((k) => k.수식).join(' | '))
}

console.log('⑤ 파일 쓰기 — PDF · 워드 · 한글 · 엑셀')
{
  const { 쪽들, 그림요청 } = 사진대지쪽들(가짜사진, { ...기본설정, 한쪽에: 2, 공사명: '○○지구 배수로 정비공사', 위치: '○○리 일원', 결재: ['담당', '소장'] })
  for (const [열쇠, x] of 그림요청) {
    const p = 가짜사진.find((q) => q.id === x.id)
    그림들.set(열쇠, 그림하나(p.너비 / 4, p.높이 / 4, ['#8a6', '#68a', '#a86', '#6aa'][그림들.size % 4]))
  }
  const pdf = await 쪽들PDF(쪽들, 그림들, { 제목: '사진대지' })
  확인('PDF 만들어짐', pdf.length > 5000 && String.fromCharCode(...pdf.slice(0, 5)) === '%PDF-', pdf.length)
  const docx = 쪽들워드(쪽들, 그림들, { 제목: '사진대지' })
  const dz = unzipSync(docx)
  확인('워드: 본문 · 그림 7', !!dz['word/document.xml'] && Object.keys(dz).filter((k) => k.startsWith('word/media/')).length === 7)
  const 본문 = strFromU8(dz['word/document.xml'])
  확인('워드: 쪽 나눔 3', (본문.match(/<w:pageBreakBefore\/>/g) || []).length === 3)
  확인('워드: 공사명 들어감', 본문.includes('○○지구 배수로 정비공사'))
  const hwpx = 쪽들한글(쪽들, 그림들, { 제목: '사진대지' })
  const hz = unzipSync(hwpx)
  const 첫이름 = new TextDecoder().decode(hwpx.slice(30, 30 + 8))
  확인('한글: 맨 앞 mimetype · 압축 안 함', 첫이름 === 'mimetype' && hwpx[8] === 0 && strFromU8(hz.mimetype) === 'application/hwp+zip')
  const 섹 = strFromU8(hz['Contents/section0.xml'])
  확인('한글: 표 4개(쪽마다) · 쪽 나눔 3', (섹.match(/<hp:tbl /g) || []).length === 4 && (섹.match(/pageBreak="1"/g) || []).length === 3)
  확인('한글: 사진 7 · 목록에 7', (섹.match(/<hp:pic /g) || []).length === 7 && (strFromU8(hz['Contents/content.hpf']).match(/isEmbeded="1"/g) || []).length === 7)
  const 머 = strFromU8(hz['Contents/header.xml'])
  const 쓴테 = [...섹.matchAll(/borderFillIDRef="(\d+)"/g)].map((m) => m[1])
  const 있는테 = new Set([...머.matchAll(/<hh:borderFill id="(\d+)"/g)].map((m) => m[1]))
  확인('한글: 쓴 테두리 번호가 머리에 다 있음', 쓴테.every((i) => 있는테.has(i)))
  const 쓴글 = [...섹.matchAll(/charPrIDRef="(\d+)"/g)].map((m) => m[1])
  const 있는글 = new Set([...머.matchAll(/<hh:charPr id="(\d+)"/g)].map((m) => m[1]))
  확인('한글: 쓴 글자 모양 번호가 머리에 다 있음', 쓴글.every((i) => 있는글.has(i)))
  const 개수맞음 = [...머.matchAll(/<hh:(borderFills|charProperties|paraProperties) itemCnt="(\d+)">/g)].every((m) => {
    const 이름 = { borderFills: 'borderFill', charProperties: 'charPr', paraProperties: 'paraPr' }[m[1]]
    return (머.match(new RegExp(`<hh:${이름} id=`, 'g')) || []).length === +m[2]
  })
  확인('한글: itemCnt = 실제 개수', 개수맞음)
  const 행열 = [...섹.matchAll(/<hp:tbl [^>]*rowCnt="(\d+)" colCnt="(\d+)"/g)]
  확인('한글: 표마다 칸 주소가 행 · 열 수 안', 행열.length === 4)
  const 시트 = 쪽들시트(쪽들, 그림들, '사진대지')
  const xlsx = 엑셀책([시트], 그림들)
  const xz = unzipSync(xlsx)
  확인('엑셀: 그림 7 · 쪽 나눔 3', Object.keys(xz).filter((k) => k.startsWith('xl/media/')).length === 7 && (strFromU8(xz['xl/worksheets/sheet1.xml']).match(/<brk /g) || []).length === 3)
  확인('엑셀: 공통 가로 경계', 공통가로(쪽들).length - 1 === 시트.열너비.length)
  if (OUT) {
    fs.writeFileSync(path.join(OUT, '사진대지.pdf'), pdf)
    fs.writeFileSync(path.join(OUT, '사진대지.docx'), docx)
    fs.writeFileSync(path.join(OUT, '사진대지.hwpx'), hwpx)
    fs.writeFileSync(path.join(OUT, '사진대지.xlsx'), xlsx)
  }
  /* 영수증 */
  const 영 = new Map(목록.map((r, i) => [r.그림, 그림하나(300 + (i % 3) * 40, 520, '#eee')]))
  const { 쪽들: 영쪽 } = 영수증쪽들(목록, { 공사명: '○○공사', 작성자: '홍길동', 작성일: '2026.09.30' })
  const 영pdf = await 쪽들PDF(영쪽, 영, { 제목: '지출결의서' })
  확인('영수증 PDF', 영pdf.length > 5000)
  const 영xlsx = 엑셀책([...영수증수식시트들(목록, { 공사명: '○○공사' }), 쪽들시트(영쪽, 영, '인쇄용')], 영)
  const 영z = unzipSync(영xlsx)
  확인('영수증 엑셀 시트 3 · 그림 33', Object.keys(영z).filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k)).length === 3 && Object.keys(영z).filter((k) => k.startsWith('xl/media/')).length === 33)
  if (OUT) {
    fs.writeFileSync(path.join(OUT, '영수증.pdf'), 영pdf)
    fs.writeFileSync(path.join(OUT, '영수증.xlsx'), 영xlsx)
    fs.writeFileSync(path.join(OUT, '영수증.hwpx'), 쪽들한글(영쪽, 영, { 제목: '지출결의서' }))
    fs.writeFileSync(path.join(OUT, '영수증.docx'), 쪽들워드(영쪽, 영, { 제목: '지출결의서' }))
    const 가로 = 사진대지쪽들(가짜사진, { ...기본설정, 한쪽에: 4, 용지: '가로', 비교: false })
    const 가그림 = new Map()
    for (const [열쇠, x] of 가로.그림요청) { const p = 가짜사진.find((q) => q.id === x.id); 가그림.set(열쇠, 그림하나(p.너비 / 4, p.높이 / 4, '#79a')) }
    fs.writeFileSync(path.join(OUT, '가로4.hwpx'), 쪽들한글(가로.쪽들, 가그림, {}))
    fs.writeFileSync(path.join(OUT, '가로4.docx'), 쪽들워드(가로.쪽들, 가그림, {}))
    fs.writeFileSync(path.join(OUT, '가로4.xlsx'), 엑셀책([쪽들시트(가로.쪽들, 가그림)], 가그림))
    fs.writeFileSync(path.join(OUT, '가로4.pdf'), await 쪽들PDF(가로.쪽들, 가그림, {}))
  }
}

console.log(`\n${실패 ? '✘' : '✔'} 통과 ${통과} · 실패 ${실패}`)
process.exit(실패 ? 1 : 0)
