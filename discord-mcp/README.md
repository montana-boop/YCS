# discord-mcp

An [MCP](https://modelcontextprotocol.io) server that exposes Discord's REST API
v10 as tools, so an MCP client (Claude Code, Claude Desktop, etc.) can manage a
Discord server directly. It pairs with the `discord-manage-channel` skill in
this repo — the skill documents the workflow, this connector provides the tools.

## Capabilities

20 tools over the Discord REST API v10:

| Area | Tools |
|------|-------|
| Guilds | `discord_list_guilds`, `discord_get_guild` |
| Channels | `discord_list_channels`, `discord_get_channel`, `discord_create_channel`, `discord_update_channel`, `discord_delete_channel` |
| Messages | `discord_list_messages`, `discord_get_message`, `discord_send_message`, `discord_edit_message`, `discord_delete_message` |
| Roles | `discord_list_roles`, `discord_create_role`, `discord_update_role`, `discord_delete_role` |
| Members | `discord_list_members`, `discord_get_member`, `discord_add_member_role`, `discord_remove_member_role` |

## Prerequisites

1. A **Discord application + bot** — create one at
   <https://discord.com/developers/applications>.
2. The **bot token** (Bot → Reset Token). This is the `DISCORD_BOT_TOKEN`.
3. The bot must be **invited to your server** with appropriate permissions
   (e.g. *Manage Channels*, *Manage Roles*, *Send Messages*, *Read Message
   History*). Use the OAuth2 URL Generator with the `bot` scope.
4. To use `discord_list_members`, enable the **Server Members Intent**
   (privileged) under Bot → Privileged Gateway Intents.

Node.js 18+ is required (the server uses the built-in `fetch`).

## Build

```bash
cd discord-mcp
npm install
npm run build
```

This produces `dist/index.js`, the executable server entry point.

## Register with Claude Code

Point Claude Code at the built server and pass the token via the environment.
Either add it from the CLI:

```bash
claude mcp add discord \
  --env DISCORD_BOT_TOKEN=your-bot-token-here \
  -- node /absolute/path/to/discord-mcp/dist/index.js
```

…or copy the provided example into a project-scoped config:

```bash
cp discord-mcp/.mcp.json.example .mcp.json   # at the repo root
export DISCORD_BOT_TOKEN=your-bot-token-here # or set it in your environment
```

`.mcp.json.example` uses `${DISCORD_BOT_TOKEN}`, which Claude Code expands from
your environment at launch, so the token never lives in the committed file.

## Notes

- **Transport:** stdio. `stdout` carries the JSON-RPC stream; logs go to `stderr`.
- **Auth:** the token is read from `DISCORD_BOT_TOKEN` on each request and never
  logged.
- **Destructive tools:** `discord_delete_channel`, `discord_delete_role`, and
  `discord_delete_message` are permanent. Your MCP client's permission prompts
  are the confirmation gate.
- **Rate limits:** Discord enforces per-route rate limits. Errors from the API
  (including `429`) are surfaced verbatim to the client.
