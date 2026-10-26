/* cto motion layer: the living board, the morgue, the toll canvas and pointer toys */
(function () {
"use strict";
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var root = document.documentElement;
var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
var DASH = "—";
var COL = { dead: "#c8372d", dying: "#c98a12", alive: "#14a854", unknown: "#8f897d" };
var WORD = { dead: "DEAD", dying: "DYING", alive: "ALIVE", unknown: "NO MARKET" };
if (fine) root.classList.add("fine");

/* one frame loop for everything that moves with the scroll or pointer */
var jobs = [];
function onFrame(fn) { jobs.push(fn); }
var lastT = 0;
function loop(t) { for (var i = 0; i < jobs.length; i++) jobs[i](t, t - lastT); lastT = t; requestAnimationFrame(loop); }
requestAnimationFrame(loop);

/* intro: ends by itself after 1.6 s; a click or key plays the rest at once */
function endIntro() { root.classList.add("intro-done"); }
setTimeout(endIntro, 1600);
addEventListener("pointerdown", endIntro, { once: true });
addEventListener("keydown", endIntro, { once: true });

/* ---------- build the extra sections ---------- */
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
var hero = $(".hero");
// the tape band under the hero
var band = el("div", "band", '<div class="row" data-d="1"></div><div class="row o" data-d="-1"></div>');
band.setAttribute("aria-hidden", "true");
var t1 = "", t2 = "";
for (var k = 0; k < 6; k++) { t1 += "<span>THE DEV LEFT <i>✦</i></span>"; t2 += "<span>THE HOLDERS STAYED <i>✦</i></span>"; }
band.children[0].innerHTML = t1; band.children[1].innerHTML = t2;
if (hero) hero.parentNode.insertBefore(band, hero.nextSibling);
// the morgue, after the autopsy
var morgue = el("section", "sec", '<div class="wrap"><div class="head rv"><span class="kick">02 · The morgue</span><h2>Checked in today.</h2>' +
  '<p>Coins that recently listed on DexScreener, and their condition right now. Tap a tag to run the autopsy.</p></div>' +
  '<div class="tags" id="tags"></div><p class="src" id="mcount">Checking the morgue…</p></div>');
morgue.id = "morgue";
var aut = $("#autopsy");
if (aut) aut.parentNode.insertBefore(morgue, aut.nextSibling);
var navLinks = $("nav .links");
if (navLinks) { var a = el("a", null, "Morgue"); a.href = "#morgue"; navLinks.insertBefore(a, navLinks.children[1] || null); }
// the toll canvas, in how it works
var steps = $("#how .steps");
var toll = el("div", "toll rv", '<canvas aria-label="Illustration: routed trades pay a toll that buys and burns the coin; direct trades skip it"></canvas>' +
  '<p class="cap">Illustration. Routed trades pay the toll and it burns. Direct trades on Pump skip it.</p>');
if (steps) steps.parentNode.insertBefore(toll, steps.nextSibling);
// renumber the kickers now that there is one more section
var n = 0;
$$(".head .kick").forEach(function (k) { n++; k.textContent = k.textContent.replace(/^\d\d/, (n < 10 ? "0" : "") + n); });

/* reveal for the parts added here */
var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vis"); io.unobserve(e.target); } });
}, { rootMargin: "0px 0px -6% 0px" }) : null;
$$(".rv:not(.vis)").forEach(function (x) { if (io) io.observe(x); else x.classList.add("vis"); });

/* ---------- headings rise word by word, kickers scramble ---------- */
$$(".head h2").forEach(function (h) {
  var i = 0;
  (function walk(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var w = el("span", "w"), s = el("span"); s.textContent = p; s.style.setProperty("--i", i++); w.appendChild(s); frag.appendChild(w);
        });
        node.replaceChild(frag, c);
      } else if (c.nodeType === 1 && c.tagName !== "BR") walk(c);
    });
  })(h);
  h.classList.add("fxw");
});
var foot = $("footer p");
if (foot) foot.classList.add("sweep");
var GLY = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$·";
function scramble(k) {
  var fin = k.textContent, t0 = 0, dur = 650;
  if (still) return;
  onFrame(function f(t) {
    if (!t0) t0 = t;
    var p = Math.min(1, (t - t0) / dur), lock = Math.floor(p * fin.length), s = "";
    for (var i = 0; i < fin.length; i++) s += i < lock || fin[i] === " " ? fin[i] : GLY[Math.floor(Math.random() * GLY.length)];
    if (p >= 1) { s = fin; jobs.splice(jobs.indexOf(f), 1); }
    k.textContent = s;
  });
}
var seen = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
  es.forEach(function (e) {
    if (!e.isIntersecting) return;
    seen.unobserve(e.target);
    if (e.target.classList.contains("kick")) scramble(e.target);
    if (e.target.tagName === "P") { e.target.classList.add("vis"); setTimeout(function () { e.target.classList.add("lit"); }, 400); }
  });
}, { threshold: 0.4 }) : null;
if (seen) { $$(".head .kick").forEach(function (k) { seen.observe(k); }); if (foot) seen.observe(foot); }
else if (foot) foot.classList.add("vis", "lit");

