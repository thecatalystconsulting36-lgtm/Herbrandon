// Portfolio page template — keep identical to buildPage() in index.html (used for the live preview).
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function buildPage(d,opts){opts=opts||{};
  const ini=d.name.split(/\s+/).map(w=>w[0]||"").slice(0,2).join("").toUpperCase();
  const photo=d.photo?`<img class="ph" src="${d.photo}" alt="Photo of ${esc(d.name)}">`:`<div class="ph ini" aria-hidden="true">${esc(ini)}</div>`;
  const chips=d.skills.map(s=>`<li>${esc(s)}</li>`).join("");
  const bio=d.story.split(/\n{2,}/).filter(p=>p.trim()).map(p=>`<p>${esc(p.trim()).replace(/\n/g,"<br>")}</p>`).join("");
  const subj=encodeURIComponent("Hello "+d.name.split(" ")[0]+" — I found your portfolio");
  const btns=[`<a class="btn primary" href="mailto:${esc(d.email)}?subject=${subj}">✉ Email me</a>`];
  if(d.wa)btns.push(`<a class="btn" href="https://wa.me/${esc(d.wa)}" target="_blank" rel="noopener">💬 WhatsApp me</a>`);
  if(d.tel)btns.push(`<a class="btn" href="tel:${esc(d.tel)}">📞 Call me</a>`);
  const desc=esc((d.title+". "+d.story).slice(0,155));
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${opts.robots?'<meta name="robots" content="noindex,nofollow">':""}
<title>${esc(d.name)} — ${esc(d.title)}</title><meta name="description" content="${desc}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box}html{background:#fdf8f1}body{margin:0;background:transparent;color:#4a3a52;font-family:"DM Sans",system-ui,sans-serif;font-size:17px;line-height:1.7;min-height:100vh}
.orbs{position:fixed;inset:0;z-index:-1;overflow:hidden;pointer-events:none;background:#fdf8f1}.orbs i{position:absolute;border-radius:50%;filter:blur(70px);opacity:.65}
.orbs i:nth-child(1){width:440px;height:440px;left:-130px;top:-80px;background:#f3c9d3}.orbs i:nth-child(2){width:480px;height:480px;right:-180px;top:35%;background:#d9c8ee}.orbs i:nth-child(3){width:400px;height:400px;left:15%;bottom:-150px;background:#f1e0b8;opacity:.5}
.wrap{width:min(880px,100% - 2.5rem);margin-inline:auto}
header{padding:3.5rem 0 1.5rem;text-align:center}
header .wrap,section .wrap{background:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.8);box-shadow:0 12px 36px rgba(91,61,120,.12),inset 0 1px 0 rgba(255,255,255,.85);-webkit-backdrop-filter:blur(16px) saturate(140%);backdrop-filter:blur(16px) saturate(140%);border-radius:30px;padding:2.2rem 1.6rem}
.ph{width:168px;height:168px;border-radius:50%;object-fit:cover;border:4px solid rgba(255,255,255,.9);box-shadow:0 0 0 2px #d9bd82,0 14px 34px rgba(91,61,120,.18);margin:0 auto 1.4rem;display:block}
.ini{display:grid;place-items:center;background:linear-gradient(135deg,#f8e6e8,#efe8f5);color:#7d5a9a;font:600 3.2rem "DM Sans",system-ui,sans-serif}
h1,h2{font-family:"DM Sans",system-ui,sans-serif;color:#3b2644;line-height:1.1;margin:0 0 .4em}h1{font-size:clamp(2.4rem,8vw,3.8rem)}h2{font-size:clamp(1.8rem,5vw,2.4rem)}
.role{font-family:"DM Sans",system-ui,sans-serif;font-style:italic;font-weight:600;font-size:clamp(1.3rem,4vw,1.8rem);color:#a85d73;margin:0 0 1.4rem}
.rule{width:64px;height:1px;background:#b8934a;margin:0 auto 1.6rem;border:0}
section{padding:1rem 0}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.95rem 1.6rem;border-radius:999px;border:1.5px solid #7d5a9a;color:#5b3d78;font-weight:700;text-decoration:none;min-height:48px;background:rgba(255,255,255,.7)}
.btn.primary{background:linear-gradient(135deg,#8a67a8,#5b3d78);color:#fff;border-color:#b8934a;box-shadow:0 10px 24px rgba(91,61,120,.3),inset 0 1px 0 rgba(255,255,255,.35)}
.btn:focus-visible{outline:3px solid #7d5a9a;outline-offset:3px}
.skills{list-style:none;padding:0;margin:1rem 0 0;display:flex;flex-wrap:wrap;gap:.6rem}
.skills li{background:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.9);border-radius:999px;padding:.55rem 1.1rem;font-weight:500;color:#3b2644;box-shadow:0 4px 12px rgba(91,61,120,.08)}
.contact{text-align:center}
.cta{display:flex;flex-wrap:wrap;gap:.8rem;justify-content:center;margin:1.4rem 0}
footer{text-align:center;font-size:.85rem;color:#6e5d77;padding:1.6rem 1rem}
footer a{color:#5b3d78}
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){header .wrap,section .wrap{background:rgba(255,255,255,.93)}}
@media print{.orbs{display:none}header .wrap,section .wrap{box-shadow:none;background:#fff}.btn{border:1px solid #999;box-shadow:none}}
</style></head><body><div class="orbs" aria-hidden="true"><i></i><i></i><i></i></div>
<header><div class="wrap">${photo}<h1>${esc(d.name)}</h1><p class="role">${esc(d.title)}</p><hr class="rule"><a class="btn primary" href="#contact">Contact me</a></div></header>
<main>
<section><div class="wrap"><h2>About me</h2>${bio}</div></section>
<section><div class="wrap"><h2>What I can do</h2><ul class="skills">${chips}</ul></div></section>
<section class="contact" id="contact"><div class="wrap"><h2>Let’s connect</h2><p>I’d love to hear from you. Get in touch and let’s talk.</p><div class="cta">${btns.join("")}</div></div></section>
</main>
<footer>Created with HER Brandon · Opportunity. Friendship. Belonging.${opts.report?` · <a href="mailto:${esc(opts.report)}?subject=${encodeURIComponent("Report a portfolio page")}">Report this page</a>`:""}</footer>
</body></html>`;
}
module.exports = { buildPage, esc };
