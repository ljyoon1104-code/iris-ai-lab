@echo off
chcp 65001 >nul
title Iris AI Lab 실행기
cd /d "%~dp0"

echo ========================================
echo  Iris AI Lab (붓꽃 데이터 기계학습)
echo  개발 서버를 시작합니다.
echo  브라우저에서 자동으로 열립니다.
echo ========================================
echo.

if not exist "node_modules\" (
    echo [안내] node_modules 폴더가 없습니다. 필수 패키지를 설치합니다...
    call npm install
    if errorlevel 1 (
        echo [오류] npm install 설치에 실패했습니다. Node.js 환경을 확인해주세요.
        pause
        exit /b 1
    )
    echo [완료] 패키지 설치가 완료되었습니다.
    echo.
)

echo [안내] Vite 개발 서버를 시작하며 http://localhost:5173/ 브라우저를 엽니다.
echo [안내] 서버를 종료하려면 이 창을 닫아주세요.
echo.

call npm run dev -- --host 0.0.0.0 --port 5173 --open
pause
