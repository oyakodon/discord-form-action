/**
 * バリデーションエラー
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * 必須項目チェック
 */
export function validateRequired(value: string | undefined, fieldName: string): void {
  if (!value || value.trim() === "") {
    throw new ValidationError(`${fieldName}は必須項目です`);
  }
}

/**
 * URL形式チェック（http/https で始まるか）
 */
export function isUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

/**
 * Embed文字数制限チェック
 */
export const EMBED_LIMITS = {
  TITLE: 256,
  DESCRIPTION: 4096,
  FIELD_VALUE: 1024,
  TOTAL: 6000,
} as const;

export function validateEmbedTitle(title: string): void {
  if (title.length > EMBED_LIMITS.TITLE) {
    throw new ValidationError(`タイトルは${EMBED_LIMITS.TITLE}文字以内で入力してください`);
  }
}

export function validateEmbedDescription(description: string): void {
  if (description.length > EMBED_LIMITS.DESCRIPTION) {
    throw new ValidationError(`説明は${EMBED_LIMITS.DESCRIPTION}文字以内で入力してください`);
  }
}

export function validateEmbedFieldValue(value: string, fieldName: string): void {
  if (value.length > EMBED_LIMITS.FIELD_VALUE) {
    throw new ValidationError(
      `${fieldName}は${EMBED_LIMITS.FIELD_VALUE}文字以内で入力してください`,
    );
  }
}
