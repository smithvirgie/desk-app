/* Canvas charts for the desk. devicePixelRatio-aware. No framework. */
(function (global) {
  "use strict";

  const GREEN = "#00d35a";
  const ORANGE = "#ff9f0a";
  const BLUE = "#0a84ff";
  const RED = "#ff453a";
  const MUTED = "rgba(235,235,245,0.3)";

  function sizeCanvas(c) {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = c.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
    }
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w: rect.width, h: rect.height, dpr };
  }

  function extent(values, pad) {
    let min = Infinity, max = -Infinity;
    for (const v of values) {
      if (v == null || !isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!isFinite(min)) return { min: 0, max: 1 };
    if (min === max) {
      const slop = Math.abs(min) * 0.04 || 1;
      return { min: min - slop, max: max + slop };
    }
    const p = (max - min) * (pad || 0.12);
    return { min: min - p, max: max + p };
  }

  function markColor(m) {
    if (m.color === "blue" || m.kind === "bought") return BLUE;
    if (m.color === "red" || m.kind === "stopped") return RED;
    if (m.color === "green" || m.kind === "sold") return GREEN;
    return m.color || MUTED;
  }

  function markLabel(m) {
    if (m.label) return m.label;
    if (m.kind === "bought") return "Bought";
    if (m.kind === "sold") return (m.value ? String(m.value) : "Sold");
    if (m.kind === "stopped") return m.value ? String(m.value) : "Stopped";
    return m.kind || "";
  }

  function drawLine(canvas, series, opts) {
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const pts = (series && series.points) || [];
    const marks = (series && series.marks) || [];
    const padL = 2, padR = 2, padT = 28, padB = 8;
    const iw = Math.max(1, w - padL - padR);
    const ih = Math.max(1, h - padT - padB);
    const vals = pts.map((p) => p.v);
    const ext = extent(vals, 0.14);
    const t0 = pts.length ? Date.parse(pts[0].t) || 0 : 0;
    const t1 = pts.length ? Date.parse(pts[pts.length - 1].t) || t0 : t0;
    const sameTime = !pts.length || t1 === t0 || pts.length === 1;
    const span = Math.max(1, t1 - t0);
    const xOf = (t, i) => sameTime
      ? (pts.length <= 1 ? padL + iw : padL + (i / Math.max(1, pts.length - 1)) * iw)
      : padL + ((Date.parse(t) - t0) / span) * iw;
    const yOf = (v) => padT + (1 - (v - ext.min) / (ext.max - ext.min)) * ih;

    if (!pts.length) return;

    // Dashed start line (opening value)
    const y0 = yOf(pts[0].v);
    ctx.save();
    ctx.strokeStyle = MUTED;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, y0);
    ctx.lineTo(padL + iw, y0);
    ctx.stroke();
    ctx.restore();

    const path = new Path2D();
    if (pts.length === 1) {
      const y = yOf(pts[0].v);
      path.moveTo(padL, y);
      path.lineTo(padL + iw, y);
    } else {
      pts.forEach((p, i) => {
        const x = xOf(p.t, i), y = yOf(p.v);
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      });
    }

    const last = pts[pts.length - 1];
    const fill = new Path2D(path);
    const xLast = pts.length === 1 ? padL + iw : xOf(last.t, pts.length - 1);
    const xFirst = pts.length === 1 ? padL : xOf(pts[0].t, 0);
    fill.lineTo(xLast, padT + ih);
    fill.lineTo(xFirst, padT + ih);
    fill.closePath();
    const grd = ctx.createLinearGradient(0, padT, 0, padT + ih);
    grd.addColorStop(0, "rgba(0,211,90,0.28)");
    grd.addColorStop(1, "rgba(0,211,90,0)");
    ctx.fillStyle = grd;
    ctx.fill(fill);

    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke(path);

    // Marks above the line; a later mark moves up a row, never overlaps.
    const placed = [];
    const rowH = 14;
    marks.forEach((m) => {
      const ts = m.t;
      if (!ts) return;
      const tms = Date.parse(ts);
      if (tms < t0 || tms > t1) return;
      // y at the mark time: interpolate
      let yv = last.v;
      for (let i = 1; i < pts.length; i++) {
        const a = Date.parse(pts[i - 1].t), b = Date.parse(pts[i].t);
        if (tms <= b) {
          const u = (tms - a) / Math.max(1, b - a);
          yv = pts[i - 1].v + u * (pts[i].v - pts[i - 1].v);
          break;
        }
      }
      const label = markLabel(m);
      if (!label) return;
      ctx.font = "11px -apple-system, BlinkMacSystemFont, sans-serif";
      const tw = ctx.measureText(label).width;
      let x = Math.min(Math.max(xOf(ts), padL + tw / 2), padL + iw - tw / 2);
      let y = yOf(yv) - 10;
      let row = 0;
      const overlaps = () =>
        placed.some((p) => Math.abs(p.x - x) < (p.w + tw) / 2 + 6 && p.row === row);
      while (overlaps() && row < 6) {
        row += 1;
        y -= rowH;
      }
      if (y < 12) y = 12;
      placed.push({ x, w: tw, row });
      ctx.fillStyle = markColor(m);
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, x, y);
    });
  }

  function drawCandles(canvas, candles, opts) {
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const rows = candles || [];
    if (!rows.length) return;
    const padL = 2, padR = 2, padT = 8, padB = 8;
    const iw = Math.max(1, w - padL - padR);
    const ih = Math.max(1, h - padT - padB);
    const highs = rows.map((c) => c.h ?? c.c);
    const lows = rows.map((c) => c.l ?? c.c);
    const ext = extent(highs.concat(lows), 0.08);
    const yOf = (v) => padT + (1 - (v - ext.min) / (ext.max - ext.min)) * ih;
    const slot = iw / rows.length;
    const body = Math.max(1, Math.min(8, slot * 0.6));
    rows.forEach((c, i) => {
      const x = padL + (i + 0.5) * slot;
      const o = c.o ?? c.c, hgt = c.h ?? c.c, l = c.l ?? c.c, cl = c.c;
      const up = cl >= o;
      ctx.strokeStyle = up ? GREEN : RED;
      ctx.fillStyle = up ? GREEN : RED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yOf(hgt));
      ctx.lineTo(x, yOf(l));
      ctx.stroke();
      const top = yOf(Math.max(o, cl));
      const bot = yOf(Math.min(o, cl));
      ctx.fillRect(x - body / 2, top, body, Math.max(1, bot - top));
    });
    const exit = opts && opts.exit;
    if (exit != null && isFinite(exit)) {
      const y = yOf(exit);
      ctx.save();
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + iw, y);
      ctx.stroke();
      ctx.restore();
    }
  }

  global.DeskChart = { drawLine, drawCandles, sizeCanvas };
})(window);
