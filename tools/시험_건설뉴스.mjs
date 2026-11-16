/**
 * 📰 G696 오늘의 건설 뉴스 시험 — node tools/시험_건설뉴스.mjs
 *   ① lib/건설뉴스.js 셈(날짜 글 · 새것 · 자료 걸름 · 띠 줄 고르기) ② public/newsd 자료(꼴 · 원문 고리 · 금지 말 · 최근 = 목록 첫날)
 *   ③ 이음(App.jsx 자리 · main.jsx 길 · firebase.json · 길(Crumbs) · 빠른찾기 · 구운 쪽 · 사이트맵 · 맵톡 «뉴스» 줄)
 *   소장님 「화면 배열시 이상하지 않게 해줘」 — 자리(공사연결 띠 바로 아래 · 도면대행줄 다음 · 광고 칸 앞)를 글로 묶어 둠(재발 막기)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 뿌리 = path.join(여기, '..')
const 읽 = (p) => fs.readFileSync(path.join(뿌리, p), 'utf8').replace(/\r\n/g, '\n')
const L = await import(pathToFileURL(path.join(뿌리, 'web', 'src', 'lib', '건설뉴스.js')).href)

let ok = 0, bad = 0
const 봐 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + String(더).slice(0, 400))) }

console.log('① 셈')
봐(L.날인가('2026-11-16') && !L.날인가('2026-02-30') && !L.날인가('2026-1-5') && !L.날인가(''), '날인가 — 진짜 날만(2/30 · 꼴 틀림 · 빈 것 아님)')
봐(L.날글('2026-11-16') === '11. 16.(월)' && L.날글('2026-11-16', true) === '2026. 11. 16.(월)' && L.날글('2027-01-03') === '1. 3.(일)', '날글 — «11. 16.(월)» · 긴꼴 «2026. 11. 16.(월)»', L.날글('2026-11-16'))
봐(L.한국오늘(Date.UTC(2026, 10, 15, 15, 30)) === '2026-11-16' && L.한국오늘(Date.UTC(2026, 10, 15, 14, 59)) === '2026-11-15', '한국오늘 — UTC 15:00 = 한국 다음 날 0시')
봐(L.날차('2026-11-15', '2026-11-16') === 1 && L.날차('2026-12-31', '2027-01-01') === 1 && Number.isNaN(L.날차('x', '2026-11-16')), '날차 — 해 넘김 · 틀린 날은 NaN')
봐(L.싱싱한가('2026-11-16', '2026-11-16') && L.싱싱한가('2026-11-15', '2026-11-16') && !L.싱싱한가('2026-11-14', '2026-11-16') && !L.싱싱한가('2026-11-17', '2026-11-16'),
  '싱싱한가 — 오늘 · 어제만(그제 · 내일 날짜는 띠에 안 검)')
{
  const j = { d: '2026-11-16', items: [
    { c: '정보', t: '정보 하나', s: '요약', u: 'https://example.com/a' },
    { c: '사고', t: '  사고   하나 ', s: 'x'.repeat(400), u: 'javascript:alert(1)', md: '2026-11-13' },
    { c: '모름', t: '갈래 틀림' }, { c: '정책', t: '' }, null, { c: '정책', t: '정책 하나', md: '2026-13-01', u: 'http://example.go.kr/b' },
  ] }
  const n = L.뉴스풀기(j)
  봐(n && n.items.length === 3, '뉴스풀기 — 갈래 틀림 · 빈 제목 · null 꼭지는 뺌', n && n.items.length)
  봐(n && n.items.map((x) => x.c).join() === '사고,정책,정보', '뉴스풀기 — 갈래 차례(사고 → 정책 → 정보)', n && n.items.map((x) => x.c).join())
  봐(n && n.items[0].t === '사고 하나' && n.items[0].s.length === 320, '뉴스풀기 — 빈칸 줄임 · 요약 320자까지')
  봐(n && n.items[0].u === '' && n.items[1].u === 'http://example.go.kr/b' && n.items[1].md === '', '뉴스풀기 — 고리는 http(s) 만(javascript: 막음) · 틀린 기사 날짜는 비움')
  봐(L.뉴스풀기({ d: '2026-11-16', items: [{ c: '모름', t: 'x' }] }) === null && L.뉴스풀기({ d: '11/16', items: [] }) === null && L.뉴스풀기(null) === null, '뉴스풀기 — 쓸 꼭지가 없거나 날짜가 틀리면 null(띠 안 그림)')
}
{
  const a = [{ c: '사고', t: 'a1' }, { c: '사고', t: 'a2' }, { c: '정책', t: 'p1' }, { c: '정보', t: 'i1' }]
  봐(L.띠줄(a).map((x) => x.t).join() === 'a1,p1,i1', '띠줄 — 갈래마다 맨 앞 하나(사고 · 정책 · 정보)', L.띠줄(a).map((x) => x.t).join())
  봐(L.띠줄([{ c: '사고', t: 'a1' }, { c: '사고', t: 'a2' }, { c: '사고', t: 'a3' }, { c: '사고', t: 'a4' }]).map((x) => x.t).join() === 'a1,a2,a3', '띠줄 — 빈 갈래는 남은 꼭지로 채움 · 셋까지')
  봐(L.갈래묶기(a).map(([c, x]) => c + x.length).join() === '사고2,정책1,정보1' && L.갈래묶기([{ c: '정보', t: 'i' }]).length === 1, '갈래묶기 — 꼭지 있는 갈래만')
  봐(L.목록풀기({ days: [['2026-11-15', 7], ['2026-11-16', 8], ['bad', 1], 'x'] }).map((x) => x[0]).join() === '2026-11-16,2026-11-15', '목록풀기 — 새것부터 · 틀린 줄은 뺌')
}

console.log('② 자료(public/newsd)')
const 폴더 = path.join(뿌리, 'web', 'public', 'newsd')
const 목 = L.목록풀기(JSON.parse(fs.readFileSync(path.join(폴더, 'list.json'), 'utf8')))
봐(목.length >= 1, '날짜 목록이 있음', 목.length)
const 최근 = JSON.parse(fs.readFileSync(path.join(폴더, 'latest.json'), 'utf8'))
봐(목.length && 최근.d === 목[0][0], 'latest.json = 목록 맨 앞 날(가장 최근)', 최근.d + ' / ' + (목[0] || [])[0])
봐(목.length && JSON.stringify(최근) === JSON.stringify(JSON.parse(fs.readFileSync(path.join(폴더, 목[0][0] + '.json'), 'utf8'))), 'latest.json 과 그날 파일이 같음')
const 금지 = /무료|클로드|Claude/i
for (const [d, n] of 목) {
  const 원 = JSON.parse(fs.readFileSync(path.join(폴더, d + '.json'), 'utf8'))
  const 풀 = L.뉴스풀기(원)
  봐(풀 && 풀.d === d && 풀.items.length === 원.items.length && 원.items.length === n, `${d} — 꼭지 ${n}건 모두 꼴 맞음(걸러져 빠진 꼭지 없음 · 목록 수와 같음)`, 풀 && 풀.items.length)
  const 틀 = 원.items.filter((x) => !/^https:\/\//.test(x.u || '') || !x.m || !L.날인가(x.md) || x.md > d || !x.s || !x.k || (x.t || '').length > 90 || (x.s || '').length > 320 || (x.k || '').length > 220 || (x.kk || '').length > 40)
  봐(!틀.length, `${d} — 꼭지마다 원문(https) · 매체 · 기사 날짜(그날 이전) · 요약 · 현장에선? · 길이 한도`, 틀.map((x) => x.t).join(' | '))
  const 말 = 원.items.filter((x) => 금지.test([x.t, x.s, x.k, x.kk].join(' ')))
  봐(!말.length, `${d} — 사이트 글 금지 말(무료 · 클로드) 없음`, 말.map((x) => x.t).join(' | '))
  봐(원.items.some((x) => x.c === '사고'), `${d} — 사건 · 사고 꼭지가 있음(소장님 «사건 사고 위주로»)`)
}

console.log('③ 이음')
const app = 읽('web/src/App.jsx')
const 자 = (s) => app.indexOf(s)
봐(자('<공사연결띠 />') > 0 && 자('<뉴스띠 />') > 자('<공사연결띠 />') && 자('<뉴스띠 />') < 자('<InstallBar />'), '뉴스띠 = 공사연결 띠 바로 다음(설치 띠 앞) — 자리 ①')
봐(자('<뉴스끝줄 />') > 자('<도면대행줄 />') && 자('<뉴스끝줄 />') < 자('<애드핏칸 key={pathname} 자리="끝" />') && 자('<뉴스끝줄 />') > 자('<span id="씀-뒤" hidden />'), '뉴스끝줄 = 씀-뒤 · 도면대행줄 다음 · 광고 칸 앞 — 자리 ③')
const 줄 = 읽('web/src/뉴스줄.jsx')
봐(/뉴스띠길 = \['\/', '\/calc', '\/first', '\/live', '\/svc', '\/svc\/first', '\/svc\/calc', '\/goods', '\/goods\/first', '\/goods\/calc'\]/.test(줄), '뉴스띠 — 입찰 화면(세 방의 바로투찰 · 1순위 · 공고)만')
봐(/\^\\\/\(forms\|tools\)\(\\\/\|\$\)/.test(줄) && 줄.includes('!도면줄칸(p)'), '뉴스끝줄 — 서식 · 도구만 · 도면 도구 쪽은 뺌(도면대행줄과 겹쳐 쌓이지 않게)')
봐(줄.includes('kn-wait') && 줄.includes('aria-hidden="true"'), '자료가 오기 전엔 같은 높이 빈 틀(아래가 안 밀림)')
const css = 읽('web/src/styles.css')
봐(/\.kn-h \{[^}]*white-space: nowrap;[^}]*text-overflow: ellipsis;/.test(css) && /\.kn-one \{[^}]*-webkit-line-clamp: 2;[^}]*min-height: 3\.1em;/.test(css), '띠 줄은 한 줄씩(…) · 끝 줄은 두 줄 고정 — 높이가 늘 같음')
봐(/@media print \{ \.kn-strip, \.kn-line \{ display: none !important; \} \}/.test(css), '인쇄엔 안 나옴')
const main = 읽('web/src/main.jsx')
봐(main.includes('<Route path="/news" element=') && main.includes('<Route path="/news/:d" element='), 'main.jsx — /news · /news/:d 길')
const fb = JSON.parse(읽('web/firebase.json'))
const rw = fb.hosting.rewrites.map((x) => x.source)
봐(rw.includes('/news') && rw.includes('/news/**'), 'firebase.json rewrites — /news · /news/** (안 넣으면 404)')
const hd = fb.hosting.headers.find((x) => x.source === '/newsd/**')
봐(hd && hd.headers.some((h) => h.key === 'Cache-Control' && /max-age=300\b/.test(h.value)) && hd.headers.some((h) => h.key === 'X-Robots-Tag' && h.value === 'noindex'), 'firebase.json — /newsd/** 5분 캐시 · noindex')
const cr = 읽('web/src/Crumbs.jsx')
봐(cr.includes("'/news': '오늘의 건설 뉴스'") && cr.includes("'/news': '/'"), '길(Crumbs) — 이름 · 부모(바로투찰)')
봐(읽('web/src/lib/빠른찾기.js').includes("['/news', '오늘의 건설 뉴스',"), '빠른찾기 — 오늘의 건설 뉴스')
const pr = 읽('prerender.py'), sm = 읽('sitemap.py')
봐(pr.includes('def news_page(') && pr.includes('write("news.html"') && pr.includes('write(f"news/{_d}.html"'), '구운 쪽 — news.html · news/{날}.html')
봐(/t\(x\.get\("t"\), 90\)/.test(pr) && /t\(x\.get\("s"\), 320\)/.test(pr) && /t\(x\.get\("k"\), 220\)/.test(pr), '구운 쪽 걸름 길이 = 화면 걸름 길이(90 · 320 · 220)')
봐(sm.includes('("/news", "0.7", "daily")') && sm.includes('def news_days(') && sm.includes('/news/{d}</loc>'), '사이트맵 — /news · 그날 쪽')
const q = 읽('web/src/pages/Qna.jsx')
봐(q.includes("const 뉴스글인가 = (r) => /^\\s*📰/.test(String((r && r.t) || ''))") && q.includes('<span className="mt-nt nw">뉴스</span>') && q.includes('...다.filter((r) => !뉴스글인가(r))'),
  '맵톡 — 📰 공지 글은 «뉴스» 줄 · 맨 위엔 최근 하나(지난 뉴스가 공지를 밀어내지 않게)')

console.log(bad ? `\n✗ 시험_건설뉴스 틀림 ${bad} / ${ok + bad}` : `\n✓ 시험_건설뉴스 ${ok}/${ok}`)
process.exit(bad ? 1 : 0)
