const fs = require('fs');
let code = fs.readFileSync('src/screens/NewsScreen.tsx', 'utf8');

if (!code.includes("import { motion }")) {
    code = code.replace("import { TrendingUp, TrendingDown, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react';", "import { TrendingUp, TrendingDown, Clock, Activity, CheckCircle2, XCircle } from 'lucide-react';\nimport { motion } from 'motion/react';");
    
    // Add motion if needed, actually maybe skip News Screen if it's fine.
    console.log("Upgraded NewsScreen");
}
