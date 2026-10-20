/* ✍️ G346 (2026-10-21) 서식 «사이트에서 작성 → PDF»
 *   소장님: 「사이트에서 직접 만들게 할 수 있는 건 사이트에서 만들게 해야 해」 · 「pdf로 줘야 하지 않을까? 엑셀로 주면 다시 안오잖아」
 *          → 고르심 «안전서류 = 사이트에서 작성 → PDF(엑셀 안 줌) · 공무 서식 = 엑셀 그대로»
 *   ■ forms.json 서식(sheet.blocks)을 그대로 칸으로 펼칩니다 — 서식마다 화면을 따로 짜지 않습니다(새 안전서식 · 옛 서식 모두).
 *     kv(이름 · 값) · table(표 · 줄 더하기) · chk(점검 항목 → 양호 · 불량 · 해당없음 + 조치) · cl(확인 목록 ☐) · text(안내) · sign(날짜 · 서명란)
 *   ■ PDF: 인쇄 창 → «PDF로 저장»(폰은 공유 → 인쇄 → PDF). 종이는 #fw-인쇄(몸에 바로 붙임 · 화면에는 안 보임)만 찍힙니다.
 *   ■ 쓴 것은 이 기기에 남습니다(localStorage · 서버로 안 감) — 쓰던 것 저절로 · «💾 저장»(이름 붙여 여러 벌) · «불러오기 · 복사해 새로».
 *     공사명 · 현장명 · 회사명 · 작성자는 한 번 쓰면 다른 서식에도 먼저 채웁니다(kcm.서식공통).
 *   ■ 개인정보: 주민등록번호 칸은 두지 않습니다(이 기기에 남지 않게) — 필요한 서식은 «제출 서식에 직접» 이라고 적음.
 *   ■ 숨은 누적: |서식작성|열기 · |서식작성|PDF · |서식작성|저장 · |서식작성|예시 · PDF 는 받은 횟수(/forms/w/{slug}.pdf)에도 1.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { 받음, 세기 } from '../lib/받은수.jsx'

const 쓴열쇠 = 'kcm.서식작성'
const 공통열쇠 = 'kcm.서식공통'
const 읽기 = (k, 없으면) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? 없으면 : v } catch (e) { return 없으면 } }
const 쓰기 = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch (e) { return false } }
const 오늘 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
const 날짜글 = (d) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : '        년        월        일' }

/* 한 번 쓰면 다른 서식에도 — 이름표로 알아봄 */
const 공통칸 = [
  ['현장', /^(공\s*사\s*명|현\s*장\s*명|공사\s*·\s*현장)/],
  ['회사', /^(회\s*사\s*명|업\s*체\s*명|시\s*공\s*사|상\s*호|소\s*속\s*회\s*사)/],
  ['작성', /^(작\s*성\s*자)/],
]
const 공통이름 = (label) => { const s = String(label || '').trim(); const x = 공통칸.find(([, re]) => re.test(s)); return x ? x[0] : null }

const 결과들 = ['양호', '불량', '해당없음']
const 결과표 = { 양호: '○', 불량: '×', 해당없음: '－' }

/** 표의 줄 수 — 미리 적힌 줄(rows)이 있으면 그만큼, 없으면 n(없으면 5) */
const 줄수 = (b) => Math.max(b.rows && b.rows.length ? b.rows.length : 0, b.n || (b.rows && b.rows.length ? 0 : 5))

/** 빈 값 — 블록마다 */
export function 빈값(sheet, 공통 = {}) {
  return (sheet.blocks || []).map((b) => {
    if (b.t === 'kv') return b.rows.map((r) => { const c = 공통이름(r[0]); return (c && 공통[c]) || '' })
    if (b.t === 'table') return Array.from({ length: 줄수(b) }, (_, j) => b.cols.map((_, k) => (b.rows && b.rows[j] && b.rows[j][k]) || ''))
    if (b.t === 'chk') return b.items.map(() => ({ r: '', m: '' }))
    if (b.t === 'cl') return b.items.map(() => false)
    if (b.t === 'sign') return { d: 오늘(), n: b.who.map(() => '') }
    return null
  })
}