/* ---------- scroll: bar, nav tuck, hero drift, band slide ---------- */
var bar = el("div", "fxbar"); document.body.appendChild(bar);
var nav = $("#nav"), heroL = $(".hero .wrap > div:first-child"), board = $(".hero .board");
var lastY = scrollY, vel = 0, bandX = 0;
onFrame(function (t, dt) {
  var y = scrollY, H = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = "scaleX(" + (H > 0 ? Math.min(1, y / H) : 0) + ")";
  var dy = y - lastY;
  if (nav) { if (y > 280 && dy > 2) nav.classList.add("tuck"); else if (dy < -2 || y < 280) nav.classList.remove("tuck"); }
  vel += (dy - vel) * 0.12; lastY = y;
  if (still) return;
  if (heroL && y < innerHeight * 1.2) {
    heroL.style.transform = "translateY(" + (y * 0.24).toFixed(1) + "px)";
    heroL.style.opacity = Math.max(0, 1 - y / (innerHeight * 0.85)).toFixed(3);
    if (board) board.style.transform = "translateY(" + (y * 0.1).toFixed(1) + "px)";
  }
  var r = band.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) {
    bandX = y * 0.35;
    var u0 = band.children[0].firstElementChild, u1 = band.children[1].firstElementChild, w0 = (u0 && u0.offsetWidth) || 1000, w1 = (u1 && u1.offsetWidth) || 1000;
    var skew = Math.max(-8, Math.min(8, vel * 0.25));
    band.children[0].style.transform = "translateX(" + (-(bandX % w0)).toFixed(1) + "px) skewX(" + (-skew).toFixed(2) + "deg)";
    band.children[1].style.transform = "translateX(" + ((bandX % w1) - w1).toFixed(1) + "px) skewX(" + (-skew).toFixed(2) + "deg)";
  }
});

/* ---------- the chair: idles, leans to the pointer, spins, talks ---------- */
var ph = $(".hero .ph"), poster = $(".hero .poster"), sign = $(".hero .sign");
var chair = null, bubble = null, lines = ["He’s not coming back.", "Last seen selling the top.", "Seat’s free. The holders sat down.", "Don’t bother calling. Wallet’s empty."], li = 0, bt = 0;
if (ph && ph.firstElementChild) {
  chair = el("i", "chairw"); ph.insertBefore(chair, ph.firstElementChild); chair.appendChild(chair.nextElementSibling);
  bubble = el("div", "bubble"); board.appendChild(bubble);
}
function spin() { if (!chair || still) return; chair.classList.remove("spin"); void chair.offsetWidth; chair.classList.add("spin"); }
function say(txt) {
  if (!bubble) return;
  bubble.textContent = txt; bubble.classList.add("on");
  clearTimeout(bt); bt = setTimeout(function () { bubble.classList.remove("on"); }, 2600);
}
if (chair) {
  setTimeout(function () { spin(); }, 650);
  setTimeout(function () { if (scrollY < 200) say(lines[0]); li = 1; }, 2200);
  (function idle() { setTimeout(function () { if (!document.hidden && scrollY < innerHeight) spin(); idle(); }, 9000 + Math.random() * 6000); })();
  poster.addEventListener("click", function () { spin(); say(lines[li++ % lines.length]); });
  if (fine && !still) addEventListener("pointermove", function (e) {
    var r = board.getBoundingClientRect(); if (r.bottom < 0) return;
    var dx = (e.clientX - (r.left + r.width * 0.35)) / innerWidth;
    chair.style.setProperty("--lean", Math.max(-5, Math.min(5, dx * 10)).toFixed(2) + "deg");
  }, { passive: true });
}
if (sign && !still) {
  var swing = function () { if (!root.classList.contains("intro-done")) return; sign.classList.remove("swing"); void sign.offsetWidth; sign.classList.add("swing"); };
  sign.addEventListener("mouseenter", swing);
  addEventListener("scroll", function () { if (Math.abs(vel) > 18 && scrollY < innerHeight) swing(); }, { passive: true });
}

