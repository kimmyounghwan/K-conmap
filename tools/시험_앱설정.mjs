/**
 * 📲 G526 앱 설정(manifest.json) 시험 — node tools/시험_앱설정.mjs (인터넷 · 빌드 없이 · PC 올리기 시험에도 넣음)
 *   소장님 「인터넷에서 검색해서 건설맵을 들어가면 주소창이 안보이다가 다른 걸 클릭하면 주소창이 보여. 처음부터 주소창이 보이게 할 수 없어?」(11-03)
 *   까닭: 아이콘(앱)을 깐 PC 에서 브라우저가 k-conmap.com 링크를 «앱 창»(주소창 없음)으로 엶(엣지 «링크 처리» · 크롬 링크 잡기)
 *   → manifest «handle_links: not-preferred»(크롬 140 부터) — 링크는 앱 창 말고 브라우저 탭으로. 앱 창 첫 클릭 → 탭(AppWindowBar)은 그대로 둠(안 따르는 브라우저용).
 *   지킬 것(10-05 G136 · §185): display standalone 그대로(바꾸면 «아이콘 만들기» 한 번 설치가 사라짐) · id «/» 그대로(설치 정체) · start_url · 아이콘 파일 있음.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 200))) }
let m = null
try { m = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/public/manifest.json'), 'utf8')) } catch (e) { m = null }
ok('manifest.json 이 바른 JSON', !!m)
if (m) {
  ok('링크는 브라우저 탭으로 — handle_links «not-preferred»', m.handle_links === 'not-preferred', m.handle_links)
  ok('display standalone 그대로(아이콘 만들기 한 번 설치 · §185)', m.display === 'standalone', m.display)
  ok('id «/» · scope «/» 그대로(설치 정체 안 바뀜)', m.id === '/' && m.scope === '/', [m.id, m.scope])
  ok('start_url «/?src=app»(앱으로 연 횟수 셈)', m.start_url === '/?src=app', m.start_url)
  ok('앱 창을 잡는 설정 없음(capture_links · launch_handler 안 씀)', !('capture_links' in m) && !('launch_handler' in m))
  const 없는 = (m.icons || []).map((i) => i.src).filter((s) => !fs.existsSync(path.join(ROOT, 'web/public', s.replace(/^\//, ''))))
  ok('아이콘 파일이 다 있음', (m.icons || []).length >= 2 && !없는.length, 없는)
}
const html = fs.readFileSync(path.join(ROOT, 'web/index.html'), 'utf8')
ok('index.html 이 manifest.json 을 가리킴', /<link rel="manifest" href="\/manifest\.json"/.test(html))
console.log(`\n${bad ? '✗' : '✓'} 시험_앱설정 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
