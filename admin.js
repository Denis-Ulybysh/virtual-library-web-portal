function addBook() {
    const title = document.getElementById('title').value.trim();
    const author = document.getElementById('author').value.trim();
    const publisher = document.getElementById('publisher').value.trim();
  
    const yearPublishedStr = document.getElementById('yearPublished').value.trim();
    let yearPublished = null;

    if (/^\d{4}$/.test(yearPublishedStr)) { 
        yearPublished = parseInt(yearPublishedStr, 10);
    } else {
      
        console.error('Invalid year input:', yearPublishedStr);
        alert('Invalid year input. Please enter a 4-digit year.');
        return; 
    }

    const category = document.getElementById('category').value.trim();
    const isbn = document.getElementById('isbn').value.trim();

    const bookData = {
        title: title,
        author: author,
        publisher: publisher,
        year_published: yearPublished,
        category: category,
        isbn: isbn,
    };

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in');
        return;
    }

    fetch('/addBookAdmin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(bookData),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add the book to the database');
        }
        return response.json();
    })
    .then(data => {
        alert('Book added to the database!');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to add the book to the database: ' + error.message);
    });
}

function clearForm() {
    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('publisher').value = '';
    document.getElementById('yearPublished').value = '';
    document.getElementById('category').value = '';
    document.getElementById('isbn').value = '';
}

function loadBooks() {
    fetch('/allBooks', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
    })
    .then(response => response.json())
    .then(books => {
        displayBooks(books);
    })
    .catch(error => console.error('Failed to load books:', error));
}

function displayBooks(books) {
    const booksList = document.getElementById('booksList');
    booksList.innerHTML = ''; // Clear existing entries

    books.forEach(book => {
        const bookDiv = document.createElement('div');
        bookDiv.className = 'book';
        bookDiv.innerHTML = `
            <p><strong>Title:</strong> ${book.title}</p>
            <p><strong>Author:</strong> ${book.author}</p>
            <p><strong>Publisher:</strong> ${book.publisher}</p>
            <p><strong>Year Published:</strong> ${book.year_published}</p>
            <p><strong>Category:</strong> ${book.category}</p>
            <p><strong>ISBN:</strong> ${book.isbn}</p>
            <button onclick="deleteBook('${book.id}')">Delete</button>
        `;
        booksList.appendChild(bookDiv);
    });
}

function deleteBook(bookId) {
    // Ensure bookId is an integer
    const bookIdInt = parseInt(bookId, 10);

    fetch('/deleteBook', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ bookId: bookIdInt })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to delete book');
        alert('Book deleted successfully');
        loadBooks(); // Reload the books to update the list
    })
    .catch(error => {
        console.error('Error deleting book:', error);
        alert('Failed to delete book: ' + error.message);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadBooks();
});

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in');
        window.location.href = '/index.html'; 
        return;
    }


    const payload = JSON.parse(atob(token.split('.')[1])); 
    if (payload.role !== 'admin') {
        alert('You are not authorized to view this page');
        window.location.href = '/home.html'; 
        return;
    }

   
});

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
