/**
 * /naeyeok — 「견적서 · 내역서 작성해 드립니다」 (2026-09-15)
 *
 * 소장님: 「우리의 주력은 내역서 판매로 하자. 다른 건 다 무료로 오픈하고.
 *          각종 내역서 작성 한다는 페이지를 만들자.」 · 「가격은 문의로 하자.」
 *
 * 왜 이 화면이 «구인구직» 옆에 있어야 하나
 *   구인구직 안의 「낙찰 현장」에 오늘 낙찰된 회사가 연락처까지 떠 있습니다.
 *   그 회사들이 곧 **착공신고 때 산출내역서를 내야 하는** 바로 그 사람들입니다.
 *   목록을 보러 온 사람이 자기 이야기를 만나는 자리 — 그래서 여기입니다.
 *
 * ⚠️ 값은 적지 않습니다(문의). 대신 **무엇이 값을 바꾸는지**를 적어 둡니다.
 *    값을 감추면 문의가 줄지만, 근거 없이 적으면 나중에 못 지킵니다.
 * ⚠️ 낙찰을 약속하지 않습니다. 약속하는 것은 **서류의 정확성**뿐입니다.
 * ⏸ 2026-09-25 — 대행은 지금 받지 않습니다(아래 «대행받음»). 이 화면은 «산출내역서 알아보기» 로 남습니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 받은수, 화면열쇠 } from '../lib/받은수.jsx'   /* ⬇ 2026-10-01 (G109) 소장님 「내역서 및 적산 탭 안에 … 받기 숫자가 하나도 없는데?」 — 도구 탭과 같은 숫자 */
/* 🦺 2026-09-16 — 「작성 대행」 탭이 내역서와 안전서류 둘을 같이 품습니다.
   내역서를 보러 온 사람이 곧 착공계도 내야 하는 사람입니다 — 그 자리에 띠를 붙입니다. */
import { SafetyStrip } from './Safety.jsx'
import { PriceStance } from '../components.jsx'
/* 📄 서식 이름·그림은 formsgen.py 가 구운 «작은 목록»(6KB) — Change.jsx 와 같은 것 */
import FMIN from '../data/forms-min.json'

/* ⏸ 2026-09-25 — 소장님: 「공내역서 채우기가 정확히 몇 퍼센트 되는 거지? 그럼 작성대행도 안돼고,
   적산도 안되는 거잖아. 근데, 사이트에는 된다고 해놓서...이걸 고쳐야 할 것 같아」
   → 대행은 «지금 받지 않습니다» 로 바꿉니다. 받는 쪽 글(무엇을 드리나 · 얼마 · 어떻게 · 문의 칸 ·
     왜 우리인가 · 약속)은 지우지 않고 이 값 하나로 숨겨 둡니다 — 다시 받을 때 true 로 바꾸십시오.
   ⚠️ 탭 이름(App.jsx) · 길 이름(Crumbs.jsx) · 다른 화면의 띠(components.jsx NaeyeokStrip · Jobs · Ratio) ·
      미리 굽는 글(prerender.py 의 /naeyeok) 도 같이 바꿨습니다. 다시 열 때 같이 되돌리십시오. */
const 대행받음 = false

/* ⚠️ firebase 를 «정적으로» 끌어오면 이 화면만 열어도 390KB 를 받습니다.
   「문의 남기기」 를 실제로 누를 때만 받아옵니다. (Jobs.jsx 와 같은 방식) */
