Always respond in 日本語

## プロジェクト概要

Discord Bot を用いて、事前定義されたフォーム入力を受け付け、構造化された情報をチャンネルに投稿するシステム。ボードゲーム在庫管理やMinecraftマップ共有など、コミュニティ内の情報整理を目的とする。

### 主要機能
- **フォーム管理**: 複数のフォームタイプ（ボードゲーム、Minecraft map等）を定義可能
- **Discord Modal Component**: スラッシュコマンドによるフォーム呼び出し
- **File Upload対応**: 画像アップロード機能（Discord CDN経由）
- **構造化投稿**: Embed形式でチャンネルに投稿
- **チャンネル管理**: フォームタイプごとに投稿先チャンネルを指定

### 対象フォーム
1. **ボードゲームフォーム** (`/add-game`)
   - ゲーム名、推奨プレイ人数、プレイ時間、所有者/URL、写真
2. **Minecraft mapフォーム** (`/add-map`)
   - マップ名、URL、プレイ人数、Minecraftバージョン、タグ

## 技術スタック

### 実行環境
- **プラットフォーム**: Cloudflare Workers
- **言語**: TypeScript
- **ランタイム**: Workerd (Cloudflare Workers Runtime)

### 主要ライブラリ
- **discord-interactions**: Discord署名検証
- **discord.js**: コマンド定義構築（script/でのみ使用）
- **discord-api-types**: Discord API型定義

**注**: 各パッケージのバージョンは実装フェーズで最新版を確定させる

### 開発ツール
- **パッケージマネージャー**: Bun（確定）
- **テストフレームワーク**: vitest + @cloudflare/vitest-pool-workers
- **型チェック**: TypeScript
- **Lint & Format**: Biome
- **デプロイツール**: wrangler

### Discord API機能
- Application Commands (Slash Commands)
- Modal Components (テキスト入力)
- File Upload Component（最大10ファイル対応）
- Message Embeds

## プロジェクト構造

```
discord-form-action/
├── src/
│   ├── index.ts                    # エントリーポイント、署名検証、リクエストハンドリング
│   ├── commands.json               # Discord コマンド定義（自動生成）
│   ├── forms/
│   │   ├── boardgame.ts            # ボードゲームフォーム（Modal定義、Embed構築）
│   │   └── minecraft.ts            # Minecraftフォーム（Modal定義、Embed構築）
│   └── utils/
│       ├── fileService.ts          # ファイルダウンロード・検証
│       └── validation.ts           # 入力バリデーション
├── script/
│   ├── builder.ts                  # コマンド定義ビルダー（discord.js使用）
│   └── register.ts                 # Discord APIへのコマンド登録スクリプト
├── test/
│   ├── boardgame.test.ts           # ボードゲームフォームのユニットテスト
│   └── minecraft.test.ts           # Minecraftフォームのユニットテスト
├── docs/
│   └── specification.md            # 要件定義・基本設計書
├── wrangler.toml                   # Cloudflare Workers設定
├── tsconfig.json                   # TypeScript設定
├── vitest.config.ts                # テスト設定
├── .dev.vars                       # ローカル環境変数（git管理外）
├── example.dev.vars                # 環境変数テンプレート
└── AGENTS.md                       # 本ファイル
```

## コーディング時確認事項

### コーディング規約

#### TypeScript スタイル
- **Strict モード**: 必ず有効にする (`tsconfig.json` で設定済み)
- **型定義**: `any` を避け、適切な型を明示的に定義する
- **import**: 型インポートは `import type` を使用する
  ```typescript
  import type { APIInteraction } from 'discord-api-types/v10';
  ```

### 機密情報の扱い

#### ⚠️ コミット禁止
以下のファイル・情報は **絶対にコミットしない**：
- `.dev.vars` （ローカル環境変数）
- `.env` （環境変数）
- `credentials.json` など認証情報ファイル

#### ✅ 正しい管理方法
- **ローカル開発**: `.dev.vars` で管理（`.gitignore` で除外）
- **テンプレート**: `example.dev.vars` に空の変数定義を用意
- **本番環境**: Cloudflare Workers の環境変数（wrangler CLI または Dashboard で設定）

### Gitコミット規約

#### Conventional Commits を踏襲
コミットメッセージは以下の形式に従う：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type の種類
- `feat`: 新機能の追加
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの意味に影響しない変更（フォーマット、セミコロン等）
- `refactor`: バグ修正や機能追加ではないコードの変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・修正
- `chore`: ビルドプロセスやツールの変更

### コード品質チェックリスト

実装前・実装後に以下を確認：

- [ ] 型定義が適切に設定されている（`any` を使用していない）
- [ ] Discord の署名検証が実装されている
- [ ] 入力バリデーションが実装されている
- [ ] エラーハンドリングが適切に行われている
- [ ] 機密情報がコードにハードコードされていない
- [ ] ユニットテストが書かれている
- [ ] TypeScript のエラーがない（`bun wrangler types` で確認）
- [ ] Biome の lint & format チェックが通る（`bun run check` で確認）
- [ ] コミットメッセージが Conventional Commits に従っている
- [ ] `.dev.vars` や機密情報ファイルがコミットされていない

## レビュー時確認事項

### レビュー観点

#### セキュリティ
- [ ] Discord の署名検証が適切に実装されているか
- [ ] 機密情報（Token、API Key等）がコードにハードコードされていないか
- [ ] 入力バリデーションが十分か（XSS、インジェクション対策）
- [ ] ファイルアップロード時のサイズ・拡張子チェックが実装されているか
- [ ] `.dev.vars` や `.env` などの機密ファイルがコミットされていないか

#### コード品質
- [ ] TypeScript の Strict モードに準拠しているか
- [ ] `any` 型が使用されていないか
- [ ] 適切な型定義が行われているか
- [ ] 関数が適切に分割されているか（単一責任の原則）
- [ ] 過剰な抽象化を避けているか（YAGNI原則）
- [ ] コメントが必要な箇所に適切に記載されているか

#### テスト
- [ ] 主要な処理フローにユニットテストが書かれているか
- [ ] テストが Workers ランタイムで実行されるように設定されているか
- [ ] エッジケース（空文字列、異常値等）がテストされているか

### レビュー時の重点項目

#### 新機能追加時
1. **仕様との整合性**: `docs/specification.md` と一致しているか
2. **既存機能への影響**: 既存のフォームやコマンドに影響がないか
3. **エラーハンドリング**: 新しいエラーケースに対応しているか
4. **テストの追加**: 新機能に対するテストが追加されているか

#### バグ修正時
1. **根本原因の特定**: 根本原因が特定され、適切に修正されているか
2. **再発防止**: テストケースが追加されているか
3. **影響範囲**: 他の機能に影響がないか

#### リファクタリング時
1. **機能の変更がない**: リファクタリング前後で機能が同じか
2. **テストの通過**: 既存のテストがすべて通過するか
3. **可読性の向上**: コードが読みやすくなっているか

### レビュー後のアクション

#### Approve 基準
- セキュリティリスクがない
- 機能要件を満たしている
- テストが通過している
- コード品質が基準を満たしている
- Conventional Commits に従っている

#### Request Changes 基準
- セキュリティリスクがある
- 機密情報がコミットされている
- テストが失敗している
- 重大なバグがある

#### Comment 基準
- 軽微な改善提案
- コードスタイルの提案
- ドキュメントの追加提案

## 参考情報

### 公式ドキュメント
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [discord-interactions (npm)](https://www.npmjs.com/package/discord-interactions)
- [discord-api-types](https://discord-api-types.dev/)
