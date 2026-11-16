# -*- coding: utf-8 -*-
"""소방시설공사 기록부 — 새로 만든 서식 (2026-11-16 G716 · 소장님 「오늘 중으로 다 만들자. 서식」)
   → ① 적은 줄 · 보관(하자보수 보증기간 동안 — 법 제8조제4항 · 규칙 제8조제2호) · 아직 안 적은 칸
   · 기록부(소방시설공사업법 시행규칙 [별지 제11호서식] <개정 2016. 1. 27.> 칸 차례 그대로 — 세로 한 쪽 · 본문 15줄).
   📄 XLSX = False — 사이트 작성 → 그림 PDF 만(소장님 11-13).
   칸 나눔: 원문 쪽 그림(1240×1752) 선 자리를 그림 픽셀에서 바로 읽어 96칸에 맞춤 — x 121~1116.

근거(국가법령정보센터 · 2026-11-16 · 원문 글층 /home/claude/g10/notes/G716_소방공사기록부_원문.txt — 글층 해시 같음 확인):
  · 소방시설공사업법 [시행 2025. 1. 31.] 제8조제4항(관계 서류를 하자보수 보증기간 동안 보관) ·
    시행규칙 [시행 2026. 10. 20.] 제8조제2호(소방시설공사업 — 별지 제11호서식 소방시설공사 기록부)
■ 짐작 안 함: 하자보수 보증기간(시설마다 다름)은 셈하지 않고 글로만 · 머리 «하도급 시설» · «전화번호» 는 원문 글층이 두 줄로 끊겨 읽는 차례가 다름(원문대조에 남음)."""
import datetime

import sgw as g
from fb import F, I, text_lines

SLUG = "sobang-gongsa-girokbu"
TITLE = "소방시설공사 기록부"
WHERE = "forms"
XLSX = False          # 📄 G668 — 빈 틀 엑셀을 주지 않음(사이트 작성 → 그림 PDF 만)
PREV = [(2, "소방시설공사 기록부(소방시설공사업법 시행규칙 별지 제11호서식) — 빈 서식 (원문 칸 차례 그대로)"),
        (4, "소방시설공사 기록부 — 작성 예시"),
        (3, "① 적은 줄 · 보관 기간 — 작성 예시")]
MULTI = True
SHORT = ("소방시설공사 기록부(소방시설공사업법 시행규칙 별지 제11호서식) — 소방시설공사업자가 공사마다 특정소방대상물 · 감리업자 · 시공기간 · "
         "소방기술자 · 시공시설 · 하도급 시설을 적어 하자보수 보증기간 동안 보관합니다. 적은 줄이 저절로 셈됩니다.")
NOTE_REPLACE = None

NR = 15
BO = ("소방시설업자는 관계 서류를 하자보수 보증기간 동안 보관합니다(소방시설공사업법 제8조제4항) — 소방시설공사업의 관계 서류가 이 기록부입니다"
      "(시행규칙 제8조제2호).")
SUM_A = "적은 줄 "
SUM_B = "줄"
BIN_OK = "✓ 공사업체명을 적었습니다"
BIN_A = "⚠ 아직 안 적은 칸: "
KEYS = ["대상명", "소재지", "소유자", "전화", "감리상호", "감리소재지", "감리업종", "감리전화", "시공기간", "자격종목", "성명", "시정", "시공시설", "하도급"]

