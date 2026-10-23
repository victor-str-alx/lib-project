// routes/admin.js
const express = require('express');
const db = require('../database/connection');
const router = express.Router();

// Middleware pentru a verifica dacă utilizatorul este admin
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send('Acces interzis. Doar administratorii pot accesa această funcționalitate.');
    }
    next();
};

// Ruta pentru blocarea unui utilizator
router.post('/block-user', requireAdmin, async (req, res) => {
    const { user_id } = req.body;

    try {
        await db.execute(
            'UPDATE Users SET is_blacklisted = TRUE WHERE id = ?',
            [user_id]
        );

        res.redirect('/manage-users?message=Utilizatorul a fost blocat cu succes!');

    } catch (error) {
        console.error('Eroare la blocarea utilizatorului:', error);
        res.status(500).send('Eroare la blocarea utilizatorului.');
    }
});

// Ruta pentru deblocarea unui utilizator
router.post('/unblock-user', requireAdmin, async (req, res) => {
    const { user_id } = req.body;

    try {
        await db.execute(
            'UPDATE Users SET is_blacklisted = FALSE WHERE id = ?',
            [user_id]
        );

        res.redirect('/manage-users?message=Utilizatorul a fost deblocat cu succes!');

    } catch (error) {
        console.error('Eroare la deblocarea utilizatorului:', error);
        res.status(500).send('Eroare la deblocarea utilizatorului.');
    }
});

// Rute pentru zona de administrare

// Exemplu: pagina principala admin
router.get('/', (req, res) => {
    res.render('dashboard/reports');
});

module.exports = router;