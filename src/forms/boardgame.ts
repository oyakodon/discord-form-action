import type {
	APIEmbed,
	APIModalSubmitInteraction,
	APIUser,
	InteractionResponseType,
} from "discord-api-types/v10";
import { downloadAttachments } from "../utils/fileService.js";
import { ValidationError, isUrl, validateRequired } from "../utils/validation.js";

/**
 * ボードゲームフォームのデータ
 */
interface BoardGameFormData {
	game_name: string;
	player_count?: string;
	play_time?: string;
	owner_url?: string;
}

/**
 * Modal定義を返す
 */
export function getBoardGameModal() {
	return {
		type: 9 as InteractionResponseType.Modal,
		data: {
			custom_id: "boardgame_form",
			title: "ボードゲーム登録",
			components: [
				{
					type: 1, // ActionRow
					components: [
						{
							type: 4, // TextInput
							custom_id: "game_name",
							label: "ゲーム名",
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
							custom_id: "player_count",
							label: "推奨プレイ人数",
							style: 1,
							required: false,
							placeholder: "例: 3-5人",
							max_length: 100,
						},
					],
				},
				{
					type: 1,
					components: [
						{
							type: 4,
							custom_id: "play_time",
							label: "プレイ時間",
							style: 1,
							required: false,
							placeholder: "例: 30-60分",
							max_length: 100,
						},
					],
				},
				{
					type: 1,
					components: [
						{
							type: 4,
							custom_id: "owner_url",
							label: "所有者/URL",
							style: 1,
							required: false,
							placeholder: "所有者名 または オンラインゲームのURL",
							max_length: 500,
						},
					],
				},
				{
					type: 1,
					components: [
						{
							type: 11, // FileUpload
							custom_id: "photo",
							label: "写真",
							required: false,
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
export function extractFormData(interaction: APIModalSubmitInteraction): {
	formData: BoardGameFormData;
	attachmentUrls: string[];
} {
	const formData: Record<string, string> = {};

	// TextInput values
	for (const row of interaction.data.components) {
		for (const component of row.components) {
			if (component.type === 4 && component.value !== undefined) {
				// TextInput
				formData[component.custom_id] = component.value.trim();
			}
		}
	}

	// File attachments
	const attachmentUrls = interaction.resolved?.attachments
		? Object.values(interaction.resolved.attachments).map((att) => att.url)
		: [];

	// 空文字列はundefinedとして扱う
	const result: BoardGameFormData = {
		game_name: formData.game_name,
		player_count: formData.player_count || undefined,
		play_time: formData.play_time || undefined,
		owner_url: formData.owner_url || undefined,
	};

	return {
		formData: result,
		attachmentUrls,
	};
}

/**
 * Embed構築
 */
export function buildBoardGameEmbed(
	formData: BoardGameFormData,
	user: APIUser,
	imageUrl?: string,
): APIEmbed {
	const isOnlineGame = formData.owner_url ? isUrl(formData.owner_url) : false;
	const gameType = isOnlineGame ? "オンラインゲーム" : "物理ゲーム";

	const fields = [];

	// プレイ人数
	if (formData.player_count) {
		fields.push({
			name: "推奨プレイ人数",
			value: formData.player_count,
			inline: true,
		});
	}

	// プレイ時間
	if (formData.play_time) {
		fields.push({
			name: "プレイ時間",
			value: formData.play_time,
			inline: true,
		});
	}

	// 所有者/URL
	if (formData.owner_url) {
		if (isOnlineGame) {
			fields.push({
				name: "URL",
				value: formData.owner_url,
				inline: false,
			});
		} else {
			fields.push({
				name: "所有者",
				value: formData.owner_url,
				inline: false,
			});
		}
	}

	const embed: APIEmbed = {
		title: formData.game_name,
		color: isOnlineGame ? 0x5865f2 : 0x57f287, // 青: オンライン, 緑: 物理
		fields,
		footer: {
			text: `${gameType} | 登録者: ${user.username}`,
		},
		timestamp: new Date().toISOString(),
	};

	// 画像がある場合
	if (imageUrl) {
		embed.image = { url: imageUrl };
	}

	return embed;
}

/**
 * ボードゲームフォームのSubmit処理
 */
export async function handleBoardGameSubmit(
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
				const { formData, attachmentUrls } = extractFormData(interaction);

				// バリデーション
				validateRequired(formData.game_name, "ゲーム名");

				// ユーザー情報取得
				const user =
					"member" in interaction && interaction.member?.user
						? interaction.member.user
						: interaction.user;

				if (!user) {
					throw new ValidationError("ユーザー情報が取得できませんでした");
				}

				// ファイルダウンロード処理
				let downloadedFile:
					| { buffer: ArrayBuffer; filename: string }
					| undefined;
				if (attachmentUrls.length > 0) {
					try {
						const files = await downloadAttachments(attachmentUrls);
						// ファイル名を取得
						const originalUrl = new URL(files[0].url);
						const filename =
							originalUrl.pathname.split("/").pop() ||
							`boardgame_${Date.now()}.png`;
						downloadedFile = {
							buffer: files[0].buffer,
							filename,
						};
					} catch (error) {
						console.error("Failed to download attachment:", error);
						// 画像エラーは警告として扱い、処理は継続
					}
				}

				// Embed構築（画像がある場合は attachment:// URL を使用）
				const imageUrl = downloadedFile
					? `attachment://${downloadedFile.filename}`
					: undefined;
				const embed = buildBoardGameEmbed(formData, user, imageUrl);

				// チャンネルに投稿
				let channelResponse: Response;
				if (downloadedFile) {
					// 画像がある場合: multipart/form-data で送信
					const messageFormData = new FormData();
					messageFormData.append(
						"payload_json",
						JSON.stringify({
							embeds: [embed],
						}),
					);
					messageFormData.append(
						"files[0]",
						new Blob([downloadedFile.buffer]),
						downloadedFile.filename,
					);

					channelResponse = await fetch(
						`https://discord.com/api/v10/channels/${env.BOARDGAME_CHANNEL_ID}/messages`,
						{
							method: "POST",
							headers: {
								Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`,
							},
							body: messageFormData,
						},
					);
				} else {
					// 画像がない場合: JSON で送信
					channelResponse = await fetch(
						`https://discord.com/api/v10/channels/${env.BOARDGAME_CHANNEL_ID}/messages`,
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
				}

				if (!channelResponse.ok) {
					throw new Error(
						`チャンネルへの投稿に失敗しました: ${channelResponse.status}`,
					);
				}

				// ユーザーへの完了通知（Follow-up message）
				const webhookUrl = `https://discord.com/api/v10/webhooks/${env.DISCORD_APPLICATION_ID}/${interaction.token}`;
				await fetch(webhookUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						content: "✅ ボードゲームの登録が完了しました！",
						flags: 64, // ephemeral
					}),
				});
			} catch (error) {
				console.error("Failed to handle boardgame submit:", error);

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
