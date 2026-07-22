const express = require('express');
const router = express.Router();
const db = require('../db');

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please log in to send messages.');
    return res.redirect('/login');
  }
  next();
}

// POST /messages — send a message to a listing owner
router.post('/', requireAuth, async (req, res) => {
  const { listingId, content } = req.body;

  if (!content || !content.trim()) {
    req.flash('error', 'Message cannot be empty.');
    return res.redirect('/listings/' + listingId);
  }

  try {
    const listing = await db.listings.findOne({ _id: listingId });
    if (!listing) {
      req.flash('error', 'Listing not found.');
      return res.redirect('/listings');
    }

    if (listing.userId === req.session.user._id) {
      req.flash('error', 'You cannot message yourself.');
      return res.redirect('/listings/' + listingId);
    }

    await db.messages.insert({
      listingId,
      senderId: req.session.user._id,
      recipientId: listing.userId,
      content: content.trim(),
      createdAt: new Date()
    });

    req.flash('success', 'Message sent to the seller!');
    res.redirect('/listings/' + listingId);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not send message.');
    res.redirect('/listings/' + listingId);
  }
});

// GET /messages/inbox — view received messages
router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const messages = await db.messages.find({ recipientId: req.session.user._id }).sort({ createdAt: -1 });

    const listingIds = [...new Set(messages.map(m => m.listingId))];
    const senderIds = [...new Set(messages.map(m => m.senderId))];

    const [listings, senders] = await Promise.all([
      db.listings.find({ _id: { $in: listingIds } }),
      db.users.find({ _id: { $in: senderIds } })
    ]);

    const listingMap = {};
    listings.forEach(l => listingMap[l._id] = l);
    const senderMap = {};
    senders.forEach(u => senderMap[u._id] = u.username);

    messages.forEach(m => {
      m.listing = listingMap[m.listingId];
      m.senderName = senderMap[m.senderId] || 'Unknown';
    });

    res.render('messages/inbox', { messages });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load inbox.');
    res.render('messages/inbox', { messages: [] });
  }
});

module.exports = router;
