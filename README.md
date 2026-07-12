# YCS — Discord control toolkit

A tiny, dependency-free toolkit to run the YCS Productions Discord from a
terminal (or from a Claude Code session). It lets you:

- **Refresh the invite link** — create a permanent invite on demand and keep a
  canonical copy on file, optionally auto-published into `README.md` or a site.
- **Send blasts** — post announcements to a channel, as the bot or via a webhook.
- **Start discussions** — open a thread (or a forum post) with a starter message.

No `npm install` needed — it uses Node's built-in `fetch` (Node 18+).

---

## 1. One-time Discord setup

You need a **bot** for invites and discussions. (Blasts alone can use a webhook —
see the shortcut at the bottom.)

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
   → **New Application** → name it (e.g. "YCS Manager").
2. Open the **Bot** tab → **Reset Token** → copy the token. This is your
   `DISCORD_BOT_TOKEN`. Keep it secret.
3. Still on the **Bot** tab, turn on **Message Content Intent** (under
   "Privileged Gateway Intents"). Save.
4. Invite the bot to your server. Open the **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Bot permissions: **Create Invite**, **Send Messages**,
     **Create Public Threads**, **Send Messages in Threads**
     (add **Mention Everyone** if you want blasts to ping `@everyone`).
   - Copy the generated URL, open it, and add the bot to the YCS server.
5. Enable **Developer Mode** in Discord (User Settings → Advanced) so you can
   right-click to **Copy Server ID** / **Copy Channel ID**.

## 2. Configure

Copy the example and fill in your token:

```bash
cp .env.example .env   # if .env doesn't already exist
```

Then edit `.env`:

```ini
DISCORD_BOT_TOKEN=your-bot-token-here
DISCORD_GUILD_ID=1488629688376234104     # YCS server (pre-filled)
DISCORD_CHANNEL_ID=1502426896808415354   # default channel (pre-filled)
```

> Tip: a channel URL `discord.com/channels/<server-id>/<channel-id>` gives you
> both IDs directly.

Verify it works:

```bash
npm run whoami
# ✅ Bot connected as YCS Manager (id ...)
```

## 3. Everyday commands

Flags come after npm's `--` separator.

**Refresh / create the invite link** (never expires by default):

```bash
npm run invite
# ✅ Invite ready: https://discord.gg/abc123

# Also publish it into README.md between the ycs:invite markers:
npm run invite -- --publish README.md

# A time-limited, single-use invite:
npm run invite -- --max-age 86400 --max-uses 1
```

Show the current stored link anytime:

```bash
npm run link
```

**Send a blast:**

```bash
npm run blast -- --message "New drop is live 🎬"

# With a title (posts as an embed) and an @everyone ping:
npm run blast -- --title "YCS Update" --message "Doors open Friday" --mention "@everyone"

# To a specific channel:
npm run blast -- --channel 1502426896808415354 --message "Backstage only 👀"
```

**Start a discussion:**

```bash
# Public thread in a text channel, with an opening message:
npm run discuss -- --name "Feedback on the new intro" --message "What do you all think?"

# A post in a forum channel:
npm run discuss -- --forum --channel <forum-channel-id> --name "Weekly check-in" --message "Drop your wins 👇"
```

## Where the invite link lives

The current invite is stored in `data/current-invite.json` so `link` can report
it and `--publish` can keep other files in sync. Publishing replaces the URL
inside a marked block so it's safe to re-run:

<!-- ycs:invite -->
(no invite published yet — run `npm run invite -- --publish README.md`)
<!-- /ycs:invite -->

## Webhook shortcut (blasts without a bot)

If you only want to post announcements and don't want to set up a bot: in
Discord, open **Channel Settings → Integrations → Webhooks → New Webhook**,
copy the URL into `DISCORD_WEBHOOK_URL` in `.env`, then:

```bash
npm run blast -- --webhook --message "Quick heads up 📣"
```

Webhooks can post messages but **cannot** create invite links or start threads —
those need the bot.

## Security

`.env`, `.env.local`, and `*.token` are gitignored. Never commit your bot token.
If it leaks, reset it in the Developer Portal (Bot → Reset Token).
