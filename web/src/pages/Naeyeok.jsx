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
import { useState } from 'react'
import { Link } from 'react-router-dom'
/* 🦺 2026-09-16 — 「작성 대행」 탭이 내역서와 안전서류 둘을 같이 품습니다.
   내역서를 보러 온 사람이 곧 착공계도 내야 하는 사람입니다 — 그 자리에 띠를 붙입니다. */
import { SafetyStrip } from './Safety.jsx'
import { PriceStance } from '../components.jsx'

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
  const [f, setF] = useState({ work: '', org: '', no: '', money: '', want: 첫값, due: '', phone: '', name: '', memo: '' })
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
          <h1 style={{ margin: 0, fontSize: 20 }}>📋 산출내역서 — 언제 · 누가 · 무엇을</h1>
          <div style={{ marginTop: 6, lineHeight: 1.75, color: 'rgba(255,255,255,.92)', fontSize: 13.5 }}>
            {/* 2026-09-26 — 소장님: 「클로드 추천으로 하자」 · 「설명도 바꿔줘」 — 탭 «내역서» 에 맞춰
                «대행 안 받음» 이 아니라 «이 화면이 무엇인가» 를 먼저 적습니다. 대행 얘기는 아래 한 줄로. */}
            낙찰되면 <b style={{ color: '#fff' }}>누군가는 반드시 내야 하는 서류</b>입니다.
            <span style={{ opacity: .9 }}> 언제·누가 내는지, 틀리면 왜 무효가 되는지, 직접 맞추는 무료 도구까지 한 장에 모았습니다.</span>
          </div>
        </div>
      )}

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
        <div className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
          파일은 브라우저 안에서만 다룹니다 — 저희 쪽으로 올라가지 않습니다.
        </div>
      </div>

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
            <a href="/"> 바로투찰</a> · <a href="/first">1순위</a> · <a href="/forms">서식</a> ·
            <a href="/change"> 설계변경</a> · <a href="/jobs">구인구직</a> · <a href="/cad">캐드</a>.
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
