import type { APIModalSubmitInteraction, APIUser } from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import { buildBoardGameEmbed, extractFormData } from "../src/forms/boardgame.js";

describe("boardgame form", () => {
  describe("extractFormData", () => {
    it("必須項目のみが入力された場合、正しく抽出できる", () => {
      const interaction: APIModalSubmitInteraction = {
        id: "test-id",
        application_id: "test-app-id",
        type: 5, // ModalSubmit
        token: "test-token",
        version: 1,
        data: {
          custom_id: "boardgame_form",
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 4, // TextInput
                  custom_id: "game_name",
                  value: "カタン",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "player_count",
                  value: "",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "play_time",
                  value: "",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "owner_url",
                  value: "",
                },
              ],
            },
          ],
        },
        guild_id: "test-guild-id",
        channel_id: "test-channel-id",
        user: {
          id: "test-user-id",
          username: "testuser",
          discriminator: "0",
          avatar: null,
          global_name: null,
        },
        app_permissions: "0",
        locale: "ja",
        entitlements: [],
      };

      const { formData, attachmentUrls } = extractFormData(interaction);

      expect(formData.game_name).toBe("カタン");
      expect(formData.player_count).toBeUndefined();
      expect(formData.play_time).toBeUndefined();
      expect(formData.owner_url).toBeUndefined();
      expect(attachmentUrls).toEqual([]);
    });

    it("すべての項目が入力された場合、正しく抽出できる", () => {
      const interaction: APIModalSubmitInteraction = {
        id: "test-id",
        application_id: "test-app-id",
        type: 5,
        token: "test-token",
        version: 1,
        data: {
          custom_id: "boardgame_form",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "game_name",
                  value: "カタン",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "player_count",
                  value: "3-4人",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "play_time",
                  value: "60分",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "owner_url",
                  value: "太郎",
                },
              ],
            },
          ],
        },
        guild_id: "test-guild-id",
        channel_id: "test-channel-id",
        user: {
          id: "test-user-id",
          username: "testuser",
          discriminator: "0",
          avatar: null,
          global_name: null,
        },
        app_permissions: "0",
        locale: "ja",
        entitlements: [],
      };

      const { formData, attachmentUrls } = extractFormData(interaction);

      expect(formData.game_name).toBe("カタン");
      expect(formData.player_count).toBe("3-4人");
      expect(formData.play_time).toBe("60分");
      expect(formData.owner_url).toBe("太郎");
      expect(attachmentUrls).toEqual([]);
    });

    it("添付ファイルがある場合、URLを抽出できる", () => {
      const interaction: APIModalSubmitInteraction = {
        id: "test-id",
        application_id: "test-app-id",
        type: 5,
        token: "test-token",
        version: 1,
        data: {
          custom_id: "boardgame_form",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "game_name",
                  value: "カタン",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "player_count",
                  value: "",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "play_time",
                  value: "",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "owner_url",
                  value: "",
                },
              ],
            },
          ],
        },
        resolved: {
          attachments: {
            "123456789": {
              id: "123456789",
              filename: "catan.png",
              size: 1024,
              url: "https://cdn.discordapp.com/attachments/123/456/catan.png",
              proxy_url: "https://media.discordapp.net/attachments/123/456/catan.png",
            },
          },
        },
        guild_id: "test-guild-id",
        channel_id: "test-channel-id",
        user: {
          id: "test-user-id",
          username: "testuser",
          discriminator: "0",
          avatar: null,
          global_name: null,
        },
        app_permissions: "0",
        locale: "ja",
        entitlements: [],
      };

      const { formData, attachmentUrls } = extractFormData(interaction);

      expect(formData.game_name).toBe("カタン");
      expect(attachmentUrls).toEqual(["https://cdn.discordapp.com/attachments/123/456/catan.png"]);
    });

    it("空白のみの入力はundefinedとして扱われる", () => {
      const interaction: APIModalSubmitInteraction = {
        id: "test-id",
        application_id: "test-app-id",
        type: 5,
        token: "test-token",
        version: 1,
        data: {
          custom_id: "boardgame_form",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "game_name",
                  value: "  カタン  ",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "player_count",
                  value: "   ",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "play_time",
                  value: "",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "owner_url",
                  value: "",
                },
              ],
            },
          ],
        },
        guild_id: "test-guild-id",
        channel_id: "test-channel-id",
        user: {
          id: "test-user-id",
          username: "testuser",
          discriminator: "0",
          avatar: null,
          global_name: null,
        },
        app_permissions: "0",
        locale: "ja",
        entitlements: [],
      };

      const { formData, attachmentUrls } = extractFormData(interaction);

      expect(formData.game_name).toBe("カタン");
      expect(formData.player_count).toBeUndefined();
      expect(formData.play_time).toBeUndefined();
      expect(formData.owner_url).toBeUndefined();
      expect(attachmentUrls).toEqual([]);
    });
  });

  describe("buildBoardGameEmbed", () => {
    const testUser: APIUser = {
      id: "test-user-id",
      username: "testuser",
      discriminator: "0",
      avatar: null,
      global_name: null,
    };

    it("物理ゲーム（URLなし）のEmbedを正しく構築できる", () => {
      const formData = {
        game_name: "カタン",
        player_count: "3-4人",
        play_time: "60分",
        owner_url: "太郎",
      };

      const embed = buildBoardGameEmbed(formData, testUser);

      expect(embed.title).toBe("カタン");
      expect(embed.color).toBe(0x57f287); // 緑: 物理ゲーム
      expect(embed.fields).toHaveLength(3);
      expect(embed.fields?.[0]).toEqual({
        name: "推奨プレイ人数",
        value: "3-4人",
        inline: true,
      });
      expect(embed.fields?.[1]).toEqual({
        name: "プレイ時間",
        value: "60分",
        inline: true,
      });
      expect(embed.fields?.[2]).toEqual({
        name: "所有者",
        value: "太郎",
        inline: false,
      });
      expect(embed.footer?.text).toBe("物理ゲーム | 登録者: testuser");
      expect(embed.timestamp).toBeDefined();
      expect(embed.image).toBeUndefined();
    });

    it("オンラインゲーム（URLあり）のEmbedを正しく構築できる", () => {
      const formData = {
        game_name: "Among Us",
        player_count: "4-10人",
        play_time: "15-30分",
        owner_url: "https://www.innersloth.com/games/among-us/",
      };

      const embed = buildBoardGameEmbed(formData, testUser);

      expect(embed.title).toBe("Among Us");
      expect(embed.color).toBe(0x5865f2); // 青: オンラインゲーム
      expect(embed.fields).toHaveLength(3);
      expect(embed.fields?.[2]).toEqual({
        name: "URL",
        value: "https://www.innersloth.com/games/among-us/",
        inline: false,
      });
      expect(embed.footer?.text).toBe("オンラインゲーム | 登録者: testuser");
    });

    it("必須項目のみのEmbedを正しく構築できる", () => {
      const formData = {
        game_name: "カタン",
      };

      const embed = buildBoardGameEmbed(formData, testUser);

      expect(embed.title).toBe("カタン");
      expect(embed.color).toBe(0x57f287); // 緑: 物理ゲーム（URLなし）
      expect(embed.fields).toHaveLength(0);
      expect(embed.footer?.text).toBe("物理ゲーム | 登録者: testuser");
    });

    it("画像URLが指定された場合、Embedに画像が含まれる", () => {
      const formData = {
        game_name: "カタン",
      };

      const embed = buildBoardGameEmbed(formData, testUser, "attachment://catan.png");

      expect(embed.image).toEqual({ url: "attachment://catan.png" });
    });

    it("HTTPプロトコルのURLもオンラインゲームとして判定される", () => {
      const formData = {
        game_name: "Test Game",
        owner_url: "http://example.com/game",
      };

      const embed = buildBoardGameEmbed(formData, testUser);

      expect(embed.color).toBe(0x5865f2); // 青: オンラインゲーム
      expect(embed.fields?.[0]).toEqual({
        name: "URL",
        value: "http://example.com/game",
        inline: false,
      });
      expect(embed.footer?.text).toBe("オンラインゲーム | 登録者: testuser");
    });

    it("不正なURL形式は物理ゲームとして扱われる", () => {
      const formData = {
        game_name: "Test Game",
        owner_url: "not-a-url",
      };

      const embed = buildBoardGameEmbed(formData, testUser);

      expect(embed.color).toBe(0x57f287); // 緑: 物理ゲーム
      expect(embed.fields?.[0]).toEqual({
        name: "所有者",
        value: "not-a-url",
        inline: false,
      });
      expect(embed.footer?.text).toBe("物理ゲーム | 登録者: testuser");
    });
  });
});
