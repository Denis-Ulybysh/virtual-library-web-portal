var http = require('http');
var mysql = require('mysql');
var bcrypt = require('bcrypt'); 
var express = require('express'); 
var session = require('express-session'); 
var jwt = require('jsonwebtoken'); 
var fetch = require('node-fetch');
var path = require('path');
var fs = require('fs');
var util = require('util');
var app = express(); 


const logFile = 'application.log';


function logToFile(message) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, formattedMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err);
    }
}


const originalConsoleLog = console.log;
console.log = function(message) {
    logToFile(util.format(message));
    originalConsoleLog.apply(console, arguments);
};

var connection = mysql.createConnection({
  host: 'localhost',  
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

connection.connect(function(err) {
  if (err) {
    console.error('Error connecting to the database: ' + err.stack);
    return;
  }

  console.log('Connected to database as ID ' + connection.threadId);
});

app.use(express.json()); 




function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('Authorization header missing');

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.SESSION_SECRET, (err, user) => {
        if (err) return res.status(403).send('Invalid token');
        req.user = user;
        next();
    });
}

function appendLog(message) {
    const logMessage = `${new Date().toISOString()}: ${message}\n`;
    fs.appendFile('server.log', logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file', err);
        }
    });
}

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and Password are required.');
    }

    const userCheckQuery = 'SELECT * FROM users WHERE username = ?';
    connection.query(userCheckQuery, [username], async (error, results) => {
        if (error) {
            return res.status(500).send('Error checking for existing user');
        }

        if (results.length > 0) {
            return res.status(409).send('Username is already taken');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const insertQuery = 'INSERT INTO users (username, hashed_password) VALUES (?, ?)';
        connection.query(insertQuery, [username, hashedPassword], (error, results) => {
            if (error) {
                return res.status(500).send('Error registering new user');
            }
            const userId = results.insertId;
            const token = jwt.sign({ userId }, process.env.SESSION_SECRET, { expiresIn: '1h' });
            res.status(201).send({ token });
        });
    });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).send('Username and Password Are Required');
    }

    const query = 'SELECT id, hashed_password, role FROM users WHERE username = ?';
    connection.query(query, [username], async (error, results) => {
        if (error) {
            return res.status(500).send('Error during user login');
        }

        if (results.length === 0) {
            return res.status(401).send('Invalid Credentials');
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.hashed_password);

        if (passwordMatch) {
            const payload = {
                userId: user.id,
                role: user.role  // Include the user's role in the JWT payload
            };
            const token = jwt.sign(payload, process.env.SESSION_SECRET, { expiresIn: '1h' });
            res.send({ token });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});




app.get('/library', authenticate, async (req, res) => {
    const userId = req.user.userId;  // Get user ID from JWT payload

    const query = `
        SELECT b.title, b.author, b.publisher, b.year_published, b.category, b.isbn 
        FROM user_libraries ul
        JOIN books b ON ul.book_id = b.id
        WHERE ul.user_id = ?`;

    connection.query(query, [userId], (error, results) => {
        if (error) {
            console.error('Error retrieving library:', error);
            return res.status(500).send('Error retrieving library');
        }
        res.json(results);
    });
});


app.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).send('No search query provided');
    }
    const dbQuery = 'SELECT * FROM books WHERE title LIKE ? OR author LIKE ?';
    connection.query(dbQuery, [`%${query}%`, `%${query}%`], (error, results) => {
        if (error) {
            console.error('Error searching local database:', error);
            return res.status(500).send('Error searching local database');
        }
      
        res.json(results || []);
    });
});

function logErrorToFile(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  const logFilePath = path.join(__dirname, 'SEARCHERROR.LOG');

  fs.appendFile(logFilePath, formattedMessage, (err) => {
    if (err) {
      console.error('Failed to write to error log file:', err);
    }
  });
}

function addUserBook(userId, bookId, res) {
    const insertUserBookQuery = 'INSERT INTO user_libraries (user_id, book_id) VALUES (?, ?)';
    connection.query(insertUserBookQuery, [userId, bookId], (error, results) => {
        if (error) {
            logErrorToFile(`Error adding book to user library: ${error}`);
            return res.status(500).send('Error adding book to user library');
        }
        res.status(201).send('Book added to library');
    });
}

