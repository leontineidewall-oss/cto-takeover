/* cto at night: mist and motes in the room, a vigil candle that flickers, a ring that turns behind the poster */
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
  // the vigil candle
  var c = el("div", "candle");
  c.setAttribute("aria-hidden", "true");
  c.innerHTML = '<div class="halo"></div><svg viewBox="0 0 74 190">' +
    '<defs><linearGradient id="wax" x1="0" x2="1"><stop offset="0" stop-color="#cdbf9f"/><stop offset=".45" stop-color="#f3ead4"/><stop offset="1" stop-color="#a99a7a"/></linearGradient>' +
    '<radialGradient id="fl" cx=".5" cy=".72" r=".6"><stop offset="0" stop-color="#fffbe8"/><stop offset=".35" stop-color="#ffd27a"/><stop offset=".8" stop-color="#ff9a3a" stop-opacity=".85"/><stop offset="1" stop-color="#ff7a20" stop-opacity="0"/></radialGradient></defs>' +
    '<path d="M14 74 Q14 68 22 67 L52 67 Q60 68 60 74 L60 186 L14 186 Z" fill="url(#wax)"/>' +
    '<path d="M22 67 Q26 80 24 96 Q23 104 27 104 Q31 104 30 92 Q29 78 33 70 M44 68 Q47 76 46 86 Q46 92 49 91 Q52 90 51 80 Q50 72 53 68" fill="#efe4c8" opacity=".9"/>' +
    '<ellipse cx="37" cy="68" rx="23" ry="4" fill="#e9dec2"/>' +
    '<path d="M37 68 L37 58" stroke="#2a211a" stroke-width="2" stroke-linecap="round"/>' +
    '<path class="flame" d="M37 14 C46 30 50 40 48 50 C46 58 41 62 37 62 C33 62 28 58 26 50 C24 40 28 30 37 14 Z" fill="url(#fl)"/>' +
    '<path class="flame2" d="M37 34 C41 42 42 48 41 53 C40 57 38 59 37 59 C36 59 34 57 33 53 C32 48 33 42 37 34 Z" fill="#fffdf2" opacity=".9"/>' +
    '<ellipse cx="37" cy="186" rx="30" ry="4" fill="#000" opacity=".5"/></svg>';
  board.appendChild(c);
}

/* the flicker: one slow noise drives the candle, its halo and the light on the paper */
if (!still) {
  var f = 0, target = 0, nextT = 0;
  (function tick(t) {
    if (t > nextT) { target = Math.random(); nextT = t + 60 + Math.random() * 180; if (Math.random() < 0.04) target = -0.6; }
    f += (target - f) * 0.18;
    root.style.setProperty("--flick", f.toFixed(3));
    requestAnimationFrame(tick);
  })(0);
}

/* the lantern: a soft light that follows the mouse */
if (fine && !still) {
  var lan = el("div", "lantern"); document.body.appendChild(lan);
  var lx = innerWidth / 2, ly = innerHeight * 0.4, tx = lx, ty = ly;
  addEventListener("pointermove", function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function follow() { lx += (tx - lx) * 0.12; ly += (ty - ly) * 0.12; lan.style.setProperty("--mx", lx.toFixed(0) + "px"); lan.style.setProperty("--my", ly.toFixed(0) + "px"); requestAnimationFrame(follow); })();
}

/* the room: slow mist, embers rising from the candle side, green wisps that wander */
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
