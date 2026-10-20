/* 🙋 공동도급 마당 — 글 카드 · 글쓰기 (G341 · 2026-10-20)
 *   소장님 「연락처 넣어도 돼, 이메일도」 · 「자유롭게 연결될 수 있는 장」 → 글마다 📞 전화 · 💬 문자 · ✉️ 메일 단추 — 업체끼리 바로 연락.
 *   읽기 · 쓰기는 lib/공동판저장.js · 모양 검사는 lib/공동판.js 글만들기(규칙 jv 와 같음).
 *   ⚠️ 투찰 금액은 구성원끼리만 — 글에도, 첫 마디(문자 · 메일)에도 금액을 넣지 않습니다(입찰담합).
 *   💬 글마다 답글(대화) — 소장님 「서로 대화로 공동으로 입찰할 수 있는 판을 깔아 주는 거지?」 · 내 글에 새 답글이 오면 마당 맨 위에 🔔(Gongdong.jsx).
 * ■ 숨은 누적: |공동|전화 · |공동|문자 · |공동|메일 · |공동|글올림 · |공동|명부올림 · |공동|신고 · |공동|글지움 · |공동|답글열기 · |공동|답글씀
 */
import { useEffect, useState } from 'react'
import { REGIONS } from './lib/fmt.js'
import { 세기 } from './lib/받은수.jsx'
import { 종류이름, 역할들, 추천말, 명함다참, 전화주소, 문자주소, 메일주소, 첫마디, 명함읽기, 명함쓰기, 내글읽기, 전화꼴, 내답글읽기, 본수적기 } from './lib/공동판.js'
import { 글올리기, 글지우기, 신고하기, 답글받기, 답글쓰기, 답글지우기 } from './lib/공동판저장.js'

const 시도들 = REGIONS.filter((x) => x !== '전국')
const 전 = (t) => {
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return '방금'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}
const 남은 = (t) => {
  const 남 = t - Date.now()
  if (남 <= 0) return '마감'
  const 일 = Math.floor(남 / 86400000)
  return 일 >= 1 ? `D-${일}` : `${Math.max(1, Math.round(남 / 3600000))}시간 남음`
}

/** 글 카드 — p(글) · 공고보기(no)(있으면 공고 이름이 단추) · 바뀜()(지움 · 신고 뒤 다시 읽기) */
export function 글카드({ p, 공고보기 = null, 바뀜 = () => {}, 답수 = null, 펼침 = false, 본바뀜 = () => {} }) {
  const [대화, set대화] = useState(펼침)
  useEffect(() => { if (펼침) set대화(true) }, [펼침])
  const [지움칸, set지움칸] = useState(false)
  const [pin, setPin] = useState('')
  const [말, set말] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const 내글 = 내글읽기().includes(p.id)
  const 지우기 = async () => {
    set바쁨(true); set말('')
    try { await 글지우기(p.id, 내글 ? '' : pin); 세기('|공동|글지움'); 바뀜() } catch (e) { set말(내글 ? '지우지 못했습니다 — 비밀번호로 해 보세요.' : '비밀번호가 맞지 않습니다.'); if (내글) set지움칸(true) } finally { set바쁨(false) }
  }
  const 신고 = async () => {
    if (!window.confirm('이 글을 신고할까요? 세 곳이 신고하면 목록에서 숨겨집니다.')) return
    try { await 신고하기(p.id); 세기('|공동|신고'); set말('신고했습니다.') } catch (e) { set말('이미 신고했거나 신고하지 못했습니다.') }
  }
  return (
    <div className={'gd-post k-' + p.kind}>
      <div className="gd-pm">
        <span className={'badge ' + (p.kind === '구함' ? 'b' : p.kind === '참여' ? 'g' : 'n')}>{종류이름[p.kind]}</span>
        {p.rgn && <span className="badge n">{p.rgn}</span>}
        <span className="gd-sp" />
        <span className="muted sm">{전(p.at)}{p.kind !== '명부' && p.end ? ` · 협정 ${남은(p.end)}` : ''}</span>
      </div>
      <div className="gd-co">{p.co}</div>
      {p.name && (공고보기
        ? <button type="button" className="gd-gonggo" onClick={() => 공고보기(p.no)}>📋 {p.name}</button>
        : <div className="gd-gonggo muted">📋 {p.name}</div>)}
      <dl className="gd-dl">
        {p.lic && <><dt>면허</dt><dd>{p.lic}</dd></>}
        {p.who && !p.tel && <><dt>담당자</dt><dd>{p.who}</dd></>}
        {p.want && <><dt>{p.kind === '구함' ? '찾는 구성원' : p.kind === '참여' ? '하고 싶은 몫' : '찾는 일'}</dt><dd>{p.want}</dd></>}
        {p.share && <><dt>지분</dt><dd>{p.share}</dd></>}
        {p.sipy && <><dt>시평액</dt><dd>{p.sipy}</dd></>}
      </dl>
      {p.body && <p className="gd-body">{p.body}</p>}
      <div className="gd-call">
        {p.tel && <a className="btn sm" href={전화주소(p.tel)} onClick={() => 세기('|공동|전화')}>📞 {p.tel}{p.who ? ` · ${p.who}` : ''}</a>}
        {p.tel && <a className="btn ghost sm" href={문자주소(p.tel, 첫마디(p))} onClick={() => 세기('|공동|문자')}>💬 문자</a>}
        {p.email && <a className="btn ghost sm" href={메일주소(p.email, `[K-건설맵 공동도급] ${p.name || p.co}`, 첫마디(p))} onClick={() => 세기('|공동|메일')}>✉️ {p.email}</a>}
      </div>
      <div className="gd-pf">
        <button type="button" className={'btn ghost sm gd-re' + (대화 ? ' on' : '')} aria-expanded={대화}
          onClick={() => { if (!대화) 세기('|공동|답글열기'); set대화(!대화) }}>💬 답글{답수 ? ` ${답수}` : ''}{내글 ? ' · 내 글' : ''} {대화 ? '▲' : '▼'}</button>
        {말 && <span className="sm bad">{말}</span>}
        <span className="gd-sp" />
        {!지움칸 ? (
          <>
            <button type="button" className="lnk sm" disabled={바쁨} onClick={() => (내글 ? 지우기() : set지움칸(true))}>{내글 ? '내 글 지우기' : '지우기'}</button>
            {!내글 && <button type="button" className="lnk sm" onClick={신고}>🚩 신고</button>}
          </>
        ) : (
          <span className="gd-pin">
            <input className="inp" inputMode="numeric" maxLength={4} placeholder="4자리" value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} />
            <button type="button" className="btn sm" disabled={바쁨 || pin.length !== 4} onClick={지우기}>지우기</button>
            <button type="button" className="lnk sm" onClick={() => { set지움칸(false); setPin(''); set말('') }}>취소</button>
          </span>
        )}
      </div>
      {대화 && <답글칸 p={p} 내글={내글} 본바뀜={본바뀜} />}
    </div>
  )
}

