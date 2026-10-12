// routes/books.js
const express = require('express');
const db = require('../database/connection');
const router = express.Router();

// Ruta GET pentru afișarea tuturor cărților
router.get('/', async (req, res) => {
    try {
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

        res.render('books/list', {
            title: 'Toate Cărțile',
            user: req.session.user || null,
            books: books
        });

    } catch (error) {
        console.error('Eroare la preluarea cărților:', error);
        res.status(500).send('Eroare la încărcarea cărților.');
    }
});

// Ruta POST pentru împrumutarea unei cărți (NOUĂ)
router.post('/borrow', async (req, res) => {
    // Verifică dacă utilizatorul este logat
    if (!req.session.user) {
        return res.status(401).send('Trebuie să fii logat pentru a împrumuta cărți!');
    }

    const { copy_id } = req.body;
    const user_id = req.session.user.id;

    try {
        // Verifică dacă copia cărții există și este disponibilă
        const [copies] = await db.execute(
            'SELECT * FROM BookCopies WHERE id = ? AND status = "available"',
            [copy_id]
        );

        if (copies.length === 0) {
            return res.status(400).send('Cartea nu este disponibilă pentru împrumut!');
        }

        // Calculează datele pentru împrumut (14 zile)
        const borrow_date = new Date().toISOString().split('T')[0]; // Data de astăzi
        const due_date = new Date();
        due_date.setDate(due_date.getDate() + 14); // Împrumut pentru 14 zile
        const due_date_str = due_date.toISOString().split('T')[0];

        // Începe o tranzacție pentru a asigura consistența datelor
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Actualizează statusul cărții la "borrowed"
            await connection.execute(
                'UPDATE BookCopies SET status = "borrowed" WHERE id = ?',
                [copy_id]
            );

            // 2. Creează înregistrarea pentru împrumut
            await connection.execute(
                `INSERT INTO Loans (copy_id, user_id, borrow_date, due_date) 
                 VALUES (?, ?, ?, ?)`,
                [copy_id, user_id, borrow_date, due_date_str]
            );

            // Confirmă tranzacția
            await connection.commit();
            connection.release();

            // Redirectează înapoi cu un mesaj de succes
            res.redirect('/?message=Cartea a fost împrumutată cu succes!');

        } catch (error) {
            // Anulează tranzacția în caz de eroare
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Eroare la împrumutarea cărții:', error);
        res.status(500).send('A apărut o eroare la împrumutarea cărții.');
    }
});

// Ruta POST pentru returnarea unei cărți
router.post('/return', async (req, res) => {
    // Verifică dacă utilizatorul este logat
    if (!req.session.user) {
        return res.status(401).send('Trebuie să fii logat pentru a returna cărți!');
    }

    const { loan_id } = req.body;
    const user_id = req.session.user.id;

    try {
        // Verifică dacă împrumutul există și aparține utilizatorului curent
        const [loans] = await db.execute(
            `SELECT Loans.*, BookCopies.id AS copy_id 
             FROM Loans 
             INNER JOIN BookCopies ON Loans.copy_id = BookCopies.id 
             WHERE Loans.id = ? AND Loans.user_id = ? AND Loans.return_date IS NULL`,
            [loan_id, user_id]
        );

        if (loans.length === 0) {
            return res.status(400).send('Împrumutul nu a fost găsit sau a fost deja returnat!');
        }

        const loan = loans[0];
        const return_date = new Date().toISOString().split('T')[0]; // Data de astăzi

        // Începe o tranzacție pentru a asigura consistența datelor
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Actualizează data de returnare în împrumut
            await connection.execute(
                'UPDATE Loans SET return_date = ? WHERE id = ?',
                [return_date, loan_id]
            );

            // 2. Actualizează statusul cărții înapoi la "available"
            await connection.execute(
                'UPDATE BookCopies SET status = "available" WHERE id = ?',
                [loan.copy_id]
            );

            // Confirmă tranzacția
            await connection.commit();
            connection.release();

            // Redirectează înapoi cu un mesaj de succes
            res.redirect('/my-loans?message=Cartea a fost returnată cu succes!');

        } catch (error) {
            // Anulează tranzacția în caz de eroare
            await connection.rollback();
            connection.release();
            throw error;
        }

    } catch (error) {
        console.error('Eroare la returnarea cărții:', error);
        res.status(500).send('A apărut o eroare la returnarea cărții.');
    }
});

module.exports = router;