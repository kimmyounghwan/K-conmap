/**
 * 🎨 컬러 평면도 · 🚪 피난 안내도 — 도면(DXF · DWG)에서 방을 찾아 색 · 무늬 · 이름 · 면적 · 피난 길 (2026-10-17)
 *
 * 소장님: 「컬러 평면도 …」 「크몽보다 좋아야 해. 반드시, 대충만들지마」 「모든 도구는 사이트 내에서 사용가능하게」
 *   크몽 «평면도 · 입면도 컬러링 / 층별 피난 안내도»(장당 2.2 ~ 11만 · A3 JPG) — 사람이 손으로 칠함.
 *   여기서는 도면을 넣으면 ① 방을 저절로 찾아 칠하고 ② 비상구까지 길을 저절로 찾아 ③ 구획된 실마다 한 장씩 안내도를 만듭니다.
 *
 * ■ 방 찾기 — 칸 판(25 mm 안팎)에 «막는 선»(벽 · 기둥 · 창 · 문짝 닫힌 자리 — lib/방찾기.js 막는토막)을 긋고
 *   판 가장자리에서 물을 채워 «바깥»을 가린 뒤, 남은 빈 칸 덩이를 공간으로 봅니다(벽 두 줄 사이 좁은 틈은 벽).
 *   실 이름 글이 든 덩이 = 그 실. 한 덩이에 이름이 둘 넘으면(거실 · 주방이 트인 집) 면적선(AREA · 면적 층의 닫힌 선)으로 나누고,
 *   면적선이 없으면 한 공간(이름 둘)으로 둡니다. 이름 없는 공간은 실찾기(lib/도면전부.js)의 짐작(화장실 · 계단실 · 복도 — 추정)을 씀.
 * ■ 칠한 모양 = 칸 덩이의 테두리(곧은 변은 하나로) — 화면 · PDF · PNG · DXF(HATCH) 가 같은 모양.
 * ■ 벽 채움(포셰) = 바깥이 아닌 곳 전체를 벽 색으로 먼저 칠하고 그 위에 방을 칠함 → 벽 두께만 남아 진하게 보임.
 * ■ 피난 길 — 문을 연 판(문짝 · 열림 호를 빼고 그은 막는 선 + 벽 끝 막음 · 벽에서 0.2 m 띄움)에서
 *   출구(계단실 · 바깥으로 난 문 · 손으로 찍은 곳)부터 거리(벽 가까이는 비싸게 → 복도 가운데로)를 퍼뜨리고, 방마다 거꾸로 따라감.
 *   현위치 실에서는 가까운 출구 길(초록 굵게) + 다른 출구 길(주황 점선 — 두 방향 피난).
 * ■ 피난안내도 기준: 「다중이용업소의 안전관리에 관한 특별법 시행규칙」 [별표 2의2] (2019. 4. 22. 개정 — 국가법령정보센터 원문 두 판으로 확인 ·
 *   그 뒤 2021 ~ 2025 개정은 별표 2의2 를 안 건드림): 비상구 위치 · 구획된 실에서 비상구 · 출입구까지 피난 동선 · 소화기 · 옥내소화전 위치와
 *   사용방법 · 피난 및 대처방법 · 광고 금지 / B4 이상(층 영업장 또는 층 바닥면적 400 ㎡ 이상이면 A3 이상) / 한글 + 외국어 1개 이상.
 *   사용법 · 대처 문장: 서울시 안전 누리집(소화기) · 군포소방서 안내(옥내소화전 — 아주경제 2022-12-16) · 인천소방 · 삼육대 안전 안내를 맞춰 봄.
 * ■ 좌표: 모델 좌표(가운데 뺀 것 — 골조도면.js) · k = 모델 단위 → mm. 종이는 mm · y 아래로.
 * 시험: node tools/시험_컬러평면.mjs
 */
import { 종류 } from './골조도면.js'
import { 막는도형, 막는토막, 벽끝막기, 벽상자 } from './방찾기.js'
import { 실이름인가, 실찾기 } from './도면전부.js'
import { 글자폭, 붙임 } from './도면자동.js'
import { 글폭, 나누기 } from './쪽문서.js'

/* ───────────────────────────── ① 용도 · 색 · 무늬 */

export const 용도들 = [
  { 키: '코어', 이름: '계단 · 승강기', 말: /계단|STAIR|^E\.?V|E\/V|EV\d*$|승강|엘리베이터|ELEV|LIFT|SHAFT|^P\.?S$|^D\.?S$|^A\.?D$|EPS|TPS|덕트|DUCT/i },
  { 키: '욕실', 이름: '욕실 · 화장실', 말: /욕실|화장실|TOILET|BATH|WC|샤워|SHOWER|파우더|POWDER|세면|수유|변소/i },
  { 키: '발코니', 이름: '발코니 · 다용도', 말: /발코니|베란다|BALC|VERANDA|테라스|TERRACE|다용도|실외기|세탁|LAUNDRY|대피공간|보일러실/i },
  { 키: '주방', 이름: '주방 · 식당', 말: /주방|부엌|식당|KITCHEN|DINING|팬트리|PANTRY|탕비|조리|급식|배식/i },
  { 키: '현관', 이름: '현관', 말: /현관|ENTR|중문|출입구|포치|PORCH|방풍/i },
  { 키: '복도', 이름: '복도 · 홀', 말: /복도|통로|CORR|PASSAGE|^홀$|HALL$|전실|로비|LOBBY|엘리베이터홀|EV홀/i },
  { 키: '거실', 이름: '거실 · 휴게', 말: /거실|리빙|LIVING|가족실|라운지|LOUNGE|대기|WAITING|휴게|쉼터/i },
  { 키: '업무', 이름: '사무 · 상담', 말: /사무|교무|원장|상담|회의|업무|OFFICE|MEET|실장|대표|관리실|경비|행정|숙직|당직|접견|응접|서재|STUDY/i },
  { 키: '침실', 이름: '침실', 말: /침실|안방|BED|자녀|드레스|DRESS|알파룸|ALPHA|^방\s*\d*$|^ROOM\s*\d*$/i },
  { 키: '영업', 이름: '강의 · 영업', 말: /강의|교실|학습|자습|열람|독서|CLASS|매장|영업|객실|근린|판매|상가|점포|STORE|SHOP|진료|병실|치료|운동|체육|GYM|연습|실습|작업|공방|주점|노래|PC|당구|카페|CAFE|홀$|공연|전시|대합/i },
  { 키: '창고', 이름: '창고 · 설비', 말: /창고|STOR|기계|전기실|설비|MDF|IDF|발전|펌프|청소|MECH|ELEC|물탱크|저수조|방재|쓰레기|분리수거|트렁크|수납/i },
  { 키: '주차', 이름: '주차', 말: /주차|PARK|차고|GARAGE/i },
  { 키: '기타', 이름: '그 밖', 말: /$^/ },
]
export const 용도이름 = Object.fromEntries(용도들.map((u) => [u.키, u.이름]))
/** 실 이름 → 용도 키 */
export function 용도(이름) {
  const t = 붙임(String(이름 || '')).replace(/\(추정\)$/, '')
  if (!t) return '기타'
  for (const u of 용도들) if (u.말.test(t)) return u.키
  return '기타'
}

/** 바닥 무늬 — 간격 mm · 마루 = 널(150) + 엇갈린 이음(900) */
export const 무늬들 = {
  '': { 이름: '없음' },
  마루: { 이름: '마루', 간격: 150, 이음: 900 },
  타일: { 이름: '타일 300', 격자: 300 },
  잔타일: { 이름: '타일 200', 격자: 200 },
  큰타일: { 이름: '타일 600', 격자: 600 },
  카펫: { 이름: '타일 카펫 500', 격자: 500 },
}
export const 용도무늬 = { 거실: '마루', 침실: '마루', 복도: '마루', 주방: '타일', 욕실: '잔타일', 현관: '큰타일', 발코니: '잔타일', 업무: '카펫', 영업: '카펫', 코어: '', 창고: '', 주차: '', 기타: '' }

