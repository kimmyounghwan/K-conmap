// 🧪 G511 — 배포마다 바뀌는 도장(BUILD)이 묶음(js)에 들어가지 않는가 (node tools/시험_묶음이름.mjs)
//   소장님 「사이트 화면이 어쩔때 잠깐 안 열려. 점검해봐」(2026-11-02)
//   원인: vite define __BUILD__ → lib/data.js 가 묶음(index-*.js)에 들어가 자료만 바뀐 배포(20분쯤마다)에도 index 이름이 바뀌고,
//        index 를 부르는 화면 묶음 95개 이름이 줄줄이 바뀜 → 열어 둔 화면에서 다른 화면을 누르면 404 → 새로 고침(«잠깐 안 열림»).
//   고침: 도장은 HTML(window.__KCM_BUILD__)에만. 이 시험은 그 약속이 깨지지 않게 지킵니다(다시 구우면 막힘).
//   ⚠️ 무거운 확인(빌드 두 번 → 묶음 이름이 하나도 안 바뀜)은 손으로: cd web && npx vite build 두 번 · ls dist/assets 비교(G511 때 225개 같음).
//   🩹 G512(같은 날) — 코드가 바뀐 배포는 이름이 바뀌는 게 맞음 → 배포 앞에 바로 앞 판 묶음을 사이트에서 받아 같이 올림(update.yml «옛 화면 묶음 이어 두기»).
//     여기서는 그 단계 자리 · firebase.json 만 봄(PC 에서도 도는 가벼운 시험). 셈 자체는 tools/시험_옛묶음잇기.py(127.0.0.1 작은 서버 — 클라우드에서만).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 웹 = path.join(여기, '..', 'web')
let 통과 = 0, 틀림 = 0
const 봄 = (v, 이름, 덧 = '') => { if (v) 통과++; else { 틀림++; console.log(`  ✗ ${이름} ${덧}`) } }

const 설정 = fs.readFileSync(path.join(웹, 'vite.config.js'), 'utf8')
const define = (설정.match(/define:\s*\{([^}]*)\}/) || [])[1] || ''
봄(define && !/__BUILD__/.test(define) && /__CODE__/.test(define), 'vite define 에 __BUILD__ 없음(__CODE__ 는 코드가 바뀔 때만 바뀌어 괜찮음)', define)
봄(/transformIndexHtml\(html\)\s*\{[\s\S]{0,300}window\.__KCM_BUILD__=\$\{JSON\.stringify\(BUILD\)\}/.test(설정), '도장은 index.html 에 window.__KCM_BUILD__ 로(판번호 transformIndexHtml)')
봄(/fs\.writeFileSync\(path\.resolve\(낼곳, 'version\.json'\), JSON\.stringify\(\{ code: CODE, build: BUILD \}\)\)/.test(설정), 'version.json 에는 그대로 code · build')

const 걷기 = (d, 모음 = []) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) 걷기(p, 모음)
    else if (/\.(jsx?|mjs)$/.test(e.name)) 모음.push(p)
  }
  return 모음
}
const 파일들 = 걷기(path.join(웹, 'src'))
const 남은 = 파일들.filter((p) => /(^|[^_A-Za-z])__BUILD__/.test(fs.readFileSync(p, 'utf8').replace(/__KCM_BUILD__/g, '')))
봄(파일들.length > 100 && !남은.length, `web/src ${파일들.length}개 파일에 __BUILD__ 가 없음(도장은 window.__KCM_BUILD__ 로만)`, 남은.map((p) => path.relative(웹, p)).join(' · '))
const 데이터 = fs.readFileSync(path.join(웹, 'src', 'lib', 'data.js'), 'utf8')
봄(/const V = \(typeof window !== 'undefined' && typeof window\.__KCM_BUILD__ === 'string' && window\.__KCM_BUILD__\) \|\| '0'/.test(데이터), 'lib/data.js 자료 주소 도장(?v=)은 HTML 의 window.__KCM_BUILD__')
const 쪽 = fs.readFileSync(path.join(웹, 'index.html'), 'utf8')
봄(/<head>/.test(쪽), 'index.html 에 <head> 가 있어 도장이 들어갈 자리가 있음')

// 🩹 G512 — «코드가 바뀐» 배포 뒤에도 바로 앞 판 묶음이 사이트에 남게(옛 화면 묶음 이어 두기 · 셈은 tools/시험_옛묶음잇기.py — 클라우드에서)
const 일꾼 = fs.readFileSync(path.join(여기, '..', '.github', 'workflows', 'update.yml'), 'utf8').replace(/\r\n/g, '\n')
const 굽기 = 일꾼.indexOf('\n      - name: 주소별 HTML 굽기\n'), 잇기 = 일꾼.indexOf('\n      - name: 옛 화면 묶음 이어 두기\n'), 배포 = 일꾼.indexOf('\n      - name: 사이트 배포\n')
const 잇기단계 = 잇기 > 0 && 배포 > 잇기 ? 일꾼.slice(잇기, 배포) : ''
봄(0 < 굽기 && 굽기 < 잇기 && 잇기 < 배포 && /continue-on-error: true/.test(잇기단계) && /run: python tools\/옛묶음잇기\.py web\/dist/.test(잇기단계),
  'update.yml «옛 화면 묶음 이어 두기» — 굽기 뒤 · 배포 앞 · 실패해도 배포는 그대로', `${굽기} ${잇기} ${배포}`)
봄(fs.existsSync(path.join(여기, '옛묶음잇기.py')), 'tools/옛묶음잇기.py 있음')
const 불 = JSON.parse(fs.readFileSync(path.join(웹, 'firebase.json'), 'utf8'))
const 목록머리 = ((불.hosting && 불.hosting.headers) || []).find((h) => h.source === '/assets-keep.json')
봄(!!목록머리 && 목록머리.headers.some((x) => x.key === 'Cache-Control' && /no-store/.test(x.value)), 'firebase.json /assets-keep.json 은 캐시 안 함(배포 앞에 늘 지금 목록을 읽게)')

console.log(`\n묶음 이름 지킴 ${통과}/${통과 + 틀림}`)
if (틀림) process.exit(1)
