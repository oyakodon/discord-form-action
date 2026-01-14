## 要件定義

### 1. 概要
Discord Bot を用いて、事前定義されたフォーム入力を受け付け、構造化された情報をチャンネルに投稿するシステム。ボードゲーム在庫管理やMinecraftマップ共有など、コミュニティ内の情報整理を目的とする。

### 2. 機能要件

#### 2.1 フォーム管理
- 複数のフォームタイプを定義可能（ボードゲーム、Minecraft map 等）
- 各フォームタイプごとに異なる入力項目を設定
- Discord Modal Component を使用してフォームを表示

#### 2.2 フォーム起動
- スラッシュコマンドによるフォーム呼び出し
  - 例: `/add-game`, `/add-map`
- フォームタイプごとに専用のコマンドを提供

#### 2.3 入力項目

##### ボードゲームフォーム
- ゲーム名（必須）
- 推奨プレイ人数（任意）
- プレイ時間（任意）
- 所有者/URL（任意）
  - URLの形式（http/https で始まる）→ オンラインゲームとして扱う
  - それ以外 → 物理ゲームとして扱う
  - (空欄を許容しない)
- 写真（File Upload Component、任意）

##### Minecraft mapフォーム
- マップ名（必須）
- URL（必須, テキスト入力）
- プレイ人数（必須, テキスト入力or数値？）
- Minecraft バージョン（任意, テキスト入力）
- タグ（任意, mod, アスレチック等、選択式または自由入力）

#### 2.4 投稿機能
- フォーム送信後、入力内容を Embed 形式でチャンネルに投稿
- 投稿者情報を含める
- File Upload Component でアップロードされた画像を含める
  - Discord CDN からファイルをダウンロードして処理
  - ファイル形式・サイズのバリデーションを実装

#### 2.5 チャンネル管理
- フォームタイプごとに投稿先チャンネルを指定
  - ボードゲームフォーム → ボードゲーム専用チャンネル
  - Minecraft mapフォーム → Minecraft専用チャンネル
- 投稿先チャンネルIDは設定ファイル（または環境変数）で管理
- フォームタイプごとに専用チャンネルを使用し、混在させない

#### 2.6 データ管理
- データの永続化は行わず、Discord のチャンネル投稿をデータストアとして利用
- 検索・参照は Discord の標準機能（検索、ピン留め等）を活用

### 3. 非機能要件

#### 3.1 実行環境
- Cloudflare Workers 上で動作
- Discord Interactions Endpoint URL として実装

#### 3.2 セキュリティ要件
- Discord からのリクエスト署名検証は必須

#### 3.4 運用
- 対象チャンネルは Bot のみが投稿可能な設定を推奨（運用ルール）

### 4. 対象外・将来機能

#### 4.1 初期バージョンで実装しない機能
- 投稿後の編集・削除機能
- 週次通知機能
  - 今週追加されたアイテムの通知
  - リアクション (`:eyes:`) が一定数以上のアイテムの通知

#### 4.2 今後検討する機能
- 投稿の編集・削除（コンテキストメニューからの操作）
- タグ機能の詳細仕様

### 5. 技術仕様

#### 5.1 使用する Discord API 機能
- Application Commands (Slash Commands)
- Modal Components (テキスト入力)
- File Upload Component（2025年11月導入）
  - 最大10ファイルまで対応
  - ファイルは Discord CDN 経由で取得
- Message Embeds

#### 5.2 制約事項
- File Upload Component のファイルサイズ・拡張子バリデーションはサーバー側で実装が必要
- Modal の入力項目数は Discord の制限（最大5つのコンポーネント）に従う

### 6. 成功指標
- ボードゲームやマップ情報がチャンネルに構造化された形で投稿される
- コミュニティメンバーが情報を参照・検索しやすくなる
- 手動投稿と比較して入力の手間が削減される

## 基本設計

### 1. システムアーキテクチャ

