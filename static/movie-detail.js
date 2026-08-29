const API_KEY = API_CONFIG.API_KEY;
const BASE_URL = API_CONFIG.BASE_URL;
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/original';

let currentMovieId = null;
let currentMovieData = null;
let userLoggedIn = false;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentMovieId = urlParams.get('id');

    bindActorModal();
    bindDiscussionTabs();

    if (currentMovieId) {
        getMovieDetails(currentMovieId);
        setupDiscussion(currentMovieId);
    } else {
        document.getElementById('d-title').innerText = 'Film bulunamadı.';
    }
});

function escapeHtml(value = '') {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function getAvatarMarkup(item) {
    const username = item?.username || 'Kullanıcı';
    const profileUrl = escapeHtml(item?.profile_url || '#');
    const avatarPath = item?.avatar_path;
    const safeName = escapeHtml(username);

    if (avatarPath) {
        return `
            <a class="discussion-avatar" href="${profileUrl}" aria-label="${safeName} profili">
                <img src="/static/${escapeHtml(avatarPath)}" alt="${safeName}">
            </a>
        `;
    }

    return `
        <a class="discussion-avatar" href="${profileUrl}" aria-label="${safeName} profili">
            <span>${safeName.charAt(0).toUpperCase()}</span>
        </a>
    `;
}

function getUserMetaMarkup(item, detailLine = '') {
    return `
        <div class="discussion-user">
            ${getAvatarMarkup(item)}
            <div>
                <a class="profile-name-link" href="${escapeHtml(item?.profile_url || '#')}">${escapeHtml(item?.username || 'Kullanıcı')}</a>
                <span>${escapeHtml(detailLine || item?.created_at || '')}</span>
            </div>
        </div>
    `;
}

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
        currentMovieData = movie;

        const backdrop = document.getElementById('movie-backdrop');
        const backdropPath = movie.backdrop_path || movie.poster_path;
        backdrop.style.backgroundImage = backdropPath ? `url(${BACKDROP_PATH + backdropPath})` : 'none';

        document.getElementById('d-poster').src = movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/500x750?text=Yok';
        document.getElementById('d-title').innerText = movie.title || movie.original_title || 'İsimsiz Film';
        document.getElementById('d-year').innerText = movie.release_date ? movie.release_date.split('-')[0] : '';
        document.getElementById('d-rating').innerHTML = `<i class="fa-solid fa-star" style="color:#fb7299"></i> ${Number(movie.vote_average || 0).toFixed(1)}`;
        document.getElementById('d-runtime').innerText = movie.runtime ? `${movie.runtime} dk` : '';
        document.getElementById('d-overview').innerText = movie.overview || 'Bu film için Türkçe özet bulunmuyor.';

        const genresContainer = document.getElementById('d-genres');
        genresContainer.innerHTML = '';
        (movie.genres || []).forEach(genre => {
            const pill = document.createElement('span');
            pill.className = 'pill';
            pill.innerText = genre.name;
            genresContainer.appendChild(pill);
        });

        renderCast(credits.cast || []);

        const trailer = videos.results.find(v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
        const trailerBtn = document.getElementById('d-trailer-btn');
        trailerBtn.onclick = () => {
            if (trailer) window.open(`https://www.youtube.com/watch?v=${trailer.key}`, '_blank');
            else alert('Fragman bulunamadı.');
        };
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        document.getElementById('d-title').innerText = 'Film bilgileri yüklenemedi.';
    }
}

function renderCast(cast) {
    const castContainer = document.getElementById('d-cast');
    castContainer.innerHTML = '';

    if (cast.length === 0) {
        castContainer.innerHTML = '<p class="muted-line">Oyuncu bilgisi bulunamadı.</p>';
        return;
    }

    cast.forEach(actor => {
        const actorDiv = document.createElement('button');
        actorDiv.className = 'cast-card';
        actorDiv.type = 'button';
        actorDiv.innerHTML = `
            <img src="${actor.profile_path ? IMG_PATH + actor.profile_path : 'https://via.placeholder.com/120x180?text=Yok'}" alt="${escapeHtml(actor.name)}">
            <p><strong>${escapeHtml(actor.name)}</strong></p>
            <p class="cast-character">${escapeHtml(actor.character || 'Rol bilgisi yok')}</p>
        `;
        actorDiv.addEventListener('click', () => openActorModal(actor.id));
        castContainer.appendChild(actorDiv);
    });
}

function bindActorModal() {
    const actorModal = document.getElementById('actorModal');
    const closeBtn = document.getElementById('close-actor-modal');

    if (closeBtn) closeBtn.addEventListener('click', closeActorModal);
    if (actorModal) {
        actorModal.addEventListener('click', (event) => {
            if (event.target === actorModal) closeActorModal();
        });
    }
}

