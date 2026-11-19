/**
 * 🖋 G780 도장 만들기 셈 시험 (2026-11-19) — lib/도장.js · lib/내도장.js · 등록(길 · 도구 목록 · 설명 · 굽기 · 사이트맵 · 빠른찾기 · 쓴수판)
 *   🩹 G780a 「반듯하게 안된 것 같은데..도장이...」 — 둘레 좁은 글자 반 칸 · 기울기 바로잡기
 *   🔁 G780b 「캡쳐 준 것처럼 만들어」 「그것처럼 만들어 줘」 — 가로 읽기 칸 · 고딕 글자 칸에 꽉(기본) · 인장체(고를 때 · 한글 11,172 자 칸 안 · 필요 단위)
 *     · 꼴 열(이름 여섯 · 회사 넷) · 음각 · 같은 획 · 인 붙이기 · 법인 원형
 *   🩹 G782 「올리고 직접 시험 해봐. 극한적으로 시험 해봐」 — (주) → ㈜ · 기호만이면 빈 글 · 인은 한글 · 한자 이름만 · 띄어쓰기대로 줄(회사 원형)
 *     · 법인 원형 짧은 이름도 둘레 고르게 · 파란 도장 사진 · 같은 도장 다시 저장
 *   소장님 「도장만들기 도구 이것도 만들어 줘...사이트 찾아보고 최대한 간단하면서 실용적이게」 → 기획 → 「서식까지 연결하게 해줘」
 *   node tools/시험_도장.mjs   (PC 올리기에서도 돌림 — 캔버스 없이: 그리기는 가짜 붓으로 · 사진 뽑기는 숫자 그림으로)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const 뿌리 = fileURLToPath(new URL('..', import.meta.url))
let ok = 0, bad = 0
const eq = (a, b, m) => { const s = JSON.stringify(a) === JSON.stringify(b); if (s) ok++; else bad++; console.log(s ? '  ✓' : '  ✗', m, s ? '' : `— ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`) }
const 참 = (c, m, 더 = '') => { if (c) ok++; else bad++; console.log(c ? '  ✓' : '  ✗', m, c ? '' : 더) }

/* 가짜 localStorage — 내도장 시험용(먼저 깔아 둠) */
const 칸 = new Map()
globalThis.localStorage = { getItem: (k) => (칸.has(k) ? 칸.get(k) : null), setItem: (k, v) => { 칸.set(k, String(v)) }, removeItem: (k) => { 칸.delete(k) } }
const D = await import('../web/src/lib/도장.js')
const J = await import('../web/src/lib/인장체.js')
const M = await import('../web/src/lib/내도장.js')

console.log('■ 글 정리')
eq(D.글정리(' 홍 길동 '), ['홍', '길', '동'], '띄어쓰기 뺌')
eq(D.글정리('홍길동김철수'), ['홍', '길', '동', '김'], '이름은 4자까지')
eq(D.글정리('가상!@#건설', 16), ['가', '상', '건', '설'], '기호는 뺌')
eq(D.글정리('㈜가상(유)·건설', 16).join(''), '㈜가상(유)·건설', '㈜ · 괄호 · 가운뎃점은 둠(회사 이름)')
eq([D.글정리('(주)가상건설', 16).join(''), D.글정리('（주）가상', 16).join(''), D.글정리('( 주 )가상', 16).join('')], ['㈜가상건설', '㈜가상', '㈜가상'], '🩹 G782 «(주)» → ㈜ 한 칸(괄호 · 주가 세 칸으로 갈리지 않게)')
eq([D.글정리('·'), D.글정리('()'), D.글정리('㈜', 16), D.글정리('|||'), D.글정리('😀')], [[], [], [], [], []], '🩹 G782 기호만이면 빈 글(이상한 도장 대신 예시)')
eq(D.글정리('😀홍'), ['홍'], '그림 글자는 빼고 글자만')
eq(D.글정리('洪吉童'), ['洪', '吉', '童'], '한자')
eq(D.글정리('홍'.normalize('NFD')).join(''), '홍', '풀어 쓴 한글(NFD) → 한 글자')
eq(D.글정리(null), [], '빈 값')

