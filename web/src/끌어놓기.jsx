import { useEffect, useRef, useState } from 'react'

/**
 * 📥 끌어다 놓기 — 화면 어디에 도면을 놓아도 열립니다 (2026-09-27)
 * 소장님: 「골조 수량 산출에는 왜 드래그 해서 올리는 기능이 없지?」 · 「드래그 해서 올릴 수 있게 해줘」
 *   → 골조·마감·도면 물량 자동·수량산출서(찍기) 모두 — 파일을 끌고 오면 화면 전체가 «여기에 놓으세요» 로 바뀝니다.
 *   맞는 꼴(DXF·DWG)만 받고, 다른 파일(엑셀 등)은 그 자리의 칸이 받게 둡니다.
 *   소장님(같은 날): 「다른 곳도 보고 드래그 해서 올릴 수 있도록 해줘. 도면이든. 엑셀자료이든」
 *   → 파일을 받는 화면 전부: 도면 3D·도면 PDF·DWG 바꾸기·PDF 도구·내역서 비율·설계변경 2줄·서식 올리기·수량산출서(재료표·치수표)·물량 자동(내역서)
 *   ⚠️ 그 자리 칸(올리기 상자)이 먼저 받으면(e.preventDefault) 여기서는 건너뜁니다 — 두 번 열리지 않게.
 */
export function 끌어놓기({ 받기, 꼴 = /\.(dxf|dwg)$/i, 글 = '도면(DXF·DWG)을 놓으면 열립니다', 여럿 = false, 길들 = null }) {
  /* 길들: [{ 꼴: /\.xlsx$/i, 받기: (files) => …, 여럿 }] — 파일 꼴마다 받을 곳이 다를 때(도면 → 도면, 엑셀 → 내역서) */
  const 길 = 길들 || [{ 꼴, 받기, 여럿 }]
  const [보임, set보임] = useState(false)
  const 길Ref = useRef(길)
  길Ref.current = 길
  useEffect(() => {
    let 깊이 = 0
    const 파일인가 = (e) => { try { return [...(e.dataTransfer?.types || [])].includes('Files') } catch (er) { return false } }
    const 들어옴 = (e) => { if (!파일인가(e)) return; 깊이++; set보임(true) }
    const 나감 = (e) => { if (!파일인가(e)) return; 깊이 = Math.max(0, 깊이 - 1); if (!깊이) set보임(false) }
    const 위 = (e) => { if (파일인가(e)) e.preventDefault() }
    const 놓음 = (e) => {
      깊이 = 0; set보임(false)
      if (!파일인가(e)) return
      if (e.defaultPrevented) return              // 그 자리 칸(올리기 상자)이 이미 받았습니다
      e.preventDefault()                          // 칸 밖에 떨어뜨려도 브라우저가 파일을 열며 화면을 떠나지 않게
      const 모두 = [...(e.dataTransfer?.files || [])]
      for (const g of 길Ref.current) {
        const fs = 모두.filter((f) => g.꼴.test(f.name))
        if (fs.length) g.받기(g.여럿 ? fs : [fs[0]])
      }
    }
    window.__끌놓수 = (window.__끌놓수 || 0) + 1
    window.addEventListener('dragenter', 들어옴)
    window.addEventListener('dragleave', 나감)
    window.addEventListener('dragover', 위)
    window.addEventListener('drop', 놓음)
    return () => {
      window.__끌놓수 = Math.max(0, (window.__끌놓수 || 1) - 1)
      window.removeEventListener('dragenter', 들어옴); window.removeEventListener('dragleave', 나감)
      window.removeEventListener('dragover', 위); window.removeEventListener('drop', 놓음)
    }
  }, [])
  if (!보임) return null
  return <div className="끌놓판" aria-hidden="true"><div>📥 {글}</div></div>
}


/**
 * 파일을 받지 않는 화면에 잘못 떨어뜨려도 브라우저가 그 파일을 열며 사이트를 떠나지 않게 (App 에 한 번)
 * 받는 화면(끌어놓기가 있는 곳)에서는 아무것도 하지 않습니다.
 */
export function use떨굼막기() {
  useEffect(() => {
    const 파일인가 = (e) => { try { return [...(e.dataTransfer?.types || [])].includes('Files') } catch (er) { return false } }
    const 위 = (e) => { if (파일인가(e) && !window.__끌놓수) e.preventDefault() }
    const 놓음 = (e) => { if (파일인가(e) && !window.__끌놓수) e.preventDefault() }
    window.addEventListener('dragover', 위)
    window.addEventListener('drop', 놓음)
    return () => { window.removeEventListener('dragover', 위); window.removeEventListener('drop', 놓음) }
  }, [])
}
