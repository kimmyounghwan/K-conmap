/**
 * 🧪 lib/맵톡.js — 주제 짐작 · 방 나누기 · 글 나누기 · 자리 고르기 · 사진 크기 (G147 · 2026-10-05)
 *   node tools/시험_맵톡.mjs
 */
import { readFileSync } from 'node:fs'
import {
  주제짐작, 방나누기, 글나누기, 경위도자리, 가까운곳, 자리고르기, 자리짐작, 곳찾기, 짧은이름, 카드크기, 물음인가, 줄인크기, 맵톡시작, 주제들, 주제차례,
  답나무, 첫줄, 누적셈, 시도차례, 시도별, 곳기억읽기, 곳기억하기,
} from '../web/src/lib/맵톡.js'

const 바탕 = JSON.parse(readFileSync(new URL('../web/src/data/한국지도.json', import.meta.url), 'utf8'))
let 통과 = 0, 실패 = 0
const eq = (a, b, 무엇) => {
  const ok = JSON.stringify(a) === JSON.stringify(b)
  if (ok) 통과++
  else { 실패++; console.log('  ✗', 무엇, '\n     받음', JSON.stringify(a), '\n     기대', JSON.stringify(b)) }
}
const 운영 = (u) => u === 'OP'

console.log('① 주제 짐작')
eq(주제짐작({ t: '사정률 99.8 근처에만 몰리는데', at: 맵톡시작 + 1 }), 'bid', '입찰')
eq(주제짐작({ t: '일용직 8일 넘으면 연금 가입 맞나요?', at: 맵톡시작 + 1 }), 'ins', '4대보험')
eq(주제짐작({ t: '오늘 교량 하부 타설 끝', at: 맵톡시작 + 1 }), 'work', '공사')
eq(주제짐작({ t: '아침 TBM 5분이 사고를 막더라고요', at: 맵톡시작 + 1 }), 'safe', '안전')
eq(주제짐작({ t: '0.6 굴착기 하루 얼마 주세요?', at: 맵톡시작 + 1 }), 'equip', '장비')
eq(주제짐작({ t: '철근공 구합니다', at: 맵톡시작 + 1 }), 'job', '구인이 노무 · 공사보다 먼저')
eq(주제짐작({ t: '좋은 사이트 감사합니다', at: 맵톡시작 + 1 }), 'fb', '감사 = 후기·건의')
eq(주제짐작({ t: '비 오는 날 다들 뭐 하세요', at: 맵톡시작 + 1 }), 'talk', '새 글 · 낱말 없음 = 이야기')
eq(주제짐작({ t: '1111', c: '후기·건의', at: 맵톡시작 - 1 }), 'fb', '옛 후기·건의 · 낱말 없음 = 후기·건의')
eq(주제짐작({ t: '공지', c: 'K-건설맵', at: 1 }), 'kcm', '옛 말머리 K-건설맵')
eq(주제짐작({ t: '사정률', uid: 'OP', at: 1 }, 운영), 'kcm', '운영자 글은 소식(낱말보다 먼저)')
eq(주제짐작({ t: '이야기', nick: 'K-건설맵', at: 1 }), 'kcm', '별명 K-건설맵')
eq(주제짐작({ t: '여기 계신 분?', 옛: '공동도급', at: 1 }), 'bid', '옛 말머리 공동도급 → 입찰')
eq(주제짐작({ t: '감사', b: '공고 금액 검색 넣어 주세요', at: 1 }), 'bid', '본문 낱말도 봄')
eq(주제짐작(null), 'talk', 'null')
eq(주제차례.every((k) => 주제들[k] && 주제들[k].이름 && /^#[0-9a-f]{6}$/.test(주제들[k].색)), true, '주제마다 이름 · 색')

console.log('② 방 나누기')
{
  const 글 = [...Array(32).fill({ 주제: 'kcm' }), ...Array(38).fill({ 주제: 'fb' }), { 주제: 'bid' }, { 주제: 'bid' }, { 주제: 'job' }, { 주제: 'safe' }]
  const r = 방나누기(글)
  eq(r.방.map((x) => [x.k, x.n]), [['fb', 38], ['kcm', 32]], '10개 넘은 둘이 방(많은 차례)')
  eq(r.모임.map((x) => [x.k, x.n, x.남음]), [['bid', 2, 8], ['safe', 1, 9], ['job', 1, 9]], '나머지는 모이는 중(같은 수면 주제 차례)')
  const r2 = 방나누기([...Array(9).fill({ 주제: 'ins' })])
  eq([r2.방.length, r2.모임[0].남음], [0, 1], '9개는 아직 모이는 중(1개 남음)')
  const r3 = 방나누기([...Array(10).fill({ 주제: 'ins' })])
  eq(r3.방.map((x) => x.k), ['ins'], '10개면 방')
  eq(방나누기(null).방, [], 'null')
}

console.log('③ 글 나누기 (제목 = 첫 줄 · 첫 문장)')
eq(글나누기('사정률 어디 넣으세요? 다섯 번 떨어졌습니다.'), { t: '사정률 어디 넣으세요?', b: '다섯 번 떨어졌습니다.' }, '첫 문장')
eq(글나누기('첫 줄\n둘째 줄\n셋째'), { t: '첫 줄', b: '둘째 줄\n셋째' }, '첫 줄')
eq(글나누기('한 줄만'), { t: '한 줄만', b: '' }, '한 줄')
eq(글나누기('  \n  '), { t: '', b: '' }, '빈 글')
{
  const 긴 = '가'.repeat(90)
  const r = 글나누기(긴)
  eq([r.t.length, r.t.endsWith('…'), r.b.length], [70, true, 21], '70자 넘으면 69자 + … · 나머지는 본문')
  eq(('[후기·건의] ' + r.t).length <= 80, true, '말머리 붙여도 80자 안(규칙)')
}
eq(글나누기('3.5m 높이에서 작업하는데 안전대 필요?').t, '3.5m 높이에서 작업하는데 안전대 필요?', '숫자 속 마침표는 문장 끝 아님')
eq(글나누기('x'.repeat(2500)).b.length <= 2000, true, '본문 2000자까지(규칙)')

console.log('④ 자리 — 이름 · 위도경도')
{
  const 서울 = 자리고르기({ city: 'Yongsan-gu', region: 'Seoul', country_code: 'KR', latitude: '37.5332', longitude: '126.9692' }, 바탕)
  eq(서울 && 서울.n, '서울특별시', 'Yongsan-gu → 서울(구 별명표)')
  const 광양 = 자리고르기({ city: 'Gwangyang', country_code: 'KR', latitude: '34.94', longitude: '127.69' }, 바탕)
  eq(광양 && [광양.n, 광양.어떻게], ['광양시', '이름'], 'Gwangyang → 광양시')
  const 경위 = 자리고르기({ city: 'Nowhere-ri', country_code: 'KR', latitude: '34.9407', longitude: '127.6959' }, 바탕)
  eq(경위 && [경위.n, 경위.어떻게], ['광양시', '경위도'], '모르는 이름 → 위도경도로 가장 가까운 곳')
  const 제주 = 자리고르기({ city: '', country_code: 'KR', latitude: '33.25', longitude: '126.56' }, 바탕)
  eq(제주 && 제주.n, '서귀포시', '서귀포 위도경도')
  eq(자리고르기({ city: '', country_code: 'KR', latitude: '37.5112', longitude: '126.9741' }, 바탕), null, '나라 한가운데 기본값이면 짐작 안 함')
  eq(자리고르기({ city: 'Tokyo', country_code: 'JP', latitude: '35.6', longitude: '139.7' }, 바탕), null, '나라 밖')
  eq(자리고르기({ city: '', country_code: 'KR', latitude: '36.0', longitude: '131.5' }, 바탕), null, '동해 한가운데(30 단위 밖)')
  eq(자리고르기(null, 바탕), null, 'null')
  const xy = 경위도자리(37.5665, 126.978)
  eq([Math.round(xy.x), Math.round(xy.y)], [201, 116], '서울시청 → 지도 좌표(서울 점 201.6,114.8 근처)')
  eq(가까운곳(바탕.곳, 255, 368).n, '광양시', '가까운 곳')
  eq(곳찾기(바탕, 바탕.곳[0].k).n, 바탕.곳[0].n, '곳찾기')
  eq(곳찾기(바탕, 'zz'), null, '없는 번호')
  eq(바탕.곳.every((p) => String(p.k).length <= 12), true, '곳 번호는 규칙(12자) 안')
  eq([짧은이름('서울특별시'), 짧은이름('세종특별자치시'), 짧은이름('광양시')], ['서울', '세종', '광양시'], '짧은 이름')
}

console.log('⑤ 자리 짐작(받기 흉내)')
{
  const 좋음 = async () => ({ ok: true, json: async () => ({ city: 'Suncheon', country_code: 'KR', latitude: '34.95', longitude: '127.48' }) })
  const r = await 자리짐작(바탕, 좋음)
  eq(r && r.n, '순천시', '받아서 고름')
  eq(await 자리짐작(바탕, async () => ({ ok: false })), null, '실패면 null')
  eq(await 자리짐작(바탕, async () => { throw new Error('망') }), null, '망 끊김이면 null')
  eq(await 자리짐작(null, 좋음), null, '바탕 없으면 null')
}

console.log('⑥ 카드 · 물음 · 사진 크기')
eq([카드크기({ p: 'x' }, 0), 카드크기({}, 0), 카드크기({}, 1), 카드크기({}, 2), 카드크기({})], ['tall', 'big', 'big', '', ''], '사진 = 길게 · 1·2등 = 크게')
eq([물음인가('맞나요'), 물음인가('얼마 주세요?'), 물음인가('끝났습니다')], [true, true, false], '물음')
eq(줄인크기(4000, 3000), { w: 1600, h: 1200 }, '긴 변 1600')
eq(줄인크기(800, 600), { w: 800, h: 600 }, '작으면 그대로')
eq(줄인크기(1080, 2400), { w: 720, h: 1600 }, '세로 사진')

console.log('⑦ 누구에게 답글 — 나무 · 받은 수')
{
  const 답 = [
    { id: 'a1', at: 1, uid: 'u1' },                       // 원글에게
    { id: 'a2', at: 2, uid: 'u2', to: 'a1' },             // a1 에게
    { id: 'a3', at: 3, uid: 'u1', to: 'a2' },             // a2(가지)에게 → 줄기 a1 아래
    { id: 'a4', at: 4, uid: 'u3' },                       // 원글에게
    { id: 'a5', at: 5, uid: 'u4', to: 'zz' },             // 없는 번호 → 원글에게로 봄
    { id: 'a6', at: 6, uid: 'u5', to: 'a4', deleted: true },
    { id: 'a7', at: 7, uid: 'u6', to: 'a4' },
  ]
  const r = 답나무(답)
  eq(r.줄기.map((x) => [x.a.id, x.가지.map((y) => y.id)]), [['a1', ['a2', 'a3']], ['a4', ['a7']], ['a5', []]], '한 단계 들여쓰기 · 시간 차례')
  eq([r.받은수.a1, r.받은수.a2, r.받은수.a4, r.원글받은수], [1, 1, 1, 3], '받은 수(지운 것 빼고 · 없는 번호는 원글)')
  const 지운줄기 = 답나무([{ id: 'b1', at: 1, deleted: true }, { id: 'b2', at: 2, to: 'b1' }, { id: 'b3', at: 3, to: 'b2' }])
  eq(지운줄기.줄기.map((x) => [x.a.id, x.가지.map((y) => y.id)]), [['b2', ['b3']]], '줄기를 지우면 살아 있는 답이 줄기')
  const 돌기 = 답나무([{ id: 'c1', at: 1, to: 'c2' }, { id: 'c2', at: 2, to: 'c1' }])
  eq(돌기.줄기.length + 돌기.줄기.reduce((n, x) => n + x.가지.length, 0) <= 2, true, '돌고 도는 사슬도 멈춤')
  eq(답나무([{ id: 'd1', to: 'd1', at: 1 }]).원글받은수, 1, '자기 자신에게 = 원글에게')
  eq(답나무(null).줄기, [], 'null')
  eq([첫줄('  가나다\n라마  '), 첫줄('x'.repeat(50)).length], ['가나다 라마', 40], '첫 줄')
}

console.log('⑧ 지금까지 누적')
{
  const 글 = [{ id: 'q1' }, { id: 'q2', p: 'https://x' }, { id: 'q3', deleted: true }]
  const 답 = { q1: { a: {}, b: { deleted: true } }, q2: { c: {} }, q3: { d: {} } }
  const 좋 = { q1: { u1: true, u2: true }, q3: { u1: true } }
  const 답좋 = { q1: { a: { u3: true } }, q3: { d: { u1: true } } }
  eq(누적셈(글, 답, 좋, 답좋), { 글: 2, 답글: 2, 공감: 3, 사진: 1 }, '보이는 글만 · 지운 답 빼고 · 글 👍 + 답 👍')
  eq(누적셈(null, null, null, null), { 글: 0, 답글: 0, 공감: 0, 사진: 0 }, 'null')
}

console.log('⑨ 지역 고르기 — 시·도별 · 기억')
{
  const m = 시도별(바탕)
  eq(시도차례.length, 17, '시·도 17')
  eq(시도차례.every((d) => (m[d] || []).length > 0), true, '시·도마다 곳이 있음')
  eq(Object.keys(m).sort(), [...시도차례].sort(), '자료의 시·도 = 차례표')
  eq(시도차례.reduce((n, d) => n + m[d].length, 0), 바탕.곳.length, '161곳 다 들어감')
  eq([m['전남'].some((p) => p.n === '광양시'), m['서울'].length, m['경기'].length], [true, 1, 31], '전남에 광양시 · 서울 하나 · 경기 31')
  const 가짜 = { v: {}, getItem(k) { return this.v[k] ?? null }, setItem(k, x) { this.v[k] = x }, removeItem(k) { delete this.v[k] } }
  eq(곳기억읽기(바탕, 가짜), null, '처음엔 기억 없음')
  const 광양 = m['전남'].find((p) => p.n === '광양시')
  eq(곳기억하기(광양.k, 가짜), true, '기억하기')
  eq(곳기억읽기(바탕, 가짜).n, '광양시', '다음부터 광양시')
  가짜.v['kcm.mt.곳'] = 'zz'
  eq(곳기억읽기(바탕, 가짜), null, '없는 번호면 null')
  eq(곳기억읽기(바탕, { getItem() { throw new Error('막힘') } }), null, '저장소 막힘이면 null')
  eq(곳기억하기('11', { setItem() { throw new Error('막힘') } }), false, '저장 막힘이면 false')
}

console.log(`\n통과 ${통과} · 실패 ${실패}`)
if (실패) process.exit(1)
