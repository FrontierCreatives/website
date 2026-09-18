/* ============================================================
   Frontier Creatives — Live Quiz  ·  shared library
   Supabase client, theme, tally + chart renderers (no deps).
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

// Show a friendly banner if keys aren't set yet.
function fcRequireConfig() {
  if (FC.configured) return true;
  const el = document.getElementById("app") || document.body;
  el.innerHTML =
    '<div class="wrap"><div class="card"><p class="eyebrow">Setup needed</p>' +
    '<h2>Add your Supabase keys</h2>' +
    '<p class="hint">Open <b>config.js</b> and paste your project URL and anon key ' +
    '(Supabase → Settings → API). Then reload this page.</p></div></div>';
  return false;
}

// ---- Theme -------------------------------------------------
function fcInitTheme() {
  const saved = (() => { try { return localStorage.getItem("fc-theme"); } catch (e) { return null; } })();
  if (saved) document.documentElement.setAttribute("data-theme", saved);
  const btn = document.getElementById("themeToggle");
  if (btn) {
    const paint = () => {
      const cur = document.documentElement.getAttribute("data-theme")
        || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      btn.textContent = cur === "light" ? "◐ Dark" : "◑ Light";
    };
    paint();
    btn.onclick = () => {
      const cur = document.documentElement.getAttribute("data-theme")
        || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
      const next = cur === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("fc-theme", next); } catch (e) {}
      paint();
    };
  }
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

// ---- Color ramp (coral-led, restrained) --------------------
const FC_RAMP = ["#E76F51", "#F0987F", "#C2B5A1", "#7FA6A0", "#A9866E", "#8A7D6D", "#D9B26A"];
function fcColor(i) { return FC_RAMP[i % FC_RAMP.length]; }

// ---- Tally helpers -----------------------------------------
// Turn a set of response rows into ordered {label,count} for a question.
function fcTally(question, rows) {
  const counts = new Map();
  if (question.type === "word") {
    for (const r of rows) {
      const w = String(r.answer || "").trim().toLowerCase();
      if (!w) continue;
      counts.set(w, (counts.get(w) || 0) + 1);
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }
  // single / multi: seed with the defined options so zero-vote bars still show
  const opts = Array.isArray(question.options) ? question.options : [];
  for (const o of opts) counts.set(o, 0);
  for (const r of rows) {
    // multi answers are stored one row per choice, so this works for both
    let a = r.answer;
    // free-text "Other: their words" folds back onto the "Other" option for the chart
    if (!counts.has(a)) {
      const i = a.indexOf(": ");
      if (i > -1 && counts.has(a.slice(0, i))) a = a.slice(0, i);
    }
    counts.set(a, (counts.get(a) || 0) + 1);
  }
  return opts.map((label) => ({ label, count: counts.get(label) || 0 }));
}

// Extract free-text write-ins (answers stored as "Option: their words").
function fcWriteIns(rows) {
  const out = [];
  for (const r of rows || []) {
    const a = String(r.answer || ""), i = a.indexOf(": ");
    if (i > -1) out.push({ base: a.slice(0, i), text: a.slice(i + 2) });
  }
  return out;
}

// ---- Chart renderers (inline SVG / DOM, theme-aware) -------
function fcRenderBar(el, data, opts = {}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));
  const big = opts.big;
  el.innerHTML = data.map((d, i) => {
    const pct = Math.round((d.count / max) * 100);
    const share = total ? Math.round((d.count / total) * 100) : 0;
    return (
      '<div style="margin:' + (big ? "18px" : "12px") + ' 0">' +
        '<div class="spread" style="margin-bottom:6px">' +
          '<span style="font-weight:600;font-size:' + (big ? "1.4rem" : "1rem") + '">' + fcEsc(d.label) + '</span>' +
          '<span class="hint" style="font-size:' + (big ? "1.2rem" : ".9rem") + '">' + d.count + ' · ' + share + '%</span>' +
        '</div>' +
        '<div style="height:' + (big ? "26px" : "16px") + ';background:var(--surface-2);border-radius:8px;overflow:hidden">' +
          '<div style="height:100%;width:' + pct + '%;background:' + fcColor(i) + ';border-radius:8px;transition:width .5s cubic-bezier(.2,.7,.2,1)"></div>' +
        '</div>' +
      '</div>'
    );
  }).join("") || fcEmpty();
}

function fcRenderPie(el, data, opts = {}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const big = opts.big;
  const R = 100, C = 2 * Math.PI * R;
  if (!total) { el.innerHTML = fcEmpty(); return; }
  let acc = 0;
  const rings = data.map((d, i) => {
    const frac = d.count / total;
    const dash = frac * C;
    const seg = '<circle r="' + R + '" cx="0" cy="0" fill="none" stroke="' + fcColor(i) +
      '" stroke-width="' + (big ? 70 : 60) + '" stroke-dasharray="' + dash + ' ' + (C - dash) +
      '" stroke-dashoffset="' + (-acc) + '" transform="rotate(-90)"></circle>';
    acc += dash;
    return seg;
  }).join("");
  const size = big ? 360 : 260;
  el.innerHTML =
    '<div style="display:flex;gap:28px;flex-wrap:wrap;align-items:center;justify-content:center">' +
      '<svg viewBox="-140 -140 280 280" width="' + size + '" height="' + size + '">' + rings + '</svg>' +
      '<div class="legend" style="flex-direction:column;gap:10px">' +
        data.map((d, i) => {
          const share = Math.round((d.count / total) * 100);
          return '<span class="key" style="font-size:' + (big ? "1.15rem" : ".95rem") + '">' +
            '<span class="sw" style="background:' + fcColor(i) + '"></span>' +
            fcEsc(d.label) + ' — ' + d.count + ' (' + share + '%)</span>';
        }).join("") +
      '</div>' +
    '</div>';
}

function fcRenderCloud(el, data, opts = {}) {
  const big = opts.big;
  if (!data.length) { el.innerHTML = fcEmpty("No words yet"); return; }
  const max = Math.max(...data.map((d) => d.count));
  const min = big ? 1.1 : 0.9, span = big ? 4.6 : 2.6;
  el.innerHTML = '<div class="cloud">' + data.map((d, i) => {
    const size = (min + (d.count / max) * span).toFixed(2);
    const weight = d.count === max ? 600 : 500;
    const col = i < 3 ? "var(--coral)" : "var(--ink)";
    const op = 0.55 + 0.45 * (d.count / max);
    return '<span class="w" style="font-size:' + size + 'rem;font-weight:' + weight +
      ';color:' + col + ';opacity:' + op.toFixed(2) + '">' + fcEsc(d.label) + '</span>';
  }).join("") + '</div>';
}

function fcRenderChart(mode, el, question, rows, opts = {}) {
  const data = fcTally(question, rows);
  if (question.type === "word" || mode === "cloud") return fcRenderCloud(el, data, opts);
  if (mode === "pie") return fcRenderPie(el, data, opts);
  return fcRenderBar(el, data, opts);
}

function fcEmpty(msg) { return '<p class="hint center" style="padding:24px 0">' + (msg || "Waiting for responses…") + '</p>'; }
function fcEsc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

// ---- Moderator password gate (shared by moderate + results) ----
function fcGate(onUnlock) {
  const ok = (() => { try { return sessionStorage.getItem("fc-mod-ok") === "1"; } catch (e) { return false; } })();
  if (ok) { onUnlock(); return; }
  const view = document.getElementById("view");
  const draw = (msg) => {
    view.innerHTML = '<div class="card" style="max-width:420px;margin:8vh auto 0">' +
      '<p class="eyebrow">Moderator access</p><h2 style="margin:.3rem 0 0">Enter password</h2>' +
      '<input id="pw" type="password" class="mt" placeholder="Password" autocomplete="off" />' +
      (msg ? '<p class="err mt">' + msg + '</p>' : '') +
      '<button class="btn primary mt" style="width:100%" id="pwBtn">Unlock</button></div>';
    const pw = document.getElementById("pw"); pw.focus();
    const tryit = () => {
      if (pw.value && pw.value === (window.FC_CONFIG.MODERATOR_PASSWORD || "")) {
        try { sessionStorage.setItem("fc-mod-ok", "1"); } catch (e) {}
        onUnlock();
      } else { draw("That password didn't match. Try again."); }
    };
    document.getElementById("pwBtn").onclick = tryit;
    pw.addEventListener("keydown", (e) => { if (e.key === "Enter") tryit(); });
  };
  draw();
}

// ---- Download helper (works on the deployed site) ----
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
