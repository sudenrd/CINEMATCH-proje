const API_KEY = API_CONFIG.API_KEY; 
const BASE_URL = API_CONFIG.BASE_URL; 
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

const modal = document.getElementById('movieModal');
const videoContainer = document.getElementById('video-container'); 
const modalCard = document.getElementById('modal-card-container'); 


document.addEventListener('DOMContentLoaded', () => {
    fetchMovies(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=tr-TR&page=1`, 'imdb-list', 50);
    fetchMovies(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=tr-TR`, 'trend-list', 20);
    if(document.getElementById('upcoming-list')) {
        fetchMovies(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=tr-TR&page=1`, 'upcoming-list', 10);
    }


    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const forgotModal = document.getElementById('forgotPasswordModal');

    const loginTrigger = document.getElementById('login-trigger');
    const toRegisterBtn = document.querySelector('.signup-text a');
    const toLoginBtn = document.getElementById('to-login');
    const forgotLinks = document.querySelectorAll('.forgot-link, .footer-forgot-link');

    if (loginTrigger) {
        loginTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'flex';
        });
    }

    if (toRegisterBtn) {
        toRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            registerModal.style.display = 'flex';
        });
    }

    if (toLoginBtn) {
        toLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerModal.style.display = 'none';
            loginModal.style.display = 'flex';
        });
    }

    forgotLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            loginModal.style.display = 'none';
            forgotModal.style.display = 'flex';
        });
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const parentModal = btn.closest('.modal-overlay');
            if(parentModal) parentModal.style.display = 'none';
            if(parentModal.id === 'movieModal') stopVideo(); 
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            event.target.style.display = 'none';
            if(event.target.id === 'movieModal') stopVideo();
        }
    });
});

async function fetchMovies(url, containerId, movieCount) {
    try {
        const container = document.getElementById(containerId);
        if (!container) return; 

        let allMovies = [];
        const response1 = await fetch(url);
        const data1 = await response1.json();
        allMovies = data1.results; 

        if (movieCount > 20) {
            const response2 = await fetch(url.replace('page=1', 'page=2'));
            const data2 = await response2.json();
            allMovies = allMovies.concat(data2.results);
        }

        const finalMovies = allMovies.slice(0, movieCount);

        finalMovies.forEach((movie, index) => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <div class="rank">${index + 1}</div>
                <img src="${IMAGE_URL + movie.poster_path}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/200x300?text=Resim+Yok'">
            `;

            card.addEventListener('click', () => openModal(movie.id));

            container.appendChild(card);
        });
    } catch (error) { console.error("Hata:", error); }
}

async function openModal(movieId) {
    stopVideo();
    try {
        let url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=tr-TR&append_to_response=release_dates`;
        let response = await fetch(url);
        let movie = await response.json();

        let videoUrl = `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`;
        let vidResp = await fetch(videoUrl);
        let vidData = await vidResp.json();

        document.getElementById('m-title').innerText = movie.title;
        document.getElementById('m-year').innerText = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        document.getElementById('m-genres').innerText = movie.genres ? movie.genres.map(genre => genre.name).join(', ') : '';
        document.getElementById('m-desc').innerText = movie.overview || "(Özet bulunamadı)";

        const bgImage = movie.backdrop_path || movie.poster_path;
        document.getElementById('m-img').src = BACKDROP_URL + bgImage;

        const trailerBtn = document.getElementById('m-trailer');
        let trailer = vidData.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
        let trailerKey = trailer ? trailer.key : null;

        trailerBtn.onclick = function() {
            if (trailerKey) playVideo(trailerKey);
            else window.open(`https://www.youtube.com/results?search_query=${movie.title} trailer`, '_blank');
        };

        modal.style.display = "flex";
    } catch (error) { console.error("Detay hatası:", error); }
}

function playVideo(videoKey) {
    modalCard.classList.add('video-mode');
    videoContainer.style.display = 'block';
    videoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoKey}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
}

function stopVideo() {
    modalCard.classList.remove('video-mode');
    if(videoContainer) {
        videoContainer.innerHTML = '';
        videoContainer.style.display = 'none';
    }
}

function closeModal() {
    modal.style.display = "none";
    stopVideo(); 
}

// --- PROFİL SAYFASI: FİLM ARAMA VE EKLEME ---
let activeSearchAction = 'izlendi';

document.addEventListener('DOMContentLoaded', () => {
    const searchModal = document.getElementById('searchModal');
    const emptyPosters = document.querySelectorAll('.empty-poster');
    const navSearchBtn = document.getElementById('nav-search-btn');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    let searchTimer;

    window.openSearchModal = (action = 'izlendi', event = null) => {
        if (event) event.preventDefault();
        if (!searchModal || !searchInput || !searchResults) return;

        activeSearchAction = action;
        searchModal.style.display = 'flex';
        searchInput.value = '';
        searchResults.innerHTML = '<p class="search-hint">Bir harf yaz, popüler eşleşmeleri hemen sıralayayım.</p>';
        searchInput.focus();
    };

    const showAllBtn = document.getElementById('show-all-btn');
    const movieSlider = document.getElementById('movie-slider');

    if(showAllBtn && movieSlider) {
        showAllBtn.addEventListener('click', function() {
            movieSlider.classList.toggle('show-all-grid');
            this.innerHTML = movieSlider.classList.contains('show-all-grid')
                ? 'Gizle <i class="fa-solid fa-chevron-up"></i>'
                : 'Tümünü Göster <i class="fa-solid fa-chevron-right"></i>';
        });
    }

    emptyPosters.forEach(poster => {
        const action = poster.dataset.action || (poster.querySelector('.fa-heart') ? 'favori' : 'izlendi');
        poster.addEventListener('click', (event) => window.openSearchModal(action, event));
    });

    if(navSearchBtn) {
        navSearchBtn.addEventListener('click', (event) => window.openSearchModal('izlendi', event));
    }

    if(closeSearch) closeSearch.addEventListener('click', () => searchModal.style.display = 'none');

    if(searchInput) {
        searchInput.addEventListener('input', (event) => {
            clearTimeout(searchTimer);
            const query = event.target.value.trim();

            if (query.length < 1) {
                searchResults.innerHTML = '<p class="search-hint">Bir harf yaz, popüler eşleşmeleri hemen sıralayayım.</p>';
                return;
            }

            searchResults.innerHTML = '<p class="search-hint">Aranıyor...</p>';
            searchTimer = setTimeout(() => searchMoviesForProfile(query), 250);
        });
    }
});

async function searchMoviesForProfile(query) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    try {
        const params = new URLSearchParams({
            api_key: API_KEY,
            language: 'tr-TR',
            region: 'TR',
            include_adult: 'false',
            query
        });
        const response = await fetch(`${BASE_URL}/search/movie?${params.toString()}`);
        const data = await response.json();
        const movies = (data.results || [])
            .filter(movie => movie?.id && movie.title)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || (b.vote_count || 0) - (a.vote_count || 0))
            .slice(0, 8);

        if (movies.length === 0) {
            searchResults.innerHTML = '<p class="search-hint">Sonuç bulamadım.</p>';
            return;
        }

        searchResults.innerHTML = '';
        movies.forEach(renderProfileSearchResult);
    } catch (error) {
        console.error("Arama hatası:", error);
        searchResults.innerHTML = '<p class="search-hint">Arama sırasında bir sorun oldu.</p>';
    }
}

