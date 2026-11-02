// November challenge: gratitude → recenter → together → thanksgiving week →
// finish. One post every morning in the #november-challenge channel, Nov 2–30.
// Day 1 (Nov 2) is the announcement and posts as soon as the bot is up on that
// date (it's already past the morning slot); every later day posts at
// cfg.novemberTime (8am ET). Every post pings @everyone.

import { tzNow } from "./daily.js";

const TITLE = "november challenge";

// date → { n: day number, text }
const DAYS = {
  "2026-11-02": {
    n: 1,
    text: `hi besties, happy november 2nd 🤍

i loved our october challenge so much. watching you all show up every morning, hype each other up, share your lives. it was genuinely one of my favorite things this year.

so we're doing it again. welcome to the **${TITLE}** 🍂

here in the states, november is thanksgiving month, and i want to spend it on three things: gratitude, recentering, and ending the year strong. together. no matter what any of us is going through right now, this group has been such a positive part of my life this year, and i want us to carry each other through the last stretch of it.

same deal as october. one small thing every morning. some days it's gratitude, some days it's a tiny reset, some days it's just showing up for a bestie. no pressure, no streaks, jump in whenever.

day 1: one thing you're grateful for right now. not the big stuff. the small, specific, today thing. drop it below 🍂`,
  },

  // --- week 1: gratitude ---
  "2026-11-03": { n: 2, text: `text one person today and tell them specifically why you're grateful for them. come back and tell us who.` },
  "2026-11-04": { n: 3, text: `a bestie in here who made october better for you. tag her and say why.` },
  "2026-11-05": { n: 4, text: `gratitude for something hard. one thing that was rough this year that you're weirdly grateful for now.` },
  "2026-11-06": { n: 5, text: `the small daily thing you'd miss most if it disappeared. your coffee order, your walk, your show.` },
  "2026-11-07": { n: 6, text: `send a photo of one thing in your space that makes you happy. explain in one line.` },
  "2026-11-08": { n: 7, text: `reply to 3 besties' answers from this week. that's the whole challenge.` },

  // --- week 2: recenter ---
  "2026-11-09": { n: 8, text: `one thing you're letting go of before the year ends. a habit, a grudge, a tab you've had open since june.` },
  "2026-11-10": { n: 9, text: `phone on do not disturb for 30 minutes today. what did you do with it?` },
  "2026-11-11": { n: 10, text: `your one non-negotiable for the rest of the year. the thing you protect no matter how busy it gets.` },
  "2026-11-12": { n: 11, text: `write the word you want to carry through the holidays. one word. explain if you want.` },
  "2026-11-13": { n: 12, text: `rest check. honestly, how are you doing? 1 to 10, and what would move it up one.` },
  "2026-11-14": { n: 13, text: `do one thing today purely because it makes you feel like yourself. tell us what.` },
  "2026-11-15": { n: 14, text: `reset sunday. one thing you're clearing out this week, physical or mental. come back and cheer on someone else's.` },

  // --- week 3: together ---
  "2026-11-16": { n: 15, text: `ask the group for something you actually need right now. a recommendation, a pep talk, a second opinion.` },
  "2026-11-17": { n: 16, text: `share a tradition, yours or your family's, that you love. steal one from someone else.` },
  "2026-11-18": { n: 17, text: `ping your region role and ask who's around for the holidays. friendsgiving, a coffee, a call. 📍` },
  "2026-11-19": { n: 18, text: `a win from a bestie this month. post hers, not yours.` },
  "2026-11-20": { n: 19, text: `friendsgiving plan. who are you spending the holiday with, and what's your dish?` },
  "2026-11-21": { n: 20, text: `voice note saturday. 10 seconds, tell us one thing you're looking forward to this week. 🎙️` },
  "2026-11-22": { n: 21, text: `reply to the quietest person you can find in this thread. make sure she's seen.` },

  // --- week 4: thanksgiving week ---
  "2026-11-23": { n: 22, text: `gratitude list, speed round. 5 things in 60 seconds, no overthinking.` },
  "2026-11-24": { n: 23, text: `one thing this group gave you this year.` },
  "2026-11-25": { n: 24, text: `check in on someone who might have a hard holiday. a bestie here, or someone in your life. tell us you did it, not who.` },
  "2026-11-26": { n: 25, text: `happy thanksgiving besties 🦃 wherever you are and whoever you're with, including just yourself: we're grateful for you. drop a photo of your day.` },
  "2026-11-27": { n: 26, text: `the thing you're most proud of from this year. big or small. clap for yourself.` },
  "2026-11-28": { n: 27, text: `rest day. literally. do nothing and tell us how it went.` },
  "2026-11-29": { n: 28, text: `one thing you want to finish before december 31st. we're holding you to it.` },

  // --- finish ---
  "2026-11-30": { n: 29, text: `last day of november 🍂 one word for how you feel going into december, and tag one bestie who helped you get here. recap thread, leave love on at least 3.` },
};

export function dayForDate(dateStr) {
  return DAYS[dateStr] || null;
}

// "november 5th" from "2026-11-05".
export function prettyDate(dateStr) {
  const d = Number(dateStr.slice(-2));
  const suffix = d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th";
  return `november ${d}${suffix}`;
}

export function formatDay(day, dateStr) {
  // Day 1 is the announcement and carries its own heading.
  if (day.n === 1) return day.text;
  return `${TITLE} · ${prettyDate(dateStr)} 🍂\n${day.text}`;
}

function findChannel(guild, name) {
  const needle = name.toLowerCase();
  return guild?.channels?.cache.find(
    (c) => c.isTextBased?.() && c.name.toLowerCase().includes(needle)
  );
}

// Post today's challenge now. Returns the sent message, or null if none today.
export async function postNovember(client, cfg) {
  const { date } = tzNow(cfg.dailyTz);
  const day = dayForDate(date);
  if (!day) return null;
  const guild = client.guilds.cache.get(cfg.guildId);
  const channel = findChannel(guild, cfg.novemberChannelName);
  if (!channel) throw new Error(`channel matching "${cfg.novemberChannelName}" not found`);
  const content = `${formatDay(day, date)}\n\n@everyone`;
  return channel.send({ content, allowedMentions: { parse: ["everyone"] } });
}

// Should today's post fire now? Day 1 fires at any time on its date (so the
// announcement goes out the moment the bot deploys on Nov 2); later days fire
// only in the cfg.novemberTime minute.
export function shouldPostNow(day, time, cfg) {
  if (day.n === 1) return true;
  return time === cfg.novemberTime;
}

export function startNovemberScheduler(client, cfg) {
  console.log(
    `   🍂 November challenge: day 1 on deploy, then daily at ${cfg.novemberTime} ${cfg.dailyTz} → #${cfg.novemberChannelName} (Nov 2–30)`
  );
  let last = null;
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    const day = dayForDate(date);
    if (!day || last === date || !shouldPostNow(day, time, cfg)) return;
    last = date;
    try {
      await postNovember(client, cfg);
      console.log("   ✅ Posted november challenge");
    } catch (err) {
      console.error(`   ⚠️ November challenge failed: ${err.message}`);
    }
  };
  setInterval(tick, 30_000);
  tick();
}
