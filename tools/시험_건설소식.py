"""📰 건설소식 시험 — 인터넷 없이 (2026-10-04 · G128)   python tools/시험_건설소식.py"""
import importlib.util
import os
import sys
from datetime import datetime

여기 = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("소식", os.path.join(여기, "건설소식.py"))
소식 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(소식)
KST = 소식.KST

맞음 = 틀림 = 0


def 봄(이름, 조건):
    global 맞음, 틀림
    if 조건:
        맞음 += 1
    else:
        틀림 += 1
        print("  ✗", 이름)


def ms(s):
    return int(datetime.strptime(s, "%Y-%m-%d %H:%M").replace(tzinfo=KST).timestamp() * 1000)


def main():
    지금 = ms("2026-10-04 23:00")
    koscaj = 소식.출처들[0]
    안전 = 소식.출처들[2]

    # ① ndsoft 꼴(«YYYY-MM-DD HH:MM:SS» 한국시각 · CDATA · &amp;)
    xml = """<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>대한전문건설신문 - 전체기사</title>
    <item><title><![CDATA[공정위, 미지급 하도급대금 해결센터 운영···289억원 지급 유도]]></title>
    <link>https://www.koscaj.com/news/articleView.html?idxno=326821</link><description><![CDATA[본문은 옮기지 않음]]></description>
    <pubDate>2026-10-02 12:00:13</pubDate></item>
    <item><title>[인사] 국토교통부</title><link>https://www.koscaj.com/news/articleView.html?idxno=1</link><pubDate>2026-10-03 09:00:00</pubDate></item>
    <item><title>OO건설 대표 모친상</title><link>https://www.koscaj.com/news/articleView.html?idxno=2</link><pubDate>2026-10-03 09:00:00</pubDate></item>
    <item><title>낙찰하한율 상향 &amp;amp; 적격심사 기준 바뀐다</title><link>https://www.koscaj.com/news/articleView.html?idxno=3</link><pubDate>2026-10-04 08:00:00</pubDate></item>
    <item><title>남의 주소로 새는 기사 제목입니다</title><link>https://evil.example.com/a</link><pubDate>2026-10-04 08:00:00</pubDate></item>
    <item><title>너무 오래된 기사 제목입니다만</title><link>https://www.koscaj.com/news/articleView.html?idxno=4</link><pubDate>2026-09-20 08:00:00</pubDate></item>
    <item><title>날짜 없는 기사 제목입니다만</title><link>https://www.koscaj.com/news/articleView.html?idxno=5</link></item>
    <item><title>건설근로자 4대보험 일용직 기준 정리</title><link>http://www.koscaj.com/news/articleView.html?idxno=6</link><pubDate>Sun, 04 Oct 2026 01:00:00 GMT</pubDate></item>
    </channel></rss>""".encode("utf-8")
    r = 소식.읽기(xml, koscaj, 지금)
    제목들 = [x["t"] for x in r]
    봄("하도급 기사 실림", any("하도급대금" in t for t in 제목들))
    봄("[인사] 뺌", not any("[인사]" in t for t in 제목들))
    봄("모친상 뺌", not any("모친상" in t for t in 제목들))
    봄("남의 주소 뺌", not any("새는" in t for t in 제목들))
    봄("4일 넘은 것 뺌", not any("오래된" in t for t in 제목들))
    봄("날짜 없는 것 뺌", not any("날짜 없는" in t for t in 제목들))
    봄("&amp; 두 번 풀림", any("상향 & 적격" in t for t in 제목들))
    봄("새것부터", r[0]["d"] >= r[-1]["d"])
    봄("RFC 날짜(GMT) 읽음", any("4대보험" in x["t"] and x["d"] == ms("2026-10-04 10:00") for x in r))
    봄("한국시각 날짜 읽음", any("하도급대금" in x["t"] and x["d"] == ms("2026-10-02 12:00") + 13000 for x in r))
    봄("http → https", all(x["u"].startswith("https://www.koscaj.com/") for x in r))
    봄("본문(description) 안 실음", all(set(x) <= {"t", "s", "u", "d", "p", "pl"} for x in r))
    도 = {x["t"][:6]: x.get("p") for x in r}
    봄("낙찰하한율 → 바로투찰", any(x.get("p") == "/" for x in r if "낙찰하한율" in x["t"]))
    봄("4대보험 → 판단기", any(x.get("p") == "/tools/ilyong-boheom" for x in r if "4대보험" in x["t"]))
    봄("하도급대금 → 도구 없음", all(not x.get("p") for x in r if "하도급대금" in x["t"]))

    # ② 안전신문 — 건설 낱말 있는 것만
    xml2 = """<rss><channel>
    <item><title>시흥 월곶포구축제 9~11일 개최…축제 안전관리 총력</title><link>https://www.safetynews.co.kr/news/articleView.html?idxno=1</link><pubDate>2026-10-02 19:21:55</pubDate></item>
    <item><title>안산중앙초 4학년 78명, 시의회 찾아 지방의회 역할 배워</title><link>https://www.safetynews.co.kr/news/articleView.html?idxno=2</link><pubDate>2026-10-02 19:20:16</pubDate></item>
    <item><title>아파트 신축 현장 추락사고…중대재해 수사 착수</title><link>https://www.safetynews.co.kr/news/articleView.html?idxno=3</link><pubDate>2026-10-03 10:00:00</pubDate></item>
    </channel></rss>""".encode("utf-8")
    r2 = 소식.읽기(xml2, 안전, 지금)
    t2 = [x["t"] for x in r2]
    봄("안전신문 학교 기사 뺌", not any("안산중앙초" in t for t in t2))
    봄("안전신문 추락사고 실음", any("추락사고" in t for t in t2))
    봄("추락 → 안전관리계획서", any(x.get("p") == "/safety" for x in r2))
    봄("안전신문 축제 «안전관리» 뺌", not any("축제" in t for t in t2))

    # ②-2 조달경제신문 — 시설공사 · 입찰 쪽만 (2026-10-05 실제 제목)
    조달 = 소식.출처들[1]
    xml3 = """<rss><channel>
    <item><title>크루-13 ISS 도킹 성공…美 유인우주선 발사도 사실상 스페이스X 독점 체제</title><link>https://www.jodaleconomy.com/news/articleView.html?idxno=1</link><pubDate>2026-10-02 10:14:08</pubDate></item>
    <item><title>대구 소방헬기 재수끝에 응찰자 나와…영남 3호기는 또 무응찰</title><link>https://www.jodaleconomy.com/news/articleView.html?idxno=2</link><pubDate>2026-10-02 15:45:25</pubDate></item>
    <item><title>[주간입찰동향(시설)'26.10.5~10.9] 중수청 5개청 사무환경 20건 273억 쏟아져</title><link>https://www.jodaleconomy.com/news/articleView.html?idxno=3</link><pubDate>2026-10-03 07:00:00</pubDate></item>
    <item><title>[조달, 말의 기원⑥] 봉투도 없는데 무엇을 연다는 걸까…‘개찰’의 개(開)</title><link>https://www.jodaleconomy.com/news/articleView.html?idxno=4</link><pubDate>2026-10-04 10:00:00</pubDate></item>
    </channel></rss>""".encode("utf-8")
    t3 = [x["t"] for x in 소식.읽기(xml3, 조달, 지금)]
    봄("조달 — 우주선 뺌", not any("ISS" in t for t in t3))
    봄("조달 — 소방헬기 뺌", not any("소방헬기" in t for t in t3))
    봄("조달 — 주간입찰동향(시설) 실음", any("주간입찰동향" in t for t in t3))
    봄("조달 — 개찰 이야기 실음", any("개찰" in t for t in t3))

    # ②-3 대한전문건설신문 — 칼럼 · 실무 글은 둠, [인사] 는 뺌 (실제 제목)
    xml4 = """<rss><channel>
    <item><title>[법 상담] 기성금 10% 유보 조항은 부당특약에 해당</title><link>https://www.koscaj.com/news/articleView.html?idxno=326788</link><pubDate>2026-10-05 07:00:00</pubDate></item>
    <item><title>[보라매칼럼] 2차 공공기관 이전 성공의 조건</title><link>https://www.koscaj.com/news/articleView.html?idxno=7</link><pubDate>2026-10-05 07:00:00</pubDate></item>
    <item><title>[인사] 고용노동부</title><link>https://www.koscaj.com/news/articleView.html?idxno=8</link><pubDate>2026-10-02 09:45:33</pubDate></item>
    </channel></rss>""".encode("utf-8")
    t4 = [x["t"] for x in 소식.읽기(xml4, koscaj, ms("2026-10-05 08:00"))]
    봄("[법 상담] 실음", any("법 상담" in t for t in t4))
    봄("[보라매칼럼] 공공기관 이전(건설 밖 의견) 뺌", not any("보라매칼럼" in t for t in t4))
    봄("[인사] 뺌", not any("[인사]" in t for t in t4))
    xml5 = """<rss><channel>
    <item><title>[전문가 視覺] SOC 정책, 유지관리 중심으로 전환할 때다</title><link>https://www.koscaj.com/n/1</link><pubDate>2026-10-05 07:00:00</pubDate></item>
    <item><title>[논단] 국가 에너지전략, 수급 조절 유연성과 적응성 필요</title><link>https://www.koscaj.com/n/2</link><pubDate>2026-10-05 07:00:00</pubDate></item>
    <item><title>[세무회계] 2026년 세제개편안···비사업용 토지 과세 강화</title><link>https://www.koscaj.com/n/3</link><pubDate>2026-10-05 07:00:00</pubDate></item>
    </channel></rss>""".encode("utf-8")
    t5 = [x["t"] for x in 소식.읽기(xml5, koscaj, ms("2026-10-05 08:00"))]
    봄("[전문가 視覺] SOC(건설 낱말) 실음", any("SOC" in t for t in t5))
    봄("[논단] 에너지전략 뺌", not any("논단" in t for t in t5))
    봄("[세무회계] 실무 글은 그대로 실음", any("세무회계" in t for t in t5))
    봄("안전신문 «[인사]고용노동부»(띄어쓰기 없음)도 뺌", not 소식.읽기("""<rss><channel><item><title>[인사]고용노동부 국장급</title><link>https://www.safetynews.co.kr/n/1</link><pubDate>2026-10-02 14:06:47</pubDate></item></channel></rss>""".encode("utf-8"), 안전, 지금))

    # ③ 합치기 — 실패한 곳은 옛것 · 겹침 하나만 · 30개 상한 · 언론사 수
    옛 = {"items": [{"t": "옛 조달 기사 제목입니다", "s": "조달경제신문", "u": "https://www.jodaleconomy.com/news/articleView.html?idxno=9", "d": ms("2026-10-03 07:00")}]}
    겹 = dict(r[0]); 겹["s"] = "안전신문"
    새 = 소식.합치기({"대한전문건설신문": r, "조달경제신문": None, "안전신문": r2 + [겹]}, 옛)
    봄("실패한 조달경제신문은 옛것 이어 씀", any(x["s"] == "조달경제신문" for x in 새["items"]) and 새["n"]["조달경제신문"] == 1)
    봄("같은 제목 하나만", sum(1 for x in 새["items"] if x["t"] == r[0]["t"]) == 1)
    봄("at 있음", isinstance(새["at"], int) and 새["at"] > 0)
    많이 = [{"t": f"기사 제목 번호 {i}번 입니다", "s": "대한전문건설신문", "u": f"https://www.koscaj.com/n?{i}", "d": 지금 - i * 60000} for i in range(50)]
    봄("30개 상한", len(소식.합치기({"대한전문건설신문": 많이}, None)["items"]) == 30)
    봄("옛것 없을 때 실패 → 0건", 소식.합치기({"조달경제신문": None}, None)["n"]["조달경제신문"] == 0)
    # 🔀 번갈아 — 한 곳이 아침에 몰아 내도 첫 줄들이 섞임
    몰림 = [{"t": f"주간지 기사 {i}번 제목입니다", "s": "대한전문건설신문", "u": f"https://www.koscaj.com/m/{i}", "d": 지금 - 60000} for i in range(7)]
    섞 = 소식.합치기({"대한전문건설신문": 몰림, "조달경제신문": [{"t": "조달 입찰 기사 제목입니다", "s": "조달경제신문", "u": "https://www.jodaleconomy.com/m/1", "d": 지금 - 86400000}],
                      "안전신문": [{"t": "건설 현장 산재 기사 제목", "s": "안전신문", "u": "https://www.safetynews.co.kr/m/1", "d": 지금 - 2 * 86400000}]}, None)["items"]
    봄("첫 세 줄이 세 언론사 " + str([x["s"] for x in 섞[:3]]), len({x["s"] for x in 섞[:3]}) == 3)
    봄("가장 새 기사 언론사가 맨 위", 섞[0]["s"] == "대한전문건설신문")
    봄("번갈아도 9건 다 실림", len(섞) == 9)
    봄("사망사고 → 안전 서류 칩", 소식.도구("현대건설, 노동자 사망사고 관련 작업 중지")[0] == "/safety")

    # ④ 열쇠 · 시각
    봄("열쇠 — 띄어쓰기·기호 무시", 소식.열쇠("낙찰하한율, 상향!") == 소식.열쇠("낙찰하한율 상향"))
    봄("시각 — 모르는 꼴은 None", 소식.시각("어제") is None)
    봄("시각 — 빈 값 None", 소식.시각("") is None)

    print(f"건설소식 시험: 맞음 {맞음} · 틀림 {틀림}")
    sys.exit(1 if 틀림 else 0)


if __name__ == "__main__":
    main()
