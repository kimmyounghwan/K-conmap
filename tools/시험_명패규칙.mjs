/**
 * 🧪 G320 (2026-10-18) 전문가 명패 규칙 — web/database.rules.json 의 qna_pro_req · qna_pro 를 «작은 흉내» 로 돌려 봅니다.
 *   (파이어베이스 에뮬레이터를 받을 수 없는 곳에서도 돌게 — 규칙 글을 그대로 읽어 자바스크립트로 셈 · .write → .validate → 칸마다 .validate · $other)
 *   node tools/시험_명패규칙.mjs
 * ✂️ G547 (2026-11-05) 소장님 「명패도 빼자」 — 화면에서 명패(신청 · 붙이기 · 보이기)를 뺐습니다.
 *   규칙(qna_pro · qna_pro_req)은 옛 자료 때문에 그대로라 ① ② 규칙 흉내는 남기고, ④ 는 «화면이 명패를 안 씀» 으로 바꿈.
 *   ⑤ 운영자 기기(G324 · G528)는 맵톡 «K-건설맵» 표 · 규칙 15곳 · 창고 · 알림 셈을 함께 봄 — 운영자더하기.py 뒤에 꼭 돌림.
 */
import { readFileSync } from 'node:fs'

const 글 = readFileSync(new URL('../web/database.rules.json', import.meta.url), 'utf8')
const 규칙 = JSON.parse(글.replace(/^\s*\/\/.*$/gm, '')).rules
String.prototype.matches = function (re) { return re.test(String(this)) }   // eslint-disable-line no-extend-native

let 통과 = 0, 실패 = 0
const eq = (a, b, 무엇) => { if (a === b) 통과++; else { 실패++; console.log('  ✗', 무엇, '— 받음', a, '기대', b) } }

/* 스냅숏 흉내 */
class 스냅 {
  constructor(v) { this.v = v === undefined ? null : v }
  child(k) { return new 스냅(this.v && typeof this.v === 'object' ? this.v[k] : null) }
  exists() { return this.v !== null && this.v !== undefined }
  val() { return this.v }
  isString() { return typeof this.v === 'string' }
  isNumber() { return typeof this.v === 'number' }
  isBoolean() { return typeof this.v === 'boolean' }
  hasChildren(ks) { return !!this.v && typeof this.v === 'object' && ks.every((k) => this.v[k] !== undefined && this.v[k] !== null) }
}
const 셈 = (식, 판) => {
  if (식 === undefined) return null
  if (식 === true || 식 === false) return 식
  const f = new Function('root', 'newData', 'data', 'auth', 'now', '$who', `return (${식})`)   // eslint-disable-line no-new-func
  try { return !!f(판.root, 판.newData, 판.data, 판.auth, Date.now(), 판.$who) } catch (e) { return false }
}
const 디비 = (값) => new 스냅(값)
/** 쓰기: 갈래(qna_pro · qna_pro_req) / 번호 = 값 — 됐나 */
function 쓰기(갈래, who, 값, auth, 바탕 = {}) {
  const 칸 = 규칙[갈래].$who
  const root = 디비(바탕)
  const data = root.child(갈래).child(who)
  const newData = new 스냅(값)
  const 판 = { root, data, newData, auth, $who: who }
  if (!셈(칸['.write'], 판)) return false
  if (값 === null) return true                     // 지우기는 .validate 를 안 거침
  if (칸['.validate'] !== undefined && !셈(칸['.validate'], 판)) return false
  for (const [k, v] of Object.entries(값)) {
    const 아래 = 칸[k] || 칸.$other
    if (!아래) continue
    if (!셈(아래['.validate'], { ...판, newData: new 스냅(v), data: data.child(k) })) return false
  }
  return true
}
function 읽기(갈래, who, auth, 바탕 = {}) {
  const root = 디비(바탕)
  const 판 = { root, data: root.child(갈래), newData: null, auth, $who: who }
  if (셈(규칙[갈래]['.read'], 판)) return true
  if (who == null) return false
  return !!셈(규칙[갈래].$who && 규칙[갈래].$who['.read'], 판)
}

const OP = { uid: 'ZglL1g3X5UZFBA2590LirDnEnil1' }
const 갑 = { uid: 'u_gap' }, 을 = { uid: 'u_eul' }, 병폰 = { uid: 'u_new_phone' }
const 이어짐 = { qna_who: { u_new_phone: { r: 'u_gap' } } }     // 병폰 = 갑이 «내 글 되찾기» 로 이은 새 기기
/* G547 — lib 의 명패 함수는 뺐으므로 규칙 흉내에 넣을 값을 여기서 바로 적음(옛 명패신청값 · 명패만들기 꼴 그대로) */
const 좋은신청 = { f: 'est', sh: 'all', ok: true, at: Date.now(), co: '○○건설', nm: '홍길동', i: '공공 토목 적산', nick: '노란 두더지12' }
const 명패만들기 = (r, at) => (r && r.ok === true ? { f: r.f, at, ...(r.sh !== 'name' ? { co: r.co } : {}), ...(r.sh !== 'co' ? { nm: r.nm } : {}), ...(r.i ? { i: r.i } : {}) } : null)