function renderProfileSearchResult(movie) {
    const searchResults = document.getElementById('searchResults');
    const imgPath = movie.poster_path ? IMAGE_URL + movie.poster_path : 'https://via.placeholder.com/80x120?text=Yok';
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const resultItem = document.createElement('div');

    resultItem.className = 'search-result-item';
    resultItem.innerHTML = `
        <img src="${imgPath}" alt="${movie.title}" class="search-result-img">
        <div class="result-info">
            <h4>${movie.title} (${year})</h4>
            <p class="result-subline"><i class="fa-solid fa-star"></i> ${Number(movie.vote_average || 0).toFixed(1)} · Popülerlik ${Math.round(movie.popularity || 0)}</p>
            <div class="action-buttons" id="actions-${movie.id}"></div>
        </div>
    `;
    searchResults.appendChild(resultItem);

    const actionContainer = document.getElementById(`actions-${movie.id}`);

    const watchBtn = document.createElement('button');
    watchBtn.className = 'action-btn watch-btn';
    watchBtn.title = 'İzlediklerime ekle';
    watchBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
    watchBtn.onclick = () => veritabaninaKaydet(movie.id, movie.title, movie.poster_path, 'izlendi', watchBtn);

    const favBtn = document.createElement('button');
    favBtn.className = 'action-btn fav-btn';
    favBtn.title = 'Favorilerime ekle';
    favBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
    favBtn.onclick = () => veritabaninaKaydet(movie.id, movie.title, movie.poster_path, 'favori', favBtn);

    const watchlistBtn = document.createElement('button');
    watchlistBtn.className = 'action-btn watchlist-btn';
    watchlistBtn.title = 'İzleneceklerime ekle';
    watchlistBtn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
    watchlistBtn.onclick = () => veritabaninaKaydet(movie.id, movie.title, movie.poster_path, 'izlenecek', watchlistBtn);

    const infoBtn = document.createElement('button');
    infoBtn.className = 'action-btn info-btn';
    infoBtn.title = 'Film detayları';
    infoBtn.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    infoBtn.onclick = () => window.location.href = `/detay?id=${movie.id}`;

    actionContainer.append(watchBtn, watchlistBtn, favBtn, infoBtn);
}

async function veritabaninaKaydet(movieId, title, poster, action, button = null) {
    try {
        const response = await fetch('/film_kaydet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie_id: movieId, title, poster, action, mode: 'add' })
        });
        const sonuc = await response.json();

        if(!sonuc.success) {
            alert("Hata: " + sonuc.error);
            return;
        }

        appendMovieToProfileSlider({ movieId, title, poster, action });

        if (button) {
            button.classList.add('is-added');
            button.innerHTML = '<i class="fa-solid fa-check-double"></i>';
            button.title = sonuc.action === 'exists' ? 'Bu listede zaten var' : 'Eklendi';
        }
    } catch (error) {
        console.error("Kaydetme hatası:", error);
    }
}

function appendMovieToProfileSlider({ movieId, title, poster, action }) {
    const sliderMap = {
        favori: 'favorite-slider',
        izlenecek: 'watchlist-slider',
        izlendi: 'movie-slider'
    };
    const sliderId = sliderMap[action] || 'movie-slider';
    const slider = document.getElementById(sliderId);
    if (!slider || slider.querySelector(`[data-movie-id="${movieId}"][data-action="${action}"]`)) return;

    const card = document.createElement('div');
    card.className = 'movie-card-item';
    card.dataset.movieId = String(movieId);
    card.dataset.action = action;
    card.innerHTML = `
        <a href="/detay?id=${movieId}">
            <img src="${poster ? IMAGE_URL + poster : 'https://via.placeholder.com/150x225?text=Yok'}" alt="${title}" style="cursor: pointer;">
        </a>
        <button class="remove-movie-btn" onclick="filmiSil('${movieId}', this, '${action}')" title="Listeden Kaldır">
            <i class="fa-solid fa-times"></i>
        </button>
    `;

    const addButton = slider.querySelector('.slider-add-btn');
    if (addButton) slider.insertBefore(card, addButton);
    else slider.appendChild(card);

    updateProfileCounter(slider, 1);
}

function updateProfileCounter(slider, delta) {
    const section = slider.closest('.favorite-section');
    const counter = section?.querySelector('.count');
    if (!counter) return;

    const current = parseInt(counter.innerText, 10) || 0;
    counter.innerText = `${Math.max(0, current + delta)} Film`;
}

async function filmiSil(movieId, butonElementi, action = null) {
    const onay = confirm("Bu filmi listenden çıkarmak istediğine emin misin?");
    if (!onay) return;

    const kart = butonElementi.closest('.movie-card-item');
    const resolvedAction = action || kart?.dataset.action;

    try {
        const response = await fetch('/film_kaydet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ movie_id: movieId, action: resolvedAction, mode: 'delete' })
        });

        const data = await response.json();

        if (data.success && (data.action === 'deleted' || data.action === 'missing')) {
            const slider = kart.closest('.movie-slider');
            kart.style.transition = "0.3s";
            kart.style.opacity = "0";
            kart.style.transform = "scale(0.8)";
            setTimeout(() => {
                kart.remove();
                updateProfileCounter(slider, -1);
            }, 300);
        } else {
            alert("Film silinemedi: " + data.error);
        }
    } catch (error) {
        console.error("Silme hatası:", error);
        alert("Bir hata oluştu!");
    }
}

