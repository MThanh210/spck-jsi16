/* ============================================================
   AUTH.JS — Trang Đăng nhập / Đăng ký (auth.html)
   Yêu cầu nạp trước: firebase-config.js
   ============================================================ */

const authTabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');

function translateFirebaseError(code) {
    const map = {
        'auth/email-already-in-use': 'Email này đã được đăng ký.',
        'auth/invalid-email': 'Email không hợp lệ.',
        'auth/weak-password': 'Mật khẩu quá yếu (tối thiểu 6 ký tự).',
        'auth/missing-password': 'Vui lòng nhập mật khẩu.',
        'auth/user-not-found': 'Email hoặc mật khẩu không đúng.',
        'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
        'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
        'auth/too-many-requests': 'Bạn thử sai quá nhiều lần, vui lòng thử lại sau.',
        'auth/network-request-failed': 'Lỗi kết nối mạng, vui lòng thử lại.'
    };
    return map[code] || 'Đã có lỗi xảy ra, vui lòng thử lại.';
}

function switchAuthTab(tab) {
    authTabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    loginForm.style.display = tab === 'login' ? 'flex' : 'none';
    registerForm.style.display = tab === 'register' ? 'flex' : 'none';
    loginError.innerText = '';
    registerError.innerText = '';

    const url = new URL(window.location);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url);
}

// Nếu đã đăng nhập sẵn thì đưa thẳng về trang chủ
auth.onAuthStateChanged((user) => {
    if (user) {
        window.location.href = 'home.html';
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Đọc tab ban đầu từ URL (?tab=login hoặc ?tab=register)
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab') === 'register' ? 'register' : 'login';
    switchAuthTab(initialTab);

    authTabs.forEach(tab => {
        tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    document.querySelectorAll('.auth-switch-link').forEach(link => {
        link.addEventListener('click', () => switchAuthTab(link.dataset.tab));
    });

    // Xử lý Đăng ký
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.innerText = '';

        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim().toLowerCase();
        const password = document.getElementById('register-password').value;

        if (password.length < 6) {
            registerError.innerText = 'Mật khẩu phải có ít nhất 6 ký tự.';
            return;
        }

        const submitBtn = registerForm.querySelector('.auth-submit');
        submitBtn.disabled = true;

        try {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            await cred.user.updateProfile({ displayName: name });
            await db.collection('users').doc(cred.user.uid).set({ name, email }, { merge: true });

            window.location.href = 'home.html';
        } catch (err) {
            registerError.innerText = translateFirebaseError(err.code);
            submitBtn.disabled = false;
        }
    });

    // Xử lý Đăng nhập
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.innerText = '';

        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        const submitBtn = loginForm.querySelector('.auth-submit');
        submitBtn.disabled = true;

        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = 'home.html';
        } catch (err) {
            loginError.innerText = translateFirebaseError(err.code);
            submitBtn.disabled = false;
        }
    });
});