async function openActorModal(personId) {
    const actorModal = document.getElementById('actorModal');
    const actorMovies = document.getElementById('actor-movies');

    actorModal.style.display = 'flex';
    document.getElementById('actor-name').innerText = 'Yükleniyor...';
    document.getElementById('actor-meta').innerText = '';
    document.getElementById('actor-bio').innerText = '';
    document.getElementById('actor-photo').src = 'https://via.placeholder.com/300x450?text=Yok';
    actorMovies.innerHTML = '<p class="muted-line">Filmografi yükleniyor...</p>';

    try {
        const [personRes, creditsRes] = await Promise.all([
            fetch(`${BASE_URL}/person/${personId}?api_key=${API_KEY}&language=tr-TR`),
            fetch(`${BASE_URL}/person/${personId}/movie_credits?api_key=${API_KEY}&language=tr-TR`)
        ]);
        let person = await personRes.json();
        const credits = await creditsRes.json();

        if (!person.biography) {
            const enPersonRes = await fetch(`${BASE_URL}/person/${personId}?api_key=${API_KEY}&language=en-US`);
            const enPerson = await enPersonRes.json();
            person = { ...person, biography: enPerson.biography };
        }

        document.getElementById('actor-photo').src = person.profile_path ? IMG_PATH + person.profile_path : 'https://via.placeholder.com/300x450?text=Yok';
        document.getElementById('actor-name').innerText = person.name || 'Oyuncu';
        document.getElementById('actor-meta').innerText = [
            person.birthday ? `Doğum: ${formatDate(person.birthday)}` : '',
            person.place_of_birth || ''
        ].filter(Boolean).join(' - ');
        document.getElementById('actor-bio').innerText = person.biography || 'Bu oyuncu için biyografi bilgisi bulunamadı.';

        renderActorMovies(credits.cast || []);
    } catch (error) {
        console.error('Oyuncu bilgisi alınamadı:', error);
        document.getElementById('actor-bio').innerText = 'Oyuncu bilgileri yüklenemedi.';
        actorMovies.innerHTML = '';
    }
}

function closeActorModal() {
    const actorModal = document.getElementById('actorModal');
    if (actorModal) actorModal.style.display = 'none';
}

function renderActorMovies(movies) {
    const actorMovies = document.getElementById('actor-movies');
    const sortedMovies = movies
        .filter(movie => movie.id && movie.poster_path && movie.title)
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 24);

    if (sortedMovies.length === 0) {
        actorMovies.innerHTML = '<p class="muted-line">Filmografi bulunamadı.</p>';
        return;
    }

    actorMovies.innerHTML = '';
    sortedMovies.forEach(movie => {
        const card = document.createElement('button');
        card.className = 'actor-movie-card';
        card.type = 'button';
        card.innerHTML = `
            <img src="${IMG_PATH + movie.poster_path}" alt="${escapeHtml(movie.title)}">
            <span>${escapeHtml(movie.title)}</span>
        `;
        card.addEventListener('click', () => {
            window.location.href = `/detay?id=${movie.id}`;
        });
        actorMovies.appendChild(card);
    });
}

function formatDate(dateValue) {
    const [year, month, day] = dateValue.split('-');
    return `${day}.${month}.${year}`;
}

function bindDiscussionTabs() {
    const tabs = document.querySelectorAll('.discussion-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            document.querySelectorAll('.discussion-panel').forEach(panel => panel.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.panel)?.classList.add('active');
        });
    });
}

async function setupDiscussion(movieId) {
    const formArea = document.getElementById('comment-form-area');
    const reviewFormArea = document.getElementById('review-form-area');

    try {
        const sessionRes = await fetch('/api/session');
        const sessionData = await sessionRes.json();
        userLoggedIn = sessionData.logged_in;

        if (!userLoggedIn) {
            formArea.innerHTML = loginPrompt('Yorum yapmak için oturum aç.');
            reviewFormArea.innerHTML = loginPrompt('Puan verip inceleme yazmak için oturum aç.');
        } else {
            formArea.innerHTML = `
                <div class="comment-box">
                    <textarea id="comment-text" placeholder="Kısa yorumunu bırak..." class="comment-input" maxlength="1000"></textarea>
                    <button onclick="addComment()" class="send-btn">Gönder</button>
                </div>
            `;
            reviewFormArea.innerHTML = `
                <div class="review-box">
                    <div class="review-rating-row">
                        <label for="review-rating">Puanın</label>
                        <select id="review-rating" class="review-rating-select">
                            <option value="5">5 - bayıldım</option>
                            <option value="4.5">4.5</option>
                            <option value="4">4</option>
                            <option value="3.5">3.5</option>
                            <option value="3">3</option>
                            <option value="2.5">2.5</option>
                            <option value="2">2</option>
                            <option value="1.5">1.5</option>
                            <option value="1">1</option>
                            <option value="0.5">0.5</option>
                        </select>
                    </div>
                    <textarea id="review-text" placeholder="Bu film sende ne bıraktı? İncelemeni yaz..." class="comment-input review-input" maxlength="2500"></textarea>
                    <button onclick="addReview()" class="send-btn">İncelemeyi yayınla</button>
                </div>
            `;
        }

        await Promise.all([loadComments(movieId), loadReviews(movieId)]);
    } catch (error) {
        console.error('Topluluk alanı yüklenemedi:', error);
    }
}

