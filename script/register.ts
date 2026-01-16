import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

// __dirnameの代替（ESモジュール環境）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 環境変数の検証
 */
function validateEnv(): { applicationId: string; botToken: string } {
  const applicationId = process.env.DISCORD_APPLICATION_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!applicationId) {
    throw new Error("DISCORD_APPLICATION_ID が設定されていません");
  }

  if (!botToken) {
    throw new Error("DISCORD_BOT_TOKEN が設定されていません");
  }

  return { applicationId, botToken };
}

/**
 * commands.jsonの読み込み
 */
async function loadCommands(): Promise<RESTPostAPIApplicationCommandsJSONBody[]> {
  const commandsPath = join(__dirname, "..", "src", "commands.json");

  try {
    const fileContent = await readFile(commandsPath, "utf-8");
    const commands = JSON.parse(fileContent) as RESTPostAPIApplicationCommandsJSONBody[];

    if (!Array.isArray(commands)) {
      throw new Error("commands.jsonの形式が不正です（配列である必要があります）");
    }

    return commands;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `commands.json が見つかりません: ${commandsPath}\nbun script/builder.ts を先に実行してください`,
      );
    }
    throw error;
  }
}

/**
 * Discord APIにコマンドを登録
 */
async function registerCommands(
  applicationId: string,
  botToken: string,
  commands: RESTPostAPIApplicationCommandsJSONBody[],
): Promise<void> {
  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;

  console.log(`📡 Discord API にコマンドを登録中: ${url}`);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Discord API へのコマンド登録に失敗しました\nStatus: ${response.status}\nResponse: ${errorText}`,
    );
  }

  const registeredCommands = (await response.json()) as Array<{ id: string; name: string }>;
  console.log(`✅ ${registeredCommands.length} 個のコマンドを登録しました:`);

  for (const command of registeredCommands) {
    console.log(`  - /${command.name} (ID: ${command.id})`);
  }
}

/**
 * メイン処理
 */
async function main() {
  try {
    console.log("🚀 Discord コマンド登録スクリプトを開始します\n");

    // 環境変数の検証
    console.log("🔍 環境変数を検証中...");
    const { applicationId, botToken } = validateEnv();
    console.log(`✅ Application ID: ${applicationId}\n`);

    // commands.jsonの読み込み
    console.log("📖 commands.json を読み込み中...");
    const commands = await loadCommands();
    console.log(`✅ ${commands.length} 個のコマンド定義を読み込みました\n`);

    // Discord APIへの登録
    await registerCommands(applicationId, botToken, commands);

    console.log("\n🎉 コマンド登録が完了しました！");
  } catch (error) {
    console.error("\n❌ エラーが発生しました:");
    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// スクリプト実行
main();
