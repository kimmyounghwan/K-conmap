import { SpotBlock, OpenNotices, corpMatch } from '../Spot.jsx'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { searchCorp } from '../lib/data.js'
import { AgencyPicker, Bars, Months, Tile, Empty } from '../components.jsx'
import { wonShort, pct, num, dateFull, normCorp } from '../lib/fmt.js'
import { ReportStrip } from './Report.jsx'

export default function Analysis() {
  const [sp, setSp] = useSearchParams()
  const mode = sp.get('m') === 'corp' ? 'corp' : 'agency'
  const setMode = (m) => setSp(m === 'corp' ? { m: 'corp' } : {}, { replace: true })

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🔍 분석 <span className="count">· 3년치 낙찰 데이터</span>
      </div>
      <div className="seg">
        <button className={mode === 'agency' ? 'on' : ''} onClick={() => setMode('agency')}>발주기관 분석</button>
        <button className={mode === 'corp' ? 'on' : ''} onClick={() => setMode('corp')}>업체 자가진단</button>
      </div>
      {mode === 'agency' ? <AgencyTab /> : <CorpTab />}
    </>
  )
}

/* ── 발주기관 ─────────────────────────── */
/* ★ 2026-09-04 — 고르면 «전용 주소»로 갑니다 (/agency/{기관}).
   전에는 이 탭 안에서 화면만 바뀌고 주소는 /analysis 그대로였습니다.
   그래서 그 화면을 카톡으로 보낼 수가 없었습니다 — 받은 사람은 빈 검색창만 봤습니다.
   이제 주소가 바뀌므로 복사·공유·즐겨찾기·뒤로가기가 전부 제대로 됩니다.
   화면을 두 벌로 그리지 않습니다 — 결과는 전용 페이지 한 곳에서만 그립니다. */
function AgencyTab() {
  const [name, setName] = useState('')
  const navigate = useNavigate()

  return (
    <>
      <div className="card">
        <AgencyPicker value={name} autoFocus
          onPick={({ name: n }) => { setName(n); navigate('/agency/' + encodeURIComponent(n)) }} />
      </div>
      <Empty icon="🏛️">
        발주기관을 검색해보세요.<br />
        투찰률 히트맵 · 독식 업체 · 발주 시기 · 금액대를 한 번에 봅니다.
      </Empty>
    </>
  )
}

