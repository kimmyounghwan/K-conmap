/* 🧪 G341 (2026-10-20) 공동도급 마당 — 셈(lib/공동판.js)과 데이터베이스 규칙(jv · jv_pins · jv_del · jv_flag)
     node tools/시험_공동판.mjs
   ■ 지분 검사(5곳 · 10% · 지역의무 지분 · 합 100%) · 몫 · 시평 합 · 때 · 글끝 · 글만들기 → 규칙에 그대로 맞는지 · 틀린 글은 막히는지
   ■ 규칙 식은 우리가 쓰는 것만 풀어 보는 작은 검사기(시험_장부규칙.mjs 와 같은 방식 + newData.child().exists() · $id · auth.uid) */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as G from '../web/src/lib/공동판.js'

const 여기 = path.dirname(fileURLToPath(import.meta.url))
const 글 = fs.readFileSync(path.join(여기, '..', 'web', 'database.rules.json'), 'utf-8')
const 규칙 = JSON.parse(글.split('\n').map((l) => (/^\s*\/\//.test(l) ? '' : l)).join('\n')).rules

let ok = 0, bad = 0
const 봄 = (what, cond, 덧 = '') => { if (cond) { ok++; console.log('  ✓', what) } else { bad++; console.log('  ✗', what, 덧 === '' ? '' : '— ' + (typeof 덧 === 'string' ? 덧 : JSON.stringify(덧))) } }

console.log('1) 지분 검사')
const r의무 = { no: 'R26X', name: '가상 공사', est: 5e8, jnt: ['J', ['전남'], 30, [1], [], '2026-10-21 10:00:00', 0] }
const 규 = G.기본규칙(r의무)
봄('기본 규칙 — 5곳 · 10% · 의무 전남 30%', 규.최대 === 5 && 규.최소 === 10 && 규.의무지분 === 30 && 규.의무시도.join() === '전남' && !규.큰, 규)
봄('1,000억 넘는 공사 — 10곳 · 5%', G.기본규칙({ ...r의무, est: 1.2e11 }).최대 === 10 && G.기본규칙({ ...r의무, est: 1.2e11 }).최소 === 5)
const 좋은 = [{ co: '가상건설', rgn: '서울', share: '70' }, { co: '가상전남', rgn: '전남', share: '30' }]
봄('맞는 짜임 — ok', G.지분검사(좋은, 규).ok, G.지분검사(좋은, 규).문제)
const 합틀 = G.지분검사([{ co: 'A', rgn: '서울', share: '60' }, { co: 'B', rgn: '전남', share: '30' }], 규)
봄('합 90% — 막힘', !합틀.ok && 합틀.문제.some((x) => /100%/.test(x)) && 합틀.합 === 90, 합틀)
const 의무틀 = G.지분검사([{ co: 'A', rgn: '서울', share: '80' }, { co: 'B', rgn: '전남', share: '20' }], 규)
봄('전남 지분 20% < 30% — 막힘', !의무틀.ok && 의무틀.문제.some((x) => /30% 이상/.test(x)) && 의무틀.의무합 === 20, 의무틀)
const 없음 = G.지분검사([{ co: 'A', rgn: '서울', share: '50' }, { co: 'B', rgn: '경기', share: '50' }], 규)
봄('전남 업체가 없음 — 막힘', !없음.ok && 없음.문제.some((x) => /한 곳 이상/.test(x)))
const 작은 = G.지분검사([{ co: 'A', rgn: '전남', share: '95' }, { co: 'B', rgn: '서울', share: '5' }], 규)
봄('구성원 지분 5% < 10% — 막힘', !작은.ok && 작은.문제.some((x) => /10% 이상/.test(x)))
const 여섯 = G.지분검사(Array.from({ length: 6 }, (_, i) => ({ co: '회사' + i, rgn: '전남', share: i < 4 ? '17' : '16' })), 규)
봄('여섯 곳 — 막힘(5곳 이하)', !여섯.ok && 여섯.문제.some((x) => /5곳 이하/.test(x)), 여섯.문제)
봄('한 곳 — 막힘', !G.지분검사([{ co: 'A', share: '100' }], {}).ok)
봄('분담이행(S)은 최소 지분 검사 안 함 · 공종 알림', (() => { const v = G.지분검사([{ co: 'A', share: '95' }, { co: 'B', share: '5' }], { 방식코드: 'S' }); return v.ok && v.알림.some((x) => /분담이행/.test(x)) })())
봄('공고서 기준 우선 알림은 늘', G.지분검사(좋은, 규).알림.some((x) => /공고서/.test(x)))
봄('소수 지분 — 33.3 + 33.3 + 33.4 = 100', G.지분검사([{ co: 'A', share: '33.3' }, { co: 'B', share: '33.3' }, { co: 'C', share: '33.4' }], {}).ok)

console.log('2) 몫 · 시평 합 · 때')
const 몫 = G.몫나누기(612345679, 좋은)
봄('몫 — 합이 금액과 같음 · 끝 차이는 대표사', 몫[0] + 몫[1] === 612345679 && 몫[1] === Math.floor(612345679 * 0.3), 몫)
봄('몫 — 금액 없으면 0', G.몫나누기(0, 좋은).every((x) => x === 0))
봄('시평 합 — 적힌 것만 · 빈 곳 셈', (() => { const v = G.시평합([{ co: 'A', sipy: 3e9 }, { co: 'B', sipy: '' }]); return v.합 === 3e9 && v.빈 === 1 })())
/* 🧮 G368 소장님 캡처 — 우리 회사 51 · 이름 없는 구성원 49 · 시평액 둘 다 비었는데 «안 적은 구성원 1곳» */
봄('시평 합 — 이름 없이 지분만 적은 줄도 구성원(둘 다 비면 2곳)', (() => { const v = G.시평합([{ co: '우리 회사', share: '51', sipy: '' }, { co: '', share: '49', sipy: '' }]); return v.합 === 0 && v.빈 === 2 })())
봄('시평 합 — 이름 · 지분 둘 다 빈 줄은 안 셈', (() => { const v = G.시평합([{ co: 'A', share: '60', sipy: 2e9 }, { co: '', share: '', sipy: '' }, { co: '', share: '40', sipy: 1e9 }]); return v.합 === 3e9 && v.빈 === 0 })())
const 몫51 = G.몫나누기(225451085, [{ share: '51' }, { share: '49' }])
봄('몫 글 — 51% · 49% 가 달라 보임(1억 1,498만 · 1억 1,047만 — 전엔 둘 다 1.1억)', G.억만(몫51[0]) === '1억 1,498만' && G.억만(몫51[1]) === '1억 1,047만', [G.억만(몫51[0]), G.억만(몫51[1]), 몫51])
봄('몫 글 — 억만 꼴(딱 1억 · 만 단위 · 만 미만 · 0 · 100억대)', G.억만(100004000) === '1억' && G.억만(54321000) === '5,432만' && G.억만(8000) === '8,000원' && G.억만(0) === '—' && G.억만(12345678901) === '123억 4,568만' && G.억만(99999999) === '1억',
  [G.억만(100004000), G.억만(54321000), G.억만(8000), G.억만(0), G.억만(12345678901), G.억만(99999999)])
봄('때 — 한국 시각', G.때('2026-10-21 10:00:00') === Date.parse('2026-10-21T10:00:00+09:00') && G.때('202610211000') === G.때('2026-10-21 10:00') && G.때('') === 0)
봄('글끝 — 협정 마감이 있으면 그때', G.글끝(r의무) === Date.parse('2026-10-21T10:00:00+09:00'))
봄('글끝 — 협정 없으면 입찰 마감', G.글끝({ jnt: ['J', [], 0, [], [], '', 0], close: '2026-10-22 17:00:00' }) === Date.parse('2026-10-22T17:00:00+09:00'))
봄('칸 — 우리 지역 전남이면 의무 · 서울이면 공동이면 · 공동 불가면 null',
  G.칸of(r의무, { 지역: '전남' }) === '의무' && G.칸of(r의무, { 지역: '서울' }) === '공동이면' && G.칸of({ jnt: 0 }, {}) === null && G.칸of({ jnt: ['J', [], 0, [], [], '', 0] }, {}) === '가능')

console.log('3) 글 만들기 → 규칙')
const 지금 = Date.now() - 1000, 끝 = 지금 + 86400000
const 폼 = { kind: '구함', no: 'R26X', name: '가상 공사', inst: '가상 기관', co: '가상건설(주)', rgn: '서울', lic: '토목공사업', share: '70%', want: '전남 토목 30%', body: '연락 주세요', tel: '010-1234-5678', email: 'a@b.co.kr' }
const 한 = G.글만들기(폼, 'uidA', 지금, 끝)
봄('글 — 만들어짐', !!한.글 && 한.글.kind === '구함' && 한.글.end === 끝 && 한.글.deleted === false, 한)
봄('글 — 전화 · 이메일 둘 다 없으면 틀림', !!G.글만들기({ ...폼, tel: '', email: '' }, 'u', 지금, 끝).틀림)
봄('글 — 이메일 꼴 틀림', !!G.글만들기({ ...폼, email: 'abc' }, 'u', 지금, 끝).틀림)
봄('글 — 전화 짧음', !!G.글만들기({ ...폼, tel: '1234' }, 'u', 지금, 끝).틀림)
봄('글 — 마감 지난 공고', !!G.글만들기(폼, 'u', 지금, 지금 - 3600000).틀림)
봄('글 — 명부는 공고 칸을 안 넣음', (() => { const v = G.글만들기({ ...폼, kind: '명부' }, 'u', 지금, G.명부끝(지금)).글; return v && !('no' in v) && !('name' in v) && v.end - 지금 === 90 * 86400000 })())
봄('글 — 전화꼴은 숫자 · 붙임표만', G.전화꼴('010) 1234 5678 ☎') === '0101234-5678'.replace('-', '') || G.전화꼴('010-1234-5678') === '010-1234-5678')
const 키 = G.새키(1792480000000, () => 0.5)
봄('키 — 20글자 · 규칙 길이 24 안 · 시각 순', 키.length === 20 && G.새키(1792480000001) > G.새키(1792480000000).slice(0, 8))

/* 규칙 검사기 */
function 풀식(식, v, 변수) {
  let s = 식
    .replace(/newData\.hasChildren\(\[([^\]]*)\]\)/g, (_, a) => `__has([${a}])`)
    .replace(/newData\.child\('([^']+)'\)\.exists\(\)/g, (_, k) => `(__v && __v[${JSON.stringify(k)}] != null)`)
    .replace(/newData\.isString\(\)/g, "(typeof __v === 'string')")
    .replace(/newData\.isNumber\(\)/g, "(typeof __v === 'number')")
    .replace(/newData\.isBoolean\(\)/g, "(typeof __v === 'boolean')")
    .replace(/newData\.val\(\)/g, '__v')
    .replace(/\.matches\((\/[^/]*(?:\\\/[^/]*)*\/)\)/g, '.match($1) !== null')
    .replace(/\bnow\b/g, String(Date.now()))
  for (const [k, x] of Object.entries(변수)) s = s.split(k).join(JSON.stringify(x))
  // eslint-disable-next-line no-new-func
  return Function('__v', '__has', `return (${s})`)(v, (ks) => v && typeof v === 'object' && ks.every((k) => v[k] != null))
}
function 대기(마디, v, 곳, 변수) {
  const 틀 = []
  if (!마디) return 틀
  const 식 = 마디['.validate']
  if (식 === false || (typeof 식 === 'string' && !풀식(식, v, 변수))) 틀.push(곳 + ' .validate')
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      let 아래 = 마디[k], 변 = 변수
      if (!아래) {
        const w = Object.keys(마디).find((z) => z.startsWith('$') && z !== '$other')
        if (w) { 아래 = 마디[w]; 변 = { ...변수, [w]: k } } else if (마디.$other) 아래 = 마디.$other
      }
      틀.push(...대기(아래, x, 곳 + '/' + k, 변))
    }
  }
  return 틀
}
const 글대기 = (id, v, uid = 'uidA') => 대기(규칙.jv.$id, v, 'jv/' + id, { $id: id, 'auth.uid': uid })
봄('규칙 jv 있음 · 누구나 읽기 · end · no 색인', 규칙.jv && 규칙.jv['.read'] === true && 규칙.jv['.indexOn'].join() === 'end,no')
봄('규칙 jv 쓰기 — 익명 로그인 · 자기 글만', 규칙.jv.$id['.write'] === "auth != null && newData.exists() && ( !data.exists() || data.child('uid').val() === auth.uid )")
봄('규칙 jv_pins 아무도 못 읽음 · 한 번만', 규칙.jv_pins['.read'] === false && 규칙.jv_pins.$id['.write'].includes('!data.exists()'))
봄('규칙 jv_del — jv_pins 해시와 같을 때만', 규칙.jv_del.$id['.write'].includes("root.child('jv_pins').child($id).val()"))
봄('규칙 jv_flag — 한 사람 한 번', 규칙.jv_flag.$id.$uid['.write'] === 'auth != null && auth.uid === $uid && !data.exists()')
const 아이디 = G.새키()
봄('만든 글(구함) — 규칙에 맞음', 글대기(아이디, 한.글).length === 0, 글대기(아이디, 한.글))
const 명 = G.글만들기({ ...폼, kind: '명부', email: '' }, 'uidA', 지금, G.명부끝(지금)).글
봄('만든 글(명부 · 전화만) — 규칙에 맞음', 글대기(아이디, 명).length === 0, 글대기(아이디, 명))
const 참 = G.글만들기({ ...폼, kind: '참여', tel: '', body: '' }, 'uidA', 지금, 끝).글
봄('만든 글(참여 · 이메일만) — 규칙에 맞음', 글대기(아이디, 참).length === 0, 글대기(아이디, 참))
const 막 = (v, what, id = 아이디, uid = 'uidA') => 봄('막힘 — ' + what, 글대기(id, v, uid).length > 0)
막({ ...한.글, kind: '광고' }, '없는 종류')
막({ ...한.글, 주민번호: '900101' }, '모르는 칸')
막((() => { const x = { ...한.글 }; delete x.tel; delete x.email; return x })(), '전화 · 이메일 둘 다 없음')
막({ ...한.글, tel: '010-1234-567x' }, '전화에 글자')
막({ ...한.글, email: 'a b@c.d' }, '이메일 꼴')
막({ ...한.글, end: Date.now() + 101 * 86400000 }, '끝이 100일 넘음')
막({ ...한.글, at: Date.now() + 3600000 }, '앞날 시각')
막({ ...한.글, uid: 'uidB' }, '남의 uid 로 씀')
막({ ...한.글, body: 'x'.repeat(501) }, '하고 싶은 말 500자 넘음')
막({ ...한.글, co: 'A' }, '회사 이름 한 글자')
막(한.글, '아이디가 너무 김', 'x'.repeat(25))

