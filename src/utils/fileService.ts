/**
 * ファイル処理エラー
 */
export class FileServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FileServiceError";
  }
}

/**
 * 許可する画像のContent-Type
 */
const ALLOWED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

/**
 * ファイルサイズ上限（8MB）
 */
const MAX_FILE_SIZE = 8 * 1024 * 1024;

/**
 * 許可するDiscord CDNドメイン
 */
const ALLOWED_CDN_DOMAINS = ["cdn.discordapp.com", "media.discordapp.net"] as const;

/**
 * URLがDiscord CDNからのものか検証
 */
function isDiscordCdnUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      ALLOWED_CDN_DOMAINS.some((domain) => parsed.hostname === domain)
    );
  } catch {
    return false;
  }
}

/**
 * Discord CDNからファイルをダウンロード
 */
export async function downloadAttachment(url: string): Promise<ArrayBuffer> {
  // Discord CDNのURLか検証（SSRF対策）
  if (!isDiscordCdnUrl(url)) {
    throw new FileServiceError("Discord CDNからのファイルのみダウンロード可能です");
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new FileServiceError(`ファイルのダウンロードに失敗しました: ${response.status}`);
  }

  // Content-Type検証
  const contentType = response.headers.get("content-type");
  if (!contentType || !isAllowedContentType(contentType)) {
    throw new FileServiceError(
      `サポートされていないファイル形式です。PNG, JPEG, GIF, WebPのみアップロード可能です`,
    );
  }

  // サイズ検証
  const contentLength = response.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_FILE_SIZE) {
    throw new FileServiceError(`ファイルサイズが大きすぎます（上限: 8MB）`);
  }

  const buffer = await response.arrayBuffer();

  // ダウンロード後のサイズチェック（念のため）
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new FileServiceError(`ファイルサイズが大きすぎます（上限: 8MB）`);
  }

  return buffer;
}

/**
 * Content-Typeが許可されているか確認
 */
function isAllowedContentType(contentType: string): boolean {
  return ALLOWED_CONTENT_TYPES.some((type) => contentType.startsWith(type));
}

/**
 * 複数のファイルをダウンロード
 */
export async function downloadAttachments(
  urls: string[],
): Promise<{ buffer: ArrayBuffer; url: string }[]> {
  const results = await Promise.allSettled(
    urls.map(async (url) => ({
      buffer: await downloadAttachment(url),
      url,
    })),
  );

  const successful: { buffer: ArrayBuffer; url: string }[] = [];
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      successful.push(result.value);
    } else {
      errors.push(result.reason.message);
    }
  }

  if (errors.length > 0) {
    throw new FileServiceError(`一部のファイルのダウンロードに失敗しました:\n${errors.join("\n")}`);
  }

  return successful;
}
