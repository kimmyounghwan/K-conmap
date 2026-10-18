# -*- coding: utf-8 -*-
"""🤝 하도급 계약서류 한 벌 — 틀 뽑기 (2026-10-18)

  python tools/build_하도급서류틀.py <본보기.xlsx>  →  web/src/data/하도급서류틀.js (export default — 노드 시험에서도 바로 읽힘)

■ 본보기 = 소장님이 주신 하도급 계약서류 엑셀(33시트). 실제 회사 · 사람 · 금액이 들어 있어 저장소에 넣지 않습니다.
  여기서는 «서식»(칸 너비 · 줄 높이 · 병합 · 글꼴 · 테두리 · 채우기 · 인쇄 설정 · 꾸밈 번호)만 뽑고 «값» 은 버립니다.
■ 통째로 옮기는 서류(통보서 · 계약서 · 착공계 …)는 글자 · 수식도 옮깁니다 — 수식의 «기초입력!D7» 같은 칸 주소는
  «⟦하도급공사명⟧» 같은 이름표로 바꿔 두고, 화면(lib/하도급서류.js)이 새 기초입력 칸 주소로 다시 바꿉니다.
■ 줄 수가 바뀌는 서류(원가계산서 대비표 · 원·하도급 대비표 · 내역서 · 공정표 · 제출서류목록 · 계약조건 · 기초입력)는
  머리 줄 글자와 «줄 꼴(꾸밈 번호)» 만 옮깁니다.
■ 안전: 본보기 «기초입력» 의 값(상호 · 이름 · 주소 · 번호 · 금액)과 지역 · 회사 낱말이 틀에 하나라도 남으면 멈춥니다.
"""
import sys, os, re, json, html, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'web', 'src', 'data', '하도급서류틀.js')

SRC = sys.argv[1]
z = zipfile.ZipFile(SRC)
wb = z.read('xl/workbook.xml').decode()
rels = z.read('xl/_rels/workbook.xml.rels').decode()
rel = {}
for m in re.finditer(r'<Relationship ([^>]*)/>', rels):
    a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
    rel[a['Id']] = a['Target']
names = [(html.unescape(n), r) for n, r in re.findall(r'<sheet name="([^"]*)" sheetId="\d+"[^>]*r:id="(rId\d+)"', wb)]
sst = []
for si in re.findall(r'<si>(.*?)</si>', z.read('xl/sharedStrings.xml').decode(), re.S):
    sst.append(html.unescape(''.join(re.findall(r'<t[^>]*>(.*?)</t>', si, re.S))))
styles = z.read('xl/styles.xml').decode()
theme = z.read('xl/theme/theme1.xml').decode() if 'xl/theme/theme1.xml' in z.namelist() else ''


def xml(name):
    t = rel[dict(names)[name]].lstrip('/')
    return z.read(t if t.startswith('xl/') else 'xl/' + t).decode()


def cells(x):
    out, rows = {}, {}
    for row in re.finditer(r'<row ([^>]*?)(?:/>|>(.*?)</row>)', x, re.S):
        ra = dict(re.findall(r'(\w+)="([^"]*)"', row.group(1)))
        r = int(ra['r'])
        rows[r] = {k: ra[k] for k in ('ht', 'customHeight', 'hidden', 's', 'customFormat') if k in ra}
        for c in re.finditer(r'<c ([^>]*?)(?:/>|>(.*?)</c>)', row.group(2) or '', re.S):
            a = dict(re.findall(r'(\w+)="([^"]*)"', c.group(1)))
            body = c.group(2) or ''
            f = re.search(r'<f[^>]*>(.*?)</f>', body, re.S)
            v = re.search(r'<v>(.*?)</v>', body, re.S)
            val = None
            if a.get('t') == 's' and v: val = sst[int(v.group(1))]
            elif '<is>' in body: val = html.unescape(''.join(re.findall(r'<t[^>]*>(.*?)</t>', body, re.S)))
            elif v and a.get('t') == 'str': val = html.unescape(v.group(1))
            elif v: val = float(v.group(1)) if re.fullmatch(r'-?\d+(\.\d+)?(E-?\d+)?', v.group(1)) else html.unescape(v.group(1))
            o = {'s': int(a.get('s', 0))}
            if f: o['f'] = html.unescape(f.group(1))
            elif val is not None and val != '': o['v'] = val
            out[a['r']] = o
    return out, rows


