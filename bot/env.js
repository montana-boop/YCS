// Bot configuration, loaded from the same gitignored .env as the CLI.

import { loadEnv } from "../src/client.js";

export function botConfig() {
  loadEnv();
  return {
    token: process.env.DISCORD_BOT_TOKEN || "",
    clientId: process.env.DISCORD_CLIENT_ID || "", // application ID
    guildId: process.env.DISCORD_GUILD_ID || "",
    channelId: process.env.DISCORD_CHANNEL_ID || "", // default target channel
    // Channel the stable-link invites point at. Falls back to channelId.
    // Use a channel every new member can see (e.g. #welcome / rules).
    inviteChannelId: process.env.DISCORD_INVITE_CHANNEL_ID || "",
    // How often (hours) to mint a fresh invite behind the stable link. 0 = off.
    refreshHours: Number(process.env.DISCORD_INVITE_REFRESH_HOURS || 6),
    port: Number(process.env.PORT || 3000),
    welcomeChannelId: process.env.DISCORD_WELCOME_CHANNEL_ID || "",
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
