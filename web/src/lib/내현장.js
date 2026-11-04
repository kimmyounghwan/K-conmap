/**
 * 🏗 내 현장 · 내 일 — 마이컨맵(/my) 맨 위 (G539 · 2026-11-05)
 *   소장님 「마이컨맵을 새로게 리모델링 하고 싶어」 → «명함» 중심에서 «내 현장 · 내 일» 중심으로
 *   「마이컨맵 리모델링 안에서 자료를 줄때, 다시 방문하게 해야 해...알지?」 · 「페이지 전체를 리모델링 해주고, 설명글도 자세히 해주고」
 * ■ 현장을 한 번 적으면
 *   ① 서식 공통 칸(kcm.서식공통 — tools/격자작성.jsx · tools/서식작성.jsx 가 읽음)에 넣어 서식 242가지가 그 현장 값으로 열림
 *   ② 할 일 날짜가 나옴 — 낙찰 뒤 할 일(lib/계약셈.js 낙찰뒤할일 · 2026-09-28 조문 확인 그대로) + 공사안전보건대장(G538 · 고시 제7조 ② · 제8조 ①) + 착공 · 준공 날
 *   ③ 열 때마다 «오늘 기준» 으로 다시 셈 — 남은 날 · 지난 날 · 다음 할 일(파일이 아니라 사이트에서만 셈 → 다시 찾게)
 *   ④ ✓ 했음은 현장마다 이 기기에 · 폰 달력(.ics)의 일정마다 «이어 보기: k-conmap.com/my»
 * ■ 짐작 안 함: 대상 여부(유해위험방지계획서 · 안전관리계획서 · 전기공사 · 전문공사)는 고르는 칸 — 고른 것만 날짜를 냄.
 * ■ 이 기기에만(localStorage) — 서버로 안 감. 시험: node tools/시험_내현장.mjs
 */
import { 낙찰뒤할일, 날읽기, 날글, 날더하기, 날차, 요일글, ics만들기, 발주갈래 } from './계약셈.js'

export const 현장열쇠 = 'kcm.my.현장'
export const 공통열쇠 = 'kcm.서식공통'
export const 현장최대 = 10
export const 갈래들 = 발주갈래.map((x) => [x.k, x.n])
export const 대장선 = 5000000000           // 총공사금액 50억 원 이상 — 산업안전보건법 시행령 제55조(G538 확인)
export const 확인최대 = 12                  // 발주자 이행 확인 줄(3개월 × 12 = 3년)

const 저장소 = () => (typeof localStorage !== 'undefined' ? localStorage : null)
const 글 = (v, n = 80) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n)
const 수 = (v) => { const n = Number(String(v == null ? '' : v).replace(/[^0-9.]/g, '')); return Number.isFinite(n) && n > 0 ? Math.round(n) : 0 }
const 쉼 = (n) => (n > 0 ? Math.round(n).toLocaleString('en-US') : '')

/** 날짜 글 → 'YYYY-MM-DD' — 2026-12-02 · 2026.12.2 · 2026. 12. 2. · 20261202 (없거나 틀리면 '') */
export function 날맞춤(s) {
  const t = String(s == null ? '' : s).trim()
  let m = /^(\d{4})[-./\s]+(\d{1,2})[-./\s]+(\d{1,2})\.?$/.exec(t) || /^(\d{4})(\d{2})(\d{2})$/.exec(t)
  if (!m) return ''
  const d = `${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`
  return 날읽기(d) == null ? '' : d
}
/** 'YYYY-MM-DD' → '2026. 12. 2.(수)' */
export const 날보기 = (s, 요 = true) => { const d = 날맞춤(s); if (!d) return ''; const [y, m, dd] = d.split('-').map(Number); return `${y}. ${m}. ${dd}.` + (요 ? `(${요일글(d)})` : '') }
/** 엑셀 EDATE 와 같게 — 달을 더하고, 그 달에 없는 날은 그 달 끝 */
export function 달더하기(s, n) {
  const t = 날읽기(s); if (t == null) return ''
  const d = new Date(t), y = d.getUTCFullYear(), m = d.getUTCMonth() + n
  const 끝 = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  return 날글(Date.UTC(y, m, Math.min(d.getUTCDate(), 끝)))
}
/** 오늘(한국 시각) 'YYYY-MM-DD' */
export const 오늘날 = (지금 = Date.now()) => { const t = new Date(지금 + 9 * 3600e3); return 날글(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate())) }

