/* 장부 규칙 — 🚜 eq_* · ⚠️ rk_* 가 web/database.rules.json 의 «.validate» 에 맞는지 (2026-09-29)
     node tools/시험_장부규칙.mjs [파이어베이스에 쓴 자료.json …]
   ■ 파이어베이스 에뮬레이터를 못 받는 곳(내려받기 막힘)에서도 돌게 — 우리가 쓰는 식만 풀어 보는 작은 검사기입니다.
     (isString · isNumber · isBoolean · val().length · val() 크기 · matches · beginsWith · hasChildren · now · $other)
   ■ 자료를 주면(브라우저 시험이 가짜 파이어베이스에 남긴 것) 그 안의 eq_* · rk_* 를 모두 규칙에 대 봅니다.
     안 주면 예시 장부 두 벌(lib/장비장부.js · lib/위험성.js)을 대 봅니다. 틀리게 만든 자료가 «막히는지» 도 봅니다. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { 예시장부 } from '../web/src/lib/장비장부.js'
import { 예시책 } from '../web/src/lib/위험성.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 글 = fs.readFileSync(path.join(여기, '..', 'web', 'database.rules.json'), 'utf-8')
const 규칙 = JSON.parse(글.split('\n').map((l) => (/^\s*\/\//.test(l) ? '' : l)).join('\n')).rules

let ok = 0, bad = 0
const eq = (got, want, what) => { if (got === want) { ok++; console.log('  ✓', what) } else { bad++; console.log('  ✗', what, '— 나온 값', got, '· 바란 값', want) } }

/* 식 → 자바스크립트 (우리가 쓰는 것만) */
function 풀식(식, v, 변수) {
  let s = 식
    .replace(/newData\.hasChildren\(\[([^\]]*)\]\)/g, (_, a) => `__has(${'['}${a}${']'})`)
    .replace(/newData\.hasChildren\(\)/g, '__hasAny()')
    .replace(/newData\.isString\(\)/g, "(typeof __v === 'string')")
    .replace(/newData\.isNumber\(\)/g, "(typeof __v === 'number')")
    .replace(/newData\.isBoolean\(\)/g, "(typeof __v === 'boolean')")
    .replace(/newData\.val\(\)/g, '__v')
    .replace(/\.matches\((\/[^/]*(?:\\\/[^/]*)*\/)\)/g, '.match($1) !== null')
    .replace(/\.beginsWith\(/g, '.startsWith(')
    .replace(/\bnow\b/g, String(Date.now()))
  for (const [k, x] of Object.entries(변수)) s = s.split(k).join(JSON.stringify(x))
  // eslint-disable-next-line no-new-func
  return Function('__v', '__has', '__hasAny', `return (${s})`)(v, (ks) => v && typeof v === 'object' && ks.every((k) => v[k] != null), () => v && typeof v === 'object' && Object.keys(v).length > 0)
}

/** 한 곳(규칙 마디)에 값 하나 — 틀린 곳 목록 */
function 대기(마디, v, 곳, 변수 = {}) {
  const 틀 = []
  if (!마디) return 틀
  const 식 = 마디['.validate']
  if (식 === false || (typeof 식 === 'string' && !풀식(식, v, 변수))) 틀.push(곳 + ' .validate')
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      let 아래 = 마디[k], 변 = 변수
      if (!아래) {
        const w = Object.keys(마디).find((z) => z.startsWith('$') && z !== '$other')
        if (w) { 아래 = 마디[w]; 변 = { ...변수, [w]: k } } else if (마디.$other) 아래 = 마디.$other
      }
      틀.push(...대기(아래, x, 곳 + '/' + k, 변))
    }
  }
  return 틀
}
/** 뿌리부터 — {eq_rows: {코드: {번호: 줄}}} 같은 덩어리 */
const 모두대기 = (자료) => Object.entries(자료).filter(([k]) => /^(eq|rk)_/.test(k)).flatMap(([k, v]) => 대기(규칙[k], v, k))

/* 쓰기 권한 식은 cost_* 와 같은 꼴인지(글자 그대로) */
console.log('1) 문(읽기·쓰기) — 현장 투입비(cost_*)와 같은 꼴')
const 꼴 = (ns) => `auth != null && root.child('${ns}_pins').child($c).exists() && root.child('${ns}_keys').child($c).child(auth.uid).val() === root.child('${ns}_pins').child($c).val()`
for (const ns of ['eq', 'rk']) {
  const 자리 = Object.keys(규칙).filter((k) => k.startsWith(ns + '_') && !/_(pins|keys)$/.test(k))
  eq(자리.every((k) => 규칙[k].$c['.read'] === 꼴(ns) && 규칙[k].$c['.write'] === 꼴(ns)), true, `${ns}: ${자리.join(' · ')} — 모두 비밀번호 맞힌 브라우저만`)
  eq(규칙[ns + '_pins']['.read'], false, `${ns}_pins 는 아무도 못 읽음`)
  eq(규칙[ns + '_pins'].$c['.write'].includes('!data.exists()'), true, `${ns}_pins 는 한 번만 씀`)
  eq(규칙[ns + '_keys'].$c.$uid['.write'].includes(`root.child('${ns}_pins').child($c).val()`), true, `${ns}_keys 는 맞는 해시만`)
}

