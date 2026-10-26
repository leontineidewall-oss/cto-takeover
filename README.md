# cto

Community takeover for dead coins. Paste any Solana coin, run the autopsy (market, holders, the dev), print the MISSING poster.

- index.html: the site (single file)
- api/autopsy.js: public-data autopsy (DexScreener, Solana RPC, pump.fun creator)
- api/market.js, api/config.js: $CTO stats once the contract is posted

## Env (set in Vercel)

- CTO_MINT: the $CTO contract address. Until set, the site shows dashes.
- RPC_URL (optional): a Solana RPC endpoint. Defaults to the public mainnet RPC.