console.log('4) 보일 글 · 공고별 수 · 연락 주소')
const 지금2 = Date.now()
const raw = {
  a: { kind: '구함', no: 'N1', co: 'A', end: 지금2 + 1000, at: 3 },
  b: { kind: '참여', no: 'N1', co: 'B', end: 지금2 + 1000, at: 2 },
  c: { kind: '구함', no: 'N2', co: 'C', end: 지금2 - 1, at: 1 },                   // 끝남
  d: { kind: '명부', co: 'D', end: 지금2 + 1000, at: 4 },
  e: { kind: '구함', no: 'N1', co: 'E', end: 지금2 + 1000, at: 5, deleted: true },  // 지움
  f: { kind: '구함', no: 'N1', co: 'F', end: 지금2 + 1000, at: 6 },                 // 비밀번호로 지움
  g: { kind: '구함', no: 'N1', co: 'G', end: 지금2 + 1000, at: 7 },                 // 신고 3
  h: { kind: '이상', co: 'H', end: 지금2 + 1000, at: 8 },
}
const 보 = G.보일글(raw, { f: 'hash' }, { g: { u1: true, u2: true, u3: true }, a: { u1: true } }, 지금2)
봄('보일 글 — 끝 · 지움 · 비밀번호 지움 · 신고 3 · 이상한 종류 뺌 · 최신 앞', 보.map((p) => p.id).join() === 'd,a,b', 보.map((p) => p.id))
봄('공고별 수 — 명부 뺌', JSON.stringify(G.공고별수(보)) === JSON.stringify({ N1: { 구함: 1, 참여: 1 } }))
봄('전화 · 문자 · 메일 주소', G.전화주소('010-1234-5678') === 'tel:01012345678' && G.문자주소('010-1', '안녕') === 'sms:0101?body=%EC%95%88%EB%85%95'
  && G.메일주소('a@b.c', '제목', '') === 'mailto:a@b.c?subject=%EC%A0%9C%EB%AA%A9')