```
Discord Client
     ↓ (Slash Command)
Discord API Server
     ↓ (HTTP POST with signature)
Cloudflare Workers (Interaction Endpoint)
     ├─ Signature Verification
     ├─ Command Handler
     ├─ Modal Handler
     └─ File Download & Processing
     ↓ (Response / Follow-up)
Discord API Server
     ↓
Discord Channel (Embed Post)
```

#### 1.1 実行環境
- **プラットフォーム**: Cloudflare Workers
- **エンドポイント**: Discord Interactions Endpoint URL
- **言語**: TypeScript

#### 1.2 外部連携
- Discord API (REST API)
  - Application Commands 登録
  - Interaction Response
  - Message 投稿 (Embed)
  - File Download (Discord CDN)

### 2. コンポーネント設計

#### 2.1 主要モジュール構成

**推奨構成（参考実装パターンに基づく）**:

```
src/
├── index.ts                    # エントリーポイント、リクエストハンドリング、署名検証
├── commands.json               # Discord コマンド定義（自動生成）
├── forms/
│   ├── boardgame.ts            # ボードゲームフォーム（Modal定義、Embed構築）
│   └── minecraft.ts            # Minecraftフォーム（Modal定義、Embed構築）
└── utils/
    ├── fileService.ts          # ファイルダウンロード・検証
    └── validation.ts           # 入力バリデーション
script/
├── builder.ts                  # コマンド定義ビルダー（discord.js使用）
└── register.ts                 # Discord APIへのコマンド登録スクリプト
test/
├── boardgame.test.ts           # ボードゲームフォームのユニットテスト
└── minecraft.test.ts           # Minecraftフォームのユニットテスト
```

**設計の考え方**:
- **シンプルさ優先**: 参考実装は index.ts + ロジックファイルのみで十分機能している
- **過剰な抽象化を避ける**: handlers/, services/ などの細かい分割は、2つのフォームタイプ程度では不要
- **フォームごとにファイル分割**: Modal定義とEmbed構築ロジックを1ファイルにまとめる
- **スクリプトの分離**: コマンド登録は別途スクリプトとして実装（デプロイと分離）

#### 2.2 index.ts の実装パターン

参考実装に基づく基本構造:

```typescript
import { verifyKey } from 'discord-interactions';
import type { APIInteraction, InteractionType, InteractionResponseType } from 'discord-api-types/v10';

// 署名検証
async function verifyDiscordRequest(request: Request, env: Env) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();
  const isValidRequest = signature && timestamp &&
    await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

  if (!isValidRequest) {
    return { isValid: false };
  }
  return { interaction: JSON.parse(body) as APIInteraction, isValid: true };
}

// メインハンドラー
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // GET: Application ID を返却（ヘルスチェック用）
    if (request.method === 'GET') {
      return new Response(env.DISCORD_APPLICATION_ID);
    }

    // 署名検証
    const { isValid, interaction } = await verifyDiscordRequest(request, env);
    if (!isValid || !interaction) {
      return new Response('Bad request signature.', { status: 401 });
    }

    // Ping応答
    if (interaction.type === InteractionType.Ping) {
      return Response.json({ type: InteractionResponseType.Pong });
    }

    // ApplicationCommand処理
    if (interaction.type === InteractionType.ApplicationCommand) {
      // コマンド名で振り分け
      switch (interaction.data.name) {
        case 'add-game':
          return handleBoardGameCommand(interaction, env);
        case 'add-map':
          return handleMinecraftCommand(interaction, env);
      }
    }

    // ModalSubmit処理
    if (interaction.type === InteractionType.ModalSubmit) {
      // custom_idで振り分け
      switch (interaction.data.custom_id) {
        case 'boardgame_form':
          return handleBoardGameSubmit(interaction, env, ctx);
        case 'minecraft_form':
          return handleMinecraftSubmit(interaction, env, ctx);
      }
    }

    return Response.json({ error: 'Unknown Type' }, { status: 400 });
  }
} satisfies ExportedHandler<Env>;
```

#### 2.3 フォーム定義

各フォームファイル（forms/boardgame.ts等）は以下を提供:

```typescript
// Modal定義を返す関数
export function getBoardGameModal() {
  return {
    type: InteractionResponseType.Modal,
    data: {
      custom_id: 'boardgame_form',
      title: 'ボードゲーム登録',
      components: [/* Modal components */]
    }
  };
}

// Embed構築関数
export function buildBoardGameEmbed(formData: FormData, user: APIUser) {
  return {
    embeds: [{
      title: formData.game_name,
      fields: [/* fields */],
      footer: { text: `登録者: ${user.username}` }
    }]
  };
}

// Modal Submit ハンドラー
export async function handleBoardGameSubmit(
  interaction: APIModalSubmitInteraction,
  env: Env,
  ctx: ExecutionContext
) {
  // 1. データ抽出
  // 2. バリデーション
  // 3. ファイル処理
  // 4. チャンネル投稿
  // 5. レスポンス返却
}
```

### 3. データフロー

#### 3.1 基本フロー

1. **コマンド実行**
   - ユーザーが `/add-game` または `/add-map` を実行
   - Discord が Workers エンドポイントに `INTERACTION_CREATE` (type=2) を送信

2. **Modal 表示**
   - Workers が署名検証後、コマンドに応じた Modal を返却 (type=9)
   - Discord がユーザーに Modal を表示

3. **Modal 送信**
   - ユーザーが Modal を送信
   - Discord が Workers に `MODAL_SUBMIT` (type=5) を送信

4. **投稿処理**
   - Workers が入力内容をバリデーション
   - File Upload がある場合、Discord CDN からダウンロード
   - Embed メッセージを構築
   - 対応するチャンネルに投稿
   - ユーザーに完了メッセージを返却

#### 3.2 エラーフロー
- バリデーションエラー → ユーザーにエラーメッセージ表示（ephemeral）
- ファイルダウンロード失敗 → エラーメッセージ表示、投稿は中断
- Discord API エラー → ログ出力、ユーザーにエラー通知

### 4. インタラクション処理詳細

#### 4.1 Slash Command 処理

```typescript
// /add-game の場合
{
  type: InteractionResponseType.MODAL,
  data: {
    custom_id: "boardgame_form",
    title: "ボードゲーム登録",
    components: [
      { type: 1, components: [{ type: 4, custom_id: "game_name", label: "ゲーム名", style: 1, required: true }] },
      { type: 1, components: [{ type: 4, custom_id: "player_count", label: "推奨プレイ人数", style: 1, required: false }] },
      { type: 1, components: [{ type: 4, custom_id: "play_time", label: "プレイ時間", style: 1, required: false }] },
      { type: 1, components: [{ type: 4, custom_id: "owner_url", label: "所有者/URL", style: 1, required: true }] },
      { type: 1, components: [{ type: 11, custom_id: "photo", label: "写真", required: false }] }
    ]
  }
}
```

#### 4.2 Modal Submit 処理

**1. 入力値の取得**

Modal Submitの構造:
```typescript
interface APIModalSubmitInteraction {
  data: {
    custom_id: string;
    components: Array<{
      type: 1;  // ActionRow
      components: Array<{
        type: 4 | 11;  // 4: TextInput, 11: FileUpload
        custom_id: string;
        value?: string;  // TextInputの場合
      }>;
    }>;
  };
  resolved?: {
    attachments?: Record<string, {
      id: string;
      filename: string;
      size: number;
      url: string;
      proxy_url: string;
      content_type?: string;
    }>;
  };
}
```

データ抽出の実装例:
```typescript
function extractFormData(interaction: APIModalSubmitInteraction) {
  const formData: Record<string, string> = {};

  // TextInput values
  for (const row of interaction.data.components) {
    for (const component of row.components) {
      if (component.type === 4 && component.value) {  // TextInput
        formData[component.custom_id] = component.value;
      }
    }
  }

  // File attachments
  const attachments = interaction.resolved?.attachments
    ? Object.values(interaction.resolved.attachments)
    : [];

  return { formData, attachments };
}
```

