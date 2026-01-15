import type { APIModalSubmitInteraction, APIUser, Locale } from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import { buildMinecraftEmbed, extractFormData } from "../src/forms/minecraft.js";

describe("minecraft form", () => {
  describe("extractFormData", () => {
    it("必須項目のみが入力された場合、正しく抽出できる", () => {
      const interaction: APIModalSubmitInteraction = {
        id: "test-id",
        application_id: "test-app-id",
        type: 5, // ModalSubmit
        token: "test-token",
        version: 1,
        data: {
          custom_id: "minecraft_form",
          components: [
            {
              type: 1, // ActionRow
              components: [
                {
                  type: 4, // TextInput
                  custom_id: "map_name",
                  value: "スカイブロック",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "url",
                  value: "https://example.com/skyblock",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "player_count",
                  value: "1-4人",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "mc_version",
                  value: "",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "tags",
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
        locale: "ja" as Locale,
        entitlements: [],
        authorizing_integration_owners: {},
        attachment_size_limit: 0,
      } as APIModalSubmitInteraction;

      const formData = extractFormData(interaction);

      expect(formData.map_name).toBe("スカイブロック");
      expect(formData.url).toBe("https://example.com/skyblock");
      expect(formData.player_count).toBe("1-4人");
      expect(formData.mc_version).toBeUndefined();
      expect(formData.tags).toBeUndefined();
    });

    it("すべての項目が入力された場合、正しく抽出できる", () => {
      const interaction: APIModalSubmitInteraction = {
        id: "test-id",
        application_id: "test-app-id",
        type: 5,
        token: "test-token",
        version: 1,
        data: {
          custom_id: "minecraft_form",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "map_name",
                  value: "スカイブロック",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "url",
                  value: "https://example.com/skyblock",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "player_count",
                  value: "1-4人",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "mc_version",
                  value: "1.20.1",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "tags",
                  value: "アスレチック, mod",
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
        locale: "ja" as Locale,
        entitlements: [],
        authorizing_integration_owners: {},
        attachment_size_limit: 0,
      } as APIModalSubmitInteraction;

      const formData = extractFormData(interaction);

      expect(formData.map_name).toBe("スカイブロック");
      expect(formData.url).toBe("https://example.com/skyblock");
      expect(formData.player_count).toBe("1-4人");
      expect(formData.mc_version).toBe("1.20.1");
      expect(formData.tags).toBe("アスレチック, mod");
    });

    it("空白のみの入力はundefinedとして扱われる", () => {
      const interaction: APIModalSubmitInteraction = {
        id: "test-id",
        application_id: "test-app-id",
        type: 5,
        token: "test-token",
        version: 1,
        data: {
          custom_id: "minecraft_form",
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "map_name",
                  value: "  スカイブロック  ",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "url",
                  value: "  https://example.com/skyblock  ",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "player_count",
                  value: "  1-4人  ",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "mc_version",
                  value: "   ",
                },
              ],
            },
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: "tags",
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
        locale: "ja" as Locale,
        entitlements: [],
        authorizing_integration_owners: {},
        attachment_size_limit: 0,
      } as APIModalSubmitInteraction;

      const formData = extractFormData(interaction);

      expect(formData.map_name).toBe("スカイブロック");
      expect(formData.url).toBe("https://example.com/skyblock");
      expect(formData.player_count).toBe("1-4人");
      expect(formData.mc_version).toBeUndefined();
      expect(formData.tags).toBeUndefined();
    });
  });

  describe("buildMinecraftEmbed", () => {
    const testUser: APIUser = {
      id: "test-user-id",
      username: "testuser",
      discriminator: "0",
      avatar: null,
      global_name: null,
    };

    it("すべての項目が指定された場合、正しくEmbedを構築できる", () => {
      const formData = {
        map_name: "スカイブロック",
        url: "https://example.com/skyblock",
        player_count: "1-4人",
        mc_version: "1.20.1",
        tags: "アスレチック, mod",
      };

      const embed = buildMinecraftEmbed(formData, testUser);

      expect(embed.title).toBe("スカイブロック");
      expect(embed.color).toBe(0x2ecc71); // 緑色
      expect(embed.fields).toHaveLength(4);
      expect(embed.fields?.[0]).toEqual({
        name: "URL",
        value: "https://example.com/skyblock",
        inline: false,
      });
      expect(embed.fields?.[1]).toEqual({
        name: "プレイ人数",
        value: "1-4人",
        inline: true,
      });
      expect(embed.fields?.[2]).toEqual({
        name: "Minecraftバージョン",
        value: "1.20.1",
        inline: true,
      });
      expect(embed.fields?.[3]).toEqual({
        name: "タグ",
        value: "アスレチック, mod",
        inline: false,
      });
      expect(embed.footer?.text).toBe("登録者: testuser");
      expect(embed.timestamp).toBeDefined();
    });

    it("必須項目のみが指定された場合、正しくEmbedを構築できる", () => {
      const formData = {
        map_name: "スカイブロック",
        url: "https://example.com/skyblock",
        player_count: "1-4人",
      };

      const embed = buildMinecraftEmbed(formData, testUser);

      expect(embed.title).toBe("スカイブロック");
      expect(embed.color).toBe(0x2ecc71);
      expect(embed.fields).toHaveLength(2);
      expect(embed.fields?.[0]).toEqual({
        name: "URL",
        value: "https://example.com/skyblock",
        inline: false,
      });
      expect(embed.fields?.[1]).toEqual({
        name: "プレイ人数",
        value: "1-4人",
        inline: true,
      });
      expect(embed.footer?.text).toBe("登録者: testuser");
    });

    it("バージョンのみが指定された場合、正しくEmbedを構築できる", () => {
      const formData = {
        map_name: "スカイブロック",
        url: "https://example.com/skyblock",
        player_count: "1-4人",
        mc_version: "1.20.1",
      };

      const embed = buildMinecraftEmbed(formData, testUser);

      expect(embed.fields).toHaveLength(3);
      expect(embed.fields?.[2]).toEqual({
        name: "Minecraftバージョン",
        value: "1.20.1",
        inline: true,
      });
    });

    it("タグのみが指定された場合、正しくEmbedを構築できる", () => {
      const formData = {
        map_name: "スカイブロック",
        url: "https://example.com/skyblock",
        player_count: "1-4人",
        tags: "アスレチック",
      };

      const embed = buildMinecraftEmbed(formData, testUser);

      expect(embed.fields).toHaveLength(3);
      expect(embed.fields?.[2]).toEqual({
        name: "タグ",
        value: "アスレチック",
        inline: false,
      });
    });
  });
});