// 1. SORULAR: tüm kategori ailelerini puanlayan mood testi.
const questions = [
    {
        question: "Bu gece film sende en çok ne yapsın?",
        options: [
            { text: "Kafam dağılsın; gülümseyip hafifleyeyim.", points: ["komedi", "cerezlik", "cozy", "romantik_komedi", "aile"] },
            { text: "Işığı kısınca ortam biraz tekinsizleşsin.", points: ["korku", "karanlik", "gerilim", "seri_katil", "iskandinav"] },
            { text: "Ortaya bir sır düşsün, ben ipucu toplayayım.", points: ["gerilim", "gizem", "polisiye", "suc", "psikolojik"] },
            { text: "İçime dokunsun; bitince birkaç dakika susayım.", points: ["dram", "depresif", "aglamak_garanti", "slowburn", "romantik"] },
            { text: "Nabzı yükseltsin; kaçış, plan, kovalamaca olsun.", points: ["aksiyon", "macera", "hayatta_kalma", "soygun", "intikam"] },
            { text: "Kalp tarafımı yumuşatsın, tatlı bir yakınlık bıraksın.", points: ["romantik", "romantik_komedi", "cozy", "ko", "fransiz"] },
            { text: "Gerçek hayattan uzak, bambaşka bir evren açsın.", points: ["bilim_kurgu", "fantastik", "uzay", "yapay_zeka", "anime"] },
            { text: "Ağır otursun; kadrajı, oyunculuğu, finali konuşsun.", points: ["arthouse", "festival_odullu", "oscar_secisi", "edebi_uyarlama", "uzun_basyapit"] }
        ]
    },
    {
        question: "Ritmi nasıl aksın?",
        options: [
            { text: "Yormadan aksın, yemekle bile iyi gitsin.", points: ["cerezlik", "komedi", "animasyon", "aile", "cozy"] },
            { text: "Kalabalıkla izlenir gibi olsun; tepki verdirtsin.", points: ["komedi", "korku", "aksiyon", "soygun", "romantik_komedi"] },
            { text: "Yavaş yavaş içime işlesin, acele etmesin.", points: ["slowburn", "dram", "arthouse", "bagimsiz", "fa"] },
            { text: "İlk dakikadan yakalasın, telefonu unuttursun.", points: ["aksiyon", "gerilim", "macera", "soygun", "hayatta_kalma"] },
            { text: "Sessizlik bile bir şey olacakmış gibi dursun.", points: ["korku", "karanlik", "gerilim", "seri_katil", "psikolojik"] },
            { text: "Zamanla, rüyayla, hafızayla oyun oynasın.", points: ["beyin_yakan", "ters_kose", "psikolojik", "zaman_yolculugu", "deneysel"] },
            { text: "Uzun soluklu, büyük hikayeli, masaya oturmalık olsun.", points: ["uzun_basyapit", "oscar_secisi", "tarih", "edebi_uyarlama", "festival_odullu"] },
            { text: "Renk, müzik, sahne enerjisi hiç düşmesin.", points: ["muzik", "animasyon", "hint", "anime", "romantik_komedi"] }
        ]
    },
    {
        question: "Hikayenin merkezinde ne dursun?",
        options: [
            { text: "Tatlı kaos, terslikler, saçma ama iyi gelen anlar.", points: ["komedi", "cerezlik", "romantik_komedi", "kult", "tr"] },
            { text: "Kilitli kapılar, kayıp biri, herkesin sakladığı bir şey.", points: ["gizem", "polisiye", "gerilim", "suc", "psikolojik"] },
            { text: "Kirli para, sessiz tehditler, masanın altındaki anlaşma.", points: ["suc", "mafya", "polisiye", "gerilim", "antihero"] },
            { text: "Kusursuz plan kuran bir ekip ve çatırdayan sinirler.", points: ["soygun", "suc", "polisiye", "aksiyon", "gizem"] },
            { text: "Bozulmuş bir düzen, dışarıda tehlike, içeride hayatta kalma.", points: ["post_apocalyptic", "distopya", "hayatta_kalma", "bilim_kurgu", "aksiyon"] },
            { text: "Uzay, zaman, makineler ya da aklı zorlayan bir fikir.", points: ["uzay", "zaman_yolculugu", "yapay_zeka", "bilim_kurgu", "cyberpunk"] },
            { text: "Kendini toparlamaya çalışan biri, büyümek ve iyileşmek.", points: ["coming_of_age", "dram", "bagimsiz", "ilham_veren", "romantik"] },
            { text: "Geçmişin sert tarafı; dönem, cephe, düello ya da büyük hesap.", points: ["tarih", "savas", "vahsi_bati", "uzun_basyapit", "edebi_uyarlama"] }
        ]
    },
    {
        question: "Hangi atmosfer daha çok çağırıyor?",
        options: [
            { text: "Ev, mahalle, aile masası; tanıdık ve sıcak.", points: ["aile", "cozy", "yesilcam", "tr", "komedi"] },
            { text: "Yağmurlu şehir, neon ışık, ekran parıltısı ve tehlike.", points: ["cyberpunk", "gerilim", "suc", "karanlik", "hacker"] },
            { text: "Çizilmiş gibi renkli, büyülü, biraz da masalsı.", points: ["fantastik", "animasyon", "anime", "macera", "japon"] },
            { text: "Sessiz, sade, az konuşup çok hissettiren.", points: ["arthouse", "bagimsiz", "festival_odullu", "fransiz", "italyan"] },
            { text: "Yerli bir sıcaklık; aile, mahalle, eski tatlar.", points: ["tr", "yesilcam", "komedi", "dram", "aile"] },
            { text: "Uzak Doğu dokusu; duygu da var, sert viraj da.", points: ["ko", "japon", "anime", "gerilim", "dram"] },
            { text: "Avrupa/İran sakinliği; küçük anlar, kalıcı sızı.", points: ["fa", "fransiz", "italyan", "arthouse", "slowburn"] },
            { text: "Kalabalık sahneler, ritim, hareket ve büyük enerji.", points: ["hint", "cin", "hong_kong", "aksiyon", "muzik"] }
        ]
    },
    {
        question: "Bugünkü moduna en yakın cümle hangisi?",
        options: [
            { text: "Modum düşük; beni güldüren bir şey toparlar.", points: ["komedi", "cerezlik", "cozy", "aile", "romantik_komedi"] },
            { text: "Biraz ürpermek istiyorum ama ucuz numara olmasın.", points: ["korku", "karanlik", "iskandinav", "gerilim", "psikolojik"] },
            { text: "Teori kurasım var, sonradan arkadaşla tartışayım.", points: ["beyin_yakan", "gizem", "ters_kose", "psikolojik", "zaman_yolculugu"] },
            { text: "Kırgınım; güzel acı kaldırırım.", points: ["dram", "depresif", "aglamak_garanti", "romantik", "slowburn"] },
            { text: "Gaza gelmem lazım, içimde motor çalışsın.", points: ["aksiyon", "intikam", "hayatta_kalma", "macera", "ilham_veren"] },
            { text: "Yakınlık, flört, küçük tesadüfler iyi gelir.", points: ["romantik", "romantik_komedi", "cozy", "ko", "fransiz"] },
            { text: "Tuhaf, kült, herkesin bilmediği bir açık kapatayım.", points: ["kult", "deneysel", "arthouse", "beyin_yakan", "bagimsiz"] },
            { text: "Kurgu olmasa da olur; gerçek insan, sahne ya da hayat hikayesi izlerim.", points: ["belgesel", "muzik", "tarih", "oscar_secisi", "edebi_uyarlama"] }
        ]
    },
    {
        question: "Film bitince sende ne kalsın?",
        options: [
            { text: "Yüzümde gülümseme ve hafiflik.", points: ["komedi", "cozy", "aile", "cerezlik", "romantik_komedi"] },
            { text: "Arkadaşa anlatılacak tekinsiz bir sahne.", points: ["korku", "gerilim", "karanlik", "seri_katil", "gizem"] },
            { text: "Finale geri dönüp parçaları birleştirme isteği.", points: ["ters_kose", "beyin_yakan", "psikolojik", "gizem", "gerilim"] },
            { text: "Boğazda düğüm.", points: ["dram", "depresif", "aglamak_garanti", "romantik", "fa"] },
            { text: "Adrenalin, hız, iyi bir kovalamaca sahnesi.", points: ["aksiyon", "macera", "soygun", "hayatta_kalma", "intikam"] },
            { text: "Yakınlığa ve tatlı tesadüflere biraz inanma hali.", points: ["romantik", "romantik_komedi", "cozy", "ko", "fransiz"] },
            { text: "İyi ki bunu izlemişim dedirten sinema doygunluğu.", points: ["festival_odullu", "oscar_secisi", "arthouse", "uzun_basyapit", "edebi_uyarlama"] },
            { text: "Aklımda şarkı, renk, sahne kalsın.", points: ["muzik", "animasyon", "anime", "hint", "fantastik"] }
        ]
    }
];

// 2. MODAL YÖNETİMİ VE TEST MOTORU
const moodAliases = {
    tr_sinemasi: "tr",
    turk: "tr",
    kore_sinemasi: "ko",
    kore: "ko",
    iran_sinemasi: "fa",
    iran: "fa"
};

