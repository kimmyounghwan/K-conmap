// ✍ 써 본 횟수 열쇠 시험 — web/src/lib/씀열쇠.js · node tools/시험_씀세기.mjs (인터넷 없이)
//   ① 화면 주소 → «|씀|…» 열쇠 · 세지 않는 화면 null ② 열쇠가 데이터베이스 규칙 dl/p 와 받은수.jsx 세기 꼴에 맞음
//   ③ App.jsx 가 <Outlet /> 앞뒤에 표시(씀-앞 · 씀-뒤)를 두고 use씀세기() 를 부름 · 소장님 판이 같은 열쇠를 읽음
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(여기, '..')
let 통과 = 0, 실패 = 0
const 봄 = (n, ok, 더 = '') => { ok ? 통과++ : 실패++; console.log(ok ? '  ✓' : '  ✗', n, ok ? '' : 더) }
const { 씀열쇠 } = await import(pathToFileURL(path.join(ROOT, 'web/src/lib/씀열쇠.js')).href)

const 표 = [
  ['/', '|씀|바로투찰'], ['/tools/nomubi', '|씀|tools-nomubi'], ['/tools/tuipbi/v/abc/def', '|씀|tools-tuipbi'], ['/forms/tbm', '|씀|forms-tbm'],
  ['/forms', '|씀|forms'], ['/jeoksan/golgo?x=1', '|씀|jeoksan-golgo'], ['/change/naeyeok/hado', '|씀|change-naeyeok'], ['/naeyeok/ratio#a', '|씀|naeyeok-ratio'],
  ['/calc', '|씀|calc'], ['/analysis', '|씀|analysis'], ['/qna/abc123', '|씀|qna'], ['/my', '|씀|my'], ['/cad/rebar.lsp', '|씀|cad-rebar,lsp'],
  ['/notice/R26BK01726752', null], ['/guide/how', null], ['/admin', null], ['/agency/조달청', null], ['/about', null],
]
const 틀린 = 표.filter(([p, k]) => 씀열쇠(p) !== k).map(([p, k]) => `${p} → ${씀열쇠(p)} (바람 ${k})`)
봄(`화면 주소 → 열쇠 ${표.length}가지 · 앞 두 마디 · 한 마디 · 세지 않는 화면 null`, !틀린.length, 틀린.join(' / '))
const 규칙 = /^[|][^|]*([|][^|]+)?$/, 세기꼴 = /^[|][^|]+([|][^|]+)?$/
const 열쇠들 = 표.map(([p]) => 씀열쇠(p)).filter(Boolean)
봄('열쇠 — 데이터베이스 규칙 dl/p · 세기 꼴 · 80자 안 · 못 쓰는 글자(. / # $ [ ]) 없음',
  열쇠들.every((k) => 규칙.test(k) && 세기꼴.test(k) && k.length <= 80 && !/[.#$[\]/]/.test(k)), 열쇠들.join(' '))
봄('열쇠 — 퍼센트 글자 주소도 풀어서(한글 화면) · 이상한 퍼센트는 그대로', 씀열쇠('/forms/%ED%95%9C') === '|씀|forms-한' && 씀열쇠('/forms/%E0%A4') === '|씀|forms-%E0%A4')
봄('열쇠 — 아주 긴 주소는 null(규칙 80자)', 씀열쇠('/tools/' + 'a'.repeat(90)) === null)

const app = fs.readFileSync(path.join(ROOT, 'web/src/App.jsx'), 'utf8')
봄('App.jsx — <Outlet /> 바로 앞뒤에 씀-앞 · 씀-뒤 표시 · use씀세기() 부름',
  /<span id="씀-앞" hidden \/>\s*<Outlet \/>\s*<span id="씀-뒤" hidden \/>/.test(app) && /use씀세기\(\)/.test(app) && /from '\.\/lib\/씀세기\.js'/.test(app))
const 판 = fs.readFileSync(path.join(ROOT, 'web/src/lib/쓴수판.jsx'), 'utf8')
const 세 = fs.readFileSync(path.join(ROOT, 'web/src/lib/씀세기.js'), 'utf8')
봄('쓴수판 · 씀세기 — 같은 열쇠 함수(씀열쇠.js) · 세기(운영자 · 로봇 안 셈) · 사람이 한 것만(isTrusted)',
  /from '\.\/씀열쇠\.js'/.test(판) && /from '\.\/씀열쇠\.js'/.test(세) && /세기\(열쇠\)/.test(세) && /isTrusted/.test(세))

console.log(`\n씀세기 ${통과}/${통과 + 실패}`)
process.exit(실패 ? 1 : 0)
