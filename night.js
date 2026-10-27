/* cto at night: mist and motes in the room, a beam of light on the poster, a ring that turns behind it, a spirit trail on the cursor */
(function () {
"use strict";
var $ = function (s) { return document.querySelector(s); };
var root = document.documentElement;
var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* the headline's last word goes ghostly */
var h1 = $(".hero h1");
if (h1) {
  var last = h1.lastChild;
  if (last && last.nodeType === 3 && /gone\./.test(last.textContent)) {
    var before = last.textContent.replace(/gone\.\s*$/, "");
    var em = el("em", "ghost"); em.textContent = "gone.";
    h1.replaceChild(document.createTextNode(before), last); h1.appendChild(em);
  }
}

/* the ring behind the poster: two circles of words turning opposite ways */
var board = $(".hero .board");
if (board) {
  var ring = function (r, txt, size, sp) {
    return '<svg viewBox="0 0 400 400" aria-hidden="true"><defs><path id="' + txt.id + '" d="M200 200m-' + r + ' 0a' + r + ' ' + r + ' 0 1 1 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 1 -' + (2 * r) + ' 0"/></defs>' +
      '<circle cx="200" cy="200" r="' + (r + 14) + '" fill="none" stroke="#46f29b" stroke-width=".8" stroke-dasharray="2 6"/>' +
      '<circle cx="200" cy="200" r="' + (r - 12) + '" fill="none" stroke="#46f29b" stroke-width=".5"/>' +
      '<text fill="#46f29b" font-family="Courier Prime,Courier New,monospace" font-weight="700" font-size="' + size + '" letter-spacing="' + sp + '"><textPath href="#' + txt.id + '">' + txt.t + '</textPath></text></svg>';
  };
  var sig = el("div", "sigil");
  sig.setAttribute("aria-hidden", "true");
  sig.innerHTML = ring(176, { id: "sg1", t: "IN MEMORY OF THE DEV ✦ THE HOLDERS KEEP THE WATCH ✦ IN MEMORY OF THE DEV ✦ THE HOLDERS KEEP THE WATCH ✦" }, 11, 3.2) +
    '<div class="back">' + ring(130, { id: "sg2", t: "✦ COMMUNITY TAKEOVER ✦ COMMUNITY TAKEOVER ✦ COMMUNITY TAKEOVER ✦ COMMUNITY TAKEOVER" }, 9, 2.6) + "</div>";
  board.insertBefore(sig, board.firstChild);
  // a cold beam of light falls on the poster
  var beam = el("div", "beam"); beam.setAttribute("aria-hidden", "true");
  board.insertBefore(beam, board.firstChild);
}

/* the light breathes: clouds pass over it now and then */
if (!still) {
  (function tick(t) {
    var v = 0.5 + 0.35 * Math.sin(t / 2300) + 0.15 * Math.sin(t / 830);
    root.style.setProperty("--flick", v.toFixed(3));
    setTimeout(function () { requestAnimationFrame(tick); }, 60);
  })(0);
}

/* the headline comes out of the mist, word by word */
if (h1 && !still) {
  var wi = 0;
  Array.prototype.slice.call(h1.childNodes).forEach(function (n) {
    if (n.nodeType === 3) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var sp = el("span", "mw"); sp.textContent = p; sp.style.setProperty("--i", wi++); frag.appendChild(sp);
      });
      h1.replaceChild(frag, n);
    } else if (n.nodeType === 1 && n.tagName === "EM") {
      var wrap = el("span", "mw"); wrap.style.setProperty("--i", wi++); h1.replaceChild(wrap, n); wrap.appendChild(n);
    }
  });
}

/* a spirit trail follows the mouse */
if (fine && !still) {
  var tr = el("canvas"); tr.className = "trail"; tr.setAttribute("aria-hidden", "true"); document.body.appendChild(tr);
  var tx2 = tr.getContext("2d"), parts = [], live = false, tw2 = 0, th2 = 0, lastP = 0;
  var tsize = function () { tw2 = tr.width = innerWidth; th2 = tr.height = innerHeight; };
  tsize(); addEventListener("resize", tsize);
  addEventListener("pointermove", function (e) {
    var now = performance.now(); if (now - lastP < 24) return; lastP = now;
    if (parts.length < 70) parts.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - 0.5) * 0.4, vy: -0.25 - Math.random() * 0.5, l: 1, r: 1 + Math.random() * 2.2 });
    if (!live) { live = true; requestAnimationFrame(trail); }
  }, { passive: true });
  var trail = function () {
    tx2.clearRect(0, 0, tw2, th2);
    parts.forEach(function (p) {
      p.x += p.vx; p.y += p.vy; p.l -= 0.022;
      var g = tx2.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
      g.addColorStop(0, "rgba(160,255,210," + (0.5 * p.l).toFixed(3) + ")"); g.addColorStop(1, "rgba(70,242,155,0)");
      tx2.fillStyle = g; tx2.fillRect(p.x - p.r * 5, p.y - p.r * 5, p.r * 10, p.r * 10);
    });
    parts = parts.filter(function (p) { return p.l > 0; });
    if (parts.length) requestAnimationFrame(trail); else { live = false; tx2.clearRect(0, 0, tw2, th2); }
  };
}

