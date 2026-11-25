/* Reads desk state from a private data pointer in the URL hash (#d=...).
   The hash is never sent to GitHub Pages. Fetches use referrerpolicy=no-referrer.
   No analytics and no third-party scripts. */
(function () {
  "use strict";
  const statusEl = document.getElementById("status");
  const tsEl = document.getElementById("timestamp");
  const POLL_MS = 15000;

  function dataUrlFromHash() {
    const raw = (location.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(raw.includes("=") ? raw : "");
    const d = params.get("d") || (raw.startsWith("d=") ? raw.slice(2) : "");
    if (!d) return null;
    // Accepted form: g/<id>/state.json  (secret gist raw, built here, never hardcoded)
    const m = /^g\/([a-f0-9]+)\/([A-Za-z0-9_.-]+)$/.exec(d);
    if (!m) return null;
    return "https://gist.githubusercontent.com/smithvirgie/" + m[1] + "/raw/" + m[2];
  }

  async function load() {
    const base = dataUrlFromHash();
    if (!base) {
      statusEl.textContent = "No data link in the URL. Add your private #d= pointer.";
      statusEl.className = "";
      tsEl.textContent = "";
      return;
    }
    const url = base + (base.includes("?") ? "&" : "?") + "t=" + Date.now();
    try {
      const res = await fetch(url, {
        cache: "no-store",
        referrerPolicy: "no-referrer",
        credentials: "omit",
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      const ts = data.ts || data.timestamp || data.updatedAt || "";
      statusEl.textContent = "State loaded.";
      statusEl.className = "ok";
      tsEl.textContent = ts ? ("Updated: " + ts) : "State has no timestamp field.";
    } catch (err) {
      statusEl.textContent = "Could not load state.";
      statusEl.className = "err";
      tsEl.textContent = "";
    }
  }

  load();
  setInterval(load, POLL_MS);
  window.addEventListener("hashchange", load);
})();
