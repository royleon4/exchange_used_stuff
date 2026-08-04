import { describe, expect, it } from "vitest";
import {
  adminPostUpdateSchema,
  adminSiteSettingsSchema,
  adminUserUpdateSchema,
  changePasswordSchema,
  createPostSchema,
  profileUpdateSchema,
  registerSchema,
} from "../shared/validation";

describe("registration validation", () => {
  it("normalizes usernames to lowercase", () => {
    const value = registerSchema.parse({
      username: "Excel.Min",
      password: "password123",
      nickname: "Excel",
    });
    expect(value.username).toBe("excel.min");
  });

  it("rejects unsupported username characters", () => {
    expect(() =>
      registerSchema.parse({ username: "婚禮帳號", password: "password123", nickname: "小明" }),
    ).toThrow();
  });
});

describe("account settings validation", () => {
  it("trims a valid nickname", () => {
    expect(profileUpdateSchema.parse({ nickname: "  Min  " }).nickname).toBe("Min");
  });

  it("requires the current password", () => {
    expect(() => changePasswordSchema.parse({ currentPassword: "", newPassword: "newpassword123" })).toThrow();
  });

  it("rejects a short new password", () => {
    expect(() => changePasswordSchema.parse({ currentPassword: "oldpassword", newPassword: "short" })).toThrow();
  });
});

describe("admin validation", () => {
  it("accepts member role and status changes", () => {
    const value = adminUserUpdateSchema.parse({ nickname: "婚禮小幫手", role: "admin", isActive: true });
    expect(value.role).toBe("admin");
  });

  it("rejects short admin-reset passwords", () => {
    expect(() => adminUserUpdateSchema.parse({ newPassword: "short" })).toThrow();
  });

  it("accepts complete post moderation edits", () => {
    const value = adminPostUpdateSchema.parse({
      title: "管理員修改後的標題",
      description: "",
      itemStatus: "bringing",
      moderationStatus: "visible",
      commentsEnabled: false,
    });
    expect(value.moderationStatus).toBe("visible");
    expect(value.description).toBe("");
  });

  it("limits announcement length", () => {
    expect(() => adminSiteSettingsSchema.parse({ announcement: "A".repeat(501) })).toThrow();
  });
});

describe("post validation", () => {
  const base = {
    title: "保存良好的咖啡壺",
    description: "使用次數不多，功能正常，希望找到喜歡手沖咖啡的朋友。",
    commentsEnabled: true,
    itemStatus: "considering" as const,
  };

  it("requires at least one image", () => {
    expect(() => createPostSchema.parse({ ...base, imageIds: [] })).toThrow();
  });

  it("rejects more than nine images", () => {
    expect(() => createPostSchema.parse({ ...base, imageIds: Array.from({ length: 10 }, (_, i) => i + 1) })).toThrow();
  });

  it("rejects duplicate image ids", () => {
    expect(() => createPostSchema.parse({ ...base, imageIds: [1, 1] })).toThrow();
  });

  it("requires a title of at least three characters", () => {
    expect(() => createPostSchema.parse({ ...base, title: "杯子", imageIds: [1] })).toThrow();
  });

  it("accepts an empty description", () => {
    const value = createPostSchema.parse({ ...base, description: "", imageIds: [1] });
    expect(value.description).toBe("");
  });

  it("accepts descriptions without a length limit", () => {
    const longDescription = "物".repeat(5000);
    expect(createPostSchema.parse({ ...base, description: longDescription, imageIds: [1] }).description).toHaveLength(5000);
  });

  it("accepts valid post input", () => {
    expect(createPostSchema.parse({ ...base, imageIds: [1, 2] }).imageIds).toHaveLength(2);
  });
});
