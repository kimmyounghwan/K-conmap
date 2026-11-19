import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as H from '../lib/내현장.js'
import { 단계들, 했음열쇠, 진행, 지금단계 } from '../lib/공무차례.js'
import { 세기 } from '../lib/받은수.jsx'
import 내현장칸 from '../tools/내현장칸.jsx'
import 도구설명 from '../tools/도구설명.jsx'

/**
 * 🧰 G784 (2026-11-19) 공무 올인원 — 착공부터 준공까지 건설맵 도구를 한 곳에서 차례대로(/tools/gongmu)
 *   소장님 「하나로 연결시켜서 도구화 가능해」 → 「우리가 할 수 있는 것만 하고, 못하는 거는 제외해」 「못한다고는 하지 말고」
 *   ■ 맨 위 = 마이컨맵 «내 현장 · 내 일»(tools/내현장칸.jsx 그대로 — 현장 적기 · 바꾸기 · 할 일 날짜)
 *   ■ 아래 = 단계 셋(lib/공무차례.js) — 도구마다 «열기 →» · ✓ 했음(그 현장에 · 이 기기에만) · 이 현장 값이 먼저 들어가는 칸 표시
 *   ■ 숨은 셈: |공무|<도구>(열기) · |공무|했음
 */
export default function Gongmu() {
  const [d, setD] = useState(() => H.읽기())
  useEffect(() => { document.title = '공무 올인원 — 착공부터 준공까지 한 곳에서 | K-건설맵' }, [])
  /* 내 현장 칸에서 현장을 적거나 바꾸면(lib/내현장.js «kcm-내현장» 사건) 단계 ✓ 도 그 현장 것으로 */
  useEffect(() => {
    const f = () => setD(H.읽기())
    window.addEventListener(H.바뀜사건, f); window.addEventListener('storage', f)
    return () => { window.removeEventListener(H.바뀜사건, f); window.removeEventListener('storage', f) }
  }, [])
  const 현장 = H.지금현장(d)
  const 오늘 = H.오늘날()
  const 진 = 진행(현장)
  const 지금 = 지금단계(현장, 오늘)
  const 했음들 = new Set(현장 ? 현장.했음 : [])
  const 표 = (t) => { if (!현장) return; const 켬 = !했음들.has(했음열쇠(t.id)); H.했음바꿈(현장.id, 했음열쇠(t.id), 켬); if (켬) 세기('|공무|했음'); setD(H.읽기()) }

  return (
    <div className="wrap gmu">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🧰 공무 올인원 — 착공부터 준공까지 한 곳에서</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          현장을 한 번 적어 두면 착공 전 계획서부터 공사 중 물량 · 설계변경 · 물가변동, 준공 서류까지 차례대로 이 한 곳에서 엽니다.
          서식은 이 현장의 공사명 · 금액 · 날짜가 먼저 들어가고(예정공정표는 내역서를 넣을 때 착공 · 준공), 끝낸 일은 ✓ 해 두면 현장마다 남습니다.
        </p>
      </div>

      <div className="gmu-site"><내현장칸 /></div>

      <section className="gmu-steps" aria-labelledby="gmu-h">
        <h2 className="mc-dh" id="gmu-h">🧭 공무 차례 <small>{현장 ? `«${현장.현장}» ✓ ${진.한} / ${진.다}` : '현장을 적으면 ✓ 가 현장마다 남습니다'}</small></h2>
        <div className="gmu-grid">
          {단계들.map((s) => {
            const p = 진.단계.find((x) => x.k === s.k)
            return (
              <div key={s.k} className={'card gmu-step' + (현장 && 지금 === s.k ? ' now' : '')}>
                <div className="gmu-sh">
                  <h3>{s.이름}{현장 && 지금 === s.k && <span className="gmu-now">지금</span>}</h3>
                  {현장 && <span className="gmu-cnt" aria-label={`${s.이름} ${p.한} / ${p.다} 했음`}>✓ {p.한} / {p.다}</span>}
                </div>
                <p className="gmu-sl">{s.한줄}</p>
                <ul className="gmu-list">
                  {s.도구.map((t) => {
                    const 했 = 했음들.has(했음열쇠(t.id))
                    return (
                      <li key={t.id} className={'gmu-item' + (했 ? ' done' : '')}>
                        <Link className="gmu-go" to={t.주소} onClick={() => 세기('|공무|' + t.id)}>
                          <span className="gmu-ic" aria-hidden="true">{t.아이콘}</span>
                          <span className="gmu-tx"><b>{t.이름}</b><small>{t.한줄}</small>{현장 && t.현장값 && <em className="gmu-val">🏗 이 현장 {t.현장값}</em>}</span>
                          <span className="gmu-arrow" aria-hidden="true">→</span>
                        </Link>
                        {현장 && (
                          <button type="button" className={'gmu-chk' + (했 ? ' on' : '')} aria-pressed={했} aria-label={`${t.이름} ${했 ? '했음 — 누르면 되돌림' : '했으면 누르기'}`} onClick={() => 표(t)}>
                            {했 ? '✓ 했음' : '✓'}
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <도구설명 k="gongmu" />
    </div>
  )
}
