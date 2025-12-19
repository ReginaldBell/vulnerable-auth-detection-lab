const express = require('express');
const router = express.Router();

// Example internal route
router.get('/status', (req, res) => {
  res.json({ status: 'ok', user: req.session.user_id || null });
});

module.exports = router;
