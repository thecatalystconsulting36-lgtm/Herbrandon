const crypto = require("crypto");

const json = (code, obj) => ({ statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(obj) });
const clean = (v, max = 800) => String(v == null ? "" : v).replace(/<[^>]*>/g, "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

const RESERVED = new Set(["api", "admin", "assets", "favicon", "index", "robots", "sitemap", "netlify", "static", "privacy", "terms", "guidelines", "join", "about", "contact", "portfolio", "portfolios", "p", "login", "register", "her", "herbrandon", "member", "members", "home", "www", "mail", "support", "help"]);
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function slugify(name) {
  let s = String(name || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "");
  if (s.length < 3 || RESERVED.has(s)) s = "member-" + crypto.randomBytes(2).toString("hex");
  return s;
}
const validSlug = (s) => typeof s === "string" && s.length >= 3 && s.length <= 48 && SLUG_RE.test(s);

// Validate + sanitise everything again on the server; never trust the browser.
function sanitize(d) {
  d = d || {};
  const name = clean(d.name, 60), title = clean(d.title, 70);
  const skills = [...new Set((Array.isArray(d.skills) ? d.skills : []).map((s) => clean(s, 60)).filter(Boolean))].slice(0, 12);
  const story = String(d.story || "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 900);
  const email = clean(d.email, 120).toLowerCase();
  const ph = clean(d.phone, 30), digits = ph.replace(/\D/g, "");
  if (!name || !title || !skills.length || story.length < 20) return { ok: false, error: "missing" };
  if (!/^[^\s@'"\\]+@[^\s@'"\\]+\.[^\s@'"\\]{2,}$/.test(email)) return { ok: false, error: "email" };
  if (ph && (digits.length < 7 || digits.length > 15)) return { ok: false, error: "phone" };
  let photo = "";
  if (d.photo) {
    if (typeof d.photo !== "string" || d.photo.length > 450000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(d.photo)) return { ok: false, error: "photo" };
    photo = d.photo;
  }
  return { ok: true, data: { name, title, skills, story, email, tel: ph ? (ph.startsWith("+") ? "+" : "") + digits : "", wa: digits.length >= 7 ? digits : "", photo } };
}

const sha = (t) => crypto.createHash("sha256").update(String(t)).digest("hex");
function safeEq(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Best-effort in-memory limiter (per warm function instance).
const buckets = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) { buckets.set(key, arr); return true; }
  arr.push(now); buckets.set(key, arr); return false;
}
const clientIp = (event) => event.headers["x-nf-client-connection-ip"] || (event.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";

module.exports = { json, clean, slugify, validSlug, sanitize, sha, safeEq, limited, clientIp, RESERVED };
