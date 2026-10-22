// 🌏 현장 다국어 안전카드(lib/안전카드.js) 시험 — 브라우저 없이 node 로 (2026-10-22)
//   ① 문장 · 작업 · 머리말: 여섯 말 모두 있음 · 빈 칸 없음 · 외국어 칸에 한글 섞임 없음 · 글자 꼴(중국어 = 한자 · 러시아어 = 키릴 · 우즈벡어 = 라틴 + ʻ)
//   ② 숫자 · 약속 낱말: 한국어에 있는 2m · 119 · TBM 이 모든 말에 그대로
//   ③ 끝 문장부호 · 번호 겹침 · 분류 · 꼴 · 그림
//   ④ 장소 글(동 · 층 · 지하 · 구역) 말마다 · ⑤ 저장 읽기(망가진 값 · 모르는 번호 걸러냄) · ⑥ 예시 · 추천 번호가 사전에 있음
//   돌리기: node tools/시험_안전카드.mjs
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 저장 = new Map()
globalThis.localStorage = { getItem: (k) => (저장.has(k) ? 저장.get(k) : null), setItem: (k, v) => 저장.set(k, String(v)), removeItem: (k) => 저장.delete(k) }
const S = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', '안전카드.js')).href)

let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else { bad++; console.log('✗', m, 더) } }
const 한글 = /[가-힣]/
const 말 = ['ko', ...S.말들]

