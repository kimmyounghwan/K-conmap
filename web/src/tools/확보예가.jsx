/**
 * 🎯 확보 예가 — 보이는 자리 셋 (G181 · 2026-10-07)
 *
 * 소장님: 「원래 이게 어디에 있어야 가장 효과가 크지? 확보예가?」 → (① 바로투찰 ② 1순위 개찰 상세 ③ 업체 페이지) 「고쳐줘」
 *         「이미 잘 돌아가는 것은 손대지 말고, 예가만 추가해」
 *   → 셈은 lib/투찰자리.js 하나(성적표와 같은 식). 이 파일은 «보여 주기» 만 합니다. 기존 계산 · 추천은 건드리지 않습니다.
 *
 * ■ 확보 예가(어림) — 같은 개찰 금액을 낮은 순으로 늘어놓으면 «바로 아래 금액의 사정률 ~ 내 사정률» 로 예정가격이 나와야 1순위.
 *   그 폭에 사정률이 나올 확률(그 공고 σ · 전국 가운데값)이 «몫», 몫 × 예가 조합 수(15개 중 4개 = 1,365가지)가 확보 예가.
 *   평균 = 조합 수 ÷ 참가 수 → «평균의 몇 배» 로 보여 줍니다(1배 = 남들과 같음).
 * ■ 📂 G183 펼친 채(단추 없음) · 그 칸이 화면에 들어올 때 자료를 받음. 📦 G184 자료는 작은 것만(아래 미니자료 · 업체조각자료 — 무료 한도 안).
 * ■ 숨은 누적: |확보예가|바로투찰보임 · |확보예가|업체보임 (화면에 들어와 셀 때 · G183 부터)
 */
import { Component, useEffect, useRef, useState } from 'react'
import { getOverview } from '../lib/data.js'
import { P50_FALLBACK, breakEvenSj } from '../lib/bidmath.js'
import { 비슷한개찰, 미리확보 } from '../lib/투찰자리.js'
import { 미니풀기, 업체조각 } from '../lib/확보예가자료.js'   /* 📦 G184 무료로 — 작은 자료 */
import { 세기 } from '../lib/받은수.jsx'

/** 전국 사정률 가운데값(성적표 · 바로투찰과 같은 잣대) */
export function useP50() {
  const [p50, setP50] = useState(P50_FALLBACK)
  useEffect(() => {
    let 살 = true
    getOverview().then((ov) => { const v = ov?.sjq?.p50; if (살 && v) setP50(Number(v)) }).catch(() => {})
    return () => { 살 = false }
  }, [])
  return p50
}

/* 📦 G184 (2026-10-07) 소장님 「비용이 왜 이렇게 들어가지? 무료로 할 수 있는 방법 없어?」 → 「1, 2번으로 무료로」
   전에는 개찰 자료 통째(first_full.json · 받는 크기 8.4MB)를 받아 셌습니다 → 호스팅 무료 전송량으로 하루 40번쯤.
   이제 매일 자동 갱신 때 tools/확보예가굽기.mjs 가 만든 작은 자료만 받습니다:
     ① 바로투찰 /data/kb/mini.json (0.4MB 남짓) · ② 업체 페이지 /data/kb/c/{조각}.json (수십 KB)
   /data/** 는 하루 동안 브라우저가 기억합니다(firebase.json) — 같은 사람이 다시 보면 안 받음.
   ⚠️ 작은 자료가 없을 때 큰 파일로 «되돌아가지» 않습니다(그러면 다시 비용이 듭니다) — «자료를 받지 못했습니다» 를 띄움. */
let 미니약속 = null
export function 미니자료() {
  if (!미니약속) {
    미니약속 = fetch('/data/kb/mini.json')
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .then((j) => { const rows = 미니풀기(j); if (!rows.length) throw new Error('빈 자료'); return rows })
      .catch((e) => { 미니약속 = null; throw e })
  }
  return 미니약속
}
const 조각약속 = new Map()
export function 업체조각자료(biz) {
  const n = 업체조각(biz)
  if (!조각약속.has(n)) {
    조각약속.set(n, fetch(`/data/kb/c/${n}.json`)
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json() })
      .catch((e) => { 조각약속.delete(n); throw e }))
  }
  return 조각약속.get(n)
}

