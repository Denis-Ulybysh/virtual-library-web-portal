
function searchBooks() {
    var searchInputElement = document.getElementById('searchQuery');
    var query = searchInputElement.value.trim();

 
    fetch(`/search?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(books => {
        displayResults(books, 'searchResults'); 
    })
    .catch(error => console.error('Error:', error));

    
    searchGoogleBooksAPI(query);
}

function searchGoogleBooksAPI(query) {
    const googleBooksURL = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;

    fetch(googleBooksURL)
    .then(response => response.json())
    .then(data => {
        const books = data.items.map(item => {
            const volumeInfo = item.volumeInfo;
            
            const isbnIdentifier = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10') || {};

            
            const yearPublished = volumeInfo.publishedDate ? new Date(volumeInfo.publishedDate).getFullYear().toString() : 'No year available';

            return {
                title: volumeInfo.title,
                author: volumeInfo.authors ? volumeInfo.authors.join(', ') : 'No authors available',
                publisher: volumeInfo.publisher,
                year_published: yearPublished,
                category: volumeInfo.categories ? volumeInfo.categories.join(', ') : 'No categories available',
                isbn: isbnIdentifier.identifier || 'No ISBN available',
            };
        });
        displayResults(books, 'apiSearchResults'); 
    })
    .catch(error => console.error('Error fetching from Google Books API:', error));
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
                <strong>ISBN:</strong> ${book.isbn || 'No ISBN available'}<br>
            </div>
        `;

        const addButton = document.createElement('button');
        addButton.textContent = 'Add';
        addButton.onclick = function() { addBookToLibrary(book); };
        bookElement.appendChild(addButton);

        resultsDiv.appendChild(bookElement);
    });
}

//attempt 20

function addBookToLibrary(book) {
    let yearOnly = null; 

  if (book.year_published) {
    if (/^\d{4}$/.test(book.year_published)) {
      yearOnly = parseInt(book.year_published, 10); 
    } else {
      const parsedDate = new Date(book.year_published);
      if (!isNaN(parsedDate.getTime())) {
        yearOnly = parsedDate.getFullYear(); 
      }
    }
  }

  const bookData = {
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    year_published: yearOnly,
    category: book.category,
    isbn: book.isbn,
  };

    const token = localStorage.getItem('token');
    if (!token) {
        alert('You are not logged in');
        return;
    }

    fetch('/addBook', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    },
    body: JSON.stringify(bookData),
})
.then(response => {
    console.log(response); // Log the raw response
    if (!response.ok) {
        throw new Error('Failed to add the book to the database');
    }
    return response.json();
})
.then(data => {
    alert('Book added to your Library!');
})
.catch(error => {
    console.error('Error:', error);
    alert('Failed to add the book to the database: ' + error.message);
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