**2. バリデーション**
   - 必須項目チェック
   - URL形式チェック（owner_url がhttp/httpsで始まるか）
   - ファイルサイズ・拡張子チェック（後述）

**3. ファイル処理**（File Upload がある場合）

Discord CDN からのダウンロード:
```typescript
async function downloadAttachment(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  // Content-Type検証
  const contentType = response.headers.get('content-type');
  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
  if (!contentType || !allowedTypes.includes(contentType)) {
    throw new Error('Invalid file type');
  }

  // サイズ検証（8MB上限）
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 8 * 1024 * 1024) {
    throw new Error('File too large');
  }

  return await response.arrayBuffer();
}
```

**4. Embed 構築**
   - フォームタイプに応じた Embed フォーマット
   - 投稿者情報（`interaction.member.user` または `interaction.user`）を含める
   - ファイルがある場合は Discord API にファイルを添付して送信

**5. チャンネル投稿**

初回レスポンス（DeferredChannelMessageWithSource）:
```typescript
// 処理に時間がかかる場合、まず「考え中」を返す
// 3秒以内にレスポンスを返さないとタイムアウトするため、
// ファイルダウンロードや複雑な処理がある場合は Deferred を使用
const response = Response.json({
  type: InteractionResponseType.DeferredChannelMessageWithSource,
  data: { flags: 64 }  // ephemeral
});

// ExecutionContext.waitUntil() で非同期処理を継続
ctx.waitUntil((async () => {
  try {
    // チャンネル投稿とFollow-up messageの送信
    await postToChannelAndNotify(interaction, env);
  } catch (error) {
    console.error('Failed to post:', error);
    // エラー時のFollow-up message送信
    await notifyError(interaction, env);
  }
})());

return response;
```

Follow-up message による投稿:
```typescript
async function postToChannelAndNotify(
  interaction: APIModalSubmitInteraction,
  env: Env
) {
  // interaction.token を使って遅延レスポンス
  const webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`;

  // チャンネルへの実際の投稿
  const channelUrl = `https://discord.com/api/v10/channels/${env.BOARDGAME_CHANNEL_ID}/messages`;
  const channelResponse = await fetch(channelUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      embeds: [/* embed data */],
      files: [/* file attachments if any */]
    })
  });

  if (!channelResponse.ok) {
    throw new Error(`Failed to post to channel: ${channelResponse.status}`);
  }

  // ユーザーへの完了通知（Follow-up message）
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: '✅ 登録が完了しました！',
      flags: 64  // ephemeral（本人にのみ表示）
    })
  });
}
```

**ExecutionContext の活用**:
- `ctx.waitUntil()` を使うことで、レスポンス返却後も非同期処理を継続できる
- Discord の3秒タイムアウト制約を回避しながら、長時間処理（ファイルダウンロード等）を実行可能

**ファイル添付の場合**:
```typescript
// multipart/form-data でファイルを送信
const formData = new FormData();
formData.append('payload_json', JSON.stringify({ embeds: [/* ... */] }));
formData.append('files[0]', new Blob([fileBuffer]), filename);

