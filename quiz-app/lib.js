/* ============================================================
   Frontier Creatives · Interactive panel · shared library
   Supabase client, theme, figures, audience-question helpers.
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

// ---- Event title -------------------------------------------
function fcTitle(fallback) {
  return (window.FC_CONFIG && window.FC_CONFIG.EVENT_TITLE) || fallback || "Frontier Creatives";
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

// ---- QR with the mark inside -------------------------------
// Draws into a live element (never serialize a canvas), at error
// correction H so the centre can carry the star and still scan.
function fcMountQR(el, url, size) {
  if (!el) return;
  el.innerHTML = "";
  el.classList.add("qr");
  if (window.QRCode) {
    new QRCode(el, { text: url, width: size, height: size, colorDark: "#000000", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.H });
  }
  const mark = document.createElement("img");
  mark.src = "../assets/logo/fc-mark-light-bg.svg";
  mark.alt = "";
  mark.className = "qr-mark";
  mark.style.width = mark.style.height = Math.round(size * .24) + "px";
  el.appendChild(mark);
}

// ---- The animated mark (standalone treatment: full weight, full opacity) ----
// The loop lives in assets/logo. Video first (smooth), GIF if video can't play.
function fcAnimatedMark(kind) {
  const wide = kind === "band";
  const mp4 = wide ? "../assets/logo/fc-mark-hero-2400.mp4" : "../assets/logo/fc-mark-animated-800.mp4";
  return '<video class="animark' + (wide ? " band" : "") + '" autoplay muted loop playsinline preload="auto" aria-hidden="true"' +
    (wide ? ' poster="../assets/logo/fc-mark-hero-2400-poster.jpg"' : '') + '>' +
    '<source src="' + mp4 + '" type="video/mp4" onerror="fcMarkFallback(this)" />' +
    '</video>';
}
// Swap to the GIF when the browser can't play the mp4 (or blocks autoplay).
function fcMarkFallback(src) {
  const v = src.closest ? src.closest("video") : src;
  if (!v || !v.parentNode) return;
  const img = document.createElement("img");
  const wide = v.classList.contains("band");
  img.className = "animark" + (wide ? " band" : ""); img.alt = "";
  img.src = wide ? "../assets/logo/fc-mark-hero-2400-poster.jpg" : "../assets/logo/fc-mark-animated-800.gif";
  v.replaceWith(img);
}
function fcWatchMark(root) {
  (root || document).querySelectorAll("video.animark").forEach((v) => {
    const p = v.play && v.play();
    if (p && p.catch) p.catch(() => fcMarkFallback(v));
    setTimeout(() => { if (v.isConnected && (v.readyState === 0 || v.paused)) fcMarkFallback(v); }, 2500);
  });
}

// ---- Text --------------------------------------------------
// House rule: no em-dashes on any surface. Whatever the source (a
// phone's autocorrect, old copy), a dash becomes a comma before it renders.
function fcClean(s) { return String(s).replace(/\s*[—–]\s*/g, ", ").replace(/,\s*([.,;:!?])/g, "$1"); }
function fcEsc(s) { return fcClean(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function fcEmpty(msg) { return '<p class="empty">' + (msg || "Nothing yet") + '</p>'; }

// ---- Blocklist ---------------------------------------------
// Whole-word match, case-insensitive, after collapsing the usual
// dodges (spacing, punctuation between letters, repeated letters).
function fcBlocked(text) {
  const words = (window.FC_CONFIG && window.FC_CONFIG.BLOCKED_WORDS) || [];
  if (!words.length) return false;
  const norm = String(text).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/(.)\1+/g, "$1");
  return words.some((w) => {
    const spaced = w.toLowerCase().replace(/(.)\1+/g, "$1").split("").join("\\s*");
    return new RegExp("\\b" + spaced + "s?\\b").test(norm);
  });
}

// ---- Audience question status vocabulary -------------------
// pending → queued → live → asked, or dismissed. Only one is live.
const FC_STATUS = { pending: "New", queued: "Queued", live: "On the floor", asked: "Asked", dismissed: "Dismissed" };
function fcStatusLabel(s) { return FC_STATUS[s] || s; }
const FC_CHEV = '<svg class="chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';

// Load the room's questions for the active event, most votes first.
async function fcLoadQuestions(sb, eventId, statuses) {
  if (!eventId) return [];
  let qy = sb.from("audience_questions").select("*").eq("quiz_id", eventId);
  if (statuses) qy = qy.in("status", statuses);
  const { data } = await qy.order("votes", { ascending: false }).order("created_at");
  return data || [];
}

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
      } else { draw("That password didn&rsquo;t match."); }
    };
    document.getElementById("pwBtn").onclick = tryit;
    pw.addEventListener("keydown", (e) => { if (e.key === "Enter") tryit(); });
  };
  draw();
}