/* ── 업체 자가진단 ────────────────────── */
function CorpTab() {
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const [deep, setDeep] = useState(false)     // 이름 가운데도 찾기
  const timer = useRef(null)
  const navigate = useNavigate()

  /* ⚠️ 기본은 «이름 앞»으로만 찾습니다 — 업체 이름 목록이 gzip 348KB 라 늘 받을 수 없습니다.
     실측: 「대영」은 앞으로 찾아도 119곳 전부 나옵니다. 그런데 「종합건설」은 9곳(실제 2,867곳),
     「개발」은 0곳(실제 2,420곳)입니다. 그래서 «가운데로도 찾기» 는 버튼으로 둡니다.
     한 번 누르면 그 브라우저에서는 계속 켜져 있습니다(파일을 기억하므로 두 번 안 받습니다). */
  useEffect(() => {
    clearTimeout(timer.current)
    const s = normCorp(q)
    if (s.length < 1) { setList([]); return }
    timer.current = setTimeout(() => {
      searchCorp(s, deep).then((r) => {
        setList(r)
        setOpen(true)
        /* 🚨 2026-09-18 — 앞글자로 못 찾았으면 «이름 가운데»까지 한 번 더 찾습니다.
           그래야 「없습니다」가 사실이 됩니다. 앞글자로만 찾아 놓고 없다고 하면 거짓말입니다
           (실측: 「종합건설」 앞글자 9곳 · 실제 2,867곳 · 「개발」 0곳 · 실제 2,420곳).
           ⚠️ 이름 목록은 gzip 263KB 입니다. 그래서 «못 찾았을 때만», 세 글자 이상일 때만,
              그리고 한 번 받으면 그 브라우저가 기억합니다. 늘 받으면 안 됩니다. */
        if (!deep && r.length === 0 && s.length >= 3) setDeep(true)
      })
    }, 250)
    return () => clearTimeout(timer.current)
  }, [q, deep])

  /* ★ 고르면 «전용 주소»로 갑니다 (/corp/{업체}).
     ⚠️ 사업자번호로 갈라 놓은 키(«이름#번호»)는 주소에 넣지 않습니다 —
        남의 사업자번호가 URL 과 검색결과에 남습니다. 그 갈래는 화면 안에서만
        고르도록 라우터 state 로 넘깁니다(주소에는 안 남습니다). */
  /* «못 찾음» 은 «이름 가운데까지 뒤지고도 0곳» 일 때만입니다. 앞글자로만 찾아 0곳인 것은
     아직 못 찾은 것이지 없는 것이 아닙니다 — 그때 「없습니다」 라고 하면 거짓말이 됩니다. */
  const 못찾음 = deep && normCorp(q).length >= 2 && list.length === 0

  const pick = (item) => {
    setOpen(false)
    const base = String(item.key).split('#')[0]
    navigate('/corp/' + encodeURIComponent(base),
             item.key.includes('#') ? { state: { firm: item.key } } : undefined)
  }


  return (
    <>
      <div className="card">
        <div className="field">
          <label>업체명 <span className="hint">— «주식회사» 는 빼고 입력해도 됩니다</span></label>
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)}
            placeholder="예: 대한건설, ○○종합건설" autoFocus />
          {/* ⚠️ 전에는 `list.length > 0` 일 때만 이 상자를 그렸습니다. 그래서
              「개발」처럼 **0곳** 인 검색에서는 «이름 가운데로도 찾기» 버튼조차 안 보였습니다 —
              정작 그 버튼이 필요한 자리에서 사라진 것입니다 (2026-09-04에 실제로 그랬습니다).
              → 검색어가 있으면 결과가 0곳이어도 상자를 띄웁니다. */}
          {open && normCorp(q).length > 0 && (list.length > 0 || !deep) && (
            <div className="suggest">
              {list.length === 0 && (
                <div className="nohit">
                  앞에서부터 찾은 결과가 없습니다
                  <span className="sub2"> · 3년 동안 «1순위(낙찰)»가 없으면 여기 안 나옵니다</span>
                </div>
              )}
              {/* 🚨 2026-09-18 — 줄마다 «어느 회사인지» 를 적습니다.
                  소장님: 「전남 3을 클릭하면 바로 회사분석이 나와. 어느회사인지 모르잖아.」
                  전에는 네 줄이 전부 「국토건설」 한 이름으로 찍혔습니다. 실제 상호는
                  (주)국토건설 · 국토건설(주) · 국토건설 주식회사 로 다 다른데 목록에 안 실었습니다.
                  그래서 «고르는 줄(합계)» 과 «법인 한 곳 줄» 이 구별되지 않았습니다.
                  ⚠️ 합계 줄에는 상호를 찍지 않습니다 — 합계는 한 법인이 아닙니다.
                     대신 「법인 N곳 — 골라 보기 →」 라고 무엇이 나올지 미리 적습니다. */}
              {list.map((it) => {
                const 모음 = !it.biz && it.bzn > 1
                return (
                  <button key={it.key} className={모음 ? 'grp' : undefined} onClick={() => pick(it)}>
                    <span className="c">{num(it.n)}건</span>{모음 ? it.label : (it.nm || it.label)}
                    {it.biz
                      ? <span className="sub2"> · {it.reg} · {it.ceo || '대표 미상'}
                          {' '}({it.biz.slice(0, 3)}-{it.biz.slice(3, 5)}-•••)</span>
                      : <>
                          {it.reg && <span className="sub2"> · {it.reg}</span>}
                          {모음 && <span className="mix">법인 {it.bzn}곳 — 골라 보기 →</span>}
                        </>}
                  </button>
                )
              })}
              {!deep && (
                <button className="deepmore" onClick={(e) => { e.preventDefault(); setDeep(true) }}>
                  🔎 찾는 업체가 없나요? <b>이름 가운데로도 찾기</b>
                  <span className="sub2"> · 「종합건설」·「개발」처럼 뒷말로 찾을 때 (한 번만 받습니다)</span>
                </button>
              )}
            </div>
          )}
        </div>
        <div className="note">
          3년치 개찰 결과에서 «1순위(낙찰)» 기록만 찾습니다. 투찰만 하고 떨어진 건은 집계되지 않습니다.
        </div>
      </div>

      {/* 🚨 2026-09-18 — 소장님: 「태선종합건설은 왜 없지? 3년 동안 안된건가?」
          실측: 3년치 개찰에 1순위가 한 건도 없어서 안 나온 것이었습니다. 그런데 넣기는
          했습니다 — 877곳 중 8위, 1순위와 355,950원 차이(13.4억 공사)인 건도 있었습니다.
          그때 화면이 한 말은 「찾은 결과가 없습니다」 한 줄뿐이었습니다.
          **자기 회사 이름을 치고 아무것도 못 찾은 사람** 이 성적표가 가장 필요한 사람입니다.
          그 자리에서 아무 말도 안 하면 그냥 나가 버립니다. 업체 35,865곳 중 26,645곳(74%)이
          이 경우입니다. */}
      {못찾음 ? (
        <div className="card nofind">
          <div className="sec-title" style={{ margin: 0 }}>
            «{q.trim()}» 이(가) 안 나오십니까?
          </div>
          <p>
            이 화면은 3년치 개찰에서 <b>«1순위(낙찰)» 기록만</b> 모읍니다.
            그래서 <b>3년 동안 한 번도 못 따셨으면 여기엔 안 나옵니다.</b>
            넣으신 적이 없어서가 아닙니다.
          </p>
          <p className="muted" style={{ marginBottom: 0 }}>
            실제로 있었던 일입니다 — 어느 회사는 <b>877곳 가운데 8위</b>로 밀렸는데,
            1순위와 차이가 <b>35만 5천원</b>이었습니다. 13억 4천짜리 공사에서요.
            그 회사도 이 화면에서는 «기록 없음»입니다.
          </p>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <Link className="btn primary" to="/report">📊 넣은 것 전부 보기 — 입찰 성적표</Link>
            <Link className="btn ghost" to="/qna">💬 성적표 신청하기</Link>
          </div>
          <p className="note sm" style={{ marginBottom: 0 }}>
            성적표는 <b>떨어진 것·실격된 것까지</b> 찾아 A4 한 벌로 만들어 드립니다.
            <b> 낙찰이 한 건도 없어도 나옵니다.</b> 값은 받지 않습니다.
          </p>
        </div>
      ) : (
        <Empty icon="🏢">
          내 회사 이름을 넣어보세요.<br />
          어느 지역 · 어느 기관에서 강한지, 평균 투찰률이 얼마인지 보여드립니다.
        </Empty>
      )}

      {/* 📊 성적표 — 여기 오신 분이 바로 그 손님입니다 (2026-09-15) */}
      <ReportStrip />
    </>
  )
}