export const 색판들 = {
  부드럽게: {
    이름: '부드러운 색 — 분양 안내', 벽: '#3d3d3d', 선: '#4a4a4a', 글: '#1d2733', 바깥: '#ffffff', 빈곳: '#f4f4f2',
    색: { 거실: '#F2DEC0', 침실: '#EAD3B4', 주방: '#F5E9CB', 욕실: '#D1E7F2', 현관: '#E5E0D6', 복도: '#F0E8DA', 발코니: '#DEE8D5', 코어: '#D9D9D9', 업무: '#DBE6F5', 영업: '#F7E0D2', 창고: '#E4E1EB', 주차: '#E2E2E2', 기타: '#EFEFEF' },
  },
  선명하게: {
    이름: '선명한 색 — 구역 구분', 벽: '#232323', 선: '#2a2a2a', 글: '#111111', 바깥: '#ffffff', 빈곳: '#f2f2f2',
    색: { 거실: '#FFD27C', 침실: '#A6D9A1', 주방: '#FFB48A', 욕실: '#8CC8EF', 현관: '#CBB9EA', 복도: '#FFF0A3', 발코니: '#B2E1D1', 코어: '#BFBFBF', 업무: '#9DC3F6', 영업: '#F6A7BA', 창고: '#D6CAC3', 주차: '#CBD6DB', 기타: '#EDEDED' },
  },
  차분하게: {
    이름: '차분한 색 — 보고서 · 관공서', 벽: '#4a4f55', 선: '#50555b', 글: '#22272e', 바깥: '#ffffff', 빈곳: '#f1f1f1',
    색: { 거실: '#E3D8C8', 침실: '#D8CDBE', 주방: '#E7DFCC', 욕실: '#C9D7DE', 현관: '#D7D3CA', 복도: '#E5DFD4', 발코니: '#D1D9C9', 코어: '#CDCDCD', 업무: '#CBD5DF', 영업: '#E2D0C8', 창고: '#D6D3DA', 주차: '#D4D4D4', 기타: '#E8E8E8' },
  },
  흑백: {
    이름: '흑백 인쇄', 벽: '#111111', 선: '#222222', 글: '#000000', 바깥: '#ffffff', 빈곳: '#ffffff',
    색: { 거실: '#F3F3F3', 침실: '#EBEBEB', 주방: '#E4E4E4', 욕실: '#D9D9D9', 현관: '#D2D2D2', 복도: '#F7F7F7', 발코니: '#DEDEDE', 코어: '#C8C8C8', 업무: '#EEEEEE', 영업: '#E8E8E8', 창고: '#CFCFCF', 주차: '#D5D5D5', 기타: '#F5F5F5' },
  },
}

/** 색 어둡게 · 밝게 (#rrggbb) */
export function 색섞기(hex, 대상 = '#000000', t = 0.15) {
  const a = parseInt(String(hex).slice(1), 16) || 0, b = parseInt(String(대상).slice(1), 16) || 0
  const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t)
  return '#' + [16, 8, 0].map((s) => f(s).toString(16).padStart(2, '0')).join('')
}

/* ───────────────────────────── ② 판(평면 한 장) 찾기 */

const 판제목말 = /(평면도|PLAN)/i
const 끈층말 = /DEFPOINTS/i

/** 도면 속 실 이름 글 — 보이는 글 + 숨은 층 글(인쇄 안 하는 층에 적은 실 이름) */
export function 이름글들(모델) {
  const { T, E, layers } = 모델
  const out = []
  for (let i = 0; i < T.s.length; i++) {
    const e = T.e[i]
    if (E.t[e] !== 종류.글자) continue
    if (E.sc && (E.sc[e] < 0.5 || E.sc[e] > 2)) continue
    const L = layers[E.ly[e]]
    if (L && L.hide && !끈층말.test(L.name || '')) continue
    if (!실이름인가(T.s[i])) continue
    if (/^[(（［\[].*[)）］\]]$/.test(붙임(T.s[i]))) continue          /* «(개방형공간활용)» 같은 덧말 — 실 이름 아님 */
    const w = 글자폭(T, i)
    out.push({ s: 붙임(T.s[i]), x: T.x[i] + (w / 2) * Math.cos(T.a[i]) - (T.h[i] / 2) * Math.sin(T.a[i]), y: T.y[i] + (w / 2) * Math.sin(T.a[i]) + (T.h[i] / 2) * Math.cos(T.a[i]), h: T.h[i], i })
  }
  for (const q of 모델.숨은글 || []) if (실이름인가(q.s)) out.push({ s: 붙임(q.s), x: q.x, y: q.y, h: 0, i: -1, 숨음: true })
  return out
}

/** 가까운 것끼리 무리(상자 사이 d 안) */
function 무리(점들, d) {
  const 무 = 점들.map((p) => ({ 상자: [p.x, p.y, p.x, p.y], 들: [p] }))
  for (let 바뀜 = true; 바뀜;) {
    바뀜 = false
    for (let i = 0; i < 무.length && !바뀜; i++) for (let j = i + 1; j < 무.length; j++) {
      const a = 무[i].상자, b = 무[j].상자
      if (a[0] - d > b[2] || b[0] - d > a[2] || a[1] - d > b[3] || b[1] - d > a[3]) continue
      무[i] = { 상자: [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])], 들: [...무[i].들, ...무[j].들] }
      무.splice(j, 1); 바뀜 = true; break
    }
  }
  return 무
}

/**
 * 판들 — 실 이름이 셋 넘게 모인 곳마다 한 판(여러 층을 한 파일에 그린 도면)
 * @returns [{ 번호, 제목, 상자, 이름들 }]  (모델 좌표)
 */
export function 판들찾기(모델, k = 1) {
  const 이름 = 이름글들(모델)
  const { T } = 모델
  const 제목들 = []
  for (let i = 0; i < T.s.length; i++) { const t = 붙임(T.s[i]); if (t.length <= 30 && 판제목말.test(t) && !/일람|범례|표$/.test(t)) 제목들.push({ s: String(T.s[i]).trim(), x: T.x[i], y: T.y[i] }) }
  const 무 = 무리(이름, 6000 / k).sort((a, b) => b.들.length - a.들.length)
  const 가까운제목 = (g) => {
    const [x0, y0, x1, y1] = g.상자
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    let best = null, bd = Infinity
    for (const t of 제목들) { const d = Math.hypot(t.x - cx, t.y - cy); if (d < bd) { bd = d; best = t } }
    return { t: best, d: bd, 반: Math.max(x1 - x0, y1 - y0) }
  }
  const out = []
  const 쓴제목 = new Set()
  /* 같은 평면이 두 무리로 갈린 것(이름 사이가 6 m 넘게 떨어진 큰 홀) — 큰 무리의 «벽으로 넓힌 판» 안에 이름이 다 들면 합침 */
  const 토 = 막토(모델, k)
  const 큰들 = 무.filter((g) => g.들.length >= 2)
  const 판상자 = new Map()
  for (const g of 큰들) 판상자.set(g, 벽상자(토, g.상자, 2500 / k))
  for (let i = 0; i < 큰들.length; i++) for (let j = 큰들.length - 1; j > i; j--) {
    const A = 판상자.get(큰들[i]), b = 큰들[j]
    if (!b.들.every((n) => n.x >= A[0] && n.x <= A[2] && n.y >= A[1] && n.y <= A[3])) continue
    큰들[i].들.push(...b.들)
    큰들[i].상자 = [Math.min(큰들[i].상자[0], b.상자[0]), Math.min(큰들[i].상자[1], b.상자[1]), Math.max(큰들[i].상자[2], b.상자[2]), Math.max(큰들[i].상자[3], b.상자[3])]
    b.합침 = true
    큰들.splice(j, 1)
  }
  /* 실 이름 둘 넘는 무리 = 판 — 제목은 곁(판 크기 + 30 m 안)의 가장 가까운 «… 평면도» */
  for (const g of 무) {
    if (g.들.length < 2 || g.합침) continue
    const { t, d, 반 } = 가까운제목(g)
    const 제목 = t && d < 반 * 1.6 + 30000 / k ? t.s : ''
    if (t && 제목) 쓴제목.add(t)
    out.push({ 번호: out.length, 제목: 제목 || `평면 ${out.length + 1}`, 상자: g.상자, 이름들: g.들 })
  }
  /* 실 이름이 하나뿐인 무리 — 가장 가까운 제목을 다른 판이 안 가졌을 때만(한 층 한 실 · 주차장 · 근린생활시설). 표 속 실 이름은 빠짐 */
  for (const g of 무) {
    if (g.들.length >= 2) continue
    const n0 = g.들[0]
    if (큰들.some((G) => { const A = 판상자.get(G); return n0.x >= A[0] && n0.x <= A[2] && n0.y >= A[1] && n0.y <= A[3] })) continue
    const { t, d } = 가까운제목(g)
    if (!t || 쓴제목.has(t) || d > 100000 / k) continue
    쓴제목.add(t)
    out.push({ 번호: out.length, 제목: t.s, 상자: g.상자, 이름들: g.들 })
  }
  /* 같은 제목이 여럿이면 뒤에 번호 */
  const 셈 = new Map()
  for (const p of out) 셈.set(p.제목, (셈.get(p.제목) || 0) + 1)
  const 본 = new Map()
  for (const p of out) if (셈.get(p.제목) > 1) { const n = (본.get(p.제목) || 0) + 1; 본.set(p.제목, n); p.제목 += ` (${n})` }
  return out
}

/** 막는 토막(벽 · 창 · 문짝 닫힌 자리) — 도면마다 한 번 */
const 토캐시 = new WeakMap()
function 막토(모델, k) {
  let v = 토캐시.get(모델)
  if (!v || v.k !== k) { v = { k, 토: 막는토막(모델, 막는도형(모델), k) }; 토캐시.set(모델, v) }
  return v.토
}

/* ───────────────────────────── ③ 칸 판 */

