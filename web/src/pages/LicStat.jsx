import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { getLicStat } from '../lib/data.js'
import { Skeleton, Empty } from '../components.jsx'
import { num } from '../lib/fmt.js'
import { loadLicCodes, saveLicCodes } from '../lib/lic.js'

/* ══════════════════════════════════════════════════════════════
   ② 면허별 경쟁도 — 2026-09-14. 소장님: 「내 면허 경쟁도 표」

   실측에서 뒤집힌 것이 있습니다. **면허가 «걸려 있느냐»는 지렛대가 아니었습니다** —
   면허 제한 공고 74곳 vs 무제한 60곳으로, 오히려 제한 쪽이 더 붐볐습니다.
   지렛대는 «어느 면허냐» 입니다:
       산림사업법인(산림토목)  참가 중앙   7곳
       토목공사업             참가 중앙 361곳     ← 52배

   자료는 collect.py 가 개찰(참가업체수 np)에서 세어 licstat.json 으로 굽습니다.
   ⚠️ 한 공고에 면허가 여럿 걸리면 그 공고는 **각 면허에 모두** 셈에 들어갑니다.
      그래서 건수를 다 더하면 개찰 건수보다 큽니다 — 화면에 그렇게 적습니다.
   ══════════════════════════════════════════════════════════════ */
export default function LicStat() {
  const [d, setD] = useState(undefined)   // undefined=아직 · null=실패
  const [q, setQ] = useState('')
  const [mine, setMine] = useState(loadLicCodes)
  useEffect(() => { getLicStat().then((v) => setD(v || null)) }, [])
  useEffect(() => { saveLicCodes(mine) }, [mine])

  const rows = useMemo(() => {
    const r = d?.r
    if (!r) return []
    const s = q.trim()
    return Object.entries(r)
      .map(([code, v]) => ({ code, name: v[0], n: v[1], med: v[2], few: v[3] }))
      .filter((x) => !s || x.name.includes(s))
      .sort((a, b) => a.med - b.med)
  }, [d, q])

  const toggle = (code) =>
    setMine((v) => (v.includes(code) ? v.filter((x) => x !== code) : [...v, code]))

  const tone = (m) => (m < 10 ? 'few' : m < 30 ? 'mid' : m < 100 ? '' : 'many')

  return (
    <>
      <div className="sec-title" style={{ marginTop: 14 }}>
        🪪 면허별 입찰 경쟁도 <span className="count">· 개찰에 실제로 몇 곳이 붙었나</span>
      </div>

      <div className="card">
        <p className="cp" style={{ margin: 0 }}>
          승률을 가르는 건 투찰금액이 아니라 <b>몇 곳과 붙느냐</b>입니다
          (실측: 참가 2~9곳 공고는 1순위 <b>18.2%</b>, 100곳 넘으면 <b>1.6%</b>).
        </p>
        <p className="cp">
          그런데 <b>면허 제한이 걸려 있는지 여부는 지렛대가 아니었습니다</b> —
          제한 공고 74곳 vs 무제한 60곳으로 오히려 제한 쪽이 더 붐볐습니다.
          지렛대는 <b>«어느 면허냐»</b> 입니다. 아래 표에서 위아래가 <b>50배</b> 넘게 벌어집니다.
        </p>
      </div>

      <input value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="면허·업종 이름 검색" style={{ marginBottom: 10 }} />

      {d === undefined ? <Skeleton /> : d === null ? (
        <Empty icon="🪪">면허 경쟁도 자료(licstat.json)를 받지 못했습니다.<br />잠시 후 다시 열어보세요.</Empty>
      ) : rows.length === 0 ? (
        <Empty icon="🔎">그런 이름의 면허가 없습니다.</Empty>
      ) : (
        <>
          <div className="sec-title">면허 <span className="count">{num(rows.length)}종 · 참가가 적은 순</span></div>
          <div className="card licstat">
            <div className="lsrow head">
              <span className="lsn">면허·업종</span>
              <span className="lsv">참가 중앙</span>
              <span className="lsv">10곳 미만</span>
              <span className="lsv">개찰</span>
            </div>
            {rows.map((x) => (
              <button key={x.code} className={'lsrow' + (mine.includes(x.code) ? ' on' : '')}
                onClick={() => toggle(x.code)}>
                <span className="lsn">{x.name}{mine.includes(x.code) ? <em className="mymark"> 내 면허</em> : null}</span>
                <span className={'lsv big ' + tone(x.med)}>{num(x.med)}곳</span>
                <span className="lsv">{x.few.toFixed(1)}%</span>
                <span className="lsv dim">{num(x.n)}건</span>
              </button>
            ))}
          </div>

          <div className="card">
            <div className="note">
              누르면 <b>내 면허</b>로 저장됩니다 — 공고 탭의 「✨ 내 면허 맞춤」이 같은 값을 씁니다.
              이 브라우저에만 저장되고 회원가입은 없습니다.
              <br /><Link to="/live">내 면허로 공고 보기 →</Link> · <Link to="/tools">🧰 건설 도구</Link>
            </div>
          </div>

          <div className="card">
            <div className="note sm">
              <b>어떻게 센 숫자인가</b> — 조달청이 개찰 결과에 실어 주는 <b>참가업체수</b>를 면허별로 모은 것입니다
              (최근 개찰 자료 기준, 개찰 {num(d.min || 20)}건 이상인 면허만 싣습니다).
              한 공고에 면허가 여럿 걸리면 그 공고는 <b>각 면허에 모두</b> 들어갑니다 — 그래서 건수를 다 더하면 개찰 건수보다 큽니다.
              <br />
              <b>이 표로 알 수 있는 것과 없는 것</b> — 「이 면허 공고는 대체로 몇 곳이 붙는다」는 알 수 있습니다.
              「이 면허를 따면 딴다」는 <b>알 수 없습니다.</b> 면허를 새로 따는 데는 자본금·기술자·실적 요건이 붙고,
              경쟁이 적은 면허는 그만큼 공고 수도 적습니다.
            </div>
          </div>
        </>
      )}
    </>
  )
}
