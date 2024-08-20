document.getElementById('loginForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = {
        email: formData.get('email'),
        password: formData.get('password')
    };

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            window.location.href = 'main.html'; // 로그인 성공 시 메인 페이지로 이동
        } else {
            const result = await response.text();
            alert(result);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('에러가 발생했습니다. 다시 시도해 주세요.');
    }
});