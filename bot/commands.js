// Slash command definitions + handlers for the YCS bot.
// Each entry has `data` (the command schema Discord registers) and
// `execute(interaction)` (what runs when a member uses it).

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { writeLink, readLink } from "../src/store.js";
import { botConfig } from "./env.js";
import { DAILY_POSTS, tzNow, postDay } from "./daily.js";

const YCS_BLURPLE = 0x5865f2;

// --- /ping ------------------------------------------------------------------
const ping = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check that the bot is alive."),
  async execute(interaction) {
    const latency = Math.round(interaction.client.ws.ping);
    await interaction.reply({
      content: `🏓 Pong! Gateway latency ${latency}ms.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

// --- /blast -----------------------------------------------------------------
const blast = {
  data: new SlashCommandBuilder()
    .setName("blast")
    .setDescription("Send an announcement to a channel.")
    .addStringOption((o) =>
      o.setName("message").setDescription("What to announce").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("title").setDescription("Optional headline (posts as an embed)")
    )
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Where to post (defaults to this channel)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addBooleanOption((o) =>
      o.setName("ping").setDescription("Ping @everyone with the blast")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const message = interaction.options.getString("message", true);
    const title = interaction.options.getString("title");
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    const ping = interaction.options.getBoolean("ping");

    const payload = { allowedMentions: { parse: ping ? ["everyone"] : [] } };
    if (title) {
      payload.embeds = [
        new EmbedBuilder().setTitle(title).setDescription(message).setColor(YCS_BLURPLE),
      ];
      if (ping) payload.content = "@everyone";
    } else {
      payload.content = ping ? `@everyone\n${message}` : message;
    }

    const sent = await channel.send(payload);
    await interaction.reply({
      content: `✅ Blast sent to ${channel} — [jump](${sent.url})`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

// --- /discuss ---------------------------------------------------------------
const discuss = {
  data: new SlashCommandBuilder()
    .setName("discuss")
    .setDescription("Start a discussion thread.")
    .addStringOption((o) =>
      o.setName("topic").setDescription("The thread title").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("message").setDescription("Opening message for the thread")
    )
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Channel to open the thread in (defaults to this one)")
        .addChannelTypes(
          ChannelType.GuildText,
          ChannelType.GuildAnnouncement,
          ChannelType.GuildForum
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.CreatePublicThreads),
  async execute(interaction) {
    const topic = interaction.options.getString("topic", true);
    const message = interaction.options.getString("message");
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;

    let thread;
    if (channel.type === ChannelType.GuildForum) {
      thread = await channel.threads.create({
        name: topic,
        message: { content: message || topic },
      });
    } else {
      thread = await channel.threads.create({
        name: topic,
        autoArchiveDuration: 1440,
      });
      if (message) await thread.send(message);
    }
    await interaction.reply({
      content: `✅ Discussion started: ${thread}`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

// --- /invite ----------------------------------------------------------------
const invite = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Create or refresh the server invite link.")
    .addChannelOption((o) =>
      o
        .setName("channel")
        .setDescription("Channel the invite lands in (defaults to this one)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addIntegerOption((o) =>
      o
        .setName("max_age")
        .setDescription("Seconds until it expires (0 = never)")
        .setMinValue(0)
    )
    .addIntegerOption((o) =>
      o
        .setName("max_uses")
        .setDescription("Max uses (0 = unlimited)")
        .setMinValue(0)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite),
  async execute(interaction) {
    const channel =
      interaction.options.getChannel("channel") || interaction.channel;
    const maxAge = interaction.options.getInteger("max_age") ?? 0;
    const maxUses = interaction.options.getInteger("max_uses") ?? 0;

    const inv = await channel.createInvite({
      maxAge,
      maxUses,
      unique: true,
      reason: `Requested by ${interaction.user.tag} via /invite`,
    });
    const url = `https://discord.gg/${inv.code}`;
    writeLink({
      url,
      code: inv.code,
      channelId: channel.id,
      maxAge,
      maxUses,
      createdAt: new Date().toISOString(),
      createdBy: interaction.user.tag,
    });
    await interaction.reply(
      `🔗 Invite ${maxAge === 0 ? "(never expires)" : `(expires in ${maxAge}s)`}: ${url}`
    );
  },
};

// --- /link ------------------------------------------------------------------
const link = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Show the current server invite link."),
  async execute(interaction) {
    const record = readLink();
    if (!record?.url) {
      await interaction.reply({
        content: "No invite stored yet. An admin can run `/invite` to create one.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply(`🔗 Current invite: ${record.url}`);
  },
};

// --- /qotd ------------------------------------------------------------------
// Posts today's scheduled question of the day right now (for catching up on a
// day the timer already passed, or just posting on demand).
const qotd = {
  data: new SlashCommandBuilder()
    .setName("qotd")
    .setDescription("Post today's question of the day now.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const cfg = botConfig();
    const { weekday } = tzNow(cfg.dailyTz);
    if (!DAILY_POSTS[weekday]) {
      await interaction.reply({
        content: `nothing scheduled for ${weekday} yet (weekends are off for now).`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const channelId = cfg.dailyChannelId || cfg.channelId;
    const sent = await postDay(interaction.client, channelId, weekday);
    await interaction.reply({
      content: `posted today's qotd 🍒 — [jump](${sent.url})`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export const commands = [ping, blast, discuss, invite, link, qotd];
export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