app.post('/library/add', authenticate, async (req, res) => {
    const userId = req.user.userId; 
    const { isbn } = req.body; 
    const bookCheckQuery = 'SELECT id FROM books WHERE isbn = ?';
    connection.query(bookCheckQuery, [isbn], (error, results) => {
        if (error) {
            logErrorToFile(`Error checking for existing book: ${error}`);
            return res.status(500).send('Error checking for existing book');
        }

        if (results.length > 0) {
            
            let bookId = results[0].id;
            addUserBook(userId, bookId, res);
        } else {
          
            const { title, author, publisher, year_published, category } = req.body;
            const insertBookQuery = 'INSERT INTO books (title, author, publisher, year_published, category, isbn) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(insertBookQuery, [title, author, publisher, year_published, category, isbn], (error, results) => {
                if (error) {
                    logErrorToFile(`Error adding new book: ${error}`);
                    return res.status(500).send('Error adding book');
                }
               
                addUserBook(userId, results.insertId, res);
            });
        }
    });
});



async function searchGoogleBooksAPI(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    
  
    const books = data.items.map(item => {
        const { title, authors, publisher, publishedDate, categories, industryIdentifiers } = item.volumeInfo;
        return {
            title: title || 'No title available',
            author: authors ? authors.join(', ') : 'No authors available',
            publisher: publisher || 'No publisher available',
            year_published: publishedDate ? publishedDate.substring(0, 4) : 'No year available',
            category: categories ? categories[0] : 'No category available',
            isbn: industryIdentifiers ? industryIdentifiers.find(id => id.type === 'ISBN_13').identifier : 'No ISBN available',
        };
    });

    return books;
}



app.post('/addBook', authenticate, (req, res) => {
    const userId = req.user.userId;  
    const { title, author, publisher, year_published, category, isbn } = req.body;

   
    const bookCheckQuery = 'SELECT id FROM books WHERE isbn = ?';
    connection.query(bookCheckQuery, [isbn], (bookError, bookResults) => {
        if (bookError) {
            console.error('Error checking for existing book:', bookError);
            return res.status(500).send('Error checking for existing book');
        }

        if (bookResults.length > 0) {
            
            const bookId = bookResults[0].id;
            addUserBook(userId, bookId, res);
        } else {
           
            const insertBookQuery = 'INSERT INTO books (title, author, publisher, year_published, category, isbn) VALUES (?, ?, ?, ?, ?, ?)';
            connection.query(insertBookQuery, [title, author, publisher, year_published, category, isbn], (insertError, insertResults) => {
                if (insertError) {
                    console.error('Error adding book:', insertError);
                    return res.status(500).send('Error adding book');
                }

               
                const newBookId = insertResults.insertId;
                addUserBook(userId, newBookId, res);
            });
        }
    });
});

app.post('/addBookAdmin', authenticate, (req, res) => {
 
  if (req.user.role !== 'admin') {
    return res.status(403).send('Access Denied: Admin only action.');
  }

  const { title, author, publisher, year_published, category, isbn } = req.body;
  const insertQuery = 'INSERT INTO books (title, author, publisher, year_published, category, isbn) VALUES (?, ?, ?, ?, ?, ?)';

  connection.query(insertQuery, [title, author, publisher, year_published, category, isbn], (error, results) => {
    if (error) {
      logErrorToFile(`Error adding book by admin: ${error}`);
      return res.status(500).send('Error adding book by admin');
    }
    res.status(201).json({ message: 'Book successfully added by admin' });
  });
});

function addUserBook(userId, bookId, res) {
    const insertUserBookQuery = 'INSERT INTO user_libraries (user_id, book_id) VALUES (?, ?)';
    connection.query(insertUserBookQuery, [userId, bookId], (error, results) => {
        if (error) {
            console.error('Error adding book to user library:', error);
            return res.status(500).send('Error adding book to user library');
        }
        res.status(201).json({ message: 'Book added to user library' });
    });
}


app.get('/test', (req, res) => {
  res.send('The server is up and running!');
});


var server = http.createServer(app);


var PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