let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('../firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

/* ⚠️ 이 주소는 화면에 «늘» 적지 않습니다 — 보내기가 실패했을 때 한 줄로만 나옵니다.
   소장님: 「그럼, 제거하면 되지 않아?」 (2026-09-17)
   공개 페이지에 적힌 메일 주소는 수집 로봇이 거의 반드시 긁어갑니다. 스팸만 늘고,
   문의칸이 있는데 주소를 또 적으면 무엇을 눌러야 하는지도 갈립니다. */
const MAIL = 'kimmyounghwan259@gmail.com'

/* 🚨 2026-09-17 — 여기 메일창을 여는 단추가 둘 있었습니다.
 *   소장님: 「문의 하기에서 메일 보내기… 근데 윈도우가 뜨던데」
 *           「이용자가 클릭하면 **바로 내 메일로 바로 보낼 수 있게** 해줘」
 *
 *   그 단추는 «우리가 메일을 보내는 것» 이 아니었습니다. 누르는 분 컴퓨터에 깔린
 *   메일 프로그램(윈도우 메일·아웃룩)을 여는 것이었습니다. 그래서
 *     · 안 깔려 있으면 → 낯선 창이 뜨거나 아무 일도 안 일어납니다
 *     · 웹메일(네이버·다음·지메일)만 쓰는 분은 → 여기서 끝입니다. 그냥 나갑니다
 *   → 이제 그 단추는 없습니다. **아래 문의함이 곧 메일입니다.**
 *     쓰신 글은 문의함(quotes)에 들어가고, 10분마다 도는 알림이
 *     소장님 메일로 그대로 밀어 드립니다 (tools/quote_mail.py).
 *   ⚠️ 메일 주소는 «글자로» 남겨 둡니다. 메일이 편한 분은 베껴 쓰시면 됩니다.
 *      다만 눌러서 창이 뜨게는 하지 않습니다. */

function ask(where, 이름 = 'naeyeok_ask') {
  try {
    if (window.gtag) window.gtag('event', 이름, { where })
  } catch (e) { /* 광고차단기 — 세는 것 때문에 문의가 막히면 안 됩니다 */ }
}


/* ── 문의함 ──────────────────────────────────────────────────────────
   소장님: 「게시판이 없다. 만들 수 있어? 글만 작성하게 해서」
   → 쓰기 전용입니다. 올린 글은 **아무도 못 봅니다**(소장님만 관리자로 보십니다).
      문의에는 공사 정보와 연락처가 들어가니 목록으로 걸어 두면 안 됩니다.
   → 읽기가 없으니 내려받기가 0 이라 요금도 붙지 않습니다. */
/* 🦺 2026-09-20 — /safety 도 이 문의함을 씁니다. 같은 창구를 두 벌로 만들지 않습니다.
   «무엇이 필요하십니까» 목록만 갈아 끼웁니다(옵션). 안 주면 내역서 목록 그대로입니다. */
export function QuoteForm({ 옵션 = null, 첫값 = '입찰 산출내역서', 쓰임 = 'naeyeok_ask' }) {
  /* 🧭 2026-09-27 — 적다가 다른 화면에 갔다 와도 남게(이 탭을 닫을 때까지). 연락처·이름은 남기지 않습니다. */
  const 초안열쇠 = 'kcm.ask.초안.' + 쓰임
  const [f, setF] = useState(() => {
    const 기본 = { work: '', org: '', no: '', money: '', want: 첫값, due: '', phone: '', name: '', memo: '' }
    try { const d = JSON.parse(sessionStorage.getItem(초안열쇠) || 'null'); if (d) return { ...기본, ...d, phone: '', name: '' } } catch (e) { /* 없음 */ }
    return 기본
  })
  useEffect(() => {
    const { phone, name, ...나머지 } = f   // eslint-disable-line no-unused-vars
    try { sessionStorage.setItem(초안열쇠, JSON.stringify(나머지)) } catch (e) { /* 없음 */ }
  }, [f])   // eslint-disable-line react-hooks/exhaustive-deps
  const [state, setState] = useState('')      // '' | 'send' | 'done' | 오류글
  const set = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (!f.work.trim()) { setState('공사명을 적어 주세요.'); return }
    if (!f.phone.trim()) { setState('연락처를 적어 주세요. 답을 드릴 방법이 없습니다.'); return }
    setState('send')
    try {
      const fb = await loadFb()
      await fb.ensureAnon()
      const slot = fb.push(fb.ref(fb.db, 'quotes'))
      await fb.set(slot, {
        work: f.work.trim().slice(0, 120),
        org: f.org.trim().slice(0, 60),
        no: f.no.trim().slice(0, 40),
        money: f.money.trim().slice(0, 40),
        want: f.want.slice(0, 40),
        due: f.due.trim().slice(0, 40),
        phone: f.phone.trim().slice(0, 40),
        name: f.name.trim().slice(0, 30),
        memo: f.memo.trim().slice(0, 1000),
        at: Date.now(),
      })
      ask('form', 쓰임)
      try { sessionStorage.removeItem(초안열쇠) } catch (e) { /* 없음 */ }
      setState('done')
    } catch (err) {
      setState('보내지 못했습니다. 메일(' + MAIL + ')로 보내 주시면 똑같이 처리해 드리겠습니다.')
    }
  }

  if (state === 'done') {
    return (
      <div className="card" id="ask">
        <div className="sec-title">보냈습니다</div>
        <p style={{ margin: 0, lineHeight: 1.9 }}>
          <b>하루 안에 적어 주신 연락처로 답을 드리겠습니다.</b><br />
          값과 납기를 먼저 알려 드리고, 맞으시면 그때 시작합니다. 여기까지는 돈이 들지 않습니다.
        </p>
      </div>
    )
  }

  const L = { display: 'block', fontSize: 12.5, fontWeight: 700, margin: '0 0 4px' }
  const I = { width: '100%', boxSizing: 'border-box' }
  const R = { marginBottom: 12 }

  return (
    <div className="card" id="ask">
      <div className="sec-title">문의 남기기</div>
      <div className="muted" style={{ fontSize: 12.5, margin: '0 0 12px', lineHeight: 1.75 }}>
        회원가입 없습니다. <b>올리신 글은 다른 사람에게 보이지 않습니다</b> — 목록도 없습니다.
        공사 정보와 연락처가 들어가는 글이라 그렇게 만들었습니다.
      </div>
      <form onSubmit={submit}>
        <div style={R}>
          <label style={L}>공사명 <span style={{ color: '#c0392b' }}>*</span></label>
          <input style={I} value={f.work} onChange={set('work')} placeholder="예) 2026년 ○○면 소하천 정비공사" maxLength={120} />
        </div>
        <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={R}>
            <label style={L}>발주처</label>
            <input style={I} value={f.org} onChange={set('org')} placeholder="예) ○○시" maxLength={60} />
          </div>
          <div style={R}>
            <label style={L}>공고번호</label>
            <input style={I} value={f.no} onChange={set('no')} placeholder="아시면" maxLength={40} />
          </div>
          <div style={R}>
            <label style={L}>공사금액</label>
            <input style={I} value={f.money} onChange={set('money')} placeholder="예) 4억 8천만원" maxLength={40} />
          </div>
          <div style={R}>
            <label style={L}>언제까지</label>
            <input style={I} value={f.due} onChange={set('due')} placeholder="예) 이번 주 금요일" maxLength={40} />
          </div>
        </div>
        <div style={R}>
          <label style={L}>무엇이 필요하십니까</label>
          <select style={I} value={f.want} onChange={set('want')}>
            {옵션 ? 옵션.map(([g, xs]) => (
              <optgroup key={g} label={g}>
                {xs.map((x) => <option key={x}>{x}</option>)}
              </optgroup>
            )) : (<>
            <optgroup label="입찰 전">
              <option>입찰 산출내역서</option>
              <option>공내역서 단가 넣기</option>
              <option>물량내역서 검토</option>
              <option>입찰 견적서</option>
            </optgroup>
            <optgroup label="낙찰 뒤">
              <option>착공 산출내역서</option>
              <option>실행내역서</option>
              <option>하도급 내역서</option>
            </optgroup>
            <optgroup label="공사 중">
              <option>설계변경 내역</option>
              <option>기성 내역서</option>
              <option>물가변동 조정내역</option>
              <option>실정보고 첨부 내역</option>
            </optgroup>
            <optgroup label="그 밖">
              <option>민간공사 견적서</option>
              <option>관급자재 구입내역서</option>
              <option>원가계산서</option>
              <option>공사비 검토</option>
              <option>물량산출부터</option>
              <option>아직 모르겠음 — 상의하고 싶음</option>
            </optgroup>
            </>)}
          </select>
        </div>
        <div className="grid2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={R}>
            <label style={L}>연락처 <span style={{ color: '#c0392b' }}>*</span></label>
            <input style={I} value={f.phone} onChange={set('phone')} placeholder="전화 또는 이메일" maxLength={40} />
          </div>
          <div style={R}>
            <label style={L}>성함</label>
            <input style={I} value={f.name} onChange={set('name')} placeholder="예) 김○○" maxLength={30} />
          </div>
        </div>
        <div style={R}>
          <label style={L}>더 하실 말씀</label>
          <textarea style={{ ...I, minHeight: 90 }} value={f.memo} onChange={set('memo')}
            placeholder="물량내역서가 있는지, 발주처 서식이 따로 있는지 같은 것을 적어 주시면 값이 정확해집니다."
            maxLength={1000} />
        </div>
        <div className="btn-row" style={{ justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <button className="btn line" type="submit" disabled={state === 'send'}>
            {state === 'send' ? '보내는 중…' : '문의 보내기'}
          </button>
        </div>
        {state && state !== 'send' && (
          <div className="note" style={{ marginTop: 10 }}>{state}</div>
        )}
        <div className="muted" style={{ fontSize: 12, marginTop: 10, lineHeight: 1.7 }}>
          파일(물량내역서·설계서)은 <b>답장에 붙여 보내 주시면</b> 됩니다.
          보내 주신 것은 그 일에만 쓰고 다른 데 보여 드리지 않습니다.
        </div>
      </form>
    </div>
  )
}

/* 📋🧰 2026-09-29 — 소장님: 「건설맵 내역서 탭을 보면 좀 부실해 보여,,,한 번 점검해줘」 → (A · B · 무효 검사 가운데) 「A로 해줘」
   점검: 탭이 «알아보기 글 한 장» 이었습니다 — 맨 위 안전서류 띠 · 둘째 칸 «대행 안 받음 66.7%·39.5%» · 도구는 문단 속 작은 칩 ·
         아래 절반은 법 설명. 사이트에 있는 내역서 도구(설계변경 넷 · 하도급 적정성 · 물가변동 · 예정공정표 · 마감)와 서식 14가지가 안 걸려 있었습니다.
   → «상황별 작업대»: ① 낙찰 뒤 산출내역서 ② 하도급·실행 ③ 설계변경·물가변동 ④ 물량·공정표 — 칸마다 쓸 도구(차례대로)와 서식.
     법 설명(언제·누가 · 무효)은 그 아래, 대행 안내는 맨 아래로. 대행을 다시 받으면(대행받음 = true) 예전 차례로 돌아갑니다.
   ⚠️ 도구 설명은 tools.json(도구 탭) 과 같은 뜻으로 적습니다 — 한쪽만 고치면 말이 갈립니다.
   ⚠️ «파일이 안 올라간다» 는 말은 단가 채우기(/jeoksan/fill)엔 틀립니다 — 그 도구만 서버가 받아 채우고 남기지 않습니다. */
const 상황들 = [
  {
    k: 'award', n: '①', ic: '🏁', h: '낙찰 뒤 산출내역서', 짧게: '착공신고 때 내는 내역서',
    언제: '100억원 미만 공사는 낙찰 뒤 착공신고 때 냅니다. 받은 공내역서에 단가를 넣고, 낙찰금액에 맞춰 원가계산서까지 맞춥니다.',
    도구: [
      { to: '/jeoksan/fill', ic: '💰', t: '공내역서 단가 채우기', 딱지: '시험판', d: '받은 공내역서(엑셀)를 넣으면 품목마다 단가를 찾아 넣습니다. 채운 값은 한 줄씩 확인하십시오.' },
      { to: '/naeyeok/ratio', ic: '📉', t: '낙찰금액에 맞추기', d: '단가가 든 내역서를 올리고 맞출 금액(낙찰금액)이나 비율만 넣으면 단가·금액과 원가계산서가 그대로 따라옵니다.' },
      { to: '/tools/after-award', ic: '📅', t: '낙찰 뒤 할 일 달력', d: '계약 · 공사대장 통보 · 착공 전 안전 서류 · 보험 신고 · 하도급 통보까지 기한을 날짜로 뽑습니다.' },
    ],
    서식: ['gongnaeyeok-hanbeol', 'sanchul-naeyeok', 'wonga', 'ilwidaega'],
  },
  {
    k: 'sub', n: '②', ic: '🤝', h: '하도급 · 실행내역', 짧게: '하도급 80% · 우리 회사 실제 원가',
    언제: '하도급을 줄 때 내역서를 비율(80% 등)로 맞추고, 82%·64% 적정성 심사에 걸리는지 봅니다. 실행률로 맞추면 실행내역서가 됩니다.',
    도구: [
      { to: '/naeyeok/hado', ic: '🤝', t: '하도급 내역서 만들기 — 6장 한 벌', d: '원도급 내역서를 올리고 하도급율만 넣으면 원가계산서 대비표 · 직접시공 원가계산서 · 하도급내역서 · 대상내역서 · 직접시공내역서까지 — 율 칸 하나로 전부 다시 셈.' },
      { to: '/naeyeok/ratio', ic: '📉', t: '하도급 80% · 실행률 맞추기', d: '내역서를 올리고 비율만 넣으면 단가·금액이 그 비율로 바뀌고 원가계산서도 같이 나옵니다.' },
      { to: '/tools/subcontract-check', ic: '⚖️', t: '하도급 적정성 판정 — 82% · 64%', d: '하도급금액을 넣으면 심사 대상인지, 넘기려면 얼마 이상이어야 하는지, 직접시공 비율까지 봅니다.' },
    ],
    서식: ['hadogeup-gyehoek', 'silhaeng-daebipyo', 'hadogeup-daegeum'],
  },
  {
    k: 'chg', n: '③', ic: '🔁', h: '설계변경 · 물가변동', 짧게: '공사 중 늘고 줄 때 · 값이 올랐을 때',
    언제: '공사 중 물량이 늘고 줄거나 새 비목이 생길 때, 자재·노무비가 올랐을 때. 증가 물량은 계약단가, 신규 비목은 설계변경 당시 단가 × 낙찰률입니다.',
    도구: [
      { to: '/change/calc', ic: '🧮', t: '설계변경 증감 계산', d: '증가·감소 물량과 신규 비목을 규정 단가로 계산합니다. 낙찰률을 엉뚱한 데 곱하지 않습니다.' },
      { to: '/change/twoline', ic: '↔️', t: '설계변경 2줄 자동변환', d: '당초 한 줄을 당초·변경 두 줄로 바꿔 줍니다. 손으로 밀어 넣다 틀리는 자리입니다.' },
      { to: '/change/excel', ic: '📊', t: '설계변경 자동계산 엑셀', d: '단가 한 칸을 고치면 일위대가 → 내역서 → 증감대비표 → 원가계산서까지 다시 계산되는 엑셀. 당초·변경·증감이 한 표에 나란히.' },
      { to: '/tools/price-adjust', ic: '📈', t: '물가변동 조정금액 계산기', d: '계약금액과 등락률을 넣으면 조정 가능 여부와 증감액이 나옵니다.' },
      { to: '/change', ic: '📘', t: '설계변경 한눈에 — 절차 · 단가 기준', d: '어떤 차례로, 어떤 단가로 하는지 한 장에. 실무에서 자주 틀리는 자리도 적었습니다.' },
    ],
    서식: ['chg-naeyeok', 'chg-chongwal', 'chg-hyeobui', 'seolgye-byeongyeong', 'siljeong-bogo', 'mulga', 'chg-mulga-san', 'chg-ganjeopbi'],
  },
  {
    k: 'qty', n: '④', ic: '📐', h: '물량 확인 · 공정표', 짧게: '도면 물량 대조 · 예정공정표',
    언제: '내역서 물량이 도면과 맞는지 보고, 빈 수량 칸을 도면 물량으로 채웁니다. 내역서 공종·금액으로 예정공정표도 만듭니다.',
    도구: [
      { to: '/jeoksan/auto', ic: '⚡', t: '도면 물량 자동 · 내역서 대조', d: '도면을 넣으면 물량이 저절로 나오고, 내역서를 같이 넣으면 줄마다 대조한 뒤 빈 수량 칸에 도면 물량을 넣어 그 파일 그대로 돌려 드립니다.' },
      { to: '/jeoksan/golgo', ic: '🏗', t: '골조 — 도면 넣으면 자동', d: '구조평면도와 부재 일람표로 보·기둥·슬래브·벽·기초의 콘크리트·거푸집·철근을 층별·부재별로 셉니다.' },
      { to: '/jeoksan/magam', ic: '🧱', t: '마감 — 방마다 바닥 · 벽 · 천장', d: '평면도의 방을 스스로 찾아 면적·둘레를 넣고, 마감표·창호표로 재료별 수량을 셉니다.' },
      { to: '/tools/schedule', ic: '📈', t: '예정공정표 · S커브', d: '내역서 공종별 집계표의 공종·금액으로 보할·월별 공정률·S커브까지 — 막대형 · 금액형(당초·변경).' },
    ],
    서식: ['suryang', 'giseong-daebipyo'],
  },
]

/* 📚 남이 낸 설계 단가 — /change/naeyeok 은 «설계변경 서식» 이 아니라 «조달청 공개 내역서 모음» 입니다(prerender.py change_naeyeok_page) */
const 단가보기 = [
  { to: '/change/naeyeok', ic: '📑', t: '공사 내역서 모음 — 2026년', d: '조달청이 공고에 붙여 공개한 설계내역서·단가산출서·공내역서를 갈래별로 모았습니다. 설계내역서에는 발주처가 잡은 설계 단가가 들어 있습니다.' },
  { to: '/change/unit', ic: '📐', t: '단가 · 품셈 기준 (2026년)', d: '신규 비목의 «설계변경 당시 단가» 를 2026년에 무엇을 기준으로, 어디서 받는지 정리했습니다.' },
]

/* 카드마다 그 화면에서 받은 횟수(0 이면 안 보임) — 다른 카드 화면은 빼고 셈(도구 탭과 같게) */
const 카드열쇠 = () => new Set([...상황들.flatMap((s) => s.도구), ...단가보기].map((x) => 화면열쇠(x.to)))
let 카드열쇠캐시 = null
function 도구칸({ x }) {
  return (
    <Link className="tlx-card" to={x.to}>
      <span className="tlx-ic">{x.ic}</span>
      <span className="tlx-body">
        <span className="tlx-t">{x.t}{x.딱지 && <em className="tlx-new ny-tag">{x.딱지}</em>}</span>
        <span className="tlx-d">{x.d}</span>
        <받은수 쪽={x.to} 봄={x.to} 빼기={카드열쇠캐시 || (카드열쇠캐시 = 카드열쇠())} className="dlcount tlx-dl" />
      </span>
    </Link>
  )
}

function 작업대() {
  return (
    <>
      <div className="card ny-pick">
        <div className="sec-title" style={{ marginTop: 0 }}>지금 하시는 일은?</div>
        <div className="ny-pick-row">
          {상황들.map((s) => (
            <a className="ny-pick-b" href={'#ny-' + s.k} key={s.k}>
              <span className="ny-pick-t"><span className="ny-n">{s.n}</span> {s.ic} {s.h}</span>
              <span className="ny-pick-d">{s.짧게}</span>
            </a>
          ))}
        </div>
      </div>

      {상황들.map((s) => (
        <div className="card ny-sit" id={'ny-' + s.k} key={s.k}>
          <div className="ny-sit-h"><span className="ny-n">{s.n}</span> {s.ic} {s.h}</div>
          <div className="ny-sit-w">{s.언제}</div>
          <div className="tlx-grid">
            {s.도구.map((x, i) => <도구칸 x={x} key={x.to + i} />)}
          </div>
          {s.서식.some((g) => FMIN[g]) && (
            <div className="ny-forms">
              <span className="ny-forms-h">📄 서식</span>
              {s.서식.filter((g) => FMIN[g]).map((g) => (
                <Link className="navi" to={'/forms/' + g} key={g}>{FMIN[g][1]} {FMIN[g][0]}</Link>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="card ny-sit" id="ny-unit">
        <div className="ny-sit-h">📚 남이 낸 설계 단가 · 단가 기준 보기</div>
        <div className="ny-sit-w">단가를 넣다 막힐 때 — 같은 공종을 발주처가 얼마로 잡았는지, 새 비목 단가는 어디서 가져오는지.</div>
        <div className="tlx-grid">
          {단가보기.map((x) => <도구칸 x={x} key={x.to} />)}
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.7 }}>
          모두 사이트에서 바로 씁니다. 파일은 <b>브라우저 안에서만</b> 다룹니다 — 다만 <b>공내역서 단가 채우기</b>는 단가를 찾느라
          공내역서를 서버가 받아 채우고, 채운 뒤 <b>남기지 않습니다</b>. 쓰시다 안 되는 곳은 <Link to="/qna">맵톡</Link>에 한 줄 남겨 주십시오.
        </div>
      </div>

      {/* 🦺 안전서류 띠 — 이 탭이 /safety 도 품습니다. 내역서를 보러 온 분 맨 위가 아니라 작업대 아래로 (2026-09-29) */}
      <SafetyStrip />
    </>
  )
}

export default function Naeyeok() {
  return (
    <div className="wrap">
      {대행받음 ? (
        <div className="card hero">
          <h1 style={{ margin: 0, fontSize: 20 }}>📋 견적서 · 내역서 작성해 드립니다</h1>
          {/* ⚠️ .hero 는 파란 바탕입니다. 여기에 .muted(회색)를 쓰면 글이 묻혀 안 읽힙니다. */}
          <div style={{ marginTop: 6, lineHeight: 1.75, color: 'rgba(255,255,255,.92)', fontSize: 13.5 }}>
            견적서 · 입찰 산출내역서 · 실행내역 · 설계변경 · 기성 — <b style={{ color: '#fff' }}>내역 일이면 다 합니다.</b>
            <span style={{ opacity: .9 }}> 이 화면 말고 K-건설맵의 나머지는 전부 무료입니다.</span>
          </div>
        </div>
      ) : (
        <div className="card hero">
          <h1 style={{ margin: 0, fontSize: 20 }}>📋 내역서 — 낙찰 뒤 산출내역서부터 하도급 · 설계변경까지</h1>
          <div style={{ marginTop: 6, lineHeight: 1.75, color: 'rgba(255,255,255,.92)', fontSize: 13.5 }}>
            {/* 2026-09-29 — «작업대» 로 바꾸며 머리 글도: 무엇을 하는 탭인지 먼저. (9/26 글: 「산출내역서는 누군가는 반드시 내야 하는 서류」 → 아래 «언제, 누가 내나» 칸에 그대로) */}
            지금 하시는 일을 고르시면 <b style={{ color: '#fff' }}>쓸 도구와 서식이 차례대로</b> 나옵니다.
            <span style={{ opacity: .9 }}> 산출내역서 · 하도급 · 실행 · 설계변경 · 물가변동 · 물량 대조 · 예정공정표 — 전부 사이트에서 바로.</span>
          </div>
        </div>
      )}

      {대행받음 ? (<>
      {/* 🦺 2026-09-16 — 소장님: 「대상판정이 사이트 어디 있어?」
          예전엔 이 띄가 «세 번째 칸» 이라 한 번 내려야 보였습니다.
          「작성 대행」을 눌렀을 때 바로 보이는 자리로 올렸습니다. */}
      <SafetyStrip />

      {/* ── 맨 위 ─────────────────────────────────────────────── */}
      <div className="card" style={{ borderLeft: '5px solid var(--accent, #1a56db)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.5, marginBottom: 8 }}>
          낙찰되셨습니까? <span style={{ color: 'var(--accent, #1a56db)' }}>산출내역서</span>를 내셔야 합니다.
        </div>
        <p style={{ margin: '0 0 12px', lineHeight: 1.85 }}>
          추정가격 <b>100억원 미만</b>이면 낙찰자가 <b>착공신고서를 낼 때</b>,
          <b> 100억원 이상</b>이면 입찰 참가자가 <b>입찰서와 함께</b> 냅니다.
          금액과 상관없이 <b>누군가는 반드시 만들어야 하는 서류</b>입니다.
        </p>
        {대행받음 ? (
          <>
            <div className="btn-row" style={{ justifyContent: 'flex-start' }}>
              <a className="btn line" style={{ textDecoration: 'none' }} href="#ask"
                 onClick={() => ask('hero')}>📝 문의 남기기 — 1분이면 됩니다</a>
            </div>
            {/* 나머지 둘은 단추가 아니라 «가는 고리»로. 셋 다 파란 단추면 무엇을 누를지 모릅니다. */}
            <div className="navrow" style={{ marginTop: 8 }}>
              <a className="navi" href="#ask" onClick={() => ask('hero-mail')}>✉️ 문의 남기기 ↓</a>
              <a className="navi" href="#what">무엇을 드리나 ↓</a>
              <a className="navi" href="#how">어떻게 되나 ↓</a>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
              회원가입도, 로그인도 없습니다. <b>남에게 보이지 않는 문의함</b>입니다.
              <b>적어서 보내시면 그대로 제 메일로 옵니다</b> — 메일 프로그램이 뜨지 않습니다.
            </div>
          </>
        ) : (
          <div className="note" style={{ margin: 0, lineHeight: 1.8 }}>
            <b>작성 대행은 지금 받지 않습니다.</b> 단가를 자동으로 채우는 프로그램을 시험하고 있는데,
            실제 설계 내역서 4,171줄로 재 보니 품목이 맞는 줄이 3줄 중 2줄(66.7%),
            단가가 설계값 ±10% 안에 드는 줄이 10줄 중 4줄(39.5%)이라 아직 믿고 맡기실 수준이 아닙니다.
            되는 날 이 화면에 먼저 적겠습니다.
          </div>
        )}
      </div>


      {/* 📉 2026-09-18 — 소장님: 「내역서를 올리면 80%로 자동으로 맞춰지는 도구」
          맡기실 것이 아니라 «직접 하실 것» 이라 여기 위쪽에 답니다.
          대행을 보러 온 분이 «이건 내가 하면 되겠다» 하는 일이면 그렇게 하시는 게 맞습니다. */}
      <div className="card" style={{ borderLeft: '5px solid #2e7d32' }}>
        <div className="sec-title" style={{ marginTop: 0 }}>직접 하실 수 있는 것 — 무료</div>
        <p style={{ margin: '0 0 10px', lineHeight: 1.85 }}>
          <b>이미 있는 내역서를 «비율»로만 맞추는 일</b>이라면 직접 하실 수 있습니다.
          내역서를 올리고 <b>80%</b> 같은 비율이나 맞출 금액만 넣으시면
          단가가 그 비율로 바뀐 <b>내역서</b>와 <b>원가계산서</b>가 바로 나옵니다 —
          하도급 · 실행 · 낙찰률 셋 다 같은 셈입니다.
        </p>
        <div className="navrow">
          <Link className="navi" to="/naeyeok/ratio">📉 내역서 비율 맞추기 — 열기</Link>
          <Link className="navi" to="/change/twoline">🔁 설계변경 2줄 자동변환</Link>
        </div>
        {/* 📑 2026-09-27 — 소장님: 「내역서 하고, 적산 설명글도 최신으로 업데이트 해줘」 · 밤 「이거에 맞춰. 내역서 및 적산도 다시 수정해 주고」(골조 자동)
            9/27 에 생긴 «내역서 대조»(도면 물량 자동 안)와 물량 도구가 여기엔 없었습니다. */}
        <p style={{ margin: '12px 0 8px', lineHeight: 1.85 }}>
          <b>물량이 맞는지 보는 일</b>도 직접 하실 수 있습니다. 도면을 넣으면 물량이 저절로 나오고 —
          <b>골조(보·기둥·슬래브·벽·기초의 콘크리트·거푸집·철근)</b>도 구조평면도와 부재 일람표가 있으면 저절로 셉니다 —
          <b> 내역서(엑셀)를 같이 넣으면 줄마다 짝을 지어 물량 차이</b>를 보여 드립니다. 전부 엑셀 한 파일로 받습니다.
          <b> 공내역서에 단가를 채우는 일</b>은 시험판으로 열었습니다 — 채운 값은 한 줄씩 확인하십시오.
        </p>
        <div className="navrow">
          <Link className="navi" to="/jeoksan/fill">💰 공내역서 단가 채우기 — 시험판</Link>
          <Link className="navi" to="/jeoksan/auto">📑 내역서 대조 — 도면 물량 자동에서</Link>
          <Link className="navi" to="/jeoksan/golgo">🏗 골조 — 도면 넣으면 자동</Link>
          <Link className="navi" to="/jeoksan">🧮 K-적산 — 골조 · 마감 · 수량산출서</Link>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
          파일은 브라우저 안에서만 다룹니다 — 다만 공내역서 단가 채우기는 서버가 받아 채우고 남기지 않습니다.
        </div>
      </div>

      </>) : <작업대 />}

      {/* ── 언제 내나 ─────────────────────────────────────────── */}
      <div className="card">
        <div className="sec-title">언제, 누가 내나</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl left">
            <thead>
              <tr><th>공사 규모</th><th>누가</th><th>언제</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><b>100억원 이상</b><br /><span className="muted">내역입찰</span></td>
                <td>입찰 참가자 <b>전원</b></td>
                <td>입찰서와 <b>함께</b></td>
              </tr>
              <tr>
                <td><b>100억원 미만</b><br /><span className="muted">총액입찰</span></td>
                <td><b>낙찰자</b></td>
                <td>낙찰 후 <b>착공신고서 제출 시</b></td>
              </tr>
              <tr>
                <td>재입찰 공사</td>
                <td>낙찰자</td>
                <td>금액과 무관하게 착공신고 시</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.75 }}>
          근거: 국가를 당사자로 하는 계약에 관한 법률 시행령 제14조 제6항.
          산출내역서는 물량내역서에 단가를 적어 만듭니다(같은 조 제7항).
        </div>
      </div>

      {/* ── 틀리면 무효 ───────────────────────────────────────── */}
      <div className="card">
        <div className="sec-title">틀리면 «무효»입니다</div>
        <p style={{ margin: '0 0 10px', lineHeight: 1.85 }}>
          내역입찰에서는 산출내역서가 잘못되면 <b>입찰 자체가 무효</b>가 됩니다.
          값을 아무리 잘 써도 서류에서 떨어집니다.
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>입찰서 금액과 산출내역서 <b>총계가 다를 때</b></li>
          <li>공종·경비·일반관리비·이윤·부가세 <b>항목 합계가 총계와 다를 때</b></li>
          <li>발주처가 준 물량에서 <b>빠지거나 바뀐 것이 예정가격의 5% 이상</b>일 때</li>
          <li>금액을 고치고 <b>정정인을 안 찍었을 때</b></li>
          <li>남의 산출내역서를 <b>그대로 복사</b>했을 때 — 같은 내용 낸 사람 <b>전원 무효</b></li>
        </ul>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 10 }}>
          근거: 같은 시행령 제39조 제4항 · 시행규칙 제44조 · 공사입찰유의서 제15조.
        </div>
      </div>

      {/* ⏸ 대행 안내 — 2026-09-29 맨 위(둘째 칸)에서 맨 아래로. 첫인상이 «안 됨» 이 되지 않게 */}
      {!대행받음 && (
        <div className="card">
          <div className="sec-title">작성 대행</div>
          <div className="note" style={{ margin: 0, lineHeight: 1.8 }}>
            <b>작성 대행은 지금 받지 않습니다.</b> 단가를 자동으로 채우는 프로그램을 시험하고 있는데,
            실제 설계 내역서 4,171줄로 재 보니 품목이 맞는 줄이 3줄 중 2줄(66.7%),
            단가가 설계값 ±10% 안에 드는 줄이 10줄 중 4줄(39.5%)이라 아직 믿고 맡기실 수준이 아닙니다.
            되는 날 이 화면에 먼저 적겠습니다.
          </div>
        </div>
      )}

      {대행받음 && (<>
      {/* ── 무엇을 드리나 ─────────────────────────────────────── */}
      {/* ⚠️ 2026-09-15 — 소장님: 「견적서 작업도 넣어줘. 입찰내역서 등... 내역 작업이 필요한 모든 곳」
          처음엔 «산출내역서» 하나만 적어 뒀는데, 내역 일은 공사가 시작해서 끝날 때까지 계속 나옵니다.
          손님은 「산출내역서」 라는 말을 모르고 「견적 좀」 「기성 쳐야 하는데」 라고 옵니다.
          그래서 **일이 생기는 차례대로** 늘어놓습니다 — 자기 자리를 찾을 수 있게. */}
      <div className="card" id="what">
        <div className="sec-title">무엇을 드리나 — 내역 일이면 다 합니다</div>

        <div style={{ overflowX: 'auto' }}>
          <table className="tbl left">
            <thead><tr><th style={{ width: 88 }}>언제</th><th>무엇을</th></tr></thead>
            <tbody>
              <tr>
                <td><b>입찰 전</b></td>
                <td>
                  <b>입찰 산출내역서</b> (100억 이상 내역입찰) ·
                  <b> 공내역서 단가 넣기</b> (발주처가 준 빈 내역서 채우기) ·
                  <b> 물량내역서 검토</b> (빠진 물량 찾기) ·
                  <b> 입찰 견적서</b>
                </td>
              </tr>
              <tr>
                <td><b>낙찰 뒤</b></td>
                <td>
                  <b>착공 산출내역서</b> (착공신고 첨부) ·
                  <b> 실행내역서</b> (도급 대비 실제 원가) ·
                  <b> 하도급 내역서</b> (비율 적용 · 하도급법 맞춤)
                </td>
              </tr>
              <tr>
                <td><b>공사 중</b></td>
                <td>
                  <b>설계변경 내역</b> (당초·변경·증감 세 표) ·
                  <b> 기성 내역서</b> (기성고 산출) ·
                  <b> 물가변동 조정내역</b> (ESC) ·
                  <b> 실정보고 첨부 내역</b>
                </td>
              </tr>
              <tr>
                <td><b>그 밖</b></td>
                <td>
                  <b>민간공사 견적서</b> ·
                  <b> 관급자재 구입내역서</b> ·
                  <b> 원가계산서</b> ·
                  <b> 공사비 검토</b> (남이 준 내역이 맞는지)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="sec-title" style={{ margin: '18px 0 8px' }}>한 벌로 드립니다</div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl left">
            <thead><tr><th>드리는 것</th><th>무엇인가</th></tr></thead>
            <tbody>
              <tr><td><b>내역서</b></td><td>공종별 — 품명·규격·단위·수량·단가·금액</td></tr>
              <tr><td><b>일위대가</b></td><td>호표마다 자재·품·장비를 얼마씩 넣었는지</td></tr>
              <tr><td><b>원가계산서</b></td><td>재료비·노무비·경비·일반관리비·이윤·부가세</td></tr>
              <tr><td><b>단가대비표</b></td><td>어느 단가를 어디서 가져왔는지</td></tr>
              <tr><td>공종별 집계표 · 갑지</td><td>제출 서식 한 벌로</td></tr>
            </tbody>
          </table>
        </div>

        <div className="muted" style={{ fontSize: 12.5, marginTop: 10, lineHeight: 1.75 }}>
          엑셀로 드립니다. 수식이 살아 있어 <b>물량이나 단가가 바뀌면 그 자리에서 다시 계산</b>됩니다.
          발주처 서식이 따로 있으면 <b>그 서식에 맞춰</b> 드립니다.
          <br />
          <b>여기 없는 것도 물어보세요.</b> 내역이 들어가는 일이면 대개 됩니다 —
          안 되는 것은 안 된다고 먼저 말씀드립니다.
        </div>
      </div>

      {/* ── 얼마 ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="sec-title">얼마</div>
        <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 10 }}>문의해 주십시오.</div>
        <p style={{ margin: '0 0 10px', lineHeight: 1.85 }}>
          공사마다 품이 너무 달라 한 값으로 적어 두면 누군가는 손해를 봅니다.
          <b> 공사명과 금액만 알려 주시면 하루 안에</b> 값과 납기를 드립니다. 그 전에는 돈이 들지 않습니다.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl left">
            <thead><tr><th>값을 낮추는 것</th><th>값을 올리는 것</th></tr></thead>
            <tbody>
              <tr>
                <td><b>물량을 주실 때</b> (물량내역서·수량산출서)</td>
                <td>도면만 있고 <b>물량을 새로 내야</b> 할 때</td>
              </tr>
              <tr>
                <td>공종이 단순할 때 (포장·준설·도색 등)</td>
                <td>공종이 섞일 때 (토목＋전기＋설비)</td>
              </tr>
              <tr>
                <td>납기에 여유가 있을 때</td>
                <td>하루 이틀 안에 끝내야 할 때</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="note" style={{ marginTop: 12 }}>
          <b>물량이 없으시면 미리 말씀해 주십시오.</b> 도면에서 물량을 내는 일은 품이 많이 들고,
          도면 상태에 따라 못 해 드릴 수도 있습니다. 못 할 일을 된다고 하지 않겠습니다.
        </div>
      </div>

      <PriceStance />

      {/* ── 어떻게 ───────────────────────────────────────────── */}
      <div className="card" id="how">
        <div className="sec-title">어떻게 되나</div>
        <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2.1 }}>
          <li><b>보내 주십니다</b> — 공사명·금액·납기, 그리고 물량이나 설계서가 있으면 함께</li>
          <li><b>하루 안에 답 드립니다</b> — 값·납기·무엇을 드릴지. 여기까지 무료입니다</li>
          <li><b>만듭니다</b> — 중간에 한 번 보여 드리고 고칠 것을 받습니다</li>
          <li><b>검수 후 결제</b> — 받아 보시고 맞는지 확인하신 뒤에 결제하십니다</li>
        </ol>
      </div>

      <QuoteForm />

      {/* ── 왜 우리인가 ──────────────────────────────────────── */}
      <div className="card">
        <div className="sec-title">왜 K-건설맵인가</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li>
            <b>현장을 아는 사람이 만듭니다.</b> 공공 공사 견적·설계변경·하도급 서류를 오래 해 온 사람입니다.
          </li>
          <li>
            <b>비교할 자료가 있습니다.</b> 조달청이 공개한 내역서 <b>1,000여 건</b>을 모아
            품목별 단가와 <b>일위대가 3,000여 호표</b>를 정리해 두었습니다.
            같은 발주처·같은 공종의 최근 내역과 <b>맞춰 보고</b> 드립니다.
          </li>
          <li>
            <b>개찰 자료 15만여 건</b>을 세어 만든 사이트입니다. 이 화면 말고 나머지는 전부 무료입니다 —
            <Link to="/"> 바로투찰</Link> · <Link to="/first">1순위</Link> · <Link to="/forms">서식</Link> ·
            <Link to="/change"> 설계변경</Link> · <Link to="/jobs">구인구직</Link> · <Link to="/cad">캐드</Link>.
            써 보시고 판단하십시오.
          </li>
        </ul>
      </div>

      {/* ── 유의 ─────────────────────────────────────────────── */}
      <div className="card">
        <div className="sec-title">미리 말씀드립니다</div>
        <ul className="muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 2, fontSize: 13 }}>
          <li><b>낙찰을 약속하지 않습니다.</b> 얼마를 써서 넣을지는 사장님이 정하십니다.</li>
          <li>약속하는 것은 <b>서류가 규정에 맞고 계산이 맞다는 것</b>까지입니다.</li>
          <li>저희 잘못으로 서류가 반려되면 <b>전액 돌려드립니다.</b></li>
          <li>보내 주신 도면·물량·공사 정보는 <b>그 일에만 쓰고</b> 다른 데 보여 드리지 않습니다.</li>
        </ul>
        <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 14 }}>
          <a className="btn line" style={{ textDecoration: 'none' }} href="#ask"
             onClick={() => ask('foot')}>📝 문의 남기기</a>
        </div>
      </div>
      </>)}
    </div>
  )
}
