// The survey. Each phone gets one question, in rotation by scan order.
// multi: pick any number, then Done. none: the answer that clears the others.
// The key is what the database stores: keep it stable if you change the wording,
// so answers can be added up across volumes.
window.FC_SURVEY = [
  { key: "why", q: "What brings you to Frontier Creatives?",
    opts: ["Figure out where to start with AI", "See how others work", "Meet people", "Job search", "Hear the speakers", "Other"] },
  { key: "between", q: "Between events, what would you actually use?", multi: true, none: "Nothing, I come for the room",
    opts: ["A place to keep talking with people I met", "Online talks or workshops", "A newsletter with recaps and resources", "Nothing, I come for the room"] },
  { key: "online", q: "Where do you already talk shop with other creatives online?", multi: true, none: "Nowhere yet",
    opts: ["LinkedIn", "Discord", "Slack", "Instagram", "Nowhere yet"] },
  { key: "best", q: "What was the best part of tonight?",
    opts: ["The talks", "The panel", "The small groups", "Meeting people"] }
];
