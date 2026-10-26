// the morgue: coins recently listed on DexScreener and their condition right now (same rules as the autopsy)
const { B58, get, send, env } = require("./_lib");
const { status, bestPair } = require("./_autopsy");
const n = v => (typeof v === "number" && isFinite(v) ? v : v != null && v !== "" && isFinite(+v) ? +v : null);
const clip = s => (typeof s === "string" ? s.replace(/[\u0000-\u001f]/g, "").trim().slice(0, 40) : null);
const RANK = { dead: 0, dying: 1, alive: 2, unknown: 3 };
let last = null;
function shape(mints, pairs, now) {
  const list = [];
  for (const m of mints) {
    const p = bestPair(pairs, m);
    if (!p) continue;
    const vol24 = n((p.volume || {}).h24), mcap = n(p.marketCap != null ? p.marketCap : p.fdv);
    const tx = (p.txns || {}).h24 || {}, trades24 = (n(tx.buys) || 0) + (n(tx.sells) || 0);
    const st = status({ vol24, mcap, trades24 });
    const c = n(p.pairCreatedAt);
    list.push({ mint: m, name: clip(p.baseToken.name), symbol: clip(p.baseToken.symbol), mcap, vol24, trades24, created: c ? Math.round(c > 1e12 ? c / 1000 : c) : null, status: st.code });
  }
  const counts = { total: list.length, dead: 0, dying: 0, alive: 0, unknown: 0 };
  list.forEach(c => { counts[c.status]++; });
  list.sort((a, b) => RANK[a.status] - RANK[b.status] || (a.vol24 || 0) - (b.vol24 || 0));
  return { t: now, coins: list.slice(0, 12), counts };
}
module.exports = async (req, res) => {
  const base = env("DEX_BASE") || "https://api.dexscreener.com";
  try {
    const [a, b] = await Promise.all([
      get(base + "/token-profiles/latest/v1").catch(() => []),
      get(base + "/token-boosts/latest/v1").catch(() => []),
    ]);
    const seen = new Set(), mints = [];
    for (const x of [].concat(Array.isArray(a) ? a : [], Array.isArray(b) ? b : [])) {
      if (x && x.chainId === "solana" && typeof x.tokenAddress === "string" && B58.test(x.tokenAddress) && !seen.has(x.tokenAddress)) { seen.add(x.tokenAddress); mints.push(x.tokenAddress); }
    }
    const pick = mints.slice(0, 60);
    if (!pick.length) throw new Error("no listings");
    const groups = [pick.slice(0, 30), pick.slice(30, 60)].filter(g => g.length);
    const got = await Promise.all(groups.map(g => get(base + "/tokens/v1/solana/" + g.join(",")).catch(() => null)));
    if (got.every(g => g == null)) throw new Error("no pairs");
    const pairs = [].concat(...got.map(g => (Array.isArray(g) ? g : [])));
    const out = shape(pick, pairs, Date.now());
    if (out.coins.length) last = out;
    send(res, 200, out, 60);
  } catch (e) {
    if (last) return send(res, 200, last, 20);
    send(res, 502, { error: "market data unavailable right now" });
  }
};
module.exports.shape = shape;