// ---- Placement jig (dev only: add ?jig to the URL) ----------
// Any element with data-jig="name" becomes draggable (position) and
// wheel-scalable (size). A draggable HUD lists every value with a
// Copy all button; paste the list back and the values get baked in.
// Drag the HUD by its title. Hold Shift while wheeling for fine steps.
function fcJig() {
  if (!new URLSearchParams(location.search).has("jig")) return;
  const state = {};
  const hud = document.createElement("div");
  hud.id = "fcjig";
  hud.style.cssText = "position:fixed;left:16px;top:16px;z-index:9999;background:rgba(0,0,0,.92);color:#F2EDE5;font:12px/1.5 ui-monospace,Menlo,monospace;padding:10px 12px;border-radius:10px;min-width:280px;max-width:420px;box-shadow:0 10px 30px rgba(0,0,0,.6);user-select:none";
  hud.innerHTML = '<div id="fcjigT" style="cursor:move;font-weight:700;margin-bottom:6px;color:#E9805E">JIG · drag to move · wheel to scale · shift = fine</div><pre id="fcjigV" style="margin:0;white-space:pre-wrap;user-select:text"></pre><button id="fcjigC" style="margin-top:8px;padding:6px 10px;border:0;border-radius:999px;background:#BE4A2B;color:#fff;font:600 12px Inter,system-ui;cursor:pointer">Copy all</button>';
  document.body.appendChild(hud);
  const fmt = (n) => (Math.round(n * 10) / 10).toString();
  function report() {
    const lines = [];
    for (const [name, st] of Object.entries(state)) {
      const r = st.el.getBoundingClientRect();
      lines.push(name + ":  dx " + fmt(st.dx) + "px (" + fmt(st.dx / innerWidth * 100) + "vw)  dy " + fmt(st.dy) + "px (" + fmt(st.dy / innerHeight * 100) + "vh)  scale " + fmt(st.s) +
        "  | box " + fmt(r.width) + "x" + fmt(r.height) + " at " + fmt(r.left) + "," + fmt(r.top) + " (h " + fmt(r.height / innerHeight * 100) + "vh, right gap " + fmt((innerWidth - r.right) / innerWidth * 100) + "vw)");
    }
    lines.push("viewport " + innerWidth + "x" + innerHeight);
    document.getElementById("fcjigV").textContent = lines.join("\n");
  }
  function apply(st) { st.el.style.transform = "translate(" + st.dx + "px," + st.dy + "px) scale(" + st.s + ")"; st.el.style.transformOrigin = "center"; }
  function attach(el) {
    const name = el.dataset.jig; if (!name || state[name]) return;
    const st = state[name] = { el, dx: 0, dy: 0, s: 1 };
    el.style.cursor = "grab"; el.style.outline = "1px dashed rgba(233,128,94,.6)"; el.style.outlineOffset = "4px"; el.style.pointerEvents = "auto";
    let drag = null;
    el.addEventListener("pointerdown", (e) => { drag = { x: e.clientX - st.dx, y: e.clientY - st.dy }; el.setPointerCapture(e.pointerId); e.preventDefault(); });
    el.addEventListener("pointermove", (e) => { if (!drag) return; st.dx = e.clientX - drag.x; st.dy = e.clientY - drag.y; apply(st); report(); });
    el.addEventListener("pointerup", () => { drag = null; });
    el.addEventListener("wheel", (e) => { e.preventDefault(); const step = e.shiftKey ? .01 : .04; st.s = Math.max(.1, st.s * (e.deltaY < 0 ? 1 + step : 1 - step)); apply(st); report(); }, { passive: false });
  }
  const scan = () => { document.querySelectorAll("[data-jig]").forEach(attach); report(); };
  new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  scan();
  let hd = null;
  const t = document.getElementById("fcjigT");
  t.addEventListener("pointerdown", (e) => { hd = { x: e.clientX - hud.offsetLeft, y: e.clientY - hud.offsetTop }; t.setPointerCapture(e.pointerId); });
  t.addEventListener("pointermove", (e) => { if (!hd) return; hud.style.left = (e.clientX - hd.x) + "px"; hud.style.top = (e.clientY - hd.y) + "px"; });
  t.addEventListener("pointerup", () => { hd = null; });
  document.getElementById("fcjigC").onclick = () => { navigator.clipboard.writeText(document.getElementById("fcjigV").textContent).then(() => { document.getElementById("fcjigC").textContent = "Copied"; setTimeout(() => { document.getElementById("fcjigC").textContent = "Copy all"; }, 1500); }); };
  addEventListener("resize", report);
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
