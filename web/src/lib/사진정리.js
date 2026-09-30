/**
 * 📷 사진대지 — 사진 읽기 · 자동 정리 · 쪽 짓기 (2026-09-30)
 *
 * 소장님: imgsheet(사진대지 · 영수증 — AI 정리, PDF 만 무료) 캡처 → 「아이디어 더 해서 만들어줘. 프로그램으로」
 *
 * ■ AI 없이 «규칙» 으로 정리합니다 — 돈이 안 들고, 사진이 어디에도 올라가지 않습니다(브라우저 안에서만).
 *   · 찍은 날짜 · 시각(사진 속 EXIF)으로 차례 → 날짜가 바뀌면 새 쪽(고를 수 있음)
 *   · 흐린 사진(윤곽 선명도) · 거의 같은 사진(연속 촬영 — 작은 그림 지문) · 너무 어두운 사진 표시 → 한 번에 빼기
 *   · 파일 이름에 적힌 설명(「터파기 전경.jpg」)을 내용 칸에
 *   · 현장 문구 모음(공종별) · 아래로 모두 같게 · 일자는 찍은 날 그대로
 * ■ 쪽은 쪽문서.js 의 «mm 칸» 으로 짓습니다 — 화면 · PDF · 엑셀 · 한글 · 워드가 같은 모양.
 */

/* ══════════════════════ 사진 속 정보(EXIF) ══════════════════════ */

/** @returns { 때: 'YYYY-MM-DD HH:MM:SS' | '', 방향: 1~8, 기종: '' } */
export function exif읽기(바이트들) {
  const 결과 = { 때: '', 방향: 1, 기종: '' }
  try {
    const b = 바이트들 instanceof Uint8Array ? 바이트들 : new Uint8Array(바이트들)
    const v = new DataView(b.buffer, b.byteOffset, b.byteLength)
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return 결과
    let p = 2
    while (p + 4 < v.byteLength) {
      if (v.getUint8(p) !== 0xff) break
      const 표 = v.getUint8(p + 1)
      if (표 === 0xd8 || (표 >= 0xd0 && 표 <= 0xd7)) { p += 2; continue }
      const 길이 = v.getUint16(p + 2)
      if (표 === 0xe1 && v.getUint32(p + 4) === 0x45786966) {
        const tiff = p + 10
        const 작 = v.getUint16(tiff) === 0x4949
        const u16 = (o) => v.getUint16(o, 작)
        const u32 = (o) => v.getUint32(o, 작)
        const 글 = (e, n) => {
          const 개 = Math.min(u32(e + 4), n)
          const off = 개 > 4 ? tiff + u32(e + 8) : e + 8
          let s = ''
          for (let k = 0; k < 개 && off + k < v.byteLength; k++) {
            const c = v.getUint8(off + k)
            if (!c) break
            s += String.fromCharCode(c)
          }
          return s.trim()
        }
        const 읽표 = (ifd, 할) => {
          if (ifd <= tiff || ifd + 2 > v.byteLength) return
          const n = u16(ifd)
          for (let i = 0; i < n && i < 400; i++) {
            const e = ifd + 2 + i * 12
            if (e + 12 > v.byteLength) break
            할(u16(e), e)
          }
        }
        let exifIfd = 0
        let 원때 = '', 그냥때 = ''
        읽표(tiff + u32(tiff + 4), (tag, e) => {
          if (tag === 0x0112) 결과.방향 = u16(e + 8) || 1
          else if (tag === 0x0110) 결과.기종 = 글(e, 40)
          else if (tag === 0x0132) 그냥때 = 글(e, 19)
          else if (tag === 0x8769) exifIfd = tiff + u32(e + 8)
        })
        if (exifIfd) 읽표(exifIfd, (tag, e) => { if (tag === 0x9003) 원때 = 글(e, 19) })
        const m = (원때 || 그냥때).match(/^(\d{4})[:\-.](\d{2})[:\-.](\d{2})[ T](\d{2}):(\d{2}):(\d{2})/)
        if (m && m[1] !== '0000') 결과.때 = `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`
        return 결과
      }
      if (표 === 0xda) break
      p += 2 + 길이
    }
  } catch (e) { /* 없으면 없는 대로 */ }
  return 결과
}

