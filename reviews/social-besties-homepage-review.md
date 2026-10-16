# Social Besties — Homepage Review & Improvement Plan

**URL reviewed:** https://socialbesties.co/ (homepage)
**Platform:** Membership.io
**Date:** 2026-07-11
**Scope:** Homepage copy and structure only. The live page could not be rendered
from this environment, so anything requiring the rendered page or HTML source
(tracking pixels, meta/OpenGraph tags, mobile layout, color contrast, accordion
ARIA) is listed under **"Verify in Membership.io"** rather than asserted.

Primary traffic channel (from the shared link): **Instagram / Meta, link-in-bio + paid**
(`utm_source=ig`, `fbclid` present). That matters — it means most visitors arrive
**cold, on mobile, mid-scroll**. The review is weighted toward that reader.

---

## TL;DR

The **voice and positioning are genuinely strong** — distinctive, consistent, and
differentiated in a crowded market. The offer ladder (DIY → done-for-you →
in-house) is smart. The biggest gaps are **not creative, they're conversion
mechanics**: there is **no proof** (testimonials, results, screenshots), **no risk
reversal** on the flagship $99 product, and an **ICP that's split** between
individual creators and business "practices/teams." Fixing proof + risk reversal is
the highest-ROI work on the page.

**If you only do three things:**
1. Add real social proof — member testimonials + client results + analytics screenshots.
2. Add risk reversal to the $99 Confessional (cancel anytime / guarantee).
3. Confirm the Meta Pixel + purchase/lead events are firing (you're paying for this traffic).

---

## What's working (keep it)

- **The voice.** "social media's confessional 🍒," "it's giving scam," "no psycho
  contracts," "just a girl with a phone." It's a real point of view and it's
  consistent top to bottom. Do **not** sand this down. It's the moat.
- **A clear villain.** Framing agencies as the enemy ("they take your 3–5k, recycle
  templates, keep you clueless on purpose") is textbook good positioning — it gives
  the reader someone to be *against* and a reason you exist.
- **A belief-shifting headline.** "you're already good at this, you just haven't been
  taught how to see it" reframes the problem as *skill you already have* rather than
  *talent you lack*. Strong.
- **Specific proof claims.** "a billion views," "32M/mo for one client," "6 years, no
  agency," "psych degree." Specific numbers beat vague bragging. (They just need
  *evidence* — see P0-1.)
- **A real value ladder.** $99 DIY / $2,500 DFY / custom in-house covers three buyer
  intents. Most creator sites only sell one thing.
- **Objection-handling FAQ** and a triage answer ("which one's for me?"). Good instinct.

---

## Prioritized findings

Priority key: **P0** = highest ROI, do first · **P1** = strong lift · **P2** = polish / longer-term.

### P0-1 — There is zero proof on the page. Add it.
**Problem:** Every claim is self-reported. For a cold IG visitor deciding to pay $99
(or $2,500) to a person they met 15 seconds ago, *claims are not evidence*. This is
the single largest conversion gap.
**Fix — add, in rough priority:**
- **3–6 member testimonials** for the Confessional (screenshotted DMs/tweets read as
  more real than styled quotes). Even better: a member's *result* ("went from 200 to
  40k in 3 months").
- **Client results** for done-for-you — even anonymized ("a med-spa client, 32M
  views/mo"). Name + logo if you're allowed to.
- **Analytics screenshots** backing "a billion views" and "32M/mo." One real
  screenshot outperforms the number in text.
- **A member/community count** near the Confessional CTA ("join 500+ besties").
**Where:** a proof strip under the hero, testimonials before the pricing, and a
results block inside the DFY card.

### P0-2 — No risk reversal on the flagship $99 offer.
**Problem:** The DFY card says "no psycho contracts" (great), but the **Confessional
has no cancel-anytime, trial, or guarantee** stated. That's the product you most want
cold traffic to buy on impulse, and it currently carries unspoken risk.
**Fix:** Add one line to the $99 card, in voice — e.g. *"cancel anytime, no drama"* or
*"stay a month, hate it, leave. i'll survive."* If you can offer a 7-day or
first-month guarantee, say so.

### P0-3 — Confirm conversion tracking is live.
**Problem:** You're driving paid IG traffic (`fbclid`), but Membership.io pages often
ship with weak/default tracking. If the **Meta Pixel** and **purchase/lead events**
aren't firing on the checkout and newsletter steps, you're optimizing ads blind.
**Fix (verify in Membership.io):** Pixel installed site-wide; `Lead` on newsletter
submit; `InitiateCheckout` + `Purchase` on the Confessional/DFY flows. Add GA4 if not
present. *(This is the cheapest high-leverage fix on the list — it costs nothing and
makes every ad dollar smarter.)*

### P0-4 — Hero CTA hierarchy is wrong for cold traffic.
**Problem:** The hero offers "see the three ways in" **and** "book a call" with equal
weight. For a cold, mobile, link-in-bio visitor, *booking a call is a big ask* — it's
a high-commitment action shown to a low-commitment audience.
**Fix:** Make the **low-friction** action primary (solid button: "see the three ways
in" / "join the confessional") and demote "book a call" to a secondary/ghost button.
Keep "book a call" prominent only in the team/practice (in-house) context, where a
call actually fits the buyer.

---

### P1-1 — The ICP is split; tighten who this is for.
**Observation:** The copy addresses **individual creators/influencers** (the $99
Confessional, "just a girl with a phone") *and* **business practices/teams** ("train
your front desk," "for practices and teams," "my prompts, your data"). "Practice"
strongly implies local service businesses — med-spas, dental, aesthetics, clinics.
That's two very different buyers on one page.
**Why it matters:** A split ICP dilutes the hero. A creator and a med-spa owner need
different first sentences.
**Fix (pick one):**
- **Keep both, but signpost.** Add a one-line "who's this for" under the hero:
  *"for creators who want to do it themselves — and for practices + teams who want it
  done or built in."* Then let the three cards self-select.
- **Or lead with the higher-value buyer** (practices/teams at $2,500+/custom) and
  treat the Confessional as the entry rung. Given the price gap, the business buyer is
  likely where the revenue is.

### P1-2 — The $99 → $2,500 gap is large and empty.
**Observation:** There's a 25× jump between DIY and done-for-you with nothing between.
Some "do-it-yourself-but-want-help" buyers fall in that gap.
**Options:** a mid-tier ("done-*with*-you" — Confessional + a monthly 1:1, e.g.
$497–$997/mo), or a paid intensive/workshop, or an annual Confessional plan to lift
LTV. Not urgent — but it's money currently left on the table.

### P1-3 — "how it actually works" is too thin to build belief.
**Observation:** "find your voice / batch it / post it" with no explanation. The three
steps are the *mechanism* that makes "15 min a day" believable — right now they're
just labels.
**Fix:** One sentence under each step, in voice. e.g. *"find your voice — we find the
2–3 things only you can say. batch it — one filming session = a week of posts. post it
— 15 min a day, that's the whole job."* Teaching the method is what makes people
believe it'll work for them.

### P1-4 — The newsletter lead magnet is weak.
**Observation:** "trend drops, real talk, and the occasional confession" is a *reason
to already like you*, not a *reason to give an email now*. Opt-in rates jump with a
concrete deliverable.
**Fix:** Offer one tangible freebie: *"steal my 15-min-a-day starter"* or *"25 of my
300 vault ideas, free."* Same list, a real hook. Also consider a second capture point
higher on the page (the newsletter is buried near the footer).

### P1-5 — SEO & share metadata (verify).
**Observation:** IG/Meta shares and any search discovery depend on `<title>`, meta
description, and **OpenGraph image/title** — Membership.io defaults are often generic.
**Fix (verify in Membership.io):**
- `<title>` and meta description that include what you do + who for (not just "social
  besties").
- OG image, OG title, OG description set — so link-in-bio and shared links render a
  branded card, not a blank/generic preview.
- One clear `<h1>` per page.

---

### P2-1 — FTC / results-claim disclaimer.
Once you add testimonials and results (P0-1), US FTC rules on endorsements and
earnings/results claims come into play. Add a short "results aren't typical / not a
guarantee of income" disclaimer near testimonials and pricing. Cheap insurance.

### P2-2 — Accessibility pass (verify on rendered page).
- **Color contrast** of the cherry/pink brand color on white for body text and buttons
  (target WCAG AA, 4.5:1 for text).
- **FAQ accordion** needs proper `button` + `aria-expanded` semantics (Membership.io
  usually handles this — confirm).
- The repeated **🍒 in the stats marquee** is announced as "cherry" by screen readers
  on every loop; fine, but keep decorative emoji out of critical button labels.
- All-lowercase is a fine brand choice — screen readers read it normally.

### P2-3 — Mobile QA (verify on device).
Check that the **stats marquee/ticker** and the **3-column pricing** stack cleanly on a
phone (this is where most of your traffic is). Confirm buttons are thumb-sized and the
pricing cards don't require horizontal scrolling.

### P2-4 — Minor copy notes.
- "it's giving scam" lands twice close together (section 01 header + body). Keep one as
  the punch, vary the other.
- The two hero CTAs plus the sub-CTA "book a call" immediately again = "book a call"
  three times above the fold. Thin it out per P0-4.
- Consider one authentic scarcity/urgency element *only if true* (founding-member price,
  cohort cap for DFY). Don't fake it — a false timer would clash with the "no scam" brand.

---

## Suggested hero tweak (keeps your voice)

Current hero is strong; the changes are (a) a who-it's-for line and (b) CTA hierarchy.

> **eyebrow:** social besties · social media's confessional 🍒
> **h1:** you're already good at this. you just haven't been taught how to see it.
> **sub:** last year i did a billion views with my phone, a psych degree, and zero
> agency. whether you want to do it yourself, have me hand it to you, or build it into
> your team — there's a way in below.
> **who:** for creators doing it solo, and for practices + teams who want it handled or built in.
> **primary CTA (solid):** see the three ways in
> **secondary CTA (ghost):** book a call

---

## Verify-in-Membership.io checklist

Things I couldn't check without the rendered page / HTML — confirm these directly:

- [ ] Meta Pixel installed; `Lead`, `InitiateCheckout`, `Purchase` events fire
- [ ] GA4 (or equivalent) installed
- [ ] `<title>` + meta description are specific and keyword-aware
- [ ] OpenGraph image/title/description set (branded share card)
- [ ] Single `<h1>` per page; logical heading order
- [ ] Color contrast meets WCAG AA
- [ ] FAQ accordion keyboard-accessible with `aria-expanded`
- [ ] Stats marquee + pricing cards stack cleanly on mobile
- [ ] "book a call" links to a working scheduler (Calendly/etc.) with confirmation
- [ ] Checkout flow tested end-to-end on mobile (Apple Pay / card)
- [ ] Newsletter double-opt-in + welcome email wired up

---

## Quick-wins checklist (order to ship)

1. [ ] Add a cancel-anytime / guarantee line to the $99 Confessional card *(P0-2)*
2. [ ] Add member count near the Confessional CTA *(P0-1)*
3. [ ] Add 3–6 testimonials before the pricing section *(P0-1)*
4. [ ] Add 1–2 analytics/result screenshots under the hero *(P0-1)*
5. [ ] Demote "book a call" to secondary in the hero *(P0-4)*
6. [ ] Add one sentence under each "how it works" step *(P1-3)*
7. [ ] Swap the newsletter hook for a concrete freebie *(P1-4)*
8. [ ] Confirm/repair Meta Pixel + events *(P0-3)*
9. [ ] Set OG tags + page title/description *(P1-5)*
10. [ ] Add results disclaimer once testimonials are live *(P2-1)*