def 뼈(x):
    """sheetData 앞 · 뒤 — 보기 자리(topLeftCell · selection)와 dimension 은 뺌"""
    m = re.search(r'(<worksheet[^>]*>)(.*?)<sheetData', x, re.S)
    앞 = m.group(2)
    앞 = re.sub(r'<dimension[^>]*/>', '', 앞)
    앞 = re.sub(r'\stopLeftCell="[^"]*"', '', 앞)
    앞 = re.sub(r'<selection[^>]*/>', '', 앞)
    앞 = re.sub(r'<sheetView([^>]*)>\s*</sheetView>', r'<sheetView\1/>', 앞)
    뒤 = re.search(r'</sheetData>(.*)</worksheet>', x, re.S).group(1)
    합 = [m.group(0) for m in re.finditer(r'<mergeCell ref="([^"]+)"/>', 뒤)]
    합 = re.findall(r'<mergeCell ref="([^"]+)"/>', 뒤)
    뒤 = re.sub(r'<mergeCells[^>]*>.*?</mergeCells>', '', 뒤, flags=re.S)
    cf = re.findall(r'<conditionalFormatting.*?</conditionalFormatting>', 뒤, re.S)
    뒤 = re.sub(r'<conditionalFormatting.*?</conditionalFormatting>', '', 뒤, flags=re.S)
    return 앞, 뒤, 합, cf


# ── 기초입력 칸 → 이름표 (본보기 «기초입력» B 칸 이름 그대로 짝지음) ──
기초키 = {
    6: '공사명', 7: '하도급공사명', 8: '하도급공종', 9: '공사위치', 10: '발주자', 11: '감리',
    13: '수급인상호', 14: '수급인대표', 15: '수급인사업자번호', 16: '수급인소재지', 17: '수급인업종등록', 18: '수급인현장대리인',
    20: '원계약일', 21: '원착공일', 22: '원준공기한', 23: '원계약기간',
    25: '하수급인상호', 26: '하수급인약식', 27: '하수급인대표', 28: '하수급인사업자번호', 29: '하수급인소재지', 30: '하수급인등록번호',
    31: '협력등록일', 32: '하수급인연락처',
    34: '대리인성명', 35: '대리인생년월일', 36: '대리인주소', 37: '대리인부서', 38: '대리인직위', 39: '대리인입사일',
    40: '경력관리번호', 41: '경력발급번호', 42: '자격종별', 43: '자격등급',
    45: '하도급률', 46: '하계약일', 47: '하착공일', 48: '하준공일', 49: '하계약기간',
    51: '지체상금률', 52: '하자기간', 53: '하자보증률', 54: '계약이행보증',
    56: '예금주', 57: '은행', 58: '계좌',
    68: '하도급부분도급액', 69: '원계약금액', 70: '하재료비', 71: '하직노', 72: '하산출경비', 73: '하순공사비', 74: '하총원가', 75: '하부가세',
    76: '하계약금액', 77: '하계약금액한글', 78: '하도급부분한글', 79: '원계약금액한글',
}
c기, _ = cells(xml('기초입력'))
for r, k in 기초키.items():
    assert ('B%d' % r) in c기, ('기초입력 B%d 가 없음' % r)
금지 = set()
for ref, o in c기.items():
    if ref.startswith('D') and 'v' in o:
        v = o['v']
        if isinstance(v, float):
            if abs(v) >= 1000: 금지.add(str(int(v)))
        else:
            t = str(v).strip()
            if len(t) >= 2: 금지.add(t)
            for w in re.split(r'[\s,()]+', t):
                if len(w) >= 3 and not re.fullmatch(r'[\d.%]+|년|월|일|계약금액의|1일당|100분의|1,000분의|공사부|현장소장', w): 금지.add(w)
