// Birthday bot. Members save their birthday (month + day, no year) with the
// /birthday command; once a day the scheduler wishes anyone whose birthday is
// today a happy birthday in the main chat and gives them a temporary "🎂
// birthday" role for the day (cleaned up automatically the next day).

import { tzNow } from "./daily.js";
import { readBirthdays } from "../src/store.js";

const BIRTHDAY_ROLE = "🎂 birthday";
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Pretty label like "August 29" for confirmations.
export function birthdayLabel(month, day) {
  return `${MONTHS[month - 1]} ${day}`;
}

// Find (or create) the temporary birthday role.
async function ensureBirthdayRole(guild) {
  await guild.roles.fetch();
  let role = guild.roles.cache.find((r) => r.name === BIRTHDAY_ROLE);
  if (!role) {
    role = await guild.roles.create({
      name: BIRTHDAY_ROLE,
      color: 0xffd1e8, // soft pink
      hoist: true, // show them separately in the member list on their day
      mentionable: false,
      reason: "Single Besties birthday role",
    });
  }
  return role;
}

// One pass: grant the role + celebrate today's birthdays, remove it from anyone
// whose birthday isn't today (so yesterday's celebrant is reset).
async function runBirthdays(client, cfg) {
  const guild = client.guilds.cache.get(cfg.guildId);
  if (!guild) return;
  const { date } = tzNow(cfg.dailyTz); // YYYY-MM-DD in the group's timezone
  const [, moStr, dStr] = date.split("-");
  const todayM = Number(moStr);
  const todayD = Number(dStr);

  const birthdays = readBirthdays();
  const celebrating = new Set(
    Object.entries(birthdays)
      .filter(([, b]) => b.m === todayM && b.d === todayD)
      .map(([userId]) => userId)
  );

  const role = await ensureBirthdayRole(guild);
  await guild.members.fetch();

  // Clean up: anyone wearing the role who isn't a birthday-haver today loses it.
  for (const member of role.members.values()) {
    if (!celebrating.has(member.id)) {
      await member.roles.remove(role, "birthday over").catch(() => {});
    }
  }

  // Celebrate today's besties.
  const channelId = cfg.channelId || cfg.dailyChannelId;
  const channel = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  for (const userId of celebrating) {
    const member = guild.members.cache.get(userId);
    if (!member) continue;
    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role, "birthday 🎂").catch(() => {});
    }
    if (channel?.isTextBased?.()) {
      await channel
        .send({
          content: `🎂🎉 happy birthday <@${userId}>!! 💌\ndrop some birthday love below, besties 🥳🍒`,
          allowedMentions: { users: [userId] },
        })
        .catch((err) => console.error(`   ⚠️ Birthday post failed: ${err.message}`));
    }
  }
  if (celebrating.size) console.log(`   ✅ Celebrated ${celebrating.size} birthday(s)`);
}

// Fire once per day at cfg.birthdayTime in cfg.dailyTz (in-memory guard against
// double-posting within the same day / on restarts).
export function startBirthdayScheduler(client, cfg) {
  const target = cfg.birthdayTime; // "HH:MM"
  console.log(`   🎂 Birthday bot on — daily at ${target} ${cfg.dailyTz}.`);
  let last = null;
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    if (time !== target || last === date) return;
    last = date;
    try {
      await runBirthdays(client, cfg);
    } catch (err) {
      console.error(`   ⚠️ Birthday run failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
}