function loginPrompt(text) {
    return `
        <div class="login-prompt">
            <p>${text} <a href="javascript:void(0)" onclick="openLoginModal()">Giriş yap</a>.</p>
        </div>
    `;
}

async function loadComments(movieId) {
    const commentsList = document.getElementById('comments-list');
    const response = await fetch(`/api/comments/${movieId}`);
    const data = await response.json();
    const comments = data.comments || [];

    if (comments.length === 0) {
        commentsList.innerHTML = emptyMessage('fa-regular fa-comments', 'Henüz yorum yok. İlk kısa not senden gelsin.');
        return;
    }

    commentsList.innerHTML = '';
    comments.forEach(comment => commentsList.appendChild(createCommentCard(comment)));
}

function createCommentCard(comment) {
    const card = document.createElement('div');
    card.className = 'comment-card';

    const actions = document.createElement('div');
    actions.className = 'comment-actions';

    const likeBtn = document.createElement('button');
    likeBtn.className = `mini-action-btn ${comment.liked_by_me ? 'active' : ''}`;
    likeBtn.type = 'button';
    likeBtn.innerHTML = `<i class="fa-solid fa-heart"></i> <span>${comment.like_count || 0}</span>`;
    likeBtn.addEventListener('click', () => toggleCommentLike(comment.id));
    actions.appendChild(likeBtn);

    if (comment.can_delete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'mini-action-btn danger';
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.addEventListener('click', () => deleteComment(comment.id));
        actions.appendChild(deleteBtn);
    }

    card.innerHTML = `
        <div class="comment-header">
            ${getUserMetaMarkup(comment)}
        </div>
        <p>${escapeHtml(comment.content)}</p>
    `;
    card.appendChild(actions);
    return card;
}