/** 현장 한 곳 정리 — 모양 · 길이 · 날짜 · 금액 */
export function 현장정리(h = {}) {
  const 갈래 = 갈래들.some(([k]) => k === h.갈래) ? h.갈래 : '국가'
  return {
    id: /^h[0-9a-z]{4,16}$/.test(String(h.id || '')) ? h.id : 'h' + (Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36)).slice(-10),
    현장: 글(h.현장), 발주: 글(h.발주, 40), 갈래, 계약금액: 수(h.계약금액), 회사: 글(h.회사, 40), 대리인: 글(h.대리인, 20), 위치: 글(h.위치),
    낙찰일: 날맞춤(h.낙찰일), 계약일: 날맞춤(h.계약일), 착공: 날맞춤(h.착공), 준공: 날맞춤(h.준공),
    하도급일: 날맞춤(h.하도급일), 하도급금액: 수(h.하도급금액),
    유해: !!h.유해, 안전: !!h.안전, 전기: !!h.전기, 전문: !!h.전문, 대장: !!h.대장,
    했음: Array.isArray(h.했음) ? [...new Set(h.했음.map((x) => 글(x, 30)).filter(Boolean))].slice(0, 80) : [],
    at: Number(h.at) > 0 ? Number(h.at) : Date.now(),
  }
}
export const 현장맞나 = (h) => !!(h && h.현장 && h.착공 && h.준공 && 날차(h.착공, h.준공) >= 0)

/** 저장된 것 { 지금, 목록 } */
export function 읽기(s = 저장소()) {
  let v = null
  try { v = s && JSON.parse(s.getItem(현장열쇠) || 'null') } catch (e) { v = null }
  const 목록 = v && Array.isArray(v.목록) ? v.목록.filter((x) => x && x.현장).map(현장정리).slice(0, 현장최대) : []
  const 지금 = 목록.some((x) => x.id === (v && v.지금)) ? v.지금 : (목록[0] ? 목록[0].id : '')
  return { 지금, 목록 }
}
function 쓰기(d, s = 저장소()) {
  try { s && s.setItem(현장열쇠, JSON.stringify({ v: 1, 지금: d.지금, 목록: d.목록 })) } catch (e) { return false }
  return true
}
export const 지금현장 = (d = 읽기()) => d.목록.find((x) => x.id === d.지금) || null

/** 지난번 서식에 쓴 공통 칸 → 새 현장 처음 값(공사명 · 발주 · 계약금액 · 회사 · 대리인 · 착공 · 준공 · 위치) */
export function 공통에서(s = 저장소()) {
  let c = {}
  try { c = (s && JSON.parse(s.getItem(공통열쇠) || '{}')) || {} } catch (e) { c = {} }
  return 현장정리({ 현장: c.현장, 발주: c.발주, 계약금액: c.계약금액, 회사: c.회사, 대리인: c.대리인, 착공: c.착공, 준공: c.준공, 위치: c.위치 })
}

/** 지금 현장 값을 서식 공통 칸에 — 현장 칸(공사명 · 발주 · 계약금액 · 착공 · 준공 · 위치)은 이 현장 것으로 바꾸고(비었으면 지움 — 다른 현장 값이 섞이지 않게),
 *  사람 · 회사 칸(회사 · 대리인)은 적은 것만 넣음(비었으면 지난번 그대로). 공기(공사기간)는 넣지 않음 — 서식마다 착공 · 준공에서 셈(G538 «공사기간표시»). 돌려줌: 넣은 칸 수 */
export function 공통보내기(h, s = 저장소()) {
  if (!s || !h) return 0
  let c = {}
  try { c = JSON.parse(s.getItem(공통열쇠) || '{}') || {} } catch (e) { c = {} }
  let n = 0
  const 현장칸 = { 현장: h.현장, 발주: h.발주, 계약금액: 쉼(h.계약금액), 착공: h.착공, 준공: h.준공, 위치: h.위치 }
  for (const [k, v] of Object.entries(현장칸)) { if (v) { c[k] = String(v).slice(0, 80); n++ } else delete c[k] }
  for (const k of ['회사', '대리인']) if (h[k]) { c[k] = String(h[k]).slice(0, 80); n++ }
  try { s.setItem(공통열쇠, JSON.stringify(c)) } catch (e) { return 0 }
  return n
}

