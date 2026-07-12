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

## 3. Run the bot

```bash
npm install          # one time (installs discord.js)
npm start            # brings the bot online AND registers the slash commands
# ✅ YCS bot online as YCS#1234
#    Registered 5 slash command(s): /ping, /blast, /discuss, /invite, /link
```

`npm start` auto-registers the slash commands on startup, so that's the only
command you need. (Prefer to register separately? Run `npm run deploy` and set
`DISCORD_SKIP_AUTODEPLOY=1`.) Leave `npm start` running and the commands work
in Discord.

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

`npm start` runs the bot only while that process is alive, so for 24/7 uptime it
needs a host that stays on. Two common paths:

**A cloud host (recommended — no computer to keep on).** Railway, Render, and
Fly.io can run this repo directly:

1. Push this repo to GitHub (already done via the PR branch).
2. Create a new project on the host and point it at the repo.
3. Set the service type to a **worker/background** process (not a web server) —
   the included `Procfile` (`worker: npm start`) declares this.
4. In the host's dashboard, add the environment variables from your `.env`
   (`DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`,
   `DISCORD_CHANNEL_ID`, and any welcome vars). **Don't commit `.env`** — paste
   the values into the host instead.
5. Deploy. The bot starts, registers its commands, and stays online.

**Your own computer (quickest to try).** Install [Node.js](https://nodejs.org)
(18+), then in this folder run `npm install` once and `npm start`. The bot is
online while the terminal stays open — close it and the bot goes offline.

> Note: the Claude Code web container is ephemeral **and** its network blocks
> `discord.com`, so the bot can't run or be tested from inside a web session —
> it's meant to run on one of the hosts above.

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
