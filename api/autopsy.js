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
    let devBal = null, devLast = null, info = pump && pump.mint ? pump : null;
    let creator = pump && typeof pump.creator === "string" && B58.test(pump.creator) ? pump.creator : null;
    if (!creator && supply) {
      // fallback: the fee payer of the mint's first transaction (works for small/dead coins)
      const first = await soft(rpc("getSignaturesForAddress", [mint, { limit: 1000 }]));
      if (Array.isArray(first) && first.length && first.length < 1000) {
        const s0 = first[first.length - 1];
        const tx = await soft(rpc("getTransaction", [s0.signature, { encoding: "json", maxSupportedTransactionVersion: 0 }]));
        const keys = tx && tx.transaction && tx.transaction.message && tx.transaction.message.accountKeys;
        if (Array.isArray(keys) && typeof keys[0] === "string" && B58.test(keys[0])) {
          creator = keys[0];
          info = Object.assign({}, info || {}, { creator, created_timestamp: (info && info.created_timestamp) || (s0.blockTime ? s0.blockTime * 1000 : null) });
        }
      }
    }
    if (creator && info && !info.creator) info = Object.assign({}, info, { creator });
    if (creator) {
      const [accs, sigs] = await Promise.all([
        soft(rpc("getTokenAccountsByOwner", [creator, { mint }, { encoding: "jsonParsed" }])),
        soft(rpc("getSignaturesForAddress", [creator, { limit: 1 }])),
      ]);
      if (accs && Array.isArray(accs.value)) devBal = accs.value.reduce((a, x) => a + (((((x.account || {}).data || {}).parsed || {}).info || {}).tokenAmount || {}).uiAmount || 0, 0);
      if (Array.isArray(sigs) && sigs[0]) devLast = sigs[0].blockTime || null;
    }
    send(res, 200, Object.assign(build({ mint, pairs, supply, largest, pump: creator ? (info || { creator }) : info, devBal, devLast, now: Date.now() }), { chain: !!supply }), 30);
  } catch (e) { send(res, 502, { error: "couldn't reach Solana or market data right now" }); }
};
