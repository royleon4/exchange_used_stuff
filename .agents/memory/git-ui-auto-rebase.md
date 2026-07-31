---
name: Replit Git UI auto-rebase loop
description: Recurring "middle of a rebase" errors on this repl and how to resolve them
---

The Replit Git UI auto-starts a rebase when the user clicks Pull while local main and origin/main have diverged. This has happened repeatedly on this project.

**Why:** GitHub push fails (invalid credentials), so local commits pile up; any UI pull then triggers an interactive rebase that gets stuck.

**Recurring after-pull symptoms:** every pull from GitHub tends to (1) bring new `site_settings` columns → "目前無法讀取管理資料" / column does not exist errors, fixed by `npm run db:push` in dev; and (2) revert package.json `start` back to `npm run db:push && ...`, which must be re-fixed to just `NODE_ENV=production tsx server/index.ts` before publishing. Checkout may also land on a feature branch, not main — check `git status -sb` first.

**How to apply:** `git rebase --abort` is safe once local main already contains the merge of origin/main (check `git log`). After abort, verify branch state with `git status -sb`. Long-term fix: user must reconnect GitHub in the Git pane so pushes succeed and branches stop diverging.