/** 저장된 값이 서식과 모양이 맞나(서식을 고친 뒤 옛 값이면 버림) */
function 맞는꼴(sheet, v) {
  if (!Array.isArray(v) || v.length !== (sheet.blocks || []).length) return false
  return sheet.blocks.every((b, i) => {
    const x = v[i]
    if (b.t === 'kv') return Array.isArray(x) && x.length === b.rows.length
    if (b.t === 'table') return Array.isArray(x) && x.every((r) => Array.isArray(r) && r.length === b.cols.length)
    if (b.t === 'chk') return Array.isArray(x) && x.length === b.items.length
    if (b.t === 'cl') return Array.isArray(x) && x.length === b.items.length
    if (b.t === 'sign') return x && typeof x === 'object' && Array.isArray(x.n) && x.n.length === b.who.length
    return true
  })
}

/* ── 종이(인쇄) — 값을 글자로 ─────────────────────────────── */
function 종이({ f, v }) {
  const s = f.sheet
  const 끝 = s.blocks.length - 1
  const 근거안 = !!f.law && s.blocks[끝] && s.blocks[끝].t === 'sign'   /* 근거 줄이 혼자 다음 쪽으로 넘어가지 않게 서명칸 안에 */
  return (
    <div className="fw-paper">
      <div className="fw-mark">K-건설맵 · k-conmap.com</div>
      <h1 className="fw-h">{s.heading}</h1>
      {s.blocks.map((b, i) => {
        const x = v[i]
        if (b.t === 'kv') {
          return (
            <table className={'fw-kv' + (b.rows.length <= 8 ? ' keep' : '')} key={i}><tbody>
              {b.rows.map((r, j) => (
                <tr key={j} className={r[2] === 'L' ? 'long' : ''}><th>{r[0]}</th><td>{x[j]}</td></tr>
              ))}
            </tbody></table>
          )
        }
        if (b.t === 'table') {
          const w = b.w && b.w.length === b.cols.length ? b.w : null
          return (
            <table className={'fw-grid' + (x.length <= 8 ? ' keep' : '')} key={i}>
              {b.cap && <caption>{b.cap}</caption>}
              {w && <colgroup>{w.map((p, k) => <col key={k} style={{ width: p + '%' }} />)}</colgroup>}
              <thead><tr>{b.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>{x.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{c}</td>)}</tr>)}</tbody>
            </table>
          )
        }
        if (b.t === 'chk') {
          return (
            <table className="fw-grid fw-chk" key={i}>
              {b.cap && <caption>{b.cap}</caption>}
              <colgroup><col style={{ width: '7%' }} /><col style={{ width: '55%' }} /><col style={{ width: '12%' }} /><col style={{ width: '26%' }} /></colgroup>
              <thead><tr><th>번호</th><th>{b.head || '점검 항목'}</th><th>결과</th><th>조치 사항</th></tr></thead>
              <tbody>{b.items.map((it, j) => (
                <tr key={j}><td className="c">{j + 1}</td><td>{it}</td><td className="c">{결과표[x[j].r] || ''}</td><td>{x[j].m}</td></tr>
              ))}</tbody>
            </table>
          )
        }
        if (b.t === 'cl') {
          return (
            <div className="fw-cl" key={i}>
              {b.items.map(([head, body], j) => (
                <div key={j} className="fw-cl-i"><b>{x[j] ? '☑' : '☐'} {head}</b>{body && <p>{body}</p>}</div>
              ))}
            </div>
          )
        }
        if (b.t === 'text') return <p className="fw-text" key={i}>{b.text}</p>
        if (b.t === 'sign') {
          return (
            <div className="fw-sign" key={i}>
              <div className="fw-date">{날짜글(x.d)}</div>
              {b.who.map((w, j) => (
                <div key={j} className="fw-who"><b>{w}</b><span className="nm">{x.n[j]}</span><span className="si">(서명 또는 인)</span></div>
              ))}
              {b.note && <div className="fw-note">{b.note}</div>}
              {근거안 && i === 끝 && <div className="fw-law">근거 · {f.law}</div>}
            </div>
          )
        }
        return null
      })}
      {f.law && !근거안 && <div className="fw-law">근거 · {f.law}</div>}
    </div>
  )
}

/* ── 칸(화면) ─────────────────────────────── */
function 늘칸({ value, onChange, long, hint, label }) {
  const r = useRef(null)
  useEffect(() => { const t = r.current; if (t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight + 2, 640) + 'px' } }, [value])
  return <textarea ref={r} className={'fw-in' + (long ? ' long' : '')} rows={long ? 3 : 1} value={value} placeholder={hint || ''}
    aria-label={label} onChange={(e) => onChange(e.target.value)} />
}

