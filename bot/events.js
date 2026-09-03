// Community events automation:
//  - Coworking: daily reminders (a few times, to catch different time zones)
//    pinging @coworking to hop into the always-open voice room.
// All times are in cfg.dailyTz (Eastern). Channels/roles are found by name so
// no IDs need configuring.

import { ChannelType } from "discord.js";
import { tzNow } from "./daily.js";

// The UTC instant for a wall-clock time in a timezone (DST-correct). Exported
// for other schedulers/commands (e.g. /journal-club) that pin an exact time.
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

function findText(guild, name) {
  return guild?.channels?.cache.find((c) => c.name === name && c.isTextBased?.());
}
function findRole(guild, name) {
  return guild?.roles?.cache.find((r) => r.name === name);
}

// Coworking: reminders a few times a day (default 8am / 1pm / 8pm ET) so besties
// in different time zones all get a "we're hanging out, hop in" nudge. The voice
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
