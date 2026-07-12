#!/usr/bin/env node
// The always-on YCS Discord bot. Connects to the gateway, handles slash
// commands, and welcomes new members.
//
//   npm start      # after `npm run deploy` has registered the commands

import { Client, GatewayIntentBits, Events, Partials } from "discord.js";
import { commandMap } from "./commands.js";
import { botConfig, requireBotEnv } from "./env.js";

const cfg = botConfig();
try {
  requireBotEnv(cfg, ["token"]);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  partials: [Partials.GuildMember],
});

client.once(Events.ClientReady, (c) => {
  console.log(`✅ YCS bot online as ${c.user.tag}`);
  console.log(`   Watching ${c.guilds.cache.size} server(s).`);
  if (!cfg.welcomeChannelId) {
    console.log("   (no DISCORD_WELCOME_CHANNEL_ID set — welcomes are off)");
  }
});

// Slash command dispatch.
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = commandMap.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error in /${interaction.commandName}:`, err);
    const reply = {
      content: `⚠️ Something went wrong: ${err.message}`,
      flags: 64, // ephemeral
    };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

// Welcome new members.
client.on(Events.GuildMemberAdd, async (member) => {
  if (!cfg.welcomeChannelId) return;
  const channel = member.guild.channels.cache.get(cfg.welcomeChannelId);
  if (!channel?.isTextBased?.()) return;
  const text = cfg.welcomeMessage.replaceAll("{user}", `<@${member.id}>`);
  await channel.send({
    content: text,
    allowedMentions: { users: [member.id] },
  }).catch((err) => console.error("Welcome failed:", err.message));
});

// Graceful shutdown.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    console.log(`\nShutting down (${sig})…`);
    client.destroy();
    process.exit(0);
  });
}

client.login(cfg.token).catch((err) => {
  console.error(`❌ Login failed: ${err.message}`);
  console.error("   Check DISCORD_BOT_TOKEN in your .env.");
  process.exit(1);
});
