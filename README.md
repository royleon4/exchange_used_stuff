# Excel & Min 婚禮二手物品需求牆

這個網站讓婚禮賓客在活動前分享可能帶到現場的二手物品，其他賓客可用「我想要」表達興趣，幫助發文者判斷是否值得攜帶。

這不是購物、付款、拍賣或保留商品的平台。「我想要」只代表有興趣，實際交換方式由賓客在婚禮現場自行確認。

> 此 repository 目前只包含二手物品需求牆。婚禮酒吧點餐系統不在這個程式內。

## 目前功能

### 賓客功能

- 全站中文／英文切換，語言選擇保存在瀏覽器。
- 首頁與獨立物品牆 `/items`。
- 物品牆會持續載入全部公開貼文，不受固定筆數限制。
- 可按最新、最早或最多人想要排序。
- 多張照片可用左右按鈕、圓點或手機手指左右滑動切換。
- 未登入也可瀏覽物品並按「我想要」；再次點選可取消。
- 會員可發布、編輯及刪除自己的物品。
- 發文標題至少 3 個字；物品描述可留空且沒有字數上限。
- 每篇貼文可上傳 1 至 9 張 JPG、PNG 或 WebP 圖片，單張上限 8 MB。
- 會員可留言、修改自己的留言，以及在貼文中開啟或關閉留言。
- 會員中心可查看自己的貼文、收藏、修改公開暱稱及密碼。

### 管理員功能

- 與一般會員共用 `/login` 登入入口。
- 管理會員暱稱、角色、啟用狀態及密碼重設。
- 保護最後一位有效管理員，避免所有管理員同時被停用或降級。
- 查看與編輯所有貼文的內容、物品狀態、留言開關及公開狀態。
- 將貼文設為刪除時，會永久刪除資料庫中的貼文及相關留言、「我想要」與圖片資料列。
- 貼文的 Google Drive 圖片會先加入清理佇列；實體檔案不保證在同一時間立即刪除。
- 隱藏、恢復或刪除留言。
- 修改首頁中英文標題、介紹、公告與註冊開關。

## 技術架構

- Frontend：React 19、TypeScript、Vite、React Router、TanStack Query、Tailwind CSS
- Backend：Node.js 20+、Express 5、Zod、JWT、bcryptjs
- Database：PostgreSQL、Drizzle ORM
- Images：Replit Google Drive Connector、multer、sharp
- Tests：Vitest、Supertest
- CI：GitHub Actions

## 本機啟動

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

## 必要環境變數

| 變數 | 用途 |
|---|---|
| `DATABASE_URL` | PostgreSQL 連線字串 |
| `SESSION_SECRET` | Session 簽章；正式環境必填 |
| `GOOGLE_DRIVE_FOLDER_ID` | 圖片根資料夾 ID |
| `ADMIN_USERNAME` | 初始管理員帳號；未設定時為 `admin` |
| `ADMIN_PASSWORD` | 初始管理員密碼；未設定時為 `admin123` |
| `ADMIN_NICKNAME` | 初始管理員顯示暱稱 |

其他可用變數：

- `PORT`：正式環境 server port，預設 5000。
- `API_PORT`：開發 API port，預設 3001。

## 管理員初始帳號

網站啟動或執行 `npm run seed` 時，若資料庫沒有指定的管理員帳號，系統會建立：

- 帳號：`admin`
- 密碼：`admin123`

可使用 `ADMIN_USERNAME`、`ADMIN_PASSWORD` 與 `ADMIN_NICKNAME` 覆蓋預設值。舊版預設密碼 `adim123` 會在網站啟動時遷移為 `admin123`；已自行修改過的密碼不會被覆蓋。

正式使用前必須修改預設管理員密碼。

## 資料庫與部署

### 重要現況

正式啟動指令目前是：

```bash
npm run start
```

它只啟動正式伺服器，**不會自動執行 `db:push`**。第一次部署、資料表結構有變更或切換資料庫時，必須先執行：

```bash
npm run db:push
npm run seed
```

Replit 的 `postMerge` 腳本在存在 `DATABASE_URL` 時也會執行上述兩個指令。因此在 Replit 拉取或合併程式前，應先確認 `DATABASE_URL` 指向正確的資料庫，避免意外修改錯誤環境。

### 常用指令

```bash
npm run dev       # 同時啟動 API 與前端
npm run check     # TypeScript 檢查
npm test          # 執行測試
npm run build     # 建立前端正式版本
npm run db:push   # 整理既有想要紀錄並同步 Drizzle schema
npm run seed      # 建立站台設定與缺少的初始管理員
npm run start     # 啟動正式環境，不執行資料庫遷移
```

## GitHub Actions

每次 pull request 與推送到 `main` 都會執行：

1. 安裝 development 與 optional dependencies。
2. 確認 `typescript`、`@types/node` 與 `vitest` 存在。
3. 執行 TypeScript 檢查。
4. 執行測試。
5. 建立正式版前端。

目前 workflow 使用 `--package-lock=false`，是為了避免 Replit 產生的 lock file 內部來源影響 GitHub Runner。後續應在公開 npm registry 與統一 Node 版本下重新產生 `package-lock.json`，再改回可重現的 `npm ci`。

## 圖片流程

1. 瀏覽器上傳 1 至 9 張圖片。
2. Server 驗證檔案大小及類型。
3. sharp 自動旋轉、縮至最長邊 1600px、移除 metadata，並轉成 WebP quality 82。
4. Server 透過 Replit Google Drive Connector 上傳到指定資料夾。
5. Database 只保存 Drive file ID 與圖片 metadata。
6. 前端透過 `/api/media/:imageId` 讀取圖片，不直接暴露 Drive 憑證或任意 file ID。

## 安全原則

- 密碼只保存 bcrypt hash。
- JWT 僅放在 HttpOnly cookie。
- 正式環境 cookie 使用 `Secure` 與 `SameSite=Lax`。
- 註冊、登入與修改密碼有 rate limit。
- 需要登入的 API 會重新確認會員是否啟用及目前角色。
- 不能停用或降級最後一位有效管理員。
- Google 連線、Database URL 與 Session Secret 不得提交到 Git。
- 公開畫面只顯示暱稱，不顯示登入帳號。

## 已知限制與待處理事項

- 「我想要」目前沒有資料庫唯一索引；一般點選可正常新增與取消，但高併發請求仍可能產生重複紀錄，不能把人數當作交易級保留數量。
- 網站啟動時會整理重複的「我想要」紀錄，這個資料修復流程後續應改成獨立 migration，而不是每次啟動都執行。
- 完整圖片拖曳重排尚未完成。
- Google Drive 每篇貼文子資料夾與實體孤兒圖片排程清理尚未完成。
- 管理後台尚未提供搜尋、篩選與分頁。
- API integration tests 仍需補強。

一般賓客的操作方式請見 [`USER_MANUAL.md`](./USER_MANUAL.md)。完整早期產品規格請見 [`docs/REPLIT_BUILD_PROMPT.md`](./docs/REPLIT_BUILD_PROMPT.md)。