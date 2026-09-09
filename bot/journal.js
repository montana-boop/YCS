// Journal prompt of the day for the writing besties. Posts one short prompt
// every day at cfg.journalTime in the journal/writing channel. The first two
// weeks run in order (easy → a little deeper), then the list rotates.
// Pin a specific prompt to a date with OVERRIDES.

import { tzNow } from "./daily.js";

// In order: week 1 eases in, week 2 goes a little deeper.
const PROMPTS = [
  // ---- week 1 ----
  "one thing you like about yourself today. just one.",
  "three things you did this week that were just for you.",
  "what's a compliment you've gotten that you actually believe? write it down and let it be true.",
  "name something you're good at that you never brag about.",
  "what does \"taking care of myself\" look like for you this weekend? keep it simple.",
  "write down a moment this week you handled better than you would have a year ago.",
  "finish this: \"i don't need anyone's permission to...\"",
  // ---- week 2 ----
  "what's a part of your single life you'd actually miss if it changed?",
  "list 5 things you love that have nothing to do with anyone else.",
  "write about a time you chose yourself. how did it feel afterward?",
  "what's a standard you hold now that you didn't used to? where did it come from?",
  "describe yourself the way your best friend would. no downplaying.",
  "what's one thing you're proud of that nobody clapped for? clap for it here.",
  "finish this 5 times: \"i'm proud of myself for...\"",
];

// Exact-date overrides (YYYY-MM-DD → prompt text) take precedence.
const OVERRIDES = {};

// The day PROMPTS[0] posts. Earlier dates post nothing.
const ANCHOR_UTC = Date.UTC(2026, 8, 10); // 2026-09-10

export function promptForDate(dateStr) {
  if (OVERRIDES[dateStr]) return OVERRIDES[dateStr];
  const [y, mo, d] = dateStr.split("-").map(Number);
  const days = Math.floor((Date.UTC(y, mo - 1, d) - ANCHOR_UTC) / 86_400_000);
  if (days < 0) return null;
  return PROMPTS[days % PROMPTS.length];
}

export function todaysPrompt(tz) {
  return promptForDate(tzNow(tz).date);
}

export function formatPrompt(text) {
  return `journal prompt of the day ✍️\n${text}`;
}

function findChannel(guild, name) {
  const needle = name.toLowerCase();
  return guild?.channels?.cache.find(
    (c) => c.isTextBased?.() && c.name.toLowerCase().includes(needle)
  );
}

// Post today's prompt now. Returns the sent message, or null if nothing today.
export async function postPrompt(client, cfg) {
  const text = todaysPrompt(cfg.dailyTz);
  if (!text) return null;
  const guild = client.guilds.cache.get(cfg.guildId);
  const channel = findChannel(guild, cfg.journalChannelName);
  if (!channel) throw new Error(`channel matching "${cfg.journalChannelName}" not found`);
  return channel.send({ content: formatPrompt(text), allowedMentions: { parse: [] } });
}

export function startJournalScheduler(client, cfg) {
  const target = cfg.journalTime;
  console.log(`   ✍️  Journal prompts: daily at ${target} ${cfg.dailyTz} → #${cfg.journalChannelName}`);
  let last = null;
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    if (time !== target || last === date || !todaysPrompt(cfg.dailyTz)) return;
    last = date;
    try {
      await postPrompt(client, cfg);
      console.log("   ✅ Posted journal prompt of the day");
    } catch (err) {
      console.error(`   ⚠️ Journal prompt failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
}
