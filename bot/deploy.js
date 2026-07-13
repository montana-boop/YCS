#!/usr/bin/env node
// Registers the bot's slash commands with Discord.
//
// Guild-scoped registration (default) is instant — great for a single server.
// Pass --global to register globally (can take up to an hour to appear).
//
//   npm run deploy            # register to your DISCORD_GUILD_ID (instant)
//   npm run deploy -- --global

import { REST, Routes } from "discord.js";
import { commands } from "./commands.js";
import { botConfig, requireBotEnv } from "./env.js";

async function main() {
  const cfg = botConfig();
  const global = process.argv.includes("--global");
  requireBotEnv(cfg, global ? ["token", "clientId"] : ["token", "clientId", "guildId"]);

  const body = commands.map((c) => c.data.toJSON());
  const rest = new REST({ version: "10" }).setToken(cfg.token);

  const route = global
    ? Routes.applicationCommands(cfg.clientId)
    : Routes.applicationGuildCommands(cfg.clientId, cfg.guildId);

  const data = await rest.put(route, { body });
  console.log(
    `✅ Registered ${data.length} slash command(s) ${
      global ? "globally" : `to guild ${cfg.guildId}`
    }: ${data.map((c) => "/" + c.name).join(", ")}`
  );
}

main().catch((err) => {
  console.error(`❌ ${err.message}`);
  process.exitCode = 1;
});
