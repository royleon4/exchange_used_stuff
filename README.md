# Excel & Min 婚禮二手物品需求牆

這個網站讓婚禮賓客在活動前分享可能帶到現場的二手物品，其他賓客可用「我想要」表達興趣，幫助發文者判斷是否值得攜帶。

這不是購物、付款、拍賣或商品保留平台。「我想要」只代表有興趣，實際交換方式由賓客在婚禮現場自行確認。

> 此 repository 目前只包含二手物品需求牆。婚禮酒吧點餐系統不在這個程式內。

一般賓客的操作方式請見 [`USER_MANUAL.md`](./USER_MANUAL.md)。

## 目前功能

### 公開瀏覽與「我想要」

- 全站中文／英文切換，語言選擇保存在瀏覽器。
- 首頁可由管理員設定中英文標題、介紹、標題顏色、公告及主視覺圖片。
- 物品牆 `/items` 會分批載入全部公開貼文，不受固定頁數限制。
- 可按最新、最早或最多人想要排序。
- 發文卡片右上角以台灣時區顯示作者發文時間，例如 `7/31 22:05`。
- 多張照片可用左右按鈕、圓點或手機手指左右滑動切換。
- 物品詳細頁左上角提供「返回物品牆」按鈕。
- 未登入也可按「我想要」及取消；匿名狀態由 HttpOnly cookie 保存。
- 使用者登入或註冊後，瀏覽器中的匿名「我想要」會轉到會員帳號；自己的貼文不會被轉入，也不能對自己的貼文新增「我想要」。

### 會員功能

- 註冊、登入及登出。
- 發布、編輯及刪除自己的物品。
- 發文標題至少 3 個字；物品描述可留空且沒有字數上限。
- 每篇貼文可上傳 1 至 9 張 JPG、PNG 或 WebP 圖片，單張上限 8 MB。
- 登入後可留言；發文者可開啟或關閉新留言。
- 個人頁面可查看自己的貼文、按過「我想要」的物品、修改公開暱稱及密碼。

### 管理員功能

- 與一般會員共用 `/login` 登入入口。
- 管理會員暱稱、角色、啟用狀態及密碼重設。
- 保護最後一位有效管理員，避免所有管理員同時被停用或降級。
- 查看與編輯所有貼文的內容、物品狀態、留言開關及公開狀態。
- 管理員刪除貼文時，會永久刪除資料庫中的貼文及相關留言、「我想要」與圖片資料列。
- Google Drive 圖片會先加入清理佇列；實體檔案不保證與資料庫同時刪除。
- 隱藏、恢復或刪除留言。
- 修改首頁中英文內容、標題顏色、主視覺圖片、公告與註冊開關。

## 重要行為

### 「我想要」資料完整性

`post_wants` 使用兩組部分唯一索引：

- 已登入會員：`user_id + post_id`
- 匿名瀏覽器：`anon_id + post_id`

另外有資料檢查限制每筆紀錄只能屬於會員或匿名瀏覽器其中一種。`npm run db:migrate` 會在舊資料庫需要時整理重複紀錄並建立上述完整性物件。

每篇貼文的新增、取消與匿名轉會員流程會使用 PostgreSQL advisory transaction lock，避免同一篇貼文的同時操作互相覆蓋。

### 刪除規則

- 一般會員刪除自己的貼文：貼文會標記為刪除並從公開畫面移除。
- 管理員在後台永久刪除貼文：資料庫會實際刪除貼文及其關聯資料，並排程清理圖片。

## 技術架構

- Frontend：React 19、TypeScript、Vite、React Router、TanStack Query、Tailwind CSS
- Backend：Node.js 20+、Express 5、Zod、JWT、bcryptjs
- Database：PostgreSQL、Drizzle ORM
- Images：Replit Google Drive Connector、multer、sharp
- Tests：Vitest、Supertest
- CI：GitHub Actions

## 專案結構

```text
client/src/              React 前端
server/routes/           HTTP routes
server/services/         資料庫交易與服務邏輯
server/anonymous-id.ts   匿名瀏覽器 ID 與 cookie 共用處理
server/post-card.ts      貼文卡片 API 序列化
shared/                  前後端共用 schema、驗證與 API 型別
tests/                   單元及資料庫整合測試
drizzle/                 應用程式資料修復 SQL
```

「我想要」的寫入 route 集中在 `server/routes/wants.routes.ts`；`posts.routes.ts` 只負責貼文讀寫，避免同一功能存在兩套實作。

## 本機啟動

需要 Node.js 20 以上與 PostgreSQL。

```bash
npm install
cp .env.example .env
npm run db:push
npm run seed
npm run dev
```

