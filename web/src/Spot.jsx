import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJSON, getOverview, getBidIndex, indexRows } from './lib/data.js'
import { quickBid, isReady, P50_FALLBACK } from './lib/bidmath.js'
import { winGrade } from './lib/winodds.js'
import { won, wonShort, num, dday, inRegion } from './lib/fmt.js'
import { 참여근거, 참여판정 } from './lib/참여.js'   /* ✅ G219 */

/* ══════════════════════════════════════════════════════════════
   «자리» 블록 — 발주기관 분석과 업체 자가진단이 같이 씁니다. 2026-09-03

   왜 만들었나
     소장님: 「분석에서 발주기관과 업체 자가진단도 업그레이드 해줘. 입찰 사이트 보고 클로드가 판단해줘.」
     판단: 통계를 더 보여주는 게 아니라 «이 기관·이 업체가 이길 수 있는 자리인가» 로 바꾼다.
     근거: 실측 958건에서 승률을 가른 건 금액이 아니라 «창»(1순위가 하한 위에 뜬 폭)이었다.
           창 0.02% 미만 → 승률 0.3% ↔ 0.3% 이상 → 13.6%. 45배.

   보여주는 것 (build_json.py 의 spot_stats 가 만든 값)
     mg  창 — 중앙값 · 넓은 창(≥0.3%p) 비율 · 바짝(<0.02%p) 비율     ← 실측
     gr  등급 A/B/C/D 분포                                            ← 예측 (같은 규칙)
     np  참가업체수 중앙 · 단독 · 3곳 이하                              ← 경쟁 강도

   ⚠️ 생존 편향 주의 — 여기 자료는 «1순위 기록»뿐입니다.
      그래서 «내 투찰률 vs 권장» 같은 진단은 넣지 않았습니다 (1순위는 정의상 가장 낮게 쓴 곳이라
      95% 가 «권장보다 낮음» 으로 나와 아무 정보가 없습니다 — 실제로 재보고 버렸습니다).
      «창» 은 다릅니다 — 하한 위 얼마나 떴는지는 그 자리의 경쟁 성격입니다.

   ⚠️ 기초금액·A값이 있는 최근 줄에서만 나오므로 n 을 항상 같이 적습니다. 3건으로 단정하지 않습니다.
   ══════════════════════════════════════════════════════════════ */

const verdictOf = (mg) => {
  if (!mg) return null
  if (mg.n < 3) return { key: 'few', label: '표본 부족', tone: 'mid',
    say: `창을 잰 개찰이 ${mg.n}건뿐입니다. 아직 판단하지 않습니다.` }
  const w = mg.wide / mg.n, t = mg.tight / mg.n
  if (mg.med >= 0.1 || w >= 0.3) return { key: 'wide', label: '해볼 만한 자리', tone: 'good',
    say: `1순위가 하한 위 중앙 ${mg.med.toFixed(3)}%p 에 떴습니다. 전국 중앙(0.034%p)보다 넓습니다 — 계산이 먹히는 자리입니다.` }
  if (mg.med < 0.02 || t >= 0.6) return { key: 'tight', label: '하한에 바짝 — 운 싸움', tone: 'bad',
    say: `1순위가 하한 위 ${mg.med.toFixed(3)}%p 에 붙습니다. 누가 계산해도 같은 자리라 추첨이 정합니다.` }
  return { key: 'mid', label: '보통', tone: 'mid',
    say: `1순위가 하한 위 중앙 ${mg.med.toFixed(3)}%p. 전국 중앙(0.034%p)쯤입니다.` }
}

