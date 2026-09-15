import { useParams, Link } from 'react-router-dom'
import { askAfter } from '../AskComment'
import DATA from '../data/cad.json'
import { Empty } from '../components.jsx'
import { JeoksanStrip } from './Jeoksan.jsx'

/**
 * /cad · /cad/{slug} — 「캐드 유틸」 (2026-09-14)
 *
 * 소장님: 「무료 배포하자. 따로 탭을 만들고, 설명서는 K-건설맵 사이트에.
 *         그래야 사람들이 더 들어오지」
 *
 * 왜 만드나
 *   ① 현장에서 매일 쓰는 것입니다. 「캐드 면적 리습」·「좌표 찍는 리습」은
 *      검색 경쟁이 약하고 오래 살아남는 말입니다.
 *   ② 자료(개찰·공고)와 달리 **변하지 않습니다.** 한 번 구워 두면 계속 일합니다.
 *   ③ 전송량이 거의 0 입니다 — 리습은 60KB 짜리 글자 파일입니다.
 *
 * ⚠️ 명령 설명은 src/data/cad.json 한 곳에만 있습니다.
 *    화면(여기)과 미리굽기(prerender.py)가 모두 그 파일을 읽습니다.
 *
 * ⚠️ 리습에는 «받은 날 + 30일» 유효기간이 박혀 있습니다(tools/stamp_lisp.py 가 찍습니다).
 *    돌아다니는 사본이 멈추고 사람이 여기로 받으러 오게 하기 위한 것입니다.
 *    빌드 때 반드시 stamp 를 돌려야 합니다 — 안 돌리면 2099 년이 박혀 나갑니다.
 */

const CMDS = DATA.cmds || []

export function bySlug(slug) {
  return CMDS.find((c) => c.slug === slug) || null
}

/* 받기 단추 — 눌린 횟수를 GA4 로 셉니다(유료 전환을 판단할 근거). */
function dl(what) {
  try {
    if (window.gtag) window.gtag('event', 'cad_download', { what })
    askAfter('cad')
  } catch (e) { /* 광고차단기 등 — 세는 것 때문에 받기가 막히면 안 됩니다 */ }
}

function Download() {
  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 8px' }}>내려받기</div>
      <a className="btn primary" href="/lisp/k-conmap.lsp" download
         onClick={() => dl('lsp')}>⬇ k-conmap.lsp 받기 (무료)</a>
      <div className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.7 }}>
        받으신 판은 <b>30일</b> 쓰실 수 있습니다. 지나면 여기서 새로 받아{' '}
        <b>쓰시던 자리에 덮어쓰기</b>만 하면 됩니다. 설정도 자동 등록도 그대로 남습니다.
      </div>
      <div className="navrow" style={{ marginTop: 10 }}>
        <a className="navi" href="/lisp/k-conmap_utf8.lsp" download
           onClick={() => dl('utf8')}>UTF-8 판 (한글이 깨질 때)</a>
        <a className="navi" href="/lisp/시험도면.dxf" download
           onClick={() => dl('dxf')}>시험 도면</a>
        <a className="navi" href="/lisp/좌표샘플.csv" download
           onClick={() => dl('csv')}>좌표 샘플</a>
      </div>
    </div>
  )
}

function Install() {
  return (
    <div className="card">
      <div className="sec-title" style={{ margin: '0 0 8px' }}>3분이면 끝납니다</div>
      <ol className="steps2">
        <li><b>파일을 안 건드릴 자리에 둡니다.</b> <code>C:\CAD유틸\</code> 같은 폴더를 하나 만드십시오.</li>
        <li>캐드 명령창에 <code>APPLOAD</code> → Enter</li>
        <li>그 파일을 고르고 <b>[로드]</b></li>
        <li>명령창에 <code>K</code> 만 치십시오. <b>단추 창이 뜹니다.</b></li>
      </ol>
      <div className="note" style={{ marginTop: 10 }}>
        <b>캐드를 껐다 켜면 사라집니다.</b> 매번 올리기 귀찮으시면 <code>KINSTALL</code> 을
        한 번 치십시오 — 그 뒤로는 캐드를 켤 때마다 저절로 올라옵니다.
        (빼려면 <code>KUNINSTALL</code>)
      </div>
    </div>
  )
}

