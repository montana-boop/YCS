# YCS — Discord bot & control toolkit

Run the YCS Productions Discord two ways:

- **The bot** (`bot/`) — an always-on bot that lives in your server and responds
  to **slash commands** (`/blast`, `/invite`, `/discuss`, `/link`, `/ping`) and
  **auto-welcomes new members**. This is the main event.
- **The CLI** (`src/`) — dependency-free one-off commands you (or a Claude Code
  session) can fire from a terminal without the bot running. Handy for scripts
  and automation.

Both share the same gitignored `.env`.

---

## 1. Create the bot (one time)

1. [Discord Developer Portal](https://discord.com/developers/applications) →
   **New Application** → name it (e.g. "YCS").
2. **General Information** → copy the **Application ID** → this is
   `DISCORD_CLIENT_ID`.
3. **Bot** tab → **Reset Token** → copy it → this is `DISCORD_BOT_TOKEN` (secret!).
4. **Bot** tab → enable **Server Members Intent** (needed for welcomes). Save.
5. **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: **Create Invite**, **Send Messages**,
     **Create Public Threads**, **Send Messages in Threads**,
     **Mention Everyone**, **Manage Server**
   - Open the generated URL and add the bot to the YCS server.
6. Enable **Developer Mode** (User Settings → Advanced) to copy server/channel IDs.

## 2. Configure

Your `.env` already has the YCS server + default channel IDs filled in. Add the
two secrets from above:

```ini
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_CLIENT_ID=your-application-id
DISCORD_GUILD_ID=1488629688376234104     # pre-filled
DISCORD_CHANNEL_ID=1502426896808415354   # pre-filled

# Optional — turn on member welcomes:
DISCORD_WELCOME_CHANNEL_ID=<a channel id>
DISCORD_WELCOME_MESSAGE=Welcome to YCS, {user} 🎬
```

(If you're starting fresh, `cp .env.example .env` first.)

## 3. Register commands, then run the bot

```bash
npm install          # one time (installs discord.js)
npm run deploy       # registers the slash commands to your server (instant)
npm start            # brings the bot online
# ✅ YCS bot online as YCS#1234
```

Leave `npm start` running and the slash commands work in Discord.

### Slash commands (used inside Discord)

| Command | Who can use it | What it does |
|---|---|---|
| `/ping` | anyone | Health check |
| `/link` | anyone | Show the current invite link |
| `/invite [channel] [max_age] [max_uses]` | Create Invite perm | Create/refresh the invite, store it, and post it |
| `/blast <message> [title] [channel] [ping]` | Manage Server perm | Send an announcement (embed if `title`, ping `@everyone` if `ping:true`) |
| `/discuss <topic> [message] [channel]` | Create Threads perm | Open a discussion thread (or a forum post) |

Command visibility is gated by Discord permissions, so regular members only see
`/ping` and `/link`.

## 4. Keeping it always-on (hosting)

`npm start` runs the bot for as long as the process is alive. For 24/7 uptime,
run it on a machine or host that stays up — a small VPS, a Raspberry Pi, or a
free/cheap host like Railway, Fly.io, or Render. Point the host at this repo,
set the same env vars, and use `npm run deploy` once + `npm start` as the start
command.

> Note: this Claude Code container is ephemeral, so the bot won't stay online
> here after the session ends — it's meant to run on your own always-on host.

---

## CLI (no bot process needed)

The same actions are available as one-off terminal commands (dependency-free,
Node 18+). Flags come after npm's `--` separator.

```bash
npm run whoami                                   # verify the token
npm run invite                                   # create/refresh the invite
npm run invite -- --publish README.md            # ...and publish it into a file
npm run link                                     # show the stored invite
npm run blast   -- --message "New drop is live 🎬"
npm run blast   -- --title "YCS Update" --message "Doors Friday" --mention "@everyone"
npm run discuss -- --name "Feedback on the intro" --message "Thoughts?"
```

There's also a **webhook** shortcut for blasts that needs no bot at all: set
`DISCORD_WEBHOOK_URL` in `.env` (Channel Settings → Integrations → Webhooks),
then `npm run blast -- --webhook --message "…"`.

## Where the invite link lives

Both the bot and CLI store the current invite in `data/current-invite.json`, so
`/link` and `npm run link` always report the latest. `npm run invite --publish`
keeps a copy in sync inside a marked block (safe to re-run):

<!-- ycs:invite -->
(no invite published yet — run `npm run invite -- --publish README.md`)
<!-- /ycs:invite -->

## Security

`.env`, `.env.local`, `*.token`, and `node_modules/` are gitignored. Never commit
your bot token. If it leaks, reset it in the Developer Portal (Bot → Reset Token).
