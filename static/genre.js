const API_KEY = API_CONFIG.API_KEY;
const BASE_URL = API_CONFIG.BASE_URL;
const IMAGE_URL = "https://image.tmdb.org/t/p/w500";

const MOVIES_PER_BATCH = 40;
const MAX_TMDB_PAGE = 500;
const DEFAULT_SORT_BY = "vote_average.desc";

let currentPage = 1;
let currentId = "";
let isLoading = false;
let hasMore = true;
let totalPages = 1;
const renderedMovieIds = new Set();
const renderedMovieTitles = new Set();

const categoryAliases = {
    tr_sinemasi: "tr",
    kore_sinemasi: "ko",
    iran_sinemasi: "fa",
    iran: "fa",
    kore: "ko",
    turk: "tr"
};

const categoryMap = {
    aksiyon: { genres: "28", minVote: 120 },
    macera: { genres: "12", minVote: 100 },
    animasyon: { genres: "16", minVote: 80 },
    komedi: { genres: "35", minVote: 100 },
    suc: { genres: "80", minVote: 100 },
    polisiye: { genres: "80|9648|53", minVote: 80 },
    belgesel: { genres: "99", minVote: 20, sortBy: "vote_average.desc", voteAverageMin: 6.5 },
    dram: { genres: "18", minVote: 120 },
    aile: { genres: "10751", minVote: 60 },
    fantastik: { genres: "14", minVote: 80 },
    tarih: { genres: "36", minVote: 60 },
    korku: { genres: "27", minVote: 80 },
    muzik: { genres: "10402", minVote: 30 },
    gizem: { genres: "9648", minVote: 80 },
    romantik: { genres: "10749", minVote: 80 },
    bilim_kurgu: { genres: "878", minVote: 100 },
    gerilim: { genres: "53", minVote: 120 },
    savas: { genres: "10752", minVote: 50 },
    vahsi_bati: { genres: "37", minVote: 25 },

    uzay: { genres: "878|12", keywords: "9882|3801|3386|3388|9951", minVote: 40 },
    zaman_yolculugu: { genres: "878|12|9648", keywords: "4379", minVote: 30 },
    soygun: { genres: "80|28|53", keywords: "10051|191845|321964|239663", minVote: 40 },
    psikolojik: { genres: "53|18|9648", keywords: "12565|374644|184312|226106", minVote: 40 },
    distopya: { genres: "878|53|18", keywords: "4565|355867|348204|372757", minVote: 25 },
    mafya: { genres: "80|18|53", keywords: "10391|155538|176098|335874|156779", minVote: 30 },
    hacker: { genres: "53|80|878", keywords: "2157|303918|361357", minVote: 15 },
    hayatta_kalma: { genres: "53|12|18|878", keywords: "10349|50009|278646", minVote: 30 },
    seri_katil: { genres: "80|53|27", keywords: "10714|227428|372225", minVote: 40 },
    yapay_zeka: { genres: "878|53|18", keywords: "310|371846|375504|371847", minVote: 20 },
    post_apocalyptic: { genres: "878|28|18|53", keywords: "4458|359337|372145|372741", minVote: 20 },
    cyberpunk: { genres: "878|28|53|16", keywords: "12190|309101|371866", minVote: 15 },
    intikam: { genres: "28|53|80|18", keywords: "9748|191045|220435|196399", minVote: 40 },

    anime: { genres: "16", keywords: "210024", language: "ja", minVote: 15 },
    bagimsiz: { keywords: "281237", minVote: 10, sortBy: "vote_average.desc", voteAverageMin: 6.5 },
    kult: { keywords: "374649|10123|207268", minVote: 150, sortBy: "vote_average.desc", voteAverageMin: 7 },
    ters_kose: {
        movieIds: [
            11324, 670, 745, 550, 807, 629, 1592, 1933, 210577, 1124,
            2649, 2832, 46738, 25376, 411088, 176, 4553, 4552, 488623, 290098,
            5876, 6947, 21208, 328425, 10494, 539, 426, 293670, 568091, 10795,
            77, 146233, 489999, 1586, 109421, 111083, 63311, 30018, 419430, 15472
        ]
    },
    cerezlik: { genres: "35|10751|16|12", runtimeMax: 105, minVote: 60 },
    uzun_basyapit: { runtimeMin: 150, minVote: 250, sortBy: "vote_average.desc", voteAverageMin: 7 },
    slowburn: {
        minVote: 50,
        sortBy: "vote_average.desc",
        queries: [
            { genres: "18|53|9648", keywords: "277551|367766|374050|374206|245724", minVote: 10 },
            { genres: "18|53|9648", runtimeMin: 105, voteAverageMin: 6.8, minVote: 80 }
        ]
    },
    beyin_yakan: {
        movieIds: [
            27205, 77, 157336, 206487, 14337, 220289, 329865, 577922, 141, 603,
            63, 14139, 31011, 83542, 1018, 1381, 1124, 181886, 26466, 45612,
            300668, 264660, 17431, 38, 4977, 2666, 13363, 1954, 4960, 1903,
            152795, 1090, 1946, 593, 1398, 68, 473, 431, 805627, 180
        ]
    },
    cozy: { genres: "35|10751|10749|16", keywords: "326774|326004|329716|304995|6054|248927", minVote: 15 },
    karanlik: { genres: "53|27|80|18", keywords: "10123|207268|10714|12565", minVote: 40 },
    depresif: { genres: "18|10749", keywords: "894|9872|9957|4232|1647|181324", minVote: 25, sortBy: "vote_average.desc" },
    ilham_veren: { genres: "18|10751", keywords: "191446|155170|281585|3929|11436|9672", minVote: 25 },
    arthouse: {
        keywords: "11130|318182|329578|293336",
        minVote: 5,
        sortBy: "vote_average.desc",
        voteAverageMin: 6.5
    },
    deneysel: { keywords: "293336|11130|318182", minVote: 5, sortBy: "vote_average.desc" },

    antihero: { genres: "28|80|18|53", keywords: "2095|285809|252203", minVote: 25 },
    coming_of_age: { genres: "18|35|10749", keywords: "10683|234042|296608|10873", minVote: 30 },

    tr: { language: "tr", minVote: 10 },
    yesilcam: { language: "tr", releaseMax: 1995, minVote: 5, voteAverageMin: 5.8 },
    ko: { language: "ko", minVote: 20 },
    fa: { language: "fa", minVote: 10, sortBy: "vote_average.desc" },
    japon: { language: "ja", minVote: 20 },
    fransiz: { language: "fr", minVote: 20 },
    italyan: { language: "it", minVote: 80 },
    hint: {
        minVote: 80,
        queries: [
            { language: "hi" },
            { language: "ta" },
            { language: "te" },
            { language: "ml" },
            { language: "bn" }
        ]
    },
    ispanyol: { language: "es", minVote: 500 },
    alman: { language: "de", minVote: 200 },
    cin: { language: "zh", originCountry: "CN", minVote: 100 },
    hong_kong: { originCountry: "HK", minVote: 100 },
    latin_amerika: {
        minVote: 200,
        queries: [
            { originCountry: "MX" },
            { originCountry: "AR" },
            { originCountry: "BR" },
            { originCountry: "CL" },
            { originCountry: "CO" }
        ]
    },
    iskandinav: {
        minVote: 10,
        queries: [
            { language: "sv" },
            { language: "da" },
            { language: "no" },
            { language: "fi" },
            { language: "is" }
        ]
    },

    romantik_komedi: { genres: "35,10749", minVote: 300, voteAverageMin: 6.5 },
    edebi_uyarlama: { genres: "18|10749|36", keywords: "818|186849|18712|222216", minVote: 30 },
    oscar_secisi: {
        movieIds: [
            278, 238, 424, 122, 496243, 13, 274, 289, 1422, 872585,
            545611, 490132, 98, 279, 284, 705, 510, 597, 314365, 194662,
            76203, 68734, 74643, 45269, 12162, 12405, 6977, 70, 1574, 453,
            14, 1934, 197, 33, 581, 380, 792, 783, 703, 1366,
            9277, 1051, 3116, 10633, 15121, 947, 511809, 665, 826, 770,
            223, 3078, 654, 11113, 11202, 11778, 12102, 399055, 776503, 581734
        ]
    },
    festival_odullu: {
        movieIds: [
            496243, 680, 423, 531428, 505192, 265169, 60243, 758866,
            915935, 965150, 467244, 927547, 86837, 8967, 152584, 401246,
            374473, 314402, 38368, 2009, 1116, 1777, 1807, 11447,
            16, 11489, 30020, 11159, 11902, 5801, 426426, 179144,
            209274, 517104, 660120, 497828, 265177, 290098, 491584, 705996
        ]
    },
    aglamak_garanti: { genres: "18|10749", keywords: "9872|1647|894", minVote: 30, sortBy: "vote_average.desc" }
};

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    currentId = (params.get("id") || "").trim();

    const category = getCategoryConfig(currentId);
    const title = params.get("name") || category?.label || "Keşfet";
    const titleElement = document.getElementById("genre-name-title");

    if (titleElement) {
        titleElement.innerText = title;
    }

    document.title = `CINEMATCH - ${title}`;

    const loadMoreButton = document.getElementById("load-more");
    if (loadMoreButton) {
        loadMoreButton.addEventListener("click", fetchContent);
    }

    fetchContent();

    window.addEventListener("scroll", () => {
        const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 900;
        if (nearBottom && !isLoading && hasMore) {
            fetchContent();
        }
    });
});

