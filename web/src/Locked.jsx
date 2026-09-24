/**
 * 🔒 잠금 화면 — /jeoksan/run · /jeoksan/lab 이 같이 씁니다 (2026-09-17)
 *
 * 소장님: 「적산이 올라 왔던데, 이용자 들이 사용하게 하면 안돼.」 → 두 화면 다 잠급니다.
 *         「보여는 주되, 비번을 사용하게 하면 돼지 않아? 그리고, 문의할 수 있게 해줘야지?
 *          그래야 고객이 나에게 말을 하지...게시판에 글도 생기고..」
 *
 * ■ 그래서 «빈 열쇠말 칸» 만 두지 않습니다.
 *   무엇을 하는 것인지 «보여 주고», 그 아래 열쇠말 칸을 두고,
 *   열쇠말이 없는 분께는 «물어볼 자리» 를 줍니다.
 *   잠긴 화면이 곧 소개 화면이자 문의 창구가 됩니다.
 *
 * ■ 두 갈래로 씁니다
 *   lead 가 있으면  — 소개 + 열쇠말 + 문의  (/jeoksan/run: 값을 받을 물건)
 *   lead 가 없으면  — 열쇠말만            (/jeoksan/lab: 소장님 실험실, 광고할 것이 없음)
 *
 * ⚠️ 이것은 «보안» 이 아닙니다 (lib/gate.js 주석 참고).
 *    지나가던 사람이 못 쓰게 하는 것뿐입니다. 값을 받게 되면 서버에서 막아야 합니다.
 * ⚠️ 값(얼마)은 여기 적지 않습니다. 정하지 않은 숫자를 화면에 박지 않습니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isOpen, tryOpen, close } from './lib/gate.js'
import { 나운영자 } from './lib/운영자.js'

export default function Locked({
  children,
  back = '/jeoksan',
  backLabel = '← K-적산으로',
  title = '',          /* 잠겨 있어도 «무엇인지» 는 보여 줍니다 */
  lead = null,         /* 무엇이 나오는지 — 있으면 소개 화면이 됩니다 */
  ask = '',            /* 사랑방에 미리 적어 둘 한 줄 */
}) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [bad, setBad] = useState(false)
  /* 🔑 2026-09-24 — 소장님: 「난 기억이 없지? 그럼 적산을 시험해 볼 수가 없잖아」
     열쇠말이 어디에도 적혀 있지 않았습니다(제 잘못 — _열쇠메모.md 에 적었어야 했습니다).
     그래서 «소장님 브라우저» 면 열쇠말 없이 엽니다 — 공내역서 채우기(/jeoksan/fill)와 같은 운영자 확인입니다.
     남(이용자)에게는 전처럼 열쇠말 칸이 나옵니다. */
  useEffect(() => {
    setOpen(isOpen())
    let 살 = true
    나운영자().then((v) => { if (살 && v) setOpen(true) }).catch(() => {})
    return () => { 살 = false }
  }, [])

  if (open) return children(() => { close(); setOpen(false) })

  const gate = (
    <div className="card" style={{ maxWidth: 460, margin: lead ? '0 auto 10px' : '40px auto' }}>
      <div className="sec-title">🔒 열쇠말이 있어야 씁니다</div>
      <p className="muted" style={{ marginTop: 0 }}>
        {lead
          ? '아직 여는 중입니다. 열쇠말을 받으신 분만 쓰실 수 있습니다.'
          : '아직 시험 중인 화면입니다. 열쇠말이 있어야 들어옵니다.'}
      </p>
      <form onSubmit={async (e) => {
        e.preventDefault()
        const ok = await tryOpen(word)
        setBad(!ok); setOpen(ok)
      }}>
        <input type="password" value={word} autoFocus
          onChange={(e) => { setWord(e.target.value); setBad(false) }}
          placeholder="열쇠말"
          style={{ width: '100%', padding: '10px 12px', fontSize: 15, marginBottom: 10 }} />
        <button className="btn line" type="submit" style={{ width: '100%' }}>열기</button>
      </form>
      {bad && <div className="cwarn" style={{ marginTop: 10 }}>열쇠말이 다릅니다.</div>}

      {lead && (
        <div style={{ marginTop: 14, borderTop: '1px dashed var(--line)', paddingTop: 12 }}>
          <b style={{ fontSize: 13.5 }}>열쇠말이 없으신가요?</b>
          <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 10px', lineHeight: 1.7 }}>
            한 줄만 남겨 주시면 연락드리겠습니다. 어느 쪽이든 좋습니다.
          </p>
          <div style={{ display: 'grid', gap: 6 }}>
            <Link className="btn line" style={{ textDecoration: 'none' }}
              to={'/qna' + (ask ? '?ask=' + encodeURIComponent(ask) : '')}>
              💬 사랑방에 남기기 <span className="muted" style={{ fontWeight: 400 }}>— 누구나 보는 자리</span>
            </Link>
            <Link className="btn ghost" style={{ textDecoration: 'none' }} to="/naeyeok#ask">
              📋 문의함으로 보내기 <span className="muted" style={{ fontWeight: 400 }}>— 아무에게도 안 보입니다</span>
            </Link>
          </div>
        </div>
      )}

      <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        <Link to={back}>{backLabel}</Link>
      </div>
    </div>
  )

  if (!lead) return gate

  return (
    <div className="wrap">
      <div className="card outline">
        <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
        <div className="muted" style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.75 }}>
          아직 여는 중입니다 — 무엇이 나오는지 먼저 보십시오.
        </div>
      </div>
      {lead}
      {gate}
    </div>
  )
}