const moodData = {
    aksiyon: { label: "Aksiyon", jargon: "adrenalin açık, mantık uçuşta", filters: { with_genres: "28" }, minVote: 120 },
    macera: { label: "Macera", jargon: "haritayı açıp kaybolmalık", filters: { with_genres: "12" }, minVote: 100 },
    animasyon: { label: "Animasyon", jargon: "renkler terapi gibi aksın", filters: { with_genres: "16" }, minVote: 80 },
    komedi: { label: "Komedi", jargon: "gülüp geçelim, bugün bu kadar", filters: { with_genres: "35" }, minVote: 100 },
    suc: { label: "Suç", jargon: "kirli dosya açıldı", filters: { with_genres: "80" }, minVote: 100 },
    polisiye: { label: "Polisiye", jargon: "ipucu görünce durdurup bakmalık", filters: { with_genres: "80|9648|53" }, minVote: 80 },
    belgesel: { label: "Belgesel", jargon: "kurgu değil, daha fenası gerçek", filters: { with_genres: "99" }, minVote: 20, sortBy: "vote_average.desc", voteAverageMin: 6.5 },
    dram: { label: "Dram", jargon: "içime otursun ama güzel otursun", filters: { with_genres: "18" }, minVote: 120 },
    aile: { label: "Aile", jargon: "kalbi battaniyeye sarma modu", filters: { with_genres: "10751" }, minVote: 60 },
    fantastik: { label: "Fantastik", jargon: "gerçek dünya biraz beklesin", filters: { with_genres: "14" }, minVote: 80 },
    tarih: { label: "Tarih", jargon: "kostüm, entrika, büyük olaylar", filters: { with_genres: "36" }, minVote: 60 },
    korku: { label: "Korku", jargon: "ışığı kapatma konusunda emin değiliz", filters: { with_genres: "27" }, minVote: 80 },
    muzik: { label: "Müzik", jargon: "sahne ışığı göze vurdu", filters: { with_genres: "10402" }, minVote: 30 },
    gizem: { label: "Gizem", jargon: "bir şeyler dönüyor, belli", filters: { with_genres: "9648" }, minVote: 80 },
    romantik: { label: "Romantik", jargon: "kalp yumuşadı, inkar yok", filters: { with_genres: "10749" }, minVote: 80 },
    bilim_kurgu: { label: "Bilim Kurgu", jargon: "gelecek geldi, biraz da sorunlu geldi", filters: { with_genres: "878" }, minVote: 100 },
    gerilim: { label: "Gerilim", jargon: "koltuk kenarı mesaisi", filters: { with_genres: "53" }, minVote: 120 },
    savas: { label: "Savaş", jargon: "tarihin sert tarafı açılıyor", filters: { with_genres: "10752" }, minVote: 50 },
    vahsi_bati: { label: "Vahşi Batı", jargon: "toz, güneş, düello enerjisi", filters: { with_genres: "37" }, minVote: 25 },
    uzay: { label: "Uzay", jargon: "dünyadan çıkış yapıyoruz", filters: { with_genres: "878|12", with_keywords: "9882|3801|3386|3388|9951" }, minVote: 40 },
    zaman_yolculugu: { label: "Zaman Yolculuğu", jargon: "timeline karıştı, iyi oldu", filters: { with_genres: "878|12|9648", with_keywords: "4379" }, minVote: 30, pageLimit: 3 },
    soygun: { label: "Soygun", jargon: "plan kusursuz, stres gerçek", filters: { with_genres: "80|28|53", with_keywords: "10051|191845|321964|239663" }, minVote: 40, pageLimit: 3 },
    psikolojik: { label: "Psikolojik", jargon: "asıl olay kafanın içinde", filters: { with_genres: "53|18|9648", with_keywords: "12565|374644|184312|226106" }, minVote: 40 },
    distopya: { label: "Distopya", jargon: "sistem bozuk, atmosfer şahane", filters: { with_genres: "878|53|18", with_keywords: "4565|355867|348204|372757" }, minVote: 25 },
    mafya: { label: "Mafya", jargon: "masada sessizlik, altta tehdit", filters: { with_genres: "80|18|53", with_keywords: "10391|155538|176098|335874|156779" }, minVote: 30 },
    hacker: { label: "Dijital Kaos", jargon: "şifre kırıldı, düzen dağıldı", filters: { with_genres: "53|80|878", with_keywords: "2157|303918|361357" }, minVote: 15 },
    hayatta_kalma: { label: "Hayatta Kalma", jargon: "konfor alanı iptal", filters: { with_genres: "53|12|18|878", with_keywords: "10349|50009|278646" }, minVote: 30 },
    seri_katil: { label: "Seri Katil", jargon: "rahatsız edici dosya saati", filters: { with_genres: "80|53|27", with_keywords: "10714|227428|372225" }, minVote: 40 },
    yapay_zeka: { label: "Yapay Zeka", jargon: "makine düşündü, insan gerildi", filters: { with_genres: "878|53|18", with_keywords: "310|371846|375504|371847" }, minVote: 20 },
    post_apocalyptic: { label: "Post Apokaliptik", jargon: "dünya bitmiş ama film yeni başlıyor", filters: { with_genres: "878|28|18|53", with_keywords: "4458|359337|372145|372741" }, minVote: 20 },
    cyberpunk: { label: "Cyberpunk", jargon: "neon yağmur altında kriz", filters: { with_genres: "878|28|53|16", with_keywords: "12190|309101|371866" }, minVote: 15 },
    intikam: { label: "İntikam", jargon: "hesap kapanmadan uyku yok", filters: { with_genres: "28|53|80|18", with_keywords: "9748|191045|220435|196399" }, minVote: 40 },
    anime: { label: "Anime", jargon: "anime evrenine tek yön bilet", filters: { with_genres: "16", with_keywords: "210024", with_original_language: "ja" }, minVote: 15 },
    bagimsiz: { label: "Bağımsız", jargon: "küçük film, büyük etki", filters: { with_keywords: "281237" }, minVote: 10, sortBy: "vote_average.desc", voteAverageMin: 6.5, pageLimit: 3 },
    kult: { label: "Kült", jargon: "bilen bilir filmi açıyoruz", filters: { with_keywords: "374649|10123|207268" }, minVote: 150, sortBy: "vote_average.desc", voteAverageMin: 7 },
    ters_kose: { label: "Ters Köşe", jargon: "son sahnede yüz ifadesi değişir", filters: { with_genres: "53|9648|18", with_keywords: "275311|374835|184312|226106" }, minVote: 40, pageLimit: 2 },
    cerezlik: { label: "Çerezlik", jargon: "play'e bas, hayatı yorma", filters: { with_genres: "35|10751|16|12", "with_runtime.lte": 105 }, minVote: 60 },
    uzun_basyapit: { label: "Uzun Başyapıt", jargon: "bu gece film değil mesai var", filters: { "with_runtime.gte": 150 }, minVote: 250, sortBy: "vote_average.desc", voteAverageMin: 7 },
    slowburn: {
        label: "Düşük Tempolu",
        jargon: "yavaş yanar, iz bırakır",
        minVote: 50,
        sortBy: "vote_average.desc",
        queries: [
            { filters: { with_genres: "18|53|9648", with_keywords: "277551|367766|374050|374206|245724" }, minVote: 10 },
            { filters: { with_genres: "18|53|9648", "with_runtime.gte": 105 }, voteAverageMin: 6.8, minVote: 80 }
        ]
    },
    beyin_yakan: {
        label: "Beyin Yakan",
        jargon: "açıklama videosu aratmalık",
        movieIds: [27205, 77, 157336, 206487, 14337, 220289, 329865, 577922, 141, 603, 63, 14139, 31011, 83542, 1018, 1381, 1124, 181886, 26466, 45612]
    },
    cozy: { label: "İç Isıtan", jargon: "içini ısıtan küçük kaçış", filters: { with_genres: "35|10751|10749|16", with_keywords: "326774|326004|329716|304995|6054|248927" }, minVote: 15 },
    karanlik: { label: "Karanlık", jargon: "perde kapalı, ortam ağır", filters: { with_genres: "53|27|80|18", with_keywords: "10123|207268|10714|12565" }, minVote: 40 },
    depresif: { label: "Depresif", jargon: "hüzün kaliteli gelsin", filters: { with_genres: "18|10749", with_keywords: "894|9872|9957|4232|1647|181324" }, minVote: 25, sortBy: "vote_average.desc" },
    ilham_veren: { label: "İlham Veren", jargon: "hayata küçük reset atmalık", filters: { with_genres: "18|10751", with_keywords: "191446|155170|281585|3929|11436|9672" }, minVote: 25 },
    arthouse: { label: "Sanat Filmi", jargon: "sessizlik bile konuşuyor", filters: { with_keywords: "11130|318182|329578|293336" }, minVote: 5, sortBy: "vote_average.desc", voteAverageMin: 6.5 },
    deneysel: { label: "Alışılmışın Dışında", jargon: "kurallar biraz dağılsın", filters: { with_keywords: "293336|11130|318182" }, minVote: 5, sortBy: "vote_average.desc" },
    antihero: { label: "Kusurlu Kahraman", jargon: "doğru insan değil ama izletiyor", filters: { with_genres: "28|80|18|53", with_keywords: "2095|285809|252203" }, minVote: 25 },
    coming_of_age: { label: "Kendini Bulma", jargon: "büyümek bazen böyle vuruyor", filters: { with_genres: "18|35|10749", with_keywords: "10683|234042|296608|10873" }, minVote: 30 },
    tr: { label: "Türk Sineması", jargon: "yerli damar açıldı", filters: { with_original_language: "tr" }, minVote: 10 },
    yesilcam: { label: "Yeşilçam", jargon: "nostalji dozu tam kararında", filters: { with_original_language: "tr" }, releaseMax: 1995, minVote: 5, voteAverageMin: 5.8 },
    ko: { label: "Kore Sineması", jargon: "Kore tarafı yine duyguyu biliyor", filters: { with_original_language: "ko" }, minVote: 20 },
    fa: { label: "İran Sineması", jargon: "sessiz sakin, kalbe direkt", filters: { with_original_language: "fa" }, minVote: 10, sortBy: "vote_average.desc" },
    japon: { label: "Japon Sineması", jargon: "Japon işi sakin güç", filters: { with_original_language: "ja" }, minVote: 20 },
    fransiz: { label: "Fransız Sineması", jargon: "Fransız usulü ince sızı", filters: { with_original_language: "fr" }, minVote: 20 },
    italyan: { label: "İtalyan Sineması", jargon: "İtalyan kadrajı, uzun tat", filters: { with_original_language: "it" }, minVote: 80 },
    hint: {
        label: "Hint Sineması",
        jargon: "renk, ritim, büyük duygu",
        minVote: 80,
        queries: [
            { filters: { with_original_language: "hi" } },
            { filters: { with_original_language: "ta" } },
            { filters: { with_original_language: "te" } },
            { filters: { with_original_language: "ml" } },
            { filters: { with_original_language: "bn" } }
        ]
    },
    ispanyol: { label: "İspanyol Sineması", jargon: "İspanyol temposu, sert viraj", filters: { with_original_language: "es" }, minVote: 500 },
    alman: { label: "Alman Sineması", jargon: "düzenli gerilim, temiz darbe", filters: { with_original_language: "de" }, minVote: 200 },
    cin: { label: "Çin Sineması", jargon: "büyük ölçek, net duygu", filters: { with_original_language: "zh", with_origin_country: "CN" }, minVote: 100 },
    hong_kong: { label: "Hong Kong Sineması", jargon: "aksiyonun hızlı lehçesi", filters: { with_origin_country: "HK" }, minVote: 100 },
    latin_amerika: {
        label: "Latin Amerika",
        jargon: "sıcak coğrafya, sert hikaye",
        minVote: 200,
        queries: [
            { filters: { with_origin_country: "MX" } },
            { filters: { with_origin_country: "AR" } },
            { filters: { with_origin_country: "BR" } },
            { filters: { with_origin_country: "CL" } },
            { filters: { with_origin_country: "CO" } }
        ]
    },
    iskandinav: {
        label: "İskandinav Sineması",
        jargon: "kuzey soğuğu, düşük sesli gerilim",
        minVote: 10,
        queries: [
            { filters: { with_original_language: "sv" } },
            { filters: { with_original_language: "da" } },
            { filters: { with_original_language: "no" } },
            { filters: { with_original_language: "fi" } },
            { filters: { with_original_language: "is" } }
        ]
    },
    romantik_komedi: { label: "Romantik Komedi", jargon: "flört kaosu tatlıya bağlanır", filters: { with_genres: "35,10749" }, minVote: 300, voteAverageMin: 6.5 },
    edebi_uyarlama: { label: "Edebi Uyarlama", jargon: "kitap kokusu ekrana geçti", filters: { with_genres: "18|10749|36", with_keywords: "818|186849|18712|222216" }, minVote: 30 },
    oscar_secisi: {
        label: "Oscar Ödüllü",
        jargon: "ödül sezonu ciddiyeti",
        movieIds: [278, 238, 424, 122, 496243, 13, 274, 289, 1422, 872585, 545611, 490132, 98, 279, 284, 705, 510, 597, 314365, 194662]
    },
    festival_odullu: {
        label: "Festival Ödüllü",
        jargon: "festival çıkışı sessiz kalma hali",
        movieIds: [496243, 680, 423, 531428, 505192, 265169, 60243, 758866, 915935, 965150, 467244, 927547, 86837, 8967, 152584, 401246, 374473, 314402, 38368, 2009]
    },
    aglamak_garanti: { label: "Ağlamak Garanti", jargon: "mendil yakında dursun", filters: { with_genres: "18|10749", with_keywords: "9872|1647|894" }, minVote: 30, sortBy: "vote_average.desc" }
};

