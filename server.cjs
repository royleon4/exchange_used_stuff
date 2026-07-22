const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Ensure uploads directory exists
if (!fs.existsSync('public/uploads')) {
  fs.mkdirSync('public/uploads', { recursive: true });
}

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'exchange-stuff-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));

// Flash messages
app.use(flash());

// Replit Auth middleware — reads the authenticated Replit user from request
// headers (set by Replit's proxy) and upserts them into users.db so listings
// and messages can keep referencing internal _id values.
const db = require('./db.cjs');
app.use(async (req, res, next) => {
  req.user = null;

  const replitUserId = req.get('X-Replit-User-Id');
  const replitUserName = req.get('X-Replit-User-Name');

  if (replitUserId && replitUserName) {
    try {
      let user = await db.users.findOne({ replitUserId });
      const profileImage = req.get('X-Replit-User-Profile-Image') || null;

      if (!user) {
        user = await db.users.insert({
          replitUserId,
          username: replitUserName,
          profileImage,
          createdAt: new Date()
        });
      } else if (user.username !== replitUserName || user.profileImage !== profileImage) {
        await db.users.update(
          { _id: user._id },
          { $set: { username: replitUserName, profileImage } }
        );
        user.username = replitUserName;
        user.profileImage = profileImage;
      }

      req.user = user;
    } catch (err) {
      console.error('Failed to sync Replit user:', err);
    }
  }

  next();
});

// Locals middleware
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.loginUrl = 'https://replit.com/auth_with_repl_site?domain=' + encodeURIComponent(req.get('host') || '');
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// Routes
const authRoutes = require('./routes/auth.cjs');
const listingRoutes = require('./routes/listings.cjs');
const messageRoutes = require('./routes/messages.cjs');

app.use('/', authRoutes);
app.use('/listings', listingRoutes);
app.use('/messages', messageRoutes);

// Home → redirect to listings
app.get('/', (req, res) => res.redirect('/listings'));

// 404
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { message: 'Something went wrong' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Exchange platform running on port ${PORT}`);
});
