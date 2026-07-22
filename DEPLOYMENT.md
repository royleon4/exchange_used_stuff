# Replit 部署指南

## 1. 匯入專案

在 Replit 以 GitHub repo 匯入本專案，確認 Node.js 版本為 20 以上。

## 2. 建立 PostgreSQL

在 Replit 建立 PostgreSQL database，確認 `DATABASE_URL` 已存在於 Secrets。

## 3. 設定 Secrets

至少新增：

```text
DATABASE_URL
SESSION_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GOOGLE_DRIVE_FOLDER_ID
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_NICKNAME
```

產生 session secret：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

不要把任何真實 secret 寫入 `.env.example` 或 commit。

## 4. Google Drive OAuth

1. 在 Google Cloud Console 建立專案。
2. 啟用 Google Drive API。
3. 建立 OAuth consent screen。
4. 建立 OAuth client。
5. 使用婚禮專用 Google 帳號完成授權並取得 refresh token。
6. 在 Google Drive 建立專用圖片資料夾。
7. 把資料夾網址中的 ID 放入 `GOOGLE_DRIVE_FOLDER_ID`。

建議使用專門帳號，不要使用個人的主要 Google Drive。

## 5. 初始化

在 Replit Shell 執行：

```bash
npm install
npm run db:push
npm run seed
npm run check
npm test
npm run build
```

`seed` 會建立站台設定；若資料庫沒有相同帳號，也會依 Secrets 建立管理員。

## 6. Deployment

本專案包含 Express server、登入與資料庫，不可使用純 Static Deployment。

建議 deployment：

- Build command: `npm install && npm run check && npm run build`
- Run command: `npm run db:push && npm run seed && npm run start`

## 7. 上線檢查

- `/api/health` 回傳 `{ "ok": true }`
- 可註冊與登入
- 管理員可登入 `/admin`
- 可上傳圖片，且重新啟動後仍可顯示
- 建立貼文必須至少有一張圖片
- 未登入者不可發布、留言或按「我想要」
- secrets 未出現在 GitHub 或前端 bundle

## 8. 維護

- 定期確認 Google Drive 容量。
- 定期執行或檢查孤兒圖片 cleanup。
- 變更 database schema 後先在測試環境執行 `npm run db:push`。
- 更新依賴後依序執行 check、test、build。
