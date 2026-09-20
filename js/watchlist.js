/* ============================================================
   WATCHLIST.JS — Trang Bộ Sưu Tập cá nhân (dữ liệu từ Firestore)
   Yêu cầu nạp trước: firebase-config.js, common.js
   ============================================================ */

const watchlistGrid = document.getElementById('watchlist-grid');
const watchlistEmptyState = document.getElementById('watchlist-empty-state');
const watchlistLoginPrompt = document.getElementById('watchlist-login-prompt');

function renderWatchlistPage() {
    if (!currentUser) {
        watchlistGrid.style.display = 'none';
        watchlistEmptyState.style.display = 'none';
        watchlistLoginPrompt.style.display = 'flex';
        return;
    }

    watchlistLoginPrompt.style.display = 'none';

    if (watchlist.length === 0) {
        watchlistGrid.style.display = 'none';
        watchlistEmptyState.style.display = 'flex';
        return;
    }

    watchlistEmptyState.style.display = 'none';
    watchlistGrid.style.display = 'grid';
    renderMoviesInto(watchlistGrid, watchlist);
}

// Được common.js gọi lại mỗi khi trạng thái đăng nhập thay đổi (đăng nhập/đăng xuất)
function onAuthReady() {
    renderWatchlistPage();
}

// Được common.js gọi lại mỗi khi watchlist thay đổi (thêm/xóa phim từ modal chi tiết)
function onWatchlistChanged() {
    renderWatchlistPage();
}

document.addEventListener('DOMContentLoaded', () => {
    renderWatchlistPage(); // hiển thị trạng thái mặc định trong lúc chờ Firebase xác thực
});