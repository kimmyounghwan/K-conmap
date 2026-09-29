# -*- coding: utf-8 -*-
"""사진대지 — 원본 틀(한 쪽에 사진 두 장 · 내용 · 위치 · 일자)을 새로 만든 것.
■ 원본의 «사진 붙여넣기» 매크로 단추는 뺐습니다(매크로 없이 어디서나 열리게). 사진은 네모 칸 위에 붙여 넣고 크기를 맞추면 됩니다.
■ 수식: 첫 쪽에 공사명을 적으면 모든 쪽 머리에 저절로 · 사진 번호 자동 · 두 번째 사진 일자는 비우면 첫 사진 일자를 따라감."""
import datetime

from fb import F, I

SLUG = "o-sajindaeji"
TITLE = "사진대지"
WHERE = "orig"
PREV = [(1, "빈 서식 첫 쪽"), (11, "작성 예시")]
PAGES = 10
NSHEETS = 1
SHORT = "사진 두 장과 내용·위치·일자를 적는 사진대지(10쪽 · 20장). 공사명은 첫 쪽에만 적으면 모든 쪽에 들어가고, 사진 번호가 저절로 붙습니다."
NOTE = "매크로 없이 쓰는 양식입니다. 사진은 네모 칸 위에 붙여 넣고(삽입 → 그림) 칸 크기에 맞추세요."

D = datetime.date
W = [9, 16, 9, 16, 9, 16]
N = 6
PAGES_N = 10
BOX = 12       # 사진 칸 줄 수
BOX_H = 20
EX = [("가시설(흙막이판) 설치", "STA.0+120 ~ 0+160", D(2026, 5, 12)), ("PC 암거 거치", "STA.0+140", None)]
L = {"kind": "label"}


def draw(bk, ex):
    p = bk.page("사진대지", W, ex=ex, fit_height=0, sheetname="사진대지" if not ex else "예시-사진대지", margins=(0.5, 0.5, 0.5, 0.5))
    npg = PAGES_N if not ex else 1
    brk = []
    for pg in range(1, npg + 1):
        if pg > 1:
            brk.append(p.r)
        p.row([(N, "사  진  대  지", {"kind": "title", "size": 18})], h=34)
        if pg == 1:
            p.row([(1, "공 사 명", L), (5, I("공사명", ex="가나지구 배수로 정비공사"))], h=24)
        else:
            p.row([(1, "공 사 명", L), (5, F(f"공사명쪽#{pg}", '=IF({공사명}="","",{공사명})', align="left"))], h=24)
        p.gap(6)
        for k in (1, 2):
            no = (pg - 1) * 2 + k
            e = EX[k - 1] if (ex and pg == 1) else (None, None, None)
            p.row([(N, f"사진 {no}", {"kind": "free", "bold": True, "size": 9.5})], h=16)
            r0 = p.r
            for _ in range(BOX):
                p.gap(BOX_H)
            p.put(r0, 1, N, "(사진을 붙이는 곳)" if not ex else "(사진)", kind="ctext", size=9, rs=BOX)
            p.ws.cell(row=r0, column=1).font = p.ws.cell(row=r0, column=1).font.copy(color="9CA3AF")
            p.row([(1, "내  용", L), (5, I(f"내용#{no}", ex=e[0]))], h=24)
            if k == 1:
                p.row([(1, "위  치", L), (3, I(f"위치#{no}", ex=e[1])), (1, "일  자", L), (1, I(f"일자#{no}", ex=e[2], fmt="ymd", align="center"))], h=24)
            else:
                p.row([(1, "위  치", L), (3, I(f"위치#{no}", ex=e[1])), (1, "일  자", L),
                       (1, F(f"일자#{no}", f'=IF(N({{일자#{no - 1}}})=0,"",{{일자#{no - 1}}})', fmt="ymd", align="center"))], h=24)
            p.gap(8)
    p.end_print()
    from openpyxl.worksheet.pagebreak import Break, RowBreak
    p.ws.row_breaks = RowBreak()
    for r in brk:
        p.ws.row_breaks.append(Break(id=r - 1))
    p.after_note(["두 번째 사진의 일자는 첫 사진 일자를 따라갑니다(날짜가 다르면 그 칸에 새로 적으세요). 쪽이 더 필요하면 한 쪽(제목부터 두 번째 사진까지)을 복사해 붙이세요."]
                 if not ex else ["이 시트는 작성 예시입니다(가상의 공사)."])
    return p


def expect(inp):
    return {"일자#2": inp["일자#1"]}
