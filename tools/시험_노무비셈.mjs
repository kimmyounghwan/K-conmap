// 👷 G367 일용 노무비 계산기 — «다른 예시 세 벌» 셈 시험(화면 없이 · 올리기 bat 에서도 돎)  node tools/시험_노무비셈.mjs
//   tools/시험자료/노무비_세벌.json = tools/노무비_손셈.py 가 코드를 쓰지 않고 법 규칙대로 따로 센 값(가상 이름)
//   A 2026-09 «일요일 빼고 모두» · 0.5 / 1.5 공수 · 65세 생일 달(실업급여 몫) · 60세 넘음
//   B 2026-05~07 연금 상한(6월 637만 · 7월 659만) · 5.20. 첫 근로(연금 다음 달부터 · 건강 1개월 미만)
//   C 2026-12 / 2027-01 60세 생일(1.15.) 연금 상실 · 생일 앞 보수 · 2027 요율 · 소득세 1천원 미만 안 뗌
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const { 달셈 } = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', 'nomubi.js')).href)
const S = JSON.parse(fs.readFileSync(path.join(여기, '시험자료', '노무비_세벌.json'), 'utf8'))
const 두 = (n) => String(n).padStart(2, '0')
export const 사람 = { 가갑: ['보통인부', 170000, ''], 가을: ['형틀목공', 260000, ''], 가병: ['철근공', 400000, '610920'], 나갑: ['특수인부', 350000, '750303'], 나을: ['보통인부', 180000, ''], 다갑: ['보통인부', 160000, ''], 다을: ['형틀목공', 200000, '670115'] }
function 상태(벌) {
  const st = { co: '가상건설(주)', site: '가상지구 시험공사', ym: '', P: [], A: {} }
  for (const [n, v] of Object.entries(S.출역[벌])) {
    const [j, w, b] = 사람[n]
    st.P.push({ id: 'p' + n, n, j, w, b, nx: '' })
    for (const [ym, d] of Object.entries(벌 === 'A' ? { '2026-09': v } : v)) {
      st.A[ym] = st.A[ym] || {}
      st.A[ym]['p' + n] = { d: Object.fromEntries(Object.entries(d).map(([k, g]) => [두(k), g])) }
    }
  }
  return st
}
let 틀 = 0, n = 0
const 봐 = (c, m, 더 = '') => { n++; if (!c) 틀++; console.log((c ? '  ✓ ' : '  ✗ ') + m + (c ? '' : ' — ' + 더)) }
const 키 = ['일수', '보수', 'it', 'lt', 'ei', 'np', 'hi', 'lc', '합', '차인', 'P', 'H']
const 까닭 = {}
for (const 벌 of ['A', 'B', 'C']) {
  console.log(벌)
  const st = 상태(벌)
  for (const [ym, m] of Object.entries(S.답[벌])) {
    const N = 달셈(st, ym)
    for (const [이름, d] of Object.entries(m)) {
      const r = N.줄.find((x) => x.p.n === 이름)
      const 받 = r ? { 일수: r.일수, 보수: r.보수, ...Object.fromEntries(['it', 'lt', 'ei', 'np', 'hi', 'lc', '합', '차인'].map((k) => [k, r.최종[k]])), P: r.대상.P.대상, H: r.대상.H.대상 } : null
      const 다름 = 받 ? 키.filter((k) => 받[k] !== d[k]) : ['줄 없음']
      봐(!다름.length, `${ym} ${이름} — 노무비 ${d.보수.toLocaleString()} · 공제 ${d.합.toLocaleString()} · 실지급 ${d.차인.toLocaleString()} = 손셈`, 다름.map((k) => `${k} ${받 && 받[k]} ≠ ${d[k]}`).join(' · '))
      if (r) 까닭[`${ym} ${이름}`] = r.대상
    }
  }
}
console.log('D 까닭 글 — 명세서에 그대로 나감')
const 글 = (k, c) => (까닭[k] && 까닭[k][c].이유) || ''
봐(/^5\.20\. 취득 — 보험료는 다음 달부터$/.test(글('2026-05 나을', 'P')), '나을 5월 연금 «5.20. 취득 — 보험료는 다음 달부터»', 글('2026-05 나을', 'P'))
봐(/^1개월 미만\(5\.20\. 첫 근로 · 6\.19\. 전에 끝\)$/.test(글('2026-06 나을', 'H')), '나을 6월 건강 — 10일인데 아닌 까닭 «1개월 미만(5.20. 첫 근로 · 6.19. 전에 끝)» (전엔 «10일 — 대상 아님»)', 글('2026-06 나을', 'H'))
봐(/^1개월 미만/.test(글('2026-05 나을', 'H')), '나을 5월 건강 — 8일도 같은 까닭', 글('2026-05 나을', 'H'))
봐(글('2026-09 가을', 'H') === '6일 — 대상 아님', '가을 6일 — 8일 미만은 그대로 «6일 — 대상 아님»', 글('2026-09 가을', 'H'))
봐(/만 64세 — 60세 이상/.test(글('2026-09 가병', 'P')) && /2026\.9\.20\.부터 만 65세 — 그 앞 보수 2,000,000원만/.test(글('2026-09 가병', 'E')), '가병 연금 60세 이상 · 고용 «9.20.부터 만 65세 — 그 앞 보수 2,000,000원만»', 글('2026-09 가병', 'P') + ' / ' + 글('2026-09 가병', 'E'))
봐(/2027\.1\.15\. 60세 상실, 그 앞 보수로/.test(글('2027-01 다을', 'P')), '다을 1월 연금 «2027.1.15. 60세 상실, 그 앞 보수로»', 글('2027-01 다을', 'P'))
const C1 = 달셈(상태('C'), '2027-01')
봐(C1.요율해 === 2027 && C1.잠정.join('·') === '장기요양·고용보험', '2027년 요율 · 잠정(장기요양 · 고용보험) 알림', `${C1.요율해} ${C1.잠정}`)
console.log(틀 ? `\n✗ ${틀} / ${n} 틀림` : `\n✓ 모두 맞음 (${n})`)
process.exit(틀 ? 1 : 0)
