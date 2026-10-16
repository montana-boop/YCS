/**
 * Shared MCP server factory for discord-mcp.
 *
 * Exposes Discord REST API v10 operations as MCP tools: channels, messages,
 * guilds, roles, and members. Authenticates with a bot token supplied via the
 * DISCORD_BOT_TOKEN environment variable.
 *
 * `createServer()` is used by both the stdio entry point (index.ts) and the
 * remote HTTP entry point (http.ts).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const DISCORD_API = "https://discord.com/api/v10";
const USER_AGENT = "discord-mcp (https://github.com/montana-boop/YCS, 0.1.0)";

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * Issue a request against the Discord REST API. Throws a descriptive error on a
 * non-2xx response so the tool wrapper can surface it to the MCP client.
 */
async function discord(method: Method, path: string, body?: unknown): Promise<unknown> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    throw new Error(
      "DISCORD_BOT_TOKEN environment variable is not set. Set it to your Discord bot token before using this server.",
    );
  }

  const res = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const raw = await res.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }

  if (!res.ok) {
    const detail = typeof data === "string" ? data : JSON.stringify(data);
    throw new Error(`Discord API ${method} ${path} → ${res.status} ${res.statusText}: ${detail}`);
  }

  return data;
}

const snowflake = (label: string) =>
  z.string().regex(/^\d{17,20}$/, `${label} must be a Discord snowflake ID`);

const optionalSnowflake = (label: string) => snowflake(label).optional();

/**
 * Resolve the guild to act on: an explicit guild_id argument takes precedence,
 * otherwise fall back to the DISCORD_GUILD_ID environment default. Throws if
 * neither is available.
 */
function resolveGuild(guildId?: string): string {
  const resolved = guildId ?? process.env.DISCORD_GUILD_ID;
  if (!resolved) {
    throw new Error(
      "No guild_id provided and DISCORD_GUILD_ID environment default is not set. " +
        "Pass guild_id explicitly or configure DISCORD_GUILD_ID.",
    );
  }
  return resolved;
}

/**
 * Build a fully configured MCP server instance with all Discord tools
 * registered. A fresh instance is created per stdio process and per HTTP
 * session.
 */
