/* 🧪 G332 (2026-10-20) 골조 자동 — 건축(마감) 평면을 같이 넣어도 골조 물량이 안 바뀜
 *   소장님: 「내역서 부터 차례 차례 검증하자」 「단, 완벽에 가깝게」
 *   /jeoksan/auto 에서 «🧪 예시로 해 보기»(토목 · 마감 평면) 뒤 «🧪 골조 예시» 를 넣으니, 마감 평면의 실내재료마감표 기호
 *   (F1 바닥 · C1 천장 · W1 벽 · B1 걸레받이)가 «제목 없는 평면(1층)» 의 기초 · 기둥 · 벽 · 보로 셈해져
 *   콘크리트 216.25 → 226.80 ㎥ · 거푸집 1,103.46 → 1,133.46 ㎡ · 철근 22.040 → 22.725 ton · 기둥 24 → 26 · 기초 12 → 14 로 부풀었음.
 *   → 다른 도면에 구조평면도 제목이 있으면, 제목이 하나도 없는 도면의 기호는 세지 않고 알림(lib/골조자동.js).
 *   + 벽윗면공제: 도면에서 읽은 벽(높이 · 상부 빈 줄)은 위 슬래브 두께만큼 낮춤 — 전엔 층고 그대로(W1 3.888 ㎥) · BIM 화면은 3.726 ㎥ 로 서로 달랐음
 *   node tools/시험_골조섞음.mjs */
import fs from 'fs'
import { 도면읽기 } from '../web/src/lib/골조도면.js'
import { decodeBytes } from '../web/src/lib/dxf3d.js'
import { 골조읽기, 벽윗면공제 } from '../web/src/lib/골조자동.js'
import { 모델만들기, 겹친것빼기 } from '../web/src/lib/BIM모델.js'
import { 셈 } from '../web/src/lib/골조.js'
let bad = 0
const ok = (이름, c, got) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ✗ ') + 이름 + (got !== undefined && !c ? ' = ' + JSON.stringify(got) : '')) }
const 읽기 = (u) => { const b = fs.readFileSync(new URL(u, import.meta.url)); return 도면읽기(decodeBytes(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))) }
const 골 = { 모델: 읽기('../web/public/jeoksan/골조자동_예시.dxf'), 이름: '골조자동_예시.dxf', k: 1 }
const 마 = { 모델: 읽기('../web/public/jeoksan/마감_예시.dxf'), 이름: '마감_예시.dxf', k: 1 }
const 토 = { 모델: 읽기('../web/public/jeoksan/토목_예시.dxf'), 이름: '토목_예시.dxf', k: 1 }
const 합 = (R) => { const S = 셈(R.공사); const m = {}; for (const a of S.집계.합) m[a.항목] = (m[a.항목] || 0) + a.산출; return { 콘: +m['콘크리트'].toFixed(3), 틀: +m['거푸집'].toFixed(3), 철: +m['철근'].toFixed(3) } }
const 셈수 = (R, 종) => (R.공사.동 || []).flatMap((d) => d.부재 || []).filter((p) => p.종류 === 종).reduce((a, p) => a + (+p.개수 || 1), 0)
const 혼 = 골조읽기([골]), 섞 = 골조읽기([토, 마, 골]), 앞 = 골조읽기([마, 골])
const A = 합(혼), B = 합(섞), C = 합(앞)
console.log('  골조만', JSON.stringify(A), '· 셋 같이', JSON.stringify(B), '· 마감 + 골조', JSON.stringify(C))
ok('골조만 — 콘크리트 216.252 · 거푸집 1,103.46 · 철근 22.040(화면 값)', Math.abs(A.콘 - 216.252) < 0.01 && Math.abs(A.틀 - 1103.46) < 0.01 && Math.abs(A.철 - 22.040) < 0.002, A)
ok('토목 · 마감 · 골조 같이 넣어도 골조 물량 그대로', A.콘 === B.콘 && A.틀 === B.틀 && A.철 === B.철, B)
ok('마감 평면을 앞에 넣어도 그대로', A.콘 === C.콘 && A.틀 === C.틀 && A.철 === C.철, C)
ok('마감 평면 기호를 세지 않았다고 알림(F1 · C1 · W1 · B1)', 섞.경고.some((w) => /«마감_예시\.dxf» 에는 구조평면도 제목이 없어/.test(w) && /F1/.test(w) && /C1/.test(w)), 섞.경고.slice(0, 4))
ok('골조만 넣으면 그 알림 없음', !혼.경고.some((w) => /구조평면도 제목이 없어/.test(w)))
ok('«제목 없는 평면» 이 읽은 평면 목록에 없음', !((섞.읽음 || {}).평면 || []).some((p) => /제목 없는/.test(p.제목)), ((섞.읽음 || {}).평면 || []).map((p) => p.제목))
/* 제목 없는 도면 한 장뿐(일람표 같이)이면 예전처럼 셈 — 마감 평면만 넣으면 일람표가 없어 골조 없음 */
const 마만 = 골조읽기([마])
ok('마감 평면만 넣으면 골조 없음(일람표 없음)', !마만.있음)
/* 벽 윗면 — 도면 물량 자동 · 골조 화면(벽윗면공제) = BIM 화면(겹친것빼기) */
{
  const 층벽 = (P) => { const S = 셈(P); return +S.줄.filter((x) => x.항목 === '콘크리트' && x.부재 === '벽').reduce((a, x) => a + x.수량, 0).toFixed(3) }
  const P1 = 벽윗면공제(혼.공사)
  const w = P1.동[0].주자료.옹벽[0]
  ok('벽 W1 «상부» = 1층 슬래브 150 (빈 칸이던 것)', w.상부 === '150' && w._윗공제 === true, [w.상부, w.높이])
  ok('벽 W1 콘크리트 5.4 × 0.2 × (3.6 − 0.15) = 3.726 ㎥ (전엔 3.888)', 층벽(P1) === 3.726 && 층벽(혼.공사) === 3.888, [층벽(P1), 층벽(혼.공사)])
  const P2 = 겹친것빼기(혼.공사, 모델만들기([골], 혼, { 높이: {} }))
  ok('BIM 화면(3D 로 위를 본 값)과 같음', 층벽(P2) === 층벽(P1), [층벽(P2), 층벽(P1)])
  ok('BIM 쪽 줄에 벽윗면공제를 또 해도 그대로(이미 상부가 있어 두 번 안 뺌)', 층벽(벽윗면공제(P2)) === 층벽(P2))
  const 사람 = JSON.parse(JSON.stringify(혼.공사)); 사람.동[0].주자료.옹벽[0].상부 = 'G1'
  ok('사람이 «상부» 를 적은 줄(G1)은 그대로', 벽윗면공제(사람).동[0].주자료.옹벽[0].상부 === 'G1')
  const 높 = JSON.parse(JSON.stringify(혼.공사)); 높.동[0].주자료.옹벽[0].높이 = '3000'
  ok('높이를 읽은 줄은 그대로', !String(벽윗면공제(높).동[0].주자료.옹벽[0].상부 || '').trim())
  const 파 = JSON.parse(JSON.stringify(혼.공사)); 파.배근.벽[0].구분 = '파라펫'
  ok('파라펫은 그대로', !String(벽윗면공제(파).동[0].주자료.옹벽[0].상부 || '').trim())
}
console.log(bad ? `✗ ${bad}건 틀림` : '✓ 모두 맞음')
process.exit(bad ? 1 : 0)