/** 'YYYY-MM-DD…' → 'YYYY.MM.DD' */
export function 날꼴(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}.${m[2]}.${m[3]}` : ''
}

/**
 * 파일 이름에 적힌 설명 — 카메라가 붙인 이름(IMG_1234 · DSC · KakaoTalk_… · 날짜 숫자)은 버립니다.
 *   「03_터파기 전경.jpg」 → 「터파기 전경」 · 「IMG_20260930_101010.jpg」 → ''
 */
export function 이름설명(이름) {
  let s = String(이름 || '').replace(/\.[a-z0-9]{2,5}$/i, '')
  s = s.replace(/^(IMG|DSC|DSCN|DSCF|PXL|MVIMG|KakaoTalk|Screenshot|스크린샷|사진|Photo|image|P)[_\-\s]*/i, '')
  s = s.replace(/\b(19|20)\d{2}[-_.]?\d{2}[-_.]?\d{2}([-_ ]?\d{2}[-_.]?\d{2}[-_.]?\d{2})?(\d{3})?\b/g, ' ')
  s = s.replace(/^[\d\s_\-().#]+/, '').replace(/[_]+/g, ' ').replace(/\s*\(\d+\)\s*$/, '').replace(/\s+/g, ' ').trim()
  if (!/[가-힣A-Za-z]/.test(s)) return ''
  if (/^[A-Za-z]{0,4}\d*$/.test(s)) return ''
  return s
}

/* ══════════════════════ 흐림 · 닮음 · 어둠 (작은 회색 그림으로) ══════════════════════ */

/** 선명도 — 라플라시안 분산(작을수록 흐림). gray: Uint8 (w×h) */
export function 선명도(gray, w, h) {
  let n = 0, 합 = 0, 제합 = 0
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const L = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w]
      합 += L; 제합 += L * L; n++
    }
  }
  if (!n) return 0
  const 평 = 합 / n
  return 제합 / n - 평 * 평
}
export function 밝기(gray) {
  let s = 0
  for (let i = 0; i < gray.length; i++) s += gray[i]
  return gray.length ? s / gray.length : 0
}
/** 지문(dHash) — 9×8 회색 → 16자리 16진수 */
export function 지문(g9x8) {
  let s = ''
  for (let y = 0; y < 8; y++) {
    let 값 = 0
    for (let x = 0; x < 8; x++) 값 = (값 << 1) | (g9x8[y * 9 + x] > g9x8[y * 9 + x + 1] ? 1 : 0)
    s += 값.toString(16).padStart(2, '0')
  }
  return s
}
export function 지문거리(a, b) {
  if (!a || !b || a.length !== b.length) return 64
  let d = 0
  for (let i = 0; i < a.length; i += 2) {
    let x = parseInt(a.slice(i, i + 2), 16) ^ parseInt(b.slice(i, i + 2), 16)
    while (x) { d += x & 1; x >>= 1 }
  }
  return d
}

/**
 * 표시 — 흐림(선명도 하위 · 절대 기준) · 닮음(바로 앞 사진과 거의 같음) · 어둠
 * @returns Map(id → ['흐림' | '닮음' | '어둠'])
 */
export function 표시하기(사진들) {
  const 표 = new Map()
  const 붙 = (id, t) => { if (!표.has(id)) 표.set(id, []); 표.get(id).push(t) }
  for (let i = 0; i < 사진들.length; i++) {
    const p = 사진들[i]
    if (typeof p.선명 === 'number' && p.선명 < 45) 붙(p.id, '흐림')
    if (typeof p.밝기 === 'number' && p.밝기 < 38) 붙(p.id, '어둠')
    /* 바로 앞 세 장 안에 거의 같은 사진이 있으면(연속 촬영 사이에 다른 사진이 끼어도) */
    for (let j = Math.max(0, i - 3); j < i; j++) if (지문거리(p.지문, 사진들[j].지문) <= 5) { 붙(p.id, '닮음'); break }
  }
  return 표
}

/** 차례 — '때'(찍은 시각 · 없으면 파일 시각) · '이름' · 그대로 */
export function 정렬하기(사진들, 방식 = '때') {
  const a = [...사진들]
  if (방식 === '이름') a.sort((x, y) => String(x.이름).localeCompare(String(y.이름), 'ko', { numeric: true }))
  else if (방식 === '때') {
    const t = (p) => p.때 || (p.파일때 ? new Date(p.파일때 + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ') : '9999')
    a.sort((x, y) => t(x).localeCompare(t(y)) || String(x.이름).localeCompare(String(y.이름), 'ko', { numeric: true }))
  }
  return a
}

/* ══════════════════════ 현장 문구 모음 ══════════════════════ */
export const 문구모음 = {
  일반: ['공사 전 전경', '공사 중 전경', '공사 후 전경(준공)', '자재 반입', '자재 검수', '장비 투입', '현장 정리 정돈', '측량 및 규준틀 설치'],
  토공: ['터파기 전경', '터파기 완료', '되메우기 및 다짐', '잔토 처리', '성토 다짐', '절토 작업', '흙막이 설치'],
  관로: ['관 부설', '관 접합', '모래 기초', '관로 되메우기', '수압 시험', '맨홀 설치', '관로 준설'],
  철근콘크리트: ['버림 콘크리트 타설', '철근 배근', '철근 배근 검측', '거푸집 설치', '콘크리트 타설', '콘크리트 양생', '거푸집 해체', '슬럼프 시험', '공시체 제작'],
  포장: ['보조기층 포설', '기층 포설', '표층 포설', '택코팅 살포', '롤러 다짐', '보도블록 포설', '경계석 설치', '차선 도색'],
  구조물: ['기초 설치', '옹벽 설치', '배수로 설치', '집수정 설치', '석축 쌓기', '방호벽 설치'],
  안전: ['안전교육 실시', 'TBM(작업 전 안전점검) 실시', '안전시설물 설치', '안전점검', '신호수 배치', '가설 울타리 설치', '살수 작업(비산먼지 억제)'],
  품질: ['현장 시험 시료 채취', '들밀도 시험', '평판재하 시험', '다짐도 시험', '자재 품질 확인'],
}

/* ══════════════════════ 설정 · 항목 ══════════════════════ */
/* 항목 칸 id: d 일자 · p 위치 · n 내용 · g 공종 · m 비고 — 이름은 바꿀 수 있고 값은 id 로 */
export const 항목꼴들 = {
  '일자·위치 / 내용': [[{ id: 'd', 이름: '일자' }, { id: 'p', 이름: '위치' }], [{ id: 'n', 이름: '내용' }]],
  '공종·일자 / 위치 / 내용': [[{ id: 'g', 이름: '공종' }, { id: 'd', 이름: '일자' }], [{ id: 'p', 이름: '위치' }], [{ id: 'n', 이름: '내용' }]],
  '일자 / 내용': [[{ id: 'd', 이름: '일자' }], [{ id: 'n', 이름: '내용' }]],
  '내용만': [[{ id: 'n', 이름: '내용' }]],
  '일자·공종·위치 / 내용 / 비고': [[{ id: 'd', 이름: '일자' }, { id: 'g', 이름: '공종' }, { id: 'p', 이름: '위치' }], [{ id: 'n', 이름: '내용' }], [{ id: 'm', 이름: '비고' }]],
}
export const 기본설정 = {
  제목: '사진대지', 공사명: '', 위치: '', 용지: '세로', 한쪽에: 2,
  항목꼴: '일자·위치 / 내용', 항목줄: 항목꼴들['일자·위치 / 내용'],
  번호: true, 쪽번호: true, 결재: [], 맞춤: '다보임',
  비교: false, 전이름: '시공 전', 후이름: '시공 후',
  날짜쪽: false, 이름을설명: true, 용량: '보통',
}
export const 한쪽에들 = [1, 2, 3, 4, 6, 8]

/** 한 칸의 값 — 적은 값이 없으면: 일자 = 찍은 날 · 내용 = 파일 이름 설명(켜 두면) */
export function 칸값(p, id, 설정) {
  const v = p.값 && p.값[id]
  if (v !== undefined && v !== null) return v
  if (id === 'd') return 날꼴(p.때 || (p.파일때 ? new Date(p.파일때 + 9 * 3600e3).toISOString() : ''))
  if (id === 'n' && 설정 && 설정.이름을설명) return 이름설명(p.이름)
  return ''
}

/** 한 쪽에 들어갈 묶음 — 비교면 두 장이 한 묶음 */
export function 묶음나누기(사진들, 설정) {
  const 단위 = []
  if (설정.비교) {
    for (let i = 0; i < 사진들.length; i += 2) 단위.push(사진들.slice(i, i + 2))
  } else for (const p of 사진들) 단위.push([p])
  const 쪽당 = 설정.비교 ? Math.min(3, Math.max(1, 설정.한쪽에 > 3 ? 3 : 설정.한쪽에)) : 설정.한쪽에
  const 쪽묶 = []
  let 지금 = []
  let 앞날 = null
  for (const u of 단위) {
    const 날 = (u[0].때 || '').slice(0, 10)
    const 새쪽 = u[0].새쪽 || (설정.날짜쪽 && 앞날 !== null && 날 && 날 !== 앞날)
    if (지금.length && (지금.length >= 쪽당 || 새쪽)) { 쪽묶.push(지금); 지금 = [] }
    지금.push(u)
    if (날) 앞날 = 날
  }
  if (지금.length) 쪽묶.push(지금)
  return { 쪽묶, 쪽당 }
}

const 회색 = '#F2F2F2'
const 격칸 = (설정) => {
  const n = 설정.비교 ? Math.min(3, Math.max(1, 설정.한쪽에 > 3 ? 3 : 설정.한쪽에)) : 설정.한쪽에
  if (설정.비교) return [1, n]
  const 세로 = { 1: [1, 1], 2: [1, 2], 3: [1, 3], 4: [2, 2], 6: [2, 3], 8: [2, 4] }
  const 가로 = { 1: [1, 1], 2: [2, 1], 3: [3, 1], 4: [2, 2], 6: [3, 2], 8: [4, 2] }
  return (설정.용지 === '가로' ? 가로 : 세로)[n] || [1, 2]
}

/**
 * 사진들 → 쪽 모형들
 * @returns { 쪽들, 그림요청: Map(열쇠 → { id, 비율 | null }) }
 *   rect.그림 = 열쇠 · rect.사진 = 사진 id · rect.맞춤 = '채움' | '다보임' (화면 미리보기용)
 */
export function 사진대지쪽들(사진들, 설정) {
  const S = { ...기본설정, ...설정 }
  const [폭, 높이] = S.용지 === '가로' ? [297, 210] : [210, 297]
  const 안 = { x: 12, y: 12, w: 폭 - 24, h: 높이 - 24 }
  const { 쪽묶 } = 묶음나누기(사진들, S)
  const [열수, 줄수] = 격칸(S)
  const 그림요청 = new Map()
  const 쪽들 = []
  let 번호 = 0
  const 전체 = 쪽묶.length
  쪽묶.forEach((묶, pi) => {
    const 칸들 = []
    const 넣 = (r) => { 칸들.push(r); return r }
    /* ── 머리: 제목(+결재) ── */
    let y = 안.y
    const 결재 = (S.결재 || []).filter((x) => String(x).trim())
    const 결재폭 = 결재.length ? 7 + 결재.length * 17 : 0
    const 머리높 = 결재.length ? 20 : 13
    넣({ x: 안.x, y, w: 안.w - 결재폭 - (결재폭 ? 3 : 0), h: 머리높, 글: 제목띄움글(S.제목), 크기: 18, 굵게: true })
    if (결재.length) {
      const x0 = 안.x + 안.w - 결재폭
      넣({ x: x0, y, w: 7, h: 20, 글: '결\n재', 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
      결재.forEach((이름, i) => {
        넣({ x: x0 + 7 + i * 17, y, w: 17, h: 6, 글: String(이름), 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
        넣({ x: x0 + 7 + i * 17, y: y + 6, w: 17, h: 14, 테: 1 })
      })
    }
    y += 머리높 + 2
    if (S.공사명 || S.위치) {
      const h = 7.5
      const 위치폭 = S.위치 ? Math.min(70, 안.w * 0.36) : 0
      넣({ x: 안.x, y, w: 18, h, 글: '공 사 명', 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
      넣({ x: 안.x + 18, y, w: 안.w - 18 - (위치폭 ? 위치폭 + 16 : 0), h, 글: S.공사명 || '', 크기: 9.5, 정렬: '왼', 테: 1 })
      if (위치폭) {
        넣({ x: 안.x + 안.w - 위치폭 - 16, y, w: 16, h, 글: '위 치', 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
        넣({ x: 안.x + 안.w - 위치폭, y, w: 위치폭, h, 글: S.위치, 크기: 9.5, 정렬: '왼', 테: 1 })
      }
      y += h + 3
    } else y += 1
    /* ── 바닥: 쪽 번호 ── */
    const 바닥 = 안.y + 안.h - (S.쪽번호 ? 7 : 0)
    if (S.쪽번호) 넣({ x: 안.x + 안.w / 2 - 20, y: 바닥 + 1, w: 40, h: 6, 글: `- ${pi + 1} / ${전체} -`, 크기: 8.5, 색: '#555555' })
    /* ── 사진 칸 ── */
    const 틈 = 3
    const 칸폭 = (안.w - 틈 * (열수 - 1)) / 열수
    const 칸높 = (바닥 - y - 틈 * (줄수 - 1)) / 줄수
    const 항목줄 = (S.항목줄 || []).map((줄) => (S.비교 ? 줄.filter((f) => f.id !== 'd') : 줄)).filter((줄) => 줄.length)
    const 글줄높 = 열수 * 줄수 >= 6 ? 6.5 : 7.5
    묶.forEach((u, i) => {
      번호 += 1
      const cx = 안.x + (i % 열수) * (칸폭 + 틈)
      const cy = y + Math.floor(i / 열수) * (칸높 + 틈)
      const 비교머리 = S.비교 ? 6 : 0
      const 글높 = 항목줄.length * 글줄높
      const 사진높 = 칸높 - 글높 - 비교머리
      const 그림칸 = (p, x, w, yy, h) => {
        if (!p) return 넣({ x, y: yy, w, h, 테: 1 })
        const 비율 = S.맞춤 === '채움' ? Math.round((w / h) * 1000) / 1000 : null
        const 열쇠 = 비율 ? `${p.id}|${비율}` : p.id
        그림요청.set(열쇠, { id: p.id, 비율 })
        return 넣({ x, y: yy, w, h, 테: 1, 그림: 열쇠, 사진: p.id, 맞춤: S.맞춤, 그림여백: S.맞춤 === '채움' ? 0.4 : 1.2 })
      }
      if (S.비교) {
        const 반 = 칸폭 / 2
        const [전, 후] = u
        넣({ x: cx, y: cy, w: 반, h: 비교머리, 글: `${S.전이름}${전 && 칸값(전, 'd', S) ? `  (${칸값(전, 'd', S)})` : ''}`, 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
        넣({ x: cx + 반, y: cy, w: 반, h: 비교머리, 글: `${S.후이름}${후 && 칸값(후, 'd', S) ? `  (${칸값(후, 'd', S)})` : ''}`, 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
        그림칸(전, cx, 반, cy + 비교머리, 사진높)
        그림칸(후, cx + 반, 반, cy + 비교머리, 사진높)
      } else {
        그림칸(u[0], cx, 칸폭, cy, 사진높)
      }
      if (!항목줄.length) return
      const p = u[0]
      const 번폭 = S.번호 ? 8 : 0
      const gy = cy + 비교머리 + 사진높
      if (번폭) 넣({ x: cx, y: gy, w: 번폭, h: 글높, 글: String(번호), 크기: 10, 굵게: true, 테: 1, 바탕: 회색 })
      const 이름폭 = 칸폭 < 70 ? 11 : 13
      항목줄.forEach((줄, j) => {
        const yy = gy + j * 글줄높
        const 남 = 칸폭 - 번폭 - 이름폭 * 줄.length
        const 값폭 = 남 / 줄.length
        let x = cx + 번폭
        줄.forEach((f) => {
          넣({ x, y: yy, w: 이름폭, h: 글줄높, 글: f.이름, 크기: 8.5, 굵게: true, 테: 1, 바탕: 회색 })
          넣({ x: x + 이름폭, y: yy, w: 값폭, h: 글줄높, 글: String(칸값(p, f.id, S) ?? ''), 크기: 9, 정렬: f.id === 'd' ? '가' : '왼', 테: 1 })
          x += 이름폭 + 값폭
        })
      })
    })
    쪽들.push({ 폭, 높이, 안, 칸들 })
  })
  return { 쪽들, 그림요청 }
}

function 제목띄움글(s) {
  const t = String(s || '').trim()
  if (!t || /\s/.test(t) || [...t].length > 6) return t
  return [...t].join(' ')
}

/* ══════════════════════ 브라우저에서 사진 열기 · 줄이기 ══════════════════════ */

export const 작업긴쪽 = 2000
const 용량표 = { 가볍게: [1100, 0.72], 보통: [1600, 0.82], 선명하게: [2000, 0.9] }
export const 용량들 = Object.keys(용량표)

function 캔버스(w, h) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h))
  return c
}
function jpg(c, 질) {
  return new Promise((ok, no) => c.toBlob((b) => (b ? b.arrayBuffer().then((a) => ok(new Uint8Array(a)), no) : no(new Error('그림을 만들지 못했습니다'))), 'image/jpeg', 질))
}
async function 그림풀기(blob) {
  /* 사진 속 방향(EXIF)대로 세워서 — createImageBitmap 이 안 되면 <img> 로 */
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' })
  } catch (e) {
    const url = URL.createObjectURL(blob)
    try {
      const img = new Image()
      img.decoding = 'async'
      img.src = url
      await img.decode()
      return img
    } finally { setTimeout(() => URL.revokeObjectURL(url), 1000) }
  }
}
function 회색얻기(원, w, h) {
  const c = 캔버스(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })
  g.drawImage(원, 0, 0, w, h)
  const d = g.getImageData(0, 0, w, h).data
  const out = new Uint8Array(w * h)
  for (let i = 0, j = 0; i < out.length; i++, j += 4) out[i] = (d[j] * 299 + d[j + 1] * 587 + d[j + 2] * 114) / 1000
  return out
}

let _번 = 0
export const 새id = (머리 = 'p') => `${머리}${Date.now().toString(36)}${(++_번).toString(36)}`

/** 파일 하나 → 사진(작업본 JPEG · 작은 그림 · 찍은 때 · 선명도 · 지문) */
export async function 사진열기(파일) {
  const 원바이트 = new Uint8Array(await 파일.arrayBuffer())
  const 정보 = exif읽기(원바이트)
  let 원
  try { 원 = await 그림풀기(new Blob([원바이트], { type: 파일.type || 'image/jpeg' })) } catch (e) {
    if (/\.hei[cf]$/i.test(파일.name)) throw new Error(`「${파일.name}」 — 아이폰 HEIC 사진은 이 브라우저가 못 엽니다. 아이폰 설정 › 카메라 › 포맷 › «호환성 우선» 으로 찍거나, 사진을 JPG 로 보내 주십시오.`)
    throw new Error(`「${파일.name}」 을 사진으로 읽지 못했습니다`)
  }
  const W = 원.width, H = 원.height
  const s = Math.min(1, 작업긴쪽 / Math.max(W, H))
  const w = Math.round(W * s), h = Math.round(H * s)
  const c = 캔버스(w, h)
  const g = c.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h)
  g.drawImage(원, 0, 0, w, h)
  const 작업본 = await jpg(c, 0.88)
  const ts = Math.min(1, 360 / Math.max(w, h))
  const t = 캔버스(w * ts, h * ts)
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height)
  const 작은그림 = t.toDataURL('image/jpeg', 0.72)
  const as = Math.min(1, 480 / Math.max(w, h))
  const aw = Math.max(8, Math.round(w * as)), ah = Math.max(8, Math.round(h * as))
  const 회 = 회색얻기(c, aw, ah)
  const 지 = 지문(회색얻기(c, 9, 8))
  if (원.close) 원.close()
  return {
    id: 새id(), 이름: 파일.name, 파일때: 파일.lastModified || 0, 때: 정보.때, 기종: 정보.기종,
    너비: w, 높이: h, 작업본, 작은그림, 선명: Math.round(선명도(회, aw, ah)), 밝기: Math.round(밝기(회)), 지문: 지,
    값: {}, 새쪽: false,
  }
}

/** 오른쪽으로 90° 돌리기 — 작업본을 다시 그립니다 */
export async function 사진돌리기(p, 도 = 90) {
  const 원 = await 그림풀기(new Blob([p.작업본], { type: 'image/jpeg' }))
  const 옆 = 도 % 180 !== 0
  const w = 옆 ? p.높이 : p.너비, h = 옆 ? p.너비 : p.높이
  const c = 캔버스(w, h)
  const g = c.getContext('2d')
  g.translate(w / 2, h / 2); g.rotate((도 * Math.PI) / 180)
  g.drawImage(원, -p.너비 / 2, -p.높이 / 2, p.너비, p.높이)
  const 작업본 = await jpg(c, 0.88)
  const ts = Math.min(1, 360 / Math.max(w, h))
  const t = 캔버스(w * ts, h * ts)
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height)
  return { ...p, 작업본, 너비: w, 높이: h, 작은그림: t.toDataURL('image/jpeg', 0.72) }
}

/** 쪽에 붙일 그림 — 비율이 있으면 가운데를 그 비율로 잘라(채움) · 용량대로 줄여 JPEG */
export async function 그림준비(p, 비율, 용량 = '보통') {
  const [긴쪽, 질] = 용량표[용량] || 용량표.보통
  let sx = 0, sy = 0, sw = p.너비, sh = p.높이
  if (비율) {
    if (sw / sh > 비율) { const nw = sh * 비율; sx = (sw - nw) / 2; sw = nw } else { const nh = sw / 비율; sy = (sh - nh) / 2; sh = nh }
  }
  const s = Math.min(1, 긴쪽 / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * s)), h = Math.max(1, Math.round(sh * s))
  if (!비율 && s === 1 && 용량 === '선명하게') return { 바이트: p.작업본, w: p.너비, h: p.높이 }
  const 원 = await 그림풀기(new Blob([p.작업본], { type: 'image/jpeg' }))
  const c = 캔버스(w, h)
  const g = c.getContext('2d')
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h)
  g.drawImage(원, sx, sy, sw, sh, 0, 0, w, h)
  if (원.close) 원.close()
  return { 바이트: await jpg(c, 질), w, h }
}