# 기초입력 D 칸 밖에 든 실제 낱말(지명 · 상호 등)은 저장소에 적지 않고, 본보기 옆 «<본보기>.금지.txt»(한 줄에 하나 · 저장소 밖)에서 읽음
_더 = SRC + '.금지.txt'
if os.path.exists(_더):
    금지 |= {w.strip() for w in open(_더, encoding='utf8') if w.strip()}
else:
    print('⚠ ' + _더 + ' 없음 — 기초입력 D 칸 낱말만 막습니다')


def 이름표(f):
    def 바꿈(m):
        r = int(m.group(1))
        if r not in 기초키: raise SystemExit('이름표 없는 기초입력 칸: D%d — %s' % (r, f))
        return '⟦' + 기초키[r] + '⟧'
    return re.sub(r"기초입력!\$?D\$?(\d+)", 바꿈, f)


통째 = ['하도급계약통보서', '통보서뒤쪽', '하도급계약서', '착공계', '현장대리인계', '재직증명서', '사용인감계', '직접지급합의서']
꼴만 = {   # 줄 수가 바뀌는 서류 — 글자를 옮길 머리 줄
    '기초입력': [], '제출서류목록': [5], '계약조건': [],
    '하도급원가계산서대비표': [4], '하도급원가계산서': [4],
    '원·하도급대비표': [4, 5], '원·하도급내역서': [4, 5],
    '공사공정표': [3, 4, 5, 9, 10, 11, 14, 15, 16],
}
dn = re.findall(r'<definedName name="(_xlnm\.Print_(?:Area|Titles))" localSheetId="(\d+)">(.*?)</definedName>', wb)
순번 = [n for n, _ in names]
인쇄 = {}
for k, i, v in dn:
    nm = 순번[int(i)]
    인쇄.setdefault(nm, {})['영역' if k.endswith('Area') else '제목'] = html.unescape(v).split('!')[-1]

장들 = {}
for nm in 통째 + list(꼴만):
    x = xml(nm)
    cs, rows = cells(x)
    앞, 뒤, 합, cf = 뼈(x)
    if nm in 통째:
        keep = {}
        for ref, o in cs.items():
            o = dict(o)
            if 'f' in o: o['f'] = 이름표(o['f'])
            keep[ref] = o
    else:
        글줄 = set(꼴만[nm])
        keep = {}
        for ref, o in cs.items():
            r = int(re.match(r'[A-Z]+(\d+)', ref).group(1))
            o2 = {'s': o['s']}
            if r in 글줄:
                if 'f' in o: o2['f'] = 이름표(o['f'])
                elif 'v' in o: o2['v'] = o['v']
            keep[ref] = o2
    장들[nm] = {'앞': 앞, '뒤': 뒤, '합': 합, 'cf': cf, '칸': keep, '줄': {str(k): v for k, v in rows.items()}, '인쇄': 인쇄.get(nm, {})}

# ── 안전 검사 — 본보기 값 · 지역 · 회사 낱말이 하나라도 남았나 ──
글 = json.dumps(장들, ensure_ascii=False)
남은 = sorted(w for w in 금지 if w in 글)
if 남은:
    raise SystemExit('❌ 틀에 본보기 값이 남았습니다: ' + ' · '.join(남은[:20]))
틀 = {'판': '2026-10-18', '본보기': '하도급 계약서류(33시트) — 서식만', '꾸밈': styles, '테마': theme, '장들': 장들}
open(OUT, 'w', encoding='utf-8').write('/* 자동 생성 — tools/build_하도급서류틀.py (본보기 서식만 · 값 없음). 손으로 고치지 마십시오. */\nexport default ' + json.dumps(틀, ensure_ascii=False, separators=(',', ':')) + '\n')
print('✅ 틀', len(장들), '장 ·', os.path.getsize(OUT) // 1024, 'KB · 금지 낱말', len(금지), '개 모두 없음')
for nm in 통째:
    for ref, o in sorted(장들[nm]['칸'].items()):
        if 'v' in o and isinstance(o['v'], str): print('  글', nm, ref, o['v'][:60].replace('\n', '⏎'))
