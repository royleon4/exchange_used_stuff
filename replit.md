# SwapShop — Used Stuff Exchange Platform

A community platform where users can give away or sell used items, and others can browse and contact sellers/givers.

## Tech Stack
- **Runtime**: Node.js 24 + Express
- **Views**: EJS templates (server-rendered)
- **Database**: NeDB (embedded, file-based NoSQL)
- **Auth**: bcryptjs + express-session
- **File uploads**: Multer (images stored in `public/uploads/`)

## Project Structure
```
server.js          — Express app entry point (port 5000)
db.js              — NeDB datastore setup
routes/
  auth.js          — /signup, /login, /logout
  listings.js      — /listings CRUD
  messages.js      — /messages (contact seller, inbox)
views/
  auth/            — signup.ejs, login.ejs
  listings/        — index.ejs, new.ejs, show.ejs, edit.ejs
  messages/        — inbox.ejs
  partials/        — nav.ejs, flash.ejs
  error.ejs
public/
  css/style.css    — all styles
  uploads/         — user-uploaded images (gitignored)
data/              — NeDB .db files (gitignored)
```

## Key Features
- Sign up / log in (session-based auth)
- Post listings: give away (free) or sell (with price)
- Categories, location, optional photo
- Browse with search + type + sort filters
- Contact seller via message form on the listing page
- Inbox for listing owners to read received messages
- Edit and delete own listings

## User Preferences
- Keep the design clean and minimal
