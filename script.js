/* --- 1. SABİTLER VE API AYARLARI --- */
const API_KEY = '6b2e0878e3637f364a6ad51a5292b0fc'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500'; 

/* --- 2. SAYFA YÜKLENDİĞİNDE ÇALIŞACAKLAR --- */
document.addEventListener('DOMContentLoaded', () => {
    // Film Listelerini Çek
    fetchMovies(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=tr-TR&page=1`, 'imdb-list', 50);
    fetchMovies(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=tr-TR`, 'trend-list', 20);
    if(document.getElementById('upcoming-list')) {
        fetchMovies(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=tr-TR&page=1`, 'upcoming-list', 10);
    }

    // Modal Elementlerini Tanımla
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const forgotModal = document.getElementById('forgotPasswordModal');

    // --- MODAL AÇMA BUTONLARI ---
    const loginBtn = document.querySelector('.nav-btn'); // Navbar'daki Oturum Aç
    const footerLoginBtn = document.querySelector('.footer-login-link'); // Footer'daki Hesabım
    const footerForgotLink = document.querySelector('.footer-forgot-link'); // Footer'daki Şifre Sıfırlama

    if (loginBtn) loginBtn.onclick = (e) => { e.preventDefault(); loginModal.style.display = 'flex'; };
    if (footerLoginBtn) footerLoginBtn.onclick = (e) => { e.preventDefault(); loginModal.style.display = 'flex'; };
    if (footerForgotLink) footerForgotLink.onclick = (e) => { e.preventDefault(); forgotModal.style.display = 'flex'; };

    // --- MODAL ARASI GEÇİŞLER ---
    
    // Giriş Modalından -> Kayıt Ol'a geçiş
    const signupLink = document.querySelector('.signup-text a');
    if (signupLink) {
        signupLink.onclick = (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            registerModal.style.display = 'flex';
        };
    }

    // Kayıt Modalından -> Giriş Yap'a geri dönüş
    const toLoginLink = document.getElementById('to-login');
    if (toLoginLink) {
        toLoginLink.onclick = (e) => {
            e.preventDefault();
            registerModal.style.display = 'none';
            loginModal.style.display = 'flex';
        };
    }

    // Giriş Modalından -> Şifremi Unuttum'a geçiş
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.onclick = (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            forgotModal.style.display = 'flex';
        };
    }

    // --- KAPATMA İŞLEMLERİ ---
    
    // Tüm X (Kapatma) butonlarını ayarla
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.onclick = () => {
            loginModal.style.display = 'none';
            registerModal.style.display = 'none';
            forgotModal.style.display = 'none';
        };
    });

    // Dışarıya (Overlay) tıklandığında hepsini kapat
    window.onclick = (event) => {
        if (event.target == loginModal) loginModal.style.display = 'none';
        if (event.target == registerModal) registerModal.style.display = 'none';
        if (event.target == forgotModal) forgotModal.style.display = 'none';
    };
});

/* --- 3. FİLM ÇEKME FONKSİYONU --- */
async function fetchMovies(url, containerId, movieCount) {
    try {
        const container = document.getElementById(containerId);
        if (!container) return; 

        let allMovies = [];
        const response1 = await fetch(url);
        const data1 = await response1.json();
        allMovies = data1.results; 

        // IMDb listesi gibi çok film gereken yerlerde 2. ve 3. sayfaları da çek
        if (movieCount > 20) {
            const response2 = await fetch(url.replace('page=1', 'page=2'));
            const data2 = await response2.json();
            allMovies = allMovies.concat(data2.results);
        }
        if (movieCount > 40) {
            const response3 = await fetch(url.replace('page=1', 'page=3'));
            const data3 = await response3.json();
            allMovies = allMovies.concat(data3.results);
        }

        const finalMovies = allMovies.slice(0, movieCount);

        finalMovies.forEach((movie, index) => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            card.innerHTML = `
                <div class="rank">${index + 1}</div>
                <img src="${IMAGE_URL + movie.poster_path}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300?text=Resim+Yok'">
            `;

            // FİLME TIKLAYINCA DETAY SAYFASINA GİT
            card.addEventListener('click', () => {
                location.href = `movie-detail.html?id=${movie.id}`;
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Film çekme hatası:", error);
    }
}
