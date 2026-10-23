// routes/index.js
const express = require('express');
const db = require('../database/connection');
const router = express.Router();

// Ruta pentru pagina principala - AFIȘEAZĂ TOATE CĂRȚILE
router.get('/', async (req, res) => {
    try {
        // Interogare complexă pentru a prelua toate detaliile cărților
        const [books] = await db.execute(`
            SELECT 
                Books.id, 
                Books.unique_number, 
                Books.title,
                Publishers.name AS publisher,
                GROUP_CONCAT(Authors.name SEPARATOR ', ') AS authors,
                Branches.name AS branch_name,
                BookCopies.id AS copy_id,
                BookCopies.status
            FROM Books
            LEFT JOIN Publishers ON Books.publisher_id = Publishers.id
            LEFT JOIN BookAuthors ON Books.id = BookAuthors.book_id
            LEFT JOIN Authors ON BookAuthors.author_id = Authors.id
            LEFT JOIN BookCopies ON Books.id = BookCopies.book_id
            LEFT JOIN Branches ON BookCopies.branch_id = Branches.id
            GROUP BY Books.id, BookCopies.id
            ORDER BY Books.title
        `);

        res.render('pages/home', {
            title: 'Biblioteca Digitală - Toate Cărțile',
            user: req.session.user || null,
            books: books
        });

    } catch (error) {
        console.error('Eroare la preluarea cărților:', error);
        res.status(500).send('Eroare la încărcarea paginii principale.');
    }
});

// Ruta pentru dashboard-ul patronului
router.get('/dashboard/patron', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    if (req.session.user.role !== 'patron') {
        return res.status(403).send('Acces interzis. Nu ai permisiunile necesare.');
    }
    res.render('dashboard/patron', {
        title: 'Panou Utilizator',
        user: req.session.user
    });
});

// Ruta pentru dashboard-ul librarianului/adminului
router.get('/dashboard/librarian', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    if (req.session.user.role !== 'librarian' && req.session.user.role !== 'admin') {
        return res.status(403).send('Acces interzis. Nu ai permisiunile necesare.');
    }
    res.render('dashboard/librarian', {
        title: 'Panou Librarian',
        user: req.session.user
    });
});

// Ruta pentru istoricul împrumuturilor utilizatorului
router.get('/my-loans', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    try {
        // INTEROGARE CORECTATĂ - fără conflict de nume
        const [loans] = await db.execute(`
            SELECT 
                Loans.id AS loan_id,
                Loans.borrow_date,
                Loans.due_date,
                Loans.return_date,
                Books.title,
                Books.unique_number,
                Authors.name AS author,
                Publishers.name AS publisher,
                Branches.name AS branch_name,
                DATEDIFF(IFNULL(Loans.return_date, CURDATE()), Loans.borrow_date) AS days_borrowed,
                GREATEST(0, DATEDIFF(CURDATE(), Loans.due_date)) AS days_overdue
            FROM Loans
            INNER JOIN BookCopies ON Loans.copy_id = BookCopies.id
            INNER JOIN Books ON BookCopies.book_id = Books.id
            LEFT JOIN BookAuthors ON Books.id = BookAuthors.book_id
            LEFT JOIN Authors ON BookAuthors.author_id = Authors.id
            LEFT JOIN Publishers ON Books.publisher_id = Publishers.id
            LEFT JOIN Branches ON BookCopies.branch_id = Branches.id
            WHERE Loans.user_id = ?
            ORDER BY Loans.borrow_date DESC
        `, [req.session.user.id]);

        res.render('dashboard/loan-history', {
            title: 'Istoricul meu de împrumuturi',
            user: req.session.user,
            loans: loans
        });

    } catch (error) {
        console.error('Eroare la preluarea istoricului împrumuturilor:', error);
        res.status(500).send('Eroare la încărcarea istoricului.');
    }
});

// Ruta pentru rapoarte - accesibilă doar librarianilor și adminilor
router.get('/reports', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    if (req.session.user.role !== 'librarian' && req.session.user.role !== 'admin') {
        return res.status(403).send('Acces interzis. Nu ai permisiunile necesare.');
    }

    try {
        // Raport 1: Cărți împrumutate în prezent
        const [currentLoans] = await db.execute(`
            SELECT 
                Books.title,
                Books.unique_number,
                Authors.name AS author,
                Users.name AS borrower_name,
                Users.card_number,
                Loans.borrow_date,
                Loans.due_date,
                DATEDIFF(CURDATE(), Loans.due_date) AS days_overdue
            FROM Loans
            INNER JOIN BookCopies ON Loans.copy_id = BookCopies.id
            INNER JOIN Books ON BookCopies.book_id = Books.id
            LEFT JOIN BookAuthors ON Books.id = BookAuthors.book_id
            LEFT JOIN Authors ON BookAuthors.author_id = Authors.id
            INNER JOIN Users ON Loans.user_id = Users.id
            WHERE Loans.return_date IS NULL
            ORDER BY Loans.due_date ASC
        `);

        // Raport 2: Cărți restante (întârziate)
        const [overdueLoans] = await db.execute(`
            SELECT 
                Books.title,
                Books.unique_number,
                Authors.name AS author,
                Users.name AS borrower_name,
                Users.card_number,
                Loans.borrow_date,
                Loans.due_date,
                DATEDIFF(CURDATE(), Loans.due_date) AS days_overdue
            FROM Loans
            INNER JOIN BookCopies ON Loans.copy_id = BookCopies.id
            INNER JOIN Books ON BookCopies.book_id = Books.id
            LEFT JOIN BookAuthors ON Books.id = BookAuthors.book_id
            LEFT JOIN Authors ON BookAuthors.author_id = Authors.id
            INNER JOIN Users ON Loans.user_id = Users.id
            WHERE Loans.return_date IS NULL 
            AND Loans.due_date < CURDATE()
            ORDER BY days_overdue DESC
        `);

        // Raport 3: Statistici generale
        const [stats] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM Books) AS total_books,
                (SELECT COUNT(*) FROM Users WHERE role = 'patron') AS total_patrons,
                (SELECT COUNT(*) FROM Loans WHERE return_date IS NULL) AS active_loans,
                (SELECT COUNT(*) FROM Loans WHERE return_date IS NULL AND due_date < CURDATE()) AS overdue_loans,
                (SELECT COUNT(*) FROM Branches) AS total_branches
        `);

        res.render('dashboard/reports', {
            title: 'Rapoarte - Panou Librarian',
            user: req.session.user,
            currentLoans: currentLoans,
            overdueLoans: overdueLoans,
            stats: stats[0]
        });

    } catch (error) {
        console.error('Eroare la generarea rapoartelor:', error);
        res.status(500).send('Eroare la generarea rapoartelor.');
    }
});

// Ruta pentru gestionarea utilizatorilor (doar admin)
router.get('/manage-users', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    if (req.session.user.role !== 'admin') {
        return res.status(403).send('Acces interzis. Doar administratorii pot gestiona utilizatorii.');
    }

    try {
        const [users] = await db.execute(`
            SELECT id, card_number, name, email, phone, role, is_blacklisted, created_at
            FROM Users 
            ORDER BY created_at DESC
        `);

        res.render('dashboard/manage-users', {
            title: 'Gestionare Utilizatori',
            user: req.session.user,
            users: users,
            message: req.query.message // <- ADAUGĂ ASTA
        });

    } catch (error) {
        console.error('Eroare la preluarea utilizatorilor:', error);
        res.status(500).send('Eroare la încărcarea paginii de gestionare utilizatori.');
    }
});

module.exports = router;