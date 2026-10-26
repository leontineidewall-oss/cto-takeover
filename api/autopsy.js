// what's left of a coin: market (DexScreener), holders (RPC), and its dev (pump.fun + RPC)
const { B58, rpc, get, send, env } = require("./_lib");
const { build } = require("./_autopsy");
const soft = p => p.then(v => v, () => null);
module.exports = async (req, res) => {
  const mint = String((req.query || {}).mint || "").trim();
  if (!B58.test(mint)) return send(res, 400, { error: "not a solana token address" });
  try {
    const [pairs, supply, largest, pump] = await Promise.all([
      soft(get((env("DEX_BASE") || "https://api.dexscreener.com") + "/token-pairs/v1/solana/" + mint)),
      soft(rpc("getTokenSupply", [mint])),
      soft(rpc("getTokenLargestAccounts", [mint])),
      soft(get((env("PUMP_BASE") || "https://frontend-api-v3.pump.fun") + "/coins/" + mint)),
    ]);
    if (!supply && !pairs && !pump) return send(res, 502, { error: "couldn't reach Solana or market data right now" });
    let devBal = null, devLast = null;
    const creator = pump && typeof pump.creator === "string" && B58.test(pump.creator) ? pump.creator : null;
    if (creator) {
      const [accs, sigs] = await Promise.all([
        soft(rpc("getTokenAccountsByOwner", [creator, { mint }, { encoding: "jsonParsed" }])),
        soft(rpc("getSignaturesForAddress", [creator, { limit: 1 }])),
      ]);
      if (accs && Array.isArray(accs.value)) devBal = accs.value.reduce((a, x) => a + (((((x.account || {}).data || {}).parsed || {}).info || {}).tokenAmount || {}).uiAmount || 0, 0);
      if (Array.isArray(sigs) && sigs[0]) devLast = sigs[0].blockTime || null;
    }
    send(res, 200, build({ mint, pairs, supply, largest, pump: creator ? pump : (pump && pump.mint ? pump : null), devBal, devLast, now: Date.now() }), 30);
  } catch (e) { send(res, 502, { error: "couldn't reach Solana or market data right now" }); }
};
