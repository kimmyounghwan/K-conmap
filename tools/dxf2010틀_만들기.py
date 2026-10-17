"""DXF R2010 빈 틀 → web/src/lib/dxf2010틀.js  (ezdxf 필요 · 2026-10-17 컬러 평면도 DXF 쓰기용)
   python tools/dxf2010틀_만들기.py
   ezdxf 가 만든 «아무것도 없는 R2010 도면»(AutoCAD 가 여는 꼴)에 글꼴 KCM(맑은 고딕) · DASHED 를 넣고,
   층 · 도형 · 손잡이 끝 · 범위 자리에 표시(@@…@@)를 남깁니다. 표시는 lib/컬러평면dxf.js 가 채웁니다.
"""
import io, os, re, ezdxf
doc = ezdxf.new('R2010', setup=False)
doc.header['$INSUNITS'] = 4
doc.header['$MEASUREMENT'] = 1
doc.styles.add('KCM', font='malgun.ttf')
doc.linetypes.add('DASHED', pattern=[600, 400, -200], description='Dashed __ __')
s = io.StringIO(); doc.write(s); t = s.getvalue()
# 손잡이 끝
t = re.sub(r'(\$HANDSEED\n  5\n)[0-9A-Fa-f]+\n', r'\1@@HANDSEED@@\n', t)
# 범위
t = re.sub(r'(\$EXTMIN\n 10\n)[^\n]+\n 20\n[^\n]+\n', r'\1@@EXMINX@@\n 20\n@@EXMINY@@\n', t)
t = re.sub(r'(\$EXTMAX\n 10\n)[^\n]+\n 20\n[^\n]+\n', r'\1@@EXMAXX@@\n 20\n@@EXMAXY@@\n', t)
# 층 표 — 개수 · 끝
i = t.index('  2\nLAYER\n')
j = t.index(' 70\n', i)
k = t.index('\n', j + 4)
t = t[:j] + ' 70\n@@LAYERN@@' + t[k:]
e = t.index('  0\nENDTAB\n', i)
t = t[:e] + '@@LAYERS@@' + t[e:]
# 도형
e = t.index('  2\nENTITIES\n') + len('  2\nENTITIES\n')
t = t[:e] + '@@ENTITIES@@' + t[e:]
# 층 표 손잡이 · 모델 공간 손잡이
lay_h = re.search(r'  0\nTABLE\n  2\nLAYER\n  5\n([0-9A-F]+)\n', t).group(1)
ms_h = re.search(r'  0\nBLOCK_RECORD\n  5\n([0-9A-F]+)\n330\n[0-9A-F]+\n100\nAcDbSymbolTableRecord\n100\nAcDbBlockTableRecord\n  2\n\*Model_Space', t).group(1)
mx = max(int(h, 16) for h in re.findall(r'\n  5\n([0-9A-F]+)\n', t))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'src', 'lib', 'dxf2010틀.js')
with open(out, 'w', encoding='utf-8') as f:
    f.write('/* DXF R2010 빈 틀 — tools/dxf2010틀_만들기.py 가 ezdxf 로 만듦 (손으로 고치지 말 것) */\n')
    f.write(f"export const 틀정보 = {{ 층표: '{lay_h}', 모델: '{ms_h}', 큰손잡이: 0x{mx:X} }}\n")
    f.write('export const 틀 = ' + __import__('json').dumps(t, ensure_ascii=False) + '\n')
print('ok', out, len(t), 'layer', lay_h, 'model', ms_h, 'max', hex(mx))
