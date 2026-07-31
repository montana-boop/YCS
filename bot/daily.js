// Scheduled daily posts ("question of the day") for the Single Besties chat.
// Written in Montana's group-chat voice — casual, warm, like texting the girls.
// Multiple weeks rotate so nothing repeats for a while. Add more weeks to the
// WEEKS array over time and the rotation grows automatically.

// WEEKS[0] covers the week of the anchor Monday below; WEEKS[1] the next week;
// then it cycles back. Each week is keyed by lowercase weekday name.
const WEEKS = [
  // ---- week A ----
  {
    monday: `happy monday besties 🍒
recap time... how was everyone's weekend? give me a highlight or a mess, we don't discriminate.
and be honest: what's the one thing you actually wanna get to this week?`,
    tuesday: `tuesday and i'm nosy again ☕️👀
we're doing icks today.
what's a dating ick that's SO specific but ends it on the spot for you?
i'll go first in the replies`,
    wednesday: `happy hump day 🍒
rich auntie energy isn't about the money... it's about the standards.
midweek reminder: you're allowed to have a standard and hold it, even when it's inconvenient.
what's a boundary or standard you're proud of holding lately?`,
    thursday: `thursday, keeping it light 💅
comfort content check.
what's the show, movie, or song you put on when you need to feel like yourself again?`,
    friday: `it's friday!! 🥂
give me a win from this week, big or tiny (got out of bed on a hard day counts).
what's everyone getting into this weekend?`,
    saturday: `saturday 🤍
no agenda today, just checking in.
what's your perfect low-key saturday... coffee, a walk, a show, absolutely nothing?`,
    sunday: `sunday reset 🧺
we're closing out the week gently.
one thing you're proud of from this week, and one thing you're looking forward to next?`,
  },

  // ---- week B ----
  {
    monday: `morning besties ☀️
monday check-in: on a scale of "i got this" to "who signed me up for today"... where are we?
give me your monday mood in one word (or a gif)`,
    tuesday: `tuesday and i'm nosy ☕️👀
green flags edition.
what's a green flag that makes you go "oh thank god, a normal one"?`,
    wednesday: `happy hump day 🍒
you'd never talk to your bestie the way you talk to yourself sometimes.
what's one kind thing you can say to yourself today? say it here, we'll co-sign it`,
    thursday: `thursday, keeping it light 💅
you're hosting the group's next girls night.
what's the theme, the drink, and the dress code?`,
    friday: `it's friday!! 🥂
brag a little... what's something that went right this week?
and what's the weekend plan (or beautifully, no plan)?`,
    saturday: `saturday soft life 🤍
what are we doing to actually rest today? (doomscrolling doesn't count, sorry)`,
    sunday: `sunday reset 🧺
sunday scaries or sunday peace... which are we today?
and one little thing you're doing to set up next week?`,
  },

  // ---- week C ----
  {
    monday: `happy monday besties 🍒
pick a word for your week. just one.
what's your one-word intention for the next 7 days?`,
    tuesday: `tuesday, storytime ☕️👀
best OR worst first date you've ever been on. we need details.`,
    wednesday: `happy hump day 🍒
you're not the same person you were a year ago, thank god.
what's something you used to tolerate that you'd never accept now?`,
    thursday: `thursday 💅
gas each other up day.
reply with something you're low-key proud of and we'll hype you in the replies. no win too small.`,
    friday: `it's friday!! 🥂
what made you laugh this week?
and what's the plan (or the beautiful lack of one) this weekend?`,
    saturday: `saturday 🤍
what's a small thing that made this week feel a little softer?`,
    sunday: `sunday reset 🧺
brain dump: what's one thing you're taking OFF your plate this week?`,
  },

  // ---- week D ----
  {
    monday: `morning besties ☀️
monday but make it gentle. what's the first nice thing you're doing for yourself today, even if it's just coffee in peace?`,
    tuesday: `tuesday and we're being a little delulu ☕️👀
manifest it: describe your dream "boringly healthy" relationship in one sentence. speak it into existence.`,
    wednesday: `happy hump day 🍒
"no" is a full sentence.
what's something you said no to recently that you're proud of?`,
    thursday: `thursday 💅
put the group onto something you're obsessed with right now. book, show, product, snack, anything. we're taking notes.`,
    friday: `it's friday!! 🥂
finish the sentence: this week i'm proud that i ______.
and what's the weekend looking like?`,
    saturday: `saturday soft life 🤍
permission granted to do nothing productive today. what's your ideal do-nothing saturday?`,
    sunday: `sunday reset 🧺
gratitude check: name one person or thing that made this week better.`,
  },
];

