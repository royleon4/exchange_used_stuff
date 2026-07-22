# Excel & Min 二手物品需求牆

讓婚禮賓客在活動前分享可能帶到現場交換的二手物品，其他賓客可透過「我想要」表達興趣，幫助發文者判斷是否值得攜帶。這不是交易、付款或拍賣平台。

## 目前完成

- 婚禮邀請網站延伸出的 sage／cream 視覺系統與手機優先版面
- 全站中／英切換，語言選擇保存在瀏覽器
- 首頁與獨立物品牆 `/items`
- 物品卡片與貼文詳情的多圖輪播；只有一張圖片時不顯示切換按鈕
- 會員註冊、登入、登出與 HttpOnly cookie session
- PostgreSQL／Drizzle 核心資料表
- Replit Google Drive Connector 圖片上傳、WebP 壓縮與圖片代理
- 貼文建立、列表、詳情、軟刪除與作者權限
- 最新、最早、最多人想要排序
- 「我想要」新增與取消
- 留言新增、修改、刪除與文章留言開關
- 會員中心、管理後台骨架及管理 API
- Replit build／deployment 設定

## 技術架構

- Frontend: React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS
- Backend: Node.js 20+, Express 5, Zod, JWT, bcryptjs
- Database: PostgreSQL, Drizzle ORM
- Images: Replit Google Drive Connector, multer, sharp
- Tests: Vitest, Supertest

## 本機啟動

```bash
npm install
cp .env.example .env
npm run db:push
npm run seed
npm run dev
```

開發環境：

- 前端：`http://localhost:5000`
- API：`http://localhost:3001`
- 健康檢查：`http://localhost:3001/api/health`

## 必要環境變數

| 變數 | 用途 |
|---|---|
| `DATABASE_URL` | PostgreSQL 連線字串 |
| `SESSION_SECRET` | Session 簽章；正式環境必填 |
| `GOOGLE_DRIVE_FOLDER_ID` | 圖片根資料夾 ID |
| `ADMIN_USERNAME` | 初始管理員帳號 |
| `ADMIN_PASSWORD` | 初始管理員密碼 |
| `ADMIN_NICKNAME` | 初始管理員顯示暱稱 |

其他：

- `PORT`：正式環境 server port，預設 5000。
- `API_PORT`：開發 API port，預設 3001。

## 常用指令

```bash
npm run dev       # 同時啟動 API 與前端
npm run check     # TypeScript 檢查
npm test          # 單元測試
npm run build     # 建立前端正式版本
npm run db:push   # 套用 Drizzle schema
npm run seed      # 建立站台設定與初始管理員
npm run start     # 正式環境啟動
```

## 圖片流程

1. 瀏覽器以 multipart 上傳 1 至 9 張圖片。
2. Server 驗證檔案大小及類型。
3. sharp 自動旋轉、縮至最長邊 1600px、移除 metadata，轉成 WebP quality 82。
4. Server 透過 Replit Google Drive Connector 上傳到指定資料夾。
5. Database 只保存 Drive file ID 與圖片 metadata。
6. 前端透過 `/api/media/:imageId` 讀圖，不直接接觸 Drive 憑證或任意 file ID。

## 安全原則

- 密碼只保存 bcrypt hash。
- JWT 僅放在 HttpOnly cookie。
- 正式環境 cookie 使用 `Secure` 與 `SameSite=Lax`。
- 註冊與登入有 rate limit。
- 前後端皆驗證字數、圖片數量與權限。
- Google 連線、DB URL、session secret 不得提交到 Git。
- 公開畫面只顯示暱稱，不顯示帳號。

## 已知下一步

- 完整貼文編輯表單與圖片拖曳重排
- Google Drive 每篇貼文子資料夾與孤兒檔案排程清理
- 管理後台列表、搜尋與 moderation 操作介面
- 會員中心完整清單與暱稱編輯
- 更完整的 API integration tests

完整產品規格見 [`docs/REPLIT_BUILD_PROMPT.md`](./docs/REPLIT_BUILD_PROMPT.md)。