export default function Cad() {
  return (
    <div className="wrap">
      <div className="card hero">
        <h1 style={{ margin: 0, fontSize: 20 }}>캐드 유틸 — 무료</h1>
        <div className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>
          파일 <b>하나</b>를 캐드에 올리면 길이·면적·수량·좌표가 <b>단추 한 번</b>으로 끝납니다.
          회원가입 없습니다. 값도 없습니다.
        </div>
        <div className="navrow" style={{ marginTop: 10 }}>
          <span className="navi on">AutoCAD</span>
          <span className="navi on">AutoCAD LT 2024+</span>
          <span className="navi on">캐디안</span>
          <span className="navi on">ZWCAD</span>
          <span className="navi on">GstarCAD</span>
        </div>
      </div>

      <Download />
      <Install />

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 4px' }}>쓰는 법은 하나입니다</div>
        <div className="bigline">단추 누르기 → 마우스로 고르기 → <u>Enter</u> → 답</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          고르고 나서 Enter 를 안 치면 계속 기다립니다. 여기서 제일 많이 막힙니다.
        </div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>명령 {CMDS.length}가지</div>
        {CMDS.map((c) => (
          <Link className="row rowlink" key={c.slug} to={`/cad/${c.slug}`}>
            <div className="rowmain">
              <b>{c.name}</b>
              <span className="chipmini">{c.cmd}</span>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>{c.what}</div>
          </Link>
        ))}
      </div>

      {/* 🧮 적산 — 캐드 유틸을 보러 온 분이 바로 다음에 궁금해할 것입니다 (2026-09-16).
          아직 준비 중이라 «무엇을 만들고 있는지»만 보여 줍니다. 받는 단추는 없습니다. */}
      <JeoksanStrip />

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>못 하는 것 — 미리 말씀드립니다</div>
        <ul className="plainlist">
          <li>스플라인·타원의 <b>길이</b> (PEDIT 으로 폴리선으로 바꾸시면 됩니다)</li>
          <li><b>해치(HATCH) 넓이</b> — 경계 폴리선을 고르십시오</li>
          <li>3D 솔리드의 부피·표면적</li>
          <li>블록 <b>안</b>에 든 것, 외부참조(XREF) 안의 객체</li>
        </ul>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          못 재는 것은 <b>개수를 늘 화면에 적습니다.</b> 몰래 빼고 숫자만 내놓지 않습니다.
        </div>
      </div>
    </div>
  )
}

export function CadPage() {
  const { slug } = useParams()
  const c = bySlug(slug)
  if (!c) return <Empty>그런 명령이 없습니다.</Empty>

  return (
    <div className="wrap">
      <div className="card hero">
        <div className="muted" style={{ fontSize: 12 }}>
          <Link to="/cad">캐드 유틸</Link> · 명령 {c.cmd}
        </div>
        <h1 style={{ margin: '4px 0 0', fontSize: 20 }}>{c.name}</h1>
        <div className="muted" style={{ marginTop: 6, lineHeight: 1.7 }}>{c.what}</div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>언제 쓰나</div>
        <div>{c.when}</div>
      </div>

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>쓰는 순서</div>
        <ol className="steps2">{c.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          명령창에 <code>{c.cmd}</code> 을(를) 쳐도 됩니다. <code>K</code> 를 치면 단추 창이 뜹니다.
        </div>
      </div>

      {c.note && c.note.length > 0 && (
        <div className="card">
          <div className="sec-title" style={{ margin: '0 0 6px' }}>알아 두실 것</div>
          <ul className="plainlist">{c.note.map((n, i) => <li key={i}>{n}</li>)}</ul>
        </div>
      )}

      <Download />

      <div className="card">
        <div className="sec-title" style={{ margin: '0 0 6px' }}>다른 명령</div>
        <div className="navrow">
          {CMDS.filter((x) => x.slug !== c.slug).map((x) => (
            <Link className="navi" key={x.slug} to={`/cad/${x.slug}`}>{x.name}</Link>
          ))}
        </div>
      </div>
    </div>
  )
}
