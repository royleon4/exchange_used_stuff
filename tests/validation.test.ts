import { describe, expect, it } from "vitest";
import {
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

  it("accepts valid post input", () => {
    expect(createPostSchema.parse({ ...base, imageIds: [1, 2] }).imageIds).toHaveLength(2);
  });
});
