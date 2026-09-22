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

// ---- Text --------------------------------------------------
// House rule: no em-dashes on any surface. Whatever the source (a
// phone's autocorrect, old copy), a dash becomes a comma before it renders.
function fcClean(s) { return String(s).replace(/\s*[—–]\s*/g, ", ").replace(/,\s*([.,;:!?])/g, "$1"); }
function fcEsc(s) { return fcClean(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function fcEmpty(msg) { return '<p class="empty">' + (msg || "Nothing yet") + '</p>'; }

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