console.log('■ 가로 읽기 칸(🔁 G780b — 왼쪽 → 오른쪽 · 위 → 아래 · 덜 찬 마지막 줄은 가운데)')
const 자리 = (cs) => cs.map((c) => [+c.x.toFixed(3), +c.y.toFixed(3)])
eq(자리(D.가로칸(4, 2)), [[0, 0], [0.5, 0], [0, 0.5], [0.5, 0.5]], '네 자 2 × 2 = 홍길 / 동인(가로로 읽음)')
eq(자리(D.가로칸(3, 2)), [[0, 0], [0.5, 0], [0.25, 0.5]], '세 자 2 + 1 — 아래 한 자는 가운데')
eq(자리(D.가로칸(2, 1)), [[0, 0], [0, 0.5]], '두 자 = 위 · 아래')
eq(자리(D.가로칸(5, 2)), [[0, 0], [0.5, 0], [0, 0.333], [0.5, 0.333], [0.25, 0.667]], '다섯(대표이사인) = 대표 / 이사 / 인')
eq(자리(D.가로칸(9, 3)).slice(-3), [[0, 0.667], [0.333, 0.667], [0.667, 0.667]], '아홉 = 3 × 3')
eq([1, 2, 3, 4, 5, 6, 9, 10, 13].map((n) => D.열수(n)), [1, 1, 2, 2, 2, 2, 3, 4, 4], '한 줄 글자 수')
for (const [n, k] of [[1, 1], [2, 1], [3, 2], [4, 2], [5, 2], [6, 3], [9, 3], [13, 4], [22, 5]]) {
  const cs = D.가로칸(n, k)
  const 안 = cs.every((c) => c.x >= -1e-9 && c.y >= -1e-9 && c.x + c.w <= 1 + 1e-9 && c.y + c.h <= 1 + 1e-9)
  const 겹침 = cs.some((a, i) => cs.some((b, j) => j > i && a.x < b.x + b.w - 1e-9 && b.x < a.x + a.w - 1e-9 && a.y < b.y + b.h - 1e-9 && b.y < a.y + a.h - 1e-9))
  const 같은크기 = cs.every((c) => Math.abs(c.w - cs[0].w) < 1e-9 && Math.abs(c.h - cs[0].h) < 1e-9)
  const 차례 = cs.every((c, i) => i === 0 || c.y > cs[i - 1].y + 1e-9 || (Math.abs(c.y - cs[i - 1].y) < 1e-9 && c.x > cs[i - 1].x))
  참(cs.length === n && 안 && !겹침 && 같은크기 && 차례, `${n} 자 · 한 줄 ${k} — 상자 안 · 안 겹침 · 같은 크기 · 왼쪽 → 오른쪽 · 위 → 아래`)
}

console.log('■ 인장체(🔁 G780b — 한글을 곧은 선 · 동그라미로 · 글꼴 없이)')
eq(J.한글풀기('홍'), { 초: 'ㅎ', 중: 'ㅗ', 종: 'ㅇ' }, '풀기 — 홍 = ㅎ ㅗ ㅇ')
eq(J.한글풀기('뷁'), { 초: 'ㅂ', 중: 'ㅞ', 종: 'ㄺ' }, '풀기 — 뷁 = ㅂ ㅞ ㄺ')
eq(J.한글풀기('가'), { 초: 'ㄱ', 중: 'ㅏ', 종: '' }, '풀기 — 가(받침 없음)')
eq([J.한글풀기('A'), J.한글풀기('洪'), J.한글풀기('ㄱ'), J.한글풀기('')], [null, null, null, null], '한글 음절이 아니면 null(글꼴로 그림)')
eq([J.필요단위('홍'), J.필요단위('이'), J.필요단위('가'), J.필요단위('洪')], [14, 3, 2, 0], '필요 단위 — 홍 14(ㅎ 7 + 1 + ㅗ 2 + 1 + ㅇ 3) · 이 3 · 가 2 · 한자 0')
/* 붓 흉내 — 점 · 동그라미 · 획 굵기를 모음 */
const 선붓 = () => {
  const 점 = [], 원 = [], 획 = []
  return {
    점, 원, 획, lineWidth: 0, lineCap: '', lineJoin: '', miterLimit: 0,
    save() {}, restore() {}, beginPath() {}, closePath() {},
    moveTo(x, y) { 점.push([x, y]) }, lineTo(x, y) { 점.push([x, y]) },
    ellipse(x, y, rx, ry) { 원.push([x, y, rx, ry]) }, stroke() { 획.push(this.lineWidth) },
  }
}
{
  /* 한글 음절 11,172 자 모두 — 칸 안에만 · 무엇이든 그림 · 획 하나 */
  const 칸 = { x: 100, y: 50, w: 120, h: 120 }, 획 = 8
  let 밖 = 0, 빈 = 0, 첫밖 = ''
  for (let k = 0; k < 11172; k++) {
    const ch = String.fromCharCode(0xac00 + k)
    const b = 선붓()
    if (!J.인장글자(b, ch, 칸, 획) || b.점.length + b.원.length === 0) { 빈++; continue }
    const 넘음 = b.점.some(([x, y]) => x < 칸.x + 획 / 2 - 0.01 || x > 칸.x + 칸.w - 획 / 2 + 0.01 || y < 칸.y + 획 / 2 - 0.01 || y > 칸.y + 칸.h - 획 / 2 + 0.01) ||
      b.원.some(([x, y, rx, ry]) => x - rx < 칸.x + 획 / 2 - 0.01 || x + rx > 칸.x + 칸.w - 획 / 2 + 0.01 || y - ry < 칸.y + 획 / 2 - 0.01 || y + ry > 칸.y + 칸.h - 획 / 2 + 0.01)
    if (넘음) { 밖++; if (!첫밖) 첫밖 = ch }
  }
  참(빈 === 0 && 밖 === 0, '한글 11,172 자 모두 그림 · 획이 칸 밖으로 안 나감(획 굵기 반 안쪽)', JSON.stringify({ 빈, 밖, 첫밖 }))
}
{
  const 가로획 = (ch) => { const b = 선붓(); J.인장글자(b, ch, { x: 0, y: 0, w: 100, h: 100 }, 6); return b }
  const 자 = 가로획('자'), 사 = 가로획('사')
  참(자.점.length > 사.점.length && 자.점.some(([x, y], i) => i % 2 === 0 && Math.abs(y - 3) < 0.01), '«자» 엔 ㅈ 윗가로획 · «사» 엔 없음(서로 다른 꼴)')
  const 홍 = 가로획('홍')
  참(홍.원.length === 2, '«홍» — ㅎ 동그라미 + 받침 ㅇ 동그라미')
  const 작은원 = Math.min(...홍.원.map((o) => o[3]))
  참(작은원 * 2 - 6 > 3, '«홍» 의 ㅎ 동그라미 안 구멍이 보임(빈 곳 > 3px · 100px 칸 · 획 6)', String(작은원))
}

