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
];

// The Monday that WEEKS[0] starts on. Rotation advances every Monday.
const ANCHOR_UTC = Date.UTC(2026, 6, 13); // 2026-07-13 (a Monday)

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

// Today's message text (or null) for a timezone.
export function todaysMessage(tz) {
  const { weekday, date } = tzNow(tz);
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
