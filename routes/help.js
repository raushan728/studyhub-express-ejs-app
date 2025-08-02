const express = require('express');
const router = express.Router();

// GET /help - Help page
router.get('/', (req, res) => {
    res.render('help', {
        title: 'Help - StudyHub',
        user: req.session.user
    });
});

module.exports = router;