export function createServer(): McpServer {
  const server = new McpServer({ name: "discord-mcp", version: "0.1.0" });

  /**
   * Register a tool with uniform result formatting and error handling. The
   * handler returns any JSON-serialisable value (or a string); it is wrapped
   * into MCP text content, and thrown errors become an isError result.
   */
  type ToolConfig = { title: string; description: string; inputSchema: z.ZodRawShape };

  function tool<S extends z.ZodRawShape>(
    name: string,
    config: { title: string; description: string; inputSchema: S },
    handler: (args: z.objectOutputType<S, z.ZodTypeAny>) => Promise<unknown>,
  ): void {
    server.registerTool(name, config as ToolConfig, async (args: unknown) => {
      try {
        const result = await handler(args as z.objectOutputType<S, z.ZodTypeAny>);
        const text =
          typeof result === "string"
            ? result
            : result === undefined || result === null
              ? "OK"
              : JSON.stringify(result, null, 2);
        return { content: [{ type: "text" as const, text }] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
      }
    });
  }

  // -------------------------------------------------------------------------
  // Guilds
  // -------------------------------------------------------------------------

  tool(
    "discord_list_guilds",
    {
      title: "List guilds",
      description: "List the guilds (servers) the bot is a member of.",
      inputSchema: {},
    },
    () => discord("GET", "/users/@me/guilds"),
  );

  tool(
    "discord_get_guild",
    {
      title: "Get guild",
      description:
        "Get details about a guild (server). Defaults to DISCORD_GUILD_ID if guild_id is omitted.",
      inputSchema: { guild_id: optionalSnowflake("guild_id") },
    },
    ({ guild_id }) => discord("GET", `/guilds/${resolveGuild(guild_id)}`),
  );

  // -------------------------------------------------------------------------
  // Channels
  // -------------------------------------------------------------------------

  tool(
    "discord_list_channels",
    {
      title: "List channels",
      description:
        "List all channels in a guild. Defaults to DISCORD_GUILD_ID if guild_id is omitted.",
      inputSchema: { guild_id: optionalSnowflake("guild_id") },
    },
    ({ guild_id }) => discord("GET", `/guilds/${resolveGuild(guild_id)}/channels`),
  );

  tool(
    "discord_get_channel",
    {
      title: "Get channel",
      description: "Get a single channel's properties by its ID.",
      inputSchema: { channel_id: snowflake("channel_id") },
    },
    ({ channel_id }) => discord("GET", `/channels/${channel_id}`),
  );

  tool(
    "discord_create_channel",
    {
      title: "Create channel",
      description:
        "Create a channel in a guild. type: 0=text, 2=voice, 4=category, 5=announcement, 13=stage, 15=forum.",
      inputSchema: {
        guild_id: optionalSnowflake("guild_id"),
        name: z.string().min(1).max(100),
        type: z.number().int().optional(),
        topic: z.string().max(1024).optional(),
        parent_id: snowflake("parent_id").optional(),
        nsfw: z.boolean().optional(),
        position: z.number().int().optional(),
        user_limit: z.number().int().min(0).max(99).optional(),
        bitrate: z.number().int().optional(),
      },
    },
    ({ guild_id, ...body }) => discord("POST", `/guilds/${resolveGuild(guild_id)}/channels`, body),
  );

  tool(
    "discord_update_channel",
    {
      title: "Update channel",
      description:
        "Modify a channel's properties. Only the fields you provide are changed. Pass an empty string for parent_id to remove the channel from its category.",
      inputSchema: {
        channel_id: snowflake("channel_id"),
        name: z.string().min(1).max(100).optional(),
        topic: z.string().max(1024).optional(),
        position: z.number().int().optional(),
        parent_id: z.string().optional(),
        nsfw: z.boolean().optional(),
        user_limit: z.number().int().min(0).max(99).optional(),
        bitrate: z.number().int().optional(),
      },
    },
    ({ channel_id, parent_id, ...rest }) => {
      const body: Record<string, unknown> = { ...rest };
      if (parent_id !== undefined) body.parent_id = parent_id === "" ? null : parent_id;
      return discord("PATCH", `/channels/${channel_id}`, body);
    },
  );

  tool(
    "discord_delete_channel",
    {
      title: "Delete channel",
      description: "Permanently delete a channel. This cannot be undone.",
      inputSchema: { channel_id: snowflake("channel_id") },
    },
    ({ channel_id }) => discord("DELETE", `/channels/${channel_id}`),
  );

  // -------------------------------------------------------------------------
  // Messages
  // -------------------------------------------------------------------------

  tool(
    "discord_list_messages",
    {
      title: "List messages",
      description: "List recent messages in a channel (newest first).",
      inputSchema: {
        channel_id: snowflake("channel_id"),
        limit: z.number().int().min(1).max(100).optional(),
      },
    },
    ({ channel_id, limit }) =>
      discord("GET", `/channels/${channel_id}/messages${limit ? `?limit=${limit}` : ""}`),
  );

  tool(
    "discord_get_message",
    {
      title: "Get message",
      description: "Get a single message by channel and message ID.",
      inputSchema: { channel_id: snowflake("channel_id"), message_id: snowflake("message_id") },
    },
    ({ channel_id, message_id }) => discord("GET", `/channels/${channel_id}/messages/${message_id}`),
  );

  tool(
    "discord_send_message",
    {
      title: "Send message",
      description: "Send a text message to a channel.",
      inputSchema: {
        channel_id: snowflake("channel_id"),
        content: z.string().min(1).max(2000),
      },
    },
    ({ channel_id, content }) => discord("POST", `/channels/${channel_id}/messages`, { content }),
  );

  tool(
    "discord_edit_message",
    {
      title: "Edit message",
      description: "Edit the text content of a message the bot previously sent.",
      inputSchema: {
        channel_id: snowflake("channel_id"),
        message_id: snowflake("message_id"),
        content: z.string().min(1).max(2000),
      },
    },
    ({ channel_id, message_id, content }) =>
      discord("PATCH", `/channels/${channel_id}/messages/${message_id}`, { content }),
  );

  tool(
    "discord_delete_message",
    {
      title: "Delete message",
      description: "Delete a message by channel and message ID.",
      inputSchema: { channel_id: snowflake("channel_id"), message_id: snowflake("message_id") },
    },
    ({ channel_id, message_id }) =>
      discord("DELETE", `/channels/${channel_id}/messages/${message_id}`),
  );

  // -------------------------------------------------------------------------
  // Roles
  // -------------------------------------------------------------------------

  tool(
    "discord_list_roles",
    {
      title: "List roles",
      description: "List all roles in a guild. Defaults to DISCORD_GUILD_ID if guild_id is omitted.",
      inputSchema: { guild_id: optionalSnowflake("guild_id") },
    },
    ({ guild_id }) => discord("GET", `/guilds/${resolveGuild(guild_id)}/roles`),
  );

  tool(
    "discord_create_role",
    {
      title: "Create role",
      description:
        "Create a role in a guild. permissions is a bitwise permission string; color is an integer RGB value.",
      inputSchema: {
        guild_id: optionalSnowflake("guild_id"),
        name: z.string().min(1).max(100),
        permissions: z.string().optional(),
        color: z.number().int().optional(),
        hoist: z.boolean().optional(),
        mentionable: z.boolean().optional(),
      },
    },
    ({ guild_id, ...body }) => discord("POST", `/guilds/${resolveGuild(guild_id)}/roles`, body),
  );

  tool(
    "discord_update_role",
    {
      title: "Update role",
      description: "Modify a role's properties. Only the fields you provide are changed.",
      inputSchema: {
        guild_id: optionalSnowflake("guild_id"),
        role_id: snowflake("role_id"),
        name: z.string().min(1).max(100).optional(),
        permissions: z.string().optional(),
        color: z.number().int().optional(),
        hoist: z.boolean().optional(),
        mentionable: z.boolean().optional(),
      },
    },
    ({ guild_id, role_id, ...body }) =>
      discord("PATCH", `/guilds/${resolveGuild(guild_id)}/roles/${role_id}`, body),
  );

  tool(
    "discord_delete_role",
    {
      title: "Delete role",
      description: "Permanently delete a role from a guild.",
      inputSchema: { guild_id: optionalSnowflake("guild_id"), role_id: snowflake("role_id") },
    },
    ({ guild_id, role_id }) => discord("DELETE", `/guilds/${resolveGuild(guild_id)}/roles/${role_id}`),
  );

  // -------------------------------------------------------------------------
  // Members
  // -------------------------------------------------------------------------

  tool(
    "discord_list_members",
    {
      title: "List members",
      description:
        "List members of a guild. Requires the bot to have the GUILD_MEMBERS privileged intent enabled.",
      inputSchema: {
        guild_id: optionalSnowflake("guild_id"),
        limit: z.number().int().min(1).max(1000).optional(),
      },
    },
    ({ guild_id, limit }) =>
      discord("GET", `/guilds/${resolveGuild(guild_id)}/members${limit ? `?limit=${limit}` : ""}`),
  );

  tool(
    "discord_get_member",
    {
      title: "Get member",
      description: "Get a single guild member by user ID. Defaults to DISCORD_GUILD_ID.",
      inputSchema: { guild_id: optionalSnowflake("guild_id"), user_id: snowflake("user_id") },
    },
    ({ guild_id, user_id }) => discord("GET", `/guilds/${resolveGuild(guild_id)}/members/${user_id}`),
  );

  tool(
    "discord_add_member_role",
    {
      title: "Add role to member",
      description: "Assign a role to a guild member. Defaults to DISCORD_GUILD_ID.",
      inputSchema: {
        guild_id: optionalSnowflake("guild_id"),
        user_id: snowflake("user_id"),
        role_id: snowflake("role_id"),
      },
    },
    ({ guild_id, user_id, role_id }) =>
      discord("PUT", `/guilds/${resolveGuild(guild_id)}/members/${user_id}/roles/${role_id}`),
  );

  tool(
    "discord_remove_member_role",
    {
      title: "Remove role from member",
      description: "Remove a role from a guild member. Defaults to DISCORD_GUILD_ID.",
      inputSchema: {
        guild_id: optionalSnowflake("guild_id"),
        user_id: snowflake("user_id"),
        role_id: snowflake("role_id"),
      },
    },
    ({ guild_id, user_id, role_id }) =>
      discord("DELETE", `/guilds/${resolveGuild(guild_id)}/members/${user_id}/roles/${role_id}`),
  );

  return server;
}
