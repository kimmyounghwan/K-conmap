/**
 * /tools/dwgdxf — 🔁 DWG → DXF 바꾸기 (2026-09-26)
 *
 * 소장님: 「캐드 파일을 드래그 하면 dxf로 만들어 주는 도구를 만들 수 있어? 그래서 다운 받게 해줘」
 *         「클로드가 공개 프로그램을 이용해서 만들면 안돼?」 · 「도면을 dxf 전환해주는 도구도 만들어 줘」
 *
 * ■ DWG 를 «이 브라우저 안에서만» DXF 로 바꿉니다. 서버 없음 → 파일이 어디로도 안 갑니다.
 * ■ 엔진: LibreDWG(GPL-3.0) 를 브라우저용으로 구운 libredwg-web 0.7.14 → web/vendor/libredwg-web (고치지 않은 원본)
 *         일꾼 lib/dwgdxf.worker.js · 다듬기 lib/dwgdxf.js — 둘 다 GPL-3.0, 화면 아래에서 소스를 받을 수 있게 했습니다.
 * ■ 2026-09-26 소장님 도면 8장(2000·2004·2013·2018 판)을 소장님 PC 의 AutoCAD 2023 으로 하나씩 열어 보며 다듬었습니다.
 *   엔진이 틀리게 쓰는 것 11가지를 찾아 dwgdxf.js «다듬기» 에서 바로잡습니다(자세한 것은 그 파일 머리말).
 * ■ 한 파일마다 일꾼을 새로 띄웁니다 — 엔진이 한 번 죽으면 다시 못 쓰기 때문(끝나면 terminate → 기억도 돌려받음).
 * ■ 받은 DXF 를 «도면 PDF 로» 바로 넘길 수 있습니다 → lib/도면넘김.js (같은 탭 안에서만, 저장하지 않음)
 */
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 판읽기, dxf이름, 크기글 } from '../lib/dwgdxf.js'
import { 도면넘기기 } from '../lib/도면넘김.js'

const 큰파일 = 200 * 1024 * 1024
let 번호 = 0

function 오류글(k, more) {
  if (k === 'isdxf') return <>이미 DXF 파일입니다 — 바꿀 필요가 없습니다. 도면 PDF 로 바로 만들려면 <Link to="/tools/dxfpdf">도면 PDF 만들기</Link> 로 가십시오.</>
  if (k === 'notdwg') return <>DWG 도면 파일이 아닌 것 같습니다. 캐드에서 저장한 .dwg 파일을 놓아 주십시오.</>
  if (k === 'big') return <>파일이 너무 큽니다(200MB 까지). 캐드에서 필요 없는 외부참조·레이어를 지우고(PURGE) 다시 저장해 보십시오.</>
  if (k === 'mem') return <>이 기기의 메모리가 모자랍니다. <b>PC 의 크롬·엣지</b>에서 해 주십시오(변환 엔진이 처음에 1GB 를 잡습니다).</>
  return <>이 도면은 바꾸지 못했습니다{more ? ` (${more})` : ''}. 아주 옛 판(R14 이전)이거나 캐드가 아닌 프로그램이 만든 DWG 일 수 있습니다.
    캐드가 있으시면 «다른 이름으로 저장 → DXF» 가 가장 확실합니다.</>
}

