"""🎮 사이트에 싣는 VRM 만들기 — 둘러보기 캐릭터(G390 · 2026-10-23)
   python3 -I tools/vrm_싣기.py <들어올.vrm> <나갈.vrm> [가장 큰 변 px = 1024]
   ■ 우리 화면(lib/사람vrm.js)이 쓰는 것만 남김 — 뼈 · 그물 · 바탕 그림(baseColorTexture) · 눈 깜빡임(blink) 꼴
     · 표정 꼴(morph) 가운데 blink · blink_l · blink_r 만(POSITION 만) — 나머지 표정은 뺌
     · 바탕 그림이 아닌 그림(노말 · 매트캡 · 썸네일 …)은 1×1 그림으로
     · 안 쓰게 된 accessor · bufferView 는 지우고 번호를 다시 맞춤
   ■ 그 다음 그림 크기 줄이기(tools/vrm_줄이기.py) — 원본은 안 건드림(새 파일로)
   ■ 모델은 이용 조건이 깨끗한 것만(VRoid AvatarSample_D · E · F · G — CC0 · 파일 안 조건: 누구나 · 상업 가능 · 고쳐도 됨 · 다시 배포 가능)
"""
import io, json, os, struct, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import importlib.util
_spec = importlib.util.spec_from_file_location('vrm_줄이기', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'vrm_줄이기.py'))
_줄 = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(_줄)

남길표정 = ('blink', 'blink_l', 'blink_r')


def _한점그림():
    b = io.BytesIO(); Image.new('RGBA', (1, 1), (255, 255, 255, 255)).save(b, 'PNG'); return b.getvalue()


