document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        }),
    })
    .then(response => response.json()) 
    .then(data => {
        console.log("Response data:", data); 

        if (data.token) {
            console.log("Token received:", data.token); 
            localStorage.setItem('token', data.token); 
            window.location.href = '/home.html'; 
        } else {
            console.log("Login failed, no token received.");
            alert('Invalid login');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});