/* the lantern: a soft light that follows the mouse */
if (fine && !still) {
  var lan = el("div", "lantern"); document.body.appendChild(lan);
  var lx = innerWidth / 2, ly = innerHeight * 0.4, tx = lx, ty = ly;
  addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function follow() { lx += (tx - lx) * 0.12; ly += (ty - ly) * 0.12; lan.style.setProperty("--mx", lx.toFixed(0) + "px"); lan.style.setProperty("--my", ly.toFixed(0) + "px"); requestAnimationFrame(follow); })();
}

/* the room: slow mist, embers rising, green wisps that wander */
var cv = el("canvas"); cv.id = "mist"; cv.setAttribute("aria-hidden", "true");
document.body.insertBefore(cv, document.body.firstChild);
var x = cv.getContext("2d"), W = 0, H = 0, S = 0.5, fog = [], motes = [], R = Math.random;
function size() { W = Math.ceil(innerWidth * S); H = Math.ceil(innerHeight * S); cv.width = W; cv.height = H; }
size(); addEventListener("resize", size);
var small = innerWidth < 700;
for (var i = 0; i < (small ? 4 : 7); i++) fog.push({ x: R(), y: 0.35 + R() * 0.7, r: 0.35 + R() * 0.4, v: (R() - 0.5) * 0.012, a: 0.03 + R() * 0.035, g: R() < 0.35 });
function mote(fresh) {
  var wisp = R() < 0.22;
  return { x: R(), y: fresh ? 1.05 : R(), v: wisp ? 0.006 + R() * 0.01 : 0.012 + R() * 0.03, s: wisp ? 1.6 + R() * 1.6 : 0.6 + R() * 1.1, ph: R() * 6.28, w: wisp, sw: 0.02 + R() * 0.04 };
}
for (i = 0; i < (small ? 26 : 54); i++) motes.push(mote(false));
var stars = [];
for (i = 0; i < (small ? 30 : 70); i++) stars.push({ x: R(), y: R() * 0.75, s: R() < 0.15 ? 1.4 : 0.8, ph: R() * 6.28, sp: 0.4 + R() * 1.2 });
var lastT = 0, acc = 0;
function draw(dt) {
  var s = dt / 1000, par = (scrollY || 0) * 0.04 * S;
  x.clearRect(0, 0, W, H);
  fog.forEach(function (b) {
    b.x += b.v * s; if (b.x < -0.5) b.x = 1.5; if (b.x > 1.5) b.x = -0.5;
    var cx = b.x * W, cy = b.y * H - par, rr = b.r * Math.max(W, H);
    var gr = x.createRadialGradient(cx, cy, 0, cx, cy, rr);
    gr.addColorStop(0, b.g ? "rgba(70,242,155," + (b.a * 0.7).toFixed(3) + ")" : "rgba(220,214,200," + b.a.toFixed(3) + ")");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
  });
  var t = performance.now() / 1000;
  stars.forEach(function (st) { var tw = 0.25 + 0.75 * Math.abs(Math.sin(t * st.sp + st.ph)); x.fillStyle = "rgba(238,229,209," + (0.35 * tw).toFixed(3) + ")"; x.fillRect(st.x * W, st.y * H - par * 0.3, st.s, st.s); });
  motes.forEach(function (m, k) {
    m.y -= m.v * s; m.x += Math.sin(t * 0.6 + m.ph) * m.sw * s * 0.5;
    if (m.y < -0.05) motes[k] = m = mote(true);
    var px = m.x * W, py = m.y * H - par * 0.5, tw = 0.45 + 0.55 * Math.abs(Math.sin(t * (m.w ? 0.8 : 2.2) + m.ph));
    if (m.w) {
      var g = x.createRadialGradient(px, py, 0, px, py, m.s * 6);
      g.addColorStop(0, "rgba(140,255,200," + (0.55 * tw).toFixed(3) + ")"); g.addColorStop(1, "rgba(70,242,155,0)");
      x.fillStyle = g; x.fillRect(px - m.s * 6, py - m.s * 6, m.s * 12, m.s * 12);
    } else {
      x.fillStyle = "rgba(255," + (170 + Math.round(tw * 60)) + ",110," + (0.7 * tw).toFixed(3) + ")";
      x.fillRect(px, py, m.s, m.s);
    }
  });
}
if (still) { draw(0); return; }
(function loop(t) {
  var dt = lastT ? t - lastT : 16; lastT = t; acc += dt;
  if (!document.hidden && acc >= 40) { draw(Math.min(acc, 100)); acc = 0; }
  requestAnimationFrame(loop);
})(0);
})();