def 싣기(src, dst, 큰=1024):
    js, bin_ = _줄.읽기(src)
    vrm0 = js.get('extensions', {}).get('VRM', {})
    무리 = vrm0.get('blendShapeMaster', {}).get('blendShapeGroups', [])
    # ① 남길 표정 꼴(mesh → 꼴 번호)
    남길 = {}
    for g in 무리:
        if (g.get('presetName') or '').lower() in 남길표정:
            for b in g.get('binds', []):
                남길.setdefault(b['mesh'], set()).add(b['index'])
    새번 = {}
    for mi, m in enumerate(js.get('meshes', [])):
        ks = sorted(남길.get(mi, ()))
        새번[mi] = {o: n for n, o in enumerate(ks)}
        for p in m.get('primitives', []):
            if 'targets' in p:
                t = [{'POSITION': p['targets'][o]['POSITION']} for o in ks if o < len(p['targets']) and 'POSITION' in p['targets'][o]]
                if t: p['targets'] = t
                else: del p['targets']
            ex = p.get('extras')
            if isinstance(ex, dict) and 'targetNames' in ex:
                ex['targetNames'] = [ex['targetNames'][o] for o in ks if o < len(ex['targetNames'])]
        if 'weights' in m:
            w = [m['weights'][o] for o in ks if o < len(m['weights'])]
            if w: m['weights'] = w
            else: del m['weights']
        ex = m.get('extras')
        if isinstance(ex, dict) and 'targetNames' in ex:
            ex['targetNames'] = [ex['targetNames'][o] for o in ks if o < len(ex['targetNames'])]
    for g in 무리:
        g['binds'] = [{**b, 'index': 새번[b['mesh']][b['index']]} for b in g.get('binds', []) if b['index'] in 새번.get(b['mesh'], {})]
    # ② 바탕 그림만 — 나머지 그림은 1×1
    쓴그림 = set()
    for mt in js.get('materials', []):
        bt = (mt.get('pbrMetallicRoughness') or {}).get('baseColorTexture')
        if bt is not None:
            s = js['textures'][bt['index']].get('source')
            if s is not None: 쓴그림.add(s)
    if 'meta' in vrm0: vrm0['meta'].pop('texture', None)
    점 = _한점그림()
    # ③ 쓰는 accessor · bufferView 만(번호 다시)
    acc = js['accessors']
    쓴acc = []
    def 쓰(a):
        if a is not None and a not in 쓴acc: 쓴acc.append(a)
    for m in js.get('meshes', []):
        for p in m.get('primitives', []):
            for a in p.get('attributes', {}).values(): 쓰(a)
            쓰(p.get('indices'))
            for t in p.get('targets', []):
                for a in t.values(): 쓰(a)
    for s in js.get('skins', []): 쓰(s.get('inverseBindMatrices'))
    for an in js.get('animations', []):
        for sm in an.get('samplers', []): 쓰(sm.get('input')); 쓰(sm.get('output'))
    쓴acc.sort()
    acc번 = {o: n for n, o in enumerate(쓴acc)}
    새acc = [dict(acc[o]) for o in 쓴acc]
    쓴뷰 = []
    def 뷰(v):
        if v is not None and v not in 쓴뷰: 쓴뷰.append(v)
    for a in 새acc:
        뷰(a.get('bufferView'))
        sp = a.get('sparse')
        if sp: 뷰(sp['indices']['bufferView']); 뷰(sp['values']['bufferView'])
    for im in js.get('images', []): 뷰(im.get('bufferView'))
    쓴뷰.sort()
    뷰번 = {o: n for n, o in enumerate(쓴뷰)}
    for a in 새acc:
        if 'bufferView' in a: a['bufferView'] = 뷰번[a['bufferView']]
        sp = a.get('sparse')
        if sp: sp['indices']['bufferView'] = 뷰번[sp['indices']['bufferView']]; sp['values']['bufferView'] = 뷰번[sp['values']['bufferView']]
    def 바꿔(a): return acc번[a]
    for m in js.get('meshes', []):
        for p in m.get('primitives', []):
            p['attributes'] = {k: 바꿔(a) for k, a in p['attributes'].items()}
            if 'indices' in p: p['indices'] = 바꿔(p['indices'])
            if 'targets' in p: p['targets'] = [{k: 바꿔(a) for k, a in t.items()} for t in p['targets']]
    for s in js.get('skins', []):
        if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = 바꿔(s['inverseBindMatrices'])
    for an in js.get('animations', []):
        for sm in an.get('samplers', []): sm['input'] = 바꿔(sm['input']); sm['output'] = 바꿔(sm['output'])
    js['accessors'] = 새acc
    그림뷰 = {im['bufferView']: i for i, im in enumerate(js.get('images', [])) if 'bufferView' in im}
    조각, 새뷰, off = [], [], 0
    for o in 쓴뷰:
        v = js['bufferViews'][o]
        data = bin_[v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']]
        if o in 그림뷰 and 그림뷰[o] not in 쓴그림:
            data = 점; js['images'][그림뷰[o]]['mimeType'] = 'image/png'
        nv = dict(v); nv['byteOffset'] = off; nv['byteLength'] = len(data)
        새뷰.append(nv); 조각.append(data)
        pad = (4 - len(data) % 4) % 4
        if pad: 조각.append(b'\0' * pad)
        off += len(data) + pad
    for im in js.get('images', []):
        if 'bufferView' in im: im['bufferView'] = 뷰번[im['bufferView']]
    js['bufferViews'] = 새뷰
    새bin = b''.join(조각)
    js['buffers'] = [{'byteLength': len(새bin)}]
    jb = json.dumps(js, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    fd, 사이 = tempfile.mkstemp(suffix='.vrm'); os.close(fd)
    with open(사이, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(jb) + 8 + len(새bin)))
        f.write(struct.pack('<II', len(jb), 0x4E4F534A)); f.write(jb)
        f.write(struct.pack('<II', len(새bin), 0x004E4942)); f.write(새bin)
    print(f'{src}: 표정 남김 {sum(len(v) for v in 남길.values())}개 · 바탕 그림 {len(쓴그림)}장 · accessor {len(acc)} → {len(새acc)} · bufferView {len(쓴뷰)}')
    _줄.줄이기(사이, dst, 큰)
    os.remove(사이)


if __name__ == '__main__':
    싣기(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1024)