/** 저장(새로 · 고침) → 지금 현장으로 · 공통 칸에 넣음 */
export function 저장(h, s = 저장소()) {
  const x = 현장정리(h)
  const d = 읽기(s)
  const i = d.목록.findIndex((y) => y.id === x.id)
  if (i >= 0) d.목록[i] = { ...x, 했음: x.했음.length ? x.했음 : d.목록[i].했음 }
  else { if (d.목록.length >= 현장최대) return { 틀림: `현장은 ${현장최대}곳까지 — 끝난 현장을 지우고 더하십시오` }; d.목록.unshift(x) }
  d.지금 = x.id
  쓰기(d, s)
  return { 현장: x, 칸: 공통보내기(x, s) }
}
export function 고르기(id, s = 저장소()) {
  const d = 읽기(s)
  const x = d.목록.find((y) => y.id === id)
  if (!x) return null
  d.지금 = id
  쓰기(d, s)
  return { 현장: x, 칸: 공통보내기(x, s) }
}
export function 지우기(id, s = 저장소()) {
  const d = 읽기(s)
  d.목록 = d.목록.filter((y) => y.id !== id)
  if (d.지금 === id) d.지금 = d.목록[0] ? d.목록[0].id : ''
  쓰기(d, s)
  const x = 지금현장(d)
  if (x) 공통보내기(x, s)
  return d
}
export function 했음바꿈(id, 열쇠, 켬, s = 저장소()) {
  const d = 읽기(s)
  const x = d.목록.find((y) => y.id === id)
  if (!x) return null
  const 셋 = new Set(x.했음)
  if (켬) 셋.add(열쇠); else 셋.delete(열쇠)
  x.했음 = [...셋].slice(0, 80)
  쓰기(d, s)
  return x
}

/** 공기 막대 — 착공 → 오늘 → 준공 */
export function 공기(h, 오늘 = 오늘날()) {
  if (!h || !h.착공 || !h.준공) return null
  const 전체 = 날차(h.착공, h.준공) + 1
  if (!(전체 > 0)) return null
  const 지남 = 날차(h.착공, 오늘)
  if (지남 < 0) return { 상태: '착공 전', 전체, 경과: 0, 퍼센트: 0, 남은: 날차(오늘, h.준공), 착공까지: -지남 }
  if (날차(h.준공, 오늘) > 0) return { 상태: '준공 지남', 전체, 경과: 전체, 퍼센트: 100, 남은: 0, 지난: 날차(h.준공, 오늘) }
  const 경과 = 지남 + 1
  return { 상태: '공사 중', 전체, 경과, 퍼센트: Math.round(경과 / 전체 * 1000) / 10, 남은: 날차(오늘, h.준공) }
}

/* 할 일마다 갈 곳(서식 · 도구) — 시험이 forms.json · tools.json · main.jsx 에 있는지 대 봄 */
export const 곳표 = {
  계약: ['/forms/gy-dogeup', '공사도급계약서'], 직접시공: ['/forms/jikjeop-sigong-gyehoek', '직접시공계획서'], 대장: ['/tools/after-award', '낙찰 뒤 할 일 달력'],
  내역서: ['/naeyeok', '산출내역서(내역서 탭)'], 유해: ['/forms/yuhae-gyehoek', '유해위험방지계획서'], 안전: ['/forms/anjeon-gyehoek', '안전관리계획서'],
  보험: ['/tools/boheomryo', '고용 · 산재 보험료'], 하도통보: ['/forms/hadogeup-tongbo', '하도급 통보서'], 착공: ['/forms/chakgong', '착공계'], 준공: ['/forms/jungong', '준공계'],
  대장제출: ['/forms/gongsa-anjeon-daejang', '공사안전보건대장'], 대장확인: ['/forms/gongsa-anjeon-daejang', '공사안전보건대장'],
  대금: ['/forms/hadogeup-daegeum', '하도급대금 지급 확인'], 선급: ['/forms/seongeum', '선금 신청서'],
}
const 곳찾기 = (열쇠) => 곳표[열쇠] || 곳표[String(열쇠).replace(/\d+$/, '')] || null