function 긋기(판, NX, NY, ax, ay, bx, by, 값 = 1) {
  const 길 = Math.max(Math.abs(bx - ax), Math.abs(by - ay))
  const n = Math.max(1, Math.ceil(길 * 2))
  let pi = -1, pj = -1
  for (let s = 0; s <= n; s++) {
    const x = ax + ((bx - ax) * s) / n, y = ay + ((by - ay) * s) / n
    const i = Math.floor(x), j = Math.floor(y)
    if (i === pi && j === pj) continue
    if (pi >= 0 && i !== pi && j !== pj) { const ci = i, cj = pj; if (ci >= 0 && ci < NX && cj >= 0 && cj < NY) 판[cj * NX + ci] = 값 }
    if (i >= 0 && i < NX && j >= 0 && j < NY) 판[j * NX + i] = 값
    pi = i; pj = j
  }
}

/** 4 방향 물 채우기 — 시작 칸들에서 «빈(0)» 칸으로 · 채운 칸 = 표값 */
function 채우기(판, NX, NY, 시작들, 표, 표값, 막힘) {
  const 줄 = new Int32Array(NX * NY)
  let h = 0, t = 0
  for (const s of 시작들) if (!막힘(s) && 표[s] === 0) { 표[s] = 표값; 줄[t++] = s }
  while (h < t) {
    const c = 줄[h++]
    const i = c % NX
    if (i > 0) { const d = c - 1; if (표[d] === 0 && !막힘(d)) { 표[d] = 표값; 줄[t++] = d } }
    if (i < NX - 1) { const d = c + 1; if (표[d] === 0 && !막힘(d)) { 표[d] = 표값; 줄[t++] = d } }
    if (c >= NX) { const d = c - NX; if (표[d] === 0 && !막힘(d)) { 표[d] = 표값; 줄[t++] = d } }
    if (c < NX * (NY - 1)) { const d = c + NX; if (표[d] === 0 && !막힘(d)) { 표[d] = 표값; 줄[t++] = d } }
  }
  return t
}

/** 체스판 거리(8 방향) — 씨(참) 칸까지 칸 수(65535 까지) · 판 밖은 씨 */
function 체스거리(NX, NY, 씨) {
  const d = new Uint16Array(NX * NY)
  const M = 65535
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const c = j * NX + i
    if (씨(c)) { d[c] = 0; continue }
    if (i === 0 || j === 0) { d[c] = 1; continue }
    d[c] = Math.min(M, 1 + Math.min(d[c - 1], d[c - NX], d[c - NX - 1], i < NX - 1 ? d[c - NX + 1] : M))
  }
  for (let j = NY - 1; j >= 0; j--) for (let i = NX - 1; i >= 0; i--) {
    const c = j * NX + i
    if (d[c] === 0) continue
    if (i === NX - 1 || j === NY - 1) { d[c] = 1; continue }
    d[c] = Math.min(d[c], 1 + Math.min(d[c + 1], d[c + NX], d[c + NX + 1], i > 0 ? d[c + NX - 1] : M))
  }
  return d
}

/**
 * 표[c] === 값 인 칸들의 테두리 고리 모두(바깥 + 구멍) — 격자 꼭짓점 [i, j] · 곧은 변은 하나로 · 계단꼴은 tol 칸 안으로 폄
 * @returns [[ [i,j] … ] …]
 */
export function 테두리들(표, NX, NY, 값, 범위 = null, tol = 0.75) {
  const [i0, j0, i1, j1] = 범위 || [0, 0, NX - 1, NY - 1]
  const W = NX + 1
  const 키 = (i, j) => j * W + i
  const 나감 = new Map()
  const 넣 = (ai, aj, bi, bj) => { const k = 키(ai, aj); const l = 나감.get(k); if (l) l.push(bi, bj); else 나감.set(k, [bi, bj]) }
  const 같 = (i, j) => i >= 0 && j >= 0 && i < NX && j < NY && 표[j * NX + i] === 값
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (표[j * NX + i] !== 값) continue
    if (!같(i, j - 1)) 넣(i, j, i + 1, j)
    if (!같(i + 1, j)) 넣(i + 1, j, i + 1, j + 1)
    if (!같(i, j + 1)) 넣(i + 1, j + 1, i, j + 1)
    if (!같(i - 1, j)) 넣(i, j + 1, i, j)
  }
  const 고리들 = []
  for (const [k0, l0] of 나감) {
    while (l0.length) {
      const 고리 = [[k0 % W, (k0 / W) | 0]]
      let cur = [l0.shift(), l0.shift()]
      let 앞 = 고리[0]
      for (let n = 0; n < 4e6; n++) {
        if (cur[0] === 고리[0][0] && cur[1] === 고리[0][1]) break
        고리.push(cur)
        const l = 나감.get(키(cur[0], cur[1]))
        if (!l || !l.length) break
        let 고른 = 0
        if (l.length > 2) {
          /* 갈림(대각으로 닿은 칸) — 왼쪽으로 꺾는 것 먼저 */
          const dx = cur[0] - 앞[0], dy = cur[1] - 앞[1]
          for (let q = 0; q < l.length; q += 2) { const ex = l[q] - cur[0], ey = l[q + 1] - cur[1]; if (dx * ey - dy * ex > 0) { 고른 = q; break } }
        }
        앞 = cur
        cur = [l[고른], l[고른 + 1]]
        l.splice(고른, 2)
      }
      if (고리.length >= 4) 고리들.push(곧게(고리, tol))
    }
  }
  return 고리들.filter((r) => r.length >= 3)
}
/** 꺾인 꼭짓점만 + 닫힌 고리 Douglas-Peucker(tol 칸) */
function 곧게(고리, tol) {
  const n = 고리.length
  const 꺾 = []
  for (let q = 0; q < n; q++) {
    const a = 고리[(q - 1 + n) % n], b = 고리[q], c = 고리[(q + 1) % n]
    if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) !== 0) 꺾.push(b)
  }
  if (꺾.length <= 8 || tol <= 0) return 꺾
  let b = 0, best = -1
  for (let i = 0; i < 꺾.length; i++) { const d = Math.hypot(꺾[i][0] - 꺾[0][0], 꺾[i][1] - 꺾[0][1]); if (d > best) { best = d; b = i } }
  const out = []
  const 재귀 = (i, j) => {
    let m = -1, md = tol
    const [ax, ay] = 꺾[i % 꺾.length], [bx, by] = 꺾[j % 꺾.length]
    const L = Math.hypot(bx - ax, by - ay) || 1
    for (let q = i + 1; q < j; q++) { const [px, py] = 꺾[q % 꺾.length]; const dd = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / L; if (dd > md) { md = dd; m = q } }
    if (m < 0) { out.push(꺾[i % 꺾.length]); return }
    재귀(i, m); 재귀(m, j)
  }
  재귀(0, b); 재귀(b, 꺾.length)
  return out
}

export function 고리넓이(r) { let A = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; A += a[0] * b[1] - b[0] * a[1] } return A / 2 }
export function 고리안(r, x, y) {
  let 속 = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-300) + xi) 속 = !속
  }
  return 속
}
/** 고리들(구멍 포함 · 짝홀) 안인가 */
export function 고리들안(고리들, x, y) { let n = 0; for (const r of 고리들) if (고리안(r, x, y)) n++; return n % 2 === 1 }

/* ───────────────────────────── ④ 선 나누기 (바탕 그림) */

const 문층말 = /DOOR|^DR|[-_]DR|문$|문[-_]|^A-?DOOR/i
const 문블록말 = /DOOR|문|^D[-_ ]?\d|^D\d|^SD|^AD\d|^WD|^FSD|^SSD|^PD|^ASD|^FD|셔터|SHUTTER|자동문/i
const 창말 = /WIN|창호|창$|^창|SASH|GLASS|유리|CURT|^AW|^W[-_ ]?\d/i
const 벽말 = /WAL|WALL|벽|^CON$|^CONC|[-_ ]CON$|COL|기둥|CORE|코어|PARA|난간/i
const 위생말 = /TOIL|BATH|SANI|PLUMB|위생|변기|세면|소변|대변|WC|LAV|URINAL|CLOSET|BASIN/i
const 가구말 = /FUR|가구|EQPM|EQUIP|집기|비품|APPL|주방기구|KIT|FLOR|바닥/i
const 계단말 = /STAIR|계단|STRS|STEP|^EV|ELEV|승강|LIFT|ESCAL/i
const 소방말 = /^F-|소방|FIRE|SPRINK|스프링/i
const 빼는층 = /DIM|치수|TEXT|TXT|글자|문자|NOTE|주기|도곽|TITLE|BORDER|FRAME|SHEET|CEN(TER)?|중심|^CL$|GRID|통심|LEADER|인출|HATCH|해치|PATTERN|무늬|AREA|면적|SYMB|기호|MARK|SECT|단면|ELEV$|입면|HID|숨은|DEFPOINTS|VIEWPORT|VPORT|LOGO|STAMP|표$|TABLE/i

