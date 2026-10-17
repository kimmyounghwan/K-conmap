"""DXF 판마다 빈 틀(R12 · 2000 · 2004 · 2007 · 2010 · 2013 · 2018) → web/src/lib/dxf판틀.js  (ezdxf 필요 · 2026-10-17 캐드 고치기)
   python tools/dxf판틀_만들기.py
   ezdxf 가 만든 «아무것도 없는 도면»(AutoCAD 가 여는 꼴)에서 표 · 블록 · 도형 · 머리 값 자리를 @@…@@ 로 남깁니다.
   lib/캐드고침.js 의 다시쓰기() 가 채웁니다.
   · 층(LAYER) 은 틀에서 모두 빼고 다시쓰기가 «0» 부터 씀(원래 도면 층 색 · 선 그대로)
   · Standard 글꼴 · *Active 화면(가운데 · 높이) · 배치 이름 · 종이 설정 자리
   · ezdxf 표시(EZDXF_META · APPID EZDXF)는 지움
   · ACI 256 색 표도 같이 냄(옛 판에 참색이 없을 때 가까운 색 번호)
"""
import io, os, re, json, ezdxf
import ezdxf.colors

판들 = ['R12', 'R2000', 'R2004', 'R2007', 'R2010', 'R2013', 'R2018']


def 바꿈(t, 틀, 새, 몇=1):
    n = len(re.findall(틀, t, flags=re.S))
    if n < 몇:
        raise SystemExit(f'틀 못 찾음: {틀[:60]!r} ({n})')
    return re.sub(틀, 새, t, count=1, flags=re.S)