/* ① 여섯 말 · 빈 칸 · 한글 섞임 · 글자 꼴 */
const 모두 = [...S.문장들.map((s) => ['문장', s]), ...S.작업들.map((s) => ['작업', s]), ...Object.entries(S.머리).map(([id, v]) => ['머리', { id, ...v }])]
for (const [종, s] of 모두) {
  for (const k of 말) 봐(typeof s[k] === 'string' && s[k].trim().length > 0, `${종} ${s.id} ${k} 있음`)
  봐(한글.test(s.ko), `${종} ${s.id} 한국어에 한글`)
  for (const k of S.말들) 봐(!한글.test(s[k] || ''), `${종} ${s.id} ${k} 에 한글 없음`, s[k])
  봐(/[一-鿿]/.test(s.zh) || /^[№A-Za-z0-9 .·]+$/.test(s.zh), `${종} ${s.id} 중국어 = 한자`, s.zh)
  봐(/[Ѐ-ӿ]/.test(s.ru) || /^[№0-9 .]+$/.test(s.ru), `${종} ${s.id} 러시아어 = 키릴`, s.ru)
  봐(!/[Ѐ-ӿ]/.test(s.uz) && !/[‘’`]/.test(s.uz) && !/[oOgG]'/.test(s.uz), `${종} ${s.id} 우즈벡어 = 라틴 · oʻ gʻ 는 ʻ(U+02BB)`, s.uz)
  봐(!/[一-鿿Ѐ-ӿ]/.test(s.vi + s.en), `${종} ${s.id} 베트남어 · 영어에 한자 · 키릴 없음`)
  for (const k of 말) 봐(s[k] === s[k].trim() && !/\s{2,}/.test(s[k]), `${종} ${s.id} ${k} 앞뒤 · 겹친 빈칸 없음`)
}
/* 베트남어는 성조 글자가 있어야 정상(번역이 빠져 영어가 들어가면 안 됨) — 문장만 */
for (const s of S.문장들) 봐(/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i.test(s.vi), `문장 ${s.id} 베트남어 성조 글자`, s.vi)

/* ② 숫자 · 약속 낱말 */
for (const s of [...S.문장들, ...S.작업들]) {
  for (const 낱 of ['TBM', '119']) if (s.ko.includes(낱)) for (const k of S.말들) 봐(s[k].includes(낱), `${s.id} «${낱}» ${k}`, s[k])
  if (/2m/.test(s.ko)) for (const k of S.말들) 봐(/2\s?(m|米|м)/.test(s[k]), `${s.id} 2m ${k}`, s[k])
}

/* ③ 끝 문장부호 · 번호 · 분류 · 꼴 · 그림 */
const 끝 = /[.?!。？！)）»"]$/
for (const s of S.문장들) {
  봐(/[.?]$/.test(s.ko), `문장 ${s.id} 한국어 끝 . ?`, s.ko)
  for (const k of S.말들) 봐(끝.test(s[k]), `문장 ${s.id} ${k} 끝 문장부호`, s[k])
  if (s.ko.endsWith('?')) for (const k of S.말들) 봐(/[?？]/.test(s[k]), `문장 ${s.id} 물음 ${k}`, s[k])
  봐(['no', 'warn', 'do', 'info'].includes(s.f), `문장 ${s.id} 꼴`)
  봐(S.분류들.some(([c]) => c === s.c), `문장 ${s.id} 분류`)
  봐(s.g && !/[A-Za-z가-힣]/.test(s.g), `문장 ${s.id} 그림`)
}
const 번호들 = [...S.문장들.map((s) => s.id), ...S.작업들.map((s) => s.id)]
봐(new Set(번호들).size === 번호들.length, '번호 겹침 없음')
for (const [c] of S.분류들) 봐(S.문장들.some((s) => s.c === c), `분류 ${c} 에 문장 있음`)
봐(S.문장들.length >= 90 && S.작업들.length >= 30, `문장 ${S.문장들.length} · 작업 ${S.작업들.length}`)
/* «하지 마세요» 는 금지(no) 꼴이 대부분 — 섞였으면 알림만(틀림은 아님) */
const 금지인데 = S.문장들.filter((s) => /마세요\.$/.test(s.ko) && s.f === 'do').map((s) => s.id)
봐(금지인데.length === 0, '«…하지 마세요» 인데 «꼭 지키기» 꼴 없음', 금지인데.join(','))
for (const k of ['no_f', 'warn_f', 'do_f', 'info_f', 'self', 'ok', 'tbm', 'rule', 'order']) 봐(!!S.머리[k], `머리 ${k}`)

/* ④ 장소 글 */
const 장 = { 동: '101', 층: '3', 구: 'A', 지하: false }
const 기대 = { ko: '101동 3층 A구역', zh: '101栋 3层 A区', vi: 'Tòa 101, Tầng 3, Khu A', uz: '101-bino, 3-qavat, A-hudud', ru: 'корпус 101, 3-й этаж, участок A', en: 'Bldg 101, Floor 3, Zone A' }
for (const k of 말) 봐(S.장소글(장, k) === 기대[k], `장소 ${k}`, S.장소글(장, k))
const 지하 = { 동: '', 층: '2', 구: '', 지하: true }
const 기대2 = { ko: '지하 2층', zh: '地下2层', vi: 'Tầng hầm 2', uz: '2-yerosti qavat', ru: '2-й подземный этаж', en: 'B2' }
for (const k of 말) 봐(S.장소글(지하, k) === 기대2[k], `지하 ${k}`, S.장소글(지하, k))
for (const k of 말) 봐(S.장소글({}, k) === '' && S.장소글(null, k) === '', `빈 장소 ${k}`)

/* ⑤ 저장 읽기 */
저장.clear()
const v0 = S.읽기()
봐(v0.종류 === 'tbm' && v0.말.join() === 'zh' && v0.문장.tbm.length > 0, '처음 = TBM · 중국어 · 기본 문장')
저장.set(S.열쇠, '{망가진')
봐(S.읽기().종류 === 'tbm', '망가진 저장 → 처음 값')
저장.set(S.열쇠, JSON.stringify({ 종류: 'xx', 말: ['zh', 'xx', 'vi', 'ru', 'en'], 문장: { tbm: ['t1', 'zz', 'p1'], rule: 'x' }, 작업: ['a01', 'q'], 직접: { tbm: [{ ko: 'a'.repeat(500), 번: { zh: '中', xx: 'y' } }] }, 서명줄: 7, 꼴: '표지', 건설맵: false }))
const v1 = S.읽기()
봐(v1.종류 === 'tbm', '모르는 종류 → tbm')
봐(v1.말.join() === 'zh,vi,ru', '모르는 말 빼고 셋까지', v1.말.join())
봐(v1.문장.tbm.join() === 't1,p1' && v1.문장.rule.length === 0, '모르는 문장 번호 걸러냄')
봐(v1.작업.join() === 'a01', '모르는 작업 번호 걸러냄')
봐(v1.직접.tbm[0].ko.length === 200 && v1.직접.tbm[0].번.zh === '中' && !('xx' in v1.직접.tbm[0].번), '직접 쓴 말 길이 · 말 걸러냄')
봐(v1.서명줄 === 12 && v1.꼴 === '표지' && v1.건설맵 === false, '서명 줄 · 꼴 · 건설맵 끔')
봐(S.쓰기(v1) && JSON.parse(저장.get(S.열쇠)).꼴 === '표지', '쓰기')

/* ⑥ 예시 · 기본 번호 */
const 예 = S.예시판()
for (const 종 of ['tbm', 'rule', 'order']) for (const id of 예.문장[종]) 봐(!!S.문장[id], `예시 ${종} ${id}`)
for (const id of 예.작업) 봐(!!S.작업[id], `예시 작업 ${id}`)
봐(/가상/.test(예.칸.site) && /가상/.test(예.칸.leader), '예시 이름은 가상')
봐(!/\d{3}-\d{3,4}-\d{4}/.test(예.칸.phone) || 예.칸.phone === '010-0000-0000', '예시 전화는 0000')
for (const id of S.빈판().문장.tbm) 봐(!!S.문장[id], `기본 ${id}`)
for (const a of S.작업들) { const L = S.작업문장[a.id] || []; 봐(L.length >= 2 && L.every((id) => !!S.문장[id]), `작업 ${a.id} ${a.ko} 위험 문장 ${L.length}`) }
봐(Object.keys(S.작업문장).every((k) => !!S.작업[k]), '작업문장 열쇠 = 작업 번호')

console.log(`\n${bad ? '❌' : '✅'} 안전카드 ${ok + bad}개 중 ${ok} 맞음 · ${bad} 틀림`)
process.exit(bad ? 1 : 0)
