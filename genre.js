const API_KEY = '6b2e0878e3637f364a6ad51a5292b0fc';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';

let currentPage = 1;
let currentId = "";
let currentType = "";
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    currentId = params.get('id');
    currentType = params.get('type');
    const name = params.get('name');

    document.getElementById('genre-name-title').innerText = name || "Keşfet";
    
    fetchContent();

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 && !isLoading) {
            fetchContent();
        }
    });
});

async function fetchContent() {
    if (isLoading) return;
    isLoading = true;

    let lang = "tr-TR";
    let minVote = 500; 
    let sortBy = "vote_average.desc";

    let endpoint = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=${lang}&page=${currentPage}&sort_by=${sortBy}&vote_count.gte=${minVote}`;
    
    if (currentType === 'keyword') {
        endpoint += `&with_keywords=${currentId}`;
    } else {
        endpoint += `&with_genres=${currentId}`;
    }

    try {
        const resp = await fetch(endpoint);
        const data = await resp.json();
        const list = document.getElementById('genre-movies-list');

        if (data.results.length === 0 && currentPage === 1) {
            list.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:#555; margin-top:50px;">Bu kategoride şu an film bulunamadı.</p>`;
            return;
        }

        data.results.forEach(movie => {
            if (!movie.poster_path) return;

            const card = document.createElement('div');
            card.className = 'movie-card';
            card.innerHTML = `
                <img src="${IMAGE_URL + movie.poster_path}" alt="${movie.title}">
                <div class="movie-card-info">
                    <p class="m-title">${movie.title}</p>
                    <span class="m-rating"><i class="fa-solid fa-star"></i> ${movie.vote_average.toFixed(1)}</span>
                </div>
            `;
            
            card.onclick = () => {
                location.href = `movie-detail.html?id=${movie.id}`;
            };
            list.appendChild(card);
        });

        currentPage++;
        isLoading = false;
    } catch (err) {
        console.error("Yükleme hatası:", err);
        isLoading = false;
    }
}