console.log('■ 그리기(가짜 붓 — 꼴마다 · 글자 수 · 음각 · 같은 획)')
/* 글자마다 잉크 폭이 다름(«길» · «이» 는 좁게 · 괄호는 아주 좁게) */
const 폭 = (t) => (/[()]/.test(t) ? 50 : /[길이일]/.test(t) ? 120 : 180)
const 가짜붓 = () => {
  const 글 = [], 선 = [], 배 = [], 돎 = [], 획 = [], 채움 = []
  const ctx = {
    font: '', textAlign: '', textBaseline: '', fillStyle: '', strokeStyle: '', lineWidth: 0, lineJoin: '', lineCap: '', miterLimit: 0, globalAlpha: 1, globalCompositeOperation: 'source-over',
    clearRect() {}, save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, arcTo() {}, rect() {}, clip() {}, fill() { 선.push(['칠', this.globalCompositeOperation]) }, translate() {},
    scale(x, y) { 배.push([x, y]) }, rotate(a) { 돎.push(a) },
    arc(x, y, r) { 선.push(['원', Math.round(r)]) }, ellipse(x, y, rx, ry) { 선.push(['타원', Math.round(rx), Math.round(ry)]) },
    stroke() { 선.push(['획', this.lineWidth]); 획.push([this.lineWidth, this.globalCompositeOperation]) },
    measureText: (t) => ({ width: 200, actualBoundingBoxLeft: 0, actualBoundingBoxRight: 폭(t), actualBoundingBoxAscent: 170, actualBoundingBoxDescent: 10 }),
    fillText(t) { 글.push(t); 채움.push([t, this.globalCompositeOperation]) }, strokeText() {},
  }
  return { ctx, 글, 선, 배, 돎, 획, 채움 }
}
const 꼴이름 = (목록) => 목록.map((x) => x[0])
eq(꼴이름(D.이름꼴들), ['원', '원음각', '원두줄'], '이름 도장 종류 셋(원형만 — 「원형만 만들어. 사각은 하지말고」)')
eq(꼴이름(D.회사꼴들), ['법인원', '원', '원음각'], '회사 도장 종류 셋(원형만)')
eq(Object.keys(D.인주), ['빨강', '검정', '파랑'], '색 셋(빨강 · 검정 · 파랑)')
eq(꼴이름(D.글씨들), ['고딕', '명조', '인장'], '글씨 셋 — 고딕(기본 · 전자도장 꼴) · 명조 · 인장체')
for (const 꼴 of 꼴이름(D.이름꼴들)) {
  const p = 가짜붓(); const r = D.도장그리기(p.ctx, 1000, { 종류: '이름', 글: '홍길동', 인붙임: true, 꼴 })
  const 음 = /음각$/.test(꼴)
  const 지움 = p.채움.filter((x) => x[1] === 'destination-out').length
  참(r.그린 === 4 && r.글자.join('') === '홍길동인' && p.글.join('') === '홍길동인' && (음 ? p.선.some((x) => x[0] === '칠' && x[1] === 'source-over') && 지움 === 4 : 지움 === 0),
    `이름 «${꼴}» — 네 자(홍길동인) · 고딕 글꼴로 칸을 꽉${음 ? ' · 바탕을 칠하고 글자를 지움(음각)' : ''}`, JSON.stringify([r.그린, r.글자.join(''), p.글.join(''), 지움]))
}
{
  /* 🔁 고딕 — 모양 그대로(소장님 「이상해」 — 늘여 채우면 «인» · «길» 이 옆으로 퍼짐) · 네 글자 모두 같은 배율 · 가로세로 같은 배율 */
  const p = 가짜붓(); D.도장그리기(p.ctx, 1000, { 종류: '이름', 글: '홍길동', 인붙임: true, 꼴: '원' })
  참(p.배.length === 4 && p.배.every(([x, y]) => Math.abs(x - y) < 1e-9) && new Set(p.배.map(([x]) => x.toFixed(9))).size === 1, '고딕 — 네 글자 같은 배율 · 늘이지 않음(가로 = 세로)', JSON.stringify(p.배))
}
{
  const p = 가짜붓(); D.도장그리기(p.ctx, 1000, { 종류: '이름', 글: '홍길동', 인붙임: true, 꼴: '원', 글씨: '인장' })
  const 굵기 = p.획.slice(1).map((x) => x[0].toFixed(4))
  참(p.글.length === 0 && p.획.length === 5 && new Set(굵기).size === 1 && Number(굵기[0]) > 0, '인장체 — 선으로 그림(글꼴 안 씀) · 네 글자 모두 같은 획 굵기(가장 복잡한 «홍» 에 맞춤)', JSON.stringify(굵기))
  const q = 가짜붓(); D.도장그리기(q.ctx, 1000, { 종류: '이름', 글: '홍길동', 인붙임: true, 꼴: '원음각', 글씨: '인장' })
  참(q.획.filter((x) => x[1] === 'destination-out').length === 4, '인장체 음각 — 네 글자를 지움')
  const m = 가짜붓(); D.도장그리기(m.ctx, 1000, { 종류: '이름', 글: '홍길동', 인붙임: true, 꼴: '원', 글씨: '명조' })
  eq(m.글.join(''), '홍길동인', '명조 — 글꼴로 씀(fillText)')
}
{
  const 붙음 = (o) => { const p = 가짜붓(); return D.도장그리기(p.ctx, 1000, { 종류: '이름', 꼴: '원', ...o }).글자.join('') }
  eq([붙음({ 글: '홍길동', 인붙임: true }), 붙음({ 글: '김구', 인붙임: true }), 붙음({ 글: '洪吉童', 인붙임: true }), 붙음({ 글: '남궁민수', 인붙임: true }), 붙음({ 글: '홍', 인붙임: true }), 붙음({ 글: '홍길동', 인붙임: false })],
    ['홍길동인', '김구인', '洪吉童印', '남궁민수', '홍', '홍길동'], '«인» 붙이기 — 두 · 세 자만(한자 이름엔 印 · 네 자 · 한 자는 그대로)')
  const h = 가짜붓(); const r = D.도장그리기(h.ctx, 1000, { 종류: '이름', 글: '洪吉童', 인붙임: true, 꼴: '원' })
  참(r.그린 === 4 && h.글.join('') === '洪吉童印', '한자 이름 — 글꼴로(칸을 꽉)')
}
{
  const p = 가짜붓(); D.도장그리기(p.ctx, 1000, { 종류: '이름', 글: '길동', 꼴: '타원' })
  참(!p.선.some((x) => x[0] === '타원') && p.선.some((x) => x[0] === '원' && x[1] === 470), '없는 꼴(타원 · 네모)이면 원으로')
  const q = 가짜붓(); D.도장그리기(q.ctx, 1000, { 종류: '이름', 글: '길동', 꼴: '원두줄' })
  참(q.선.filter((x) => x[0] === '원').map((x) => x[1]).slice(0, 2).join(',') === '470,420', '두 줄 원 — 바깥 · 안쪽 원')
}
{
  const p = 가짜붓(); const r = D.도장그리기(p.ctx, 1000, { 종류: '직인', 둘레글: '가상건설 주식회사', 가운데글: '대표이사인', 꼴: '법인원' })
  참(r.그린 === 13 && r.글자.join('') === '가상건설주식회사대표이사인' && p.선.filter((x) => x[0] === '원').map((x) => x[1]).slice(0, 2).join(',') === '470,300', '법인 원형 — 바깥 · 안쪽 원 · 둘레 여덟 + 가운데 다섯', JSON.stringify([r.그린, r.글자.join('')]))
  참(p.선.some((x) => x[0] === '원' && x[1] === 20), '법인 원형 — 위 가운데 점(둘레 글은 점 오른쪽에서 시계 방향으로)')
  const q = 가짜붓(); D.도장그리기(q.ctx, 1000, { 종류: '직인', 둘레글: '가상건설', 가운데글: null, 꼴: '법인원' })
  eq(q.돎.length, 4, '둘레 넷은 돌려 씀')
  const 가 = 가짜붓(); const r가 = D.도장그리기(가.ctx, 1000, { 종류: '직인', 둘레글: '가상건설', 가운데글: null, 꼴: '법인원' })
  eq(r가.글자.join(''), '가상건설대표이사', '가운데 글이 없으면 «대표이사»(«인» 안 붙임 — 「대표이사만 들어가잖아. 근데 왜 인자를 넣어」)')
  const w = 가짜붓(); const rw = D.도장그리기(w.ctx, 1000, { 종류: '직인', 둘레글: '가상건설주식회사', 가운데글: '대표이사인', 꼴: '원음각' })
  eq([rw.그린, rw.글자.join('')], [8, '가상건설주식회사'], '음각 원형 — 회사 이름만(3 × 3 · 아래 줄 둘은 가운데)')
  const o = 가짜붓(); const ro = D.도장그리기(o.ctx, 1000, { 종류: '직인', 둘레글: '가상건설', 가운데글: '대표이사인', 꼴: '원' })
  eq([ro.그린, ro.글자.join('')], [4, '가상건설'], '원형 — 회사 이름만(가상 / 건설)')
  const z = 가짜붓(); D.도장그리기(z.ctx, 1000, { 종류: '직인', 둘레글: '(유)가상건', 가운데글: '대표이사', 꼴: '법인원' })
  const 사이 = z.돎.slice(1).map((a, i) => +(a - z.돎[i]).toFixed(6))
  참(z.돎.length === 6 && 사이[0] < 사이[4] * 0.85 && Math.abs(사이[0] - 사이[1]) < 1e-6 && Math.abs(사이[3] - 사이[4]) < 1e-6, '둘레의 좁은 글자(괄호)는 반 칸 — «( 주 )» 처럼 벌어지지 않음 · 보통 글자 사이는 고르게', JSON.stringify(사이))
}
{
  /* 🩹 G782 법인 원형 짧은 이름 — 둘레 310° 에 고르게(전엔 한 자 36° 까지라 아래쪽에 거꾸로 몰림) · 첫 자는 위 가운데 점 오른쪽 */
  const 각들 = (이름) => { const p = 가짜붓(); D.도장그리기(p.ctx, 1000, { 종류: '직인', 둘레글: 이름, 가운데글: '대표이사', 꼴: '법인원' }); return p.돎.slice(0, [...D.글정리(이름, 16)].length) }
  const 넷 = 각들('가상건설'), 사이 = 넷.slice(1).map((a, i) => a - 넷[i]), 한 = (Math.PI * 310 / 180) / 4
  참(넷.length === 4 && 사이.every((x) => Math.abs(x - 한) < 1e-6), '법인 원형 넷 — 77.5° 씩 고르게', JSON.stringify(사이))
  const 첫 = 넷[0] - Math.PI / 2   /* 돎 = 각 + 90° */
  참(Math.abs(첫 - (-Math.PI / 2 + (Math.PI * 25 / 180) + 한 / 2)) < 1e-6, '첫 자는 위 가운데 점 오른쪽(점에서 25° 비우고)', 첫)
  const 둘 = 각들('가나')
  참(둘.length === 2 && Math.abs(둘[1] - 둘[0] - Math.PI * 155 / 180) < 1e-6, '둘 — 155° 떨어져 좌우로(아래에 몰리지 않음)', JSON.stringify(둘))
  const 열여섯 = 각들('가나다라마바사아자차카타파하가나'), 사16 = 열여섯.slice(1).map((a, i) => a - 열여섯[i])
  참(열여섯.length === 16 && 사16.every((x) => Math.abs(x - (Math.PI * 310 / 180) / 16) < 1e-6), '열여섯 — 그대로 310° 에 고르게')
}
{
  /* 🩹 G782 인 붙이기 — 한글(인) · 한자(印) 이름만 */
  const 붙음 = (글) => { const p = 가짜붓(); return D.도장그리기(p.ctx, 1000, { 종류: '이름', 꼴: '원', 글, 인붙임: true }).글자.join('') }
  eq(['홍길', '金大', '김大中', 'Kim', 'たなか', '김A', '12', '홍1'].map(붙음), ['홍길인', '金大印', '김大中印', 'Kim', 'たなか', '김A', '12', '홍1'], '인 붙이기 — 한글 · 한자 이름만(영문 · 일본 글자 · 숫자가 섞이면 그대로)')
}
{
  /* 🩹 G782 회사 원형 · 음각 원형 — 띄어쓰기대로 줄 */
  eq(D.줄칸([4, 2]).map((c) => [c.x, c.y, c.w, c.h]), [[0, 0, 0.25, 0.5], [0.25, 0, 0.25, 0.5], [0.5, 0, 0.25, 0.5], [0.75, 0, 0.25, 0.5], [0.25, 0.5, 0.25, 0.5], [0.5, 0.5, 0.25, 0.5]], '줄 칸 — [4, 2] · 짧은 줄은 가운데')
  eq(D.낱말줄('가상건설 주식회사'), [['가', '상', '건', '설'], ['주', '식', '회', '사']], '낱말 줄 — 가상건설 / 주식회사')
  eq(D.낱말줄('가상 건설 (주)'), [['가', '상'], ['건', '설'], ['㈜']], '낱말 줄 — ㈜ 도 한 줄')
  eq([D.낱말줄('가상건설주식회사'), D.낱말줄('가 나 다 라'), D.낱말줄('가나다라마바 사'), D.낱말줄('가나다라마 바사아자차'), D.낱말줄('· ㈜')], [null, null, null, null, null], '낱말 줄 아님 — 한 낱말 · 넷 이상 · 여섯 자 낱말 · 모두 열 자 · 기호만')
  const p = 가짜붓(); const r = D.도장그리기(p.ctx, 1000, { 종류: '직인', 둘레글: '가상건설 주식회사', 꼴: '원' })
  eq([r.그린, r.글자.join('')], [8, '가상건설주식회사'], '회사 원형 «가상건설 주식회사» — 여덟 자(두 줄)')
}
{
  const a = D.씨앗난수('홍길동'), b = D.씨앗난수('홍길동'), c = D.씨앗난수('김길동')
  const xs = [a(), a(), a()], ys = [b(), b(), b()], zs = [c(), c(), c()]
  참(JSON.stringify(xs) === JSON.stringify(ys) && JSON.stringify(xs) !== JSON.stringify(zs) && xs.every((v) => v >= 0 && v < 1), '번짐 난수 — 같은 글이면 늘 같은 모양')
}