await fetch(channelUrl, {
  method: 'POST',
  headers: { 'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}` },
  body: formData
});
```

### 5. 設定管理

#### 5.1 環境変数

```
DISCORD_PUBLIC_KEY       # Discord署名検証用公開鍵
DISCORD_BOT_TOKEN        # Bot Token (API呼び出し用)
DISCORD_APPLICATION_ID   # Application ID
BOARDGAME_CHANNEL_ID     # ボードゲーム投稿先チャンネルID
MINECRAFT_CHANNEL_ID     # Minecraft投稿先チャンネルID
```

#### 5.2 フォーム設定

`config.ts` でフォーム定義を一元管理:
```typescript
export const FORMS = {
  boardgame: {
    commandName: 'add-game',
    targetChannelId: env.BOARDGAME_CHANNEL_ID,
    // ...
  },
  minecraft: {
    commandName: 'add-map',
    targetChannelId: env.MINECRAFT_CHANNEL_ID,
    // ...
  }
}
```

### 6. エラーハンドリング

#### 6.1 エラー種別と対応

| エラー種別 | 処理内容 | ユーザー通知 |
|-----------|---------|------------|
| 署名検証失敗 | 401 Unauthorized を返却 | なし（リクエスト拒否） |
| 入力バリデーション | ephemeral メッセージで通知 | エラー内容を表示 |
| ファイル取得失敗 | ログ出力、処理中断 | エラーメッセージ表示 |
| Discord API エラー | リトライ（1回）、失敗時はログ出力 | 「投稿に失敗しました」 |
| 予期しないエラー | ログ出力 | 「エラーが発生しました」 |

**Ephemeral メッセージの実装**:

```typescript
// バリデーションエラー時（即座にレスポンス）
return Response.json({
  type: InteractionResponseType.ChannelMessageWithSource,
  data: {
    content: '❌ エラー: 必須項目が入力されていません',
    flags: 64  // ephemeral（本人にのみ表示）
  }
});

// Follow-up message でのエラー通知
await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '❌ ファイルのダウンロードに失敗しました',
    flags: 64
  })
});
```

#### 6.2 ログ出力
- Cloudflare Workers の `console.log` / `console.error` を使用
- エラー時は以下を記録:
  - エラー内容
  - Interaction ID
  - ユーザーID
  - タイムスタンプ

### 7. セキュリティ設計

#### 7.1 Discord 署名検証
- すべてのリクエストで Discord の署名を検証（Ed25519）
- 検証失敗時は 401 を返し、処理を中断

#### 7.2 入力サニタイゼーション
- Embed 投稿時、特殊文字のエスケープは Discord API 側で処理される
- ただし、異常に長い入力（Embed の文字数制限超過）は事前にチェック

#### 7.3 ファイル検証
- ファイルサイズ上限: 8MB（Discord の制限に準拠）
- 許可する拡張子: `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
- MIME Type チェック

### 8. デプロイ・運用

#### 8.1 デプロイフロー
1. GitHub Actions 等でビルド（`wrangler build`）
2. Cloudflare Workers へデプロイ（`wrangler deploy`）
3. Discord Developer Portal で Interactions Endpoint URL を設定
4. Application Commands を登録（デプロイスクリプトで自動化）

#### 8.2 モニタリング
- Cloudflare Workers のダッシュボードでリクエスト数・エラー率を監視
- エラーログを定期的に確認

#### 8.3 コマンド登録

**2段階のアプローチ**（参考実装パターン）:

**1. コマンド定義の構築（script/builder.ts）**

discord.js の `SlashCommandBuilder` を使用:
```typescript
import { SlashCommandBuilder } from 'discord.js';
import { writeFileSync } from 'fs';

const ADD_GAME_COMMAND = new SlashCommandBuilder()
  .setName('add-game')
  .setDescription('ボードゲーム情報を登録します')
  .toJSON();

const ADD_MAP_COMMAND = new SlashCommandBuilder()
  .setName('add-map')
  .setDescription('Minecraftマップ情報を登録します')
  .toJSON();

const commands = [ADD_GAME_COMMAND, ADD_MAP_COMMAND];

// commands.json に出力
writeFileSync('./src/commands.json', JSON.stringify(commands, null, 2));
console.log('Commands built successfully');
```

**2. Discord API への登録（script/register.ts）**

```typescript
import { config } from 'dotenv';
import commands from '../src/commands.json';

config(); // .env または .dev.vars から環境変数を読み込み

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APPLICATION_ID = process.env.DISCORD_APPLICATION_ID;

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
  throw new Error('Missing environment variables');
}

// Global commands の登録
const url = `https://discord.com/api/v10/applications/${DISCORD_APPLICATION_ID}/commands`;

