import { describe, expect, it } from "vitest";
import {
  EMBED_LIMITS,
  isUrl,
  ValidationError,
  validateEmbedDescription,
  validateEmbedFieldValue,
  validateEmbedTitle,
  validateRequired,
} from "../src/utils/validation.js";

describe("validation utilities", () => {
  describe("validateRequired", () => {
    it("値が存在する場合、エラーをスローしない", () => {
      expect(() => validateRequired("test", "テストフィールド")).not.toThrow();
    });

    it("値が空文字列の場合、ValidationErrorをスローする", () => {
      expect(() => validateRequired("", "テストフィールド")).toThrow(ValidationError);
      expect(() => validateRequired("", "テストフィールド")).toThrow(
        "テストフィールドは必須項目です",
      );
    });

    it("値がundefinedの場合、ValidationErrorをスローする", () => {
      expect(() => validateRequired(undefined, "テストフィールド")).toThrow(ValidationError);
      expect(() => validateRequired(undefined, "テストフィールド")).toThrow(
        "テストフィールドは必須項目です",
      );
    });

    it("値が空白のみの場合、ValidationErrorをスローする", () => {
      expect(() => validateRequired("   ", "テストフィールド")).toThrow(ValidationError);
      expect(() => validateRequired("   ", "テストフィールド")).toThrow(
        "テストフィールドは必須項目です",
      );
    });
  });

  describe("isUrl", () => {
    it("有効なHTTPS URLの場合、trueを返す", () => {
      expect(isUrl("https://example.com")).toBe(true);
      expect(isUrl("https://example.com/path")).toBe(true);
      expect(isUrl("https://example.com/path?query=value")).toBe(true);
    });

    it("有効なHTTP URLの場合、trueを返す", () => {
      expect(isUrl("http://example.com")).toBe(true);
      expect(isUrl("http://example.com/path")).toBe(true);
    });

    it("http/https以外のプロトコルの場合、falseを返す", () => {
      expect(isUrl("ftp://example.com")).toBe(false);
      expect(isUrl("file:///path/to/file")).toBe(false);
      expect(isUrl("ws://example.com")).toBe(false);
    });

    it("不正なURL形式の場合、falseを返す", () => {
      expect(isUrl("not-a-url")).toBe(false);
      expect(isUrl("example.com")).toBe(false);
      expect(isUrl("")).toBe(false);
      expect(isUrl("://example.com")).toBe(false);
    });

    it("特殊文字を含むURLの場合でも正しく判定する", () => {
      expect(isUrl("https://example.com/パス")).toBe(true);
      expect(isUrl("https://example.com/path?name=太郎&age=20")).toBe(true);
    });
  });

  describe("validateEmbedTitle", () => {
    it("制限内の文字数の場合、エラーをスローしない", () => {
      expect(() => validateEmbedTitle("短いタイトル")).not.toThrow();
      expect(() => validateEmbedTitle("a".repeat(EMBED_LIMITS.TITLE))).not.toThrow();
    });

    it("制限を超える文字数の場合、ValidationErrorをスローする", () => {
      const tooLongTitle = "a".repeat(EMBED_LIMITS.TITLE + 1);
      expect(() => validateEmbedTitle(tooLongTitle)).toThrow(ValidationError);
      expect(() => validateEmbedTitle(tooLongTitle)).toThrow(
        `タイトルは${EMBED_LIMITS.TITLE}文字以内で入力してください`,
      );
    });

    it("空文字列の場合、エラーをスローしない", () => {
      expect(() => validateEmbedTitle("")).not.toThrow();
    });
  });

  describe("validateEmbedDescription", () => {
    it("制限内の文字数の場合、エラーをスローしない", () => {
      expect(() => validateEmbedDescription("短い説明")).not.toThrow();
      expect(() => validateEmbedDescription("a".repeat(EMBED_LIMITS.DESCRIPTION))).not.toThrow();
    });

    it("制限を超える文字数の場合、ValidationErrorをスローする", () => {
      const tooLongDescription = "a".repeat(EMBED_LIMITS.DESCRIPTION + 1);
      expect(() => validateEmbedDescription(tooLongDescription)).toThrow(ValidationError);
      expect(() => validateEmbedDescription(tooLongDescription)).toThrow(
        `説明は${EMBED_LIMITS.DESCRIPTION}文字以内で入力してください`,
      );
    });

    it("空文字列の場合、エラーをスローしない", () => {
      expect(() => validateEmbedDescription("")).not.toThrow();
    });
  });

  describe("validateEmbedFieldValue", () => {
    it("制限内の文字数の場合、エラーをスローしない", () => {
      expect(() => validateEmbedFieldValue("短い値", "テストフィールド")).not.toThrow();
      expect(() =>
        validateEmbedFieldValue("a".repeat(EMBED_LIMITS.FIELD_VALUE), "テストフィールド"),
      ).not.toThrow();
    });

    it("制限を超える文字数の場合、ValidationErrorをスローする", () => {
      const tooLongValue = "a".repeat(EMBED_LIMITS.FIELD_VALUE + 1);
      expect(() => validateEmbedFieldValue(tooLongValue, "テストフィールド")).toThrow(
        ValidationError,
      );
      expect(() => validateEmbedFieldValue(tooLongValue, "テストフィールド")).toThrow(
        `テストフィールドは${EMBED_LIMITS.FIELD_VALUE}文字以内で入力してください`,
      );
    });

    it("空文字列の場合、エラーをスローしない", () => {
      expect(() => validateEmbedFieldValue("", "テストフィールド")).not.toThrow();
    });
  });

  describe("ValidationError", () => {
    it("メッセージを持つエラーを生成できる", () => {
      const error = new ValidationError("テストエラー");
      expect(error.message).toBe("テストエラー");
      expect(error.name).toBe("ValidationError");
    });

    it("Error クラスを継承している", () => {
      const error = new ValidationError("テストエラー");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });
});
