import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('db.json', 'utf8'));
const txs = Object.values(data.transactions || {});
console.log("Total txs:", txs.length);
console.log("Txs with gameDetails:", txs.filter(t => t.gameDetails).length);
