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

export type PostCard = {
  id: number;
  title: string;
  description: string;
  authorNickname: string;
  itemStatus: "considering" | "bringing" | "not_bringing" | "closed";
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
