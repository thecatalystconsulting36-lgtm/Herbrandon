// HER Brandon — registration handler: validates, stores in Airtable, finds common-interest matches.
// Env vars (Netlify → Site settings → Environment variables):
//   AIRTABLE_TOKEN    Personal access token (scopes: data.records:read, data.records:write; access to your base)
//   AIRTABLE_BASE_ID  e.g. appXXXXXXXXXXXXXX
//   ALLOWED_ORIGIN    optional, e.g. https://herbrandon.ca  (blocks other sites from posting)

const API = "https://api.airtable.com/v0";
const REG = "Registrations";
const hits = new Map(); // best-effort per-instance rate limit; Netlify also offers platform rate limiting

const res = (code, obj) => ({ statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) });
const clean = (v, max = 800) => String(v == null ? "" : v).replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const list = (a, max = 30) => (Array.isArray(a) ? a : []).map((x) => clean(x, 100).replace(/,/g, " ")).filter(Boolean).slice(0, max);
const join = (a) => a.join(", ");
const split = (t) => String(t || "").split(",").map((x) => x.trim()).filter(Boolean);
const yn = (b) => (b ? "Yes" : "No");
// Airtable formula/text formats choke on =, +, -, @ at the start of a cell in some exports (CSV injection); neutralise.
const safe = (s) => (/^[=+\-@]/.test(s) ? "'" + s : s);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Airtable allows ~5 requests/second per base. If two women register at the same moment, wait and retry instead of failing.
async function at(path, opts = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${API}/${process.env.AIRTABLE_BASE_ID}/${path}`, {
      ...opts,
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`, "Content-Type": "application/json", ...(opts.headers || {}) },
    });
    const t = await r.text();
    if (r.ok) return t ? JSON.parse(t) : {};
    if ((r.status === 429 || r.status >= 500) && attempt < 2) { await sleep(1200 * (attempt + 1)); continue; }
    throw new Error(`Airtable ${r.status}: ${t.slice(0, 300)}`);
  }
}

const overlap = (a = [], b = []) => a.filter((x) => b.includes(x));

