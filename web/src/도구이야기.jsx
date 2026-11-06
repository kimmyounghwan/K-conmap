/**
 * 💬 이 도구 이야기 — 도구 쪽 맨 아래에서 바로 묻고 답하기(맵톡에 함께 올라감) (G573 · 2026-11-07)
 *
 * 소장님(11-06 23:5x): 「네이버 카페 오늘 방문자 8000명, 건설맵 360 명 차이가 뭘까? … 커뮤니티 차이 아니까?」 · 「모르겠다」
 *   → 「고민은 제가 하겠습니다」 — 도구에 사람 이야기를 붙임: 도구를 쓰다 생긴 질문이 맵톡 글이 되어 사람이 사람을 부르게.
 *
 * ■ 글은 맵톡(qna)에 그대로 올라갑니다 — 칸을 새로 만들지 않음(규칙 그대로 · lib/말머리.js 와 같은 까닭).
 *   제목 = «[후기·건의] {도구 이름} · {첫 줄}» — 도구 이름이 제목 앞에 붙어 맵톡에서도 어느 도구 이야기인지 보임.
 *   쓰는 법은 «한 줄 남겨 주세요» 창(AskComment.jsx)과 같음: 익명 로그인 · 별명 저절로 · 몰래 차단 표 · «내 글» 열쇠 · askWrote.
 * ■ 읽기는 «📜 이야기 보기» 를 눌렀을 때만(맵톡 최근 300 글에서 이 도구 이름으로 시작하는 것) — 도구 쪽을 열 때마다 받지 않게(비용).
 *   답 수는 고른 글만 qna_a/{글} 하나씩. 지운 글 · 몰래 차단 글(쓴 기기 말고는)은 안 보임 — 맵톡과 같은 규칙.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 글나누기, askWrote } from './AskComment'
import { nickOf } from './lib/nickname.js'
import { 갈래떼기 } from './lib/말머리.js'
import { 이야기머리, 그도구글, 이야기제목, 이야기본문 } from './lib/도구이야기.js'
import { 몰래표 } from './lib/차단.js'

let _fb = null
const loadFb = async () => {
  if (!_fb) {
    const [d, f] = await Promise.all([import('firebase/database'), import('./firebase.js')])
    _fb = { ...d, db: f.db, ensureAnon: f.ensureAnon }
  }
  return _fb
}

/* 망이 막히면 파이어베이스가 끝없이 기다림 — 시간 넘으면 «못 읽음» 으로 */
const 늦으면 = (pr, ms) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(new Error('늦음')), ms))])
const 날 = (at) => { if (!at) return ''; const d = new Date(at); return `${d.getMonth() + 1}/${d.getDate()}` }

