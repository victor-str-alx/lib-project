// app.js - Porneste serverul principal

const express = require('express');
const session = require('express-session');
const path = require('path');
const adminRouter = require('./routes/admin');

// Importa rutele definite separat
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const booksRouter = require('./routes/books');

const app = express();
const port = 3000;

// Seteaza EJS ca motor de template
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pentru parsarea datelor din formulare si sesiuni
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'secretKeyBiblioteca', // Cheie secreta pentru sesiune. In productie, foloseste variabila de mediu!
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Pune true doar daca folosesti HTTPS
}));

// Serveste fisiere statice (CSS, JS, imagini)
app.use(express.static(path.join(__dirname, 'public')));

// Foloseste rutele definite
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/books', booksRouter);
app.use('/admin', adminRouter);

// Porneste serverul pe portul specificat
app.listen(port, () => {
    console.log(`Serverul ruleaza la adresa http://localhost:${port}`);
});