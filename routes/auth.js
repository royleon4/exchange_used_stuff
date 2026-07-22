const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');

// GET /signup
router.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/listings');
  res.render('auth/signup');
});

// POST /signup
router.post('/signup', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password) {
    req.flash('error', 'All fields are required.');
    return res.redirect('/signup');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }

  if (password.length < 6) {
    req.flash('error', 'Password must be at least 6 characters.');
    return res.redirect('/signup');
  }

  try {
    const existing = await db.users.findOne({ email: email.toLowerCase() });
    if (existing) {
      req.flash('error', 'An account with that email already exists.');
      return res.redirect('/signup');
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await db.users.insert({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: hash,
      createdAt: new Date()
    });

    req.session.user = { _id: user._id, username: user.username, email: user.email };
    req.flash('success', `Welcome, ${user.username}!`);
    res.redirect('/listings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not create account. Please try again.');
    res.redirect('/signup');
  }
});

// GET /login
router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/listings');
  res.render('auth/login');
});

// POST /login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Email and password are required.');
    return res.redirect('/login');
  }

  try {
    const user = await db.users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    req.session.user = { _id: user._id, username: user.username, email: user.email };
    req.flash('success', `Welcome back, ${user.username}!`);
    res.redirect('/listings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/login');
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