console.log('① 신청(qna_pro_req) — 본인만 쓰고 · 본인 · 운영자만 읽음')
eq(쓰기('qna_pro_req', 'u_gap', 좋은신청, 갑), true, '본인 번호로 신청')
eq(쓰기('qna_pro_req', 'u_gap', 좋은신청, 을), false, '남의 번호로 신청 막힘')
eq(쓰기('qna_pro_req', 'u_gap', 좋은신청, null), false, '로그인 없이 막힘')
eq(쓰기('qna_pro_req', 'u_gap', 좋은신청, 병폰, 이어짐), true, '이은 기기는 옛 번호로 신청')
eq(쓰기('qna_pro_req', 'u_new_phone', 좋은신청, 병폰, 이어짐), false, '이은 기기는 제 새 번호로는 못 씀(늘 한 사람 한 칸)')
eq(쓰기('qna_pro_req', 'u_gap', null, 갑, { qna_pro_req: { u_gap: 좋은신청 } }), true, '본인 거두기')
eq(쓰기('qna_pro_req', 'u_gap', null, OP, { qna_pro_req: { u_gap: 좋은신청 } }), true, '운영자 지우기(붙인 뒤 · 거절)')
eq(쓰기('qna_pro_req', 'u_gap', 좋은신청, OP), false, '운영자가 남 이름으로 신청 만들기 막힘')
eq(쓰기('qna_pro_req', 'u_gap', { ...좋은신청, f: 'zzz' }, 갑), false, '모르는 분야 막힘')
eq(쓰기('qna_pro_req', 'u_gap', { ...좋은신청, sh: 'zzz' }, 갑), false, '모르는 공개 범위 막힘')
eq(쓰기('qna_pro_req', 'u_gap', { ...좋은신청, ok: false }, 갑), false, '동의 없으면 막힘')
eq(쓰기('qna_pro_req', 'u_gap', { ...좋은신청, co: 'x'.repeat(31) }, 갑), false, '회사 31자 막힘')
eq(쓰기('qna_pro_req', 'u_gap', { ...좋은신청, nm: 'x'.repeat(21) }, 갑), false, '이름 21자 막힘')
eq(쓰기('qna_pro_req', 'u_gap', { ...좋은신청, tel: '010' }, 갑), false, '다른 칸(전화번호 등) 막힘')
eq(쓰기('qna_pro_req', 'x'.repeat(41), 좋은신청, { uid: 'x'.repeat(41) }), false, '긴 번호 막힘')
const { at: _at, ...시각없이 } = 좋은신청
eq(쓰기('qna_pro_req', 'u_gap', 시각없이, 갑), false, '시각 없으면 막힘')
eq(읽기('qna_pro_req', null, 갑), false, '신청 목록 전체 — 이용자는 못 읽음')
eq(읽기('qna_pro_req', null, OP), true, '신청 목록 전체 — 운영자 읽음')
eq(읽기('qna_pro_req', 'u_gap', 갑), true, '내 신청은 내가 읽음')
eq(읽기('qna_pro_req', 'u_gap', 을), false, '남의 신청은 못 읽음')
eq(읽기('qna_pro_req', 'u_gap', 병폰, 이어짐), true, '이은 기기도 내 신청 읽음')
eq(읽기('qna_pro_req', 'u_gap', null), false, '로그인 없이 못 읽음')

console.log('② 명패(qna_pro) — 운영자만 붙이고 · 누구나 읽고 · 본인은 내리기만')
const 패 = 명패만들기(좋은신청, Date.now())
eq(쓰기('qna_pro', 'u_gap', 패, OP), true, '운영자가 붙임')
eq(쓰기('qna_pro', 'u_gap', 패, 갑), false, '본인이 스스로 붙이기 막힘(사칭 막기)')
eq(쓰기('qna_pro', 'u_eul', 패, 을), false, '아무나 붙이기 막힘')
eq(쓰기('qna_pro', 'u_gap', null, 갑, { qna_pro: { u_gap: 패 } }), true, '본인 내리기')
eq(쓰기('qna_pro', 'u_gap', null, 병폰, { ...이어짐, qna_pro: { u_gap: 패 } }), true, '이은 기기에서도 내리기')
eq(쓰기('qna_pro', 'u_gap', null, 을, { qna_pro: { u_gap: 패 } }), false, '남의 명패 내리기 막힘')
eq(쓰기('qna_pro', 'u_gap', { ...패, f: 'zzz' }, OP), false, '모르는 분야 막힘')
eq(쓰기('qna_pro', 'u_gap', { f: 'est', at: 1 }, OP), false, '회사 · 이름 둘 다 없으면 막힘')
eq(쓰기('qna_pro', 'u_gap', { ...패, co: '' }, OP), false, '빈 회사 막힘')
eq(쓰기('qna_pro', 'u_gap', { ...패, tel: '010' }, OP), false, '다른 칸 막힘')
eq(쓰기('qna_pro', 'u_gap', 명패만들기({ ...좋은신청, sh: 'name' }, 1), OP), true, '이름만 명패')
eq(쓰기('qna_pro', 'u_gap', 명패만들기({ ...좋은신청, sh: 'co' }, 1), OP), true, '회사만 명패')
eq(읽기('qna_pro', null, null), true, '명패는 누구나 읽음')

