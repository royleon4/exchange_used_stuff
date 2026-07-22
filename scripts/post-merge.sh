#!/bin/bash
set -e

npm install --yes

if [ -n "$DATABASE_URL" ]; then
  npm run db:push
  npm run seed
fi
