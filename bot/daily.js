// Scheduled daily posts ("question of the day") for the Single Besties chat.
// Posts the matching weekday's message at a set local time. Content is written
// in Montana's group-chat voice — casual, warm, like texting the girls.

// This week's approved content bank. Keyed by lowercase weekday name.
export const DAILY_POSTS = {
  monday: `hey besties, happy monday 🍒
no pressure to have it all together today...
how's everyone's week actually looking?
qotd: one thing you've got going on this week you're excited about
(or one thing you're dreading, we can commiserate too lol)`,

  tuesday: `tuesday and i'm feeling nosy ☕️👀
we've all got the situationship that dragged on way too long...
qotd: how long did your longest one last, and what finally made you done?
(no judgment, i'll go first)`,

  wednesday: `happy hump day 🍒
midweek reminder to do one little thing just for you today...
a nice coffee, a walk, finally booking the thing you keep putting off.
qotd: what've you treated yourself to lately, big or small? need ideas honestly`,

  thursday: `thursday and we're keeping it light 💅
you get ONE petty text to send to every man who wasted your time.
it sends at midnight, he can't reply.
qotd: what does yours say?? keep it classy... or don't`,

  friday: `it's friday!! 🥂
give me the highs AND the lows, how'd the week actually treat everyone?
and please tell me we're all doing something good for ourselves this weekend
qotd: one win from this week (however small), and what's your weekend looking like?`,
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
