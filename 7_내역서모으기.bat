@echo off
chcp 65001 >nul
cd /d "%~dp0k-conmap-v2"
set PYTHONUTF8=1
set PYTHONIOENCODING=utf-8
set LOG=%~dp0_내역서모으기결과.txt
echo ==== 내역서 모으기 %DATE% %TIME% ==== > "%LOG%"
python -m pip install xlrd --quiet --disable-pip-version-check >> "%LOG%" 2>&1
echo [안내] 단가계약·연간단가·산출내역서를 겨냥합니다. 창을 닫지 마세요. >> "%LOG%"
python tools\naeyeok_fetch.py --n 120 --mode price >> "%LOG%" 2>&1
echo ---- exit code: %errorlevel% ---- >> "%LOG%"
echo ==== 끝 ==== >> "%LOG%"
exit