/* ---------- numbers roll on the way to their real value (never a made-up one) ---------- */
var wrote = new WeakMap();
function roll(e) {
  var fin = e.textContent, t0 = 0, dur = 480;
  if (still || !/\d/.test(fin)) return;
  onFrame(function f(t) {
    if (wrote.get(e) !== e.textContent && wrote.has(e) && e.textContent !== fin) { jobs.splice(jobs.indexOf(f), 1); return; }
    if (!t0) t0 = t;
    var p = Math.min(1, (t - t0) / dur), lock = Math.floor(p * fin.length), s = "";
    for (var i = 0; i < fin.length; i++) s += i < lock || !/\d/.test(fin[i]) ? fin[i] : String(Math.floor(Math.random() * 10));
    if (p >= 1) { s = fin; jobs.splice(jobs.indexOf(f), 1); }
    wrote.set(e, s); e.textContent = s;
  });
}
if ("MutationObserver" in window) {
  var mo = new MutationObserver(function (ms) {
    ms.forEach(function (m) { var e = m.target.nodeType === 3 ? m.target.parentNode : m.target; if (e && wrote.get(e) !== e.textContent) { wrote.set(e, e.textContent); roll(e); } });
  });
  $$("[data-k],[data-m]").forEach(function (e) { wrote.set(e, e.textContent); mo.observe(e, { childList: true, characterData: true, subtree: true }); });
  var ss = $("#statstamp"), cert = $("#cert");
  if (ss && cert) new MutationObserver(function () {
    if (ss.classList.contains("on") && !still) setTimeout(function () { cert.classList.remove("thud"); void cert.offsetWidth; cert.classList.add("thud"); }, 260);
  }).observe(ss, { attributes: true, attributeFilter: ["class"] });
}

/* ---------- the morgue: real coins, checked live; new arrivals drop in ---------- */
var tagsEl = $("#tags"), mcount = $("#mcount"), shown = {};
function money(v) {
  if (v == null || !isFinite(v)) return DASH;
  var x = Math.abs(v);
  if (x >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (x >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (x >= 1e3) return "$" + (v / 1e3).toFixed(1) + "K";
  return "$" + Math.round(v);
}
function age(sec) {
  if (!sec) return DASH;
  var d = Math.max(0, Date.now() / 1000 - sec);
  if (d >= 86400) return Math.floor(d / 86400) + "d";
  if (d >= 3600) return Math.floor(d / 3600) + "h";
  return Math.max(1, Math.floor(d / 60)) + "m";
}
function clip(s, n) { return s ? String(s).replace(/[\u0000-\u001f]/g, "").trim().slice(0, n) : ""; }
function skeleton() {
  if (!tagsEl) return;
  tagsEl.innerHTML = "";
  for (var i = 0; i < 8; i++) tagsEl.appendChild(el("div", "tagw", '<div class="tag sk" style="--r:' + ((i % 3) - 1) * 1.5 + 'deg"><span class="sy">$XXXX</span><span class="nm">&nbsp;</span><dl><div><dt>MCAP</dt><dd>$00.0K</dd></div><div><dt>24H VOL</dt><dd>$00.0K</dd></div><div><dt>AGE</dt><dd>00h</dd></div></dl></div>'));
}
function tag(c, i, fresh) {
  var w = el("div", "tagw"), b = el("button", "tag" + (fresh ? " new" : ""));
  b.type = "button";
  b.style.setProperty("--r", (((i * 7) % 5) - 2) * 1.2 + "deg");
  var sy = clip(c.symbol, 14), nm = clip(c.name, 32);
  var s1 = el("span", "sy"); s1.textContent = sy ? "$" + sy.toUpperCase() : "Unnamed";
  var s2 = el("span", "nm"); s2.textContent = nm || " ";
  var st = el("span", "st"); st.textContent = WORD[c.status] || "NO MARKET"; st.style.setProperty("--c", COL[c.status] || COL.unknown);
  var dl = el("dl");
  [["MCAP", money(c.mcap)], ["24H VOL", money(c.vol24)], ["AGE", age(c.created)]].forEach(function (r) {
    var d = el("div"), dt = el("dt"), dd = el("dd"); dt.textContent = r[0]; dd.textContent = r[1]; d.appendChild(dt); d.appendChild(dd); dl.appendChild(d);
  });
  b.appendChild(s1); b.appendChild(s2); b.appendChild(st); b.appendChild(dl);
  b.setAttribute("aria-label", "Run the autopsy on " + (sy ? "$" + sy : "this coin"));
  b.addEventListener("click", function () {
    var inp = $("#mint"), f = $("#checkform"); if (!inp || !f) return;
    inp.value = c.mint;
    if (f.requestSubmit) f.requestSubmit(); else f.dispatchEvent(new Event("submit", { cancelable: true }));
  });
  if (fresh && !still) b.style.animationDelay = (i * 60) + "ms";
  w.appendChild(b);
  return w;
}
function morgueFetch() {
  if (!tagsEl || document.hidden) return;
  fetch("/api/morgue").then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (res) {
    var j = res.j || {};
    if (!res.ok || !Array.isArray(j.coins)) throw new Error("x");
    if (!j.coins.length) { tagsEl.innerHTML = ""; mcount.textContent = "The morgue is empty right now. Nothing listed recently could be read."; return; }
    var first = !Object.keys(shown).length, next = {};
    tagsEl.innerHTML = "";
    j.coins.forEach(function (c, i) { next[c.mint] = 1; tagsEl.appendChild(tag(c, i, first || !shown[c.mint])); });
    shown = next;
    var ct = j.counts || {};
    mcount.textContent = "Of " + (ct.total || j.coins.length) + " coins listed on DexScreener recently: " + (ct.dead || 0) + " dead, " + (ct.dying || 0) + " dying, " + (ct.alive || 0) + " alive. Checked " +
      new Date(j.t || Date.now()).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) + ".";
  }).catch(function () {
    if (!Object.keys(shown).length) { tagsEl.innerHTML = ""; mcount.textContent = "The morgue is closed right now. Market data couldn’t be reached."; }
  });
}
if (tagsEl) {
  skeleton();
  var mio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    if (es[0].isIntersecting) { mio.disconnect(); morgueFetch(); setInterval(morgueFetch, 60000); }
  }, { rootMargin: "400px 0px" }) : null;
  if (mio) mio.observe(tagsEl); else morgueFetch();
}

