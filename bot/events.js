// Community events automation:
//  - Coworking: a daily midday reminder pinging @coworking to hop in the voice room
//  - Movie Night: a weekly Discord scheduled event (Mondays 9pm ET) + a Monday
//    afternoon "vote on the movie" post pinging @movie night
// All times are in cfg.dailyTz (Eastern). Channels/roles are found by name so no
// IDs need configuring.

import {
  ChannelType,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventEntityType,
} from "discord.js";
import { tzNow } from "./daily.js";

// --- timezone helpers -------------------------------------------------------

function etParts(date, tz) {
  const p = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date))
    p[type] = value;
  return { y: +p.year, mo: +p.month, d: +p.day, wd: p.weekday };
}

// The UTC instant for a wall-clock time in a timezone (DST-correct).
function zonedToUTC(y, mo, d, h, mi, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const p = {};
  for (const { type, value } of new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(guess)))
    p[type] = value;
  const hh = p.hour === "24" ? 0 : +p.hour;
  const localAsUTC = Date.UTC(+p.year, +p.month - 1, +p.day, hh, +p.minute, +p.second);
  return new Date(guess - (localAsUTC - guess));
}

// Next start (UTC Date) for a weekly def, at least a minute out.
function nextWeeklyStart(def, tz, now) {
  for (let i = 0; i < 8; i++) {
    const { y, mo, d, wd } = etParts(new Date(now.getTime() + i * 86400000), tz);
    if (wd !== def.weekday) continue;
    const start = zonedToUTC(y, mo, d, def.hour, def.minute, tz);
    if (start.getTime() > now.getTime() + 60000) return start;
  }
  return null;
}

// --- Movie Night scheduled event -------------------------------------------

const MOVIE_EVENT = {
  name: "🎬 Movie Night",
  channel: "Movie Night",
  weekday: "Mon",
  hour: 21,
  minute: 0,
  durationH: 2,
  description: "monday night unwind — vote on the film in #events-chat, then pull up 🍿",
};

async function ensureMovieEvent(guild, tz) {
  const start = nextWeeklyStart(MOVIE_EVENT, tz, new Date());
  if (!start) return;
  const voice = guild.channels.cache.find(
    (c) => c.name === MOVIE_EVENT.channel && c.type === ChannelType.GuildVoice
  );
  if (!voice) {
    console.error(`   ⚠️ voice channel "${MOVIE_EVENT.channel}" not found — movie event skipped`);
    return;
  }
  const existing = await guild.scheduledEvents.fetch();
  const dup = existing.find(
    (e) => e.name === MOVIE_EVENT.name && Math.abs((e.scheduledStartTimestamp || 0) - start.getTime()) < 3 * 3600000
  );
  if (dup) return;
  await guild.scheduledEvents.create({
    name: MOVIE_EVENT.name,
    scheduledStartTime: start,
    scheduledEndTime: new Date(start.getTime() + MOVIE_EVENT.durationH * 3600000),
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType: GuildScheduledEventEntityType.Voice,
    channel: voice.id,
    description: MOVIE_EVENT.description,
  });
  console.log(`   📅 Created Movie Night for ${start.toISOString()}`);
}

export function startEventScheduler(client, cfg) {
  const run = async () => {
    const guild = client.guilds.cache.get(cfg.guildId);
    if (!guild) return;
    try {
      await ensureMovieEvent(guild, cfg.dailyTz);
    } catch (err) {
      console.error(`   ⚠️ Movie Night event failed: ${err.message}`);
    }
  };
  run();
  setInterval(run, 6 * 3600 * 1000); // top up a few times a day so it's always scheduled
  console.log("   📅 Event scheduler on — Movie Night every Monday 9pm.");
}

// --- daily/weekly reminder posts -------------------------------------------

function findText(guild, name) {
  return guild?.channels?.cache.find((c) => c.name === name && c.isTextBased?.());
}
function findRole(guild, name) {
  return guild?.roles?.cache.find((r) => r.name === name);
}

// Coworking: daily midday ping to hop in the voice room.
export function startCoworkingReminder(client, cfg) {
  const target = cfg.coworkingTime;
  let last = null;
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    if (time !== target || last === date) return;
    last = date;
    try {
      const guild = client.guilds.cache.get(cfg.guildId);
      const ch = findText(guild, cfg.eventsChannelName);
      if (!ch) return console.error(`   ⚠️ #${cfg.eventsChannelName} not found for coworking`);
      const role = findRole(guild, "coworking");
      const voice = guild?.channels?.cache.find(
        (c) => c.name === "Coworking" && c.type === ChannelType.GuildVoice
      );
      const where = voice ? `<#${voice.id}>` : "the Coworking room";
      const content =
        (role ? `<@&${role.id}> ` : "") +
        `☕ midday coworking is starting — hop into ${where}, mute your mic, and let's get things done together 🍒`;
      await ch.send({ content, allowedMentions: { roles: role ? [role.id] : [] } });
      console.log("   ✅ Posted coworking reminder");
    } catch (err) {
      console.error(`   ⚠️ Coworking reminder failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
  console.log(`   ☕ Coworking reminder on — daily at ${cfg.coworkingTime} ${cfg.dailyTz}.`);
}

// Movie Night: Monday-afternoon "vote on the film" post.
export function startMovieVote(client, cfg) {
  const target = cfg.movieVoteTime;
  let last = null;
  const tick = async () => {
    const { weekday, time, date } = tzNow(cfg.dailyTz);
    if (weekday !== "monday" || time !== target || last === date) return;
    last = date;
    try {
      const guild = client.guilds.cache.get(cfg.guildId);
      const ch = findText(guild, cfg.eventsChannelName);
      if (!ch) return console.error(`   ⚠️ #${cfg.eventsChannelName} not found for movie vote`);
      const role = findRole(guild, "movie night");
      const content =
        (role ? `<@&${role.id}> ` : "") +
        `🎬🍿 movie night tonight at 9pm ET!\ndrop your movie picks below 👇 and react 👍 on the ones you'd watch — top pick wins.`;
      await ch.send({ content, allowedMentions: { roles: role ? [role.id] : [] } });
      console.log("   ✅ Posted movie-night vote");
    } catch (err) {
      console.error(`   ⚠️ Movie vote failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
  console.log(`   🎬 Movie vote on — Mondays at ${cfg.movieVoteTime} ${cfg.dailyTz}.`);
}
