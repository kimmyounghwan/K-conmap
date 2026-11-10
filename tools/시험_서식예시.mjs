// ✍ G635 서식 «작성 예시» — node tools/시험_서식예시.mjs (빌드 · 인터넷 없이 — PC 올리기 시험에도)
//   소장님(11-10): 「예시 만들어 주고」 — 점검에서 서식 200 중 6이 «예시 없음»(공내역서 한 벌 · 위험성평가 5종)
//   ① 모든 서식이 «작성 예시» 판정(Forms.jsx 작성예시있음 과 같은 셈) — 빠진 서식 0
//   ② 공내역서 한 벌 ex — 서식 칸 모양 그대로(kv 4 · 표 줄 · 칸 수 · 서명 둘) · 가상 이름만(실제 공사 · 회사 · 사람 이름 안 씀)
//   ③ 화면(Forms.jsx) · 구운 쪽(prerender.py) 판정이 같은 셈(wihgen 넣음) · 위험성평가 미리보기 이름 «작성 예시»
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const 읽기 = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n')
let n = 0, bad = 0
const ok = (이름, 참, 값) => { n++; if (!참) bad++; console.log((참 ? '  ✓ ' : '  ✗ ') + 이름 + (참 || 값 === undefined ? '' : ' = ' + JSON.stringify(값).slice(0, 300))) }
const F = JSON.parse(읽기('web/src/data/forms.json')).forms
const 작성예시있음 = (f) => !!f && (f.gen === 'forms2' || !!f.re || !!f.ex || f.gen === 'wihgen')
const 빠짐 = F.filter((f) => !작성예시있음(f)).map((f) => f.slug)
ok(`① 서식 ${F.length}개 모두 작성 예시(빠진 것 0)`, F.length >= 200 && 빠짐.length === 0, 빠짐)
const g = F.find((f) => f.slug === 'gongnaeyeok-hanbeol')
const B = g.sheet.blocks, ex = g.ex
const 꼴맞음 = Array.isArray(ex) && ex.length === B.length && B.every((b, i) => {
  const x = ex[i]
  if (b.t === 'kv') return Array.isArray(x) && x.length === b.rows.length && x.every((v) => typeof v === 'string' && v.trim())
  if (b.t === 'table') return Array.isArray(x) && x.length === b.rows.length && x.every((r) => Array.isArray(r) && r.length === b.cols.length)
  if (b.t === 'sign') return x && Array.isArray(x.n) && x.n.length === b.who.length && x.n.every((v) => v) && /^\d{4}-\d{2}-\d{2}$/.test(x.d)
  return x === null
})
ok('② 공내역서 한 벌 ex — 서식 칸 모양 그대로(공사명 · 발주기관 · 위치 · 작성일 · 표 · 서명 둘)', 꼴맞음, ex)
const 글 = JSON.stringify(ex)
ok('② 가상 이름만 — 공사 · 발주처 · 사람에 «가상»', /가상 OO지구/.test(글) && /가상시/.test(글) && ex[4].n.every((v) => v.includes('가상')), ex[0])
const fx = 읽기('web/src/pages/Forms.jsx'), pr = 읽기('prerender.py'), wm = 읽기('web/src/tools/위험성미리.jsx')
ok('③ 화면 판정 한 곳(작성예시있음 — 걸러 보기 · 큰 그림 칸 · 서식 칸 셋이 같이 씀)', fx.includes("export const 작성예시있음 = (f) => !!f && (f.gen === 'forms2' || !!f.re || !!f.ex || f.gen === 'wihgen')")
  && fx.includes("ok: 작성예시있음 }") && (fx.match(/const 예시 = 작성예시있음\(f\)/g) || []).length === 2 && !/const 예시 = f\.gen === 'forms2'/.test(fx))
ok('③ 구운 쪽 판정 같은 셈(prerender.py — forms2 · wihgen · re · ex)', pr.includes('ex = f.get("gen") in ("forms2", "wihgen") or f.get("re") or f.get("ex")'))
ok('③ 위험성평가 미리보기 이름 «✍ 작성 예시(지어낸 현장)» · «예문» 말 없음(화면 글)', wm.includes('· ✍ 작성 예시(지어낸 현장)') && !/className="count">· 예문/.test(wm))
console.log(`\n${bad ? '❌' : '✅'} 시험_서식예시 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