const response = await fetch(url, {
  method: 'PUT',
  headers: {
    'Authorization': `Bot ${DISCORD_TOKEN}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(commands)
});

if (!response.ok) {
  console.error('Failed to register commands:', await response.text());
  process.exit(1);
}

console.log('Commands registered successfully');
```

**実行フロー**:
```bash
# 1. コマンド定義をビルド
bun script/builder.ts

# 2. Discord API に登録
bun script/register.ts
```

**注意点**:
- コマンド登録は**手動実行**が必要（自動化は将来的に検討）
- `PUT` メソッドで登録すると、既存のコマンドが上書きされる
- Guild（サーバー）固有のコマンドにする場合は、URL を `/guilds/{guild_id}/commands` に変更

### 9. 制約事項

#### 9.1 Discord API の制約
- Modal の入力項目数: 最大5つ
- File Upload Component: 最大10ファイル（ボードゲームフォームでは1つのみ使用）
- Embed の文字数制限:
  - title: 256文字
  - description: 4096文字
  - field.value: 1024文字
  - 合計: 6000文字

#### 9.2 Cloudflare Workers の制約
- 無料プラン: CPU時間 10ms、リクエストあたり
- メモリ制限: 128MB
- 実行時間: 最大30秒（有料プラン）
- ファイルダウンロードはこれらの制約内で処理する必要がある

### 10. 開発環境とセットアップ

#### 10.1 環境変数の管理

**example.dev.vars** を用意:
```
DISCORD_APPLICATION_ID=""
DISCORD_PUBLIC_KEY=""
DISCORD_BOT_TOKEN=""
BOARDGAME_CHANNEL_ID=""
MINECRAFT_CHANNEL_ID=""
```

開発者は `.dev.vars` にコピーして使用（`.gitignore` で除外）

#### 10.2 ローカル開発環境

**wrangler dev でのローカル実行**:
```bash
bun wrangler dev
```

- ローカルサーバーが起動（デフォルト: http://localhost:8787）
- `.dev.vars` から環境変数が自動読み込み
- ホットリロード対応

**Cloudflare Tunnel で外部公開**:
```bash
cloudflared tunnel --url localhost:8787
```

- Discord からアクセス可能な一時URLを取得
- Discord Developer Portal の Interactions Endpoint URL に設定してテスト

#### 10.3 型定義の自動生成

```bash
bun wrangler types
```

- `worker-configuration.d.ts` が自動生成される
- Cloudflare Workers の型定義と、カスタム `Env` インターフェースが含まれる
- wrangler.toml の設定に基づいて生成

#### 10.4 設定ファイル

**wrangler.toml**:
```toml
name = "discord-form-action"
main = "src/index.ts"
compatibility_date = "2025-05-17"

[observability]
enabled = true
```

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES2022",
    "lib": ["ES2021"],
    "types": ["@cloudflare/workers-types"],
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "script/**/*"],
  "exclude": ["node_modules"]
}
```

**biome.json**:
```json
{
  "$schema": "https://biomejs.dev/schemas/<version>/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": false,
    "ignore": []
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab"
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single"
    }
  }
}
```

**注**: `<version>` は実装時の最新バージョンに置き換えること

**package.json scripts**:
```json
{
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "cf-typegen": "wrangler types",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome lint --write .",
    "format": "biome format --write .",
    "check": "biome check --write ."
  }
}
```

#### 10.5 初期セットアップフロー

```bash
# 1. 依存関係のインストール
bun install

# 2. 型定義の生成
bun wrangler types

# 3. 環境変数の設定
cp example.dev.vars .dev.vars
# .dev.vars を編集して実際の値を設定

# 4. コマンド定義のビルド
bun script/builder.ts

# 5. Discord へのコマンド登録
bun script/register.ts

# 6. ローカル開発サーバー起動
bun wrangler dev

# 7. (別ターミナル) Cloudflare Tunnel 起動
cloudflared tunnel --url localhost:8787

# コード品質チェック（任意）
bun run check  # Biome による lint & format & import 整理
```

### 11. テスト戦略

#### 11.1 テストフレームワーク

**vitest + Cloudflare Workers 統合**:

`package.json`:
```json
{
  "devDependencies": {
    "vitest": "~3.0.7",
    "@cloudflare/vitest-pool-workers": "^0.8.19"
  }
}
```

`vitest.config.ts`:
```typescript
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' }
      }
    }
  }
});
```

#### 11.2 ユニットテストの例

```typescript
import { describe, it, expect } from 'vitest';
import { extractFormData, buildBoardGameEmbed } from '../src/forms/boardgame';

