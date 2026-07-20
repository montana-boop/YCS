// Scheduled daily posts ("question of the day") for the Single Besties chat.
// Posts the matching weekday's message at a set local time. Content is written
// in Montana's group-chat voice — casual, warm, like texting the girls.

// This week's approved content bank. Keyed by lowercase weekday name.
export const DAILY_POSTS = {
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
};

// Current weekday / time / date in a given timezone (DST-safe via Intl).
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

// Post a specific day's message to a channel, optionally ending with a mention
// (e.g. "@everyone") so members get notified.
export async function postDay(client, channelId, weekday, mention = "") {
  const text = DAILY_POSTS[weekday];
  if (!text) return null;
  const channel = await client.channels.fetch(channelId);
  const content = mention ? `${text}\n\n${mention}` : text;
  return channel.send({ content, allowedMentions: { parse: ["everyone", "roles"] } });
}

// Fire the matching weekday's post once per day at cfg.dailyTime in cfg.dailyTz.
// No persistence needed: we only post during the target minute and guard with
// an in-memory "already posted this date" flag, so restarts don't double-post.
export function startDailyScheduler(client, cfg) {
  const channelId = cfg.dailyChannelId || cfg.channelId;
  if (!channelId) {
    console.error("   ⚠️ No daily channel set (DISCORD_DAILY_CHANNEL_ID / DISCORD_CHANNEL_ID) — daily posts off.");
    return;
  }
  const target = cfg.dailyTime; // "HH:MM", 24h
  console.log(`   🗓️  Daily posts: weekdays at ${target} ${cfg.dailyTz} → channel ${channelId}`);

  let lastPostedDate = null;
  const tick = async () => {
    const { weekday, time, date } = tzNow(cfg.dailyTz);
    if (time === target && DAILY_POSTS[weekday] && lastPostedDate !== date) {
      lastPostedDate = date;
      try {
        await postDay(client, channelId, weekday, cfg.dailyMention);
        console.log(`   ✅ Posted ${weekday}'s question of the day`);
      } catch (err) {
        console.error(`   ⚠️ Daily post failed: ${err.message}`);
      }
    }
  };
  setInterval(tick, 30_000); // check twice a minute so we never miss the window
  tick();
}
