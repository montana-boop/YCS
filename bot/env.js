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
    // Daily Wordle nudge in #daily-games.
    gamesChannelName: process.env.DISCORD_GAMES_CHANNEL || "daily-games",
    gamesTime: process.env.DISCORD_GAMES_TIME || "09:30",
    // Community events (times in dailyTz).
    eventsChannelName: process.env.DISCORD_EVENTS_CHANNEL || "events-chat",
    // Coworking reminder times — a few across the day to catch different time
    // zones. Comma-separated "HH:MM" (24h, Eastern). The voice room is always open.
    coworkingTimes: (process.env.DISCORD_COWORKING_TIMES || "08:00,13:00,20:00")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    // Birthday bot: daily time to check for + celebrate birthdays, and the
    // channel (by name) to celebrate in — falls back to the main chat if missing.
    birthdayTime: process.env.DISCORD_BIRTHDAY_TIME || "09:00",
    birthdayChannelName: process.env.DISCORD_BIRTHDAY_CHANNEL || "birthdays",
    // Journal prompt of the day: daily time + channel (matched by name, so the
    // emoji/prefix in the real channel name doesn't matter).
    journalTime: process.env.DISCORD_JOURNAL_TIME || "11:00",
    journalChannelName: process.env.DISCORD_JOURNAL_CHANNEL || "journal-and-writing-besties",
    // Weekly Journal Club event (short weekday name + HH:MM in dailyTz).
    journalClubWeekday: process.env.DISCORD_JOURNAL_CLUB_DAY || "Sat",
    journalClubTime: process.env.DISCORD_JOURNAL_CLUB_TIME || "10:00",
    // Cosy Girl October challenge: day 1 posts at the kickoff time, every later
    // day at the regular time; channel matched by name. All posts ping @everyone.
    octoberKickoffTime: process.env.DISCORD_OCTOBER_KICKOFF_TIME || "08:00",
    octoberTime: process.env.DISCORD_OCTOBER_TIME || "08:00",
    octoberChannelName: process.env.DISCORD_OCTOBER_CHANNEL || "october-challenge",
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
