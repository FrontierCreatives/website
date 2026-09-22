// ============================================================
// Supabase connection  ·  Frontier Creatives Live Quiz
// The publishable/anon key is safe to expose in a public site;
// access is controlled by the Row Level Security rules in schema.sql.
// ============================================================
window.FC_CONFIG = {
  SUPABASE_URL: "https://gqiptitarokaomfroejl.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_OVm9Av3oTwMsNITOKKv_qw_bAAz5aQg",

  // Password to open the moderator page. CHANGE THIS before your event.
  // Note: this is a light gate to stop casual access, not hardened security
  // (a determined person could read it in the page source). Real login is a
  // later upgrade via Supabase Auth.
  MODERATOR_PASSWORD: "frontier2026",

  // Shown as the eyebrow on every screen, whatever the database calls the quiz.
  EVENT_TITLE: "Vol. 04 · Interactive panel",

  // Questions containing any of these (whole word, any case) are refused on the
  // phone with a polite note. Extend freely. block.sql mirrors the list in the
  // database so it holds even if someone bypasses the page. Keep both in sync.
  BLOCKED_WORDS: ["hitler", "nazi", "nazis", "fuck", "fucking", "shit", "cunt", "retard", "retarded", "fag", "faggot", "rape"]
};