console.log('■ 도장 사진 → 투명(숫자 그림)')
const 그림 = (W, H, 칠) => { const data = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [r, g, b] = 칠(x, y); const i = (y * W + x) * 4; data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255 } return { data, width: W, height: H } }
const 종이 = (x, y) => [236 - Math.round(x / 20), 233 - Math.round(x / 20), 226 - Math.round(y / 30)]     /* 한쪽이 조금 어두운 종이 */
const 빨간원 = (x, y) => (Math.hypot(x - 120, y - 90) <= 40 ? [205, 38, 42] : null)
const 검은글 = (x, y) => (y >= 150 && y < 160 && x >= 20 && x < 90 ? [40, 40, 40] : null)
{
  const img = 그림(240, 180, (x, y) => 빨간원(x, y) || 검은글(x, y) || 종이(x, y))
  eq(D.잉크짐작(img.data), '빨강', '빨간 도장으로 봄')
  const r = D.도장뽑기(img, { 진하기: 50 })
  const a = (x, y) => r.data[(y * 240 + x) * 4 + 3]
  참(a(120, 90) === 255 && a(5, 5) === 0 && a(50, 155) === 0 && a(200, 170) === 0, '도장 안은 불투명 · 종이 · 검은 글씨는 투명', JSON.stringify([a(120, 90), a(5, 5), a(50, 155), a(200, 170)]))
  참(r.상자 && Math.abs(r.상자.x - 80) <= 1 && Math.abs(r.상자.y - 50) <= 1 && Math.abs(r.상자.w - 81) <= 2 && Math.abs(r.상자.h - 81) <= 2, '잉크 상자 = 도장 둘레', JSON.stringify(r.상자))
  const c = (x, y) => [...r.data.slice((y * 240 + x) * 4, (y * 240 + x) * 4 + 3)]
  eq(c(120, 90), D.인주.빨강.match(/\w\w/g).map((h) => parseInt(h, 16)), '색은 인주 빨강으로 고름')
  const 그대로 = D.도장뽑기(img, { 색: '그대로' })
  eq([...그대로.data.slice((90 * 240 + 120) * 4, (90 * 240 + 120) * 4 + 3)], [205, 38, 42], '«그대로» 면 사진 색')
  const sq = D.정사각자리(r.상자, 240, 180)
  참(sq && Math.abs(sq.변 - 81 * 1.12) < 2.5 && Math.abs(sq.x + sq.변 / 2 - 120.5) < 1.5 && Math.abs(sq.y + sq.변 / 2 - 90.5) < 1.5, '정사각 자리 — 긴 변 + 여백 6% · 가운데', JSON.stringify(sq))
}
{
  /* 옅은 도장 — 진하기를 올리면 더 남음 */
  const img = 그림(200, 200, (x, y) => (Math.hypot(x - 100, y - 100) <= 50 ? [215, 125, 125] : [240, 238, 234]))
  const 보통 = D.도장뽑기(img, { 잉크: '빨강', 진하기: 50 }), 진 = D.도장뽑기(img, { 잉크: '빨강', 진하기: 90 })
  const 알 = (r) => r.data[(100 * 200 + 100) * 4 + 3]
  참(알(진) > 알(보통), `진하기를 올리면 옅은 잉크가 더 진하게(${알(보통)} → ${알(진)})`)
}
{
  const img = 그림(200, 160, (x, y) => (x >= 60 && x < 140 && y >= 40 && y < 120 && (x < 66 || x >= 134 || y < 46 || y >= 114 || (x >= 95 && x < 105)) ? [35, 35, 38] : [238, 237, 233]))
  eq(D.잉크짐작(img.data), '검정', '검은 도장(빨간 점 없음)으로 봄')
  const r = D.도장뽑기(img, {})
  참(r.잉크 === '검정' && r.data[(42 * 200 + 62) * 4 + 3] === 255 && r.data[(10 * 200 + 10) * 4 + 3] === 0, '검은 도장 — 잉크만 남고 종이는 투명')
  참(r.상자 && r.상자.x === 60 && r.상자.y === 40 && r.상자.w === 80 && r.상자.h === 80, '검은 도장 상자', JSON.stringify(r.상자))
}
{
  /* 🩹 G782 파란 도장 — 파랑으로 보고 파랑 그대로(전엔 검은 도장으로 바뀜) */
  const img = 그림(200, 200, (x, y) => (Math.hypot(x - 100, y - 100) <= 45 ? [40, 80, 190] : [238, 236, 230]))
  eq(D.잉크짐작(img.data), '파랑', '파란 도장으로 봄')
  const r = D.도장뽑기(img, {})
  const i = (100 * 200 + 100) * 4
  참(r.잉크 === '파랑' && r.data[i + 3] === 255 && [...r.data.slice(i, i + 3)].join() === D.인주.파랑.match(/\w\w/g).map((h) => parseInt(h, 16)).join() && r.data[(5 * 200 + 5) * 4 + 3] === 0, '파란 도장 — 인주 파랑 · 종이는 투명')
  const 섞 = 그림(200, 200, (x, y) => (Math.hypot(x - 60, y - 100) <= 40 ? [205, 38, 42] : Math.hypot(x - 150, y - 100) <= 20 ? [40, 80, 190] : [238, 236, 230]))
  eq(D.잉크짐작(섞.data), '빨강', '빨강 · 파랑이 섞이면 많은 쪽(빨강)')
}
{
  const img = 그림(100, 100, () => [240, 240, 240])
  const r = D.도장뽑기(img, {})
  참(r.상자 === null && D.정사각자리(null, 100, 100) === null, '도장이 없는 사진 → 상자 없음(화면은 «도장을 찾지 못했습니다»)')
}

