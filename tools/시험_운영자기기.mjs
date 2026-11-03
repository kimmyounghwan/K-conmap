/**
 * 🔑 G528 (2026-11-03) 운영자 기기 — 맵톡 글 · 답글에 «K-건설맵» 이 붙는지 규칙을 «작은 흉내» 로 돌려 봅니다(에뮬레이터 없이 · PC 올리기 시험에도)
 *   node tools/시험_운영자기기.mjs
 *   소장님 「아니 왜 내가 써도 건설맵이 안뜨지? 맵톡에」 「오늘자 올린 거 모두 내가 쓴거야」 「브라우저가 바뀌어도 컴이 같으면 동일한 사람으로 안돼???」
 *   ① 규칙: 운영자.js OPS 의 기기마다 답글(qna_a) «K-건설맵 · op» · 글(qna) «K-건설맵 · 소식 방» 을 씀 / 보통 이용자는 못 씀(별명 · op 거짓은 됨)
 *   ② 화면(Qna.jsx): 운영자 번호로 쓴 답글 · 글은 저장된 표와 상관없이 «K-건설맵»(운영답 · 글별명)
 *   ③ 구운 맵톡 장(qnapages.py): 운영자 번호면 «K-건설맵» · op 로 맞춘 뒤 번호를 지움
 *   ④ 도구: tools/운영자더하기.py --self
 */
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const 규칙글 = readFileSync(path.join(ROOT, 'web/database.rules.json'), 'utf8')
const 규칙 = JSON.parse(규칙글.replace(/^\s*\/\/.*$/gm, '')).rules
String.prototype.matches = function (re) { return re.test(String(this)) }   // eslint-disable-line no-extend-native

let 통과 = 0, 실패 = 0
const eq = (a, b, 무엇) => { if (a === b) { 통과++; console.log('  ✓', 무엇) } else { 실패++; console.log('  ✗', 무엇, '— 받음', a, '기대', b) } }
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
  if (식 === undefined) return true
  if (식 === true || 식 === false) return 식
  const f = new Function('root', 'newData', 'data', 'auth', 'now', `return (${식})`)   // eslint-disable-line no-new-func
  try { return !!f(판.root, 판.newData, 판.data, 판.auth, Date.now()) } catch (e) { return false }
}
/** 칸(규칙 마디) 에 값 쓰기 — .write(여기 또는 위) → .validate → 칸마다 .validate */
function 쓰기(마디, 값, auth, data = new 스냅(null), root = new 스냅({})) {
  const newData = new 스냅(값)
  const 판 = { root, data, newData, auth }
  if (!셈(마디['.write'], 판)) return false
  if (마디['.validate'] !== undefined && !셈(마디['.validate'], 판)) return false
  for (const [k, v] of Object.entries(값)) {
    const 아래 = 마디[k] || 마디.$other
    if (!아래) continue
    if (아래['.validate'] !== undefined && !셈(아래['.validate'], { ...판, newData: new 스냅(v), data: data.child(k) })) return false
  }
  return true
}

const 목록 = readFileSync(path.join(ROOT, 'web/src/lib/운영자.js'), 'utf8')
const OPS = ((목록.match(/const OPS = \[([\s\S]*?)\]/) || [])[1] || '').replace(/\/\/.*$/gm, '').match(/'([A-Za-z0-9]{20,64})'/g).map((x) => x.slice(1, -1))
const 답칸 = 규칙.qna_a.$qid.$aid
const 글칸 = 규칙.qna.$id
const 답 = (uid, nick, op) => ({ b: '네, 감사합니다. 자주 방문해 주세요.', nick, uid, at: Date.now(), op })
const 글 = (uid, nick, k) => ({ t: '[K-건설맵] 새 서식 — 토공사 시공계획서', b: '서식 탭 ③', nick, uid, at: Date.now(), k })

