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

/*function displayResults(books, resultsDivId) {
    const resultsDiv = document.getElementById(resultsDivId);
    resultsDiv.innerHTML = ''; // Clear existing results

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';

        // Create content elements
        const content = document.createElement('div');
        content.innerHTML = `
            <strong>Title:</strong> ${book.title}<br>
            <strong>Author:</strong> ${book.author}<br>
            <strong>Publisher:</strong> ${book.publisher}<br>
            <strong>Year Published:</strong> ${book.year_published}<br>
            <strong>Category:</strong> ${book.category}<br>
            <strong>ISBN:</strong> ${book.isbn}
        `;

        // Create the remove button
        const button = document.createElement('button');
        button.textContent = 'Remove';
        button.onclick = function() { removeBookFromLibrary(book.book_id); }; // Attach event directly

        // Append everything to the book element
        bookElement.appendChild(content);
        bookElement.appendChild(button);
        resultsDiv.appendChild(bookElement);
    });
}*/

function displayResults(books, resultsDivId) {
    const resultsDiv = document.getElementById(resultsDivId);
    resultsDiv.innerHTML = ''; // Clear existing results

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';

        // Create content elements
        const content = document.createElement('div');
        content.innerHTML = `
            <strong>Title:</strong> ${book.title}<br>
            <strong>Author:</strong> ${book.author}<br>
            <strong>Publisher:</strong> ${book.publisher}<br>
            <strong>Year Published:</strong> ${book.year_published}<br>
            <strong>Category:</strong> ${book.category}<br>
            <strong>ISBN:</strong> ${book.isbn}
        `;

        // Create the remove button
        const button = document.createElement('button');
        button.textContent = 'Remove';
        button.onclick = function() { removeBookFromLibrary(book.id); }; // Ensure this uses book.id

        // Append everything to the book element
        bookElement.appendChild(content);
        bookElement.appendChild(button);
        resultsDiv.appendChild(bookElement);
    });
}

function removeBookFromLibrary(bookId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in');
        return;
    }

    fetch('/removeBookFromLibrary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ bookId: parseInt(bookId) }) // Ensure bookId is sent as an integer
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to remove the book from the library');
        return response.json();
    })
    .then(data => {
        alert('Book removed successfully');
        fetchLibrary(); // Reload the library to reflect the changes
    })
    .catch(error => {
        console.error('Error removing book:', error);
        alert('Failed to remove the book: ' + error.message);
    });
}

/*function removeBookFromLibrary(bookId) {
    console.log("Book ID received in remove function:", bookId); // Log the book ID

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in');
        return;
    }

    fetch('/removeBookFromLibrary', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ bookId })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to remove the book from the library');
        return response.json();
    })
    .then(data => {
        alert(data.message);
        fetchLibrary(); // Reload the library to reflect the changes
    })
    .catch(error => {
        console.error('Error removing book from library:', error);
        alert('Failed to remove the book from the library: ' + error.message);
    });
}*/

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