out = {}
for 판 in 판들:
    doc = ezdxf.new(판, setup=False)
    if 판 != 'R12':
        doc.header['$INSUNITS'] = 4
    doc.header['$MEASUREMENT'] = 1
    doc.header['$DWGCODEPAGE'] = 'ANSI_949'
    s = io.StringIO()
    doc.write(s)
    t = s.getvalue()
    ver = doc.dxfversion
    R12 = ver == 'AC1009'
    정보 = {'판': ver}

    # ── 머리
    t = 바꿈(t, r'(\$HANDSEED\n  5\n)[0-9A-Fa-f]+\n', r'\1@@HANDSEED@@\n')
    t = 바꿈(t, r'(\$EXTMIN\n 10\n)[^\n]+\n 20\n[^\n]+\n', r'\1@@EXMINX@@\n 20\n@@EXMINY@@\n')
    t = 바꿈(t, r'(\$EXTMAX\n 10\n)[^\n]+\n 20\n[^\n]+\n', r'\1@@EXMAXX@@\n 20\n@@EXMAXY@@\n')
    t = 바꿈(t, r'(\$LIMMAX\n 10\n)[^\n]+\n 20\n[^\n]+\n', r'\1@@LIMMAXX@@\n 20\n@@LIMMAXY@@\n')
    t = 바꿈(t, r'(\$LTSCALE\n 40\n)[^\n]+\n', r'\1@@LTSCALE@@\n')
    t = 바꿈(t, r'(\$DWGCODEPAGE\n  3\n)[^\n]+\n', r'\1@@DWGCODEPAGE@@\n')
    if not R12:
        t = 바꿈(t, r'(\$INSUNITS\n 70\n)[^\n]+\n', r'\1@@INSUNITS@@\n')
        t = 바꿈(t, r'(\$MEASUREMENT\n 70\n)[^\n]+\n', r'\1@@MEASUREMENT@@\n')

    # ── ezdxf 표시 지움
    t = re.sub(r'  3\nEZDXF_META\n350\n[0-9A-F]+\n', '', t)
    t = re.sub(r'  0\nDICTIONARY\n  5\n[0-9A-F]+\n330\n[0-9A-F]+\n100\nAcDbDictionary\n280\n1\n281\n1\n  3\nCREATED_BY_EZDXF\n.*?(?=  0\nENDSEC\n)', '', t, flags=re.S)
    t = re.sub(r'1001\nEZDXF\n(?:1000\n[^\n]*\n)+', '', t)
    m = re.search(r'  0\nAPPID\n  5\n[0-9A-F]+\n(?:(?!  0\n).)*?  2\nEZDXF\n(?:(?!  0\n).)*', t, flags=re.S)
    t = t[:m.start()] + t[m.end():]
    t = 바꿈(t, r'(  2\nAPPID\n(?:(?!  0\n).)*? 70\n)\d+\n', r'\g<1>2\n')

    # ── *Active 화면
    t = 바꿈(t, r'(  2\n\*Active\n(?:(?!  0\n).)*? 12\n)[^\n]+\n 22\n[^\n]+\n', r'\1@@VPCX@@\n 22\n@@VPCY@@\n')
    t = 바꿈(t, r'(  2\n\*Active\n(?:(?!  0\n).)*? 40\n)[^\n]+\n 41\n[^\n]+\n', r'\1@@VPH@@\n 41\n@@VPA@@\n')

    # ── 표: 손잡이 · 개수 · 끝 자리
    for 표 in ['LTYPE', 'LAYER', 'STYLE', 'DIMSTYLE', 'BLOCK_RECORD']:
        if R12 and 표 == 'BLOCK_RECORD':
            continue
        i = t.index('  2\n' + 표 + '\n')
        if not R12:
            정보[표] = re.search(r'  5\n([0-9A-F]+)\n', t[i:i + 80]).group(1)
        j = t.index(' 70\n', i)
        k = t.index('\n', j + 4)
        t = t[:j] + ' 70\n@@' + 표 + 'N@@' + t[k:]
        e = t.index('  0\nENDTAB\n', i)
        if 표 == 'LAYER':          # 층은 모두 다시씀
            시작 = t.index('  0\nLAYER\n', i)
            t = t[:시작] + t[e:]
            e = 시작
        t = t[:e] + '@@' + 표 + 'S@@' + t[e:]

    # ── Standard 글꼴
    m = re.search(r'  0\nSTYLE\n(?:(?!  0\n).)*?  2\nStandard\n(?:(?!  0\n).)*?  3\n([^\n]*)\n  4\n([^\n]*)\n', t, re.S)
    t = t[:m.start(1)] + '@@STDFONT@@' + t[m.end(1):m.start(2)] + '@@STDBIG@@' + t[m.end(2):]

    # ── 층 꼬리(390 그림 스타일 · 347 재질) · 모델/종이 블록 · 배치
    if not R12:
        doc0 = ezdxf.new(판, setup=False)
        s0 = io.StringIO()
        doc0.write(s0)
        m = re.search(r'  0\nLAYER\n  5\n[0-9A-F]+\n(?:(?!  0\n).)*?  2\n0\n((?:(?!  0\n).)*)', s0.getvalue(), re.S)
        정보['층꼬리'] = re.findall(r'(390|347)\n([0-9A-F]+)\n', m.group(1))
        정보['모델'] = re.search(r'  0\nBLOCK_RECORD\n  5\n([0-9A-F]+)\n(?:(?!  0\n).)*?  2\n\*Model_Space\n', t, re.S).group(1)
        정보['종이'] = re.search(r'  0\nBLOCK_RECORD\n  5\n([0-9A-F]+)\n(?:(?!  0\n).)*?  2\n\*Paper_Space\n', t, re.S).group(1)
        정보['STANDARD'] = re.search(r'  0\nSTYLE\n  5\n([0-9A-F]+)\n(?:(?!  0\n).)*?  2\nStandard\n', t, re.S).group(1)
        m = re.search(r'(  0\nLAYOUT\n  5\n[0-9A-F]+\n330\n[0-9A-F]+\n100\nAcDbPlotSettings\n)((?:(?!100\n).)*?)(100\nAcDbLayout\n  1\n)Layout1\n', t, re.S)
        정보['종이설정'] = m.group(2)
        t = t[:m.start(2)] + '@@PLOTSET@@' + t[m.end(2):m.end(3)] + '@@LAYOUTNAME@@\n' + t[m.end():]
        t = 바꿈(t, r'(  3\n)Layout1(\n350\n)', r'\g<1>@@LAYOUTNAME@@\2')

    # ── CLASSES · OBJECTS 끝(잘라 보이기(XCLIP) 같은 물체를 덧붙일 자리)
    if not R12:
        i = t.index('  2\nCLASSES\n')
        e = t.index('  0\nENDSEC\n', i)
        정보['클래스'] = re.findall(r'  0\nCLASS\n  1\n([^\n]+)\n', t[i:e])
        t = t[:e] + '@@CLASSES@@' + t[e:]
        i = t.index('  2\nOBJECTS\n')
        e = t.index('  0\nENDSEC\n', i)
        t = t[:e] + '@@OBJECTS@@' + t[e:]

    # ── BLOCKS 끝 · ENTITIES
    i = t.index('  2\nBLOCKS\n')
    e = t.index('  0\nENDSEC\n', i)
    t = t[:e] + '@@BLOCKS@@' + t[e:]
    e = t.index('  2\nENTITIES\n') + len('  2\nENTITIES\n')
    t = t[:e] + '@@ENTITIES@@' + t[e:]
    정보['큰손잡이'] = max(int(h, 16) for h in re.findall(r'\n(?:  5|105)\n([0-9A-F]+)\n', t))
    left = re.findall(r'EZDXF', t)
    if left:
        raise SystemExit(f'{판}: EZDXF 남음 {len(left)}')
    out[ver] = {'틀': t, '정보': 정보}
    print(판, ver, len(t), 정보.get('층꼬리'), hex(정보['큰손잡이']))

aci = [f'{c:06X}' for c in ezdxf.colors.DXF_DEFAULT_COLORS]
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'web', 'src', 'lib', 'dxf판틀.js')
with open(dst, 'w', encoding='utf-8') as f:
    f.write('/* DXF 판마다 빈 틀 — tools/dxf판틀_만들기.py 가 ezdxf 로 만듦 (손으로 고치지 말 것) */\n')
    f.write('export const 판틀 = ' + json.dumps(out, ensure_ascii=False) + '\n')
    f.write('/* ACI 색 번호 0 ~ 255 → RRGGBB */\nexport const ACI색 = ' + json.dumps(aci) + '\n')
print('ok', dst, os.path.getsize(dst))
