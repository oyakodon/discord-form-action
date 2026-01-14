# discord-form-action

Discordサーバー内の情報整理を目的としたDiscord Bot。
スラッシュコマンドからModalフォームを呼び出し、入力内容をEmbed形式で専用チャンネルに投稿します。

## 技術スタック

- **実行環境**: Cloudflare Workers
- **言語**: TypeScript
- **パッケージマネージャー**: Bun
- **Lint & Format**: Biome
- **テスト**: vitest + @cloudflare/vitest-pool-workers
