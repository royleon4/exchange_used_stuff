const Datastore = require('nedb-promises');
const path = require('path');

const db = {
  users: Datastore.create({ filename: path.join(__dirname, 'data/users.db'), autoload: true }),
  listings: Datastore.create({ filename: path.join(__dirname, 'data/listings.db'), autoload: true }),
  messages: Datastore.create({ filename: path.join(__dirname, 'data/messages.db'), autoload: true }),
};

// Ensure data directory exists
const fs = require('fs');
if (!fs.existsSync('data')) fs.mkdirSync('data');

// Create indexes
db.users.ensureIndex({ fieldName: 'email', unique: true, sparse: true });
db.users.ensureIndex({ fieldName: 'replitUserId', unique: true, sparse: true });
db.listings.ensureIndex({ fieldName: 'createdAt' });
db.messages.ensureIndex({ fieldName: 'listingId' });

module.exports = db;