async function fetchContent() {
    if (isLoading || !hasMore) return;

    const category = getCategoryConfig(currentId);
    const list = document.getElementById("genre-movies-list");

    if (!list) return;

    if (!category) {
        showMessage("Bu kategori için filtre bulunamadı.");
        hasMore = false;
        updateLoadMoreButton();
        return;
    }

    isLoading = true;
    updateLoadMoreButton();

    try {
        const movies = await fetchCategoryMovies(category, currentPage);
        const seenBatchTitles = new Set();
        const freshMovies = movies.filter(movie => {
            if (!movie || !movie.id || !movie.poster_path || !hasUsefulTitle(movie)) {
                return false;
            }

            const titleKey = getTitleKey(movie);

            return !renderedMovieIds.has(movie.id) &&
                titleKey &&
                !renderedMovieTitles.has(titleKey) &&
                !seenBatchTitles.has(titleKey) &&
                seenBatchTitles.add(titleKey);
        });

        const batch = freshMovies.slice(0, MOVIES_PER_BATCH);

        if (batch.length === 0 && currentPage === 1) {
            showMessage("Bu kategori için film bulunamadı.");
        }

        batch.forEach(renderMovieCard);

        currentPage += 1;
        hasMore = currentPage <= totalPages && currentPage <= MAX_TMDB_PAGE;
    } catch (error) {
        console.error("Kategori filmleri yüklenemedi:", error);
        showMessage("Filmler yüklenirken bir sorun oluştu. Lütfen tekrar dene.");
    } finally {
        isLoading = false;
        updateLoadMoreButton();
    }
}

