import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as H from '../lib/내현장.js'
import { 날더하기 } from '../lib/계약셈.js'
import { 단계들, 했음열쇠, 진행, 지금단계 } from '../lib/공무차례.js'
import { 세기, 예시본수 } from '../lib/받은수.jsx'
import { isOpen, tryOpen } from '../lib/gate.js'
import { 나운영자 } from '../lib/운영자.js'
import 잠금문의 from '../잠금문의.jsx'
import { 열림띠, 손님보기켬 } from '../예시한도.jsx'
import 내현장칸 from '../tools/내현장칸.jsx'
import 도구설명 from '../tools/도구설명.jsx'

/**
 * 🧰 G784 (2026-11-19) 공무 올인원 — 착공부터 준공까지 건설맵 도구를 한 곳에서 차례대로(/tools/gongmu)
 *   소장님 「하나로 연결시켜서 도구화 가능해」 → 「우리가 할 수 있는 것만 하고, 못하는 거는 제외해」 「못한다고는 하지 말고」
 *   ■ 맨 위 = 마이컨맵 «내 현장 · 내 일»(tools/내현장칸.jsx 그대로 — 현장 적기 · 바꾸기 · 할 일 날짜)
 *   ■ 아래 = 단계 셋(lib/공무차례.js) — 도구마다 «열기 →» · ✓ 했음(그 현장에 · 이 기기에만) · 이 현장 값이 먼저 들어가는 칸 표시
 *   ■ 숨은 셈: |공무|<도구>(열기) · |공무|했음 · |공무|예시 · |공무|열쇠 · |잠금문의|공무
 * 🔒 G784b (11-19) 소장님 「공무 올인원은 예시만 보여주고 막아 줘」 — 잠근 도구(G690 꼴 · 예시한도.jsx)
 *   ■ 씀 = 소장님 기기(lib/운영자.js 나운영자) · 열쇠말(lib/gate.js) — 그 밖의 분은 🔒 문의 상자 + 🧪 예시(지어낸 현장 · 보기만)
 *   ■ 손님 예시: 내 현장 칸 · ✓ 단추 · 도구 고리 없음(글만) · 단계 셋 · «🔒 예시는 보기만 …» 알림(kcm-예시끝) · 소장님 기기엔 🔑 열림띠(👀 손님 화면으로 보기)
 */

/** 손님 예시 — 지어낸 현장(○○) · 오늘 기준 착공 40일 뒤 공사 중 · ✓ 다섯 */
function 예시현장(오늘) {
  return { id: 'h예시', 현장: '○○지구 배수로 정비공사(예시)', 발주: '○○시', 계약금액: 1250000000, 착공: 날더하기(오늘, -40), 준공: 날더하기(오늘, 200), 했음: ['sigong', 'schedule', 'anjeon', 'daejang', 'jeoksan'].map(했음열쇠) }
}

