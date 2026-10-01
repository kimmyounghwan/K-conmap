/* 📖 새 프로그램 설명 — «이 프로그램은» · «쓰는 순서» · «자주 묻는 것» · «근거 법령» (G112 · 2026-10-01)
 *   소장님: 「설명 검색에 뜨게 해줘」 — 글은 web/src/data/tools_guide.json 한 곳에만 있고,
 *   미리굽기(prerender.py _tool_guide_html)가 «같은 글» 을 HTML 로 굽습니다(크롤러가 보는 글 = 사람이 보는 글).
 *   ⚠️ 법령은 국가법령정보센터 원문으로 확인한 조문만(at = 확인한 날). */
import 설명들 from '../data/tools_guide.json'

export default function 도구설명({ k }) {
  const g = 설명들[k]
  if (!g) return null
  return (
    <section className="tguide" aria-label={g.h}>
      <div className="card fguide">
        <h2 className="sec-title" style={{ margin: '0 0 6px' }}>📖 {g.h}</h2>
        <p className="gwhat">{g.what}</p>
      </div>
      {g.how && g.how.length > 0 && (
        <div className="card fguide">
          <h2 className="sec-title" style={{ margin: '0 0 6px' }}>쓰는 순서</h2>
          <dl className="ghow">{g.how.map(([a, b], i) => <div key={i}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        </div>
      )}
      {g.faq && g.faq.length > 0 && (
        <div className="card fguide">
          <h2 className="sec-title" style={{ margin: '0 0 6px' }}>자주 묻는 것</h2>
          <dl className="ghow">{g.faq.map(([a, b], i) => <div key={i}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
        </div>
      )}
      {g.law && g.law.length > 0 && (
        <div className="card fguide">
          <h2 className="sec-title" style={{ margin: '0 0 6px' }}>근거 법령</h2>
          <ul className="flist glaw">
            {g.law.map(([nm, txt, url], i) => <li key={i}><b>{url ? <a href={url} target="_blank" rel="noopener">{nm}</a> : nm}</b> — {txt}</li>)}
          </ul>
          <div className="note sm" style={{ marginTop: 6 }}>
            국가법령정보센터 원문 기준{g.at ? `(${g.at})` : ''}입니다. 법령은 바뀔 수 있으니 계약·제출 전에 조문 링크로 원문을 확인하세요.
          </div>
        </div>
      )}
    </section>
  )
}