function getMoodDiscoverUrl(mood, page) {
    const params = new URLSearchParams({
        api_key: API_KEY,
        language: "tr-TR",
        region: "TR",
        page: String(page),
        sort_by: mood.sortBy || "popularity.desc",
        include_adult: "false",
        include_video: "false",
        "vote_count.gte": String(mood.minVote ?? 50)
    });

    const filters = mood.filters || {};
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    });

    if (mood.voteAverageMin) {
        params.set("vote_average.gte", String(mood.voteAverageMin));
    }

    if (mood.releaseMin) {
        params.set("primary_release_date.gte", `${mood.releaseMin}-01-01`);
    }

    params.set(
        "primary_release_date.lte",
        mood.releaseMax ? `${mood.releaseMax}-12-31` : new Date().toISOString().slice(0, 10)
    );

    return `${BASE_URL}/discover/movie?${params.toString()}`;
}

function mergeMoodQuery(mood, query) {
    return {
        ...mood,
        ...query,
        filters: {
            ...(mood.filters || {}),
            ...(query.filters || {})
        },
        queries: undefined
    };
}

async function fetchJsonSafe(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.status_message || `TMDB hata kodu: ${response.status}`);
    }

    return data;
}

async function fetchMoodCandidates(mood, page) {
    if (mood.movieIds?.length) {
        return mood.movieIds.map(id => ({ id }));
    }

    const queries = mood.queries?.length
        ? mood.queries.map(query => mergeMoodQuery(mood, query))
        : [mood];

    const responses = await Promise.all(
        queries.map(query => fetchJsonSafe(getMoodDiscoverUrl(query, page)))
    );

    return responses.flatMap(data => data.results || []);
}

async function fetchMovieDetails(movieId) {
    const params = new URLSearchParams({
        api_key: API_KEY,
        language: "tr-TR",
        append_to_response: "videos",
        include_video_language: "tr,en,null"
    });

    return fetchJsonSafe(`${BASE_URL}/movie/${movieId}?${params.toString()}`);
}

function shuffleMovies(movies) {
    return [...movies].sort(() => Math.random() - 0.5);
}

