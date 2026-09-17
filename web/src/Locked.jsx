/**
 * 🔒 잠금 화면 — /jeoksan/run · /jeoksan/lab 이 같이 씁니다 (2026-09-17)
 *
 * 소장님: 「적산이 올라 왔던데, 이용자 들이 사용하게 하면 안돼.」
 *   /jeoksan/lab 은 잠가 두었는데 /jeoksan/run 은 «누구나» 쓸 수 있게 열려 있었습니다.
 *   제 잘못입니다. 두 화면이 같은 잠금을 쓰도록 여기 한 곳으로 모읍니다 —
 *   따로 두면 한쪽만 잠그는 오늘 같은 일이 또 납니다.
 *
 * ⚠️ 이것은 «보안» 이 아닙니다 (lib/gate.js 주석 참고).
 *    지나가던 사람이 못 들어오게 하는 것뿐입니다.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isOpen, tryOpen, close } from './lib/gate.js'

export default function Locked({ children, back = '/jeoksan', backLabel = '← K-적산으로' }) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [bad, setBad] = useState(false)
  useEffect(() => { setOpen(isOpen()) }, [])

  if (open) return children(() => { close(); setOpen(false) })

  return (
    <div className="card" style={{ maxWidth: 460, margin: '40px auto' }}>
      <div className="sec-title">🔒 잠겨 있습니다</div>
      <p className="muted" style={{ marginTop: 0 }}>
        아직 시험 중인 화면입니다. 열쇠말이 있어야 들어옵니다.
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
        <button className="btn primary" type="submit" style={{ width: '100%' }}>열기</button>
      </form>
      {bad && <div className="cwarn" style={{ marginTop: 10 }}>열쇠말이 다릅니다.</div>}
      <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        <Link to={back}>{backLabel}</Link>
      </div>
    </div>
  )
}
