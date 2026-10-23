// Rute pentru autentificare si inregistrare

const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/connection');

const router = express.Router();

// Exemplu: pagina de login
router.get('/login', (req, res) => {
    res.render('pages/login', {
        title: 'Autentificare',
        user: req.session.user || null
    });
});

// Exemplu: pagina de inregistrare
router.get('/register', (req, res) => {
    res.render('pages/register', {
        title: 'Înregistrare',
        user: req.session.user || null
    });
});

// Ruta POST pentru procesarea înregistrării
router.post('/register', async (req, res) => {
    const { card_number, name, email, password, address, phone } = req.body;

    try {
        if (!card_number || !name || !email || !password) {
            return res.status(400).send('Toate câmpurile obligatorii trebuie completate!');
        }

        const [existingUsers] = await db.execute(
            'SELECT id FROM Users WHERE email = ? OR card_number = ?',
            [email, card_number]
        );

        if (existingUsers.length > 0) {
            return res.status(400).send('Există deja un utilizator cu acest email sau număr de carte!');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const [result] = await db.execute(
            `INSERT INTO Users (card_number, name, email, password_hash, address, phone, role)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [card_number, name, email, hashedPassword, address, phone, 'patron']
        );

        res.redirect('/auth/login?message=Înregistrare reușită! Te poți autentifica.');

    } catch (error) {
        console.error('Eroare la înregistrare:', error);
        res.status(500).send('A apărut o eroare la înregistrare. Încearcă din nou.');
    }
});

// Ruta POST pentru procesarea login-ului
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).send('Email și parolă sunt obligatorii!');
        }

        const [users] = await db.execute(
            'SELECT * FROM Users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(400).send('Email sau parolă incorectă!');
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(400).send('Email sau parolă incorectă!');
        }

        if (user.is_blacklisted) {
            return res.status(403).send('Contul tău este blocat. Contactează biblioteca.');
        }

        req.session.user = {
            id: user.id,
            card_number: user.card_number,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // >>>>>>>>>>>> CODUL CORECTAT ÎNCEPE AICI <<<<<<<<<<<<
        // 8. După logare, redirecționează în funcție de rol
        if (req.session.user.role === 'patron') {
            res.redirect('/dashboard/patron');
        } else if (req.session.user.role === 'librarian' || req.session.user.role === 'admin') {
            res.redirect('/dashboard/librarian');
        } else {
            res.redirect('/');
        }
        // >>>>>>>>>>>> CODUL CORECTAT SE TERMINĂ AICI <<<<<<<<<<<<

    } catch (error) {
        console.error('Eroare la autentificare:', error);
        res.status(500).send('A apărut o eroare la autentificare. Încearcă din nou.');
    }
});

// Ruta GET pentru logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

module.exports = router;