// The Monday that WEEKS[0] starts on. Rotation advances every Monday.
const ANCHOR_UTC = Date.UTC(2026, 6, 13); // 2026-07-13 (a Monday)

// Exact-date overrides: approved one-off questions pinned to a specific date.
// These take precedence over the weekly rotation for that day. Body only —
// the scheduler appends the @everyone mention automatically.
const OVERRIDES = {
  "2026-08-01": `weekend spicy 🌶️
what finally made you decide a man was NOT worth "doing the work" for?`,
  "2026-08-03": `fill in the blank:
"i thought i was so mature at 22, but really i was ______"`,
  "2026-08-04": `hot take 🔥
is romance actually real... or just something we were sold?
defend it, i want the essays.`,
  "2026-08-05": `this or that 👀
told a friend the hard truth vs. bit your tongue... which do you regret more?`,
  "2026-08-06": `rank them 💀
worst thing to hear on a first date:
"what's your body count" / "i'm not like other guys" / "you're so mature for your age"`,
  "2026-08-08": `weekend deep cut 🤍
when did your body start feeling like YOURS again... and after what?`,
};

// Current weekday / time / date in a timezone (DST-safe via Intl).
export function tzNow(tz) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const m = {};
  for (const p of parts) m[p.type] = p.value;
  const hour = m.hour === "24" ? "00" : m.hour; // some envs emit "24" at midnight
  return {
    weekday: m.weekday.toLowerCase(),
    time: `${hour}:${m.minute}`,
    date: `${m.year}-${m.month}-${m.day}`,
  };
}

// Which week's content applies to a YYYY-MM-DD date (advances each Monday).
export function weekIndexForDate(dateStr) {
  const [y, mo, d] = dateStr.split("-").map(Number);
  const days = Math.floor((Date.UTC(y, mo - 1, d) - ANCHOR_UTC) / 86_400_000);
  const n = WEEKS.length;
  return ((Math.floor(days / 7) % n) + n) % n;
}

// Today's message text (or null) for a timezone. Pinned date overrides win;
// otherwise fall back to the weekly rotation.
export function todaysMessage(tz) {
  const { weekday, date } = tzNow(tz);
  if (OVERRIDES[date]) return OVERRIDES[date];
  return WEEKS[weekIndexForDate(date)][weekday] || null;
}

// Post today's message to a channel, optionally ending with a mention
// (e.g. "@everyone") so members get notified.
export async function postDay(client, channelId, tz, mention = "") {
  const text = todaysMessage(tz);
  if (!text) return null;
  const channel = await client.channels.fetch(channelId);
  const content = mention ? `${text}\n\n${mention}` : text;
  return channel.send({ content, allowedMentions: { parse: ["everyone", "roles"] } });
}

// Fire today's post once per day at cfg.dailyTime in cfg.dailyTz. No persistence
// needed: we only post during the target minute and guard with an in-memory
// "already posted this date" flag, so restarts don't double-post.
export function startDailyScheduler(client, cfg) {
  const channelId = cfg.dailyChannelId || cfg.channelId;
  if (!channelId) {
    console.error("   ⚠️ No daily channel set (DISCORD_DAILY_CHANNEL_ID / DISCORD_CHANNEL_ID) — daily posts off.");
    return;
  }
  const target = cfg.dailyTime; // "HH:MM", 24h
  console.log(`   🗓️  Daily posts: every day at ${target} ${cfg.dailyTz} → channel ${channelId}`);

  let lastPostedDate = null;
  const tick = async () => {
    const { time, date } = tzNow(cfg.dailyTz);
    if (time === target && todaysMessage(cfg.dailyTz) && lastPostedDate !== date) {
      lastPostedDate = date;
      try {
        await postDay(client, channelId, cfg.dailyTz, cfg.dailyMention);
        console.log(`   ✅ Posted today's question of the day`);
      } catch (err) {
        console.error(`   ⚠️ Daily post failed: ${err.message}`);
      }
    }
  };
  setInterval(tick, 30_000); // check twice a minute so we never miss the window
  tick();
}
