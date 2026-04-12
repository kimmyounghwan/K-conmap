import requests
import pandas as pd
from datetime import datetime, timedelta, timezone
import urllib3
import concurrent.futures
import time

# 경고 무시 및 기본 설정
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
API_KEY = "13610863df3680cc4e7c70a64d752b37485535929bfa514f4ad4d71ea56e4ccb"
KST = timezone(timedelta(hours=9))


def fetch_monster_announcements():
    all_raw = []

    # 📅 딱 2개월(60일) 전부터 오늘까지 범위 설정
    end_date = datetime.now(KST).date()
    start_date = end_date - timedelta(days=60)
    delta = end_date - start_date
    dates = [(start_date + timedelta(days=i)).strftime('%Y%m%d') for i in range(delta.days + 1)]

    # 🚨 국토부 등 모든 국가/공공기관 통합 마스터 주소
    url = 'http://apis.data.go.kr/1230000/ad/BidPublicInfoService/getBidPblancListInfoCnstwk'

    def fetch_per_day(dt):
        params = {
            'inqryDiv': '1', 'inqryBgnDt': f'{dt}0000', 'inqryEndDt': f'{dt}2359',
            'pageNo': '1', 'numOfRows': '999', 'bidNtceNm': '공사',
            'type': 'json', 'serviceKey': API_KEY
        }

        # 🚨 서버가 바쁠 때를 대비해 3번까지 재시도하는 로직
        for _ in range(3):
            try:
                res = requests.get(url, params=params, verify=False, timeout=10)
                if res.status_code == 200:
                    items = res.json().get('response', {}).get('body', {}).get('items', [])
                    return items if items else []
            except:
                time.sleep(0.5)
                continue
        return []

    # 🚨 일꾼 15명으로 병렬 처리 (속도 향상)
    with concurrent.futures.ThreadPoolExecutor(max_workers=15) as executor:
        results = list(executor.map(fetch_per_day, dates))
        for res in results:
            if res: all_raw.extend(res)

    return pd.DataFrame(all_raw)