/** 기관·업체 공용: 자리 진단 */
export function SpotBlock({ spot, who = '이 기관' }) {
  if (!spot) return null
  const { gr, gn, np, mg } = spot
  const v = verdictOf(mg)
  const ab = gn ? (gr.A + gr.B) / gn : null
  if (!v && !gn && !np) return null
  return (
    <div className="spot">
      <div className="sec-title" style={{ margin: '0 0 8px' }}>
        🎯 {who}, 이길 수 있는 자리인가
      </div>
      {v && (
        <div className={'spot-v ' + v.tone}>
          <b>{v.label}</b><span className="n"> · 창을 잰 개찰 {num(mg.n)}건</span>
          <div className="say">{v.say}</div>
        </div>
      )}
      <div className="spot-tiles">
        {mg && mg.n >= 3 && (
          <div className="t">
            <span className="k">넓은 창 (≥0.3%p)</span>
            <b>{Math.round(mg.wide / mg.n * 100)}%</b>
            <span className="s">실측 승률 13.6% 구간</span>
          </div>
        )}
        {mg && mg.n >= 3 && (
          <div className="t">
            <span className="k">하한에 바짝 (&lt;0.02%p)</span>
            <b>{Math.round(mg.tight / mg.n * 100)}%</b>
            <span className="s">실측 승률 0.3% 구간</span>
          </div>
        )}
        {gn > 0 && (
          <div className="t">
            <span className="k">A·B 등급 비율</span>
            <b>{Math.round(ab * 100)}%</b>
            <span className="s">{num(gn)}건 중 A {gr.A} · B {gr.B} · C {gr.C} · D {gr.D}</span>
          </div>
        )}
        {np && np.n >= 3 && (
          <div className="t">
            <span className="k">참가업체수 중앙</span>
            <b>{num(np.med)}곳</b>
            <span className="s">단독 {Math.round(np.solo / np.n * 100)}% · 3곳 이하 {Math.round(np.few / np.n * 100)}%</span>
          </div>
        )}
      </div>
      {gn > 0 && (
        <div className="spot-bar" title="A·B·C·D 등급 분포">
          {['A', 'B', 'C', 'D'].map((k) => gr[k] > 0 && (
            <span key={k} className={'g' + k} style={{ flex: gr[k] }}>{k} {gr[k]}</span>
          ))}
        </div>
      )}
      <div className="note" style={{ marginTop: 8 }}>
        «창»은 1순위 투찰률이 그 개찰의 실효 낙찰하한율보다 얼마나 높았는지입니다.
        기초금액·A값이 실린 최근 개찰에서만 잽니다. 등급은 공고 목록·바로투찰과 같은 규칙입니다.
      </div>
    </div>
  )
}

/* ── 마감 전 공고 + 원클릭 금액 ────────────────────────────────
   분석에서 끝나면 안 됩니다. «그래서 지금 뭘 넣을까» 까지 이어야 씁니다.
   bidindex.json(마감 전 공고, 109KB gzip)을 이 블록이 열릴 때만 받습니다. */
const getIndex = () => getBidIndex()

