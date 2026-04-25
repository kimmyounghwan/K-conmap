import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def debug_g2b_1st_bidder():
    print("🚀 [원인 규명] 조달청 개찰결과 서버 다이렉트 접속 시도 중...\n")

    SERVICE_KEY = '13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb'
    url = 'http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwk'

    # 확실하게 데이터가 있는 한 달 전 날짜로 테스트
    params = {
        'serviceKey': SERVICE_KEY,
        'numOfRows': '10',
        'pageNo': '1',
        'inqryDiv': '1',
        'inqryBgnDt': '202603010000',
        'inqryEndDt': '202603312359'
    }

    try:
        res = requests.get(url, params=params, verify=False, timeout=10)
        print(f"📡 조달청 응답 상태 코드: {res.status_code}\n")

        print("👇 [조달청이 진짜로 보낸 원본 메시지] 👇")
        print("-" * 50)
        # 내용이 너무 길면 짤리니까 앞부분 1000글자만 출력
        print(res.text[:1000])
        print("-" * 50)

    except Exception as e:
        print(f"❌ 인터넷 통신 에러: {e}")


if __name__ == "__main__":
    debug_g2b_1st_bidder()