export function 선종류(층이름, 블록이름 = '') {
  const L = 층이름 || '', B = 블록이름 || ''
  if (소방말.test(L)) return '소방'
  if (빼는층.test(L) && !벽말.test(L)) return ''
  if (창말.test(L) || 창말.test(B)) return '창'
  if (문층말.test(L) || 문블록말.test(B)) return '문'
  if (위생말.test(L) || 위생말.test(B)) return '위생'
  if (계단말.test(L)) return '계단'
  if (가구말.test(L) || 가구말.test(B)) return '가구'
  if (벽말.test(L)) return '벽'
  return '기타'
}

/* ───────────────────────────── ⑤ 소방 설비 블록 · 출구 */

export const 장비종류들 = [
  { 키: '소화기', 말: /소화기|EXTING|^F\.?E\b|^FE\d|분말|ABC/i },
  { 키: '소화전', 말: /옥내\s*소화전|소화전함|^소화전|HYDRANT|^F\.?H\b|^I\.?H\b/i },
  { 키: '발신기', 말: /발신기|비상벨|경종|ALARM|^P형|PUSH/i },
  { 키: '완강기', 말: /완강기|DESCEN|피난사다리|구조대|피난기구|LADDER/i },
]
export const 장비이름 = { 소화기: '소화기', 소화전: '옥내소화전', 발신기: '발신기(비상벨)', 완강기: '완강기 · 피난기구' }
export const 장비영어 = { 소화기: 'Fire extinguisher', 소화전: 'Indoor fire hydrant', 발신기: 'Fire alarm button', 완강기: 'Escape device' }

/* ───────────────────────────── ⑥ 판 읽기 — 방 · 벽 · 선 · 문 · 설비 · 출구 */

const 면적선층 = /AREA|면적|ROOM|SPACE|실$|^실|실명/i

/**
 * @param 판 판들찾기() 의 하나
 * @param o { 칸mm(25), 짐작(true) }
 */