export function OpenNotices({ title, match, limit = 8, hint, empty, 우선 }) {
  const [idx, setIdx] = useState(undefined)
  const [ov, setOv] = useState(null)
  useEffect(() => {
    getIndex().then(setIdx)
    getOverview().then(setOv).catch(() => {})
  }, [])
  const p50 = ov?.sjq?.p50 ?? P50_FALLBACK
  const rows = useMemo(() => {
    if (!idx || !Array.isArray(idx.r)) return []
    return indexRows(idx)
      .filter((r) => match(r))
      .filter((r) => { const d = dday(r.close); return !d || d.text !== '마감' })
      .sort((a, b) => (우선 ? (우선(b) ? 1 : 0) - (우선(a) ? 1 : 0) : 0) || String(a.close).localeCompare(String(b.close)))
      .slice(0, limit)
      .map((r) => ({ ...r, g: winGrade({ ...r, est: r.est || 0 }), qb: isReady(r) ? quickBid(r, p50) : null }))
  }, [idx, match, p50, limit, 우선])

  if (idx === undefined) return null
  return (
    <div className="spot-open">
      <div className="sec-title" style={{ margin: '14px 0 8px' }}>
        📋 {title} <span className="count">· 마감 전 {num(rows.length)}건{hint ? ` · ${hint}` : ''}</span>
      </div>
      {rows.length === 0 ? (
        <div className="note">{empty || '지금 마감 전인 공고가 없습니다.'}</div>
      ) : rows.map((r) => {
        const d = dday(r.close)
        return (
          <div className="notice slim" key={r.no}>
            <h3>{r.name}</h3>
            <div className="meta">
              <span className="inst">{r.inst}</span>
              {d && <span className={'badge ' + d.tone}>{d.text}</span>}
              {r.g && <span className={'gbadge ' + r.g.tone}>{r.g.key} {r.g.label}</span>}
              {r.base > 0 && <span className="badge n">기초 {wonShort(r.base)}</span>}
            </div>
            <div className="foot">
              {r.qb ? (
                <>
                  <span className="badge b">권장</span>
                  <b className="amt">{won(r.qb.amt)}</b>
                  <span style={{ flex: 1 }} />
                  <Link className="btn ghost sm" to={`/?no=${encodeURIComponent(r.no)}`}>💰 바로투찰</Link>
                </>
              ) : (
                <>
                  <span className="badge n">값 부족 · 계산 안 함</span>
                  <span style={{ flex: 1 }} />
                  {r.url && <a className="btn ghost sm" href={r.url} target="_blank" rel="noreferrer">나라장터 →</a>}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** 기관 이름 맞추기 — 조달청 표기가 «경상북도 경주시» 와 «경주시» 처럼 흔들려서 양쪽으로 봅니다 */
export const instMatch = (name) => {
  const n = String(name || '').replace(/\s+/g, '')
  return (r) => {
    const i = String(r.inst || '').replace(/\s+/g, '')
    return i === n || (n.length >= 3 && (i.includes(n) || n.includes(i)))
  }
}

/** 업체 맞춤 — 자주 딴 지역·기관 */
export const corpMatch = (c) => {
  const regions = Object.keys(c?.reg || {}).slice(0, 2)
  const insts = (c?.inst || []).slice(0, 3).map((x) => String(x[0]).replace(/\s+/g, ''))
  return (r) => {
    const i = String(r.inst || '').replace(/\s+/g, '')
    if (insts.some((x) => x && (i === x || i.includes(x)))) return true
    // ⚠️ r 을 통째로 넘깁니다 — sido 가 있으면 그걸 쓰고, 없을 때만 낱말로 봅니다
    return regions.some((rg) => inRegion(r, rg))
  }
}

/* ══════════════════════════════════════════════════════════════
   ✅ 참여할 수 있는 마감 전 공고 (G219 · 2026-10-09)
   소장님: 「호남산업개발이 참여 할 수 있는 공고라는 거야」 → 「공고를 보고 정말 참여가 가능한 것만 보여 줘야지. 안그래.」
   전에는 «자주 딴 지역 · 기관» 만 맞으면 보여 줘서, 기계설비 면허가 없는 회사에 기계설비 공사가 떴습니다.
   이제 공고마다 두 가지를 봅니다 — 둘 다 «조달청이 준 값» 과 «그 회사가 실제로 넣어 본 기록» 으로만:
     ① 면허: 공고가 요구하는 면허(lic) 중 그 회사가 넣어 본 면허가 있는가
              (면허가 «모두 있어야» 하는 공고(면허그룹 하나)는 전부 · «그중 하나» 묶음은 같은 묶음을 넣어 봤으면 됨)
     ② 지역 제한(rgnb): 허용 시도 안에 그 회사가 지역 제한 공고로 넣어 본 시도가 있는가
   모르면(면허가 안 적힌 공고 · 근거 없는 회사 · 지역 근거 없음) 보여 주지 않습니다 — «될 것 같다» 로 띄우지 않음.
   ⚠️ 시공능력평가액 · 실적 제한 · 공동도급 의무는 여기서 못 봅니다(조달청 목록에 없음) — 화면에 그렇게 적습니다.
   근거: build_json.py load_partner_evidence → 업체 자료 c.pl = {l: [[코드, 이름]], r: [시도]}
   ══════════════════════════════════════════════════════════════ */
/* 판정 셈은 lib/참여.js 한 곳(시험: node tools/시험_참여판정.mjs) */
const 짧은면허 = (nm) => String(nm || '').replace(/ㆍ/g, '·').replace(/공사업/g, '').replace(/ 또는 /g, '/').trim()

export function 참여공고({ c }) {
  const 합계 = !!c && !c.biz && Number(c.bzn) > 1
  const g = useMemo(() => (합계 ? null : 참여근거(c)), [c, 합계])
  const match = useMemo(() => (r) => 참여판정(r, g) === '됨', [g])
  /* 같은 «넣을 수 있음» 이면 이 회사 지역(지역 제한으로 넣어 본 시도 · 주력 지역) 공고를 앞에 */
  const 우선 = useMemo(() => {
    const 내 = new Set([...(g ? g.지역 : []), ...Object.keys((c && c.reg) || {}).slice(0, 2)])
    return (r) => String(r.sido || '').split(',').some((x) => 내.has(x.trim()))
  }, [g, c])
  const [셈, set셈] = useState(null)
  useEffect(() => {
    if (!g) return undefined
    let alive = true
    getIndex().then((idx) => {
      if (!alive) return
      const rows = indexRows(idx).filter((r) => { const d = dday(r.close); return !d || d.text !== '마감' })
      const t = { 됨: 0, 안됨: 0, 모름: 0 }
      for (const r of rows) t[참여판정(r, g)]++
      set셈(t)
    }).catch(() => {})
    return () => { alive = false }
  }, [g])
  useEffect(() => {                                       /* 숨은 누적 — 화면엔 안 보임 */
    import('./lib/받은수.jsx').then((m) => m.세기(g ? '|자가진단|참여가능' : '|자가진단|참여근거없음')).catch(() => {})
  }, [g])
  if (!c) return null
  if (합계) {
    return (
      <div className="note" style={{ marginTop: 14 }}>
        ✅ <b>참여할 수 있는 마감 전 공고</b> — 이 이름은 법인이 여럿입니다. 위에서 <b>법인을 고르시면</b> 그 회사가 넣을 수 있는 공고만 나옵니다.
      </div>
    )
  }
  if (!g) {
    return (
      <div className="note" style={{ marginTop: 14 }}>
        ✅ <b>참여할 수 있는 마감 전 공고</b> — 이 회사의 <b>면허를 확인할 투찰 기록</b>(면허가 적힌 공고에 넣은 기록)이 아직 없어
        참여 가능한 공고를 고르지 못했습니다. 확인되지 않은 공고는 띄우지 않습니다.
      </div>
    )
  }
  const 면허글 = g.면허.slice(0, 4).map((x) => 짧은면허(Array.isArray(x) ? x[1] || x[0] : x)).filter(Boolean).join(' · ')
  const 지역글 = [...g.지역].slice(0, 3).join('·')
  return (
    <>
      <OpenNotices title="참여할 수 있는 마감 전 공고" match={match} 우선={우선}
        hint={`면허 ${면허글 || '-'}${지역글 ? ` · 지역 ${지역글}` : ''}`}
        empty="지금 마감 전인 공고 중 이 회사의 면허 · 지역으로 넣을 수 있는 공고가 없습니다." />
      <div className="note sm" style={{ marginTop: 6 }}>
        이 회사가 <b>실제로 넣어 본 공고</b>의 면허 · 지역 제한으로 확인했습니다
        {셈 ? <> — 마감 전 {num(셈.됨 + 셈.안됨 + 셈.모름)}건 중 <b>넣을 수 있음 {num(셈.됨)}</b> · 면허/지역 안 맞음 {num(셈.안됨)} · 확인 못 함 {num(셈.모름)}(안 띄움)</> : null}.
        {' '}시공능력평가액 · 실적 제한 · 공동도급 조건은 공고문에서 확인하십시오.
      </div>
    </>
  )
}