export default function 서식작성({ f }) {
  const s = f.sheet
  const 공통0 = useMemo(() => 읽기(공통열쇠, {}), [])
  const 전체0 = useMemo(() => 읽기(쓴열쇠, {}), [])
  const 내것0 = 전체0[f.slug] || {}
  const [v, setV] = useState(() => (맞는꼴(s, 내것0.cur) ? 내것0.cur : 빈값(s, 공통0)))
  const [저장들, set저장들] = useState(() => (Array.isArray(내것0.saved) ? 내것0.saved.filter((x) => 맞는꼴(s, x.v)) : []))
  const [목록, set목록] = useState(false)
  const [말, set말] = useState('')
  const [인쇄중, set인쇄중] = useState(false)
  const 셌다 = useRef(false)

  useEffect(() => { if (!셌다.current) { 셌다.current = true; 세기('|서식작성|열기') } }, [])
  /* 쓰던 것 저절로 — 0.6초 뒤 */
  useEffect(() => {
    const t = setTimeout(() => {
      const 전체 = 읽기(쓴열쇠, {})
      전체[f.slug] = { cur: v, saved: 저장들 }
      쓰기(쓴열쇠, 전체)
    }, 600)
    return () => clearTimeout(t)
  }, [v, 저장들, f.slug])
  useEffect(() => { if (!말) return undefined; const t = setTimeout(() => set말(''), 4000); return () => clearTimeout(t) }, [말])

  /* 인쇄 — 몸에 바로 붙인 종이만 */
  useEffect(() => {
    if (!인쇄중) return undefined
    const 옛 = document.title
    const 현장 = (v.find((x, i) => s.blocks[i].t === 'kv') || []).find((x) => x) || ''
    document.title = `${f.title}${현장 ? '_' + String(현장).slice(0, 30) : ''}_${오늘()}`
    document.body.classList.add('fw-인쇄중'); document.documentElement.classList.add('fw-인쇄중')
    const 끝 = () => { document.body.classList.remove('fw-인쇄중'); document.documentElement.classList.remove('fw-인쇄중'); document.title = 옛; set인쇄중(false) }
    const t = setTimeout(() => {
      window.addEventListener('afterprint', 끝, { once: true })
      try { window.print() } catch (e) { 끝() }
      setTimeout(() => { if (document.body.classList.contains('fw-인쇄중')) 끝() }, 60000)
    }, 150)
    return () => { clearTimeout(t); window.removeEventListener('afterprint', 끝) }
  }, [인쇄중])   // eslint-disable-line react-hooks/exhaustive-deps

  /* 블록 하나 고치기 — 새 값 또는 (옛 값 → 새 값) 함수(빨리 칠 때 옛 값을 덮지 않게) */
  const 바꿈 = (i, 새) => setV((o) => o.map((x, k) => (k === i ? (typeof 새 === 'function' ? 새(x) : 새) : x)))
  const kv바꿈 = (i, j, val) => {
    바꿈(i, (o) => o.map((x, k) => (k === j ? val : x)))
    const c = 공통이름(s.blocks[i].rows[j][0])
    if (c) { const 공통 = 읽기(공통열쇠, {}); 공통[c] = String(val).slice(0, 80); 쓰기(공통열쇠, 공통) }
  }
  const 표바꿈 = (i, j, k, val) => 바꿈(i, (o) => o.map((r, a) => (a === j ? r.map((c, b) => (b === k ? val : c)) : r)))
  const 줄더 = (i) => { const b = s.blocks[i]; 바꿈(i, (o) => (o.length >= 60 ? o : [...o, b.cols.map(() => '')])) }
  const 줄빼 = (i) => { const b = s.blocks[i]; 바꿈(i, (o) => (o.length <= 줄수(b) ? o : o.slice(0, -1))) }

  const PDF = () => { 세기('|서식작성|PDF'); 받음(`/forms/w/${f.slug}.pdf`); set인쇄중(true) }
  const 저장 = () => {
    const 이름 = ((v.find((x, i) => s.blocks[i].t === 'kv') || []).find((x) => x) || f.title).slice(0, 30)
    const 새 = [{ id: Date.now().toString(36), nm: 이름, at: Date.now(), v }, ...저장들].slice(0, 30)
    set저장들(새); 세기('|서식작성|저장')
    set말(`💾 «${이름}» 으로 저장했습니다 — 이 기기에만 남습니다`)
  }
  const 불러오기 = (x) => { setV(x.v); set목록(false); set말(`📂 «${x.nm}» 을 불러왔습니다`) }
  const 복사새로 = (x) => {
    const 새 = x.v.map((b, i) => (s.blocks[i].t === 'sign' ? { ...b, d: 오늘() } : b))
    setV(새); set목록(false); set말('📄 날짜만 오늘로 바꿔 새로 씁니다 — 고칠 곳만 고치세요')
  }
  const 지우기 = (x) => set저장들(저장들.filter((y) => y.id !== x.id))
  const 비우기 = () => { setV(빈값(s, 읽기(공통열쇠, {}))); set말('🧹 빈 서식으로 돌렸습니다(현장명 · 회사명은 남김)') }
  const 예시 = () => {
    if (!f.ex || !맞는꼴(s, f.ex)) return
    setV(JSON.parse(JSON.stringify(f.ex))); 세기('|서식작성|예시')
    set말('✍ 가상의 현장으로 채운 작성 예시입니다 — 고쳐 쓰시거나 «빈칸으로» 를 누르세요')
  }
  const 예시있음 = !!(f.ex && 맞는꼴(s, f.ex))

  return (
    <div className="card fw" id="작성">
      <div className="fw-top">
        <div className="sec-title" style={{ margin: 0 }}>✍️ 사이트에서 작성 → PDF</div>
        <div className="fw-sub muted sm">칸을 채우고 <b>🖨 PDF 저장 · 인쇄</b>를 누르세요. 쓴 것은 이 기기에만 남습니다(서버로 안 갑니다).</div>
      </div>
      <div className="fw-bar">
        <button type="button" className="btn primary" onClick={PDF}>🖨 PDF 저장 · 인쇄</button>
        <button type="button" className="btn ghost" onClick={저장}>💾 저장</button>
        <button type="button" className={'btn ghost' + (목록 ? ' on' : '')} onClick={() => set목록(!목록)} aria-expanded={목록}>📂 저장한 것 {저장들.length}</button>
        {예시있음 && <button type="button" className="btn ghost" onClick={예시}>✍ 예시 채우기</button>}
        <button type="button" className="btn ghost" onClick={비우기}>🧹 빈칸으로</button>
      </div>
      {말 && <div className="fw-say" role="status">{말}</div>}
      {목록 && (
        <div className="fw-list">
          {저장들.length === 0 && <div className="muted sm">아직 저장한 것이 없습니다. 다 쓰고 <b>💾 저장</b>을 누르면 여기에 쌓입니다.</div>}
          {저장들.map((x) => (
            <div className="fw-li" key={x.id}>
              <span className="nm">{x.nm}</span>
              <span className="at muted">{new Date(x.at + 9 * 3600e3).toISOString().slice(0, 16).replace('T', ' ')}</span>
              <button type="button" className="btn line sm" onClick={() => 불러오기(x)}>불러오기</button>
              <button type="button" className="btn line sm" onClick={() => 복사새로(x)}>복사해 새로</button>
              <button type="button" className="btn line sm" onClick={() => 지우기(x)} aria-label={`${x.nm} 지우기`}>지우기</button>
            </div>
          ))}
        </div>
      )}

      <div className="fw-form">
        <div className="fw-head">{s.heading}</div>
        {s.blocks.map((b, i) => {
          const x = v[i]
          if (b.t === 'kv') {
            return (
              <div className="fw-kvs" key={i}>
                {b.rows.map((r, j) => (
                  <label className={'fw-kvr' + (r[2] === 'L' ? ' long' : '')} key={j}>
                    <span className="fw-lb">{r[0]}</span>
                    <늘칸 value={x[j]} long={r[2] === 'L'} hint={r[1]} label={r[0]} onChange={(val) => kv바꿈(i, j, val)} />
                  </label>
                ))}
              </div>
            )
          }
          if (b.t === 'table') {
            return (
              <div className="fw-tblw" key={i}>
                {b.cap && <div className="fw-cap">{b.cap}</div>}
                <div className="fw-scroll">
                  <table className="fw-tbl" style={{ minWidth: Math.max(320, b.cols.length * 120) }}>
                    <thead><tr>{b.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                    <tbody>{x.map((r, j) => (
                      <tr key={j}>{r.map((c, k) => (
                        <td key={k}><늘칸 value={c} label={`${b.cols[k]} ${j + 1}`} onChange={(val) => 표바꿈(i, j, k, val)} /></td>
                      ))}</tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="fw-rowbtn">
                  <button type="button" className="btn line sm" onClick={() => 줄더(i)}>＋ 줄 더하기</button>
                  {x.length > 줄수(b) && <button type="button" className="btn line sm" onClick={() => 줄빼(i)}>－ 마지막 줄 빼기</button>}
                </div>
              </div>
            )
          }
          if (b.t === 'chk') {
            return (
              <div className="fw-chks" key={i}>
                {b.cap && <div className="fw-cap">{b.cap}</div>}
                {b.items.map((it, j) => (
                  <div className={'fw-ck' + (x[j].r === '불량' ? ' bad' : '')} key={j}>
                    <div className="fw-ck-t"><b>{j + 1}.</b> {it}</div>
                    <div className="fw-ck-r" role="group" aria-label={`${j + 1}번 결과`}>
                      {결과들.map((r) => (
                        <button type="button" key={r} className={'fw-pick' + (x[j].r === r ? ' on' : '')} aria-pressed={x[j].r === r}
                          onClick={() => 바꿈(i, (o) => o.map((y, k) => (k === j ? { ...y, r: y.r === r ? '' : r } : y)))}>{r}</button>
                      ))}
                    </div>
                    {(x[j].r === '불량' || x[j].m) && (
                      <input className="fw-in fw-ck-m" value={x[j].m} placeholder="조치 사항(불량이면 꼭)" aria-label={`${j + 1}번 조치 사항`}
                        onChange={(e) => { const val = e.target.value; 바꿈(i, (o) => o.map((y, k) => (k === j ? { ...y, m: val } : y))) }} />
                    )}
                  </div>
                ))}
                <div className="fw-rowbtn">
                  <button type="button" className="btn line sm" onClick={() => 바꿈(i, (o) => o.map((y) => (y.r ? y : { ...y, r: '양호' })))}>남은 칸 모두 «양호»</button>
                </div>
              </div>
            )
          }
          if (b.t === 'cl') {
            return (
              <div className="fw-cls" key={i}>
                {b.items.map(([head, body], j) => (
                  <label className="fw-clr" key={j}>
                    <input type="checkbox" checked={!!x[j]} onChange={(e) => { const on = e.target.checked; 바꿈(i, (o) => o.map((y, k) => (k === j ? on : y))) }} />
                    <span><b>{head}</b>{body && <small>{body}</small>}</span>
                  </label>
                ))}
              </div>
            )
          }
          if (b.t === 'text') return <p className="fw-tx muted sm" key={i}>{b.text}</p>
          if (b.t === 'sign') {
            return (
              <div className="fw-signs" key={i}>
                <label className="fw-kvr"><span className="fw-lb">날짜</span>
                  <input type="date" className="fw-in" value={x.d} onChange={(e) => { const d = e.target.value; 바꿈(i, (o) => ({ ...o, d })) }} /></label>
                {b.who.map((w, j) => (
                  <label className="fw-kvr" key={j}><span className="fw-lb">{w}</span>
                    <input className="fw-in" value={x.n[j]} placeholder="이름 (서명은 인쇄한 뒤)" onChange={(e) => { const val = e.target.value; 바꿈(i, (o) => ({ ...o, n: o.n.map((y, k) => (k === j ? val : y)) })) }} /></label>
                ))}
              </div>
            )
          }
          return null
        })}
        {f.law && <div className="fw-lawb muted sm">근거 · {f.law}</div>}
      </div>
      <div className="fw-bar bottom">
        <button type="button" className="btn primary" onClick={PDF}>🖨 PDF 저장 · 인쇄</button>
        <span className="muted sm">인쇄 창에서 <b>«PDF로 저장»</b>을 고르세요 · 폰은 <b>공유 → 인쇄 → PDF</b></span>
      </div>
      {인쇄중 && createPortal(<div id="fw-인쇄"><종이 f={f} v={v} /></div>, document.body)}
    </div>
  )
}

/* 시험용 — 종이만(빈 값 · 예시) */
export { 종이 as 서식종이 }
