import requests
import pyrebase
import urllib3
import urllib.parse
from datetime import datetime, timedelta, timezone
import time

# 경고창 숨기기 및 한국 시간 설정
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
KST = timezone(timedelta(hours=9))

# ==========================================
# 파이어베이스 및 API 설정
# ==========================================
firebaseConfig = {
    "apiKey": "AIzaSyB5uvAzUIbEDTTbxwflTQk3wdzOufc4SE0",
    "authDomain": "k-conmap.firebaseapp.com",
    "databaseURL": "https://k-conmap-default-rtdb.firebaseio.com",
    "projectId": "k-conmap",
    "storageBucket": "k-conmap.firebasestorage.app",
    "messagingSenderId": "230642116525",
    "appId": "1:230642116525:web:f6f3765cf9a7273ba92324"
}

firebase = pyrebase.initialize_app(firebaseConfig)
db = firebase.database()

G2B_API_KEY = urllib.parse.unquote("13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb")


def fetch_and_save_1st(target_date):
    url = 'http://apis.data.go.kr/1230000/as/ScsbidInfoService/getOpengResultListInfoCnstwk'
    dt_str = target_date.strftime('%Y%m%d')
    print(f"🔄 [1순위] {dt_str} 조달청 데이터 수집 중...")

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        params = {
            'serviceKey': G2B_API_KEY, 'numOfRows': '999', 'pageNo': '1',
            'inqryDiv': '1', 'inqryBgnDt': dt_str + '0000', 'inqryEndDt': dt_str + '2359', 'type': 'json'
        }
        res = requests.get(url, params=params, verify=False, timeout=20, headers=headers)
        items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        print(f"❌ {dt_str} 통신 지연 - 건너뜁니다.")
        return

    if isinstance(items, dict): items = items.get('item', [items])
    if not items: return

    new_rows = {}
    for item in items:
        try:
            bid_no = item.get('bidNtceNo', '')
            info = str(item.get('opengCorpInfo', '')).split('|')[0].split('^')
            if len(info) > 1 and info[0].strip():
                new_rows[bid_no] = {
                    '1순위업체': info[0].strip(), '공고번호': bid_no, '공고차수': item.get('bidNtceOrd', '00'),
                    '날짜': item.get('opengDt', ''), '공고명': item.get('bidNtceNm', ''),
                    '발주기관': item.get('ntceInsttNm', ''),
                    '투찰금액': f"{int(float(info[3])):,}원" if len(info) > 3 else '-',
                    '투찰률': f"{info[4]}%" if len(info) > 4 else '-', '전체업체': item.get('opengCorpInfo', '')
                }
        except:
            continue

    if new_rows:
        db.child("archive_1st").update(new_rows)
        print(f"  ✅ [1순위] {dt_str} 총 {len(new_rows)}건 저장 완료")


def fetch_and_save_live(target_date):
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'
    dt_str = target_date.strftime('%Y%m%d')
    print(f"🔄 [공고] {dt_str} 조달청 데이터 수집 중...")

    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        params = {
            'serviceKey': G2B_API_KEY, 'numOfRows': '999', 'pageNo': '1',
            'inqryDiv': '1', 'inqryBgnDt': dt_str + '0000', 'inqryEndDt': dt_str + '2359', 'bidNtceNm': '공사',
            'type': 'json'
        }
        res = requests.get(url, params=params, verify=False, timeout=20, headers=headers)
        items = res.json().get('response', {}).get('body', {}).get('items', []) if res.status_code == 200 else []
    except:
        return

    if isinstance(items, dict): items = items.get('item', [items])
    if not items: return

    new_rows = {}
    for item in items:
        bid_no = item.get('bidNtceNo', '')
        if bid_no:
            new_rows[bid_no] = {
                '공고번호': bid_no, '공고일자': item.get('bidNtceDt', ''), '공고명': item.get('bidNtceNm', ''),
                '발주기관': item.get('ntceInsttNm', ''), '예산금액': int(float(item.get('bdgtAmt', 0))),
                '상세보기': item.get('bidNtceDtlUrl', "https://www.g2b.go.kr/index.jsp")
            }

    if new_rows:
        db.child("archive_live").update(new_rows)
        print(f"  ✅ [공고] {dt_str} 총 {len(new_rows)}건 저장 완료")


def run_march_to_april_sweep():
    print("==================================================")
    print("🚀 명환아, 3월~4월 통째로 싹쓸이 시작한다!")
    print("==================================================")
    now = datetime.now(KST)

    # 3월 1일부터 오늘까지 날짜 계산 (약 52일간)
    for i in range(52, -1, -1):
        target_date = now - timedelta(days=i)
        fetch_and_save_1st(target_date)
        fetch_and_save_live(target_date)
        time.sleep(1.5)  # 조달청 서버 보호를 위한 잠깐의 휴식

    print("\n🎉 3월~4월 모든 데이터 싹쓸이 완료!")
    print("⏳ 지금부터는 실시간 감시 모드로 전환합니다. (창을 끄지 마세요)\n")

    while True:
        current_time = datetime.now(KST)
        fetch_and_save_1st(current_time)
        fetch_and_save_live(current_time)
        print(f"[{current_time.strftime('%H:%M:%S')}] 실시간 데이터 업데이트 체크 완료.")
        time.sleep(3600)  # 1시간마다 반복


if __name__ == "__main__":
    run_march_to_april_sweep()