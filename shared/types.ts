export type PublicUser = {
  id: number;
  nickname: string;
  role: "user" | "admin";
};

export type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
};

export type ItemStatus = "considering" | "bringing" | "not_bringing" | "closed";

export type WantResult = {
  wanted: boolean;
  wantCount: number;
};

export type PostCard = {
  id: number;
  authorId: number;
  title: string;
  description: string;
  authorNickname: string;
  itemStatus: ItemStatus;
  commentsEnabled: boolean;
  imageCount: number;
  imageIds: number[];
  coverImageId: number | null;
  wantCount: number;
  commentCount: number;
  currentUserWants: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostImageView = {
  id: number;
  url: string;
  width: number;
  height: number;
  sortOrder: number;
};

export type PostDetail = PostCard & {
  isOwner: boolean;
  images: PostImageView[];
};

export type PostComment = {
  id: number;
  body: string;
  authorId: number;
  authorNickname: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicSiteSettings = {
  siteTitle: string;
  homeTitleStartZh: string;
  homeTitleAccentZh: string;
  homeDescriptionZh: string;
  homeTitleStartEn: string;
  homeTitleAccentEn: string;
  homeDescriptionEn: string;
  homeTitleColor: string;
  homeTitleAccentColor: string;
  homeHeroImageId: number | null;
  homeHeroImageUrl: string | null;
  announcement: string;
  announcementEn: string;
  announcementEnabled: boolean;
  registrationOpen: boolean;
  defaultCommentsEnabled: boolean;
  updatedAt: string;
};