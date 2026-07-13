// Command implementations for the YCS Discord toolkit.

import { api, webhookPost, config } from "./client.js";
import { readLink, writeLink, publishToFile, LINK_FILE } from "./store.js";

// Sanity check: confirm the bot token works and report who the bot is.
export async function whoami() {
  const cfg = config();
  const me = await api("GET", "/users/@me", { cfg });
  return {
    id: me.id,
    username: me.username,
    tag: me.discriminator && me.discriminator !== "0"
      ? `${me.username}#${me.discriminator}`
      : me.username,
  };
}

// Send an announcement ("blast") to a channel. Uses the webhook when asked
// (or when no bot token is configured), otherwise posts as the bot.
export async function blast({ channel, title, message, mention, useWebhook } = {}) {
  const cfg = config();
  if (!message) throw new Error("blast requires --message (the text to send).");

  const contentPrefix = mention ? `${mention}\n` : "";
  const embeds = title
    ? [{ title, description: message, color: 0x5865f2 }]
    : undefined;
  const plainContent = title ? contentPrefix.trim() : `${contentPrefix}${message}`;

  const viaWebhook = useWebhook || (!cfg.token && cfg.webhookUrl);
  if (viaWebhook) {
    if (!cfg.webhookUrl) throw new Error("No DISCORD_WEBHOOK_URL set for webhook posting.");
    const sent = await webhookPost(cfg.webhookUrl, {
      username: cfg.webhookName,
      content: plainContent || undefined,
      embeds,
      allowed_mentions: { parse: ["everyone", "roles", "users"] },
    });
    return { via: "webhook", channelId: sent.channel_id, messageId: sent.id };
  }

  const channelId = channel || cfg.channelId;
  if (!channelId) {
    throw new Error("No channel given. Pass --channel <id> or set DISCORD_CHANNEL_ID.");
  }
  const sent = await api("POST", `/channels/${channelId}/messages`, {
    cfg,
    body: {
      content: plainContent || undefined,
      embeds,
      allowed_mentions: { parse: ["everyone", "roles", "users"] },
    },
  });
  return { via: "bot", channelId, messageId: sent.id };
}

// Start a discussion. In a normal text channel this creates a public thread
// and drops a starter message in it. In a forum channel (--forum) it opens a
// new forum post. Requires the bot (webhooks can't create threads).
export async function discuss({ channel, name, message, forum } = {}) {
  const cfg = config();
  if (!name) throw new Error("discuss requires --name (the discussion title).");
  const channelId = channel || cfg.channelId;
  if (!channelId) {
    throw new Error("No channel given. Pass --channel <id> or set DISCORD_CHANNEL_ID.");
  }

  if (forum) {
    // Forum channels require the starter message inline.
    const post = await api("POST", `/channels/${channelId}/threads`, {
      cfg,
      body: {
        name,
        auto_archive_duration: 1440,
        message: { content: message || name },
      },
    });
    return { via: "bot", type: "forum-post", threadId: post.id, name };
  }

  // Text channel: create a public thread, then post the opener.
  const thread = await api("POST", `/channels/${channelId}/threads`, {
    cfg,
    body: { name, type: 11, auto_archive_duration: 1440 },
  });
  let starterId = null;
  if (message) {
    const starter = await api("POST", `/channels/${thread.id}/messages`, {
      cfg,
      body: { content: message },
    });
    starterId = starter.id;
  }
  return { via: "bot", type: "thread", threadId: thread.id, starterId, name };
}

// Create / refresh a permanent invite link for a channel, persist it, and
// optionally publish it into README.md (or another file).
export async function invite({ channel, maxAge = 0, maxUses = 0, publish } = {}) {
  const cfg = config();
  const channelId = channel || cfg.channelId;
  if (!channelId) {
    throw new Error(
      "No channel given. Pass --channel <id> or set DISCORD_CHANNEL_ID (invites are anchored to a channel)."
    );
  }
  const created = await api("POST", `/channels/${channelId}/invites`, {
    cfg,
    body: {
      max_age: Number(maxAge), // 0 = never expires
      max_uses: Number(maxUses), // 0 = unlimited
      unique: true,
    },
  });
  const url = `https://discord.gg/${created.code}`;
  const record = {
    url,
    code: created.code,
    channelId,
    maxAge: Number(maxAge),
    maxUses: Number(maxUses),
    createdAt: new Date().toISOString(),
  };
  writeLink(record);

  const published = [];
  if (publish) {
    const targets = Array.isArray(publish) ? publish : [publish];
    for (const t of targets) published.push(publishToFile(t, url));
  }
  return { ...record, storedAt: LINK_FILE, published };
}

// Show the current stored invite link.
export function link() {
  const record = readLink();
  if (!record) {
    return { url: null, message: "No invite stored yet. Run `npm run invite` to create one." };
  }
  return record;
}
