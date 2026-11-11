/**
 * 📝 G628 예상문제(web/src/lib/예상문제.js) 시험 — node tools/시험_예상문제.mjs
 *   소장님(11-10) 「최신기출문제도 해줘. 예상문제도 해주고…」 → 건설맵이 직접 만든 계산 문제(숫자 바뀜)
 *   ① 틀마다 씨앗 2,000개 — 보기 넷 서로 다름 · 정답 자리 0 ~ 3 · 보기[정답] = 시험이 «따로» 셈한 값(lib 를 쓰지 않은 공식) · 글자에 NaN · undefined 없음
 *   ② 정답 자리 고르게(각 자리 15 ~ 35 %) · 같은 씨앗 = 같은 문제 · 다른 씨앗 = 숫자가 바뀜(200개 중 같은 문 40 % 아래)
 *   ③ 시험지 — 과목 차례 · 문제 수 · 채점(과목 40 · 평균 60 — 국가기술자격법 시행령 제20조 ②)
 *   ④ cert.json deep[종목].quiz 과목 · 틀 · 맛보기 = lib 문제집(구운 쪽 · 사이트맵이 그쪽을 봄) — 종목마다
 *   ⑤ G645(11-10) 건축기사 5과목 20틀 — 건축구조는 토목 틀을 과목 이름만 바꿔 씀(같은 문제) · 법규 틀 근거에 조문 · 시험지 · 채점(5과목)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
const 여기 = path.dirname(fileURLToPath(import.meta.url))
const Q = await import(pathToFileURL(path.join(여기, '..', 'web', 'src', 'lib', '예상문제.js')).href)

let bad = 0, n = 0
const ok = (이름, c, got) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (c || got === undefined ? '' : ' = ' + JSON.stringify(got).slice(0, 400))) }
const 글 = Q.숫자글
const rad = (d) => (d * Math.PI) / 180

console.log('⓪ 숫자글 — 손 셈 반올림(5 면 올림) · 쉼표 · 브라우저마다 같은 글')
const 숫자표 = [[1.005, 2, '1.01'], [44.145, 2, '44.15'], [9.81 * 1.5 * 3, 2, '44.15'], [0.1 + 0.2, 1, '0.3'], [2.5, 0, '3'], [-2.5, 0, '-3'], [-50, 3, '-50.000'],
  [1234567.891, 2, '1,234,567.89'], [999.95, 1, '1,000.0'], [0, 1, '0.0'], [-0.0001, 2, '0.00'], [12.25, 1, '12.3'], [1e-7, 2, '0.00'], [20000, 0, '20,000'], [3.14159, 5, '3.14159']]
for (const [x, 자리, 기대] of 숫자표) ok(`숫자글(${x}, ${자리}) = ${기대}`, 글(x, 자리) === 기대, 글(x, 자리))

/* 따로 셈 — lib 와 다른 손으로(같은 공식이 «글자 그대로» 옮겨진 것이 아니라 교과서 꼴로 다시 적음) */
const 따로 = {
  'm-simple-udl': ({ w, L }) => [w * L ** 2 / 8, 1],
  'm-simple-point': ({ P, L }) => [(P / 2) * (L / 2), 1],
  'm-rect-inertia': ({ b, h }) => [b * h * h * h / 12 / 1e6, 1],
  'm-cantilever-defl': ({ P, L, EI }) => [P * L * L * L / (3 * EI) * 1e3, 2],
  's-level': ({ HA, BS, FS }) => [(HA + BS) - FS, 3],
  's-area-scale': ({ m, a }) => [a * 1e-4 * m * m, 1],
  's-random-error': ({ e, n: k }) => [e * k ** 0.5, 1],
  's-latitude': ({ l, t }) => [l * Math.cos(rad(t)), 3],
  'h-continuity': ({ D1, D2, V1 }) => [(V1 * Math.PI * D1 * D1 / 4) / (Math.PI * D2 * D2 / 4), 2],
  'h-gate-force': ({ b, h }) => [9.81 * b * h * h / 2, 2],
  'h-orifice': ({ C, d, h }) => [C * (Math.PI / 4) * (d / 100) ** 2 * Math.sqrt(19.6 * h) * 1000, 2],
  'h-rational': ({ C, I, A }) => [0.27777777777777778 * C * I * A, 2],
  'r-stress-block': ({ As, fy, fck, b }) => [As * fy / (0.85 * fck * b), 1],
  'r-nominal-moment': ({ As, fy, fck, b, d }) => { const a = As * fy / (0.85 * fck * b); return [As * fy * (d - a / 2) / 1e6, 1] },
  'r-slab-min': ({ l, 비 }) => [l * 1000 / 비, 0],
  't-porosity': ({ e }) => [100 * e / (1 + e), 1],
  't-dry-unit': ({ gt, w }) => [gt / (1 + w / 100), 2],
  't-relative-density': ({ emax, emin, e }) => [100 * (emax - e) / (emax - emin), 1],
  't-rankine-active': ({ g, H, phi }) => { const Ka = (1 - Math.sin(rad(phi))) / (1 + Math.sin(rad(phi))); return [g * H * H * Ka / 2, 1] },
  'w-detention': ({ V, Q: q }) => [24 * V / q, 1],
  'w-bod-load': ({ C, Q: q }) => [C * q * 1e-3, 0],
  'w-overflow': ({ Q: q, D }) => [q / (Math.PI * D * D / 4), 1],
  'w-max-day': ({ P, q }) => [P * q / 1000, 0],
  /* 🏛 G645 건축기사 */
  'ap-use-rate': ({ T, U }) => [100 * U / T, 1],
  'ap-purity': ({ U, S }) => [100 * S / U, 1],
  'ap-rentable': ({ F, R }) => [100 * R / F, 1],
  'ac-loose': ({ V, L }) => [L * V, 1],
  'ac-fill': ({ F, C }) => [F * (1 / C), 1],
  'ac-wc': ({ W, C }) => [100 * W / C, 1],
  'ac-cost-slope': ({ Tn, Tc, Cn, Cc }) => [(Cc - Cn) / (Tn - Tc), 0],
  'as-bending-stress': ({ b, h, M }) => [6 * M * 1e6 / (b * h * h), 2],
  'as-euler': ({ K, E, I, L }) => [Math.PI * Math.PI * E * (I * 1e6) / Math.pow(K * L * 1000, 2) / 1000, 1],
  'ae-heat': ({ K, A, ti, to }) => [K * A * (ti - to), 1],
  'ae-co2': ({ n: 사람, m, Ci, Co }) => [100 * 사람 * m / (Ci - Co), 1],
  'ae-lumen': ({ E, a, b, F, U, M }) => [Math.ceil(E * a * b / (F * U * M) - 1e-9), 0],
  'ae-3phase': ({ V, I, pf }) => [Math.sqrt(3) * V * I * pf / 1000, 2],
  'al-bcr': ({ A, B }) => [100 * B / A, 1],
  'al-far': ({ A, f, n: 층 }) => [100 * f * 층 / A, 1],
  'al-window': ({ A, 무엇 }) => [A / (무엇 === '채광' ? 10 : 20), 1],
}
/* 건축구조 — 토목 틀을 그대로 쓴 것은 따로 셈도 같은 것 */
for (const [새, 옛] of [['as-udl', 'm-simple-udl'], ['as-point', 'm-simple-point'], ['as-inertia', 'm-rect-inertia'], ['as-stress-block', 'r-stress-block']]) 따로[새] = 따로[옛]