EX_S = {"상호": "다라소방(주)"}
EX_R = [{"번호": "1", "대상명": "가나빌딩", "소재지": "가나시 다라구", "소유자": "가나개발(주)", "전화": "000-000-0000", "감리상호": "마바소방(주)\n(서다온)",
         "감리소재지": "가나시 마바구", "감리업종": "전문감리업\n제0000-00호", "감리전화": "000-000-0000",
         "시공기간": "2027.\n3.2.~8.31.", "자격종목": "소방설비\n기사(기계)", "성명": "정민호", "시정": "없음",
         "시공시설": "스프링클러 ·\n옥내소화전", "하도급": "없음"},
        {"번호": "2", "대상명": "다라물류센터", "소재지": "가나시 사아구", "소유자": "다라물류(주)", "전화": "000-000-0000", "감리상호": "마바소방(주)\n(서다온)",
         "감리소재지": "가나시 마바구", "감리업종": "전문감리업\n제0000-00호", "감리전화": "000-000-0000",
         "시공기간": "2027.\n5.10.~\n11.30.", "자격종목": "소방설비\n기사(전기)", "성명": "한소영", "시정": "감지기\n위치 시정",
         "시공시설": "자동화재탐지 ·\n비상방송", "하도급": "비상방송\n(가나전기)"}]
HEAD = "■ 소방시설공사업법 시행규칙 [별지 제11호서식] <개정 2016. 1. 27.>"
EX = {}
PAPER = "210mm×297mm[백상지(80g/㎡) 또는 중질지(80g/㎡)]"


def _e(ex, k):
    return EX_S.get(k) if ex else None


def _r(ex, i, k):
    if not ex or i > len(EX_R):
        return None
    return EX_R[i - 1].get(k)


NC = 96
WP = [91.2 / NC] * NC


class Gx:
    def __init__(s, x0, x1, n=NC):
        s.x0, s.x1, s.n = x0, x1, n

    def i(s, px):
        return int((px - s.x0) / (s.x1 - s.x0) * s.n + 0.5)

    def cols(s, x1, x2):
        return s.i(x1) + 1, s.i(x2)


GX = Gx(121, 1116)


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


HD = {"kind": "ctext", "size": 7}
NB = {"border": False}
COLS = [(174, 244), (244, 315), (315, 386), (386, 445), (445, 521), (521, 592), (592, 663), (663, 716), (716, 775), (775, 831), (831, 888),
        (888, 952), (952, 1034), (1034, 1116)]


