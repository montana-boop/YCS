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
import { writeLink, readLink, setBirthday } from "../src/store.js";
import { botConfig } from "./env.js";
import { todaysMessage, postDay } from "./daily.js";
import { ensureRoles, buildMenus } from "./roles.js";
import { nextJournalClub, ensureJournalEvent, dayLabel } from "./events.js";
import { birthdayLabel } from "./birthday.js";
import { todaysPrompt, postPrompt } from "./journal.js";

// Days in each month (index 0 = Jan); February allows 29 for leap-year babies.
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

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
    if (!todaysMessage(cfg.dailyTz)) {
      await interaction.reply({
        content: `nothing scheduled for today.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const channelId = cfg.dailyChannelId || cfg.channelId;
    const sent = await postDay(interaction.client, channelId, cfg.dailyTz, cfg.dailyMention);
    await interaction.reply({
      content: `posted today's qotd 🍒 — [jump](${sent.url})`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

// --- /setup-roles -----------------------------------------------------------
// Creates any missing self-assign roles and posts the role menu in this channel.
const setupRoles = {
  data: new SlashCommandBuilder()
    .setName("setup-roles")
    .setDescription("Post the self-assign role menu in this channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({
      content: "refreshing roles + the menu… 🍒",
      flags: MessageFlags.Ephemeral,
    });
    await ensureRoles(interaction.guild);
    // Remove any previous role-menu messages the bot posted here, so re-running
    // refreshes the picker in place instead of leaving a duplicate.
    try {
      const recent = await interaction.channel.messages.fetch({ limit: 50 });
      const mine = recent.filter(
        (m) =>
          m.author.id === interaction.client.user.id &&
          ((m.components?.length ?? 0) > 0 ||
            m.embeds?.some((e) => e.title?.toLowerCase().includes("get your roles")))
      );
      for (const m of mine.values()) await m.delete().catch(() => {});
    } catch {
      /* ignore — worst case a stale menu remains */
    }
    for (const message of buildMenus()) {
      await interaction.channel.send(message);
    }
    await interaction.editReply("✅ menu refreshed — old picker removed, updated one posted.");
  },
};

// --- /launch-polls ----------------------------------------------------------
// Posts the hangout + game-night community polls in the current channel.
// Uses native Discord polls; falls back to an emoji-reaction poll if needed.
async function postPoll(channel, question, options) {
  try {
    await channel.send({
      poll: {
        question: { text: question },
        answers: options.map((text) => ({ text })),
        allowMultiselect: false,
        duration: 72, // hours (3 days)
      },
    });
  } catch {
    const nums = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣"];
    const body =
      `${question}\n\n` +
      options.map((o, i) => `${nums[i]} ${o}`).join("\n") +
      `\n\n(react to vote 🍒)`;
    const msg = await channel.send({ content: body, allowedMentions: { parse: [] } });
    for (let i = 0; i < options.length; i++) await msg.react(nums[i]);
  }
}

const launchPolls = {
  data: new SlashCommandBuilder()
    .setName("launch-polls")
    .setDescription("Post the hangout + game-night polls in this channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({ content: "posting the polls… 🍒", flags: MessageFlags.Ephemeral });
    await postPoll(
      interaction.channel,
      "🫶 when should our weekly hangout be? (starts next week!)",
      ["thursday 6pm ET", "friday 7pm ET", "saturday 3pm ET", "sunday 4pm ET"]
    );
    await postPoll(
      interaction.channel,
      "🎮 virtual game night — how often should we do it?",
      ["once a week", "every other week", "once a month"]
    );
    await interaction.editReply("✅ both polls are up — besties can vote now 🍒");
  },
};

// --- /journal-club ----------------------------------------------------------
// Hypes this week's journal club: posts a short generic announcement for the
// next session (no host names), a who's-coming poll, and makes sure the
// calendar event exists. The weekly event itself is kept scheduled
// automatically by startEventScheduler, so this is just the "pull up" post.
const journalClub = {
  data: new SlashCommandBuilder()
    .setName("journal-club")
    .setDescription("Post the journal club announcement + poll for this week's session.")
    .addBooleanOption((o) =>
      o.setName("ping_everyone").setDescription("Ping @everyone instead of just @journal club (default off)")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    await interaction.reply({ content: "setting up journal club… 🍒📓", flags: MessageFlags.Ephemeral });
    const cfg = botConfig();
    const pingEveryone = interaction.options.getBoolean("ping_everyone") ?? false;
    const start = nextJournalClub(cfg);
    if (!start) {
      await interaction.editReply("couldn't work out the next journal club date 🤔");
      return;
    }
    const when = dayLabel(start, cfg.dailyTz); // e.g. "saturday, september 12"
    const [h, mi] = cfg.journalClubTime.split(":").map(Number);
    const clock = `${((h + 11) % 12) + 1}${mi ? ":" + String(mi).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"} ET`;
    const voice = interaction.guild.channels.cache.find(
      (c) => c.type === ChannelType.GuildVoice && c.name.toLowerCase().includes("journal club")
    );
    const room = voice ? `<#${voice.id}>` : "the Journal Club voice room";

    const channel =
      interaction.guild.channels.cache.find(
        (c) => c.name === cfg.eventsChannelName && c.isTextBased?.()
      ) || interaction.channel;
    const status = [];

    // 1) Announcement (generic — no names, date fills in each week).
    try {
      const role = interaction.guild.roles.cache.find((r) => r.name === "journal club");
      const suffix = pingEveryone ? "@everyone" : role ? `<@&${role.id}>` : "";
      const parse = pingEveryone ? ["everyone"] : role ? ["roles"] : [];
      const body =
        `journal club is this saturday 🍒📓\n\n` +
        `**${when} · ${clock} · ${room}**\n\n` +
        `bring your journal, your coffee, and whatever's on your mind. we'll write together, share if you feel like it, and keep it low-pressure as always.\n\n` +
        `vote below so we know who's pulling up 🤍`;
      await channel.send({
        content: suffix ? `${body}\n\n${suffix}` : body,
        allowedMentions: { parse },
      });
      status.push("✅ announcement posted");
    } catch (err) {
      status.push(`⚠️ announcement failed: ${err.message}`);
    }

    // 2) Poll.
    try {
      await postPoll(channel, "📓 journal club saturday — you in?", [
        "yes, i'm in 🙌",
        "can't this week 🥲",
        "maybe, tell me more 👀",
      ]);
      status.push("✅ poll up");
    } catch (err) {
      status.push(`⚠️ poll failed: ${err.message}`);
    }

    // 3) Calendar event (best-effort; normally already there).
    try {
      const ev = await ensureJournalEvent(interaction.guild, cfg);
      status.push(ev ? `✅ event on the calendar ([view](${ev.url}))` : "⚠️ no upcoming date found for the event");
    } catch (err) {
      status.push(`⚠️ event couldn't be created (${err.message}) — the announcement still posted`);
    }

    await interaction.editReply(`journal club in ${channel}:\n` + status.map((s) => `• ${s}`).join("\n"));
  },
};

// --- /journal-prompt --------------------------------------------------------
// Posts today's journal prompt right now (the daily timer posts it at 11am ET).
const journalPrompt = {
  data: new SlashCommandBuilder()
    .setName("journal-prompt")
    .setDescription("Post today's journal prompt now.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const cfg = botConfig();
    if (!todaysPrompt(cfg.dailyTz)) {
      await interaction.reply({ content: "no journal prompt scheduled for today.", flags: MessageFlags.Ephemeral });
      return;
    }
    const sent = await postPrompt(interaction.client, cfg);
    await interaction.reply({
      content: `posted today's journal prompt ✍️ — [jump](${sent.url})`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

// --- /birthday --------------------------------------------------------------
// Members save their birthday (month + day, no year). The birthday scheduler
// celebrates them on the day and grants a temporary 🎂 role.
const birthday = {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Save your birthday so we can celebrate you 🎂 (month + day, no year)")
    .addIntegerOption((o) =>
      o.setName("month").setDescription("month (1–12)").setRequired(true).setMinValue(1).setMaxValue(12)
    )
    .addIntegerOption((o) =>
      o.setName("day").setDescription("day (1–31)").setRequired(true).setMinValue(1).setMaxValue(31)
    ),
  async execute(interaction) {
    const month = interaction.options.getInteger("month", true);
    const day = interaction.options.getInteger("day", true);
    if (day > DAYS_IN_MONTH[month - 1]) {
      await interaction.reply({
        content: `hmm, that month doesn't have ${day} days 🤔 double-check and try again?`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    setBirthday(interaction.user.id, month, day);
    await interaction.reply({
      content: `saved! 🎂 we'll celebrate you on **${birthdayLabel(month, day)}** 🥳🍒`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export const commands = [ping, blast, discuss, invite, link, qotd, setupRoles, launchPolls, journalClub, journalPrompt, birthday];
export const commandMap = new Map(commands.map((c) => [c.data.name, c]));
