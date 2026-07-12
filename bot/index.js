#!/usr/bin/env node
// The always-on YCS Discord bot. Connects to the gateway, handles slash
// commands, and welcomes new members.
//
//   npm start      # after `npm run deploy` has registered the commands

import { Client, GatewayIntentBits, Events, Partials, REST, Routes } from "discord.js";
import { commands, commandMap } from "./commands.js";
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

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ YCS bot online as ${c.user.tag}`);
  console.log(`   Watching ${c.guilds.cache.size} server(s).`);
  if (!cfg.welcomeChannelId) {
    console.log("   (no DISCORD_WELCOME_CHANNEL_ID set — welcomes are off)");
  }
  // Auto-register slash commands so hosting is a single step (just `npm start`).
  // Guild-scoped = instant. Set DISCORD_SKIP_AUTODEPLOY=1 to turn this off.
  if (process.env.DISCORD_SKIP_AUTODEPLOY || !cfg.clientId || !cfg.guildId) return;
  try {
    const rest = new REST({ version: "10" }).setToken(cfg.token);
    const body = commands.map((cmd) => cmd.data.toJSON());
    const data = await rest.put(
      Routes.applicationGuildCommands(cfg.clientId, cfg.guildId),
      { body }
    );
    console.log(`   Registered ${data.length} slash command(s): ${data.map((d) => "/" + d.name).join(", ")}`);
  } catch (err) {
    console.error(`   ⚠️ Could not auto-register commands: ${err.message}`);
    console.error("   (You can run `npm run deploy` manually instead.)");
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
