# CINEMATCH - Film Keşif Portalı
**Cinematch**, modern web teknolojileri kullanılarak geliştirilmiş, kullanıcıların güncel ve popüler filmleri interaktif bir şekilde keşfetmesini sağlayan bir platformdur. Ankara Üniversitesi Bilgisayar Mühendisliği bünyesinde yürütülen web geliştirme çalışmaları kapsamında tasarlanmıştır.

## Proje Görselleri
<p align="center">
  <b>Ana Vitrin ve Film Listeleri</b><br>
  <img src="https://github.com/sudenrd/CINEMATCH-proje/blob/main/tan%C4%B1t%C4%B1m%20g%C3%B6rselleri/Ana%20vitrin%20film%20kart%C4%B1%20ve%20modal%20gorunumu.png" width="850">
</p>

<p align="center">
  <b>Ana Vitrin Film Kartı ve Modal Görünümü</b><br>
  <img src="resimler/2.png" width="850">
</p>

<p align="center">
  <b>Kategori Görünümü (Aksiyon)</b><br>
  <img src="resimler/3.png" width="850">
</p>

<p align="center">
  <b>Kategori Sayfası İçinde Yer Alan Film Detayları Görünümü</b><br>
  <img src="resimler/4.png" width="850">
</p>

<p align="center">
  <b>Kullanıcı Yorum Yapma Bölümü ve Kontrolleri</b><br>
  <img src="resimler/5.png" width="850">
</p>

## Mevcut Özellikler
* **Dinamik Film Akışı:** TMDB API entegrasyonu ile "En Yüksek Puanlılar", "Trendler" ve "Vizyondakiler" listeleri otomatik olarak güncellenir.
* **Gelişmiş Modal Yapısı:** Film kartlarına tıklandığında açılan pencerelerde film özeti, türler ve yayın yılı gibi detaylar sunulur.
* **Video ENtegrasyonu:** YouTube API desteği ile film fragmanları doğrudan uygulama üzerinden izlenebilir.
* **Kategori Fİltreleme:** Kullanıcılar ilgi duydukları türlere göre özel listelere ulaşabilir.
* **Kullanıcı Arayüzü:** Tamamen responsive, karanlık mod temalı ve kullanıcı dostu bir arayüz.

## Teknik Altyapı ve Güvenlik
* **Javascript:** Framework kullanmadan, temel JS yetenekleri ve asenkron programlama ile geliştirilmiştir.
* **API Güvenliği:** Hassas veri olan API anahtarları, .gitignore dosyası aracılığıyla saklanmış ve GitHub'a yüklenmesi engellenmiştir.
* **Örnek Yapı:** Diğer geliştiricilerin projeyi ayağa kaldırabilmesi için config.example.js dosyası dökümante edilmiştir.

## Eklenecek Özellikler
* **Duygu Analizli Eşleşme:** Kullanıcının o anki ruh haline göre özel algoritmik film önerileri.
* **Gelişmiş Arama:** Film adına göre gerçek zamanlı arama motoru.
* **Kullanıcı Listeleri:** Favori filmleri kaydetme ve kişisel izleme listeleri oluşturma.

## Kurulum ve Çalıştırma
Depoyu klonlayın.
config.example.js dosyasının adını config.js olarak güncelleyin.
Dosya içerisindeki API_KEY kısmına kendi TMDB anahtarınızı yapıştırın.
index.html dosyasını tarayıcınızda açın.