/* ---------- the toll canvas: routed trades pay, the toll burns, direct trades skip ---------- */
var tc = $(".toll canvas");
if (tc) (function () {
  var c = tc.getContext("2d"), W = 0, H = 0, dots = [], chips = [], sparks = [], on = false, acc = 0, spawn = 0, R = Math.random;
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, innerWidth < 600 ? 1.5 : 1.75);
    W = tc.clientWidth; H = tc.clientHeight; tc.width = W * dpr; tc.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size(); addEventListener("resize", function () { size(); draw(0); });
  var top = function () { return H * 0.25; }, low = function () { return H * 0.55; }, gx = function () { return W < 600 ? W * 0.72 : W * 0.56; }, pit = function () { return H * 0.86; };
  function label(t, x, y, col, al) { c.font = "700 11px 'Courier Prime', 'Courier New', monospace"; c.fillStyle = col; c.textAlign = al || "left"; c.fillText(t, x, y); }
  function add(x) { var routed = R() < 0.62; dots.push({ x: x == null ? -10 : x, lane: routed, v: 70 + R() * 50, r: 4 + R() * 3, paid: false }); }
  if (still) for (var i = 0; i < 14; i++) add(R() * W);
  function draw(dt) {
    c.clearRect(0, 0, W, H);
    c.strokeStyle = "rgba(22,20,18,.16)"; c.lineWidth = 1; c.setLineDash([6, 6]);
    [top(), low()].forEach(function (y) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); });
    c.setLineDash([]);
    var sm = W < 600;
    label(sm ? "DIRECT · NO TOLL" : "DIRECT ON PUMP · NO TOLL", 14, top() - 14, "#8f897d");
    label(sm ? "ROUTED · 0.5% TOLL" : "ROUTED THROUGH CTO · 0.5% TOLL", 14, low() - 14, "#161412");
    if (!sm) label("TO MARKET →", W - 14, low() - 14, "#8f897d", "right");
    var x = gx(), y = low();
    c.fillStyle = "#f7f4ec"; c.strokeStyle = "#14a854"; c.lineWidth = 3; c.fillRect(x - 26, y - 22, 52, 44); c.strokeRect(x - 26, y - 22, 52, 44);
    c.font = "900 16px Inter, system-ui, sans-serif"; c.fillStyle = "#14a854"; c.textAlign = "center"; c.fillText("cto", x, y + 6);
    var py = pit(), fl = 1 + Math.sin(performance.now() / 120) * 0.12;
    c.fillStyle = "#c98a12"; c.beginPath(); c.moveTo(x - 18, py + 12); c.quadraticCurveTo(x - 14, py - 16 * fl, x, py - 26 * fl); c.quadraticCurveTo(x + 14, py - 16 * fl, x + 18, py + 12); c.fill();
    c.fillStyle = "#c8372d"; c.beginPath(); c.moveTo(x - 10, py + 12); c.quadraticCurveTo(x - 7, py - 6 * fl, x, py - 14 * fl); c.quadraticCurveTo(x + 7, py - 6 * fl, x + 10, py + 12); c.fill();
    label("BUY + BURN", sm ? x - 30 : x + 30, py + 4, "#161412", sm ? "right" : "left");
    var s = dt / 1000;
    dots.forEach(function (d) {
      if (!still) d.x += d.v * s;
      var yy = d.lane ? low() : top();
      if (d.lane && !d.paid && d.x >= x) { d.paid = true; if (!still) chips.push({ x: x, y: y + 22, v: 0 }); }
      c.fillStyle = "#161412"; c.beginPath(); c.arc(d.x, yy, d.r, 0, 7); c.fill();
    });
    dots = dots.filter(function (d) { return d.x < W + 20; });
    chips.forEach(function (k) { k.v += 260 * s; k.y += k.v * s; c.fillStyle = "#14a854"; c.fillRect(k.x - 3, k.y - 3, 6, 6); if (k.y > py - 8) { k.done = true; for (var j = 0; j < 5; j++) sparks.push({ x: k.x, y: py - 10, vx: (R() - 0.5) * 60, vy: -40 - R() * 60, l: 1 }); } });
    chips = chips.filter(function (k) { return !k.done; });
    sparks.forEach(function (p) { p.x += p.vx * s; p.y += p.vy * s; p.vy += 90 * s; p.l -= 1.6 * s; c.fillStyle = "rgba(200,55,45," + Math.max(0, p.l).toFixed(2) + ")"; c.fillRect(p.x, p.y, 2.5, 2.5); });
    sparks = sparks.filter(function (p) { return p.l > 0; });
  }
  if (still) { setTimeout(function () { draw(0); }, 300); return; }
  var tio = "IntersectionObserver" in window ? new IntersectionObserver(function (es) { on = es[0].isIntersecting; }) : null;
  if (tio) tio.observe(tc); else on = true;
  onFrame(function (t, dt) {
    if (!on || document.hidden) return;
    acc += dt; if (acc < 33) return;
    var step = Math.min(acc, 80); acc = 0;
    spawn -= step; if (spawn <= 0) { add(); spawn = 380 + R() * 520; }
    draw(step);
  });
})();

