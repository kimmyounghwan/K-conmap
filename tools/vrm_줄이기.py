"""🎮 VRM(GLB) 그림 줄이기 — 사이트에 싣기 전에(G390 · 2026-10-23)
   python3 tools/vrm_줄이기.py <들어올.vrm> <나갈.vrm> [가장 큰 변 px = 1024]
   ■ 그림마다: 가장 큰 변을 줄임(비율 그대로 · 두 제곱 크기로 맞춤 — WebGL1 밉맵) · 투명이 있으면 PNG · 없으면 JPEG(품질 88)
   ■ 그 밖의 칸(뼈 · 그물 · VRM 확장)은 한 바이트도 안 바꿈 — bufferView 자리만 다시 맞춤(4바이트 줄)
   ■ 모델은 이용 조건이 깨끗한 것만(CC0 — VRoid AvatarSample_D · E · F · G) · 원본 파일은 안 건드림(새 파일로)
"""
import io, json, struct, sys
from PIL import Image


def 읽기(path):
    b = open(path, 'rb').read()
    magic, ver, total = struct.unpack_from('<III', b, 0)
    assert magic == 0x46546C67, 'GLB 가 아닙니다'
    off, js, bin_ = 12, None, b''
    while off < len(b):
        ln, kind = struct.unpack_from('<II', b, off)
        body = b[off + 8: off + 8 + ln]
        if kind == 0x4E4F534A: js = json.loads(body.decode('utf-8'))
        elif kind == 0x004E4942: bin_ = body
        off += 8 + ln
    return js, bin_


def 두제곱(v):
    p = 1
    while p * 2 <= v: p *= 2
    return p


def 줄이기(src, dst, 큰=1024):
    js, bin_ = 읽기(src)
    views = js['bufferViews']
    그림뷰 = {im['bufferView']: i for i, im in enumerate(js.get('images', [])) if 'bufferView' in im}
    새조각, 새뷰 = [], []
    off = 0
    전, 후 = len(bin_), 0
    for vi, v in enumerate(views):
        data = bin_[v.get('byteOffset', 0): v.get('byteOffset', 0) + v['byteLength']]
        if vi in 그림뷰:
            im_i = 그림뷰[vi]
            try:
                img = Image.open(io.BytesIO(data))
                img.load()
                w, h = img.size
                k = min(1.0, 큰 / max(w, h))
                nw, nh = max(1, 두제곱(int(w * k))), max(1, 두제곱(int(h * k)))
                알파 = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                if 알파:
                    img = img.convert('RGBA')
                    if (nw, nh) != (w, h): img = img.resize((nw, nh), Image.LANCZOS)
                    a = img.getchannel('A')
                    if a.getextrema() == (255, 255): 알파 = False
                out = io.BytesIO()
                if 알파:
                    img.save(out, 'PNG', optimize=True); mime = 'image/png'
                else:
                    img = img.convert('RGB')
                    if img.size != (nw, nh): img = img.resize((nw, nh), Image.LANCZOS)
                    img.save(out, 'JPEG', quality=88, optimize=True); mime = 'image/jpeg'
                if out.tell() < len(data):
                    data = out.getvalue(); js['images'][im_i]['mimeType'] = mime
            except Exception as e:  # 못 읽는 그림은 그대로
                print('그림 그대로', im_i, e)
        nv = dict(v); nv['byteOffset'] = off; nv['byteLength'] = len(data)
        새뷰.append(nv)
        새조각.append(data)
        pad = (4 - len(data) % 4) % 4
        if pad: 새조각.append(b'\0' * pad)
        off += len(data) + pad
    새bin = b''.join(새조각)
    후 = len(새bin)
    js['bufferViews'] = 새뷰
    js['buffers'] = [{'byteLength': len(새bin)}]
    jb = json.dumps(js, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    jb += b' ' * ((4 - len(jb) % 4) % 4)
    total = 12 + 8 + len(jb) + 8 + len(새bin)
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(jb), 0x4E4F534A)); f.write(jb)
        f.write(struct.pack('<II', len(새bin), 0x004E4942)); f.write(새bin)
    print(f'{src} → {dst}: BIN {전 / 1e6:.1f} MB → {후 / 1e6:.1f} MB · 그림 {len(그림뷰)}장')


if __name__ == '__main__':
    줄이기(sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 1024)
