document.getElementById('signupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const data = {
        email: formData.get('email'),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        age: formData.get('age'),
        job: formData.get('job'),
        educationLevel: formData.get('educationLevel')
    };

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if(response.ok){
            window.location.href='login.html';
        } else {
            const result = await response.text();
            alert(result);
        }

        const result = await response.text();
        alert(result);
    } catch (error) {
        console.error('Error:', error);
    }
});