console.log(`① 규칙 — 운영자 기기 ${OPS.length}대`)
eq(OPS.includes('pIFo0QpU30X8WJbrVxAg2fLmG2J3'), true, '11-03 기기(pIFo0Q…)가 운영자 목록에')
for (const u of OPS) {
  eq(쓰기(답칸, 답(u, 'K-건설맵', true), { uid: u }), true, `${u.slice(0, 6)}… 답글 «K-건설맵 · op»`)
  eq(쓰기(글칸, 글(u, 'K-건설맵', 'kcm'), { uid: u }), true, `${u.slice(0, 6)}… 글 «K-건설맵 · 소식 방»`)
}
const 남 = { uid: 'u_someone_else_123456789' }
eq(쓰기(답칸, 답(남.uid, 'K-건설맵', false), 남), false, '보통 이용자는 «K-건설맵» 별명 못 씀')
eq(쓰기(답칸, 답(남.uid, '침착한 지게차548', true), 남), false, '보통 이용자는 op 표 못 붙임')
eq(쓰기(답칸, 답(남.uid, '침착한 지게차548', false), 남), true, '보통 이용자 답글(별명 · op 거짓)은 그대로 됨')
eq(쓰기(글칸, 글(남.uid, 'K-건설맵', 'fb'), 남), false, '보통 이용자 글에 «K-건설맵» 못 씀')
eq(쓰기(글칸, 글(남.uid, '노련한 소장891', 'kcm'), 남), false, '보통 이용자는 소식 방(kcm) 못 씀')

console.log('② 화면 — 운영자 번호면 «K-건설맵»')
const 화면 = readFileSync(path.join(ROOT, 'web/src/pages/Qna.jsx'), 'utf8')
eq(/const 운영답 = \(x\) => \(x && !x\.op && isOp\(x\.uid\) \? \{ \.\.\.x, op: true, nick: 'K-건설맵' \} : x\)/.test(화면), true, '답글: op 표가 없어도 운영자 번호면 op · K-건설맵')
eq(/if \(보임\(x\)\) g\[id\] = 운영답\(x\)/.test(화면), true, '화면이 쓰는 답글(ans)은 모두 운영답을 거침(카드 ✅ · 답 기다림 · 점수)')
eq((화면.match(/\{글별명\(r\)\}/g) || []).length >= 2, true, '글 카드 · 한마디 말풍선의 글쓴이도 운영자 번호면 K-건설맵')
eq(/className="mt-who">\{배지\(창글\.uid\)\}\{글별명\(창글\)\}/.test(화면), true, '펼친 글 창 맨 위 글쓴이도 운영자 번호면 K-건설맵')
eq(/const 글쓴이 = row\.c === 'K-건설맵' \|\| isOp\(row\.uid\)/.test(화면), true, '펼친 글 답글 칸 «… 님에게»(원래부터)')
eq(/\{창글\.nick \|\| '익명'\}|\{r\.nick \|\| '익명'\}/.test(화면), false, '화면에 저장된 별명을 그대로 쓰는 글쓴이 자리가 남지 않음')
const 관리 = readFileSync(path.join(ROOT, 'web/src/pages/Admin.jsx'), 'utf8')
eq(/isOp\(r\.uid\) \? 'K-건설맵' : \(r\.nick \|\| nickOf\(r\.uid\)\)/.test(관리) && (관리.match(/\(a\.op \|\| isOp\(a\.uid\)\)/g) || []).length >= 2, true, '관리 화면(/admin) 맵톡 목록도 같게')

console.log('③ 구운 맵톡 장(qnapages.py)')
const 굽기 = readFileSync(path.join(ROOT, 'qnapages.py'), 'utf8')
eq(/if a\.get\("uid"\) in OPS:\s*\n\s*a\["op"\], a\["nick"\] = True, "K-건설맵"/.test(굽기), true, '답글: 운영자 번호면 op · K-건설맵으로 맞춘 뒤 번호를 지움')
eq(/if r\.get\("uid"\) in OPS:\s*\n\s*r\["nick"\] = "K-건설맵"/.test(굽기), true, '글: 운영자 번호면 K-건설맵')
eq(/os\.path\.join\(os\.path\.dirname\(os\.path\.abspath\(__file__\)\), "web", "src", "lib", "운영자\.js"\)/.test(굽기), true, '번호 목록은 운영자.js 한 곳에서 읽음(두 벌 없음)')

console.log('④ 운영자더하기.py --self')
let 자 = ''
/* PC(윈도) 는 python 먼저(python3 는 스토어 안내만 나오는 가짜일 수 있음) · 클라우드는 python3 먼저 */
for (const 파 of (process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'])) {
  try { 자 = execFileSync(파, [path.join(ROOT, 'tools/운영자더하기.py'), '--self'], { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } }); break } catch (e) { 자 = String((e && e.stdout) || e) }
}
eq(/✓ 자가시험/.test(자), true, '넣기 · 겹침 · 다른 꼴 멈춤')

console.log(`\n${실패 ? '✗' : '✓'} 시험_운영자기기 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
