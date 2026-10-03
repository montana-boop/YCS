// Cosy Girl October: one small daily post in the #october-challenge channel,
// Oct 3–31. Day 1 is the announcement (pings @everyone); the rest are short
// tiny-challenges / cosy prompts / share-backs in Montana's voice. Weekly
// themes: ease in → say yes to small things → have one goal → romanticise the
// norm → make yourself proud.

import { tzNow } from "./daily.js";

const TITLE = "cosy girl october";

// date → { n: day number, text, mention? }
const DAYS = {
  // --- ease in ---
  "2026-10-03": {
    n: 1,
    mention: "@everyone",
    text: `okay besties, ${TITLE} starts NOW 🎃🍂
for the rest of the month there'll be one little thing in here every morning. sometimes a tiny challenge, sometimes a question, sometimes "send a pic." nothing heavy, nothing you have to keep up with. miss a day? who cares, jump back in.

day 1: one word for how you want this october to feel. drop it below 🍂`,
  },
  "2026-10-04": {
    n: 2,
    text: `sunday cosy setup 🕯️ light a candle, make something warm, get the blanket out. send a pic of your night.`,
  },
  "2026-10-05": {
    n: 3,
    text: `pick ONE goal for october. not ten. one thing you'd love to say you did by the 31st. write it here so we can hold you to it (lovingly).`,
  },

  // --- say yes to small things ---
  "2026-10-06": {
    n: 4,
    text: `tiny challenge: say yes to one thing today you'd normally talk yourself out of. the coffee, the walk, the text. tell us what it was.`,
  },
  "2026-10-07": {
    n: 5,
    text: `romanticise a random wednesday. candle, nice dinner, playlist, whatever. send a pic of your night.`,
  },
  "2026-10-08": {
    n: 6,
    text: `what's your october comfort watch? we're building the group list 📺`,
  },
  "2026-10-09": {
    n: 7,
    text: `tiny challenge: text a friend you've been meaning to text. bragging encouraged.`,
  },
  "2026-10-10": {
    n: 8,
    text: `solo date saturday ☕️ take yourself somewhere, even if it's the grocery store with a good coffee. where'd you go?`,
  },
  "2026-10-11": {
    n: 9,
    text: `sunday reset: one thing you did this week that made you feel like *her*.`,
  },

  // --- have one goal ---
  "2026-10-12": {
    n: 10,
    text: `goal check-in: how's your october goal going? honest answers only. "haven't started" counts, today's the day.`,
  },
  "2026-10-13": {
    n: 11,
    text: `tiny challenge: 20 minutes on your goal today. set a timer. report back when it goes off ⏱️`,
  },
  "2026-10-14": {
    n: 12,
    text: `what's a song that makes you feel unstoppable? adding it to the cosy girl playlist 🎧`,
  },
  "2026-10-15": {
    n: 13,
    text: `halfway through october 🎃 what's one thing you're glad you did so far this month?`,
  },
  "2026-10-16": {
    n: 14,
    text: `tiny challenge: make plans for this weekend right now. with yourself or with someone. what are they?`,
  },
  "2026-10-17": {
    n: 15,
    text: `cosy food saturday 🍂 cook or order the thing you've been craving. pic or it didn't happen.`,
  },
  "2026-10-18": {
    n: 16,
    text: `sunday reset: what are you letting go of before next week?`,
  },

  // --- romanticise the norm ---
  "2026-10-19": {
    n: 17,
    text: `make a boring monday errand feel nice. good coffee, good playlist, cute outfit. what'd you do?`,
  },
  "2026-10-20": {
    n: 18,
    text: `tiny challenge: go for a walk with your phone on do not disturb. 15 minutes. how'd it feel?`,
  },
  "2026-10-21": {
    n: 19,
    text: `the fall thing you look forward to every single year. the drink, the smell, the sweater. go.`,
  },
  "2026-10-22": {
    n: 20,
    text: `tiny challenge: wear something that makes you feel good today, for no reason. fit pic optional 💅`,
  },
  "2026-10-23": {
    n: 21,
    text: `friday night in or out? either way, what's the plan for making it feel good?`,
  },
  "2026-10-24": {
    n: 22,
    text: `tiny challenge: try one new thing today. a recipe, a café, a trail, a hobby. what was it?`,
  },
  "2026-10-25": {
    n: 23,
    text: `sunday reset: what's a small ritual from this month you want to keep?`,
  },

  // --- make yourself proud ---
  "2026-10-26": {
    n: 24,
    text: `last week of october 🎃 goal check: where are you? what's the one push to finish it?`,
  },
  "2026-10-27": {
    n: 25,
    text: `tiny challenge: do the thing you've been putting off. the call, the email, the appointment. report back.`,
  },
  "2026-10-28": {
    n: 26,
    text: `what's something you did this month that a-year-ago-you wouldn't have?`,
  },
  "2026-10-29": {
    n: 27,
    text: `tiny challenge: write down 3 things you're proud of from october. share one here.`,
  },
  "2026-10-30": {
    n: 28,
    text: `halloween plans? costume, movie night, candy for one. all valid. what are we doing? 🎃`,
  },
  "2026-10-31": {
    n: 29,
    text: `happy halloween besties 🎃 ${TITLE} wraps today. send your favorite photo from this month, we're making a little recap 🍂`,
  },
};

export function dayForDate(dateStr) {
  return DAYS[dateStr] || null;
}

export function formatDay(day) {
  // Day 1 is the announcement and carries its own heading.
  if (day.n === 1) return day.text;
  return `${TITLE} · day ${day.n} 🍂\n${day.text}`;
}

function findChannel(guild, name) {
  const needle = name.toLowerCase();
  return guild?.channels?.cache.find(
    (c) => c.isTextBased?.() && c.name.toLowerCase().includes(needle)
  );
}

// Post today's challenge now. Returns the sent message, or null if none today.
export async function postOctober(client, cfg) {
  const day = dayForDate(tzNow(cfg.dailyTz).date);
  if (!day) return null;
  const guild = client.guilds.cache.get(cfg.guildId);
  const channel = findChannel(guild, cfg.octoberChannelName);
  if (!channel) throw new Error(`channel matching "${cfg.octoberChannelName}" not found`);
  const body = formatDay(day);
  const content = day.mention ? `${body}\n\n${day.mention}` : body;
  const parse = day.mention === "@everyone" ? ["everyone"] : [];
  return channel.send({ content, allowedMentions: { parse } });
}

export function startOctoberScheduler(client, cfg) {
  const target = cfg.octoberTime;
  console.log(`   🎃 October challenge: daily at ${target} ${cfg.dailyTz} → #${cfg.octoberChannelName} (Oct 3–31)`);
  let last = null;
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    if (time !== target || last === date || !dayForDate(date)) return;
    last = date;
    try {
      await postOctober(client, cfg);
      console.log("   ✅ Posted october challenge");
    } catch (err) {
      console.error(`   ⚠️ October challenge failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
}