export function 판읽기(모델, k, 판, o = {}) {
  const { Q, P, E, layers, I } = 모델
  const 토 = 막토(모델, k)
  const 문들 = 토.문들 || []
  /* 판 넓이 — 이름 상자를 벽 선이 이어진 데까지 넓힘. 실 이름이 «바깥»(판 가장자리와 이어짐)에 들면 판을 두 배씩 넓혀 다시(큰 홀 · 한 층 한 실) */
  const 판이름 = 판.이름들 || []
  let 넓힘 = 0, 판칸, 밖, c, NX, NY, x0, y0, NN, B
  for (let 번 = 0; 번 < 4; 번++) {
    const 기 = 판.상자
    const 상 = 벽상자(토, 넓힘 ? [기[0] - 넓힘, 기[1] - 넓힘, 기[2] + 넓힘, 기[3] + 넓힘] : 기, 2500 / k)
    const 여유 = 1500 / k
    B = [상[0] - 여유, 상[1] - 여유, 상[2] + 여유, 상[3] + 여유]
    c = (o.칸mm || 25) / k
    while (((B[2] - B[0]) / c) * ((B[3] - B[1]) / c) > 5e6) c *= 1.25
    NX = Math.ceil((B[2] - B[0]) / c) + 2; NY = Math.ceil((B[3] - B[1]) / c) + 2
    x0 = B[0] - c; y0 = B[1] - c
    NN = NX * NY
    /* 막는 선 긋기 */
    판칸 = new Uint8Array(NN)
    const n토 = 토.length / 4
    for (let i = 0; i < n토; i++) {
      const a = 토[i * 4], b = 토[i * 4 + 1], cc = 토[i * 4 + 2], d = 토[i * 4 + 3]
      if (Math.max(a, cc) < x0 || Math.min(a, cc) > x0 + NX * c || Math.max(b, d) < y0 || Math.min(b, d) > y0 + NY * c) continue
      긋기(판칸, NX, NY, (a - x0) / c, (b - y0) / c, (cc - x0) / c, (d - y0) / c)
    }
    /* 바깥 — 가장자리에서 물 채우기 (표: 0 빈 · 1 바깥) */
    밖 = new Uint8Array(NN)
    const 가장자리 = []
    for (let i = 0; i < NX; i++) 가장자리.push(i, (NY - 1) * NX + i)
    for (let j = 0; j < NY; j++) 가장자리.push(j * NX, j * NX + NX - 1)
    채우기(판칸, NX, NY, 가장자리, 밖, 1, (d) => 판칸[d] !== 0)
    /* 이름이 다 안에 들었나(반 넘게) */
    let 밖이름 = 0
    for (const n of 판이름) {
      const i = Math.floor((n.x - x0) / c), j = Math.floor((n.y - y0) / c)
      if (i < 0 || j < 0 || i >= NX || j >= NY || 밖[j * NX + i]) 밖이름++
    }
    if (!판이름.length || 밖이름 * 2 < 판이름.length) break
    넓힘 = 넓힘 ? 넓힘 * 2 : 10000 / k
  }
  const 칸중심 = (cc) => [x0 + ((cc % NX) + 0.5) * c, y0 + (((cc / NX) | 0) + 0.5) * c]
  const 어느칸 = (x, y) => { const i = Math.floor((x - x0) / c), j = Math.floor((y - y0) / c); return i < 0 || j < 0 || i >= NX || j >= NY ? -1 : j * NX + i }

  /* 빈 칸 덩이(바깥 빼고) — 덩[c] = 번호 */
  const 덩 = new Int32Array(NN).fill(-1)
  const 덩이 = []
  const 줄 = new Int32Array(NN)
  for (let s0 = 0; s0 < NN; s0++) {
    if (판칸[s0] || 밖[s0] || 덩[s0] >= 0) continue
    const id = 덩이.length
    let h = 0, t = 0, 수 = 0
    let i0 = NX, i1 = 0, j0 = NY, j1 = 0
    줄[t++] = s0; 덩[s0] = id
    while (h < t) {
      const cc = 줄[h++]; 수++
      const i = cc % NX, j = (cc / NX) | 0
      if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j
      for (const d of [i > 0 ? cc - 1 : -1, i < NX - 1 ? cc + 1 : -1, j > 0 ? cc - NX : -1, j < NY - 1 ? cc + NX : -1]) {
        if (d < 0 || 판칸[d] || 밖[d] || 덩[d] >= 0) continue
        덩[d] = id; 줄[t++] = d
      }
    }
    덩이.push({ 수, i0, i1, j0, j1, 열린: 0 })
  }
  /* 열린 칸 — 150 mm 깎았다 불림(벽 두 줄 사이 틈 · 기둥 속은 빠짐) */
  const r깎 = Math.max(1, Math.round(150 / k / c))
  const 거 = 체스거리(NX, NY, (cc) => 판칸[cc] !== 0 || 밖[cc] !== 0)
  const 거2 = 체스거리(NX, NY, (cc) => 거[cc] > r깎)
  for (let cc = 0; cc < NN; cc++) if (덩[cc] >= 0 && 거2[cc] <= r깎) 덩이[덩[cc]].열린++
  const 공간인가 = 덩이.map((d) => d.열린 * c * c * k * k >= 0.6e6)

  /* 이름 → 덩이 */
  const 근처빈칸 = (x, y) => {
    let cc = 어느칸(x, y)
    if (cc < 0) return -1
    if (덩[cc] >= 0 && 공간인가[덩[cc]]) return cc
    const i = cc % NX, j = (cc / NX) | 0
    const R = Math.ceil(400 / k / c)
    for (let d = 1; d <= R; d++) for (let dy = -d; dy <= d; dy++) for (let dx = -d; dx <= d; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== d) continue
      const ii = i + dx, jj = j + dy
      if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) continue
      const q = jj * NX + ii
      if (덩[q] >= 0 && 공간인가[덩[q]]) return q
    }
    return -1
  }
  const 이름들 = 이름글들(모델).filter((n) => n.x >= B[0] && n.x <= B[2] && n.y >= B[1] && n.y <= B[3])
  const 덩이름 = new Map()
  for (const n of 이름들) {
    const cc = 근처빈칸(n.x, n.y)
    if (cc < 0) continue
    const id = 덩[cc]
    const l = 덩이름.get(id) || []
    /* 같은 이름을 두 층(보이는 · 숨은)에 적은 도면 — 한 번만 */
    if (l.some((m) => m.s === n.s && Math.hypot(m.x - n.x, m.y - n.y) < 3000 / k)) continue
    l.push({ ...n, cc })
    덩이름.set(id, l)
  }

  /* 면적선(닫힌 선) — 이름 둘 넘게 든 덩이를 나눌 때 */
  const 면적선들 = []
  {
    const 조각 = new Map()
    for (let q = 0; q < Q.e.length; q++) {
      const e = Q.e[q]
      if (E.t[e] !== 종류.닫힌폴리선) continue
      const ln = (layers[E.ly[e]] || {}).name || ''
      if (!면적선층.test(ln) || 가구말.test(ln)) continue
      if (!조각.has(e)) 조각.set(e, q)
    }
    for (const [, q] of 조각) {
      const s0 = Q.p0[q], n = Q.pn[q]
      if (n < 3) continue
      const r = []
      for (let i = 0; i < n; i++) r.push([P[(s0 + i) * 2], P[(s0 + i) * 2 + 1]])
      const A = Math.abs(고리넓이(r))
      if (A * k * k < 0.8e6) continue
      if (r.some(([x, y]) => x < B[0] || x > B[2] || y < B[1] || y > B[3])) continue
      면적선들.push({ r, A })
    }
    면적선들.sort((a, b) => a.A - b.A)
  }

  /* 실찾기 — 이름 없는 공간 짐작 · 설계자 면적 글 */
  let 찾은 = []
  if (o.짐작 !== false) { try { 찾은 = 실찾기(모델, { k }) } catch (e) { 찾은 = [] } }

  /* 표(라벨) — 칸마다 방 번호 · -1 벽(또는 선) · -2 바깥 */
  const 표 = new Int32Array(NN).fill(-1)
  for (let cc = 0; cc < NN; cc++) if (밖[cc]) 표[cc] = -2
  const 방들 = []
  const 새방 = (이름, 덩id, 덧) => { const 번 = 방들.length; 방들.push({ 번호: 번, 이름, 덩: 덩id, 수: 0, 테: 0, ...덧 }); return 번 }
  덩이.forEach((d, id) => {
    if (!공간인가[id]) return
    const 들 = 덩이름.get(id) || []
    const 칸들 = []
    for (let j = d.j0; j <= d.j1; j++) for (let i = d.i0; i <= d.i1; i++) { const cc = j * NX + i; if (덩[cc] === id) 칸들.push(cc) }
    if (들.length >= 2) {
      /* 면적선으로 나눔 */
      const 쓸 = 들.map((n) => 면적선들.find((a) => 고리안(a.r, n.x, n.y)) || null)
      if (쓸.filter(Boolean).length >= 2) {
        const 번들 = 들.map((n, q) => 새방(n.s, id, { 이름글: [n], 면적선: 쓸[q] ? Math.abs(쓸[q].A) * k * k / 1e6 : null }))
        for (const cc of 칸들) {
          const [x, y] = 칸중심(cc)
          let 고른 = -1, 작 = Infinity
          for (let q = 0; q < 들.length; q++) { const a = 쓸[q]; if (a && a.A < 작 && 고리안(a.r, x, y)) { 작 = a.A; 고른 = q } }
          if (고른 >= 0) 표[cc] = 번들[고른]
        }
        /* 남은 칸(어느 면적선에도 안 든 곳) — 이어진 덩이마다: 면적선 없는 이름이 들었으면 그 실 · 0.8 ㎡ 넘으면 이름 없는 공간 ·
           작은 틈(면적선과 벽 사이)은 곁의 실로 (예전에는 모두 가까운 이름으로 나눠 경계가 비스듬했음 — 진월면사무소 홀 · 라운지) */
        const 남 = new Set(칸들.filter((cc) => 표[cc] < 0))
        const 작은 = []
        for (const s0 of 남) {
          if (표[s0] !== -1 || !남.has(s0)) continue
          const 덩칸 = [s0]; 남.delete(s0)
          for (let q = 0; q < 덩칸.length; q++) {
            const cc = 덩칸[q], i = cc % NX
            for (const dd of [i > 0 ? cc - 1 : -1, i < NX - 1 ? cc + 1 : -1, cc - NX, cc + NX]) if (dd >= 0 && 남.has(dd)) { 남.delete(dd); 덩칸.push(dd) }
          }
          const 든 = []
          const 덩표 = new Set(덩칸)
          for (let q = 0; q < 들.length; q++) if (!쓸[q] && 덩표.has(들[q].cc)) 든.push(q)
          if (든.length) {
            const 번 = 번들[든[0]]
            if (든.length > 1) 방들[번].이름 = 든.map((q) => 들[q].s).join('·')
            for (const cc of 덩칸) 표[cc] = 번
          } else if (덩칸.length * c * c * k * k >= 0.8e6) {
            const 번 = 새방('', id, { 이름없음: true, 이름글: [] })
            for (const cc of 덩칸) 표[cc] = 번
          } else 작은.push(...덩칸)
        }
        let h = 0, t = 0
        for (const cc of 칸들) if (표[cc] >= 0) 줄[t++] = cc
        while (h < t) {
          const cc = 줄[h++]
          const i = cc % NX
          for (const dd of [i > 0 ? cc - 1 : -1, i < NX - 1 ? cc + 1 : -1, cc - NX, cc + NX]) {
            if (dd < 0 || dd >= NN || 덩[dd] !== id || 표[dd] >= 0) continue
            표[dd] = 표[cc]; 줄[t++] = dd
          }
        }
        void 작은
        return
      }
      const 번 = 새방(들.map((n) => n.s).join('·'), id, { 이름글: 들 })
      for (const cc of 칸들) 표[cc] = 번
      return
    }
    if (들.length === 1) { const 번 = 새방(들[0].s, id, { 이름글: 들 }); for (const cc of 칸들) 표[cc] = 번; return }
    /* 이름 없는 공간 — 실찾기 짐작 */
    let 짐 = null
    for (const r of 찾은) {
      if (!r.이름없음 && !r.짐작) continue
      const q = 어느칸(r.x, r.y)
      if (q >= 0 && 덩[q] === id) { 짐 = r; break }
    }
    const 넓 = d.수 * c * c * k * k / 1e6
    if (넓 < 1) return
    const 이름 = 짐 && 짐.짐작 ? 짐.이름 : ''
    const 번 = 새방(이름, id, { 이름없음: !이름, 짐작: !!이름, 이름글: [] })
    for (const cc of 칸들) 표[cc] = 번
  })

  /* 칸이 하나도 없는 실(면적선 없는 이름이 다른 실에 먹힌 것 · 0 ㎡)은 뺌 — 번호 다시 */
  {
    const 셈칸 = new Int32Array(방들.length)
    for (let cc = 0; cc < NN; cc++) if (표[cc] >= 0) 셈칸[표[cc]]++
    const 새번 = new Int32Array(방들.length).fill(-1)
    const 남방 = []
    방들.forEach((R, i) => { if (셈칸[i] * c * c * k * k >= 0.3e6) { 새번[i] = 남방.length; R.번호 = 남방.length; 남방.push(R) } })
    if (남방.length !== 방들.length) {
      for (let cc = 0; cc < NN; cc++) if (표[cc] >= 0) 표[cc] = 새번[표[cc]] >= 0 ? 새번[표[cc]] : -1
      방들.length = 0; 방들.push(...남방)
    }
  }
  /* 방마다 칸 수 · 테두리(막은 칸과 닿은 변 — 넓이를 선 가운데까지) · 상자 · 라벨 자리(가장 안쪽 칸) */
  const 범 = 방들.map(() => [NX, NY, -1, -1])
  for (let cc = 0; cc < NN; cc++) {
    const b = 표[cc]
    if (b < 0) continue
    const R = 방들[b]; R.수++
    const i = cc % NX, j = (cc / NX) | 0
    const 바 = 범[b]
    if (i < 바[0]) 바[0] = i; if (j < 바[1]) 바[1] = j; if (i > 바[2]) 바[2] = i; if (j > 바[3]) 바[3] = j
    if (i > 0 && 판칸[cc - 1]) R.테++; if (i < NX - 1 && 판칸[cc + 1]) R.테++
    if (j > 0 && 판칸[cc - NX]) R.테++; if (j < NY - 1 && 판칸[cc + NX]) R.테++
  }
  const 안거 = 체스거리(NX, NY, (cc) => true && 표[cc] < 0)
  const 깊 = 방들.map(() => [-1, 0])
  /* 방 경계(다른 방과 맞닿은 곳)도 라벨 자리에서 멀게 — 방이 다른 방과 붙은 칸은 거리 0 으로 */
  for (let cc = 0; cc < NN; cc++) {
    const b = 표[cc]
    if (b < 0) continue
    const i = cc % NX
    let d = 안거[cc]
    const 이웃다름 = (i > 0 && 표[cc - 1] !== b) || (i < NX - 1 && 표[cc + 1] !== b) || (cc >= NX && 표[cc - NX] !== b) || (cc < NN - NX && 표[cc + NX] !== b)
    if (이웃다름) d = 0
    if (d > 깊[b][1]) 깊[b] = [cc, d]
  }
  const 판mm = (v) => v * k
  for (const R of 방들) {
    const 바 = 범[R.번호]
    R.칸범위 = 바
    R.면적 = (R.수 + R.테 / 2) * c * c * k * k / 1e6
    R.고리들 = 테두리들(표, NX, NY, R.번호, 바, 0.75).map((r) => r.map(([i, j]) => [x0 + i * c, y0 + j * c]))
    const [cc, d] = 깊[R.번호]
    /* 라벨 자리 — 이름 글이 하나면 그 글 자리(설계자가 놓은 곳) · 아니면 가장 안쪽 */
    const 글 = R.이름글 && R.이름글.length === 1 ? R.이름글[0] : null
    R.라벨 = 글 && 표[어느칸(글.x, 글.y)] === R.번호 ? [글.x, 글.y] : cc >= 0 ? 칸중심(cc) : [(R.이름글?.[0]?.x) || 0, (R.이름글?.[0]?.y) || 0]
    R.여유폭 = 판mm(Math.max(1, d) * c * 2)          /* mm — 라벨이 들어갈 너비(가장 안쪽 칸의 두 배 거리) */
    R.상자 = [x0 + 바[0] * c, y0 + 바[1] * c, x0 + (바[2] + 1) * c, y0 + (바[3] + 1) * c]
    R.용도 = R.이름 ? 용도(R.이름) : '기타'
    /* 설계자 면적 글 · 실찾기 짐작의 디딤판 등 */
    const 짝 = 찾은.find((r) => !r.이름없음 && r.도면면적 && R.이름 && r.이름.split('·').some((s) => R.이름.split('·').includes(s)) && 어느칸(r.x, r.y) >= 0 && 표[어느칸(r.x, r.y)] === R.번호)
    if (짝) R.도면면적 = 짝.도면면적
    delete R.덩
  }

  /* 바깥 테두리(건물 발자국 — 벽 채움) */
  const 발 = new Uint8Array(NN)
  for (let cc = 0; cc < NN; cc++) 발[cc] = 밖[cc] ? 0 : 1
  const 외곽 = 테두리들(발, NX, NY, 1, null, 0.75).map((r) => r.map(([i, j]) => [x0 + i * c, y0 + j * c])).filter((r) => Math.abs(고리넓이(r)) * k * k >= 2e6)
  const 발넓이 = 외곽.reduce((s, r) => s + 고리넓이(r), 0) * k * k / 1e6

  /* 바탕 선 — 판 안 도형(꺼진 층 · 글 · 치수 · 해치 · 면적선 · 중심선 빼고) */
  const 선들 = []
  {
    const 끈 = layers.map((L) => !!(L && L.hide))
    const 종류캐시 = new Map()
    for (let q = 0; q < Q.e.length; q++) {
      const e = Q.e[q]
      const t = E.t[e]
      if (t === 종류.글자 || t === 종류.치수 || t === 종류.해치 || t === 종류.채움 || t === 종류.지시선) continue
      if (끈[E.ly[e]]) continue
      const s0 = Q.p0[q], n = Q.pn[q]
      if (n < 2) continue
      const px = P[s0 * 2], py = P[s0 * 2 + 1]
      if (px < B[0] || px > B[2] || py < B[1] || py > B[3]) continue
      const ln = (layers[E.ly[e]] || {}).name || ''
      const bn = E.ins[e] >= 0 && I && I[E.ins[e]] ? I[E.ins[e]].name || '' : ''
      const 키 = ln + '|' + bn
      let 종 = 종류캐시.get(키)
      if (종 === undefined) { 종 = 선종류(ln, bn); 종류캐시.set(키, 종) }
      if (!종 || 종 === '소방') continue
      const 점 = new Float64Array(n * 2)
      for (let i = 0; i < n * 2; i++) 점[i] = P[s0 * 2 + i]
      선들.push({ 종, 점, 닫힘: t === 종류.닫힌폴리선 || t === 종류.원 })
    }
  }

  /* 소방 설비(블록 이름) */
  const 장비들 = []
  for (const b of I || []) {
    if (b.x < B[0] || b.x > B[2] || b.y < B[1] || b.y > B[3]) continue
    if (/옥외/.test(b.name || '')) continue
    const 종 = 장비종류들.find((u) => u.말.test(b.name || ''))
    if (종) 장비들.push({ 종류: 종.키, x: b.x, y: b.y, 자동: true, 블록: b.name })
  }

  /* 출구 후보 — ① 계단실 ② 바깥으로 난 문 ③ «비상구 · EXIT» 글 곁 문 */
  const 출구들 = []
  for (const R of 방들) {
    if (R.용도 !== '코어' || !/계단|STAIR|피난/i.test(R.이름 || '')) continue
    const d = 방문(R, 문들, 표, 어느칸, k)
    출구들.push({ 종류: '계단', 이름: R.이름, 방: R.번호, x: d ? d[0] : R.라벨[0], y: d ? d[1] : R.라벨[1], 켬: true })
  }
  const 문자리들 = 문들.map((d) => 문중심(d))
  문들.forEach((d, n) => {
    const [mx, my, nx, ny] = 문자리들[n]
    const 쪽 = (s) => {
      for (const dist of [180, 350, 600, 900]) {
        const cc = 어느칸(mx + nx * s * dist / k, my + ny * s * dist / k)
        if (cc < 0) return -9
        if (밖[cc]) return -2
        if (표[cc] >= 0) return 표[cc]
      }
      return -1
    }
    const a = 쪽(1), b = 쪽(-1)
    if ((a === -2 && b >= 0) || (b === -2 && a >= 0)) {
      const 안 = a >= 0 ? a : b
      const s = a === -2 ? 1 : -1
      출구들.push({ 종류: '출입구', 이름: (방들[안] && 방들[안].이름 ? 방들[안].이름 + ' ' : '') + '출입문', 방: 안, x: mx, y: my, 밖x: mx + nx * s * 700 / k, 밖y: my + ny * s * 700 / k, 켬: true })
    }
  })
  {
    const { T } = 모델
    for (let i = 0; i < T.s.length; i++) {
      const t = 붙임(T.s[i])
      if (!/^(비상구|비상출구|EXIT|EMERGENCYEXIT|피난구)$/i.test(t)) continue
      if (T.x[i] < B[0] || T.x[i] > B[2] || T.y[i] < B[1] || T.y[i] > B[3]) continue
      let best = -1, bd = 3000 / k
      문자리들.forEach(([mx, my], n) => { const dd = Math.hypot(mx - T.x[i], my - T.y[i]); if (dd < bd) { bd = dd; best = n } })
      if (best < 0) continue
      const [mx, my] = 문자리들[best]
      if (출구들.some((x) => Math.hypot(x.x - mx, x.y - my) < 800 / k)) continue
      출구들.push({ 종류: '비상구', 이름: '비상구', x: mx, y: my, 켬: true })
    }
  }

  /* 현관 · 방풍실 · 주출입구 이름의 실 — 자동문 · 미닫이(열림 호 없음)라 문으로 못 찾은 주 출입구 */
  for (const R of 방들) {
    if (!R.이름 || !/방풍|현관|주\s*출입|출입구|ENTR/i.test(R.이름)) continue
    if (출구들.some((x) => Math.hypot(x.x - R.라벨[0], x.y - R.라벨[1]) < 3000 / k)) continue
    출구들.push({ 종류: '출입구', 이름: R.이름, 방: R.번호, 방전체: true, x: R.라벨[0], y: R.라벨[1], 켬: true })
  }
  /* 바깥으로 난 문이 있는 층(지상 1층)에서는 계단이 출구가 아님 — 처음엔 꺼 둠(목록에서 켤 수 있음) */
  if (출구들.some((x) => x.종류 === '출입구')) for (const x of 출구들) if (x.종류 === '계단') x.켬 = false
  /* 가까운 출구(양여닫이 문 두 짝 · 같은 문) 하나로 */
  for (let i = 0; i < 출구들.length; i++) for (let j = 출구들.length - 1; j > i; j--) {
    const a = 출구들[i], b = 출구들[j]
    if (a.종류 === b.종류 && Math.hypot(a.x - b.x, a.y - b.y) < 2500 / k) 출구들.splice(j, 1)
  }
  return {
    k, 칸: c, x0, y0, NX, NY, 상자: B, 제목: 판.제목, 판번호: 판.번호,
    방들, 외곽, 발넓이, 선들, 문들, 장비들, 출구들,
    _: { 표, 밖, 판칸, 덩, 공간인가 },
  }
}