function pickRandomMovie(results, excludedIds = new Set()) {
    const seen = new Set();
    const candidates = (results || []).filter(movie => {
        if (!movie?.id || seen.has(movie.id) || excludedIds.has(movie.id)) return false;
        seen.add(movie.id);
        return true;
    });

    if (candidates.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
}

async function getRecommendationForMood(mood, excludedIds = new Set()) {
    const pageLimit = mood.pageLimit || (mood.movieIds?.length ? 1 : 5);
    const firstPage = Math.floor(Math.random() * pageLimit) + 1;
    const pages = [...new Set([firstPage, 1, 2, 3].filter(page => page <= pageLimit))];

    for (const page of pages) {
        const candidates = await fetchMoodCandidates(mood, page);
        const prioritized = shuffleMovies(candidates);

        for (const candidate of prioritized.slice(0, 8)) {
            if (!candidate?.id || excludedIds.has(candidate.id)) continue;

            const details = await fetchMovieDetails(candidate.id);
            if (details?.id && (details.backdrop_path || details.poster_path)) {
                return details;
            }

            excludedIds.add(candidate.id);
        }
    }

    return null;
}

function normalizeMoodKey(key) {
    return moodAliases[key] || key;
}

function getPrimaryMoodKey() {
    const normalizedScores = {};

    Object.entries(scores).forEach(([rawKey, value]) => {
        const key = normalizeMoodKey(rawKey);
        if (!moodData[key]) return;
        normalizedScores[key] = (normalizedScores[key] || 0) + value;
    });

    const sorted = Object.entries(normalizedScores)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    return sorted[0]?.[0] || "cerezlik";
}

function buildMoodLine(mood, movieData) {
    const title = movieData.title || movieData.original_title || "bu film";
    const lines = [
        `${mood.jargon}. ${title} tam "bir sahne daha" diye geceyi uzatmalık.`,
        `${mood.jargon}. Bugün bu moda en net oturan film bu gibi.`,
        `${mood.jargon}. ${title} bu moda fazla net oturuyor.`,
        `${mood.jargon}. Ne izlesem krizini burada kapatıyoruz.`
    ];

    return lines[(movieData.id || title.length) % lines.length];
}

// --- TEST MOTORU DEĞİŞKENLERİ ---
let currentQ = 0;
let scores = {};
let shownRecommendationIds = new Set();

window.startTest = function() {
    scores = {}; 
    currentQ = 0;
    shownRecommendationIds = new Set();

    document.getElementById('test-container').style.display = 'block';
    
    // GÖMÜLÜ HATALARI TEMİZLİYORUZ (Sızıntıları ve Loading'i zorla gizle)
    document.getElementById('loading-result').style.display = 'none';
    if(document.getElementById('test-result')) document.getElementById('test-result').style.display = 'none';
    if(document.querySelector('.ai-section')) document.querySelector('.ai-section').style.display = 'none'; 

    const testModalContent = document.querySelector('#test-modal .modal-content');
    const testVideoContainer = document.getElementById('video-container');
    if (testModalContent) testModalContent.classList.remove('video-active');
    if (testVideoContainer) testVideoContainer.innerHTML = '';

    document.getElementById('test-modal').style.display = 'flex';
    loadQuestion();
};

function loadQuestion() {
    const q = questions[currentQ];
    
    // 1. SORU SAYACINI GÜNCELLE
    const counterEl = document.getElementById('question-counter');
    if (counterEl) {
        counterEl.innerText = `Soru ${currentQ + 1} / ${questions.length}`;
    }

    // 2. İLERLEME ÇUBUĞUNU (PROGRESS BAR) DOLDUR
    const progressBar = document.getElementById('progress');
    if (progressBar) {
        const yuzde = ((currentQ + 1) / questions.length) * 100;
        progressBar.style.width = `${yuzde}%`;
        progressBar.style.transition = "width 0.4s ease-in-out";
    }

    // 3. SORUYU VE ŞIKLARI EKRANA BAS
    document.getElementById('question-text').innerText = q.question;
    const container = document.getElementById('options-container');
    container.innerHTML = '';
    
    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.text;
        btn.onclick = () => {
            opt.points.forEach((p, index) => {
                const weight = index === 0 ? 4 : index === 1 ? 2 : 1;
                scores[p] = (scores[p] || 0) + weight;
            });
            currentQ++;
            if (currentQ < questions.length) loadQuestion();
            else finishTest();
        };
        container.appendChild(btn);
    });
}

async function finishTest() {
    document.getElementById('test-container').style.display = 'none';
    
    const loadingResult = document.getElementById('loading-result');
    loadingResult.innerHTML = `
        <div class="spinner" style="width: 50px; height: 50px; border: 5px solid #333; border-top-color: #fff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
        <h2>Ruh halin analiz ediliyor...</h2>
    `;
    loadingResult.style.display = 'block';
    
    // Diğer ekranları gizle
    if(document.getElementById('test-result')) document.getElementById('test-result').style.display = 'none';
    if(document.getElementById('mood-reveal-screen')) document.getElementById('mood-reveal-screen').style.display = 'none';
    if(document.querySelector('.ai-section')) document.querySelector('.ai-section').style.display = 'none';

    const primaryId = getPrimaryMoodKey();
    const mood = moodData[primaryId] || moodData['cerezlik'];
    const moodLine = `${mood.label}: ${mood.jargon}`;

    const moodTitleDiv = document.getElementById('mood-title');
    if(moodTitleDiv) moodTitleDiv.innerText = moodLine;
    
    const revealMoodTitle = document.getElementById('reveal-mood-title');
    if(revealMoodTitle) revealMoodTitle.innerText = moodLine;

    const bindTrailerButton = (button, movieData) => {
        const videos = movieData.videos ? movieData.videos.results : [];
        let trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer');
        if (!trailer) trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Teaser');
        if (!trailer) trailer = videos.find(v => v.site === 'YouTube');

        button.onclick = () => {
            if (trailer) {
                const testModalContent = document.querySelector('#test-modal .modal-content');
                const testVideoContainer = document.getElementById('video-container');
                const stopBtn = document.getElementById('stop-video-btn');

                testModalContent.classList.add('video-active');
                testVideoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;

                stopBtn.onclick = () => {
                    testModalContent.classList.remove('video-active');
                    testVideoContainer.innerHTML = '';
                };
            } else {
                window.open(`https://www.youtube.com/results?search_query=${movieData.title} fragman`, '_blank');
            }
        };
    };

    const renderAlgorithmMovie = (movieData) => {
        shownRecommendationIds.add(movieData.id);

        const algoPoster = document.getElementById('algo-poster');
        algoPoster.src = `${BACKDROP_URL}${movieData.backdrop_path || movieData.poster_path}`;

        document.getElementById('hero-title').innerText = movieData.title;
        const year = movieData.release_date ? movieData.release_date.split('-')[0] : '';
        const genres = movieData.genres ? movieData.genres.map(g => g.name).join(', ') : '';
        document.getElementById('hero-meta').innerText = [genres, year].filter(Boolean).join(' • ');
        document.getElementById('hero-desc').innerText = buildMoodLine(mood, movieData);
        document.getElementById('hero-more-btn').onclick = () => window.location.href = `/detay?id=${movieData.id}`;
        bindTrailerButton(document.getElementById('hero-trailer-btn'), movieData);
        saveMoodResult(primaryId, mood, movieData);
    };

    try {
        let firstMovieDetails = await getRecommendationForMood(mood, shownRecommendationIds);
        if (!firstMovieDetails && primaryId !== "cerezlik") {
            firstMovieDetails = await getRecommendationForMood(moodData.cerezlik, shownRecommendationIds);
        }

        if (!firstMovieDetails) {
            throw new Error("Bu mod için uygun film bulunamadı.");
        }

        renderAlgorithmMovie(firstMovieDetails);

        const suggestBtn = document.getElementById('suggest-another-btn');
        if (suggestBtn) {
            suggestBtn.onclick = async () => {
                const oldText = suggestBtn.innerHTML;
                suggestBtn.disabled = true;
                suggestBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Bakıyorum';

                try {
                    let nextMovie = await getRecommendationForMood(mood, shownRecommendationIds);
                    if (!nextMovie && shownRecommendationIds.size > 8) {
                        shownRecommendationIds = new Set();
                        nextMovie = await getRecommendationForMood(mood, shownRecommendationIds);
                    }

                    if (!nextMovie) {
                        throw new Error("Yeni öneri bulunamadı.");
                    }

                    renderAlgorithmMovie(nextMovie);
                } catch (error) {
                    console.error("Rastgele film çekerken hata:", error);
                    document.getElementById('hero-desc').innerText = "Bu mood için yeni film bulamadım; mevcut öneri hala iyi duruyor.";
                } finally {
                    suggestBtn.disabled = false;
                    suggestBtn.innerHTML = oldText;
                }
            };
        }

        const restartBtn = document.getElementById('restart-test-btn');
        if (restartBtn) {
            restartBtn.onclick = () => startTest();
        }

        loadingResult.style.display = 'none';
        const revealScreen = document.getElementById('mood-reveal-screen');
        const testResult = document.getElementById('test-result');
        const showMovieBtn = document.getElementById('show-movie-btn');

        if (revealScreen && testResult && showMovieBtn) {
            revealScreen.style.display = 'flex';
            testResult.style.display = 'none';
            showMovieBtn.onclick = () => {
                revealScreen.style.display = 'none';
                testResult.style.display = 'block';
            };
        } else if (testResult) {
            testResult.style.display = 'block';
        }
    } catch (e) {
        console.error("Test motoru API hatası:", e);
        loadingResult.innerHTML = "Filmler yüklenirken bir sorun oluştu, lütfen tekrar dene.";
    }
}

