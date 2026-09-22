/* ============================================================
   Frontier Creatives · Live quiz and panel · shared library
   Supabase client, theme, figures, tally + chart renderers.
   No dependencies beyond supabase-js.
   ============================================================ */

// ---- Supabase client ---------------------------------------
const FC = (function () {
  const cfg = window.FC_CONFIG || {};
  const configured =
    cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("PASTE") &&
    cfg.SUPABASE_ANON_KEY && !cfg.SUPABASE_ANON_KEY.startsWith("PASTE");
  let client = null;
  if (configured && window.supabase) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
  return { client, configured };
})();

function fcRequireConfig() {
  if (FC.configured) return true;
  const el = document.getElementById("view") || document.body;
  el.innerHTML =
    '<span class="eyebrow">Setup needed</span><h2>Add the Supabase keys</h2>' +
    '<p class="hint">Open <b>config.js</b> and paste the project URL and anon key ' +
    '(Supabase, Settings, API). Then reload this page.</p>';
  return false;
}

// ---- Theme -------------------------------------------------
// Dark is the only surfaced mode. ?light is the projector / print fallback.
function fcInitTheme() {
  const light = new URLSearchParams(location.search).has("light");
  document.documentElement.setAttribute("data-theme", light ? "light" : "dark");
}

// ---- Participant identity ----------------------------------
function fcParticipantId() {
  try {
    let id = localStorage.getItem("fc-pid");
    if (!id) { id = "p_" + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("fc-pid", id); }
    return id;
  } catch (e) {
    return "p_" + Math.random().toString(36).slice(2);
  }
}

// ---- Figures as texture ------------------------------------
// Places a master SVG from assets/textures under a similarity
// transform (scale, rotation, centre), never regenerated. Field
// stroke comes from CSS (.field svg line).
const FC_FIGURES = {};
function fcFigure(name) {
  if (!FC_FIGURES[name]) {
    FC_FIGURES[name] = fetch("../assets/textures/fc-figure-" + name + ".svg")
      .then((r) => r.ok ? r.text() : "")
      .then((t) => { const m = t.match(/<line[^>]*>/g); return m ? m.join("") : ""; })
      .catch(() => "");
  }
  return FC_FIGURES[name];
}
// opts: { scale, rot, cx, cy } in the host element's pixel space, plus
// an optional `box` [w,h] the coordinates were designed against; the
// field is scaled to the host on render.
async function fcField(host, name, opts) {
  const lines = await fcFigure(name);
  if (!lines || !host || !host.isConnected) return;
  const box = opts.box || [1600, 900];
  const s = opts.scale || 1, r = opts.rot || 0, cx = opts.cx ?? box[0] * .75, cy = opts.cy ?? box[1] * .5;
  let layer = host.classList.contains("field") ? host : host.querySelector(":scope > .field");
  if (!layer) { layer = document.createElement("div"); layer.className = "field"; host.classList.add("has-field"); host.prepend(layer); }
  layer.innerHTML =
    '<svg viewBox="0 0 ' + box[0] + ' ' + box[1] + '" preserveAspectRatio="xMidYMid slice" ' +
      'style="left:0;top:0;width:100%;height:100%" aria-hidden="true">' +
      '<g fill="none" stroke-linecap="round" transform="translate(' + cx + ' ' + cy + ') rotate(' + r + ') scale(' + s + ') translate(-400 -400)">' +
        lines + '</g></svg>';
}

