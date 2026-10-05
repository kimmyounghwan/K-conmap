/* 🔗 이어 쓰기 시험 (G113 · 2026-10-02) — 인터넷 · 파이어베이스 없이
     node tools/시험_이어쓰기.mjs [브라우저 시험이 가짜 파이어베이스에 남긴 자료.json …]
   ① 규칙(web/database.rules.json) — 여덟 ns 의 문이 rk_* 와 같은 꼴인지, doc 칸 모양 · 판 번호(r = 서버 판 + 1)
   ② 이어할일(서버 판 · 이 기기 판 · 못 올린 고침) 표
   ③ 잠그기 · 풀기 (다른 비밀번호면 못 풂) · 백업 파일 글
   ④ 매일 백업(tools/공사일보백업.py)이 여덟 ns 를 다 뜨는지
   ⑤ 자료를 주면 그 안의 {ns}_doc · {ns}_books 를 규칙에 대 봄 (판 번호는 «처음 쓰기» 로 봄) */
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 이어쓰기들, 이어할일, 이어파일글, 이어파일읽기, 최대글 } from '../web/src/lib/이어쓰기.js'
import { 열쇠만들기, 잠그기, 풀기 } from '../web/src/lib/tplock.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 글 = fs.readFileSync(path.join(여기, '..', 'web', 'database.rules.json'), 'utf-8')
const 규칙 = JSON.parse(글.split('\n').map((l) => (/^\s*\/\//.test(l) ? '' : l)).join('\n')).rules

let ok = 0, bad = 0
const eq = (got, want, what) => { if (got === want) { ok++; console.log('  ✓', what) } else { bad++; console.log('  ✗', what, '— 나온 값', got, '· 바란 값', want) } }

/* 식 → 자바스크립트 (우리가 쓰는 것만 · data 는 «지금 서버 값») */
function 풀식(식, v, 옛, 변수) {
  let s = 식
    .replace(/newData\.hasChildren\(\[([^\]]*)\]\)/g, (_, a) => `__has([${a}])`)
    .replace(/newData\.isString\(\)/g, "(typeof __v === 'string')")
    .replace(/newData\.isNumber\(\)/g, "(typeof __v === 'number')")
    .replace(/newData\.val\(\)/g, '__v')
    .replace(/!data\.exists\(\)/g, '(__old == null)')
    .replace(/data\.exists\(\)/g, '(__old != null)')
    .replace(/data\.val\(\)/g, '__old')
    .replace(/\.matches\((\/[^/]*(?:\\\/[^/]*)*\/)\)/g, '.match($1) !== null')
    .replace(/\.beginsWith\(/g, '.startsWith(')
    .replace(/\bnow\b/g, String(Date.now()))
  for (const [k, x] of Object.entries(변수)) s = s.split(k).join(JSON.stringify(x))
  if (/\b(root|auth|data)\b/.test(s.replace(/__old/g, ''))) throw new Error('못 푸는 식: ' + 식)
  // eslint-disable-next-line no-new-func
  return Function('__v', '__old', '__has', `return (${s})`)(v, 옛, (ks) => v && typeof v === 'object' && ks.every((k) => v[k] != null))
}
function 대기(마디, v, 옛, 곳, 변수 = {}) {
  const 틀 = []
  if (!마디) return 틀
  const 식 = 마디['.validate']
  if (식 === false || (typeof 식 === 'string' && !풀식(식, v, 옛, 변수))) 틀.push(곳 + ' .validate')
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      let 아래 = 마디[k], 변 = 변수
      if (!아래) {
        const w = Object.keys(마디).find((z) => z.startsWith('$') && z !== '$other')
        if (w) { 아래 = 마디[w]; 변 = { ...변수, [w]: k } } else if (마디.$other) 아래 = 마디.$other
      }
      틀.push(...대기(아래, x, 옛 && typeof 옛 === 'object' ? 옛[k] : undefined, 곳 + '/' + k, 변))
    }
  }
  return 틀
}
const 문 = (ns) => `auth != null && root.child('${ns}_pins').child($c).exists() && root.child('${ns}_keys').child($c).child(auth.uid).val() === root.child('${ns}_pins').child($c).val()`

console.log('① 규칙 — 아홉 ns')
eq(이어쓰기들.join(','), 'sn,sk,ib,nm,jm,gj,sc,wc,bj', 'ns 아홉 (산안비 · 손익 · 작업일보 · 노무비 · 지명원 · 견적서 · 예정공정표 · 원클릭 · 보험료 정산 G146)')
const 옛것 = Object.keys(규칙)
for (const ns of 이어쓰기들) {
  const 자리 = Object.keys(규칙).filter((k) => k.startsWith(ns + '_'))
  eq(자리.join(' '), `${ns}_pins ${ns}_keys ${ns}_books ${ns}_doc`, `${ns}: 자리 넷만`)
  eq(규칙[ns + '_pins']['.read'], false, `${ns}_pins 아무도 못 읽음`)
  eq(규칙[ns + '_pins'].$c['.write'], "auth != null && !data.exists() && $c.matches(/^[A-Z0-9]{9}$/)", `${ns}_pins 한 번만 · 9자리`)
  eq(규칙[ns + '_keys'].$c.$uid['.write'], `auth != null && auth.uid === $uid && (!newData.exists() || newData.val() === root.child('${ns}_pins').child($c).val())`, `${ns}_keys 맞는 해시만`)
  for (const z of ['books', 'doc']) {
    eq(규칙[`${ns}_${z}`].$c['.read'] === 문(ns) && 규칙[`${ns}_${z}`].$c['.write'] === 문(ns), true, `${ns}_${z} 읽기·쓰기 = 비밀번호 맞힌 브라우저만 (rk_* 와 같은 꼴)`)
  }
}
eq(규칙.rk_books.$c['.read'], 문('rk'), '(대조) rk_books 도 같은 꼴')
eq(옛것.filter((k) => /^(cost|eq|rk)_/.test(k)).length, 27, '옛 자리(cost 12 · eq 9 · rk 6)는 그대로')

console.log('  doc 칸 · 판 번호')
const 지금 = Date.now() - 1000
const 좋은 = { s: 'v1.aaaa.bbbb', r: 1, at: 지금, by: 'PC' }
const 대 = (ns, v, 옛) => 대기(규칙[ns + '_doc'].$c, v, 옛, ns + '_doc/C')
for (const ns of 이어쓰기들) eq(대(ns, 좋은, undefined).join(), '', `${ns}_doc 처음(판 1) 됨`)
eq(대('sn', { ...좋은, r: 2 }, undefined).length > 0, true, '처음인데 판 2 → 막힘')
eq(대('sn', { ...좋은, r: 4 }, { ...좋은, r: 3 }).join(), '', '서버 판 3 → 4 됨')
eq(대('sn', { ...좋은, r: 3 }, { ...좋은, r: 3 }).length > 0, true, '서버 판 3 에 또 3 → 막힘 (같은 판에서 두 기기가 고친 늦은 쪽)')
eq(대('sn', { ...좋은, r: 5 }, { ...좋은, r: 3 }).length > 0, true, '판 건너뛰기(3 → 5) → 막힘')
eq(대('sn', { ...좋은, r: 1 }, { ...좋은, r: 3 }).length > 0, true, '옛 판(1)으로 덮기 → 막힘')
eq(대('nm', { ...좋은, s: '{"P":[{"n":"홍길동"}]}' }, undefined).length > 0, true, '잠그지 않은 글(이름이 보이는 것) → 막힘')
eq(대('nm', { ...좋은, s: 'v1.' + 'A'.repeat(3000000) }, undefined).length > 0, true, '300만 자 넘음 → 막힘')
eq(대('nm', { ...좋은, 이름: 'x' }, undefined).length > 0, true, '모르는 칸 → 막힘')
eq(대('nm', { s: 'v1.a.b', r: 1 }, undefined).length > 0, true, 'at 없음 → 막힘')
eq(대('nm', { ...좋은, at: Date.now() + 3600000 }, undefined).length > 0, true, '앞날 시각 → 막힘')
eq(대('nm', { ...좋은, by: 'x'.repeat(21) }, undefined).length > 0, true, 'by 20자 넘음 → 막힘')
eq(최대글 < 3000000, true, '화면 상한(최대글)이 규칙 상한보다 작음')
const 책 = (v) => 대기(규칙.sn_books.$c, v, undefined, 'sn_books/C')
eq(책({ name: '산안비 장부', at: 지금 }).join(), '', '장부 정보 됨')
eq(책({ name: '', at: 지금 }).length > 0, true, '이름 없음 → 막힘')
eq(책({ name: 'a', at: 지금, co: 'x' }).length > 0, true, '장부 정보 모르는 칸 → 막힘')

console.log('② 이어할일')
const 표 = [[null, 0, false, '없음'], [null, 3, true, '없음'], [3, 3, false, '같음'], [3, 3, true, '올림'], [4, 3, false, '받음'], [4, 3, true, '충돌'], [2, 3, false, '받음'], [2, 3, true, '충돌']]
for (const [s, n, d, 답] of 표) eq(이어할일(s, n, d), 답, `서버 ${s} · 이 기기 ${n} · 고침 ${d ? '있음' : '없음'} → ${답}`)

console.log('③ 잠그기 · 백업 파일')
const 상태 = { P: [{ id: 'a', n: '○○○', b: '1970-01-01', w: 180000 }], A: { '2026-10': { a: { d: { '01': 1 } } } } }
const k1 = await 열쇠만들기('ABCDEFGHJ', 'pass1234')
const k2 = await 열쇠만들기('ABCDEFGHJ', 'pass12345')
const 잠근 = await 잠그기(k1, 상태)
eq(잠근.startsWith('v1.') && !잠근.includes('○○○') && !잠근.includes('1970'), true, '잠근 글에 이름 · 생년월일이 안 보임')
eq(JSON.stringify(await 풀기(k1, 잠근)), JSON.stringify(상태), '같은 비밀번호로 풀면 그대로')
eq(await 풀기(k2, 잠근), null, '다른 비밀번호로는 못 풂')
const f = 이어파일글('nm', '일용 노무비', 상태)
eq(JSON.stringify(이어파일읽기('nm', f).상태), JSON.stringify(상태), '백업 파일 → 불러오기 그대로')
eq(이어파일읽기('sn', f).오류 || '', '다른 프로그램(일용 노무비)의 백업 파일입니다.', '다른 프로그램 파일은 안 받음')
eq(이어파일읽기('nm', '{a').오류 || '', 'JSON 파일이 아닙니다.', '깨진 파일')
eq(이어파일읽기('nm', '{"a":1}').오류 || '', 'K-건설맵 백업 파일이 아닙니다.', '모르는 JSON')

console.log('④ 매일 백업')
const 파이썬 = process.platform === 'win32' ? 'python' : 'python3'
const 묶음글 = execFileSync(파이썬, ['-c', "import importlib.util,json,sys;s=importlib.util.spec_from_file_location('b',sys.argv[1]);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);print(json.dumps({'묶음':m.묶음들,'자리':m.자리들}))", path.join(여기, '공사일보백업.py')], { encoding: 'utf-8' })
const 백 = JSON.parse(묶음글)
for (const ns of 이어쓰기들) {
  const g = 백.묶음.find((x) => x.ns === ns)
  eq(!!g && g.책 === ns + '_books' && g.자리.join() === `${ns}_books,${ns}_doc` && [`${ns}_pins`, `${ns}_keys`, `${ns}_books`, `${ns}_doc`].every((k) => 백.자리.includes(k)), true, `${ns}: 백업 묶음 · 자리(핀 · 열쇠 · 책 · doc)에 있음`)
}

const 파일들 = process.argv.slice(2)
if (파일들.length) {
  console.log('⑤ 브라우저 시험이 실제로 쓴 자료')
  for (const p of 파일들) {
    const d = JSON.parse(fs.readFileSync(p, 'utf-8'))
    for (const [k, v] of Object.entries(d)) {
      const m = k.match(/^([a-z]{2})_(doc|books)$/)
      if (!m || !이어쓰기들.includes(m[1])) continue
      for (const [c, x] of Object.entries(v)) {
        const 틀 = 대기(규칙[k].$c, k.endsWith('_doc') ? { ...x, r: 1 } : x, undefined, `${k}/${c}`)
        eq(틀.join(), '', `${path.basename(p)} ${k}/${c.slice(0, 3)}… 규칙에 맞음${k.endsWith('_doc') ? ` (판 ${x.r} · ${x.s.length}자)` : ''}`)
      }
    }
  }
}
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