console.log('2) 예시 장부를 저장 모양으로')
const c = 'ABCDEFGHJ', 지금 = Date.now() - 1000
const 둠 = (ns, 자리, o) => ({ [`${ns}_${자리}`]: { [c]: o } })
const ex = 예시장부()
const eq자료 = { ...둠('eq', 'books', { ...ex.정보, x: 'v1.abc.def', at: 지금 }), ...둠('eq', 'drivers', ex.자료.drivers), ...둠('eq', 'clients', ex.자료.clients), ...둠('eq', 'rows', Object.fromEntries(Object.entries(ex.자료.rows).map(([k, r]) => { const x = { ...r }; if (!x.oil) delete x.oil; if (!x.m) delete x.m; return [k, x] }))), ...둠('eq', 'pay', ex.자료.pay), ...둠('eq', 'cost', ex.자료.cost),
  ...둠('eq', 'trash', { t1: { p: 'rows', k: 'r1', v: ex.자료.rows.r1, at: 지금 } }) }
eq(모두대기(eq자료).join(', '), '', '🚜 예시 장비 장부 — 모든 칸이 규칙에 맞음')
const rx = 예시책()
const rk자료 = { ...둠('rk', 'books', { ...rx.정보, at: 지금 }), ...둠('rk', 'docs', Object.fromEntries(Object.entries(rx.자료.docs).map(([k, d]) => [k, { ...d, at: 지금, upd: 지금 }]))),
  ...둠('rk', 'pics', { x5: { a: 'data:image/jpeg;base64,AAAA', at: 지금 } }), ...둠('rk', 'trash', { t1: { p: 'docs', k: 'x1', v: rx.자료.docs.x1, at: 지금 } }) }
eq(모두대기(rk자료).join(', '), '', '⚠️ 예시 위험성평가 — 모든 칸이 규칙에 맞음')

console.log('3) 틀린 것은 막힘')
const 막 = (자료, what) => eq(모두대기(자료).length > 0, true, what)
막(둠('eq', 'rows', { r: { d: '2026-9-1', cl: 'c', q: 1, amt: 1, at: 1 } }), '날짜 모양이 틀림')
막(둠('eq', 'rows', { r: { d: '2026-09-01', cl: 'c', q: 1, amt: 1, at: 1, 주민번호: 'x' } }), '모르는 칸(주민번호 같은 것)')
막(둠('eq', 'rows', { r: { d: '2026-09-01', cl: 'c', q: 1, amt: 1, ok: 'X', at: 1 } }), '유류 구분은 G·C 만')
막(둠('eq', 'rows', { r: { d: '2026-09-01', q: 1, amt: 1, at: 1 } }), '거래처 없는 줄')
막(둠('eq', 'books', { name: 'a', at: 1, biz: '123-45-67890' }), '장부 정보에 사업자번호를 날것으로(잠근 x 칸만 됨)')
막(둠('eq', 'books', { name: 'a', at: Date.now() + 3600000 }), '앞날 시각')
막(둠('rk', 'docs', { d: { k: '9', d: '2026-09-01', j: '{}', at: 1 } }), '없는 서류 종류')
막(둠('rk', 'docs', { d: { k: '1', d: '2026-09-01', j: 'x'.repeat(150001), at: 1 } }), '서류 한 장 15만 자 넘음')
막(둠('rk', 'pics', { d: { a: 'data:image/png;base64,AAAA', at: 1 } }), '사진은 JPEG data: 만')
막(둠('rk', 'pics', { d: { a: 'data:image/jpeg;base64,' + 'A'.repeat(1500000), at: 1 } }), '사진 한 장 너무 큼')
막(둠('rk', 'trash', { t: { p: 'rows', k: 'a', v: { a: 1 }, at: 1 } }), '위험성평가 휴지통은 서류(docs)만')
막(둠('eq', 'trash', { t: { p: 'docs', k: 'a', v: { a: 1 }, at: 1 } }), '장비 장부 휴지통에 서류는 안 됨')

const 파일들 = process.argv.slice(2)
if (파일들.length) {
  console.log('4) 브라우저 시험이 실제로 쓴 자료')
  for (const f of 파일들) {
    const d = JSON.parse(fs.readFileSync(f, 'utf-8'))
    const 센 = Object.entries(d).filter(([k]) => /^(eq|rk)_/.test(k)).map(([k, v]) => `${k} ${Object.values(v).reduce((s, x) => s + (typeof x === 'object' ? Object.keys(x).length : 1), 0)}`)
    eq(모두대기(d).join(', '), '', `${path.basename(f)} — ${센.join(' · ')}`)
  }
}
console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