// ---- Chart color: one coral, the rest a neutral ramp by rank -
// The leading option takes the accent; everything else recedes
// through the text tokens. No category coding, per the guide.
function fcRampColor(rank, n, isMax, count) {
  if (count === 0) return "var(--border)";
  if (isMax) return "var(--coral)";
  const stops = ["#C4BBB0", "#A69C92", "#877E74", "#6A625B", "#4C443C", "#3E362F"];
  const light = document.documentElement.getAttribute("data-theme") === "light";
  const stopsL = ["#4C443C", "#6A625B", "#877E74", "#A69C92", "#C8C0B5", "#E5DED4"];
  const arr = light ? stopsL : stops;
  const t = n <= 2 ? 0 : (rank - 1) / (n - 2);
  return arr[Math.min(arr.length - 1, Math.round(t * (arr.length - 1)))];
}
function fcColors(data) {
  const max = Math.max(0, ...data.map((d) => d.count));
  const order = data.map((d, i) => i).sort((a, b) => data[b].count - data[a].count || a - b);
  const rank = new Array(data.length);
  order.forEach((idx, r) => { rank[idx] = r; });
  return data.map((d, i) => fcRampColor(rank[i], data.length, max > 0 && d.count === max, d.count));
}

// ---- Tally helpers -----------------------------------------
function fcTally(question, rows) {
  const counts = new Map();
  if (question.type === "word") {
    for (const r of rows) {
      const w = String(r.answer || "").trim().toLowerCase();
      if (!w) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }
  const opts = Array.isArray(question.options) ? question.options : [];
  for (const o of opts) counts.set(o, 0);
  for (const r of rows) {
    let a = r.answer;
    if (!counts.has(a)) {
      const i = a.indexOf(": ");
      if (i > -1 && counts.has(a.slice(0, i))) a = a.slice(0, i);
    }
    counts.set(a, (counts.get(a) || 0) + 1);
  }
  return opts.map((label) => ({ label, count: counts.get(label) || 0 }));
}
function fcWriteIns(rows) {
  const out = [];
  for (const r of rows || []) {
    const a = String(r.answer || ""), i = a.indexOf(": ");
    if (i > -1) out.push({ base: a.slice(0, i), text: a.slice(i + 2) });
  }
  return out;
}

// ---- Chart renderers ---------------------------------------
function fcRenderBar(el, data, opts = {}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));
  const cols = fcColors(data);
  el.classList.toggle("big", !!opts.big);
  const two = opts.two != null ? opts.two : (opts.big && data.length >= 7);
  el.innerHTML = data.length ? '<div class="bars' + (two ? " two" : "") + '">' + data.map((d, i) => {
    const pct = Math.round((d.count / max) * 100);
    const share = total ? Math.round((d.count / total) * 100) : 0;
    return '<div class="bar"><div class="lab"><span class="t">' + fcEsc(d.label) + '</span>' +
      '<span class="v">' + d.count + ' · ' + share + '%</span></div>' +
      '<div class="track"><div class="fill" style="width:' + pct + '%;background:' + cols[i] + '"></div></div></div>';
  }).join("") + '</div>' : fcEmpty();
}

function fcRenderPie(el, data, opts = {}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  el.classList.toggle("big", !!opts.big);
  if (!total) { el.innerHTML = fcEmpty(); return; }
  const cols = fcColors(data);
  const R = 100, C = 2 * Math.PI * R;
  let acc = 0;
  const rings = data.map((d, i) => {
    const dash = (d.count / total) * C;
    const seg = '<circle r="' + R + '" cx="0" cy="0" fill="none" stroke="' + cols[i] +
      '" stroke-width="' + (opts.big ? 64 : 56) + '" stroke-dasharray="' + dash + ' ' + (C - dash) +
      '" stroke-dashoffset="' + (-acc) + '" transform="rotate(-90)"></circle>';
    acc += dash;
    return seg;
  }).join("");
  const size = opts.big ? "clamp(240px, 26vw, 400px)" : "240px";
  el.innerHTML =
    '<div class="pie"><svg viewBox="-135 -135 270 270" style="width:' + size + ';height:auto">' + rings + '</svg>' +
      '<div class="legend">' + data.map((d, i) =>
        '<span class="key"><span class="sw" style="background:' + cols[i] + '"></span>' +
        '<b>' + fcEsc(d.label) + '</b><span>' + d.count + ' · ' + Math.round((d.count / total) * 100) + '%</span></span>'
      ).join("") + '</div></div>';
}

