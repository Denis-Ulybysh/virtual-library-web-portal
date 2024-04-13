document.getElementById('registerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    var username = document.getElementById('newUsername').value;
    var password = document.getElementById('newPassword').value;

    fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        }),
    })
    .then(response => {
        if (response.ok) {
            alert('Registration successful. Please log in.');
            window.location.href = 'index.html'; // Redirect to login page
        } else {
            response.text().then(text => alert(text));
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
});