/** 문 가운데 · 문에 수직 방향(단위) — 닫힌 문짝 자리 기준 (닫힌 끝을 모르면 e 로 고른 끝) */
function 문중심(d, e = d.닫힌 || d.p) {
  const mx = (d.c[0] + e[0]) / 2, my = (d.c[1] + e[1]) / 2
  const ux = e[0] - d.c[0], uy = e[1] - d.c[1], L = Math.hypot(ux, uy) || 1
  return [mx, my, -uy / L, ux / L]
}
const 문끝들 = (d) => (d.닫힌 ? [d.닫힌] : [d.p, d.q])
/** 방에 붙은 문 하나(가운데) — 그 방 칸과 다른 공간 칸이 문 양쪽에 있는 것 */
function 방문(R, 문들, 표, 어느칸, k) {
  for (const d of 문들) for (const e of 문끝들(d)) {
    const [mx, my, nx, ny] = 문중심(d, e)
    let 이쪽 = false, 저쪽 = false
    for (const s of [1, -1]) for (const dist of [180, 350, 600]) {
      const cc = 어느칸(mx + nx * s * dist / k, my + ny * s * dist / k)
      if (cc < 0) continue
      if (표[cc] === R.번호) 이쪽 = true
      else if (표[cc] >= 0 || 표[cc] === -2) 저쪽 = true
    }
    if (이쪽 && 저쪽) return [mx, my]
  }
  return null
}

