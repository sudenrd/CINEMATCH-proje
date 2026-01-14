CINEMATCH - FİLM KEŞİF PORTALI

Cinematch, modern web teknolojileri kullanılarak geliştirilmiş, kullanıcıların güncel ve popüler filmleri interaktif bir şekilde keşfetmesini sağlayan bir platformdur. Ankara Üniversitesi Bilgisayar Mühendisliği bünyesinde yürütülen web geliştirme çalışmaları kapsamında tasarlanmıştır.

## 🖼️ Proje Görselleri

<p align="center">
  <b>Ana Vitrin ve Film Listeleri</b><br>
  <img src="ekran-goruntuleri/ana-vitrin.png" width="850" alt="Ana Vitrin">
</p>

<p align="center">
  <b>Ana Vitrin Film Kartı ve Modal Görünümü</b><br>
  <img src="ekran-goruntuleri/film-modal.png" width="850" alt="Film Kartı Modal">
</p>

<p align="center">
  <b>Kategori Görünümü (Aksiyon)</b><br>
  <img src="ekran-goruntuleri/kategori-gorunumu.png" width="850" alt="Kategori Görünümü">
</p>

<p align="center">
  <b>Kategori Sayfası İçinde Yer Alan Film Detayları Görünümü</b><br>
  <img src="ekran-goruntuleri/film-detaylari.png" width="850" alt="Film Detayları">
</p>

<p align="center">
  <b>Kullanıcı Yorum Yapma Bölümü ve Kontrolleri</b><br>
  <img src="ekran-goruntuleri/yorum-alani.png" width="850" alt="Yorum Bölümü">
</p>

MEVCUT ÖZELLİKLER

Dinamik Film Listeleri: TMDB API entegrasyonu ile "En Yüksek Puanlılar", "Trendler" ve "Vizyondakiler" listeleri otomatik olarak güncellenir.

Detaylı Film Modalları: Film kartlarına tıklandığında açılan pencerelerde film özeti, türler ve yayın yılı gibi detaylar sunulur.

Video Entegrasyonu: YouTube API desteği ile film fragmanları doğrudan uygulama üzerinden izlenebilir.

Kategori Filtreleme: Kullanıcılar ilgi duydukları türlere göre özel listelere ulaşabilir.

Modern Kullanıcı Arayüzü : Tamamen responsive, karanlık mod temalı ve kullanıcı dostu bir arayüz.

TEKNİK ALTYAPI VE GÜVENLİK

Vanilla JavaScript: Framework kullanmadan, temel JS yetenekleri ve asenkron programlama ile geliştirilmiştir.

API Güvenliği: Hassas veri olan API anahtarları, .gitignore dosyası aracılığıyla saklanmış ve GitHub'a yüklenmesi engellenmiştir.

Örnek Yapı: Diğer geliştiricilerin projeyi ayağa kaldırabilmesi için config.example.js dosyası dökümante edilmiştir.

EKLENECEK ÖZELLİKLER

Duygu Analizli Eşleşme: Kullanıcının o anki ruh haline göre özel algoritmik film önerileri.

Gelişmiş Arama: Film adına göre gerçek zamanlı arama motoru.

Kullanıcı Listeleri: Favori filmleri kaydetme ve kişisel izleme listeleri oluşturma.

KURULUM VE ÇALIŞTIRMA

Depoyu klonlayın.
config.example.js dosyasının adını config.js olarak güncelleyin.
Dosya içerisindeki API_KEY kısmına kendi TMDB anahtarınızı yapıştırın.
index.html dosyasını tarayıcınızda açın.