export default function 도구이야기({ 이름, 주소 = '', 아이콘 = '💬' }) {
  const [글, set글] = useState('')
  const [보냄, set보냄] = useState(false)
  const [탈, set탈] = useState('')
  const [끝, set끝] = useState('')
  const [목록, set목록] = useState(null)        /* null = 안 봄 · 'load' = 읽는 중 · [] */
  const [못읽음, set못읽음] = useState(false)

  const 읽기 = async () => {
    set목록('load'); set못읽음(false)
    try { await 늦으면(읽기안(), 15000) } catch (e) { set목록(null); set못읽음(true) }
  }
  const 읽기안 = async () => {
    {
      const { ref, get, query, orderByKey, limitToLast, db, ensureAnon } = await loadFb()
      let 나 = null
      try { 나 = await ensureAnon() } catch (e) { 나 = null }
      const [q, d] = await Promise.all([get(query(ref(db, 'qna'), orderByKey(), limitToLast(300))), get(ref(db, 'qna_del')).catch(() => null)])
      const 지움 = (d && d.val()) || {}
      const 줄 = Object.entries(q.val() || {}).map(([id, v]) => ({ id, ...(v || {}) }))
        .filter((r) => r.t && !r.deleted && !지움[r.id] && (!r.sb || (나 && r.uid === 나.uid)) && 그도구글(r.t, 이름))
        .sort((a, b) => (b.at || 0) - (a.at || 0)).slice(0, 12)
      const 답 = await Promise.all(줄.map((r) => get(ref(db, `qna_a/${r.id}`)).then((s) => Object.values(s.val() || {}).filter((x) => x && !x.deleted && !x.sb).length).catch(() => 0)))
      set목록(줄.map((r, i) => ({ ...r, 답: 답[i] })))
    }
  }

  const 올리기 = async () => {
    const { t, b } = 글나누기(글)
    if (t.length < 2) { set탈('두 글자만이라도 적어 주십시오.'); return }
    set보냄(true); set탈('')
    try { await 늦으면(올리기안(t, b), 20000) } catch (e) { set탈(e && e.message === '늦음' ? '망이 느려 늦어지고 있습니다 — 맵톡에서 올라갔는지 본 뒤 다시 해 주십시오.' : '올리지 못했습니다. 잠시 뒤 다시 해 주십시오.') } finally { set보냄(false) }
  }
  const 올리기안 = async (t, b) => {
    {
      const { ref, set, push, db, ensureAnon } = await loadFb()
      const user = await ensureAnon()
      const slot = push(ref(db, 'qna'))
      await set(slot, {
        t: 이야기제목(이름, t),
        b: 이야기본문(b, 이름, 주소),
        nick: nickOf(user.uid).slice(0, 20),
        uid: user.uid,
        at: Date.now(),
        ...(await 몰래표()),
      })
      try {
        const k = 'kcm_qna_mine'
        const v = JSON.parse(localStorage.getItem(k) || '[]')
        localStorage.setItem(k, JSON.stringify([...v, slot.key].slice(-100)))
      } catch (e) { /* 사생활 모드 */ }
      askWrote()
      try { if (window.gtag) window.gtag('event', 'tool_talk_sent', { tool: 이름 }) } catch (e) { /* 광고차단기 */ }
      set끝(slot.key); set글('')
      if (Array.isArray(목록)) 읽기()
    }
  }

  return (
    <div className="card dy">
      <div className="detail-h">{아이콘} 이 도구 이야기 <span className="dy-sub">묻고 답하기 · 맵톡에 함께 올라갑니다</span></div>
      <p className="tl-p muted">쓰다가 막힌 곳 · 결과가 이상한 곳 · 더 있었으면 하는 것을 남겨 주십시오. 현장 사람들과 건설맵이 답합니다(글 끝에 이 도구 주소가 붙습니다).</p>
      {끝 ? (
        <div className="dy-done">고맙습니다 🙏 맵톡에 올라갔습니다. 답이 달리면 거기에 붙습니다. <Link to={`/qna/${encodeURIComponent(끝)}`}>맵톡에서 내 글 보기 →</Link> <button type="button" className="btn ghost sm" style={{ width: 'auto' }} onClick={() => set끝('')}>한 줄 더 쓰기</button></div>
      ) : (
        <>
          <textarea className="inp dy-ta" value={글} maxLength={2000} rows={3} onChange={(e) => set글(e.target.value)} placeholder={`${이름} — 묻고 싶은 것 · 고쳤으면 하는 것 (첫 줄이 제목이 됩니다)`} />
          {탈 && <div className="dy-err">{탈}</div>}
          <div className="kt-btns"><button type="button" className="btn sm" style={{ width: 'auto' }} disabled={보냄 || 글.trim().length < 2} onClick={올리기}>{보냄 ? '올리는 중…' : '💬 맵톡에 올리기'}</button></div>
        </>
      )}
      <div className="dy-list">
        {목록 === null && <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={읽기}>📜 이 도구 이야기 보기</button>}
        {못읽음 && <span className="dy-err"> 지금은 읽지 못했습니다 — 잠시 뒤 다시 눌러 주십시오.</span>}
        {목록 === 'load' && <span className="muted">불러오는 중…</span>}
        {Array.isArray(목록) && (목록.length ? (
          <ul>
            {목록.map((r) => (
              <li key={r.id}>
                <Link to={`/qna/${encodeURIComponent(r.id)}`}>{갈래떼기(r.t).t.slice(이야기머리(이름).length)}</Link>
                <span className="dy-meta">{r.nick || ''} · {날(r.at)}{r.답 ? ' · 답 ' + r.답 : ' · 답 기다림'}</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted">아직 이야기가 없습니다 — 첫 질문을 남겨 주십시오.</p>)}
      </div>
    </div>
  )
}
