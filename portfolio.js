// GET /:slug  — serves a published portfolio page (rewritten from netlify.toml).
const { getPortfolios } = require("./lib/store");
const { validSlug } = require("./lib/util");
const { buildPage, esc } = require("./lib/template");

const SECURITY = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};
const notFound = () => ({
  statusCode: 404,
  headers: { ...SECURITY, "Cache-Control": "no-store" },
  body: `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page not found · HER Brandon</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fdf8f1;color:#4a3a52;font:17px/1.7 system-ui,sans-serif;text-align:center;padding:1.5rem}h1{font-family:Georgia,serif;color:#3b2644}a{color:#5b3d78;font-weight:700}</style></head><body><div><h1>We couldn’t find that page.</h1><p>It may have been unpublished or the link may be mistyped.</p><p><a href="/">Visit HER Brandon</a></p></div></body></html>`,
});

exports.handler = async (event) => {
  const slug = (event.queryStringParameters && event.queryStringParameters.slug) || "";
  if (!validSlug(slug)) return notFound();
  try {
    const rec = await getPortfolios(event).get(slug, { type: "json" });
    if (!rec || !rec.data) return notFound();
    const html = buildPage(rec.data, { robots: true, report: process.env.CONTACT_EMAIL || "" });
    return { statusCode: 200, headers: { ...SECURITY, "Cache-Control": "public, max-age=60" }, body: html };
  } catch (e) {
    console.error(e.message);
    return notFound();
  }
};
