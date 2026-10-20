# HER Brandon — quick setup (about 20 minutes, one time)

## Step 1 — Airtable (5 minutes, no typing of fields)
1. Go to airtable.com → **Create a base** → *Import data → CSV file* → choose `airtable-import/Registrations.csv`. Name the base "HER Brandon". Keep the table name **Registrations**. (There is only one table.)
2. If Airtable won't accept a header-only file, add any one dummy row to the CSV and delete that row in Airtable afterwards.
3. Optional: change **Match Suggestions** and **Consent Log** to *Long text* so they're easier to read. Everything else stays as it is.
4. Go to airtable.com/create/tokens → **Create token**. Scopes: `data.records:read` and `data.records:write`. Access: only your HER Brandon base. Copy the token.
5. Copy your Base ID: open airtable.com/api, pick the base, and copy the ID that starts with `app`.

**Consent records:** each row stores the consent choices in the *Consent Log* column (type, yes/no, date and time, version) as well as in the separate Yes/No columns. To record a withdrawal, change the Yes/No column to "No" and add a line to the log.

**Airtable free-plan limits (check Airtable's pricing page; they change):** about 1,000 records per base and about 1,000 API calls per month. Each registration uses one record and 2–3 calls, so the free plan covers roughly 330 registrations a month and 1,000 women in total. If you grow past that, upgrade (Team plan) or tell me and I'll help you move to another database.

## Step 2 — Netlify (10 minutes)
1. Create a free GitHub account, make a new **private** repository, and upload all the files from this folder (*Add file → Upload files*).
2. At netlify.com choose **Add new site → Import an existing project → GitHub**, pick the repository, and click **Deploy** (leave the build settings empty).
3. Open **Site configuration → Environment variables** and add:
   - `AIRTABLE_TOKEN` = the token from Step 1
   - `AIRTABLE_BASE_ID` = the Base ID from Step 1
   - `ALLOWED_ORIGIN` = your live site address (optional but recommended)
4. **Deploys → Trigger deploy → Deploy site**. Done.

Future changes: upload the changed file to GitHub and Netlify updates itself.

## How the matching works (automatic)
When a woman registers and ticks the introduction consent, the site compares her with every earlier woman who also ticked it. It scores shared HER Circles (most weight), enjoyed activities, skills, same industry and mentoring fit. It never uses age, background or immigration information. The best three suggestions (score 3 or more) appear in **Match Suggestions** on both women's rows, e.g. `Ada Obi <email> · score 6 · shared: Coffee & Conversation, Books`. You then review and contact both women; nothing is shared automatically.

Useful Airtable views: filter `Intro Consent` = Yes and `Match Suggestions` is not empty.

## Portfolio pages at herbrandon.com/ada-obi
Women can publish their portfolio at their own link. Pages are stored in **Netlify Blobs**, which is built into Netlify, so there is nothing extra to set up.

Add these in **Site configuration → Environment variables** (then redeploy):
- `ADMIN_KEY` — a long password you invent (12+ characters). It protects your admin page.
- `CONTACT_EMAIL` — `thecatalystconsulting36@gmail.com` (the address for the "Report this page" link on every portfolio).

**How it works:** the woman ticks a consent box, taps *Publish*, and gets a link plus a private **edit code**. With the code she can update or unpublish her page. If she loses it, you can remove her page from the admin page.

**Your admin page:** `yoursite/admin.html` → enter your `ADMIN_KEY` → see every published page, open it, or remove it.

**Privacy defaults:** published pages ask search engines not to list them (`noindex`), so a woman's name, photo and contact details don't turn up in Google. Pages show only what she typed. Limit: 1,500 pages during the pilot.

**Moderation:** check the admin page regularly, and write a short publishing and takedown policy to go with your Community Guidelines.

## Connect your domain (herbrandon.com)
1. Buy the domain at any registrar.
2. In Netlify: **Domain management → Add a domain**, then follow the DNS instructions it shows (add its records at your registrar, or switch to Netlify's nameservers).
3. Netlify adds the https certificate automatically. Then set `ALLOWED_ORIGIN` to `https://herbrandon.com`.

Portfolio links use whatever address the site is on, so they work on the free `.netlify.app` address now and switch to your domain by themselves later.

## Limits to watch (free plans — check each dashboard, plans change)
- **Netlify Free:** 300 credits a month, and it is a **hard stop**: if you use them all, the site pauses until the next month or you upgrade (Personal is about $9/month with 1,000 credits). Each live deploy costs 15 credits, so avoid dozens of redeploys. Visitors, registrations and portfolio views use very few credits at pilot size. Check *Usage* in Netlify weekly.
- **Airtable Free:** about 1,000 records and 1,000 API calls a month (see Step 1). Check the row count weekly and upgrade or archive before you reach about 800.
- **Netlify Blobs (portfolio pages):** included in your Netlify plan and drawn from the same credits. Netlify publishes no separate cap that I could find. The site stops accepting new portfolios at 1,500.
- **GitHub:** private repositories are free.
- **Meta ads:** only the budget you set.

## Before you go public
- Write real Privacy Notice, Terms and Guidelines (placeholders are in the site).
- Replace the contact email, social links and founder note.
- Keep your Airtable base private.