describe('extractFormData', () => {
  it('should extract text input values', () => {
    const interaction = {
      data: {
        custom_id: 'boardgame_form',
        components: [
          {
            type: 1,
            components: [
              { type: 4, custom_id: 'game_name', value: 'カタン' }
            ]
          }
        ]
      }
    };

    const { formData } = extractFormData(interaction);
    expect(formData.game_name).toBe('カタン');
  });
});
```

**Workers ランタイムでのテスト**:
- `@cloudflare/vitest-pool-workers` により、実際の Workers 環境でテスト実行
- 環境変数、fetch API、その他 Workers 固有の機能をテスト可能

#### 11.3 テスト実行

```bash
bun test
```

### 12. 型定義管理

#### 12.1 使用する型定義パッケージ

**discord-api-types/v10**:
```typescript
import type {
  APIInteraction,
  APIApplicationCommandInteraction,
  APIModalSubmitInteraction,
  InteractionType,
  InteractionResponseType,
  APIEmbed,
  APIUser
} from 'discord-api-types/v10';
```

**Cloudflare Workers 型**:
```typescript
import type {
  ExportedHandler,
  ExecutionContext
} from '@cloudflare/workers-types';
```

#### 12.2 カスタム型定義

`worker-configuration.d.ts` (自動生成):
```typescript
interface Env {
  DISCORD_APPLICATION_ID: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_BOT_TOKEN: string;
  BOARDGAME_CHANNEL_ID: string;
  MINECRAFT_CHANNEL_ID: string;
}
```

フォーム固有の型（forms/types.ts）:
```typescript
export interface FormData {
  [key: string]: string;
}

export interface FormAttachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  content_type?: string;
}
```

### 13. 依存パッケージ

#### 13.1 本番依存

```json
{
  "dependencies": {
    "discord-interactions": "<実装時の最新>",  // 署名検証
    "discord.js": "<実装時の最新>"             // コマンド構築（script/でのみ使用）
  }
}
```

**注意**: `discord.js` は `script/builder.ts` でコマンド定義を構築する際にのみ使用。Workers ランタイムでは `discord-api-types` の型定義のみを使用。

#### 13.2 開発依存

```json
{
  "devDependencies": {
    "@biomejs/biome": "<実装時の最新>",
    "@cloudflare/workers-types": "<実装時の最新>",
    "@cloudflare/vitest-pool-workers": "<実装時の最新>",
    "discord-api-types": "<実装時の最新>",
    "dotenv": "<実装時の最新>",
    "typescript": "<実装時の最新>",
    "vitest": "<実装時の最新>",
    "wrangler": "<実装時の最新>"
  }
}
```

**注**: 各パッケージのバージョンは実装フェーズで最新版を確定させる

**Biome について**:
- **Linter & Formatter**: ESLint + Prettier の代替として Biome を使用
- **高速**: Rust 製で非常に高速に動作
- **統合ツール**: Lint、Format、Import整理を1つのツールで実現

#### 13.3 パッケージマネージャー

本プロジェクトでは **Bun** を使用します:

```bash
# インストール
bun install

# 開発サーバー起動
bun wrangler dev

# テスト実行
bun test

# コード品質チェック
bun run check
```

### 14. 拡張性の考慮

#### 14.1 新しいフォームタイプの追加
1. `forms/` に新しいフォーム定義を追加
2. `script/builder.ts` に新しいコマンド定義を追加
3. 環境変数で新しいチャンネルIDを設定
4. `index.ts` にコマンド/Modal ハンドラーを追加
5. コマンドを再登録（`bun script/register.ts`）

#### 14.2 将来機能への対応
- 編集・削除機能: Message Components (Button) や Context Menu を追加
- 週次通知: Cloudflare Workers Cron Triggers を使用
- タグ検索: Select Menu Component を追加