{
  /* 📐 G780a 기울기 바로잡기 — 가로 막대(60 × 4)를 90° 돌리면 세로 막대 · 0° 는 그대로 · 색 · 바깥 투명 */
  const W = 100, H = 60, data = new Uint8ClampedArray(W * H * 4)
  for (let y = 28; y < 32; y++) for (let x = 20; x < 80; x++) { const i = (y * W + x) * 4; data[i] = 207; data[i + 1] = 31; data[i + 2] = 37; data[i + 3] = 255 }
  const 뽑은 = { data, width: W, height: H, 상자: { x: 20, y: 28, w: 60, h: 4 }, 잉크: '빨강' }
  const 그대로 = D.도장돌리기(뽑은, 뽑은.상자, 0)
  참(그대로.상자 && 그대로.상자.w === 60 && 그대로.상자.h === 4, '0° — 막대 그대로(60 × 4)', JSON.stringify(그대로.상자))
  const 돈 = D.도장돌리기(뽑은, 뽑은.상자, 90)
  const 가운데 = 돈.상자 ? [돈.상자.x + 돈.상자.w / 2, 돈.상자.y + 돈.상자.h / 2] : []
  참(돈.상자 && 돈.상자.w <= 5 && 돈.상자.h >= 59 && Math.abs(가운데[0] - 돈.width / 2) <= 1.5 && Math.abs(가운데[1] - 돈.height / 2) <= 1.5, '90° — 세로 막대 · 그림 가운데', JSON.stringify([돈.상자, 돈.width]))
  const i = ((돈.height >> 1) * 돈.width + (돈.width >> 1)) * 4
  참(돈.data[i + 3] >= 250 && Math.abs(돈.data[i] - 207) <= 1 && Math.abs(돈.data[i + 1] - 31) <= 1 && 돈.data[3] === 0 && 돈.잉크 === '빨강', '돌려도 색 그대로(테두리가 검게 안 번짐) · 바깥은 투명')
  const 조금 = D.도장돌리기(뽑은, 뽑은.상자, 10)
  참(조금.상자 && 조금.상자.h >= 10 && 조금.상자.h <= 16, '10° — 막대가 기울어 상자 높이가 늘어남(60 × sin10° + 4 ≈ 14)', JSON.stringify(조금.상자))
}

