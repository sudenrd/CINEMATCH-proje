# 🎬 Cinematch
Cinematch, akşamları ne izlesem diye saatlerce düşünme derdini bitiren sosyal bir film platformu. Sitenin en büyük ve en önemli özelliği size 10 soruluk bir mood testi sunması. Bu testi çözdüğünüzde sistem o anki psikolojinizi analiz ediyor ve tamamen sizin o anki moodunuza nokta atışı uyacak filmleri karşınıza çıkarıyor. Klasik arama motorları gibi sadece isimle film aratıp çıktığınız bir yer değil; kendi profilinizi açıp arkadaşlarınızı takip edebildiğiniz, izlediğiniz filmlere yorum yapıp beğendiklerinizi favlayabildiğiniz interaktif bir ortam. TMDB veritabanını kullanarak sinema keyfini hem kişiselleştirilmiş bir deneyime hem de canlı bir sosyal ağa dönüştürüyor.

**Öne Çıkan Özellikler**
* **Mood Testi:** Kullanıcıların o anki ruh halini tespit etmek için hazırlanan dinamik bir test. Sistem, verilen cevapları analiz ederek kişinin neşeli, melankolik veya aksiyon arayan moduna en uygun filmleri süzerek özel bir öneri listesi oluşturur.
* **Sosyal Profil ve Takip Sistemi:** Kullanıcılar platform üzerinde kendilerine ait bir alan yaratabilir, film zevkini beğendikleri diğer üyeleri takip ederek toplulukla etkileşimde kalabilirler.
* **Etkileşim, Yorum ve Değerlendirme:** Yapımların altına kişisel incelemelerinizi yazabilir, filmlere puan verebilir ve beğendiklerinizi kendi favori (fav) listenizde toplayabilirsiniz.
* **Gelişmiş Filtreleme ve Sıralama:** Filmler kategorilerine göre hızlıca ayrıştırılabilir ve veri kalabalığında kaybolmamak için IMDb/TMDB puanlarına veya popülerlik derecelerine göre yüksekten düşüğe doğru sıralanabilir.

**Ekran Görüntüleri**

*Ana Ekran Görünümü*
![Ana Ekran](https://github.com/sudenrd/CINEMATCH-proje/blob/main/static/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/anaekran.png)

*Ana Vitrin Film Listeleri*
![Film Listesi](https://github.com/sudenrd/CINEMATCH-proje/blob/main/static/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/Ana%20vitrin%20ve%20film%20listeleri.png)

*Ana Vitrin Film Kartı ve Modal Görünümü*
![Film Kartı](https://github.com/sudenrd/CINEMATCH-proje/blob/main/static/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/Ana%20vitrin%20film%20kart%C4%B1%20ve%20modal%20g%C3%B6r%C3%BCn%C3%BCm%C3%BC.png)

*Kategori Görünümü*
![Kategori](https://github.com/sudenrd/CINEMATCH-proje/blob/main/static/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/Kategori%20g%C3%B6r%C3%BCn%C3%BCm%C3%BC.png)

*Kategori Sayfası İçinde Yer Alan Film Detayları*
![Kategori Detay](https://github.com/sudenrd/CINEMATCH-proje/blob/main/static/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/Kategori%20sayfas%C4%B1%20i%C3%A7inde%20yer%20alan%20film%20detaylar%C4%B1%20g%C3%B6r%C3%BCn%C3%BCm%C3%BC.png)

*Yorum Yapma Bölümü*
![Yorum Sistemi](https://github.com/sudenrd/CINEMATCH-proje/blob/main/static/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/Yorum%20yapma%20b%C3%B6l%C3%BCm%C3%BC.png)

*Test Sonucu ve Öneriler*
![Test Sonucu](https://github.com/sudenrd/CINEMATCH-proje/blob/main/static/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/testsonucu.png)

**Kullanılan Teknolojiler**
* Python, Flask, SQLite
* HTML, CSS, JavaScript
* TMDB API

**Çalıştırma Adımları**
1. Gerekli kütüphaneleri kurun: 
   `pip install -r requirements.txt`
2. `static/config.js` dosyasını oluşturup içine kendi anahtarınızı yazın: 
   `const TMDB_API_KEY = "API_ANAHTARINIZ";`
3. Projeyi başlatın: 
   `python app.py`