/** 💬 답글칸 — 글 하나의 대화 · 누구나 씀(익명 로그인) · 내 답글은 지움 · 내 글이면 «다 봄» 으로 적음 */
function 답글칸({ p, 내글, 본바뀜 }) {
  const 명함 = 명함읽기()
  const [목록, set목록] = useState(null)
  const [탈, set탈] = useState(false)
  const [by, setBy] = useState(명함.co || '')
  const [글, set글] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const [말, set말] = useState('')
  const [다시, set다시] = useState(0)
  const 내것 = 내답글읽기()
  useEffect(() => {
    let 살아 = true
    set탈(false)
    답글받기(p.id).then((v) => {
      if (!살아) return
      set목록(v)
      if (내글) { 본수적기(p.id, v.length); 본바뀜() }
    }).catch(() => { if (살아) { set목록([]); set탈(true) } })
    return () => { 살아 = false }
  }, [p.id, 다시])   // eslint-disable-line react-hooks/exhaustive-deps
  const 보내기 = async () => {
    set바쁨(true); set말('')
    try {
      const 결 = await 답글쓰기(p.id, by, 글)
      if (결.틀림) { set말(결.틀림); return }
      set글(''); 세기('|공동|답글씀'); set다시((n) => n + 1)
    } catch (e) { set말('보내지 못했습니다 — 잠시 뒤 다시 해 주세요.') } finally { set바쁨(false) }
  }
  const 지우기 = async (id) => {
    try { await 답글지우기(p.id, id); set다시((n) => n + 1) } catch (e) { set말('지우지 못했습니다.') }
  }
  return (
    <div className="gd-thread">
      {목록 === null && <div className="muted sm">답글을 받는 중…</div>}
      {탈 && <div className="sm bad">답글을 받지 못했습니다. <button type="button" className="lnk" onClick={() => set다시((n) => n + 1)}>다시 받기</button></div>}
      {목록 && !탈 && 목록.length === 0 && <div className="muted sm">{내글 ? '아직 답글이 없습니다 — 답글이 오면 마당 맨 위에 🔔 로 알려 드립니다.' : '첫 답글을 남겨 보세요 — 글쓴이가 마당에 오면 🔔 로 봅니다.'}</div>}
      {(목록 || []).map((r) => (
        <div key={r.id} className={'gd-re1' + (r.uid && r.uid === p.uid ? ' own' : '')}>
          <div className="h"><b>{r.by || '이름 없음'}</b>{r.uid && r.uid === p.uid ? <span className="badge b">글쓴이</span> : null}<span className="muted sm">{전(r.at)}</span>
            {내것.includes(r.id) && <button type="button" className="lnk sm" onClick={() => 지우기(r.id)}>지우기</button>}</div>
          <div className="b">{r.body}</div>
        </div>
      ))}
      <div className="gd-reform">
        <input className="inp" value={by} maxLength={20} onChange={(e) => setBy(e.target.value)} placeholder="회사 이름" aria-label="답글 회사 이름" />
        <textarea className="inp" value={글} maxLength={500} onChange={(e) => set글(e.target.value)} placeholder={내글 ? '답글에 답하기' : '예: 저희 전남 토목 업체입니다. 30% 가능합니다. 연락 주세요.'} aria-label="답글" />
        <button type="button" className="btn sm" disabled={바쁨 || !글.trim()} onClick={보내기}>{바쁨 ? '보내는 중…' : '보내기'}</button>
      </div>
      <div className="muted sm">답글은 누구나 봅니다 · 투찰 금액은 쓰지 마세요(입찰담합).</div>
      {말 && <div className="sm bad">{말}</div>}
    </div>
  )
}

