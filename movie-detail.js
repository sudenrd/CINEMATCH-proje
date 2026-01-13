const API_KEY = '6b2e0878e3637f364a6ad51a5292b0fc';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    console.log("Film ID:", movieId); // Hata ayıklama için

    if (movieId) {
        getMovieDetails(movieId);
        setupComments();
    } else {
        document.getElementById('d-title').innerText = "Film bulunamadı.";
    }
});

async function getMovieDetails(id) {
    try {
        const [movieRes, creditsRes, videoRes] = await Promise.all([
            fetch(`${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=tr-TR`),
            fetch(`${BASE_URL}/movie/${id}/credits?api_key=${API_KEY}&language=tr-TR`),
            fetch(`${BASE_URL}/movie/${id}/videos?api_key=${API_KEY}&language=en-US`)
        ]);

        const movie = await movieRes.json();
        const credits = await creditsRes.json();
        const videos = await videoRes.json();

        // Arka Plan (Smooth Transition)
        const backdrop = document.getElementById('movie-backdrop');
        backdrop.style.backgroundImage = `url(${BACKDROP_PATH + movie.backdrop_path})`;

        // Poster ve Başlık
        document.getElementById('d-poster').src = movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/500x750';
        document.getElementById('d-title').innerText = movie.title;
        document.getElementById('d-year').innerText = movie.release_date ? movie.release_date.split('-')[0] : '';
        document.getElementById('d-rating').innerHTML = `<i class="fa-solid fa-star" style="color:#fb7299"></i> ${movie.vote_average.toFixed(1)}`;
        document.getElementById('d-runtime').innerText = movie.runtime + " dk";
        document.getElementById('d-overview').innerText = movie.overview || "Bu film için Türkçe özet bulunmuyor.";
        
        // Türler
        const genresContainer = document.getElementById('d-genres');
        genresContainer.innerHTML = movie.genres.map(g => `<span class="pill">${g.name}</span>`).join('');

        // Oyuncular
        const castContainer = document.getElementById('d-cast');
        credits.cast.slice(0, 6).forEach(actor => {
            const actorDiv = document.createElement('div');
            actorDiv.className = 'cast-card';
            actorDiv.innerHTML = `
                <img src="${actor.profile_path ? IMG_PATH + actor.profile_path : 'https://via.placeholder.com/100x150'}" alt="${actor.name}">
                <p><strong>${actor.name}</strong></p>
                <p style="color:#888; font-size:0.8rem">${actor.character}</p>
            `;
            castContainer.appendChild(actorDiv);
        });

        // Fragman
        const trailer = videos.results.find(v => v.type === 'Trailer' || v.type === 'Teaser');
        const trailerBtn = document.getElementById('d-trailer-btn');
        trailerBtn.onclick = () => {
            if (trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
            else alert("Fragman bulunamadı.");
        };

    } catch (error) {
        console.error("Veri çekme hatası:", error);
    }
}

// Yorum Sistemi Mantığı
let userLoggedIn = false; // Test için true yapabilirsin

// movie-detail.js içine ekle veya mevcut olanı güncelle

function setupComments() {
    const formArea = document.getElementById('comment-form-area');
    const commentsList = document.getElementById('comments-list');

    if (!userLoggedIn) {
        // "Oturum aç" kısmına onclick ekledik
        formArea.innerHTML = `
            <div class="login-prompt">
                Yorum yapabilmek için lütfen <a href="javascript:void(0)" onclick="openLoginModal()" style="color:#fb7299; font-weight:bold; text-decoration:underline;">oturum açın</a>.
            </div>
        `;
    } else {
        formArea.innerHTML = `
            <textarea id="comment-text" placeholder="Düşüncelerini paylaş..." class="comment-input"></textarea>
            <button onclick="addComment()" class="send-btn">Gönder</button>
        `;
    }

        commentsList.innerHTML = `
            <div id="no-comment-msg" style="text-align:center; padding:40px; color:#555;">
                <i class="fa-regular fa-comments" style="font-size:2.5rem; margin-bottom:15px; display:block; color:rgba(251, 114, 153, 0.3);"></i>
                Henüz yorum yapılmamış. İlk yorumu sen yap!
            </div>
        `;
}

// MODAL KONTROL FONKSİYONLARI
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if(modal) modal.style.display = 'flex';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if(modal) modal.style.display = 'none';
}

// Modal dışına tıklayınca kapatma
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        closeLoginModal();
    }
}
