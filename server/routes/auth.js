const express = require('express');
const router = express.Router();

// Example authentication route
router.post('/login', (req, res) => {
  // Dummy authentication logic
  const { username, password } = req.body;
  if (username === 'admin' && password === 'password') {
    req.session.user_id = username;
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

module.exports = router;
