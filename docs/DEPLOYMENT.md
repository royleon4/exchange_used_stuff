# Replit 部署指南

## 1. 匯入專案

在 Replit 以 GitHub repo 匯入本專案，確認 Node.js 版本為 20 以上。

## 2. 建立 PostgreSQL

在 Replit 建立 PostgreSQL database，確認 `DATABASE_URL` 已存在於 Secrets。

## 3. 連接 Google Drive

在 Replit Connectors 中新增 Google Drive 連線，使用婚禮專用 Google 帳號授權。

在 Google Drive 建立專用圖片資料夾，將資料夾網址中的 ID 存為：

```text
GOOGLE_DRIVE_FOLDER_ID
```

建議使用專門帳號，不要使用個人的主要 Google Drive。

## 4. 設定 Secrets

至少新增：

```text
DATABASE_URL
SESSION_SECRET
GOOGLE_DRIVE_FOLDER_ID
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_NICKNAME
```

本專案不使用婚禮邀請碼，也不需要 Google OAuth client secret 或 refresh token；Google 授權由 Replit Connector 管理。

產生 session secret：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

不要把任何真實 secret 寫入 `.env.example` 或 commit。

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
- 首頁與 `/items` 都可正常顯示
- 中／EN 切換後重新整理仍保留語言
- 可註冊與登入
- 管理員可登入 `/admin`
- 可上傳圖片，且重新啟動後仍可顯示
- 建立貼文必須至少有一張圖片
- 多張圖片在卡片與詳情頁可左右切換
- 單張圖片不顯示左右切換按鈕
- secrets 未出現在 GitHub 或前端 bundle

## 8. 維護

- 定期確認 Google Drive 容量。
- 定期執行或檢查孤兒圖片 cleanup。
- 變更 database schema 後先在測試環境執行 `npm run db:push`。
- 更新依賴後依序執行 check、test、build。
