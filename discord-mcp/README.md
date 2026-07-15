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

## Target server

This connector is configured for a specific Discord server:

| | ID |
|---|---|
| Guild (server) | `1488629688376234104` |
| Primary channel | `1488629688376234106` |

Set `DISCORD_GUILD_ID=1488629688376234104` and guild-scoped tools
(`discord_list_channels`, `discord_list_roles`, `discord_list_members`, role and
member operations, …) default to this server — you can omit `guild_id` on every
call. Passing an explicit `guild_id` still overrides the default, so the same
build works against other servers too. The `.mcp.json.example` already sets it.

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

## Two ways to run

This connector ships both transports from the same tool definitions:

- **Local (stdio)** — `dist/index.js`. Runs as a child process of the MCP
  client. No network, no URL. Simplest and most private.
- **Remote (HTTP)** — `dist/http.js`. A [Streamable HTTP](https://modelcontextprotocol.io/docs/concepts/transports)
  server you deploy somewhere; clients connect to `https://<host>/mcp` with a
  bearer token. Use this when you want a hosted endpoint multiple clients can share.

## Build

```bash
cd discord-mcp
npm install
npm run build
```

This produces `dist/index.js` (stdio) and `dist/http.js` (remote HTTP).

## Register with Claude Code — local (stdio)

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

## Run as a remote (HTTP) server

The remote entry point (`dist/http.js`) serves MCP over HTTP at `/mcp` and
**requires** two secrets:

| Env var | Purpose |
|---------|---------|
| `DISCORD_BOT_TOKEN` | Discord bot token used for API calls. |
| `MCP_AUTH_TOKEN` | Bearer token every client must present. The server refuses to start without it — an unauthenticated endpoint would let anyone act on your Discord server. |
| `DISCORD_GUILD_ID` | Optional default guild (`1488629688376234104` for this server) so `guild_id` can be omitted on tool calls. |
| `PORT` | Listen port (optional, default `3000`; most hosts inject their own). |

Run it locally:

```bash
DISCORD_BOT_TOKEN=your-bot-token \
MCP_AUTH_TOKEN=$(openssl rand -hex 32) \
npm run start:http
# → discord-mcp remote server listening on http://0.0.0.0:3000/mcp
```

There is also an unauthenticated `GET /health` endpoint for uptime checks.

### Deploy with Docker

A multi-stage `Dockerfile` is included; the image is host-agnostic and runs on
any container platform (Fly.io, Render, Railway, Cloud Run, a VPS, …):

```bash
docker build -t discord-mcp .
docker run -p 3000:3000 \
  -e DISCORD_BOT_TOKEN=your-bot-token \
  -e MCP_AUTH_TOKEN=your-strong-secret \
  discord-mcp
```

Set `DISCORD_BOT_TOKEN` and `MCP_AUTH_TOKEN` as secrets in your host's
dashboard, deploy, and your endpoint is `https://<your-host>/mcp`. **The URL
only exists once you've deployed** — it is whatever hostname your platform
assigns; this repo does not host it for you. Terminate TLS at your platform's
load balancer (don't serve the bearer token over plain HTTP).

### Register the remote server with Claude Code

```bash
claude mcp add --transport http discord https://your-host.example.com/mcp \
  --header "Authorization: Bearer your-MCP_AUTH_TOKEN"
```

…or copy `.mcp.remote.json.example` to `.mcp.json` and set `MCP_AUTH_TOKEN` in
your environment (the example expands `${MCP_AUTH_TOKEN}` at launch, keeping the
secret out of the committed file).

## Notes

- **Transports:** stdio (`dist/index.js`) and Streamable HTTP (`dist/http.js`),
  both built from the same tool definitions in `src/server.ts`. On stdio,
  `stdout` carries the JSON-RPC stream and logs go to `stderr`.
- **Auth:** the token is read from `DISCORD_BOT_TOKEN` on each request and never
  logged.
- **Destructive tools:** `discord_delete_channel`, `discord_delete_role`, and
  `discord_delete_message` are permanent. Your MCP client's permission prompts
  are the confirmation gate.
- **Rate limits:** Discord enforces per-route rate limits. Errors from the API
  (including `429`) are surfaced verbatim to the client.
