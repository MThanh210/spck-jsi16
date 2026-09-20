/* ============================================================
   COMMON.JS — Dùng chung cho home.html & watchlist.html
   Yêu cầu nạp trước: firebase-config.js (biến auth, db)
   ============================================================ */

const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';

let watchlist = []; // cache watchlist của user hiện tại (đồng bộ từ Firestore)
let currentUser = null; // firebase.User hiện tại, null nếu chưa đăng nhập

const toastContainer = document.getElementById('toast-container');
const backToTopBtn = document.getElementById('back-to-top');
const watchlistCountBadge = document.getElementById('watchlist-count');

const modal = document.getElementById('movie-modal');
const modalBody = document.getElementById('modal-body');
const closeModalBtn = document.getElementById('close-modal');

const userInfoEl = document.getElementById('user-info');
const userAvatarEl = document.getElementById('user-avatar');
const userNameDisplayEl = document.getElementById('user-name-display');
const authButtonsEl = document.getElementById('auth-buttons');
const btnLogout = document.getElementById('btn-logout');

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
});

function initCommon() {
    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.innerText = new Date().getFullYear();

    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            backToTopBtn.classList.toggle('show', window.scrollY > 400);
        });
        backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    if (modal && closeModalBtn) {
        closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
        window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await auth.signOut();
            showToast('Đã đăng xuất.', 'success');
            if (typeof onWatchlistChanged === 'function') onWatchlistChanged();
        });
    }

    // Theo dõi trạng thái đăng nhập (tự khôi phục phiên khi tải lại / chuyển trang)
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        renderAuthState();
        await loadWatchlistFromFirestore();
        if (typeof onAuthReady === 'function') onAuthReady();
    });
}

function redirectToLogin() {
    window.location.href = 'auth.html?tab=login';
}

// Toast Notification Popup
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function updateWatchlistBadge() {
    if (watchlistCountBadge) watchlistCountBadge.innerText = watchlist.length;
}

function renderAuthState() {
    if (!authButtonsEl || !userInfoEl) return;
    if (currentUser) {
        authButtonsEl.style.display = 'none';
        userInfoEl.style.display = 'flex';
        const name = currentUser.displayName || currentUser.email;
        userAvatarEl.innerText = name.trim().charAt(0).toUpperCase();
        userNameDisplayEl.innerText = name;
    } else {
        authButtonsEl.style.display = 'flex';
        userInfoEl.style.display = 'none';
    }
}