function score(me, other) {
  const circles = overlap(me.circles, other.circles);
  const enjoy = overlap(me.enjoy, other.enjoy);
  const skills = overlap(me.skills, other.skills);
  const sameIndustry = me.industries && other.industries && me.industries.toLowerCase() === other.industries.toLowerCase();
  const prof = (r) => r.needs.some((n) => /Professional|Employment|Mentorship|business|Canadian/i.test(n));
  const helper = (r) => r.mentor === "Yes" || r.mentor === "Maybe";
  const complement = (prof(me) && helper(other)) || (prof(other) && helper(me));
  const bothFriends = me.needs.includes("Friendship and social connection") && other.needs.includes("Friendship and social connection");
  const s = circles.length * 3 + enjoy.length + skills.length + (sameIndustry ? 2 : 0) + (complement ? 2 : 0) + (bothFriends ? 1 : 0);
  const shared = [...circles, ...enjoy, ...skills, ...(sameIndustry ? ["same industry"] : []), ...(complement ? ["mentoring fit"] : [])];
  return { s, shared };
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return res(405, { ok: false });
  if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) return res(500, { ok: false });
  if ((event.body || "").length > 20000) return res(413, { ok: false });

  const origin = event.headers.origin || event.headers.Origin || "";
  if (process.env.ALLOWED_ORIGIN && origin && origin !== process.env.ALLOWED_ORIGIN) return res(403, { ok: false });

  const ip = event.headers["x-nf-client-connection-ip"] || (event.headers["x-forwarded-for"] || "").split(",")[0] || "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  if (recent.length >= 5) return res(429, { ok: false });
  hits.set(ip, [...recent, now]);

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return res(400, { ok: false }); }

  // Bots: filled honeypot or impossibly fast submit → pretend success, store nothing.
  if (body.hp || Number(body.elapsed) < 5000) return res(200, { ok: true });

  const r = body.registration || {};
  const first = clean(r.first, 60), last = clean(r.last, 60), email = clean(r.email, 120).toLowerCase();
  if (!first || !last || !/^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]{2,}$/.test(email)) return res(400, { ok: false, error: "invalid" });

  const consents = (Array.isArray(body.consents) ? body.consents : []).slice(0, 10);
  const given = (t) => consents.some((c) => c.type === t && c.given === true);
  if (!given("participation")) return res(400, { ok: false, error: "consent_required" });
  const version = clean((consents[0] || {}).version, 40) || "unknown";
  const stamp = new Date().toISOString(); // server time, not client time

  const me = {
    first, last, email,
    needs: list(r.needs), circles: list(r.circles), enjoy: list(r.enjoy), skills: list(r.skills),
    industries: clean(r.industries, 200), mentor: clean(r.mentor, 20),
  };

  try {
    // ONE read does two jobs: duplicate-email check + the pool of women who agreed to introductions (newest 100).
    // Airtable's free plan allows ~1,000 API calls/month, so we keep this to 2–3 calls per registration.
    const q = new URLSearchParams({
      pageSize: "100",
      filterByFormula: `OR(LOWER({Email})='${email}', {Intro Consent}='Yes')`,
    });
    ["First Name", "Last Name", "Email", "Needs", "Circles", "Enjoy", "Skills", "Industries", "Mentor Interest", "Match Suggestions"].forEach((f) => q.append("fields[]", f));
    q.append("sort[0][field]", "Submitted At");
    q.append("sort[0][direction]", "desc");
    const found = await at(`${REG}?${q}`);
    const existing = found.records || [];
    // Duplicate email → quietly succeed (don't reveal who is registered)
    if (existing.some((r) => String((r.fields || {}).Email || "").toLowerCase() === email)) return res(200, { ok: true });

    const consentLog = JSON.stringify(
      ["participation", "introduction", "contact", "group", "email"].map((t) => ({ type: t, given: given(t), at: stamp, version }))
    );
    const fields = {
      "First Name": safe(first), "Last Name": safe(last), "Preferred Name": safe(clean(r.pref, 60)), Email: email,
      Phone: safe(clean(r.phone, 30)), "Age Range": clean(r.age, 30), "Time in Brandon": clean(r.tenure, 40),
      Background: safe(clean(r.background, 80)), Languages: safe(clean(r.languages, 120)),
      Needs: join(me.needs), "Value Text": safe(clean(r.valueText, 800)),
      Profession: safe(clean(r.profession, 100)), Education: safe(clean(r.education, 120)), Skills: join(me.skills),
      "Business Experience": safe(clean(r.business, 200)), Services: safe(clean(r.services, 200)), Industries: safe(me.industries),
      "Interests Text": safe(clean(r.interests, 200)), "Good At": safe(clean(r.goodAt, 600)),
      "Mentor Interest": me.mentor, Enjoy: join(me.enjoy), Circles: join(me.circles),
      "Participation Consent": "Yes", "Intro Consent": yn(given("introduction")), "Contact Consent": yn(given("contact")),
      "Group Consent": yn(given("group")), "Email Consent": yn(given("email")),
      "Consent Version": version, "Consent Log": consentLog, "Submitted At": stamp, Status: "New",
    };
    Object.keys(fields).forEach((k) => fields[k] === "" && delete fields[k]);

    const created = await at(REG, { method: "POST", body: JSON.stringify({ records: [{ fields }], typecast: true }) });
    const id = created.records[0].id;

    // Common-interest matching — only among women who consented to being introduced; uses non-sensitive fields only.
    if (given("introduction")) {
      const pool = existing.filter((rec) => String((rec.fields || {}).Email || "").toLowerCase() !== email);
      const ranked = pool
        .map((rec) => {
          const f = rec.fields;
          const other = { needs: split(f.Needs), circles: split(f.Circles), enjoy: split(f.Enjoy), skills: split(f.Skills), industries: f.Industries || "", mentor: f["Mentor Interest"] || "" };
          return { rec, ...score(me, other) };
        })
        .filter((x) => x.s >= 3)
        .sort((a, b) => b.s - a.s)
        .slice(0, 3);

      if (ranked.length) {
        const mine = ranked.map((x) => `${x.rec.fields["First Name"]} ${x.rec.fields["Last Name"] || ""} <${x.rec.fields.Email}> · score ${x.s} · shared: ${x.shared.slice(0, 6).join(", ")}`).join(" | ");
        const updates = [{ id, fields: { "Match Suggestions": mine } }];
        ranked.forEach((x) => {
          const line = `${first} ${last} <${email}> · score ${x.s} · shared: ${x.shared.slice(0, 6).join(", ")}`;
          const prev = x.rec.fields["Match Suggestions"];
          updates.push({ id: x.rec.id, fields: { "Match Suggestions": prev ? `${prev} | ${line}` : line } });
        });
        await at(REG, { method: "PATCH", body: JSON.stringify({ records: updates, typecast: true }) });
      }
    }
    return res(200, { ok: true });
  } catch (e) {
    console.error(e.message); // logs stay in Netlify; nothing personal is returned to the browser
    return res(500, { ok: false });
  }
};
