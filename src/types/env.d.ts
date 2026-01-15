/**
 * Cloudflare Workers環境変数の型定義
 */
declare interface Env {
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  DISCORD_BOT_TOKEN: string;
  BOARDGAME_CHANNEL_ID: string;
  MINECRAFT_CHANNEL_ID: string;
}
