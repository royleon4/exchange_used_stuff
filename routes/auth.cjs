const express = require('express');
const router = express.Router();

// POST /logout — sign out of Replit Auth and destroy the local session
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/__replauthlogout'));
});

module.exports = router;