/** 글쓰기 — 처음종류(구함 · 참여 · 명부) · r(공고 · 명부면 없음) · 끝(ms) · 닫기 · 다됨(id)
 *  🩹 소장님 「최대한 간편하게 해줘. 이용자 측면에서..그리고, 다른 사이트 참고해서 반드시 기재되어야 할 사항은 빠지지 않게」
 *   처음 보이는 것: ① 우리 역할(대표사 · 구성원 — 협정서의 대표자) ② 찾는 상대 한 줄(공고의 지역의무 · 면허 · 지분으로 미리 채움)
 *   ③ 우리 회사 한 줄(회사 · 지역 · 면허 · 담당자 · 연락처 — 한 번 적으면 기억 · «고치기») ④ «연락처 공개에 동의하고 올리기» 단추 하나.
 *   «더 적기 ▼»(접힘): 우리 지분 · 시평액 · 실적 · 하고 싶은 말 · 삭제 숫자(다른 기기에서 지울 때만).
 *   꼭 있어야 하는 것(공동수급 상대를 고를 때 보는 것 — 모두입찰 «공동수급 파트너 찾는 법» · 공동수급협정서): 공고 · 이행 방식 · 협정 마감(공고에서 저절로) ·
 *   대표사/구성원 · 면허(업종) · 지역(본점) · 지분 · 연락처 — 면허 · 지역 · 연락처를 비우면 올리지 않습니다. */