console.log('⑤ G324 (2026-10-19) 두 번째 운영자 기기(노트북 엣지) — 소장님 「맵톡글을 쓸때 붙게 해줘」 「관리자 탭이 없이」')
const OP2 = { uid: 'Mk7VznW9UZaRpycYErDsuILmVfl1' }
eq(쓰기('qna_pro', 'u_gap', 패, OP2), true, '노트북 엣지도 명패를 붙임')
eq(읽기('qna_pro_req', null, OP2), true, '노트북 엣지도 신청 목록을 읽음')
eq(쓰기('qna_pro', 'u_gap', 패, 을), false, '보통 이용자는 여전히 못 붙임')
/* 🔑 G528 (2026-11-03) 세 번째 기기 — 「왜 내가 써도 건설맵이 안뜨지?」 → 이제 «두 기기» 가 아니라 «운영자.js OPS 모두» 를 봅니다(tools/운영자더하기.py 로만 더함) */
const 목록 = readFileSync(new URL('../web/src/lib/운영자.js', import.meta.url), 'utf8')
const 모두 = ((목록.match(/const OPS = \[([\s\S]*?)\]/) || [])[1] || '').replace(/\/\/.*$/gm, '').match(/'([A-Za-z0-9]{20,64})'/g).map((x) => x.slice(1, -1))
eq(모두.length >= 3 && 모두.includes('ZglL1g3X5UZFBA2590LirDnEnil1') && 모두.includes('Mk7VznW9UZaRpycYErDsuILmVfl1') && 모두.includes('pIFo0QpU30X8WJbrVxAg2fLmG2J3'), true, '화면 운영자 목록에 세 기기(사무실 크롬 · 노트북 엣지 · 11-03 기기)')
const 묶음 = 모두.map((u) => `auth.uid === '${u}'`).join(' || ')
const 첫자리 = (글.match(new RegExp(`'${모두[0]}'`, 'g')) || []).length
const 맞는자리 = 글.split(묶음).length - 1 + 글.split(모두.map((u) => `$uid !== '${u}'`).join(' && ')).length - 1 + 글.split(모두.map((u) => `newData.child('r').val() !== '${u}'`).join(' && ')).length - 1
eq(첫자리 >= 15 && 맞는자리 === 첫자리 && 모두.every((u) => (글.match(new RegExp(`'${u}'`, 'g')) || []).length === 첫자리), true, `규칙의 운영자 자리(${첫자리}곳)마다 운영자 기기가 모두 있음`)
const OP3 = { uid: 'pIFo0QpU30X8WJbrVxAg2fLmG2J3' }
eq(쓰기('qna_pro', 'u_gap', 패, OP3), true, '11-03 기기도 명패를 붙임')
eq(읽기('qna_pro_req', null, OP3), true, '11-03 기기도 신청 목록을 읽음')
const 창고 = readFileSync(new URL('../web/storage.rules', import.meta.url), 'utf8')
eq(창고.includes('request.auth.uid in [' + 모두.map((u) => `'${u}'`).join(', ') + ']'), true, '성적표 재료(op/)도 운영자 기기 모두 읽음')
const 알림 = readFileSync(new URL('./알림수세기.py', import.meta.url), 'utf8')
eq(알림.includes('OP = (' + 모두.map((u) => `"${u}"`).join(', ') + ')'), true, '알림 셈(알림수세기.py)도 운영자 기기 모두 뺌')

console.log('④ 화면 — G547 명패를 뺐으므로 «안 씀» 을 봄(소장님 「명패도 빼자」 · 다시 넣을 때는 먼저 여쭘)')
const 화면 = readFileSync(new URL('../web/src/pages/Qna.jsx', import.meta.url), 'utf8')
eq(/qna_pro/.test(화면.replace(/\/\*[\s\S]*?\*\//g, '')), false, '화면이 qna_pro · qna_pro_req 를 읽지도 쓰지도 않음(주석 밖)')
eq(/<명패칸 |명패표\(|function 명패|명패신청창|명패관리판/.test(화면), false, '카드 · 글 · 답글 · 명단에 명패 없음 · 신청 창 · 관리판 없음')
eq(/세기\('\|맵톡\|명패/.test(화면), false, '명패 쓴 횟수 셈 없음')
const 메일 = readFileSync(new URL('./qna_mail.py', import.meta.url), 'utf8')
eq(/get\("qna_pro_req", tok\)/.test(메일), true, '메일은 그대로(옛 신청이 남아 있으면 알림 — 새 신청은 화면이 없어 안 생김)')

console.log(`\n통과 ${통과} · 실패 ${실패}`)
if (실패) process.exit(1)