봄('첫 마디 — 금액 이야기 없음', !/[0-9]{3},|원|투찰률|금액/.test(G.첫마디({ co: 'A', name: '가상 공사' })))

console.log('4b) 간편 글쓰기 · 꼭 적을 것')
봄('종합심사 공사 — 대표사 50% 미만이면 막힘', (() => { const 규2 = G.기본규칙({ ...r의무, swin: '종합심사낙찰제' }); const v = G.지분검사([{ co: 'A', rgn: '서울', share: '40' }, { co: 'B', rgn: '전남', share: '60' }], 규2); return 규2.대표최소 === 50 && !v.ok && v.문제.some((x) => /50%/.test(x)) })())
봄('적격심사 공사 — 대표사 50% 기준 없음', G.기본규칙(r의무).대표최소 === 0)
봄('추천말 — 외지 대표사면 «전남 소재 … 30% 이상»', G.추천말({ ...r의무, lic: ['토목공사업/4993'] }, '구함', { rgn: '서울' }) === '전남 소재 토목공사업 업체 · 지분 30% 이상', G.추천말({ ...r의무, lic: ['토목공사업/4993'] }, '구함', { rgn: '서울' }))
봄('추천말 — 구성원이면 «… 30% 맡겠습니다»', G.추천말({ ...r의무, lic: ['토목공사업/4993'] }, '참여', { rgn: '전남' }) === '전남 토목공사업 · 지분 30% 맡겠습니다')
봄('명함 다 참 — 회사 · 지역 · 연락처 하나', G.명함다참({ co: '가상', rgn: '전남', tel: '010-1234-5678' }) && !G.명함다참({ co: '가상', rgn: '전남' }) && G.명함다참({ co: '가상', rgn: '전남', email: 'a@b.kr' }))
const 담 = G.글만들기({ ...폼, who: '공무과장' }, 'uidA', 지금, 끝).글
봄('담당자 — 저장 · 규칙에 맞음', 담.who === '공무과장' && 글대기(아이디, 담).length === 0, 글대기(아이디, 담))
막({ ...담, who: '가'.repeat(21) }, '담당자 20자 넘음')