/** 현장 → 할 일 [{ 열쇠, 날, 미룬날?, 제목, 글, 근거, 종류: '기한' | '날' | '늘', 곳, 곳이름, D, 했음 }] — 날 차례 · «늘» 은 뒤 */
export function 할일(h, 오늘 = 오늘날()) {
  if (!h) return []
  const 공기일 = h.착공 && h.준공 ? 날차(h.착공, h.준공) + 1 : 0
  const 일 = 낙찰뒤할일({
    낙찰일: h.낙찰일, 계약일: h.계약일, 착공일: h.착공, 발주: h.갈래, 도급금액: h.계약금액, 공기: 공기일,
    전문: h.전문, 유해: h.유해, 안전: h.안전, 전기: h.전기, 하도급일: h.하도급일, 하도급금액: h.하도급금액,
  }).map((x) => ({ ...x }))
  const 더 = (열쇠, 날, 제목, 글, 근거 = '', 종류 = '날') => 일.push({ 열쇠, 날, 제목, 글, 근거, 종류 })
  if (h.착공) 더('착공', h.착공, '착공 — 착공신고서(착공계)', '착공계 · 현장대리인계 · 공사예정공정표처럼 착공할 때 내는 서류는 서식 탭 «착공할 때» 꾸러미에 차례대로 있습니다. 내 현장 값이 서식에 먼저 들어갑니다.')
  /* 🦺 G538 공사안전보건대장 — 총공사금액 50억 원 이상(시행령 제55조) · 착공 전날까지 제출(고시 제7조 ②) · 착공 뒤 3개월마다 1회 이상 발주자 이행 확인(제8조 ①) */
  if ((h.계약금액 >= 대장선 || h.대장) && h.착공) {
    더('대장제출', 날더하기(h.착공, -1), '공사안전보건대장 제출 (발주자에게)',
      '총공사금액 50억 원 이상 공사 — 설계안전보건대장을 반영한 공사안전보건대장을 착공 전날까지 발주자에게 냅니다. 대지 정리 · 가설사무소 설치 같은 공사 준비 기간은 착공으로 보지 않습니다.',
      '산업안전보건법 제67조 · 시행령 제55조 · 고시 제7조②', '기한')
    if (h.준공 && 날차(h.착공, h.준공) >= 0) {
      for (let k = 1; k <= 확인최대; k++) {
        const 앞 = 달더하기(h.착공, 3 * (k - 1)), 날 = 달더하기(h.착공, 3 * k)
        if (날차(h.준공, 앞) >= 0) break
        const 끝 = 날차(h.준공, 날) > 0
        더('대장확인' + k, 끝 ? h.준공 : 날, `발주자 이행 확인 ${k}회 (공사안전보건대장)`,
          (끝 ? (k === 1 ? '공사가 3개월 안에 끝나 — 준공 전에 1회 이상 확인합니다. ' : '준공 전 마지막 확인입니다. ') : '착공 뒤 3개월마다 1회 이상 확인합니다. ')
          + '발주자가 대장대로 안전보건 조치를 했는지 봅니다 — 이 날 전에 이행 기록 · 지도 · 점검 조치를 정리해 두십시오.', '고시 제8조①', '기한')
      }
    }
  }
  if (h.준공) 더('준공', h.준공, '준공 예정일 — 준공계', '준공계와 준공검사 요청, 준공대가 청구 · 하자보수보증서는 서식 탭 «준공할 때» 꾸러미에 차례대로 있습니다. 늦어질 것 같으면 그 전에 공기연장을 요청합니다.')
  const 했 = new Set(h.했음 || [])
  for (const x of 일) {
    const 곳 = 곳찾기(x.열쇠)
    x.곳 = 곳 ? 곳[0] : ''
    x.곳이름 = 곳 ? 곳[1] : ''
    x.D = x.날 ? 날차(오늘, x.날) : null      // 본래 날까지 셈 — 쉬는 날이라 밀린 기한(미룬날)은 글로만(G328 · 일찍 끝내는 게 안전)
    x.했음 = 했.has(x.열쇠)
  }
  const 날있음 = 일.filter((x) => x.날).sort((a, b) => (a.날 < b.날 ? -1 : a.날 > b.날 ? 1 : (a.열쇠 < b.열쇠 ? -1 : 1)))
  return [...날있음, ...일.filter((x) => !x.날)]
}

/** 맨 위 «오늘 할 일» — 안 한 것 · 날 있는 것 · 지난 지 30일 안(그 전 것은 «전체» 에서) · 앞 n개 */
export function 오늘할일(목록, n = 5) {
  return (목록 || []).filter((x) => x.날 && !x.했음 && x.D >= -30).slice(0, n)
}
/** D 글 — 오늘 · D-3 · 2일 지남 */
export const D글 = (D) => (D == null ? '' : D === 0 ? '오늘' : D > 0 ? `D-${D}` : `${-D}일 지남`)
/** D 색 — 지남(빨강) · 7일 안(노랑) · 그 밖 */
export const D꼴 = (D, 했음) => (했음 ? '했음' : D == null ? '' : D < 0 ? '지남' : D <= 7 ? '곧' : '')

/** 폰 달력(.ics) — 안 한 · 날 있는 것만 · 본래 날(G328 — 일찍 끝내는 게 안전) · 일정마다 «이어 보기: https://k-conmap.com/my» */
export function 달력(h, 목록) {
  const 일 = (목록 || []).filter((x) => x.날 && !x.했음).map((x) => ({ ...x, 글: `${x.글}\n이어 보기: https://k-conmap.com/my` + (x.곳 ? ` · ${x.곳이름}: https://k-conmap.com${x.곳}` : '') }))
  return ics만들기(일, { 이름: `K-건설맵 · ${h && h.현장 ? h.현장 : '내 현장'}` })
}
export const 달력이름 = (h) => `K-건설맵_${String((h && h.현장) || '내현장').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40)}_할일.ics`
