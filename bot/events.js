// Community events automation:
//  - Coworking: daily reminders (a few times, to catch different time zones)
//    pinging @coworking to hop into the always-open voice room.
//  - Journal Club: a weekly Discord scheduled event (Saturdays, cfg.journalClubTime)
//    on the Journal Club voice room, kept scheduled automatically.
// All times are in cfg.dailyTz (Eastern). Channels/roles are found by name so
// no IDs need configuring.

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
export function zonedToUTC(y, mo, d, h, mi, tz) {
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

// "saturday, september 12" in the group's timezone.
export function dayLabel(date, tz) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    month: "long",
    day: "numeric",
  })
    .format(date)
    .toLowerCase();
}

function findText(guild, name) {
  return guild?.channels?.cache.find((c) => c.name === name && c.isTextBased?.());
}
function findRole(guild, name) {
  return guild?.roles?.cache.find((r) => r.name === name);
}
function findVoice(guild, needle) {
  const n = needle.toLowerCase();
  return guild?.channels?.cache.find(
    (c) => c.type === ChannelType.GuildVoice && c.name.toLowerCase().includes(n)
  );
}

// --- Journal Club weekly event ---------------------------------------------

const JOURNAL_EVENT_NAME = "📓 Journal Club";
const JOURNAL_EVENT_DESC =
  "bring your journal, your coffee, and whatever's on your mind. we write together, share if we feel like it, and keep it low-pressure 🍒";

function journalDef(cfg) {
  const [h, mi] = cfg.journalClubTime.split(":").map(Number);
  return { weekday: cfg.journalClubWeekday, hour: h, minute: mi, durationH: 1.5 };
}

// When the next journal club starts (UTC Date), or null.
export function nextJournalClub(cfg, now = new Date()) {
  return nextWeeklyStart(journalDef(cfg), cfg.dailyTz, now);
}

// Make sure the next journal club is on the server calendar. Returns the
// event (existing or new). Uses the Journal Club voice room when it exists,
// otherwise an "external" event so it still shows up.
export async function ensureJournalEvent(guild, cfg) {
  const start = nextJournalClub(cfg);
  if (!start) return null;
  const existing = await guild.scheduledEvents.fetch();
  const dup = existing.find(
    (e) =>
      e.name.toLowerCase().includes("journal club") &&
      Math.abs((e.scheduledStartTimestamp || 0) - start.getTime()) < 3 * 3600000
  );
  if (dup) return dup;
  const end = new Date(start.getTime() + journalDef(cfg).durationH * 3600000);
  const voice = findVoice(guild, "journal club");
  const base = {
    name: JOURNAL_EVENT_NAME,
    scheduledStartTime: start,
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    description: JOURNAL_EVENT_DESC,
  };
  const ev = voice
    ? await guild.scheduledEvents.create({
        ...base,
        entityType: GuildScheduledEventEntityType.Voice,
        channel: voice.id,
        scheduledEndTime: end,
      })
    : await guild.scheduledEvents.create({
        ...base,
        entityType: GuildScheduledEventEntityType.External,
        scheduledEndTime: end,
        entityMetadata: { location: "🍒 Journal Club voice room in Single Besties" },
      });
  console.log(`   📅 Created Journal Club for ${start.toISOString()}`);
  return ev;
}

export function startEventScheduler(client, cfg) {
  const run = async () => {
    const guild = client.guilds.cache.get(cfg.guildId);
    if (!guild) return;
    try {
      await ensureJournalEvent(guild, cfg);
    } catch (err) {
      console.error(`   ⚠️ Journal Club event failed: ${err.message}`);
    }
  };
  run();
  setInterval(run, 6 * 3600 * 1000); // top up a few times a day so it's always scheduled
  console.log(
    `   📅 Event scheduler on — Journal Club every ${cfg.journalClubWeekday} at ${cfg.journalClubTime} ${cfg.dailyTz}.`
  );
}

// --- Coworking reminders ----------------------------------------------------

// Reminders a few times a day (default 8am / 1pm / 8pm ET) so besties in
// different time zones all get a "we're hanging out, hop in" nudge. The voice
// room itself is always open. Each configured time posts once per day.
export function startCoworkingReminder(client, cfg) {
  const targets = cfg.coworkingTimes; // ["HH:MM", ...]
  const lastByTime = {}; // "HH:MM" -> "YYYY-MM-DD" already posted
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    if (!targets.includes(time) || lastByTime[time] === date) return;
    lastByTime[time] = date;
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
        `☕ coworking is open — hop into ${where}, mute your mic, and let's get things done together 🍒 (come and go whenever, we're here for a while)`;
      await ch.send({ content, allowedMentions: { roles: role ? [role.id] : [] } });
      console.log(`   ✅ Posted coworking reminder (${time})`);
    } catch (err) {
      console.error(`   ⚠️ Coworking reminder failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
  console.log(`   ☕ Coworking reminders on — ${targets.join(", ")} ${cfg.dailyTz}.`);
}