export default function Gongmu() {
  const [d, setD] = useState(() => H.읽기())
  const [씀원, set씀] = useState(() => isOpen())
  const 손님보기 = 손님보기켬()   // 👀 G690 소장님 기기에서 «손님 화면으로 보기»(이 탭만)
  const 씀 = 씀원 && !손님보기
  const [예시, set예시] = useState(false)
  const [열쇠말, set열쇠말] = useState('')
  const [열쇠틀림, set열쇠틀림] = useState(false)
  useEffect(() => { document.title = '공무 올인원 — 착공부터 준공까지 한 곳에서 | K-건설맵' }, [])
  useEffect(() => { let 살 = true; 나운영자().then((v) => { if (살 && v) set씀(true) }).catch(() => {}); return () => { 살 = false } }, [])
  /* 내 현장 칸에서 현장을 적거나 바꾸면(lib/내현장.js «kcm-내현장» 사건) 단계 ✓ 도 그 현장 것으로 */
  useEffect(() => {
    const f = () => setD(H.읽기())
    window.addEventListener(H.바뀜사건, f); window.addEventListener('storage', f)
    return () => { window.removeEventListener(H.바뀜사건, f); window.removeEventListener('storage', f) }
  }, [])
  const 오늘 = H.오늘날()
  const 현장 = 씀 ? H.지금현장(d) : (예시 ? 예시현장(오늘) : null)
  const 표 = (t) => { if (!씀 || !현장) return; const 켬 = !현장.했음.includes(했음열쇠(t.id)); H.했음바꿈(현장.id, 했음열쇠(t.id), 켬); if (켬) 세기('|공무|했음'); setD(H.읽기()) }
  const 예시보기 = () => { set예시(true); 세기('|공무|예시') }

  return (
    <div className="wrap gmu">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🧰 공무 올인원 — 착공부터 준공까지 한 곳에서</h1>
        <p className="cp" style={{ margin: '6px 0 0' }}>
          현장을 한 번 적어 두면 착공 전 계획서부터 공사 중 물량 · 설계변경 · 물가변동, 준공 서류까지 차례대로 이 한 곳에서 엽니다.
          서식은 이 현장의 공사명 · 금액 · 날짜가 먼저 들어가고(예정공정표는 내역서를 넣을 때 착공 · 준공), 끝낸 일은 ✓ 해 두면 현장마다 남습니다.
        </p>
        {!씀 && (
          <div className="sg-lock">
            <b>🔒 문의해 주세요</b> — 착공부터 준공까지 공무 서류는 K-건설맵이 직접 작성해 드립니다(견본 먼저 · 최저가). <잠금문의 도구="공무 올인원" 셈="공무" />
            {' '}<button type="button" className="btn line sm" style={{ width: 'auto', margin: '0 2px' }} onClick={예시보기}>🧪 예시 보기</button>로 어떤 화면인지 보실 수 있습니다(보기만).
            {' '}<예시본수 열쇠="|공무|예시" />
            <details className="sg-more sg-more-sm" style={{ marginTop: 6 }}>
              <summary className="muted" style={{ fontSize: 12.5 }}>🔑 열쇠말이 있으신가요?</summary>
              <form style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }} onSubmit={async (e) => {
                e.preventDefault()
                const ok = await tryOpen(열쇠말)
                set열쇠틀림(!ok)
                if (ok) { set씀(true); set예시(false); 세기('|공무|열쇠') }
              }}>
                <input type="password" value={열쇠말} onChange={(e) => { set열쇠말(e.target.value); set열쇠틀림(false) }} placeholder="열쇠말" style={{ flex: '1 1 160px', padding: '8px 10px' }} />
                <button className="btn line sm" type="submit" style={{ width: 'auto' }}>열기</button>
              </form>
              {열쇠틀림 && <div className="cwarn" style={{ marginTop: 6 }}>열쇠말이 다릅니다.</div>}
            </details>
          </div>
        )}
      </div>
      <열림띠 열림={씀원} 손님보기={손님보기} />

      {씀 && <div className="gmu-site"><내현장칸 /></div>}

      {!씀 && !예시 && (
        <div className="card gmu-start">
          <b>이런 화면입니다</b>
          <ul className="muted">
            <li>🏗 <b>내 현장</b> — 공사명 · 발주 · 금액 · 착공일 · 준공일을 한 번 적으면 계약 뒤 할 일 날짜가 오늘 기준으로 나옵니다</li>
            <li>🧭 <b>공무 차례</b> — ① 착공 전 · ② 공사 중 · ③ 준공, 단계마다 쓰는 도구를 차례대로 열고 «지금» 할 단계가 표시됩니다</li>
            <li>✓ <b>했음</b> — 끝낸 일은 ✓ 해 두면 현장마다 남고, 서식은 이 현장 값이 먼저 들어갑니다</li>
          </ul>
        </div>
      )}

      {!씀 && 예시 && (
        <div className="card gmu-ex">
          <div className="gmu-ex-h">🧪 예시 — <b>{현장.현장}</b> · {현장.발주} · {Number(현장.계약금액).toLocaleString('ko-KR')}원 · {H.날보기(현장.착공, false)} ~ {H.날보기(현장.준공, false)}</div>
          <div className="kcm-예시끝 cwarn" role="note">
            🔒 예시는 <b>보기만</b> 됩니다(지어낸 현장) — 내 현장 적기 · ✓ 기록 · 도구 바로 열기는 K-건설맵에 문의해 주세요.{' '}
            <잠금문의 도구="공무 올인원" 셈="공무" />
          </div>
        </div>
      )}

      {(씀 || 예시) && <차례판 현장={현장} 오늘={오늘} 보기만={!씀} 표={표} />}

      <도구설명 k="gongmu" />
    </div>
  )
}

/** 공무 차례 — 단계 셋 · 도구 줄(씀: 고리 + ✓ 단추 / 보기만: 글 + ✓ 표시만) */
function 차례판({ 현장, 오늘, 보기만, 표 }) {
  const 진 = 진행(현장)
  const 지금 = 지금단계(현장, 오늘)
  const 했음들 = new Set(현장 ? 현장.했음 : [])
  return (
    <section className={'gmu-steps' + (보기만 ? ' gmu-ro' : '')} aria-labelledby="gmu-h">
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
                  const 몸 = (
                    <>
                      <span className="gmu-ic" aria-hidden="true">{t.아이콘}</span>
                      <span className="gmu-tx"><b>{t.이름}</b><small>{t.한줄}</small>{현장 && t.현장값 && <em className="gmu-val">🏗 이 현장 {t.현장값}</em>}</span>
                      {!보기만 && <span className="gmu-arrow" aria-hidden="true">→</span>}
                    </>
                  )
                  return (
                    <li key={t.id} className={'gmu-item' + (했 ? ' done' : '')}>
                      {보기만
                        ? <span className="gmu-go">{몸}</span>
                        : <Link className="gmu-go" to={t.주소} onClick={() => 세기('|공무|' + t.id)}>{몸}</Link>}
                      {현장 && (보기만
                        ? <span className={'gmu-chk' + (했 ? ' on' : '')} aria-label={`${t.이름} ${했 ? '했음' : '안 함'}(예시)`}>{했 ? '✓ 했음' : '✓'}</span>
                        : <button type="button" className={'gmu-chk' + (했 ? ' on' : '')} aria-pressed={했} aria-label={`${t.이름} ${했 ? '했음 — 누르면 되돌림' : '했으면 누르기'}`} onClick={() => 표(t)}>
                          {했 ? '✓ 했음' : '✓'}
                        </button>)}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
