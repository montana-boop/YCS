// Keeps a single, always-valid Discord invite alive behind the stable link.
// Mints a fresh invite on startup and on a timer; each new one supersedes the
// previous auto-created invite (the old one is deleted to avoid clutter).
// The current invite is written to the shared store, which the redirect server
// and the /link command both read.

import { writeLink } from "../src/store.js";

export function startAutoRefresh(client, cfg) {
  const channelId = cfg.inviteChannelId || cfg.channelId;
  if (!channelId) {
    console.error(
      "   ⚠️ No invite channel set (DISCORD_INVITE_CHANNEL_ID or DISCORD_CHANNEL_ID) — stable link disabled."
    );
    return;
  }

  let previous = null; // the discord.js Invite object we last created

  const mint = async (label) => {
    try {
      const channel = await client.channels.fetch(channelId);
      const inv = await channel.createInvite({
        maxAge: 0, // never expires
        maxUses: 0, // unlimited
        unique: true,
        reason: "Stable Discord link — auto-refresh",
      });
      writeLink({
        url: `https://discord.gg/${inv.code}`,
        code: inv.code,
        channelId,
        maxAge: 0,
        maxUses: 0,
        createdAt: new Date().toISOString(),
        source: "auto-refresh",
      });
      console.log(`   🔁 ${label}: stable link now points to discord.gg/${inv.code}`);
      // Clean up the invite we replaced (ignore any failure — harmless if it lingers).
      if (previous && previous.code !== inv.code) {
        previous.delete("Superseded by fresh auto-refresh link").catch(() => {});
      }
      previous = inv;
    } catch (err) {
      console.error(`   ⚠️ Invite refresh failed: ${err.message}`);
    }
  };

  mint("startup");
  if (cfg.refreshHours > 0) {
    setInterval(() => mint("scheduled refresh"), cfg.refreshHours * 3600 * 1000);
    console.log(`   ⏱️  Auto-refreshing the invite every ${cfg.refreshHours}h.`);
  }
}
