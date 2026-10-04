const API = 'http://localhost:3000';

async function test() {
  // 1. Update balance (bet)
  const betRes = await fetch(`${API}/api/update_balance`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({userId: 'tnxjatavji@gmail.com', betAmount: 10, winAmount: 0})
  });
  const betData = await betRes.json();
  console.log("Bet Response:", betData);

  const txId = betData.placedBetTxId;
  console.log("TxId:", txId);

  // 2. Update game details
  const updateRes = await fetch(`${API}/api/update_game_details`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      userId: 'tnxjatavji@gmail.com',
      txId: txId,
      gameDetails: {
        isWin: true,
        betAmount: 10,
        winAmount: 20,
        mineCount: 3,
        revealedCount: 5,
        multiplier: '2.00',
        mineLocations: [1,2,3],
        revealedCells: [4,5,6]
      }
    })
  });
  const updateData = await updateRes.json();
  console.log("Update Response:", updateData);
}

test().catch(console.error);
