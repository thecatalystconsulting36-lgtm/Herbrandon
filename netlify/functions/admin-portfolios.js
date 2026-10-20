// GET /api/admin  — list published pages; POST /api/admin {slug} — remove one. Needs ADMIN_KEY (Netlify env var).
const { getPortfolios } = require("./lib/store");
const { json, validSlug, safeEq, limited, clientIp } = require("./lib/util");

exports.handler = async (event) => {
  const key = process.env.ADMIN_KEY || "";
  if (key.length < 12) return json(500, { ok: false, error: "admin_key_not_set" });
  if (limited("adm:" + clientIp(event), 15, 15 * 60 * 1000)) return json(429, { ok: false });
  const auth = (event.headers.authorization || event.headers.Authorization || "").replace(/^Bearer\s+/i, "");
  if (!safeEq(auth, key)) return json(401, { ok: false });
  const store = getPortfolios(event);
  try {
    if (event.httpMethod === "GET") {
      const { blobs } = await store.list();
      const rows = [];
      for (const bl of (blobs || []).slice(0, 500)) {
        const r = await store.get(bl.key, { type: "json" });
        if (r && r.data) rows.push({ slug: bl.key, name: r.data.name, title: r.data.title, createdAt: r.createdAt, updatedAt: r.updatedAt });
      }
      rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      return json(200, { ok: true, pages: rows });
    }
    if (event.httpMethod === "POST") {
      const b = JSON.parse(event.body || "{}");
      if (!validSlug(b.slug)) return json(400, { ok: false });
      await store.delete(b.slug);
      return json(200, { ok: true });
    }
    return json(405, { ok: false });
  } catch (e) {
    console.error(e.message);
    return json(500, { ok: false });
  }
};
