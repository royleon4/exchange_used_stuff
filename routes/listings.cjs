const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db.cjs');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images are allowed'));
  }
});

function requireAuth(req, res, next) {
  if (!req.user) {
    req.flash('error', 'Please log in with Replit first.');
    return res.redirect('https://replit.com/auth_with_repl_site?domain=' + encodeURIComponent(req.get('host') || ''));
  }
  next();
}

// GET /listings — browse all
router.get('/', async (req, res) => {
  const { search, type, sort } = req.query;
  let query = {};

  if (type && ['give_away', 'sell'].includes(type)) query.type = type;
  if (search) {
    const re = new RegExp(search, 'i');
    query.$or = [{ title: re }, { description: re }, { category: re }];
  }

  const sortField = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

  try {
    const listings = await db.listings.find(query).sort(sortField);

    // Attach owner usernames
    const userIds = [...new Set(listings.map(l => l.userId))];
    const users = await db.users.find({ _id: { $in: userIds } });
    const userMap = {};
    users.forEach(u => userMap[u._id] = u.username);

    listings.forEach(l => l.ownerName = userMap[l.userId] || 'Unknown');

    res.render('listings/index', { listings, search: search || '', type: type || '', sort: sort || 'newest' });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load listings.');
    res.render('listings/index', { listings: [], search: '', type: '', sort: 'newest' });
  }
});

// GET /listings/new
router.get('/new', requireAuth, (req, res) => {
  res.render('listings/new');
});

// POST /listings
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  const { title, description, price, type, category, location } = req.body;

  if (!title || !description || !type) {
    req.flash('error', 'Title, description, and type are required.');
    return res.redirect('/listings/new');
  }

  try {
    const listing = await db.listings.insert({
      title: title.trim(),
      description: description.trim(),
      price: type === 'sell' ? parseFloat(price) || 0 : 0,
      type,
      category: category || 'Other',
      location: location || '',
      imageUrl: req.file ? '/uploads/' + req.file.filename : null,
      userId: req.user._id,
      createdAt: new Date()
    });

    req.flash('success', 'Listing posted!');
    res.redirect('/listings/' + listing._id);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not create listing.');
    res.redirect('/listings/new');
  }
});

// GET /listings/:id
router.get('/:id', async (req, res) => {
  try {
    const listing = await db.listings.findOne({ _id: req.params.id });
    if (!listing) {
      req.flash('error', 'Listing not found.');
      return res.redirect('/listings');
    }

    const owner = await db.users.findOne({ _id: listing.userId });
    listing.ownerName = owner ? owner.username : 'Unknown';

    // Load messages for this listing (if viewer is owner)
    let messages = [];
    if (req.user && req.user._id === listing.userId) {
      messages = await db.messages.find({ listingId: listing._id }).sort({ createdAt: -1 });
      const senderIds = [...new Set(messages.map(m => m.senderId))];
      const senders = await db.users.find({ _id: { $in: senderIds } });
      const senderMap = {};
      senders.forEach(u => senderMap[u._id] = u.username);
      messages.forEach(m => m.senderName = senderMap[m.senderId] || 'Unknown');
    }

    res.render('listings/show', { listing, messages });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load listing.');
    res.redirect('/listings');
  }
});

// GET /listings/:id/edit
router.get('/:id/edit', requireAuth, async (req, res) => {
  try {
    const listing = await db.listings.findOne({ _id: req.params.id });
    if (!listing || listing.userId !== req.user._id) {
      req.flash('error', 'Not authorized.');
      return res.redirect('/listings');
    }
    res.render('listings/edit', { listing });
  } catch (err) {
    req.flash('error', 'Could not load listing.');
    res.redirect('/listings');
  }
});

// POST /listings/:id/edit
router.post('/:id/edit', requireAuth, upload.single('image'), async (req, res) => {
  const { title, description, price, type, category, location } = req.body;
  try {
    const listing = await db.listings.findOne({ _id: req.params.id });
    if (!listing || listing.userId !== req.user._id) {
      req.flash('error', 'Not authorized.');
      return res.redirect('/listings');
    }

    const updates = {
      title: title.trim(),
      description: description.trim(),
      price: type === 'sell' ? parseFloat(price) || 0 : 0,
      type,
      category: category || 'Other',
      location: location || '',
    };
    if (req.file) updates.imageUrl = '/uploads/' + req.file.filename;

    await db.listings.update({ _id: req.params.id }, { $set: updates });
    req.flash('success', 'Listing updated!');
    res.redirect('/listings/' + req.params.id);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not update listing.');
    res.redirect('/listings/' + req.params.id + '/edit');
  }
});

// POST /listings/:id/delete
router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    const listing = await db.listings.findOne({ _id: req.params.id });
    if (!listing || listing.userId !== req.user._id) {
      req.flash('error', 'Not authorized.');
      return res.redirect('/listings');
    }
    await db.listings.remove({ _id: req.params.id });
    await db.messages.remove({ listingId: req.params.id }, { multi: true });
    req.flash('success', 'Listing deleted.');
    res.redirect('/listings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not delete listing.');
    res.redirect('/listings');
  }
});

module.exports = router;
