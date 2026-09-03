import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJSON, getOverview } from './lib/data.js'
import { quickBid, isReady, P50_FALLBACK } from './lib/bidmath.js'
import { winGrade } from './lib/winodds.js'
import { won, wonShort, num, dday, inRegion } from './lib/fmt.js'

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
let _idxCache = null
const getIndex = () => _idxCache || (_idxCache = getJSON('/data/bidindex.json').catch(() => null))

export function OpenNotices({ title, match, limit = 8, hint }) {
  const [idx, setIdx] = useState(undefined)
  const [ov, setOv] = useState(null)
  useEffect(() => {
    getIndex().then(setIdx)
    getOverview().then(setOv).catch(() => {})
  }, [])
  const p50 = ov?.sjq?.p50 ?? P50_FALLBACK
  const rows = useMemo(() => {
    if (!idx || !Array.isArray(idx.r)) return []
    const f = idx.f; const ix = Object.fromEntries(f.map((k, i) => [k, i]))
    const now = Date.now()
    return idx.r
      .map((a) => Object.fromEntries(f.map((k, i) => [k, a[i]])))
      .filter((r) => match(r))
      .filter((r) => { const d = dday(r.close); return !d || d.text !== '마감' })
      .sort((a, b) => String(a.close).localeCompare(String(b.close)))
      .slice(0, limit)
      .map((r) => ({ ...r, g: winGrade({ ...r, est: r.est || 0 }), qb: isReady(r) ? quickBid(r, p50) : null }))
  }, [idx, match, p50, limit])

  if (idx === undefined) return null
  return (
    <div className="spot-open">
      <div className="sec-title" style={{ margin: '14px 0 8px' }}>
        📋 {title} <span className="count">· 마감 전 {num(rows.length)}건{hint ? ` · ${hint}` : ''}</span>
      </div>
      {rows.length === 0 ? (
        <div className="note">지금 마감 전인 공고가 없습니다.</div>
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
    return regions.some((rg) => inRegion({ inst: r.inst, name: r.name }, rg))
  }
}
