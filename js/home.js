/* ============================================================
   HOME.JS — Trang chủ: phim thịnh hành / theo thể loại / tìm kiếm
   Yêu cầu nạp trước: firebase-config.js, common.js
   ============================================================ */

let currentPage = 1;
let totalPages = 1;
let currentFetchType = 'popular'; // 'popular', 'genre', 'search'
let currentGenreId = '';
let currentSearchQuery = '';

const moviesGrid = document.getElementById('movies-grid');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const sectionTitle = document.getElementById('section-title');

const heroBanner = document.getElementById('hero-banner');
const heroTitle = document.getElementById('hero-title');
const heroOverview = document.getElementById('hero-overview');
const heroPlayBtn = document.getElementById('hero-play-btn');
let currentHeroMovieId = null;

const genrePills = document.querySelectorAll('.genre-pill');

const paginationContainer = document.getElementById('pagination');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');

document.addEventListener('DOMContentLoaded', () => {
    getPopularMovies(1);
});

function renderMovies(movies) {
    renderMoviesInto(moviesGrid, movies);
}

function showSkeletons() {
    moviesGrid.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const skel = document.createElement('div');
        skel.classList.add('movie-card');
        skel.innerHTML = `<div class="poster-wrap skeleton"></div><div class="movie-info"><div style="height:18px;margin-bottom:8px" class="skeleton"></div><div style="height:12px;width:50%" class="skeleton"></div></div>`;
        moviesGrid.appendChild(skel);
    }
}

// 1. Lấy phim Phổ biến
async function getPopularMovies(page = 1) {
    showSkeletons();
    currentFetchType = 'popular';
    currentPage = page;

    try {
        const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=vi-VN&page=${page}`);
        const data = await res.json();

        if (page === 1 && data.results.length > 0) {
            setupHeroBanner(data.results[0]);
        }

        totalPages = Math.min(data.total_pages, 500);
        updatePaginationUI();
        renderMovies(data.results);
    } catch (err) {
        moviesGrid.innerHTML = `<p style="grid-column:1/-1;text-align:center;">Lỗi tải dữ liệu!</p>`;
    }
}

function setupHeroBanner(movie) {
    currentHeroMovieId = movie.id;
    heroTitle.innerText = movie.title;
    heroOverview.innerText = movie.overview || 'Bộ phim siêu hot không thể bỏ qua.';
    if (movie.backdrop_path) {
        heroBanner.style.backgroundImage = `url('${BACKDROP_URL}${movie.backdrop_path}')`;
    }
}

heroPlayBtn.addEventListener('click', () => {
    if (currentHeroMovieId) openMovieDetails(currentHeroMovieId);
});

// 2. Lọc theo Thể loại
genrePills.forEach(pill => {
    pill.addEventListener('click', () => {
        genrePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const genreId = pill.dataset.genre;
        currentGenreId = genreId;

        if (genreId === '') {
            sectionTitle.innerText = '🔥 Phim Đang Xu Hướng';
            heroBanner.style.display = 'flex';
            getPopularMovies(1);
        } else {
            sectionTitle.innerText = `🍿 Phim Thuộc Thể Loại`;
            heroBanner.style.display = 'none';
            getMoviesByGenre(genreId, 1);
        }
    });
});

async function getMoviesByGenre(genreId, page = 1) {
    showSkeletons();
    currentFetchType = 'genre';
    currentPage = page;

    try {
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&language=vi-VN&with_genres=${genreId}&page=${page}`);
        const data = await res.json();

        totalPages = Math.min(data.total_pages, 500);
        updatePaginationUI();
        renderMovies(data.results);
    } catch (err) { console.error(err); }
}

// 3. Tìm kiếm Phim
searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) {
        currentSearchQuery = q;
        heroBanner.style.display = 'none';
        sectionTitle.innerText = `🔍 Kết quả cho: "${q}"`;
        searchMovies(q, 1);
    }
});

async function searchMovies(query, page = 1) {
    showSkeletons();
    currentFetchType = 'search';
    currentPage = page;

    try {
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=vi-VN&query=${encodeURIComponent(query)}&page=${page}`);
        const data = await res.json();

        totalPages = Math.min(data.total_pages, 500);
        updatePaginationUI();
        renderMovies(data.results);
    } catch (err) { console.error(err); }
}

// Cập nhật giao diện Phân Trang
function updatePaginationUI() {
    paginationContainer.style.display = 'flex';
    pageInfo.innerText = `Trang ${currentPage} / ${totalPages}`;
    prevPageBtn.disabled = currentPage <= 1;
    nextPageBtn.disabled = currentPage >= totalPages;
}

prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        fetchPageData(currentPage - 1);
        scrollToSection();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
        fetchPageData(currentPage + 1);
        scrollToSection();
    }
});

function fetchPageData(page) {
    if (currentFetchType === 'popular') getPopularMovies(page);
    else if (currentFetchType === 'genre') getMoviesByGenre(currentGenreId, page);
    else if (currentFetchType === 'search') searchMovies(currentSearchQuery, page);
}

function scrollToSection() {
    sectionTitle.scrollIntoView({ behavior: 'smooth' });
}