/* 📂 G183 (2026-10-07) 소장님 「확보예가는 펼쳐져 있게 해줘」 — 단추 없이 펼친 채로 두되, 개찰 자료(2MB 남짓 · 압축)는
   «그 칸이 화면에 들어올 때» 한 번 받습니다(첫 화면을 무겁게 하지 않게 · 아래로 내리지 않는 사람은 안 받음). */
function useBo임(ref, 켜짐 = true) {
  const [보임, set보임] = useState(false)
  /* ⚠️ 켜짐 — 칸이 처음엔 안 그려졌다가(기초금액을 나중에 넣음) 나중에 그려지면 그때 다시 지켜봄 (G185 시험에서 잡음) */
  useEffect(() => {
    const el = ref.current
    if (!켜짐 || !el || 보임) return undefined
    if (typeof IntersectionObserver === 'undefined') { set보임(true); return undefined }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { set보임(true); io.disconnect() } }, { rootMargin: '200px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, 보임, 켜짐])
  return 보임
}

const 배글 = (v) => (v == null || !isFinite(v) ? '-' : `${v >= 10 ? Math.round(v) : (Math.round(v * 10) / 10).toFixed(1)}배`)
const 사정 = (v) => (v == null || !isFinite(v) ? '-' : Number(v).toFixed(3))

/* 🛡 여기서 무슨 일이 나도 바로투찰 계산기 · 업체 화면은 그대로 뜨게(바로투찰 «지도지킴» 과 같은 뜻 · G166) */
class 예가지킴 extends Component {
  constructor(p) { super(p); this.state = { 오류: false } }
  static getDerivedStateFromError() { return { 오류: true } }
  componentDidCatch() { try { 세기('|확보예가|멈춤') } catch (e) { /* 없음 */ } }
  render() { return this.state.오류 ? null : this.props.children }
}

/** ① 바로투찰 — 권장 금액 아래 «이 금액의 확보 예가 미리 보기» (펼친 채 · 화면에 들어오면 셈 — G183) */
export function 확보예가미리(props) { return <예가지킴><미리안 {...props} /></예가지킴> }
function 미리안({ base, llr, aval, amt, 공고, p50 }) {
  const 자리 = useRef(null)
  const 내s = base > 0 && llr > 0 && amt > 0 ? breakEvenSj(base, llr, aval, amt) : null
  const 보임 = useBo임(자리, 내s != null)
  const 셌음 = useRef(false)
  const [상태, set상태] = useState('')          // '' | 'ing' | 'err'
  const [결과, set결과] = useState(null)
  const 키 = `${base}|${llr}|${aval}|${amt}|${공고?.inst || ''}`
  useEffect(() => {
    set결과(null)
    if (!보임 || 내s == null) return
    if (!셌음.current) { 셌음.current = true; 세기('|확보예가|바로투찰보임') }
    셈()
  }, [키, 보임])   // eslint-disable-line react-hooks/exhaustive-deps
  async function 셈() {
    if (내s == null) return
    set상태('ing')
    try {
      const rows = await 미니자료()
      const 고 = 비슷한개찰(rows, { inst: 공고?.inst, sido: 공고?.sido, base })
      const 미 = 미리확보(고.rows, 내s, p50)
      set결과(미 ? { ...미, 고른: 고.고른 } : { 없음: true })
      set상태('')
    } catch (e) { set상태('err') }
  }
  if (내s == null) return null
  const 최고 = 결과 && 결과.격자 ? 결과.격자.reduce((m, g) => (g.배 != null && (m == null || g.배 > m.배) ? g : m), null) : null
  return (
    <div className="kb-box" ref={자리}>
      {(
        <div className="kb-in">
          <div className="kb-h">🎯 확보 예가 미리 보기 <span className="muted">(어림 · 투찰 사정률 {사정(내s)})</span></div>
          {(상태 === 'ing' || (!결과 && 상태 === '')) && <div className="muted">지난 개찰 자료를 받아 셉니다…</div>}
          {상태 === 'err' && <div className="muted">개찰 자료를 받지 못했습니다 — 잠시 뒤 다시 눌러 주십시오. <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={셈}>다시</button></div>}
          {결과 && 결과.없음 && <div className="muted">비교할 만한 지난 개찰이 5건이 안 됩니다(같은 기관 · 비슷한 금액).</div>}
          {/* 🩹 G183 — 개찰 자료는 낮은 금액 30곳까지라, 업체가 많은 공사에서 이 금액 근처는 «바로 아래 업체» 를 몰라 못 잽니다 */}
          {결과 && !결과.없음 && 결과.배가운데 == null && (
            <div className="muted">비슷한 지난 개찰 {결과.건}건 가운데 이 금액 근처를 잴 수 있는 개찰이 {결과.잰}건뿐입니다 —
              개찰 자료는 낮은 금액 30곳까지만 실려 있어, 업체가 많은 공사에서 이 금액 근처는 남들이 얼마나 몰렸는지 셀 수 없습니다.</div>
          )}
          {결과 && !결과.없음 && 결과.배가운데 != null && (
            <>
              <div className="kb-big">
                <span>확보 예가 <b className={결과.배가운데 >= 1 ? 'kb-up' : 'kb-dn'}>평균의 {배글(결과.배가운데)}</b></span>
                <span className="muted">· {결과.고른} 개찰 {결과.잰}건의 가운데값 · 평균 넘은 개찰 {결과.평균넘은}건</span>
              </div>
              {결과.근처평균 != null && (
                <div className="kb-line">이 사정률 근처(±0.05)에 넣은 업체가 개찰마다 평균 <b>{결과.근처평균}곳</b>
                  {결과.근처평균 >= 3 ? ' — 몰린 자리입니다' : 결과.근처평균 >= 1 ? ' — 보통입니다' : ' — 덜 몰린 자리입니다'}.</div>
              )}
              <div className="kb-grid" role="table" aria-label="사정률 근처의 확보 예가">
                {결과.격자.map((g) => (
                  <div key={g.d} className={'kb-cell' + (Math.abs(g.d) < 1e-9 ? ' me' : '') + (최고 && g.s === 최고.s ? ' top' : '')} role="row">
                    <span className="s">{g.d > 0 ? '+' : ''}{g.d.toFixed(2)}</span>
                    <span className="bar"><i style={{ height: `${Math.min(100, (g.배 || 0) / Math.max(1.5, 최고?.배 || 1) * 100)}%` }} /></span>
                    <span className="v">{g.배 == null ? '-' : 배글(g.배)}</span>
                  </div>
                ))}
              </div>
              <div className="kb-note muted">
                칸은 «내 투찰 사정률에서 ±» 입니다(가운데 = 지금 금액). 남들이 몰린 곳은 1순위 될 폭이 좁아 확보 예가가 작습니다.
                {' '}⚠️ 예정가격을 맞히는 것이 아니라 지난 개찰에서 «남들이 얼마나 몰렸나» 만 봅니다. 지난 개찰 1만여 건으로 재 보니, 이 값을 보고 금액을 옮겨도
                {' '}1순위가 늘지는 않았습니다 — 참고로만 보시고, 권장 금액 · 실격 확률은 위 숫자 그대로 보십시오.{결과.격자.some((g) => g.배 == null) ? ' «-» 칸은 개찰 자료(낮은 금액 30곳)로 잴 수 없는 자리입니다.' : ''}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** ③ 업체 페이지 — «최근 개찰 확보 예가» (펼친 채 · 화면에 들어오면 셈 · 법인 하나일 때 — G183) */
export function 업체확보예가(props) { return <예가지킴><업체안 {...props} /></예가지킴> }
function 업체안({ biz, 여럿, 이름 }) {
  const 자리 = useRef(null)
  const 보임 = useBo임(자리)
  const [상태, set상태] = useState('')
  const [t, setT] = useState(null)
  useEffect(() => { setT(null); if (보임 && biz) 보기() }, [보임, biz])   // eslint-disable-line react-hooks/exhaustive-deps
  async function 보기() {
    set상태('ing'); 세기('|확보예가|업체보임')
    try {
      const j = await 업체조각자료(biz)
      const r = j && j.업체 ? j.업체[String(biz)] : null
      setT(r || { 없음: true }); set상태('')
    } catch (e) { set상태('err') }
  }
  return (
    <div className="card" style={{ marginTop: 10 }} ref={자리}>
      <div className="sec-title" style={{ margin: '0 0 6px' }}>🎯 확보 예가 — 최근 개찰</div>
      {!biz ? (
        <p className="cp" style={{ margin: 0 }}>{여럿
          ? '같은 이름의 법인이 여럿입니다 — 위에서 법인 하나를 고르시면 그 법인의 확보 예가를 셉니다.'
          : '이 업체는 개찰 자료에 사업자번호가 실려 있지 않아 확보 예가를 셀 수 없습니다.'}</p>
      ) : !t ? (
        <>
          <p className="cp" style={{ margin: '0 0 8px' }}>
            {이름 || '이 업체'}가 넣은 개찰마다 <b>1순위가 될 몫(확보 예가)</b>을 얼마나 쥐었는지 셉니다 — 남들이 몰린 자리에 같이 넣었는지,
            덜 몰린 자리를 잡았는지가 보입니다(평균 1배 = 남들과 같음).
          </p>
          {상태 !== 'err' ? <div className="muted">개찰 자료를 받아 셉니다…</div> : (
            <span className="muted">개찰 자료를 받지 못했습니다 — <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={보기}>다시</button></span>
          )}
        </>
      ) : t.없음 ? (
        <p className="cp" style={{ margin: 0 }}>셀 수 있는 개찰이 3건이 안 됩니다(사이트에 실린 개찰은 낮은 금액 순 30곳까지라, 그 안에 든 개찰만 셉니다).</p>
      ) : (
        <>
          <div className="kb-big">
            {t.배가운데 == null
              ? <span>확보 예가 <b className="kb-dn">셀 수 없음</b> <span className="muted">— 넣은 개찰 {t.잰개찰}건이 모두 바로 아래 업체를 모르는 자리(1순위 · 하한 아래)입니다</span></span>
              : <span>확보 예가 <b className={t.배가운데 >= 1 ? 'kb-up' : 'kb-dn'}>평균의 {배글(t.배가운데)}</b></span>}
            <span className="muted">· 잴 수 있는 개찰 {t.몫잰}건의 가운데값 · 평균 넘은 개찰 {t.평균넘은}건 · 1순위 {t.잰1순위}건(셈으로 본 기대 {t.기대1순위}건){t.몫잰 < t.잰개찰 ? ` · 넣은 개찰 ${t.잰개찰}건 중 ${t.잰개찰 - t.몫잰}건은 바로 아래 업체를 몰라 뺌` : ''}</span>
          </div>
          <div className="kb-line">금액이 가장 몰린 투찰 사정률 구간은 <b>{t.몰린구간}</b>(같은 개찰 전체의 {Math.round(t.몰린몫)}%) — 이 업체는 그 구간에 {Math.round(t.귀사몰린몫)}%를 넣었습니다.</div>
          <div className="tp-scroll">
            <table className="tbl kb-tbl">
              <thead><tr><th>개찰일</th><th className="kb-name">공고</th><th>등수</th><th className="kb-pc">투찰 사정률</th><th className="kb-pc">확보 예가</th><th>평균 대비</th></tr></thead>
              <tbody>
                {t.최근.slice(-12).reverse().map((x) => (
                  <tr key={x.no + x.dt}>
                    <td>{String(x.dt).slice(5, 10).replace('-', '.')}</td>
                    <td className="kb-name" title={String(x.name || '')}>{String(x.name || '').slice(0, 26)}</td>
                    <td className="r">{x.rank}/{x.n}</td>
                    <td className="r kb-pc">{사정(x.내s)}</td>
                    <td className="r kb-pc">{x.확보 == null ? '-' : x.확보 > 0 && x.확보 < 0.5 ? '1가지 미만' : `${Math.round(x.확보).toLocaleString('ko-KR')}가지`}</td>
                    <td className={'r ' + (x.배 != null && x.배 >= 1 ? 'kb-up' : 'kb-dn')}>{x.배 == null ? '-' : 배글(x.배)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="kb-note muted">확보 예가(어림) = 1순위가 될 사정률 폭에 예정가격이 나올 확률 × 예가 조합 수(15개 중 4개 = 1,365가지). 투찰 때의 기대값이지 실제 뽑힌 조합 수가 아닙니다.</div>
        </>
      )}
    </div>
  )
}
