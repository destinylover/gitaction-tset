// 세션 확인 및 페이지 리디렉션 로직
function checkSessionAndRedirect() {
    fetch('/api/users/session', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(isLoggedIn => {
            if (!isLoggedIn && window.location.pathname !== '/') {
                window.location.href = '/';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/';
        });
}

// 로그인 링크 클릭 시 세션 확인 및 리디렉션
document.getElementById('login-link').addEventListener('click', function(event) {
    event.preventDefault();

    fetch('/api/users/session', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(isLoggedIn => {
            if (isLoggedIn) {
                window.location.href = 'main.html';
            } else {
                window.location.href = 'login.html';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = 'login.html';
        });
});

// 페이지 로드 시 세션 확인
window.onload = checkSessionAndRedirect;