開發環境預設位置：

- 前端：`http://localhost:5000`
- API：`http://localhost:3001`
- 健康檢查：`http://localhost:3001/api/health`

## 環境變數

| 變數 | 用途 |
|---|---|
| `DATABASE_URL` | PostgreSQL 連線字串 |
| `SESSION_SECRET` | 登入 cookie 的 JWT 簽章；正式環境必填 |
| `GOOGLE_DRIVE_FOLDER_ID` | 圖片根資料夾 ID |
| `ADMIN_USERNAME` | 初始管理員帳號；未設定時為 `admin` |
| `ADMIN_PASSWORD` | 初始管理員密碼；未設定時為 `admin123` |
| `ADMIN_NICKNAME` | 初始管理員顯示暱稱 |
| `PORT` | 正式環境 server port，預設 5000 |
| `API_PORT` | 開發 API port，預設 3001 |
| `NODE_ENV` | `development` 或 `production` |

正式部署前應設定高強度 `SESSION_SECRET` 與 `ADMIN_PASSWORD`，並在第一次登入後修改管理員密碼。

## 管理員初始資料

網站啟動或執行 `npm run seed` 時，若資料庫沒有指定帳號，系統會建立初始管理員。可使用 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 與 `ADMIN_NICKNAME` 覆蓋預設值。

舊版預設密碼 `adim123` 會遷移為目前設定的初始密碼；已由管理員自行修改過的密碼不會被覆蓋。

## 資料庫與部署

正式啟動指令：

```bash
npm run start
```

`start` 只啟動正式伺服器，**不會執行資料庫 migration 或 schema push**。第一次部署、資料表結構有變更或切換資料庫時，必須先執行：

```bash
npm run db:push
npm run seed
```

`db:push` 會先執行應用程式 migration，再同步 Drizzle schema：

```text
npm run db:migrate
Drizzle schema push
```

執行前應再次確認 `DATABASE_URL` 指向正確環境。

### 常用指令

```bash
npm run dev       # 同時啟動 API 與前端
npm run check     # TypeScript 檢查
npm test          # 執行全部測試
npm run build     # 建立正式版前端
npm run db:migrate# 執行應用程式資料修復 migration
npm run db:push   # migration 後同步 Drizzle schema
npm run seed      # 建立站台設定與缺少的初始管理員
npm run start     # 啟動正式環境，不執行資料庫變更
```

## GitHub Actions

Pull request 與推送到 `main` 時，CI 會：

1. 啟動 PostgreSQL 測試資料庫。
2. 安裝 development 與 optional dependencies。
3. 確認 TypeScript、Node 型別與 Vitest 可用。
4. 執行 TypeScript 檢查。
5. 執行 migration 與 Drizzle schema push。
6. 執行單元及資料庫整合測試。
7. 建立正式版前端。

目前 workflow 使用 `npm install --package-lock=false`，是為了避開 Replit lock file 來源差異。後續可在統一 Node 與 npm registry 環境重新產生 lock file，再改用 `npm ci` 提升可重現性。

## 圖片流程

1. 瀏覽器上傳圖片。
2. Server 驗證檔案大小及類型。
3. sharp 自動旋轉、縮至最長邊 1600px、移除 metadata，並轉成 WebP quality 82。
4. Server 透過 Replit Google Drive Connector 上傳到指定資料夾。
5. Database 保存 Drive file ID 與圖片 metadata。
6. 前端透過 `/api/media/:imageId` 讀取圖片，不直接暴露 Drive 憑證或任意 file ID。

## 安全原則

- 密碼只保存 bcrypt hash。
- JWT 僅放在 HttpOnly cookie。
- 正式環境 cookie 使用 `Secure` 與 `SameSite=Lax`。
- 註冊、登入與修改密碼有 rate limit。
- 需要登入的 API 會重新確認會員是否啟用及目前角色。
- 不能停用或降級最後一位有效管理員。
- 不能對自己的貼文新增「我想要」。
- Google 連線、Database URL 與 Session Secret 不得提交到 Git。
- 公開畫面只顯示暱稱，不顯示登入帳號。

## 已知限制

- 完整圖片拖曳重排尚未完成。
- Google Drive 每篇貼文子資料夾與實體孤兒圖片的排程清理尚未完成。
- 管理後台尚未提供完整搜尋、篩選與分頁。
- 測試已涵蓋主要驗證、會員及「我想要」資料完整性，但尚未涵蓋所有瀏覽器互動情境。

完整早期產品規格請見 [`docs/REPLIT_BUILD_PROMPT.md`](./docs/REPLIT_BUILD_PROMPT.md)。