async function fetchCategoryMovies(category, page) {
    if (category.movieIds?.length) {
        return fetchCuratedMovies(category, page);
    }

    const queries = category.queries?.length
        ? category.queries.map(query => ({ ...category, ...query, queries: undefined }))
        : [category];

    const responses = await Promise.all(
        queries.map(query => fetchJson(buildDiscoverUrl(query, page)))
    );

    totalPages = Math.min(
        MAX_TMDB_PAGE,
        Math.max(1, ...responses.map(data => data.total_pages || 1))
    );

    return sortMovies(
        responses.flatMap(data => data.results || []),
        category.sortBy || DEFAULT_SORT_BY
    );
}

async function fetchCuratedMovies(category, page) {
    const movies = await Promise.all(
        category.movieIds.map(id => {
            const params = new URLSearchParams({
                api_key: API_KEY,
                language: "tr-TR"
            });

            return fetchJson(`${BASE_URL}/movie/${id}?${params.toString()}`);
        })
    );

    const sortedMovies = sortMovies(movies, category.sortBy || DEFAULT_SORT_BY);

    totalPages = Math.max(1, Math.ceil(sortedMovies.length / MOVIES_PER_BATCH));

    return sortedMovies.slice((page - 1) * MOVIES_PER_BATCH, page * MOVIES_PER_BATCH);
}