const 집 = Q.문제집['tomok-gisa']
const 모든틀 = [...new Set(Object.values(Q.문제집).flatMap((z) => z.틀))]
console.log('① 틀마다 씨앗 2,000개')
ok(`토목기사 틀 ${집.틀.length}개 · 과목 6 · 과목마다 틀 3개 넘게`, 집.과목.length === 6 && 집.과목.every((과) => 집.틀.filter((id) => Q.틀of(id).과목 === 과).length >= 3), 집.과목.map((과) => 집.틀.filter((id) => Q.틀of(id).과목 === 과).length))
ok(`시험의 «따로 셈» 이 모든 틀(종목 ${Object.keys(Q.문제집).length} · 틀 ${모든틀.length})에 있음`, 모든틀.every((id) => 따로[id]), 모든틀.filter((id) => !따로[id]))
for (const id of 모든틀) {
  const 자리셈 = [0, 0, 0, 0]
  let 틀림 = null
  for (let s = 1; s <= 2000; s++) {
    const q = Q.문제(id, s * 2654435761)
    if (!q) { 틀림 = ['문제 못 만듦', s]; break }
    if (q.보기.length !== 4 || new Set(q.보기).size !== 4) { 틀림 = ['보기 겹침', s, q.보기]; break }
    if (!(q.답 >= 0 && q.답 <= 3)) { 틀림 = ['정답 자리', s, q.답]; break }
    const [값, 자리] = 따로[id](q.입)
    const 기대 = `${id === 's-random-error' ? '±' : ''}${글(값, 자리)} ${q.단위}`
    if (q.보기[q.답] !== 기대) { 틀림 = ['정답 ≠ 따로 셈', s, q.보기[q.답], 기대, q.입]; break }
    if (Math.abs(값 - q.값) > 1e-9 * Math.max(1, Math.abs(값))) { 틀림 = ['값 다름', s, 값, q.값]; break }
    const 모두 = [q.문, ...q.보기, ...q.해설, q.근거].join(' ')
    if (/NaN|undefined|Infinity|\[object/.test(모두)) { 틀림 = ['글자 깨짐', s, 모두.slice(0, 200)]; break }
    if (!q.해설.length || !q.근거) { 틀림 = ['해설 · 근거 없음', s]; break }
    자리셈[q.답]++
  }
  ok(`${Q.틀of(id).과목} — ${Q.틀of(id).이름}: 보기 넷 · 정답 = 따로 셈 · 글자 (씨앗 2,000)`, !틀림, 틀림)
  ok(`   정답 자리 고르게(${자리셈.join(' · ')})`, 자리셈.every((k) => k >= 300 && k <= 700), 자리셈)
}

console.log('② 같은 씨앗 = 같은 문제 · 다른 씨앗 = 숫자 바뀜')
ok('같은 씨앗 두 번 → 똑같은 문제(틀린 문제 다시 풀기)', 모든틀.every((id) => JSON.stringify(Q.문제(id, 777)) === JSON.stringify(Q.문제(id, 777))))
const 바뀜 = 모든틀.map((id) => { const 문들 = new Set(); for (let s = 1; s <= 200; s++) 문들.add(Q.문제(id, s * 40503).문); return [id, 문들.size] })
ok('씨앗 200개에서 서로 다른 문(숫자) 30개 넘게 — 틀마다', 바뀜.every(([, k]) => k > 30), 바뀜.filter(([, k]) => k <= 30))

console.log('③ 시험지 · 채점')
const t12 = Q.시험지('tomok-gisa', null, 12, 2026)
ok('전체 12문제 — 과목마다 2문제 · 과목 차례(응용역학 → 상하수도공학)', t12.length === 12 && 집.과목.every((과, i) => t12[i * 2].과목 === 과 && t12[i * 2 + 1].과목 === 과), t12.map((x) => x.과목))
const t1 = Q.시험지('tomok-gisa', ['토질 및 기초'], 5, 3)
ok('과목 하나(토질 및 기초) 5문제', t1.length === 5 && t1.every((x) => x.과목 === '토질 및 기초'), t1.map((x) => x.과목))
const 셈 = (t) => 집.과목.map((과) => t.filter((x) => x.과목 === 과).length)
const t6 = Q.시험지('tomok-gisa', null, 6, 11), t30 = Q.시험지('tomok-gisa', null, 30, 12), t20 = Q.시험지('tomok-gisa', null, 20, 13)
ok('문제 수 그대로 — 6(과목마다 1) · 30(과목마다 5) · 20(4 · 4 · 3 · 3 · 3 · 3)', t6.length === 6 && t30.length === 30 && t20.length === 20 && 셈(t6).every((k) => k === 1) && 셈(t30).every((k) => k === 5) && 셈(t20).join() === '4,4,3,3,3,3', [셈(t6), 셈(t30), 셈(t20)])
const t1x = Q.시험지('tomok-gisa', ['응용역학'], 20, 14)
ok('한 과목 20문제 — 틀 4개를 돌려 쓰되 같은 문(숫자)은 겹치지 않음', t1x.length === 20 && new Set(t1x.map((x) => x.문)).size === 20, new Set(t1x.map((x) => x.문)).size)
ok('없는 과목 · 없는 종목 → 빈 시험지', Q.시험지('tomok-gisa', ['없는과목'], 5, 1).length === 0 && Q.시험지('없음', null, 5, 1).length === 0)
ok('같은 씨앗 시험지 = 같은 문제들', JSON.stringify(Q.시험지('tomok-gisa', null, 12, 99)) === JSON.stringify(Q.시험지('tomok-gisa', null, 12, 99)))
ok('다른 씨앗 시험지 = 다른 문제들', JSON.stringify(Q.시험지('tomok-gisa', null, 12, 99)) !== JSON.stringify(Q.시험지('tomok-gisa', null, 12, 100)))
const 다맞음 = Q.채점('tomok-gisa', t12.map((x) => ({ 과목: x.과목, 맞음: true })))
const 한과목낙 = Q.채점('tomok-gisa', t12.map((x) => ({ 과목: x.과목, 맞음: x.과목 !== '측량학' })))
const 평균낙 = Q.채점('tomok-gisa', t12.map((x, i) => ({ 과목: x.과목, 맞음: i % 2 === 0 })))
ok('채점 — 다 맞음 합격 · 한 과목 0점이면 불합격(과목 40) · 모두 50점이면 불합격(평균 60)', 다맞음.합격 && 다맞음.평균 === 100 && !한과목낙.합격 && !평균낙.합격 && 평균낙.평균 === 50, [다맞음.합격, 한과목낙.합격, 평균낙.평균])
const 경계 = Q.채점('tomok-gisa', t30.map((x, i) => ({ 과목: x.과목, 맞음: (i % 5) < 3 })))   /* 과목마다 5문제 중 3 = 60점 */
ok('채점 — 과목마다 60점이면 평균 60 = 합격(이상)', 경계.합격 && 경계.평균 === 60 && 경계.줄.every((x) => x.점수 === 60), [경계.평균, 경계.합격])
const 한과목 = Q.채점('tomok-gisa', t1.map((x) => ({ 과목: x.과목, 맞음: true })))
ok('한 과목만 풀면 «전과목» 아님 → 합격 판정 안 함', !한과목.전과목 && !한과목.합격 && 한과목.줄.length === 1 && 한과목.줄[0].점수 === 100, 한과목)
ok('채점 줄 = 과목 차례(응용역학 → 상하수도공학)', JSON.stringify(Q.채점('tomok-gisa', [...t12].reverse().map((x) => ({ 과목: x.과목, 맞음: true }))).줄.map((x) => x.과목)) === JSON.stringify(집.과목))
ok('합격 기준 = 과목 40 · 평균 60', 집.합격.과목 === 40 && 집.합격.평균 === 60)

console.log('④ cert.json 과 같음 — 종목마다')
const cert = JSON.parse(fs.readFileSync(path.join(여기, '..', 'web', 'src', 'data', 'cert.json'), 'utf8'))
for (const [종목, z] of Object.entries(Q.문제집)) {
  const qz = ((cert.deep || {})[종목] || {}).quiz || {}
  ok(`deep[${종목}].quiz 과목 = lib 과목`, JSON.stringify(qz.과목) === JSON.stringify(z.과목), qz.과목)
  ok(`deep[${종목}].quiz 틀(id · 과목 · 이름) = lib`, JSON.stringify((qz.틀 || []).map((x) => [x.id, x.과목, x.이름])) === JSON.stringify(z.틀.map((id) => [id, Q.틀of(id).과목, Q.틀of(id).이름])), (qz.틀 || []).length)
  const 예시 = qz.예시 || []
  const 예시같음 = 예시.every((e) => { const q = Q.문제(e.id, e.씨); return q && ['과목', '이름', '문', '보기', '답', '해설', '근거'].every((k) => JSON.stringify(q[k]) === JSON.stringify(e[k])) })
  ok(`deep[${종목}].quiz 예시(맛보기) — 과목마다 한 문제 · lib 가 같은 씨앗으로 만든 것과 글자까지 같음(구운 쪽 = 화면)`, 예시.length === z.과목.length && z.과목.every((과, i) => 예시[i] && 예시[i].과목 === 과) && 예시같음, 예시.map((e) => e.id))
  ok(`deep[${종목}].quiz 글 — h1 · 제목 · 설명에 종목 이름 · ${z.과목.length}과목 · 틀 ${z.틀.length}가지`, (qz.h1 || '').includes(z.이름) && (qz.title || '').includes(`${z.과목.length}과목`) && (qz.desc || '').includes(`${z.틀.length}가지`), [qz.h1, qz.title])
}
console.log('⑤ G645 건축기사')
const 건 = Q.문제집['geonchuk-gisa']
ok('건축기사 5과목 = 큐넷 필기 과목 차례(건축계획 · 건축시공 · 건축구조 · 건축설비 · 건축관계법규) · 과목마다 틀 3개 넘게', JSON.stringify(건.과목) === JSON.stringify(['건축계획', '건축시공', '건축구조', '건축설비', '건축관계법규'])
  && 건.과목.every((과) => 건.틀.filter((id) => Q.틀of(id).과목 === 과).length >= 3) && 건.합격.과목 === 40 && 건.합격.평균 === 60)
const 필과 = (((cert.deep || {})['geonchuk-gisa'] || {}).secs || []).flatMap((s) => s.blocks).filter((b) => b.t === 'table' && b.cols[0] === '구분').flatMap((b) => b.rows).find((r) => r[0] === '필기 과목')
ok('건축기사 과목 = cert.json 깊은 글 «필기 과목» 줄(큐넷)', 필과 && 건.과목.every((과, i) => 필과[1].includes(`${i + 1}. ${과}`)), 필과)
ok('건축구조 — 토목 틀을 그대로 쓴 넷(as-udl · as-point · as-inertia · as-stress-block)은 같은 씨앗 = 같은 문 · 과목만 «건축구조»',
  [['as-udl', 'm-simple-udl'], ['as-point', 'm-simple-point'], ['as-inertia', 'm-rect-inertia'], ['as-stress-block', 'r-stress-block']].every(([a, b]) => { const x = Q.문제(a, 31), y = Q.문제(b, 31); return x.문 === y.문 && JSON.stringify(x.보기) === JSON.stringify(y.보기) && x.과목 === '건축구조' && y.과목 !== '건축구조' }))
ok('토목기사 문제집에는 건축 틀이 안 섞임 · 건축기사에는 토목 틀(과목 이름 그대로)이 안 섞임', 집.틀.every((id) => 집.과목.includes(Q.틀of(id).과목)) && 건.틀.every((id) => 건.과목.includes(Q.틀of(id).과목)) && !건.틀.some((id) => 집.틀.includes(id)))
ok('법규 틀 근거에 조문 — 건축법 제55조 · 제56조 · 시행령 제119조 · 피난ㆍ방화구조 규칙 제17조', /건축법 제55조/.test(Q.문제('al-bcr', 1).근거) && /건축법 제56조/.test(Q.문제('al-far', 1).근거) && /시행령 제119조 ① 4호 가목/.test(Q.문제('al-far', 1).근거) && /제17조/.test(Q.문제('al-window', 1).근거))
const 건10 = Q.시험지('geonchuk-gisa', null, 10, 2026)
ok('건축기사 시험지 10문제 — 과목마다 2문제 · 과목 차례', 건10.length === 10 && 건.과목.every((과, i) => 건10[i * 2].과목 === 과 && 건10[i * 2 + 1].과목 === 과), 건10.map((x) => x.과목))
const 건다 = Q.채점('geonchuk-gisa', 건10.map((x) => ({ 과목: x.과목, 맞음: true })))
const 건하나 = Q.채점('geonchuk-gisa', 건10.map((x) => ({ 과목: x.과목, 맞음: x.과목 !== '건축관계법규' })))
ok('건축기사 채점 — 5과목 다 풀면 전과목 · 다 맞음 합격 · 법규 0점이면 과락 불합격', 건다.전과목 && 건다.합격 && 건다.평균 === 100 && !건하나.합격 && 건하나.전과목, [건다.평균, 건하나.평균])
const 퀴즈종목 = Object.entries(cert.deep || {}).filter(([, t]) => t.quiz).map(([k]) => k)
ok('예상문제가 있는 종목(cert.json) = lib 문제집 종목', JSON.stringify(퀴즈종목.sort()) === JSON.stringify(Object.keys(Q.문제집).sort()), 퀴즈종목)
const 글모두 = JSON.stringify(Q.문제집) + 모든틀.map((id) => JSON.stringify(Q.문제(id, 5))).join('')
ok('«무료» · «클로드» 없음', !/무료|클로드/.test(글모두))

console.log(`\n${bad ? '❌' : '✅'} 시험_예상문제 ${n - bad}/${n}`)
process.exit(bad ? 1 : 0)
