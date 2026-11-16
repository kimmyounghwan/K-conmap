# -*- coding: utf-8 -*-
"""기계등 대여사항 기록부 — 새로 만든 서식 (2026-11-16 G711 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 적은 줄 · 대여 횟수 합계 · 대여자 조치(규칙 제100조) 안내 · 아직 안 적은 칸
   · 기록부(산업안전보건법 시행규칙 [별지 제39호서식] 칸 차례 그대로 — 세로 한 쪽 · 본문 25줄 · 원문처럼 줄 사이 가로선 없음).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 120~1118.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G711_기계대여기록부_원문.txt — 글층 해시 같음 확인):
  · 산업안전보건법 시행령 [시행 2026. 8. 1.] 제71조 · [별표 21](기계등 24가지 + 고시 — 예시 기계명은 이 표의 이름으로 · 2026-11-16 16:0x 세 번 확인)
  · 산업안전보건법 시행규칙 [시행 2026. 8. 1.] 제103조(기계등 대여사항의 기록ㆍ보존 — 별지 제39호서식) · 제100조(기계등 대여자의 조치)
■ 짐작 안 함: 보존 기간은 제103조에 따로 없어 적지 않음 · 재해건수(사망자수)는 원문처럼 한 칸(글)."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "gigye-daeyeo-girokbu"
TITLE = "기계등 대여사항 기록부"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "기계등 대여사항 기록부(산업안전보건법 시행규칙 별지 제39호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "기계등 대여사항 기록부 — 작성 예시"),
        (3, "① 적은 줄 · 대여 횟수 합계 · 대여자 조치 — 작성 예시")]
MULTI = True
SHORT = ("기계등 대여사항 기록부(산업안전보건법 시행규칙 별지 제39호서식) — 기계등을 빌려주는 자가 대여 연월일 · 기계명 · 보유 대수 · 대여 횟수 · 재해건수를 "
         "기록 · 보존합니다(규칙 제103조). 적은 줄과 대여 횟수 합계가 저절로 나옵니다.")
NOTE_REPLACE = None

D = datetime.date
DT = 'yyyy". "m". "d"."'
NR = 25
CHO = ("기계등을 대여하는 자의 조치(규칙 제100조): 1. 미리 점검하고 이상이 있으면 즉시 보수 · 정비 2. 대여받은 자에게 성능 · 방호조치 · 특성 · 사용 시 주의사항 · "
       "수리 · 보수 · 점검 내역과 주요 부품 제조일 · 정밀진단 및 수리 후 안전점검 내역 · 주요 안전부품 교환이력을 적은 서면 발급 3. 설치 · 해체를 다른 업자에게 "
       "맡기면 자격 · 장비 확인 · 서면 발급 · 기준 준수 확인 4. 대여받은 자에게 그 확인 결과를 알림")
BIN_OK = "✓ 사업체 칸을 다 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
SUM_A = "적은 줄 "
SUM_B = "줄 · 대여 횟수 합계 "
SUM_C = "회"

EX_S = {"사업체명": "사아중기", "사업장관리번호": "00000000000", "사업자등록번호": "000-00-00000", "전화번호": "000-000-0000", "대표자": "윤사아",
        "생년월일": "1975. 4. 8.", "소재지": "가나시 마바구 공단로 78"}
EX_R = [(D(2027, 1, 4), "버킷굴착기(0.6㎥)", 6, 1, "0(0)", "마바토건(주) 현장"),
        (D(2027, 1, 11), "지게차(3톤)", 4, 2, "0(0)", None),
        (D(2027, 2, 3), "이동식 크레인(25톤)", 2, 1, "0(0)", "설치 · 해체 없음"),
        (D(2027, 3, 2), "버킷굴착기(0.6㎥)", 6, 1, "1(0)", "끼임 경상 1명(보고)"),
        (D(2027, 3, 15), "고소작업대(차량탑재형)", 3, 3, "0(0)", None)]
HEAD = "■ 산업안전보건법 시행규칙 [별지 제39호서식]"
PAPER = "210㎜×297㎜[일반용지 60g/㎡(재활용품)]"
EX = {}


def _es(ex, k):
    return EX_S.get(k) if ex else None


def _er(ex, i, j):
    if not ex or i > len(EX_R):
        return None
    return EX_R[i - 1][j]


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(120, 1118)


def prow(p, items, h):
    r = p.r
    cells = []
    c = 1
    for it in items:
        a, b = GX.cols(it[0], it[1])
        assert b >= a, (p.name, r, it[:2])
        while (r, c) in p.occ:
            c += 1
        assert c == a, f"[{p.name}] {r}행 칸 자리 {c} ≠ {a} (x {it[0]})"
        cells.append((b - a + 1,) + tuple(it[2:]))
        c = b + 1
    return p.row(cells, h=h)


def _bd(p, r1, r2, x1, x2, top=True, bot=True, left=True, right=True):
    from openpyxl.styles import Border
    from fb import LINE
    c1, c2 = GX.cols(x1, x2)
    for r in range(r1, r2 + 1):
        for c in range(c1, c2 + 1):
            p.ws.cell(row=r, column=c).border = Border(left=LINE if (left and c == c1) else None, right=LINE if (right and c == c2) else None,
                                                       top=LINE if (top and r == r1) else None, bottom=LINE if (bot and r == r2) else None)


LT = {"kind": "free", "size": 8, "align": "left"}
NB = {"border": False}
COLS = [(120, 300), (300, 465), (465, 631), (631, 796), (796, 980), (980, 1118)]
HEADS = ["대여 연월일", "대여 기계명", "보유 대수", "대여 횟수", "재해건수(사망자수)", "비고"]


def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  기계등 대여사항 기록부 — 적은 줄 · 대여 횟수 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 기계등을 대여하는 자는 그 대여에 관한 사항을 이 기록부(별지 제39호서식)에 따라 기록 · 보존해야 합니다(산업안전보건법 시행규칙 제103조).")
    g.sec(p, "㉮  합계", need=26 * 2 + 10)
    cnt = f'COUNTA({{기록부!기계명[]}})'
    tot = f'SUM({{기록부!횟수[]}})'
    p.row([(3, "합계", g.L), (9, F("합계", f'=IF({cnt}=0,"","{SUM_A}"&{cnt}&"{SUM_B}"&{tot}&"{SUM_C}")', align="left", size=9))], h=28)
    g.sec(p, "㉯  대여자 조치 (규칙 제100조)", need=60)
    n = text_lines(CHO, sum(p.widths[3:12]) * 10.0 / 7.5)
    p.row([(3, "대여자 조치", g.L), (9, CHO, {"kind": "text", "size": 7.5})], h=max(40, n * 7.5 * 1.45 + 6))
    g.sec(p, "㉰  아직 안 적은 칸", need=26 * 2 + 10)
    cntb = "+".join(f'IF({c},1,0)' for _, c in BIN)
    lst = "&".join(f'IF({c}," · {n}","")' for n, c in BIN)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", '=IF(AND({기록부!사업체명}="",' + cnt + '=0),"",IF(' + cntb + '=0,"' + BIN_OK + '","' + BIN_A + '"&MID(' + lst + ',4,300)))',
                 align="left", size=8.5))], h=34)
    g.d.done(p)
    p.after_note(["기록부에 적으면 하늘색 칸이 저절로 바뀝니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 사람 · 번호)."])
    return p


BIN = [("사업체명", '{기록부!사업체명}=""'), ("사업자등록번호", '{기록부!사업자등록번호}=""'), ("대표자 성명", '{기록부!대표자}=""'),
       ("소재지", '{기록부!소재지}=""'), ("대여 기록 줄", 'COUNTA({기록부!기계명[]})=0')]


def book(bk, ex):
    p = g.pg(bk, ex, "기록부", fit=1, widths=WP)
    prow(p, [(120, 1118, HEAD, {"kind": "note", "size": 7.5})], h=13)
    prow(p, [(120, 1118, "기계등 대여사항 기록부", {"kind": "title", "size": 16})], h=34)
    rows = [((245, 330, "사업체명", "사업체명"), (800, 935, "사업장관리번호", "사업장관리번호")),
            ((245, 360, "사업자등록번호", "사업자등록번호"), (800, 870, "전화번호", "전화번호")),
            ((245, 335, "대표자 성명", "대표자"), (800, 870, "생년월일", "생년월일")),
            ((245, 300, "소재지", "소재지"), None)]
    first = True
    for a, b in rows:
        items = [(120, 245, "사업체", {"kind": "label", "size": 9.5, "rs": 4})] if first else []
        first = False
        x1, xm, lab, k = a
        if b:
            items += [(x1, xm, lab, LT), (xm, 800, I(k, ex=_es(ex, k), align="left", size=8.5), NB)]
            y1, ym, lab2, k2 = b
            items += [(y1, ym, lab2, LT), (ym, 1118, I(k2, ex=_es(ex, k2), align="left", size=8.5), NB)]
        else:
            items += [(x1, xm, lab, LT), (xm, 1118, I(k, ex=_es(ex, k), align="left", size=8.5), NB)]
        r = prow(p, items, h=18)
        _bd(p, r, r, 245, 1118)
    p.gap(5)
    prow(p, [(x1, x2, HEADS[j], {"kind": "head", "size": 8.5}) for j, (x1, x2) in enumerate(COLS)], h=24)
    r1 = None
    for i in range(1, NR + 1):
        items = [(COLS[0][0], COLS[0][1], I(f"대여일#{i}", ex=_er(ex, i, 0), fmt=DT, align="center", size=8)),
                 (COLS[1][0], COLS[1][1], I(f"기계명#{i}", ex=_er(ex, i, 1), align="center", size=8)),
                 (COLS[2][0], COLS[2][1], I(f"보유#{i}", ex=_er(ex, i, 2), fmt='#,##0;;""', align="center", size=8)),
                 (COLS[3][0], COLS[3][1], I(f"횟수#{i}", ex=_er(ex, i, 3), fmt='#,##0;;""', align="center", size=8)),
                 (COLS[4][0], COLS[4][1], I(f"재해#{i}", ex=_er(ex, i, 4), align="center", size=8)),
                 (COLS[5][0], COLS[5][1], I(f"비고#{i}", ex=_er(ex, i, 5), align="left", size=6.5))]
        r = prow(p, items, h=18)
        r1 = r if r1 is None else r1
    # 원문처럼 줄 사이 가로선 없이 세로선만(칸마다 위 · 아래는 표 끝에서만)
    for x1, x2 in COLS:
        _bd(p, r1, r, x1, x2)
    for k in ("기계명", "횟수"):
        p.k[f"{k}[]"] = f"{p.k[f'{k}#1']}:{p.k[f'{k}#{NR}']}"
    prow(p, [(120, 1118, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["대여할 때마다 한 줄씩 적습니다. 줄이 모자라면 다음 장에 이어 적습니다."] if not ex else ["이 시트는 작성 예시입니다(가상의 회사 · 기계 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    book(bk, ex)


def _isnum(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def expect(pages):
    s_in = pages["기록부"]
    a = {}
    names = [s_in.get(f"기계명#{i}") for i in range(1, NR + 1)]
    cnt = sum(1 for v in names if v not in (None, ""))
    tot = sum(v for v in (s_in.get(f"횟수#{i}") for i in range(1, NR + 1)) if _isnum(v))
    a["합계"] = "" if cnt == 0 else f"{SUM_A}{cnt}{SUM_B}{int(tot) if float(tot).is_integer() else tot}{SUM_C}"
    if not s_in.get("사업체명") and cnt == 0:
        a["빈칸"] = ""
    else:
        mc = {"사업체명": not s_in.get("사업체명"), "사업자등록번호": not s_in.get("사업자등록번호"), "대표자 성명": not s_in.get("대표자"),
              "소재지": not s_in.get("소재지"), "대여 기록 줄": cnt == 0}
        miss = [n for n, _ in BIN if mc[n]]
        a["빈칸"] = BIN_OK if not miss else (BIN_A + " · ".join(miss))[:len(BIN_A) + 300]
    return {"셈": a, "기록부": {}}


for _t in (BIN_OK, BIN_A, SUM_A, SUM_B, SUM_C):
    assert len(_t) < 255 and '"' not in _t
