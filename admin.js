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
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in');
        window.location.href = '/login.html'; 
        return;
    }


    const payload = JSON.parse(atob(token.split('.')[1])); 
    if (payload.role !== 'admin') {
        alert('You are not authorized to view this page');
        window.location.href = '/home.html'; 
        return;
    }

   
});
