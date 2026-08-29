CINEMATCH PROJESI CALISTIRMA NOTLARI

ONEMLI:
templates/index.html dosyasini tarayicida direkt acmayin ve VS Code Live Server ile calistirmayin.
Bu proje Flask/Jinja kullandigi icin CSS ve JS dosyalari Flask sunucusu uzerinden yuklenir.

En kolay yol:
calistir.bat dosyasina cift tiklayin, sonra tarayicida http://127.0.0.1:5000 adresini acin.

GitHub'a yuklerken:
static/config.js dosyasinda kisisel TMDB API anahtari bulunur; bu dosyayi public GitHub'a yuklemeyin.
Yeni kurulumda static/config.example.js dosyasini static/config.js olarak kopyalayip kendi API anahtarinizi yazin.
Yayina alirken FLASK_SECRET_KEY ortam degiskenini guclu ve gizli bir degerle ayarlayin.
instance/database.db, static/uploads, .venv, .venv-1, __pycache__ ve zip dosyalarini GitHub'a yuklemeyin.

Manuel calistirma:

1. Proje klasorunu terminalde acin.
2. Gerekirse sanal ortam olusturun:
   python -m venv .venv

3. Sanal ortami aktif edin:
   Windows:
   .venv\Scripts\activate

4. Gerekli paketleri kurun:
   pip install -r requirements.txt

5. Uygulamayi calistirin:
   python app.py

6. Tarayicida acin:
   http://127.0.0.1:5000

NOT:
instance/database.db dosyasi mevcut veritabani verilerini icerir.