export function 글쓰기({ 처음종류 = '구함', r = null, 끝 = 0, 닫기, 다됨 }) {
  const 명함0 = 명함읽기()
  const 명부 = !r || 처음종류 === '명부'
  const 처음역할 = 명부 ? '명부' : (처음종류 === '참여' ? '참여' : '구함')
  const [f, setF] = useState(() => ({
    kind: 처음역할,
    want: 명부 ? '' : 추천말(r, 처음역할, 명함0),
    co: 명함0.co || '', rgn: 명함0.rgn || '', lic: 명함0.lic || '', who: 명함0.who || '', tel: 명함0.tel || '', email: 명함0.email || '',
    sipy: 명함0.sipy ? `${명함0.sipy}억` : '', share: '', body: '',
  }))
  const [손댐, set손댐] = useState(false)                 // 찾는 상대를 직접 고쳤나(역할을 바꿔도 안 덮어씀)
  const [회사펼침, set회사펼침] = useState(() => !명함다참(명함0) || !명함0.lic)
  const [더, set더] = useState(false)
  const [pin, setPin] = useState('')
  const [바쁨, set바쁨] = useState(false)
  const [말, set말] = useState('')
  const 칸 = (k) => (e) => setF((v) => ({ ...v, [k]: e.target.value }))
  const 역할 = (k) => setF((v) => ({ ...v, kind: k, want: 손댐 ? v.want : 추천말(r, k, { ...명함0, rgn: v.rgn || 명함0.rgn, lic: v.lic || 명함0.lic }) }))
  const 올리기 = async () => {
    if (String(f.lic || '').trim().length < 2) { set회사펼침(true); set말('면허(업종)를 적어 주세요 — 상대가 가장 먼저 봅니다.'); return }
    set바쁨(true); set말('')
    try {
      const 글 = { ...f, tel: 전화꼴(f.tel), ...(r && !명부 ? { no: r.no, name: r.name, inst: r.inst } : {}) }
      const 결 = await 글올리기(글, 끝, pin)
      if (결.틀림) { if (/회사|지역|전화|이메일/.test(결.틀림)) set회사펼침(true); set말(결.틀림); return }
      명함쓰기({ ...명함0, co: f.co.trim(), rgn: f.rgn, lic: f.lic.trim(), who: f.who.trim(), tel: 전화꼴(f.tel), email: f.email.trim(), sipy: String(f.sipy || '').replace(/[^0-9.]/g, '') || 명함0.sipy || '' })
      세기(f.kind === '명부' ? '|공동|명부올림' : '|공동|글올림')
      다됨(결.id)
    } catch (e) {
      set말('올리지 못했습니다 — 잠시 뒤 다시 해 주세요.')
    } finally { set바쁨(false) }
  }
  const 구함 = f.kind === '구함'
  const 한줄 = [f.co, f.rgn, f.lic, f.who, f.tel || f.email].filter((x) => String(x || '').trim()).join(' · ')
  return (
    <div className="gd-write card">
      <div className="gd-h">✏️ {명부 ? '업체 명부에 올리기' : '이 공고에 글 쓰기'}
        <button type="button" className="lnk" onClick={닫기}>닫기 ✕</button></div>
      {r && !명부 && <div className="muted sm">📋 {r.name}</div>}
      {!명부 && (
        <div className="gd-roles" role="radiogroup" aria-label="우리 역할">
          {역할들.map((x) => (
            <button key={x.k} type="button" role="radio" aria-checked={f.kind === x.k} className={f.kind === x.k ? 'on' : ''} onClick={() => 역할(x.k)}>
              <b>{x.t}</b><span>{x.d}</span>
            </button>
          ))}
        </div>
      )}
      <label className="gd-want">{명부 ? '찾는 일' : 구함 ? '찾는 구성원' : '하고 싶은 몫'}
        <input className="inp" value={f.want} maxLength={60} onChange={(e) => { set손댐(true); 칸('want')(e) }}
          placeholder={명부 ? '예: 전남 지역의무 공동도급 구성원 자리 찾습니다' : 구함 ? '예: 전남 소재 토목공사업 · 지분 30% 이상' : '예: 지역업체 몫 30% 맡겠습니다'} /></label>

      {!회사펼침 ? (
        <div className="gd-mecard"><span>🏢 {한줄}</span><button type="button" className="lnk sm" onClick={() => set회사펼침(true)}>고치기</button></div>
      ) : (
        <div className="gd-form">
          <label>회사 이름<input className="inp" value={f.co} maxLength={40} onChange={칸('co')} placeholder="예: ○○건설(주)" /></label>
          <label>지역(본점)<select className="inp" value={f.rgn} onChange={칸('rgn')}><option value="">고르기</option>{시도들.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label>면허(업종)<input className="inp" value={f.lic} maxLength={80} onChange={칸('lic')} placeholder="예: 토목공사업" /></label>
          <label>담당자<input className="inp" value={f.who} maxLength={20} onChange={칸('who')} placeholder="예: 공무과장 (선택)" /></label>
          <label>전화<input className="inp" inputMode="tel" value={f.tel} maxLength={20} onChange={칸('tel')} placeholder="010-0000-0000" /></label>
          <label>이메일<input className="inp" inputMode="email" value={f.email} maxLength={60} onChange={칸('email')} placeholder="name@company.co.kr (선택)" /></label>
        </div>
      )}

      <button type="button" className="lnk sm gd-more" aria-expanded={더} onClick={() => set더(!더)}>{더 ? '접기 ▲' : '더 적기 ▼ (지분 · 시평액 · 실적 · 하고 싶은 말)'}</button>
      {더 && (
        <div className="gd-form">
          {!명부 && <label>{구함 ? '우리 지분' : '맡을 지분'}<input className="inp" value={f.share} maxLength={20} onChange={칸('share')} placeholder="예: 70%" /></label>}
          <label>시평액<input className="inp" value={f.sipy} maxLength={20} onChange={칸('sipy')} placeholder="예: 85억" /></label>
          <label className="wide">실적 · 하고 싶은 말<textarea className="inp" value={f.body} maxLength={500} onChange={칸('body')} placeholder="비슷한 공사 실적 · 연락 가능한 시간 (500자)" /></label>
          <label>삭제 숫자 4자리<input className="inp" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))} placeholder="다른 기기에서 지울 때만" /></label>
        </div>
      )}
      <div className="gd-agreeline">전화 · 이메일은 <b>누구에게나 공개</b>됩니다. {명부 ? '명부는 90일 뒤 내려갑니다.' : '협정 마감이 지나면 글이 내려가고 7일 뒤 지워집니다.'} 투찰 금액은 적지 마세요(입찰담합).</div>
      {말 && <div className="sm bad">{말}</div>}
      <div className="gd-row"><button type="button" className="btn gd-go" disabled={바쁨} onClick={올리기}>{바쁨 ? '올리는 중…' : '연락처 공개에 동의하고 올리기'}</button></div>
      <div className="muted sm">우리 회사 정보는 이 브라우저에 기억해 다음 글에 저절로 채웁니다(서버로 가는 것은 올린 글뿐).</div>
    </div>
  )
}