console.log('5) 💬 답글 · 🔔 새 답글')
const 답 = G.답글만들기('  가상   응답건설  ', ' 30% 가능합니다 ', 'uidA', 지금).답
봄('답글 — 공백 정리 · 칸 다섯', 답 && 답.by === '가상 응답건설' && 답.body === '30% 가능합니다' && Object.keys(답).sort().join() === 'at,body,by,deleted,uid', 답)
봄('답글 — 빈 글 틀림', !!G.답글만들기('a', '   ', 'u').틀림)
봄('답글 — 이름 20자 · 글 500자에서 자름', G.답글만들기('가'.repeat(30), 'x'.repeat(600), 'u').답.by.length === 20 && G.답글만들기('가', 'x'.repeat(600), 'u').답.body.length === 500)
봄('답글 열쇠 — jv-{글 키} · 규칙 40자 안', G.답글열쇠(G.새키()).length <= 40 && G.답글열쇠('abc') === 'jv-abc')
const 댓규칙 = 규칙.comments.$no.$id
const 댓대기 = (no, id, v, uid = 'uidA') => 대기(댓규칙, v, `comments/${no}/${id}`, { $no: no, $id: id, 'auth.uid': uid })
봄('답글 — 이미 있는 규칙 comments 에 맞음', 댓대기(G.답글열쇠(G.새키()), G.새키(), 답).length === 0, 댓대기(G.답글열쇠(G.새키()), G.새키(), 답))
봄('막힘 — 답글에 모르는 칸', 댓대기('jv-x', 'k', { ...답, tel: '010' }).length > 0)
봄('새 답글 — 본 수와 견줌', JSON.stringify(G.새답글(['a', 'b', 'c'], { a: 3, b: 1 }, { a: 1, b: 1 })) === JSON.stringify([{ 키: 'a', 새: 2 }]))

console.log(`\n${ok} 통과 · ${bad} 실패`)
process.exit(bad ? 1 : 0)