/* ───────────────────────────── ⑦ 피난 길 */

/**
 * 문을 연 칸 판 — 벽 · 기둥 · 창 · 계단 선은 막고 문(문짝 · 호 · 문 블록)은 뺌 · 벽에서 0.2 m 띄움
 * @returns G { cp, NX, NY, x0, y0, 막, 무게 }
 */
export function 피난준비(모델, k, D, o = {}) {
  const { Q, P, E, layers, I } = 모델
  const 막도형 = 막는도형(모델)
  const B = D.상자
  let cp = (o.칸mm || 50) / k
  while (((B[2] - B[0]) / cp) * ((B[3] - B[1]) / cp) > 1.5e6) cp *= 1.25
  const NX = Math.ceil((B[2] - B[0]) / cp) + 2, NY = Math.ceil((B[3] - B[1]) / cp) + 2
  const x0 = B[0] - cp, y0 = B[1] - cp, NN = NX * NY
  const 판 = new Uint8Array(NN)
  const 문층 = layers.map((L) => 문층말.test((L && L.name) || ''))
  const 벽층 = layers.map((L) => 벽말.test((L && L.name) || ''))
  const 창층 = layers.map((L) => 창말.test((L && L.name) || ''))
  const 문블 = (I || []).map((b) => 문블록말.test(b.name || '') && !창말.test(b.name || ''))
  const 벽토 = []
  const 그 = (a, b, cc, d) => 긋기(판, NX, NY, (a - x0) / cp, (b - y0) / cp, (cc - x0) / cp, (d - y0) / cp)
  for (let q = 0; q < Q.e.length; q++) {
    const e = Q.e[q]
    if (!막도형[e]) continue
    if (E.t[e] === 종류.호 && (문층[E.ly[e]] || E.ins[e] >= 0)) continue
    if (문층[E.ly[e]] && !창층[E.ly[e]]) continue
    if (E.ins[e] >= 0 && 문블[E.ins[e]]) continue
    const s0 = Q.p0[q], n = Q.pn[q]
    const fx = P[s0 * 2], fy = P[s0 * 2 + 1]
    if (fx < B[0] - 5000 / k || fx > B[2] + 5000 / k || fy < B[1] - 5000 / k || fy > B[3] + 5000 / k) continue
    for (let i = 0; i + 1 < n; i++) {
      const a = P[(s0 + i) * 2], b = P[(s0 + i) * 2 + 1], cc = P[(s0 + i + 1) * 2], d = P[(s0 + i + 1) * 2 + 1]
      그(a, b, cc, d)
      if (벽층[E.ly[e]]) 벽토.push(a, b, cc, d)
    }
  }
  const 끝막 = 벽끝막기(벽토, k)
  for (let i = 0; i < 끝막.length; i += 4) 그(끝막[i], 끝막[i + 1], 끝막[i + 2], 끝막[i + 3])
  /* 손으로 막은 곳(o.막음: [[x0,y0,x1,y1] 선]) */
  for (const s of o.막음 || []) 그(s[0], s[1], s[2], s[3])
  /* 🚪 문 자리는 꼭 지나가게 — 문짝이 닫히는 자리(돌쩌귀 → 닫힌 끝) 앞뒤 0.35 m 를 뚫음
     (문 그림만 있고 벽 선이 문 자리에서 끊기지 않은 도면도 길이 남) */
  const 뚫을 = []
  for (const d of (막토(모델, k).문들 || [])) for (const e of d.닫힌 ? [d.닫힌] : [d.p, d.q]) {      /* 닫힌 끝을 모르면 두 끝 다 */
    const ux = e[0] - d.c[0], uy = e[1] - d.c[1], L = Math.hypot(ux, uy)
    if (!(L > 0)) continue
    const nx = -uy / L, ny = ux / L, 폭 = 350 / k, 끝여 = 80 / k
    for (let t = 끝여; t <= L - 끝여; t += cp / 2) for (let s = -폭; s <= 폭; s += cp / 2) {
      const x = d.c[0] + (ux / L) * t + nx * s, y = d.c[1] + (uy / L) * t + ny * s
      const i = Math.floor((x - x0) / cp), j = Math.floor((y - y0) / cp)
      if (i >= 0 && j >= 0 && i < NX && j < NY) 뚫을.push(j * NX + i)
    }
  }
  for (const cc of 뚫을) 판[cc] = 0
  const 거 = 체스거리(NX, NY, (cc) => 판[cc] !== 0)
  const r = Math.max(1, Math.round(200 / k / cp))
  const 막 = new Uint8Array(NN)
  for (let cc = 0; cc < NN; cc++) 막[cc] = 거[cc] <= r ? 1 : 0
  for (const cc of 뚫을) 막[cc] = 0
  /* 무게 — 벽 가까이(0.7 m 안)는 비싸게 → 복도 · 방 가운데로 */
  const D0 = Math.max(2, 700 / k / cp)
  const 무게 = new Float32Array(NN)
  for (let cc = 0; cc < NN; cc++) { const t = Math.max(0, 1 - (거[cc] - r) / D0); 무게[cc] = 1 + 2.5 * t * t }
  return { cp, NX, NY, x0, y0, 막, 무게, k }
}

class 더미 {          /* 작은 값 먼저 꺼내는 쌓기(이진 힙) */
  constructor(n) { this.v = new Float64Array(n); this.i = new Int32Array(n); this.n = 0 }
  넣(v, i) {
    if (this.n >= this.v.length) { const v2 = new Float64Array(this.v.length * 2); v2.set(this.v); this.v = v2; const i2 = new Int32Array(this.i.length * 2); i2.set(this.i); this.i = i2 }
    let k = this.n++
    while (k > 0) { const p = (k - 1) >> 1; if (this.v[p] <= v) break; this.v[k] = this.v[p]; this.i[k] = this.i[p]; k = p }
    this.v[k] = v; this.i[k] = i
  }
  꺼냄() {
    const top = this.i[0], tv = this.v[0]
    const v = this.v[--this.n], i = this.i[this.n]
    let k = 0
    for (;;) { let c = 2 * k + 1; if (c >= this.n) break; if (c + 1 < this.n && this.v[c + 1] < this.v[c]) c++; if (this.v[c] >= v) break; this.v[k] = this.v[c]; this.i[k] = this.i[c]; k = c }
    this.v[k] = v; this.i[k] = i
    this.값 = tv
    return top
  }
}

/** 출구 칸들 — 계단실이면 그 방 칸 모두 · 아니면 출구 점(바깥 문이면 문 밖 점) 둘레 0.5 m */
function 출구칸들(G, D, 출) {
  const { NX, NY, x0, y0, cp, 막 } = G
  const out = []
  if (출.방 !== undefined && 출.방 >= 0 && (출.종류 === '계단' || 출.방전체)) {
    const 표 = D._.표
    for (let cc = 0; cc < NX * NY; cc++) {
      if (막[cc]) continue
      const x = x0 + ((cc % NX) + 0.5) * cp, y = y0 + (((cc / NX) | 0) + 0.5) * cp
      const i = Math.floor((x - D.x0) / D.칸), j = Math.floor((y - D.y0) / D.칸)
      if (i < 0 || j < 0 || i >= D.NX || j >= D.NY) continue
      if (표[j * D.NX + i] === 출.방) out.push(cc)
    }
    if (out.length) return out
  }
  const px = 출.밖x ?? 출.x, py = 출.밖y ?? 출.y
  const R = Math.max(2, Math.round(500 / G.k / cp))
  const ci = Math.floor((px - x0) / cp), cj = Math.floor((py - y0) / cp)
  for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
    if (di * di + dj * dj > R * R) continue
    const i = ci + di, j = cj + dj
    if (i < 0 || j < 0 || i >= NX || j >= NY) continue
    const cc = j * NX + i
    if (!막[cc]) out.push(cc)
  }
  return out
}

/** 한 출구에서 퍼진 거리 장 { 거리, 앞 } */
export function 피난장(G, D, 출) {
  const { NX, NY, 막, 무게 } = G
  const NN = NX * NY
  const 거리 = new Float64Array(NN).fill(Infinity)
  const 앞 = new Int32Array(NN).fill(-1)
  const h = new 더미(1 << 16)
  for (const cc of 출구칸들(G, D, 출)) { 거리[cc] = 0; h.넣(0, cc) }
  const 대 = Math.SQRT2
  while (h.n) {
    const cc = h.꺼냄()
    const dv = h.값
    if (dv > 거리[cc]) continue
    const i = cc % NX, j = (cc / NX) | 0
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      if (!di && !dj) continue
      const ii = i + di, jj = j + dj
      if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) continue
      const d = jj * NX + ii
      if (막[d]) continue
      if (di && dj && (막[j * NX + ii] || 막[jj * NX + i])) continue          /* 모서리 건너뛰기 막음 */
      const nv = dv + (di && dj ? 대 : 1) * (무게[cc] + 무게[d]) / 2
      if (nv < 거리[d]) { 거리[d] = nv; 앞[d] = cc; h.넣(nv, d) }
    }
  }
  return { 거리, 앞 }
}

