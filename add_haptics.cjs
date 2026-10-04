const fs = require('fs');
let code = fs.readFileSync('src/screens/TradeScreen.tsx', 'utf8');

if (!code.includes("triggerHaptic")) {
  code = code.replace("import { motion, AnimatePresence } from 'motion/react';", "import { motion, AnimatePresence } from 'motion/react';\nimport { triggerHaptic } from '../utils/haptics';");
  
  // Add haptics to handleTrade
  code = code.replace("const handleTrade = (type: 'CALL' | 'PUT') => {", "const handleTrade = (type: 'CALL' | 'PUT') => {\n    triggerHaptic('heavy');");

  // Add haptics to amount changes
  code = code.replace("const changeAmount = (delta: number) => {", "const changeAmount = (delta: number) => {\n    triggerHaptic('light');");

  // Set amounts direct
  code = code.replace("onClick={() => setAmount(val)}", "onClick={() => { triggerHaptic('light'); setAmount(val); }}");

  fs.writeFileSync('src/screens/TradeScreen.tsx', code);
  console.log("Haptics added to TradeScreen");
}
