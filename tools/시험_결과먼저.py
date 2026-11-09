# -*- coding: utf-8 -*-
"""🩹 G619 «결과가 개찰일시보다 먼저 온 공고» 시험 — python3 tools/시험_결과먼저.py (인터넷 · 조달청 호출 없음)
소장님 11-09 14:5x 「이상하지 않아. 시간이..」 — 1순위 목록 맨 위에 개찰 «16:20» 결과가 14:5x 에 떠 있었음.
까닭: 수의시담(정보공개 차원 공고 · 전자시담 11:00~15:20 · 개찰 16:20)은 결과가 개찰일시보다 먼저 올라옴(13:24).
고침: collect.row_first → dt = 결과를 받은 때 · odt = 나라장터 개찰일시 / 회차마다 · 개찰일시가 지난 뒤에도 처음 받은 때를 이어 둠.
도는 곳: update.yml «화면 검사»(막는 검사 — 흔들리면 안 되게 지금 시각은 부르기 앞 · 뒤 두 분 모두 맞음) · 손으로도.
⚠️ 시험은 main() 안에만 — tools/checkwf.py 가 «켜기만»(import) 할 때 시험이 돌거나 sys.exit 로 끝나면 안 됩니다.
"""
import os
import sys
from datetime import datetime

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, ROOT)
import collect as C  # noqa: E402

bad = n = 0


def ok(name, cond, got=None):
    global bad, n
    n += 1
    if not cond:
        bad += 1
    print(("  ✓ " if cond else "  ✗ ") + name + ("" if cond or got is None else f" = {got!r}"))