# ── ① 셈 ────────────────────────────────────────────────────────────────
def sem(bk, ex):
    p = g.pg(bk, ex, "셈", fit=1)
    p.row([(12, "①  소방시설공사 기록부 — 적은 줄 · 보관 (저절로)", {"kind": "h2", "size": 14})], h=30)
    g.note(p, "※ 소방시설공사업자는 공사마다 이 기록부를 적어 하자보수 보증기간 동안 보관합니다(소방시설공사업법 제8조제4항 · 시행규칙 제8조제2호).")
    g.sec(p, "㉮  적은 줄 · 보관", need=26 * 3 + 10)
    cnt = "COUNTA(" + ",".join(f"{{기록부!대상명#{i}}}" for i in range(1, NR + 1)) + ")"
    p.row([(3, "적은 줄", g.L), (9, F("합계", f'=IF({cnt}=0,"","{SUM_A}"&{cnt}&"{SUM_B}")', align="left", size=9))], h=26)
    p.row([(3, "보관", g.L), (9, BO, {"kind": "text", "size": 7.5})], h=36)
    g.sec(p, "㉯  아직 안 적은 칸", need=26 * 2 + 10)
    p.row([(3, "아직 안 적은 칸", g.L),
           (9, F("빈칸", f'=IF(AND({{기록부!상호}}="",{cnt}=0),"",IF({{기록부!상호}}="","{BIN_A}공사업체명",IF({cnt}=0,"{BIN_A}기록 줄","{BIN_OK}")))',
                 align="left", size=9))], h=30)
    g.d.done(p)
    p.after_note(["노란 칸에 쓰면 하늘색 칸이 저절로 바뀝니다. 기록은 기록부 시트 줄마다 적습니다."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


# ── 기록부 ──────────────────────────────────────────────────────────────
def form(bk, ex):
    p = g.pg(bk, ex, "기록부", fit=1, widths=WP)
    X1, X2 = 121, 1116
    prow(p, [(X1, X2, HEAD, {"kind": "note", "size": 7})], h=12)
    r = prow(p, [(X1, X2, TITLE, {"kind": "free", "size": 15, "bold": True, "align": "center"})], h=34)
    _bd(p, r, r, X1, X2, bot=False)
    r = prow(p, [(X1, 830, "", g.FR), (830, 930, "공사업체명 :", {"kind": "free", "size": 8, "align": "right"}),
                 (930, X2, I("상호", ex=_e(ex, "상호"), align="left", size=8.5), NB)], h=20)
    _bd(p, r, r, X1, X2, top=False, bot=False)
    # 머리 세 줄 — 원문 칸 차례 그대로
    prow(p, [(X1, 174, "일련\n번호", dict(HD, rs=3)), (174, 445, "특 정 소 방 대 상 물", HD), (445, 716, "소 방 공 사 감 리 업 자", HD),
             (716, 775, "시공\n기간", dict(HD, rs=3)), (775, 888, "책임시공\n및\n기술관리\n소방기술자", dict(HD, rs=2, size=6.5)),
             (888, 952, "시정\n또는\n통보\n사항", dict(HD, rs=3)), (952, 1034, "시공\n시설", dict(HD, rs=3)), (1034, X2, "하도급\n시  설", dict(HD, rs=3))],
         h=24)
    prow(p, [(174, 244, "대상명", dict(HD, rs=2)), (244, 315, "소재지", dict(HD, rs=2)), (315, 386, "소유자", dict(HD, rs=2)),
             (386, 445, "전화\n번호", dict(HD, rs=2)), (445, 521, "상호\n(대표자)", dict(HD, rs=2)), (521, 592, "소재지", dict(HD, rs=2)),
             (592, 663, "업종\n(등록\n번호)", dict(HD, rs=2)), (663, 716, "전화\n번호", dict(HD, rs=2))], h=27)
    prow(p, [(775, 831, "자격\n종목", HD), (831, 888, "성명", HD)], h=34)
    for i in range(1, NR + 1):
        items = [(X1, 174, I(f"번호#{i}", ex=_r(ex, i, "번호"), align="center", size=7), {"valign": "center"})]   # 원문처럼 빈 칸(일련번호는 쓰는 이가)
        for (x1, x2), k in zip(COLS, KEYS):
            items.append((x1, x2, I(f"{k}#{i}", ex=_r(ex, i, k), align="center", size=6.5), {"valign": "center"}))
        prow(p, items, h=31)
    p.gap(6)
    prow(p, [(X1, X2, PAPER, {"kind": "free", "size": 6.5, "align": "right"})], h=12)
    p.end_print()
    p.after_note(["줄마다 공사 하나를 적습니다. 칸이 좁으면 줄을 바꿔 적습니다(두 줄까지 보임)."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사 · 회사 · 사람 · 번호)."])
    return p


def draw(bk, ex):
    bk.brand = "  K-건설맵  |  k-conmap.com  건설 서식"      # ✂ 새로 만든 서식 — «무료» 안 씀(2026-10-24 소장님)
    sem(bk, ex)
    form(bk, ex)


def expect(pages):
    a_in, s_in = pages["셈"], pages["기록부"]
    a = {}
    n = sum(1 for i in range(1, NR + 1) if s_in.get(f"대상명#{i}"))
    a["합계"] = "" if n == 0 else f"{SUM_A}{n}{SUM_B}"
    sh = s_in.get("상호")
    if not sh and n == 0:
        a["빈칸"] = ""
    elif not sh:
        a["빈칸"] = BIN_A + "공사업체명"
    elif n == 0:
        a["빈칸"] = BIN_A + "기록 줄"
    else:
        a["빈칸"] = BIN_OK
    return {"셈": a, "기록부": {}}


for _t in (SUM_A, SUM_B, BIN_OK, BIN_A):
    assert len(_t) < 255 and '"' not in _t, _t[:40]
