/**
 * 🧪 G320 (2026-10-18) 전문가 명패 규칙 — web/database.rules.json 의 qna_pro_req · qna_pro 를 «작은 흉내» 로 돌려 봅니다.
 *   (파이어베이스 에뮬레이터를 받을 수 없는 곳에서도 돌게 — 규칙 글을 그대로 읽어 자바스크립트로 셈 · .write → .validate → 칸마다 .validate · $other)
 *   node tools/시험_명패규칙.mjs
 */
import { readFileSync } from 'node:fs'
import { 명패검사, 명패신청값, 명패만들기, 명패글, 분야전문가, 공개들, 분야들 } from '../web/src/lib/맵톡.js'

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
const 좋은신청 = 명패신청값({ f: 'est', co: '○○건설', nm: '홍길동', i: '공공 토목 적산', sh: 'all', ok: true }, '노란 두더지12', Date.now())

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

console.log('③ 명패 글 · 신청 검사 · 공개 범위')
eq(명패글({ f: 'est', co: '○○건설', nm: '홍길동' }), '✅ 적산·내역 · ○○건설 홍길동', '회사 + 이름')
eq(명패글({ f: 'civil', nm: '홍길동' }), '✅ 토목 · 홍길동', '이름만')
eq(명패글({ f: 'zz', nm: '홍길동' }), '', '모르는 분야는 안 보임')
eq(명패글(null), '', '없으면 빈칸')
eq(명패검사({ f: '', sh: 'all', co: 'a', nm: 'b', ok: true }), '분야를 골라 주세요.', '분야 없음')
eq(명패검사({ f: 'est', sh: 'all', co: '', nm: 'b', ok: true }), '회사 이름을 적어 주세요.', '회사+이름인데 회사 없음')
eq(명패검사({ f: 'est', sh: 'name', co: '', nm: 'b', ok: true }), '', '이름만이면 회사 없어도 됨')
eq(명패검사({ f: 'est', sh: 'co', co: 'a', nm: '', ok: true }), '', '회사만이면 이름 없어도 됨')
eq(명패검사({ f: 'est', sh: 'all', co: 'a', nm: 'b', ok: false }), '«맵톡에 보이는 데 동의합니다» 에 체크해 주세요.', '동의 없음')
eq(JSON.stringify(명패만들기({ ...좋은신청, sh: 'name' }, 1)), JSON.stringify({ f: 'est', at: 1, nm: '홍길동', i: '공공 토목 적산' }), '이름만 — 명패에 회사가 안 들어감')
eq(JSON.stringify(명패만들기({ ...좋은신청, sh: 'co' }, 1)), JSON.stringify({ f: 'est', at: 1, co: '○○건설', i: '공공 토목 적산' }), '회사만 — 명패에 이름이 안 들어감')
eq(명패만들기({ ...좋은신청, ok: false }, 1), null, '동의 없는 신청은 못 붙임')
eq(분야전문가({ a: { f: 'est', nm: 'A', at: 2 }, b: { f: 'bid', nm: 'B', at: 1 }, c: { f: 'est', nm: 'C', at: 1 } }, 'est').map((x) => x.uid).join(','), 'c,a', '분야 명단 — 붙인 차례')
eq(분야전문가({ a: { f: 'est', nm: 'A', at: 2 }, b: { f: 'bid', nm: 'B', at: 1 } }).length, 2, '전체 명단')
eq(공개들.map((x) => x.k).join('|'), 'all|name|co', '화면 공개 범위 = 규칙 sh')
eq(분야들.map((x) => x.k).join('|'), 'bid|est|esc|civil|arch|elec|safe', '화면 분야 = 규칙 f')

console.log('④ 화면이 이렇게 쓰는지')
const 화면 = readFileSync(new URL('../web/src/pages/Qna.jsx', import.meta.url), 'utf8')
eq(/qna_pro_req\/\$\{me\.r\}/.test(화면), true, '신청은 내 번호(되찾은 기기는 옛 번호) 칸에')
eq(/듣기\(ref\(db, 'qna_pro'\)/.test(화면), true, '명패는 열어 둔 화면에도 바로(듣기)')
eq((화면.match(/<명패칸 /g) || []).length >= 4 && /명패표\(r\.uid\)/.test(화면) && /명패표\(창글\.uid\)/.test(화면), true, '카드 · 글 · 답글 · 명단에 명패')
eq(/세기\('\|맵톡\|명패신청'\)/.test(화면) && /세기\('\|맵톡\|명패신청열기'\)/.test(화면), true, '쓴 횟수(소장님만)')
const 메일 = readFileSync(new URL('./qna_mail.py', import.meta.url), 'utf8')
eq(/get\("qna_pro_req", tok\)/.test(메일) && /명패 신청/.test(메일), true, '신청이 오면 소장님 메일')
eq(/«무료»|클로드/.test(화면.slice(화면.indexOf('function 명패칸'))), false, '명패 화면 글에 «무료» · «클로드» 없음')

console.log(`\n통과 ${통과} · 실패 ${실패}`)
if (실패) process.exit(1)