function closeTestModal() {
    const testModal = document.getElementById('test-modal');
    const testModalContent = document.querySelector('#test-modal .modal-content');
    const testVideoContainer = document.getElementById('video-container');

    if (testModal) testModal.style.display = 'none';
    if (testModalContent) testModalContent.classList.remove('video-active');
    if (testVideoContainer) testVideoContainer.innerHTML = '';
}

// Buton bağlamaları
async function saveMoodResult(moodKey, mood, movieData) {
    if (!movieData?.id) return;

    try {
        await fetch('/api/mood-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mood_key: moodKey,
                mood_label: mood.label || moodKey,
                mood_jargon: mood.jargon || '',
                movie_id: movieData.id,
                movie_title: movieData.title || movieData.original_title || 'İsimsiz Film',
                poster: movieData.poster_path || '',
                backdrop: movieData.backdrop_path || '',
                overview: movieData.overview || ''
            })
        });
    } catch (error) {
        console.warn('Mood geçmişi kaydedilemedi:', error);
    }
}

document.querySelector('.start-test-btn')?.addEventListener('click', (e) => { e.preventDefault(); startTest(); });
document.getElementById('close-test-modal')?.addEventListener('click', closeTestModal);
document.getElementById('test-modal')?.addEventListener('click', (event) => {
    if (event.target.id === 'test-modal') closeTestModal();
});

// --- INDEX: UYESIZ FILM ARAMA ---
document.addEventListener('DOMContentLoaded', () => {
    bindGuestMovieSearch();
    bindProfileEditor();
    bindFollowControls();
    bindSocialTabs();
    bindProfilePanels();
    bindMoodHistoryPage();
    bindDiscoverHome();
});

function bindGuestMovieSearch() {
    const modal = document.getElementById('guestSearchModal');
    const trigger = document.getElementById('guest-search-trigger');
    const closeBtn = document.getElementById('close-guest-search');
    const input = document.getElementById('guestSearchInput');
    const results = document.getElementById('guestSearchResults');
    let timer;

    if (!modal || !trigger || !input || !results) return;

    trigger.addEventListener('click', (event) => {
        event.preventDefault();
        modal.style.display = 'flex';
        input.value = '';
        results.innerHTML = '<p class="search-hint">Bir harf yaz, popüler filmleri sıralayalım.</p>';
        input.focus();
    });

    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');

    input.addEventListener('input', (event) => {
        clearTimeout(timer);
        const query = event.target.value.trim();
        if (query.length < 1) {
            results.innerHTML = '<p class="search-hint">Bir harf yaz, popüler filmleri sıralayalım.</p>';
            return;
        }

        results.innerHTML = '<p class="search-hint">Aranıyor...</p>';
        timer = setTimeout(() => searchMoviesForGuest(query), 250);
    });
}

