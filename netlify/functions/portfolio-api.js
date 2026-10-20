// POST /api/portfolio  — publish, update or unpublish a woman's portfolio page.
const crypto = require("crypto");
const { getPortfolios } = require("./lib/store");
const { json, slugify, validSlug, sanitize, sha, safeEq, limited, clientIp } = require("./lib/util");

const MAX_PAGES = 1500; // pilot safety cap

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { ok: false });
  if ((event.body || "").length > 700000) return json(413, { ok: false });
  const origin = event.headers.origin || event.headers.Origin || "";
  if (process.env.ALLOWED_ORIGIN && origin && origin !== process.env.ALLOWED_ORIGIN) return json(403, { ok: false });
  if (limited("pf:" + clientIp(event), 8, 10 * 60 * 1000)) return json(429, { ok: false, error: "slow_down" });

  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return json(400, { ok: false }); }
  const store = getPortfolios(event);

  try {
    // ---- unpublish ----
    if (b.action === "unpublish") {
      if (!validSlug(b.slug) || !b.token) return json(400, { ok: false });
      const rec = await store.get(b.slug, { type: "json" });
      if (!rec || !safeEq(rec.tokenHash, sha(b.token))) return json(403, { ok: false, error: "bad_code" });
      await store.delete(b.slug);
      return json(200, { ok: true });
    }

    // ---- publish / update ----
    if (b.action !== "publish") return json(400, { ok: false });
    if (b.consent !== true) return json(400, { ok: false, error: "consent_required" });
    if (b.hp || Number(b.elapsed) < 3000) return json(200, { ok: true, slug: "thanks" }); // bots: pretend, store nothing
    const v = sanitize(b.data);
    if (!v.ok) return json(400, { ok: false, error: v.error });
    const now = new Date().toISOString();

    if (b.slug && b.token) { // update an existing page
      if (!validSlug(b.slug)) return json(400, { ok: false });
      const rec = await store.get(b.slug, { type: "json" });
      if (!rec || !safeEq(rec.tokenHash, sha(b.token))) return json(403, { ok: false, error: "bad_code" });
      await store.setJSON(b.slug, { ...rec, data: v.data, updatedAt: now, consentAt: now });
      return json(200, { ok: true, slug: b.slug });
    }

    const list = await store.list();
    if ((list.blobs || []).length >= MAX_PAGES) return json(503, { ok: false, error: "full" });
    const base = slugify(v.data.name);
    let slug = base, n = 1;
    while (await store.get(slug, { type: "json" })) { n++; slug = n <= 30 ? `${base}-${n}` : "member-" + crypto.randomBytes(3).toString("hex"); }
    const token = crypto.randomBytes(24).toString("base64url");
    await store.setJSON(slug, { data: v.data, tokenHash: sha(token), createdAt: now, updatedAt: now, consentAt: now });
    return json(200, { ok: true, slug, token });
  } catch (e) {
    console.error(e.message);
    return json(500, { ok: false });
  }
};