function buildDiscoverUrl(category, page) {
    const params = new URLSearchParams({
        api_key: API_KEY,
        language: "tr-TR",
        region: "TR",
        page: String(page),
        sort_by: category.sortBy || DEFAULT_SORT_BY,
        include_adult: "false",
        include_video: "false",
        "vote_count.gte": String(category.minVote ?? 80)
    });

    appendParam(params, "with_genres", category.genres);
    appendParam(params, "with_keywords", category.keywords);
    appendParam(params, "with_original_language", category.language);
    appendParam(params, "with_origin_country", category.originCountry);
    appendParam(params, "with_runtime.gte", category.runtimeMin);
    appendParam(params, "with_runtime.lte", category.runtimeMax);
    appendParam(params, "vote_average.gte", category.voteAverageMin);

    if (category.releaseMin) {
        params.set("primary_release_date.gte", `${category.releaseMin}-01-01`);
    }

    if (category.releaseMax) {
        params.set("primary_release_date.lte", `${category.releaseMax}-12-31`);
    } else {
        params.set("primary_release_date.lte", new Date().toISOString().slice(0, 10));
    }

    return `${BASE_URL}/discover/movie?${params.toString()}`;
}

async function fetchJson(url) {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.status_message || `TMDB hata kodu: ${response.status}`);
    }

    return data;
}

function appendParam(params, key, value) {
    if (value !== undefined && value !== null && value !== "") {
        params.set(key, String(value));
    }
}

function sortMovies(movies, sortBy) {
    const uniqueMovies = [];
    const seenIds = new Set();

    movies.forEach(movie => {
        if (movie?.id && !seenIds.has(movie.id)) {
            seenIds.add(movie.id);
            uniqueMovies.push(movie);
        }
    });

    if (sortBy === "vote_average.desc") {
        return uniqueMovies.sort((a, b) => {
            const ratingDiff = (b.vote_average || 0) - (a.vote_average || 0);
            return ratingDiff || (b.vote_count || 0) - (a.vote_count || 0);
        });
    }

    if (sortBy === "primary_release_date.desc") {
        return uniqueMovies.sort((a, b) => {
            return new Date(b.release_date || 0) - new Date(a.release_date || 0);
        });
    }

    return uniqueMovies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

function getDisplayTitle(movie) {
    return (movie.title || movie.original_title || "").trim();
}

function hasUsefulTitle(movie) {
    const title = getDisplayTitle(movie);
    const normalized = title.toLowerCase();

    if (!title || title.length < 2) return false;
    if (/^\(?null\)?$/.test(normalized)) return false;
    if (/^untitled\b/.test(normalized)) return false;
    if (/^[\W_]+$/.test(title)) return false;

    return true;
}

function getTitleKey(movie) {
    return getDisplayTitle(movie).toLowerCase().replace(/\s+/g, " ").trim();
}

function renderMovieCard(movie) {
    const list = document.getElementById("genre-movies-list");
    const card = document.createElement("div");
    const poster = document.createElement("img");
    const info = document.createElement("div");
    const title = document.createElement("p");
    const rating = document.createElement("span");

    renderedMovieIds.add(movie.id);
    renderedMovieTitles.add(getTitleKey(movie));

    card.className = "movie-card";
    card.addEventListener("click", () => {
        window.location.href = `/detay?id=${movie.id}`;
    });

    poster.src = `${IMAGE_URL}${movie.poster_path}`;
    const movieTitle = getDisplayTitle(movie);

    poster.alt = movieTitle || "Film afişi";
    poster.loading = "lazy";

    info.className = "movie-card-info";
    title.className = "m-title";
    title.innerText = movieTitle;

    rating.className = "m-rating";
    rating.innerText = `Puan ${Number(movie.vote_average || 0).toFixed(1)}`;

    info.append(title, rating);
    card.append(poster, info);
    list.appendChild(card);
}

function showMessage(message) {
    const list = document.getElementById("genre-movies-list");
    if (!list) return;

    list.innerHTML = `
        <p style="grid-column:1/-1;text-align:center;color:#777;margin-top:50px;">
            ${message}
        </p>
    `;
}

function updateLoadMoreButton() {
    const loadMoreButton = document.getElementById("load-more");
    if (!loadMoreButton) return;

    loadMoreButton.disabled = isLoading;
    loadMoreButton.innerText = isLoading ? "Yükleniyor..." : "Daha Fazla Yükle";
    loadMoreButton.style.display = hasMore ? "block" : "none";
}

function getCategoryConfig(id) {
    const key = categoryAliases[id] || id;

    if (categoryMap[key]) {
        return categoryMap[key];
    }

    if (id && !Number.isNaN(Number(id))) {
        return { genres: id, minVote: 50 };
    }

    return null;
}