console.log('■ 내 도장(이 기기)')
const 머리 = 'data:image/png;base64,'
칸.clear()
eq(M.내도장들(), [], '처음엔 빈 목록')
const r1 = M.내도장더하기('홍길동', 머리 + 'AAAA', 1000)
참(r1.ok && r1.목록.length === 1 && r1.목록[0].이름 === '홍길동' && /^d[0-9a-z]+$/.test(r1.목록[0].id), '저장 · 이름 · 번호')
참(!M.내도장더하기('x', 'data:image/jpeg;base64,AAAA').ok && !M.내도장더하기('x', '').ok, 'PNG 가 아니면 안 받음')
참(!M.내도장더하기('x', 머리 + 'A'.repeat(M.그림최대)).ok, '너무 큰 그림은 안 받음')
const 다시 = M.내도장더하기('홍길동', 머리 + 'AAAA', 2000)
eq(M.내도장들().length, 1, '같은 그림은 한 번만(새로 앞으로)')
참(다시.ok && /이미 저장한 도장/.test(다시.말), '🩹 G782 같은 그림을 다시 저장하면 «이미 저장한 도장입니다»', 다시.말)
for (let i = 0; i < 7; i++) M.내도장더하기('도장' + i, 머리 + 'B' + i, 3000 + i)
const 목 = M.내도장들()
참(목.length === M.내도장최대 && 목[0].이름 === '도장6' && !목.some((x) => x.이름 === '홍길동'), '여섯 개까지 · 새것부터 · 옛것이 빠짐')
const 남 = M.내도장빼기(목[0].id)
참(남.length === 5 && !남.some((x) => x.id === 목[0].id) && M.내도장들().length === 5, '지우기')
칸.set(M.내도장열쇠, '[{"id":"x!","그림":"data:image/png;base64,AA"},{"id":"dabc12","이름":"좋음","그림":"data:image/png;base64,AA"}, 5]')
eq(M.내도장들().map((x) => x.이름), ['좋음'], '꼴이 틀린 것은 버림')
칸.set(M.내도장열쇠, '{깨짐')
eq(M.내도장들(), [], '깨진 값 → 빈 목록')

