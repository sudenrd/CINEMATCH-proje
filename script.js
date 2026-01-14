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
