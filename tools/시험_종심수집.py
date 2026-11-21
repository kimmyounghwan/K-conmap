# -*- coding: utf-8 -*-
"""🧪 G804 종심제 균형가격 «수집» 쪽 — collect.py openg_ranks(전체=) · 종심넣기 · load/save_jongsim (조달청은 부르지 않음 · 가짜 응답)
   ① openg_ranks 가 전체(list)에 업체 «모두» 의 (금액, 투찰률)을 채움 · 돌려주는 30곳 · 전체 건수는 전과 같음
   ② 종심넣기 — 간이형 공고 줄: 갈래 · 배점 · 예정가격(투찰률 거꾸로) · 균형가격 = kcm_rules.균형가격 · 업체 이름 · 사업자번호 · 공사명 안 실음
   ③ 적격심사 · 낙찰방법 모름 → 안 넣음 · 공고일 전(2026-08-25 앞)이면 같은 금액 안 묶음 · 조달청은 2026-09-08 부터
   ④ 저장 · 읽기 — 새 파일 · 깨진 파일은 None(덮지 않음) · save_jongsim(None) 은 안 씀
   돌리기: python tools/시험_종심수집.py"""
import json, os, sys, tempfile
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import collect as C
import kcm_rules as R

n = bad = 0


def ok(이름, c, got=None):
    global n, bad
    n += 1
    if not c:
        bad += 1
    print(("  ✓ " if c else "  ✗ ") + 이름 + ("" if c else " = " + json.dumps(got, ensure_ascii=False, default=str)[:400]))


# 가상 개찰 — 예정가격 100억 · 45곳(한 곳은 예정가격 초과 · 한 곳은 68% · 세 곳은 같은 금액)
예정 = 10_000_000_000
금액들 = [8_500_000_000 + k * 9_000_000 for k in range(40)] + [10_050_000_000, 6_800_000_000, 8_700_000_000, 8_700_000_000, 8_700_000_000]
가짜 = []
for i, a in enumerate(sorted(금액들)):
    가짜.append({"prcbdrNm": f"가상건설{i:02d}(주)", "bidprcAmt": str(a), "bidprcrt": f"{a * 100 / 예정:.3f}",
                "opengRank": str(i + 1), "prcbdrBizno": f"{1000000000 + i}", "prcbdrCeoNm": f"홍길{i:02d}", "drwtNo1": "3", "drwtNo2": "7"})
C.fetch = lambda url, key, day=None, extra=None, label="", why=None, _flip=False: list(가짜)

print("① openg_ranks 전체=")
전체 = []
cs, total, ladder, drw = C.openg_ranks("가짜키", "R26BK09990001", "000", 전체=전체)
ok("전체에 45곳 모두(금액 · 투찰률)", len(전체) == 45 and all(isinstance(a, int) and t for a, t in 전체), len(전체))
ok("돌려주는 것은 전과 같음 — 30곳 · 전체 45 · 사다리 · 추첨 분포", len(cs) == 30 and total == 45 and ladder and ladder[-1][0] == 45 and sum(drw) == 90, [len(cs), total])
cs2, total2, _, _ = C.openg_ranks("가짜키", "R26BK09990001", "000")
ok("전체= 없이 부르면 전과 똑같이(30곳 · 45)", cs2 == cs and total2 == 45)

print("② 종심넣기 — 간이형(조달청 · 2026-09-20 공고)")
r = {"no": "R26BK09990001", "ord": "000", "dt": "2026-11-03 11:00:00", "inst": "조달청 가상지방조달청", "base": "11000000000", "corps": cs}
live = {"con": {"R26BK09990001": {"no": "R26BK09990001", "dt": "2026-09-20 10:00:00", "swin": "종합심사낙찰제(공사)-간이형 공사 심사항목 및 배점기준",
                                  "est": "15000000000", "base": "11000000000", "main": "토목공사업", "site": "가상도 가상시", "name": "가상 공사명 ○○ 정비공사"}}}
js = {"con": {}}
넣음 = C.종심넣기(js, r, live, 전체)
줄 = js["con"].get("R26BK09990001") or {}
기대 = R.균형가격([a for a, _ in 전체], 예정, True)
ok("넣음 · 갈래 간이형 · 배점 60", 넣음 and 줄.get("kind") == "간이형" and 줄.get("pt") == 60, 줄)
ok("예정가격(투찰률 거꾸로) — 100억 ± 0.001%", abs((줄.get("yp") or 0) - 예정) <= 예정 * 1e-5, 줄.get("yp"))
ok("균형가격 = kcm_rules.균형가격(예정 초과 · 68% 빼고 · 같은 금액 1개)", 줄.get("bal") == 기대["bal"] and 줄.get("n0") == 45 and 줄.get("n1") == 43 and 줄.get("same") == 1 and 줄.get("sm") == 1, [줄, 기대])
ok("균형÷기초 · 균형÷예정(%)", abs(줄["br"] - 기대["bal"] * 100 / 11_000_000_000) < 1e-3 and abs(줄["bp"] - 기대["bal"] * 100 / 줄["yp"]) < 1e-3, [줄.get("br"), 줄.get("bp")])
글 = json.dumps(줄, ensure_ascii=False)
사업자들 = {f"{1000000000 + i}" for i in range(45)}
ok("업체 이름 · 사업자번호 · 대표 · 공사명 안 실음", not any(x in 글 for x in ("가상건설", "홍길", "정비공사", "가상 공사명")) and not (사업자들 & {str(v) for v in 줄.values()}), 글)
ok("공고일 · 개찰일시 · 기관 · 주공종 · 현장", 줄.get("nt") == "2026-09-20" and 줄.get("dt") == "2026-11-03 11:00" and 줄.get("inst").startswith("조달청") and 줄.get("main") == "토목공사업", 줄)

