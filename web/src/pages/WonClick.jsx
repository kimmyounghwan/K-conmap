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
 *
 * ■ 2026-10-01 (G109) 받는 엑셀은 «값만» — 소장님 「엑셀로 값만 주는 걸로 하자. 프로그램 원칙으로 하고」 · 「원클릭은 값만 줘도 상관 없지 않아?」
 *    셈 · 서류 화면은 이 사이트(프로그램) 그대로. 받을 때 모든 수식 칸을 화면과 같은 셈(lib/엑셀수식.js)의 값으로 바꿉니다(lib/엑셀쓰기.js 값만으로).
 *    «빈 엑셀 프로그램만 받기» 는 내렸습니다(틀 파일은 화면이 셈하려고 계속 읽습니다).
 *
 * ■ 2026-10-05 (G142) 서류 8가지 더함(소장님 「1,2,3다 하자」 → 설계 «이대로 해»)
 *    선금 신청·사용계획 · 인력·장비 투입계획 · 월간 공정보고 · 노무비 청구내역 · 산안비 사용계획·사용내역(고시 별지 제1호서식 첫 쪽)
 *    · 하도급계약 통보서(건설산업기본법 시행규칙 별지 제23호서식 앞·뒤쪽) · 하도급대금 지급확인 · 계약금액 조정 신청.
 *    입력 칸은 맨 뒤(10.~13.)에만 붙여 예전 칸 주소 그대로. 서류 번호가 바뀌어(«06 착공신고서» → «08 …») 예전에 골라 둔 서류 ·
 *    화면에서 고친 칸은 «서류 이름» 으로 옮겨 읽습니다(시트옮김). «뒤쪽» 장은 앞쪽에 딸려 같이 골라지고 따로 세지 않습니다.
 */
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import META from '../data/wonclick.json'
import { askAfter } from '../AskComment'
import 이어쓰기 from '../tools/이어쓰기.jsx'
import { 앞모습두기 } from '../lib/이어쓰기.js'
import { 세기 } from '../lib/받은수.jsx'
/* 📄 2026-09-27 — 서류를 화면에서 보고·고치고·인쇄 (엑셀화면.jsx). 무거운 셈은 열 때만 받습니다. */
const 엑셀화면 = lazy(() => import('../엑셀화면.jsx'))
const 고침열쇠 = 'kcm.wonclick.고침.v1'
function 고침읽기() { try { return 고침옮김(JSON.parse(localStorage.getItem(고침열쇠) || '{}') || {}) } catch { return {} } }

const KEY = 'kcm.wonclick.v1'
const 늦게펼침 = ['6.', '7.', '8.', '9.', '10.', '11.', '12.', '13.']     // 기성·공기연장·준공·하자 · G142 선금·달마다·하도급·조정 — 필요할 때 펼침

/* 🗂 G142 — 고르는 단위는 «서류»(뒤쪽 장은 앞쪽에 딸림) · 예전에 저장한 시트 이름은 서류 이름으로 옮김 */
const 서류들 = META.docs.filter((d) => !d.with)
const 모두 = () => META.docs.map((d) => d.sheet)
const 이름으로 = new Map(META.docs.map((d) => [d.name, d.sheet]))
const 시트옮김 = (s) => { const x = String(s); return META.docs.some((d) => d.sheet === x) ? x : (이름으로.get(x.replace(/^\d+\s*/, '')) || x) }
function 딸림붙임(p) {
  const set = new Set(p)
  return META.docs.filter((d) => set.has(d.sheet) || (d.with && set.has(d.with))).map((d) => d.sheet)
}
function 고른것읽기(v) {
  if (!v || !Array.isArray(v.__pick)) return 모두()
  if (!v.__pv && v.__pick.length >= 24) return 모두()     /* 예전(24가지)에 전부 골라 두셨으면 새 서류까지 전부 */
  return 딸림붙임(v.__pick.map(시트옮김))
}
/* 📊 G142 누적 카운트(화면엔 안 보임) — 새 서류 8가지 중 하나라도 골라 보거나 받으면 «|원클릭|새서류» */
const 새서류 = new Set(['선금 신청서', '선금 사용계획서', '인력·장비 투입계획서', '산안비 사용계획서', '월간 공정보고서', '노무비 청구내역서',
  '산안비 사용내역서', '하도급계약 통보서', '하도급대금 지급확인서', '계약금액 조정 신청서'])