/* ---------- pointer toys: ring cursor, card light + tilt, magnetic ripple buttons ---------- */
if (fine && !still) {
  var ring = el("div", "ring"); document.body.appendChild(ring);
  var mx = -100, my = -100, rx = -100, ry = -100;
  addEventListener("pointermove", function (e) {
    mx = e.clientX; my = e.clientY;
    var h = e.target.closest && e.target.closest("a,button,input,summary,.poster,.tag");
    ring.classList.toggle("big", !!h);
  }, { passive: true });
  onFrame(function () { rx += (mx - rx) * 0.2; ry += (my - ry) * 0.2; ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px)"; });
  $$(".step").forEach(function (s) {
    s.addEventListener("pointermove", function (e) {
      var r = s.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      s.style.setProperty("--gx", (px * 100).toFixed(1) + "%"); s.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      s.style.transform = "perspective(800px) rotateX(" + ((0.5 - py) * 7).toFixed(2) + "deg) rotateY(" + ((px - 0.5) * 7).toFixed(2) + "deg) translateY(-3px)";
    });
    s.addEventListener("pointerleave", function () { s.style.transform = ""; });
  });
  $$(".btn").forEach(function (b) {
    b.addEventListener("pointermove", function (e) {
      if (b.disabled) return;
      var r = b.getBoundingClientRect();
      b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + "px)";
    });
    b.addEventListener("pointerleave", function () { b.style.transform = ""; });
  });
}
document.addEventListener("pointerdown", function (e) {
  var b = e.target.closest && e.target.closest(".btn");
  if (!b || b.disabled || still) return;
  var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2, s = el("span", "rip");
  s.style.width = s.style.height = d + "px"; s.style.left = (e.clientX - r.left - d / 2) + "px"; s.style.top = (e.clientY - r.top - d / 2) + "px";
  b.appendChild(s); setTimeout(function () { s.remove(); }, 650);
});
})();
