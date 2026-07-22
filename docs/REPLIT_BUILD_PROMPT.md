# Replit 開發規格：Excel & Min 婚禮二手物品需求牆

## 產品目的

建立一個手機優先的婚禮二手物品需求牆。賓客可以先發布可能帶到婚禮現場交換的二手物品，其他賓客使用「我想要」表達興趣，讓發文者判斷是否值得攜帶。

這不是電商、拍賣或正式交易平台。不要加入付款、訂單、購物車、競標、物流、私訊或評價功能。

## 核心文案

- 名稱：Excel & Min 二手物品需求牆
- 主標題：讓好物在婚禮這天，遇見下一個喜歡它的人。
- 說明：「我想要」只表示有興趣，不代表正式交易承諾。

## 視覺與語言

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
- 全站提供「中／EN」切換，選擇保存在瀏覽器 localStorage。

## 頁面結構

- `/`：婚禮概念首頁，不直接顯示完整貼文列表。
- `/items`：獨立物品牆，提供最新、最早、最多人想要排序。
- `/posts/:id`：貼文詳情。
- `/posts/new`、`/posts/:id/edit`：建立及編輯貼文。
- `/login`、`/register`、`/me`、`/admin`。

物品牆卡片及貼文詳情都使用圖片輪播：

- 畫面一次只顯示一張圖片。
- 多張圖片時，在圖片左右兩側顯示上一張／下一張按鈕。
- 可循環切換，並顯示目前張數或圓點。
- 只有一張圖片時，不顯示左右按鈕與輪播控制。

## 角色

### 訪客

- 瀏覽公開貼文、圖片、想要人數與既有留言。
- 使用最新、最早、最多人想要排序。

### 一般會員

- 註冊時填寫帳號、密碼與公開暱稱；不使用婚禮邀請碼。
- 發布、編輯與刪除自己的貼文。
- 每篇貼文至少 1 張、最多 9 張圖片。
- 對每篇貼文按一次「我想要」，可取消。
- 在允許留言的貼文留言。
- 查看自己的貼文與想要清單。

### 管理員

- 與一般會員共用登入入口。
- 預設帳號為 `admin`，預設密碼為 `admin123`。
- 舊版預設密碼 `adim123` 需在網站下次啟動時自動遷移，但不得覆蓋管理員自行設定的新密碼。
- 只有資料庫中 `role = admin` 且 `is_active = true` 的會員具有管理權限。
- 停用或恢復會員。
- 隱藏、恢復或刪除貼文與留言。
- 編輯首頁公告與站台設定。
- 查看圖片清理狀態。

## 文字與圖片限制

- 帳號：4–30 字元，只允許英文字母、數字、底線、句點。
- 密碼：8–72 字元。
- 暱稱：2–20 字元。
- 標題：2–40 字元。
- 描述：10–500 字元。
- 留言：1–300 字元。
- 圖片：JPEG、PNG、WebP；單張最多 8 MB；每篇 1–9 張。

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
- 自有 Language Provider，不依賴額外 i18n 套件

### 後端

- Node.js 20+、Express、TypeScript
- PostgreSQL、Drizzle ORM
- Zod、bcryptjs、JWT HttpOnly cookie
- helmet、express-rate-limit
- multer、sharp、Replit Google Drive Connector

## Google Drive 圖片流程

1. 瀏覽器以 multipart 上傳圖片。
2. Server 驗證 MIME、大小與真實圖片內容。
3. sharp 自動旋轉、移除 metadata、縮至最長邊 1600px，轉 WebP quality 82。
4. Server 透過 Replit Google Drive Connector 上傳到指定 Google Drive folder。
5. Database 只保存 Drive file ID、尺寸與排序。
6. 前端只能透過 `/api/media/:imageId` 讀取圖片。
7. 不可把 Google 連線資訊或任意 Drive file ID 暴露給瀏覽器。

## 資料表

- `users`
- `posts`
- `post_images`
- `post_wants`
- `comments`
- `site_settings`
- `image_cleanup_jobs`

同一使用者對同一貼文只能保留一筆「我想要」。

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

貼文列表 API 必須回傳依 `sort_order` 排序的完整圖片 ID 清單，供卡片輪播使用。

## Replit Secrets

```text
DATABASE_URL
SESSION_SECRET
GOOGLE_DRIVE_FOLDER_ID
ADMIN_USERNAME
ADMIN_PASSWORD
ADMIN_NICKNAME
```

不需要婚禮邀請碼，也不要建立 `WEDDING_INVITE_CODE` 或 `inviteCode` 欄位。

## 完成標準

- 首頁與物品牆為獨立頁面。
- 全站中／英文切換可用並記住選擇。
- 物品卡片與詳情頁輪播符合單張／多張規則。
- 訪客可瀏覽與排序。
- 會員可註冊、登入、發布帶圖片貼文。
- 公開畫面只顯示暱稱。
- 作者只能編輯與刪除自己的貼文。
- 每人每篇最多一個「我想要」。
- 發文者可開關新留言。
- 圖片保存於 Google Drive，重啟後仍可讀取。
- 管理 API 與分頁式後台可用。
- Secrets 不進 Git。
- `npm run check`、`npm test`、`npm run build` 通過。

## 後續階段

1. 完整貼文編輯表單與圖片拖曳排序。
2. 每篇貼文 Drive 子資料夾與孤兒圖片自動清理。
3. 會員中心完整貼文卡片列表。
4. 管理後台完整列表、搜尋與 moderation 操作。
5. API integration tests 與更完整的錯誤狀態。
