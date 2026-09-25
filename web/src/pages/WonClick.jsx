/**
 * /tools/wonclick — ⚡ 공사서류 원클릭 (2026-09-24)
 *
 * 소장님: 「공사서류 원클릭 프로그램은 업그레이드 해서 올려줘. 모든 공사현장에서 사용할 수 있도록」
 *         「도구쪽으로 추가해줘」 · 「업그레이드 확실하게」
 *
 * ■ 받은 프로그램(교육청 것)은 «허락 없이 변경·수정 금지» 라서 고치지 않았습니다.
 *    K-건설맵이 처음부터 새로 만든 것입니다 (tools/build_wonclick.py).
 *
 * ■ 무엇이 나아졌나
 *    ① 매크로가 없습니다 — 인터넷에서 받은 매크로 파일은 윈도우가 막습니다. 수식만 씁니다.
 *    ② 이 화면에서 칸을 채우고 누르면, 입력이 들어간 엑셀이 바로 나옵니다 (휴대폰에서도).
 *    ③ 학교 전용이 아니라 관급·민간 모든 현장 — 받는 사람·요율을 입력으로 받습니다.
 *    ④ 금액 한글 표기(일금 …원정), 공사기간 일수, 보증금, 하자기간 끝나는 날, 지체일수·지체상금,
 *       기성 누계·기성률, 준공금 청구액까지 저절로 셉니다.
 *    ⑤ 필요한 서류만 골라 받습니다 (나머지는 숨김 — 수식은 그대로).
 *
 * ■ 법령 요율은 넣어 두지 않습니다 (공종·계약마다 다름). 계약서 값을 이용자가 넣습니다.
 * ■ 입력값은 이 기기(브라우저)에만 저장합니다. 서버로 보내지 않습니다.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import META from '../data/wonclick.json'
import { askAfter } from '../AskComment'

const KEY = 'kcm.wonclick.v1'
const 늦게펼침 = ['6.', '7.', '8.', '9.']     // 기성·공기연장·준공·하자 — 필요할 때 펼침

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { return {} }
}
function save(v) {
  try { localStorage.setItem(KEY, JSON.stringify(v)) } catch { /* 사생활 보호 모드 */ }
}

const 숫자 = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구']
function 네자리(n) {
  const d = [Math.floor(n / 1000), Math.floor(n / 100) % 10, Math.floor(n / 10) % 10, n % 10]
  return ['천', '백', '십', ''].map((u, i) => (d[i] ? 숫자[d[i]] + u : '')).join('')
}
/** 123456000 → 일억이천삼백사십오만육천 (엑셀 틀과 같은 규칙) */
export function 한글금액(n) {
  n = Math.round(Math.abs(n))
  if (!n) return '영'
  const 억 = Math.floor(n / 1e8), 만 = Math.floor(n / 1e4) % 1e4, 일 = n % 1e4
  return (억 ? 네자리(억) + '억' : '') + (만 ? 네자리(만) + '만' : '') + 네자리(일)
}
const 쉼표 = (s) => {
  const t = String(s ?? '').replace(/[^\d]/g, '')
  return t ? Number(t).toLocaleString('ko-KR') : ''
}
const 수 = (s) => { const t = String(s ?? '').replace(/[,\s원]/g, ''); return t === '' ? null : Number(t) }
const 날 = (s) => (s ? new Date(s + 'T00:00:00') : null)
const 일수 = (a, b) => (a && b ? Math.round((날(b) - 날(a)) / 86400000) + 1 : null)