console.log('■ 등록 · 글')
const 읽 = (p) => readFileSync(뿌리 + p, 'utf8').replace(/\r\n/g, '\n')
const 쪽 = 읽('web/src/pages/Dojang.jsx')
참(/const Dojang = lazyPage\(\(\) => import\('\.\/pages\/Dojang\.jsx'\)\)/.test(읽('web/src/main.jsx')) && /<Route path="\/tools\/dojang" element=\{<Suspense fallback=\{<Loading \/>\}><Dojang \/><\/Suspense>\} \/>/.test(읽('web/src/main.jsx')), 'main.jsx 길 /tools/dojang')
const T = JSON.parse(읽('web/src/data/tools.json'))
const 칸목록 = T.pages.flatMap((p) => p.items.map((it) => [p.key, it]))
const 내것 = 칸목록.find(([, it]) => it.to === '/tools/dojang')
참(!!내것 && 내것[0] === 'file' && 내것[1].w === 'site' && 내것[1].new === true && 내것[1].t.length <= 60, '도구 목록 «서류 · 현장 실무» 에 한 칸')
const G = JSON.parse(읽('web/src/data/tools_guide.json'))
참(G.dojang && G.dojang.how.length === 4 && G.dojang.faq.length >= 4 && G.dojang.at === '2026-11-19', '설명(tools_guide «dojang»)')
const P = 읽('prerender.py')
참(/def dojang_page\(shell, image=None\):/.test(P) && /write\("tools\/dojang\.html", dojang_page\(shell,/.test(P) && /key="dojang"\)/.test(P), '굽기(prerender dojang_page)')
참(/"\/tools\/dojang"[,\]]/.test(읽('sitemap.py')), '사이트맵')   /* 🧰 G784 뒤에 /tools/gongmu 가 붙어도 */
참(/'\/tools\/dojang': '도장 /.test(읽('web/src/lib/빠른찾기.js')), '빠른찾기 낱말')
참(/\['\/tools\/dojang', \['\|도장'\]\]/.test(읽('web/src/lib/쓴수판.jsx')), '쓴수판 자리표 |도장')
for (const k of ['|도장|이름', '|도장|직인', '|도장|사진', '|도장|예시', '|도장|받기', '|도장|저장', '|도장|기울기', '|도장|꼴']) 참(쪽.includes(`'${k}'`), `숨은 셈 ${k}`)
참(!/오른쪽 세로줄부터/.test(쪽) && /세 자 이름이면 네 칸\(2 × 2\) 도장/.test(쪽), '🔁 가로 읽기 — «오른쪽 세로줄부터» 안내 없음 · «인» 붙이기 안내')
{
  const 예 = 쪽.slice(쪽.indexOf('function 예시사진()'), 쪽.indexOf('export default function Dojang'))
  참(예.length > 100 && !/\.rotate\(/.test(예), '🩹 G780a 🧪 예시 사진은 도장을 똑바로(돌리지 않음)')
  참(/기울기 바로잡기/.test(쪽) && /도장돌리기\(r, r\.상자, 각\)/.test(쪽) && /min=\{-기울기최대\}/.test(쪽), '📐 사진 탭 «기울기 바로잡기» — 막대 · 뽑은 도장을 돌린 뒤 자름')
}
참(/<도구설명 k="dojang" \/>/.test(쪽), '화면 아래 설명(도구설명)')
const 새글 = [쪽, JSON.stringify(G.dojang), JSON.stringify(내것 && 내것[1]), P.slice(P.indexOf('def dojang_page'), P.indexOf('def jeongsan_page'))].join('\n')
참(!/무료|클로드|유료|이용권/.test(새글), '새 글에 «무료 · 클로드 · 유료 · 이용권» 없음')
참(/본인 · 자기 회사 도장만 만드세요/.test(쪽) && /인감 증명이 필요한 서류에는 실제 인감/.test(쪽), '«본인 · 자기 회사 도장만» · 인감 안내 한 줄')
참(/어디에도 보내지 않습니다/.test(쪽) && !/fetch\(|firebase|XMLHttpRequest/.test(읽('web/src/lib/도장.js') + 읽('web/src/lib/내도장.js') + 쪽), '그림은 이 기기 안에서만(서버로 보내는 코드 없음)')

console.log(`\n${bad ? '❌' : '✅'} 시험_도장 ${ok}/${ok + bad}`)
process.exit(bad ? 1 : 0)
