// pure: turn public data about a coin into an autopsy (shared by api/autopsy.js and the tests)
const n = v => (typeof v === "number" && isFinite(v) ? v : v != null && v !== "" && isFinite(+v) ? +v : null);
function bestPair(pairs, mint) {
  const ps = (Array.isArray(pairs) ? pairs : []).filter(p => p && p.baseToken && p.baseToken.address === mint);
  ps.sort((a, b) => ((b.liquidity || {}).usd || 0) - ((a.liquidity || {}).usd || 0));
  return ps[0] || null;
}
function status(m) {
  // m: { vol24, liq, mcap, trades24, devPct }
  if (m.vol24 == null && m.mcap == null) return { code: "unknown", word: "No market", why: "No trading pair found for this coin." };
  const vol = m.vol24 || 0, tr = m.trades24 || 0;
  if (vol < 100 || tr < 10) return { code: "dead", word: "Dead", why: "Under $100 traded and under 10 trades in 24h." };
  if (vol < 5000 || (m.mcap != null && m.mcap < 10000)) return { code: "dying", word: "Dying", why: "Some trading, but under $5K volume or $10K market cap." };
  return { code: "alive", word: "Alive", why: "Real volume in the last 24h." };
}
function build({ mint, pairs, supply, largest, pump, devBal, devLast, now }) {
  const p = bestPair(pairs, mint);
  const sup = supply && supply.value ? n(supply.value.uiAmount) : null;
  const top = Array.isArray(largest && largest.value) ? largest.value.slice(0, 10).reduce((a, x) => a + (n(x.uiAmount) || 0), 0) : null;
  const creator = pump && typeof pump.creator === "string" ? pump.creator : null;
  const devPct = creator && sup && devBal != null ? (devBal / sup) * 100 : null;
  const m = {
    vol24: p ? n((p.volume || {}).h24) : null, liq: p ? n((p.liquidity || {}).usd) : null,
    mcap: p ? n(p.marketCap != null ? p.marketCap : p.fdv) : (pump ? n(pump.usd_market_cap) : null),
    trades24: p ? (n(((p.txns || {}).h24 || {}).buys) || 0) + (n(((p.txns || {}).h24 || {}).sells) || 0) : null, devPct,
  };
  const st = status(m);
  const devLeft = creator ? (devPct != null && devPct < 0.01) : null;
  const created = n(pump && pump.created_timestamp) || (p ? n(p.pairCreatedAt) : null);
  return {
    mint, t: now,
    name: (p && p.baseToken.name) || (pump && pump.name) || null,
    symbol: (p && p.baseToken.symbol) || (pump && pump.symbol) || null,
    image: (p && p.info && typeof p.info.imageUrl === "string" && /^https:\/\//.test(p.info.imageUrl) ? p.info.imageUrl : null) || (pump && typeof pump.image_uri === "string" && /^https:\/\//.test(pump.image_uri) ? pump.image_uri : null),
    price: p ? n(p.priceUsd) : null, mcap: m.mcap, vol24: m.vol24, liq: m.liq, trades24: m.trades24,
    change24: p ? n((p.priceChange || {}).h24) : null, dex: p ? p.dexId || null : null,
    created: created ? (created > 1e12 ? Math.round(created / 1000) : created) : null,
    graduated: pump && typeof pump.complete === "boolean" ? pump.complete : null,
    top10: top != null && sup ? Math.min(100, (top / sup) * 100) : null,
    dev: creator, devPct, devLast: n(devLast), devLeft, status: st,
  };
}
module.exports = { build, status, bestPair };
