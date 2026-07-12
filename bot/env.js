// Bot configuration, loaded from the same gitignored .env as the CLI.

import { loadEnv } from "../src/client.js";

export function botConfig() {
  loadEnv();
  return {
    token: process.env.DISCORD_BOT_TOKEN || "",
    clientId: process.env.DISCORD_CLIENT_ID || "", // application ID
    guildId: process.env.DISCORD_GUILD_ID || "",
    channelId: process.env.DISCORD_CHANNEL_ID || "", // default target channel
    welcomeChannelId: process.env.DISCORD_WELCOME_CHANNEL_ID || "",
    welcomeMessage:
      process.env.DISCORD_WELCOME_MESSAGE ||
      "Welcome to YCS, {user} 🎬 Glad you're here — introduce yourself!",
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