async function addComment() {
    const input = document.getElementById('comment-text');
    const content = input.value.trim();

    if (content.length < 2) return;

    const response = await fetch(`/api/comments/${currentMovieId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    const data = await response.json();

    if (!data.success) {
        alert(data.error || 'Yorum eklenemedi.');
        return;
    }

    input.value = '';
    await loadComments(currentMovieId);
}

async function toggleCommentLike(commentId) {
    if (!userLoggedIn) {
        openLoginModal();
        return;
    }

    const response = await fetch(`/api/comments/${commentId}/like`, { method: 'POST' });
    const data = await response.json();
    if (!data.success) {
        alert(data.error || 'Begeni kaydedilemedi.');
        return;
    }
    await loadComments(currentMovieId);
}

async function deleteComment(commentId) {
    if (!confirm('Yorumu silmek istiyor musun?')) return;

    const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!data.success) {
        alert(data.error || 'Yorum silinemedi.');
        return;
    }
    await loadComments(currentMovieId);
}

async function loadReviews(movieId) {
    const reviewsList = document.getElementById('reviews-list');
    const response = await fetch(`/api/reviews/${movieId}`);
    const data = await response.json();
    const reviews = data.reviews || [];

    if (reviews.length === 0) {
        reviewsList.innerHTML = emptyMessage('fa-solid fa-star-half-stroke', 'Henüz inceleme yok. İlk puanlı yazıyı sen bırak.');
        return;
    }

    const summary = document.createElement('div');
    summary.className = 'review-summary';
    summary.innerHTML = `
        <strong>${data.average_rating ? `${data.average_rating}/5` : '-'}</strong>
        <span>${data.review_count} inceleme ortalamasi</span>
    `;

    reviewsList.innerHTML = '';
    reviewsList.appendChild(summary);
    reviews.forEach(review => reviewsList.appendChild(createReviewCard(review)));
}

function createReviewCard(review) {
    const card = document.createElement('article');
    card.className = 'review-card';
    card.innerHTML = `
        <div class="review-card-head">
            ${getUserMetaMarkup(review)}
            <div class="review-card-side">
                <div class="review-stars">${renderStars(review.rating)} <span>${Number(review.rating).toFixed(1)}/5</span></div>
                <span>${escapeHtml(review.created_at)}</span>
            </div>
        </div>
        <p class="review-content">${escapeHtml(review.content)}</p>
        <div class="review-actions">
            <button class="mini-action-btn ${review.liked_by_me ? 'active' : ''}" type="button" onclick="toggleReviewLike(${review.id})">
                <i class="fa-solid fa-heart"></i> <span>${review.like_count || 0}</span>
            </button>
            ${review.can_delete ? `<button class="mini-action-btn danger" type="button" onclick="deleteReview(${review.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
        <div class="review-replies" id="review-replies-${review.id}"></div>
    `;

    const replies = card.querySelector(`#review-replies-${review.id}`);
    replies.innerHTML = renderReplies(review);
    return card;
}

function renderReplies(review) {
    const repliesMarkup = (review.replies || []).map(reply => `
        <div class="review-reply">
            ${getUserMetaMarkup(reply)}
            <p>${escapeHtml(reply.content)}</p>
            ${reply.can_delete ? `<button type="button" class="reply-delete-btn" onclick="deleteReviewReply(${reply.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>
    `).join('');

    const replyForm = userLoggedIn ? `
        <div class="reply-box">
            <input id="reply-input-${review.id}" type="text" maxlength="800" placeholder="Bu incelemeye cevap yaz...">
            <button type="button" onclick="addReviewReply(${review.id})"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
    ` : '';

    return `${repliesMarkup}${replyForm}`;
}

function renderStars(rating) {
    const safeRating = Number(rating) || 0;
    const full = Math.floor(safeRating);
    const half = safeRating % 1 >= 0.5;
    const empty = Math.max(0, 5 - full - (half ? 1 : 0));
    return `${'<i class="fa-solid fa-star"></i>'.repeat(full)}${half ? '<i class="fa-solid fa-star-half-stroke"></i>' : ''}${'<i class="fa-regular fa-star"></i>'.repeat(empty)}`;
}

async function addReview() {
    const ratingInput = document.getElementById('review-rating');
    const textInput = document.getElementById('review-text');
    const content = textInput.value.trim();

    if (content.length < 5) return;

    const payload = {
        rating: ratingInput.value,
        content,
        movie_title: currentMovieData?.title || document.getElementById('d-title').innerText,
        poster: currentMovieData?.poster_path || '',
        backdrop: currentMovieData?.backdrop_path || ''
    };

    const response = await fetch(`/api/reviews/${currentMovieId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!data.success) {
        alert(data.error || 'İnceleme eklenemedi.');
        return;
    }

    textInput.value = '';
    await loadReviews(currentMovieId);
}

async function toggleReviewLike(reviewId) {
    if (!userLoggedIn) {
        openLoginModal();
        return;
    }

    const response = await fetch(`/api/reviews/${reviewId}/like`, { method: 'POST' });
    const data = await response.json();
    if (!data.success) {
        alert(data.error || 'Begeni kaydedilemedi.');
        return;
    }
    await loadReviews(currentMovieId);
}

async function addReviewReply(reviewId) {
    const input = document.getElementById(`reply-input-${reviewId}`);
    const content = input.value.trim();
    if (content.length < 2) return;

    const response = await fetch(`/api/reviews/${reviewId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
    });
    const data = await response.json();
    if (!data.success) {
        alert(data.error || 'Cevap eklenemedi.');
        return;
    }
    await loadReviews(currentMovieId);
}

async function deleteReview(reviewId) {
    if (!confirm('İncelemeyi silmek istiyor musun?')) return;

    const response = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!data.success) {
        alert(data.error || 'İnceleme silinemedi.');
        return;
    }
    await loadReviews(currentMovieId);
}

async function deleteReviewReply(replyId) {
    const response = await fetch(`/api/review-replies/${replyId}`, { method: 'DELETE' });
    const data = await response.json();
    if (!data.success) {
        alert(data.error || 'Cevap silinemedi.');
        return;
    }
    await loadReviews(currentMovieId);
}

function emptyMessage(iconClass, message) {
    return `
        <div class="empty-discussion-msg">
            <i class="${iconClass}"></i>
            ${message}
        </div>
    `;
}

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'flex';
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) modal.style.display = 'none';
}

window.addComment = addComment;
window.toggleCommentLike = toggleCommentLike;
window.deleteComment = deleteComment;
window.addReview = addReview;
window.toggleReviewLike = toggleReviewLike;
window.addReviewReply = addReviewReply;
window.deleteReview = deleteReview;
window.deleteReviewReply = deleteReviewReply;
window.openLoginModal = openLoginModal;
window.closeLoginModal = closeLoginModal;

window.addEventListener('click', (event) => {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) closeLoginModal();
});