// Render 1 danh sách phim vào 1 lưới bất kỳ (home.js và watchlist.js đều dùng)
function renderMoviesInto(grid, movies, emptyMessage = 'Không tìm thấy phim phù hợp.') {
    grid.innerHTML = '';
    if (!movies || movies.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:#a0a5b5;padding:2rem;">${emptyMessage}</p>`;
        return;
    }
    movies.forEach(movie => {
        const { id, title, poster_path, vote_average, release_date } = movie;
        const posterSrc = poster_path ? `${IMAGE_URL}${poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.innerHTML = `
      <div class="poster-wrap">
        <img src="${posterSrc}" alt="${title}" loading="lazy">
        <span class="rating"><i class="fa-solid fa-star"></i> ${vote_average ? vote_average.toFixed(1) : 'N/A'}</span>
      </div>
      <div class="movie-info">
        <h3 class="movie-title">${title}</h3>
        <span class="release-date">${release_date ? release_date.split('-')[0] : 'N/A'}</span>
      </div>
    `;
        card.addEventListener('click', () => openMovieDetails(id));
        grid.appendChild(card);
    });
}

// Modal chi tiết phim + toggle watchlist (dùng chung cho home.html & watchlist.html)
async function openMovieDetails(movieId) {
    if (!modal) return;
    modalBody.innerHTML = '<p style="padding:40px;text-align:center;">⏳ Đang tải thông tin phim...</p>';
    modal.style.display = 'flex';

    try {
        const [movieRes, videoRes] = await Promise.all([
            fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=vi-VN`),
            fetch(`${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}&language=en-US`)
        ]);

        const movie = await movieRes.json();
        const videoData = await videoRes.json();

        const trailer = videoData.results ? videoData.results.find(
            vid => vid.site === 'YouTube' && (vid.type === 'Trailer' || vid.type === 'Teaser')
        ) : null;

        const posterSrc = movie.poster_path ? `${IMAGE_URL}${movie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
        const genres = movie.genres ? movie.genres.map(g => `<span class="genre-tag">${g.name}</span>`).join(' ') : '';
        const isSaved = watchlist.some(item => item.id === movie.id);

        const trailerHTML = trailer
            ? `<div class="trailer-container"><iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen></iframe></div>`
            : '<p style="margin-top:15px;color:#6c727f;">🚫 Chưa có Trailer chính thức.</p>';

        modalBody.innerHTML = `
      <div class="modal-body-content">
        <img class="modal-poster" src="${posterSrc}" alt="${movie.title}">
        <div class="modal-details">
          <h2>${movie.title}</h2>
          <div>
            <button id="watchlist-toggle-btn" class="watchlist-btn ${isSaved ? 'remove' : 'add'}">
              <i class="fa-solid ${isSaved ? 'fa-trash' : 'fa-bookmark'}"></i>
              ${isSaved ? 'Xóa khỏi Bộ Sưu Tập' : 'Lưu vào Bộ Sưu Tập'}
            </button>
          </div>
          <p><strong>⭐ Đánh giá:</strong> ${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} / 10</p>
          <p><strong>⏱ Thời lượng:</strong> ${movie.runtime ? movie.runtime + ' phút' : 'N/A'}</p>
          <div style="display:flex;gap:6px;align-items:center;"><strong>🎭 Thể loại:</strong> ${genres}</div>
          <p style="color:#a0a5b5;line-height:1.6;margin-top:6px;">${movie.overview || 'Chưa có mô tả.'}</p>
          ${trailerHTML}
        </div>
      </div>
    `;

        document.getElementById('watchlist-toggle-btn').addEventListener('click', async function () {
            if (!currentUser) {
                showToast('Vui lòng đăng nhập để lưu phim vào Bộ Sưu Tập!', 'danger');
                setTimeout(redirectToLogin, 900);
                return;
            }

            this.disabled = true;
            const idx = watchlist.findIndex(item => item.id === movie.id);

            if (idx !== -1) {
                const ok = await removeFromWatchlist(movie.id);
                if (ok) {
                    this.className = 'watchlist-btn add';
                    this.innerHTML = '<i class="fa-solid fa-bookmark"></i> Lưu vào Bộ Sưu Tập';
                    showToast(`Đã xóa "${movie.title}" khỏi danh sách!`, 'danger');
                }
            } else {
                const movieData = { id: movie.id, title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average, release_date: movie.release_date };
                const ok = await addToWatchlist(movieData);
                if (ok) {
                    this.className = 'watchlist-btn remove';
                    this.innerHTML = '<i class="fa-solid fa-trash"></i> Xóa khỏi Bộ Sưu Tập';
                    showToast(`Đã thêm "${movie.title}" vào Bộ sưu tập!`, 'success');
                }
            }

            this.disabled = false;
            if (typeof onWatchlistChanged === 'function') onWatchlistChanged();
        });

    } catch (err) {
        modalBody.innerHTML = '<p style="padding:40px;text-align:center;color:#ff2a5f;">❌ Lỗi tải thông tin!</p>';
    }
}

/* ============================================================
   Bộ Sưu Tập (watchlist) lưu trên Firestore theo từng user
   users/{uid}/watchlist/{movieId}
   ============================================================ */

async function loadWatchlistFromFirestore() {
    if (!currentUser) {
        watchlist = [];
        updateWatchlistBadge();
        return;
    }
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid).collection('watchlist').get();
        watchlist = snapshot.docs.map(doc => doc.data());
        updateWatchlistBadge();
    } catch (err) {
        console.error(err);
        showToast('Không tải được Bộ Sưu Tập từ máy chủ.', 'danger');
    }
}

async function addToWatchlist(movieData) {
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('watchlist').doc(String(movieData.id)).set(movieData);
        watchlist.push(movieData);
        updateWatchlistBadge();
        return true;
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi lưu phim, vui lòng thử lại.', 'danger');
        return false;
    }
}

async function removeFromWatchlist(movieId) {
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('watchlist').doc(String(movieId)).delete();
        watchlist = watchlist.filter(item => item.id !== movieId);
        updateWatchlistBadge();
        return true;
    } catch (err) {
        console.error(err);
        showToast('Lỗi khi xóa phim, vui lòng thử lại.', 'danger');
        return false;
    }
}