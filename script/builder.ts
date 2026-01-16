import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import { SlashCommandBuilder } from "discord.js";

// __dirnameの代替（ESモジュール環境）
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * コマンド定義を構築
 */
function buildCommands(): RESTPostAPIApplicationCommandsJSONBody[] {
  // /add-game コマンド定義
  const addGameCommand = new SlashCommandBuilder()
    .setName("add-game")
    .setDescription("ボードゲームを登録します");

  // /add-map コマンド定義
  const addMapCommand = new SlashCommandBuilder()
    .setName("add-map")
    .setDescription("Minecraftマップを登録します");

  return [addGameCommand.toJSON(), addMapCommand.toJSON()];
}

/**
 * メイン処理
 */
async function main() {
  try {
    const commands = buildCommands();

    // commands.json の出力先（src/commands.json）
    const outputPath = join(__dirname, "..", "src", "commands.json");

    // JSON形式で出力
    await writeFile(outputPath, JSON.stringify(commands, null, 2), "utf-8");

    console.log(`✅ コマンド定義を ${outputPath} に出力しました`);
    console.log(`📝 登録されたコマンド数: ${commands.length}`);

    for (const command of commands as Array<{ name: string; description: string }>) {
      console.log(`  - /${command.name}: ${command.description}`);
    }
  } catch (error) {
    console.error("❌ コマンド定義の生成に失敗しました:", error);
    process.exit(1);
  }
}

// スクリプト実行
main();