def main():
    os.chdir(ROOT)
    KST = C.KST
    t1400 = datetime(2026, 11, 9, 14, 0, 0, tzinfo=KST)

    print("① 결과시각(개찰일시, 지금)")
    ok("개찰일시가 지금보다 뒤 → (지금, 개찰일시)", C.결과시각("2026-11-09 16:20:00", t1400) == ("2026-11-09 14:00:00", "2026-11-09 16:20:00"), C.결과시각("2026-11-09 16:20:00", t1400))
    ok("개찰일시가 지금보다 앞 → (개찰일시, '')", C.결과시각("2026-11-09 11:00:00", t1400) == ("2026-11-09 11:00:00", ""))
    ok("같은 분 → 그대로(앞날 아님)", C.결과시각("2026-11-09 14:00:00", t1400) == ("2026-11-09 14:00:00", ""))
    ok("빈 값 · 날짜만 → 그대로", C.결과시각("", t1400) == ("", "") and C.결과시각("20261110", t1400) == ("20261110", ""))
    ok("숫자만 꼴(202611091620)도 앞날로 알아봄", C.결과시각("202611091620", t1400) == ("2026-11-09 14:00:00", "202611091620"))

    print("② row_first — 앞날 개찰일시면 odt 가 붙고 dt 는 지금 · 아니면 odt 없음")
    item = {"bidNtceNo": "R26BK00000001", "bidNtceOrd": "000", "bidNtceNm": "시험 수의시담 공사", "ntceInsttNm": "시험기관",
            "opengDt": "2099-01-01 16:20:00", "prtcptCnum": "1", "opengCorpInfo": "시험건설(주)^1234567890^홍길동^13871000^97.000"}
    앞 = datetime.now(KST)
    r = C.row_first(item)
    뒤 = datetime.now(KST)     # 분이 바뀌는 때 불러도 틀린 경보가 안 나게 — 부르기 앞 · 뒤 두 분 모두 맞음(배포를 막는 검사라 흔들리면 안 됨)
    ok("앞날(2099) → odt = 개찰일시", r and r.get("odt") == "2099-01-01 16:20:00", r and r.get("odt"))
    ok("dt = 지금(분까지)", r and C.dt_digits(r["dt"])[:12] in (앞.strftime("%Y%m%d%H%M"), 뒤.strftime("%Y%m%d%H%M")), r and r.get("dt"))
    r2 = C.row_first(dict(item, opengDt="2026-11-09 11:00:00"))
    ok("지난 개찰일시 → dt 그대로 · odt 없음", r2 and r2["dt"] == "2026-11-09 11:00:00" and "odt" not in r2, r2 and (r2.get("dt"), r2.get("odt")))

    print("③ 결과시각이어(r, prev) — 처음 받은 때 이어 두기")
    a = {"dt": "2026-11-09 14:30:00", "odt": "2026-11-09 16:20:00"}
    C.결과시각이어(a, {"dt": "2026-11-09 13:24:59", "odt": "2026-11-09 16:20:00"})
    ok("다음 회차(아직 16:20 전) → 처음 받은 때 13:24:59 그대로", a["dt"] == "2026-11-09 13:24:59" and a["odt"] == "2026-11-09 16:20:00", a)
    b = {"dt": "2026-11-09 16:20:00"}       # 16:20 지난 뒤 — row_first 는 odt 없이 개찰일시를 줌
    C.결과시각이어(b, {"dt": "2026-11-09 13:24:59", "odt": "2026-11-09 16:20:00"})
    ok("개찰일시가 지난 뒤에도 13:24:59 · odt 그대로(자리가 튀지 않음)", b == {"dt": "2026-11-09 13:24:59", "odt": "2026-11-09 16:20:00"}, b)
    c = {"dt": "2026-11-09 15:45:00", "odt": "2026-11-09 16:20:00"}
    C.결과시각이어(c, {"dt": "2026-11-09 16:20:00", "rask": "20261109132459"})
    ok("고치기 전에 받아 둔 줄(odt 없음 · 순위 물어본 때 13:24:59) → 그 때로", c["dt"] == "2026-11-09 13:24:59" and c["odt"] == "2026-11-09 16:20:00", c)
    g = {"dt": "2026-11-09 15:45:00", "odt": "2026-11-09 17:00:00"}
    C.결과시각이어(g, {"dt": "2026-11-09 13:24:59", "odt": "2026-11-09 16:20:00"})
    ok("개찰일시가 미뤄짐(아직 앞날 17:00) → 처음 받은 때 그대로 · 새 개찰일시", g == {"dt": "2026-11-09 13:24:59", "odt": "2026-11-09 17:00:00"}, g)
    d = {"dt": "2026-11-09 15:45:00", "odt": "2026-11-09 16:20:00"}
    C.결과시각이어(d, {})
    ok("처음 보는 줄 → 그대로(지금)", d == {"dt": "2026-11-09 15:45:00", "odt": "2026-11-09 16:20:00"}, d)
    e = {"dt": "2026-11-09 11:00:00"}
    C.결과시각이어(e, {"dt": "2026-11-09 11:00:00", "rask": "20261109113000"})
    ok("보통 공고(odt 없음) → 아무것도 안 바뀜", e == {"dt": "2026-11-09 11:00:00"}, e)

    print("④ fast.enrich_first — 빠른 길도 저장소의 처음 받은 때를 씀")
    import fast as F
    rows = [{"no": "R1", "dt": "2026-11-09 15:50:00", "odt": "2026-11-09 16:20:00"}, {"no": "R2", "dt": "2026-11-09 11:00:00"}]
    store = {"con": {"R1": {"dt": "2026-11-09 13:24:59", "odt": "2026-11-09 16:20:00"}, "R2": {"dt": "2026-11-09 11:00:00"}}}
    F.enrich_first(rows, {}, store)
    ok("R1 13:24:59 · R2 그대로", rows[0]["dt"] == "2026-11-09 13:24:59" and rows[1] == {"no": "R2", "dt": "2026-11-09 11:00:00"}, rows)

    print("⑤ 화면 — 카드 · 펼친 칸이 odt 를 읽음")
    src = {p: open(os.path.join(ROOT, p), encoding="utf-8").read() for p in ("web/src/pages/FirstBoard.jsx", "web/src/pages/SvcBoard.jsx", "web/src/NoticeDetail.jsx")}
    ok("1순위(공사) 카드 «결과 먼저 · 개찰 …»", "결과 먼저 · 개찰 {dateTime(r.odt)}" in src["web/src/pages/FirstBoard.jsx"])
    ok("1순위(용역 · 물품) 카드 · 펼친 칸", "결과 먼저 · 개찰 {dateTime(r.odt)}" in src["web/src/pages/SvcBoard.jsx"] and "dateTime(r.odt || r.dt)" in src["web/src/pages/SvcBoard.jsx"])
    ok("펼친 칸 개찰일시 = 나라장터 개찰일시 · «결과 받은 때»", "dateTime(r.odt || r.dt)" in src["web/src/NoticeDetail.jsx"] and "결과 받은 때" in src["web/src/NoticeDetail.jsx"])

    print(f"\n{'✗' if bad else '✓'} 시험_결과먼저 {n - bad}/{n}")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
