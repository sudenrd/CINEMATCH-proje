const API_KEY = '6b2e0878e3637f364a6ad51a5292b0fc'; 
const BASE_URL = 'https://api.themoviedb.org/3';
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
    const loginBtn = document.querySelector('.nav-btn'); 
    const footerLoginBtn = document.querySelector('.footer-login-link');
    const closeLoginBtn = document.querySelector('.login-close'); 

    if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            if(loginModal) loginModal.style.display = 'flex'; 
        });
    }

    if (footerLoginBtn) {
        footerLoginBtn.addEventListener('click', (e) => {
            e.preventDefault(); 
            if(loginModal) loginModal.style.display = 'flex'; 
        });
    }

    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', () => {
            if(loginModal) loginModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            closeModal(); 
        }
        if (loginModal && event.target == loginModal) {
            loginModal.style.display = "none";
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
            const url2 = url.replace('page=1', 'page=2');
            const response2 = await fetch(url2);
            const data2 = await response2.json();
            allMovies = allMovies.concat(data2.results);
        }

        if (movieCount > 40) {
            const url3 = url.replace('page=1', 'page=3');
            const response3 = await fetch(url3);
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

            card.addEventListener('click', () => openModal(movie.id));

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Film çekme hatası:", error);
    }
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

        if (!movie.overview || movie.overview.trim() === "") {
            const enUrl = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`;
            const enResp = await fetch(enUrl);
            const enMov = await enResp.json();
            movie.overview = "(Türkçe çeviri bulunamadı, orijinal özet gösteriliyor)\n\n" + enMov.overview;
        }

        document.getElementById('m-title').innerText = movie.title;
        document.getElementById('m-year').innerText = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        document.getElementById('m-genres').innerText = movie.genres ? movie.genres.map(genre => genre.name).join(', ') : '';
        document.getElementById('m-desc').innerText = movie.overview;

        let ageRating = '-'; 
        if (movie.release_dates && movie.release_dates.results) {
            let trRelease = movie.release_dates.results.find(r => r.iso_3166_1 === 'TR');
            let usRelease = movie.release_dates.results.find(r => r.iso_3166_1 === 'US');

            if (trRelease && trRelease.release_dates[0].certification) {
                ageRating = trRelease.release_dates[0].certification; 
            } else if (usRelease && usRelease.release_dates[0].certification) {
                ageRating = usRelease.release_dates[0].certification; 
            }
        }
        
        const ageElement = document.getElementById('m-age');
        if(ageRating && ageRating !== '-') {
            ageElement.innerText = ageRating;
            ageElement.style.display = "inline-block"; 
        } else {
            ageElement.style.display = "none"; 
        }

        const bgImage = movie.backdrop_path ? movie.backdrop_path : movie.poster_path;
        if (bgImage) {
            document.getElementById('m-img').src = BACKDROP_URL + bgImage;
        } else {
            document.getElementById('m-img').src = 'https://via.placeholder.com/800x450?text=Resim+Yok';
        }

        const trailerBtn = document.getElementById('m-trailer');
        let trailerKey = null;

        if (vidData.results && vidData.results.length > 0) {
            let trailer = vidData.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
            if (!trailer) trailer = vidData.results.find(v => v.site === 'YouTube' && v.type === 'Teaser');
            
            if (trailer) trailerKey = trailer.key;
        }

        trailerBtn.onclick = function() {
            if (trailerKey) {
                playVideo(trailerKey); 
            } else {
                window.open(`https://www.youtube.com/results?search_query=${movie.original_title} official trailer english`, '_blank');
            }
        };

        modal.style.display = "flex";

    } catch (error) {
        console.error("Detay hatası:", error);
    }
}

function playVideo(videoKey) {
    if(modalCard) modalCard.classList.add('video-mode');

    if(videoContainer) {
        videoContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowfullscreen>
            </iframe>
        `;
    }
}
function stopVideo() {
    if(modalCard) modalCard.classList.remove('video-mode');
    if(videoContainer) videoContainer.innerHTML = '';
}

function closeModal() {
    modal.style.display = "none";
    stopVideo(); 
}