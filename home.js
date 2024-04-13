function fetchLibrary() {
    const token = localStorage.getItem('token'); 

    if (!token) {
        console.log('User is not logged in');
        return;
    }

    fetch('/library', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token, 
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to fetch library');
        }
        return response.json();
    })
    .then(books => {
        displayResults(books, 'bookList'); 
    })
    .catch(error => console.error('Error:', error));
}

function displayResults(books, resultsDivId) {
    const resultsDiv = document.getElementById(resultsDivId);
    resultsDiv.innerHTML = ''; 

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';

        bookElement.innerHTML = `
            <div>
                <strong>Title:</strong> ${book.title || 'No title available'}<br>
                <strong>Author:</strong> ${book.author || 'No author available'}<br>
                <strong>Publisher:</strong> ${book.publisher || 'No publisher available'}<br>
                <strong>Year Published:</strong> ${book.year_published || 'No year available'}<br>
                <strong>Category:</strong> ${book.category || 'No category available'}<br>
                <strong>ISBN:</strong> ${book.isbn || 'No ISBN available'}
            </div>
        `;
        
        resultsDiv.appendChild(bookElement);
    });
}

function checkAdminRole() {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Naive decoding; in production, use a library to parse JW
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role === 'admin') {
        document.getElementById('adminButton').style.display = 'block';
        document.getElementById('adminButton').onclick = function() {
            window.location.href = 'admin.html'; 
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchLibrary();
    checkAdminRole(); 
});

