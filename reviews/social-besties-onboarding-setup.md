# Social Besties — Membership.io Onboarding Setup & Verification

**Goal:** A new-member onboarding flow that (1) drives the **app download + notification opt-in**
(your free "text-like" push channel), (2) gets members into the **community** so it doesn't feel
empty, and (3) points them to their **first content** — then verify it end-to-end.

> I can't log into your hub, so this is a build guide + a checklist you run yourself.
> Menu names follow Membership.io's current help docs (linked at the bottom).

---

## How Membership.io onboarding works (the model)

- You build **custom onboarding page(s)** inside your private Hub.
- Each page can contain **onboarding videos** (short, 1–4 min) and **Member Attributes**
  (questions members answer about themselves).
- **Member Attributes** get saved to each member's profile and can power **Member Directory
  filters** and personalized recommendations.
- After finishing onboarding, members land on the **Hub homepage**. They go through onboarding
  **once** — next login goes straight to the homepage.

So the build is: **Attributes → Video(s) → Onboarding page(s) → Preview → Test.**

---

## The build (do these in order)

### Step 1 — Create Member Attributes (the questions)
Keep it to 3–4. More than that and people bail. Suggested set for the besties:

1. **your @ / handle** — short text. *Why: so besties can find each other in the directory.*
2. **where you're at** — single select: `just starting` · `posting sometimes` · `posting daily`.
   *Why: personalize what you point them to.*
3. **what you want most** — multi-select: `find my voice` · `batch faster` · `go viral` ·
   `land brand deals`. *Why: personalization + tells you what content to make.*
4. *(optional)* **phone + text opt-in** — short text field for number **plus a checkbox**:
   *"text me the drops 🍒 (msg & data rates may apply, reply STOP anytime)."*
   *Why: captures numbers + explicit consent now, so SMS is an option later without re-asking.
   Mark it optional — never gate onboarding on a phone number.*

### Step 2 — Record the welcome video (60–90 sec, phone is fine)
Script, in your voice:

> "hey bestie, welcome to the confessional 🍒 i'm so glad you're here. three quick things and
> you're set. **one:** download the app — link's right here — and say YES to notifications.
> that's how you get the trend drops and new stuff the *second* it's live, no email digging.
> **two:** answer the couple questions below so i can point you to the right stuff. **three:**
> head to the community and drop a hi + your @ so the besties can find you. that's it. you're
> already good at this — let's go."

Keep it unpolished and warm — it matches the brand and outperforms a produced intro.

### Step 3 — Build the onboarding page(s)
One page is enough. Layout, top to bottom:
1. **Welcome video** (Step 2).
2. **The 3 first steps** (as the page description / checklist text):
   - ✅ **download the app + turn on notifications** — [app link] *(this is how you get the drops)*
   - ✅ **say hi in the community** — drop your @ so we can find you — [community/space link]
   - ✅ **start here** — [link to Social Media 101 / the Vault]
3. **Member Attributes** (Step 1) below the steps.
Set a warm page **title** ("welcome to the confessional 🍒") and **description**.

### Step 4 — Welcome email (auto-send on join)
Welcome emails get very high open rates — put the app first.

> **Subject:** you're in, bestie 🍒
> **Body:** you just made a really good decision. welcome to the confessional.
> **do this first → download the app [link] and turn on notifications.** it's how you get the
> drops the second they're live. then come say hi in the community 👉 [login link].
> everything's waiting inside. — montana 🍒

### Step 5 — Make the app impossible to miss
Because push only works if they install + allow:
- App link is **step one** in both the onboarding page and the welcome email.
- Add a **pinned community post**: "new here? download the app + turn notifications on 🍒 [link]."
- Frame it as *the way in*, not optional: "this is how you get the drops."

---

## Verification checklist (run before you send traffic)

Test as a real new member would experience it.

**A. Walk the flow**
- [ ] Open **Preview** (front-end view) and review the onboarding page end-to-end.
- [ ] Create a **test member** (a second email / incognito window) and sign up fresh.
- [ ] Confirm the new signup **lands on the onboarding page** (not straight to the homepage).
- [ ] Answer the attributes → confirm you're taken to the **Hub homepage** after.

**B. Data saved correctly**
- [ ] Open the test member's **profile** → confirm attribute answers are stored.
- [ ] Go to **Member Directory** → confirm the attributes appear as **filters** and the test
      member shows up under them.
- [ ] If you added the phone/opt-in field → confirm the number + consent state saved.

**C. Notifications actually fire (the important one)**
- [ ] On the test device, **download the app** via your link → confirm it opens your hub.
- [ ] Confirm the app **prompts for notification permission**; tap **Allow**.
- [ ] Publish a test **broadcast post** with "**Notify all members**" ON.
- [ ] Confirm the test device receives: **push notification + email + in-hub alert.**
- [ ] Confirm the **welcome email** arrived at the test address.

**D. It behaves right**
- [ ] Log in **again** as the test member → confirm onboarding **does NOT repeat**.
- [ ] Repeat the walkthrough on **mobile and desktop**.
- [ ] Confirm every link (app, community, first content, login) **works and points to the right place**.
- [ ] Delete / reset the test member when done.

---

## Common gotchas
- **Push needs the app + permission.** Email reaches everyone; push only reaches app users who
  tapped Allow. Keep using broadcast posts (email + push + in-hub) so no one's left out.
- **iOS notification prompt is one-shot.** If a member taps "Don't Allow," it's buried in
  Settings after that — which is why the welcome video explicitly says "say YES to notifications."
- **Custom-branded app may be a higher plan/add-on.** Confirm it's included on your plan before
  building everything around it.
- **Broadcast posts are limited to once per day** and require at least the **Grow plan**.
- **Onboarding only runs once per member** — existing members won't see a newly added flow, so
  announce big changes via a broadcast post instead.

---

## Sources
- [Custom Member Onboarding — step-by-step](https://help.membership.io/guide-custom-member-onboarding)
- [Customize your Hub's onboarding page](https://help.membership.io/customize-your-hubs-onboarding-experience)
- [Default and custom Hub pages](https://help.membership.io/default-and-custom-hub-pages)
- [Getting started with Membership.io](https://help.membership.io/getting-started-with-membershipio)
- [Writing membership welcome letters](https://membership.io/blog/writing-membership-welcome-letters)