async function searchMoviesForGuest(query) {
    const results = document.getElementById('guestSearchResults');
    if (!results) return;

    try {
        const params = new URLSearchParams({
            api_key: API_KEY,
            language: 'tr-TR',
            region: 'TR',
            include_adult: 'false',
            query
        });
        const response = await fetch(`${BASE_URL}/search/movie?${params.toString()}`);
        const data = await response.json();
        const movies = (data.results || [])
            .filter(movie => movie?.id && movie.title)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || (b.vote_count || 0) - (a.vote_count || 0))
            .slice(0, 10);

        if (!movies.length) {
            results.innerHTML = '<p class="search-hint">Sonuç bulamadım.</p>';
            return;
        }

        results.innerHTML = '';
        movies.forEach(movie => {
            const imgPath = movie.poster_path ? IMAGE_URL + movie.poster_path : 'https://via.placeholder.com/80x120?text=Yok';
            const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <img src="${imgPath}" alt="${movie.title}" class="search-result-img">
                <div class="result-info">
                    <h4>${movie.title} (${year})</h4>
                    <p class="result-subline"><i class="fa-solid fa-star"></i> ${Number(movie.vote_average || 0).toFixed(1)} - Popülerlik ${Math.round(movie.popularity || 0)}</p>
                    <div class="action-buttons">
                        <button class="action-btn info-btn" title="Film detayları"><i class="fa-solid fa-circle-info"></i></button>
                    </div>
                </div>
            `;
            item.querySelector('.info-btn').addEventListener('click', () => {
                window.location.href = `/detay?id=${movie.id}`;
            });
            results.appendChild(item);
        });
    } catch (error) {
        console.error('Misafir arama hatası:', error);
        results.innerHTML = '<p class="search-hint">Arama sırasında bir sorun oldu.</p>';
    }
}

function bindDiscoverHome() {
    const input = document.getElementById('discoverMovieSearchInput');
    const results = document.getElementById('discoverMovieSearchResults');
    const popular = document.getElementById('discoverPopularMovies');
    let timer;

    if (popular) {
        loadDiscoverRail(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=tr-TR&region=TR&page=1`, 'discoverPopularMovies', 12);
        loadDiscoverRail(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=tr-TR`, 'discoverTrendingMovies', 12);
        loadDiscoverRail(`${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=tr-TR&region=TR&page=1`, 'discoverUpcomingMovies', 12);
    }

    if (!input || !results) return;

    input.addEventListener('input', () => {
        clearTimeout(timer);
        const query = input.value.trim();
        if (query.length < 1) {
            results.innerHTML = '<div class="discover-empty-line">Film adı yazınca en popüler eşleşmeleri burada sıralayacağım.</div>';
            return;
        }

        results.innerHTML = '<div class="discover-empty-line">Aranıyor...</div>';
        timer = setTimeout(() => searchDiscoverMovies(query), 220);
    });
}

async function loadDiscoverRail(url, containerId, limit = 12) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="discover-empty-line">Filmler yükleniyor...</div>';

    try {
        const response = await fetch(url);
        const data = await response.json();
        const movies = (data.results || [])
            .filter(movie => movie?.id && movie.title && movie.poster_path)
            .slice(0, limit);

        renderDiscoverMovieCards(container, movies);
    } catch (error) {
        console.error('Ana sayfa film rafı yüklenemedi:', error);
        container.innerHTML = '<div class="discover-empty-line">Filmler yüklenemedi.</div>';
    }
}

async function searchDiscoverMovies(query) {
    const results = document.getElementById('discoverMovieSearchResults');
    if (!results) return;

    try {
        const params = new URLSearchParams({
            api_key: API_KEY,
            language: 'tr-TR',
            region: 'TR',
            include_adult: 'false',
            query
        });
        const response = await fetch(`${BASE_URL}/search/movie?${params.toString()}`);
        const data = await response.json();
        const movies = (data.results || [])
            .filter(movie => movie?.id && movie.title && movie.poster_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0) || (b.vote_count || 0) - (a.vote_count || 0))
            .slice(0, 8);

        if (!movies.length) {
            results.innerHTML = '<div class="discover-empty-line">Sonuç bulamadım.</div>';
            return;
        }

        results.innerHTML = '';
        const row = document.createElement('div');
        row.className = 'discover-search-grid';
        results.appendChild(row);
        renderDiscoverMovieCards(row, movies);
    } catch (error) {
        console.error('Ana sayfa arama hatası:', error);
        results.innerHTML = '<div class="discover-empty-line">Arama sırasında bir sorun oldu.</div>';
    }
}

function renderDiscoverMovieCards(container, movies) {
    if (!container) return;

    container.innerHTML = '';
    movies.forEach(movie => {
        const year = movie.release_date ? movie.release_date.split('-')[0] : '';
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'discover-movie-tile';
        card.innerHTML = `
            <img src="${IMAGE_URL + movie.poster_path}" alt="${movie.title}">
            <span>${movie.title}</span>
            <small>${year}${year ? ' · ' : ''}<i class="fa-solid fa-star"></i> ${Number(movie.vote_average || 0).toFixed(1)}</small>
        `;
        card.addEventListener('click', () => {
            window.location.href = `/detay?id=${movie.id}`;
        });
        container.appendChild(card);
    });
}

// --- PROFIL DUZENLEME: AVATAR + TMDB BACKDROP SECIMI ---
function bindProfileEditor() {
    const modal = document.getElementById('profileEditModal');
    const openBtn = document.querySelector('.edit-btn');
    const closeBtn = document.getElementById('close-profile-edit');
    const backdropInput = document.getElementById('profileBackdropSearch');
    const backdropResults = document.getElementById('profileBackdropResults');
    let timer;

    if (!modal || !openBtn) return;

    openBtn.addEventListener('click', (event) => {
        event.preventDefault();
        modal.style.display = 'flex';
    });

    if (closeBtn) closeBtn.addEventListener('click', () => modal.style.display = 'none');

    if (!backdropInput || !backdropResults) return;

    backdropInput.addEventListener('input', (event) => {
        clearTimeout(timer);
        const query = event.target.value.trim();
        if (query.length < 1) {
            backdropResults.innerHTML = '';
            return;
        }

        backdropResults.innerHTML = '<p class="search-hint">Arka planlar aranıyor...</p>';
        timer = setTimeout(() => searchBackdropMovies(query), 250);
    });
}

async function searchBackdropMovies(query) {
    const results = document.getElementById('profileBackdropResults');
    if (!results) return;

    try {
        const params = new URLSearchParams({
            api_key: API_KEY,
            language: 'tr-TR',
            include_adult: 'false',
            query
        });
        const response = await fetch(`${BASE_URL}/search/movie?${params.toString()}`);
        const data = await response.json();
        const movies = (data.results || [])
            .filter(movie => movie?.id && movie.backdrop_path)
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, 8);

        if (!movies.length) {
            results.innerHTML = '<p class="search-hint">Backdrop bulunan sonuç yok.</p>';
            return;
        }

        results.innerHTML = '';
        movies.forEach(movie => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'backdrop-result backdrop-movie-result';
            button.innerHTML = `
                <img src="${BACKDROP_URL + movie.backdrop_path}" alt="${movie.title}">
                <span>${movie.title}</span>
            `;
            button.addEventListener('click', () => loadBackdropImages(movie));
            results.appendChild(button);
        });
    } catch (error) {
        console.error('Backdrop arama hatası:', error);
        results.innerHTML = '<p class="search-hint">Arka planlar yüklenemedi.</p>';
    }
}

async function loadBackdropImages(movie) {
    const results = document.getElementById('profileBackdropResults');
    if (!results) return;

    results.innerHTML = '<p class="search-hint">Filmin diğer arka planları yükleniyor...</p>';

    try {
        const response = await fetch(`${BASE_URL}/movie/${movie.id}/images?api_key=${API_KEY}&include_image_language=tr,en,null`);
        const data = await response.json();
        const backdrops = [{ file_path: movie.backdrop_path }, ...(data.backdrops || [])]
            .filter(item => item?.file_path)
            .filter((item, index, list) => list.findIndex(other => other.file_path === item.file_path) === index)
            .slice(0, 18);

        if (!backdrops.length) {
            results.innerHTML = '<p class="search-hint">Bu film için arka plan bulunamadı.</p>';
            return;
        }

        results.innerHTML = `
            <div class="backdrop-gallery-head">
                <button type="button" class="backdrop-back-btn" onclick="searchBackdropMovies(document.getElementById('profileBackdropSearch').value.trim())">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <span>${movie.title} arka planları</span>
            </div>
        `;

        backdrops.forEach(image => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'backdrop-result';
            button.innerHTML = `
                <img src="${BACKDROP_URL + image.file_path}" alt="${movie.title} arka plan">
                <span>Seç</span>
            `;
            button.addEventListener('click', () => selectProfileBackdrop(image.file_path));
            results.appendChild(button);
        });
    } catch (error) {
        console.error('Backdrop galeri hatası:', error);
        results.innerHTML = '<p class="search-hint">Arka plan galerisi yüklenemedi.</p>';
    }
}

function selectProfileBackdrop(backdropPath) {
    const hiddenInput = document.getElementById('profileBackdropPath');
    const preview = document.getElementById('profileBackdropPreview');
    if (hiddenInput) hiddenInput.value = backdropPath;
    if (preview) preview.innerHTML = `<img src="${BACKDROP_URL + backdropPath}" alt="Seçilen arka plan">`;
}

function bindFollowControls() {
    const button = document.querySelector('.follow-btn[data-user-id]');
    if (!button) return;

    button.addEventListener('click', async () => {
        const userId = button.dataset.userId;
        button.disabled = true;

        try {
            const response = await fetch(`/api/follow/${userId}`, { method: 'POST' });
            const data = await response.json();

            if (!data.success) {
                alert(data.error || 'Takip işlemi yapılamadı.');
                return;
            }

            button.classList.toggle('is-following', data.following);
            const label = button.querySelector('span');
            if (label) label.innerText = data.following ? 'Takiptesin' : 'Takip Et';

            const followersCount = document.getElementById('followers-count');
            const followingCount = document.getElementById('following-count');
            if (followersCount) followersCount.innerText = data.followers_count;
            if (followingCount) followingCount.innerText = data.following_count;
        } catch (error) {
            console.error('Takip hatası:', error);
        } finally {
            button.disabled = false;
        }
    });
}

function bindSocialTabs() {
    const socialPanel = document.getElementById('profileSocialPanel');
    const tabs = document.querySelectorAll('.social-tab, .mini-social-btn, .social-stat-btn');
    const closeBtn = document.querySelector('.social-panel-close');
    const searchInput = document.getElementById('socialUserSearch');
    if (!tabs.length || !socialPanel) return;

    const showPanel = (panelId) => {
        if (!panelId) return;
        socialPanel.classList.add('open');

        document.querySelectorAll('.social-tab').forEach(item => {
            item.classList.toggle('active', item.dataset.socialPanel === panelId);
        });
        document.querySelectorAll('.social-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === panelId);
        });

        if (searchInput) {
            searchInput.value = '';
            document.querySelectorAll('.social-user-chip').forEach(chip => {
                chip.style.display = '';
            });
            searchInput.focus();
        }
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => showPanel(tab.dataset.socialPanel));
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => socialPanel.classList.remove('open'));
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.trim().toLocaleLowerCase('tr-TR');
            document.querySelectorAll('.social-panel.active .social-user-chip').forEach(chip => {
                const username = chip.innerText.trim().toLocaleLowerCase('tr-TR');
                chip.style.display = username.includes(query) ? '' : 'none';
            });
        });
    }
}

function bindProfilePanels() {
    document.querySelectorAll('.profile-panel-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const panel = document.getElementById(trigger.dataset.profilePanel);
            if (!panel) return;
            panel.hidden = !panel.hidden;
            if (!panel.hidden) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    document.querySelectorAll('.activity-panel-close').forEach(button => {
        button.addEventListener('click', () => {
            const panel = button.closest('.profile-activity-panel');
            if (panel) panel.hidden = true;
        });
    });
}

function bindMoodHistoryPage() {
    document.querySelectorAll('.history-group-toggle').forEach(button => {
        button.addEventListener('click', () => {
            const group = button.closest('.history-group');
            if (group) group.classList.toggle('is-open');
        });
    });
}
