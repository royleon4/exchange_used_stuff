---
name: Replit Auth approach
description: How Replit Auth is implemented here and why no npm package is used
---
There is no `@replit/replit-auth` npm package (and `replit-auth` on npm is unofficial third-party). Use Replit's built-in header-based auth: read `X-Replit-User-Id/-Name/-Profile-Image` headers (injected by Replit's proxy), redirect to `https://replit.com/auth_with_repl_site?domain=<host>` for login, and `/__replauthlogout` for logout.
**Why:** planned package didn't exist; header system is official and dependency-free.
**How to apply:** headers only appear via the Replit proxy — test locally by sending them with curl.
