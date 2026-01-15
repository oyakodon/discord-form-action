import type {
  APIEmbed,
  APIModalSubmitInteraction,
  APIUser,
  InteractionResponseType,
} from "discord-api-types/v10";
import { isUrl, ValidationError, validateRequired } from "../utils/validation.js";

/**
 * Minecraftフォームのデータ
 */
interface MinecraftFormData {
  map_name: string;
  url: string;
  player_count: string;
  mc_version?: string;
  tags?: string;
}

/**
 * Modal定義を返す
 */
export function getMinecraftModal() {
  return {
    type: 9 as InteractionResponseType.Modal,
    data: {
      custom_id: "minecraft_form",
      title: "Minecraftマップ登録",
      components: [
        {
          type: 1, // ActionRow
          components: [
            {
              type: 4, // TextInput
              custom_id: "map_name",
              label: "マップ名",
              style: 1, // Short
              required: true,
              max_length: 256,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "url",
              label: "URL",
              style: 1,
              required: true,
              placeholder: "https://...",
              max_length: 500,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "player_count",
              label: "プレイ人数",
              style: 1,
              required: true,
              placeholder: "例: 1-4人",
              max_length: 100,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "mc_version",
              label: "Minecraftバージョン",
              style: 1,
              required: false,
              placeholder: "例: 1.20.1",
              max_length: 50,
            },
          ],
        },
        {
          type: 1,
          components: [
            {
              type: 4,
              custom_id: "tags",
              label: "タグ",
              style: 1,
              required: false,
              placeholder: "例: mod, アスレチック, PvP",
              max_length: 200,
            },
          ],
        },
      ],
    },
  };
}

/**
 * フォームデータを抽出
 */
export function extractFormData(interaction: APIModalSubmitInteraction): MinecraftFormData {
  const formData: Record<string, string> = {};

  // TextInput values
  for (const row of interaction.data.components) {
    // @ts-expect-error: discord-api-types does not properly type nested components
    for (const component of row.components) {
      if (component.type === 4 && component.value !== undefined) {
        // TextInput
        formData[component.custom_id] = component.value.trim();
      }
    }
  }

  // 空文字列はundefinedとして扱う
  const result: MinecraftFormData = {
    map_name: formData.map_name || "",
    url: formData.url || "",
    player_count: formData.player_count || "",
    mc_version: formData.mc_version || undefined,
    tags: formData.tags || undefined,
  };

  return result;
}

/**
 * Embed構築
 */
export function buildMinecraftEmbed(formData: MinecraftFormData, user: APIUser): APIEmbed {
  const fields = [];

  // URL
  fields.push({
    name: "URL",
    value: formData.url,
    inline: false,
  });

  // プレイ人数
  fields.push({
    name: "プレイ人数",
    value: formData.player_count,
    inline: true,
  });

  // Minecraftバージョン
  if (formData.mc_version) {
    fields.push({
      name: "Minecraftバージョン",
      value: formData.mc_version,
      inline: true,
    });
  }

  // タグ
  if (formData.tags) {
    fields.push({
      name: "タグ",
      value: formData.tags,
      inline: false,
    });
  }

  const embed: APIEmbed = {
    title: formData.map_name,
    color: 0x2ecc71, // 緑色
    fields,
    footer: {
      text: `登録者: ${user.username}`,
    },
    timestamp: new Date().toISOString(),
  };

  return embed;
}

/**
 * MinecraftフォームのSubmit処理
 */
export async function handleMinecraftSubmit(
  interaction: APIModalSubmitInteraction,
  env: Env,
  ctx: ExecutionContext,
) {
  // Deferred response（処理に時間がかかる可能性があるため）
  const response = Response.json({
    type: 5 as InteractionResponseType.DeferredChannelMessageWithSource,
    data: { flags: 64 }, // ephemeral
  });

  // 非同期処理を継続
  ctx.waitUntil(
    (async () => {
      try {
        // データ抽出
        const formData = extractFormData(interaction);

        // バリデーション
        validateRequired(formData.map_name, "マップ名");
        validateRequired(formData.url, "URL");
        validateRequired(formData.player_count, "プレイ人数");

        // URL形式チェック
        if (!isUrl(formData.url)) {
          throw new ValidationError("URLは http:// または https:// で始まる形式で入力してください");
        }

        // ユーザー情報取得
        const user =
          "member" in interaction && interaction.member?.user
            ? interaction.member.user
            : interaction.user;

        if (!user) {
          throw new ValidationError("ユーザー情報が取得できませんでした");
        }

        // Embed構築
        const embed = buildMinecraftEmbed(formData, user);

        // チャンネルに投稿
        const channelResponse = await fetch(
          `https://discord.com/api/v10/channels/${env.MINECRAFT_CHANNEL_ID}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              embeds: [embed],
            }),
          },
        );

        if (!channelResponse.ok) {
          throw new Error(`チャンネルへの投稿に失敗しました: ${channelResponse.status}`);
        }

        // ユーザーへの完了通知（Follow-up message）
        const webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`;
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: "✅ Minecraftマップの登録が完了しました！",
            flags: 64, // ephemeral
          }),
        });
      } catch (error) {
        console.error("Failed to handle minecraft submit:", error);

        // エラー通知
        const webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`;
        const errorMessage =
          error instanceof ValidationError
            ? error.message
            : "❌ エラーが発生しました。もう一度お試しください。";

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: errorMessage,
            flags: 64,
          }),
        }).catch((err) => console.error("Failed to send error message:", err));
      }
    })(),
  );

  return response;
}
