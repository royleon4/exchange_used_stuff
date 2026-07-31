import type { PostCard } from "../shared/types.js";

export type PostCardRow = {
  id: number;
  author_id: number;
  title: string;
  description: string;
  author_nickname: string;
  item_status: PostCard["itemStatus"];
  comments_enabled: boolean;
  image_count: string;
  image_ids: number[];
  cover_image_id: number | null;
  want_count: string;
  comment_count: string;
  current_user_wants: boolean;
  created_at: Date;
  updated_at: Date;
};

export function serializePostCard(row: PostCardRow): PostCard {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    description: row.description,
    authorNickname: row.author_nickname,
    itemStatus: row.item_status,
    commentsEnabled: row.comments_enabled,
    imageCount: Number(row.image_count),
    imageIds: row.image_ids ?? [],
    coverImageId: row.cover_image_id,
    wantCount: Number(row.want_count),
    commentCount: Number(row.comment_count),
    currentUserWants: row.current_user_wants,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}
