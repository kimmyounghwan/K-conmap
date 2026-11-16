/* 📰 맵톡 뉴스 글 카드 (2026-11-16 · 소장님 「좀 이상하지 않아. 뭔가 부실해 보이고 다른 방법 없어?」 → 「우선 만들어 보자. 그리고 한 번 보고 판단 하자」)
 *   운영자 뉴스 글(제목이 📰 — Qna.jsx 뉴스글인가)을 열면 글자 세 줄 대신 그날 뉴스 자료(public/newsd/{날}.json · lib/건설뉴스.js)로 카드:
 *     👷 오늘 현장 한마디(사고 꼭지의 짧은 현장 말) → 갈래별(⚠️ 사고 · 📜 정책 · 💡 정보) 꼭지마다 제목 · 요약(두 줄까지 — 소장님 「요약2줄로」) · 매체 · 날짜 · «원문 ›» → «N건 전체 보기 ›»
 *   ■ 날짜: 제목 «📰 건설뉴스 — 11. 16.(월)» 의 월 · 일 + 글 쓴 때(at, 한국 시간)의 해
 *   ■ 자료를 못 받으면(없는 날 · 꼴 틀림 · 8초 넘김) 예전처럼 글자 그대로 — 뒤로 물러남
 *   ■ 원문 주소는 뉴스 자료에서만(https · 새 창 · nofollow) — 글 본문 글자는 링크로 바꾸지 않음
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 날뉴스받기, 갈래묶기, 갈래이름, 갈래그림, 갈래표, 날인가 } from './lib/건설뉴스.js'

/** 뉴스 글 → 그날 'YYYY-MM-DD'(못 읽으면 '') */
export function 뉴스날(row) {
  const m = String((row && row.t) || '').match(/(\d{1,2})\s*\.\s*(\d{1,2})\s*\./)
  if (!m) return ''
  const 때 = new Date(((row && row.at) || Date.now()) + 9 * 3600000)
  let y = 때.getUTCFullYear()
  const mm = Number(m[1]), dd = Number(m[2])
  /* 1월 초에 쓴 «12. 31.» 글이면 지난해 */
  if (mm === 12 && 때.getUTCMonth() === 0) y -= 1
  const d = `${y}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`
  return 날인가(d) ? d : ''
}

const 짧은날 = (d) => (날인가(d) ? `${Number(d.slice(5, 7))}. ${Number(d.slice(8, 10))}.` : '')

export default function 뉴스카드({ row, 글 }) {
  const d = 뉴스날(row)
  const [자, set자] = useState(null)        // null 받는 중 · false 못 받음 · { d, items }
  useEffect(() => {
    let 살음 = true
    if (!d) { set자(false); return undefined }
    set자(null)
    Promise.race([날뉴스받기(d), new Promise((res) => setTimeout(() => res(false), 8000))])
      .then((j) => { if (살음) set자(j && j.d === d && j.items.length ? j : false) })
      .catch(() => { if (살음) set자(false) })
    return () => { 살음 = false }
  }, [d])
  if (!d || 자 === false) return <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.85, fontSize: 14 }}>{글}</div>
  if (자 === null) return <div className="nc-wait">📰 오늘 뉴스 불러오는 중…</div>
  const 한마디 = 자.items.find((x) => x.c === '사고' && x.kk) || 자.items.find((x) => x.kk)
  return (
    <div className="nc">
      {한마디 && (
        <p className="nc-one"><b>👷 오늘 현장 한마디</b><span>{한마디.kk}</span></p>
      )}
      {갈래묶기(자.items).map(([c, a]) => (
        <section key={c} className={'nc-sec nc-' + 갈래표[c]} aria-label={갈래이름[c]}>
          <h4 className="nc-h"><span aria-hidden="true">{갈래그림[c]}</span> {갈래이름[c]} <em>{a.length}</em></h4>
          {a.map((x, i) => (
            <article key={c + i} className="nc-it">
              <p className="nc-t">{x.t}</p>
              {x.s && <p className="nc-s">{x.s}</p>}
              <p className="nc-o">
                {x.m}{x.md && <> · {짧은날(x.md)}</>}
                {x.u && <> · <a href={x.u} target="_blank" rel="noopener noreferrer nofollow">원문 ›</a></>}
              </p>
            </article>
          ))}
        </section>
      ))}
      <Link className="nc-all" to={`/news/${d}`}>📰 {자.items.length}건 전체 보기 · 현장에선? ›</Link>
      <p className="nc-talk">이 글에 답글로 이야기 나눠요.</p>
    </div>
  )
}
