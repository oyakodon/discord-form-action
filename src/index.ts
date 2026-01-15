import type { APIInteraction } from "discord-api-types/v10";
import { verifyKey } from "discord-interactions";
import { getBoardGameModal, handleBoardGameSubmit } from "./forms/boardgame.js";
import { getMinecraftModal, handleMinecraftSubmit } from "./forms/minecraft.js";

/**
 * Discord署名検証
 */
async function verifyDiscordRequest(
  request: Request,
  env: Env,
): Promise<{ isValid: boolean; interaction?: APIInteraction }> {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");
  const body = await request.text();

  if (!signature || !timestamp) {
    return { isValid: false };
  }

  const isValidRequest = await verifyKey(body, signature, timestamp, env.DISCORD_PUBLIC_KEY);

  if (!isValidRequest) {
    return { isValid: false };
  }

  return {
    isValid: true,
    interaction: JSON.parse(body) as APIInteraction,
  };
}

/**
 * メインハンドラー
 */
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext) {
    // GET: Application ID を返却（ヘルスチェック用）
    if (request.method === "GET") {
      return new Response(env.DISCORD_APPLICATION_ID);
    }

    // 署名検証
    const { isValid, interaction } = await verifyDiscordRequest(request, env);
    if (!isValid || !interaction) {
      return new Response("Bad request signature.", { status: 401 });
    }

    // Ping応答
    if (interaction.type === 1 /* InteractionType.Ping */) {
      return Response.json({ type: 1 /* InteractionResponseType.Pong */ });
    }

    // ApplicationCommand処理
    if (interaction.type === 2 /* InteractionType.ApplicationCommand */) {
      switch (interaction.data.name) {
        case "add-game":
          return Response.json(getBoardGameModal());
        case "add-map":
          return Response.json(getMinecraftModal());
        default:
          return Response.json({ error: "Unknown command" }, { status: 400 });
      }
    }

    // ModalSubmit処理
    if (interaction.type === 5 /* InteractionType.ModalSubmit */) {
      switch (interaction.data.custom_id) {
        case "boardgame_form":
          return handleBoardGameSubmit(interaction, env, _ctx);
        case "minecraft_form":
          return handleMinecraftSubmit(interaction, env, _ctx);
        default:
          return Response.json({ error: "Unknown modal" }, { status: 400 });
      }
    }

    return Response.json({ error: "Unknown Type" }, { status: 400 });
  },
} satisfies ExportedHandler<Env>;