export default function DwgDxf() {
  const 파일칸 = useRef(null)
  const [끌림, set끌림] = useState(false)
  const [목록, set목록] = useState([])   // { id, 이름, 크기, 판, 상태:'대기'|'중'|'끝'|'실패', p, msg, 초, dxf?:Blob, info, 오류 }
  const 목록Ref = useRef([])
  const 일중 = useRef(false)
  const 일꾼 = useRef(null)
  const 시계 = useRef(null)
  const 넘길곳 = useNavigate()

  const 고치기 = (id, 바꿀) => {
    목록Ref.current = 목록Ref.current.map((x) => (x.id === id ? { ...x, ...바꿀 } : x))
    set목록(목록Ref.current)
  }

  useEffect(() => () => { if (일꾼.current) 일꾼.current.terminate(); clearInterval(시계.current) }, [])

  /* 차례로 하나씩 — 큰 도면 여러 장을 한꺼번에 돌리면 메모리가 모자랍니다 */
  const 다음 = () => {
    if (일중.current) return
    const 할 = 목록Ref.current.find((x) => x.상태 === '대기')
    if (!할) return
    일중.current = true
    const t0 = Date.now()
    고치기(할.id, { 상태: '중', p: 0.02, msg: '파일 여는 중', 초: 0 })
    clearInterval(시계.current)
    시계.current = setInterval(() => 고치기(할.id, { 초: Math.round((Date.now() - t0) / 1000) }), 1000)
    const 끝내기 = (바꿀) => {
      clearInterval(시계.current)
      if (일꾼.current) { 일꾼.current.terminate(); 일꾼.current = null }
      고치기(할.id, { ...바꿀, 초: Math.round((Date.now() - t0) / 1000) })
      일중.current = false
      setTimeout(다음, 0)
    }
    할.파일.arrayBuffer().then((buf) => {
      const w = new Worker(new URL('../lib/dwgdxf.worker.js', import.meta.url), { type: 'module' })
      일꾼.current = w
      w.onmessage = (ev) => {
        const m = ev.data || {}
        if (m.type === 'prog') 고치기(할.id, { p: m.p, msg: m.msg })
        else if (m.type === 'err') 끝내기({ 상태: '실패', 오류: m.kind, 더: m.msg })
        else if (m.type === 'done') 끝내기({ 상태: '끝', dxf: new Blob([m.dxf], { type: 'application/dxf' }), info: m.info })
      }
      w.onerror = (e) => 끝내기({ 상태: '실패', 오류: 'fail', 더: String((e && e.message) || '일꾼 오류') })
      w.postMessage({ type: 'conv', buf, name: 할.이름 }, [buf])
    }).catch((e) => 끝내기({ 상태: '실패', 오류: 'fail', 더: String(e && e.message) }))
  }

  const 받기 = async (list) => {
    const 새것 = []
    for (const f of [...(list || [])]) {
      const 머리 = new Uint8Array(await f.slice(0, 6).arrayBuffer())
      const 판 = 판읽기(머리)
      const 줄 = { id: ++번호, 이름: f.name, 크기: f.size, 판: 판.판 || '', 파일: f, 상태: '대기', p: 0, msg: '', 초: 0 }
      if (f.size > 큰파일) Object.assign(줄, { 상태: '실패', 오류: 'big' })
      else if (!판.dwg) Object.assign(줄, { 상태: '실패', 오류: /\.dxf$/i.test(f.name) ? 'isdxf' : 'notdwg' })
      새것.push(줄)
    }
    목록Ref.current = [...목록Ref.current, ...새것]
    set목록(목록Ref.current)
    setTimeout(다음, 0)
  }

  const 내려받기 = (x) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(x.dxf)
    a.download = dxf이름(x.이름)
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 60000)
  }
  const 모두받기 = async () => {
    const 된것 = 목록.filter((x) => x.상태 === '끝')
    const { zipSync } = await import('fflate')
    const 묶음 = {}
    for (const x of 된것) {
      let n = dxf이름(x.이름), i = 2
      while (묶음[n]) n = dxf이름(x.이름).replace(/\.dxf$/i, `(${i++}).dxf`)
      묶음[n] = [new Uint8Array(await x.dxf.arrayBuffer()), { level: 6 }]
    }
    const zip = zipSync(묶음)
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }))
    a.download = `DXF_${된것.length}장.zip`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 60000)
  }
  const PDF로 = async (x) => {
    도면넘기기({ 이름: dxf이름(x.이름), 바이트: new Uint8Array(await x.dxf.arrayBuffer()) })
    넘길곳('/tools/dxfpdf')
  }
  const 지우기 = (id) => { 목록Ref.current = 목록Ref.current.filter((x) => x.id !== id || x.상태 === '중'); set목록(목록Ref.current) }

  const 된수 = 목록.filter((x) => x.상태 === '끝').length

  return (
    <div className="wrap">
      <div className="card">
        <h1 className="tl-h1" style={{ marginTop: 0 }}>🔁 DWG → DXF 바꾸기 <span className="count">· 캐드 도면 변환</span></h1>
        <div className="note sm">
          캐드 도면(<b>.dwg</b>)을 놓으면 <b>DXF 로 바꿔</b> 바로 받으실 수 있습니다. 여러 장을 한 번에 놓아도 됩니다.
          AutoCAD <b>2000 ~ 2018 판</b> DWG · 한글 글자·레이어(켜짐/꺼짐·얼림)·블록·치수·해치 그대로 · <b>원래 판과 같은 판</b>의 DXF 로 만듭니다.
        </div>
        <div className="pdfsafe">
          🔒 <b>파일은 어디로도 올라가지 않습니다.</b> 이 브라우저 안에서만 바꿉니다. 회원가입 없음 · 무료.
        </div>
      </div>

      <div className="card">
        <div className={'pdfdrop' + (끌림 ? ' on' : '')}
             onDragOver={(e) => { e.preventDefault(); set끌림(true) }}
             onDragLeave={() => set끌림(false)}
             onDrop={(e) => { e.preventDefault(); set끌림(false); 받기(e.dataTransfer.files) }}>
          <button type="button" className="pdfpick" onClick={() => 파일칸.current?.click()}>📂 DWG 도면 고르기</button>
          <div className="pdfdrop-d">또는 도면 파일을 이곳에 끌어다 놓으세요 · 여러 장 가능 · 한 장 200MB 까지 · <b>PC 의 크롬·엣지</b>에서 가장 잘 됩니다</div>
        </div>
        <input ref={파일칸} type="file" accept=".dwg,.DWG" multiple className="sr-only" tabIndex={-1}
               onChange={(e) => { 받기(e.target.files); e.target.value = '' }} />

        {목록.length > 0 && (
          <div className="dd-list">
            {목록.map((x) => (
              <div key={x.id} className={'dd-row ' + (x.상태 === '끝' ? 'ok' : x.상태 === '실패' ? 'bad' : '')}>
                <div className="dd-top">
                  <span className="dd-name">📎 {x.이름}</span>
                  <span className="dd-meta">{x.판 ? `AutoCAD ${x.판} 판 · ` : ''}{크기글(x.크기)}</span>
                  {x.상태 !== '중' && <button type="button" className="dd-x" title="목록에서 빼기" onClick={() => 지우기(x.id)}>✕</button>}
                </div>
                {x.상태 === '대기' && <div className="dd-wait">차례를 기다리는 중…</div>}
                {x.상태 === '중' && (
                  <div className="dx3-bar" aria-live="polite">
                    <div className="dx3-bar-in" style={{ width: Math.round((x.p || 0) * 100) + '%' }} />
                    <span>{x.msg} … {x.초}초</span>
                  </div>
                )}
                {x.상태 === '끝' && (
                  <div className="dd-done">
                    <span className="dd-ok">✅ 바꿨습니다 — DXF {크기글(x.info?.크기)} · {x.초}초
                      {x.info?.레이어수 ? <> · 레이어 {x.info.레이어수}개{x.info.끔 ? ` (꺼진 것 ${x.info.끔}개 그대로)` : ''}</> : null}</span>
                    <span className="dd-btns">
                      <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={() => 내려받기(x)}>⬇ DXF 받기</button>
                      <button type="button" className="btn line sm" style={{ width: 'auto' }} onClick={() => PDF로(x)}>📄 이 도면 PDF 로 만들기</button>
                    </span>
                    {(x.info?.해치 > 0 || x.info?.레이어문제) && (
                      <div className="dd-warn">
                        {x.info.해치 > 0 && <>⚠️ 원본에서 깨져 있던 해치 {x.info.해치}개는 뺐습니다(AutoCAD 가 파일을 못 여는 원인이라서). </>}
                        {x.info.레이어문제 && <>⚠️ 레이어 켜짐/꺼짐을 못 읽어 모두 켜 두었습니다. </>}
                      </div>
                    )}
                  </div>
                )}
                {x.상태 === '실패' && <div className="dx3-err">{오류글(x.오류, x.더)}</div>}
              </div>
            ))}
            {된수 > 1 && (
              <div className="dd-all">
                <button type="button" className="btn sm" style={{ width: 'auto' }} onClick={모두받기}>⬇ {된수}장 모두 받기 (ZIP)</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="detail-h">이렇게 바꿉니다</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>원래 판 그대로</b> — 2018 판 DWG 는 2018 판 DXF, 2004 판은 2004 판 DXF 로. 옛 캐드에서 안 열리면 그 캐드의 판을 확인해 주십시오</li>
          <li><b>한글</b> — 글자·레이어 이름의 한글이 그대로 나옵니다(2004 판 이하는 한글 코드 949, 2007 판부터는 UTF-8)</li>
          <li><b>AutoCAD 에서 확인</b> — 실제 현장 도면 8장을 AutoCAD 2023 으로 열어 보며 맞췄습니다. 대부분 검사(AUDIT) 오류 0건입니다</li>
          <li><b>함께 쓰기</b> — 받은 DXF 는 <Link to="/tools/dxfpdf">도면 PDF 만들기</Link> · <Link to="/tools/dxf3d">도면 3D 보기</Link> 에 바로 넣을 수 있습니다</li>
        </ul>
      </div>

      <div className="card">
        <div className="detail-h">알아 두실 점</div>
        <ul className="tl-p" style={{ paddingLeft: 18, margin: 0, lineHeight: 1.9 }}>
          <li><b>외부참조(XREF)·그림 파일</b>은 DWG 밖에 있는 파일이라 따라오지 않습니다. 같은 폴더에 두면 캐드가 찾습니다</li>
          <li><b>동적 블록</b>은 «지금 모양 그대로의 보통 블록» 이 됩니다(손잡이로 늘이기·배열 바꾸기만 안 됨). <b>치수의 연관</b>도 풀립니다(치수는 그대로 보임)</li>
          <li><b>Civil 3D · Map 전용 정보</b>(선형·지표면 스타일 같은 것)는 빠집니다. 선·글자로 보이는 것은 그대로입니다</li>
          <li><b>큰 도면</b>은 시간이 걸립니다 — 20MB 도면이 PC 에서 30초 ~ 1분. 휴대폰에서는 메모리가 모자랄 수 있습니다</li>
          <li><b>아주 옛 판(R14 이전)</b>이나 캐드가 아닌 프로그램이 만든 DWG 는 안 될 수 있습니다</li>
        </ul>
      </div>

      <div className="card">
        <div className="detail-h">공개 프로그램</div>
        <div className="tl-p" style={{ lineHeight: 1.8 }}>
          변환 엔진은 공개 프로그램 <a href="https://www.gnu.org/software/libredwg/" target="_blank" rel="noopener noreferrer">LibreDWG</a> 를
          브라우저용으로 만든 <a href="https://github.com/mlightcad/libredwg-web" target="_blank" rel="noopener noreferrer">libredwg-web 0.7.14</a> 입니다(GPL-3.0).
          건설맵이 덧붙인 변환 부분(일꾼·다듬기)도 같은 GPL-3.0 으로 공개합니다 —{' '}
          <a href="/tools/files/dwgdxf-source.zip" download>소스 받기 (ZIP)</a>
        </div>
      </div>

      <div className="card">
        <div className="navrow">
          <Link className="navi" to="/tools">🧰 다른 도구</Link>
          <Link className="navi" to="/tools/dxfpdf">📄 도면 PDF 만들기</Link>
          <Link className="navi" to="/tools/dxf3d">📦 도면 3D 보기</Link>
          <Link className="navi" to="/cad">📐 캐드 유틸</Link>
        </div>
      </div>
    </div>
  )
}
