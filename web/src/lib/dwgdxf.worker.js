/* 🔁 DWG → DXF 바꾸기 — 일꾼 (2026-09-26)
 *
 * 파일은 이 브라우저 안에서만 바꿉니다 — 어디로도 보내지 않습니다.
 * 엔진: LibreDWG(GPL-3.0) 를 브라우저용으로 구운 libredwg-web 0.7.14 (GPL-3.0, github.com/mlightcad/libredwg-web)
 *       → web/vendor/libredwg-web 에 «고치지 않은 원본» 을 그대로 두었습니다(출처·라이선스 COPYING 함께).
 *       이 일꾼과 dwgdxf.js 도 GPL-3.0 입니다 — 화면 아래 «공개 프로그램» 에서 소스를 받을 수 있게 했습니다.
 *
 * 🚨 2026-09-26 시험(소장님 도면 8장)에서 잡은 것
 *  · 처음 쓴 dwg2dxf-converter(LibreDWG 0.13.4) 는 2018 판 큰 도면 2장에서 «memory access out of bounds» 로 죽었습니다.
 *    libredwg-web 은 8장 모두 바꿨습니다(가장 큰 21.7MB → DXF 75MB, 약 15초).
 *  · 한 번 죽은 엔진은 다시 못 씁니다 → 파일마다 이 일꾼을 새로 띄웁니다(화면 쪽에서 terminate 후 새로).
 *  · DXF 쓰기가 레이어를 전부 «꺼짐» 으로 적습니다 → 같은 엔진으로 레이어만 한 번 더 읽어 바로잡습니다(dwgdxf.js).
 *  · AutoCAD 2023 으로 열어 보니 ① AUDIT 오류 수백 건(없는 물체를 가리키는 사전 칸) ② 2018 판은 속성(ATTRIB) 때문에 아예 못 엶
 *    → 다듬기(dwgdxf.js) 로 둘 다 뺍니다.
 *  · 엔진은 처음에 1GB 기억 공간을 잡습니다 — 휴대폰에서는 모자랄 수 있습니다(→ 'mem' 오류로 알림).
 */
import { LibreDwg, Dwg_File_Type, Dwg_Object_Type, dwgCodePageToEncoding } from '../../vendor/libredwg-web/dist/libredwg-web.js'
import createModule from '../../vendor/libredwg-web/wasm/libredwg-web.js'
import wasmUrl from '../../vendor/libredwg-web/wasm/libredwg-web.wasm?url'
import { 판읽기, 레이어고치기, 다듬기, dxf글꼴 } from './dwgdxf.js'

const post = (m, tr) => self.postMessage(m, tr || [])

async function 엔진() {
  const inst = await createModule({ locateFile: () => wasmUrl, print: () => {}, printErr: () => {} })
  return LibreDwg.createByWasmInstance(inst)
}

/* DWG 안 레이어마다 진짜 켜짐/꺼짐 — 표(LAYER)만 훑습니다(도면 전체를 JS 로 옮기지 않아 빠릅니다) */
function 레이어읽기(lib, buf) {
  const data = lib.dwg_read_data(buf, Dwg_File_Type.DWG)
  if (!data) throw new Error('DWG 를 읽지 못했습니다')
  const 표 = new Map()
  try {
    const cp = lib.dwg_get_codepage(data)
    lib.decoder = new TextDecoder(dwgCodePageToEncoding(cp) || 'utf-8')
    const n = lib.dwg_get_num_objects(data)
    for (let i = 0; i < n; i++) {
      const obj = lib.dwg_get_object(data, i)
      if (!obj) continue
      if (lib.dwg_object_get_fixedtype(obj) !== Dwg_Object_Type.DWG_TYPE_LAYER) continue
      const tio = lib.dwg_object_to_object_tio(obj)
      if (!tio) continue
      const 이름 = lib.dwg_dynapi_entity_data(tio, 'name')
      if (typeof 이름 !== 'string' || !이름) continue
      표.set(이름, {
        off: !!lib.dwg_dynapi_entity_data(tio, 'off'),
        frozen: !!lib.dwg_dynapi_entity_data(tio, 'frozen'),
      })
    }
  } finally {
    lib.dwg_free(data)
  }
  return 표
}

const 기억오류 = (e) => /memory|Out of memory|allocation|RangeError/i.test(String((e && e.message) || e))

self.onmessage = async (ev) => {
  const d = ev.data || {}
  if (d.type !== 'conv') return
  const t0 = Date.now()
  try {
    const buf = new Uint8Array(d.buf)
    const 판 = 판읽기(buf)
    if (!판.dwg) {
      const 머리 = String.fromCharCode(...buf.subarray(0, Math.min(buf.length, 400))).replace(/\s+/g, ' ')
      post({ type: 'err', kind: /SECTION/.test(머리) ? 'isdxf' : 'notdwg' })
      return
    }
    post({ type: 'prog', p: 0.05, msg: '변환 엔진 준비' })
    let lib = await 엔진()

    post({ type: 'prog', p: 0.15, msg: '레이어 켜짐·꺼짐 읽는 중' })
    let 표 = null, 레이어문제 = ''
    try { 표 = 레이어읽기(lib, buf) } catch (e) {
      레이어문제 = String((e && e.message) || e)
      lib = await 엔진()   // 죽은 엔진은 다시 못 씁니다
    }

    post({ type: 'prog', p: 0.35, msg: 'DXF 로 바꾸는 중 — 큰 도면은 30초~1분' })
    const 날것 = lib.dwg_write_dxf(buf)
    if (!날것 || !날것.length) { post({ type: 'err', kind: 'fail', msg: '엔진이 DXF 를 내지 못했습니다' }); return }

    post({ type: 'prog', p: 0.9, msg: '레이어 바로잡는 중' })
    const 고친 = 레이어고치기(날것, 표 || new Map(), dxf글꼴(판.머리))
    post({ type: 'prog', p: 0.95, msg: 'AutoCAD 에 맞게 다듬는 중' })
    const 정리 = 다듬기(고친.bytes)
    const out = 정리.bytes
    const ab = out.byteOffset === 0 && out.byteLength === out.buffer.byteLength ? out.buffer : out.slice().buffer
    post({
      type: 'done', dxf: ab,
      info: {
        머리: 판.머리, 판: 판.판, ms: Date.now() - t0, 크기: ab.byteLength,
        레이어수: 고친.레이어수, 켬: 고친.켬, 끔: 고친.끔, 고침: 고친.고침, 뺌: 정리.뺌, 속성: 정리.속성, 물체: 정리.물체, 긴글: 정리.긴글, 순서표: 정리.순서표, 수: 정리.수, 꼬리: 정리.꼬리, 대리: 정리.대리, 기록: 정리.기록, 틀: 정리.틀, 해치: 정리.해치, 접선: 정리.접선, 치수: 정리.치수,
        레이어문제, 모름: 고친.모름.slice(0, 5), 모름수: 고친.모름.length,
      },
    }, [ab])
  } catch (e) {
    post({ type: 'err', kind: 기억오류(e) ? 'mem' : 'fail', msg: String((e && e.message) || e) })
  }
}
