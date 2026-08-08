// Bot configuration, loaded from the same gitignored .env as the CLI.

import { loadEnv } from "../src/client.js";

export function botConfig() {
  loadEnv();
  return {
    token: process.env.DISCORD_BOT_TOKEN || "",
    clientId: process.env.DISCORD_CLIENT_ID || "", // application ID
    guildId: process.env.DISCORD_GUILD_ID || "",
    channelId: process.env.DISCORD_CHANNEL_ID || "", // default target channel
    // Channel the stable-link invites point at — pinned to #introduce-yourself
    // so new members land right where they introduce themselves.
    inviteChannelId: "1496569287392100636",
    // How often (hours) to mint a fresh invite behind the stable link. 0 = off.
    refreshHours: Number(process.env.DISCORD_INVITE_REFRESH_HOURS || 6),
    port: Number(process.env.PORT || 3000),
    // Daily "question of the day" posts.
    dailyChannelId: process.env.DISCORD_DAILY_CHANNEL_ID || "", // falls back to channelId
    dailyTime: process.env.DISCORD_DAILY_TIME || "09:00", // 24h HH:MM in dailyTz
    dailyTz: process.env.DISCORD_DAILY_TZ || "America/New_York",
    // Prepended... appended to each daily post so members get pinged. "" disables.
    dailyMention:
      process.env.DISCORD_DAILY_MENTION !== undefined
        ? process.env.DISCORD_DAILY_MENTION
        : "@everyone",
    // Pinned to #introduce-yourself so new besties are greeted where they intro.
    welcomeChannelId: "1496569287392100636",
    welcomeMessage:
      process.env.DISCORD_WELCOME_MESSAGE ||
      "welcome to single besties, {user} 💌 you're officially in the group chat — pull up a chair and introduce yourself, bestie ✨",
  };
}

export function requireBotEnv(cfg, keys) {
  const missing = keys.filter((k) => !cfg[k]);
  if (missing.length) {
    throw new Error(
      `Missing required config: ${missing.join(", ")}. Add them to your .env file (see .env.example).`
    );
  }
}