/** 칸 사이 곧은 줄이 막힘 없이 지나나 */
function 보임(G, a, b) {
  /* 칸 가운데끼리 잇는 곧은 줄을 1/4 칸씩 따라가며 지나는 칸을 모두 봄(그린 길이 막힌 칸 모서리를 스치지 않게) */
  const { NX, 막 } = G
  const ax = (a % NX) + 0.5, ay = ((a / NX) | 0) + 0.5, bx = (b % NX) + 0.5, by = ((b / NX) | 0) + 0.5
  const n = Math.ceil(Math.max(Math.abs(bx - ax), Math.abs(by - ay)) * 4)
  for (let s = 1; s < n; s++) {
    const i = Math.floor(ax + ((bx - ax) * s) / n), j = Math.floor(ay + ((by - ay) * s) / n)
    if (막[j * NX + i]) return false
  }
  return true
}

/** (x, y) 에서 출구까지 — 점들(모델 좌표) · 길이(m) · 못 가면 null */
export function 길따라(G, 장, x, y, D = null, 방 = -1) {
  const { NX, NY, x0, y0, cp, 막 } = G
  let i = Math.floor((x - x0) / cp), j = Math.floor((y - y0) / cp)
  if (i < 0 || j < 0 || i >= NX || j >= NY) return null
  let s = j * NX + i
  /* 그 방 칸인가(다른 방 · 바깥으로 건너뛰어 시작하지 않게) */
  const 그방 = (q) => {
    if (!D || 방 < 0) return true
    const px = x0 + ((q % NX) + 0.5) * cp, py = y0 + (((q / NX) | 0) + 0.5) * cp
    const a = Math.floor((px - D.x0) / D.칸), b = Math.floor((py - D.y0) / D.칸)
    return a >= 0 && b >= 0 && a < D.NX && b < D.NY && D._.표[b * D.NX + a] === 방
  }
  if (막[s] || !isFinite(장.거리[s])) {
    let best = -1, bd = Infinity
    const R = Math.round(2500 / G.k / cp)
    for (let dj = -R; dj <= R; dj++) for (let di = -R; di <= R; di++) {
      const ii = i + di, jj = j + dj
      if (ii < 0 || jj < 0 || ii >= NX || jj >= NY) continue
      const q = jj * NX + ii
      if (막[q] || !isFinite(장.거리[q]) || !그방(q)) continue
      const d = di * di + dj * dj
      if (d < bd) { bd = d; best = q }
    }
    if (best < 0) return null
    s = best
  }
  const 칸들 = [s]
  for (let n = 0; n < NX * NY && 장.앞[칸들[칸들.length - 1]] >= 0; n++) 칸들.push(장.앞[칸들[칸들.length - 1]])
  const 점들 = 당기기(G, 칸들)
  let L = 0
  for (let q = 1; q < 점들.length; q++) L += Math.hypot(점들[q][0] - 점들[q - 1][0], 점들[q][1] - 점들[q - 1][1])
  return { 점들, 길이: (L * G.k) / 1000, 칸들 }
}
/** 줄 당기기 — 칸 줄을 보이는 데까지 곧게 → 점들(모델 좌표) */
function 당기기(G, 칸들) {
  const { NX, x0, y0, cp } = G
  const 남 = [칸들[0]]
  let a = 0
  while (a < 칸들.length - 1) {
    let b = Math.min(칸들.length - 1, a + 400)
    while (b > a + 1 && !보임(G, 칸들[a], 칸들[b])) b--
    남.push(칸들[b]); a = b
  }
  return 남.map((cc) => [x0 + ((cc % NX) + 0.5) * cp, y0 + (((cc / NX) | 0) + 0.5) * cp])
}

/**
 * 길 나무 — 방마다 길(칸 줄)을 긴 것부터 그리되, 앞서 그린 길에 닿으면 거기서 끊음 → 갈래가 줄기로 모이는 그림
 * @returns [{ 점들(모델), 닿음 }]
 */
export function 길나무(G, 길들, 빼는방 = -1, 먼저칸들 = null) {
  const 쓴 = new Uint8Array(G.NX * G.NY)
  const NX = G.NX
  const 목록 = [...길들.entries()].filter(([b, w]) => b !== 빼는방 && w.첫 && w.첫.칸들 && w.첫.칸들.length > 1).sort((a, b) => b[1].첫.길이 - a[1].첫.길이)
  const r = Math.max(1, Math.round(600 / G.k / G.cp))
  const 줄기 = new Uint8Array(G.NX * G.NY)
  /* 현위치 실의 길(굵게 따로 그림)을 먼저 줄기로 — 다른 방 길이 거기로 모이게 */
  const 내 = 빼는방 >= 0 ? 길들.get(빼는방) : null
  const 먼저 = 먼저칸들 || (내 && 내.첫 && 내.첫.칸들) || null
  if (먼저) for (const cc of 먼저) {
    줄기[cc] = 1
    const i = cc % NX, j = (cc / NX) | 0
    for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < NX && jj < G.NY) 쓴[jj * NX + ii] = 1 }
  }
  const out = []
  for (const [, w] of 목록) {
    const 칸들 = w.첫.칸들
    let 끝 = 칸들.length - 1, 닿음 = false
    for (let q = 2; q < 칸들.length; q++) if (쓴[칸들[q]]) { 끝 = q; 닿음 = true; break }
    const 조각 = 칸들.slice(0, 끝 + 1)
    /* 닿은 곳 → 가장 가까운 줄기 칸까지 이어 붙임(허공에서 끝나지 않게) */
    if (닿음) {
      const e = 조각[조각.length - 1], i = e % NX, j = (e / NX) | 0
      let best = -1, bd = Infinity
      for (let dj = -r - 1; dj <= r + 1; dj++) for (let di = -r - 1; di <= r + 1; di++) {
        const ii = i + di, jj = j + dj
        if (ii < 0 || jj < 0 || ii >= NX || jj >= G.NY) continue
        const q = jj * NX + ii
        if (!줄기[q]) continue
        const d = di * di + dj * dj
        if (d < bd) { bd = d; best = q }
      }
      if (best >= 0) 조각.push(best)
    }
    for (const cc of 조각) 줄기[cc] = 1
    for (const cc of 조각) {
      const i = cc % NX, j = (cc / NX) | 0
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) { const ii = i + di, jj = j + dj; if (ii >= 0 && jj >= 0 && ii < NX && jj < G.NY) 쓴[jj * NX + ii] = 1 }
    }
    if (조각.length >= 2) out.push({ 점들: 당기기(G, 조각), 닿음 })
  }
  return out
}

/**
 * 방마다 가까운 출구 길 + 다른 출구 길
 * @returns { 장들, 길들: Map(방번호 → { 첫: {출구, 점들, 길이}, 둘: … | null }) }
 */
export function 피난길들(G, D, 출구들, 방번호들, 장캐시 = new Map()) {
  const 켠 = 출구들.filter((x) => x.켬 !== false)
  const 장들 = 켠.map((x) => {
    const 키 = [x.종류, x.방, x.방전체 ? 1 : 0, Math.round(x.x), Math.round(x.y), x.밖x, x.밖y].join('|')
    let 장 = 장캐시.get(키)
    if (!장) { 장 = 피난장(G, D, x); 장캐시.set(키, 장) }
    return 장
  })
  const 길들 = new Map()
  for (const b of 방번호들) {
    const R = D.방들[b]
    if (!R) continue
    const 후보 = []
    장들.forEach((장, q) => {
      if (켠[q].방 === b) return                       /* 계단실 자신 */
      const w = 길따라(G, 장, R.라벨[0], R.라벨[1], D, b)
      if (w) 후보.push({ 출구: 켠[q], ...w })
    })
    후보.sort((a, b2) => a.길이 - b2.길이)
    길들.set(b, { 첫: 후보[0] || null, 둘: 후보.find((x, n) => n > 0 && x.출구 !== 후보[0].출구) || null })
  }
  const 결과 = { 장들, 켠, 길들, 장캐시, 나무: (빼는방, 먼저칸들) => 길나무(G, 길들, 빼는방, 먼저칸들) }
  /** 아무 점(손으로 찍은 현위치)에서 — { 첫, 둘 } */
  결과.점길 = (x, y) => {
    const 후보 = []
    장들.forEach((장, q) => { const w = 길따라(G, 장, x, y); if (w) 후보.push({ 출구: 켠[q], ...w }) })
    후보.sort((a, b) => a.길이 - b.길이)
    return { 첫: 후보[0] || null, 둘: 후보.find((v, n) => n > 0 && v.출구 !== 후보[0].출구) || null }
  }
  return 결과
}