ok("🎲 G817 업체 «모두» 의 금액 «a» — 오름차순 원(45곳 · 예정 초과 · 68% 도 그대로 · 이름 없음) — 모의 개찰 재료", 줄.get("a") == sorted(금액들) and len(줄["a"]) == 45, 줄.get("a", [])[:3])
옛줄 = {"con": {"R26BK09990001": {k: v for k, v in 줄.items() if k != "a"}}}
옛그대로 = dict(옛줄["con"]["R26BK09990001"])
ok("🎲 G817 금액넣기 — 있는 줄에 «a» 만 더함(균형가격 · 다른 칸 그대로)", C.금액넣기(옛줄, "R26BK09990001", 전체) and 옛줄["con"]["R26BK09990001"]["a"] == sorted(금액들)
   and {k: v for k, v in 옛줄["con"]["R26BK09990001"].items() if k != "a"} == 옛그대로, 옛줄)
ok("🎲 G817 금액넣기 — 줄 없음 · 금액 1개 · 빈 것 → False(안 바꿈)", not C.금액넣기(옛줄, "X9", 전체) and not C.금액넣기({"con": {"Y": {"no": "Y"}}}, "Y", [(5, 90.0)])
   and not C.금액넣기({"con": {"Y": {"no": "Y"}}}, "Y", []) and not C.금액넣기(None, "Y", 전체))

print("③ 안 넣는 것 · 같은 금액 묶는 날")
js2 = {"con": {}}
live2 = {"con": {"X1": {"swin": "적격심사제-추정가격이 300억원미만 100억원이상인 입찰공사(실적제한 아님, 종합공사)", "est": "15000000000"}}}
ok("적격심사 → 안 넣음", not C.종심넣기(js2, {"no": "X1", "base": "1"}, live2, 전체) and not js2["con"])
ok("낙찰방법 모름 → 안 넣음", not C.종심넣기(js2, {"no": "X2", "base": "1"}, {"con": {}}, 전체) and not js2["con"])
ok("전체 금액 없음 → 안 넣음", not C.종심넣기(js2, r, live, []) and not js2["con"])
live3 = json.loads(json.dumps(live)); live3["con"]["R26BK09990001"]["dt"] = "2026-09-01 10:00:00"
js3 = {"con": {}}; C.종심넣기(js3, r, live3, 전체)
ok("조달청 공고 2026-09-01(제4497호 시행 전) → 같은 금액 안 묶음", js3["con"]["R26BK09990001"]["sm"] == 0 and js3["con"]["R26BK09990001"]["same"] == 0, js3["con"]["R26BK09990001"])
r4 = dict(r, inst="가상시청"); js4 = {"con": {}}; C.종심넣기(js4, r4, live3, 전체)
ok("조달청 아닌 기관 2026-09-01(예규 2026-08-25 뒤) → 묶음", js4["con"]["R26BK09990001"]["sm"] == 1, js4["con"]["R26BK09990001"])
live5 = json.loads(json.dumps(live)); live5["con"]["R26BK09990001"]["swin"] = "종합평가낙찰제"; live5["con"]["R26BK09990001"]["est"] = "60000000000"
js5 = {"con": {}}; C.종심넣기(js5, dict(r, inst="가상도청"), live5, 전체)
ok("지방 종합평가 600억 → 배점 40", js5["con"]["R26BK09990001"]["kind"] == "지방종평" and js5["con"]["R26BK09990001"]["pt"] == 40)

print("④ 저장 · 읽기")
with tempfile.TemporaryDirectory() as d:
    C.JONGSIM = os.path.join(d, "jongsim.json")
    처음 = C.load_jongsim()
    ok("파일 없음 → 빈 줄(con {})", isinstance(처음, dict) and 처음.get("con") == {}, 처음)
    ok("저장 → 다시 읽으면 같음", C.save_jongsim(js) and C.load_jongsim()["con"] == js["con"])
    open(C.JONGSIM, "w", encoding="utf-8").write('{"con": {"깨진')
    ok("깨진 파일 → None(빈 것으로 덮지 않음)", C.load_jongsim() is None)
    ok("save_jongsim(None) → 안 씀 · 깨진 파일 그대로", C.save_jongsim(None) is False and open(C.JONGSIM, encoding="utf-8").read() == '{"con": {"깨진')

print(f"\n{'✗' if bad else '✓'} 시험_종심수집 {n - bad}/{n}")
sys.exit(1 if bad else 0)
