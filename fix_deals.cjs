const fs = require('fs');
let code = fs.readFileSync('src/screens/DealsScreen.tsx', 'utf8');

if (!code.includes("import { motion }")) {
    code = code.replace("import { TrendingUp, TrendingDown, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react';", "import { TrendingUp, TrendingDown, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react';\nimport { motion, AnimatePresence } from 'motion/react';");
    
    code = code.replace(
        "className=\"bg-white rounded-2xl p-4 shadow-xs border border-gray-100\"",
        "className=\"bg-white rounded-2xl p-4 shadow-xs border border-gray-100\"\n                  initial={{ opacity: 0, y: 10 }}\n                  animate={{ opacity: 1, y: 0 }}\n                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}\n                  layout"
    );

    code = code.replace(
        "<div key={trade.id}",
        "<motion.div key={trade.id}"
    );

    code = code.replace(
        "            </div>\n          ))",
        "            </motion.div>\n          ))"
    );

    fs.writeFileSync('src/screens/DealsScreen.tsx', code);
    console.log("Upgraded DealsScreen");
}
