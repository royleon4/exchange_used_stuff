# Replit 開發規格：Excel & Min 婚禮二手物品需求牆

## 產品目的

建立一個手機優先的婚禮二手物品需求牆。賓客可以先發布可能帶到婚禮現場交換的二手物品，其他賓客使用「我想要」表達興趣，讓發文者判斷是否值得攜帶。

這不是電商、拍賣或正式交易平台。不要加入付款、訂單、購物車、競標、物流、私訊或評價功能。

## 核心文案

- 名稱：Excel & Min 二手物品需求牆
- 主標題：讓好物在婚禮這天，遇見下一個喜歡它的人。
- 說明：「我想要」只表示有興趣，不代表正式交易承諾。

## 視覺方向

延續 Excel & Min 婚禮邀請網站的自然、溫暖與留白感，不做成一般二手電商。

- Sage：`#5A7A63`
- Sage Light：`#8AAB8F`
- Sage Pale：`#D4E3D6`
- Cream：`#F8F5EF`
- Cream Dark：`#EDE8DF`
- Warm Brown：`#7A5C45`
- Text Dark：`#2C2A25`
- Gold：`#C4A35A`
- 中文字體：Noto Sans TC
- 英文標題：Cormorant Garamond

## 角色

### 訪客

- 瀏覽公開貼文、圖片、想要人數與既有留言
- 使用最新、最早、最多人想要排序
- 不可發文、按想要或留言

### 一般會員

- 註冊時填寫帳號、密碼與公開暱稱
- 發布、編輯與刪除自己的貼文
- 每篇貼文至少 1 張、最多 9 張圖片
- 對每篇貼文按一次「我想要」，可取消
- 在允許留言的貼文留言
- 查看自己的貼文與想要清單

### 管理員

- 停用或恢復會員
- 隱藏、恢復或刪除貼文與留言
- 編輯首頁公告與站台設定
- 查看圖片清理狀態

## 文字與圖片限制

- 帳號：4–30 字元，只允許英文字母、數字、底線、句點
- 密碼：8–72 字元
- 暱稱：2–20 字元
- 標題：2–40 字元
- 描述：10–500 字元
- 留言：1–300 字元
- 圖片：JPEG、PNG、WebP；單張最多 8 MB；每篇 1–9 張

所有限制都必須在前端及後端驗證。所有使用者文字以純文字顯示，不允許 HTML。

## 貼文狀態

- `considering`：還在考慮
- `bringing`：確定帶來
- `not_bringing`：這次不帶
- `closed`：已結束

## 技術架構

### 前端

- React、TypeScript、Vite
- React Router
- TanStack Query
- Tailwind CSS

### 後端

- Node.js 20+、Express、TypeScript
- PostgreSQL、Drizzle ORM
- Zod、bcryptjs、JWT HttpOnly cookie
- helmet、express-rate-limit
- multer、sharp、Google Drive API

## Google Drive 圖片流程

1. 瀏覽器以 multipart 上傳圖片。
2. Server 驗證 MIME、大小與真實圖片內容。
3. sharp 自動旋轉、移除 metadata、縮至最長邊 1600px，轉 WebP quality 82。
4. Server 使用 OAuth refresh token 上傳到指定 Google Drive folder。
5. Database 只保存 Drive file ID、尺寸與排序。
6. 前端只能透過 `/api/media/:imageId` 讀取圖片。
7. 不可把 Google credentials 或任意 Drive file ID 暴露給瀏覽器。

## 資料表

- `users`
- `posts`
- `post_images`
- `post_wants`
- `comments`
- `site_settings`
- `image_cleanup_jobs`

`post_wants` 使用 `(user_id, post_id)` primary key，確保同一會員對同一貼文只有一筆。

## API

- `/api/auth/register|login|logout|me`
- `/api/posts`
- `/api/posts/:id`
- `/api/posts/:id/want`
- `/api/posts/:id/comments`
- `/api/uploads/images`
- `/api/media/:imageId`
- `/api/me/posts`
- `/api/me/wants`
- `/api/me/profile`
- `/api/admin/*`

## Replit Secrets

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
WEDDING_INVITE_CODE
```

`WEDDING_INVITE_CODE` 為選填；設定後，註冊時必須輸入正確邀請碼。

## 完成標準

- 訪客可瀏覽與排序
- 會員可註冊、登入、發布帶圖片貼文
- 公開畫面只顯示暱稱
- 作者只能編輯與刪除自己的貼文
- 每人每篇最多一個「我想要」
- 發文者可開關新留言
- 圖片保存於 Google Drive，重啟後仍可讀取
- 管理 API 與分頁式後台可用
- Secrets 不進 Git
- `npm run check`、`npm test`、`npm run build` 通過

## 後續階段

1. 完整貼文編輯表單與圖片拖曳排序
2. 每篇貼文 Drive 子資料夾與孤兒圖片自動清理
3. 會員中心完整貼文卡片列表
4. 管理後台完整列表、搜尋與 moderation 操作
5. API integration tests 與更完整的錯誤狀態