/* ── 업체 성적표 본문 ───────────────────────────────────────────
   ★ 2026-09-04 — 검색 상자와 갈라냈습니다.
   같은 내용을 «분석 탭»(검색해서 보기) 과 «/corp/{업체} 페이지»(주소로 바로 보기)
   두 곳이 씁니다. 두 벌로 적으면 언젠가 어긋납니다 — 여기 하나만 고칩니다. */
export function CorpReport({ c, ov, onPickFirm, onAll, base: base0 }) {
  const regions = c ? Object.entries(c.reg || {}) : []
  /* 🚨 2026-09-18 — 소장님: 「클릭하면 업체 하나만 나와. 그리고 뒤로가기 하면 뒷 화면이 안나와」
     법인 하나를 고르면 **나머지 세 곳으로 가는 길이 화면에서 사라졌습니다.** 돌아가려면
     브라우저 «뒤로» 뿐인데 그것도 안 먹었습니다(기록을 안 남겼습니다 — CorpPage.jsx 에서 고침).
     → 이제 **고른 뒤에도 같은 자리에 네 곳이 다 보입니다.** 지금 보는 회사에는 표를 달고,
       나머지는 눌러서 바로 갈아탈 수 있게 합니다. «합계로 돌아가기» 도 같은 칸에 둡니다.
     ⚠️ 줄마다 **상호·지역·대표**를 찍습니다. 사업자번호 앞자리와 대표 이름만으로는
        어느 회사인지 알 수 없습니다 (8절 55). 상호·지역은 검색 색인에서 가져옵니다 —
        같은 첫 글자 묶음이라 검색으로 들어오셨으면 이미 받아 둔 파일입니다. */
  const base = base0 || (c ? normCorp(c.name) : '')
  const 여럿일까 = !!c && (c.bzn > 1 || !!c.biz)
  const [법인들, set법인들] = useState(null)
  useEffect(() => {
    if (!여럿일까 || !base) { set법인들(null); return }
    let alive = true
    searchCorp(base)
      .then((r) => {
        if (!alive) return
        set법인들((r || []).filter((x) => x.biz && x.key === `${base}#${x.biz}`)
          .sort((a, b) => b.n - a.n))
      })
      .catch(() => { if (alive) set법인들([]) })
    return () => { alive = false }
  }, [여럿일까, base])

  /* 업체 자료의 bz 목록(합계 화면에만 있습니다)과 색인을 맞춰 둡니다 — 아는 쪽을 씁니다 */
  const bzMap = new Map((c && c.bz ? c.bz : []).map(([bz, ceo, cnt]) => [bz, { ceo, cnt }]))
  const 줄들 = (법인들 && 법인들.length
    ? 법인들.map((x) => ({ bz: x.biz, nm: x.nm || c.name, reg: x.reg,
                          ceo: x.ceo || (bzMap.get(x.biz) || {}).ceo || '',
                          cnt: (bzMap.get(x.biz) || {}).cnt ?? x.n }))
    : [...bzMap.entries()].map(([bz, v]) => ({ bz, nm: c.name, reg: '', ceo: v.ceo, cnt: v.cnt })))
  const 곳수 = Math.max(줄들.length, c ? (c.bzn || 0) : 0)
  const 고른자리 = !!(c && c.biz)
  const 고르는칸 = (여럿일까 && 줄들.length > 1) ? (
    <div className="mixbox">
      <div className="h">
        {고른자리
          ? `이 이름으로 등록된 법인이 ${num(곳수)}곳입니다 — 다른 회사로 바꿔 보십시오`
          : `⚠️ 이 이름으로 등록된 법인이 ${num(곳수)}곳입니다 — 어느 회사인지 고르십시오`}
      </div>
      {!고른자리 && (
        <p>
          아래 숫자는 <b>{num(c.bzn)}개 법인의 실적이 합쳐진 값</b>입니다. 내 회사만의 기록이 아닙니다.
          조달청 자료가 업체를 이름으로만 주는 구간이 있어 아직 완전히 갈라내지 못했습니다 —
          확인된 {num(c.bzk)}건의 내역은 아래와 같습니다.
        </p>
      )}
      <div className="firms">
        {줄들.map((x) => {
          const 지금 = 고른자리 && x.bz === c.biz
          return (
            <button key={x.bz} className={'firm' + (지금 ? ' on' : '')} disabled={지금}
              onClick={() => !지금 && onPickFirm && onPickFirm(`${base}#${x.bz}`)}>
              <span className="nm2">{x.nm}{지금 && <em className="now">지금 보는 회사</em>}</span>
              <span className="no">{x.bz.slice(0, 3)}-{x.bz.slice(3, 5)}-•••</span>
              <span className="ceo">{x.reg ? `${x.reg} · ` : ''}{x.ceo || '대표 미상'}</span>
              <span className="cnt">{num(x.cnt)}건</span>
              <span className="go">{지금 ? '' : '이 법인만 보기 →'}</span>
            </button>
          )
        })}
      </div>
      {고른자리 && onAll && (
        <button className="btn ghost sm" style={{ marginTop: 8 }} onClick={onAll}>
          ← {num(곳수)}곳 합계로 돌아가기
        </button>
      )}
    </div>
  ) : null
  return (
    <>
          {고르는칸}
          <div className="card">
            <div style={{ fontSize: 16, fontWeight: 800 }}>{c.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 3 }}>
              {c.biz
                ? <>사업자 {c.biz.slice(0, 3)}-{c.biz.slice(3, 5)}-•••
                    {c.ceo ? ` · 대표 ${c.ceo}` : ''} · 누적 1순위 {num(c.n)}건</>
                : <>누적 1순위 {num(c.n)}건</>}
            </div>
            {c.biz && (
              <div className="onefirm">이 법인 하나만의 기록입니다 — 동명 업체와 섞이지 않았습니다</div>
            )}
            <p style={{ fontSize: 13.5, lineHeight: 1.7, marginTop: 10, marginBottom: 0, wordBreak: 'keep-all' }}>
              평균 투찰률은 <b>{pct(c.s?.avg, 2)}</b>입니다.
              {regions.length > 0 && <> 주력 지역은 <b>{regions[0][0]}</b>({regions[0][1]}건)이고,</>}
              {c.m && <> 낙찰이 가장 많았던 달은 <b>{c.m.indexOf(Math.max(...c.m)) + 1}월</b>입니다.</>}
            </p>
          </div>


          {/* ★ 2026-09-03 — 내가 이기는 자리인가 (창 · 등급 · 경쟁) */}
          <SpotBlock spot={c.spot} who="내가 딴 자리" />

          {/* ★ 최근 순위 기록 — «진 투찰»이 처음으로 보이는 자리. 소장님:
              「30위 안에 있으면 있고, 없으면 없다라고 정확히 밝히면서. 바로투찰이었다면 이랬을 것이다.」 */}
          <RankHistory c={c} ov={ov} />

          {/* ★ 2026-09-09 — 자주 만나는 상대. 순위(낮은 순 30곳)를 받은 개찰에서
              같은 자리에 함께 있었던 업체를 셉니다. 평가는 하지 않습니다 — 사실만. */}
          <Rivals c={c} ov={ov} />

          <div className="tiles c4" style={{ marginBottom: 10 }}>
            <Tile k="총 낙찰 (3년)" v={num(c.n)} small />
            <Tile k="평균 투찰률" v={pct(c.s?.avg, 2)} small />
            <Tile k="평균 금액" v={c.amt ? wonShort(c.amt.avg) : '-'} small />
            <Tile k="최대 금액" v={c.amt ? wonShort(c.amt.max) : '-'} small />
          </div>

          {regions.length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>📍 지역별 낙찰</div>
              <Bars rows={regions} unit="" />
            </div>
          )}

          {(c.inst || []).length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 6px' }}>🏛 자주 낙찰받은 기관</div>
              {c.inst.map(([i, v], k) => (
                <div className="row" key={k}>
                  <span className="badge n">{k + 1}</span>
                  <div className="grow"><div className="t">{i}</div></div>
                  <span className="r">{num(v)}건</span>
                </div>
              ))}
            </div>
          )}

          {c.h?.length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>📊 내 투찰률 분포 <span className="count">0.5% 단위</span></div>
              <Bars rows={c.h} />
            </div>
          )}

          {c.m && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 10px' }}>📅 월별 낙찰 흐름</div>
              <Months data={c.m} />
            </div>
          )}

          {(c.cases || []).length > 0 && (
            <div className="card">
              <div className="sec-title" style={{ margin: '0 0 6px' }}>🗂 최근 낙찰</div>
              {c.cases.map((x, i) => (
                <div className="row" key={i}>
                  <div className="grow">
                    <div className="t" style={{ whiteSpace: 'normal' }}>{x[0]}</div>
                    <div className="d">{dateFull(x[1])} · {x[2]}
                      {/* [5] 등급 · [6] 창(하한 위 %p) · [7] 참가업체수 — 기초금액 있는 최근 건만 */}
                      {x[5] && <span className={'gbadge ' + (x[5] === 'A' ? 'good' : x[5] === 'B' ? 'mid' : 'bad')} style={{ marginLeft: 6 }}>{x[5]}</span>}
                      {x[6] != null && <span className="badge n" style={{ marginLeft: 4 }}>창 {x[6] >= 0 ? '+' : ''}{x[6].toFixed(3)}%p</span>}
                      {x[7] > 0 && <span className="badge n" style={{ marginLeft: 4 }}>{num(x[7])}곳</span>}
                    </div>
                  </div>
                  <span className="r">{x[3] != null ? pct(x[3], 3) : '-'}<br />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{wonShort(x[4])}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* ★ 내 자리에 맞는 마감 전 공고 — 자주 딴 지역·기관으로 걸러서 원클릭 금액까지 */}
          <OpenNotices title="내 자리에 맞는 마감 전 공고" match={corpMatch(c)}
            hint={`${Object.keys(c.reg || {}).slice(0, 2).join('·') || '전국'} · 자주 딴 기관`} />
    </>
  )
}

/* ── 최근 순위 기록 ────────────────────────────────────────────
   3년치엔 1순위만 있습니다. «진 투찰»은 개찰 순위(낮은 순 30곳)를 받기 시작한 뒤의 것뿐입니다.
   그래서 분모를 항상 밝힙니다 — «우리가 순위를 받은 N개 개찰 중». 30위 밖은 자료에 없으니 «없다»고만 합니다.
   rec = [공고명, 날짜, 기관, 내등수, 총참가, 내투찰률, 내금액, baro]
   baro = [등수 | 0(실격) | -1(30위 밖), 바로투찰금액] 또는 null(기초·A값 없어 계산 안 함) */
/* 🤝 자주 만나는 상대 (2026-09-09)
 *
 * 소장님: 「경쟁사 지도부터 만들어 볼까?」 — 지리적 «지도»가 아니라 «명단»으로 갔습니다.
 *   알고 싶은 것은 위치가 아니라 «누가 내 앞을 막고 있나» 이기 때문입니다.
 *
 * ⚠️ 세 가지를 지킵니다 (실측하며 정한 것)
 *   1. 평가하지 않습니다. 「이 회사는 늘 진다」 같은 말을 쓰지 않습니다 — 사실(횟수)만 적습니다.
 *   2. 표본을 항상 앞에 적습니다. 순위를 받은 개찰은 아직 전체의 일부입니다.
 *   3. 실격 투찰은 빼고 셌습니다. corps 는 «낮은 금액 순 30곳» 이라 하한 아래가 섞여 있어,
 *      그냥 줄 순서로 «앞섰다» 를 판정하면 실격한 곳이 1위로 보입니다(build_json.py 참고).
 */
function Rivals({ c, ov }) {
  const rows = Array.isArray(c?.rival) ? c.rival : []
  /* ⚠️ 2026-09-16 — 맞대결 표는 «이름» 단위입니다. 법인 칸(사업자번호)에 실으면
     남의 맞대결이 됩니다. build_json 이 이제 안 싣지만, 옛 자료가 남아 있어도 막습니다. */
  if (!rows.length || c?.biz) return null
  const pool = ov?.rankPool || 0
  const most = rows[0]?.[1] || 1
  return (
    <div className="card rivals">
      <div className="sec-title" style={{ margin: '0 0 6px' }}>
        🤝 자주 만나는 상대
        {pool > 0 && <span className="count">· 순위를 받은 개찰 {num(pool)}건에서</span>}
      </div>
      <div className="rv-list">
        {rows.map(([nm, met, win], i) => {
          const rate = met ? Math.round((win / met) * 100) : 0
          return (
            <div className="rv" key={i}>
              <div className="rv-top">
                <span className="rv-nm">{nm}</span>
                <span className="rv-met"><b>{num(met)}</b>번 마주침</span>
              </div>
              <div className="rv-bar" aria-hidden="true">
                <i style={{ width: `${Math.max(6, Math.round((met / most) * 100))}%` }} />
              </div>
              <div className="rv-sub">
                <span className="w">내가 앞선 것 <b>{num(win)}번</b> · 상대가 앞선 것 {num(met - win)}번</span>
                <span className={`rv-tag ${rate >= 60 ? 'up' : rate <= 40 ? 'dn' : ''}`}>{rate}%</span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="note" style={{ marginTop: 8 }}>
        같은 개찰에 <b>함께 투찰</b>한 횟수입니다. 낙찰하한 아래(실격) 투찰은 빼고 셌으므로,
        «앞섰다»는 <b>살아남은 금액 중에서 더 낮게 썼다</b>는 뜻입니다.
        순위는 낮은 금액 순 <b>30곳까지만</b> 받으므로 31위 밖에서 만난 것은 여기에 없습니다.
        2번 이상 마주친 상대만 싣습니다.
      </div>
    </div>
  )
}

function RankHistory({ c, ov }) {
  const pool = ov?.rankPool || 0
  const recs = Array.isArray(c?.rank) ? c.rank : []
  /* «이 법인 번호로 맞춘 기록» 인지 «이름으로 묶은 기록» 인지 (build_json 의 rkby) */
  const byBiz = c?.rkby === 'biz' || !!c?.biz
  if (!pool && !recs.length) return null
  const ranks = recs.map((r) => r[3]).filter((v) => v > 0)
  const wins = recs.filter((r) => r[3] === 1).length
  const baroKnown = recs.filter((r) => r[7])
  const baroWin = baroKnown.filter((r) => r[7][0] === 1).length
  const baroDq = baroKnown.filter((r) => r[7][0] === 0).length
  const better = baroKnown.filter((r) => r[7][0] > 0 && r[7][0] < r[3]).length
  const worse = baroKnown.filter((r) => (r[7][0] > r[3] && r[7][0] > 0) || r[7][0] === -1 || r[7][0] === 0).length
  const med = ranks.length ? [...ranks].sort((a, b) => a - b)[Math.floor(ranks.length / 2)] : null
  /* ⚠️ 「바로투찰이었다면 0건 1순위」 는 맞는 값인데 **쓸모가 없었습니다** — 바로 위 「1순위 0건」과
     똑같은 0 을 두 번 보여주면서, 정작 중요한 «24위 → 2위» 는 아래 줄에 묻혀 있었습니다
     (소장님: 「0건 1순위라고 나와」). 그래서 **등수 중앙**을 앞세웁니다.
     30위 밖(-1)·실격(0)은 «더 나쁜 쪽»으로 정렬해야 중앙값이 낙관적으로 안 나옵니다. */
  const baroVals = baroKnown
    .map((r) => (r[7][0] === 0 ? 9999 : r[7][0] === -1 ? 999 : r[7][0]))
    .sort((a, b) => a - b)
  const bMedRaw = baroVals.length ? baroVals[Math.floor(baroVals.length / 2)] : null
  const bMed = bMedRaw != null && bMedRaw > 0 && bMedRaw < 999 ? bMedRaw : null

  return (
    <div className="card rankhist">
      <div className="sec-title" style={{ margin: '0 0 6px' }}>
        🥇 최근 순위 기록 <span className="count">
          · 순위를 받은 개찰 {num(pool)}건 중{byBiz ? ' · 이 법인(사업자번호)만' : ''}</span>
      </div>
      {recs.length === 0 ? (
        <div className="note">
          우리가 순위(낮은 순 30곳)를 받은 최근 개찰 <b>{num(pool)}건</b>에
          {c?.biz ? <> <b>이 법인(사업자번호 기준)</b>은</> : <> 이 업체는</>} <b>30위 안에 없습니다.</b>
          {' '}참여를 안 했거나, 했더라도 30위 밖이었습니다 — 어느 쪽인지는 자료가 말해주지 않습니다.
          {' '}(순위는 2026-09-02부터 받기 시작했습니다. 며칠 지나면 더 쌓입니다)
          {c?.biz && (
            <><br /><b>※ 같은 이름의 다른 법인 기록은 여기에 싣지 않습니다.</b>{' '}
            위의 「총 낙찰 {num(c?.n ?? 0)}건」은 <b>3년치</b>이고 이 칸은 <b>순위를 받은 최근 개찰</b>만 봅니다 —
            기간이 달라서 두 숫자는 일치하지 않는 것이 정상입니다.</>
          )}
        </div>
      ) : (
        <>
          <div className="rh-sum">
            <div className="t"><span className="k">30위 안에 든 개찰</span><b>{num(recs.length)}건</b><span className="s">{num(pool)}건 중</span></div>
            <div className="t"><span className="k">1순위</span><b>{num(wins)}건</b><span className="s">{recs.length ? Math.round(wins / recs.length * 100) : 0}%</span></div>
            {med != null && <div className="t"><span className="k">등수 중앙</span><b>{num(med)}위</b><span className="s">30위 안에서</span></div>}
            {baroKnown.length > 0 && (
              <div className="t"><span className="k">바로투찰이었다면</span>
                <b>{bMed != null ? `등수 중앙 ${num(bMed)}위` : `1순위 ${num(baroWin)}건`}</b>
                <span className="s">
                  {med != null && bMed != null ? `내 ${num(med)}위 · ` : ''}
                  {num(baroKnown.length)}건 계산 · 1순위 {num(baroWin)} · 실격 {num(baroDq)}
                </span></div>
            )}
          </div>
          {/* 🚨 2026-09-16 소장님: 「1순위 한번인데, 총낙찰은 2번이야. 뭐가 안맞지 않아?」
              두 숫자는 «기간»이 다릅니다. 적어 두지 않으면 «틀린 화면» 으로 읽힙니다. */}
          <div className="note" style={{ margin: '2px 0 8px' }}>
            ⏱ 위 「총 낙찰 {num(c?.n ?? 0)}건」은 <b>3년치</b> 낙찰이고, 이 칸의 숫자는{' '}
            <b>순위를 받은 최근 개찰 {num(pool)}건</b> 안에서만 센 것입니다.
            기간이 달라서 두 숫자는 <b>일치하지 않는 것이 정상</b>입니다
            {byBiz ? <> · 이 칸은 <b>이 법인의 사업자번호로만</b> 맞춘 기록입니다</> : null}.
          </div>
          {baroKnown.length > 0 && (
            <div className="rh-verdict">
              {better > worse
                ? <>바로투찰 금액이 내 금액보다 <b>등수가 좋았던 개찰 {num(better)}건</b>, 나빴던 {num(worse)}건. 내 금액이 권장보다 높게 가는 편입니다 — 등급이 좋은 자리에서 권장을 써볼 만합니다.</>
                : better < worse
                ? <>내 금액이 바로투찰보다 <b>등수가 좋았던 개찰 {num(worse)}건</b>, 나빴던 {num(better)}건. 권장보다 낮게 쓰는 편입니다 — 이기면 크지만 실격도 늘어납니다. 바로투찰 실격 {num(baroDq)}건과 내 실격을 견줘 보세요.</>
                : <>바로투찰과 내 금액의 등수가 비슷합니다({num(better)} : {num(worse)}). 금액보다 «어디에 넣느냐»(등급)가 남은 변수입니다.</>}
            </div>
          )}
          <div className="rh-list">
            {recs.map((r, i) => {
              const b = r[7]
              const bTxt = !b ? '계산 안 함' : b[0] === 0 ? '실격' : b[0] === -1 ? '30위 밖' : `${num(b[0])}위`
              const bTone = !b ? 'n' : b[0] === 0 ? 'r' : b[0] === 1 ? 'g' : b[0] === -1 ? 'n' : 'b'
              return (
                <div className="row" key={i}>
                  <div className="grow">
                    <div className="t" style={{ whiteSpace: 'normal' }}>{r[0]}</div>
                    <div className="d">{dateFull(r[1])} · {r[2]}{r[5] != null ? ` · ${pct(r[5], 3)}` : ''}</div>
                  </div>
                  <span className="r">
                    <span className={'badge ' + (r[3] === 1 ? 'g' : 'b')}>{num(r[4])}곳 중 {num(r[3])}위</span>
                    <br />
                    <span className={'badge ' + bTone} style={{ marginTop: 3 }} title={b ? `바로투찰 ${wonShort(b[1])}` : '기초금액·A값이 없어 계산하지 않았습니다'}>
                      바로투찰 {bTxt}
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
          <div className="note" style={{ marginTop: 8 }}>
            조달청 개찰 순위(낮은 금액 순 30곳)에서 이 업체를 찾은 것입니다. «바로투찰 등수»는 그 개찰의 확정 예정가격으로
            하한을 구해, 권장금액이 30곳 중 몇 번째였을지 센 것입니다. 기초금액·A값이 없는 개찰은 계산하지 않습니다.
          </div>
        </>
      )}
    </div>
  )
}