const 새것골랐나 = (p) => META.docs.some((d) => 새서류.has(d.name) && p.includes(d.sheet))
function 고침옮김(g) {
  const out = {}
  for (const [k, v] of Object.entries(g || {})) { const i = k.lastIndexOf('!'); out[i > 0 ? 시트옮김(k.slice(0, i)) + k.slice(i) : k] = v }
  return out
}

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
  const [pick, setPick] = useState(() => 고른것읽기(load()))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState('')
  /* 📄 화면에서 보기 — 틀(xlsx)은 처음 열 때 한 번 받습니다 */
  const [보기, set보기] = useState(false)
  const [틀, set틀] = useState(null)
  const [책, set책] = useState(null)
  const [보기오류, set보기오류] = useState('')
  const [고침, set고침원] = useState(고침읽기)
  const set고침 = (v) => { set고침원(v); try { localStorage.setItem(고침열쇠, JSON.stringify(v)) } catch { /* 가득 참 */ } }
  useEffect(() => {
    if (!보기) return undefined
    let 살 = true
    ;(async () => {
      try {
        set보기오류('')
        let t = 틀
        const [lib, R] = await Promise.all([import('../lib/wonclick.js'), import('../lib/엑셀읽기.js')])
        if (!t) {
          const res = await fetch(META.file)
          if (!res.ok) throw new Error('틀 파일을 받지 못했습니다. 잠시 뒤 다시 눌러 주세요.')
          t = new Uint8Array(await res.arrayBuffer())
          if (살) set틀(t)
        }
        const v = {}
        for (const i of META.inputs) if (vals[i.key] !== undefined) v[i.key] = vals[i.key]
        const out = lib.fillWorkbook(t, META, v, pick.length ? pick : META.docs.map((d) => d.sheet))
        if (살) set책(R.엑셀읽기(out))
      } catch (e) { if (살) set보기오류(e.message || String(e)) }
    })()
    return () => { 살 = false }
  }, [보기, vals, 틀])   // eslint-disable-line react-hooks/exhaustive-deps
  const 보일서류 = useMemo(() => META.docs.map((d) => d.sheet).filter((x) => pick.includes(x)), [pick])

  useEffect(() => { save({ ...vals, __pick: pick, __pv: 2 }) }, [vals, pick])
  const 고른수 = useMemo(() => pick.filter((s) => { const d = META.docs.find((x) => x.sheet === s); return d && !d.with }).length, [pick])

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

  const togg = (s) => setPick((p) => {
    const 딸 = META.docs.filter((d) => d.with === s).map((d) => d.sheet)
    return p.includes(s) ? p.filter((x) => x !== s && !딸.includes(x)) : [...p, s, ...딸]
  })
  const 고르기 = (fn) => setPick(딸림붙임(서류들.filter(fn).map((d) => d.sheet)))

  async function 받기() {
    setErr(''); setDone(''); setBusy(true)
    try {
      if (!pick.length) throw new Error('서류를 하나 이상 골라 주세요.')
      const [lib, res] = await Promise.all([import('../lib/wonclick.js'), fetch(META.file)])
      if (!res.ok) throw new Error('틀 파일을 받지 못했습니다. 잠시 뒤 다시 눌러 주세요.')
      const tpl = new Uint8Array(await res.arrayBuffer())
      const v = {}
      for (const i of META.inputs) if (vals[i.key] !== undefined) v[i.key] = vals[i.key]
      const 채움 = lib.fillWorkbook(tpl, META, v, pick)
      /* 📗 G109 — 값만: 모든 수식 칸을 화면과 같은 셈의 값으로(화면에서 고친 칸도 그대로) */
      const W = await import('../lib/엑셀쓰기.js')
      /* «처음» 시트 안내도 값만 파일에 맞게(입력을 고쳐도 서류가 안 바뀜 · 다시는 사이트에서) */
      const 안내 = {
        '처음!B2': '이 파일은 K-건설맵 원클릭에서 셈한 값만 든 파일입니다(수식 없음). 서류 칸이 모두 채워져 있어 바로 인쇄할 수 있습니다. 고칠 때는 k-conmap.com/tools/wonclick 에서 고쳐 다시 받으십시오.',
        '처음!C4': '「입력」 시트는 받을 때 넣은 값의 기록입니다 — 여기서 고쳐도 서류는 바뀌지 않습니다.',
        '처음!C5': '아래 목록에서 서류 이름을 누르면 그 서류로 갑니다.',
        ['처음!' + ((META.front && META.front.보호) || 'B39')]: '• 수식 없이 값만 들어 있습니다. 칸을 고치면 그 칸만 바뀝니다(다른 서류는 따라 바뀌지 않음).',
        ['처음!' + ((META.front && META.front.사이트) || 'B41')]: '• 다시 셀 때는 사이트(k-conmap.com/tools/wonclick)에서 칸을 고치고 받으십시오 — 적은 내용이 그 브라우저에 남아 있습니다.',
      }
      const out = W.값만으로(채움, { ...안내, ...고침 }).바이트
      const nm = `공사서류_원클릭_${lib.safeName(vals.공사명) || '빈칸'}.xlsx`
      const url = URL.createObjectURL(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const a = document.createElement('a')
      a.href = url; a.download = nm
      document.body.appendChild(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      setDone(`«${nm}» 을 받았습니다 — 서류 ${고른수}가지.`)
      askAfter('forms')
      if (새것골랐나(pick)) 세기('|원클릭|새서류')
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  function 지우기() {
    if (!window.confirm('입력한 내용을 모두 지울까요? (지우기 전 모습은 «🔗 이어 쓰기 → 💾 백업 · 더 보기 → ↩ 되돌리기» 로 한 번 되살릴 수 있습니다)')) return
    앞모습두기('wc', 잇는상태)
    setVals({}); setPick(모두()); setDone(''); set고침({})
  }

  /* 🔗 G113 — 이어 쓰기: 칸(vals + 고른 서류) · 화면에서 고친 칸(고침) 두 덩이를 한 덩이로 */
  const 잇는상태 = useMemo(() => ({ v: { ...vals, __pick: pick, __pv: 2 }, 고침 }), [vals, pick, 고침])
  const 잇기읽기 = () => ({ v: load(), 고침: 고침읽기() })
  const 잇기쓰기 = (x) => { save((x && x.v) || {}); try { localStorage.setItem(고침열쇠, JSON.stringify((x && x.고침) || {})) } catch { /* 가득 참 */ } return true }
  const 잇기받기 = (x) => {
    const v = (x && x.v) || {}
    setVals(v)
    setPick(고른것읽기(v))
    set고침원(고침옮김((x && x.고침) || {}))
    setDone('')
  }

  const 무리 = [['업체', '우리 회사가 내는 서류'], ['발주기관', '발주기관(감독·검사자)이 쓰는 서류']]

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1">⚡ 공사서류 원클릭</h1>
        <div className="note">
          <b>한 번 입력하면 착공부터 준공·하자까지 서류 {서류들.length}가지가 채워진 엑셀</b>이 나옵니다.
          공사명·계약금액·날짜를 서류마다 옮겨 적지 않아도 됩니다. 관급·민간 <b>모든 현장</b>에 쓰고,
          회원가입 없이 무료입니다.
        </div>
        <ul className="wc-up">
          <li><b>저절로 계산</b> — 일금 …원정 한글 금액, 공사기간 일수, 계약·하자보수보증금, 하자기간 끝나는 날, 지체일수·지체상금, 기성 누계·기성률, 준공금 청구액.</li>
          <li><b>공사 중 서류까지</b> — 선금 신청·사용계획, 인력·장비 투입계획, 월간 공정보고, 노무비 청구내역, 산안비 사용계획·사용내역(고시 별지 제1호서식),
            하도급계약 통보서(건설산업기본법 시행규칙 별지 제23호서식 앞·뒤쪽), 하도급대금 지급확인, 계약금액 조정 신청. 법정 서식 둘은 원문 칸 그대로입니다.</li>
          <li><b>화면에서 보고 고쳐 인쇄</b> — 서류를 A4 그대로 보고, 칸을 눌러 고치고, 한 장씩 또는 모두 인쇄합니다.</li>
          <li><b>필요한 서류만 · 값만 든 엑셀</b> — 고른 서류만 엑셀로 받습니다. 엑셀에는 셈한 값이 들어 있어 엑셀 · 한셀 · 구글 시트 어디서나 그대로 열립니다. 고칠 때는 여기서 다시 받으면 됩니다(적은 내용이 이 기기에 남아 있음).</li>
        </ul>
      </div>

      <div className="card">
        <div className="detail-h">① 칸 채우기 <span className="count">· 모르는 칸은 비워 두세요 — 서류에서 그 자리만 빈칸이 됩니다</span></div>
        <div className="note sm">입력한 내용은 <b>이 기기(브라우저)에</b> 저장됩니다. 폰·PC 어디서든 이어 쓰려면 아래 <b>«🔗 코드 만들기»</b>(코드 + 비밀번호 · 잠가서 서버에 — 저희도 못 읽음).
          요율(보증금률·지체상금률·하자기간)은 <b>계약서·공고서에 적힌 값</b>을 넣으세요.</div>
        <이어쓰기 ns="wc" 이름="공사서류 원클릭" 파일="공사서류원클릭" st={잇는상태} setSt={잇기받기} 읽기={잇기읽기} 쓰기={잇기쓰기} />
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
        <div className="detail-h">② 서류 고르기 <span className="count">· {고른수}/{서류들.length}가지</span></div>
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
              {서류들.filter((d) => d.who === w).map((d) => (
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

      <div className="card">
        <div className="detail-h">③ 화면에서 보고 · 고치고 · 인쇄 <span className="count">· 엑셀 없이 여기서 끝</span></div>
        {!보기 ? (
          <>
            <div className="note sm">채운 칸이 서류에 어떻게 들어갔는지 A4 그대로 봅니다. <b>칸을 누르면 고칠 수 있고</b>, 고친 것은 이 기기에 남습니다. 인쇄하면 서류 한 가지가 A4 한 장입니다.</div>
            <div className="btn-row" style={{ marginTop: 8 }}>
              <button className="btn" onClick={() => { set보기(true); if (새것골랐나(pick)) 세기('|원클릭|새서류') }} disabled={!pick.length}>📄 서류 {고른수}가지 화면에서 보기</button>
            </div>
          </>
        ) : 보기오류 ? <div className="note sm" style={{ color: 'var(--bad, #c62828)' }}>⚠ {보기오류}</div>
          : !책 ? <div className="note sm">서류를 채우는 중…</div>
          : !보일서류.length ? <div className="note sm">② 에서 서류를 하나 이상 골라 주세요.</div>
          : (
            <Suspense fallback={<div className="note sm">화면을 준비하는 중…</div>}>
              <엑셀화면 책={책} 시트들={보일서류} 고침={고침} set고침={set고침} 쪽채움
                이름={`공사서류_${(vals.공사명 || '원클릭').slice(0, 30)}`}
                이름표={(n) => n.replace(/^\d+\s*/, '')} />
            </Suspense>
          )}
      </div>

      <div className="card wc-go">
        {빈칸.length > 0 && (
          <div className="note sm" style={{ color: 'var(--warn, #b25a00)' }}>
            ⚠ 꼭 필요한 칸 {빈칸.length}개가 비어 있습니다 — {빈칸.map((k) => 이름[k]).join(', ')}. 그래도 받을 수 있지만, 채운 뒤 받아야 서류마다 들어갑니다.
          </div>
        )}
        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn primary" onClick={받기} disabled={busy}>
            {busy ? '만드는 중…' : `⬇ 엑셀로 받기 (서류 ${고른수}가지)`}
          </button>
          <button className="btn ghost sm" style={{ whiteSpace: 'nowrap' }} onClick={지우기}>입력 지우기</button>
        </div>
        {Object.keys(고침).length > 0 && <div className="note sm" style={{ marginTop: 8 }}>✏️ 화면에서 고친 칸 {Object.keys(고침).length}개도 엑셀에 그대로 들어갑니다.</div>}
        {done && <div className="note sm" style={{ marginTop: 8 }}>✔ {done} 셈한 값이 든 엑셀입니다(수식 없음) — 고칠 때는 여기서 고쳐 다시 받으십시오. 인쇄는 서류 한 가지가 A4 한 장입니다.</div>}
        {err && <div className="note sm" style={{ marginTop: 8, color: 'var(--bad, #c62828)' }}>⚠ {err}</div>}
      </div>

      <div className="card">
        <div className="detail-h">들어 있는 서류 {서류들.length}가지</div>
        <ul className="flist">
          {['계약', '착공', '공사 중', '준공', '관리', '하자'].map((w) => {
            const l = 서류들.filter((d) => d.when === w)
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
          <li>받은 엑셀을 휴대폰 미리보기(카톡 등)로 열면 계산된 칸이 비어 보일 수 있습니다. 엑셀·한셀·구글 시트에서 열면 채워집니다 — 휴대폰에서는 위 ③ «화면에서 보기» 가 편합니다.</li>
          <li>인쇄하면 머리글 오른쪽에 작은 K-건설맵 표시가 나옵니다. 지우려면 엑셀 <b>페이지 레이아웃 → 페이지 설정 → 머리글/바닥글</b>에서 «(없음)».</li>
        </ul>
      </div>
    </div>
  )
}
