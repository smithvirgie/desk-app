/* Desk iPhone app. Plan B: #d= pointer, poll 15s, cache-busted raw gist files.
   The hash is never sent to GitHub Pages. No third-party scripts, no made-up numbers. */
(function () {
  "use strict";

  const POLL_MS = 15000;
  const GIST_OWNER = "smithvirgie";
  const POINTER_KEY = "desk.pointer";
  const COLORS = {
    scanner: "#64d2ff",
    analyst: "#ffd60a",
    brain: "#bf5af2",
    executor: "#00d35a",
    risk: "#ff6b9a",
  };
  const BOT_ORDER = ["scanner", "analyst", "brain", "executor", "risk"];
  const RANGES = ["LIVE", "1H", "4H", "1D", "1W", "ALL"];
  const SETTING_GROUPS = [
    { title: "Scanner", keys: ["min_liquidity_usd", "max_top10_pct", "max_h1_change_pct", "scanner_poll_s", "min_pool_age_min", "max_wait_min", "runner_h24_pct", "min_holders_growth_pct"] },
    { title: "Analyst", keys: ["max_dev_pct", "min_lp_locked_pct", "max_bundled", "max_insiders_pct", "max_delegated_accounts", "retries", "min_score", "alive_volume_h1", "fast_curve_min", "max_fresh_pct", "organic_unique_h1", "organic_buys_h1", "bundled_penalty", "flush_sell_ratio", "chase_h1_pct"] },
    { title: "Social", keys: ["social_weight", "social_max_per_h", "social_timeout_s", "shill_cut"] },
    { title: "Market mode", keys: ["red_btc_h1_pct", "red_sol_h1_pct", "red_h4_pct", "red_tp_x", "red_trail_pct", "quiet_grads_h", "quiet_max_positions", "green_after_min", "regime_poll_min"] },
    { title: "Narratives", keys: ["narratives", "narrative_every_h", "news_exit_min"] },
    { title: "Vault and lessons", keys: ["vault_live_note_s", "lesson_archive_nights", "lesson_propose_hits", "cold_wallet_losses", "missed_check_h"] },
    { title: "Copy picks", keys: ["picks_every", "picks_time", "picks_top", "picks_shortlist", "picks_min_trades", "picks_last_trade_h", "picks_one_coin_poll", "max_on_copy", "copy_poll_s", "copy_delay_s", "copy_size_pct", "copy_stop_pct"] },
    { title: "Repos", keys: ["timesfm_every_min", "debate_timeout_s", "tools_timeout_s"] },
    { title: "Brain", keys: ["risk_per_trade_pct", "full_size_score", "below_full_pct", "max_pool_pct", "min_ticket_usd", "max_ticket_usd", "max_trades_night"] },
    { title: "Executor", keys: ["dip_pct", "dip_window_min", "dip_wait_min", "crash_pct", "tp_x", "tp_sell_pct", "trail_pct", "recheck_liq_drop_pct", "recheck_price_up_pct", "quote_timeout_s", "verify_timeout_s"] },
    { title: "Risk", keys: ["risk_poll_s", "stop_pct", "timeout_h", "timeout_min_gain_pct", "night_loss_stop_pct"] },
    { title: "Desk", keys: ["paper_start_cash", "night_start", "lock_time", "report_time", "notifier", "fomo_handle", "withdraw_address", "rpc_url", "push_rejects", "fee_pct"] },
  ];
  const SETTING_RANGE = {
    min_liquidity_usd: [1000, 200000], max_top10_pct: [1, 80], max_h1_change_pct: [10, 1000],
    scanner_poll_s: [5, 300], min_pool_age_min: [0, 180], max_wait_min: [1, 240],
    runner_h24_pct: [50, 2000], min_holders_growth_pct: [0, 100], max_dev_pct: [0, 50],
    min_lp_locked_pct: [0, 100], max_bundled: [0, 50], max_insiders_pct: [0, 80],
    max_delegated_accounts: [0, 50], retries: [0, 10], min_score: [0, 100],
    alive_volume_h1: [0, 500000], fast_curve_min: [0, 60], max_fresh_pct: [0, 100],
    organic_unique_h1: [0, 500], organic_buys_h1: [0, 1000], bundled_penalty: [0, 5],
    flush_sell_ratio: [0, 5], chase_h1_pct: [0, 1000], social_weight: [0, 2],
    social_max_per_h: [0, 100], social_timeout_s: [5, 600], shill_cut: [0, 2],
    red_btc_h1_pct: [0, 20], red_sol_h1_pct: [0, 20], red_h4_pct: [0, 30],
    red_tp_x: [1, 5], red_trail_pct: [1, 90], quiet_grads_h: [0, 100],
    quiet_max_positions: [0, 10], green_after_min: [0, 180], regime_poll_min: [1, 60],
    narratives: [0, 20], narrative_every_h: [1, 24], news_exit_min: [0, 180],
    vault_live_note_s: [1, 120], lesson_archive_nights: [1, 30], lesson_propose_hits: [1, 20],
    cold_wallet_losses: [1, 20], missed_check_h: [1, 48], picks_top: [1, 20],
    picks_shortlist: [5, 200], picks_min_trades: [1, 200], picks_last_trade_h: [1, 168],
    picks_one_coin_poll: [10, 600], max_on_copy: [0, 10], copy_poll_s: [1, 120],
    copy_delay_s: [0, 300], copy_size_pct: [1, 100], copy_stop_pct: [1, 90],
    risk_per_trade_pct: [0.1, 20], full_size_score: [50, 100], below_full_pct: [1, 100],
    max_pool_pct: [0.1, 20], min_ticket_usd: [1, 100], max_ticket_usd: [2, 10000],
    max_trades_night: [1, 100], dip_pct: [1, 80], dip_window_min: [1, 120],
    dip_wait_min: [1, 180], crash_pct: [5, 90], tp_x: [1, 10], tp_sell_pct: [1, 100],
    trail_pct: [1, 90], recheck_liq_drop_pct: [1, 80], recheck_price_up_pct: [1, 80],
    quote_timeout_s: [1, 60], verify_timeout_s: [5, 120], risk_poll_s: [1, 60],
    stop_pct: [1, 90], timeout_h: [1, 24], timeout_min_gain_pct: [0, 50],
    night_loss_stop_pct: [1, 90], paper_start_cash: [10, 100000], fee_pct: [0, 5],
    timesfm_every_min: [1, 1440], debate_timeout_s: [1, 600], tools_timeout_s: [1, 600],
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const main = $("#main");
  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    pointer: null,
    route: "home",
    routeMint: null,
    range: "LIVE",
    sellPct: 50,
    status: "loading", // loading | ok | empty | error | gate
    error: null,
    retryIn: 15,
    lastOkAt: null,
    lastGood: null,
    state: null,
    chart: null,
    activity: null,
    orders: null,
    account: null,
    settings: null,
    screen: null,
    coin: null,
    audit: null,
    decisions: {},
    screenBuf: 0,
  };

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parsePointer(raw) {
    if (!raw) return null;
    let s = String(raw).trim();
    try { s = decodeURIComponent(s); } catch (_) {}
    const hash = s.includes("#") ? s.slice(s.indexOf("#") + 1) : s;
    const params = new URLSearchParams(hash.includes("=") ? hash : "");
    let d = params.get("d") || "";
    if (!d && hash.startsWith("d=")) d = hash.slice(2).split("&")[0];
    if (!d) d = s;
    d = d.replace(/^#/, "");
    const gist = /^g\/([a-f0-9]+)\/([A-Za-z0-9_.-]+)$/i.exec(d);
    if (gist) return { kind: "gist", id: gist[1], file: gist[2], key: "g/" + gist[1] + "/" + gist[2] };
    const rawUrl = /gist\.githubusercontent\.com\/[^/]+\/([a-f0-9]+)\/raw\/(?:[^/]+\/)?([A-Za-z0-9_.-]+)/i.exec(s);
    if (rawUrl) return { kind: "gist", id: rawUrl[1], file: rawUrl[2], key: "g/" + rawUrl[1] + "/" + rawUrl[2] };
    // Localhost fixture used only by the screenshot script, never advertised.
    if (/^https?:\/\/(127\.0\.0\.1|localhost)[:/]/i.test(d) && /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      const u = d.replace(/\/?state\.json$/i, "").replace(/\/$/, "");
      return { kind: "local", base: u, key: u };
    }
    return null;
  }

  function pointerFromLocation() {
    const fromHash = parsePointer(location.hash || "");
    if (fromHash) return fromHash;
    try { return parsePointer(localStorage.getItem(POINTER_KEY) || ""); } catch (_) { return null; }
  }

  function savePointer(p) {
    store.pointer = p;
    try { if (p && p.key) localStorage.setItem(POINTER_KEY, p.key); } catch (_) {}
    const path = currentPath();
    const d = p && p.kind === "gist" ? "d=" + p.key : (p && p.kind === "local" ? "d=" + encodeURIComponent(p.base) : "");
    const rest = path && path !== "home" ? "&p=" + encodeURIComponent(path + (store.routeMint ? "/" + store.routeMint : "")) : "";
    const next = "#" + d + rest;
    if (location.hash !== next) history.replaceState(null, "", next);
  }

  function currentPath() {
    const params = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    const p = (params.get("p") || store.route || "home").replace(/^\//, "");
    return p || "home";
  }

  function readRoute() {
    const params = new URLSearchParams((location.hash || "").replace(/^#/, ""));
    const p = (params.get("p") || "home").replace(/^\//, "");
    const parts = p.split("/").filter(Boolean);
    store.route = parts[0] || "home";
    store.routeMint = parts[1] || null;
  }

  function go(path, mint) {
    store.route = path;
    store.routeMint = mint || null;
    if (store.pointer) savePointer(store.pointer);
    else {
      const next = "#p=" + encodeURIComponent(path + (mint ? "/" + mint : ""));
      if (location.hash !== next) history.replaceState(null, "", next);
    }
    render();
    if (mint && (path === "coin" || path === "audit")) loadDetail(mint);
  }

  function fileUrl(name) {
    const p = store.pointer;
    if (!p) return null;
    const bust = "t=" + Date.now();
    if (p.kind === "gist") {
      return "https://gist.githubusercontent.com/" + GIST_OWNER + "/" + p.id + "/raw/" + name + "?" + bust;
    }
    return p.base + "/" + name + "?" + bust;
  }

  async function getJson(name) {
    const url = fileUrl(name);
    if (!url) throw new Error("no pointer");
    const res = await fetch(url, { cache: "no-store", referrerPolicy: "no-referrer", credentials: "omit" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  function mintFile(prefix, mint) {
    const safe = String(mint || "").replace(/[^A-Za-z0-9]/g, "");
    return prefix + "_" + safe + ".json";
  }

  let pollTimer = null;
  let retryTimer = null;

  async function refresh() {
    if (!store.pointer) {
      store.status = "gate";
      render();
      return;
    }
    const first = !store.state && !store.lastGood;
    if (first) store.status = "loading";
    renderChrome();
    if (first) render();
    try {
      const [state, chart, activity, orders, account, settings, screen] = await Promise.all([
        getJson("state.json"),
        getJson("chart.json"),
        getJson("activity.json"),
        getJson("orders.json"),
        getJson("account.json"),
        getJson("settings.json"),
        getJson("screen.json").catch(() => null),
      ]);
      store.state = state;
      store.chart = chart;
      store.activity = activity;
      store.orders = orders;
      store.account = account;
      store.settings = settings;
      store.screen = screen;
      store.lastGood = { state, chart, activity, orders, account, settings, screen };
      store.lastOkAt = new Date();
      store.error = null;
      store.status = "ok";
      store.retryIn = POLL_MS / 1000;
      if (store.routeMint) loadDetail(store.routeMint);
      render();
    } catch (err) {
      store.error = err;
      store.status = store.lastGood ? "error" : "error";
      store.retryIn = POLL_MS / 1000;
      if (store.lastGood) {
        store.state = store.lastGood.state;
        store.chart = store.lastGood.chart;
        store.activity = store.lastGood.activity;
        store.orders = store.lastGood.orders;
        store.account = store.lastGood.account;
        store.settings = store.lastGood.settings;
        store.screen = store.lastGood.screen;
      }
      render();
    }
  }

  async function loadDetail(mint) {
    if (!mint || !store.pointer) return;
    try {
      const [coin, audit, ...decs] = await Promise.all([
        getJson(mintFile("coin", mint)).catch(() => null),
        getJson(mintFile("audit", mint)).catch(() => null),
        ...BOT_ORDER.map((n) => getJson("bots_" + n + "_decisions.json").catch(() => null)),
      ]);
      store.coin = coin;
      store.audit = audit;
      BOT_ORDER.forEach((n, i) => { if (decs[i]) store.decisions[n] = decs[i]; });
      if (store.route === "coin" || store.route === "audit" || store.route === "bots") render();
    } catch (_) {}
  }

  function startPoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(refresh, POLL_MS);
    if (retryTimer) clearInterval(retryTimer);
    retryTimer = setInterval(() => {
      if (store.status === "error" && store.retryIn > 0) {
        store.retryIn -= 1;
        const bar = $("#error-bar");
        if (bar && !bar.classList.contains("hidden")) bar.innerHTML = errorText();
      }
    }, 1000);
  }

  function errorText() {
    const when = store.lastOkAt ? relTime(store.lastOkAt) : "never";
    const n = Math.max(0, store.retryIn | 0);
    return "Desk offline · retrying in " + n + "s · last updates " + when;
  }

  function relTime(d) {
    if (!d) return "";
    const dt = d instanceof Date ? d : new Date(d);
    if (isNaN(dt)) return "";
    const s = Math.max(0, Math.round((Date.now() - dt.getTime()) / 1000));
    if (s < 5) return "just now";
    if (s < 60) return s + "s ago";
    if (s < 3600) return Math.round(s / 60) + "m ago";
    return dt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  function money(n, d) {
    if (n == null || n === "" || isNaN(Number(n))) return null;
    const x = Number(n);
    const sign = x < 0 ? "-" : "";
    return sign + "$" + Math.abs(x).toLocaleString(undefined, { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  }

  function fmtPct(n) {
    if (n == null || isNaN(Number(n))) return null;
    const x = Number(n);
    const sign = x > 0 ? "+" : "";
    return sign + x.toFixed(2) + "%";
  }

  function botTitle(n) {
    return ({ scanner: "Scanner", analyst: "Analyst", brain: "Brain", executor: "Executor", risk: "Risk" })[n] || n;
  }

  function useState() {
    return store.state || (store.lastGood && store.lastGood.state) || null;
  }

  /* ---------- odometer ---------- */
  function renderOdometer(el, value) {
    if (!el) return;
    if (value == null || isNaN(Number(value))) {
      el.innerHTML = "";
      return;
    }
    const text = Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const reduce = reduceMotion();
    el.innerHTML = '<span class="currency">$</span><span class="digits"></span>';
    const digits = el.querySelector(".digits");
    const chars = text.split("");
    chars.forEach((ch, i) => {
      if (!/[0-9]/.test(ch)) {
        const s = document.createElement("span");
        s.className = "odo-sep";
        s.textContent = ch;
        digits.appendChild(s);
        return;
      }
      const col = document.createElement("div");
      col.className = "digit-col";
      for (let n = 0; n <= 9; n++) {
        const s = document.createElement("span");
        s.textContent = String(n);
        col.appendChild(s);
      }
      const digit = Number(ch);
      digits.appendChild(col);
      const apply = () => {
        const unit = (col.firstElementChild && col.firstElementChild.offsetHeight) || 72;
        col.style.transform = "translateY(-" + (digit * unit) + "px)";
      };
      if (reduce) apply();
      else setTimeout(apply, 30 * i);
    });
  }

  /* ---------- chrome ---------- */
  function renderChrome() {
    const st = useState();
    const paper = st ? (st.paper !== false && st.mode !== "LIVE") : true;
    const avatar = $("#btn-avatar");
    const handle = (store.account && store.account.fomo_handle) || "";
    avatar.textContent = handle ? handle.slice(0, 1).toUpperCase() : "G";
    const coinBtn = $("#nav-coin");
    const pos = st && st.positions && st.positions[0];
    if (pos && (pos.symbol || pos.name || pos.mint)) {
      coinBtn.classList.remove("hidden");
      coinBtn.textContent = (pos.symbol || pos.name || shortMint(pos.mint)) + " ›";
      coinBtn.onclick = () => go("coin", pos.mint);
    } else {
      coinBtn.classList.add("hidden");
    }
    const rows = (store.activity && (store.activity.rows || store.activity.items)) || [];
    const bell = $("#bell-dot");
    if (rows.length) bell.classList.remove("hidden"); else bell.classList.add("hidden");

    const bar = $("#error-bar");
    if (store.status === "error") {
      bar.classList.remove("hidden");
      bar.textContent = errorText();
    } else {
      bar.classList.add("hidden");
    }
    $$(".tab").forEach((t) => {
      t.classList.toggle("on", t.dataset.tab === tabOf(store.route));
    });
  }

  function tabOf(route) {
    if (route === "account" || route === "coin" || route === "audit") return route === "account" ? "account" : (route === "bots" ? "bots" : tabOfLast());
    if (route === "bots") return "bots";
    if (route === "activity") return "activity";
    return "home";
  }
  let lastTab = "home";
  function tabOfLast() { return lastTab; }

  function shortMint(m) { return m ? String(m).slice(0, 4) + "…" + String(m).slice(-4) : ""; }

  /* ---------- screens ---------- */
  function render() {
    renderChrome();
    if (!store.pointer) { renderGate(); return; }
    if ((store.status === "loading" || store.status === "error") && !store.lastGood) { renderLoading(); return; }
    const route = store.route;
    if (route === "bots") { lastTab = "bots"; renderBots(); }
    else if (route === "activity") { lastTab = "activity"; renderActivity(); }
    else if (route === "account") { lastTab = "account"; renderAccount(); }
    else if (route === "coin") renderCoin();
    else if (route === "audit") renderAudit();
    else { lastTab = "home"; renderHome(); }
  }

  function renderGate() {
    main.innerHTML = '<section class="gate">' +
      "<h1>Paste your desk link</h1>" +
      "<p>The public page has no data of its own. Paste the private desk link you were given. It stays on this phone.</p>" +
      '<input id="ptr-input" type="text" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Paste your desk link">' +
      '<button class="btn primary" id="ptr-save" type="button">Save</button>' +
      "</section>";
    const save = () => {
      const p = parsePointer($("#ptr-input").value);
      if (!p) { $("#ptr-input").style.borderColor = "#ff453a"; return; }
      savePointer(p);
      refresh();
      startPoll();
    };
    $("#ptr-save").onclick = save;
    $("#ptr-input").addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
  }

  function renderLoading() {
    main.innerHTML =
      '<div class="hero"><div class="skel" style="height:72px;width:70%;"></div>' +
      '<div class="skel" style="height:24px;width:50%;margin-top:12px;"></div></div>' +
      '<div class="chart-wrap"><div class="skel" style="height:180px;border-radius:16px;"></div></div>' +
      '<div class="live-card skel" style="height:200px;margin-top:16px;"></div>' +
      '<div class="section-h"><div class="skel" style="height:20px;width:120px;"></div></div>' +
      '<div class="carousel"><div class="bot-card skel"></div><div class="bot-card skel"></div></div>';
  }

  function renderHome() {
    const st = useState();
    const paper = st ? (st.paper !== false && st.mode !== "LIVE") : false;
    const bal = st && (st.balance != null ? st.balance : (st.equity != null ? st.equity : st.cash));
    const today = st && st.todayPct;
    const mult = st && st.multiplier;
    const marketMode = ((st && st.marketMode) || "").toUpperCase();
    const marketLabel = (st && (st.marketLabel || st.marketMode)) || "";
    let marketText = "";
    let marketClass = "green";
    if (st) {
      if (marketMode === "RED") { marketText = marketLabel ? ("Red mode · " + marketLabel) : "Red mode"; marketClass = "red"; }
      else if (marketMode === "QUIET") { marketText = "Quiet"; marketClass = "quiet"; }
      else { marketText = "Green market"; marketClass = "green"; }
    }

    const todayTxt = fmtPct(today);
    const todayClass = today > 0 ? "up" : (today < 0 ? "down" : "");
    const running = st ? ((st.bots || []).filter((b) => b.status !== "paused").length) : null;

    main.innerHTML =
      '<section class="hero">' +
        '<div class="hero-row">' +
          '<div class="odo" id="odo"></div>' +
          (paper ? '<span class="paper-badge">PAPER</span>' : "") +
        "</div>" +
        '<div class="hero-meta">' +
          (todayTxt != null ? '<span class="today ' + todayClass + '">' + escapeHtml(todayTxt) + " today</span>" : "") +
          (mult != null && !isNaN(Number(mult)) ? '<span class="pill mult">' + escapeHtml(Number(mult).toFixed(2) + "x") + "</span>" : "") +
          (marketText ? '<span class="pill market ' + marketClass + '">' + escapeHtml(marketText) + "</span>" : "") +
        "</div>" +
      "</section>" +
      '<section class="chart-wrap"><div class="chart-canvas-box"><canvas id="equity-chart"></canvas></div>' +
        '<div class="ranges" id="ranges">' + RANGES.map((r) =>
          '<button type="button" data-range="' + r + '" class="' + (store.range === r ? "on" : "") + '">' + r + "</button>"
        ).join("") + "</div></section>" +
      liveCardHtml() +
      '<div class="section-h"><h2>Bots</h2>' + (running != null ? '<span class="sub">' + running + " running</span>" : "") + "</div>" +
      '<div class="carousel" id="bot-carousel">' + botCardsHtml(true) + "</div>" +
      '<div class="section-h"><h2>Activity</h2></div>' +
      activityHtml(5, { empty: "Waiting for the first trade" });

    renderOdometer($("#odo"), bal);
    drawEquity();
    $$("#ranges button").forEach((b) => b.addEventListener("click", () => {
      store.range = b.dataset.range;
      $$("#ranges button").forEach((x) => x.classList.toggle("on", x === b));
      drawEquity();
    }));
    bindLiveCard();
    bindActivity();
  }

  function drawEquity() {
    const canvas = $("#equity-chart");
    if (!canvas || !window.DeskChart) return;
    const ranges = (store.chart && store.chart.ranges) || {};
    const series = ranges[store.range] || ranges.LIVE || { points: [], marks: [] };
    DeskChart.drawLine(canvas, series);
  }

  function liveCardHtml() {
    const screen = store.screen;
    const orders = (store.orders && store.orders.rows) || [];
    const last = orders[0];
    const st = useState();
    const laneBot = laneBotName(st, last);
    const age = screen && screen.ts ? (Date.now() - Date.parse(screen.ts)) / 1000 : Infinity;
    const fresh = isFinite(age) && age < 5;
    const paused = screen && screen.status === "Paused · private";
    const hasImg = !paused && screen && screen.image;
    const label = !hasImg ? "No frame yet" : (fresh ? "Live · Bot's computer" : "Last frame " + relTime(screen.ts));
    const laneColor = COLORS[(laneBot.name || "").toLowerCase()] || "#fff";
    const laneText = laneBot.busy ? (botTitle(laneBot.name) + " · " + laneBot.busy) : "Idle";
    let orderLine = "No orders yet";
    let checks = "";
    if (last) {
      const side = last.side === "sell" ? "Sold" : "Bought";
      const usd = last.fill_usd != null ? money(last.fill_usd) : (last.usd != null ? money(last.usd) : "");
      const ver = last.status === "done" && last.checks && last.checks.screen && last.checks.api && last.checks.chain
        ? "verified" : (last.status || "");
      orderLine = [side, last.mint ? shortMint(last.mint) : "", usd, ver].filter(Boolean).join(" · ");
      const c = last.checks || {};
      checks = '<span class="checks">' +
        checkHtml("screen", c.screen) + checkHtml("api", c.api) + checkHtml("chain", c.chain) +
        "</span>";
    }
    return '<section class="live-card" id="live-card">' +
      '<div class="live-frame" id="live-frame">' +
        (paused ? '<div class="paused">Paused · private</div>' :
          (hasImg
            ? '<img alt="Live desk screen" id="live-img-a"><img alt="" id="live-img-b">'
            : '<div class="paused">Waiting for a frame</div>')) +
        '<div class="live-top"><span class="live-dot ' + (fresh ? "fresh" : "") + '"><i></i>' + escapeHtml(label) +
        '</span><span class="live-lane" style="color:' + laneColor + '">' + escapeHtml(laneText) + "</span></div>" +
      "</div>" +
      '<div class="live-order"><span>' + escapeHtml(orderLine) + "</span>" + checks + "</div>" +
    "</section>";
  }

  function checkHtml(name, ok) {
    const cls = ok === true ? "ok" : (ok === false ? "no" : "");
    const mark = ok === true ? "✓" : (ok === false ? "✕" : "·");
    return '<span class="check ' + cls + '">' + mark + " " + name + "</span>";
  }

  function laneBotName(st, last) {
    if (last && (last.status === "clicking" || last.status === "verifying")) {
      return { name: last.bot || "executor", busy: last.status === "clicking" ? "buying" : "verifying" };
    }
    return { name: "executor", busy: "" };
  }

  function bindLiveCard() {
    const card = $("#live-card");
    const screen = store.screen;
    if (!card) return;
    const imgs = $$("#live-frame img");
    if (screen && screen.image && imgs.length) {
      const slot = imgs[store.screenBuf % imgs.length];
      const other = imgs[(store.screenBuf + 1) % imgs.length];
      slot.onload = () => { slot.classList.add("show"); if (other) other.classList.remove("show"); };
      slot.src = screen.image;
      store.screenBuf += 1;
    }
    card.addEventListener("click", () => openLightbox());
  }

  function openLightbox() {
    const screen = store.screen;
    if (!screen || !screen.image || screen.status === "Paused · private") return;
    const box = $("#lightbox");
    const st = useState();
    const pos = st && st.positions && st.positions[0];
    const link = pos && pos.link;
    box.hidden = false;
    box.classList.remove("hidden");
    box.innerHTML = '<div class="lb-stage"><img id="lb-img" alt="Desk screen" src="' + screen.image.replace(/"/g, "") + '">' +
      '<div class="lb-bar"><button class="btn" type="button" id="lb-close">Close</button>' +
      (link ? '<a class="btn primary" id="lb-open" href="' + escapeHtml(link) + '" rel="noopener noreferrer">Open on FOMO</a>' : "") +
      "</div></div>";
    $("#lb-close").onclick = () => { box.classList.add("hidden"); box.hidden = true; box.innerHTML = ""; };
    const img = $("#lb-img");
    enablePinch(img);
  }

  function enablePinch(img) {
    if (!img) return;
    let scale = 1, start = 0;
    const dist = (e) => {
      const a = e.touches[0], b = e.touches[1];
      return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    };
    img.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) { start = dist(e) / scale; e.preventDefault(); }
    }, { passive: false });
    img.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2) {
        scale = Math.min(4, Math.max(1, dist(e) / start));
        img.style.transform = "scale(" + scale + ")";
        e.preventDefault();
      }
    }, { passive: false });
  }

  function botCardsHtml(carousel) {
    const bots = (useState() && useState().bots) || [];
    if (!bots.length) return '<div class="empty" style="min-width:80%;">No bot cards yet</div>';
    return bots.map((b) => botCardHtml(b, carousel)).join("");
  }

  function botCardHtml(b, compact) {
    const name = (b.name || "").toLowerCase();
    const color = b.color || COLORS[name] || "#fff";
    const paused = b.status === "paused" || b.paused;
    const killed = name === "scanner" && b.killed != null
      ? '<div class="bot-detail"><span class="killed">killed</span> <b>' + escapeHtml(String(b.killed)) + "</b>" +
        (b.detail ? " · " + escapeHtml(b.detail) : "") + "</div>"
      : (b.detail ? '<div class="bot-detail">' + escapeHtml(b.detail) + "</div>" : "");
    let extra = "";
    if (name === "analyst") {
      extra = '<div class="layers">' + Array.from({ length: 8 }, (_, i) => "<i></i>").join("") + "</div>";
      if (b.score != null) {
        extra += '<div class="score-row">' + scoreRing(b.score) +
          (b.social && b.social !== "off" ? '<span class="pill">Social · ' + escapeHtml(String(b.social)) + "</span>" : '<span class="pill">Social · off</span>') +
          "</div>";
      } else {
        extra += (b.social === "off" || !b.social) ? '<span class="pill">Social · off</span>' : "";
      }
    }
    if (name === "risk" && b.pills) {
      extra = '<div class="pills">' + b.pills.map((p) => {
        const tone = p.tone === "red" ? "stop" : (p.tone === "green" ? "trail" : "");
        return '<span class="pill ' + tone + '">' + escapeHtml(p.text) + "</span>";
      }).join("") + "</div>";
    }
    if (name === "executor") extra = '<div class="dip-bar"><span></span></div>';
    return '<article class="bot-card' + (compact ? "" : " wide") + '" data-bot="' + escapeHtml(name) + '">' +
      '<div class="bot-head"><span class="bot-status ' + (paused ? "paused" : "") + '"></span>' +
      '<span class="bot-name" style="color:' + color + '">' + escapeHtml(botTitle(name)) + "</span></div>" +
      '<div class="bot-headline">' + escapeHtml(b.headline || "") + "</div>" +
      killed + extra +
    "</article>";
  }

  function scoreRing(score) {
    const s = Number(score);
    if (isNaN(s)) return "";
    const r = 15, c = 2 * Math.PI * r;
    const color = s >= 70 ? "#00d35a" : "#ff9f0a";
    const dash = Math.max(0, Math.min(1, s / 100)) * c;
    return '<svg class="score-ring" viewBox="0 0 36 36" aria-label="Score ' + s + '">' +
      '<circle cx="18" cy="18" r="' + r + '" fill="none" stroke="#2c2c2e" stroke-width="4"/>' +
      '<circle cx="18" cy="18" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="4" ' +
      'stroke-dasharray="' + dash + ' ' + c + '" stroke-linecap="round" transform="rotate(-90 18 18)"/>' +
      '<text x="18" y="20.5" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">' + s + "</text></svg>";
  }

  function activityHtml(limit, opts) {
    const rows = (store.activity && (store.activity.rows || store.activity.items)) || [];
    if (!rows.length) return '<div class="empty">' + ((opts && opts.empty) || "Nothing yet tonight") + '</div>';
    const slice = typeof limit === "number" ? rows.slice(0, limit) : rows;
    return '<div class="act-list">' + slice.map((r) => activityRow(r)).join("") + "</div>";
  }

  function activityRow(r) {
    const title = r.title || prettyKind(r.kind);
    const sub = [botTitle((r.bot || "").toLowerCase()) || r.bot, relTime(r.ts)].filter(Boolean).join(" · ");
    const val = r.value || r.subtitle || "";
    const cls = /^-|stopped|rejected/i.test(String(r.kind) + String(val)) ? "neg" : (/^\+|bought|sold/i.test(String(r.kind) + String(val)) && !/^-/.test(val) ? "pos" : "");
    const trade = /bought|sold|stopped|copied/i.test(r.kind || "");
    const dest = trade ? "coin" : "audit";
    const open = r.link ? '<div class="open">Open on FOMO</div>' : "";
    return '<button class="act-row" type="button" data-mint="' + escapeHtml(r.mint || "") + '" data-dest="' + dest + '" data-link="' + escapeHtml(r.link || "") + '">' +
      '<div class="mid"><div class="title">' + escapeHtml(title) + "</div>" +
      '<div class="sub">' + escapeHtml(sub) + "</div></div>" +
      '<div class="right"><div class="' + cls + '">' + escapeHtml(val) + "</div>" + open + "</div></button>";
  }

  function prettyKind(k) {
    if (k === "bought") return "Bought";
    if (k === "sold") return "Sold";
    if (k === "stopped") return "Stopped";
    if (k === "rejected") return "Rejected";
    if (k === "copied") return "Copied";
    return k || "Update";
  }

  function bindActivity() {
    $$(".act-row").forEach((row) => {
      row.addEventListener("click", (e) => {
        const link = row.dataset.link;
        if (e.target.closest(".open") && link) { window.open(link, "_blank", "noopener"); return; }
        const mint = row.dataset.mint;
        if (mint) go(row.dataset.dest || "coin", mint);
      });
    });
  }

  function renderActivity() {
    const rows = (store.activity && (store.activity.rows || store.activity.items)) || [];
    main.innerHTML = '<div class="section-h"><h2>Activity</h2></div>' +
      (rows.length ? activityHtml() : '<div class="empty">Nothing yet tonight</div>');
    bindActivity();
  }

  function renderBots() {
    const st = useState();
    const bots = (st && st.bots) || [];
    const open = st && st.positions && st.positions.length > 0;
    const pausedSet = new Set(((store.settings && store.settings.settings && store.settings.settings.paused_bots) || (st && st.paused_bots) || []));
    // paused may also be on the card
    let html = '<div class="bot-page">';
    if (!bots.length) html += '<div class="empty">No bot cards yet</div>';
    bots.forEach((b) => {
      const name = (b.name || "").toLowerCase();
      const paused = b.status === "paused" || pausedSet.has(name);
      const riskLock = name === "risk" && open;
      const dec = (store.decisions[name] && (store.decisions[name].rows || store.decisions[name].decisions)) || [];
      html += '<section class="bot-card wide">' + botCardHtml(b, false).replace(/^<article[^>]*>|<\/article>$/g, "") +
        '<div class="bot-actions">' +
          '<span class="bot-detail">Status · ' + (paused ? "paused" : "running") + "</span>" +
          '<button class="switch ' + (paused ? "on" : "") + (riskLock ? " locked" : "") + '" type="button" data-bot="' + name + '" ' + (riskLock ? "disabled" : "") + ' aria-label="Pause"><i></i></button>' +
        "</div>" +
        (riskLock ? '<div class="bot-detail">Risk is locked while a position is open</div>' : '<div class="bot-detail">Change in Grok Bot chat</div>') +
        '<div class="section-h" style="padding:12px 0 6px;"><h2 style="font-size:15px;">Last decisions</h2></div>' +
        (dec.length ? dec.slice(0, 20).map(decisionRow).join("") : '<div class="bot-detail">No decisions yet</div>') +
        '<button class="shortcut" type="button" data-go="account">Settings</button>' +
      "</section>";
    });
    html += "</div>";
    main.innerHTML = html;
    $$(".shortcut").forEach((b) => b.addEventListener("click", () => go("account")));
    $$(".decision").forEach((b) => b.addEventListener("click", () => { if (b.dataset.mint) go("coin", b.dataset.mint); }));
    // Pause switches are display-only under Plan B
  }

  function decisionRow(d) {
    const label = d.verdict || d.reason || d.title || d.kind || (d.passed === false ? "fail" : (d.score != null ? "score " + d.score : "decision"));
    const mint = d.mint || "";
    const link = d.link;
    return '<button class="decision" type="button" data-mint="' + escapeHtml(mint) + '">' +
      escapeHtml(String(label)) +
      (mint ? " · " + escapeHtml(shortMint(mint)) : "") +
      (link ? ' · <span class="link">Open on FOMO</span>' : "") +
      "</button>";
  }

  function renderAccount() {
    const acct = store.account || {};
    const st = useState() || {};
    const settings = (store.settings && store.settings.settings) || acct.settings || {};
    const mode = acct.mode || st.mode || null;
    const cash = acct.cash != null ? acct.cash : st.balance;
    const profile = acct.profile_url;
    const invite = acct.invite_url;
    const handle = acct.fomo_handle || "";

    let html = '<div class="account">';
    html += '<div class="group">';
    if (mode) html += '<div class="row"><span class="row-label">Mode</span><div class="seg" aria-hidden="true">' +
      '<span class="' + (mode !== "LIVE" ? "on" : "") + '">PAPER</span>' +
      '<span class="' + (mode === "LIVE" ? "on" : "") + '">LIVE</span></div></div>';
    const warn = acct.live_warning || "LIVE trades real cash on FOMO. New coins can go to 0 in minutes. Only put in what you can lose.";
    html += '<p class="hint">' + escapeHtml(warn) + " LIVE stays locked until one full paper night is recorded, step 15 passes, and you type LIVE in Grok Bot chat. Change in Grok Bot chat.</p>";
    html += '<div class="row"><span class="row-label">Cash</span><span class="row-value num">' + escapeHtml(money(cash) || "—") + "</span></div>";
    if (profile) html += '<a class="row" href="' + escapeHtml(profile) + '" rel="noopener noreferrer"><span class="row-label">Your FOMO profile</span><span class="row-value">' + escapeHtml(handle ? "@" + handle.replace(/^@/, "") : "Open") + " ›</span></a>";
    html += '<button class="row" type="button" id="btn-invite"><span class="row-label">Invite a friend</span><span class="row-value">Share ›</span></button>';
    html += "</div>";

    html += '<div class="group"><h3>Pushes</h3>';
    html += '<div class="row"><span class="row-label">Web push only</span><span class="row-value" id="push-state">Off</span></div>';
    html += '<button class="row" type="button" id="btn-push"><span class="row-label">Enable notifications on the home screen</span><span class="row-value">›</span></button>';
    html += '<p class="hint" id="push-hint">Pushes from this phone need a small always-on endpoint to hold your subscription. Plan B cannot receive one from the phone, so this stays off until that exists. Alerts can still come through Grok Bot chat.</p>';
    html += "</div>";

    html += '<div class="group"><h3>Copy picks</h3>' +
      '<div class="row"><span class="row-label">Schedule</span><span class="row-value">' + escapeHtml(String(acct.picks_every || settings.picks_every || "off")) + "</span></div>" +
      '<div class="row"><span class="row-label">Time</span><span class="row-value">' + escapeHtml(String(settings.picks_time || "—")) + "</span></div>" +
      '<p class="hint">Change in Grok Bot chat</p></div>';

    html += '<div class="group"><h3>Vault</h3>' +
      '<div class="row"><span class="row-label">Plugin</span><span class="row-value">Not connected</span></div>' +
      '<div class="row"><span class="row-label">Files</span><span class="row-value">On the desk computer</span></div></div>';

    html += '<div class="group"><button class="row" type="button" id="btn-watch"><span class="row-label">Watch in Grok Bot</span><span class="row-value">Chat ›</span></button>' +
      '<p class="hint">There is no public preview URL under this hosting. Ask in Grok Bot chat to see the computer.</p></div>';

    const groups = (store.settings && store.settings.groups) || (acct.groups) || SETTING_GROUPS;
    const ranges = (store.settings && store.settings.ranges) || (acct.ranges) || SETTING_RANGE;
    groups.forEach((g) => {
      html += '<div class="group"><h3>' + escapeHtml(g.title) + "</h3>";
      g.keys.forEach((key) => {
        if (!Object.prototype.hasOwnProperty.call(settings, key)) return;
        const val = settings[key];
        if (typeof val === "number") {
          const rawRange = ranges[key] || SETTING_RANGE[key];
          const range = rawRange ? [rawRange[0], rawRange[1]] : [0, val * 2 || 100];
          const step = Number.isInteger(val) && Number.isInteger(range[0]) && Number.isInteger(range[1]) ? "1" : "0.01";
          html += '<div class="setting"><div class="lab"><b>' + escapeHtml(key) + "</b>" +
            '<input class="exact" type="number" min="' + range[0] + '" max="' + range[1] + '" step="' + step + '" value="' + escapeHtml(String(val)) + '" disabled readonly></div>' +
            '<input type="range" min="' + range[0] + '" max="' + range[1] + '" step="' + step + '" value="' + escapeHtml(String(val)) + '" disabled></div>';
        } else if (typeof val === "boolean") {
          html += '<div class="row"><span class="row-label">' + escapeHtml(key) + '</span><span class="row-value">' + (val ? "true" : "false") + "</span></div>";
        } else {
          const show = (val == null || val === "") ? "not set" : String(val);
          html += '<div class="row"><span class="row-label">' + escapeHtml(key) + '</span><span class="row-value">' + escapeHtml(show) + "</span></div>";
        }
      });
      html += '<p class="hint">Change in Grok Bot chat</p></div>';
    });
    const log = (store.settings && store.settings.change_log) || acct.change_log || [];
    if (log.length) {
      html += '<div class="group"><h3>Recent changes</h3>';
      log.slice(0, 20).forEach((row) => {
        html += '<div class="row"><span class="row-label">' + escapeHtml((row.key || "") + (row.who ? " · " + row.who : "")) +
          '</span><span class="row-value">' + escapeHtml(String(row.old == null ? "" : row.old) + " → " + String(row.new == null ? "" : row.new)) + "</span></div>";
      });
      html += "</div>";
    }
    html += "</div>";
    main.innerHTML = html;

    const inviteBtn = $("#btn-invite");
    if (inviteBtn) inviteBtn.onclick = () => shareInvite(invite);
    const pushBtn = $("#btn-push");
    if (pushBtn) pushBtn.onclick = tryEnablePush;
    const watch = $("#btn-watch");
    if (watch) watch.onclick = () => {};
  }

  function shareInvite(url) {
    if (!url) return;
    if (navigator.share) {
      navigator.share({ title: "FOMO", url: url }).catch(() => copyText(url, "Link copied"));
    } else copyText(url, "Link copied");
  }

  function copyText(text, msg) {
    const done = () => flash(msg);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const a = document.createElement("textarea");
    a.value = text; document.body.appendChild(a); a.select();
    try { document.execCommand("copy"); done(); } catch (_) {}
    a.remove();
  }
  function flash(msg) {
    const h = document.createElement("div");
    h.className = "error-bar";
    h.style.background = "rgba(0,211,90,0.16)"; h.style.color = "#00d35a";
    h.textContent = msg;
    $("#app").insertBefore(h, main);
    setTimeout(() => h.remove(), 2000);
  }

  async function tryEnablePush() {
    const hint = $("#push-hint");
    const state = $("#push-state");
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      if (hint) hint.textContent = "This browser cannot subscribe to web push. Add the app to your home screen on iPhone, or keep alerts in Grok Bot chat.";
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        if (state) state.textContent = "Off";
        if (hint) hint.textContent = "Notifications were not allowed. You can enable them later in system settings, or keep alerts in Grok Bot chat.";
        return;
      }
      if (state) state.textContent = "Allowed, not connected";
      if (hint) hint.textContent = "Your phone would allow notifications, but Plan B has no server to receive the subscription (the data address is read-only from the phone). A tiny always-on endpoint would be needed to store it and send pushes. Until then, alerts stay in Grok Bot chat.";
    } catch (err) {
      if (hint) hint.textContent = "Could not enable notifications on this phone.";
    }
  }

  function renderCoin() {
    const coin = store.coin;
    const st = useState();
    const paper = st ? (st.paper !== false && st.mode !== "LIVE") : true;
    if (!coin) {
      main.innerHTML = store.status === "loading"
        ? '<div class="coin"><div class="skel" style="height:40px;width:50%;"></div></div>'
        : '<div class="empty">No coin data</div>';
      return;
    }
    const pos = coin.position;
    const since = (pos && pos.entryPrice && coin.price != null && pos.entryPrice)
      ? fmtPct(((coin.price - pos.entryPrice) / pos.entryPrice) * 100)
      : null;
    const age = coin.created_at ? ageLabel(coin.created_at) : null;
    const chain = coin.chain || null;
    const audit = store.audit;
    const known = audit && Array.isArray(audit.layers) ? audit.layers.filter((l) => !l.missing && (l.pass === true || l.pass === false)) : [];
    const passed = known.length ? known.filter((l) => l.pass === true).length : null;
    const total = audit && Array.isArray(audit.layers) && known.length ? audit.layers.length : null;
    const link = coin.link || (pos && pos.link);
    main.innerHTML = '<section class="coin">' +
      '<div style="display:flex;align-items:center;gap:8px;"><h1 class="coin-name">' + escapeHtml(coin.name || coin.symbol || shortMint(coin.mint)) + "</h1>" +
      (paper ? '<span class="paper-badge">PAPER</span>' : "") + "</div>" +
      '<div class="coin-sub">' +
        escapeHtml([coin.symbol, chain, age].filter(Boolean).join(" · ")) +
        (passed != null ? '<span class="shield">' + passed + "/" + total + "</span>" : "") +
      "</div>" +
      (coin.price != null ? '<div class="coin-price num">' + escapeHtml(formatPrice(coin.price)) + "</div>" : "") +
      (since ? '<div class="since">' + escapeHtml(since) + " since entry</div>" : "") +
      '<div class="chart-canvas-box" style="height:160px;"><canvas id="candle-chart"></canvas></div>' +
      '<div class="stats">' +
        stat("Market cap", coin.marketCap || coin.market_cap) +
        stat("Liquidity", coin.liquidity || coin.liquidity_usd) +
        stat("Holders", coin.holders) +
      "</div>" +
      (pos ? '<div class="pos-card">Your position · ' + escapeHtml(money(pos.sizeUsd) || "—") + " in · Executor</div>" : "") +
      '<div class="actions">' +
        (link ? '<a class="btn" href="' + escapeHtml(link) + '" rel="noopener noreferrer">Open on FOMO</a>' : "") +
        (pos ? '<button class="btn danger" type="button" id="btn-sell">Sell now</button>' : "") +
      "</div></section>";
    const canvas = $("#candle-chart");
    if (canvas && window.DeskChart) DeskChart.drawCandles(canvas, coin.candles || [], { exit: pos && pos.stopPrice });
    const sell = $("#btn-sell");
    if (sell) sell.onclick = () => openSellSheet(coin);
  }

  function formatPrice(n) {
    const x = Number(n);
    if (!isFinite(x)) return "—";
    if (Math.abs(x) >= 1) return money(x);
    const s = x.toFixed(Math.abs(x) < 0.0001 ? 8 : 6);
    return "$" + s.replace(/0+$/, "").replace(/\.$/, "");
  }

  function stat(k, v) {
    if (v == null || v === "") return "";
    let show;
    if (typeof v === "number") show = k === "Holders" ? v.toLocaleString() : (money(v, 0) || String(v));
    else show = String(v);
    return '<div class="stat"><div class="k">' + escapeHtml(k) + '</div><div class="v">' + escapeHtml(show) + "</div></div>";
  }

  function ageLabel(iso) {
    const t = Date.parse(iso);
    if (!isFinite(t)) return null;
    const h = Math.max(0, Math.round((Date.now() - t) / 3600000));
    if (h < 24) return h + "h old";
    return Math.round(h / 24) + "d old";
  }

  function openSellSheet(coin) {
    const sheet = $("#sheet");
    store.sellPct = 50;
    const mint = coin.mint;
    const symbol = coin.symbol || shortMint(mint);
    const cmd = "sell " + mint + " --pct " + store.sellPct + " --confirm";
    sheet.hidden = false;
    sheet.classList.remove("hidden");
    sheet.innerHTML = '<div class="sheet-card"><div class="handle"></div>' +
      "<h3>Sell now</h3>" +
      "<p>This hosting cannot place a sell from the phone. Send this in Grok Bot chat and I will queue it on the desk. Confirm is still never pressed in a withdraw.</p>" +
      '<div class="pcts">' + [25, 50, 100].map((p) =>
        '<button type="button" data-pct="' + p + '" class="' + (p === 50 ? "on" : "") + '">' + p + "%</button>"
      ).join("") + "</div>" +
      '<pre class="cmd" id="sell-cmd">' + escapeHtml(cmd) + "</pre>" +
      '<div class="actions"><button class="btn" type="button" id="sell-copy">Copy command</button>' +
      '<button class="btn" type="button" id="sell-close">Close</button></div></div>';
    const update = () => { $("#sell-cmd").textContent = "sell " + mint + " --pct " + store.sellPct + " --confirm"; };
    $$(".pcts button", sheet).forEach((b) => b.addEventListener("click", () => {
      store.sellPct = Number(b.dataset.pct);
      $$(".pcts button", sheet).forEach((x) => x.classList.toggle("on", x === b));
      update();
    }));
    $("#sell-copy").onclick = () => copyText($("#sell-cmd").textContent, "Command copied");
    $("#sell-close").onclick = closeSheet;
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  }
  function closeSheet() {
    const sheet = $("#sheet");
    sheet.classList.add("hidden"); sheet.hidden = true; sheet.innerHTML = "";
  }

  function renderAudit() {
    const audit = store.audit;
    const coin = store.coin;
    if (!audit) {
      main.innerHTML = '<div class="empty">No audit data</div>';
      return;
    }
    const layers = audit.layers || [];
    const social = layers.find((l) => (l.layer || l.name) === "social");
    let socialText = "Social: off";
    if (social && !social.missing && social.value) socialText = "Social · " + social.value;
    else if (social && social.pass != null) socialText = social.pass ? "Social" : "Social: off";
    main.innerHTML = '<section class="audit">' +
      "<h1 class=\"coin-name\">" + escapeHtml((coin && (coin.name || coin.symbol)) || shortMint(audit.mint)) + "</h1>" +
      '<div class="discs" id="discs">' + layers.map((l, i) => {
        const cls = l.missing ? "" : (l.pass === true ? "pass" : (l.pass === false ? "fail" : ""));
        const mark = l.missing ? "·" : (l.pass === true ? "✓" : (l.pass === false ? "✕" : "·"));
        return '<div class="disc ' + cls + '" data-i="' + i + '"><span class="beam"></span>' + mark + "</div>";
      }).join("") + "</div>" +
      '<div class="layer-list">' + layers.map((l) => {
        const name = l.name || l.layer || "";
        const val = l.missing ? "—" : (l.value != null && l.value !== "" ? l.value : (l.pass === true ? "Pass" : (l.pass === false ? "Fail" : "—")));
        return '<div class="layer-row"><span>' + escapeHtml(name) + '</span><span class="val">' + escapeHtml(String(val)) + "</span></div>";
      }).join("") + "</div>" +
      '<div class="social-row">' + escapeHtml(socialText) + "</div>" +
    "</section>";
    runBeam();
  }

  function runBeam() {
    const discs = $$("#discs .disc");
    if (!discs.length || reduceMotion()) return;
    let i = 0;
    const tick = () => {
      discs.forEach((d, n) => d.classList.toggle("on", n === i));
      i = (i + 1) % discs.length;
    };
    tick();
    const id = setInterval(tick, 380);
    setTimeout(() => clearInterval(id), 380 * discs.length * 2);
  }

  /* ---------- tabs / start ---------- */
  $$(".tab").forEach((t) => t.addEventListener("click", () => go(t.dataset.tab)));
  $("#btn-avatar").addEventListener("click", () => go("account"));
  $("#btn-bell").addEventListener("click", () => go("activity"));

  window.addEventListener("hashchange", () => {
    const p = pointerFromLocation();
    if (p) store.pointer = p;
    readRoute();
    render();
    if (store.routeMint) loadDetail(store.routeMint);
  });
  window.addEventListener("resize", () => {
    if (store.route === "home") drawEquity();
    if (store.route === "coin") {
      const canvas = $("#candle-chart");
      const coin = store.coin;
      if (canvas && coin && window.DeskChart) DeskChart.drawCandles(canvas, coin.candles || [], { exit: coin.position && coin.position.stopPrice });
    }
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  store.pointer = pointerFromLocation();
  readRoute();
  if (store.pointer) {
    savePointer(store.pointer);
    refresh();
    startPoll();
  } else {
    store.status = "gate";
    render();
  }
})();
