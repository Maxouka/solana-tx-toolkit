# GM 👋

# Solana TX Toolkit

**Monorepo full-stack Solana** — Rust, TypeScript, React, Anchor — built by someone who's been in the trenches, not just reading the docs.

[![Live Demo](https://img.shields.io/badge/DEMO-Voir_le_Dashboard-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://maxouka.github.io/solana-tx-toolkit/dashboard/)

<p align="center">
  <img src="akrwk8.jpg" width="280" />
  <img src="milady44444.webp" width="180" />
</p>

---

## Pour les recruteurs

Le dashboard interactif est deploye ici :

### https://maxouka.github.io/solana-tx-toolkit/dashboard/

Ouvrez-le et cliquez sur l'onglet **"Pourquoi Moi"** dans la sidebar. Chaque carte associe une competence requise du poste a du code fonctionnel que vous pouvez explorer directement depuis le dashboard ou sur ce repo.

| Exigence du poste | Ou le voir |
|---|---|
| Rust backend | [`crates/tx-optimizer/src/`](crates/tx-optimizer/src/) — async Tokio, retry logic, error handling |
| Transactions Solana | Onglet **Priority Fees** — estimation par percentiles, compute budget |
| SDKs (web3.js, Jupiter, SPL, Jito) | Onglet **Swap Router** — routes Jupiter V6, bundles Jito |
| Programmes On-Chain (Anchor) | [`programs/tx-vault/src/lib.rs`](programs/tx-vault/src/lib.rs) — PDAs, CPI, events |
| Dashboard React | Le dashboard lui-meme — Vite + React 18 + Tailwind + Recharts |
| PostgreSQL | Schema concu pour historique tx et logs (architecture documentee) |
| Workflow Git | [Historique de commits](https://github.com/Maxouka/solana-tx-toolkit/commits/master) — monorepo propre, conventional commits |

---

## Degen Credentials

Not my first cycle. Je connais la diff entre un rug et un rebase, je sais ce qu'est un MEV sandwich, et j'ai deja mass-claim des airdrops a 3h du mat. Ce toolkit n'est pas un exercice scolaire — c'est construit par quelqu'un qui utilise Phantom/Backpack au quotidien, qui a bridgé sur Wormhole quand ca coutait encore 0 fees, et qui sait que Jito tips c'est pas optionnel si tu veux land un bundle.

- 🫡 WAGMI
- 🧠 Priority fees > pray and spray
- 🐸 If you know, you know

---

## Architecture

```
solana-tx-toolkit/
├── dashboard/               React 18 + Vite + TailwindCSS + Recharts
├── crates/tx-optimizer/     Rust : priority fees, Jito bundles, CLI
├── programs/tx-vault/       Anchor : vault on-chain avec PDAs et CPI
├── ts/                      TypeScript SDK : Jupiter V6, monitoring
└── examples/                Exemples d'utilisation Rust + TS
```

## Stack technique

Rust · TypeScript · React · Solana · Anchor · Jupiter · Jito · Vite · TailwindCSS · Recharts

## Lancer en local

```bash
# Dashboard
cd dashboard && npm install && npm run dev

# Rust CLI
cargo build --release
cargo run -- estimate-fee --strategy fast

# TypeScript SDK
cd ts && npm install
npx tsx ../examples/optimize-swap.ts
```

## License

MIT