function fcRenderCloud(el, data, opts = {}) {
  el.classList.toggle("big", !!opts.big);
  if (!data.length) { el.innerHTML = fcEmpty("No words yet"); return; }
  const max = Math.max(...data.map((d) => d.count));
  const min = opts.big ? 1.4 : 1.0, span = opts.big ? 4.2 : 2.2;
  el.innerHTML = '<div class="cloud">' + data.map((d, i) => {
    const size = (min + (d.count / max) * span).toFixed(2);
    const op = (0.55 + 0.45 * (d.count / max)).toFixed(2);
    return '<span class="w' + (i < 3 ? " top" : "") + '" style="--fs:' + size + 'rem;font-size:' + size + 'rem;opacity:' + op + '">' + fcEsc(d.label) + '</span>';
  }).join("") + '</div>';
}

function fcRenderChart(mode, el, question, rows, opts = {}) {
  const data = fcTally(question, rows);
  if (question.type === "word" || mode === "cloud") return fcRenderCloud(el, data, opts);
  if (mode === "pie") return fcRenderPie(el, data, opts);
  return fcRenderBar(el, data, opts);
}
function fcRenderWriteIns(el, rows, opts = {}) {
  const wi = fcWriteIns(rows);
  if (!wi.length) { el.innerHTML = ""; return; }
  const items = wi.slice(0, opts.limit || 12);
  el.innerHTML = opts.inline
    ? '<div class="writeins inline"><span class="marker">Write-ins</span> <span class="wi">' + items.map((w) => fcEsc(w.text)).join('<span class="sep"> · </span>') + '</span></div>'
    : '<div class="writeins"><span class="eyebrow muted">Write-ins</span>' + items.map((w) => '<div class="wi">' + fcEsc(w.text) + '</div>').join("") + '</div>';
}

function fcEmpty(msg) { return '<p class="empty">' + (msg || "Waiting for answers") + '</p>'; }
// House rule: no em-dashes on any surface. Whatever the source (old seed
// copy, a phone's autocorrect), a dash becomes a comma before it renders.
function fcClean(s) { return String(s).replace(/\s*[\u2014\u2013]\s*/g, ", ").replace(/,\s*([.,;:!?])/g, "$1"); }
function fcEsc(s) { return fcClean(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// ---- Audience question status vocabulary -------------------
// pending → queued → live → asked, or dismissed. Only one is live.
const FC_STATUS = { pending: "New", queued: "Queued", live: "On the floor", asked: "Asked", dismissed: "Dismissed" };
function fcStatusLabel(s) { return FC_STATUS[s] || s; }

// ---- Moderator password gate -------------------------------
function fcGate(onUnlock) {
  const ok = (() => { try { return sessionStorage.getItem("fc-mod-ok") === "1"; } catch (e) { return false; } })();
  if (ok) { onUnlock(); return; }
  const view = document.getElementById("view");
  const draw = (msg) => {
    view.innerHTML = '<div style="max-width:380px">' +
      '<span class="eyebrow">Moderator</span><h2>Enter the password</h2>' +
      '<input id="pw" type="password" class="mt" placeholder="Password" autocomplete="current-password" />' +
      (msg ? '<p class="hint err">' + msg + '</p>' : '') +
      '<button class="btn primary wide mt" id="pwBtn">Unlock</button></div>';
    const pw = document.getElementById("pw"); pw.focus();
    const tryit = () => {
      if (pw.value && pw.value === (window.FC_CONFIG.MODERATOR_PASSWORD || "")) {
        try { sessionStorage.setItem("fc-mod-ok", "1"); } catch (e) {}
        onUnlock();
      } else { draw("That password did not match."); }
    };
    document.getElementById("pwBtn").onclick = tryit;
    pw.addEventListener("keydown", (e) => { if (e.key === "Enter") tryit(); });
  };
  draw();
}

// ---- Download helpers --------------------------------------
function fcDownload(filename, text, mime) {
  const blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}
function fcCsvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
