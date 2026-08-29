@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Sanal ortam bulunamadi. Olusturuluyor...
    py -3 -m venv .venv
    if errorlevel 1 (
        python -m venv .venv
    )
)

if not exist ".venv\Scripts\python.exe" (
    echo Python sanal ortami olusturulamadi.
    echo Lutfen Python kurulumunu kontrol edin.
    pause
    exit /b 1
)

".venv\Scripts\python.exe" -c "import flask, flask_sqlalchemy" >nul 2>nul
if errorlevel 1 (
    echo Gerekli paketler kuruluyor...
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 (
        echo Paket kurulumu basarisiz oldu.
        pause
        exit /b 1
    )
)

echo.
echo CINEMATCH baslatiliyor...
echo Tarayicida su adresi acin:
echo http://127.0.0.1:5000
echo.
echo NOT: templates\index.html dosyasini direkt acmayin; Flask sunucusu uzerinden acilmalidir.
echo.

".venv\Scripts\python.exe" app.py
pause