function Field({ inp, v, set }) {
  const id = 'wc-' + inp.key
  const common = { id, value: v ?? '', onChange: (e) => set(inp.key, e.target.value) }
  let box
  if (inp.type === 'list') {
    box = (
      <select {...common}>
        <option value="">— 고르세요 —</option>
        {inp.opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  } else if (inp.type === 'date') {
    box = <input type="date" {...common} />
  } else if (inp.type === 'money') {
    box = <input inputMode="numeric" placeholder={inp.ex ? 쉼표(inp.ex) : '숫자만'} {...common}
      onChange={(e) => set(inp.key, 쉼표(e.target.value))} />
  } else if (inp.type === 'num') {
    box = <input inputMode="decimal" placeholder={String(inp.ex || '')} {...common}
      onChange={(e) => set(inp.key, e.target.value.replace(/[^\d.]/g, ''))} />
  } else {
    box = <input type="text" placeholder={inp.ex ? `예: ${inp.ex}` : ''} {...common} />
  }
  const n = inp.type === 'money' ? 수(v) : null
  return (
    <label className="wc-f" htmlFor={id}>
      <span className="wc-l">{inp.label}{inp.req && <b className="wc-req" title="꼭 필요한 칸"> *</b>}</span>
      {box}
      {n ? <span className="wc-h">일금 {한글금액(n)}원정</span> : inp.help ? <span className="wc-h">{inp.help}</span> : null}
    </label>
  )
}

export default function WonClick() {
  const [vals, setVals] = useState(load)
  const [pick, setPick] = useState(() => {
    const v = load()
    return v.__pick && Array.isArray(v.__pick) ? v.__pick : META.docs.map((d) => d.sheet)
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')

  useEffect(() => { save({ ...vals, __pick: pick }) }, [vals, pick])

  const set = (k, v) => { setVals((o) => ({ ...o, [k]: v })); setDone('') }
  const secs = useMemo(() => META.sections.map((s) => [s, META.inputs.filter((i) => i.sec === s)]), [])
  const 빈칸 = META.required.filter((k) => !String(vals[k] ?? '').trim())
  const 이름 = {
    ...Object.fromEntries(META.inputs.map((i) => [i.key, i.label.replace(/\s+/g, '')])),
    대리인: '현장대리인 성명', 업체주소: '회사 주소', 대표자: '대표자', 상호: '상호',
  }

  /* 입력 확인용 — 엑셀과 같은 셈 (엑셀이 최종) */
  const 공기 = 일수(vals.착공일, vals.준공기한)
  const 계약 = 수(vals.계약금액)
  const 보증 = 계약 && vals.계약보증률 ? Math.ceil(계약 * Number(vals.계약보증률) / 100) : null

  const togg = (s) => setPick((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  const 고르기 = (fn) => setPick(META.docs.filter(fn).map((d) => d.sheet))

  async function 받기() {
    setErr(''); setDone(''); setBusy(true)
    try {
      if (!pick.length) throw new Error('서류를 하나 이상 골라 주세요.')
      const [lib, res] = await Promise.all([import('../lib/wonclick.js'), fetch(META.file)])
      if (!res.ok) throw new Error('틀 파일을 받지 못했습니다. 잠시 뒤 다시 눌러 주세요.')
      const tpl = new Uint8Array(await res.arrayBuffer())
      const v = {}
      for (const i of META.inputs) if (vals[i.key] !== undefined) v[i.key] = vals[i.key]
      const out = lib.fillWorkbook(tpl, META, v, pick)
      const nm = `공사서류_원클릭_${lib.safeName(vals.공사명) || '빈칸'}.xlsx`
      const url = URL.createObjectURL(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a')
      a.href = url; a.download = nm
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      setDone(`«${nm}» 을 받았습니다 — 서류 ${pick.length}가지.`)
      askAfter('forms')
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  function 지우기() {
    if (!window.confirm('입력한 내용을 모두 지울까요? (이 기기에 저장된 것만 지워집니다)')) return
    setVals({}); setPick(META.docs.map((d) => d.sheet)); setDone('')
  }

  const 무리 = [['업체', '우리 회사가 내는 서류'], ['발주기관', '발주기관(감독·검사자)이 쓰는 서류']]

  return (
    <div className="wrap">
      <div className="card">
        <Link className="btn ghost sm" to="/tools">← 도구</Link>
        <h1 className="tl-h1">⚡ 공사서류 원클릭</h1>
        <div className="note">
          <b>한 번 입력하면 착공부터 준공·하자까지 서류 {META.docs.length}가지가 채워진 엑셀</b>이 나옵니다.
          공사명·계약금액·날짜를 서류마다 옮겨 적지 않아도 됩니다. 관급·민간 <b>모든 현장</b>에 쓰고,
          회원가입 없이 무료입니다.
        </div>
        <ul className="wc-up">
          <li><b>매크로 없음</b> — 인터넷에서 받은 매크로 파일은 윈도우가 막습니다. 수식만 써서 엑셀·한셀·구글 시트에서 그냥 열립니다.</li>
          <li><b>저절로 계산</b> — 일금 …원정 한글 금액, 공사기간 일수, 계약·하자보수보증금, 하자기간 끝나는 날, 지체일수·지체상금, 기성 누계·기성률, 준공금 청구액.</li>
          <li><b>필요한 서류만</b> — 아래에서 고른 서류만 보이게 해서 받습니다.</li>
        </ul>
        <div className="btn-row" style={{ marginTop: 10 }}>
          <a className="btn ghost sm" href={META.file} download="K-건설맵_공사서류_원클릭(빈칸).xlsx"
            onClick={() => askAfter('forms')}>⬇ 빈 엑셀 프로그램만 받기</a>
        </div>
      </div>

      <div className="card">
        <div className="detail-h">① 칸 채우기 <span className="count">· 모르는 칸은 비워 두세요 — 서류에서 그 자리만 빈칸이 됩니다</span></div>
        <div className="note sm">입력한 내용은 <b>이 기기(브라우저)에만</b> 저장됩니다. 서버로 보내지 않습니다.
          요율(보증금률·지체상금률·하자기간)은 <b>계약서·공고서에 적힌 값</b>을 넣으세요.</div>
        {secs.map(([s, list]) => {
          const 늦게 = 늦게펼침.some((p) => s.startsWith(p))
          const 채움 = list.some((i) => String(vals[i.key] ?? '').trim())
          const body = <div className="wc-grid">{list.map((i) => <Field key={i.key} inp={i} v={vals[i.key]} set={set} />)}</div>
          return 늦게 ? (
            <details className="wc-sec" key={s} open={채움}>
              <summary>{s} <span className="count">· 필요할 때 펼치세요</span></summary>
              {body}
            </details>
          ) : (
            <div className="wc-sec" key={s}>
              <div className="wc-st">{s}</div>
              {body}
            </div>
          )
        })}
        {(공기 || 보증) ? (
          <div className="wc-chk">
            {공기 ? <span>공사기간 <b>{공기}일</b></span> : null}
            {보증 ? <span>계약보증금 <b>{보증.toLocaleString('ko-KR')}원</b></span> : null}
          </div>
        ) : null}
      </div>

      <div className="card">
        <div className="detail-h">② 서류 고르기 <span className="count">· {pick.length}/{META.docs.length}가지</span></div>
        <div className="navrow" style={{ marginBottom: 8 }}>
          <button className="navi" onClick={() => 고르기(() => true)}>전부</button>
          <button className="navi" onClick={() => 고르기((d) => d.who === '업체')}>우리 회사 서류만</button>
          <button className="navi" onClick={() => 고르기((d) => !d.pub)}>민간 공사 (관급 서류 빼기)</button>
          <button className="navi" onClick={() => setPick([])}>모두 끄기</button>
        </div>
        {무리.map(([w, t]) => (
          <div key={w} style={{ marginTop: 6 }}>
            <div className="wc-st">{t}</div>
            <div className="wc-docs">
              {META.docs.filter((d) => d.who === w).map((d) => (
                <label key={d.sheet} className={'wc-doc' + (pick.includes(d.sheet) ? ' on' : '')}>
                  <input type="checkbox" checked={pick.includes(d.sheet)} onChange={() => togg(d.sheet)} />
                  <span className="wc-dn">{d.no}. {d.name}{d.pub && <em> 관급</em>}</span>
                  <span className="wc-dd">{d.when} · {d.desc}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card wc-go">
        {빈칸.length > 0 && (
          <div className="note sm" style={{ color: 'var(--warn, #b25a00)' }}>
            ⚠ 꼭 필요한 칸 {빈칸.length}개가 비어 있습니다 — {빈칸.map((k) => 이름[k]).join(', ')}. 그래도 받을 수 있고, 엑셀에서 채워도 됩니다.
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={받기} disabled={busy}>
            {busy ? '만드는 중…' : `⬇ 엑셀로 받기 (서류 ${pick.length}가지)`}
          </button>
          <button className="btn ghost sm" style={{ whiteSpace: 'nowrap' }} onClick={지우기}>입력 지우기</button>
        </div>
        {done && <div className="note sm" style={{ marginTop: 8 }}>✔ {done} 엑셀에서 열면 칸이 저절로 계산됩니다. 인쇄는 서류 한 가지가 A4 한 장입니다.</div>}
        {err && <div className="note sm" style={{ marginTop: 8, color: 'var(--bad, #c62828)' }}>⚠ {err}</div>}
      </div>

      <div className="card">
        <div className="detail-h">들어 있는 서류 {META.docs.length}가지</div>
        <ul className="flist">
          {['계약', '착공', '공사 중', '준공', '관리', '하자'].map((w) => {
            const l = META.docs.filter((d) => d.when === w)
            return l.length ? <li key={w}><b>{w}</b> — {l.map((d) => d.name).join(' · ')}</li> : null
          })}
        </ul>
      </div>

      <div className="card">
        <div className="detail-h">알아 두실 것</div>
        <ul className="flist">
          <li>발주기관이 정한 서식이 있으면 그 서식을 씁니다. 이 파일은 정해진 서식이 없을 때 쓰는 기본 양식입니다.</li>
          <li>보증금률·지체상금률·하자담보책임기간은 공종과 계약마다 다릅니다. 계약서에 적힌 값을 넣으세요 — 여기서 정해 두지 않았습니다.</li>
          <li>지체상금 자동 계산은 «최종 계약금액 × 요율 × 지체일수» 입니다. 면제·감면이나 기성 인수분 공제가 있으면 입력 칸에 그 금액을 넣으세요.</li>
          <li>휴대폰 미리보기(카톡 등)에서는 계산된 칸이 비어 보일 수 있습니다. 엑셀·한셀·구글 시트에서 열면 채워집니다.</li>
          <li>인쇄하면 머리글 오른쪽에 작은 K-건설맵 표시가 나옵니다. 지우려면 엑셀 <b>페이지 레이아웃 → 페이지 설정 → 머리글/바닥글</b>에서 «(없음)».</li>
        </ul>
      </div>
    </div>
  )
}
